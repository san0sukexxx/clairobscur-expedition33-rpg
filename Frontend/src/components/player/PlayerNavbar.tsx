import { t } from "../../i18n";
import { FullscreenButton } from "../FullscreenButton";
import { HamburgerMenuDrawer } from "../HamburgerMenuDrawer";
import type { PlayerTab } from "../../pages/PlayerPage/PlayerPage.types";

interface PlayerNavbarProps {
  onNavigateBack: () => void;
  isExecutingSkill: boolean;
  tab: PlayerTab;
  setTab: (tab: PlayerTab) => void;
}

/**
 * Top navigation bar for PlayerPage
 */
export function PlayerNavbar({ onNavigateBack, isExecutingSkill, tab, setTab }: PlayerNavbarProps) {
  return (
    <div className="navbar bg-base-100 shadow sticky top-0 z-10">
      <div className="flex-1">
        <span className="text-lg font-bold">{t("playerPage.title")}</span>
      </div>
      <div className="flex-none flex items-center">
        <FullscreenButton />
        <HamburgerMenuDrawer
          tab={tab}
          setTab={setTab}
          isExecutingSkill={isExecutingSkill}
          onExit={onNavigateBack}
        />
      </div>
    </div>
  );
}
