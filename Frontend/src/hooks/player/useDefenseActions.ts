import { useCallback, type Dispatch, type SetStateAction, type RefObject, type MutableRefObject } from "react";
import { t } from "../../i18n";
import { APIBattle, type CreateDefenseRequest, type ResolveStatusRequest } from "../../api/APIBattle";
import { APIPlayer, type GetPlayerResponse } from "../../api/APIPlayer";
import type { WeaponInfo, AttackResponse, DefenseOption, StatusResponse, BattleCharacterInfo } from "../../api/ResponseModel";
import type { DiceBoardRef } from "../../components/DiceBoard";
import type { WeaponDTO } from "../../types/WeaponDTO";
import { rollWithTimeout } from "../../utils/RollUtils";
import {
  rollCommandForDefense,
  calculateDefense,
  calculateMaxCounterDamage,
  playerHasShield,
  calculateStatusResolvedTotalValue,
  calculateResolveStatusWithDiceTotal
} from "../../utils/PlayerCalculator";
import { rollCommandForResolveStatus } from "../../utils/StatusCalculator";
import { statusNeedsResolveRoll } from "../../utils/BattleUtils";
import { triggerOnDodge } from "../../utils/PictoEffectsIntegration";
import { FIGHT_EVENTS, SHEET_EVENTS } from "../../constants/player/battleLogEvents";
import { getLastBattleLogFromPlayer } from "./usePlayerData";

interface UseDefenseActionsParams {
  player: GetPlayerResponse | null;
  setPlayer: Dispatch<SetStateAction<GetPlayerResponse | null>>;
  weaponInfo: WeaponInfo;
  weaponList: WeaponDTO[];
  diceBoardRef: RefObject<DiceBoardRef | null>;
  timeoutDiceBoardRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  showToast: (message: string, options?: { duration?: number }) => void;
  lastBattleLog: number | undefined;
  setLastBattleLog: Dispatch<SetStateAction<number | undefined>>;
  setIsExecutingSkill: Dispatch<SetStateAction<boolean>>;
  setHitCharacters: Dispatch<SetStateAction<Set<number>>>;
}

interface UseDefenseActionsReturn {
  handleSelectDefense: (attack: AttackResponse, defense: DefenseOption) => Promise<void>;
  onResolveStatus: (status: StatusResponse, currentCharacter: BattleCharacterInfo | undefined) => void;
}

