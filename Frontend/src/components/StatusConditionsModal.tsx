import { useState, useEffect } from "react";
import type { StatusType } from "../api/ResponseModel";
import { getStatusLabel } from "../utils/BattleUtils";

const SELECTABLE_EFFECTS: StatusType[] = [
    "Hastened", "Empowered", "Protected", "Regeneration",
    "Unprotected", "Slowed", "Weakened", "Cursed",
    "Stunned", "Confused", "Frozen", "Entangled",
    "Shielded", "Exhausted", "Frenzy", "Rage",
    "Inverted", "Marked", "Plagued", "Burning",
    "Silenced", "Dizzy", "Fragile", "Broken", "Fleeing",
    "FireVulnerability", "Guardian", "Foretell", "Twilight", "Powerless",
    "Rush", "Burn", "Shield", "Powerful", "Shell", "Slow", "Freeze",
    "GreaterRush", "GreaterSlow",
    "EnfeeblingMark", "DamageReduction", "SuccessiveParry", "Aureole",
    "Vulnerable", "FortunesFury", "Regen", "Curse",
    "IntenseFlames", "Earthquake", "StormCaller", "Typhoon",
    "Charging", "DamageEscalation",
];

interface StatusConditionsModalProps {
    open: boolean;
    onClose: () => void;
    active: string[];
    onToggle: (c: string) => void;
}

export function StatusConditionsModal({ open, onClose, active, onToggle }: StatusConditionsModalProps) {
    const [filter, setFilter] = useState("");
    const filtered = SELECTABLE_EFFECTS.filter(eff =>
        getStatusLabel(eff).toLowerCase().includes(filter.toLowerCase())
    );
    const [selected, setSelected] = useState<StatusType>(SELECTABLE_EFFECTS[0]);

    useEffect(() => {
        if (filtered.length > 0 && !filtered.includes(selected)) {
            setSelected(filtered[0]);
        }
    }, [filter]);

    function handleClose() {
        setFilter("");
        onClose();
    }

    function handleAdd() {
        if (!active.includes(selected)) onToggle(selected);
    }

    if (!open) return null;

    return (
        <dialog className="modal modal-open">
            <div className="modal-box max-w-sm space-y-4">
                <h3 className="font-bold text-lg">Condições</h3>

                <div className="space-y-1">
                    {active.length === 0 && (
                        <p className="text-sm opacity-60">Nenhuma condição ativa.</p>
                    )}
                    {active.map(c => (
                        <div key={c} className="flex items-center gap-2">
                            <span className="text-sm flex-1">{getStatusLabel(c as StatusType)}</span>
                            <button
                                className="btn btn-xs btn-ghost text-error"
                                onClick={() => onToggle(c)}
                            >✕</button>
                        </div>
                    ))}
                </div>

                <div className="divider my-1">Adicionar</div>

                <div className="flex flex-col gap-2">
                    <input
                        type="text"
                        className="input input-bordered input-sm w-full"
                        placeholder="Filtrar..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                    />
                    <select
                        className="select select-bordered select-sm w-full"
                        value={selected}
                        onChange={e => setSelected(e.target.value as StatusType)}
                    >
                        {filtered.map(eff => (
                            <option key={eff} value={eff}>{getStatusLabel(eff)}</option>
                        ))}
                    </select>
                    <button className="btn btn-sm btn-primary w-full" onClick={handleAdd}>
                        Adicionar
                    </button>
                </div>

                <div className="modal-action mt-2">
                    <button className="btn btn-sm btn-neutral w-full" onClick={handleClose}>
                        Fechar
                    </button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={handleClose} />
        </dialog>
    );
}
