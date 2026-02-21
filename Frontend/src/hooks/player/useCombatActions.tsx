import { useCallback, type Dispatch, type SetStateAction, type RefObject, type MutableRefObject } from "react";
import { t } from "../../i18n";
import { FaCheckCircle, FaSkull, FaDivide } from "react-icons/fa";
import { APIBattle } from "../../api/APIBattle";
import { APIPlayer, type GetPlayerResponse } from "../../api/APIPlayer";
import type { WeaponInfo, AttackType, BattleCharacterInfo, StatusType } from "../../api/ResponseModel";
import type { DiceBoardRef } from "../../components/DiceBoard";
import { COMBAT_MENU_ACTIONS, type CombatMenuAction } from "../../utils/CombatMenuActions";
import { rollWithTimeout } from "../../utils/RollUtils";
import {
  rollCommandForInitiative,
  rollCommandForAttack,
  initiativeTotal,
  calculateAttackDamage,
  calculateFreeShotPlus,
  playerHasShield,
  playerHasEmpowered,
  playerHasWeakened,
  getPlayerFrenzy,
  playerHasDizzy,
  playerPictosTotalSpeed,
  calculatePlayerCriticalBonus,
  calculateRawWeaponPower
} from "../../utils/PlayerCalculator";
import { calculateWeaponAgilityBonus } from "../../utils/WeaponCalculator";
import {
  calculateFailureDiv,
  diceTotal,
  countCriticalRolls,
  countFailuresRolls
} from "../../utils/DiceCalculator";
import { calculateNpcAttackReceivedDamage, checkForFragile, getWeaponElementModifier, hasShield, hasStatus, npcIsFlying } from "../../utils/NpcCalculator";
import { getVersoPerfectionDamageBonus } from "../../utils/BattleUtils";
import { triggerOnBattleStart, triggerOnFreeAim, triggerOnKill } from "../../utils/PictoEffectsIntegration";
import { getElementModifierText } from "../../utils/ElementUtils";
import type { PlayerTab, CombatTabType, SkillsTabType } from "../../pages/PlayerPage/PlayerPage.types";

interface UseCombatActionsParams {
  player: GetPlayerResponse | null;
  setPlayer: Dispatch<SetStateAction<GetPlayerResponse | null>>;
  weaponInfo: WeaponInfo;
  diceBoardRef: RefObject<DiceBoardRef | null>;
  timeoutDiceBoardRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  showToast: (message: string, options?: { duration?: number }) => void;
  openModal: (title: string, body: React.ReactNode) => void;
  closeModal: () => void;
  setIsExecutingSkill: Dispatch<SetStateAction<boolean>>;
  setTab: (tab: PlayerTab) => void;
  setCombatTab: Dispatch<SetStateAction<CombatTabType>>;
  setSkillsInitialTab: Dispatch<SetStateAction<SkillsTabType>>;
  setIsUsingSkillMode: Dispatch<SetStateAction<boolean>>;
  setIsInventoryActiveInCombat: Dispatch<SetStateAction<boolean>>;
  attackType: AttackType;
  setAttackType: Dispatch<SetStateAction<AttackType>>;
  setPendingSkillId: Dispatch<SetStateAction<string | null>>;
  setIsSelectingSkillTarget: Dispatch<SetStateAction<boolean>>;
  setExcludeSelfFromTargeting: Dispatch<SetStateAction<boolean>>;
  setHitCharacters: Dispatch<SetStateAction<Set<number>>>;
  checkPlayerLoop: () => Promise<void>;
}

interface UseCombatActionsReturn {
  rollInitiative: () => void;
  joinBattle: () => void;
  endTurn: () => void;
  attemptFlee: () => void;
  confirmFlee: () => Promise<void>;
  handleCombatMenuAction: (action: CombatMenuAction) => void;
  handleSelectAttackTarget: (target: BattleCharacterInfo) => void;
}