export function useDefenseActions({
  player,
  setPlayer,
  weaponInfo,
  weaponList,
  diceBoardRef,
  timeoutDiceBoardRef,
  showToast,
  lastBattleLog,
  setLastBattleLog,
  setIsExecutingSkill,
  setHitCharacters
}: UseDefenseActionsParams): UseDefenseActionsReturn {

  // Check battle log for updates
  const checkBattleLog = useCallback((playerInfo: GetPlayerResponse) => {
    const logs = playerInfo.battleLogs ?? [];
    if (logs.length === 0) return;

    const shouldUpdateFight = logs.some(log => FIGHT_EVENTS.has(log.eventType));
    const shouldUpdateSheet = logs.some(log => SHEET_EVENTS.has(log.eventType));

    if (shouldUpdateSheet) {
      setPlayer(prev =>
        prev
          ? {
            ...prev,
            playerSheet: playerInfo.playerSheet ?? prev.playerSheet,
            pictos: playerInfo.pictos ?? prev.pictos,
            luminas: playerInfo.luminas ?? prev.luminas
          }
          : prev
      );
    }

    if (shouldUpdateFight) {
      setPlayer(prev =>
        prev
          ? {
            ...prev,
            fightInfo: playerInfo.fightInfo ?? prev.fightInfo
          }
          : prev
      );
    }

    const lastLog = getLastBattleLogFromPlayer(playerInfo);
    setLastBattleLog(lastLog);
  }, [setPlayer, setLastBattleLog]);

  const handleSelectDefense = useCallback(async (attack: AttackResponse, defense: DefenseOption) => {
    if (!player || !diceBoardRef.current) {
      return;
    }

    return new Promise<void>(async (resolve, reject) => {
      const callDefend = async (payload: CreateDefenseRequest) => {
        try {
          await APIBattle.defend(payload);
          const playerInfo = await APIPlayer.get(player.id, lastBattleLog);
          checkBattleLog(playerInfo);
          resolve();
        } catch (e) {
          showToast(t("playerPage.errors.errorDefending"));
          reject(e);
        }
      };

      const callCounter = async (battleCharacterId: number, maxDamage: number, attackerBattleId: number) => {
        try {
          await APIBattle.applyDefense(battleCharacterId, maxDamage);

          // Visual feedback for counter
          if (maxDamage > 0) {
            setHitCharacters(prev => new Set(prev).add(attackerBattleId));
            setTimeout(() => {
              setHitCharacters(prev => {
                const next = new Set(prev);
                next.delete(attackerBattleId);
                return next;
              });
            }, 600);

            showToast(t("playerPage.defense.counterAttacked"));
          } else {
            showToast(t("playerPage.defense.didNotCounterAttack"));
          }

          const playerInfo = await APIPlayer.get(player.id, lastBattleLog);
          checkBattleLog(playerInfo);
          resolve();
        } catch (e) {
          showToast(t("playerPage.errors.errorCountering"));
          reject(e);
        }
      };

      const executeDefense = async (result: any | null) => {
        try {
          const playerChar = player?.fightInfo?.characters?.find(c => c.battleID === player.fightInfo?.playerBattleID);
          let defenseValue = attack.totalPower;

          if (result != null) {
            defenseValue = calculateDefense(attack.totalPower, player, weaponInfo, result, defense, playerChar?.stance);
          }

          let description = t("playerPage.defense.tookFullDamage");

          if (defense === "block") {
            if (defenseValue > 0) {
              description = t("playerPage.defense.failedToParry", { damage: defenseValue });
            } else {
              description = t("playerPage.defense.successfulParry");
            }
          } else if (defense === "gradient-block") {
            if (defenseValue > 0) {
              description = t("playerPage.defense.failedToParry", { damage: defenseValue });
            } else {
              description = t("playerPage.defense.successfulParryCounter");
            }
          } else if (defense === "dodge") {
            if (defenseValue > 0) {
              description = t("playerPage.defense.failedToDodge", { damage: defenseValue });
            } else {
              description = t("playerPage.defense.successfulDodge");

              // Trigger picto effects on successful dodge
              if (playerChar && player.fightInfo?.battleId) {
                const attacker = player.fightInfo?.characters?.find(c => c.battleID === attack.sourceBattleId);
                await triggerOnDodge(
                  playerChar,
                  attacker,
                  player.fightInfo.characters ?? [],
                  player.fightInfo.battleId,
                  player.pictos,
                  player.luminas
                );
              }
            }
          } else if (defense === "jump") {
            if (defenseValue > 0) {
              description = t("playerPage.defense.failedToJump", { damage: defenseValue });
            } else {
              description = t("playerPage.defense.successfulJump");
            }
          }

          if (defenseValue == 0 && playerHasShield(player)) {
            description = t("playerPage.defense.shieldUsed");
          }

          const payload: CreateDefenseRequest = {
            attackId: attack.id,
            totalDamage: defenseValue,
            defenseType: defense,
          };

          await callDefend(payload);

          // Remove Charging status if player took damage (interrupted charge)
          if (defenseValue > 0) {
            const hasCharging = playerChar?.status?.some(s => s.effectName === "Charging") ?? false;
            if (hasCharging) {
              await APIBattle.removeStatus(playerChar!.battleID, "Charging");
              showToast(t("playerPage.skills.chargingInterrupted"));
            }
          }

          showToast(description);
          setIsExecutingSkill(false);
        } catch (e) {
          showToast(t("playerPage.errors.errorRegisteringDefense"));
          setIsExecutingSkill(false);
          reject(e);
        }
      };

      const takeTheDamage = () => {
        executeDefense(null);
      };

      if (defense == "counter") {
        callCounter(attack.targetBattleId, calculateMaxCounterDamage(player, weaponList), attack.sourceBattleId);
      } else if (defense == "cancel-counter") {
        callCounter(attack.targetBattleId, 0, attack.sourceBattleId);
      } else if (defense != "take") {
        setIsExecutingSkill(true);
        rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, rollCommandForDefense(player, weaponInfo, defense), result => {
          executeDefense(result);
        });
      } else {
        takeTheDamage();
      }
    });
  }, [player, weaponInfo, weaponList, diceBoardRef, timeoutDiceBoardRef, showToast, lastBattleLog, checkBattleLog, setIsExecutingSkill, setHitCharacters]);

  const onResolveStatus = useCallback((status: StatusResponse, currentCharacter: BattleCharacterInfo | undefined) => {
    const callResolveStatus = async (payload: ResolveStatusRequest) => {
      try {
        await APIBattle.resolveStatus(payload);
        setIsExecutingSkill(false);
      } catch (e) {
        showToast(t("playerPage.errors.errorResolvingStatus"));
        setIsExecutingSkill(false);
      }
    };

    if (!statusNeedsResolveRoll(status)) {
      const total = calculateStatusResolvedTotalValue(player, weaponInfo, status);
      callResolveStatus({
        battleCharacterId: currentCharacter?.battleID ?? 0,
        effectType: status.effectName,
        totalValue: total
      });
      return;
    }

    setIsExecutingSkill(true);
    rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, rollCommandForResolveStatus(status), result => {
      const total = calculateResolveStatusWithDiceTotal(player, weaponInfo, status, result);

      callResolveStatus({
        battleCharacterId: currentCharacter?.battleID ?? 0,
        effectType: status.effectName,
        totalValue: total
      });
    });
  }, [player, weaponInfo, diceBoardRef, timeoutDiceBoardRef, showToast, setIsExecutingSkill]);

  return {
    handleSelectDefense,
    onResolveStatus
  };
}
