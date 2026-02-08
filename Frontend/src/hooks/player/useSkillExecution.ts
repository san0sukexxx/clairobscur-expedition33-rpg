import { useCallback, useRef } from "react";
import { t } from "../../i18n";
import { APIBattle } from "../../api/APIBattle";
import type { BattleCharacterInfo } from "../../api/ResponseModel";
import { SkillEffectsRegistry } from "../../data/SkillEffectsRegistry";
import { rollWithTimeout } from "../../utils/RollUtils";
import { rollCommandForAttack } from "../../utils/PlayerCalculator";
import { resolveSkill, getStatusStacks } from "../../utils/BattleSkillUtils";
import { hasStatus } from "../../utils/NpcCalculator";
import { diceTotal } from "../../utils/DiceCalculator";

import type { UseSkillExecutionParams } from "./skillExecution/types";
import { validateSkillExecution } from "./skillExecution/validation";
import {
  determineSkillElement,
  calculateHitDamage,
  applyElementModifier,
  calculateFinalDamage,
  calculateChargeIncrease,
  logElementConfiguration,
  logElementVsNpc
} from "./skillExecution/damage";
import {
  buildNpcAttackRequest,
  buildPlayerAttackRequest
} from "./skillExecution/attackRequest";
import {
  handleConditionalHealWithRoll,
  handleUtilitySkill
} from "./skillExecution/postAttackEffects";

