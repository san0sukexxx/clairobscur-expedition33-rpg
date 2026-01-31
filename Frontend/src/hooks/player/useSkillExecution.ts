import { useState, useRef, useCallback, type Dispatch, type SetStateAction, type RefObject, type MutableRefObject } from "react";
import { t } from "../../i18n";
import { APIBattle, type CreateAttackRequest, type AttackStatusEffectRequest } from "../../api/APIBattle";
import type { GetPlayerResponse } from "../../api/APIPlayer";
import type { WeaponInfo, BattleCharacterInfo, StainType, StatusType } from "../../api/ResponseModel";
import type { DiceBoardRef } from "../../components/DiceBoard";
import { SkillEffectsRegistry } from "../../data/SkillEffectsRegistry";
import { getEnrichedCharacterSkills, getSkillById } from "../../utils/SkillUtils";
import { resolveSkill, calculateSkillHitDamage, applySpecialEffects, getStatusEffectsForTarget } from "../../utils/BattleSkillUtils";
import { executeAllSpecialMechanics } from "../../utils/SkillSpecialMechanics";
import { getVersoPerfectionDamageMultiplier } from "../../utils/BattleUtils";
import { hasRequiredStains, consumeStains, addStains, updateCharacterStains, transformStain, getDominantElement } from "../../utils/StainUtils";
import { translateElementName } from "../../utils/StainTextUtils";
import { triggerOnHealAlly, triggerOnKill } from "../../utils/PictoEffectsIntegration";
import { executeWeaponPassives } from "../../utils/WeaponPassives_Index";
import { rollWithTimeout } from "../../utils/RollUtils";
import {
  rollCommandForAttack,
  calculateRawWeaponPower,
  calculatePlayerCriticalMulti,
  playerHasEmpowered,
  playerHasWeakened
} from "../../utils/PlayerCalculator";
import { calculateFailureDiv, diceTotal, countCriticalRolls } from "../../utils/DiceCalculator";
import { checkForFragile } from "../../utils/NpcCalculator";
import { isMonoco, isVerso } from "../../constants/player/characterIds";
import { BESTIAL_WHEEL_PATTERN, getMaskAtPosition, isCasterOrAlmighty } from "../../constants/player/bestialWheel";
import type { PlayerTab, CombatTabType } from "../../pages/PlayerPage/PlayerPage.types";

interface UseSkillExecutionParams {
  player: GetPlayerResponse | null;
  setPlayer: Dispatch<SetStateAction<GetPlayerResponse | null>>;
  weaponInfo: WeaponInfo;
  diceBoardRef: RefObject<DiceBoardRef>;
  timeoutDiceBoardRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  showToast: (message: string, options?: { duration?: number }) => void;
  checkPlayerLoop: () => Promise<void>;
  setTab: (tab: PlayerTab) => void;
  setCombatTab: Dispatch<SetStateAction<CombatTabType>>;
  setHitCharacters: Dispatch<SetStateAction<Set<number>>>;
}

interface UseSkillExecutionReturn {
  // State
  isExecutingSkill: boolean;
  setIsExecutingSkill: Dispatch<SetStateAction<boolean>>;
  isExecutingMezzoForte: boolean;
  pendingSkillId: string | null;
  setPendingSkillId: Dispatch<SetStateAction<string | null>>;
  isSelectingSkillTarget: boolean;
  setIsSelectingSkillTarget: Dispatch<SetStateAction<boolean>>;
  excludeSelfFromTargeting: boolean;
  setExcludeSelfFromTargeting: Dispatch<SetStateAction<boolean>>;
  lampmasterStacks: number;
  setLampmasterStacks: Dispatch<SetStateAction<number>>;

  // Handlers
  handleUseSkill: (skillId: string) => void;
  handleExecuteSkill: (skillId: string, target: BattleCharacterInfo) => Promise<void>;
}

