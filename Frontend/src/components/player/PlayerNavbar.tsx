import { MdOutlineKeyboardBackspace } from "react-icons/md";
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
        <button
          onClick={() => !isExecutingSkill && onNavigateBack()}
          disabled={isExecutingSkill}
          className={`flex items-center gap-2 text-lg font-bold transition ${
            isExecutingSkill
              ? "opacity-50 cursor-not-allowed"
              : "hover:opacity-80"
          }`}
        >
          <MdOutlineKeyboardBackspace className="text-2xl" />
          <span>{t("playerPage.title")}</span>
        </button>
      </div>
      <div className="flex-none flex items-center">
        <FullscreenButton />
        <HamburgerMenuDrawer
          tab={tab}
          setTab={setTab}
          isExecutingSkill={isExecutingSkill}
        />
      </div>
    </div>
  );
}
