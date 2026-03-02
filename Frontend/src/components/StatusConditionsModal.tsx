import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { StatusType, StatusResponse } from "../api/ResponseModel";
import { APIBattle, type AddStatusRequest } from "../api/APIBattle";
import { getStatusLabel, shouldShowStatusAmmount } from "../utils/BattleUtils";
import { t } from "../i18n";

function stripEmoji(text: string) {
    return text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "").trim();
}

const SELECTABLE_EFFECTS: StatusType[] = [
    "Hastened", "Empowered", "Regeneration",
    "Unprotected", "Slowed", "Weakened", "Cursed",
    "Stunned", "Confused", "Frozen", "Entangled",
    "Exhausted", "Frenzy", "Rage",
    "Inverted", "Marked", "Plagued", "Burning",
    "Silenced", "Dizzy", "Fragile", "Broken", "Fleeing",
    "FireVulnerability", "Guardian", "Foretell", "Twilight", "Powerless",
    "Rush", "Shield", "Powerful", "Shell",
    "GreaterRush", "GreaterSlow",
    "EnfeeblingMark", "DamageReduction", "SuccessiveParry", "Aureole",
    "Vulnerable", "FortunesFury",
    "IntenseFlames", "Earthquake", "StormCaller", "Typhoon",
    "Charging", "DamageEscalation",
];

function sortedEffects(effects: StatusType[]) {
    return [...effects].sort((a, b) =>
        stripEmoji(getStatusLabel(a)).localeCompare(stripEmoji(getStatusLabel(b)))
    );
}

interface StatusConditionsModalProps {
    open: boolean;
    onClose: () => void;
    battleCharacterId: number;
    statuses: StatusResponse[];
}

