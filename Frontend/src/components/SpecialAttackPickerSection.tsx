import React, { useCallback, useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GetPlayerResponse } from "../api/APIPlayer";
import type { SpecialAttackResponse } from "../api/ResponseModel";
import SpecialAttackModal from "./SpecialAttackModal";
import { getEnrichedCharacterSpecialAttacks, getPlayerHasSpecialAttack, getSpecialAttackIsBlocked } from "../utils/SpecialAttackUtils";
import { APISpecialAttack } from "../api/APISpecialAttack";
import { t } from "../i18n";
import { DiamondThumb, highlightSkillDescription, getSkillAbilityModifier } from "../utils/SpecialAttackDisplayUtils";

export interface SpecialAttackPickerProps {
    player: GetPlayerResponse | null;
    setPlayer: React.Dispatch<React.SetStateAction<GetPlayerResponse | null>>;
    inBattle: boolean;
    isUsingSpecialAttackMode?: boolean;
    onUseSpecialAttack?: (specialAttackId: string) => void;
}

function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <div className="p-4">
            <input
                className="w-full rounded-md bg-base-200 border border-base-300 px-3 py-2 outline-none focus:border-base-content/30"
                placeholder={t("specialAttackPicker.searchPlaceholder")}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}

function SpecialAttackCard({ specialAttack, onPick }: { specialAttack: SpecialAttackResponse; onPick?: (s: SpecialAttackResponse) => void }) {
    return (
        <button
            onClick={() => onPick && onPick(specialAttack)}
            className={[
                "w-full text-left grid grid-cols-[56px_1fr] items-center gap-3 p-3",
                "bg-base-200 hover:bg-base-300 transition-colors border border-base-300 rounded-xl py-4 pl-4",
            ].join(" ")}
            aria-label={specialAttack.name}
        >
            <DiamondThumb image={specialAttack.image} alt={specialAttack.name} />
            <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-start gap-2 justify-between flex-wrap">
                    <div className="text-base font-semibold leading-tight">{specialAttack.name}</div>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold leading-none text-base-100 shadow-md flex-shrink-0 ${specialAttack.isGradient ? 'bg-purple-600' : 'bg-blue-600'}`}>
                        {specialAttack.isGradient ? `${specialAttack.cost} ${specialAttack.cost === 1 ? t("specialAttackPicker.charge") : t("specialAttackPicker.charges")}` : specialAttack.cost}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    {specialAttack.type && (
                        <span className={`rounded-full border px-2 py-0.5 ${
                            specialAttack.type === "sun"
                                ? "border-amber-400/30 text-amber-300"
                                : "border-purple-400/30 text-purple-300"
                        }`}>
                            {specialAttack.type === "sun" ? "☀" : "☾"}
                        </span>
                    )}
                    {specialAttack.isGradient && (
                        <span className="rounded-full border border-fuchsia-400/30 px-2 py-0.5 text-fuchsia-200">{t("specialAttackPicker.gradient")}</span>
                    )}
                </div>
            </div>
        </button>
    );
}

export default function SpecialAttackPickerSection({ player, setPlayer, inBattle, isUsingSpecialAttackMode = false, onUseSpecialAttack }: SpecialAttackPickerProps) {
    const [openSlot, setOpenSlot] = useState<number | null>(null);
    const [query, setQuery] = useState("");
    const [slotAssignments, setSlotAssignments] = useState<Record<number, string>>({});
    const [expanded, setExpanded] = useState<Record<number, boolean>>({});
    const [gradientSectionOpen, setGradientSectionOpen] = useState(false);
    const [expandedGradient, setExpandedGradient] = useState<Record<string, boolean>>({});

    const characterSpecialAttacks = useMemo(() =>
        getEnrichedCharacterSpecialAttacks(player),
        [player]
    );

    useEffect(() => {
        if (!player?.specialAttacks) return;

        const assignments: Record<number, string> = {};
        player.specialAttacks.forEach(sa => {
            if (sa.slot !== null && sa.slot !== undefined) {
                assignments[sa.slot] = sa.specialAttackId;
            }
        });
        setSlotAssignments(assignments);
    }, [player?.specialAttacks]);

    const slots: (SpecialAttackResponse | null)[] = useMemo(() => {
        const arr: (SpecialAttackResponse | null)[] = [null, null, null, null, null, null];

        Object.entries(slotAssignments).forEach(([slot, specialAttackId]) => {
            const sa = characterSpecialAttacks.find(s => s.id === specialAttackId);
            if (sa && player && getPlayerHasSpecialAttack(specialAttackId, player) && !getSpecialAttackIsBlocked(specialAttackId, player)) {
                arr[Number(slot)] = sa;
            }
        });

        return arr;
    }, [characterSpecialAttacks, slotAssignments, player]);

    const currentMP = useMemo(() => {
        if (inBattle && player?.fightInfo) {
            const currentChar = player.fightInfo.characters?.find(
                c => c.battleID === player.fightInfo?.playerBattleID
            );
            return currentChar?.magicPoints ?? 0;
        }
        return player?.playerSheet?.mpCurrent ?? 0;
    }, [player, inBattle]);

    const currentGradientCharges = useMemo(() => {
        if (inBattle && player?.fightInfo) {
            const currentChar = player.fightInfo.characters?.find(
                c => c.battleID === player.fightInfo?.playerBattleID
            );
            return Math.floor((currentChar?.gradientPoints ?? 0) / 12);
        }
        return 0;
    }, [player, inBattle]);

    const toggle = useCallback((idx: number) => {
        setExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }));
    }, []);

    const gradientAttacks = useMemo(() =>
        characterSpecialAttacks.filter((s) => s.isGradient && getPlayerHasSpecialAttack(s.id, player)),
        [characterSpecialAttacks, player]
    );

    const filtered = useMemo(() => {
        if (!player) return [];

        const assignedIds = new Set(Object.values(slotAssignments));

        const pool = characterSpecialAttacks.filter((s) =>
            !assignedIds.has(s.id) &&
            !s.isGradient &&
            getPlayerHasSpecialAttack(s.id, player) &&
            !getSpecialAttackIsBlocked(s.id, player)
        );

        const q = query.trim().toLowerCase();
        if (!q) return pool;
        return pool.filter(
            (s) => s.name.toLowerCase().includes(q)
        );
    }, [characterSpecialAttacks, query, slotAssignments, player]);

    async function upsertSpecialAttackAt(slotIndex: number, specialAttack: SpecialAttackResponse) {
        if (!player) return;
        if (getSpecialAttackIsBlocked(specialAttack.id, player) || !getPlayerHasSpecialAttack(specialAttack.id, player)) return;

        const playerSpecialAttack = player.specialAttacks?.find(s => s.specialAttackId === specialAttack.id);
        if (!playerSpecialAttack) return;

        if (playerSpecialAttack.slot === slotIndex) {
            setOpenSlot(null);
            return;
        }

        const previousSpecialAttackInSlot = slotAssignments[slotIndex];

        try {
            if (previousSpecialAttackInSlot && previousSpecialAttackInSlot !== specialAttack.id) {
                const prevPlayerSpecialAttack = player.specialAttacks?.find(s => s.specialAttackId === previousSpecialAttackInSlot);
                if (prevPlayerSpecialAttack) {
                    const prevRelationId = parseInt(prevPlayerSpecialAttack.id);
                    await APISpecialAttack.updatePlayerSpecialAttack(prevRelationId, { slot: null });
                }
            }

            const relationId = parseInt(playerSpecialAttack.id);
            await APISpecialAttack.updatePlayerSpecialAttack(relationId, { slot: slotIndex });

            setPlayer(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    specialAttacks: prev.specialAttacks?.map(s => {
                        if (s.specialAttackId === specialAttack.id) return { ...s, slot: slotIndex };
                        if (s.specialAttackId === previousSpecialAttackInSlot && previousSpecialAttackInSlot !== specialAttack.id) return { ...s, slot: null };
                        return s;
                    }) ?? []
                };
            });

            setOpenSlot(null);
        } catch (error) {
            console.error(t("specialAttackPicker.equipError"), error);
        }
    }

    async function clearSlot(slotIndex: number) {
        if (!player) return;

        const specialAttackId = slotAssignments[slotIndex];
        if (!specialAttackId) return;

        const playerSpecialAttack = player.specialAttacks?.find(s => s.specialAttackId === specialAttackId);
        if (!playerSpecialAttack) return;

        try {
            const relationId = parseInt(playerSpecialAttack.id);
            await APISpecialAttack.updatePlayerSpecialAttack(relationId, { slot: null });

            setPlayer(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    specialAttacks: prev.specialAttacks?.map(s =>
                        s.specialAttackId === specialAttackId ? { ...s, slot: null } : s
                    ) ?? []
                };
            });
        } catch (error) {
            console.error(t("specialAttackPicker.unequipError"), error);
        }
    }

    function handleSlotActivate(idx: number) {
        if (!slots[idx] && !inBattle) setOpenSlot(idx);
    }

    function handleUseSpecialAttack(specialAttackId: string) {
        if (onUseSpecialAttack) {
            onUseSpecialAttack(specialAttackId);
        }
    }

    function getEffectiveCost(specialAttack: SpecialAttackResponse): number {
        return specialAttack.cost;
    }

    function canUseSpecialAttack(specialAttack: SpecialAttackResponse): boolean {
        if (specialAttack.isGradient) {
            const effectiveCost = getEffectiveCost(specialAttack);
            if (currentGradientCharges < effectiveCost) return false;
        }

        return true;
    }

    return (
        <div className="text-base-content">
            <div className="text-center text-lg tracking-widest pb-3 opacity-90">{t("specialAttackPicker.title")}</div>

            {inBattle && !isUsingSpecialAttackMode && (
                <div className="mb-4 rounded-lg bg-primary/15 p-3 text-center text-sm text-primary">
                    {t("specialAttackPicker.cannotEquipInBattle")}
                </div>
            )}

            {isUsingSpecialAttackMode && inBattle && (
                <div className="mb-4 rounded-lg bg-primary/15 p-3 text-center text-sm text-primary">
                    {t("specialAttackPicker.selectEquippedToCombat")}
                </div>
            )}

            {/* Seção de habilidades gradiente */}
            {gradientAttacks.length > 0 && (
                <div className="mb-4 rounded-2xl bg-base-100 border border-fuchsia-500/30 overflow-hidden">
                    <button
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-base-300/30 transition-colors"
                        onClick={() => setGradientSectionOpen(v => !v)}
                    >
                        <div className="flex items-center gap-2">
                            <span className="rounded-full bg-purple-700 px-2 py-0.5 text-[11px] font-bold text-base-100">
                                {gradientAttacks.length}
                            </span>
                            <span className="font-semibold text-fuchsia-300">{t("specialAttackPicker.gradientSection")}</span>
                        </div>
                        <span className={`transition-transform duration-200 text-fuchsia-400 ${gradientSectionOpen ? "rotate-180" : ""}`}>▼</span>
                    </button>

                    <AnimatePresence initial={false}>
                        {gradientSectionOpen && (
                            <motion.div
                                key="gradient-content"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="border-t border-fuchsia-500/20"
                            >
                                <div className="flex flex-col divide-y divide-base-300">
                                    {gradientAttacks.map((sa) => {
                                        const isExpanded = !!expandedGradient[sa.id];
                                        const canUse = canUseSpecialAttack(sa);
                                        return (
                                            <div key={sa.id}>
                                                <div
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => setExpandedGradient(prev => ({ ...prev, [sa.id]: !prev[sa.id] }))}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter" || e.key === " ") {
                                                            e.preventDefault();
                                                            setExpandedGradient(prev => ({ ...prev, [sa.id]: !prev[sa.id] }));
                                                        }
                                                    }}
                                                    className="grid grid-cols-[56px_1fr] items-center gap-3 pl-4 pr-4 py-4 hover:bg-base-300/30 cursor-pointer transition-colors"
                                                >
                                                    <DiamondThumb image={sa.image} alt={sa.name} />
                                                    <div className="flex items-center justify-between gap-2 min-w-0">
                                                        <div className="flex flex-col gap-1 min-w-0">
                                                            <span className="font-semibold leading-tight">{sa.name}</span>
                                                            <div className="flex items-center gap-2 text-xs">
                                                                <span className="rounded-full bg-purple-700 px-2 py-0.5 text-[11px] font-bold text-base-100">
                                                                    {sa.cost} {sa.cost === 1 ? t("specialAttackPicker.charge") : t("specialAttackPicker.charges")}
                                                                </span>
                                                                <span className="rounded-full border border-fuchsia-400/30 px-2 py-0.5 text-fuchsia-200">{t("specialAttackPicker.gradient")}</span>
                                                            </div>
                                                        </div>
                                                        {isUsingSpecialAttackMode && inBattle && (
                                                            <button
                                                                className={`shrink-0 px-4 py-1.5 text-sm rounded-md border border-base-300 ${
                                                                    canUse
                                                                        ? "bg-emerald-600 hover:bg-emerald-500"
                                                                        : "bg-gray-600 opacity-50 cursor-not-allowed"
                                                                }`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (canUse) handleUseSpecialAttack(sa.id);
                                                                }}
                                                                disabled={!canUse}
                                                            >
                                                                {t("common.use")}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <AnimatePresence initial={false}>
                                                    {isExpanded && (
                                                        <motion.div
                                                            key="grad-desc"
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: "auto" }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                        >
                                                            <div className="px-6 py-4 border-t border-base-300">
                                                                <div className="whitespace-pre-line text-[15px] leading-snug text-base-content/90 break-words">
                                                                    {highlightSkillDescription(sa.description, sa.id, getSkillAbilityModifier(sa.id, player))}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {Array.from({ length: 6 }).map((_, idx) => {
                    const selected = slots[idx];

                    const isOpen = !!expanded[idx];

                    return (
                        <div key={idx} className="relative rounded-2xl bg-base-100 border border-base-300 overflow-hidden">
                            <div
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        if (selected) {
                                            toggle(idx);
                                        } else {
                                            handleSlotActivate(idx);
                                        }
                                    }
                                }}
                                onClick={() => {
                                    if (selected) {
                                        toggle(idx);
                                    } else {
                                        handleSlotActivate(idx);
                                    }
                                }}
                                aria-expanded={selected ? isOpen : undefined}
                                aria-controls={selected ? `special-attack-desc-${idx}` : undefined}
                                className={`w-full text-left pl-24 rounded-2xl transition-colors flex items-center relative pr-12 ${
                                    selected
                                        ? "py-8 hover:bg-base-300/30 cursor-pointer"
                                        : (isUsingSpecialAttackMode && inBattle)
                                            ? "py-4 cursor-not-allowed opacity-70"
                                            : (inBattle && !isUsingSpecialAttackMode)
                                                ? "py-4 cursor-not-allowed opacity-70"
                                                : "py-4 hover:bg-base-300/30 cursor-pointer"
                                }`}
                            >
                                {/* Losango lateral */}
                                <div className="absolute left-5 top-1/2 -translate-y-1/2">
                                    <DiamondThumb image={selected?.image} alt={selected?.name ?? t("specialAttackPicker.selectSpecialAttackAlt")} />
                                </div>

                                {selected ? (
                                    <>
                                        <div className="flex-1 flex items-center gap-2 text-lg font-semibold leading-tight mr-20 flex-wrap">
                                            <span>{selected.name}</span>
                                            {selected.type && (
                                                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${
                                                    selected.type === "sun"
                                                        ? "border-amber-400/30 text-amber-300"
                                                        : "border-purple-400/30 text-purple-300"
                                                }`}>
                                                    {selected.type === "sun" ? "☀" : "☾"}
                                                </span>
                                            )}
                                            {selected.isGradient && (
                                                <span className="shrink-0 rounded-full border border-fuchsia-400/30 px-2 py-0.5 text-xs text-fuchsia-200">
                                                    {t("specialAttackPicker.gradient")}
                                                </span>
                                            )}
                                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold leading-none text-base-100 shadow-md ${selected.isGradient ? 'bg-purple-600' : 'bg-blue-600'}`}>
                                                {selected.isGradient ? `${getEffectiveCost(selected)} ${getEffectiveCost(selected) === 1 ? t("specialAttackPicker.charge") : t("specialAttackPicker.charges")}` : getEffectiveCost(selected)}
                                            </span>
                                        </div>

                                        {isUsingSpecialAttackMode && inBattle ? (
                                            <button
                                                className={`absolute right-6 top-1/2 -translate-y-1/2 px-4 py-1.5 text-sm rounded-md border border-base-300 ${
                                                    canUseSpecialAttack(selected)
                                                        ? 'bg-emerald-600 hover:bg-emerald-500'
                                                        : 'bg-gray-600 opacity-50 cursor-not-allowed'
                                                }`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (canUseSpecialAttack(selected)) {
                                                        handleUseSpecialAttack(selected.id);
                                                    }
                                                }}
                                                disabled={!canUseSpecialAttack(selected)}
                                                aria-label={`${t("common.use")} ${selected.name}`}
                                            >
                                                {t("common.use")}
                                            </button>
                                        ) : (
                                            <button
                                                className={`absolute right-6 top-1/2 -translate-y-1/2 px-3 py-1 text-sm rounded-md border border-base-300 ${
                                                    inBattle
                                                        ? 'bg-base-300/30 opacity-50 cursor-not-allowed'
                                                        : 'bg-base-300 hover:bg-base-300/70'
                                                }`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!inBattle) clearSlot(idx);
                                                }}
                                                disabled={inBattle}
                                                aria-label={t("specialAttackPicker.removeFromSlot")}
                                            >
                                                ×
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <div className="w-full opacity-60 py-4">{t("specialAttackPicker.selectASpecialAttack")}</div>
                                )}
                            </div>

                            {/* Área expansível */}
                            {selected && (
                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            id={`special-attack-desc-${idx}`}
                                            key="content"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="border-t border-base-300"
                                        >
                                            <div className="px-6 py-4">
                                                <div className="whitespace-pre-line text-[15px] leading-snug text-base-content/90 break-words">
                                                    {highlightSkillDescription(selected.description, selected.id, getSkillAbilityModifier(selected.id, player))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Modal de seleção */}
            <SpecialAttackModal open={openSlot !== null} onClose={() => setOpenSlot(null)}>
                <SearchBox value={query} onChange={setQuery} />
                <div className="px-4 pb-4 overflow-y-auto max-h-[65vh] grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map((s) => (
                        <SpecialAttackCard key={s.id} specialAttack={s} onPick={(ss) => upsertSpecialAttackAt(openSlot ?? 0, ss)} />
                    ))}
                    {filtered.length === 0 && (
                        <div className="opacity-70 p-8 text-center">{t("specialAttackPicker.noSpecialAttacksFound")}</div>
                    )}
                </div>
            </SpecialAttackModal>
        </div>
    );
}
