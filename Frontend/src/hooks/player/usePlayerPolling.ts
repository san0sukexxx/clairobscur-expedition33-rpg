import { useState, useEffect, useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { t } from "../../i18n";
import { APIPlayer, type GetPlayerResponse } from "../../api/APIPlayer";
import { FIGHT_EVENTS, SHEET_EVENTS } from "../../constants/player/battleLogEvents";
import { getLastBattleLogFromPlayer } from "./usePlayerData";

interface UsePlayerPollingParams {
  player: GetPlayerResponse | null;
  setPlayer: Dispatch<SetStateAction<GetPlayerResponse | null>>;
  lastBattleLog: number | undefined;
  setLastBattleLog: Dispatch<SetStateAction<number | undefined>>;
  showToast: (message: string, options?: { duration?: number }) => void;
}

interface UsePlayerPollingReturn {
  checkPlayerLoop: () => Promise<void>;
  wasMasterEditing: boolean;
}

/**
 * Hook to manage player state polling
 */
export function usePlayerPolling({
  player,
  setPlayer,
  lastBattleLog,
  setLastBattleLog,
  showToast
}: UsePlayerPollingParams): UsePlayerPollingReturn {
  const [wasMasterEditing, setWasMasterEditing] = useState(false);

  // Apply fight info update
  const applyFightInfoUpdate = useCallback((playerInfo: GetPlayerResponse) => {
    setPlayer(prev =>
      prev
        ? {
          ...prev,
          fightInfo: playerInfo.fightInfo ?? prev.fightInfo
        }
        : prev
    );
  }, [setPlayer]);

  // Apply sheet info update
  const applySheetInfoUpdate = useCallback((playerInfo: GetPlayerResponse) => {
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
  }, [setPlayer]);

  // Check battle log for updates
  const checkBattleLog = useCallback((playerInfo: GetPlayerResponse) => {
    const logs = playerInfo.battleLogs ?? [];
    if (logs.length === 0) return;

    const shouldUpdateFight = logs.some(log => FIGHT_EVENTS.has(log.eventType));
    const shouldUpdateSheet = logs.some(log => SHEET_EVENTS.has(log.eventType));

    if (shouldUpdateSheet) {
      applySheetInfoUpdate(playerInfo);
    }

    if (shouldUpdateFight) {
      applyFightInfoUpdate(playerInfo);
    }

    const lastLog = getLastBattleLogFromPlayer(playerInfo);
    setLastBattleLog(lastLog);
  }, [applyFightInfoUpdate, applySheetInfoUpdate, setLastBattleLog]);

  // Main polling loop
  const checkPlayerLoop = useCallback(async () => {
    try {
      if (!player) return;

      const playerInfo = await APIPlayer.get(player.id, lastBattleLog);

      checkBattleLog(playerInfo);

      const hadBattle = player?.fightInfo != null;
      const hasBattleNow = playerInfo?.fightInfo != null;

      if (hadBattle !== hasBattleNow) {
        showToast(
          hasBattleNow
            ? t("playerPage.battle.battleInProgress")
            : t("playerPage.battle.battleEnded")
        );
      }

      // Always update pictos, weapons, luminas and fightInfo
      setPlayer(prev =>
        prev
          ? {
            ...prev,
            fightInfo: playerInfo?.fightInfo ?? undefined,
            pictos: playerInfo?.pictos ?? prev.pictos,
            weapons: playerInfo?.weapons ?? prev.weapons,
            luminas: playerInfo?.luminas ?? prev.luminas
          }
          : prev
      );

      setWasMasterEditing(prev => {
        if (playerInfo.isMasterEditing && !prev) {
          setPlayer(p => (p ? { ...p, isMasterEditing: true } : p));
          return true;
        } else if (!playerInfo.isMasterEditing && prev) {
          setPlayer(playerInfo);
          return false;
        }
        return prev;
      });
    } catch (e: any) {
      showToast(t("playerPage.errors.errorCheckingEditing"));
    }
  }, [player, lastBattleLog, checkBattleLog, setPlayer, showToast]);

  // Set up polling interval
  useEffect(() => {
    const id = setInterval(() => {
      void checkPlayerLoop();
    }, 2000);

    return () => clearInterval(id);
  }, [checkPlayerLoop]);

  return {
    checkPlayerLoop,
    wasMasterEditing
  };
}
