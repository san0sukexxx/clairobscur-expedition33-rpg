import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { MdMenu, MdClose, MdSettings, MdMenuBook } from "react-icons/md";
import { FiLogOut, FiShare2 } from "react-icons/fi";
import { t } from "../i18n";

interface AdminMenuDrawerProps {
  onShare: () => void;
}

export function AdminMenuDrawer({ onShare }: AdminMenuDrawerProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
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
                {t("campaigns.campaignPanel")}
              </span>
              <button
                onClick={() => setOpen(false)}
                className="btn btn-ghost btn-sm btn-circle"
                aria-label="Fechar"
              >
                <MdClose className="text-xl" />
              </button>
            </div>

            {/* Actions */}
            <nav className="flex flex-col gap-1 p-3 overflow-y-auto flex-1">
              <button
                onClick={() => { setOpen(false); onShare(); }}
                className="flex items-center gap-4 px-4 py-3 rounded-lg w-full text-left hover:bg-base-200 text-base-content/80 transition"
              >
                <FiShare2 className="text-xl" />
                <span className="text-sm font-semibold tracking-wide">
                  {t("campaigns.share")}
                </span>
              </button>
              <button
                onClick={() => { setOpen(false); navigate("/manual/master"); }}
                className="flex items-center gap-4 px-4 py-3 rounded-lg w-full text-left hover:bg-base-200 text-base-content/80 transition"
              >
                <MdMenuBook className="text-xl" />
                <span className="text-sm font-semibold tracking-wide">
                  {t("manual.masterTitle")}
                </span>
              </button>
            </nav>

            {/* Settings & Exit — bottom */}
            <div className="p-3 border-t border-base-300 shrink-0 flex flex-col gap-1">
              <button
                onClick={() => { setOpen(false); navigate("/settings"); }}
                className="flex items-center gap-4 px-4 py-3 rounded-lg w-full text-left hover:bg-base-200 text-base-content/80 transition"
              >
                <MdSettings className="text-xl" />
                <span className="text-sm font-semibold tracking-wide">
                  {t("playerPage.navigation.tabs.settings")}
                </span>
              </button>
              <button
                onClick={() => { setOpen(false); navigate("/"); }}
                className="flex items-center gap-4 px-4 py-3 rounded-lg w-full text-left hover:bg-base-200 text-base-content/80 transition"
              >
                <FiLogOut className="text-xl" />
                <span className="text-sm font-semibold tracking-wide">
                  {t("navigation.logout")}
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
