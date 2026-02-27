import { useState, useCallback, useEffect } from "react";
import type {
  PlayerTab,
  CombatTabType,
  SpecialAttacksTabType,
  UseTabNavigationReturn
} from "../../pages/PlayerPage/PlayerPage.types";

const VALID_TABS: PlayerTab[] = ["ficha", "combate", "habilidades", "inventario", "arma", "pictos", "luminas", "pericias", "notas", "gamelog"];
const TAB_STORAGE_KEY = "player-active-tab";

function readStoredTab(): PlayerTab {
  try {
    const stored = sessionStorage.getItem(TAB_STORAGE_KEY) as PlayerTab;
    return VALID_TABS.includes(stored) ? stored : "ficha";
  } catch {
    return "ficha";
  }
}

/**
 * Hook to manage tab navigation state
 */
export function useTabNavigation(): UseTabNavigationReturn {
  const [tab, setTabState] = useState<PlayerTab>(readStoredTab);
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
  }, [tab]);

  const setTab = useCallback((newTab: PlayerTab) => {
    try {
      sessionStorage.setItem(TAB_STORAGE_KEY, newTab);
    } catch { /* ignore */ }
    setTabState(newTab);
  }, []);

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
