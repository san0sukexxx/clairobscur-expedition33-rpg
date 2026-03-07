import React, { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { FaChevronDown, FaChevronUp, FaInfoCircle, FaLock, FaUnlock, FaTrash, FaExchangeAlt } from "react-icons/fa";
import { GiCrossedSwords } from "react-icons/gi";
import type { PlayerSpecialAttackResponse, SpecialAttackResponse } from "../api/ResponseModel";
import type { GetPlayerResponse } from "../api/APIPlayer";
import { getPlayerHasSpecialAttack, getSpecialAttackById, getSpecialAttackIsBlocked, getEnrichedCharacterSpecialAttacks, calculateUsedSpecialAttackPoints, hasPrerequisitesFulfilled } from "../utils/SpecialAttackUtils";
import { calculateSpecialAttackPoints } from "../utils/PlayerCalculator";
import { APISpecialAttack } from "../api/APISpecialAttack";
import { renderStainText } from "../utils/StainTextUtils";
import { t } from "../i18n";

export interface SpecialAttacksListTabProps {
    player: GetPlayerResponse | null;
    setPlayer: React.Dispatch<React.SetStateAction<GetPlayerResponse | null>>;
    isAdmin: boolean;
    inBattle: boolean;
    onFlipToPicker?: () => void;
}

export default function SpecialAttacksListSection({ player, setPlayer, isAdmin, inBattle, onFlipToPicker }: SpecialAttacksListTabProps) {
    if(!player) { return }

    const list: SpecialAttackResponse[] = getEnrichedCharacterSpecialAttacks(player);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [gradientOpen, setGradientOpen] = useState(false);

    const totalPoints = calculateSpecialAttackPoints(player);
    const usedPoints = calculateUsedSpecialAttackPoints(player);
    const remainingPoints = totalPoints - usedPoints;

    const { unlockableSkills, blockedSkills, unlockedSkills, gradientSkills } = useMemo(() => {
        const unlockable: SpecialAttackResponse[] = [];
        const blocked: SpecialAttackResponse[] = [];
        const unlocked: SpecialAttackResponse[] = [];
        const gradient: SpecialAttackResponse[] = [];
        const alpha = (a: SpecialAttackResponse, b: SpecialAttackResponse) => a.name.localeCompare(b.name, "pt-BR");
        for (const sa of list) {
            if (sa.isGradient) { gradient.push(sa); continue; }
            const owned = getPlayerHasSpecialAttack(sa.id, player!);
            if (owned) { unlocked.push(sa); continue; }
            const canUnlock = !getSpecialAttackIsBlocked(sa.id, player!) && hasPrerequisitesFulfilled(sa.id, player!);
            const hasPoints = (sa.unlockCost ?? 0) <= remainingPoints;
            if (canUnlock && hasPoints) unlockable.push(sa);
            else blocked.push(sa);
        }
        unlockable.sort(alpha);
        blocked.sort(alpha);
        unlocked.sort(alpha);
        gradient.sort(alpha);
        return { unlockableSkills: unlockable, blockedSkills: blocked, unlockedSkills: unlocked, gradientSkills: gradient };
    }, [list, player, remainingPoints]);

    const toggle = useCallback((id: string) => {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    }, []);

    if (list.length === 0) {
        return (
            <div className="w-full py-10 text-center opacity-70">
                <p>{t("specialAttacks.noSpecialAttacks")}</p>
            </div>
        );
    }

    function findFirstEmptySlot(): number | null {
        const usedSlots = new Set(
            (player?.specialAttacks ?? [])
                .filter(s => s.slot !== null && s.slot !== undefined)
                .map(s => s.slot as number)
        );
        for (let i = 0; i < 6; i++) {
            if (!usedSlots.has(i)) return i;
        }
        return null;
    }

    async function handleUnlock(specialAttackId: string) {
        if (!player) return;

        const alreadyUnlocked = player.specialAttacks?.some(s => s.specialAttackId === specialAttackId);
        if (alreadyUnlocked) return;

        const specialAttackInfo = getSpecialAttackById(specialAttackId);
        const isGradient = specialAttackInfo?.isGradient ?? false;
        const emptySlot = isGradient ? null : findFirstEmptySlot();

        try {
            const relationId = await APISpecialAttack.addPlayerSpecialAttack({
                playerId: player.id,
                specialAttackId: specialAttackId,
                slot: emptySlot,
            });

            const newSpecialAttack: PlayerSpecialAttackResponse = {
                id: relationId.toString(),
                specialAttackId: specialAttackId,
                slot: emptySlot,
            };

            setPlayer((prev) => {
                if (!prev) return prev;
                return { ...prev, specialAttacks: [...(prev.specialAttacks ?? []), newSpecialAttack] };
            });
        } catch (error) {
            console.error(t("specialAttacksList.unlockError"), error);
        }
    }

    async function handleRemove(specialAttackId: string) {
        if (!player) return;

        const playerSpecialAttack = player.specialAttacks?.find(s => s.specialAttackId === specialAttackId);
        if (!playerSpecialAttack) return;

        try {
            const relationId = parseInt(playerSpecialAttack.id);
            await APISpecialAttack.deletePlayerSpecialAttack(relationId);

            setPlayer((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    specialAttacks: prev.specialAttacks?.filter(s => s.specialAttackId !== specialAttackId) ?? []
                };
            });
        } catch (error) {
            console.error(t("specialAttacksList.removeError"), error);
        }
    }

    const highlight = (text: string, specialAttackId?: string) => {
        // Only apply stain text rendering (converts "Mancha de X" to images) for Lune's special attacks
        const isLuneSpecialAttack = specialAttackId?.toLowerCase().includes("lune") ?? false;
        const stainRendered = isLuneSpecialAttack ? renderStainText(text) : [text];

        // Check if this is a Maelle special attack
        const isMaelleSpecialAttack = specialAttackId?.toLowerCase().includes("maelle") ?? false;

        // Then apply term highlighting on each text chunk
        const terms = ["Físico", "Predição", "Predições", "Mágico", "Sangramento", "Veneno", "Atordoamento"];

        // Add Verso's Perfection Ranks with their colors
        const rankTerms = ["Rank S", "Rank A", "Rank B", "Rank C", "Rank D"];

        // Add Monoco's Bestial Wheel masks with their colors
        const maskTerms = ["Máscara Onipotente", "Máscara Todopoderosa", "Máscara Lançadora", "Máscara de Conjurador", "Máscara Ágil", "Máscara Equilibrada", "Máscara Pesada"];

        // Add Maelle's stance terms with their colors
        const stanceTerms = ["Defensiva", "Ofensiva", "Virtuosa"];

        const allTerms = [...terms, ...rankTerms, ...maskTerms, ...(isMaelleSpecialAttack ? stanceTerms : [])];
        const pattern = new RegExp(`\\b(${allTerms.join("|")})\\b`, "g");

        // Function to get rank color class
        const getRankColorClass = (rank: string): string => {
            switch(rank) {
                case "Rank S": return "text-red-400 font-bold border-b-2 border-red-400";
                case "Rank A": return "text-purple-400 font-bold border-b-2 border-purple-400";
                case "Rank B": return "text-blue-400 font-bold border-b-2 border-blue-400";
                case "Rank C": return "text-amber-200 font-bold border-b-2 border-amber-200";
                case "Rank D": return "text-gray-400 font-bold border-b-2 border-gray-400";
                default: return "text-amber-300 font-semibold";
            }
        };

        // Function to get mask color class
        const getMaskColorClass = (mask: string): string => {
            switch(mask) {
                case "Máscara Onipotente": return "text-warning font-bold border-b-2 border-warning";
                case "Máscara Todopoderosa": return "text-warning font-bold border-b-2 border-warning";
                case "Máscara Lançadora": return "text-info font-bold border-b-2 border-info";
                case "Máscara de Conjurador": return "text-info font-bold border-b-2 border-info";
                case "Máscara Ágil": return "text-purple-600 font-bold border-b-2 border-purple-600";
                case "Máscara Equilibrada": return "text-error font-bold border-b-2 border-error";
                case "Máscara Pesada": return "text-success font-bold border-b-2 border-success";
                default: return "text-amber-300 font-semibold";
            }
        };

        // Function to get stance color class (Maelle)
        const getStanceColorClass = (stance: string): string => {
            switch(stance) {
                case "Defensiva": return "text-blue-400 font-bold border-b-2 border-blue-400";
                case "Ofensiva": return "text-red-400 font-bold border-b-2 border-red-400";
                case "Virtuosa": return "text-purple-400 font-bold border-b-2 border-purple-400";
                default: return "text-amber-300 font-semibold";
            }
        };

        return stainRendered.map((node, nodeIdx) => {
            // If it's already a React element (stain image), keep it as is
            if (typeof node !== "string") {
                return <React.Fragment key={`stain-${nodeIdx}`}>{node}</React.Fragment>;
            }

            // Otherwise, apply term highlighting to text chunks
            return node.split(pattern).map((chunk, chunkIdx) => {
                if (rankTerms.includes(chunk)) {
                    // Apply rank-specific styling
                    return (
                        <span key={`${nodeIdx}-${chunkIdx}`} className={getRankColorClass(chunk)}>
                            {chunk}
                        </span>
                    );
                } else if (maskTerms.includes(chunk)) {
                    // Apply mask-specific styling
                    return (
                        <span key={`${nodeIdx}-${chunkIdx}`} className={getMaskColorClass(chunk)}>
                            {chunk}
                        </span>
                    );
                } else if (stanceTerms.includes(chunk) && isMaelleSpecialAttack) {
                    // Apply stance-specific styling (Maelle only)
                    return (
                        <span key={`${nodeIdx}-${chunkIdx}`} className={getStanceColorClass(chunk)}>
                            {chunk}
                        </span>
                    );
                } else if (terms.includes(chunk)) {
                    // Apply general term highlighting
                    return (
                        <span key={`${nodeIdx}-${chunkIdx}`} className="text-amber-300 font-semibold">
                            {chunk}
                        </span>
                    );
                } else {
                    return <React.Fragment key={`${nodeIdx}-${chunkIdx}`}>{chunk}</React.Fragment>;
                }
            });
        });
    };

    function renderSkillCard(specialAttack: SpecialAttackResponse) {
        const isOpen = !!expanded[specialAttack.id];
        const specialAttackInfo = getSpecialAttackById(specialAttack.id);

        if (!specialAttackInfo) return null;

        if (getSpecialAttackIsBlocked(specialAttack.id, player)) {
            return (
                <article
                    key={specialAttack.id}
                    className="group relative flex h-full items-center justify-center rounded-2xl border border-base-300 bg-base-100 p-10 shadow-sm"
                    aria-label={t("specialAttacks.specialAttackBlocked")}
                >
                    <div className="flex flex-col items-center gap-2 text-base-content/60">
                        <div className="relative h-12 w-12">
                            <div className="absolute inset-0 rotate-45 overflow-hidden rounded-sm border border-base-300 bg-base-200/50" />
                            <div className="absolute inset-0 -rotate-45 flex items-center justify-center">
                                <FaLock className="h-7 w-7 opacity-80" aria-hidden />
                            </div>
                        </div>
                        <span className="text-xs opacity-70">{t("specialAttacks.locked")}</span>
                    </div>
                </article>
            );
        }

        const disabled = !getPlayerHasSpecialAttack(specialAttack.id, player);

        return (
            <motion.article
                key={specialAttack.id}
                layoutId={`skill-card-${specialAttack.id}`}
                layout
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                className="group relative flex h-full flex-col rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm transition-shadow hover:shadow-md focus-within:ring-1 focus-within:ring-base-content/20"
            >
                <button
                    type="button"
                    onClick={() => toggle(specialAttack.id)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggle(specialAttack.id);
                        }
                    }}
                    className="w-full cursor-pointer select-none text-left outline-none"
                    aria-expanded={isOpen}
                    aria-controls={`special-attack-desc-${specialAttack.id}`}
                >
                    <div className="flex items-center gap-4">
                        <div className="relative h-12 w-12 shrink-0">
                            <div className="absolute inset-0 rotate-45 overflow-hidden rounded-sm border border-base-300 bg-base-200/50">
                                {specialAttackInfo.image ? (
                                    <img
                                        src={`/skills/${specialAttackInfo.image}`}
                                        alt={specialAttackInfo.name}
                                        className={`${disabled ? "opacity-70 grayscale" : ""} h-full w-full -rotate-45 object-cover`}
                                    />
                                ) : (
                                    <div className="flex h-full w-full -rotate-45 items-center justify-center">
                                        <GiCrossedSwords className="h-5 w-5 opacity-70" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 min-w-0">
                                <h3 className="truncate text-lg font-semibold tracking-wide text-base-content min-w-0">
                                    <span className={`${disabled ? "opacity-70 grayscale" : ""} block truncate`}>{specialAttackInfo.name}</span>
                                </h3>

                                {specialAttackInfo.type && (
                                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${
                                        specialAttackInfo.type === "sun"
                                            ? "border-amber-400/30 text-amber-300"
                                            : "border-purple-400/30 text-purple-300"
                                    }`}>
                                        {specialAttackInfo.type === "sun" ? "☀" : "☾"}
                                    </span>
                                )}

                                {specialAttackInfo.isGradient && (
                                    <span className="shrink-0 rounded-full border border-fuchsia-400/30 px-2 py-0.5 text-xs text-fuchsia-200">
                                        {t("specialAttackPicker.gradient")}
                                    </span>
                                )}

                                <span className={`ml-auto shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold leading-none text-base-100 shadow-md ${specialAttackInfo.isGradient ? 'bg-purple-600' : 'bg-blue-600'}`}>
                                    {specialAttackInfo.isGradient ? `${specialAttackInfo.cost} ${specialAttackInfo.cost === 1 ? t("specialAttackPicker.charge") : t("specialAttackPicker.charges")}` : specialAttackInfo.cost}
                                </span>
                            </div>

                            {disabled && (() => {
                                const prereqKey = `specialAttacks.${specialAttack.id}.prerequisite`;
                                const prereqText = t(prereqKey);
                                const hasPrereq = prereqText !== prereqKey;
                                return (
                                    <>
                                        <div className="mt-1 inline-flex items-center gap-1 rounded-md border border-warning/40 bg-warning/25 px-2 py-0.5 text-[11px] text-warning">
                                            <FaInfoCircle className="h-3.5 w-3.5" aria-hidden />
                                            <span>{t("specialAttacksList.notUnlocked")}</span>
                                        </div>
                                        {hasPrereq && (
                                            <p className="mt-1 text-[11px] leading-tight text-base-content/50 italic">
                                                {prereqText}
                                            </p>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </button>

                {disabled && !getSpecialAttackIsBlocked(specialAttack.id, player) && hasPrerequisitesFulfilled(specialAttack.id, player) && !inBattle && (
                    <div className="mt-4 flex justify-end">
                        {specialAttackInfo.unlockCost !== undefined && remainingPoints < specialAttackInfo.unlockCost ? (
                            <div className="text-xs text-red-400">
                                {t("specialAttacksList.insufficientPoints", { required: specialAttackInfo.unlockCost, available: remainingPoints })}
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleUnlock(specialAttack.id);
                                }}
                                className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold text-white shadow-sm focus:outline-none focus:ring-2 ${
                                    specialAttackInfo.masterUnlock
                                        ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                                        : 'bg-emerald-600 hover:bg-emerald-500 focus:ring-emerald-400'
                                }`}
                            >
                                <FaUnlock className="h-3.5 w-3.5" aria-hidden />
                                {specialAttackInfo.masterUnlock ? (() => {
                                    const pKey = `specialAttacks.${specialAttack.id}.prerequisite`;
                                    const hasPrereqKey = t(pKey) !== pKey;
                                    const label = hasPrereqKey ? t("specialAttacks.prerequisiteUnlock") : t("specialAttacks.masterUnlock");
                                    return specialAttackInfo.unlockCost === undefined || specialAttackInfo.unlockCost === 0
                                        ? label
                                        : `${t("specialAttacks.unlock")} (${specialAttackInfo.unlockCost}) - ${label}`;
                                })(
                                ) : (
                                    specialAttackInfo.unlockCost === undefined || specialAttackInfo.unlockCost === 0
                                        ? `${t("specialAttacks.unlock")} (${t("specialAttacksList.free")})`
                                        : `${t("specialAttacks.unlock")} (${specialAttackInfo.unlockCost})`
                                )}
                            </button>
                        )}
                    </div>
                )}

                {!disabled && isAdmin && !inBattle && (
                    <div className="mt-4 flex justify-end">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                handleRemove(specialAttack.id);
                            }}
                            className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400"
                        >
                            <FaTrash className="h-3.5 w-3.5" aria-hidden />
                            {t("common.remove")}
                        </button>
                    </div>
                )}

                {!disabled && !inBattle && onFlipToPicker && !(player?.specialAttacks ?? []).some(s => s.specialAttackId === specialAttack.id && s.slot != null) && (
                    <div className="mt-4 flex justify-end">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                onFlipToPicker();
                            }}
                            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                            <FaExchangeAlt className="h-3.5 w-3.5" aria-hidden />
                            {t("specialAttacksList.equip")}
                        </button>
                    </div>
                )}

                {/* Área expansível */}
                <AnimatePresence initial={false}>
                    {isOpen && (
                        <motion.div
                            id={`special-attack-desc-${specialAttack.id}`}
                            key="content"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mt-3 border-t border-base-300 pt-3"
                        >
                            {/* Descrição (apagada se disabled) */}
                            <div className={disabled ? "opacity-70 grayscale" : ""}>
                                <div className="whitespace-pre-line text-[15px] leading-snug text-base-content/90 break-words">
                                    {highlight(specialAttackInfo.description, specialAttackInfo.id)}
                                </div>
                            </div>

                            {/* Pré-requisitos — SEM apagado/grayscale */}
                            {disabled && (specialAttackInfo.preRequisite && specialAttackInfo.preRequisite.length > 0) && (
                                <div className="mt-2 rounded-md border border-warning/40 bg-warning/25 p-2 text-xs text-warning">
                                    <div className="flex flex-wrap gap-3">
                                        <div className="mt-1 inline-flex items-center gap-1 rounded-md border border-warning/40 bg-warning/25 px-2 py-0.5 text-[11px] text-warning">
                                            <FaInfoCircle className="h-3.5 w-3.5" aria-hidden />
                                            <span>{t("specialAttacksList.unlockPrerequisite")}</span>
                                        </div>

                                        {specialAttackInfo.preRequisite?.map((prerequisite, index) => {
                                            const preRequisiteInfo = getSpecialAttackById(prerequisite);

                                            if (!preRequisiteInfo) return null;

                                            return (
                                                <div key={index} className="flex items-center gap-3 my-2 mx-2">
                                                    <div className="relative h-12 w-12 shrink-0">
                                                        <div className="absolute inset-0 rotate-45 overflow-hidden rounded-sm border border-base-300 bg-base-200/50">
                                                            {preRequisiteInfo.image && (
                                                                <img
                                                                    src={`/skills/${preRequisiteInfo.image}`}
                                                                    alt={preRequisiteInfo.name}
                                                                    className="h-full w-full -rotate-45 object-cover"
                                                                />
                                                            )}
                                                        </div>
                                                    </div>

                                                    <h3 className="text-sm font-semibold text-base-content">
                                                        {preRequisiteInfo.name}
                                                    </h3>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.article>
        );
    }

    return (
        <section className="w-full max-w-[1400px] mx-auto px-1 md:px-2" aria-label={t("specialAttacksList.sectionAriaLabel")}>
            <header className="mb-4">
                <h2 className="text-xl font-semibold leading-none text-left">{t("specialAttacksList.title")}</h2>
                <p className="text-sm opacity-70 text-left">{t("specialAttacksList.subtitle")}</p>
                <span className="mt-2 block text-sm opacity-70 text-left">{t("specialAttacksList.itemCount", { count: list.length })}</span>
            </header>

            <div className="mb-4 flex items-center justify-center gap-2 rounded-lg border border-base-300 bg-base-100 px-4 py-2">
                <span className="text-sm opacity-80">{t("specialAttacksList.specialAttackPoints")}</span>
                <span className={`text-lg font-bold ${remainingPoints < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {usedPoints} / {totalPoints}
                </span>
                {remainingPoints < 0 && (
                    <span className="ml-2 text-xs text-red-400">({t("specialAttacksList.excess", { count: Math.abs(remainingPoints) })})</span>
                )}
            </div>

            <LayoutGroup>
                {unlockableSkills.length > 0 && (
                    <div className="mb-6">
                        <h3 className="mb-3 text-sm font-semibold text-emerald-400 uppercase tracking-wider">{t("specialAttacksList.sectionUnlockable")}</h3>
                        <div className="grid grid-cols-1 gap-2 md:gap-3">
                            {unlockableSkills.map((sa) => renderSkillCard(sa))}
                        </div>
                    </div>
                )}

                {unlockedSkills.length > 0 && (
                    <div className="mb-6">
                        <h3 className="mb-3 text-sm font-semibold text-blue-400 uppercase tracking-wider">{t("specialAttacksList.sectionUnlocked")}</h3>
                        <div className="grid grid-cols-1 gap-2 md:gap-3">
                            {unlockedSkills.map((sa) => renderSkillCard(sa))}
                        </div>
                    </div>
                )}

                {blockedSkills.length > 0 && (
                    <div className="mb-6">
                        <h3 className="mb-3 text-sm font-semibold text-base-content/50 uppercase tracking-wider">{t("specialAttacksList.sectionBlocked")}</h3>
                        <div className="grid grid-cols-1 gap-2 md:gap-3">
                            {blockedSkills.map((sa) => renderSkillCard(sa))}
                        </div>
                    </div>
                )}
            </LayoutGroup>

            {gradientSkills.length > 0 && (
                <article
                    className="mt-4 rounded-2xl border border-fuchsia-400/30 bg-base-100 shadow-sm transition-all hover:shadow-md cursor-pointer"
                    onClick={() => setGradientOpen((v) => !v)}
                >
                    <div className="flex items-center gap-3 px-5 py-4">
                        <span className="text-lg font-semibold text-fuchsia-200">{t("specialAttackPicker.gradientSection")}</span>
                        <span className="badge badge-sm border-fuchsia-400/30 text-fuchsia-200">{gradientSkills.length}</span>
                        <motion.span
                            className="ml-auto"
                            animate={{ rotate: gradientOpen ? 180 : 0 }}
                            transition={{ duration: 0.25 }}
                        >
                            <FaChevronDown className="w-3.5 h-3.5 text-fuchsia-300/60" />
                        </motion.span>
                    </div>

                    <AnimatePresence initial={false}>
                        {gradientOpen && (
                            <motion.div
                                key="gradient-content"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="overflow-hidden"
                            >
                                <div
                                    className="grid grid-cols-1 gap-2 md:gap-3 px-5 pb-5 pt-1"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {gradientSkills.map((sa) => renderSkillCard(sa))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </article>
            )}
        </section>
    );
}
