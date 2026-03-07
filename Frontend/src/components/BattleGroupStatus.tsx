import { useState } from "react";
import { FaSkull, FaEdit } from "react-icons/fa";
import { type GetPlayerResponse } from "../api/APIPlayer";
import { handleNpcImgError } from "../utils/NpcUtils";
import { APIBattle } from "../api/APIBattle";
import { type BattleCharacterInfo, type Stance, type StainType } from "../api/ResponseModel";
import AnimatedStatBar from "./AnimatedStatBar";
import { BestialWheel } from "./BestialWheel";
import { getStatusLabel, shouldShowStatusAmmount } from "../utils/BattleUtils";
import { npcIsFlying } from "../utils/NpcCalculator";
import StatEditModal from "./StatEditModal";
import { StatusConditionsModal } from "./StatusConditionsModal";
import { t } from "../i18n";

interface BattleGroupStatusProps {
    player: GetPlayerResponse | null;
    isEnemies: Boolean;
    currentCharacter: BattleCharacterInfo | undefined;
    isAttacking: Boolean;
    onSelectTarget?: (target: BattleCharacterInfo) => void;
    isReviveMode?: boolean;
    isExecutingSkill?: boolean;
    isAdmin?: boolean;
    excludeSelf?: boolean;
    hitCharacters?: Set<number>;
}

function pct(cur: number, max: number) {
    return Math.max(0, Math.min(100, Math.round((cur / max) * 100)));
}

type EditField = "hp" | "mp" | "charge" | "gradient" | "bestialWheel" | "sunMoon" | "stance" | "rank" | "stains" | null;

