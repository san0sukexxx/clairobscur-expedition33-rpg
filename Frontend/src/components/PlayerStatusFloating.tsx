import { useState } from "react";
import { FaEdit } from "react-icons/fa";
import { type GetPlayerResponse } from "../api/APIPlayer";
import { APIBattle } from "../api/APIBattle";
import { type BattleCharacterInfo, type Stance, type StainType } from "../api/ResponseModel";
import { getStatusLabel, shouldShowStatusAmmount } from "../utils/BattleUtils";
import { getEnrichedCharacterSpecialAttacks } from "../utils/SpecialAttackUtils";
import AnimatedStatBar from "./AnimatedStatBar";
import { BestialWheel } from "./BestialWheel";
import StatEditModal from "./StatEditModal";
import { StatusConditionsModal } from "./StatusConditionsModal";
import { t } from "../i18n";

interface PlayerStatusFloatingProps {
    player: GetPlayerResponse | null;
}

function pct(cur: number, max: number) {
    return Math.max(0, Math.min(100, Math.round((cur / max) * 100)));
}

type EditField = "hp" | "mp" | "charge" | "gradient" | "bestialWheel" | "sunMoon" | "stance" | "rank" | "stains" | null;

export default function PlayerStatusFloating({ player }: PlayerStatusFloatingProps) {
    const characters = player?.fightInfo?.characters ?? [];
    const playerBattleID = player?.fightInfo?.playerBattleID;

    const ch: BattleCharacterInfo | undefined =
        characters.find(c => c.battleID === playerBattleID) ?? characters.find(c => !c.isEnemy);

    // Edit state
    const [editing, setEditing] = useState<EditField>(null);
    const [editValue, setEditValue] = useState(0);
    // Sun/Moon
    const [editSun, setEditSun] = useState("");
    const [editMoon, setEditMoon] = useState("");
    // Stance
    const [editStance, setEditStance] = useState<Stance | "">("");
    // Rank
    const [editRank, setEditRank] = useState("D");
    const [editRankProgress, setEditRankProgress] = useState("");
    // Stains
    const [editStains, setEditStains] = useState<(StainType | "")[]>(["", "", "", ""]);
    // Conditions modal
    const [conditionsOpen, setConditionsOpen] = useState(false);
    // Status description
    const [expandedStatusBadge, setExpandedStatusBadge] = useState<string | null>(null);

    if (!ch) return null;

    // Don't show if player can still roll initiative (hasn't joined battle yet)
    if (ch.canRollInitiative) return null;

    // Check if player is in the turns queue
    const playerInTurns = player?.fightInfo?.turns?.some(
        turn => turn.battleCharacterId === playerBattleID
    ) ?? false;

    // Check if player has any gradient skills equipped in slots
    const hasGradientSkills = player?.specialAttacks?.some(playerSA => {
        if (playerSA.slot === null || playerSA.slot === undefined) return false;
        const saData = getEnrichedCharacterSpecialAttacks(player).find(s => s.id === playerSA.specialAttackId);
        return saData?.isGradient ?? false;
    }) ?? false;

    const closeEdit = () => setEditing(null);

    async function confirmNumericEdit(field: "hp" | "mp" | "charge" | "gradient" | "bestialWheel", value: number) {
        switch (field) {
            case "hp":
                await APIBattle.updateCharacterHp(ch!.battleID, value);
                break;
            case "mp":
                await APIBattle.updateCharacterMp(ch!.battleID, value);
                break;
            case "charge":
                await APIBattle.updateCharacterChargePoints(ch!.battleID, value);
                break;
            case "gradient":
                await APIBattle.updateTeamGradient(ch!.battleID, value);
                break;
            case "bestialWheel":
                await APIBattle.updateBestialWheelPosition(ch!.battleID, value);
                break;
        }
        closeEdit();
    }

    async function confirmSunMoon() {
        await APIBattle.updateSunMoonCharges(ch!.battleID, Number(editSun) || 0, Number(editMoon) || 0);
        closeEdit();
    }

    async function confirmStance() {
        await APIBattle.updateCharacterStance(ch!.battleID, editStance === "" ? null : editStance as Stance);
        closeEdit();
    }

    async function confirmRank() {
        await APIBattle.updateCharacterRank(ch!.battleID, editRank, Number(editRankProgress) || 0);
        closeEdit();
    }

    async function confirmStains() {
        await APIBattle.updateStains(ch!.battleID, {
            stainSlot1: editStains[0] || null,
            stainSlot2: editStains[1] || null,
            stainSlot3: editStains[2] || null,
            stainSlot4: editStains[3] || null,
        });
        closeEdit();
    }

    // Helpers to open edits
    function openHp() { setEditValue(ch!.healthPoints); setEditing("hp"); }
    function openMp() { setEditValue(ch!.magicPoints ?? 0); setEditing("mp"); }
    function openCharge() { setEditValue(ch!.chargePoints ?? 0); setEditing("charge"); }
    function openGradient() { setEditValue(ch!.gradientPoints ?? 0); setEditing("gradient"); }
    function openBestialWheel() { setEditValue(ch!.bestialWheelPosition ?? 0); setEditing("bestialWheel"); }
    function openSunMoon() {
        setEditSun(String(ch!.sunCharges ?? 0));
        setEditMoon(String(ch!.moonCharges ?? 0));
        setEditing("sunMoon");
    }
    function openStance() {
        setEditStance(ch!.stance ?? "");
        setEditing("stance");
    }
    function openRank() {
        setEditRank(ch!.perfectionRank ?? "D");
        setEditRankProgress(String(ch!.rankProgress ?? 0));
        setEditing("rank");
    }
    function openStainsEdit() {
        setEditStains([
            ch!.stainSlot1 ?? "",
            ch!.stainSlot2 ?? "",
            ch!.stainSlot3 ?? "",
            ch!.stainSlot4 ?? "",
        ]);
        setEditing("stains");
    }

    const stainOptions: StainType[] = ["Lightning", "Earth", "Fire", "Ice"];

    return (
        <div className="fixed bottom-14 left-4 z-40">
            <div
                className="
                    rounded-xl bg-base-100/95 shadow-lg border border-base-300
                    p-3 w-64
                "
            >
                <div className="mb-2 flex flex-row flex-wrap gap-1">
                    {ch.status?.map((st, idx) => {
                        const showTurns = st.effectName !== "IntenseFlames" && st.remainingTurns != null;

                        return (
                            <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded bg-base-300 text-[10px] opacity-90 cursor-pointer hover:opacity-100 transition-opacity"
                                onClick={() => setExpandedStatusBadge(prev => prev === st.effectName ? null : st.effectName)}
                            >
                                {getStatusLabel(st.effectName)}{" "}
                                {shouldShowStatusAmmount(st.effectName) && st.ammount}
                                {showTurns ? ` (${st.remainingTurns})` : ""}
                            </span>
                        );
                    })}
                    <button
                        className="px-1.5 py-0.5 rounded bg-base-300 text-[10px] opacity-70 hover:opacity-100 transition-opacity cursor-pointer flex items-center gap-1"
                        onClick={() => setConditionsOpen(true)}
                    >
                        <FaEdit size={8} /> Condições
                    </button>
                </div>
                {expandedStatusBadge && (
                    <p className="text-[10px] opacity-70 leading-relaxed mb-1 px-1">
                        {t(`battle.statusDescriptions.${expandedStatusBadge}`) || t("battle.statusDescriptions.default")}
                    </p>
                )}

                <div className="flex flex-row gap-3 items-center justify-between">
                    <div className="flex-1 cursor-pointer rounded p-0.5 hover:bg-base-200/80 transition-colors" onClick={openHp}>
                        <div className="flex items-center justify-between text-[10px] uppercase">
                            <span className="opacity-70 flex items-center gap-1">HP <FaEdit size={10} className="opacity-40" /></span>
                            <span className="font-mono text-xs">
                                {ch.healthPoints}/{ch.maxHealthPoints}
                            </span>
                        </div>
                        <AnimatedStatBar
                            value={pct(ch.healthPoints, ch.maxHealthPoints)}
                            label="HP"
                            fillClass="bg-error"
                            ghostClass="bg-error/30"
                        />
                    </div>

                    {ch.magicPoints !== undefined &&
                        ch.magicPoints !== null &&
                        ch.maxMagicPoints !== undefined &&
                        ch.maxMagicPoints !== null && (
                            <div className="flex-1 cursor-pointer rounded p-0.5 hover:bg-base-200/80 transition-colors" onClick={openMp}>
                                <div className="flex items-center justify-between text-[10px] uppercase">
                                    <span className="opacity-70 flex items-center gap-1">MP <FaEdit size={10} className="opacity-40" /></span>
                                    <span className="font-mono text-xs">
                                        {ch.magicPoints}/{ch.maxMagicPoints}
                                    </span>
                                </div>
                                <AnimatedStatBar
                                    value={pct(ch.magicPoints!, ch.maxMagicPoints!)}
                                    label="MP"
                                    fillClass="bg-info"
                                    ghostClass="bg-info/30"
                                />
                            </div>
                        )}
                </div>

                {/* Charge bar for Gustave - below HP/MP */}
                {ch.maxChargePoints !== undefined &&
                    ch.maxChargePoints !== null &&
                    ch.maxChargePoints > 0 && (
                        <div className="mt-2 cursor-pointer rounded p-0.5 hover:bg-base-200/80 transition-colors" onClick={openCharge}>
                            <div className="flex items-center justify-between text-[10px] uppercase">
                                <span className="opacity-70 flex items-center gap-1">{t("combat.charge")} <FaEdit size={10} className="opacity-40" /></span>
                                <span className="font-mono text-xs">
                                    {ch.chargePoints ?? 0}/{ch.maxChargePoints}
                                </span>
                            </div>
                            <AnimatedStatBar
                                value={pct(ch.chargePoints ?? 0, ch.maxChargePoints!)}
                                label={t("combat.charge")}
                                fillClass="bg-warning"
                                ghostClass="bg-warning/30"
                            />
                        </div>
                    )}

                {/* Gradient bar - only if player has gradient skills equipped and is in turns */}
                {hasGradientSkills && playerInTurns && (() => {
                    const gradientPoints = ch.gradientPoints ?? 0;
                    const charges = Math.floor(gradientPoints / 12);
                    const progressValue = charges >= 3 ? 100 : pct(gradientPoints % 12, 12);

                    return (
                        <div className="mt-2 cursor-pointer rounded p-0.5 hover:bg-base-200/80 transition-colors" onClick={openGradient}>
                            <div className="flex items-center justify-between text-[10px] uppercase">
                                <span className="opacity-70 flex items-center gap-1">{t("combat.gradient")} <FaEdit size={10} className="opacity-40" /></span>
                                <span className="font-mono text-xs">
                                    {charges}/3
                                </span>
                            </div>
                            <AnimatedStatBar
                                value={progressValue}
                                label={t("combat.gradient")}
                                fillClass="bg-purple-500"
                                ghostClass="bg-purple-500/30"
                            />
                        </div>
                    );
                })()}

                {/* Sun/Moon charges for Sciel */}
                {ch.id.toLowerCase().includes("sciel") && (
                    <div className="mt-2 flex items-center gap-3 text-sm cursor-pointer rounded p-0.5 hover:bg-base-200/80 transition-colors" onClick={openSunMoon}>
                        <div className="flex items-center gap-1.5">
                            <span className="text-amber-400">☀</span>
                            <span className="font-mono font-semibold text-amber-300">
                                {ch.sunCharges ?? 0}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-purple-400">☾</span>
                            <span className="font-mono font-semibold text-purple-300">
                                {ch.moonCharges ?? 0}
                            </span>
                        </div>
                        <FaEdit size={10} className="opacity-40" />
                    </div>
                )}

                {/* Monoco's Bestial Wheel */}
                {ch.id.toLowerCase().includes("monoco") &&
                    ch.bestialWheelPosition !== undefined &&
                    ch.bestialWheelPosition !== null && (
                        <div className="mt-2 cursor-pointer rounded p-0.5 hover:bg-base-200/80 transition-colors" onClick={openBestialWheel}>
                            <div className="flex items-center gap-1 mb-1 text-[10px] opacity-70 uppercase">
                                Bestial Wheel <FaEdit size={10} className="opacity-40" />
                            </div>
                            <BestialWheel position={ch.bestialWheelPosition} />
                        </div>
                    )}

                {/* Stance indicator for Maelle only */}
                {ch.stance !== undefined &&
                 ch.id.toLowerCase().includes("maelle") && (
                    <div className="mt-2 cursor-pointer rounded p-0.5 hover:bg-base-200/80 transition-colors" onClick={openStance}>
                        <div className="flex items-center gap-2 text-[10px]">
                            <span className="opacity-70 flex items-center gap-1">{t("combat.stance")} <FaEdit size={10} className="opacity-40" /></span>
                            {ch.stance === "Defensive" && (
                                <div className="badge badge-info badge-sm">{t("combat.defensive")}</div>
                            )}
                            {ch.stance === "Offensive" && (
                                <div className="badge badge-error badge-sm">{t("combat.offensive")}</div>
                            )}
                            {ch.stance === "Virtuous" && (
                                <div className="badge bg-purple-500 text-white border-purple-500 badge-sm">{t("combat.virtuous")}</div>
                            )}
                            {!ch.stance && (
                                <div className="badge badge-ghost badge-sm">{t("combat.noStance")}</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Verso's Perfection Rank System */}
                {ch.id.toLowerCase().includes("verso") && (() => {
                    const currentRank = ch.perfectionRank ?? "D"; // D, C, B, A, S (default to D)
                    const rankProgress = ch.rankProgress ?? 0; // Current progress
                    const rankMax = 10; // Points needed for next rank (always 10)

                    const getRankColor = (rank: string) => {
                        switch(rank) {
                            case "S": return "text-red-400 border-red-400";
                            case "A": return "text-purple-400 border-purple-400";
                            case "B": return "text-blue-400 border-blue-400";
                            case "C": return "text-amber-200 border-amber-200";
                            case "D": return "text-gray-400 border-gray-400";
                            default: return "text-gray-400 border-gray-400";
                        }
                    };

                    const getRankFillClass = (rank: string) => {
                        switch(rank) {
                            case "S": return "bg-red-500";
                            case "A": return "bg-purple-500";
                            case "B": return "bg-blue-500";
                            case "C": return "bg-amber-200";
                            case "D": return "bg-gray-500";
                            default: return "bg-gray-500";
                        }
                    };

                    const getRankGhostClass = (rank: string) => {
                        switch(rank) {
                            case "S": return "bg-red-500/30";
                            case "A": return "bg-purple-500/30";
                            case "B": return "bg-blue-500/30";
                            case "C": return "bg-amber-200/30";
                            case "D": return "bg-gray-500/30";
                            default: return "bg-gray-500/30";
                        }
                    };

                    return (
                        <div className="mt-2 cursor-pointer rounded p-0.5 hover:bg-base-200/80 transition-colors" onClick={openRank}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] opacity-70 uppercase flex items-center gap-1">
                                    {t("combat.perfection")} <FaEdit size={10} className="opacity-40" />
                                </span>
                                <div className={`
                                    px-2 py-0.5 rounded border-2 font-bold text-sm
                                    ${getRankColor(currentRank)}
                                `}>
                                    {t("combat.rank")} {currentRank}
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-[10px] mb-0.5">
                                <span className="opacity-50">{t("combat.progress")}</span>
                                <span className="font-mono text-xs">
                                    {currentRank === "S" ? t("playerPage.specialAttacks.perfectionMax") : `${rankProgress}/${rankMax}`}
                                </span>
                            </div>
                            <AnimatedStatBar
                                value={currentRank === "S" ? 100 : pct(rankProgress, rankMax)}
                                label="Rank Progress"
                                fillClass={getRankFillClass(currentRank)}
                                ghostClass={getRankGhostClass(currentRank)}
                            />
                        </div>
                    );
                })()}

                {/* Lune's Stain System */}
                {ch.id.toLowerCase().includes("lune") && (() => {
                    const stains = [ch.stainSlot1, ch.stainSlot2, ch.stainSlot3, ch.stainSlot4];
                    const hasAnyStain = stains.some(s => s !== null && s !== undefined);

                    return (
                        <div className="mt-2 flex items-center gap-2 text-xs cursor-pointer rounded p-0.5 hover:bg-base-200/80 transition-colors" onClick={openStainsEdit}>
                            <span className="opacity-70 uppercase flex items-center gap-1">{t("combat.stains")} <FaEdit size={10} className="opacity-40" /></span>
                            {!hasAnyStain ? (
                                <div className="badge badge-ghost badge-sm opacity-60">{t("combat.noStains")}</div>
                            ) : (
                                <div className="flex items-center gap-1.5">
                                    {stains.map((stain, idx) => {
                                        if (!stain) {
                                            return (
                                                <div
                                                    key={idx}
                                                    className="w-5 h-5 rounded-full border-2 border-gray-500/60 bg-gray-400/15"
                                                    title="Empty Slot"
                                                />
                                            );
                                        }

                                        const stainLower = stain.toLowerCase();
                                        return (
                                            <img
                                                key={idx}
                                                src={`/stains/${stainLower}-stain.png`}
                                                alt={stain}
                                                title={`${stain} Stain`}
                                                className="w-5 h-5 object-contain"
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })()}
            </div>

            {/* ---- Modals ---- */}

            {/* HP */}
            <StatEditModal
                open={editing === "hp"}
                title="HP"
                currentValue={ch.healthPoints}
                minValue={0}
                maxValue={ch.maxHealthPoints}
                onConfirm={v => confirmNumericEdit("hp", v)}
                onCancel={closeEdit}
            />

            {/* MP */}
            <StatEditModal
                open={editing === "mp"}
                title="MP"
                currentValue={ch.magicPoints ?? 0}
                minValue={0}
                maxValue={ch.maxMagicPoints ?? 999}
                onConfirm={v => confirmNumericEdit("mp", v)}
                onCancel={closeEdit}
            />

            {/* Charge */}
            <StatEditModal
                open={editing === "charge"}
                title={t("combat.charge")}
                currentValue={ch.chargePoints ?? 0}
                minValue={0}
                maxValue={ch.maxChargePoints ?? 10}
                onConfirm={v => confirmNumericEdit("charge", v)}
                onCancel={closeEdit}
            />

            {/* Gradient */}
            <StatEditModal
                open={editing === "gradient"}
                title={t("combat.gradient")}
                currentValue={ch.gradientPoints ?? 0}
                minValue={0}
                maxValue={36}
                onConfirm={v => confirmNumericEdit("gradient", v)}
                onCancel={closeEdit}
            />

            {/* Bestial Wheel */}
            <StatEditModal
                open={editing === "bestialWheel"}
                title="Bestial Wheel"
                currentValue={ch.bestialWheelPosition ?? 0}
                minValue={0}
                maxValue={8}
                onConfirm={v => confirmNumericEdit("bestialWheel", v)}
                onCancel={closeEdit}
            />

            {/* Sun/Moon modal */}
            {editing === "sunMoon" && (
                <dialog className="modal modal-open">
                    <div className="modal-box max-w-xs space-y-4">
                        <h3 className="font-bold text-lg">☀ / ☾</h3>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="label label-text text-xs">☀ Sun</label>
                                <input
                                    type="number"
                                    className="input input-bordered w-full"
                                    value={editSun}
                                    min={0}
                                    onChange={e => setEditSun(e.target.value)}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="label label-text text-xs">☾ Moon</label>
                                <input
                                    type="number"
                                    className="input input-bordered w-full"
                                    value={editMoon}
                                    min={0}
                                    onChange={e => setEditMoon(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="modal-action">
                            <button className="btn btn-ghost btn-sm" onClick={closeEdit}>Cancelar</button>
                            <button className="btn btn-primary btn-sm" onClick={confirmSunMoon}>Confirmar</button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={closeEdit} />
                </dialog>
            )}

            {/* Stance modal */}
            {editing === "stance" && (
                <dialog className="modal modal-open">
                    <div className="modal-box max-w-xs space-y-4">
                        <h3 className="font-bold text-lg">{t("combat.stance")}</h3>
                        <select
                            className="select select-bordered w-full"
                            value={editStance}
                            onChange={e => setEditStance(e.target.value as Stance | "")}
                        >
                            <option value="">{t("combat.noStance")}</option>
                            <option value="Defensive">{t("combat.defensive")}</option>
                            <option value="Offensive">{t("combat.offensive")}</option>
                            <option value="Virtuous">{t("combat.virtuous")}</option>
                        </select>
                        <div className="modal-action">
                            <button className="btn btn-ghost btn-sm" onClick={closeEdit}>Cancelar</button>
                            <button className="btn btn-primary btn-sm" onClick={confirmStance}>Confirmar</button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={closeEdit} />
                </dialog>
            )}

            {/* Rank modal */}
            {editing === "rank" && (
                <dialog className="modal modal-open">
                    <div className="modal-box max-w-xs space-y-4">
                        <h3 className="font-bold text-lg">{t("combat.perfection")}</h3>
                        <div>
                            <label className="label label-text text-xs">{t("combat.rank")}</label>
                            <select
                                className="select select-bordered w-full"
                                value={editRank}
                                onChange={e => setEditRank(e.target.value)}
                            >
                                {["D", "C", "B", "A", "S"].map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label label-text text-xs">{t("combat.progress")}</label>
                            <input
                                type="number"
                                className="input input-bordered w-full"
                                value={editRankProgress}
                                min={0}
                                max={10}
                                onChange={e => setEditRankProgress(e.target.value)}
                            />
                        </div>
                        <div className="modal-action">
                            <button className="btn btn-ghost btn-sm" onClick={closeEdit}>Cancelar</button>
                            <button className="btn btn-primary btn-sm" onClick={confirmRank}>Confirmar</button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={closeEdit} />
                </dialog>
            )}

            {/* Conditions modal */}
            <StatusConditionsModal
                open={conditionsOpen}
                onClose={() => setConditionsOpen(false)}
                battleCharacterId={ch.battleID}
                statuses={ch.status ?? []}
            />

            {/* Stains modal */}
            {editing === "stains" && (
                <dialog className="modal modal-open">
                    <div className="modal-box max-w-xs space-y-4">
                        <h3 className="font-bold text-lg">{t("combat.stains")}</h3>
                        {editStains.map((stain, idx) => (
                            <div key={idx}>
                                <label className="label label-text text-xs">Slot {idx + 1}</label>
                                <select
                                    className="select select-bordered w-full select-sm"
                                    value={stain}
                                    onChange={e => {
                                        const copy = [...editStains];
                                        copy[idx] = e.target.value as StainType | "";
                                        setEditStains(copy);
                                    }}
                                >
                                    <option value="">— Vazio —</option>
                                    {stainOptions.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                        <div className="modal-action">
                            <button className="btn btn-ghost btn-sm" onClick={closeEdit}>Cancelar</button>
                            <button className="btn btn-primary btn-sm" onClick={confirmStains}>Confirmar</button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={closeEdit} />
                </dialog>
            )}
        </div>
    );
}
