import { useState, useMemo, useEffect } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { GiStoneTablet } from "react-icons/gi";
import { getAllPictosSorted, pictoColorHex, calculatePictoSpeed, calculatePictoDefense, calculatePictoHealth, calculatePictoAbility } from "../utils/PictoUtils";
import { t } from "../i18n";
import type { PictoInfo } from "../api/ResponseModel";

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
}

export default function CampaignAdminPictosTab({ focusPictoId, onFocusHandled }: PictosTabProps) {
    const [filterText, setFilterText] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(focusPictoId ?? null);

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

    const pictos = useMemo(() => {
        const all = getAllPictosSorted();
        if (!filterText.trim()) return all;
        const search = filterText.toLowerCase();
        return all.filter((p) =>
            p.name.toLowerCase().includes(search) ||
            p.id.toLowerCase().includes(search) ||
            p.color.toLowerCase().includes(search) ||
            p.description.toLowerCase().includes(search)
        );
    }, [filterText]);

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
                                {isExpanded && <PictoDetails picto={picto} />}
                            </div>
                        );
                    })}
                </div>
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

function PictoDetails({ picto }: { picto: PictoInfo }) {
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
        </div>
    );
}
