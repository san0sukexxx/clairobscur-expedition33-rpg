import { useState } from "react";
import { t } from "../i18n";
import { BestialWheel } from "./BestialWheel";

interface BestialWheelModalProps {
    open: boolean;
    position: number;
    onConfirm: (newPosition: number) => void;
    onCancel: () => void;
}

const WHEEL_SIZE = 9;
const WHEEL_PATTERN = ["gold", "blue", "blue", "purple", "purple", "red", "red", "green", "green"];
const TEXT_COLOR: Record<string, string> = {
    gold: "text-warning",
    blue: "text-info",
    purple: "text-purple-500",
    red: "text-error",
    green: "text-success",
};

export default function BestialWheelModal({
    open,
    position,
    onConfirm,
    onCancel,
}: BestialWheelModalProps) {
    const [advance, setAdvance] = useState("");

    if (!open) return null;

    const delta = advance === "" ? 0 : Math.abs(Number(advance)) || 0;
    const preview = ((position + delta) % WHEEL_SIZE + WHEEL_SIZE) % WHEEL_SIZE;
    const hasChange = delta > 0;

    function handleConfirm() {
        onConfirm(hasChange ? preview : position);
    }

    return (
        <dialog className="modal modal-open" style={{ zIndex: 10001 }}>
            <div className="modal-box max-w-xs space-y-4">
                <h3 className="font-bold text-lg">{t("combat.bestialWheel")}</h3>

                <BestialWheel position={position} />

                {hasChange && (
                    <div className="text-center text-sm font-mono">
                        <span className="opacity-50">{position}</span>
                        <span className={`${TEXT_COLOR[WHEEL_PATTERN[preview]] ?? "text-success"} font-bold`}> → {preview}</span>
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

                <div className="modal-action">
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
