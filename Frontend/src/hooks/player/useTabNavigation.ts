import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type {
  PlayerTab,
  CombatTabType,
  SpecialAttacksTabType,
  UseTabNavigationReturn
} from "../../pages/PlayerPage/PlayerPage.types";

const VALID_TABS: PlayerTab[] = ["ficha", "combate", "habilidades", "inventario", "arma", "pictos", "luminas", "pericias", "notas", "gamelog"];

/**
 * Hook to manage tab navigation state
 */
export function useTabNavigation(): UseTabNavigationReturn {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") as PlayerTab | null;
  const tab: PlayerTab = tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : "ficha";

  const [combatTab, setCombatTab] = useState<CombatTabType>(null);
  const [specialAttacksInitialTab, setSpecialAttacksInitialTab] = useState<SpecialAttacksTabType>("list");
  const [isUsingSpecialAttackMode, setIsUsingSpecialAttackMode] = useState(false);
  const [isInventoryActiveInCombat, setIsInventoryActiveInCombat] = useState(false);
  const [isReviveMode, setIsReviveMode] = useState(false);
  const [revivePercent, setRevivePercent] = useState(30);

  // Reset related states when tab changes
  useEffect(() => {
    if (tab !== "inventario") {
      setIsInventoryActiveInCombat(false);
    }
    if (tab !== "habilidades") {
      setSpecialAttacksInitialTab("list");
      setIsUsingSpecialAttackMode(false);
    }
    if (tab !== "combate") {
      setIsReviveMode(false);
      setCombatTab(null);
    }
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, [tab]);

  const setTab = useCallback((newTab: PlayerTab) => {
    setSearchParams({ tab: newTab }, { replace: false });
  }, [setSearchParams]);

  return {
    tab,
    setTab,
    combatTab,
    setCombatTab,
    specialAttacksInitialTab,
    setSpecialAttacksInitialTab,
    isUsingSpecialAttackMode,
    setIsUsingSpecialAttackMode,
    isInventoryActiveInCombat,
    setIsInventoryActiveInCombat,
    isReviveMode,
    setIsReviveMode,
    revivePercent,
    setRevivePercent
  };
}
