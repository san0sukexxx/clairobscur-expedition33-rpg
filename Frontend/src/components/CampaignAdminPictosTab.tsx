import { useState, useMemo, useEffect } from "react";
import { FaChevronDown, FaChevronUp, FaGift } from "react-icons/fa";
import { GiStoneTablet } from "react-icons/gi";
import { getAllPictosSorted, pictoColorHex, calculatePictoSpeed, calculatePictoDefense, calculatePictoHealth, calculatePictoAbility } from "../utils/PictoUtils";
import { getLocationById } from "../utils/LocationUtils";
import { t } from "../i18n";
import { APIPicto } from "../api/APIPicto";
import { getCharacterLabelById } from "../utils/CharacterUtils";
import { useToast } from "./Toast";
import type { PictoInfo } from "../api/ResponseModel";
import type { GetPlayerResponse } from "../api/APIPlayer";
import type { Campaign } from "../api/APICampaign";

const STAT_CONFIG = [
    { key: "health", label: () => t("pictos.health"), calc: calculatePictoHealth },
    { key: "defense", label: () => t("pictos.defense"), calc: calculatePictoDefense },
    { key: "speed", label: () => t("pictos.speed"), calc: calculatePictoSpeed },
    { key: "strength", label: () => t("pictos.strength"), calc: calculatePictoAbility },
    { key: "intelligence", label: () => t("pictos.intelligence"), calc: calculatePictoAbility },
    { key: "wisdom", label: () => t("pictos.wisdom"), calc: calculatePictoAbility },
    { key: "charisma", label: () => t("pictos.charisma"), calc: calculatePictoAbility },
] as const;

interface PictosTabProps {
    focusPictoId?: string | null;
    onFocusHandled?: () => void;
    players?: GetPlayerResponse[];
    campaignInfo?: Campaign | null;
}

