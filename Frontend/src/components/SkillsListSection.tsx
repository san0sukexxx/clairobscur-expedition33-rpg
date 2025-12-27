import React, { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaInfoCircle, FaLock, FaUnlock, FaTrash } from "react-icons/fa";
import { GiCrossedSwords } from "react-icons/gi";
import type { PlayerSkillResponse, SkillResponse } from "../api/ResponseModel";
import type { GetPlayerResponse } from "../api/APIPlayer";
import { getPlayerHasSkill, getSkillById, getSkillIsBlocked, getEnrichedCharacterSkills, calculateUsedSkillPoints, hasPrerequisitesFulfilled } from "../utils/SkillUtils";
import { calculateSkillPoints } from "../utils/PlayerCalculator";
import { APISkill } from "../api/APISkill";
import { renderStainText } from "../utils/StainTextUtils";

export interface SkillsListTabProps {
    player: GetPlayerResponse | null;
    setPlayer: React.Dispatch<React.SetStateAction<GetPlayerResponse | null>>;
    isAdmin: boolean;
    inBattle: boolean;
}

export default function SkillsListSection({ player, setPlayer, isAdmin, inBattle }: SkillsListTabProps) {
    if(!player) { return }

    const list: SkillResponse[] = getEnrichedCharacterSkills(player);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const totalPoints = calculateSkillPoints(player);
    const usedPoints = calculateUsedSkillPoints(player);
    const remainingPoints = totalPoints - usedPoints;

    const toggle = useCallback((id: string) => {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    }, []);

    if (list.length === 0) {
        return (
            <div className="w-full py-10 text-center opacity-70">
                <p>Nenhuma habilidade disponível.</p>
            </div>
        );
    }

    async function handleUnlock(skillId: string) {
        if (!player) return;

        const alreadyUnlocked = player.skills?.some(s => s.skillId === skillId);
        if (alreadyUnlocked) return;

        try {
            const relationId = await APISkill.addPlayerSkill({
                playerId: player.id,
                skillId: skillId
            });

            const newSkill: PlayerSkillResponse = {
                id: relationId.toString(),
                skillId: skillId
            };

            setPlayer((prev) => {
                if (!prev) return prev;
                return { ...prev, skills: [...(prev.skills ?? []), newSkill] };
            });
        } catch (error) {
            console.error("Erro ao desbloquear habilidade:", error);
        }
    }

    async function handleRemove(skillId: string) {
        if (!player) return;

        const playerSkill = player.skills?.find(s => s.skillId === skillId);
        if (!playerSkill) return;

        try {
            const relationId = parseInt(playerSkill.id);
            await APISkill.deletePlayerSkill(relationId);

            setPlayer((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    skills: prev.skills?.filter(s => s.skillId !== skillId) ?? []
                };
            });
        } catch (error) {
            console.error("Erro ao remover habilidade:", error);
        }
    }

    const highlight = (text: string) => {
        // First, apply stain text rendering (converts "Mancha de X" to images)
        const stainRendered = renderStainText(text);

        // Then apply term highlighting on each text chunk
        const terms = ["Físico", "Predição", "Predições", "Mágico", "Sangramento", "Veneno", "Atordoamento"];
        const pattern = new RegExp(`\\b(${terms.join("|")})\\b`, "g");

        return stainRendered.map((node, nodeIdx) => {
            // If it's already a React element (stain image), keep it as is
            if (typeof node !== "string") {
                return <React.Fragment key={`stain-${nodeIdx}`}>{node}</React.Fragment>;
            }

            // Otherwise, apply term highlighting to text chunks
            return node.split(pattern).map((chunk, chunkIdx) =>
                terms.includes(chunk) ? (
                    <span key={`${nodeIdx}-${chunkIdx}`} className="text-amber-300 font-semibold">
                        {chunk}
                    </span>
                ) : (
                    <React.Fragment key={`${nodeIdx}-${chunkIdx}`}>{chunk}</React.Fragment>
                )
            );
        });
    };

    return (
        <section className="w-full max-w-[1400px] mx-auto px-4 md:px-6" aria-label="Seção de habilidades">
            <header className="mb-4">
                <h2 className="text-xl font-semibold leading-none text-left">Habilidades</h2>
                <p className="text-sm opacity-70 text-left">Lista completa das habilidades do personagem</p>
                <span className="mt-2 block text-sm opacity-70 text-left">{list.length} item(ns)</span>
            </header>

            <div className="mb-4 flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#141414] px-4 py-2">
                <span className="text-sm opacity-80">Pontos de Habilidade:</span>
                <span className={`text-lg font-bold ${remainingPoints < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {usedPoints} / {totalPoints}
                </span>
                {remainingPoints < 0 && (
                    <span className="ml-2 text-xs text-red-400">(Excesso: {Math.abs(remainingPoints)})</span>
                )}
            </div>

            {/* grade ajustada para desktop */}
            <div className="grid grid-cols-1 gap-4 md:gap-6">
                {list.map((skill) => {
                    const isOpen = !!expanded[skill.id];
                    const skillInfo = getSkillById(skill.id)

                    if (!skillInfo) { return; }

                    if (getSkillIsBlocked(skill.id, player)) {
                        return (
                            <article
                                key={skill.id}
                                className="group relative flex h-full items-center justify-center rounded-2xl border border-white/10 bg-neutral-900/80 p-10 shadow-sm backdrop-blur-sm"
                                aria-label={`Habilidade bloqueada`}
                            >
                                <div className="flex flex-col items-center gap-2 text-neutral-300">
                                    <div className="relative h-12 w-12">
                                        <div className="absolute inset-0 rotate-45 overflow-hidden rounded-sm border border-white/20 bg-black/50" />
                                        <div className="absolute inset-0 -rotate-45 flex items-center justify-center">
                                            <FaLock className="h-7 w-7 opacity-80" aria-hidden />
                                        </div>
                                    </div>
                                    <span className="text-xs opacity-70">Bloqueada</span>
                                </div>
                            </article>
                        );
                    }

                    const disabled = !getPlayerHasSkill(skill.id, player);

                    return (
                        <article
                            key={skill.id}
                            className={[
                                "group relative flex h-full flex-col rounded-2xl border border-white/10 bg-neutral-900/80 p-5 shadow-sm backdrop-blur-sm transition-all hover:shadow-md focus-within:ring-1 focus-within:ring-white/20",
                            ].join(" ")}
                        >
                            <button
                                type="button"
                                onClick={() => toggle(skill.id)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        toggle(skill.id);
                                    }
                                }}
                                className="w-full cursor-pointer select-none text-left outline-none"
                                aria-expanded={isOpen}
                                aria-controls={`skill-desc-${skill.id}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="relative h-12 w-12 shrink-0">
                                        <div className="absolute inset-0 rotate-45 overflow-hidden rounded-sm border border-white/20 bg-black/50">
                                            {skillInfo.image ? (
                                                <img
                                                    src={`/skills/${skillInfo.image}`}
                                                    alt={skillInfo.name}
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
                                            <h3 className="truncate font-serif text-lg font-semibold tracking-wide text-neutral-100 min-w-0">
                                                <span className={`${disabled ? "opacity-70 grayscale" : ""} [font-variant-caps:small-caps] block truncate`}>{skillInfo.name}</span>
                                            </h3>

                                            {skillInfo.type && (
                                                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${
                                                    skillInfo.type === "sun"
                                                        ? "border-amber-400/30 text-amber-300"
                                                        : "border-purple-400/30 text-purple-300"
                                                }`}>
                                                    {skillInfo.type === "sun" ? "☀" : "☾"}
                                                </span>
                                            )}

                                            {skillInfo.isGradient && (
                                                <span className="shrink-0 rounded-full border border-fuchsia-400/30 px-2 py-0.5 text-xs text-fuchsia-200">
                                                    Gradiente
                                                </span>
                                            )}

                                            <span className={`ml-auto shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold leading-none text-white shadow-md ${skillInfo.isGradient ? 'bg-purple-600' : 'bg-blue-600'}`}>
                                                {skillInfo.isGradient ? `${skillInfo.cost} ${skillInfo.cost === 1 ? 'carga' : 'cargas'}` : skillInfo.cost}
                                            </span>
                                        </div>

                                        {disabled && (
                                            <div className="mt-1 inline-flex items-center gap-1 rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[11px] text-amber-200">
                                                <FaInfoCircle className="h-3.5 w-3.5" aria-hidden />
                                                <span>Habilidade ainda não desbloqueada</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </button>

                            {disabled && !getSkillIsBlocked(skill.id, player) && hasPrerequisitesFulfilled(skill.id, player) && (
                                <div className="mt-4 flex justify-end">
                                    {skillInfo.unlockCost !== undefined && remainingPoints < skillInfo.unlockCost ? (
                                        <div className="text-xs text-red-400">
                                            Pontos insuficientes (necessário: {skillInfo.unlockCost}, disponível: {remainingPoints})
                                        </div>
                                    ) : inBattle ? (
                                        <div className="text-xs text-amber-400">
                                            Não é possível desbloquear habilidades durante a batalha
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleUnlock(skill.id);
                                            }}
                                            className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold text-white shadow-sm focus:outline-none focus:ring-2 ${
                                                skillInfo.masterUnlock
                                                    ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                                                    : 'bg-emerald-600 hover:bg-emerald-500 focus:ring-emerald-400'
                                            }`}
                                        >
                                            <FaUnlock className="h-3.5 w-3.5" aria-hidden />
                                            {skillInfo.masterUnlock
                                                ? skillInfo.unlockCost && skillInfo.unlockCost > 0
                                                    ? `Desbloqueie somente quando o mestre permitir (${skillInfo.unlockCost})`
                                                    : 'Desbloqueie somente quando o mestre permitir'
                                                : skillInfo.unlockCost === 0
                                                ? 'Desbloqueio Grátis'
                                                : `Desbloquear (${skillInfo.unlockCost})`}
                                        </button>
                                    )}
                                </div>
                            )}

                            {!disabled && isAdmin && (
                                <div className="mt-4 flex justify-end">
                                    {inBattle ? (
                                        <div className="text-xs text-amber-400">
                                            Não é possível remover habilidades durante a batalha
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleRemove(skill.id);
                                            }}
                                            className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400"
                                        >
                                            <FaTrash className="h-3.5 w-3.5" aria-hidden />
                                            Remover
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Área expansível */}
                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.div
                                        id={`skill-desc-${skill.id}`}
                                        key="content"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="mt-3 border-t border-white/10 pt-3"
                                    >
                                        {/* Descrição (apagada se disabled) */}
                                        <div className={disabled ? "opacity-70 grayscale" : ""}>
                                            <div className="whitespace-pre-line text-[15px] leading-snug text-neutral-200 break-words">
                                                {highlight(skillInfo.description)}
                                            </div>
                                        </div>

                                        {/* Pré-requisitos — SEM apagado/grayscale */}
                                        {disabled && (skillInfo.preRequisite && skillInfo.preRequisite.length > 0) && (
                                            <div className="mt-2 rounded-md border border-amber-400/30 bg-amber-400/10 p-2 text-xs text-amber-200">
                                                <div className="flex flex-wrap gap-3">
                                                    <div className="mt-1 inline-flex items-center gap-1 rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[11px] text-amber-200">
                                                        <FaInfoCircle className="h-3.5 w-3.5" aria-hidden />
                                                        <span>Obtenha uma dessas habilidades para desbloquear</span>
                                                    </div>

                                                    {skillInfo.preRequisite?.map((prerequisite, index) => {
                                                        const preRequisiteInfo = getSkillById(prerequisite)

                                                        if (!preRequisiteInfo) { return }
                                                    
                                                        return (
                                                            <div key={index} className="flex items-center gap-3 my-2 mx-2">
                                                                <div className="relative h-12 w-12 shrink-0">
                                                                    <div className="absolute inset-0 rotate-45 overflow-hidden rounded-sm border border-white/20 bg-black/50">
                                                                        {preRequisiteInfo.image && (
                                                                            <img
                                                                                src={`/skills/${preRequisiteInfo.image}`}
                                                                                alt={preRequisiteInfo.name}
                                                                                className="h-full w-full -rotate-45 object-cover"
                                                                            />
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <h3 className="text-sm font-semibold text-neutral-100">
                                                                    {preRequisiteInfo.name}
                                                                </h3>
                                                            </div>
                                                        )})}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </article>
                    );

                })}
            </div>
        </section>
    );
}
