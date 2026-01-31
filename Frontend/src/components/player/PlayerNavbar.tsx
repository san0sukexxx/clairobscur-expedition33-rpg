import { MdOutlineKeyboardBackspace } from "react-icons/md";
import { t } from "../../i18n";

interface PlayerNavbarProps {
  onNavigateBack: () => void;
  isExecutingSkill: boolean;
}

/**
 * Top navigation bar for PlayerPage
 */
export function PlayerNavbar({ onNavigateBack, isExecutingSkill }: PlayerNavbarProps) {
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
    </div>
  );
}
