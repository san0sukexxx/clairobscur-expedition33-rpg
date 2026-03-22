import { useState } from "react";
import { t } from "../i18n";

interface StatEditModalProps {
    open: boolean;
    title: string;
    currentValue: number;
    maxValue?: number;
    minValue?: number;
    wrapAround?: boolean;
    onConfirm: (value: number) => void;
    onCancel: () => void;
    extraAction?: React.ReactNode;
}

export default function StatEditModal({
    open,
    title,
    currentValue,
    maxValue,
    minValue = 0,
    wrapAround = false,
    onConfirm,
    onCancel,
    extraAction
}: StatEditModalProps) {
    const [mode, setMode] = useState<"add" | "remove">("add");
    const [raw, setRaw] = useState("");

    if (!open) return null;

    const max = maxValue ?? currentValue + 100;
    const delta = raw === "" ? 0 : Math.abs(Number(raw)) || 0;
    const applied = mode === "add" ? delta : -delta;

    let preview: number;
    if (wrapAround && maxValue !== undefined) {
        const range = maxValue - minValue + 1;
        preview = minValue + (((currentValue + applied - minValue) % range) + range) % range;
    } else {
        preview = Math.max(minValue, Math.min(max, currentValue + applied));
    }

    const hasChange = delta > 0 && preview !== currentValue;
    const pct = max > 0 ? Math.min(100, Math.max(0, (currentValue / max) * 100)) : 0;
    const previewPct = max > 0 ? Math.min(100, Math.max(0, (preview / max) * 100)) : 0;

    function handleConfirm() {
        onConfirm(hasChange ? preview : currentValue);
    }

    return (
        <dialog className="modal modal-open" style={{ zIndex: 10001 }}>
            <div className="modal-box space-y-4">
                <h3 className="font-bold text-lg">{title}</h3>

                {/* Bar */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs opacity-70">
                        <span>{t("combatAdmin.labels.current")}</span>
                        <span className="font-mono">{currentValue}{maxValue !== undefined ? ` / ${maxValue}` : ""}</span>
                    </div>
                    <div className="relative w-full h-5 bg-base-300 rounded-full overflow-hidden">
                        {/* Ghost bar for add preview */}
                        {delta > 0 && mode === "add" && (
                            <div
                                className="absolute inset-y-0 left-0 bg-success/30 rounded-full transition-all"
                                style={{ width: `${previewPct}%` }}
                            />
                        )}
                        {/* Current bar */}
                        <div
                            className={`absolute inset-y-0 left-0 rounded-full transition-all ${pct > 50 ? "bg-info" : pct > 25 ? "bg-warning" : "bg-error"}`}
                            style={{ width: `${delta > 0 && mode === "remove" ? previewPct : pct}%` }}
                        />
                        {/* Ghost bar for remove */}
                        {delta > 0 && mode === "remove" && (
                            <div
                                className="absolute inset-y-0 left-0 bg-error/30 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                            />
                        )}
                    </div>
                    {/* Preview text */}
                    {hasChange && (
                        <div className="text-center text-sm font-mono">
                            <span className="opacity-50">{currentValue}</span>
                            <span className={preview > currentValue ? " text-success" : " text-error"}> → {preview}</span>
                        </div>
                    )}
                </div>

                {/* Mode toggle */}
                <div className="flex rounded-lg overflow-hidden border border-base-300">
                    <button
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === "remove" ? "bg-error text-error-content" : "bg-base-200 opacity-60 hover:opacity-100"}`}
                        onClick={() => setMode("remove")}
                    >
                        {t("combatAdmin.labels.spendAp")}
                    </button>
                    <button
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === "add" ? "bg-success text-success-content" : "bg-base-200 opacity-60 hover:opacity-100"}`}
                        onClick={() => setMode("add")}
                    >
                        {t("combatAdmin.labels.recoverAp")}
                    </button>
                </div>

                {/* Amount input */}
                <div className="space-y-1">
                    <label className="text-xs opacity-70">{t("combatAdmin.labels.amount")}</label>
                    <input
                        type="number"
                        className="input input-bordered w-full text-center text-lg"
                        value={raw}
                        placeholder="0"
                        min={0}
                        onChange={e => setRaw(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === "Escape") onCancel();
                            if (e.key === "Enter") handleConfirm();
                        }}
                    />
                </div>

                {extraAction}

                {/* Actions */}
                <div className="modal-action">
                    <button className="btn" onClick={onCancel}>
                        {t("combatAdmin.labels.cancel")}
                    </button>
                    <button
                        className={`btn ${mode === "add" ? "btn-success" : "btn-error"}`}
                        onClick={handleConfirm}
                        disabled={delta === 0}
                    >
                        {t("combatAdmin.labels.confirm")}
                    </button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onCancel} />
        </dialog>
    );
}
