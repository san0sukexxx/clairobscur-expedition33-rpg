import { useState } from "react";
import { Link } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import { FaUserFriends, FaFileAlt, FaMusic } from "react-icons/fa";
import { nanoid } from "nanoid";

// Modelo de dados (exemplo)
type Player = { id: string; name: string; character?: string };

export default function CampaignAdmin() {
    const [campaignName] = useState("Expedition 33");
    const [players, setPlayers] = useState<Player[]>([
        { id: "1", name: "Gustave Moreau", character: "Gustave" },
        { id: "2", name: "Elena D.", character: "Sciel" },
        { id: "3", name: "Marcus V.", character: "Lune" },
    ]);

    function addPlayer() {
        const name = prompt("Nome do jogador:");
        if (!name) return;
        setPlayers((prev) => [
            ...prev,
            { id: nanoid(), name, character: "" },
        ]);
    }

    return (
        <div className="drawer lg:drawer-open min-h-dvh bg-base-200">
            {/* Drawer toggle (mobile) */}
            <input id="admin-drawer" type="checkbox" className="drawer-toggle" />

            {/* Conteúdo principal */}
            <div className="drawer-content flex flex-col">
                {/* Navbar */}
                <div className="navbar bg-base-100 shadow">
                    <div className="flex-none lg:hidden">
                        <label htmlFor="admin-drawer" className="btn btn-ghost btn-square">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"
                                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </label>
                    </div>
                    <div className="flex-1">
                        <span className="text-xl font-bold text-primary">Painel da Campanha</span>
                    </div>
                </div>

                {/* Área principal */}
                <main className="p-4 lg:p-6">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold">
                            {campaignName}
                        </h1>
                        <p className="opacity-70">Administração da campanha</p>
                    </div>

                    {/* Card de jogadores */}
                    <div className="card bg-base-100 shadow">
                        <div className="card-body">
                            <div className="flex items-center justify-between gap-4">
                                <h2 className="card-title">
                                    <FaUserFriends className="opacity-60" /> Jogadores ({players.length})
                                </h2>
                                <button className="btn btn-primary btn-sm" onClick={addPlayer}>
                                    Adicionar jogador
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Nome</th>
                                            <th>Personagem</th>
                                            <th className="text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {players.map((p, i) => (
                                            <tr key={p.id}>
                                                <td>{i + 1}</td>
                                                <td>{p.name}</td>
                                                <td className="opacity-80">{p.character || "-"}</td>
                                                <td className="text-right">
                                                    <button
                                                        className="btn btn-ghost btn-xs"
                                                        onClick={() =>
                                                            setPlayers((prev) => prev.filter((x) => x.id !== p.id))
                                                        }
                                                    >
                                                        Remover
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {players.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="text-center opacity-60">
                                                    Nenhum jogador ainda.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Sidebar / Menu */}
            <div className="drawer-side">
                <label htmlFor="admin-drawer" className="drawer-overlay"></label>
                <aside className="w-72 bg-base-100 p-4">
                    <div className="mb-6 px-2">
                        <div className="text-lg font-bold">Menu</div>
                        <div className="text-sm opacity-60">Campanha</div>
                    </div>

                    <ul className="menu w-full">
                        <li>
                            <Link to="/" className="gap-2">
                                <FiLogOut /> Sair
                            </Link>
                        </li>
                        <li>
                            <Link to="#" className="gap-2">
                                <FaFileAlt /> Fichas
                            </Link>
                        </li>
                        <li>
                            <Link to="#" className="gap-2">
                                <FaMusic /> Sons
                            </Link>
                        </li>
                    </ul>
                </aside>
            </div>
        </div>
    );
}
