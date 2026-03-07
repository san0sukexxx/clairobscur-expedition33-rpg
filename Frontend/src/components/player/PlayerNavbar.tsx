import { t } from "../../i18n";
import { FullscreenButton } from "../FullscreenButton";
import { HamburgerMenuDrawer } from "../HamburgerMenuDrawer";
import type { PlayerTab } from "../../pages/PlayerPage/PlayerPage.types";

const TAB_LABEL_KEY: Record<PlayerTab, string> = {
  ficha:       "playerPage.navigation.tabs.sheet",
  pericias:    "playerPage.navigation.tabs.skills",
  arma:        "playerPage.navigation.tabs.weapon",
  pictos:      "playerPage.navigation.tabs.pictos",
  luminas:     "playerPage.navigation.tabs.luminas",
  inventario:  "playerPage.navigation.tabs.inventory",
  habilidades: "playerPage.navigation.tabs.specialAttacks",
  combate:     "playerPage.navigation.tabs.combat",
  notas:       "playerPage.navigation.tabs.notes",
  gamelog:      "playerPage.navigation.tabs.gamelog",
};

interface PlayerNavbarProps {
  onNavigateBack: () => void;
  isExecutingSkill: boolean;
  tab: PlayerTab;
  setTab: (tab: PlayerTab) => void;
  setupComplete: boolean;
}

/**
 * Top navigation bar for PlayerPage
 */
export function PlayerNavbar({ onNavigateBack, isExecutingSkill, tab, setTab, setupComplete }: PlayerNavbarProps) {
  return (
    <div className="navbar bg-base-100 shadow sticky top-0 z-10">
      <div className="flex-1">
        <span className="text-lg font-bold">{t(TAB_LABEL_KEY[tab])}</span>
      </div>
      <div className="flex-none flex items-center">
        <FullscreenButton />
        <HamburgerMenuDrawer
          tab={tab}
          setTab={setTab}
          isExecutingSkill={isExecutingSkill}
          setupComplete={setupComplete}
          onExit={onNavigateBack}
        />
      </div>
    </div>
  );
}
