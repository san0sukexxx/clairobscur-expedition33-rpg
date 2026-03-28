import { createPortal } from "react-dom";
import { t } from "../i18n";

interface ArmorClassModalProps {
    open: boolean;
    onClose: () => void;
    armorClass: number;
}

export function ArmorClassModal({ open, onClose, armorClass }: ArmorClassModalProps) {
    if (!open) return null;

    return createPortal(
        <dialog className="modal modal-open" style={{ zIndex: 10001 }}>
            <div className="modal-box max-w-sm max-h-[80vh] p-0 flex flex-col">
                <div className="overflow-y-auto p-6 space-y-4 flex-1">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center gap-1 shrink-0">
                            <span className="text-xs font-semibold uppercase tracking-wide opacity-50">{t("characterSheet.armorClassTop")}</span>
                            <div
                                className="relative flex flex-col items-center justify-start pt-1.5 bg-base-200 w-16 h-[4.8rem] text-base-content shrink-0"
                                style={{ clipPath: "polygon(0% 0%, 100% 0%, 100% 70%, 50% 100%, 0% 70%)" }}
                            >
                                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 120" preserveAspectRatio="none" fill="none">
                                    <path d="M1.5 1.5 L98.5 1.5 L98.5 84 L50 118.5 L1.5 84 Z"
                                        stroke="currentColor" strokeOpacity="0.45" strokeWidth="2" />
                                    <path d="M5 5 L95 5 L95 81 L50 113 L5 81 Z"
                                        stroke="currentColor" strokeOpacity="0.2" strokeWidth="0.75" />
                                </svg>
                                <span className="relative z-10 text-[6px] font-extrabold tracking-widest opacity-70 uppercase">{t("characterSheet.armorClassBottom")}</span>
                                <span className="relative z-10 text-3xl font-black leading-tight">{armorClass}</span>
                            </div>
                        </div>
                        <div className="text-sm opacity-80 space-y-2 flex-1">
                            <p><span className="font-semibold text-sky-400">{t("combat.dodge")}</span> — {t("combat.defenseDescDodge")}</p>
                            <p><span className="font-semibold text-amber-400">{t("combat.block")}</span> — {t("combat.defenseDescBlock")}</p>
                            <p><span className="font-semibold text-emerald-400">{t("combat.jump")}</span> — {t("combat.defenseDescJump")}</p>
                            <p><span className="font-semibold text-red-400">{t("combat.gradient")}</span> — {t("combat.defenseDescGradient")}</p>
                        </div>
                    </div>
                </div>
                <div className="border-t border-base-300 p-4 shrink-0">
                    <div className="modal-action mt-0">
                        <button className="btn btn-sm" onClick={onClose}>{t("common.close")}</button>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onClose} />
        </dialog>,
        document.body
    );
}
