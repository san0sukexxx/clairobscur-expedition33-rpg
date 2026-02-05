import type { RefObject } from "react";
import { t } from "../../../i18n";
import { APIBattle } from "../../../api/APIBattle";
import type { BattleCharacterInfo } from "../../../api/ResponseModel";
import type { GetPlayerResponse } from "../../../api/APIPlayer";
import type { DiceBoardRef } from "../../../components/DiceBoard";
import type { ResolvedSkill } from "../../../utils/BattleSkillUtils";
import type { SkillMetadata } from "../../../data/SkillEffectsRegistry";
import { evaluateCondition, getStatusEffectsForTarget } from "../../../utils/BattleSkillUtils";
import { hasStatus } from "../../../utils/NpcCalculator";
import { rollWithTimeout } from "../../../utils/RollUtils";
import { diceTotal } from "../../../utils/DiceCalculator";
import { handleAttributeTests } from "../../../utils/SkillSpecialMechanics";
import { performAttributeTest } from "../../../utils/AttributeTestUtils";

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

export interface UtilitySkillContext {
  source: BattleCharacterInfo;
  target: BattleCharacterInfo;
  player: GetPlayerResponse;
  allCharacters: BattleCharacterInfo[];
  resolved: ResolvedSkill;
  metadata: SkillMetadata;
  skillCost: number;
  isGradientSkill: boolean;
  diceBoardRef: RefObject<DiceBoardRef | null>;
  timeoutDiceBoardRef: RefObject<ReturnType<typeof setTimeout> | null>;
  showToast: (message: string) => void;
}

/**
 * Handles utility skills (no damage, just effects)
 */
