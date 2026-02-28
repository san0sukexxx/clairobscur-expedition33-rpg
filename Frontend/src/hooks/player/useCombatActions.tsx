import { useCallback, type Dispatch, type SetStateAction, type RefObject, type MutableRefObject } from "react";
import { t } from "../../i18n";
import { FaCheckCircle, FaSkull } from "react-icons/fa";
import { APIBattle } from "../../api/APIBattle";
import { APIGameLog } from "../../api/APIGameLog";
import { APIPlayer, type GetPlayerResponse } from "../../api/APIPlayer";
import type { WeaponInfo } from "../../api/ResponseModel";
import type { DiceBoardRef } from "../../components/DiceBoard";
import { COMBAT_MENU_ACTIONS, type CombatMenuAction } from "../../utils/CombatMenuActions";
import { rollWithTimeout } from "../../utils/RollUtils";
import { dispatchRoll } from "../../utils/rollDispatcher";
import {
  playerPictosTotalSpeed,
  calculatePlayerCriticalBonus,
  calculateRawWeaponPower,
} from "../../utils/PlayerCalculator";
import { calculateWeaponAgilityBonus } from "../../utils/WeaponCalculator";
import { getMainAttributeKey } from "../../utils/CharacterUtils";
import {
  calculateFailureDiv,
  diceTotal,
  countCriticalRolls,
  countFailuresRolls
} from "../../utils/DiceCalculator";
import { triggerOnBattleStart } from "../../utils/PictoEffectsIntegration";
import type { PlayerTab, CombatTabType, SpecialAttacksTabType } from "../../pages/PlayerPage/PlayerPage.types";

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
  setSpecialAttacksInitialTab: Dispatch<SetStateAction<SpecialAttacksTabType>>;
  setIsUsingSpecialAttackMode: Dispatch<SetStateAction<boolean>>;
  setIsInventoryActiveInCombat: Dispatch<SetStateAction<boolean>>;
  checkPlayerLoop: () => Promise<void>;
}

interface UseCombatActionsReturn {
  rollInitiative: () => void;
  joinBattle: () => void;
  endTurn: () => void;
  attemptFlee: () => void;
  confirmFlee: () => Promise<void>;
  handleCombatMenuAction: (action: CombatMenuAction) => void;
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
  setSpecialAttacksInitialTab,
  setIsUsingSpecialAttackMode,
  setIsInventoryActiveInCombat,
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
    const dexMod = Math.floor(((player.playerSheet?.abilityScores?.dexterity ?? 10) - 10) / 2);
    const diceCommand = dexMod === 0 ? "1d20" : dexMod > 0 ? `1d20+${dexMod}` : `1d20${dexMod}`;
    rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, diceCommand, result => {
      const criticalRolls = countCriticalRolls(result);
      const criticalBonus = calculatePlayerCriticalBonus(result, player, weaponInfo);
      const rollTotal = diceTotal(result);
      const total = rollTotal + dexMod;

      dispatchRoll({ label: t("characterSheet.initiative"), diceRolled: rollTotal, modifier: dexMod, total, diceCommand });
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
            {t("playerPage.initiative.ability")}: <b>{0}</b>
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
            hability: 0,
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

  const basicAttack = useCallback(() => {
    if (!player) return;

    const weaponPowerMod = calculateRawWeaponPower(weaponInfo, "basic");
    const mainAttrKey = getMainAttributeKey(player.playerSheet?.characterId);
    const mainAttrScore = player.playerSheet?.abilityScores?.[mainAttrKey] ?? 10;
    const mainAttrMod = Math.floor((mainAttrScore - 10) / 2);
    const totalMod = weaponPowerMod + mainAttrMod;

    const diceCommand = totalMod === 0 ? "1d20" : totalMod > 0 ? `1d20+${totalMod}` : `1d20${totalMod}`;

    setIsExecutingSkill(true);
    rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, diceCommand, result => {
      const total = diceTotal(result);
      const diceRolled = total - totalMod;

      dispatchRoll({ label: t("combat.attack"), diceRolled, modifier: totalMod, total, diceCommand });

      APIGameLog.create(player.id, {
        rollType: "attack",
        diceRolled,
        modifier: totalMod,
        total,
        diceCommand,
      }).catch(() => {});

      setIsExecutingSkill(false);
    });
  }, [player, weaponInfo, diceBoardRef, timeoutDiceBoardRef, setIsExecutingSkill]);

  const handleCombatMenuAction = useCallback((action: CombatMenuAction) => {
    switch (action) {
      case COMBAT_MENU_ACTIONS.Inventory:
        setTab("inventario");
        setIsInventoryActiveInCombat(true);
        break;
      case COMBAT_MENU_ACTIONS.Skills:
        setSpecialAttacksInitialTab("picker");
        setIsUsingSpecialAttackMode(true);
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
      case COMBAT_MENU_ACTIONS.Flee:
        attemptFlee();
        break;
      case COMBAT_MENU_ACTIONS.Attack:
        basicAttack();
        break;
      case COMBAT_MENU_ACTIONS.Cancel:
        setIsUsingSpecialAttackMode(false);
        break;
      default:
        break;
    }
  }, [
    setTab, setIsInventoryActiveInCombat, setSpecialAttacksInitialTab, setIsUsingSpecialAttackMode,
    rollInitiative, joinBattle, endTurn, attemptFlee, basicAttack
  ]);

  return {
    rollInitiative,
    joinBattle,
    endTurn,
    attemptFlee,
    confirmFlee,
    handleCombatMenuAction,
  };
}
