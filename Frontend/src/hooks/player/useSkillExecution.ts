import { useCallback, useRef } from "react";
import { t } from "../../i18n";
import { APIBattle } from "../../api/APIBattle";
import type { BattleCharacterInfo } from "../../api/ResponseModel";
import { SkillEffectsRegistry } from "../../data/SkillEffectsRegistry";
import { rollWithTimeout } from "../../utils/RollUtils";
import { rollCommandForAttack } from "../../utils/PlayerCalculator";
import { resolveSkill } from "../../utils/BattleSkillUtils";

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

    // Execute hits
    while (hitIndex < actualHitCount) {
      await new Promise<void>((resolvePromise) => {
        rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, rollCommandForAttack(weaponInfo, "basic"), async (result) => {
          const { baseDamage, hasCritical } = calculateHitDamage(result, player, weaponInfo, resolved);
          const chargeIncrease = calculateChargeIncrease(resolved, hasCritical);

          showToastRef.current(`Total: ${baseDamage}`);

          // Process each target
          for (const targetId of resolved.targetIds) {
            const targetChar = (player?.fightInfo?.characters ?? []).find((c: BattleCharacterInfo) => c.battleID === targetId);
            const isNpcTarget = targetChar?.type === "npc";

            if (isNpcTarget && targetChar) {
              const { damageWithElement, elementMod } = applyElementModifier(baseDamage, targetChar.id, skillElement);
              logElementVsNpc(targetChar, skillElement, elementMod, baseDamage, damageWithElement);

              const finalDamage = calculateFinalDamage(targetChar, damageWithElement);

              const attackRequest = buildNpcAttackRequest({
                source,
                targetId,
                targetChar,
                resolved,
                hitDamage: baseDamage,
                finalDamage,
                skillCost,
                isGradientSkill,
                hitIndex,
                totalHits: actualHitCount,
                chargeIncrease
              });

              await APIBattle.attack(attackRequest);
            } else {
              const attackRequest = buildPlayerAttackRequest({
                source,
                targetId,
                targetChar,
                resolved,
                hitDamage: baseDamage,
                finalDamage: baseDamage,
                skillCost,
                isGradientSkill,
                hitIndex,
                totalHits: actualHitCount,
                chargeIncrease
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
