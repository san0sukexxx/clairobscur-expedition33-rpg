import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiLogOut, FiShare2, FiMaximize, FiMinimize, FiSettings } from "react-icons/fi";
import { FaUserFriends, FaFileAlt, FaShieldAlt, FaScroll, FaDragon, FaMapMarkerAlt, FaSkull } from "react-icons/fa";
import { useApiListRaw } from "../api/UseApiListRaw";
import { APIPlayer, type GetPlayerResponse } from "../api/APIPlayer";
import { APICampaignPlayer } from "../api/APICampaignPlayer";
import { APICampaign, type Campaign } from "../api/APICampaign";
import CampaignAdminSheets from "../components/CampaignAdminSheets";
import CampaignAdminCombatsTab from "../components/CampaignAdminCombatsTab";
import CampaignAdminEncountersTab from "../components/CampaignAdminEncountersTab";
import CampaignAdminLocationsTab from "../components/CampaignAdminLocationsTab";
import CampaignAdminNpcsTab from "../components/CampaignAdminNpcsTab";
import { GameLogSection } from "../components/GameLogSection";
import { t } from "../i18n";
import { useToast } from "../components/Toast";

export default function CampaignAdmin() {
    const [campaignInfo, setCampaignInfo] = useState<Campaign | null>(null);
    const { campaign } = useParams<{ campaign?: string }>();
    const storageKey = `campaign-admin-tab-${campaign}`;
    const [activeTab, setActiveTab] = useState<"players" | "combats" | "encounters" | "locations" | "npcs" | "logs">(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved === "players" || saved === "combats" || saved === "encounters" || saved === "locations" || saved === "npcs" || saved === "logs") return saved;
        return "players";
    });
    const alreadyRan = useRef(false);
    const campaignId = campaign ? parseInt(campaign, 10) : null;
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", onFsChange);
        return () => document.removeEventListener("fullscreenchange", onFsChange);
    }, []);

    const { items, loading, error, reload } = useApiListRaw<GetPlayerResponse>(
        () => (campaignId !== null ? APICampaignPlayer.list(campaignId) : Promise.resolve([])),
        [campaignId]
    );

    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    useEffect(() => {
        if (!loading && !hasLoadedOnce) {
            setHasLoadedOnce(true);
        }
    }, [loading, hasLoadedOnce]);

    const effectiveLoading = hasLoadedOnce ? false : loading;

    useEffect(() => {
        if (campaignId === null) return;

        const interval = setInterval(() => {
            reload();
        }, 2000);

        return () => clearInterval(interval);
    }, [campaignId, reload]);

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
                    name: t("errors.failedToLoad"),
                    characters: []
                };
                setCampaignInfo(emptyCampaign);
            }
        }
    }

    async function handleNavigateToDetails(playerId: number) {
        try {
            await APIPlayer.setMasterEditing(playerId, true);
            navigate(`/campaign-player-admin/${campaign}/${playerId}`);
        } catch {
            console.log(error);
        }
    }

    function handleShareCampaign() {
        if (campaignId !== null) {
            const url = `${window.location.origin}/character-sheet-list/${campaignId}`;

            // Método alternativo caso navigator.clipboard não esteja disponível
            const copyToClipboard = async (text: string) => {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    return navigator.clipboard.writeText(text);
                } else {
                    // Fallback para navegadores mais antigos
                    const textArea = document.createElement("textarea");
                    textArea.value = text;
                    textArea.style.position = "fixed";
                    textArea.style.left = "-999999px";
                    document.body.appendChild(textArea);
                    textArea.select();
                    try {
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                        return Promise.resolve();
                    } catch (err) {
                        document.body.removeChild(textArea);
                        return Promise.reject(err);
                    }
                }
            };

            copyToClipboard(url)
                .then(() => {
                    showToast(t("campaigns.linkCopied"));
                })
                .catch(() => {
                    showToast(t("errors.copyFailed"));
                });
        }
    }

    return (
        <div className="min-h-dvh bg-base-200 flex flex-col">
            {/* Navbar */}
            <div className="navbar bg-base-100 shadow px-4">
                <div className="flex-1">
                    <span className="text-xl font-bold text-primary">{t("campaigns.campaignPanel")}</span>
                </div>

                <div className="flex-none flex gap-2">
                    <button
                        onClick={handleShareCampaign}
                        className="btn btn-ghost btn-square"
                        title={t("campaigns.share") || "Compartilhar"}
                    >
                        <FiShare2 />
                    </button>
                    <button
                        onClick={() => {
                            if (document.fullscreenElement) {
                                document.exitFullscreen();
                            } else {
                                document.documentElement.requestFullscreen();
                            }
                        }}
                        className="btn btn-ghost btn-square"
                        title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
                    >
                        {isFullscreen ? <FiMinimize /> : <FiMaximize />}
                    </button>
                    <button
                        onClick={() => navigate("/settings")}
                        className="btn btn-ghost btn-square"
                        title={t("playerPage.navigation.tabs.settings")}
                    >
                        <FiSettings />
                    </button>
                    <button
                        onClick={() => navigate("/")}
                        className="btn btn-ghost btn-square"
                        title={t("navigation.logout")}
                    >
                        <FiLogOut />
                    </button>
                </div>
            </div>

            {/* Conteúdo */}
            <main className="p-4 lg:p-6 flex flex-col gap-6 flex-1 max-w-[1200px] mx-auto w-full">
                <div>
                    <h1 className="text-3xl font-bold">
                        {campaignInfo?.name ?? t("common.loading")}
                    </h1>
                    <p className="opacity-70">{t("campaigns.campaignAdmin")}</p>
                </div>

                {/* Tabs */}
                <div className="w-full">
                    <div role="tablist" className="tabs tabs-bordered">
                        <button
                            role="tab"
                            className={`tab text-sm px-4 ${activeTab === "players" ? "tab-active font-semibold" : ""}`}
                            onClick={() => { setActiveTab("players"); localStorage.setItem(storageKey, "players"); }}
                        >
                            <span className="flex items-center gap-2">
                                <FaUserFriends />
                                {t("tabs.players")}
                            </span>
                        </button>

                        <button
                            role="tab"
                            className={`tab text-sm px-4 ${activeTab === "combats" ? "tab-active font-semibold" : ""}`}
                            onClick={() => { setActiveTab("combats"); localStorage.setItem(storageKey, "combats"); }}
                        >
                            <span className="flex items-center gap-2">
                                <FaShieldAlt />
                                {t("tabs.combats")}
                            </span>
                        </button>

                        <button
                            role="tab"
                            className={`tab text-sm px-4 ${activeTab === "encounters" ? "tab-active font-semibold" : ""}`}
                            onClick={() => { setActiveTab("encounters"); localStorage.setItem(storageKey, "encounters"); }}
                        >
                            <span className="flex items-center gap-2">
                                <FaDragon />
                                {t("tabs.encounters")}
                            </span>
                        </button>

                        <button
                            role="tab"
                            className={`tab text-sm px-4 ${activeTab === "locations" ? "tab-active font-semibold" : ""}`}
                            onClick={() => { setActiveTab("locations"); localStorage.setItem(storageKey, "locations"); }}
                        >
                            <span className="flex items-center gap-2">
                                <FaMapMarkerAlt />
                                {t("tabs.locations")}
                            </span>
                        </button>

                        <button
                            role="tab"
                            className={`tab text-sm px-4 ${activeTab === "npcs" ? "tab-active font-semibold" : ""}`}
                            onClick={() => { setActiveTab("npcs"); localStorage.setItem(storageKey, "npcs"); }}
                        >
                            <span className="flex items-center gap-2">
                                <FaSkull />
                                NPCs
                            </span>
                        </button>

                        <button
                            role="tab"
                            className={`tab text-sm px-4 ${activeTab === "logs" ? "tab-active font-semibold" : ""}`}
                            onClick={() => { setActiveTab("logs"); localStorage.setItem(storageKey, "logs"); }}
                        >
                            <span className="flex items-center gap-2">
                                <FaScroll />
                                {t("tabs.logs")}
                            </span>
                        </button>

                        {/* Nova aba de detalhes da campanha */}
                        <button
                            role="tab"
                            className="tab text-sm px-4"
                            onClick={() => {
                                if (campaignId != null) {
                                    navigate(`/edit-campaign-details/${campaignId}`);
                                }
                            }}
                        >
                            <span className="flex items-center gap-2">
                                <FaFileAlt />
                                {t("common.details")}
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
                        loading={effectiveLoading}
                        reload={async () => reload()}
                        navigateToDetails={handleNavigateToDetails}
                    />
                )}

                {activeTab === "combats" && campaignId !== null && campaignInfo !== null && (
                    <CampaignAdminCombatsTab
                        campaignInfo={campaignInfo}
                        players={items}
                    />
                )}

                {activeTab === "encounters" && campaignId !== null && campaignInfo !== null && (
                    <CampaignAdminEncountersTab campaignInfo={campaignInfo} />
                )}

                {activeTab === "locations" && (
                    <CampaignAdminLocationsTab />
                )}

                {activeTab === "npcs" && (
                    <CampaignAdminNpcsTab />
                )}

                {activeTab === "logs" && campaignId !== null && (
                    <GameLogSection campaignId={campaignId} />
                )}
            </main>
        </div>
    );
}