export async function handleUtilitySkill(ctx: UtilitySkillContext): Promise<void> {
  const { source, target, player, allCharacters, resolved, metadata, skillCost, isGradientSkill, diceBoardRef, timeoutDiceBoardRef, showToast } = ctx;

  // Handle attribute tests if defined
  if (metadata.attributeTests) {
    // Consume MP first
    if (skillCost > 0 && !isGradientSkill) {
      const currentMp = source.magicPoints ?? 0;
      await APIBattle.updateCharacterMp(source.battleID, currentMp - skillCost);
    }

    await handleAttributeTests({
      source,
      target,
      player,
      allCharacters,
      metadata,
      diceBoardRef: diceBoardRef as React.RefObject<any>,
      timeoutDiceBoardRef: timeoutDiceBoardRef as React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
      showToast
    });
    return;
  }

  // Standard utility skill handling
  // Consume MP
  if (skillCost > 0 && !isGradientSkill) {
    const currentMp = source.magicPoints ?? 0;
    await APIBattle.updateCharacterMp(source.battleID, currentMp - skillCost);
  }

  // Handle rollsForTargetScope: Roll 1d6 to determine target scope
  let finalTargetIds = [...resolved.targetIds];
  let useExpandedTargets = false;

  if (metadata.rollsForTargetScope) {
    await new Promise<void>((resolveRoll) => {
      rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, "1d6", async (result) => {
        const roll = diceTotal(result);
        const appliesToAll = roll >= 4;  // 4-6 = all allies, 1-3 = single target

        if (appliesToAll) {
          // Apply to all allies (same team as source)
          finalTargetIds = allCharacters
            .filter(c => c.isEnemy === source.isEnemy && c.healthPoints > 0)
            .map(c => c.battleID);
          useExpandedTargets = true;
          showToast(t("playerPage.skills.effectAppliesToAllAllies", { roll }));
        } else {
          showToast(t("playerPage.skills.effectAppliesToSingleTarget", { roll }));
        }

        resolveRoll();
      }, { theme: "dice-of-rolling" });
    });
  }

  // Apply status effects
  if (useExpandedTargets) {
    // When rollsForTargetScope expanded to all allies, apply primary effects to all targets
    for (const targetId of finalTargetIds) {
      for (const effect of metadata.primaryEffects) {
        await APIBattle.addStatus({
          battleCharacterId: targetId,
          effectType: effect.effectType as string,
          ammount: effect.amount ?? 0,
          remainingTurns: effect.remainingTurns ?? 0,
          sourceCharacterId: source.battleID
        });
      }
    }
  } else {
    // Normal case: apply resolved effects to their specific targets
    for (const targetId of finalTargetIds) {
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

  // Handle Cleanse effects
  const cleanseEffects = resolved.effects.filter(e => e.effectType === "Cleanse");
  for (const effect of cleanseEffects) {
    await APIBattle.cleanse(effect.targetBattleId);
    const targetChar = allCharacters.find(c => c.battleID === effect.targetBattleId);
    showToast(t("playerPage.skills.debuffsRemovedFrom", { name: targetChar?.name ?? "" }));
  }

  // Handle heal with dice roll (Recovery)
  if (metadata.healWithRoll) {
    await new Promise<void>((resolveHeal) => {
      rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, metadata.healWithRoll!.dice, async (healResult) => {
        const healDiceTotal = diceTotal(healResult);

        let baseStat = 0;
        if (metadata.healWithRoll!.baseStat === "resistance") {
          baseStat = player?.playerSheet?.resistance ?? 0;
        } else if (metadata.healWithRoll!.baseStat === "power") {
          baseStat = player?.playerSheet?.power ?? 0;
        }

        const totalHeal = baseStat + healDiceTotal;

        console.log("=== Heal With Roll ===");
        console.log("Base Stat:", metadata.healWithRoll!.baseStat, "=", baseStat);
        console.log("Dice Roll:", metadata.healWithRoll!.dice, "=", healDiceTotal);
        console.log("Total Heal:", totalHeal);

        await APIBattle.heal(source.battleID, totalHeal);
        showToast(t("playerPage.skills.healedFor", { amount: totalHeal }));

        resolveHeal();
      }, { theme: "blue-green-metal" });
    });
  }

  // Handle unconditional charge granting
  if (metadata.grantsCharges) {
    const currentCharges = source.chargePoints ?? 0;
    const maxCharges = source.maxChargePoints ?? 10;
    const newCharges = Math.min(currentCharges + metadata.grantsCharges, maxCharges);

    await APIBattle.updateCharacterChargePoints(source.battleID, newCharges);
    showToast(`${source.name} ${t("playerPage.skills.gainedCharges", { amount: metadata.grantsCharges })}`);
  }

  // Handle revival with attribute test (Phoenix Flame)
  if (metadata.revivesDeadAllies) {
    const reviveConfig = metadata.revivesDeadAllies;

    // Find all dead allies (same team as source, healthPoints <= 0)
    const deadAllies = allCharacters.filter(c =>
      c.isEnemy === source.isEnemy &&
      c.healthPoints <= 0 &&
      c.battleID !== source.battleID
    );

    console.log("=== Phoenix Flame Revival ===");
    console.log("Dead allies found:", deadAllies.map(a => a.name));

    if (deadAllies.length > 0) {
      // Perform ONE ability test for all dead allies
      await new Promise<void>((resolveRevive) => {
        performAttributeTest(
          diceBoardRef as React.RefObject<any>,
          timeoutDiceBoardRef as React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
          player,
          "hability",
          reviveConfig.dc,
          async (result) => {
            const hpPercent = result.success ? reviveConfig.onSuccess.hpPercent : reviveConfig.onFailure.hpPercent;

            console.log(`Roll ${result.roll} + ${result.attribute} = ${result.total} vs DC ${result.dc}`);
            console.log(`Result: ${result.success ? "SUCCESS" : "FAILURE"} -> All allies revive with ${hpPercent}% HP`);

            // Revive all dead allies with the same HP percentage
            for (const deadAlly of deadAllies) {
              const maxHp = deadAlly.maxHealthPoints;
              const reviveHp = Math.floor(maxHp * (hpPercent / 100));

              await APIBattle.updateCharacterHp(deadAlly.battleID, reviveHp);

              const resultKey = result.success
                ? "playerPage.skills.revivedFullHp"
                : "playerPage.skills.revivedHalfHp";
              showToast(t(resultKey, { name: deadAlly.name, hp: reviveHp }));
            }

            resolveRevive();
          },
          { theme: "blue-green-metal" }
        );
      });
    } else {
      showToast(t("playerPage.skills.noDeadAlliesToRevive"));
    }
  }

  // Handle MP grant with dice roll (Swift Stride)
  if (metadata.grantsMPDiceRoll) {
    await new Promise<void>((resolveMp) => {
      rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, "1d6", async (result) => {
        const roll = diceTotal(result);
        const mpGrant = roll <= 3 ? metadata.grantsMPDiceRoll!.low : metadata.grantsMPDiceRoll!.high;
        const currentMp = source.magicPoints ?? 0;
        const maxMp = source.maxMagicPoints ?? 99;
        const newMp = Math.min(currentMp + mpGrant, maxMp);

        await APIBattle.updateCharacterMp(source.battleID, newMp);
        showToast(t("playerPage.skills.gainedMP", { amount: mpGrant, roll }));

        resolveMp();
      }, { theme: "dice-of-rolling" });
    });
  }

  // Handle reapplies stance (Mezzo Forte)
  if (metadata.reappliesStance && source.stance) {
    await APIBattle.updateCharacterStance(source.battleID, source.stance);
    showToast(t("playerPage.skills.stanceReapplied", { stance: source.stance }));
  }

  // Handle MP grant with hability test (Mezzo Forte)
  if (metadata.grantsMPWithTest) {
    const testConfig = metadata.grantsMPWithTest;
    await new Promise<void>((resolveMp) => {
      performAttributeTest(
        diceBoardRef as React.RefObject<any>,
        timeoutDiceBoardRef as React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
        player,
        "hability",
        testConfig.dc,
        async (result) => {
          const mpGrant = result.success ? testConfig.onSuccess : testConfig.onFailure;
          const currentMp = source.magicPoints ?? 0;
          const maxMp = source.maxMagicPoints ?? 99;
          const newMp = Math.min(currentMp + mpGrant, maxMp);

          await APIBattle.updateCharacterMp(source.battleID, newMp);

          if (result.success) {
            showToast(t("playerPage.skills.habilityTestSuccessMP", { mp: mpGrant }));
          } else {
            showToast(t("playerPage.skills.habilityTestFailureMP", { mp: mpGrant }));
          }

          resolveMp();
        },
        { theme: "blue-green-metal" }
      );
    });
  }

  // Handle stance change with special conditions
  // Rule: If skill doesn't say "changes to stance X" or "maintains stance", stance is lost
  if (!metadata.maintainsStance) {
    // Determine target stance (default to null = lose stance)
    let targetStance: string | null = metadata.changesStanceTo ?? null;

    // Preserve Virtuous stance if configured and currently in Virtuous
    if (metadata.preservesVirtuoseStance && source.stance === "Virtuous") {
      targetStance = "Virtuous";
    }

    // Switch to Virtuous if target is burning (Swift Stride)
    if (metadata.switchesToVirtuoseIfBurning && hasStatus(target, "Burning")) {
      targetStance = "Virtuous";
      showToast(t("playerPage.skills.switchedToVirtuose"));
    }

    // Always update stance (even to null to lose stance)
    await APIBattle.updateCharacterStance(source.battleID, targetStance);
    if (targetStance) {
      showToast(t("playerPage.skills.stanceChanged", { stance: targetStance }));
    }
  }
}
