import React, { useCallback, useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GetPlayerResponse } from "../api/APIPlayer";
import type { SkillResponse } from "../api/ResponseModel";
import SkillModal from "./SkillModal";
import { getEnrichedCharacterSkills, getPlayerHasSkill, getSkillIsBlocked } from "../utils/SkillUtils";
import { APISkill } from "../api/APISkill";
import { renderStainText } from "../utils/StainTextUtils";
import { SkillEffectsRegistry } from "../data/SkillEffectsRegistry";
import { hasRequiredStains } from "../utils/StainUtils";
import { t } from "../i18n";

export interface SkillPickerProps {
    player: GetPlayerResponse | null;
    setPlayer: React.Dispatch<React.SetStateAction<GetPlayerResponse | null>>;
    inBattle: boolean;
    isUsingSkillMode?: boolean;
    onUseSkill?: (skillId: string) => void;
}

// --- UI Helpers ---
function DiamondThumb({ image, alt }: { image?: string; alt: string }) {
    return (
        <div className="relative h-12 w-12 shrink-0">
            <div className="absolute inset-0 rotate-45 overflow-hidden rounded-sm border border-white/20 bg-black/50">
                {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/skills/${image}`} alt={alt} className="h-full w-full -rotate-45 object-cover" />
                ) : (
                    <div className="flex h-full w-full -rotate-45 items-center justify-center text-xl leading-none">+</div>
                )}
            </div>
        </div>
    );
}

function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <div className="p-4">
            <input
                className="w-full rounded-md bg-black/40 border border-white/15 px-3 py-2 outline-none focus:border-white/30"
                placeholder="Buscar habilidade..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}

function SkillCard({ skill, onPick }: { skill: SkillResponse; onPick?: (s: SkillResponse) => void }) {
    return (
        <button
            onClick={() => onPick && onPick(skill)}
            className={[
                "w-full text-left grid grid-cols-[56px_1fr] items-center gap-3 p-3",
                "bg-black/25 hover:bg-white/5 transition-colors border border-white/10 rounded-xl py-4 pl-4",
            ].join(" ")}
            aria-label={skill.name}
        >
            <DiamondThumb image={skill.image} alt={skill.name} />
            <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-start gap-2 justify-between flex-wrap">
                    <div className="text-base font-semibold leading-tight">{skill.name}</div>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold leading-none text-white shadow-md flex-shrink-0 ${skill.isGradient ? 'bg-purple-600' : 'bg-blue-600'}`}>
                        {skill.isGradient ? `${skill.cost} ${skill.cost === 1 ? 'carga' : 'cargas'}` : skill.cost}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    {skill.type && (
                        <span className={`rounded-full border px-2 py-0.5 ${
                            skill.type === "sun"
                                ? "border-amber-400/30 text-amber-300"
                                : "border-purple-400/30 text-purple-300"
                        }`}>
                            {skill.type === "sun" ? "☀" : "☾"}
                        </span>
                    )}
                    {skill.isGradient && (
                        <span className="rounded-full border border-fuchsia-400/30 px-2 py-0.5 text-fuchsia-200">Gradiente</span>
                    )}
                </div>
            </div>
        </button>
    );
}

