import { useState, useMemo } from "react";
import { FaMapMarkerAlt, FaChevronDown, FaChevronUp, FaSkull } from "react-icons/fa";
import { getAllLocationsSorted } from "../utils/LocationUtils";
import { getNpcById, handleNpcImgError } from "../utils/NpcUtils";
import type { LocationInfo } from "../api/ResponseModel";
import { t, getLocationName, getWeaponName, getPictoName } from "../i18n";

export default function CampaignAdminLocationsTab() {
    const [filterText, setFilterText] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const locations = useMemo(() => {
        const all = getAllLocationsSorted();
        if (!filterText.trim()) return all;
        const search = filterText.toLowerCase();
        return all.filter((loc) =>
            getLocationName(loc.id).toLowerCase().includes(search) ||
            loc.terrain?.toLowerCase().includes(search) ||
            loc.dangerLevel?.toLowerCase().includes(search)
        );
    }, [filterText]);

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

                {locations.length === 0 && (
                    <div className="alert alert-info mt-4 text-sm leading-relaxed">
                        {t("locations.noLocationsFound")}
                    </div>
                )}

                {locations.length > 0 && (
                    <div className="mt-4 flex flex-col divide-y divide-base-300">
                        {locations.map((loc) => {
                            const isExpanded = expandedId === loc.id;
                            return (
                                <div key={loc.id} className="py-3 px-1">
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
                                            {(loc.residentNpcIds?.length ?? 0) > 0 && (
                                                <span className="badge badge-sm badge-ghost">
                                                    {loc.residentNpcIds!.length} NPCs
                                                </span>
                                            )}
                                            {(loc.encounters?.length ?? 0) > 0 && (
                                                <span className="badge badge-sm badge-ghost">
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
                                                                <div key={npcId} className="flex items-center gap-1.5 bg-base-300 rounded-full px-2 py-0.5">
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

                                            {/* Loot */}
                                            {(loc.loot?.length ?? 0) > 0 && (
                                                <div>
                                                    <span className="font-bold text-xs">{t("locations.loot")}</span>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {loc.loot!.map((reward, idx) => (
                                                            <span key={idx} className="badge badge-sm badge-outline">
                                                                {reward.type === "weapon" ? getWeaponName(reward.itemId) : getPictoName(reward.itemId)}
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
