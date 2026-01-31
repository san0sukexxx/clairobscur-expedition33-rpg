import { FaUser } from "react-icons/fa";
import { LuSwords, LuSword } from "react-icons/lu";
import { GiBackpack, GiStoneTablet, GiCrystalShine, GiMagicSwirl } from "react-icons/gi";
import { t } from "../../i18n";
import type { PlayerTab } from "../../pages/PlayerPage/PlayerPage.types";

interface PlayerTabBarProps {
  tab: PlayerTab;
  setTab: (tab: PlayerTab) => void;
  isExecutingSkill: boolean;
}

interface TabConfig {
  id: PlayerTab;
  icon: React.ReactNode;
  labelKey: string;
}

const TABS: TabConfig[] = [
  { id: "ficha", icon: <FaUser className="mx-auto text-2xl" />, labelKey: "playerPage.navigation.tabs.sheet" },
  { id: "arma", icon: <LuSword className="mx-auto text-2xl" />, labelKey: "playerPage.navigation.tabs.weapon" },
  { id: "pictos", icon: <GiStoneTablet className="mx-auto text-2xl" />, labelKey: "playerPage.navigation.tabs.pictos" },
  { id: "luminas", icon: <GiCrystalShine className="mx-auto text-2xl" />, labelKey: "playerPage.navigation.tabs.luminas" },
  { id: "inventario", icon: <GiBackpack className="mx-auto text-2xl" />, labelKey: "playerPage.navigation.tabs.inventory" },
  { id: "habilidades", icon: <GiMagicSwirl className="mx-auto text-2xl" />, labelKey: "playerPage.navigation.tabs.skills" },
  { id: "combate", icon: <LuSwords className="mx-auto text-2xl" />, labelKey: "playerPage.navigation.tabs.combat" },
];

/**
 * Bottom tab bar for PlayerPage navigation
 */
export function PlayerTabBar({ tab, setTab, isExecutingSkill }: PlayerTabBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-base-100 border-t shadow-lg">
      <nav className="grid grid-cols-7">
        {TABS.map(({ id, icon, labelKey }) => (
          <button
            key={id}
            className={`py-3 ${tab === id ? "text-primary" : "text-base-content/70"} ${isExecutingSkill ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => !isExecutingSkill && setTab(id)}
            disabled={isExecutingSkill}
            aria-label={t(labelKey)}
          >
            {icon}
          </button>
        ))}
      </nav>
    </div>
  );
}
