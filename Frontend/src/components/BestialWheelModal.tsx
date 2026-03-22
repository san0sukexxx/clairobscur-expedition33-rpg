import { useState } from "react";
import { t } from "../i18n";
import { BestialWheel } from "./BestialWheel";

interface BestialWheelModalProps {
    open: boolean;
    position: number;
    reversed: boolean;
    onConfirm: (newPosition: number) => void;
    onToggleReversed: () => void;
    onCancel: () => void;
}

const WHEEL_SIZE = 9;

export default function BestialWheelModal({
    open,
    position,
    reversed,
    onConfirm,
    onToggleReversed,
    onCancel,
}: BestialWheelModalProps) {
    const [advance, setAdvance] = useState("");

    if (!open) return null;

    const delta = advance === "" ? 0 : Math.abs(Number(advance)) || 0;
    const direction = reversed ? -1 : 1;
    const preview = ((position + delta * direction) % WHEEL_SIZE + WHEEL_SIZE) % WHEEL_SIZE;
    const hasChange = delta > 0;

    function handleConfirm() {
        onConfirm(hasChange ? preview : position);
    }

    return (
        <dialog className="modal modal-open" style={{ zIndex: 10001 }}>
            <div className="modal-box max-w-xs space-y-4">
                <h3 className="font-bold text-lg">{t("combat.bestialWheel")}</h3>

                <BestialWheel position={position} reversed={reversed} />

                {hasChange && (
                    <div className="text-center text-sm font-mono">
                        <span className="opacity-50">{position}</span>
                        <span className="text-success"> → {preview}</span>
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-xs opacity-70">{t("combatAdmin.labels.advance")}</label>
                    <input
                        type="number"
                        className="input input-bordered w-full text-center text-lg"
                        value={advance}
                        placeholder="0"
                        min={0}
                        onChange={e => setAdvance(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === "Escape") onCancel();
                            if (e.key === "Enter") handleConfirm();
                        }}
                        autoFocus
                    />
                </div>

                <div className="modal-action flex items-center">
                    <button
                        className="text-xs opacity-40 hover:opacity-70 transition-opacity mr-auto"
                        onClick={onToggleReversed}
                    >
                        ⟲ {t("combat.reverseWheel")}{reversed ? " ✓" : ""}
                    </button>
                    <button className="btn btn-sm" onClick={onCancel}>
                        {t("combatAdmin.labels.cancel")}
                    </button>
                    <button
                        className="btn btn-sm btn-success"
                        onClick={handleConfirm}
                        disabled={!hasChange}
                    >
                        {t("combatAdmin.labels.confirm")}
                    </button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onCancel} />
        </dialog>
    );
}
