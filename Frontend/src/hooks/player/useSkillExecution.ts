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
import {
  consumeStains,
  gainStains,
  processStainEffects,
  getRandomElement,
  gainStainOnCrit
} from "./skillExecution/stainEffects";
import {
  grantPerfectionPoints,
  grantPerfectionPerHit,
  gainPerfectionRank,
  reducePerfectionRank,
  setRankToS,
  upgradeRankToSOnBreak,
  deductHpCost,
  calculateRankBonuses,
  transferAllStatusToSelf,
  returnMp,
  grantMpToAllAllies,
  calculateSpeedDifferenceBonus,
  gainRandomPerfection
} from "./skillExecution/perfectionEffects";
import {
  calculateMaskBonuses,
  isAtCasterOrAlmighty,
  isAtAgileOrAlmighty,
  calculateShieldStackBonus,
  applySacrifice,
  calculateLowHpDamageBonus,
  hasBurningBonus,
  shouldDoubleDamageVsStunned,
  hasPowerlessBonus,
  applyHealPerHit,
  applyRandomBuffsWithMaskBonus,
  grantMpToAllAlliesWithMaskBonus
} from "./skillExecution/bestialWheelEffects";
import {
  consumeForetell,
  consumeForetellPerHit,
  calculateForetellDamageBonus,
  getForetellPerHitMultiplier,
  consumeForetellFromAllEnemies,
  drainAlliesHp,
  grantMpPerForetell,
  propagateBurnDamage,
  cleansesAndCopiesBuffs,
  applyForetellOnCrit,
  grantMpToAlly,
  delayTargetTurn,
  extendTwilight,
  redistributeForetell,
  notifyExtraTurn,
  calculateForetellScalingBonus
} from "./skillExecution/foretellEffects";

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
    let skillElement = determineSkillElement(resolved, weaponInfo);
    logElementConfiguration(skillId, resolved, weaponElement, skillElement);

    // === LUNE: Consume stains before attack ===
    let stainsConsumed = 0;
    let stainEffects = { damageMultiplier: 1, shouldGrantSecondTurn: false, shouldDoublesDamage: false, shouldGrantRegeneration: false, dotDuration: null as number | null, determinedElement: null as string | null, canBreak: false };
    if (resolved.metadata.consumesStains) {
      const result = await consumeStains(source, resolved.metadata.consumesStains, showToastRef.current);
      stainsConsumed = result.consumed;
      stainEffects = processStainEffects(source, resolved.metadata, stainsConsumed);

      // Override element if stain-determined
      if (stainEffects.determinedElement) {
        skillElement = stainEffects.determinedElement;
      }
    }

    // === VERSO: Deduct HP cost before attack (Defiant Strike, Poignee Forte) ===
    if (resolved.metadata.costsHpPercent) {
      await deductHpCost(source, resolved.metadata.costsHpPercent, showToastRef.current);
    }

    // === VERSO: Calculate rank bonuses ===
    const rankBonuses = calculateRankBonuses(source, resolved.metadata);

    // === MONOCO: Calculate mask bonuses ===
    const maskBonuses = calculateMaskBonuses(source, resolved.metadata);

    // === MONOCO: Sacrifice HP (Cultist Blood) ===
    let sacrificeBonus = 0;
    if (resolved.metadata.sacrificesHpPercent) {
      sacrificeBonus = await applySacrifice(source, resolved.metadata.sacrificesHpPercent, showToastRef.current);
    }

    // === SCIEL: Drain allies HP (Our Sacrifice) ===
    let drainedHpBonus = 0;
    if (resolved.metadata.drainsAlliesHp) {
      drainedHpBonus = await drainAlliesHp(source, player?.fightInfo?.characters ?? [], showToastRef.current);
    }

    // === SCIEL: Consume Foretell from all enemies (Our Sacrifice) ===
    let allEnemiesForetellBonus = 0;
    if (resolved.metadata.consumesAllEnemiesForetell) {
      allEnemiesForetellBonus = await consumeForetellFromAllEnemies(
        player?.fightInfo?.characters ?? [],
        source.isEnemy,
        showToastRef.current
      );
    }

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

          // Increased critical damage (Sword Ballet: +4 per crit)
          if (hasCritical && resolved.metadata.increasedCritDamage) {
            baseDamage = baseDamage + resolved.metadata.increasedCritDamage;
            showToastRef.current(t("playerPage.skills.increasedCritDamage", { bonus: resolved.metadata.increasedCritDamage }));
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

            // === SCIEL: Per-hit Foretell consumption (Sealed Fate) ===
            let foretellPerHitMultiplier = 1;
            if (resolved.metadata.consumesForetellPerHit && targetChar) {
              const hadForetell = await consumeForetellPerHit(targetChar);
              foretellPerHitMultiplier = getForetellPerHitMultiplier(hadForetell, resolved.metadata.foretellPerHitMultiplier);
            }

            // === MONOCO: Shield stack bonus (Chevaliere Piercing) ===
            let shieldStackBonus = 0;
            if (resolved.metadata.damagePerShieldStack && targetChar) {
              shieldStackBonus = calculateShieldStackBonus(targetChar, resolved.metadata.damagePerShieldStack);
            }

            // === MONOCO: Low HP damage scaling (Cultist Slashes) ===
            let lowHpMultiplier = 1;
            if (resolved.metadata.damageScalesWithLowHp) {
              lowHpMultiplier = 1 + calculateLowHpDamageBonus(source);
            }

            // === MONOCO: Bonus vs burning (Danseuse Waltz) ===
            let burningTargetBonus = 0;
            if (resolved.metadata.bonusDamageVsBurning && targetChar && hasBurningBonus(targetChar)) {
              burningTargetBonus = Math.floor(totalDamage * 0.5); // +50% vs burning
            }

            // === MONOCO: Double damage vs stunned (Mighty Strike) ===
            let stunnedMultiplier = 1;
            if (targetChar && shouldDoubleDamageVsStunned(targetChar, resolved.metadata)) {
              stunnedMultiplier = 2;
            }

            // === MONOCO: Bonus vs powerless (Obscur Sword) ===
            let powerlessBonus = 0;
            if (resolved.metadata.bonusDamageVsPowerless && targetChar && hasPowerlessBonus(targetChar)) {
              powerlessBonus = Math.floor(totalDamage * 0.5); // +50% vs powerless
            }

            // === VERSO: Speed difference bonus (Escrime Rapide) ===
            let speedBonus = 0;
            if (resolved.metadata.scalesWithSpeedDifference && targetChar) {
              speedBonus = calculateSpeedDifferenceBonus(player!, targetChar);
            }

            // Calculate final damage with all bonuses and multipliers
            let damageWithBonus = totalDamage + markedBonus + burnBonus + burnScalingBonus +
              shieldStackBonus + burningTargetBonus + powerlessBonus + speedBonus +
              sacrificeBonus + drainedHpBonus + allEnemiesForetellBonus;

            // Apply multipliers
            damageWithBonus = Math.floor(damageWithBonus * stainEffects.damageMultiplier);
            damageWithBonus = Math.floor(damageWithBonus * rankBonuses.damageMultiplier);
            damageWithBonus = Math.floor(damageWithBonus * maskBonuses.damageMultiplier);
            damageWithBonus = Math.floor(damageWithBonus * foretellPerHitMultiplier);
            damageWithBonus = Math.floor(damageWithBonus * lowHpMultiplier);
            damageWithBonus = Math.floor(damageWithBonus * stunnedMultiplier);

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

    // Handle canBreak: Convert Fragile → Broken for skills that can break
    const skillCanBreak = resolved.metadata.canBreak || stainEffects.canBreak;
    let brokeTarget = false;
    if (skillCanBreak && !resolved.metadata.convertsFragileToBroken) {
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
          showToastRef.current(t("playerPage.battle.targetBroken", { name: targetChar?.name ?? "" }));
          brokeTarget = true;
        }
      }
    }

    // Handle Fragile → Broken conversion (Shatter - also grants full charges)
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
          brokeTarget = true;
          const maxCharge = source.maxChargePoints ?? 0;
          if (maxCharge > 0) {
            await APIBattle.updateCharacterChargePoints(source.battleID, maxCharge);
            showToastRef.current(t("playerPage.skills.shatterFullCharge"));
          }
        }
      }
    }

    // Handle upgradesRankToSOnBreak: Auto-upgrade Perfection to S Rank when enemy breaks (Le Tremblement)
    if (resolved.metadata.upgradesRankToSOnBreak) {
      await upgradeRankToSOnBreak(source, brokeTarget, showToastRef.current);
    }

    // Handle Breaking Rules: Destroy all target shields and grant MP per shield
    if (resolved.metadata.destroysShields) {
      let totalShieldsDestroyed = 0;
      for (const targetId of resolved.targetIds) {
        const targetChar = (player?.fightInfo?.characters ?? []).find(
          (c: BattleCharacterInfo) => c.battleID === targetId
        );
        const shieldStacks = getStatusStacks(targetChar!, "Shielded");
        if (shieldStacks > 0) {
          await APIBattle.removeStatus(targetId, "Shielded");
          totalShieldsDestroyed += shieldStacks;
        }
      }
      if (totalShieldsDestroyed > 0) {
        showToastRef.current(t("playerPage.skills.shieldsDestroyed", { count: totalShieldsDestroyed }));

        // Grant MP per shield destroyed
        if (resolved.metadata.grantsMPPerShield) {
          const mpGain = totalShieldsDestroyed * resolved.metadata.grantsMPPerShield;
          const currentMp = (source.magicPoints ?? 0) - skillCost;
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

    // Handle Stendhal: Consume own shields after attack
    if (resolved.metadata.consumesShield) {
      const shieldStatus = source.status?.filter(s => s.effectName === "Shielded") ?? [];
      for (const shield of shieldStatus) {
        await APIBattle.removeStatus(source.battleID, "Shielded");
      }
      if (shieldStatus.length > 0) {
        showToastRef.current(t("playerPage.skills.shieldsConsumed", { count: shieldStatus.length }));
      }
    }

    // Handle Stendhal: Apply Unprotected to self after attack
    if (resolved.metadata.appliesSelfUnprotected) {
      await APIBattle.addStatus({
        battleCharacterId: source.battleID,
        effectType: "Unprotected",
        ammount: 0,
        remainingTurns: 2,
        sourceCharacterId: source.battleID
      });
      showToastRef.current(t("playerPage.skills.unprotectedApplied"));
    }

    // Handle MP grant with dice roll (Swift Stride old)
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

    // Handle MP grant with hability test (Swift Stride - Passo Veloz)
    if (resolved.metadata.grantsMPWithTest) {
      const { performAttributeTest } = await import("../../utils/AttributeTestUtils");
      const testConfig = resolved.metadata.grantsMPWithTest;
      await new Promise<void>((resolveMp) => {
        performAttributeTest(
          diceBoardRef as React.RefObject<any>,
          timeoutDiceBoardRef as React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
          player!,
          "hability",
          testConfig.dc,
          async (result) => {
            const mpGrant = result.success ? testConfig.onSuccess : testConfig.onFailure;
            if (mpGrant > 0) {
              const currentMp = source.magicPoints ?? 0;
              const maxMp = source.maxMagicPoints ?? 99;
              const newMp = Math.min(currentMp + mpGrant, maxMp);

              await APIBattle.updateCharacterMp(source.battleID, newMp);
            }

            if (result.success) {
              showToastRef.current(t("playerPage.skills.habilityTestSuccessMP", { mp: mpGrant }));
            } else {
              showToastRef.current(t("playerPage.skills.habilityTestFailureMP", { mp: mpGrant }));
            }

            resolveMp();
          },
          { theme: "blue-green-metal" }
        );
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
        const stanceKey = targetStance.toLowerCase() as "offensive" | "defensive" | "virtuous";
        showToastRef.current(t("playerPage.skills.stanceChanged", { stance: t(`combatAdmin.stances.${stanceKey}`) }));

        // Maelle: Grant +1 MP when changing to a new stance (not null)
        if (targetStance !== source.stance) {
          const currentMp = source.magicPoints ?? 0;
          const maxMp = source.maxMagicPoints ?? 99;
          const newMp = Math.min(currentMp + 1, maxMp);
          await APIBattle.updateCharacterMp(source.battleID, newMp);
          showToastRef.current(t("playerPage.skills.stanceChangeMpBonus"));
        }
      }
    }

    // === LUNE: Gain stains after attack ===
    if (resolved.metadata.gainsStains) {
      await gainStains(source, resolved.metadata.gainsStains, showToastRef.current);
    }

    // === LUNE: Grant regeneration when stains consumed (Revitalization) ===
    if (stainEffects.shouldGrantRegeneration) {
      await APIBattle.addStatus({
        battleCharacterId: source.battleID,
        effectType: "Regeneration",
        ammount: 1,
        remainingTurns: 3,
        sourceCharacterId: source.battleID
      });
      showToastRef.current(t("playerPage.skills.regenerationApplied"));
    }

    // === LUNE: Grant second turn when stains consumed (Thermal Transfer) ===
    if (stainEffects.shouldGrantSecondTurn) {
      notifyExtraTurn(source, showToastRef.current);
    }

    // === SCIEL: Consume Foretell from target (Twilight Slash, etc.) ===
    if (resolved.metadata.consumesForetell) {
      const consumed = await consumeForetell(target, showToastRef.current);
      const damageBonus = calculateForetellDamageBonus(consumed, resolved.metadata.foretellDamageBonus);
      if (damageBonus > 0) {
        showToastRef.current(t("playerPage.skills.foretellDamageBonus", { bonus: damageBonus }));
      }

      // Grant MP per foretell consumed (Plentiful Harvest)
      if (resolved.metadata.grantsMpPerForetell) {
        await grantMpPerForetell(
          source,
          player?.fightInfo?.characters ?? [],
          consumed,
          resolved.metadata.grantsMpPerForetell,
          showToastRef.current
        );
      }
    }

    // === SCIEL: Propagate burn damage (Searing Bond) ===
    if (resolved.metadata.propagatesBurnDamage) {
      await propagateBurnDamage(
        target,
        player?.fightInfo?.characters ?? [],
        source,
        actualHitCount * 10, // Approximate total damage dealt
        50, // 50% propagation
        showToastRef.current
      );
    }

    // === SCIEL: Delay target turn (Delaying Slash) ===
    if (resolved.metadata.delaysTurn) {
      await delayTargetTurn(target, resolved.metadata.delaysTurn, showToastRef.current);
    }

    // === SCIEL: Extend Twilight (Twilight Dance) ===
    if (resolved.metadata.extendsTwilight) {
      await extendTwilight(source, showToastRef.current);
    }

    // === SCIEL: Redistribute Foretell (Card Weaver) ===
    if (resolved.metadata.redistributesForetell) {
      await redistributeForetell(target, player?.fightInfo?.characters ?? [], source, showToastRef.current);
    }

    // === SCIEL: Grant extra turn notification (Card Weaver) ===
    if (resolved.metadata.grantsExtraTurn) {
      notifyExtraTurn(source, showToastRef.current);
    }

    // === SCIEL: Cleanse and copy buffs (Dark Cleansing) ===
    if (resolved.metadata.cleansesAndCopiesBuffs) {
      await cleansesAndCopiesBuffs(target, player?.fightInfo?.characters ?? [], source, showToastRef.current);
    }

    // === SCIEL: Grant MP to ally (Intervention) ===
    if (resolved.metadata.grantsMP) {
      await grantMpToAlly(target, resolved.metadata.grantsMP, showToastRef.current);
    }

    // === VERSO: Grant perfection points ===
    if (resolved.metadata.grantsPerfectionPoints) {
      await grantPerfectionPoints(
        source,
        resolved.metadata.grantsPerfectionPoints,
        false, // hasCritical - would need to track from loop
        resolved.metadata.bonusPerfectionOnCrit,
        showToastRef.current
      );
    }

    // === VERSO: Grant perfection per hit ===
    if (resolved.metadata.gainsPerfectionPerHit) {
      await grantPerfectionPerHit(
        source,
        actualHitCount,
        resolved.metadata.gainsPerfectionPerHit,
        false, // hasCritical
        resolved.metadata.criticalGivesPerfectionBonus,
        showToastRef.current
      );
    }

    // === VERSO: Gain perfection rank directly (Fléau) ===
    if (resolved.metadata.gainsPerfectionRank) {
      await gainPerfectionRank(source, resolved.metadata.gainsPerfectionRank, showToastRef.current);
    }

    // === VERSO: Reduce perfection rank (Demoralisation) ===
    if (resolved.metadata.reducesRank) {
      await reducePerfectionRank(source, resolved.metadata.reducesRank, showToastRef.current);
    }

    // === VERSO: Set rank to S (Ultimate skills) ===
    if (resolved.metadata.setsRankToS) {
      await setRankToS(source, showToastRef.current);
    }

    // === VERSO: Random perfection gain (Verso Puissant) ===
    if (resolved.metadata.gainsPerfection) {
      await gainRandomPerfection(
        source,
        resolved.metadata.gainsPerfection.min,
        resolved.metadata.gainsPerfection.max,
        showToastRef.current
      );
    }

    // === VERSO: Return MP (Fleuret Fury) ===
    if (resolved.metadata.returnsMp) {
      await returnMp(
        source,
        resolved.metadata.returnsMp.min,
        resolved.metadata.returnsMp.max,
        rankBonuses.bonusMpReturn,
        showToastRef.current
      );
    }

    // === VERSO: Grant MP to allies (Fleuret Eperdu, Leadership) ===
    if (resolved.metadata.grantsMpToAllies) {
      await grantMpToAllAllies(
        source,
        player?.fightInfo?.characters ?? [],
        resolved.metadata.grantsMpToAllies.min,
        resolved.metadata.grantsMpToAllies.max,
        rankBonuses.bonusMpToAllies,
        showToastRef.current
      );
    }

    // === VERSO: Transfer all status to self (Burden) ===
    if (resolved.metadata.transfersAllStatusToSelf) {
      await transferAllStatusToSelf(source, player?.fightInfo?.characters ?? [], showToastRef.current);
    }

    // === MONOCO: Heal per hit (Sapling Absorption) ===
    if (resolved.metadata.healsHpPercentPerHit) {
      await applyHealPerHit(source, resolved.metadata.healsHpPercentPerHit, actualHitCount, showToastRef.current);
    }

    // === MONOCO: Random buffs with mask bonus (Troubadour Trumpet) ===
    if (resolved.metadata.appliesRandomBuffs) {
      await applyRandomBuffsWithMaskBonus(source, player?.fightInfo?.characters ?? [], showToastRef.current);
    }

    // === MONOCO: Grant MP to all allies with mask bonus (Potier Energy) ===
    if (resolved.metadata.grantsMpToAllAllies) {
      await grantMpToAllAlliesWithMaskBonus(
        source,
        player?.fightInfo?.characters ?? [],
        resolved.metadata.grantsMpToAllAllies.min,
        resolved.metadata.grantsMpToAllAllies.max,
        showToastRef.current
      );
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
