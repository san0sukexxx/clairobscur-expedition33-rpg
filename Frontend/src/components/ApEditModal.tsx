import { useState } from "react";
import { t } from "../i18n";

export interface ApEditModalProps {
    open: boolean;
    name: string;
    currentAp: number;
    maxAp: number;
    onConfirm: (newAp: number) => void;
    onClose: () => void;
}

export function ApEditModal({ open, name, currentAp, maxAp, onConfirm, onClose }: ApEditModalProps) {
    const [apMode, setApMode] = useState<"recover" | "spend">("spend");
    const [apValue, setApValue] = useState("");
    const [isDragging, setIsDragging] = useState(false);


    if (!open) return null;

    const delta = apValue === "" ? 0 : Math.abs(parseInt(apValue, 10)) || 0;
    const applied = apMode === "recover" ? delta : -delta;
    const previewAp = Math.max(0, Math.min(maxAp, currentAp + applied));
    const hasChange = delta > 0;
    const apPct = maxAp > 0 ? Math.min(100, Math.max(0, (currentAp / maxAp) * 100)) : 0;
    const previewPct = maxAp > 0 ? Math.min(100, Math.max(0, (previewAp / maxAp) * 100)) : 0;

    function applyDrag(e: { currentTarget: HTMLElement; clientX: number }) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const targetAp = Math.round((x / rect.width) * maxAp);
        const diff = targetAp - currentAp;
        if (diff > 0) { setApMode("recover"); setApValue(String(diff)); }
        else if (diff < 0) { setApMode("spend"); setApValue(String(-diff)); }
        else { setApValue(""); }
    }

    function handleConfirm() {
        const finalAp = hasChange ? previewAp : currentAp;
        onConfirm(finalAp);
    }

    return (
        <dialog className="modal modal-open" style={{ zIndex: 10001 }}>
            <div className="modal-box space-y-4">
                <h3 className="font-bold text-lg">{t("combatAdmin.labels.changeMp")} — {name}</h3>

                {/* AP bar */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs opacity-70">
                        <span>{t("combatAdmin.labels.currentMp")}</span>
                        <span className="font-mono">{currentAp} / {maxAp}</span>
                    </div>
                    <div
                        className="relative w-full h-5 bg-base-300 rounded-full overflow-hidden cursor-ew-resize select-none touch-none"
                        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setIsDragging(true); applyDrag(e); }}
                        onPointerMove={(e) => { if (isDragging) applyDrag(e); }}
                        onPointerUp={() => setIsDragging(false)}
                    >
                        {/* Ghost bar for recover preview */}
                        {delta > 0 && apMode === "recover" && (
                            <div
                                className={`absolute inset-y-0 left-0 bg-success/30 rounded-full ${isDragging ? "" : "transition-all"}`}
                                style={{ width: `${previewPct}%` }}
                            />
                        )}
                        {/* Current AP bar */}
                        <div
                            className={`absolute inset-y-0 left-0 rounded-full ${isDragging ? "" : "transition-all"} ${apPct > 50 ? "bg-info" : apPct > 25 ? "bg-warning" : "bg-error"}`}
                            style={{ width: `${delta > 0 && apMode === "spend" ? previewPct : apPct}%` }}
                        />
                        {/* Ghost bar for spend */}
                        {delta > 0 && apMode === "spend" && (
                            <div
                                className={`absolute inset-y-0 left-0 bg-error/30 rounded-full ${isDragging ? "" : "transition-all"}`}
                                style={{ width: `${apPct}%` }}
                            />
                        )}
                    </div>
                    {/* Preview text */}
                    {hasChange && previewAp !== currentAp && (
                        <div className="text-center text-sm font-mono">
                            <span className="opacity-50">{currentAp}</span>
                            <span className={previewAp > currentAp ? " text-success" : " text-error"}> → {previewAp}</span>
                        </div>
                    )}
                </div>

                {/* Mode toggle */}
                <div className="flex rounded-lg overflow-hidden border border-base-300">
                    <button
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${apMode === "spend" ? "bg-error text-error-content" : "bg-base-200 opacity-60 hover:opacity-100"}`}
                        onClick={() => setApMode("spend")}
                    >
                        {t("combatAdmin.labels.spendAp")}
                    </button>
                    <button
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${apMode === "recover" ? "bg-success text-success-content" : "bg-base-200 opacity-60 hover:opacity-100"}`}
                        onClick={() => setApMode("recover")}
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
                        value={apValue}
                        placeholder="0"
                        min={0}
                        onChange={(e) => setApValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Escape") onClose();
                            if (e.key === "Enter") handleConfirm();
                        }}
                    />
                </div>

                {/* Actions */}
                <div className="modal-action">
                    <button className="btn" onClick={onClose}>
                        {t("combatAdmin.labels.cancel")}
                    </button>
                    <button
                        className={`btn ${apMode === "recover" ? "btn-success" : "btn-error"}`}
                        onClick={handleConfirm}
                        disabled={delta === 0}
                    >
                        {t("combatAdmin.labels.confirm")}
                    </button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onClose} />
        </dialog>
    );
}