export function useSkillExecution({
  player,
  setPlayer,
  weaponInfo,
  diceBoardRef,
  timeoutDiceBoardRef,
  showToast,
  checkPlayerLoop,
  setTab,
  setCombatTab,
  setHitCharacters
}: UseSkillExecutionParams): UseSkillExecutionReturn {
  const [isExecutingSkill, setIsExecutingSkill] = useState(false);
  const [isExecutingMezzoForte, setIsExecutingMezzoForte] = useState(false);
  const [pendingSkillId, setPendingSkillId] = useState<string | null>(null);
  const [isSelectingSkillTarget, setIsSelectingSkillTarget] = useState(false);
  const [excludeSelfFromTargeting, setExcludeSelfFromTargeting] = useState(false);
  const [lampmasterStacks, setLampmasterStacks] = useState(0);
  const isExecutingSkillRef = useRef(false);

  const handleUseSkill = useCallback((skillId: string) => {
    const skillMetadata = SkillEffectsRegistry[skillId];

    if (!skillMetadata) {
      showToast(t("playerPage.errors.errorSkillNotFound"));
      return;
    }

    // Special validation for Rebirth
    if (skillId === "lune-rebirth") {
      const currentCharacter = player?.fightInfo?.characters?.find(
        c => c.battleID === player.fightInfo?.playerBattleID
      );

      if (currentCharacter) {
        const deadAllies = player?.fightInfo?.characters?.filter(
          c => c.isEnemy === currentCharacter.isEnemy && c.healthPoints <= 0
        );

        if (!deadAllies || deadAllies.length === 0) {
          showToast(t("skills.noDeadAllies") || "Não há aliados mortos");
          return;
        }
      }
    }

    // Determine target types
    const targetsEnemies =
      skillMetadata.damageLevel !== "none" ||
      skillMetadata.primaryEffects.some(e => e.targetType === "enemy" || e.targetType === "all-enemies") ||
      skillMetadata.conditionalEffects.some(e => e.targetType === "enemy" || e.targetType === "all-enemies");

    const targetsAllies =
      skillMetadata.targetScope === "self" ||
      skillMetadata.targetScope === "ally" ||
      skillMetadata.targetScope === "all-allies" ||
      skillMetadata.primaryEffects.some(e => e.targetType === "self" || e.targetType === "ally" || e.targetType === "all-allies") ||
      skillMetadata.conditionalEffects.some(e => e.targetType === "self" || e.targetType === "ally" || e.targetType === "all-allies");

    const currentCharacter = player?.fightInfo?.characters?.find(
      c => c.battleID === player.fightInfo?.playerBattleID
    );

    // Auto-execute self-targeted utility skills
    if (skillMetadata.targetScope === "self" && skillMetadata.damageLevel === "none" && !targetsEnemies) {
      setPendingSkillId(skillId);
      setTab("combate");
      if (currentCharacter) {
        handleExecuteSkill(skillId, currentCharacter);
      } else {
        showToast(t("playerPage.errors.errorCharacterNotFound"));
      }
      return;
    }

    // Auto-execute all-enemies skills
    if (skillMetadata.targetScope === "all-enemies" && currentCharacter) {
      setPendingSkillId(skillId);
      setTab("combate");
      handleExecuteSkill(skillId, currentCharacter);
      return;
    }

    // Auto-execute all skills
    if (skillMetadata.targetScope === "all" && currentCharacter) {
      const enemies = player?.fightInfo?.characters?.filter(
        c => c.isEnemy !== currentCharacter.isEnemy && c.healthPoints > 0
      );

      if (enemies && enemies.length > 0) {
        setPendingSkillId(skillId);
        setTab("combate");
        handleExecuteSkill(skillId, enemies[0]);
        return;
      } else {
        showToast(t("playerPage.skills.noValidEnemies"));
        return;
      }
    }

    // Auto-execute all-allies skills
    if (skillMetadata.targetScope === "all-allies" && currentCharacter) {
      setPendingSkillId(skillId);
      setTab("combate");
      setCombatTab(currentCharacter.isEnemy ? "enemies" : "team");
      handleExecuteSkill(skillId, currentCharacter);
      return;
    }

    // Auto-execute random targeting skills
    if (skillMetadata.targetScope === "random" && currentCharacter) {
      const enemies = player?.fightInfo?.characters?.filter(
        c => c.isEnemy !== currentCharacter.isEnemy && c.healthPoints > 0
      );

      if (enemies && enemies.length > 0) {
        setPendingSkillId(skillId);
        setTab("combate");
        handleExecuteSkill(skillId, enemies[0]);
        return;
      } else {
        showToast(t("playerPage.skills.noValidEnemies"));
        return;
      }
    }

    // Store skill and switch to combat for target selection
    setPendingSkillId(skillId);
    setTab("combate");
    setExcludeSelfFromTargeting(skillMetadata.targetScope === "ally" && !skillMetadata.canTargetSelf);

    // Determine correct tab based on target type
    if (targetsEnemies && !targetsAllies) {
      setCombatTab(currentCharacter?.isEnemy ? "team" : "enemies");
    } else if (targetsAllies && !targetsEnemies) {
      setCombatTab(currentCharacter?.isEnemy ? "enemies" : "team");
    } else {
      setCombatTab(currentCharacter?.isEnemy ? "team" : "enemies");
    }

    setIsSelectingSkillTarget(true);
  }, [player, showToast, setTab, setCombatTab]);

  const handleExecuteSkill = useCallback(async (skillId: string, target: BattleCharacterInfo) => {
    if (!player?.fightInfo) return;

    // Prevent duplicate execution
    if (isExecutingSkillRef.current) return;
    isExecutingSkillRef.current = true;

    // Prevent duplicate for Mezzo Forte
    if (skillId === "maelle-mezzo-forte" && isExecutingMezzoForte) {
      isExecutingSkillRef.current = false;
      return;
    }

    try {
      const source = player.fightInfo?.characters?.find(
        c => c.battleID === player.fightInfo?.playerBattleID
      );

      if (!source) {
        showToast(t("playerPage.errors.errorCharacterNotFoundInBattle"));
        isExecutingSkillRef.current = false;
        return;
      }

      const skillMetadata = SkillEffectsRegistry[skillId];
      if (!skillMetadata) {
        showToast(t("playerPage.errors.errorSkillNotFound"));
        return;
      }

      const skillInfo = player.skills?.find(s => s.skillId === skillId);
      if (!skillInfo) {
        showToast(t("playerPage.errors.errorSkillNotOwned"));
        return;
      }

      // Calculate skill cost
      const enrichedSkills = getEnrichedCharacterSkills(player);
      const fullSkill = enrichedSkills.find(s => s.id === skillId);
      let skillCost = fullSkill?.cost ?? 0;
      const isGradientSkill = fullSkill?.isGradient ?? false;

      // Monoco's Bestial Wheel special effects
      const bestialWheelPosition = source.bestialWheelPosition ?? -1;
      const currentMask = getMaskAtPosition(bestialWheelPosition);
      const isMonocoChar = isMonoco(source.id);

      if (isMonocoChar && !isGradientSkill) {
        if (skillId === "monoco-abbest-wind" && (currentMask === "purple" || currentMask === "gold")) {
          skillCost = 0;
        }
      }

      // Stance-based cost reduction
      if (skillMetadata.costReductionFromStance && !isGradientSkill) {
        const currentStance = source.stance;
        if (currentStance === skillMetadata.costReductionFromStance.stance) {
          skillCost = skillMetadata.costReductionFromStance.reducedCost;
        }
      }

      // Payback: Cost reduction per parry
      if (skillMetadata.costReductionPerParry && !isGradientSkill) {
        const parriesCount = source.parriesThisTurn ?? 0;
        if (parriesCount > 0) {
          const reductionPerParry = skillMetadata.costReductionPerParry;
          const totalReduction = parriesCount * reductionPerParry;
          const originalCost = skillCost;
          skillCost = Math.max(0, skillCost - totalReduction);
          showToast(t("playerPage.skills.parriesReducedCost", { count: parriesCount, original: originalCost, new: skillCost }));
        }
      }

      // Stain consumption for free cast
      if (skillMetadata.consumeStainsForFreeCast && skillMetadata.consumesStains && !isGradientSkill) {
        let canConsumeStains = true;

        for (const { stain, count } of skillMetadata.consumesStains) {
          const stains = [source.stainSlot1, source.stainSlot2, source.stainSlot3, source.stainSlot4];
          const specificCount = stains.filter(s => s === stain).length;
          const lightCount = stains.filter(s => s === "Light").length;
          const totalAvailable = specificCount + lightCount;

          if (totalAvailable < count) {
            canConsumeStains = false;
            break;
          }
        }

        if (canConsumeStains) {
          skillCost = 0;
        }
      }

      // Validate resources
      if (isGradientSkill) {
        const currentGradientCharges = Math.floor((source.gradientPoints ?? 0) / 12);
        if (currentGradientCharges < skillCost) {
          showToast(t("playerPage.skills.insufficientGradientCharges", { required: skillCost, available: currentGradientCharges }));
          setPendingSkillId(null);
          setIsSelectingSkillTarget(false);
          setExcludeSelfFromTargeting(false);
          return;
        }
      } else {
        const currentMp = source.magicPoints ?? 0;
        if (currentMp < skillCost) {
          showToast(t("playerPage.skills.insufficientMP", { required: skillCost, available: currentMp }));
          setPendingSkillId(null);
          setIsSelectingSkillTarget(false);
          setExcludeSelfFromTargeting(false);
          return;
        }
      }

      // Validate stain requirements
      if (!hasRequiredStains(source, skillMetadata)) {
        if (skillMetadata.requiresAllStains) {
          showToast(t("playerPage.skills.requiresAllStains"));
          setPendingSkillId(null);
          setIsSelectingSkillTarget(false);
          setIsExecutingSkill(false);
          isExecutingSkillRef.current = false;
          setExcludeSelfFromTargeting(false);
          return;
        }
      }

      // Try to consume stains
      let stainsConsumed = false;
      let consumedStainsList: string[] = [];
      let currentStainsAfterConsumption: [StainType | null, StainType | null, StainType | null, StainType | null] = [
        source.stainSlot1 ?? null,
        source.stainSlot2 ?? null,
        source.stainSlot3 ?? null,
        source.stainSlot4 ?? null
      ];

      if (skillMetadata.consumesStains || skillMetadata.requiresAllStains) {
        const newStains = consumeStains(source, skillMetadata);
        const originalStains = [source.stainSlot1, source.stainSlot2, source.stainSlot3, source.stainSlot4];
        const stainsChanged = originalStains.some((stain, idx) => stain !== newStains[idx]);

        if (stainsChanged) {
          await updateCharacterStains(source.battleID, newStains);
          stainsConsumed = true;
          currentStainsAfterConsumption = newStains;

          originalStains.forEach((stain, idx) => {
            if (stain !== newStains[idx] && stain) {
              consumedStainsList.push(stain);
            }
          });

          // Trigger weapon passives for stain consumption
          if (weaponInfo.details?.name && weaponInfo.weapon?.level && player.fightInfo?.battleId) {
            await executeWeaponPassives(
              "on-stain-consumed",
              source,
              player.fightInfo.characters ?? [],
              player.fightInfo.battleId,
              weaponInfo.details.name,
              weaponInfo.weapon.level,
              undefined,
              { stainsConsumed: consumedStainsList }
            );
          }

          await checkPlayerLoop();
        }
      }

      let resolved = resolveSkill(
        skillId,
        source,
        target,
        player.fightInfo?.characters ?? []
      );

      // Get skill metadata for type (sun/moon for Sciel)
      const skillData = getSkillById(skillId);
      const skillType = skillData?.type;

      // Calculate actual hit count
      let actualHitCount = resolved.metadata.minHits && resolved.metadata.maxHits
        ? Math.floor(Math.random() * (resolved.metadata.maxHits - resolved.metadata.minHits + 1)) + resolved.metadata.minHits
        : resolved.hitCount;

      if (resolved.metadata.minHits && resolved.metadata.maxHits) {
        showToast(t("playerPage.skills.hitsCountAnnouncement", { count: actualHitCount }));
      }

      // Track dice results for perfection calculation
      const allDiceResults: any[][] = [];
      const isVersoChar = isVerso(source.id);

      // Execute skill hits
      if (actualHitCount > 0) {
        let hitIndex = 0;

        while (hitIndex < actualHitCount) {
          await new Promise<void>((resolve, reject) => {
            rollWithTimeout(
              diceBoardRef,
              timeoutDiceBoardRef,
              rollCommandForAttack(weaponInfo, "basic"),
              async (result) => {
                try {
                  allDiceResults.push(result);
                  const total = diceTotal(result);
                  const failures = calculateFailureDiv(result);

                  let empoweredMulti = playerHasEmpowered(player) ? 2 : 1;
                  empoweredMulti = playerHasWeakened(player) ? 0.5 : empoweredMulti;

                  const targetChar = resolved.targetIds.length > 0
                    ? (player.fightInfo?.characters ?? []).find(c => c.battleID === resolved.targetIds[0])
                    : undefined;

                  let critMulti = calculatePlayerCriticalMulti(result, player, targetChar);
                  if (resolved.metadata.doubleCritDamage && critMulti > 1) {
                    critMulti = critMulti * 2;
                  }

                  let playerPower = (player?.playerSheet?.power ?? 0) * critMulti * empoweredMulti;
                  if (failures > 0) {
                    playerPower = Math.floor(playerPower / failures);
                  }

                  const weaponPower = calculateRawWeaponPower(weaponInfo, "basic");
                  const basePower = playerPower + weaponPower + total;
                  const baseHitDamage = calculateSkillHitDamage(resolved, basePower, result);

                  // Apply damage multipliers
                  const versoPerfectionMultiplier = isVersoChar ? getVersoPerfectionDamageMultiplier(source.perfectionRank) : 1.0;

                  // Almighty mask multiplier
                  const almightyMaskMultiplier = (isMonocoChar && currentMask === "gold") ? 1.5 : 1.0;

                  // Stain damage multiplier
                  let stainDamageMultiplier = 1.0;
                  if (stainsConsumed && consumedStainsList.length > 0 && !resolved.metadata.noStainDamageBonus) {
                    stainDamageMultiplier = 1.0 + (consumedStainsList.length * 0.25);
                  }

                  // For random targeting, select one random enemy per hit
                  let targetsForThisHit = resolved.targetIds;
                  if (resolved.metadata.targetScope === "random") {
                    const enemies = (player.fightInfo?.characters ?? []).filter(c => c.isEnemy !== source.isEnemy);
                    if (enemies.length > 0) {
                      const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];
                      targetsForThisHit = [randomEnemy.battleID];
                    }
                  }

                  for (const targetId of targetsForThisHit) {
                    const damageWithStains = Math.floor(baseHitDamage * stainDamageMultiplier);
                    const damageWithAlmighty = Math.floor(damageWithStains * almightyMaskMultiplier);
                    const hitDamage = Math.floor(damageWithAlmighty * versoPerfectionMultiplier);

                    showToast(t("playerPage.battle.attackDamage", { index: hitIndex + 1, damage: hitDamage }));

                    const effects = getStatusEffectsForTarget(resolved.effects, targetId);
                    const targetCharacter = (player.fightInfo?.characters ?? []).find(c => c.battleID === targetId);
                    const isNpcTarget = targetCharacter?.type === "npc";

                    let finalEffects = [...effects];

                    // Check for Fragile on NPCs
                    if (isNpcTarget && targetCharacter) {
                      const willGetFragile = checkForFragile(targetCharacter, hitDamage);
                      if (willGetFragile && !finalEffects.some(e => e.effectType === "Fragile")) {
                        finalEffects.push({
                          effectType: "Fragile",
                          ammount: 1,
                          remainingTurns: 2
                        });
                      }
                    }

                    // Determine attack element
                    let attackElement: string | undefined;
                    if (resolved.metadata.stainDeterminedElement) {
                      attackElement = getDominantElement(source);
                    } else if (resolved.metadata.forcedElement) {
                      attackElement = resolved.metadata.forcedElement;
                    } else if (resolved.metadata.usesWeaponElement && weaponInfo.details) {
                      attackElement = weaponInfo.details.attributes.element;
                    }

                    const attackRequest: CreateAttackRequest = isNpcTarget
                      ? {
                          sourceBattleId: source.battleID,
                          targetBattleId: targetId,
                          totalDamage: hitDamage,
                          attackType: "skill",
                          effects: finalEffects,
                          skillCost: hitIndex === 0 ? skillCost : 0,
                          isGradient: hitIndex === 0 && isGradientSkill,
                          skillType: skillType,
                          bestialWheelAdvance: hitIndex === 0 ? resolved.metadata.bestialWheelAdvance : undefined,
                          isLastHit: hitIndex === actualHitCount - 1,
                          element: attackElement
                        }
                      : {
                          sourceBattleId: source.battleID,
                          targetBattleId: targetId,
                          totalPower: hitDamage,
                          attackType: "skill",
                          effects: finalEffects,
                          skillCost: hitIndex === 0 ? skillCost : 0,
                          isGradient: hitIndex === 0 && isGradientSkill,
                          skillType: skillType,
                          bestialWheelAdvance: hitIndex === 0 ? resolved.metadata.bestialWheelAdvance : undefined,
                          isLastHit: hitIndex === actualHitCount - 1,
                          element: attackElement
                        };

                    await APIBattle.attack(attackRequest);

                    // Visual feedback
                    setHitCharacters(prev => new Set(prev).add(targetId));
                    setTimeout(() => {
                      setHitCharacters(prev => {
                        const next = new Set(prev);
                        next.delete(targetId);
                        return next;
                      });
                    }, 600);

                    // Check if enemy was killed
                    if (player.fightInfo?.battleId) {
                      const updatedBattle = await APIBattle.getById(player.fightInfo.battleId);
                      const allChars = updatedBattle.characters ?? [];
                      const targetAfterAttack = allChars.find(c => c.battleID === targetId);

                      if (!targetAfterAttack || targetAfterAttack.healthPoints <= 0) {
                        const killedEnemy = player.fightInfo.characters?.find(c => c.battleID === targetId);
                        if (killedEnemy && killedEnemy.isEnemy) {
                          await triggerOnKill(
                            source,
                            killedEnemy,
                            allChars,
                            player.fightInfo.battleId,
                            player.pictos,
                            player.luminas
                          );
                        }
                      }
                    }

                    // Trigger weapon passives for skill used
                    if (hitIndex === 0 && player.fightInfo?.battleId && weaponInfo.details?.name && weaponInfo.weapon?.level) {
                      const allChars = player.fightInfo.characters ?? [];
                      await executeWeaponPassives(
                        "on-skill-used",
                        source,
                        allChars,
                        player.fightInfo.battleId,
                        weaponInfo.details.name,
                        weaponInfo.weapon.level,
                        targetCharacter,
                        {
                          damageAmount: hitDamage,
                          skillElement: resolved.metadata.forcedElement || weaponInfo.details.attributes.element,
                          skillName: skillId
                        }
                      );
                    }
                  }

                  // Critical triggers extra hit
                  if (resolved.metadata.critTriggersExtraHit && critMulti > 1) {
                    actualHitCount++;
                    showToast(t("playerPage.skills.criticalExtraHit"));
                  }

                  // Gain perfection points per hit (Verso only - all skills grant points)
                  if (isVersoChar) {
                    const basePoints = resolved.metadata.gainsPerfectionPerHit ?? 1; // Default +1 per hit
                    const isCritical = critMulti > 1;
                    const hasCritBonus = resolved.metadata.criticalGivesPerfectionBonus === true;
                    const pointsPerHit = (isCritical && hasCritBonus) ? basePoints + 1 : basePoints;
                    try {
                      const perfResult = await APIBattle.addPerfectionPoints(source.battleID, pointsPerHit);
                      if (perfResult.rankedUp) {
                        showToast(t("playerPage.skills.perfectionRankUp", { rank: perfResult.newRank }));
                      }
                      await checkPlayerLoop();
                    } catch (error) {
                      console.error("Erro ao adicionar pontos de perfeição por golpe:", error);
                    }
                  }

                  hitIndex++;
                  resolve();
                } catch (error) {
                  reject(error);
                }
              }
            );
          });
        }
      } else {
        // Skills without hits (utility skills)
        const isMezzoForte = resolved.metadata.grantsMPDiceRoll !== undefined;

        if (isMezzoForte) {
          setIsExecutingMezzoForte(true);

          try {
            const initialMp = source.magicPoints ?? 0;
            const mpAfterCost = Math.max(0, initialMp - skillCost);
            await APIBattle.updateCharacterMp(source.battleID, mpAfterCost);

            if (resolved.metadata.grantsMPDiceRoll) {
              await new Promise<void>((resolvePromise) => {
                rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, "1d6", async (result) => {
                  const diceRoll = result && result.length > 0 ? result[0].value : 1;
                  const mpToGrant = diceRoll <= 3
                    ? resolved.metadata.grantsMPDiceRoll!.low
                    : resolved.metadata.grantsMPDiceRoll!.high;

                  const maxMp = source.maxMagicPoints ?? 0;
                  const newMp = maxMp > 0 ? Math.min(mpAfterCost + mpToGrant, maxMp) : (mpAfterCost + mpToGrant);

                  await APIBattle.updateCharacterMp(source.battleID, newMp);
                  resolvePromise();
                });
              });
            }
          } finally {
            setIsExecutingMezzoForte(false);
          }

          if (resolved.metadata.reappliesStance && source.stance) {
            await APIBattle.updateCharacterStance(source.battleID, source.stance);
          }
        } else {
          // Other skills without hits - consume MP or Gradient
          if (isGradientSkill) {
            const currentGradientPoints = source.gradientPoints ?? 0;
            const gradientCost = skillCost * 12;
            const newGradient = Math.max(0, currentGradientPoints - gradientCost);
            await APIBattle.updateTeamGradient(source.battleID, newGradient);
            showToast(t("playerPage.skills.gradientChargesConsumed", { count: skillCost }));
          } else if (skillCost > 0) {
            const currentMp = source.magicPoints ?? 0;
            const newMp = currentMp - skillCost;
            await APIBattle.updateCharacterMp(source.battleID, newMp);
          }
        }

        // Apply status effects for utility skills
        for (const targetId of resolved.targetIds) {
          const effects = getStatusEffectsForTarget(resolved.effects, targetId);
          if (effects.length > 0) {
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
      }

      // Execute special mechanics
      await executeAllSpecialMechanics({
        source,
        target,
        resolved,
        allCharacters: player.fightInfo?.characters ?? [],
        showToast
      }, 0);

      // Handle stain transformations and gains
      let stainsAfterTransform = currentStainsAfterConsumption;
      if (skillMetadata.transformsStainToLight) {
        const { from, to } = skillMetadata.transformsStainToLight;
        const stainsCopy: BattleCharacterInfo = {
          ...source,
          stainSlot1: currentStainsAfterConsumption[0],
          stainSlot2: currentStainsAfterConsumption[1],
          stainSlot3: currentStainsAfterConsumption[2],
          stainSlot4: currentStainsAfterConsumption[3]
        };
        stainsAfterTransform = transformStain(stainsCopy, from, to);
      }

      if (skillMetadata.gainsStains && skillMetadata.gainsStains.length > 0) {
        const newStains = addStains(stainsAfterTransform, skillMetadata.gainsStains);
        await updateCharacterStains(source.battleID, newStains);
        await checkPlayerLoop();
      }

      // Grant perfection points at end of skill (Verso only)
      if (isVersoChar && (skillMetadata.grantsPerfectionPoints || skillMetadata.bonusPerfectionOnCrit)) {
        const basePoints = skillMetadata.grantsPerfectionPoints || 0;

        // Count critical rolls across ALL hits
        let totalCrits = 0;
        for (const diceResult of allDiceResults) {
          totalCrits += countCriticalRolls(diceResult);
        }

        // If ANY critical hit occurred, add the full bonus (not multiplied by crit count)
        const critBonus = (totalCrits > 0 && skillMetadata.bonusPerfectionOnCrit)
          ? skillMetadata.bonusPerfectionOnCrit
          : 0;
        const totalPoints = basePoints + critBonus;

        if (totalPoints > 0) {
          try {
            const result = await APIBattle.addPerfectionPoints(source.battleID, totalPoints);
            if (result.success) {
              await checkPlayerLoop();
              if (result.rankedUp) {
                showToast(t("playerPage.skills.perfectionRankUp", { rank: result.newRank }));
              }
            }
          } catch (error) {
            console.error("Erro ao adicionar pontos de perfeição:", error);
          }
        }
      }

      setPendingSkillId(null);
      setIsSelectingSkillTarget(false);
      setIsExecutingSkill(false);
      isExecutingSkillRef.current = false;
      setExcludeSelfFromTargeting(false);

    } catch (error) {
      console.error("Erro ao usar skill:", error);
      showToast(t("playerPage.errors.errorUsingSkill"));
      setPendingSkillId(null);
      setIsSelectingSkillTarget(false);
      setIsExecutingSkill(false);
      isExecutingSkillRef.current = false;
      setExcludeSelfFromTargeting(false);
    }
  }, [
    player, weaponInfo, diceBoardRef, timeoutDiceBoardRef, showToast, checkPlayerLoop,
    setTab, setCombatTab, setHitCharacters, isExecutingMezzoForte
  ]);

  return {
    isExecutingSkill,
    setIsExecutingSkill,
    isExecutingMezzoForte,
    pendingSkillId,
    setPendingSkillId,
    isSelectingSkillTarget,
    setIsSelectingSkillTarget,
    excludeSelfFromTargeting,
    setExcludeSelfFromTargeting,
    lampmasterStacks,
    setLampmasterStacks,
    handleUseSkill,
    handleExecuteSkill
  };
}
