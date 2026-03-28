import { useState, useRef, useEffect, type MutableRefObject } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { AdminMenuDrawer } from "../components/AdminMenuDrawer";
import { FullscreenButton } from "../components/FullscreenButton";
import { FaUserFriends, FaFileAlt, FaShieldAlt, FaScroll, FaDragon, FaMapMarkerAlt, FaSkull } from "react-icons/fa";
import { GiStoneTablet, GiCrossedSwords } from "react-icons/gi";
import { useApiListRaw } from "../api/UseApiListRaw";
import { APIPlayer, type GetPlayerResponse } from "../api/APIPlayer";
import { APICampaignPlayer } from "../api/APICampaignPlayer";
import { APICampaign, type Campaign } from "../api/APICampaign";
import CampaignAdminSheets from "../components/CampaignAdminSheets";
import CampaignAdminCombatsTab from "../components/CampaignAdminCombatsTab";
import CampaignAdminEncountersTab from "../components/CampaignAdminEncountersTab";
import CampaignAdminLocationsTab from "../components/CampaignAdminLocationsTab";
import CampaignAdminNpcsTab from "../components/CampaignAdminNpcsTab";
import CampaignAdminPictosTab from "../components/CampaignAdminPictosTab";
import CampaignAdminWeaponsTab from "../components/CampaignAdminWeaponsTab";
import { GameLogSection } from "../components/GameLogSection";
import DiceBoard, { type DiceBoardRef } from "../components/DiceBoard";
import { FloatingDiceRoller } from "../components/FloatingDiceRoller";
import { RollHistoryToast } from "../components/RollHistoryToast";
import { t } from "../i18n";
import { useToast } from "../components/Toast";

type AdminTab = "players" | "combats" | "encounters" | "locations" | "npcs" | "pictos-list" | "weapons-list" | "logs";
const validTabs: AdminTab[] = ["players", "combats", "encounters", "locations", "npcs", "pictos-list", "weapons-list", "logs"];