export default function SkillPickerSection({ player, setPlayer, inBattle, isUsingSkillMode = false, onUseSkill }: SkillPickerProps) {
    const [openSlot, setOpenSlot] = useState<number | null>(null);
    const [query, setQuery] = useState("");
    const [slotAssignments, setSlotAssignments] = useState<Record<number, string>>({});
    const [expanded, setExpanded] = useState<Record<number, boolean>>({});

    const characterSkills = useMemo(() =>
        getEnrichedCharacterSkills(player),
        [player]
    );

    useEffect(() => {
        if (!player?.skills) return;

        const assignments: Record<number, string> = {};
        player.skills.forEach(skill => {
            if (skill.slot !== null && skill.slot !== undefined) {
                assignments[skill.slot] = skill.skillId;
            }
        });
        setSlotAssignments(assignments);
    }, [player?.skills]);

    const slots: (SkillResponse | null)[] = useMemo(() => {
        const arr: (SkillResponse | null)[] = [null, null, null, null, null, null];

        Object.entries(slotAssignments).forEach(([slot, skillId]) => {
            const skill = characterSkills.find(s => s.id === skillId);
            if (skill && player && getPlayerHasSkill(skillId, player) && !getSkillIsBlocked(skillId, player)) {
                arr[Number(slot)] = skill;
            }
        });

        return arr;
    }, [characterSkills, slotAssignments, player]);

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

    const highlight = (text: string, skillId?: string) => {
        // Only apply stain text rendering (converts "Mancha de X" to images) for Lune's skills
        const isLuneSkill = skillId?.toLowerCase().includes("lune") ?? false;
        const stainRendered = isLuneSkill ? renderStainText(text) : [text];

        // Check if this is a Maelle skill
        const isMaelleSkill = skillId?.toLowerCase().includes("maelle") ?? false;

        // Then apply term highlighting on each text chunk
        const terms = ["Físico", "Predição", "Predições", "Mágico", "Sangramento", "Veneno", "Atordoamento"];

        // Add Verso's Perfection Ranks with their colors
        const rankTerms = ["Rank S", "Rank A", "Rank B", "Rank C", "Rank D"];

        // Add Monoco's Bestial Wheel masks with their colors
        const maskTerms = ["Máscara Onipotente", "Máscara Todopoderosa", "Máscara Lançadora", "Máscara de Conjurador", "Máscara Ágil", "Máscara Equilibrada", "Máscara Pesada"];

        // Add Maelle's stance terms with their colors
        const stanceTerms = ["Defensiva", "Ofensiva", "Virtuosa"];

        const allTerms = [...terms, ...rankTerms, ...maskTerms, ...(isMaelleSkill ? stanceTerms : [])];
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
                } else if (stanceTerms.includes(chunk) && isMaelleSkill) {
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

    const filtered = useMemo(() => {
        if (!player) return [];

        const assignedIds = new Set(Object.values(slotAssignments));

        const pool = characterSkills.filter((s) =>
            !assignedIds.has(s.id) &&
            getPlayerHasSkill(s.id, player) &&
            !getSkillIsBlocked(s.id, player)
        );

        const q = query.trim().toLowerCase();
        if (!q) return pool;
        return pool.filter(
            (s) => s.name.toLowerCase().includes(q) || (s.description ?? "").toLowerCase().includes(q)
        );
    }, [characterSkills, query, slotAssignments, player]);

    async function upsertSkillAt(slotIndex: number, skill: SkillResponse) {
        if (!player) return;
        if (getSkillIsBlocked(skill.id, player) || !getPlayerHasSkill(skill.id, player)) return;

        const playerSkill = player.skills?.find(s => s.skillId === skill.id);
        if (!playerSkill) return;

        if (playerSkill.slot === slotIndex) {
            setOpenSlot(null);
            return;
        }

        const previousSkillInSlot = slotAssignments[slotIndex];

        try {
            if (previousSkillInSlot && previousSkillInSlot !== skill.id) {
                const prevPlayerSkill = player.skills?.find(s => s.skillId === previousSkillInSlot);
                if (prevPlayerSkill) {
                    const prevRelationId = parseInt(prevPlayerSkill.id);
                    await APISkill.updatePlayerSkill(prevRelationId, { slot: null });
                }
            }

            const relationId = parseInt(playerSkill.id);
            await APISkill.updatePlayerSkill(relationId, { slot: slotIndex });

            setPlayer(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    skills: prev.skills?.map(s => {
                        if (s.skillId === skill.id) return { ...s, slot: slotIndex };
                        if (s.skillId === previousSkillInSlot && previousSkillInSlot !== skill.id) return { ...s, slot: null };
                        return s;
                    }) ?? []
                };
            });

            setOpenSlot(null);
        } catch (error) {
            console.error("Erro ao equipar habilidade:", error);
        }
    }

    async function clearSlot(slotIndex: number) {
        if (!player) return;

        const skillId = slotAssignments[slotIndex];
        if (!skillId) return;

        const playerSkill = player.skills?.find(s => s.skillId === skillId);
        if (!playerSkill) return;

        try {
            const relationId = parseInt(playerSkill.id);
            await APISkill.updatePlayerSkill(relationId, { slot: null });

            setPlayer(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    skills: prev.skills?.map(s =>
                        s.skillId === skillId ? { ...s, slot: null } : s
                    ) ?? []
                };
            });
        } catch (error) {
            console.error("Erro ao desequipar habilidade:", error);
        }
    }

    function handleSlotActivate(idx: number) {
        if (!slots[idx] && !inBattle) setOpenSlot(idx);
    }

    function handleUseSkill(skillId: string) {
        if (onUseSkill) {
            onUseSkill(skillId);
        }
    }

    function getEffectiveCost(skill: SkillResponse): number {
        // Get character state
        const source = player?.fightInfo?.characters?.find(
            c => c.battleID === player.fightInfo?.playerBattleID
        );

        // Monoco's Bestial Wheel position
        const bestialWheelPosition = source?.bestialWheelPosition ?? -1;
        const wheelPattern = ["gold", "blue", "blue", "purple", "purple", "red", "red", "green", "green"];
        const currentMask = wheelPattern[bestialWheelPosition] ?? "";
        const isMonoco = source?.id.toLowerCase().includes("monoco") ?? false;

        // Abbest Wind: Cost 0 MP on Máscara Ágil (purple) or Máscara Onipotente (gold)
        if (isMonoco && skill.id === "monoco-abbest-wind" && !skill.isGradient && (currentMask === "purple" || currentMask === "gold")) {
            return 0;
        }

        // Maelle's stance-based cost reduction (Percee, Momentum Strike)
        const skillMetadata = SkillEffectsRegistry[skill.id];
        let baseCost = skill.cost;

        if (skillMetadata?.costReductionFromStance && !skill.isGradient) {
            const currentStance = source?.stance;
            if (currentStance === skillMetadata.costReductionFromStance.stance) {
                baseCost = skillMetadata.costReductionFromStance.reducedCost;
            }
        }

        // Payback: Cost reduction per parry (using parriesThisTurn counter)
        if (skillMetadata?.costReductionPerParry && !skill.isGradient) {
            const parriesCount = source?.parriesThisTurn ?? 0;
            if (parriesCount > 0) {
                const reductionPerParry = skillMetadata.costReductionPerParry;
                const totalReduction = parriesCount * reductionPerParry;
                baseCost = Math.max(0, baseCost - totalReduction);
            }
        }

        // Stain consumption: Cost 0 MP if sufficient stains available (Earth/Light)
        if (skillMetadata?.consumesStains && !skill.isGradient && source) {
            let canConsumeStains = true;

            for (const { stain, count } of skillMetadata.consumesStains) {
                const stains = [source.stainSlot1, source.stainSlot2, source.stainSlot3, source.stainSlot4];
                const specificCount = stains.filter(s => s === stain).length;
                const lightCount = stains.filter(s => s === "Light").length;
                const totalAvailable = specificCount + lightCount;

                if (totalAvailable < count) {
                    canConsumeStains = false;
                    break;
                }
            }

            if (canConsumeStains) {
                baseCost = 0;
            }
        }

        return baseCost;
    }

    function canUseSkill(skill: SkillResponse): boolean {
        const effectiveCost = getEffectiveCost(skill);

        // Check MP/Gradient cost
        if (skill.isGradient) {
            if (currentGradientCharges < effectiveCost) return false;
        } else {
            if (currentMP < effectiveCost) return false;
        }

        // Check stain requirements (for skills like Elemental Genesis)
        const skillMetadata = SkillEffectsRegistry[skill.id];
        if (skillMetadata?.requiresAllStains) {
            const source = player?.fightInfo?.characters?.find(
                c => c.battleID === player.fightInfo?.playerBattleID
            );
            if (source && !hasRequiredStains(source, skillMetadata)) {
                return false;
            }
        }

        return true;
    }

    return (
        <div className="text-white">
            <div className="text-center text-lg tracking-widest pb-3 opacity-90">HABILIDADES</div>

            {inBattle && !isUsingSkillMode && (
                <div className="mb-4 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-center text-sm text-amber-200">
                    Não é possível equipar ou desequipar habilidades durante a batalha
                </div>
            )}

            {isUsingSkillMode && inBattle && (
                <div className="mb-4 rounded-lg border border-blue-400/30 bg-blue-400/10 p-3 text-center text-sm text-blue-200">
                    Selecione uma habilidade equipada para usar em combate
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {Array.from({ length: 6 }).map((_, idx) => {
                    const selected = slots[idx];

                    const isOpen = !!expanded[idx];

                    return (
                        <div key={idx} className="relative rounded-2xl bg-[#141414] border border-white/10 overflow-hidden">
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
                                aria-controls={selected ? `skill-desc-${idx}` : undefined}
                                className={`w-full text-left pl-24 rounded-2xl transition-colors flex items-center relative pr-12 ${
                                    selected
                                        ? "py-8 hover:bg-white/5 cursor-pointer"
                                        : (isUsingSkillMode && inBattle)
                                            ? "py-4 cursor-not-allowed opacity-70"
                                            : (inBattle && !isUsingSkillMode)
                                                ? "py-4 cursor-not-allowed opacity-70"
                                                : "py-4 hover:bg-white/5 cursor-pointer"
                                }`}
                            >
                                {/* Losango lateral */}
                                <div className="absolute left-5 top-1/2 -translate-y-1/2">
                                    <DiamondThumb image={selected?.image} alt={selected?.name ?? "Selecionar habilidade"} />
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
                                                    Gradiente
                                                </span>
                                            )}
                                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold leading-none text-white shadow-md ${selected.isGradient ? 'bg-purple-600' : 'bg-blue-600'}`}>
                                                {selected.isGradient ? `${getEffectiveCost(selected)} ${getEffectiveCost(selected) === 1 ? 'carga' : 'cargas'}` : getEffectiveCost(selected)}
                                            </span>
                                        </div>

                                        {isUsingSkillMode && inBattle ? (
                                            <button
                                                className={`absolute right-6 top-1/2 -translate-y-1/2 px-4 py-1.5 text-sm rounded-md border border-white/15 ${
                                                    canUseSkill(selected)
                                                        ? 'bg-emerald-600 hover:bg-emerald-500'
                                                        : 'bg-gray-600 opacity-50 cursor-not-allowed'
                                                }`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (canUseSkill(selected)) {
                                                        handleUseSkill(selected.id);
                                                    }
                                                }}
                                                disabled={!canUseSkill(selected)}
                                                aria-label={`Usar ${selected.name}`}
                                            >
                                                Usar
                                            </button>
                                        ) : (
                                            <button
                                                className={`absolute right-6 top-1/2 -translate-y-1/2 px-3 py-1 text-sm rounded-md border border-white/15 ${
                                                    inBattle
                                                        ? 'bg-white/5 opacity-50 cursor-not-allowed'
                                                        : 'bg-white/10 hover:bg-white/20'
                                                }`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!inBattle) clearSlot(idx);
                                                }}
                                                disabled={inBattle}
                                                aria-label="Remover habilidade do slot"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <div className="w-full opacity-60 py-4">Selecione uma Habilidade</div>
                                )}
                            </div>

                            {/* Área expansível */}
                            {selected && (
                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            id={`skill-desc-${idx}`}
                                            key="content"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="border-t border-white/10"
                                        >
                                            <div className="px-6 py-4">
                                                <div className="whitespace-pre-line text-[15px] leading-snug text-neutral-200 break-words">
                                                    {highlight(selected.description, selected.id)}
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
            <SkillModal open={openSlot !== null} onClose={() => setOpenSlot(null)}>
                <SearchBox value={query} onChange={setQuery} />
                <div className="px-4 pb-4 overflow-y-auto max-h-[65vh] grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map((s) => (
                        <SkillCard key={s.id} skill={s} onPick={(ss) => upsertSkillAt(openSlot ?? 0, ss)} />
                    ))}
                    {filtered.length === 0 && (
                        <div className="opacity-70 p-8 text-center">Nenhuma habilidade encontrada.</div>
                    )}
                </div>
            </SkillModal>
        </div>
    );
}
