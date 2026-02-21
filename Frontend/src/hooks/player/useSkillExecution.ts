import { useCallback, useRef } from "react";
import { t } from "../../i18n";
import { APIBattle } from "../../api/APIBattle";
import type { BattleCharacterInfo, Element, Stance, StainType } from "../../api/ResponseModel";
import { SkillEffectsRegistry, type SkillEffect } from "../../data/SkillEffectsRegistry";
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
  gainStainOnCrit,
  transformFireToLight,
  type StainSlots
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
  gainRandomPerfection
} from "./skillExecution/perfectionEffects";
import { calculateWeaponAgilityBonus } from "../../utils/WeaponCalculator";
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
  healAlliesPerHit,
  applyRandomBuffsWithMaskBonus,
  grantMpToAllAlliesWithMaskBonus,
  forceAlmightyMask,
  switchToAlmightyIfMarked,
  getDamageEscalationStacks,
  calculateEscalationBonus,
  incrementDamageEscalation
} from "./skillExecution/bestialWheelEffects";
import {
  consumeForetell,
  consumeForetellPerHit,
  calculateForetellDamageBonus,
  calculateForetellHealBonus,
  getForetellPerHitBonus,
  consumeForetellFromAllEnemies,
  grantMpFromForetell,
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

      const { source, skillCost, isGradientSkill, skillType } = validation;
      const resolved = resolveSkill(skillId, source!, target, player.fightInfo?.characters ?? []);
      const actualHitCount = resolved.hitCount;

      // === VERSO: Charging skills (Steeled Strike) ===
      if (resolved.metadata.requiresOneTurnDelay) {
        const hasCharging = source!.status?.some(s => s.effectName === "Charging") ?? false;
        if (!hasCharging) {
          // First use: Consume MP and enter charging state
          if (skillCost! > 0 && !isGradientSkill) {
            const currentMp = source!.magicPoints ?? 0;
            await APIBattle.updateCharacterMp(source!.battleID, currentMp - skillCost!);
          }
          await APIBattle.addStatus({
            battleCharacterId: source!.battleID,
            effectType: "Charging",
            ammount: 0,
            remainingTurns: 1,
            sourceCharacterId: source!.battleID
          });
          showToastRef.current(t("playerPage.skills.chargingStarted"));
          resetState();
          return;
        } else {
          // Second use: Remove charging status and execute
          await APIBattle.removeStatus(source!.battleID, "Charging");
          showToastRef.current(t("playerPage.skills.chargingReleased"));
        }
      }

      if (actualHitCount > 0 || resolved.metadata.hitsMatchConsumedStains) {
        setIsExecutingSkill(true);
        await executeAttackHits(skillId, source!, target, resolved, skillCost!, isGradientSkill!, actualHitCount, skillType);
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
          showToast: showToastRef.current,
          skillType
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
    actualHitCount: number,
    skillType?: string
  ) {
    let hitIndex = 0;

    // Randomize hit count for variable-hit skills (Thunderfall: 2-6 hits)
    let totalHits = actualHitCount;
    if (resolved.metadata.minHits !== undefined && resolved.metadata.maxHits !== undefined) {
      totalHits = resolved.metadata.minHits + Math.floor(Math.random() * (resolved.metadata.maxHits - resolved.metadata.minHits + 1));
      showToastRef.current(t("playerPage.skills.randomHitCount", { hits: totalHits }));
    }

    // === VERSO: Plays a second time (Blitz) ===
    if (resolved.metadata.playsSecondTime) {
      totalHits *= 2;
      showToastRef.current(t("playerPage.skills.playsSecondTime"));
    }

    // Determine element
    const weaponElement = weaponInfo?.details?.attributes?.element;
    let skillElement = determineSkillElement(resolved, weaponInfo);
    logElementConfiguration(skillId, resolved, weaponElement, skillElement);

    // === LUNE: Consume stains before attack ===
    let stainsConsumed = 0;
    let consumedStainTypes: StainType[] = [];
    let currentStainSlots: StainSlots | undefined;
    let stainEffects = { damageBonus: 0, shouldGrantSecondTurn: false, shouldDoublesDamage: false, shouldGrantRegeneration: false, dotDuration: null as number | null, determinedElement: null as Element | null, canBreak: false };
    if (resolved.metadata.consumesStains) {
      const noDamageBonus = resolved.metadata.noStainDamageBonus || resolved.metadata.consumeStainsForFreeCast;
      const result = await consumeStains(source, resolved.metadata.consumesStains, showToastRef.current, noDamageBonus);
      stainsConsumed = result.consumed;
      consumedStainTypes = result.consumedTypes;
      currentStainSlots = result.slots;
      stainEffects = processStainEffects(source, resolved.metadata, stainsConsumed);
    } else if (resolved.metadata.stainDeterminedElement) {
      stainEffects = processStainEffects(source, resolved.metadata, 0);
    }

    // Override element if stain-determined (Sky Break)
    if (stainEffects.determinedElement) {
      skillElement = stainEffects.determinedElement;
    }

    // === LUNE: Dynamic hit count from consumed stains (Mayhem) ===
    if (resolved.metadata.hitsMatchConsumedStains && consumedStainTypes.length > 0) {
      totalHits = consumedStainTypes.length;
      showToastRef.current(t("playerPage.skills.randomHitCount", { hits: totalHits }));
    }

    // === LUNE: Transform Fire stain to Light (Electrify) ===
    if (resolved.metadata.transformsStainToLight) {
      const transformResult = await transformFireToLight(source, showToastRef.current, currentStainSlots);
      currentStainSlots = transformResult;
    }

    // === VERSO: Deduct HP cost before attack (Defiant Strike, Poignee Forte) ===
    if (resolved.metadata.costsHpPercent) {
      await deductHpCost(source, resolved.metadata.costsHpPercent, showToastRef.current);
    }

    // === VERSO: Deduct dice HP cost before attack (Defiant Strike) ===
    if (resolved.metadata.costsHpDice) {
      await new Promise<void>((resolve) => {
        rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, resolved.metadata.costsHpDice!, async (result) => {
          const hpCost = diceTotal(result);
          const currentHp = source.healthPoints ?? 1;
          const newHp = Math.max(1, currentHp - hpCost);
          await APIBattle.updateCharacterHp(source.battleID, newHp);
          showToastRef.current(t("playerPage.skills.hpCostDeducted", { amount: hpCost }));
          resolve();
        });
      });
    }

    // === VERSO: Calculate rank bonuses ===
    const rankBonuses = calculateRankBonuses(source, resolved.metadata);
    if (rankBonuses.damageBonus > 0) {
      console.log("=== Rank Damage Bonus ===");
      console.log("Rank:", source.perfectionRank, "| Bonus:", `+${rankBonuses.damageBonus}`);
    }

    // === MONOCO: Calculate mask bonuses ===
    const maskBonuses = calculateMaskBonuses(source, resolved.metadata);

    // === MONOCO: Damage escalation bonus (Lampmaster Light) ===
    let escalationBonus = 0;
    if (resolved.metadata.damageEscalatesPerUse) {
      const stacks = getDamageEscalationStacks(source);
      escalationBonus = calculateEscalationBonus(stacks);
      if (escalationBonus > 0) {
        showToastRef.current(t("playerPage.skills.damageEscalationActive", { bonus: escalationBonus }));
      }
    }

    // === VERSO: Linear damage escalation (Ascending Assault) ===
    // 1st use: no bonus | 2nd: +2 | 3rd: +3 | 4th: +4 | etc.
    if (resolved.metadata.damageEscalatesLinear) {
      const stacks = getDamageEscalationStacks(source);
      escalationBonus = stacks >= 1 ? stacks + 1 : 0;
      if (escalationBonus > 0) {
        showToastRef.current(t("playerPage.skills.damageEscalationLinear", { bonus: escalationBonus }));
      }
    }

    // === MONOCO: Calculate bestial wheel advance ===
    let wheelAdvance = resolved.metadata.bestialWheelAdvance;
    if (resolved.metadata.forceAlmightyMask) {
      // For gradient skills with forceAlmightyMask, send any positive value - backend sets to 0 for gradient
      wheelAdvance = 1;
    } else if (resolved.metadata.switchToAlmightyIfMarked) {
      const targetHasMarked = target.status?.some(s => s.effectName === "Marked") ?? false;
      if (targetHasMarked) {
        // Calculate advance to reach position 0 (Almighty)
        const currentPos = source.bestialWheelPosition ?? 0;
        wheelAdvance = currentPos === 0 ? 9 : (9 - currentPos);
      }
    }

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
      // Grant +1 MP per Foretell consumed
      await grantMpFromForetell(source, allEnemiesForetellBonus, showToastRef.current);
      // Track total Foretell consumed in battle (for End Slice)
      await APIBattle.incrementForetellConsumed(source.battleID, allEnemiesForetellBonus);
    }

    // === SCIEL: Consume Foretell from target before attack (Twilight Slash, etc.) ===
    let foretellConsumedBonus = 0;
    let foretellConsumedCount = 0;
    if (resolved.metadata.consumesForetell) {
      foretellConsumedCount = await consumeForetell(target, showToastRef.current);
      foretellConsumedBonus = calculateForetellDamageBonus(foretellConsumedCount, resolved.metadata.foretellDamageBonus);
      if (foretellConsumedBonus > 0) {
        showToastRef.current(t("playerPage.skills.foretellDamageBonus", { bonus: foretellConsumedBonus }));
      }
      // Grant +1 MP per Foretell consumed
      await grantMpFromForetell(source, foretellConsumedCount, showToastRef.current);
      // Track total Foretell consumed in battle (for End Slice)
      await APIBattle.incrementForetellConsumed(source.battleID, foretellConsumedCount);
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

    // === SCIEL: Foretell consumed total bonus (End Slice: +1 per Foretell consumed since battle start) ===
    let foretellConsumedTotalBonus = 0;
    if (resolved.metadata.usesForetellConsumedTotal) {
      foretellConsumedTotalBonus = source.foretellConsumedTotal ?? 0;
      if (foretellConsumedTotalBonus > 0) {
        showToastRef.current(t("playerPage.skills.foretellConsumedTotalBonus", { bonus: foretellConsumedTotalBonus }));
      }
    }

    // Calculate Sun/Moon charge bonus (+1 damage per matching charge)
    let sunMoonChargeBonus = 0;
    if (skillType === "sun") {
      sunMoonChargeBonus = source.sunCharges ?? 0;
      if (sunMoonChargeBonus > 0) {
        showToastRef.current(t("playerPage.skills.sunMoonChargeBonus", { charges: sunMoonChargeBonus, bonus: sunMoonChargeBonus }));
      }
    } else if (skillType === "moon") {
      sunMoonChargeBonus = source.moonCharges ?? 0;
      if (sunMoonChargeBonus > 0) {
        showToastRef.current(t("playerPage.skills.sunMoonChargeBonus", { charges: sunMoonChargeBonus, bonus: sunMoonChargeBonus }));
      }
    }

    // Calculate Twilight damage bonus (+2 per Twilight ammount)
    let twilightBonus = 0;
    const twilightStatus = source.status?.find(s => s.effectName === "Twilight");
    if (twilightStatus && twilightStatus.ammount) {
      twilightBonus = twilightStatus.ammount * 2;
      if (twilightBonus > 0) {
        showToastRef.current(t("playerPage.skills.twilightDamageBonus", { bonus: twilightBonus, charges: twilightStatus.ammount }));
      }
    }

    // Calculate hits received bonus (Revenge, Payback: +2 damage per hit received)
    let hitsReceivedBonus = 0;
    if (resolved.metadata.damageScalesWithHitsReceived) {
      const hitsReceived = source.hitsTakenThisTurn ?? 0;
      hitsReceivedBonus = hitsReceived * 2;  // +2 damage per hit taken
      console.log("=== Hits Received Bonus ===");
      console.log("Hits taken this turn:", hitsReceived);
      console.log("Damage bonus:", hitsReceivedBonus);
      if (hitsReceivedBonus > 0) {
        showToastRef.current(t("playerPage.skills.hitsReceivedBonus", { hits: hitsReceived, bonus: hitsReceivedBonus }));
      }
    }

    // === VERSO: Free Aim shot bonus (Sequência) — fetches fresh data to avoid stale state ===
    let freeAimBonus = 0;
    if (resolved.metadata.scalesWithFreeAimShots && player?.fightInfo?.battleId) {
      const freshBattle = await APIBattle.getById(player.fightInfo.battleId);
      const freshSource = freshBattle.characters?.find(c => c.battleID === source.battleID);
      const stacks = freshSource?.status?.find(s => s.effectName === "free-shot")?.ammount ?? 0;
      freeAimBonus = Math.min(stacks, 10);
      if (freeAimBonus > 0) {
        showToastRef.current(t("playerPage.skills.freeAimBonus", { stacks: freeAimBonus }));
      }
    }

    // Execute hits
    let totalDamageDealt = 0;
    let foretellPerHitConsumedTotal = 0;
    let totalCritHits = 0;
    const damageDealtPerTarget: Record<number, number> = {};
    while (hitIndex < totalHits) {
      await new Promise<void>((resolvePromise) => {
        rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, rollCommandForAttack(weaponInfo, "basic"), async (result) => {
          let { baseDamage, hasCritical } = calculateHitDamage(result, player, weaponInfo, resolved);
          const chargeIncrease = calculateChargeIncrease(resolved, hasCritical);

          // === LUNE: Per-hit element (Elemental Genesis = random, Elemental Trick = cycle, Mayhem = consumed stain) ===
          let hitElement = skillElement;
          if (resolved.metadata.hitsMatchConsumedStains && hitIndex < consumedStainTypes.length) {
            const stainType = consumedStainTypes[hitIndex];
            if (stainType === "Light") {
              hitElement = getRandomElement(["Lightning", "Earth", "Fire", "Ice"] as Element[]);
            } else {
              hitElement = stainType as Element;
            }
          } else if (resolved.metadata.randomElementPerHit && resolved.metadata.randomElements) {
            hitElement = getRandomElement(resolved.metadata.randomElements as Element[]);
          } else if (resolved.metadata.gainsStainOnCrit) {
            const stainCycle: Element[] = ["Lightning", "Earth", "Fire", "Ice"];
            hitElement = stainCycle[hitIndex % stainCycle.length];
          }

          // === LUNE: Critical hit triggers extra hit (Electrify, Thunderfall, Lightning Dance) ===
          if (hasCritical && resolved.metadata.critTriggersExtraHit) {
            totalHits++;
            showToastRef.current(t("playerPage.skills.critExtraHit"));
          }

          // Increased critical damage (Sword Ballet: +4 per crit)
          if (hasCritical && resolved.metadata.increasedCritDamage) {
            baseDamage = baseDamage + resolved.metadata.increasedCritDamage;
            showToastRef.current(t("playerPage.skills.increasedCritDamage", { bonus: resolved.metadata.increasedCritDamage }));
          }

          // === SCIEL: Fortune's Fury bonus (+8 per hit) ===
          const fortunesFuryBonus = hasStatus(source, "FortunesFury") ? 8 : 0;

          // Add charge bonus, hits received bonus, foretell bonus, sun/moon bonus, twilight bonus and fortune's fury to damage
          const totalDamage = baseDamage + chargeBonus + hitsReceivedBonus + foretellConsumedBonus + sunMoonChargeBonus + foretellConsumedTotalBonus + twilightBonus + fortunesFuryBonus;

          // Log all bonuses applied to damage
          console.log("=== Skill Damage Bonuses ===");
          console.log("Base Damage (from dice):", baseDamage);
          if (chargeBonus > 0) console.log("Charge Bonus:", `+${chargeBonus}`);
          if (hitsReceivedBonus > 0) console.log("Hits Received Bonus:", `+${hitsReceivedBonus}`);
          if (foretellConsumedBonus > 0) console.log("Foretell Bonus:", `+${foretellConsumedBonus} (${foretellConsumedCount} stacks x ${resolved.metadata.foretellDamageBonus ?? 2})`);
          if (sunMoonChargeBonus > 0) console.log(`${skillType === "sun" ? "Sun" : "Moon"} Charge Bonus:`, `+${sunMoonChargeBonus}`);
          if (foretellConsumedTotalBonus > 0) console.log("Foretell Consumed Total Bonus:", `+${foretellConsumedTotalBonus}`);
          if (twilightBonus > 0) console.log("Twilight Bonus:", `+${twilightBonus} (${twilightStatus?.ammount} charges x 2)`);
          if (fortunesFuryBonus > 0) console.log("Fortune's Fury:", `+${fortunesFuryBonus}`);
          console.log("Total Damage (before target bonuses):", totalDamage);

          // Process each target
          // For random targetScope, pick a random alive enemy each hit (accounting for damage dealt this execution)
          let hitTargetIds = resolved.targetIds;
          if (resolved.metadata.targetScope === "random") {
            const allChars = player?.fightInfo?.characters ?? [];
            const aliveEnemies = allChars.filter(c => {
              if (c.isEnemy === source.isEnemy) return false;
              const remainingHp = c.healthPoints - (damageDealtPerTarget[c.battleID] ?? 0);
              return remainingHp > 0;
            });
            if (aliveEnemies.length > 0) {
              const randomEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
              hitTargetIds = [randomEnemy.battleID];
            }
          }

          for (let targetIndex = 0; targetIndex < hitTargetIds.length; targetIndex++) {
            const targetId = hitTargetIds[targetIndex];
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
            let foretellPerHitBonus = 0;
            if (resolved.metadata.consumesForetellPerHit && targetChar) {
              const hadForetell = await consumeForetellPerHit(targetChar);
              foretellPerHitBonus = getForetellPerHitBonus(hadForetell, resolved.metadata.foretellPerHitBonus);
              if (hadForetell) foretellPerHitConsumedTotal++;
            }

            // === MONOCO: Shield stack bonus (Chevaliere Piercing) ===
            let shieldStackBonus = 0;
            if (resolved.metadata.damagePerShieldStack && targetChar) {
              shieldStackBonus = calculateShieldStackBonus(targetChar, resolved.metadata.damagePerShieldStack);
            }

            // === MONOCO: Low HP damage scaling (Cultist Slashes) ===
            let lowHpBonus = 0;
            if (resolved.metadata.damageScalesWithLowHp) {
              lowHpBonus = calculateLowHpDamageBonus(source);
            }

            // === MONOCO: Bonus vs burning (Danseuse Waltz) ===
            let burningTargetBonus = 0;
            if (resolved.metadata.bonusDamageVsBurning && targetChar && hasBurningBonus(targetChar)) {
              burningTargetBonus = 4; // +4 flat vs burning
            }

            // === Flat bonus damage vs stunned (Arauto do Fim / Mighty Strike) ===
            let stunnedBonus = 0;
            if (targetChar && shouldDoubleDamageVsStunned(targetChar, resolved.metadata)) {
              stunnedBonus = resolved.metadata.plusDamageVsStunned!;
            }

            // === MONOCO: Bonus vs powerless (Obscur Sword) ===
            let powerlessBonus = 0;
            if (resolved.metadata.bonusDamageVsPowerless && targetChar && hasPowerlessBonus(targetChar)) {
              powerlessBonus = 4; // +4 flat vs powerless
            }

            // === VERSO: Hability + Agility bonus per hit (Explosão de Velocidade) ===
            let speedBonus = 0;
            if (resolved.metadata.addsAgilityBonus) {
              speedBonus = (player!.playerSheet?.hability ?? 0) + calculateWeaponAgilityBonus(weaponInfo);
            }

            // Calculate final damage with all flat bonuses
            const damageWithBonus = totalDamage + markedBonus + burnBonus + burnScalingBonus +
              shieldStackBonus + burningTargetBonus + powerlessBonus + speedBonus +
              sacrificeBonus + drainedHpBonus + allEnemiesForetellBonus +
              stainEffects.damageBonus + rankBonuses.damageBonus + maskBonuses.damageBonus +
              foretellPerHitBonus + lowHpBonus + stunnedBonus + escalationBonus + freeAimBonus;

            // Log all bonuses applied
            const allBonuses: [string, number][] = [
              ["Marked", markedBonus], ["Burn Consumption", burnBonus], ["Burn Scaling", burnScalingBonus],
              ["Shield Stack", shieldStackBonus], ["Burning Target", burningTargetBonus],
              ["Powerless", powerlessBonus], ["Agility", speedBonus], ["Free Aim", freeAimBonus],
              ["Sacrifice", sacrificeBonus], ["Drained HP", drainedHpBonus],
              ["All Enemies Foretell", allEnemiesForetellBonus],
              ["Stain", stainEffects.damageBonus], ["Rank", rankBonuses.damageBonus],
              ["Mask", maskBonuses.damageBonus], ["Foretell Per-Hit", foretellPerHitBonus],
              ["Low HP", lowHpBonus], ["Stunned", stunnedBonus], ["Escalation", escalationBonus],
            ];
            const activeBonuses = allBonuses.filter(([, v]) => v !== 0);
            if (activeBonuses.length > 0) {
              console.log("=== Additional Damage Bonuses ===");
              console.log("Target:", targetChar?.name ?? targetId);
              for (const [label, value] of activeBonuses) {
                console.log(`${label} Bonus:`, `+${value}`);
              }
              console.log("Final Damage (before element/defense):", damageWithBonus);
            }

            if (isNpcTarget && targetChar) {
              const { damageWithElement, elementMod } = applyElementModifier(damageWithBonus, targetChar, hitElement);
              logElementVsNpc(targetChar, hitElement, elementMod, damageWithBonus, damageWithElement);
              if (targetIndex === 0) showToastRef.current(`Total: ${damageWithElement}`);

              const finalDamage = calculateFinalDamage(targetChar, damageWithElement);
              totalDamageDealt += finalDamage;
              damageDealtPerTarget[targetId] = (damageDealtPerTarget[targetId] ?? 0) + finalDamage;

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
                totalHits: totalHits,
                chargeIncrease,
                consumesCharge: shouldConsumeCharge,
                consumesBurn: burnToConsume > 0 ? burnToConsume : undefined,
                targetIndex,
                skillType,
                bestialWheelAdvance: wheelAdvance,
                ignoresShields: resolved.metadata.ignoresShields
              });

              await APIBattle.attack(attackRequest);
              // Grant +1 perfection per hit on enemy
              if (finalDamage > 0) {
                await APIBattle.addPerfectionPoints(source.battleID, 1);
              }
            } else {
              if (targetIndex === 0) showToastRef.current(`Total: ${damageWithBonus}`);
              totalDamageDealt += damageWithBonus;
              damageDealtPerTarget[targetId] = (damageDealtPerTarget[targetId] ?? 0) + damageWithBonus;
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
                totalHits: totalHits,
                chargeIncrease,
                consumesCharge: shouldConsumeCharge,
                consumesBurn: burnToConsume > 0 ? burnToConsume : undefined,
                targetIndex,
                skillType,
                bestialWheelAdvance: wheelAdvance,
                ignoresShields: resolved.metadata.ignoresShields
              });

              await APIBattle.attack(attackRequest);
            }

            // === SCIEL: Apply Foretell on critical hit (Spectral Sweep) ===
            if (hasCritical && resolved.metadata.appliesForetellOnCrit && targetChar) {
              await applyForetellOnCrit(targetChar, source, resolved.metadata.appliesForetellOnCrit, showToastRef.current);
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

          // === LUNE: Gain stain on critical hit (Elemental Trick) ===
          if (hasCritical && resolved.metadata.gainsStainOnCrit && hitElement) {
            await gainStainOnCrit(source, hitElement, showToastRef.current);
          }

          if (hasCritical) totalCritHits++;
          hitIndex++;
          resolvePromise();
        }, { theme: "dice-of-rolling" });
      });
    }

    // === SCIEL: Grant MP for per-hit Foretell consumed (Sealed Fate) ===
    if (foretellPerHitConsumedTotal > 0) {
      await grantMpFromForetell(source, foretellPerHitConsumedTotal, showToastRef.current);
      // Track total Foretell consumed in battle (for End Slice)
      await APIBattle.incrementForetellConsumed(source.battleID, foretellPerHitConsumedTotal);
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

    // === SCIEL: Increment Sun/Moon charge for attack skills ===
    if (skillType) {
      const hasTwilight = source.status?.some(s => s.effectName === "Twilight") ?? false;
      if (!hasTwilight) {
        const result = await APIBattle.incrementSunMoonCharge(source.battleID, skillType);
        if (result.twilightActivated) {
          showToastRef.current(t("playerPage.skills.twilightActivated", { charges: result.twilightCharges }));
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

    // === LUNE: Grant MP if target is Burning (Thermal Transfer) ===
    if (resolved.metadata.grantsMpIfTargetBurning) {
      const isBurning = hasStatus(target, "Burning");
      console.log("=== Thermal Transfer Burning Check ===");
      console.log("Target:", target.name, "Status:", target.status?.map(s => s.effectName));
      console.log("Is Burning:", isBurning);
      console.log("grantsMpIfTargetBurning:", resolved.metadata.grantsMpIfTargetBurning);
      if (isBurning) {
        const mpGain = resolved.metadata.grantsMpIfTargetBurning;
        const currentMp = (source.magicPoints ?? 0) - skillCost;
        const maxMp = source.maxMagicPoints ?? 99;
        const newMp = Math.min(currentMp + mpGain, maxMp);
        await APIBattle.updateCharacterMp(source.battleID, newMp);
        showToastRef.current(t("playerPage.skills.mpGainedFromBurning", { amount: mpGain }));
      }
    }

    // Handle stance change after attack with special conditions
    // Rule: If skill doesn't say "changes to stance X" or "maintains stance", stance is lost
    if (!resolved.metadata.maintainsStance) {
      // Determine target stance (default to null = lose stance)
      let targetStance: Stance | null = resolved.metadata.changesStanceTo ?? null;

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
        // Skip if skill already refills MP (Last Chance) to avoid overwriting with stale value
        if (targetStance !== source.stance && !resolved.metadata.refillsMP) {
          const currentMp = (source.magicPoints ?? 0) - (isGradientSkill ? 0 : skillCost);
          const maxMp = source.maxMagicPoints ?? 99;
          const newMp = Math.min(currentMp + 1, maxMp);
          await APIBattle.updateCharacterMp(source.battleID, newMp);
          showToastRef.current(t("playerPage.skills.stanceChangeMpBonus"));
        }
      }
    }

    // === LUNE: Gain stains after attack ===
    if (resolved.metadata.gainsStains) {
      await gainStains(source, resolved.metadata.gainsStains, showToastRef.current, currentStainSlots);
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

    // === SCIEL: Post-attack Foretell effects (Harvest heal, Plentiful Harvest MP) ===
    if (resolved.metadata.consumesForetell) {
      // Apply heal with dice roll (Harvest, Grim Harvest)
      if (resolved.metadata.healWithRoll) {
        const foretellBonus = resolved.metadata.foretellHealBonus
          ? calculateForetellHealBonus(foretellConsumedCount, resolved.metadata.foretellHealBonus)
          : 0;
        const healTarget = resolved.metadata.healWithRoll.healTarget ?? "self";

        await new Promise<void>((resolveHeal) => {
          rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, resolved.metadata.healWithRoll!.dice, async (healResult) => {
            const healDiceTotal = diceTotal(healResult);

            let baseStat = 0;
            if (resolved.metadata.healWithRoll!.baseStat === "resistance") {
              baseStat = player?.playerSheet?.resistance ?? 0;
            } else if (resolved.metadata.healWithRoll!.baseStat === "power") {
              baseStat = player?.playerSheet?.power ?? 0;
            }

            const totalHeal = baseStat + healDiceTotal + foretellBonus;

            if (foretellBonus > 0) {
              showToastRef.current(t("playerPage.skills.foretellHealBonus", { bonus: foretellBonus }));
            }

            if (healTarget === "all-allies") {
              const allies = (player?.fightInfo?.characters ?? []).filter(
                c => c.isEnemy === source.isEnemy && c.healthPoints > 0
              );
              for (const ally of allies) {
                await APIBattle.heal(ally.battleID, totalHeal);
              }
              showToastRef.current(t("playerPage.skills.allAlliesHealedFor", { amount: totalHeal }));
            } else {
              await APIBattle.heal(source.battleID, totalHeal);
              showToastRef.current(t("playerPage.skills.healedFor", { amount: totalHeal }));
            }

            resolveHeal();
          }, { theme: "blue-green-metal" });
        });
      }

      // Grant MP per foretell consumed (Plentiful Harvest)
      if (resolved.metadata.grantsMpPerForetell) {
        await grantMpPerForetell(
          source,
          player?.fightInfo?.characters ?? [],
          foretellConsumedCount,
          resolved.metadata.grantsMpPerForetell,
          showToastRef.current
        );
      }
    }

    // === SCIEL: Propagate burn damage (Searing Bond) ===
    if (resolved.metadata.propagatesBurnDamage) {
      // Get Foretell amount from primaryEffects to propagate the same amount
      const foretellEffect = resolved.metadata.primaryEffects.find((e: SkillEffect) => e.effectType === "Foretell");
      const foretellAmount = foretellEffect?.amount ?? 1;
      await propagateBurnDamage(
        target,
        player?.fightInfo?.characters ?? [],
        source,
        totalDamageDealt,
        50, // 50% propagation
        foretellAmount,
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

    // === VERSO: Grant perfection per critical hit (Strike Storm) ===
    if (resolved.metadata.perfectionOnCritPerHit && totalCritHits > 0) {
      const critPoints = totalCritHits * resolved.metadata.perfectionOnCritPerHit;
      await grantPerfectionPoints(source, critPoints, false, undefined, () => {});
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
        totalHits,
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

    // === VERSO: Grant MP from rank bonus (Light Holder at A Rank) ===
    if (rankBonuses.grantsMp > 0) {
      const currentMp = (source.magicPoints ?? 0) - (isGradientSkill ? 0 : skillCost);
      const maxMp = source.maxMagicPoints ?? 99;
      const newMp = Math.min(currentMp + rankBonuses.grantsMp, maxMp);
      await APIBattle.updateCharacterMp(source.battleID, newMp);
      showToastRef.current(t("playerPage.skills.rankGrantedMp", { mp: rankBonuses.grantsMp }));
    }

    // === VERSO: Reapply Stun (End Bringer at A Rank) ===
    // Uses stale player state (pre-execution) to preserve original turns and add +1
    if (rankBonuses.canReapplyStun) {
      for (const targetId of resolved.targetIds) {
        const targetChar = (player?.fightInfo?.characters ?? []).find(
          (c: BattleCharacterInfo) => c.battleID === targetId
        );
        const existingStun = targetChar?.status?.find(s => s.effectName === "Stunned");
        if (existingStun) {
          const newTurns = (existingStun.remainingTurns ?? 1) + 1;
          await APIBattle.removeStatus(targetId, "Stunned");
          await APIBattle.addStatus({
            battleCharacterId: targetId,
            effectType: "Stunned",
            ammount: 0,
            remainingTurns: newTurns,
            sourceCharacterId: source.battleID
          });
          showToastRef.current(t("playerPage.skills.stunReapplied", { name: targetChar?.name ?? "" }));
        }
      }
    }

    // === VERSO: Transfer all status to self (Burden) ===
    if (resolved.metadata.transfersAllStatusToSelf) {
      await transferAllStatusToSelf(source, player?.fightInfo?.characters ?? [], showToastRef.current);
    }

    // === MONOCO: Heal per hit (Sapling Absorption) ===
    if (resolved.metadata.healsHpPercentPerHit) {
      await applyHealPerHit(source, resolved.metadata.healsHpPercentPerHit, totalHits, showToastRef.current);
    }

    // === MONOCO: Heal all allies per hit (Contorsionniste Blast) ===
    if (resolved.metadata.healsAlliesHpPercentPerHit) {
      await healAlliesPerHit(source, player?.fightInfo?.characters ?? [], resolved.metadata.healsAlliesHpPercentPerHit, totalHits, showToastRef.current);
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

    // === MONOCO: Force Almighty Mask (Mighty Strike gradient) ===
    if (resolved.metadata.forceAlmightyMask) {
      await forceAlmightyMask(source, showToastRef.current);
    }

    // === MONOCO: Switch to Almighty if target is Marked (Benisseur Mortar) ===
    if (resolved.metadata.switchToAlmightyIfMarked) {
      await switchToAlmightyIfMarked(source, target, showToastRef.current);
    }

    // === MONOCO: Track damage escalation (Lampmaster Light) ===
    if (resolved.metadata.damageEscalatesPerUse) {
      await incrementDamageEscalation(source, 5, showToastRef.current);
    }

    // === VERSO: Track linear damage escalation (Ascending Assault) ===
    if (resolved.metadata.damageEscalatesLinear) {
      await incrementDamageEscalation(source, 99, () => {});
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
    if (skillMetadata.targetScope === "all") {
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

    // Auto-execute random-target skills (no target selection needed)
    if (skillMetadata.targetScope === "random") {
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

    // Auto-execute skills that target all enemies, all allies, and/or revive dead allies (Phoenix Flame, All Set)
    if (skillMetadata.targetScope === "all-enemies" || skillMetadata.targetScope === "all-allies" || skillMetadata.revivesDeadAllies) {
      setPendingSkillId(skillId);
      setTab("combate");
      setIsUsingSkillMode(false);
      if (skillMetadata.targetScope === "all-allies") {
        setCombatTab(currentCharacter?.isEnemy ? "enemies" : "team");
      }
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
