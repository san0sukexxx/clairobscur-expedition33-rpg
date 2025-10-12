import React, { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaInfoCircle, FaLock, FaUnlock } from "react-icons/fa";
import { GiCrossedSwords } from "react-icons/gi";
import type { SkillResponse } from "../api/ResponseModel";
import type { PlayerResponse } from "../api/APIPlayer";

export interface SkillsListTabProps {
    player: PlayerResponse | null;
    setPlayer: React.Dispatch<React.SetStateAction<PlayerResponse | null>>;
}

export default function SkillsListSection({ player, setPlayer }: SkillsListTabProps) {
    const list: SkillResponse[] = Array.isArray(player?.skills) ? (player!.skills as SkillResponse[]) : [];
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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

    function handleUnlock(skillId: string) {
        setPlayer((prev) => {
            if (!prev) return prev;
            const skills = (prev.skills ?? []).map((s: SkillResponse) =>
                s.id === skillId ? { ...s, isUnlocked: true } : s
            );
            return { ...prev, skills };
        });
    }

    const highlight = (text: string) => {
        const terms = ["Physical", "Foretell", "Magical", "Bleed", "Poison", "Stun"];
        const pattern = new RegExp(`\\b(${terms.join("|")})\\b`, "g");
        return text.split(pattern).map((chunk, i) =>
            terms.includes(chunk) ? (
                <span key={i} className="text-amber-300 font-semibold">
                    {chunk}
                </span>
            ) : (
                <React.Fragment key={i}>{chunk}</React.Fragment>
            )
        );
    };

    return (
        <section className="w-full max-w-[1400px] mx-auto px-4 md:px-6" aria-label="Seção de habilidades">
            <header className="mb-4">
                <h2 className="text-xl font-semibold leading-none text-left">Habilidades</h2>
                <p className="text-sm opacity-70 text-left">Lista completa das habilidades do personagem</p>
                <span className="mt-2 block text-sm opacity-70 text-left">{list.length} item(ns)</span>
            </header>

            {/* grade ajustada para desktop */}
            <div className="grid grid-cols-1 gap-4 md:gap-6">
                {list.map((skill) => {
                    const isOpen = !!expanded[skill.id];

                    if (skill.isBlocked) {
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

                    const disabled = !skill.isUnlocked;

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
                                    {/* Imagem em losango */}
                                    <div className="relative h-12 w-12 shrink-0">
                                        <div className="absolute inset-0 rotate-45 overflow-hidden rounded-sm border border-white/20 bg-black/50">
                                            {skill.image ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={`/skills/${skill.image}`}
                                                    alt={skill.name}
                                                    className={`${disabled ? "opacity-70 grayscale" : ""} h-full w-full -rotate-45 object-cover`}
                                                />
                                            ) : (
                                                <div className="flex h-full w-full -rotate-45 items-center justify-center">
                                                    <GiCrossedSwords className="h-5 w-5 opacity-70" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Título + chips */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                                            <h3 className="truncate font-serif text-lg font-semibold tracking-wide text-neutral-100 min-w-0">
                                                <span className={`${disabled ? "opacity-70 grayscale" : ""} [font-variant-caps:small-caps] block truncate`}>{skill.name}</span>
                                            </h3>

                                            {skill.type && (
                                                <span className="shrink-0 rounded-full border border-white/15 px-2 py-0.5 text-xs text-neutral-200/90">
                                                    {skill.type}
                                                </span>
                                            )}

                                            {skill.isGradient && (
                                                <span className="shrink-0 rounded-full border border-fuchsia-400/30 px-2 py-0.5 text-xs text-fuchsia-200">
                                                    Gradiente
                                                </span>
                                            )}

                                            {/* Badge de custo */}
                                            <span className="ml-auto shrink-0 rounded-full bg-blue-600 px-2.5 py-0.5 text-[11px] font-bold leading-none text-white shadow-md">
                                                {skill.cost}
                                            </span>
                                        </div>

                                        {/* Aviso de não desbloqueada */}
                                        {disabled && (
                                            <div className="mt-1 inline-flex items-center gap-1 rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[11px] text-amber-200">
                                                <FaInfoCircle className="h-3.5 w-3.5" aria-hidden />
                                                <span>Habilidade ainda não desbloqueada</span>
                                            </div>
                                        )}

                                        {disabled && (!skill.pre_requisite || skill.pre_requisite.length === 0) && (
                                            <div className="mt-4 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleUnlock(skill.id);
                                                    }}
                                                    className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                                >
                                                    <FaUnlock className="h-3.5 w-3.5" aria-hidden />
                                                    Desloquear
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </button>

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
                                                {highlight(skill.description)}
                                            </div>
                                        </div>

                                        {/* Pré-requisitos — SEM apagado/grayscale */}
                                        {disabled && (skill.pre_requisite && skill.pre_requisite.length > 0) && (
                                            <div className="mt-2 rounded-md border border-amber-400/30 bg-amber-400/10 p-2 text-xs text-amber-200">
                                                <div className="flex flex-wrap gap-3">
                                                    <div className="mt-1 inline-flex items-center gap-1 rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[11px] text-amber-200">
                                                        <FaInfoCircle className="h-3.5 w-3.5" aria-hidden />
                                                        <span>Obtenha uma dessas habilidades para desbloquear</span>
                                                    </div>

                                                    {skill.pre_requisite?.map((prerequisite, index) => (
                                                        <div key={index} className="flex items-center gap-3 my-2 mx-2">
                                                            <div className="relative h-12 w-12 shrink-0">
                                                                <div className="absolute inset-0 rotate-45 overflow-hidden rounded-sm border border-white/20 bg-black/50">
                                                                    {prerequisite.image && (
                                                                        <img
                                                                            src={`/skills/${prerequisite.image}`}
                                                                            alt={prerequisite.name}
                                                                            className="h-full w-full -rotate-45 object-cover"
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <h3 className="text-sm font-semibold text-neutral-100">
                                                                {prerequisite.name}
                                                            </h3>
                                                        </div>
                                                    ))}
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
