import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { t } from "../../i18n";
import { APIPlayer, type CreatePlayerInput, type GetPlayerResponse } from "../../api/APIPlayer";
import { APICampaign, type Campaign } from "../../api/APICampaign";
import type { UsePlayerDataReturn } from "../../pages/PlayerPage/PlayerPage.types";

/**
 * Hydrate parsed JSON fields back into typed objects
 */
function hydratePlayer(p: GetPlayerResponse): GetPlayerResponse {
  const abilityScores = p.playerSheet?.abilityScoresData
    ? (() => { try { return JSON.parse(p.playerSheet.abilityScoresData!); } catch { return undefined; } })()
    : p.playerSheet?.abilityScores;
  return {
    ...p,
    playerSheet: abilityScores ? { ...p.playerSheet, abilityScores } : p.playerSheet,
  };
}

/**
 * Get the last battle log ID from player info
 */
function getLastBattleLogFromPlayer(playerInfo: GetPlayerResponse): number | undefined {
  if (playerInfo.battleLogs && playerInfo.battleLogs.length > 0) {
    let lastId = 0;
    for (const log of playerInfo.battleLogs) {
      if (log.id > lastId) {
        lastId = log.id;
      }
    }
    return lastId;
  }
  return undefined;
}

interface UsePlayerDataParams {
  campaign: string | undefined;
  character: string | undefined;
}

/**
 * Hook to manage player data loading and state
 */
export function usePlayerData({ campaign, character }: UsePlayerDataParams): UsePlayerDataReturn {
  const navigate = useNavigate();
  const alreadyRan = useRef(false);
  const previousCharacterId = useRef<string | undefined>(undefined);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [player, setPlayer] = useState<GetPlayerResponse | null>(null);
  const [campaignInfo, setCampaignInfo] = useState<Campaign | null>(null);
  const [lastBattleLog, setLastBattleLog] = useState<number | undefined>();

  // Fetch campaign and player info
  const fetchInfo = useCallback(async () => {
    try {
      if (!campaign || !character) return;
      const campaignId = parseInt(campaign);

      const [campaignData, playerResponse] = await Promise.all([
        APICampaign.get(campaignId),
        APIPlayer.get(parseInt(character))
      ]);

      const lastLog = getLastBattleLogFromPlayer(playerResponse);
      setLastBattleLog(lastLog);

      setPlayer(hydratePlayer(playerResponse));
      setCampaignInfo(campaignData);

      setLoading(false);
    } catch (e: any) {
      console.error("Erro ao carregar player:", e);
      setError(t("errors.errorLoading") + " " + e?.message);
    }
  }, [campaign, character]);

  // Initial setup
  const setup = useCallback(() => {
    if (alreadyRan.current) return;
    alreadyRan.current = true;

    if (character == undefined) {
      const createSheet = async () => {
        try {
          const input: CreatePlayerInput = { campaign: Number(campaign)! };
          const response = await APIPlayer.create(input);

          navigate(`/campaign-player/${campaign}/${response.id}`, { replace: true });
        } catch (e: any) {
          setError(t("errors.errorLoading") + " " + e?.message);
        }
      };

      createSheet();
    } else {
      fetchInfo();
    }
  }, [campaign, character, fetchInfo, navigate]);

  // Run setup on mount
  useEffect(() => {
    setup();
  }, [setup]);

  // Reload player data when characterId changes
  useEffect(() => {
    const currentCharId = player?.playerSheet?.characterId;

    if (previousCharacterId.current && currentCharId && previousCharacterId.current !== currentCharId) {
      if (character) {
        APIPlayer.get(parseInt(character)).then(updatedPlayer => {
          setPlayer(updatedPlayer);
        }).catch(error => {
          console.error("Erro ao recarregar dados do player:", error);
        });
      }
    }

    previousCharacterId.current = currentCharId;
  }, [player?.playerSheet?.characterId, character]);

  return {
    player,
    setPlayer,
    campaignInfo,
    loading,
    error,
    lastBattleLog,
    setLastBattleLog
  };
}

export { getLastBattleLogFromPlayer };