export function useSkillExecution({
  player,
  weaponInfo,
  diceBoardRef,
  timeoutDiceBoardRef,
  showToast,
  setTab,
  setCombatTab,
  setIsUsingSkillMode,
  setPendingSkillId,
  setIsSelectingSkillTarget,
  setExcludeSelfFromTargeting,
  setIsExecutingSkill,
  setHitCharacters,
  checkPlayerLoop
}: UseSkillExecutionParams) {
  const isExecutingSkillRef = useRef(false);
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  const handleExecuteSkill = useCallback(async (skillId: string, target: BattleCharacterInfo) => {
    if (!player?.fightInfo) return;
    if (isExecutingSkillRef.current) return;
    isExecutingSkillRef.current = true;

    try {
      // Validate skill execution
      const validation = validateSkillExecution(player, skillId);
      if (!validation.valid) {
        showToastRef.current(t(validation.error!, {
          required: validation.skillCost,
          available: validation.source?.magicPoints ?? 0
        }));
        resetState();
        return;
      }

      const { source, skillCost, isGradientSkill } = validation;
      const resolved = resolveSkill(skillId, source!, target, player.fightInfo?.characters ?? []);
      const actualHitCount = resolved.hitCount;

      if (actualHitCount > 0) {
        setIsExecutingSkill(true);
        await executeAttackHits(skillId, source!, target, resolved, skillCost!, isGradientSkill!, actualHitCount);
      } else {
        const skillMetadata = SkillEffectsRegistry[skillId];
        await handleUtilitySkill({
          source: source!,
          target,
          player,
          allCharacters: player.fightInfo?.characters ?? [],
          resolved,
          metadata: skillMetadata,
          skillCost: skillCost!,
          isGradientSkill: isGradientSkill!,
          diceBoardRef,
          timeoutDiceBoardRef,
          showToast: showToastRef.current
        });
      }

      resetState();
    } catch (error) {
      console.error("Erro ao usar skill:", error);
      showToastRef.current(t("playerPage.errors.errorUsingSkill"));
      resetState();
    }

    function resetState() {
      setPendingSkillId(null);
      setIsSelectingSkillTarget(false);
      setIsExecutingSkill(false);
      isExecutingSkillRef.current = false;
      setExcludeSelfFromTargeting(false);
    }
  }, [player, weaponInfo, diceBoardRef, timeoutDiceBoardRef, checkPlayerLoop,
      setPendingSkillId, setIsSelectingSkillTarget, setExcludeSelfFromTargeting,
      setIsExecutingSkill, setHitCharacters]);

  async function executeAttackHits(
    skillId: string,
    source: BattleCharacterInfo,
    target: BattleCharacterInfo,
    resolved: any,
    skillCost: number,
    isGradientSkill: boolean,
    actualHitCount: number
  ) {
    let hitIndex = 0;

    // Determine element
    const weaponElement = weaponInfo?.details?.attributes?.element;
    const skillElement = determineSkillElement(resolved, weaponInfo);
    logElementConfiguration(skillId, resolved, weaponElement, skillElement);

    // Calculate charge bonus (Overcharge: +1 damage per charge)
    let chargeBonus = 0;
    const shouldConsumeCharge = resolved.metadata.consumesCharge === true;
    if (resolved.metadata.damageScalesWithCharge) {
      chargeBonus = source.chargePoints ?? 0;
      if (chargeBonus > 0) {
        showToastRef.current(`Cargas: ${chargeBonus} (Dano +${chargeBonus})`);
      }
    }

    // Calculate hits received bonus (Revenge, Payback: +2 damage per hit received)
    let hitsReceivedBonus = 0;
    if (resolved.metadata.damageScalesWithHitsReceived) {
      const hitsReceived = source.hitsReceivedThisTurn ?? 0;
      hitsReceivedBonus = hitsReceived * 2;  // +2 damage per hit taken
      if (hitsReceivedBonus > 0) {
        showToastRef.current(t("playerPage.skills.hitsReceivedBonus", { hits: hitsReceived, bonus: hitsReceivedBonus }));
      }
    }

    // Execute hits
    while (hitIndex < actualHitCount) {
      await new Promise<void>((resolvePromise) => {
        rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, rollCommandForAttack(weaponInfo, "basic"), async (result) => {
          let { baseDamage, hasCritical } = calculateHitDamage(result, player, weaponInfo, resolved);
          const chargeIncrease = calculateChargeIncrease(resolved, hasCritical);

          // Double critical damage (Sword Ballet: 4x instead of 2x)
          if (hasCritical && resolved.metadata.doubleCritDamage) {
            baseDamage = baseDamage * 2;  // Double the already-doubled critical
            showToastRef.current(t("playerPage.skills.doubleCritDamage", { multiplier: 4 }));
          }

          // Add charge bonus and hits received bonus to damage
          const totalDamage = baseDamage + chargeBonus + hitsReceivedBonus;

          showToastRef.current(`Total: ${totalDamage}${chargeBonus > 0 ? ` (${baseDamage}+${chargeBonus})` : ""}${hitsReceivedBonus > 0 ? ` (+${hitsReceivedBonus} vingança)` : ""}`);

          // Process each target
          for (let targetIndex = 0; targetIndex < resolved.targetIds.length; targetIndex++) {
            const targetId = resolved.targetIds[targetIndex];
            const targetChar = (player?.fightInfo?.characters ?? []).find((c: BattleCharacterInfo) => c.battleID === targetId);
            const isNpcTarget = targetChar?.type === "npc";

            // Check for bonus damage vs Marked targets
            let markedBonus = 0;
            if (resolved.metadata.bonusDamageVsMarked && targetChar) {
              const hasMarked = targetChar.status?.some(s => s.effectName === "Marked") ?? false;
              if (hasMarked) {
                markedBonus = resolved.metadata.bonusDamageVsMarked;
                showToastRef.current(t("playerPage.skills.bonusDamageVsMarked", { bonus: markedBonus }));
              }
            }

            // Check for burn consumption bonus (Combustion)
            let burnBonus = 0;
            let burnToConsume = 0;
            if (resolved.metadata.consumesBurn && targetChar) {
              const burnStacks = getStatusStacks(targetChar, "Burning");
              const maxConsume = resolved.metadata.maxBurnConsumption ?? 10;
              const bonusPerBurn = resolved.metadata.burnConsumptionBonus ?? 2;
              burnToConsume = Math.min(burnStacks, maxConsume);
              burnBonus = burnToConsume * bonusPerBurn;
              if (burnBonus > 0) {
                showToastRef.current(t("playerPage.skills.burnConsumptionBonus", { stacks: burnToConsume, bonus: burnBonus }));
              }
            }

            // Check for burn scaling bonus (Burning Canvas: +2 damage per burn stack)
            let burnScalingBonus = 0;
            if (resolved.metadata.damageScalesWithBurn && targetChar) {
              const burnStacks = getStatusStacks(targetChar, "Burning");
              const bonusPerBurn = resolved.metadata.burnDamageBonus ?? 2;
              burnScalingBonus = burnStacks * bonusPerBurn;
              if (burnScalingBonus > 0) {
                showToastRef.current(t("playerPage.skills.burnScalingBonus", { stacks: burnStacks, bonus: burnScalingBonus }));
              }
            }

            const damageWithBonus = totalDamage + markedBonus + burnBonus + burnScalingBonus;

            if (isNpcTarget && targetChar) {
              const { damageWithElement, elementMod } = applyElementModifier(damageWithBonus, targetChar, skillElement);
              logElementVsNpc(targetChar, skillElement, elementMod, damageWithBonus, damageWithElement);

              const finalDamage = calculateFinalDamage(targetChar, damageWithElement);

              const attackRequest = buildNpcAttackRequest({
                source,
                targetId,
                targetChar,
                resolved,
                hitDamage: damageWithBonus,
                finalDamage,
                skillCost,
                isGradientSkill,
                hitIndex,
                totalHits: actualHitCount,
                chargeIncrease,
                consumesCharge: shouldConsumeCharge,
                consumesBurn: burnToConsume > 0 ? burnToConsume : undefined,
                targetIndex
              });

              await APIBattle.attack(attackRequest);
            } else {
              const attackRequest = buildPlayerAttackRequest({
                source,
                targetId,
                targetChar,
                resolved,
                hitDamage: damageWithBonus,
                finalDamage: damageWithBonus,
                skillCost,
                isGradientSkill,
                hitIndex,
                totalHits: actualHitCount,
                chargeIncrease,
                consumesCharge: shouldConsumeCharge,
                consumesBurn: burnToConsume > 0 ? burnToConsume : undefined,
                targetIndex
              });

              await APIBattle.attack(attackRequest);
            }

            // Visual feedback
            setHitCharacters(prev => new Set(prev).add(targetId));
            setTimeout(() => {
              setHitCharacters(prev => {
                const next = new Set(prev);
                next.delete(targetId);
                return next;
              });
            }, 600);
          }

          hitIndex++;
          resolvePromise();
        }, { theme: "dice-of-rolling" });
      });
    }

    // Handle Fragile → Broken conversion (Shatter)
    if (resolved.metadata.convertsFragileToBroken) {
      for (const targetId of resolved.targetIds) {
        const targetChar = (player?.fightInfo?.characters ?? []).find(
          (c: BattleCharacterInfo) => c.battleID === targetId
        );
        const hasFragile = targetChar?.status?.some(s => s.effectName === "Fragile") ?? false;
        if (hasFragile) {
          await APIBattle.removeStatus(targetId, "Fragile");
          await APIBattle.addStatus({
            battleCharacterId: targetId,
            effectType: "Broken",
            ammount: 1,
            remainingTurns: 1,
            sourceCharacterId: source.battleID
          });
          const maxCharge = source.maxChargePoints ?? 0;
          if (maxCharge > 0) {
            await APIBattle.updateCharacterChargePoints(source.battleID, maxCharge);
            showToastRef.current(t("playerPage.skills.shatterFullCharge"));
          }
        }
      }
    }

    // Handle Breaking Rules: Destroy all target shields and grant MP per shield
    if (resolved.metadata.destroysShields) {
      let totalShieldsDestroyed = 0;
      for (const targetId of resolved.targetIds) {
        const targetChar = (player?.fightInfo?.characters ?? []).find(
          (c: BattleCharacterInfo) => c.battleID === targetId
        );
        const shieldStacks = getStatusStacks(targetChar!, "Shield");
        if (shieldStacks > 0) {
          await APIBattle.removeStatus(targetId, "Shield");
          totalShieldsDestroyed += shieldStacks;
        }
      }
      if (totalShieldsDestroyed > 0) {
        showToastRef.current(t("playerPage.skills.shieldsDestroyed", { count: totalShieldsDestroyed }));

        // Grant MP per shield destroyed
        if (resolved.metadata.grantsMPPerShield) {
          const mpGain = totalShieldsDestroyed * resolved.metadata.grantsMPPerShield;
          const currentMp = source.magicPoints ?? 0;
          const maxMp = source.maxMagicPoints ?? 99;
          const newMp = Math.min(currentMp + mpGain, maxMp);
          await APIBattle.updateCharacterMp(source.battleID, newMp);
          showToastRef.current(t("playerPage.skills.mpFromShields", { mp: mpGain }));
        }
      }
    }

    // Handle post-attack effects
    await handleConditionalHealWithRoll({
      player: player!,
      source,
      target,
      resolved,
      diceBoardRef,
      timeoutDiceBoardRef,
      showToast: showToastRef.current
    });

    // Handle MP grant with dice roll (Swift Stride)
    if (resolved.metadata.grantsMPDiceRoll) {
      await new Promise<void>((resolveMp) => {
        rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, "1d6", async (result) => {
          const roll = diceTotal(result);
          const mpGrant = roll <= 3 ? resolved.metadata.grantsMPDiceRoll!.low : resolved.metadata.grantsMPDiceRoll!.high;
          const currentMp = source.magicPoints ?? 0;
          const maxMp = source.maxMagicPoints ?? 99;
          const newMp = Math.min(currentMp + mpGrant, maxMp);

          await APIBattle.updateCharacterMp(source.battleID, newMp);
          showToastRef.current(t("playerPage.skills.gainedMP", { amount: mpGrant, roll }));

          resolveMp();
        }, { theme: "dice-of-rolling" });
      });
    }

    // Handle stance change after attack with special conditions
    // Rule: If skill doesn't say "changes to stance X" or "maintains stance", stance is lost
    if (!resolved.metadata.maintainsStance) {
      // Determine target stance (default to null = lose stance)
      let targetStance: string | null = resolved.metadata.changesStanceTo ?? null;

      // Preserve Virtuous stance if configured and currently in Virtuous (Fleuret Fury)
      if (resolved.metadata.preservesVirtuoseStance && source.stance === "Virtuous") {
        targetStance = "Virtuous";
      }

      // Switch to Virtuous if target is burning (Swift Stride)
      if (resolved.metadata.switchesToVirtuoseIfBurning && hasStatus(target, "Burning")) {
        targetStance = "Virtuous";
        showToastRef.current(t("playerPage.skills.switchedToVirtuose"));
      }

      // Always update stance (even to null to lose stance)
      await APIBattle.updateCharacterStance(source.battleID, targetStance);
      if (targetStance) {
        showToastRef.current(t("playerPage.skills.stanceChanged", { stance: targetStance }));
      }
    }
  }

  const handleUseSkill = useCallback((skillId: string) => {
    const skillMetadata = SkillEffectsRegistry[skillId];
    if (!skillMetadata) {
      showToastRef.current(t("playerPage.errors.errorSkillNotFound"));
      return;
    }

    const currentCharacter = player?.fightInfo?.characters?.find(
      c => c.battleID === player.fightInfo?.playerBattleID
    );

    // Auto-execute self-targeted skills
    if (skillMetadata.targetScope === "self" && skillMetadata.damageLevel === "none") {
      setPendingSkillId(skillId);
      setTab("combate");
      setIsUsingSkillMode(false);
      if (currentCharacter) {
        handleExecuteSkill(skillId, currentCharacter);
      }
      return;
    }

    // Auto-execute all-enemies skills (no target selection needed)
    if (skillMetadata.targetScope === "all" && skillMetadata.damageLevel !== "none") {
      const allCharacters = player?.fightInfo?.characters ?? [];
      const anyEnemy = allCharacters.find(c => c.isEnemy !== currentCharacter?.isEnemy && c.healthPoints > 0);
      if (anyEnemy) {
        setPendingSkillId(skillId);
        setTab("combate");
        setIsUsingSkillMode(false);
        handleExecuteSkill(skillId, anyEnemy);
      }
      return;
    }

    // Auto-execute skills that target all enemies and/or revive dead allies (Phoenix Flame)
    if (skillMetadata.targetScope === "all-enemies" || skillMetadata.revivesDeadAllies) {
      setPendingSkillId(skillId);
      setTab("combate");
      setIsUsingSkillMode(false);
      // Use currentCharacter as dummy target - actual targets resolved in handleExecuteSkill
      if (currentCharacter) {
        handleExecuteSkill(skillId, currentCharacter);
      }
      return;
    }

    // Store skill and switch to combat for target selection
    setPendingSkillId(skillId);
    setTab("combate");
    setIsUsingSkillMode(false);
    setExcludeSelfFromTargeting(skillMetadata.targetScope === "ally" && !skillMetadata.canTargetSelf);

    const targetsEnemies = skillMetadata.damageLevel !== "none";
    if (targetsEnemies) {
      setCombatTab(currentCharacter?.isEnemy ? "team" : "enemies");
    } else {
      setCombatTab(currentCharacter?.isEnemy ? "enemies" : "team");
    }

    setIsSelectingSkillTarget(true);
  }, [player, setTab, setCombatTab, setIsUsingSkillMode, setPendingSkillId,
      setIsSelectingSkillTarget, setExcludeSelfFromTargeting, handleExecuteSkill]);

  return {
    handleUseSkill,
    handleExecuteSkill,
    isExecutingSkillRef
  };
}
