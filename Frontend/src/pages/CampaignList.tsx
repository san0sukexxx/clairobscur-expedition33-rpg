import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaPlay, FaArchive } from "react-icons/fa";
import { MdOutlineKeyboardBackspace, MdSettings } from "react-icons/md";
import { APICampaign, type Campaign } from "../api/APICampaign";
import { useApiListRaw } from "../api/UseApiListRaw";
import { FullscreenButton } from "../components/FullscreenButton";
import { t } from "../i18n";

export default function CampaignList() {
  const { pathname } = useLocation();
  const campaignPath =
    pathname === "/campaign-list" ? "/character-sheet-list" : "/campaign-admin";

  const { items, loading, error, reload } = useApiListRaw<Campaign>(() =>
    APICampaign.list()
  );

  useEffect(() => {
    const id = setInterval(reload, 2000);
    return () => clearInterval(id);
  }, [reload]);

  return (
    <div className="min-h-dvh bg-base-200">
      {/* Navbar (mobile) */}
      <div className="navbar bg-base-100 shadow sticky top-0 z-10">
        <div className="flex-1">
          <Link to="/" className="flex items-center gap-2">
            <MdOutlineKeyboardBackspace />
            <span className="text-lg font-bold">{t("campaigns.title")}</span>
          </Link>
        </div>
        <div className="flex-none flex items-center">
          <FullscreenButton />
          <Link to="/settings" className="btn btn-ghost btn-sm btn-circle">
            <MdSettings className="text-2xl" />
          </Link>
        </div>
      </div>

      {/* Conteúdo */}
      <main className="p-4 space-y-4 max-w-md mx-auto">
        {loading && <div className="text-center opacity-70 py-16">{t("common.loading")}</div>}

        {error && !loading && (
          <div className="text-center text-error py-16">{error}</div>
        )}

        {!loading && !error && (items.length === 0 ? (
          <div className="text-center opacity-70 py-16">
            {t("campaigns.noCampaigns")}
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((c) => (
              <li key={c.id}>
                <div className="card bg-base-100 shadow">
                  <div className="card-body p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="card-title text-base">{c.name}</h2>
                      </div>
                    </div>

                    <div className="card-actions justify-end mt-2">
                      <Link to={`${campaignPath}/${c.id}`} className="btn btn-primary btn-sm">
                        {t("common.enter")}
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ))}
      </main>
    </div>
  );
}