export function StatusConditionsModal({ open, onClose, battleCharacterId, statuses }: StatusConditionsModalProps) {
    const [editingStatuses, setEditingStatuses] = useState<StatusResponse[]>([]);
    const [newEffectFilter, setNewEffectFilter] = useState("");
    const [newEffectType, setNewEffectType] = useState<StatusType>("Burning");
    const [newEffectAmount, setNewEffectAmount] = useState(1);
    const [newEffectTurns, setNewEffectTurns] = useState(3);
    const [newEffectUnlimited, setNewEffectUnlimited] = useState(false);
    const [expandedStatus, setExpandedStatus] = useState<string | null>(null);
    const prevOpen = useRef(false);
    const snapshotStatuses = useRef<StatusResponse[]>([]);

    useEffect(() => {
        if (open && !prevOpen.current) {
            const filtered = (statuses ?? []).filter(s => !["jump", "gradient"].includes(s.effectName));
            setEditingStatuses(filtered.map(s => ({ ...s })));
            snapshotStatuses.current = filtered.map(s => ({ ...s }));
            setNewEffectFilter("");
            setNewEffectType("Burning");
            setNewEffectAmount(1);
            setNewEffectTurns(3);
            setNewEffectUnlimited(false);
            setExpandedStatus(null);
        }
        prevOpen.current = open;
    }, [open, statuses]);

    function updateStatus(index: number, changes: Partial<StatusResponse>) {
        setEditingStatuses(prev => prev.map((s, i) => i === index ? { ...s, ...changes } : s));
    }

    function addNewEffect() {
        if (editingStatuses.some(s => s.effectName === newEffectType)) return;
        setEditingStatuses(prev => [...prev, {
            effectName: newEffectType,
            ammount: newEffectAmount,
            remainingTurns: newEffectUnlimited ? null : newEffectTurns,
            isResolved: false,
        }]);
    }

    async function handleConfirm() {
        const originalStatuses = snapshotStatuses.current;

        for (const original of originalStatuses) {
            const edited = editingStatuses.find(e => e.effectName === original.effectName);
            if (!edited || edited.ammount !== original.ammount || edited.remainingTurns !== original.remainingTurns) {
                await APIBattle.removeStatus(battleCharacterId, original.effectName);
            }
        }
        for (const status of editingStatuses) {
            const original = originalStatuses.find(o => o.effectName === status.effectName);
            if (!original || original.ammount !== status.ammount || original.remainingTurns !== status.remainingTurns) {
                await APIBattle.addStatus({
                    battleCharacterId,
                    effectType: status.effectName,
                    ammount: status.ammount,
                    remainingTurns: status.remainingTurns ?? null,
                } as AddStatusRequest);
            }
        }
        onClose();
    }

    if (!open) return null;

    const filteredEffects = sortedEffects(SELECTABLE_EFFECTS.filter(eff =>
        getStatusLabel(eff).toLowerCase().includes(newEffectFilter.toLowerCase())
    ));

    return createPortal(
        <dialog className="modal modal-open" style={{ zIndex: 10001 }}>
            <div className="modal-box max-w-lg max-h-[80vh] overflow-y-auto space-y-4">
                <h3 className="font-bold text-lg">Condições</h3>

                <div className="space-y-2">
                    {editingStatuses.length === 0 && (
                        <p className="text-sm opacity-60">Nenhuma condição ativa.</p>
                    )}
                    {editingStatuses.map((st, idx) => {
                        const showAmount = shouldShowStatusAmmount(st.effectName);
                        return (
                            <div key={idx} className="rounded-lg bg-base-200 p-2 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span
                                        className="text-sm font-medium cursor-pointer hover:text-primary transition-colors"
                                        onClick={() => setExpandedStatus(prev => prev === st.effectName ? null : st.effectName)}
                                    >
                                        {getStatusLabel(st.effectName)}
                                    </span>
                                    <button
                                        className="btn btn-xs btn-ghost text-error"
                                        onClick={() => setEditingStatuses(prev => prev.filter((_, i) => i !== idx))}
                                    >
                                        ✕
                                    </button>
                                </div>
                                {expandedStatus === st.effectName && (
                                    <p className="text-xs opacity-70 leading-relaxed">
                                        {t(`battle.statusDescriptions.${st.effectName}`) || t("battle.statusDescriptions.default")}
                                    </p>
                                )}
                                <div className="flex items-center gap-2 flex-wrap">
                                    {showAmount && (
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs opacity-70">Qtd</span>
                                            <input
                                                type="number"
                                                className="input input-bordered input-xs w-16"
                                                min={1}
                                                value={st.ammount}
                                                onChange={e => updateStatus(idx, { ammount: parseInt(e.target.value) || 1 })}
                                            />
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs opacity-70">Turnos</span>
                                        <input
                                            type="number"
                                            className="input input-bordered input-xs w-16"
                                            min={1}
                                            value={st.remainingTurns ?? ""}
                                            disabled={st.remainingTurns === null}
                                            placeholder="∞"
                                            onChange={e => updateStatus(idx, { remainingTurns: parseInt(e.target.value) || 1 })}
                                        />
                                    </div>
                                    <label className="flex items-center gap-1 text-xs cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-xs"
                                            checked={st.remainingTurns === null}
                                            onChange={e => updateStatus(idx, { remainingTurns: e.target.checked ? null : 3 })}
                                        />
                                        Sem limite
                                    </label>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="divider my-1">Adicionar efeito</div>

                <div className="flex flex-col gap-2">
                    <input
                        type="text"
                        className="input input-bordered input-sm w-full"
                        placeholder="Filtrar efeito..."
                        value={newEffectFilter}
                        onChange={e => {
                            const filter = e.target.value;
                            setNewEffectFilter(filter);
                            const filtered = SELECTABLE_EFFECTS.filter(eff =>
                                getStatusLabel(eff).toLowerCase().includes(filter.toLowerCase())
                            );
                            if (filtered.length > 0 && !filtered.includes(newEffectType)) {
                                setNewEffectType(filtered[0]);
                            }
                        }}
                    />
                    <select
                        className="select select-bordered select-sm w-full"
                        value={newEffectType}
                        onChange={e => setNewEffectType(e.target.value as StatusType)}
                    >
                        {filteredEffects.map(eff => (
                            <option key={eff} value={eff}>{getStatusLabel(eff)}</option>
                        ))}
                    </select>
                    <div className="flex gap-2 items-center flex-wrap">
                        {shouldShowStatusAmmount(newEffectType) && (
                            <div className="flex items-center gap-1">
                                <span className="text-xs opacity-70">Qtd</span>
                                <input
                                    type="number"
                                    className="input input-bordered input-xs w-16"
                                    min={1}
                                    value={newEffectAmount}
                                    onChange={e => setNewEffectAmount(parseInt(e.target.value) || 1)}
                                />
                            </div>
                        )}
                        <div className="flex items-center gap-1">
                            <span className="text-xs opacity-70">Turnos</span>
                            <input
                                type="number"
                                className="input input-bordered input-xs w-16"
                                min={1}
                                value={newEffectTurns}
                                disabled={newEffectUnlimited}
                                onChange={e => setNewEffectTurns(parseInt(e.target.value) || 1)}
                            />
                            <label className="flex items-center gap-1 text-xs cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-xs"
                                    checked={newEffectUnlimited}
                                    onChange={e => setNewEffectUnlimited(e.target.checked)}
                                />
                                Sem limite
                            </label>
                        </div>
                        <button
                            className="btn btn-sm btn-outline ml-auto"
                            onClick={addNewEffect}
                        >
                            + Adicionar
                        </button>
                    </div>
                </div>

                <div className="modal-action">
                    <button className="btn" onClick={onClose}>Cancelar</button>
                    <button className="btn btn-primary" onClick={handleConfirm}>Confirmar</button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onClose} />
        </dialog>,
        document.body
    );
}
