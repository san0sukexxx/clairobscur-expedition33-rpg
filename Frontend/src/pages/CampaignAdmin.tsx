import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import { FaUserFriends, FaFileAlt, FaShieldAlt } from "react-icons/fa";
import { useApiListRaw } from "../api/UseApiListRaw";
import { type GetPlayerResponse } from "../api/APIPlayer";
import { APICampaignPlayer } from "../api/APICampaignPlayer";
import { APICampaign, type Campaign } from "../api/APICampaign";
import CampaignAdminSheets from "../components/CampaignAdminSheets";

export default function CampaignAdmin() {
    const [campaignInfo, setCampaignInfo] = useState<Campaign | null>(null);
    const [activeTab, setActiveTab] = useState<"players" | "combats">("players");
    const alreadyRan = useRef(false);

    const { campaign } = useParams<{ campaign?: string }>();
    const campaignId = campaign ? parseInt(campaign, 10) : null;
    const navigate = useNavigate();

    const { items, loading, error, reload } = useApiListRaw<GetPlayerResponse>(
        () => (campaignId !== null ? APICampaignPlayer.list(campaignId) : Promise.resolve([])),
        [campaignId]
    );

    useEffect(() => {
        setup();
    }, [campaignId]);

    async function setup() {
        if (alreadyRan.current) return;
        alreadyRan.current = true;

        if (campaignId != null) {
            try {
                const info = await APICampaign.get(campaignId);
                setCampaignInfo(info);
            } catch {
                const emptyCampaign: Campaign = {
                    id: 0,
                    name: "Falha ao carregar dados da campanha",
                    active: false,
                    characters: [],
                };
                setCampaignInfo(emptyCampaign);
            }
        }
    }

    return (
        <div className="min-h-dvh bg-base-200 flex flex-col">
            {/* Navbar */}
            <div className="navbar bg-base-100 shadow px-4">
                <div className="flex-1">
                    <span className="text-xl font-bold text-primary">Painel da Campanha</span>
                </div>

                <div className="flex-none">
                    <button
                        onClick={() => navigate("/")}
                        className="btn btn-ghost gap-2"
                    >
                        <FiLogOut />
                        Sair
                    </button>
                </div>
            </div>

            {/* Conteúdo */}
            <main className="p-4 lg:p-6 flex flex-col gap-6 flex-1">
                <div>
                    <h1 className="text-3xl font-bold">
                        {campaignInfo?.name ?? "Carregando..."}
                    </h1>
                    <p className="opacity-70">Administração da campanha</p>
                </div>

                {/* Tabs */}
                <div className="w-full">
                    <div role="tablist" className="tabs tabs-bordered">
                        <button
                            role="tab"
                            className={`tab text-sm px-4 ${activeTab === "players" ? "tab-active font-semibold" : ""
                                }`}
                            onClick={() => setActiveTab("players")}
                        >
                            <span className="flex items-center gap-2">
                                <FaUserFriends />
                                Jogadores
                            </span>
                        </button>

                        <button
                            role="tab"
                            className={`tab text-sm px-4 ${activeTab === "combats" ? "tab-active font-semibold" : ""
                                }`}
                            onClick={() => setActiveTab("combats")}
                        >
                            <span className="flex items-center gap-2">
                                <FaShieldAlt />
                                Combates
                            </span>
                        </button>
                    </div>
                </div>

                {/* Conteúdo das abas */}
                {activeTab === "players" && (
                    <CampaignAdminSheets
                        campaignId={campaignId}
                        campaignName={campaignInfo?.name ?? "(desconhecida)"}
                        items={items}
                        loading={loading}
                        reload={async () => reload()}
                        navigateToDetails={(playerId: number) => {
                            navigate(`/campaign-player-admin/${campaign}/${playerId}`);
                        }}
                    />
                )}

                {activeTab === "combats" && (
                    <div className="card bg-base-100 shadow">
                        <div className="card-body">
                            <h2 className="card-title flex items-center gap-2">
                                <FaShieldAlt className="opacity-60" />
                                Combates
                            </h2>
                            <p className="text-sm opacity-70">
                                Aqui você vai poder gerenciar os combates da campanha,
                                iniciativa, inimigos e turnos.
                            </p>

                            <div className="alert alert-info mt-4 text-sm leading-relaxed">
                                Em breve você poderá criar e controlar combates diretamente por aqui.
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
