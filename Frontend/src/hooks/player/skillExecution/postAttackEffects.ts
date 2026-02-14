import type { RefObject } from "react";
import { t } from "../../../i18n";
import { APIBattle } from "../../../api/APIBattle";
import type { BattleCharacterInfo, StatusType, Stance } from "../../../api/ResponseModel";
import type { GetPlayerResponse } from "../../../api/APIPlayer";
import type { DiceBoardRef } from "../../../components/DiceBoard";
import type { ResolvedSkill } from "../../../utils/BattleSkillUtils";
import type { SkillMetadata } from "../../../data/SkillEffectsRegistry";
import { evaluateCondition, getStatusEffectsForTarget } from "../../../utils/BattleSkillUtils";
import { hasStatus } from "../../../utils/NpcCalculator";
import { consumeStains, processStainEffects, gainStains } from "./stainEffects";
import { calculateRankBonuses } from "./perfectionEffects";
import { healHpPercentAtCasterMask, grantMpAtCasterMask, grantMpAtHeavyMask, advanceBestialWheel } from "./bestialWheelEffects";
import { cleansesAndCopiesBuffs, grantMpToAlly } from "./foretellEffects";
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
  skillType?: string;
}

/**
 * Handles utility skills (no damage, just effects)
 */
export async function handleUtilitySkill(ctx: UtilitySkillContext): Promise<void> {
  const { source, target, player, allCharacters, resolved, metadata, skillCost, isGradientSkill, diceBoardRef, timeoutDiceBoardRef, showToast, skillType } = ctx;

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

  // Handle Sun/Moon charge increment for utility skills (Sciel)
  if (skillType) {
    const hasTwilight = source.status?.some(s => s.effectName === "Twilight") ?? false;
    if (!hasTwilight) {
      const result = await APIBattle.incrementSunMoonCharge(source.battleID, skillType);
      if (result.twilightActivated) {
        showToast(t("playerPage.skills.twilightActivated", { charges: result.twilightCharges }));
      }
    }
  }

  // === LUNE: Consume stains for utility skills ===
  let stainsConsumed = 0;
  let stainDotDuration: number | null = null;
  let currentStainSlots: import("./stainEffects").StainSlots | undefined;
  if (metadata.consumesStains) {
    const noDamageBonus = metadata.noStainDamageBonus || metadata.consumeStainsForFreeCast;
    const result = await consumeStains(source, metadata.consumesStains, showToast, noDamageBonus);
    stainsConsumed = result.consumed;
    currentStainSlots = result.slots;
    const stainResults = processStainEffects(source, metadata, stainsConsumed);
    stainDotDuration = stainResults.dotDuration;
  }

  // === VERSO: Calculate rank bonuses for effect duration override ===
  const rankBonuses = calculateRankBonuses(source, metadata);
  const effectDurationOverride = rankBonuses.effectDuration;

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

  // Handle habilityTestForScope: Hability test to determine target scope (Guard Up)
  if (metadata.habilityTestForScope) {
    const testConfig = metadata.habilityTestForScope;
    await new Promise<void>((resolveTest) => {
      performAttributeTest(
        diceBoardRef as React.RefObject<any>,
        timeoutDiceBoardRef as React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
        player,
        "hability",
        testConfig.dc,
        async (result) => {
          if (result.success) {
            // Success: Apply to all allies (same team as source)
            finalTargetIds = allCharacters
              .filter(c => c.isEnemy === source.isEnemy && c.healthPoints > 0)
              .map(c => c.battleID);
            useExpandedTargets = true;
            showToast(t("playerPage.skills.habilityTestSuccessAllAllies"));
          } else {
            // Failure: Apply only to selected target
            showToast(t("playerPage.skills.habilityTestFailureSingleTarget"));
          }
          resolveTest();
        },
        { theme: "blue-green-metal" }
      );
    });
  }

  // Handle randomAllyCount: randomly select allies as targets
  if (metadata.randomAllyCount) {
    const { min, max } = metadata.randomAllyCount;
    const count = min + Math.floor(Math.random() * (max - min + 1));
    const allies = allCharacters
      .filter(c => c.isEnemy === source.isEnemy && c.healthPoints > 0);
    const shuffled = [...allies].sort(() => Math.random() - 0.5);
    finalTargetIds = shuffled.slice(0, count).map(c => c.battleID);
  }

  // Build effective effects list (handle stains-consumed conditional overrides)
  let effectsToApply = [...metadata.primaryEffects];
  if (stainsConsumed > 0 && metadata.conditionalEffects.length > 0) {
    const stainConditionals = metadata.conditionalEffects.filter(e => e.condition === "stains-consumed");
    for (const conditional of stainConditionals) {
      const existingIdx = effectsToApply.findIndex(e => e.effectType === conditional.effectType);
      if (existingIdx >= 0) {
        effectsToApply[existingIdx] = conditional; // Replace (e.g., StormCaller 3→6)
      } else {
        effectsToApply.push(conditional); // Add new (e.g., Regeneration)
      }
    }
  }

  // Apply status effects
  if (useExpandedTargets) {
    // When rollsForTargetScope expanded to all allies, apply effects to all targets
    for (const targetId of finalTargetIds) {
      for (const effect of effectsToApply) {
        await APIBattle.addStatus({
          battleCharacterId: targetId,
          effectType: effect.effectType as StatusType,
          ammount: effect.amount ?? 0,
          remainingTurns: effectDurationOverride ?? stainDotDuration ?? effect.remainingTurns ?? 0,
          sourceCharacterId: source.battleID
        });
      }
    }
  } else {
    // Normal case: apply resolved effects with stains-consumed overrides
    for (const targetId of finalTargetIds) {
      const resolvedEffects = getStatusEffectsForTarget(resolved.effects, targetId);
      for (const effect of resolvedEffects) {
        // Check for stains-consumed override on this effectType
        let effectAmount = effect.ammount ?? 0;
        if (stainsConsumed > 0) {
          const override = metadata.conditionalEffects.find(
            e => e.condition === "stains-consumed" && e.effectType === effect.effectType
          );
          if (override) {
            effectAmount = override.amount ?? effectAmount;
          }
        }
        await APIBattle.addStatus({
          battleCharacterId: targetId,
          effectType: effect.effectType,
          ammount: effectAmount,
          remainingTurns: effectDurationOverride ?? stainDotDuration ?? effect.remainingTurns ?? 0,
          sourceCharacterId: source.battleID
        });
      }
      // Apply additional stains-consumed effects not in primary (e.g., Regeneration)
      if (stainsConsumed > 0) {
        const additionalEffects = metadata.conditionalEffects.filter(
          e => e.condition === "stains-consumed" &&
            !metadata.primaryEffects.some(p => p.effectType === e.effectType)
        );
        for (const effect of additionalEffects) {
          await APIBattle.addStatus({
            battleCharacterId: targetId,
            effectType: effect.effectType as StatusType,
            ammount: effect.amount ?? 0,
            remainingTurns: effectDurationOverride ?? stainDotDuration ?? effect.remainingTurns ?? 0,
            sourceCharacterId: source.battleID
          });
        }
      }
    }

    // Apply effects targeting allies (e.g., Typhoon → Regeneration on all-allies)
    const allyTargetIds = [...new Set(
      resolved.effects
        .map(e => e.targetBattleId)
        .filter(id => !finalTargetIds.includes(id))
    )];
    for (const targetId of allyTargetIds) {
      const resolvedEffects = getStatusEffectsForTarget(resolved.effects, targetId);
      for (const effect of resolvedEffects) {
        await APIBattle.addStatus({
          battleCharacterId: targetId,
          effectType: effect.effectType,
          ammount: effect.ammount ?? 0,
          remainingTurns: effectDurationOverride ?? stainDotDuration ?? effect.remainingTurns ?? 0,
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

  // Handle Last Chance: Set HP to 1 and refill MP
  if (metadata.setsHpTo !== undefined) {
    await APIBattle.updateCharacterHp(source.battleID, metadata.setsHpTo);
    showToast(t("playerPage.skills.hpSetTo", { amount: metadata.setsHpTo }));
  }

  if (metadata.refillsMP) {
    const maxMp = source.maxMagicPoints ?? 0;
    await APIBattle.updateCharacterMp(source.battleID, maxMp);
    showToast(t("playerPage.skills.mpRefilled", { amount: maxMp }));
  }

  // Handle Stendhal: Consume own shields and apply Unprotected to self
  if (metadata.consumesShield) {
    const shieldStatus = source.status?.filter(s => s.effectName === "Shielded") ?? [];
    for (const shield of shieldStatus) {
      await APIBattle.removeStatus(source.battleID, "Shielded");
    }
    if (shieldStatus.length > 0) {
      showToast(t("playerPage.skills.shieldsConsumed", { count: shieldStatus.length }));
    }
  }

  if (metadata.appliesSelfUnprotected) {
    await APIBattle.addStatus({
      battleCharacterId: source.battleID,
      effectType: "Unprotected",
      ammount: 0,
      remainingTurns: 2,
      sourceCharacterId: source.battleID
    });
    showToast(t("playerPage.skills.unprotectedApplied"));
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

  // Handle revival with dice roll tiers (Rebirth)
  if (metadata.reviveWithDiceRoll) {
    const reviveConfig = metadata.reviveWithDiceRoll;

    // Find the selected target (should be a dead ally)
    const targetChar = allCharacters.find(c => c.battleID === target.battleID);

    if (targetChar && targetChar.healthPoints <= 0) {
      await new Promise<void>((resolveRevive) => {
        rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, "1d6", async (result) => {
          const roll = diceTotal(result);
          const tier = reviveConfig.tiers.find(t => roll >= t.minRoll && roll <= t.maxRoll);
          const hpPercent = tier?.hpPercent ?? 25;

          const maxHp = targetChar.maxHealthPoints;
          const reviveHp = Math.floor(maxHp * (hpPercent / 100));

          await APIBattle.updateCharacterHp(targetChar.battleID, reviveHp);
          showToast(t("playerPage.skills.revivedWithRoll", { name: targetChar.name, hp: reviveHp, percent: hpPercent, roll }));

          // Grant MP to revived ally
          if (reviveConfig.grantsMp) {
            const currentMp = targetChar.magicPoints ?? 0;
            const maxMp = targetChar.maxMagicPoints ?? 99;
            const newMp = Math.min(currentMp + reviveConfig.grantsMp, maxMp);
            await APIBattle.updateCharacterMp(targetChar.battleID, newMp);
            showToast(t("playerPage.skills.grantedMpToRevived", { name: targetChar.name, mp: reviveConfig.grantsMp }));
          }

          resolveRevive();
        }, { theme: "blue-green-metal" });
      });
    } else {
      showToast(t("playerPage.skills.targetNotDead"));
    }
  }

  // Handle heal with hability test for scope (Revitalization)
  if (metadata.healWithHabilityTest) {
    const healConfig = metadata.healWithHabilityTest;

    await new Promise<void>((resolveTest) => {
      performAttributeTest(
        diceBoardRef as React.RefObject<any>,
        timeoutDiceBoardRef as React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
        player,
        "hability",
        healConfig.dc,
        async (result) => {
          const healsAll = result.success;
          const healDice = healsAll ? healConfig.successHealDice : healConfig.failureHealDice;

          if (healsAll) {
            showToast(t("playerPage.skills.habilityTestSuccessAllAllies"));
          } else {
            showToast(t("playerPage.skills.habilityTestFailureSingleTarget"));
          }

          // Determine heal targets
          const healTargets = healsAll
            ? allCharacters.filter(c => c.isEnemy === source.isEnemy && c.healthPoints > 0)
            : [allCharacters.find(c => c.battleID === target.battleID)].filter((c): c is BattleCharacterInfo => c !== undefined && c.healthPoints > 0);

          // Roll heal dice
          await new Promise<void>((resolveHeal) => {
            rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, healDice, async (healResult) => {
              const healDiceTotal = diceTotal(healResult);

              let baseStat = 0;
              if (healConfig.baseStat === "resistance") {
                baseStat = player?.playerSheet?.resistance ?? 0;
              } else if (healConfig.baseStat === "power") {
                baseStat = player?.playerSheet?.power ?? 0;
              }

              const totalHeal = baseStat + healDiceTotal;

              for (const healTarget of healTargets) {
                await APIBattle.heal(healTarget.battleID, totalHeal);
                showToast(t("playerPage.skills.healedTarget", { name: healTarget.name, amount: totalHeal }));
              }

              // Apply conditional effects (Regeneration) if stains consumed
              if (stainsConsumed > 0 && metadata.conditionalEffects.length > 0) {
                const stainConditionals = metadata.conditionalEffects.filter(e => e.condition === "stains-consumed");
                for (const effect of stainConditionals) {
                  for (const healTarget of healTargets) {
                    await APIBattle.addStatus({
                      battleCharacterId: healTarget.battleID,
                      effectType: effect.effectType as StatusType,
                      ammount: effect.amount ?? 0,
                      remainingTurns: effect.remainingTurns ?? 0,
                      sourceCharacterId: source.battleID
                    });
                  }
                  showToast(t("playerPage.skills.regenerationApplied", { turns: effect.remainingTurns }));
                }
              }

              resolveHeal();
            }, { theme: "blue-green-metal" });
          });

          resolveTest();
        },
        { theme: "blue-green-metal" }
      );
    });
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
    let targetStance: Stance | null = metadata.changesStanceTo ?? null;

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
      const stanceKey = targetStance.toLowerCase() as "offensive" | "defensive" | "virtuous";
      showToast(t("playerPage.skills.stanceChanged", { stance: t(`combatAdmin.stances.${stanceKey}`) }));

      // Maelle: Grant +1 MP when changing to a new stance (not null)
      // Skip if skill already refills MP (Last Chance) to avoid overwriting with stale value
      if (targetStance !== source.stance && !metadata.refillsMP) {
        const currentMp = (source.magicPoints ?? 0) - (isGradientSkill ? 0 : skillCost);
        const maxMp = source.maxMagicPoints ?? 99;
        const newMp = Math.min(currentMp + 1, maxMp);
        await APIBattle.updateCharacterMp(source.battleID, newMp);
        showToast(t("playerPage.skills.stanceChangeMpBonus"));
      }
    }
  }

  // === MONOCO: Heal HP% at Caster/Almighty Mask (Pelerin Heal) ===
  if (metadata.healsHpPercentAtCasterMask) {
    const allies = allCharacters.filter(c => c.isEnemy === source.isEnemy && c.healthPoints > 0);
    await healHpPercentAtCasterMask(source, allies, metadata.healsHpPercentAtCasterMask, showToast);
  }

  // === MONOCO: Grant MP at Caster/Almighty Mask (Orphelin Cheers) ===
  if (metadata.grantsMpAtCasterMask) {
    const targetChars = finalTargetIds
      .map(id => allCharacters.find(c => c.battleID === id))
      .filter((c): c is BattleCharacterInfo => c !== undefined);
    await grantMpAtCasterMask(source, targetChars, metadata.grantsMpAtCasterMask, showToast);
  }

  // === MONOCO: Grant MP at Heavy/Almighty Mask (Cruler Barrier) ===
  if (metadata.grantsMpAtHeavyMask) {
    const targetChars = finalTargetIds
      .map(id => allCharacters.find(c => c.battleID === id))
      .filter((c): c is BattleCharacterInfo => c !== undefined);
    await grantMpAtHeavyMask(source, targetChars, metadata.grantsMpAtHeavyMask, showToast);
  }

  // === MONOCO: Advance Bestial Wheel for utility skills ===
  if (metadata.bestialWheelAdvance) {
    await advanceBestialWheel(source, metadata.bestialWheelAdvance, showToast);
  }

  // === SCIEL: Cleanse and copy buffs (Dark Cleansing) ===
  if (metadata.cleansesAndCopiesBuffs) {
    await cleansesAndCopiesBuffs(target, allCharacters, source, showToast);
  }

  // === SCIEL: Grant MP to ally (Intervention) ===
  if (metadata.grantsMP) {
    await grantMpToAlly(target, metadata.grantsMP, showToast);
  }

  // === SCIEL: Grant immediate turn to ally (Intervention) ===
  if (metadata.grantsImmediateTurn) {
    await APIBattle.grantExtraTurn(target.battleID);
    showToast(t("playerPage.skills.extraTurnGranted", { name: target.name }));
  }

  // === Handle Heal effects (Tree of Life, Healing Light) ===
  const healEffects = resolved.effects.filter(e => e.effectType === "Heal");
  for (const effect of healEffects) {
    const targetChar = allCharacters.find(c => c.battleID === effect.targetBattleId);
    if (targetChar) {
      const maxHp = targetChar.maxHealthPoints;
      const healAmount = Math.floor(maxHp * (effect.amount / 100));
      await APIBattle.heal(effect.targetBattleId, healAmount);
      showToast(t("playerPage.skills.healedFor", { amount: healAmount }));
    }
  }

  // === LUNE: Gain stains after utility skill ===
  if (metadata.gainsStains) {
    await gainStains(source, metadata.gainsStains, showToast, currentStainSlots);
  }
}
