import { useState, useCallback, useEffect } from "react";
import type {
  PlayerTab,
  CombatTabType,
  SkillsTabType,
  UseTabNavigationReturn
} from "../../pages/PlayerPage/PlayerPage.types";

/**
 * Hook to manage tab navigation state
 */
export function useTabNavigation(): UseTabNavigationReturn {
  const [tab, setTabState] = useState<PlayerTab>("ficha");
  const [combatTab, setCombatTab] = useState<CombatTabType>(null);
  const [skillsInitialTab, setSkillsInitialTab] = useState<SkillsTabType>("list");
  const [isUsingSkillMode, setIsUsingSkillMode] = useState(false);
  const [isInventoryActiveInCombat, setIsInventoryActiveInCombat] = useState(false);
  const [isReviveMode, setIsReviveMode] = useState(false);
  const [revivePercent, setRevivePercent] = useState(30);

  // Reset related states when tab changes
  useEffect(() => {
    if (tab !== "inventario") {
      setIsInventoryActiveInCombat(false);
    }
    if (tab !== "habilidades") {
      setSkillsInitialTab("list");
      setIsUsingSkillMode(false);
    }
    if (tab !== "combate") {
      setIsReviveMode(false);
      setCombatTab(null);
    }
  }, [tab]);

  const setTab = useCallback((newTab: PlayerTab) => {
    setTabState(newTab);
  }, []);

  return {
    tab,
    setTab,
    combatTab,
    setCombatTab,
    skillsInitialTab,
    setSkillsInitialTab,
    isUsingSkillMode,
    setIsUsingSkillMode,
    isInventoryActiveInCombat,
    setIsInventoryActiveInCombat,
    isReviveMode,
    setIsReviveMode,
    revivePercent,
    setRevivePercent
  };
}
