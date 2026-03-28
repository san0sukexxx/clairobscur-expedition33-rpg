import { useCallback, type Dispatch, type SetStateAction } from "react";
import { t } from "../../i18n";
import { APIItem } from "../../api/APIItem";
import type { GetPlayerResponse, BattleCharacterInfo, WeaponInfo } from "../../api/ResponseModel";
import { calculateMaxHP, calculateMaxMP } from "../../utils/PlayerCalculator";
import type { PlayerTab } from "../../pages/PlayerPage/PlayerPage.types";

interface UseReviveActionsParams {
  player: GetPlayerResponse | undefined;
  setPlayer: Dispatch<SetStateAction<GetPlayerResponse | undefined>>;
  weaponInfo: WeaponInfo | null;
  revivePercent: number;
  setRevivePercent: Dispatch<SetStateAction<number>>;
  setIsReviveMode: Dispatch<SetStateAction<boolean>>;
  setTab: (tab: PlayerTab) => void;
  setCombatTab: (tab: "enemies" | "team") => void;
  showToast: (message: string) => void;
}

export function useReviveActions({
  player,
  setPlayer,
  weaponInfo,
  revivePercent,
  setRevivePercent,
  setIsReviveMode,
  setTab,
  setCombatTab,
  showToast
}: UseReviveActionsParams) {

  const handleReviveRequested = useCallback((percent: number) => {
    setRevivePercent(percent);
    const currentCharacter = player?.fightInfo?.characters?.find(
      c => c.battleID === player.fightInfo?.playerBattleID
    );
    const teamTab = currentCharacter?.isEnemy ? "enemies" : "team";
    setCombatTab(teamTab as "enemies" | "team");
    setTab("combate");
    setIsReviveMode(true);
  }, [player, setCombatTab, setTab, setIsReviveMode, setRevivePercent]);

  const handleReviveTarget = useCallback(async (target: BattleCharacterInfo) => {
    if (!player) return;
    try {
      const maxHp = calculateMaxHP(player, weaponInfo);
      const maxMp = calculateMaxMP(player);
      await APIItem.useItem({
        playerId: player.id,
        itemId: "revive-elixir",
        maxHp,
        maxMp,
        recoveryPercent: revivePercent,
        targetBattleCharacterId: target.battleID
      });

      const item = player.items?.find(i => i.itemId === "revive-elixir");
      if (item) {
        setPlayer(prev => {
          if (!prev) return prev;
          const items = (prev.items ?? []).map(i =>
            i.id === item.id ? { ...i, quantity: Math.max(0, i.quantity - 1) } : i
          );
          return { ...prev, items };
        });
      }

      setIsReviveMode(false);
      showToast(t("playerPage.revive.success", { name: target.name, percent: revivePercent }));
    } catch (e) {
      console.error("Erro ao reviver:", e);
      showToast(t("playerPage.errors.errorReviving"));
    }
  }, [player, weaponInfo, revivePercent, setPlayer, setIsReviveMode, showToast]);

  return {
    handleReviveRequested,
    handleReviveTarget
  };
}
