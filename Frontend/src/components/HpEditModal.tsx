import { useState, useCallback } from "react";
import { FaEdit } from "react-icons/fa";
import { t } from "../i18n";

export interface HpEditModalProps {
    open: boolean;
    name: string;
    currentHp: number;
    maxHp: number;
    onConfirm: (newHp: number, newMaxHp: number) => void;
    onClose: () => void;
}

export function HpEditModal({ open, name, currentHp, maxHp, onConfirm, onClose }: HpEditModalProps) {
    const [hpMode, setHpMode] = useState<"heal" | "damage">("damage");
    const [hpValue, setHpValue] = useState("");
    const [maxHpValue, setMaxHpValue] = useState(String(maxHp));
    const [showMaxHp, setShowMaxHp] = useState(false);

    const focusRef = useCallback((node: HTMLInputElement | null) => {
        if (node) setTimeout(() => node.focus(), 50);
    }, []);

    if (!open) return null;

    const parsedMax = parseInt(maxHpValue, 10);
    const currentMaxHp = !isNaN(parsedMax) && parsedMax > 0 ? parsedMax : maxHp;
    const delta = hpValue === "" ? 0 : Math.abs(parseInt(hpValue, 10)) || 0;
    const applied = hpMode === "heal" ? delta : -delta;
    const previewHp = Math.max(0, Math.min(currentMaxHp, currentHp + applied));
    const maxHpChanged = currentMaxHp !== maxHp;
    const maxHpClampsCurrentHp = maxHpChanged && currentMaxHp < currentHp;
    const hasChange = delta > 0 || maxHpClampsCurrentHp;
    const displayedCurrentHp = maxHpClampsCurrentHp && delta === 0 ? currentMaxHp : currentHp;
    const hpPct = currentMaxHp > 0 ? Math.min(100, Math.max(0, (displayedCurrentHp / currentMaxHp) * 100)) : 0;
    const previewPct = currentMaxHp > 0 ? Math.min(100, Math.max(0, (previewHp / currentMaxHp) * 100)) : 0;

    function handleConfirm() {
        const finalHp = hasChange ? previewHp : currentHp;
        onConfirm(finalHp, currentMaxHp);
    }

    return (
        <dialog className="modal modal-open" style={{ zIndex: 10001 }}>
            <div className="modal-box space-y-4">
                <h3 className="font-bold text-lg">{t("combatAdmin.labels.changeHp")} — {name}</h3>

                {/* HP bar */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs opacity-70">
                        <span>{t("combatAdmin.labels.currentHp")}</span>
                        <span className="font-mono">{currentHp} / {currentMaxHp}</span>
                    </div>
                    <div className="relative w-full h-5 bg-base-300 rounded-full overflow-hidden">
                        {/* Ghost bar for heal preview */}
                        {delta > 0 && hpMode === "heal" && (
                            <div
                                className="absolute inset-y-0 left-0 bg-success/30 rounded-full transition-all"
                                style={{ width: `${previewPct}%` }}
                            />
                        )}
                        {/* Current HP bar */}
                        <div
                            className={`absolute inset-y-0 left-0 rounded-full transition-all ${hpPct > 50 ? "bg-success" : hpPct > 25 ? "bg-warning" : "bg-error"}`}
                            style={{ width: `${(delta > 0 && hpMode === "damage") || maxHpClampsCurrentHp ? previewPct : hpPct}%` }}
                        />
                        {/* Ghost bar for damage / max clamp */}
                        {((delta > 0 && hpMode === "damage") || maxHpClampsCurrentHp) && (
                            <div
                                className="absolute inset-y-0 left-0 bg-error/30 rounded-full transition-all"
                                style={{ width: `${hpPct}%` }}
                            />
                        )}
                    </div>
                    {/* Preview text */}
                    {hasChange && previewHp !== currentHp && (
                        <div className="text-center text-sm font-mono">
                            <span className="opacity-50">{currentHp}</span>
                            <span className={previewHp > currentHp ? " text-success" : " text-error"}> → {previewHp}</span>
                        </div>
                    )}
                </div>

                {/* Mode toggle */}
                <div className="flex rounded-lg overflow-hidden border border-base-300">
                    <button
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${hpMode === "damage" ? "bg-error text-error-content" : "bg-base-200 opacity-60 hover:opacity-100"}`}
                        onClick={() => setHpMode("damage")}
                    >
                        {t("combatAdmin.labels.damage")}
                    </button>
                    <button
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${hpMode === "heal" ? "bg-success text-success-content" : "bg-base-200 opacity-60 hover:opacity-100"}`}
                        onClick={() => setHpMode("heal")}
                    >
                        {t("combatAdmin.labels.heal")}
                    </button>
                </div>

                {/* Amount input */}
                <div className="space-y-1">
                    <label className="text-xs opacity-70">{t("combatAdmin.labels.amount")}</label>
                    <input
                        type="number"
                        className="input input-bordered w-full text-center text-lg"
                        value={hpValue}
                        placeholder="0"
                        min={0}
                        autoFocus
                        onChange={(e) => setHpValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Escape") onClose();
                            if (e.key === "Enter") handleConfirm();
                        }}
                        ref={focusRef}
                    />
                </div>

                {/* Max HP toggle + input */}
                {!showMaxHp ? (
                    <button
                        className="btn btn-ghost btn-xs gap-1 opacity-60 hover:opacity-100"
                        onClick={() => setShowMaxHp(true)}
                    >
                        <FaEdit size={10} />
                        {t("combatAdmin.labels.editMaxHp")}
                    </button>
                ) : (
                    <div className="space-y-1">
                        <label className="text-xs opacity-70">{t("combatAdmin.labels.maxHp")}</label>
                        <input
                            type="number"
                            className="input input-bordered input-sm w-full text-center"
                            value={maxHpValue}
                            min={1}
                            onChange={(e) => setMaxHpValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Escape") onClose();
                                if (e.key === "Enter") handleConfirm();
                            }}
                        />
                    </div>
                )}

                {/* Actions */}
                <div className="modal-action">
                    <button className="btn" onClick={onClose}>
                        {t("combatAdmin.labels.cancel")}
                    </button>
                    <button
                        className={`btn ${hpMode === "heal" ? "btn-success" : "btn-error"}`}
                        onClick={handleConfirm}
                        disabled={delta === 0 && !maxHpChanged}
                    >
                        {t("combatAdmin.labels.confirm")}
                    </button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onClose} />
        </dialog>
    );
}
