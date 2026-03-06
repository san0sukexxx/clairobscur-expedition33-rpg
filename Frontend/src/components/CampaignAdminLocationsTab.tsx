import { useState, useMemo } from "react";
import { FaMapMarkerAlt, FaChevronDown, FaChevronUp, FaSkull } from "react-icons/fa";
import { getAllLocationsSorted, getMainStoryLocations } from "../utils/LocationUtils";
import { getNpcById, handleNpcImgError } from "../utils/NpcUtils";
import { getPictoByName } from "../utils/PictoUtils";
import type { LocationInfo } from "../api/ResponseModel";
import type { Campaign } from "../api/APICampaign";
import { t, getLocationName, getWeaponName, getWeaponEnglishName, getPictoName } from "../i18n";

interface Props {
    campaignInfo: Campaign;
    onLocationChange: (locationId: string | null) => void;
    onNpcClick: (npcId: string) => void;
    onPictoClick?: (pictoId: string) => void;
    onWeaponClick?: (weaponId: string) => void;
}

export default function CampaignAdminLocationsTab({ campaignInfo, onLocationChange, onNpcClick, onPictoClick, onWeaponClick }: Props) {
    const [filterText, setFilterText] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [mainStoryOnly, setMainStoryOnly] = useState(() => localStorage.getItem("locations.mainStoryOnly") === "true");

    const locations = useMemo(() => {
        if (mainStoryOnly) {
            const storyLocs = getMainStoryLocations();
            if (!filterText.trim()) return storyLocs;
            const search = filterText.toLowerCase();
            return storyLocs.filter((loc) =>
                getLocationName(loc.id).toLowerCase().includes(search) ||
                loc.terrain?.toLowerCase().includes(search) ||
                loc.dangerLevel?.toLowerCase().includes(search)
            );
        }
        const all = getAllLocationsSorted();
        if (!filterText.trim()) return all;
        const search = filterText.toLowerCase();
        return all.filter((loc) =>
            getLocationName(loc.id).toLowerCase().includes(search) ||
            loc.terrain?.toLowerCase().includes(search) ||
            loc.dangerLevel?.toLowerCase().includes(search)
        );
    }, [filterText, mainStoryOnly]);

    function getDangerBadgeClass(level: LocationInfo["dangerLevel"]): string {
        switch (level) {
            case "safe": return "badge-success";
            case "low": return "badge-info";
            case "medium": return "badge-warning";
            case "high": return "badge-error";
            case "deadly": return "bg-red-900 text-white";
            default: return "badge-ghost";
        }
    }

    return (
        <div className="card bg-base-100 shadow">
            <div className="card-body">
                <div className="flex items-center justify-between">
                    <h2 className="card-title flex items-center gap-2">
                        <FaMapMarkerAlt className="opacity-60" />
                        {t("locations.title")}
                    </h2>
                </div>

                {/* Filtro */}
                <input
                    type="text"
                    className="input input-bordered input-sm w-full mt-2"
                    placeholder={t("locations.filterPlaceholder")}
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                />

                <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        className="checkbox checkbox-sm checkbox-primary"
                        checked={mainStoryOnly}
                        onChange={(e) => { setMainStoryOnly(e.target.checked); localStorage.setItem("locations.mainStoryOnly", String(e.target.checked)); }}
                    />
                    <span className="text-sm">{t("locations.mainStoryOnly")}</span>
                </label>

                {locations.length === 0 && (
                    <div className="alert alert-info mt-4 text-sm leading-relaxed">
                        {t("locations.noLocationsFound")}
                    </div>
                )}

                {locations.length > 0 && (
                    <div className="mt-4 flex flex-col divide-y divide-base-300">
                        {locations.map((loc) => {
                            const isExpanded = expandedId === loc.id;
                            const isCurrent = campaignInfo.currentLocationId === loc.id;
                            return (
                                <div key={loc.id} className={`py-3 px-1 ${isCurrent ? "bg-primary/10 rounded-lg border border-primary/30" : ""}`}>
                                    {/* Header */}
                                    <div
                                        className="flex items-center gap-3 cursor-pointer"
                                        onClick={() => setExpandedId(isExpanded ? null : loc.id)}
                                    >
                                        <img
                                            src={loc.imageUrl ?? `/locations/${loc.id}.jpg`}
                                            alt={getLocationName(loc.id)}
                                            className="w-10 h-10 rounded-lg object-cover bg-base-300 shrink-0"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />

                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="font-semibold text-sm">{getLocationName(loc.id)}</span>
                                            <div className="flex flex-wrap gap-1 mt-0.5">
                                                {isCurrent && (
                                                    <span className="badge badge-xs badge-primary">
                                                        <FaMapMarkerAlt className="w-2 h-2 mr-0.5" />
                                                        {t("locations.currentLocation")}
                                                    </span>
                                                )}
                                                {loc.terrain && (
                                                    <span className="badge badge-xs badge-ghost">
                                                        {t(`locations.terrain.${loc.terrain}`)}
                                                    </span>
                                                )}
                                                {loc.dangerLevel && (
                                                    <span className={`badge badge-xs ${getDangerBadgeClass(loc.dangerLevel)}`}>
                                                        {t(`locations.danger.${loc.dangerLevel}`)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                className={`btn btn-xs btn-square ${isCurrent ? "btn-primary" : "btn-ghost btn-outline"}`}
                                                title={isCurrent ? t("locations.currentLocation") : t("locations.setAsCurrent")}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onLocationChange(isCurrent ? null : loc.id);
                                                }}
                                            >
                                                <FaMapMarkerAlt className="w-3 h-3" />
                                            </button>
                                            {((loc.residentNpcIds?.length ?? 0) + (loc.referenceNpcNames?.length ?? 0)) > 0 && (
                                                <span className="badge badge-sm badge-ghost hidden sm:inline-flex">
                                                    {(loc.residentNpcIds?.length ?? 0) + (loc.referenceNpcNames?.length ?? 0)} NPCs
                                                </span>
                                            )}
                                            {(loc.encounters?.length ?? 0) > 0 && (
                                                <span className="badge badge-sm badge-ghost hidden sm:inline-flex">
                                                    {loc.encounters!.length} {t("locations.encounterCount")}
                                                </span>
                                            )}
                                            {isExpanded
                                                ? <FaChevronUp className="w-3 h-3 opacity-50" />
                                                : <FaChevronDown className="w-3 h-3 opacity-50" />
                                            }
                                        </div>
                                    </div>

                                    {/* Expanded details */}
                                    {isExpanded && (
                                        <div className="bg-base-200/50 rounded-lg p-3 mt-2 space-y-3 text-sm">
                                            {/* Descrição */}
                                            {loc.description && (
                                                <p className="opacity-80">{loc.description}</p>
                                            )}

                                            {/* NPCs residentes */}
                                            {(loc.residentNpcIds?.length ?? 0) > 0 && (
                                                <div>
                                                    <span className="font-bold text-xs">{t("locations.residentNpcs")}</span>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {loc.residentNpcIds!.map((npcId) => {
                                                            const npc = getNpcById(npcId);
                                                            return (
                                                                <div
                                                                    key={npcId}
                                                                    className="flex items-center gap-1.5 bg-base-300 rounded-full px-2 py-0.5 cursor-pointer hover:bg-base-content/20 transition-colors"
                                                                    onClick={() => onNpcClick(npcId)}
                                                                    title={npc?.name ?? npcId}
                                                                >
                                                                    <div className="w-5 h-5 rounded-full bg-base-100 overflow-hidden flex items-center justify-center shrink-0">
                                                                        <img
                                                                            src={`/enemies/${npcId}.png`}
                                                                            alt={npc?.name ?? npcId}
                                                                            className="w-full h-full object-cover"
                                                                            onError={(e) => handleNpcImgError(e, npcId)}
                                                                        />
                                                                        <FaSkull className="hidden text-base-content opacity-40 text-[10px]" />
                                                                    </div>
                                                                    <span className="text-xs">{npc?.name ?? npcId}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* NPCs de referência */}
                                            {(loc.referenceNpcNames?.length ?? 0) > 0 && (
                                                <div>
                                                    <span className="font-bold text-xs">{t("locations.referenceNpcs")}</span>
                                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                                        {loc.referenceNpcNames!.map((name) => (
                                                            <span key={name} className="badge badge-sm badge-outline opacity-70">
                                                                {name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Encontros */}
                                            {(loc.encounters?.length ?? 0) > 0 && (
                                                <div>
                                                    <span className="font-bold text-xs">{t("locations.encounters")}</span>
                                                    <div className="flex flex-col gap-1 mt-1">
                                                        {loc.encounters!.map((enc, idx) => (
                                                            <div key={idx} className="flex flex-wrap items-center gap-2 bg-base-300/50 rounded px-2 py-1">
                                                                <div className="flex gap-1">
                                                                    {enc.npcIds.map((npcId) => {
                                                                        const npc = getNpcById(npcId);
                                                                        return (
                                                                            <span key={npcId} className="text-xs">{npc?.name ?? npcId}</span>
                                                                        );
                                                                    })}
                                                                </div>
                                                                {enc.probability && (
                                                                    <span className="badge badge-xs badge-ghost">{enc.probability}</span>
                                                                )}
                                                                {enc.description && (
                                                                    <span className="text-xs opacity-60">{enc.description}</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Loot - Pictos */}
                                            {loc.loot?.some(r => r.type === "picto") && (
                                                <div>
                                                    <span className="font-bold text-xs">Pictos</span>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {loc.loot!.filter(r => r.type === "picto").map((reward, idx) => {
                                                            const pictoInfo = getPictoByName(reward.itemId);
                                                            const imgSrc = pictoInfo?.imageId ? `/pictos/${encodeURI(pictoInfo.imageId)}.webp` : null;
                                                            return (
                                                                <span
                                                                    key={idx}
                                                                    className="badge badge-sm badge-outline cursor-pointer hover:badge-primary transition-colors gap-1"
                                                                    onClick={() => onPictoClick?.(reward.itemId)}
                                                                >
                                                                    {imgSrc && <img src={imgSrc} alt="" className="w-3.5 h-3.5 rounded-sm object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                                                                    {getPictoName(reward.itemId)}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Loot - Armas */}
                                            {loc.loot?.some(r => r.type === "weapon") && (
                                                <div>
                                                    <span className="font-bold text-xs">{t("tabs.weapons")}</span>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {loc.loot!.filter(r => r.type === "weapon").map((reward, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="badge badge-sm badge-outline cursor-pointer hover:badge-primary transition-colors gap-1"
                                                                onClick={() => onWeaponClick?.(reward.itemId)}
                                                            >
                                                                <img src={`/weapons/${encodeURI(getWeaponEnglishName(reward.itemId))}.webp`} alt="" className="w-3.5 h-3.5 rounded-sm object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                                {getWeaponName(reward.itemId)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Locais conectados */}
                                            {(loc.connectedLocationIds?.length ?? 0) > 0 && (
                                                <div>
                                                    <span className="font-bold text-xs">{t("locations.connectedLocations")}</span>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {loc.connectedLocationIds!.map((connId) => (
                                                            <button
                                                                key={connId}
                                                                className="badge badge-sm badge-info cursor-pointer"
                                                                onClick={() => setExpandedId(connId)}
                                                            >
                                                                <FaMapMarkerAlt className="w-2 h-2 mr-1" />
                                                                {getLocationName(connId)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Notas */}
                                            {loc.notes && (
                                                <div>
                                                    <span className="font-bold text-xs">{t("locations.notes")}</span>
                                                    <p className="text-xs opacity-70 mt-0.5 whitespace-pre-wrap">{loc.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
