import { FaDice } from "react-icons/fa";
import { type BattleCharacterInfo, type StainType } from "../api/ResponseModel";
import { addStains, updateCharacterStains } from "../utils/StainUtils";
import { t } from "../i18n";

interface LuneStainsModalProps {
    open: boolean;
    ch: BattleCharacterInfo | null;
    onClose: () => void;
    onRefresh: () => void;
    onStainAdded?: (changedSlots: boolean[]) => void;
}

const stainOptions: StainType[] = ["Lightning", "Earth", "Fire", "Ice", "Light"];

export function LuneStainsModal({ open, ch, onClose, onRefresh, onStainAdded }: LuneStainsModalProps) {
    if (!open || !ch) return null;

    return (
        <dialog className="modal modal-open">
            <div className="modal-box max-w-xs space-y-4">
                <h3 className="font-bold text-lg">{t("combat.stains")}</h3>

                {/* Current stains display — click to remove */}
                <div className="flex items-center justify-center gap-3 py-2">
                    {[ch.stainSlot1, ch.stainSlot2, ch.stainSlot3, ch.stainSlot4].map((stain, idx) => (
                        stain ? (
                            <button
                                key={idx}
                                className="relative cursor-pointer group"
                                title={t(`combatAdmin.labels.stain${stain}`)}
                                onClick={async () => {
                                    const stains: [StainType | null, StainType | null, StainType | null, StainType | null] = [
                                        ch.stainSlot1 ?? null, ch.stainSlot2 ?? null, ch.stainSlot3 ?? null, ch.stainSlot4 ?? null
                                    ];
                                    stains[idx] = null;
                                    await updateCharacterStains(ch.battleID, stains);
                                    onRefresh();
                                }}
                            >
                                <img
                                    src={`/stains/${stain.toLowerCase()}-stain.png`}
                                    alt={stain}
                                    className="w-8 h-8 object-contain group-hover:opacity-50 transition-opacity"
                                />
                                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-error text-error-content flex items-center justify-center text-[10px] font-bold leading-none opacity-70 group-hover:opacity-100 transition-opacity">✕</span>
                            </button>
                        ) : (
                            <div
                                key={idx}
                                className="w-8 h-8 rounded-full border-2 border-gray-500/60 bg-gray-400/15"
                                title={t("combat.emptySlot")}
                            />
                        )
                    ))}
                </div>

                {/* Choose element */}
                <div>
                    <label className="label label-text text-xs opacity-70">{t("combat.stainChooseElement")}</label>
                    <div className="flex items-center justify-center gap-2">
                        {stainOptions.map(s => (
                            <button
                                key={s}
                                className="btn btn-sm btn-circle btn-ghost"
                                onClick={async () => {
                                    const current: [StainType | null, StainType | null, StainType | null, StainType | null] = [
                                        ch.stainSlot1 ?? null, ch.stainSlot2 ?? null, ch.stainSlot3 ?? null, ch.stainSlot4 ?? null
                                    ];
                                    const { stains: newStains, changedSlots } = addStains(current, [s]);
                                    await updateCharacterStains(ch.battleID, newStains);
                                    onRefresh();
                                    onStainAdded?.(changedSlots);
                                }}
                                title={t(`combatAdmin.labels.stain${s}`)}
                            >
                                <img src={`/stains/${s.toLowerCase()}-stain.png`} alt={s} className="w-7 h-7" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Random element */}
                <div>
                    <label className="label label-text text-xs opacity-70">{t("combat.stainRandom")}</label>
                    <div className="flex justify-center">
                        <button
                            className="btn btn-sm btn-outline gap-2"
                            onClick={async () => {
                                const elementalOptions: StainType[] = ["Lightning", "Earth", "Fire", "Ice"];
                                const randomStain = elementalOptions[Math.floor(Math.random() * elementalOptions.length)];
                                const current: [StainType | null, StainType | null, StainType | null, StainType | null] = [
                                    ch.stainSlot1 ?? null, ch.stainSlot2 ?? null, ch.stainSlot3 ?? null, ch.stainSlot4 ?? null
                                ];
                                const { stains: newStains, changedSlots } = addStains(current, [randomStain]);
                                await updateCharacterStains(ch.battleID, newStains);
                                onRefresh();
                                onStainAdded?.(changedSlots);
                            }}
                        >
                            <FaDice size={16} />
                            {t("combat.stainRandomButton")}
                        </button>
                    </div>
                </div>

                <div className="modal-action">
                    <button className="btn btn-ghost btn-sm" onClick={onClose}>{t("common.close")}</button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onClose} />
        </dialog>
    );
}
