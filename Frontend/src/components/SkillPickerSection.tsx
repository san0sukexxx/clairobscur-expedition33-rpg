import React, { useMemo, useState } from "react";
import type { PlayerResponse } from "../api/APIPlayer";
import type { SkillResponse } from "../api/ResponseModel";
import SkillModal from "./SkillModal";

export interface SkillPickerProps {
    player: PlayerResponse | null;
    setPlayer: React.Dispatch<React.SetStateAction<PlayerResponse | null>>;
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
                <div className="flex items-start gap-2 justify-between">
                    <div className="text-base font-semibold leading-tight truncate">{skill.name}</div>
                    <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-bold leading-none text-white shadow-md">{skill.cost}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-full border border-white/15 px-2 py-0.5 opacity-90">{skill.type}</span>
                    {skill.isGradient && (
                        <span className="rounded-full border border-fuchsia-400/30 px-2 py-0.5 text-fuchsia-200">Gradiente</span>
                    )}
                </div>
            </div>
        </button>
    );
}

export default function SkillPickerSection({ player, setPlayer }: SkillPickerProps) {
    const [openSlot, setOpenSlot] = useState<number | null>(null);
    const [query, setQuery] = useState("");

    // Slots atuais do player (0..5) a partir de player.skills (apenas válidas: desbloqueadas e não bloqueadas)
    const slots: (SkillResponse | null)[] = useMemo(() => {
        const arr: (SkillResponse | null)[] = [null, null, null, null, null, null];
        (player?.skills ?? [])
            .filter((s) => s.isUnlocked && !s.isBlocked)
            .forEach((s) => {
                const idx = typeof s.slot === "number" ? Math.max(0, Math.min(5, s.slot!)) : -1;
                if (idx >= 0) arr[idx] = s as SkillResponse;
            });
        return arr;
    }, [player?.skills]);

    // Pool disponível: habilidades do player SEM slot definido e válidas
    const filtered = useMemo(() => {
        const all = (player?.skills ?? []) as SkillResponse[];
        const pool = all.filter((s) => s.slot === undefined && s.isUnlocked && !s.isBlocked);
        const q = query.trim().toLowerCase();
        if (!q) return pool;
        return pool.filter(
            (s) => s.name.toLowerCase().includes(q) || (s.description ?? "").toLowerCase().includes(q)
        );
    }, [player?.skills, query]);

    function upsertSkillAt(slotIndex: number, skill: SkillResponse) {
        if (skill.isBlocked || !skill.isUnlocked) return; // segurança extra
        setPlayer((prev) => {
            if (!prev) return prev;
            const current = (prev.skills ?? []) as SkillResponse[];
            const others = current.filter((s) => s.slot !== slotIndex && s.id !== skill.id);
            const chosen: SkillResponse = { ...skill, slot: slotIndex };
            return { ...prev, skills: [...others, chosen] };
        });
        setOpenSlot(null);
    }

    function clearSlot(slotIndex: number) {
        setPlayer((prev) => {
            if (!prev) return prev;
            const next = (prev.skills ?? []).map((s) => (s.slot === slotIndex ? { ...s, slot: undefined } : s));
            return { ...prev, skills: next };
        });
    }

    function handleSlotActivate(idx: number) {
        if (!slots[idx]) setOpenSlot(idx);
    }

    function onKeyActivate(e: React.KeyboardEvent<HTMLDivElement>, idx: number) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleSlotActivate(idx);
        }
    }

    return (
        <div className="text-white">
            <div className="text-center text-lg tracking-widest pb-3 opacity-90">HABILIDADES</div>

            <div className="grid grid-cols-1 gap-4">
                {Array.from({ length: 6 }).map((_, idx) => {
                    const selected = slots[idx];

                    return (
                        <div key={idx} className="relative rounded-2xl bg-[#141414] border border-white/10 overflow-hidden">
                            <div
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => onKeyActivate(e, idx)}
                                onClick={() => handleSlotActivate(idx)}
                                className={`w-full text-left pl-24 rounded-2xl transition-colors flex items-center relative pr-12 ${selected ? "py-8 hover:bg-white/5 cursor-default" : "py-4 hover:bg-white/5 cursor-pointer"
                                    }`}
                            >
                                {/* Losango lateral */}
                                <div className="absolute left-5 top-1/2 -translate-y-1/2">
                                    <DiamondThumb image={selected?.image} alt={selected?.name ?? "Selecionar habilidade"} />
                                </div>

                                {selected ? (
                                    <>
                                        <div className="flex-1 text-lg font-semibold leading-tight mr-2 truncate">
                                            {selected.name}
                                            <span className="relative -top-0.5 ml-3 rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-bold leading-none text-white shadow-md">{selected.cost}</span>
                                        </div>

                                        <button
                                            className="absolute right-6 top-1/2 -translate-y-1/2 px-3 py-1 text-sm rounded-md bg-white/10 hover:bg-white/20 border border-white/15"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                clearSlot(idx);
                                            }}
                                            aria-label="Remover habilidade do slot"
                                        >
                                            ×
                                        </button>
                                    </>
                                ) : (
                                    <div className="w-full opacity-60 py-4">Selecione uma Habilidade</div>
                                )}
                            </div>
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
