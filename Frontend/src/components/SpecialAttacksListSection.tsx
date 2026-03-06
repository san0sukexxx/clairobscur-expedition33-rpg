import React, { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaChevronUp, FaInfoCircle, FaLock, FaUnlock, FaTrash } from "react-icons/fa";
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
}

export default function SpecialAttacksListSection({ player, setPlayer, isAdmin, inBattle }: SpecialAttacksListTabProps) {
    if(!player) { return }

    const list: SpecialAttackResponse[] = getEnrichedCharacterSpecialAttacks(player);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [gradientOpen, setGradientOpen] = useState(false);

    const { regularSkills, gradientSkills } = useMemo(() => {
        const regular: SpecialAttackResponse[] = [];
        const gradient: SpecialAttackResponse[] = [];
        for (const sa of list) {
            if (sa.isGradient) gradient.push(sa);
            else regular.push(sa);
        }
        return { regularSkills: regular, gradientSkills: gradient };
    }, [list]);

    const totalPoints = calculateSpecialAttackPoints(player);
    const usedPoints = calculateUsedSpecialAttackPoints(player);
    const remainingPoints = totalPoints - usedPoints;

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

    async function handleUnlock(specialAttackId: string) {
        if (!player) return;

        const alreadyUnlocked = player.specialAttacks?.some(s => s.specialAttackId === specialAttackId);
        if (alreadyUnlocked) return;

        try {
            const relationId = await APISpecialAttack.addPlayerSpecialAttack({
                playerId: player.id,
                specialAttackId: specialAttackId
            });

            const newSpecialAttack: PlayerSpecialAttackResponse = {
                id: relationId.toString(),
                specialAttackId: specialAttackId
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
            <article
                key={specialAttack.id}
                className="group relative flex h-full flex-col rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm transition-all hover:shadow-md focus-within:ring-1 focus-within:ring-base-content/20"
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

                            {disabled && (
                                <div className="mt-1 inline-flex items-center gap-1 rounded-md border border-warning/40 bg-warning/25 px-2 py-0.5 text-[11px] text-warning">
                                    <FaInfoCircle className="h-3.5 w-3.5" aria-hidden />
                                    <span>{t("specialAttacksList.notUnlocked")}</span>
                                </div>
                            )}
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
                                {specialAttackInfo.masterUnlock ? (
                                    specialAttackInfo.unlockCost === undefined || specialAttackInfo.unlockCost === 0
                                        ? t("specialAttacks.masterUnlock")
                                        : `${t("specialAttacks.unlock")} (${specialAttackInfo.unlockCost}) - ${t("specialAttacks.masterUnlock")}`
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
            </article>
        );
    }

    return (
        <section className="w-full max-w-[1400px] mx-auto px-4 md:px-6" aria-label={t("specialAttacksList.sectionAriaLabel")}>
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

            {/* grade ajustada para desktop */}
            <div className="grid grid-cols-1 gap-4 md:gap-6">
                {regularSkills.map((sa) => renderSkillCard(sa))}
            </div>

            {gradientSkills.length > 0 && (
                <div className="mt-6">
                    <button
                        type="button"
                        onClick={() => setGradientOpen((v) => !v)}
                        className="flex w-full items-center gap-2 rounded-lg border border-fuchsia-400/30 bg-base-100 px-4 py-2.5 text-left shadow-sm hover:bg-base-200 transition-colors"
                    >
                        <span className="text-sm font-semibold text-fuchsia-200">{t("specialAttackPicker.gradientSection")}</span>
                        <span className="badge badge-sm border-fuchsia-400/30 text-fuchsia-200">{gradientSkills.length}</span>
                        <span className="ml-auto">
                            {gradientOpen
                                ? <FaChevronUp className="w-3 h-3 opacity-50" />
                                : <FaChevronDown className="w-3 h-3 opacity-50" />
                            }
                        </span>
                    </button>

                    {gradientOpen && (
                        <div className="mt-4 grid grid-cols-1 gap-4 md:gap-6">
                            {gradientSkills.map((sa) => renderSkillCard(sa))}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
