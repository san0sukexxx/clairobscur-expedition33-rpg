import { useState } from "react";
import { Link } from "react-router-dom";
import { FaPlay, FaClock, FaArchive } from "react-icons/fa";
import { MdOutlineKeyboardBackspace } from "react-icons/md";

// Modelo simples (pode vir de API)
type Campaign = {
  id: string;
  name: string;
  gm: string;           // mestre
  status: "active" | "upcoming" | "archived";
  playersCount: number;
  youAreIn?: boolean;   // se o jogador já participa
};

const MOCK: Campaign[] = [
  { id: "c1", name: "Expedition 33", gm: "Robson", status: "active", playersCount: 4, youAreIn: true },
  { id: "c2", name: "Sombras de Valen", gm: "Elena", status: "upcoming", playersCount: 3 },
  { id: "c3", name: "Ruínas de Orwyn",  gm: "Marcus", status: "archived", playersCount: 5 },
];

export default function CampaignList() {
  const [items] = useState<Campaign[]>(MOCK);
  const campaignPath = location.pathname === "/campaign-list" ? "/character-sheet-list" : "/campaign-admin";

  function statusBadge(s: Campaign["status"]) {
    if (s === "active")   return <span className="badge badge-success gap-1"><FaPlay /> Ativa</span>;
    if (s === "upcoming") return <span className="badge badge-info gap-1"><FaClock /> Em breve</span>;
    return <span className="badge badge-ghost gap-1"><FaArchive /> Arquivada</span>;
  }

  return (
    <div className="min-h-dvh bg-base-200">
      {/* Navbar (mobile) */}
      <div className="navbar bg-base-100 shadow sticky top-0 z-10">
        <div className="flex-1">
          <Link to="/" className="flex items-center gap-2">
            <MdOutlineKeyboardBackspace />
            <span className="text-lg font-bold">Campanhas</span>
          </Link>
        </div>
      </div>

      {/* Conteúdo */}
      <main className="p-4 space-y-4 max-w-md mx-auto">
        {items.length === 0 ? (
          <div className="text-center opacity-70 py-16">
            Nenhuma campanha disponível.
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
                        <div className="mt-2">{statusBadge(c.status)}</div>
                      </div>
                      <div className="text-right text-sm opacity-70">
                        {c.playersCount} jogadores
                      </div>
                    </div>

                    <div className="card-actions justify-end mt-2">
                      <Link
                        to={`${campaignPath}/${c.id}`}
                        className="btn btn-primary btn-sm"
                      >
                        Entrar
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