export function useCombatActions({
  player,
  setPlayer,
  weaponInfo,
  diceBoardRef,
  timeoutDiceBoardRef,
  showToast,
  openModal,
  closeModal,
  setIsExecutingSkill,
  setTab,
  setCombatTab,
  setSkillsInitialTab,
  setIsUsingSkillMode,
  setIsInventoryActiveInCombat,
  attackType,
  setAttackType,
  setPendingSkillId,
  setIsSelectingSkillTarget,
  setExcludeSelfFromTargeting,
  setHitCharacters,
  checkPlayerLoop
}: UseCombatActionsParams): UseCombatActionsReturn {

  const rollInitiative = useCallback(() => {
    if (!player) return;

    if (player.fightInfo) {
      setPlayer({
        ...player,
        fightInfo: {
          ...player.fightInfo,
          canRollInitiative: false
        }
      });
    }

    setIsExecutingSkill(true);
    rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, rollCommandForInitiative(weaponInfo), result => {
      const criticalRolls = countCriticalRolls(result);
      const criticalBonus = calculatePlayerCriticalBonus(result, player, weaponInfo);
      const rollTotal = diceTotal(result);
      const total = initiativeTotal(player, result, weaponInfo);
      const failures = countFailuresRolls(result);
      const failuresDiv = calculateFailureDiv(result);
      const weaponAgilityBonus = calculateWeaponAgilityBonus(weaponInfo);

      openModal(
        t("playerPage.modals.rollResult"),
        <div className="space-y-2">
          <p>{t("playerPage.initiative.roll")}: {rollTotal}</p>
          {criticalRolls > 0 && (
            <h3 className="flex items-center gap-2 text-green-600 font-bold text-lg">
              <FaCheckCircle className="w-6 h-6" />
              {t("playerPage.initiative.criticals")}: <b>{criticalRolls}</b>
            </h3>
          )}
          {failures > 0 && (
            <h3 className="flex items-center gap-2 text-red-600 font-bold text-lg">
              <FaSkull className="w-6 h-6" />
              {t("playerPage.initiative.criticalFailures")}: <b>{failures}</b>
            </h3>
          )}
          <p>
            {t("playerPage.initiative.ability")}: <b>{player.playerSheet?.hability ?? 0}</b>
            {criticalRolls > 0 && <b> (+{criticalBonus})</b>}
            {failures > 0 && (
              <span className="inline-flex items-center gap-1 font-bold ml-2">
                (-{failures * 2})
              </span>
            )}
          </p>
          <p>{t("playerPage.initiative.pictoBonus")}: <b>{playerPictosTotalSpeed(player)}</b></p>
          {weaponAgilityBonus > 0 && (
            <p>{t("playerPage.initiative.weaponBonus")}: <b>+{weaponAgilityBonus}</b></p>
          )}
          <h1 className="text-2xl font-bold">{t("playerPage.initiative.total")}: {total}</h1>
        </div>
      );

      const callAddInitiative = async () => {
        try {
          const savedInitiative = await APIBattle.addInitiative({
            battleCharacterId: player.fightInfo?.playerBattleID ?? 0,
            value: total,
            hability: player.playerSheet?.hability ?? 0,
            playFirst: criticalRolls > 0,
          });

          setPlayer((prev) => {
            if (!prev || !prev.fightInfo) return prev;

            const fi = prev.fightInfo;
            const current = fi.initiatives ?? [];

            return {
              ...prev,
              fightInfo: {
                ...fi,
                initiatives: [...current, savedInitiative],
              },
            };
          });

          // Trigger picto effects for battle start
          if (player.fightInfo) {
            const sourceChar = player.fightInfo.characters?.find(c => c.battleID === player.fightInfo?.playerBattleID);
            const allChars = player.fightInfo.characters ?? [];
            if (sourceChar && player.fightInfo.battleId) {
              await triggerOnBattleStart(sourceChar, allChars, player.fightInfo.battleId, player.pictos, player.luminas);
            }
          }
        } catch (err) {
          showToast(t("playerPage.errors.errorRegisteringInitiative"));
        }
        setIsExecutingSkill(false);
      };

      callAddInitiative();
    });
  }, [player, setPlayer, weaponInfo, diceBoardRef, timeoutDiceBoardRef, showToast, openModal, setIsExecutingSkill]);

  const joinBattle = useCallback(() => {
    if (!player) return;

    if (player.fightInfo) {
      setPlayer({
        ...player,
        fightInfo: {
          ...player.fightInfo,
          canRollInitiative: false
        }
      });
    }

    const joinBattleCall = async () => {
      try {
        await APIBattle.joinBattle({
          battleCharacterId: player.fightInfo?.playerBattleID ?? 0
        });
        showToast(t("playerPage.battle.joinedBattle"));
      } catch (e) {
        showToast(t("playerPage.errors.errorSavingPlayer"));
      }
    };

    joinBattleCall();
  }, [player, setPlayer, showToast]);

  const endTurn = useCallback(() => {
    if (!player) return;

    const endTurnCall = async () => {
      try {
        const playerBattleID = player.fightInfo?.playerBattleID ?? 0;

        // Remove free-shot stacks from source before ending turn (Sequência tracking)
        const sourceChar = player.fightInfo?.characters?.find(c => c.battleID === playerBattleID);
        const hasFreeShot = sourceChar?.status?.some(s => s.effectName === "free-shot") ?? false;
        if (hasFreeShot) {
          await APIBattle.removeStatus(playerBattleID, "free-shot");
        }

        await APIBattle.endTurn(playerBattleID);
      } catch (e) {
        showToast(t("playerPage.errors.errorEndingTurn"));
      }
    };

    endTurnCall();
  }, [player, showToast]);

  const attemptFlee = useCallback(() => {
    openModal(
      t("playerPage.flee.title"),
      <div className="space-y-4">
        <p>{t("playerPage.flee.confirmation")}</p>
        <p className="text-sm text-gray-500">{t("playerPage.flee.warning")}</p>
        <div className="flex gap-2 justify-end">
          <button className="btn btn-ghost" onClick={closeModal}>
            {t("playerPage.flee.cancel")}
          </button>
          <button className="btn btn-primary" onClick={confirmFlee}>
            {t("playerPage.flee.confirm")}
          </button>
        </div>
      </div>
    );
  }, [openModal, closeModal]);

  const confirmFlee = useCallback(async () => {
    if (!player?.fightInfo) return;

    try {
      const playerId = player.id;
      const playerBattleId = player.fightInfo?.playerBattleID;
      if (!playerBattleId) return;

      showToast(t("playerPage.battle.attemptingFlee"));
      await APIBattle.flee(playerId, playerBattleId);
      await APIBattle.endTurn(playerBattleId);
      closeModal();
    } catch (e) {
      console.error("Erro ao tentar fugir:", e);
      showToast(t("playerPage.errors.errorFleeing"));
    }
  }, [player, showToast, closeModal]);

  const handleCombatMenuAction = useCallback((action: CombatMenuAction) => {
    switch (action) {
      case COMBAT_MENU_ACTIONS.Inventory:
        setTab("inventario");
        setIsInventoryActiveInCombat(true);
        break;
      case COMBAT_MENU_ACTIONS.Skills:
        setSkillsInitialTab("picker");
        setIsUsingSkillMode(true);
        setTab("habilidades");
        break;
      case COMBAT_MENU_ACTIONS.Initiative:
        rollInitiative();
        break;
      case COMBAT_MENU_ACTIONS.JoinBattle:
        joinBattle();
        break;
      case COMBAT_MENU_ACTIONS.EndTurn:
        endTurn();
        break;
      case COMBAT_MENU_ACTIONS.Attack:
        setAttackType("basic");
        break;
      case COMBAT_MENU_ACTIONS.FreeShot:
        setAttackType("free-shot");
        break;
      case COMBAT_MENU_ACTIONS.Flee:
        attemptFlee();
        break;
      case COMBAT_MENU_ACTIONS.Cancel:
        setPendingSkillId(null);
        setIsSelectingSkillTarget(false);
        setIsUsingSkillMode(false);
        setExcludeSelfFromTargeting(false);
        break;
      default:
        break;
    }
  }, [
    setTab, setIsInventoryActiveInCombat, setSkillsInitialTab, setIsUsingSkillMode,
    rollInitiative, joinBattle, endTurn, setAttackType, attemptFlee,
    setPendingSkillId, setIsSelectingSkillTarget, setExcludeSelfFromTargeting
  ]);

  const handleSelectAttackTarget = useCallback((target: BattleCharacterInfo) => {
    if (player == null) return;

    if (npcIsFlying(target) && attackType != "free-shot") {
      showToast(t("playerPage.battle.flyingEnemyWarning"), { duration: 3000 });
      return;
    }

    setIsExecutingSkill(true);

    const executeAttackWithHitCount = async () => {
      let totalHits = 1;

      // Only check for combo modifiers on basic attacks
      if (attackType === "basic" && player?.fightInfo?.playerBattleID) {
        try {
          const modifiers = await APIBattle.getModifiers(player.fightInfo!.playerBattleID);
          const comboModifiers = modifiers.filter(
            m => m.modifierType === "base-attack" && m.isActive && m.flatBonus > 0
          );
          const extraHits = comboModifiers.reduce((sum, m) => sum + m.flatBonus, 0);
          totalHits = 1 + extraHits;

          if (totalHits > 1) {
            showToast(t("playerPage.battle.comboAttack", { count: totalHits }));
          }
        } catch (error) {
          console.error("Error getting combo modifiers:", error);
        }
      }

      // Track shield consumption locally to handle stale state
      const initialShields = target.status?.find(s => s.effectName === "Shielded")?.ammount ?? 0;
      let shieldsRemaining = initialShields;

      // Execute each hit sequentially
      for (let hitIndex = 0; hitIndex < totalHits; hitIndex++) {
        await new Promise<void>((resolve) => {
          rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, rollCommandForAttack(weaponInfo, attackType), async (result) => {
            const playerChar = player?.fightInfo?.characters?.find(c => c.battleID === player.fightInfo?.playerBattleID);
            const criticalRolls = countCriticalRolls(result);
            const rollTotal = diceTotal(result);
            const weaponPower = calculateRawWeaponPower(weaponInfo, attackType);

            // Use target without shield status if shields have been consumed by previous hits
            const effectiveTarget = shieldsRemaining <= 0 && initialShields > 0
              ? { ...target, status: target.status?.filter(s => s.effectName !== "Shielded") ?? [] }
              : target;

            const total = calculateAttackDamage(player, weaponInfo, effectiveTarget, result, attackType, playerChar?.stance, playerChar);

            // === Detailed logging for basic/free-shot attack ===
            const failures = calculateFailureDiv(result);
            const critBonus = calculatePlayerCriticalBonus(result, player, weaponInfo);
            const empBonus = playerHasEmpowered(player) ? 4 : (playerHasWeakened(player) ? -4 : 0);
            const frenzyBonus = getPlayerFrenzy(player)?.ammount ?? 0;
            const stanceBonus = playerChar?.stance === "Offensive" ? 4 : (playerChar?.stance === "Virtuous" ? 8 : 0);
            const isVerso = playerChar?.id?.toLowerCase().includes("verso");
            const versoBonus = isVerso ? getVersoPerfectionDamageBonus(playerChar?.perfectionRank) : 0;

            // Element
            const weaponElement = weaponInfo?.details?.attributes?.element;
            let elementBonus = 0;
            if (attackType === "basic") {
              const elemMod = getWeaponElementModifier(effectiveTarget.id, weaponInfo);
              if (elemMod) {
                elementBonus = elemMod.flatBonus;
              } else if (weaponElement === "Fire" && hasStatus(effectiveTarget, "FireVulnerability")) {
                elementBonus = 4;
              }
            }

            // Free-shot weak point
            const freeShotBonus = calculateFreeShotPlus(player, effectiveTarget, attackType);

            // Twilight bonus
            const twilightStatus = playerChar?.status?.find(s => s.effectName === "Twilight");
            const twilightBonus = twilightStatus?.ammount ? twilightStatus.ammount * 2 : 0;

            // Fortune's Fury bonus
            const fortunesFuryBonus = (playerChar && hasStatus(playerChar, "FortunesFury")) ? 8 : 0;

            const finalDmg = total + twilightBonus;

            console.log("=== Basic/Free-Shot Attack Breakdown ===");
            console.log("Attack Type:", attackType);
            console.log("Dice Total:", rollTotal);
            console.log("Player Power:", player?.playerSheet?.power ?? 0);
            console.log("Weapon Power:", weaponPower);
            if (critBonus > 0) console.log("Critical Bonus:", `+${critBonus}`);
            if (empBonus !== 0) console.log(empBonus > 0 ? "Empowered:" : "Weakened:", empBonus);
            if (failures > 0) console.log("Failures:", failures, `(-${failures * 4})`);
            if (frenzyBonus > 0) console.log("Frenzy:", `+${frenzyBonus}`);
            if (elementBonus !== 0) console.log("Element Bonus:", elementBonus, `(${weaponElement})`);
            if (freeShotBonus > 0) console.log("Weak Point:", `+${freeShotBonus}`);
            if (stanceBonus > 0) console.log("Stance Bonus:", `+${stanceBonus}`, `(${playerChar?.stance})`);
            if (versoBonus > 0) console.log("Verso Perfection:", `+${versoBonus}`, `(${playerChar?.perfectionRank})`);
            if (twilightBonus > 0) console.log("Twilight Bonus:", `+${twilightBonus}`, `(${twilightStatus?.ammount} charges x 2)`);
            if (fortunesFuryBonus > 0) console.log("Fortune's Fury:", `+${fortunesFuryBonus}`);
            console.log("Total Power (before defense):", finalDmg);

            showToast(`Total: ${finalDmg}`);

            if (freeShotBonus > 0 && total > 0) {
              showToast(t("playerPage.battle.weakPointHit", { bonus: freeShotBonus }));
            }

            // Consume shield locally after calculations
            if (shieldsRemaining > 0) {
              shieldsRemaining--;
            }

            try {
              if (target.type == "npc") {
                const npcDamage = calculateNpcAttackReceivedDamage(effectiveTarget, finalDmg);
                const willGetFragile = checkForFragile(effectiveTarget, finalDmg);

                let effects: any[] = [];
                const attackInfo: any = {
                  totalDamage: npcDamage,
                  targetBattleId: target.battleID,
                  sourceBattleId: player.fightInfo?.playerBattleID ?? 0,
                  attackType: attackType,
                  effects: effects
                };

                if (willGetFragile) {
                  effects.push({
                    effectType: "Fragile",
                    ammount: 1,
                    remainingTurns: 2
                  });
                }

                await APIBattle.attack(attackInfo);
                // Grant +1 perfection per hit on enemy
                if (finalDmg > 0 && player.fightInfo?.playerBattleID) {
                  await APIBattle.addPerfectionPoints(player.fightInfo.playerBattleID, 1);
                }
              } else {
                const attackInfo: any = {
                  totalPower: finalDmg,
                  targetBattleId: target.battleID,
                  sourceBattleId: player.fightInfo?.playerBattleID ?? 0,
                  attackType: attackType
                };

                await APIBattle.attack(attackInfo);
              }

              // Visual feedback
              setHitCharacters(prev => new Set(prev).add(target.battleID));
              setTimeout(() => {
                setHitCharacters(prev => {
                  const next = new Set(prev);
                  next.delete(target.battleID);
                  return next;
                });
              }, 600);

              // Check if enemy was killed + track free-shot stacks for Sequência
              if (player.fightInfo?.battleId) {
                const sourceChar = player.fightInfo.characters?.find(c => c.battleID === player.fightInfo?.playerBattleID);
                if (sourceChar) {
                  const updatedBattle = await APIBattle.getById(player.fightInfo.battleId);
                  const allChars = updatedBattle.characters ?? [];
                  const targetAfterAttack = allChars.find(c => c.battleID === target.battleID);

                  if (!targetAfterAttack || targetAfterAttack.healthPoints <= 0) {
                    if (target.isEnemy) {
                      await triggerOnKill(
                        sourceChar,
                        target,
                        allChars,
                        player.fightInfo.battleId,
                        player.pictos,
                        player.luminas
                      );
                    }
                  }

                  // Track free-shot stacks on source character (for Sequência / verso-followup)
                  // Always pass ammount: 1 — the backend accumulates it on the existing status
                  if (attackType === "free-shot") {
                    await APIBattle.addStatus({
                      battleCharacterId: sourceChar.battleID,
                      effectType: "free-shot",
                      ammount: 1,
                      remainingTurns: 1,
                    });
                    await triggerOnFreeAim(sourceChar, allChars, player.fightInfo.battleId, player.pictos, player.luminas);
                  }
                }
              }

            } catch (e) {
              showToast(t("playerPage.errors.errorAttacking"));
            }

            resolve();
          });
        });
      }

      // Maelle: Lose stance after basic attack
      if (attackType === "basic") {
        const playerChar = player?.fightInfo?.characters?.find(c => c.battleID === player.fightInfo?.playerBattleID);
        if (playerChar?.stance) {
          await APIBattle.updateCharacterStance(playerChar.battleID, null);
          showToast(t("playerPage.skills.stanceLostBasicAttack"));
        }
      }

      setIsExecutingSkill(false);
    };

    executeAttackWithHitCount();
  }, [player, attackType, weaponInfo, diceBoardRef, timeoutDiceBoardRef, showToast, setIsExecutingSkill, setHitCharacters]);

  return {
    rollInitiative,
    joinBattle,
    endTurn,
    attemptFlee,
    confirmFlee,
    handleCombatMenuAction,
    handleSelectAttackTarget
  };
}