export default function BattleGroupStatus({
    player,
    isEnemies,
    currentCharacter,
    isAttacking,
    onSelectTarget,
    isReviveMode = false,
    isExecutingSkill = false,
    isAdmin = false,
    excludeSelf = false,
    hitCharacters
}: BattleGroupStatusProps) {
    // Edit state
    const [editing, setEditing] = useState<EditField>(null);
    const [editValue, setEditValue] = useState(0);
    const [editSun, setEditSun] = useState("");
    const [editMoon, setEditMoon] = useState("");
    const [editStance, setEditStance] = useState<Stance | "">("");
    const [editRank, setEditRank] = useState("D");
    const [editRankProgress, setEditRankProgress] = useState("");
    const [editStains, setEditStains] = useState<(StainType | "")[]>(["", "", "", ""]);
    const [conditionsOpen, setConditionsOpen] = useState(false);
    const [expandedStatusBadge, setExpandedStatusBadge] = useState<string | null>(null);

    if (player?.fightInfo?.characters == undefined) return null;

    const characters = player.fightInfo.characters.filter(ch => ch.isEnemy == isEnemies);
    const playerBattleID = player.fightInfo.playerBattleID;

    // Find the player character for modal rendering
    const playerCh = characters.find(c => c.battleID === playerBattleID);

    const closeEdit = () => setEditing(null);

    const isPlayerSelf = (ch: BattleCharacterInfo) =>
        ch.battleID === playerBattleID && !isEnemies;

    async function confirmNumericEdit(field: "hp" | "mp" | "charge" | "gradient" | "bestialWheel", value: number) {
        if (!playerCh) return;
        switch (field) {
            case "hp":
                await APIBattle.updateCharacterHp(playerCh.battleID, value);
                break;
            case "mp":
                await APIBattle.updateCharacterMp(playerCh.battleID, value);
                break;
            case "charge":
                await APIBattle.updateCharacterChargePoints(playerCh.battleID, value);
                break;
            case "gradient":
                await APIBattle.updateTeamGradient(playerCh.battleID, value);
                break;
            case "bestialWheel":
                await APIBattle.updateBestialWheelPosition(playerCh.battleID, value);
                break;
        }
        closeEdit();
    }

    async function confirmSunMoon() {
        if (!playerCh) return;
        await APIBattle.updateSunMoonCharges(playerCh.battleID, Number(editSun) || 0, Number(editMoon) || 0);
        closeEdit();
    }

    async function confirmStance() {
        if (!playerCh) return;
        await APIBattle.updateCharacterStance(playerCh.battleID, editStance === "" ? null : editStance as Stance);
        closeEdit();
    }

    async function confirmRank() {
        if (!playerCh) return;
        await APIBattle.updateCharacterRank(playerCh.battleID, editRank, Number(editRankProgress) || 0);
        closeEdit();
    }

    async function confirmStains() {
        if (!playerCh) return;
        await APIBattle.updateStains(playerCh.battleID, {
            stainSlot1: editStains[0] || null,
            stainSlot2: editStains[1] || null,
            stainSlot3: editStains[2] || null,
            stainSlot4: editStains[3] || null,
        });
        closeEdit();
    }

    function openHp(ch: BattleCharacterInfo) { setEditValue(ch.healthPoints); setEditing("hp"); }
    function openMp(ch: BattleCharacterInfo) { setEditValue(ch.magicPoints ?? 0); setEditing("mp"); }
    function openCharge(ch: BattleCharacterInfo) { setEditValue(ch.chargePoints ?? 0); setEditing("charge"); }
    function openSunMoon(ch: BattleCharacterInfo) {
        setEditSun(String(ch.sunCharges ?? 0));
        setEditMoon(String(ch.moonCharges ?? 0));
        setEditing("sunMoon");
    }
    function openStance(ch: BattleCharacterInfo) {
        setEditStance(ch.stance ?? "");
        setEditing("stance");
    }
    function openRank(ch: BattleCharacterInfo) {
        setEditRank(ch.perfectionRank ?? "D");
        setEditRankProgress(String(ch.rankProgress ?? 0));
        setEditing("rank");
    }
    function openStainsEdit(ch: BattleCharacterInfo) {
        setEditStains([
            ch.stainSlot1 ?? "",
            ch.stainSlot2 ?? "",
            ch.stainSlot3 ?? "",
            ch.stainSlot4 ?? "",
        ]);
        setEditing("stains");
    }
    function openBestialWheel(ch: BattleCharacterInfo) {
        setEditValue(ch.bestialWheelPosition ?? 0);
        setEditing("bestialWheel");
    }

    const stainOptions: StainType[] = ["Lightning", "Earth", "Fire", "Ice"];

    return (
        <div className="mt-5">
            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h2 className="card-title justify-center">
                        {currentCharacter?.isEnemy != isEnemies ? t("combat.enemies") : t("combat.team")}
                    </h2>

                    {characters.length == 0 && (
                        <div className="text-sm text-neutral-500 italic text-center">
                            {t("combat.noOneHere")}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {characters.map((ch) => {
                            const isDead = ch.healthPoints === 0;
                            const isSelf = excludeSelf && currentCharacter && ch.battleID === currentCharacter.battleID;
                            const isSelectable = !isExecutingSkill && !isSelf && (
                                (isReviveMode && isDead) ||
                                (!isReviveMode && isAttacking && !isDead)
                            );
                            const isHit = hitCharacters?.has(ch.battleID) && !isDead;
                            const canEdit = isPlayerSelf(ch);

                            return (
                                <div
                                    key={ch.battleID}
                                    role={isSelectable ? "button" : undefined}
                                    onClick={() => {
                                        if (isSelectable && onSelectTarget) onSelectTarget(ch);
                                    }}
                                    className={`
                rounded-xl bg-base-200/60 p-3 shadow-sm transition-all duration-200
                ${isDead && !isReviveMode ? "pointer-events-none opacity-60" : ""}
                ${isSelectable
                                            ? "cursor-pointer hover:shadow-lg target-glow"
                                            : canEdit ? "" : "pointer-events-none"
                                        }
                ${isExecutingSkill ? "opacity-50" : ""}
                ${isHit ? "animate-pulse !bg-error/30 !shadow-lg !shadow-error/50" : ""}
            `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="avatar">
                                            <div className={`w-14 h-14 rounded-full ring ring-base-300 ring-offset-2 ring-offset-base-200 flex items-center justify-center bg-base-300 overflow-hidden
                                                ${isDead ? "grayscale" : ""}`}>
                                                <img
                                                    src={ch.type == "npc" ? `/enemies/${ch.id}.png` : `/characters/${ch.id}.webp`}
                                                    alt={ch.name}
                                                    onError={(e) => ch.type === "npc"
                                                        ? handleNpcImgError(e, ch.id)
                                                        : (() => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                            ((e.target as HTMLElement).nextElementSibling as HTMLElement)?.classList.remove('hidden');
                                                        })()
                                                    }
                                                />
                                                <FaSkull className="hidden text-base-content opacity-40 text-2xl" />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 justify-between w-full">
                                            <p className={`font-semibold ${isDead ? "text-neutral-500 line-through" : ""}`}>
                                                {ch.name}
                                            </p>

                                            <div className="flex flex-row flex-wrap gap-1 text-[10px] opacity-80 justify-end">
                                                {ch.status
                                                    ?.filter(s => {
                                                        if (s.effectName === "free-shot") return false;
                                                        if (s.effectName === "invisible-barrier" && !isAdmin) return false;
                                                        return true;
                                                    })
                                                    .map((st, idx) => {
                                                        const showAmmount = shouldShowStatusAmmount(st.effectName);
                                                        const showTurns = st.effectName !== "IntenseFlames" && st.remainingTurns;

                                                        return (
                                                            <span
                                                                key={idx}
                                                                className="px-1 py-0.5 rounded bg-base-300 cursor-pointer hover:opacity-100 transition-opacity pointer-events-auto"
                                                                onClick={(e) => { e.stopPropagation(); setExpandedStatusBadge(prev => prev === `${ch.battleID}-${st.effectName}` ? null : `${ch.battleID}-${st.effectName}`); }}
                                                            >
                                                                {getStatusLabel(st.effectName)}{" "}
                                                                {showAmmount && st.ammount != null ? st.ammount : ""}{" "}
                                                                {showTurns ? `(${st.remainingTurns})` : ""}
                                                            </span>
                                                        );
                                                    })}

                                                {npcIsFlying(ch) && (
                                                    <span key="flying" className="px-1 py-0.5 rounded bg-base-300">
                                                        {t("combat.flying")}
                                                    </span>
                                                )}

                                                {canEdit && (
                                                    <button
                                                        className="px-1 py-0.5 rounded bg-base-300 hover:bg-base-content/20 transition-colors cursor-pointer flex items-center gap-1 pointer-events-auto"
                                                        onClick={(e) => { e.stopPropagation(); setConditionsOpen(true); }}
                                                    >
                                                        <FaEdit size={8} /> Condições
                                                    </button>
                                                )}
                                            </div>

                                            {isDead && <FaSkull className="text-error" title={t("combat.dead")} />}
                                        </div>
                                    </div>

                                    {expandedStatusBadge?.startsWith(`${ch.battleID}-`) && (
                                        <p className="text-[10px] opacity-70 leading-relaxed mt-1 px-1">
                                            {t(`battle.statusDescriptions.${expandedStatusBadge.split("-").slice(1).join("-")}`) || t("battle.statusDescriptions.default")}
                                        </p>
                                    )}

                                    <div className="mt-3 space-y-2">

                                        <div
                                            className={canEdit ? "cursor-pointer rounded p-0.5 hover:bg-base-300/60 transition-colors pointer-events-auto" : ""}
                                            onClick={canEdit ? () => openHp(ch) : undefined}
                                        >
                                            <div className="flex items-center justify-between text-xs uppercase">
                                                <span className="opacity-70 flex items-center gap-1">HP {canEdit && <FaEdit size={10} className="opacity-40" />}</span>
                                                <span className="font-mono">{ch.healthPoints}/{ch.maxHealthPoints}</span>
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
                                                <div
                                                    className={canEdit ? "cursor-pointer rounded p-0.5 hover:bg-base-300/60 transition-colors pointer-events-auto" : ""}
                                                    onClick={canEdit ? () => openMp(ch) : undefined}
                                                >
                                                    <div className="flex items-center justify-between text-xs uppercase">
                                                        <span className="opacity-70 flex items-center gap-1">MP {canEdit && <FaEdit size={10} className="opacity-40" />}</span>
                                                        <span className="font-mono">
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

                                        {/* Monoco's Bestial Wheel */}
                                        {ch.id.toLowerCase().includes("monoco") &&
                                            ch.bestialWheelPosition !== undefined &&
                                            ch.bestialWheelPosition !== null && (
                                                <div
                                                    className={`w-full ${canEdit ? "cursor-pointer rounded p-0.5 hover:bg-base-300/60 transition-colors pointer-events-auto" : ""}`}
                                                    onClick={canEdit ? () => openBestialWheel(ch) : undefined}
                                                >
                                                    {canEdit && (
                                                        <div className="flex items-center gap-1 mb-1 text-[10px] opacity-70 uppercase">
                                                            Bestial Wheel <FaEdit size={10} className="opacity-40" />
                                                        </div>
                                                    )}
                                                    <BestialWheel position={ch.bestialWheelPosition} />
                                                </div>
                                            )}

                                        {/* Lune's Stain System */}
                                        {ch.id.toLowerCase().includes("lune") && (() => {
                                            const stains = [ch.stainSlot1, ch.stainSlot2, ch.stainSlot3, ch.stainSlot4];
                                            const hasAnyStain = stains.some(s => s !== null && s !== undefined);

                                            return (
                                                <div
                                                    className={`mt-2 flex items-center gap-2 text-xs ${canEdit ? "cursor-pointer rounded p-0.5 hover:bg-base-300/60 transition-colors pointer-events-auto" : ""}`}
                                                    onClick={canEdit ? () => openStainsEdit(ch) : undefined}
                                                >
                                                    <span className="opacity-70 uppercase flex items-center gap-1">{t("combat.stains")} {canEdit && <FaEdit size={10} className="opacity-40" />}</span>
                                                    {!hasAnyStain ? (
                                                        <div className="badge badge-ghost badge-sm opacity-60">{t("combat.noStains")}</div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5">
                                                            {stains.map((stain, idx) => {
                                                                if (!stain) {
                                                                    return (
                                                                        <div
                                                                            key={idx}
                                                                            className="w-5 h-5 rounded-full border-2 border-base-300 bg-base-200/30"
                                                                            title={t("combat.emptySlot")}
                                                                        />
                                                                    );
                                                                }

                                                                const stainLower = stain.toLowerCase();
                                                                return (
                                                                    <img
                                                                        key={idx}
                                                                        src={`/stains/${stainLower}-stain.png`}
                                                                        alt={stain}
                                                                        title={t("combat.stainOf", { element: stain })}
                                                                        className="w-5 h-5 object-contain"
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}

                                        {/* Verso's Perfection Rank System */}
                                        {ch.id.toLowerCase().includes("verso") && (() => {
                                            const currentRank = ch.perfectionRank ?? "D";
                                            const rankProgress = ch.rankProgress ?? 0;
                                            const rankMax = 10;

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
                                                <div
                                                    className={`mt-2 ${canEdit ? "cursor-pointer rounded p-0.5 hover:bg-base-300/60 transition-colors pointer-events-auto" : ""}`}
                                                    onClick={canEdit ? () => openRank(ch) : undefined}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs opacity-70 uppercase flex items-center gap-1">
                                                            {t("combat.perfection")} {canEdit && <FaEdit size={10} className="opacity-40" />}
                                                        </span>
                                                        <div className={`
                                                            px-2 py-0.5 rounded border-2 font-bold text-sm
                                                            ${getRankColor(currentRank)}
                                                        `}>
                                                            {t("combat.rank")} {currentRank}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs mb-0.5">
                                                        <span className="opacity-50">{t("combat.progress")}</span>
                                                        <span className="font-mono">
                                                            {currentRank === "S" ? t("playerPage.skills.perfectionMax") : `${rankProgress}/${rankMax}`}
                                                        </span>
                                                    </div>
                                                    <AnimatedStatBar
                                                        value={currentRank === "S" ? 100 : pct(rankProgress, rankMax)}
                                                        label={t("combat.progress")}
                                                        fillClass={getRankFillClass(currentRank)}
                                                        ghostClass={getRankGhostClass(currentRank)}
                                                    />
                                                </div>
                                            );
                                        })()}

                                        {(() => {
                                            const isGustave = ch.id.toLowerCase().includes("gustave");
                                            const maxCharge = ch.maxChargePoints ?? (isGustave ? 10 : 0);
                                            if (maxCharge <= 0) return null;
                                            return (
                                                <div
                                                    className={canEdit ? "cursor-pointer rounded p-0.5 hover:bg-base-300/60 transition-colors pointer-events-auto" : ""}
                                                    onClick={canEdit ? () => openCharge(ch) : undefined}
                                                >
                                                    <div className="flex items-center justify-between text-xs uppercase">
                                                        <span className="opacity-70 flex items-center gap-1">{t("combat.charge")} {canEdit && <FaEdit size={10} className="opacity-40" />}</span>
                                                        <span className="font-mono">
                                                            {ch.chargePoints ?? 0}/{maxCharge}
                                                        </span>
                                                    </div>
                                                    <AnimatedStatBar
                                                        value={pct(ch.chargePoints ?? 0, maxCharge)}
                                                        label={t("combat.charge")}
                                                        fillClass="bg-warning"
                                                        ghostClass="bg-warning/30"
                                                    />
                                                </div>
                                            );
                                        })()}

                                        {/* Sun/Moon charges for Sciel */}
                                        {ch.id.toLowerCase().includes("sciel") && (
                                            <div
                                                className={`mt-2 flex items-center gap-3 text-sm ${canEdit ? "cursor-pointer rounded p-0.5 hover:bg-base-300/60 transition-colors pointer-events-auto" : ""}`}
                                                onClick={canEdit ? () => openSunMoon(ch) : undefined}
                                            >
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
                                                {canEdit && <FaEdit size={10} className="opacity-40" />}
                                            </div>
                                        )}

                                        {/* Stance indicator for Maelle only */}
                                        {ch.stance !== undefined &&
                                         ch.id.toLowerCase().includes("maelle") && (
                                            <div
                                                className={`mt-2 ${canEdit ? "cursor-pointer rounded p-0.5 hover:bg-base-300/60 transition-colors pointer-events-auto" : ""}`}
                                                onClick={canEdit ? () => openStance(ch) : undefined}
                                            >
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="opacity-70 flex items-center gap-1">{t("combat.stance")} {canEdit && <FaEdit size={10} className="opacity-40" />}</span>
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
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Conditions modal */}
            {playerCh && (
                <StatusConditionsModal
                    open={conditionsOpen}
                    onClose={() => setConditionsOpen(false)}
                    battleCharacterId={playerCh.battleID}
                    statuses={playerCh.status ?? []}
                />
            )}

            {/* ---- Modals (only for player's own card) ---- */}
            {playerCh && (
                <>
                    <StatEditModal
                        open={editing === "hp"}
                        title="HP"
                        currentValue={playerCh.healthPoints}
                        minValue={0}
                        maxValue={playerCh.maxHealthPoints}
                        onConfirm={v => confirmNumericEdit("hp", v)}
                        onCancel={closeEdit}
                    />

                    <StatEditModal
                        open={editing === "mp"}
                        title="MP"
                        currentValue={playerCh.magicPoints ?? 0}
                        minValue={0}
                        maxValue={playerCh.maxMagicPoints ?? 999}
                        onConfirm={v => confirmNumericEdit("mp", v)}
                        onCancel={closeEdit}
                    />

                    <StatEditModal
                        open={editing === "charge"}
                        title={t("combat.charge")}
                        currentValue={playerCh.chargePoints ?? 0}
                        minValue={0}
                        maxValue={playerCh.maxChargePoints ?? 10}
                        onConfirm={v => confirmNumericEdit("charge", v)}
                        onCancel={closeEdit}
                    />

                    <StatEditModal
                        open={editing === "bestialWheel"}
                        title="Bestial Wheel"
                        currentValue={playerCh.bestialWheelPosition ?? 0}
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

                    {/* Stains modal */}
                    {editing === "stains" && (
                        <dialog className="modal modal-open">
                            <div className="modal-box max-w-xs space-y-4">
                                <h3 className="font-bold text-lg">{t("combat.stains")}</h3>
                                {editStains.map((stain, idx) => (
                                    <div key={idx}>
                                        <label className="label label-text text-xs opacity-70">Slot {idx + 1}</label>
                                        <div className="flex items-center gap-2">
                                            <button
                                                className={`btn btn-sm btn-circle ${!stain ? "btn-active ring-2 ring-primary" : "btn-ghost"}`}
                                                onClick={() => {
                                                    const copy = [...editStains];
                                                    copy[idx] = "";
                                                    setEditStains(copy);
                                                }}
                                                title={t("combatAdmin.labels.stainEmpty")}
                                            >
                                                <span className="text-base-content/40 text-lg">✕</span>
                                            </button>
                                            {stainOptions.map(s => (
                                                <button
                                                    key={s}
                                                    className={`btn btn-sm btn-circle ${stain === s ? "btn-active ring-2 ring-primary" : "btn-ghost"}`}
                                                    onClick={() => {
                                                        const copy = [...editStains];
                                                        copy[idx] = s;
                                                        setEditStains(copy);
                                                    }}
                                                    title={t(`combatAdmin.labels.stain${s}`)}
                                                >
                                                    <img src={`/stains/${s.toLowerCase()}-stain.png`} alt={s} className="w-6 h-6" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <div className="modal-action">
                                    <button className="btn btn-ghost btn-sm" onClick={closeEdit}>{t("combatAdmin.labels.cancel")}</button>
                                    <button className="btn btn-primary btn-sm" onClick={confirmStains}>{t("combatAdmin.labels.confirm")}</button>
                                </div>
                            </div>
                            <div className="modal-backdrop" onClick={closeEdit} />
                        </dialog>
                    )}
                </>
            )}
        </div>
    );
}