export default function CampaignAdmin() {
    const [campaignInfo, setCampaignInfo] = useState<Campaign | null>(null);
    const { campaign } = useParams<{ campaign?: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const tabFromUrl = searchParams.get("tab") as AdminTab | null;
    const activeTab: AdminTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : "players";
    const changeTab = (tab: AdminTab) => {
        setSearchParams({ tab }, { replace: false });
    };

    useEffect(() => {
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
    }, [activeTab]);

    const alreadyRan = useRef(false);
    const campaignId = campaign ? parseInt(campaign, 10) : null;
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [focusNpcId, setFocusNpcId] = useState<string | null>(null);
    const [focusPictoId, setFocusPictoId] = useState<string | null>(null);
    const [focusWeaponId, setFocusWeaponId] = useState<string | null>(null);
    const [focusLocationId, setFocusLocationId] = useState<string | null>(null);
    const diceBoardRef = useRef<DiceBoardRef>(null);
    const timeoutDiceBoardRef: MutableRefObject<ReturnType<typeof setTimeout> | null> = useRef(null);


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

                <div className="flex-none flex items-center">
                    <FullscreenButton />
                    <AdminMenuDrawer onShare={handleShareCampaign} />
                </div>
            </div>

            {/* Conteúdo */}
            <main className="p-4 lg:p-6 pb-24 flex flex-col gap-6 flex-1 max-w-[1200px] mx-auto w-full">
                <div>
                    <h1 className="text-3xl font-bold">
                        {campaignInfo?.name ?? t("common.loading")}
                    </h1>
                    <p className="opacity-70">{t("campaigns.campaignAdmin")}</p>
                </div>

                {/* Tabs */}
                <div className="w-full">
                    <div role="tablist" className="flex flex-wrap gap-1">
                        {([
                            { id: "players" as const, icon: <FaUserFriends />, label: t("tabs.players") },
                            { id: "combats" as const, icon: <FaShieldAlt />, label: t("tabs.combats") },
                            { id: "encounters" as const, icon: <FaDragon />, label: t("tabs.encounters") },
                            { id: "locations" as const, icon: <FaMapMarkerAlt />, label: t("tabs.locations") },
                            { id: "npcs" as const, icon: <FaSkull />, label: "NPCs" },
                            { id: "pictos-list" as const, icon: <GiStoneTablet />, label: t("tabs.pictos") },
                            { id: "weapons-list" as const, icon: <GiCrossedSwords />, label: t("tabs.weapons") },
                            { id: "logs" as const, icon: <FaScroll />, label: t("tabs.logs") },
                        ]).map(({ id, icon, label }) => (
                            <button
                                key={id}
                                role="tab"
                                className={`px-4 py-2 text-sm rounded-lg outline-none ${activeTab === id ? "bg-primary/10 text-primary font-semibold" : "text-base-content/50 hover:text-base-content"}`}
                                onClick={() => changeTab(id)}
                            >
                                <span className="flex items-center gap-2">
                                    {icon}
                                    {label}
                                </span>
                            </button>
                        ))}
                        <button
                            role="tab"
                            className="px-4 py-2 text-sm rounded-lg outline-none text-base-content/50 hover:text-base-content"
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

                {campaignId !== null && campaignInfo !== null && (
                    <div className={activeTab !== "combats" ? "hidden" : undefined}>
                        <CampaignAdminCombatsTab
                            campaignInfo={campaignInfo}
                            players={items}
                        />
                    </div>
                )}

                {activeTab === "encounters" && campaignId !== null && campaignInfo !== null && (
                    <CampaignAdminEncountersTab
                        campaignInfo={campaignInfo}
                        onNpcClick={(npcId) => {
                            setFocusNpcId(npcId);
                            changeTab("npcs");
                        }}
                        onPictoClick={(pictoId) => {
                            setFocusPictoId(pictoId);
                            changeTab("pictos-list");
                        }}
                        onWeaponClick={(weaponId) => {
                            setFocusWeaponId(weaponId);
                            changeTab("weapons-list");
                        }}
                    />
                )}

                {activeTab === "locations" && campaignInfo !== null && (
                    <CampaignAdminLocationsTab
                        campaignInfo={campaignInfo}
                        focusLocationId={focusLocationId}
                        onFocusHandled={() => setFocusLocationId(null)}
                        onLocationChange={async (locationId) => {
                            if (campaignId === null || !campaignInfo) return;
                            await APICampaign.update(campaignId, {
                                name: campaignInfo.name,
                                characters: campaignInfo.characters,
                                currentLocationId: locationId,
                            });
                            setCampaignInfo({ ...campaignInfo, currentLocationId: locationId });
                        }}
                        onNpcClick={(npcId) => {
                            setFocusNpcId(npcId);
                            changeTab("npcs");
                        }}
                        onPictoClick={(pictoId) => {
                            setFocusPictoId(pictoId);
                            changeTab("pictos-list");
                        }}
                        onWeaponClick={(weaponId) => {
                            setFocusWeaponId(weaponId);
                            changeTab("weapons-list");
                        }}
                    />
                )}

                {activeTab === "npcs" && (
                    <CampaignAdminNpcsTab
                        diceBoardRef={diceBoardRef}
                        timeoutDiceBoardRef={timeoutDiceBoardRef}
                        focusNpcId={focusNpcId}
                        onFocusHandled={() => setFocusNpcId(null)}
                        campaignInfo={campaignInfo}
                        onPictoClick={(pictoId) => {
                            setFocusPictoId(pictoId);
                            changeTab("pictos-list");
                        }}
                        onWeaponClick={(weaponId) => {
                            setFocusWeaponId(weaponId);
                            changeTab("weapons-list");
                        }}
                        onLocationClick={(locationId) => {
                            setFocusLocationId(locationId);
                            changeTab("locations");
                        }}
                    />
                )}

                {activeTab === "pictos-list" && (
                    <CampaignAdminPictosTab focusPictoId={focusPictoId} onFocusHandled={() => setFocusPictoId(null)} players={items} campaignInfo={campaignInfo} onLocationClick={(locationId) => { setFocusLocationId(locationId); changeTab("locations"); }} />
                )}

                {activeTab === "weapons-list" && (
                    <CampaignAdminWeaponsTab focusWeaponId={focusWeaponId} onFocusHandled={() => setFocusWeaponId(null)} players={items} campaignInfo={campaignInfo} onLocationClick={(locationId) => { setFocusLocationId(locationId); changeTab("locations"); }} />
                )}

                {activeTab === "logs" && campaignId !== null && (
                    <GameLogSection campaignId={campaignId} />
                )}
            </main>

            {activeTab !== "combats" && (
                <>
                    <DiceBoard ref={diceBoardRef} />
                    <RollHistoryToast />
                    <FloatingDiceRoller diceBoardRef={diceBoardRef} timeoutDiceBoardRef={timeoutDiceBoardRef} className="bottom-4 right-4" />
                </>
            )}
        </div>
    );
}
