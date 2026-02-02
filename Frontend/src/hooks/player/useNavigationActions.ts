import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { APIPlayer } from "../../api/APIPlayer";
import type { GetPlayerResponse, CampaignInfo } from "../../api/ResponseModel";

interface UseNavigationActionsParams {
  player: GetPlayerResponse | undefined;
  campaignInfo: CampaignInfo | undefined;
  campaign: string | undefined;
  isAdmin: boolean;
}

export function useNavigationActions({
  player,
  campaignInfo,
  campaign,
  isAdmin
}: UseNavigationActionsParams) {
  const navigate = useNavigate();

  const handleNavigateBackToAdmin = useCallback(async () => {
    if (player == undefined || campaignInfo == undefined) return;

    if (isAdmin) {
      try {
        await APIPlayer.setMasterEditing(player.id, false);
        navigate(`/campaign-admin/${campaignInfo.id}`);
      } catch (error) {
        console.log(error);
      }
    } else {
      navigate(`/character-sheet-list/${campaign}`);
    }
  }, [player, campaignInfo, isAdmin, navigate, campaign]);

  return { handleNavigateBackToAdmin };
}