export default function CampaignAdminPictosTab({ focusPictoId, onFocusHandled, players, campaignInfo }: PictosTabProps) {
    const [filterText, setFilterText] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(focusPictoId ?? null);
    const [giveModalPicto, setGiveModalPicto] = useState<PictoInfo | null>(null);
    const [currentLocationOnly, setCurrentLocationOnly] = useState(() => localStorage.getItem("pictos.currentLocationOnly") === "true");
    const { showToast } = useToast();

    useEffect(() => {
        if (focusPictoId) {
            setExpandedId(focusPictoId);
            setFilterText("");
            requestAnimationFrame(() => {
                document.getElementById(`picto-${focusPictoId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
            });
            onFocusHandled?.();
        }
    }, [focusPictoId]);

    const currentLocationLootIds = useMemo(() => {
        if (!currentLocationOnly || !campaignInfo?.currentLocationId) return null;
        const loc = getLocationById(campaignInfo.currentLocationId);
        if (!loc?.loot) return new Set<string>();
        return new Set(loc.loot.filter(r => r.type === "picto").map(r => r.itemId));
    }, [currentLocationOnly, campaignInfo?.currentLocationId]);

    const pictos = useMemo(() => {
        let all = getAllPictosSorted();
        if (currentLocationLootIds) {
            all = all.filter((p) => currentLocationLootIds.has(p.id));
        }
        if (!filterText.trim()) return all;
        const search = filterText.toLowerCase();
        return all.filter((p) =>
            p.name.toLowerCase().includes(search) ||
            p.id.toLowerCase().includes(search) ||
            p.color.toLowerCase().includes(search) ||
            p.description.toLowerCase().includes(search)
        );
    }, [filterText, currentLocationLootIds]);

    return (
        <div className="card bg-base-100 shadow">
            <div className="card-body">
                <div className="flex items-center justify-between">
                    <h2 className="card-title flex items-center gap-2">
                        <GiStoneTablet className="opacity-60" />
                        Pictos
                    </h2>
                    <span className="badge badge-ghost">{pictos.length}</span>
                </div>

                <input
                    type="text"
                    className="input input-bordered input-sm w-full mt-2"
                    placeholder={t("locations.filterPlaceholder")}
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                />

                {campaignInfo?.currentLocationId && (
                    <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-sm checkbox-primary"
                            checked={currentLocationOnly}
                            onChange={(e) => { setCurrentLocationOnly(e.target.checked); localStorage.setItem("pictos.currentLocationOnly", String(e.target.checked)); }}
                        />
                        <span className="text-sm">{t("locations.currentLocationOnly")}</span>
                    </label>
                )}

                {pictos.length === 0 && (
                    <div className="alert alert-info mt-4 text-sm">
                        Nenhum picto encontrado.
                    </div>
                )}

                <div className="mt-4 flex flex-col divide-y divide-base-300">
                    {pictos.map((picto) => {
                        const isExpanded = expandedId === picto.id;
                        return (
                            <div key={picto.id} id={`picto-${picto.id}`} className="py-3 px-1">
                                {/* Header */}
                                <div
                                    className="flex items-center gap-3 cursor-pointer"
                                    onClick={() => setExpandedId(isExpanded ? null : picto.id)}
                                >
                                    <PictoIcon picto={picto} />

                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="font-semibold text-sm">{picto.name}</span>
                                        <span className="text-xs opacity-60">{t("pictos.luminaCost", { cost: picto.luminaCost })}</span>
                                    </div>

                                    <div className="shrink-0">
                                        {isExpanded
                                            ? <FaChevronUp className="w-3 h-3 opacity-50" />
                                            : <FaChevronDown className="w-3 h-3 opacity-50" />
                                        }
                                    </div>
                                </div>

                                {/* Expanded details */}
                                {isExpanded && (
                                    <PictoDetails
                                        picto={picto}
                                        showGive={!!players?.length}
                                        onGive={() => setGiveModalPicto(picto)}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Give to character modal */}
                {giveModalPicto && players && (
                    <GivePictoModal
                        picto={giveModalPicto}
                        players={players}
                        onClose={() => setGiveModalPicto(null)}
                        onGive={async (player, playerName) => {
                            const existing = player.pictos?.find(pp => pp.pictoId.toLowerCase() === giveModalPicto.id.toLowerCase());
                            if (existing) {
                                await APIPicto.updatePlayerPicto(existing.id, { level: (existing.level ?? 1) + 1 });
                            } else {
                                await APIPicto.createPlayerPicto({ playerId: player.id, pictoId: giveModalPicto.id, level: 1 });
                            }
                            showToast(t("pictos.pictoGranted", { name: playerName }));
                            setGiveModalPicto(null);
                        }}
                    />
                )}
            </div>
        </div>
    );
}

function PictoIcon({ picto }: { picto: PictoInfo }) {
    const maskBase = picto.imageId ? encodeURI(`/pictos/${picto.imageId}.webp`) : null;
    const color = pictoColorHex[picto.color];

    if (!maskBase) {
        return (
            <div className="w-10 h-10 rounded bg-base-300 flex items-center justify-center shrink-0">
                <GiStoneTablet className="text-base-content opacity-40 text-sm" />
            </div>
        );
    }

    return (
        <div
            className="w-10 h-10 shrink-0 rotate-45 border border-base-300 rounded-sm grid place-items-center"
            style={{ backgroundColor: "#1a1a2e" }}
        >
            <div
                className="rotate-[-45deg] w-7 h-7"
                style={{
                    backgroundColor: color,
                    WebkitMaskImage: `url("${maskBase}?scope=mask")`,
                    maskImage: `url("${maskBase}?scope=mask")`,
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                }}
            />
        </div>
    );
}

function PictoDetails({ picto, showGive, onGive }: { picto: PictoInfo; showGive?: boolean; onGive?: () => void }) {
    const [level, setLevel] = useState(1);

    const stats = STAT_CONFIG
        .filter(({ key }) => (picto.status as Record<string, number | undefined>)[key] != null)
        .map(({ key, label, calc }) => {
            const base = (picto.status as Record<string, number>)[key];
            return { label: label(), value: calc(base, level) };
        });

    return (
        <div className="bg-base-200/50 rounded-lg p-3 mt-2 space-y-3 text-sm">
            {/* Description */}
            <p className="opacity-80">{picto.description}</p>

            {/* Level selector */}
            <div>
                <span className="font-bold text-xs">{t("pictos.level")}</span>
                <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4].map((lvl) => (
                        <button
                            key={lvl}
                            className={`btn btn-xs ${level === lvl ? "btn-primary" : "btn-ghost"}`}
                            onClick={() => setLevel(lvl)}
                        >
                            {lvl}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            {stats.length > 0 && (
                <div>
                    <span className="font-bold text-xs">Stats</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                        {stats.map(({ label, value }) => (
                            <div key={label} className="bg-base-300 rounded-lg px-3 py-1.5 flex items-center justify-between">
                                <span className="text-xs font-bold opacity-70">{label}</span>
                                <span className="font-bold text-primary">+{value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Triggers */}
            {picto.effectTriggers && picto.effectTriggers.length > 0 && (
                <div>
                    <span className="font-bold text-xs">Triggers</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                        {picto.effectTriggers.map((trigger) => (
                            <span key={trigger} className="badge badge-sm badge-outline">
                                {trigger}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {showGive && (
                <button className="btn btn-sm btn-outline btn-primary gap-2" onClick={onGive}>
                    <FaGift className="w-3 h-3" />
                    {t("pictos.giveToCharacter")}
                </button>
            )}
        </div>
    );
}

function GivePictoModal({ picto, players, onClose, onGive }: {
    picto: PictoInfo;
    players: GetPlayerResponse[];
    onClose: () => void;
    onGive: (player: GetPlayerResponse, playerName: string) => void;
}) {
    const MAX_LEVEL = 4;
    return (
        <dialog className="modal modal-open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal-box">
                <h3 className="font-bold text-lg mb-1">{t("pictos.giveToCharacter")}</h3>
                <p className="text-sm opacity-70 mb-4">{t("pictos.selectCharacterToGive")}</p>
                <p className="text-sm font-semibold mb-3">{picto.name}</p>
                <div className="flex flex-col gap-2">
                    {players.map((p) => {
                        const name = p.playerSheet?.name || `#${p.id}`;
                        const charLabel = getCharacterLabelById(p.playerSheet?.characterId);
                        const existing = p.pictos?.find(pp => pp.pictoId.toLowerCase() === picto.id.toLowerCase());
                        const currentLevel = existing?.level ?? 0;
                        const isMaxLevel = currentLevel >= MAX_LEVEL;

                        return (
                            <button
                                key={p.id}
                                className={`btn btn-sm justify-start gap-2 ${isMaxLevel ? "btn-disabled" : "btn-outline"}`}
                                disabled={isMaxLevel}
                                title={isMaxLevel ? t("pictos.maxLevel") : undefined}
                                onClick={() => onGive(p, name)}
                            >
                                <span className="font-semibold">{name}</span>
                                {charLabel && <span className="text-xs opacity-60">({charLabel})</span>}
                                {existing && (
                                    <span className={`text-xs ml-auto ${isMaxLevel ? "opacity-50" : "opacity-70"}`}>
                                        {isMaxLevel ? t("pictos.maxLevel") : t("pictos.currentLevel", { level: currentLevel })}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
                <div className="modal-action">
                    <button className="btn btn-ghost btn-sm" onClick={onClose}>{t("common.cancel")}</button>
                </div>
            </div>
        </dialog>
    );
}
