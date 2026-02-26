import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { MdMenu, MdClose, MdSettings } from "react-icons/md";
import { FaUser } from "react-icons/fa";
import { LuSwords, LuSword } from "react-icons/lu";
import { GiBackpack, GiStoneTablet, GiCrystalShine, GiMagicSwirl } from "react-icons/gi";
import { t } from "../i18n";
import type { PlayerTab } from "../pages/PlayerPage/PlayerPage.types";

interface HamburgerMenuDrawerProps {
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
  { id: "ficha",      icon: <FaUser className="text-xl" />,         labelKey: "playerPage.navigation.tabs.sheet"     },
  { id: "arma",       icon: <LuSword className="text-xl" />,         labelKey: "playerPage.navigation.tabs.weapon"    },
  { id: "pictos",     icon: <GiStoneTablet className="text-xl" />,   labelKey: "playerPage.navigation.tabs.pictos"    },
  { id: "luminas",    icon: <GiCrystalShine className="text-xl" />,  labelKey: "playerPage.navigation.tabs.luminas"   },
  { id: "inventario", icon: <GiBackpack className="text-xl" />,      labelKey: "playerPage.navigation.tabs.inventory" },
  { id: "habilidades",icon: <GiMagicSwirl className="text-xl" />,    labelKey: "playerPage.navigation.tabs.skills"    },
  { id: "combate",    icon: <LuSwords className="text-xl" />,        labelKey: "playerPage.navigation.tabs.combat"    },
];

export function HamburgerMenuDrawer({ tab, setTab, isExecutingSkill }: HamburgerMenuDrawerProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  function handleSelect(id: PlayerTab) {
    if (isExecutingSkill) return;
    setTab(id);
    setOpen(false);
  }

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="btn btn-ghost btn-sm btn-circle"
        aria-label="Menu"
      >
        <MdMenu className="text-2xl" />
      </button>

      {createPortal(
        <>
          {/* Backdrop */}
          {open && (
            <div
              className="fixed inset-0 bg-black/50"
              style={{ zIndex: 9998 }}
              onClick={() => setOpen(false)}
            />
          )}

          {/* Drawer */}
          <div
            className={`fixed top-0 right-0 h-full w-64 bg-base-100 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
              open ? "translate-x-0" : "translate-x-full"
            }`}
            style={{ zIndex: 9999 }}
          >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-base-300 shrink-0">
          <span className="font-extrabold tracking-widest text-xs uppercase opacity-60">
            {t("playerPage.title")}
          </span>
          <button
            onClick={() => setOpen(false)}
            className="btn btn-ghost btn-sm btn-circle"
            aria-label="Fechar"
          >
            <MdClose className="text-xl" />
          </button>
        </div>

        {/* Tab list */}
        <nav className="flex flex-col gap-1 p-3 overflow-y-auto flex-1">
          {TABS.map(({ id, icon, labelKey }) => (
            <button
              key={id}
              onClick={() => handleSelect(id)}
              disabled={isExecutingSkill}
              className={`flex items-center gap-4 px-4 py-3 rounded-lg text-left transition ${
                tab === id
                  ? "bg-primary/15 text-primary font-bold"
                  : "hover:bg-base-200 text-base-content/80"
              } ${isExecutingSkill ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {icon}
              <span className="text-sm font-semibold tracking-wide">
                {t(labelKey)}
              </span>
            </button>
          ))}
        </nav>

        {/* Settings link — bottom of drawer */}
        <div className="p-3 border-t border-base-300 shrink-0">
          <button
            onClick={() => { setOpen(false); navigate("/settings"); }}
            className="flex items-center gap-4 px-4 py-3 rounded-lg w-full text-left hover:bg-base-200 text-base-content/80 transition"
          >
            <MdSettings className="text-xl" />
            <span className="text-sm font-semibold tracking-wide">
              {t("playerPage.navigation.tabs.settings")}
            </span>
          </button>
        </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
