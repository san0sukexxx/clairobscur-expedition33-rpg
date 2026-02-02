import type { RefObject } from "react";
import { t } from "../../../i18n";
import { APIBattle } from "../../../api/APIBattle";
import type { BattleCharacterInfo } from "../../../api/ResponseModel";
import type { GetPlayerResponse } from "../../../api/APIPlayer";
import type { DiceBoardRef } from "../../../components/DiceBoard";
import type { ResolvedSkill } from "../../../utils/BattleSkillUtils";
import { evaluateCondition, getStatusEffectsForTarget } from "../../../utils/BattleSkillUtils";
import { rollWithTimeout } from "../../../utils/RollUtils";
import { diceTotal } from "../../../utils/DiceCalculator";

export interface PostAttackContext {
  player: GetPlayerResponse;
  source: BattleCharacterInfo;
  target: BattleCharacterInfo;
  resolved: ResolvedSkill;
  diceBoardRef: RefObject<DiceBoardRef | null>;
  timeoutDiceBoardRef: RefObject<ReturnType<typeof setTimeout> | null>;
  showToast: (message: string) => void;
}

/**
 * Handles conditional heal with dice roll (e.g., From Fire)
 */
export async function handleConditionalHealWithRoll(
  ctx: PostAttackContext
): Promise<void> {
  const { player, source, target, resolved, diceBoardRef, timeoutDiceBoardRef, showToast } = ctx;

  if (!resolved.metadata.conditionalHealWithRoll) {
    return;
  }

  const healConfig = resolved.metadata.conditionalHealWithRoll;
  const allCharacters = player.fightInfo?.characters ?? [];

  // Check if condition is met
  const conditionMet = evaluateCondition(healConfig.condition, source, target, allCharacters);

  if (!conditionMet) {
    console.log("=== Conditional Heal NOT Triggered ===");
    console.log("Condition:", healConfig.condition, "= false");
    return;
  }

  console.log("=== Conditional Heal Triggered ===");
  console.log("Condition:", healConfig.condition, "= true");

  // Roll heal dice with blue-green-metal theme
  await new Promise<void>((resolveHeal) => {
    rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, healConfig.dice, async (healResult) => {
      const healDiceTotal = diceTotal(healResult);

      // Get base stat value
      let baseStat = 0;
      if (healConfig.baseStat === "resistance") {
        baseStat = player?.playerSheet?.resistance ?? 0;
      } else if (healConfig.baseStat === "power") {
        baseStat = player?.playerSheet?.power ?? 0;
      }

      const totalHeal = baseStat + healDiceTotal;

      console.log("Base Stat:", healConfig.baseStat, "=", baseStat);
      console.log("Dice Roll:", healConfig.dice, "=", healDiceTotal);
      console.log("Total Heal:", totalHeal);

      // Apply heal to source
      await APIBattle.heal(source.battleID, totalHeal);
      showToast(t("playerPage.skills.healedFor", { amount: totalHeal }));

      resolveHeal();
    }, { theme: "blue-green-metal" });
  });
}

/**
 * Handles utility skills (no damage, just effects)
 */
export async function handleUtilitySkill(
  source: BattleCharacterInfo,
  resolved: ResolvedSkill,
  skillCost: number,
  isGradientSkill: boolean
): Promise<void> {
  // Consume MP
  if (skillCost > 0 && !isGradientSkill) {
    const currentMp = source.magicPoints ?? 0;
    await APIBattle.updateCharacterMp(source.battleID, currentMp - skillCost);
  }

  // Apply status effects
  for (const targetId of resolved.targetIds) {
    const effects = getStatusEffectsForTarget(resolved.effects, targetId);
    for (const effect of effects) {
      await APIBattle.addStatus({
        battleCharacterId: targetId,
        effectType: effect.effectType,
        ammount: effect.ammount ?? 0,
        remainingTurns: effect.remainingTurns ?? 0,
        sourceCharacterId: source.battleID
      });
    }
  }
}
