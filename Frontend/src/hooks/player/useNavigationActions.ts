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
    if (isAdmin) {
      if (player != undefined && campaignInfo != undefined) {
        try {
          await APIPlayer.setMasterEditing(player.id, false);
        } catch (error) {
          console.log(error);
        }
        navigate(`/campaign-admin/${campaignInfo.id}`);
      } else if (campaign) {
        navigate(`/campaign-admin/${campaign}`);
      }
    } else {
      navigate(`/character-sheet-list/${campaign}`);
    }
  }, [player, campaignInfo, isAdmin, navigate, campaign]);

  return { handleNavigateBackToAdmin };
}
