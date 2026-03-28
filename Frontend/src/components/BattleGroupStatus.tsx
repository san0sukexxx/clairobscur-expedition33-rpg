import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

function requestPlayerRefresh() {
    window.dispatchEvent(new Event("player-refresh"));
}
import { FaSkull, FaEdit, FaShieldAlt } from "react-icons/fa";
import { type GetPlayerResponse } from "../api/APIPlayer";
import { handleNpcImgError } from "../utils/NpcUtils";
import { APIBattle } from "../api/APIBattle";
import { type BattleCharacterInfo, type Stance } from "../api/ResponseModel";
import { LuneStainsModal } from "./LuneStainsModal";
import AnimatedStatBar from "./AnimatedStatBar";
import { BestialWheel } from "./BestialWheel";
import { getStatusLabel, shouldShowStatusAmmount } from "../utils/BattleUtils";
import { npcIsFlying } from "../utils/NpcCalculator";
import StatEditModal from "./StatEditModal";
import { HpEditModal } from "./HpEditModal";
import { ApEditModal } from "./ApEditModal";
import { StatusConditionsModal } from "./StatusConditionsModal";
import { ArmorClassModal } from "./ArmorClassModal";
import { useWeaponInfo } from "../hooks/player/useWeaponInfo";
import { calculateArmorClass } from "../utils/PlayerCalculator";
import { t } from "../i18n";
import NpcImageModal from "./NpcImageModal";

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
    hideSelf?: boolean;
    selfOnly?: boolean;
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
    hitCharacters,
    hideSelf = false,
    selfOnly = false,
}: BattleGroupStatusProps) {
    // Edit state
    const [editing, setEditing] = useState<EditField>(null);
    const [editValue, setEditValue] = useState(0);
    const [editSun, setEditSun] = useState("");
    const [editMoon, setEditMoon] = useState("");
    const [editStance, setEditStance] = useState<Stance | "">("");
    const [editRank, setEditRank] = useState("D");
    const [imageModalNpc, setImageModalNpc] = useState<{ id: string; name: string } | null>(null);
    const [editRankProgress, setEditRankProgress] = useState("");
    const [stainsEditChId, setStainsEditChId] = useState<number | null>(null);
    const [conditionsOpen, setConditionsOpen] = useState(false);
    const [breakEditOpen, setBreakEditOpen] = useState(false);
    const [editBreakValue, setEditBreakValue] = useState(0);
    const [expandedStatusBadge, setExpandedStatusBadge] = useState<string | null>(null);
    const [armorClassModalOpen, setArmorClassModalOpen] = useState(false);
    const { weaponInfo } = useWeaponInfo(player);
    const hpPending = useRef<number | null>(null);
    const mpPending = useRef<number | null>(null);
    const chargePending = useRef<number | null>(null);
    const rankProgressPending = useRef<number | null>(null);
    const [hpOptimistic, setHpOptimistic] = useState<number | null>(null);
    const [mpOptimistic, setMpOptimistic] = useState<number | null>(null);
    const [chargeOptimistic, setChargeOptimistic] = useState<number | null>(null);
    const [rankProgressOptimistic, setRankProgressOptimistic] = useState<number | null>(null);

    const _playerBattleID = player?.fightInfo?.playerBattleID;
    const _playerCh = player?.fightInfo?.characters?.find(c => c.battleID === _playerBattleID);
    useEffect(() => { if (hpOptimistic !== null && _playerCh?.healthPoints === hpOptimistic) { setHpOptimistic(null); hpPending.current = null; } }, [_playerCh?.healthPoints]);
    useEffect(() => { if (mpOptimistic !== null && _playerCh?.magicPoints === mpOptimistic) { setMpOptimistic(null); mpPending.current = null; } }, [_playerCh?.magicPoints]);
    useEffect(() => { if (chargeOptimistic !== null && _playerCh?.chargePoints === chargeOptimistic) { setChargeOptimistic(null); chargePending.current = null; } }, [_playerCh?.chargePoints]);
    useEffect(() => { if (rankProgressOptimistic !== null && _playerCh?.rankProgress === rankProgressOptimistic) { setRankProgressOptimistic(null); rankProgressPending.current = null; } }, [_playerCh?.rankProgress]);

    if (player?.fightInfo?.characters == undefined) return null;

    const playerBattleID = player.fightInfo.playerBattleID;

    const allTeamCharacters = player.fightInfo.characters.filter(ch => ch.isEnemy == isEnemies);
    const characters = selfOnly
        ? allTeamCharacters.filter(ch => ch.battleID === playerBattleID)
        : hideSelf
        ? allTeamCharacters.filter(ch => ch.battleID !== playerBattleID)
        : allTeamCharacters;

    // Find the player character for modal rendering
    const playerCh = allTeamCharacters.find(c => c.battleID === playerBattleID);

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
        setStainsEditChId(ch.battleID);
        setEditing("stains");
    }

    const cardGrid = (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
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
                rounded-xl shadow-sm transition-all duration-200
                ${selfOnly ? "px-3 py-3" : "px-3 pt-3 pb-2"}
                ${selfOnly ? "bg-accent/5" : "bg-base-200/60"}
                ${isDead && !isReviveMode ? "pointer-events-none opacity-60" : ""}
                ${isSelectable
                                            ? "cursor-pointer hover:shadow-lg target-glow"
                                            : canEdit ? "" : "pointer-events-none"
                                        }
                ${isExecutingSkill ? "opacity-50" : ""}
                ${isHit ? "animate-pulse !bg-error/30 !shadow-lg !shadow-error/50" : ""}
            `}
                                >
                                    {/* Avatar row */}
                                    <div className="flex items-center gap-3">
                                        <div className="avatar">
                                            <div
                                                className={`w-14 h-14 rounded-full ring ring-base-300 ring-offset-2 ring-offset-base-200 flex items-center justify-center bg-base-300 overflow-hidden
                                                ${isDead ? "grayscale" : ""} ${ch.type === "npc" ? "cursor-zoom-in pointer-events-auto" : ""}`}
                                                onClick={(e) => {
                                                    if (ch.type === "npc") {
                                                        e.stopPropagation();
                                                        setImageModalNpc({ id: ch.id, name: ch.name });
                                                    }
                                                }}
                                            >
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

                                        {canEdit ? (
                                            /* Self / admin: name + status badges lado a lado */
                                            <div className="flex items-center gap-2 justify-between w-full">
                                                <div className="flex flex-col gap-0.5">
                                                    <p className={`font-semibold ${isDead ? "text-neutral-500 line-through" : ""}`}>
                                                        {ch.nameHidden ? "???" : ch.name}
                                                    </p>
                                                    {canEdit && (
                                                        <button
                                                            className="btn btn-xs btn-outline gap-1 font-mono pointer-events-auto w-fit"
                                                            onClick={(e) => { e.stopPropagation(); setArmorClassModalOpen(true); }}
                                                        >
                                                            <FaShieldAlt size={10} />
                                                            {t("combatAdmin.npcDetails.armorClass")} {calculateArmorClass(player, weaponInfo)}
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="flex flex-row flex-wrap gap-1 text-[10px] opacity-80 justify-end">
                                                    {ch.status
                                                        ?.filter(s => {
                                                            if (s.effectName === "free-shot") return false;
                                                            if (s.effectName === "invisible-barrier") return false;
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
                                        ) : (
                                            /* Outros jogadores: nome + HP bar na mesma linha */
                                            <div className="flex flex-col w-full gap-1">
                                                <div className="flex items-center justify-between">
                                                    <p className={`font-semibold text-sm ${isDead ? "text-neutral-500 line-through" : ""}`}>
                                                        {ch.nameHidden ? "???" : ch.name}
                                                    </p>
                                                    <div className="flex items-center gap-1">
                                                        {ch.type !== "npc" && <span className="font-mono text-xs">{ch.healthPoints}/{ch.maxHealthPoints}</span>}
                                                        {isDead && <FaSkull className="text-error text-xs" title={t("combat.dead")} />}
                                                    </div>
                                                </div>
                                                <AnimatedStatBar
                                                    value={pct(ch.healthPoints, ch.maxHealthPoints)}
                                                    label="HP"
                                                    fillClass="bg-error"
                                                    ghostClass="bg-error/30"
                                                    breakMarkers={[
                                                        { position: 66, triggered: (ch.breakCount ?? 0) >= 1 },
                                                        { position: 33, triggered: (ch.breakCount ?? 0) >= 2 },
                                                    ]}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Status badges para outros jogadores: abaixo, à esquerda */}
                                    {!canEdit && (() => {
                                        const visibleStatuses = ch.status?.filter(s => {
                                            if (s.effectName === "free-shot") return false;
                                            if (s.effectName === "invisible-barrier") return false;
                                            return true;
                                        }) ?? [];
                                        const hasItems = visibleStatuses.length > 0 || npcIsFlying(ch);
                                        if (!hasItems) return null;
                                        return (
                                            <div className="flex flex-row flex-wrap gap-1 text-[10px] opacity-80 justify-start mt-2">
                                                {visibleStatuses.map((st, idx) => {
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
                                            </div>
                                        );
                                    })()}

                                    {expandedStatusBadge?.startsWith(`${ch.battleID}-`) && (
                                        <p className="text-[10px] opacity-70 leading-relaxed mt-1 px-1">
                                            {t(`battle.statusDescriptions.${expandedStatusBadge.split("-").slice(1).join("-")}`) || t("battle.statusDescriptions.default")}
                                        </p>
                                    )}

                                    {canEdit && <div className="mt-3 space-y-0">

                                        {/* HP block: apenas para self/admin (outros já têm HP no header) */}
                                        {canEdit && <div
                                            className={canEdit ? "cursor-pointer rounded p-0.5 hover:bg-base-300/60 transition-colors pointer-events-auto" : ""}
                                            onClick={canEdit ? () => openHp(ch) : undefined}
                                        >
                                            <div className="flex items-center justify-between text-xs uppercase leading-none">
                                                <span className="opacity-70 flex items-center gap-1">{t("combat.hp")} {canEdit && <FaEdit size={10} className="opacity-40" />}</span>
                                                <span className="flex items-center gap-1">
                                                    <span className="font-mono">{hpOptimistic ?? ch.healthPoints}/{ch.maxHealthPoints}</span>
                                                    {canEdit && (
                                                        <button
                                                            className="btn btn-xs btn-ghost text-warning p-0"
                                                            onClick={(e) => { e.stopPropagation(); setEditBreakValue(2 - (ch.breakCount ?? 0)); setBreakEditOpen(true); }}
                                                            title={t("combatAdmin.labels.breakEditTitle")}
                                                        >💥</button>
                                                    )}
                                                </span>
                                            </div>
                                            <AnimatedStatBar
                                                value={pct(hpOptimistic ?? ch.healthPoints, ch.maxHealthPoints)}
                                                label="HP"
                                                fillClass="bg-error"
                                                ghostClass="bg-error/30"
                                                breakMarkers={[
                                                    { position: 66, triggered: (ch.breakCount ?? 0) >= 1 },
                                                    { position: 33, triggered: (ch.breakCount ?? 0) >= 2 },
                                                ]}
                                            />
                                            {canEdit && (
                                                <div className="flex gap-0.5 mt-1 mb-2 pointer-events-auto" onClick={e => e.stopPropagation()}>
                                                    {[-10, -5, -1, 1, 5, 10].map(delta => (
                                                        <button
                                                            key={delta}
                                                            className={`btn btn-xs flex-1 px-0 text-[10px] min-h-0 h-5 border-0 ${delta < 0 ? "text-error bg-error/10 hover:bg-error/20" : "text-success bg-success/10 hover:bg-success/20"}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const base = hpPending.current ?? ch.healthPoints;
                                                                const newVal = Math.max(0, Math.min(ch.maxHealthPoints, base + delta));
                                                                hpPending.current = newVal;
                                                                setHpOptimistic(newVal);
                                                                APIBattle.updateCharacterHp(ch.battleID, newVal);
                                                            }}
                                                        >{delta > 0 ? `+${delta}` : delta}</button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>}

                                        {canEdit && ch.magicPoints !== undefined &&
                                            ch.magicPoints !== null &&
                                            ch.maxMagicPoints !== undefined &&
                                            ch.maxMagicPoints !== null && (
                                                <div
                                                    className={canEdit ? "cursor-pointer rounded p-0.5 hover:bg-base-300/60 transition-colors pointer-events-auto" : ""}
                                                    onClick={canEdit ? () => openMp(ch) : undefined}
                                                >
                                                    <div className="flex items-center justify-between text-xs uppercase leading-none mb-1">
                                                        <span className="opacity-70 flex items-center gap-1">{t("combat.mp")} {canEdit && <FaEdit size={10} className="opacity-40" />}</span>
                                                        <span className="font-mono">
                                                            {mpOptimistic ?? ch.magicPoints}/{ch.maxMagicPoints}
                                                        </span>
                                                    </div>
                                                    <AnimatedStatBar
                                                        value={pct(mpOptimistic ?? ch.magicPoints!, ch.maxMagicPoints!)}
                                                        label="AP"
                                                        fillClass="bg-info"
                                                        ghostClass="bg-info/30"
                                                    />
                                                    {canEdit && (
                                                        <div className="flex gap-0.5 mt-1 mb-2 pointer-events-auto" onClick={e => e.stopPropagation()}>
                                                            {[-10, -5, -1, 1, 5, 10].map(delta => (
                                                                <button
                                                                    key={delta}
                                                                    className={`btn btn-xs flex-1 px-0 text-[10px] min-h-0 h-5 border-0 ${delta < 0 ? "text-error bg-error/10 hover:bg-error/20" : "text-success bg-success/10 hover:bg-success/20"}`}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const base = mpPending.current ?? ch.magicPoints!;
                                                                        const newVal = Math.max(0, Math.min(ch.maxMagicPoints!, base + delta));
                                                                        mpPending.current = newVal;
                                                                        setMpOptimistic(newVal);
                                                                        APIBattle.updateCharacterMp(ch.battleID, newVal);
                                                                    }}
                                                                >{delta > 0 ? `+${delta}` : delta}</button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                        {/* Monoco's Bestial Wheel */}
                                        {canEdit && ch.id.toLowerCase().includes("monoco") &&
                                            ch.bestialWheelPosition !== undefined &&
                                            ch.bestialWheelPosition !== null && (
                                                <div className="w-full">
                                                    <BestialWheel position={ch.bestialWheelPosition} />
                                                    {canEdit && (
                                                        <div className="flex gap-0.5 mt-1 pointer-events-auto">
                                                            {[-5, -1, +1, +5].map(delta => (
                                                                <button
                                                                    key={delta}
                                                                    className={`btn btn-xs flex-1 px-0 text-[10px] min-h-0 h-5 border-0 ${delta < 0 ? "text-error bg-error/10 hover:bg-error/20" : "text-success bg-success/10 hover:bg-success/20"}`}
                                                                    onClick={async () => {
                                                                        const newPos = (((ch.bestialWheelPosition ?? 0) + delta) % 9 + 9) % 9;
                                                                        await APIBattle.updateBestialWheelPosition(ch.battleID, newPos);
                                                                        requestPlayerRefresh();
                                                                    }}
                                                                >{delta > 0 ? `+${delta}` : delta}</button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                        {/* Lune's Stain System */}
                                        {canEdit && ch.id.toLowerCase().includes("lune") && (() => {
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
                                        {canEdit && ch.id.toLowerCase().includes("verso") && (() => {
                                            const currentRank = ch.perfectionRank ?? "D";
                                            const rankProgress = rankProgressOptimistic ?? ch.rankProgress ?? 0;
                                            const rankMax = 10;

                                            const getRankColor = (rank: string) => {
                                                switch(rank) {
                                                    case "S": return "text-red-400 border-red-400";
                                                    case "A": return "text-purple-400 border-purple-400";
                                                    case "B": return "text-blue-400 border-blue-400";
                                                    case "C": return "text-amber-200 border-amber-200";
                                                    case "D": return "text-gray-300 border-gray-300";
                                                    default: return "text-gray-400 border-gray-400";
                                                }
                                            };

                                            const getRankFillClass = (rank: string) => {
                                                switch(rank) {
                                                    case "S": return "bg-red-500";
                                                    case "A": return "bg-purple-500";
                                                    case "B": return "bg-blue-500";
                                                    case "C": return "bg-amber-200";
                                                    case "D": return "bg-gray-300";
                                                    default: return "bg-gray-500";
                                                }
                                            };

                                            const getRankGhostClass = (rank: string) => {
                                                switch(rank) {
                                                    case "S": return "bg-red-500/30";
                                                    case "A": return "bg-purple-500/30";
                                                    case "B": return "bg-blue-500/30";
                                                    case "C": return "bg-amber-200/30";
                                                    case "D": return "bg-gray-300/30";
                                                    default: return "bg-gray-500/30";
                                                }
                                            };

                                            return (
                                                <div className="mt-2">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs opacity-70 uppercase">
                                                            {t("combat.perfection")}
                                                        </span>
                                                        <div className="flex items-center gap-1 pointer-events-auto">
                                                            {["D","C","B","A","S"].map(rank => (
                                                                <button
                                                                    key={rank}
                                                                    className={`px-3 py-0.5 rounded border-2 font-bold text-xs transition-opacity
                                                                        ${currentRank === rank
                                                                            ? `${getRankFillClass(rank)} text-base-100 border-transparent opacity-100`
                                                                            : `${getRankColor(rank)} opacity-30 hover:opacity-60`}
                                                                        ${canEdit ? "cursor-pointer" : "cursor-default"}
                                                                    `}
                                                                    onClick={canEdit ? () => APIBattle.updateCharacterRank(ch.battleID, rank, rankProgress).then(requestPlayerRefresh) : undefined}
                                                                >
                                                                    {rank}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1">
                                                            <AnimatedStatBar
                                                                value={currentRank === "S" ? 100 : pct(rankProgress, rankMax)}
                                                                label={t("combat.progress")}
                                                                fillClass={getRankFillClass(currentRank)}
                                                                ghostClass={getRankGhostClass(currentRank)}
                                                            />
                                                        </div>
                                                        <span className="font-mono text-xs shrink-0">
                                                            {currentRank === "S" ? t("playerPage.specialAttacks.perfectionMax") : `${rankProgress}/${rankMax}`}
                                                        </span>
                                                    </div>
                                                    {canEdit && (
                                                        <div className="flex gap-0.5 mt-1 mb-2 pointer-events-auto" onClick={e => e.stopPropagation()}>
                                                            {[-5, -1, +1, +5].map(delta => (
                                                                <button
                                                                    key={delta}
                                                                    className={`btn btn-xs flex-1 px-0 text-[10px] min-h-0 h-5 border-0 ${delta < 0 ? "text-error bg-error/10 hover:bg-error/20" : "text-success bg-success/10 hover:bg-success/20"}`}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const ranks = ["D","C","B","A","S"];
                                                                        let rIdx = ranks.indexOf(currentRank);
                                                                        const base = rankProgressPending.current ?? (ch.rankProgress ?? 0);
                                                                        let newProgress = base + delta;
                                                                        while (newProgress > rankMax && rIdx < ranks.length - 1) { rIdx++; newProgress -= rankMax; }
                                                                        while (newProgress < 0 && rIdx > 0) { rIdx--; newProgress += rankMax; }
                                                                        newProgress = Math.max(0, Math.min(rankMax, newProgress));
                                                                        const newRank = ranks[rIdx];
                                                                        const finalProgress = newRank === "S" ? 0 : newProgress;
                                                                        if (newRank === currentRank) {
                                                                            rankProgressPending.current = finalProgress;
                                                                            setRankProgressOptimistic(finalProgress);
                                                                        } else {
                                                                            rankProgressPending.current = null;
                                                                            setRankProgressOptimistic(null);
                                                                        }
                                                                        APIBattle.updateCharacterRank(ch.battleID, newRank, finalProgress).then(requestPlayerRefresh);
                                                                    }}
                                                                >{delta > 0 ? `+${delta}` : delta}</button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}

                                        {canEdit && (() => {
                                            const isGustave = ch.id.toLowerCase().includes("gustave");
                                            const maxCharge = ch.maxChargePoints ?? (isGustave ? 10 : 0);
                                            if (maxCharge <= 0) return null;
                                            return (
                                                <div
                                                    className={canEdit ? "cursor-pointer rounded p-0.5 hover:bg-base-300/60 transition-colors pointer-events-auto" : ""}
                                                    onClick={canEdit ? () => openCharge(ch) : undefined}
                                                >
                                                    <div className="flex items-center justify-between text-xs uppercase leading-none mb-1">
                                                        <span className="opacity-70 flex items-center gap-1">{t("combat.charge")} {canEdit && <FaEdit size={10} className="opacity-40" />}</span>
                                                        <span className="font-mono">
                                                            {chargeOptimistic ?? ch.chargePoints ?? 0}/{maxCharge}
                                                        </span>
                                                    </div>
                                                    <AnimatedStatBar
                                                        value={pct(chargeOptimistic ?? ch.chargePoints ?? 0, maxCharge)}
                                                        label={t("combat.charge")}
                                                        fillClass="bg-warning"
                                                        ghostClass="bg-warning/30"
                                                    />
                                                    {canEdit && (
                                                        <div className="flex gap-0.5 mt-1 mb-2 pointer-events-auto" onClick={e => e.stopPropagation()}>
                                                            {[-10, -5, -1, 1, 5, 10].map(delta => (
                                                                <button
                                                                    key={delta}
                                                                    className={`btn btn-xs flex-1 px-0 text-[10px] min-h-0 h-5 border-0 ${delta < 0 ? "text-error bg-error/10 hover:bg-error/20" : "text-success bg-success/10 hover:bg-success/20"}`}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const base = chargePending.current ?? (ch.chargePoints ?? 0);
                                                                        const newVal = Math.max(0, Math.min(maxCharge, base + delta));
                                                                        chargePending.current = newVal;
                                                                        setChargeOptimistic(newVal);
                                                                        APIBattle.updateCharacterChargePoints(ch.battleID, newVal);
                                                                    }}
                                                                >{delta > 0 ? `+${delta}` : delta}</button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}

                                        {/* Sun/Moon/Eclipse charges for Sciel */}
                                        {canEdit && ch.id.toLowerCase().includes("sciel") && (() => {
                                            const sunCharges = ch.sunCharges ?? 0;
                                            const moonCharges = ch.moonCharges ?? 0;
                                            const twilightStatus = ch.status?.find(s => s.effectName === "Twilight");
                                            const isEclipse = !!twilightStatus;
                                            const eclipseCharges = twilightStatus?.ammount ?? 0;
                                            const eclipseTurns = twilightStatus?.remainingTurns ?? 2;

                                            const handleSunDelta = async (delta: number) => {
                                                const newSun = Math.max(0, sunCharges + delta);
                                                if (delta > 0 && moonCharges > 0) {
                                                    await APIBattle.updateSunMoonCharges(ch.battleID, 0, 0);
                                                    await APIBattle.addStatus({ battleCharacterId: ch.battleID, effectType: "Twilight", ammount: newSun + moonCharges, remainingTurns: 2 });
                                                } else {
                                                    await APIBattle.updateSunMoonCharges(ch.battleID, newSun, moonCharges);
                                                }
                                                requestPlayerRefresh();
                                            };

                                            const handleMoonDelta = async (delta: number) => {
                                                const newMoon = Math.max(0, moonCharges + delta);
                                                if (delta > 0 && sunCharges > 0) {
                                                    await APIBattle.updateSunMoonCharges(ch.battleID, 0, 0);
                                                    await APIBattle.addStatus({ battleCharacterId: ch.battleID, effectType: "Twilight", ammount: sunCharges + newMoon, remainingTurns: 2 });
                                                } else {
                                                    await APIBattle.updateSunMoonCharges(ch.battleID, sunCharges, newMoon);
                                                }
                                                requestPlayerRefresh();
                                            };

                                            const handleEclipseDelta = async (delta: number) => {
                                                const newEclipse = Math.max(0, eclipseCharges + delta);
                                                await APIBattle.removeStatus(ch.battleID, "Twilight");
                                                if (newEclipse > 0) {
                                                    await APIBattle.addStatus({ battleCharacterId: ch.battleID, effectType: "Twilight", ammount: newEclipse, remainingTurns: eclipseTurns });
                                                }
                                                requestPlayerRefresh();
                                            };

                                            return (
                                                <div className="mt-2 pointer-events-auto" onClick={e => e.stopPropagation()}>
                                                    {isEclipse ? (<>
                                                        {canEdit && (
                                                            <div className="flex items-center gap-0.5">
                                                                <span className="font-mono font-semibold text-orange-400 text-xs w-5 shrink-0 text-right">{eclipseCharges}</span>
                                                                <span className="text-orange-400 text-xs w-4 shrink-0 text-center">🌕</span>
                                                                {[-1, +1].map(delta => (
                                                                    <button key={delta}
                                                                        className={`btn btn-xs flex-1 px-0 text-[10px] min-h-0 h-5 border-0 ${delta < 0 ? "text-error bg-error/10 hover:bg-error/20" : "text-success bg-success/10 hover:bg-success/20"}`}
                                                                        onClick={() => handleEclipseDelta(delta)}
                                                                    >{delta > 0 ? `+${delta}` : delta}</button>
                                                                ))}
                                                                <button
                                                                    className="btn btn-xs flex-1 px-0 text-[10px] min-h-0 h-5 border-0 text-error bg-error/10 hover:bg-error/20"
                                                                    onClick={() => handleEclipseDelta(-eclipseCharges)}
                                                                >✕</button>
                                                            </div>
                                                        )}
                                                    </>) : (<>
                                                        {canEdit && (<>
                                                            <div className="flex items-center gap-0.5 mb-0.5">
                                                                <span className="font-mono font-semibold text-amber-300 text-xs w-5 shrink-0 text-right">{sunCharges}</span>
                                                                <span className="text-amber-400 text-xs w-4 shrink-0 text-center">☀</span>
                                                                {[-1, +1].map(delta => (
                                                                    <button key={delta}
                                                                        className={`btn btn-xs flex-1 px-0 text-[10px] min-h-0 h-5 border-0 ${delta < 0 ? "text-error bg-error/10 hover:bg-error/20" : "text-amber-400 bg-amber-400/10 hover:bg-amber-400/20"}`}
                                                                        onClick={() => handleSunDelta(delta)}
                                                                    >{delta > 0 ? `+${delta}` : delta}</button>
                                                                ))}
                                                            </div>
                                                            <div className="flex items-center gap-0.5">
                                                                <span className="font-mono font-semibold text-purple-300 text-xs w-5 shrink-0 text-right">{moonCharges}</span>
                                                                <span className="text-purple-400 text-xs w-4 shrink-0 text-center">☾</span>
                                                                {[-1, +1].map(delta => (
                                                                    <button key={delta}
                                                                        className={`btn btn-xs flex-1 px-0 text-[10px] min-h-0 h-5 border-0 ${delta < 0 ? "text-error bg-error/10 hover:bg-error/20" : "text-purple-400 bg-purple-400/10 hover:bg-purple-400/20"}`}
                                                                        onClick={() => handleMoonDelta(delta)}
                                                                    >{delta > 0 ? `+${delta}` : delta}</button>
                                                                ))}
                                                            </div>
                                                        </>)}
                                                    </>)}
                                                </div>
                                            );
                                        })()}

                                        {/* Stance buttons for Maelle only */}
                                        {canEdit && ch.stance !== undefined &&
                                         ch.id.toLowerCase().includes("maelle") && (
                                            <div className="mt-2">
                                                <span className="text-xs opacity-70 uppercase">{t("combat.stance")}</span>
                                                <div className="flex gap-1 mt-1 pointer-events-auto">
                                                    <button
                                                        className={`btn btn-xs flex-1 px-0 ${!ch.stance ? "bg-gray-500 text-white border-gray-500 hover:bg-gray-600" : "btn-outline border-gray-500 text-gray-400 opacity-40 hover:opacity-80"}`}
                                                        onClick={canEdit ? () => APIBattle.updateCharacterStance(ch.battleID, null).then(requestPlayerRefresh) : undefined}
                                                    >{t("combat.noStance")}</button>
                                                    <button
                                                        className={`btn btn-xs flex-1 px-0 ${ch.stance === "Offensive" ? "btn-error" : "btn-outline btn-error opacity-40 hover:opacity-80"}`}
                                                        onClick={canEdit ? () => APIBattle.updateCharacterStance(ch.battleID, "Offensive").then(requestPlayerRefresh) : undefined}
                                                    >{t("combat.offensive")}</button>
                                                    <button
                                                        className={`btn btn-xs flex-1 px-0 ${ch.stance === "Defensive" ? "btn-info" : "btn-outline btn-info opacity-40 hover:opacity-80"}`}
                                                        onClick={canEdit ? () => APIBattle.updateCharacterStance(ch.battleID, "Defensive").then(requestPlayerRefresh) : undefined}
                                                    >{t("combat.defensive")}</button>
                                                    <button
                                                        className={`btn btn-xs flex-1 px-0 ${ch.stance === "Virtuous" ? "bg-purple-500 text-white border-purple-500 hover:bg-purple-600" : "btn-outline border-purple-500 text-purple-500 opacity-40 hover:opacity-80"}`}
                                                        onClick={canEdit ? () => APIBattle.updateCharacterStance(ch.battleID, "Virtuous").then(requestPlayerRefresh) : undefined}
                                                    >{t("combat.virtuous")}</button>
                                                </div>
                                            </div>
                                        )}

                                    </div>}
                                </div>
                            );
                        })}
        </div>
    );

    const modals = (<>
        {/* Conditions modal */}
            {playerCh && (
                <StatusConditionsModal
                    open={conditionsOpen}
                    onClose={() => setConditionsOpen(false)}
                    battleCharacterId={playerCh.battleID}
                    statuses={playerCh.status ?? []}
                />
            )}

            <ArmorClassModal
                open={armorClassModalOpen}
                onClose={() => setArmorClassModalOpen(false)}
                armorClass={calculateArmorClass(player, weaponInfo)}
            />

            {/* ---- Modals (portaled to body) ---- */}
            {playerCh && createPortal(
                <>
                    <HpEditModal
                        open={editing === "hp"}
                        name={playerCh.name}
                        currentHp={playerCh.healthPoints}
                        maxHp={playerCh.maxHealthPoints}
                        onClose={closeEdit}
                        onConfirm={async (newHp, newMaxHp) => {
                            if (newHp !== playerCh.healthPoints) await APIBattle.updateCharacterHp(playerCh.battleID, newHp);
                            if (newMaxHp !== playerCh.maxHealthPoints) await APIBattle.updateCharacterMaxHp(playerCh.battleID, newMaxHp);
                            closeEdit();
                        }}
                    />

                    <ApEditModal
                        open={editing === "mp"}
                        name={playerCh.name}
                        currentAp={playerCh.magicPoints ?? 0}
                        maxAp={playerCh.maxMagicPoints ?? 0}
                        onClose={closeEdit}
                        onConfirm={v => confirmNumericEdit("mp", v)}
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

                    {/* Sun/Moon modal */}


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
                    <LuneStainsModal
                        open={editing === "stains"}
                        ch={allTeamCharacters.find(c => c.battleID === stainsEditChId) ?? null}
                        onClose={closeEdit}
                        onRefresh={requestPlayerRefresh}
                    />
                    {/* Break edit */}
                    {breakEditOpen && playerCh && (() => {
                        const currentRemaining = 2 - (playerCh.breakCount ?? 0);
                        const newBreakCount = 2 - editBreakValue;
                        const oldBreakCount = playerCh.breakCount ?? 0;
                        return (
                            <dialog className="modal modal-open" style={{ zIndex: 9999 }}>
                                <div className="modal-box max-w-xs">
                                    <h3 className="font-bold text-lg">{t("combatAdmin.labels.breakEditTitle")}</h3>
                                    <p className="text-sm opacity-70 mb-4">{playerCh.name}</p>
                                    <div className="flex items-center justify-center gap-4">
                                        <button className="btn btn-circle btn-sm" disabled={editBreakValue <= 0} onClick={() => setEditBreakValue(v => Math.max(0, v - 1))}>−</button>
                                        <div className="flex gap-2">
                                            {[0, 1].map(i => (
                                                <div key={i} className={`w-4 h-8 rounded border-2 ${i < editBreakValue ? "bg-yellow-400 border-yellow-500 shadow-[0_0_6px_rgba(250,204,21,0.9)]" : "border-gray-500/60 bg-gray-400/15"}`} />
                                            ))}
                                        </div>
                                        <button className="btn btn-circle btn-sm" disabled={editBreakValue >= 2} onClick={() => setEditBreakValue(v => Math.min(2, v + 1))}>+</button>
                                    </div>
                                    <p className="text-center text-xs opacity-50 mt-2">{editBreakValue}/2</p>
                                    <div className="modal-action">
                                        <button className="btn btn-ghost btn-sm" onClick={() => setBreakEditOpen(false)}>{t("common.cancel")}</button>
                                        <button className="btn btn-warning btn-sm" disabled={editBreakValue === currentRemaining} onClick={async () => {
                                            await APIBattle.updateBreakCount(playerCh.battleID, newBreakCount);
                                            if (newBreakCount > oldBreakCount) {
                                                await APIBattle.addStatus({ battleCharacterId: playerCh.battleID, effectType: "Broken", ammount: 1, remainingTurns: 1 });
                                            }
                                            requestPlayerRefresh();
                                            setBreakEditOpen(false);
                                        }}>{t("combatAdmin.labels.confirm")}</button>
                                    </div>
                                </div>
                                <div className="modal-backdrop" onClick={() => setBreakEditOpen(false)} />
                            </dialog>
                        );
                    })()}
                </>,
                document.body
            )}
        {imageModalNpc && (
            <NpcImageModal
                npcId={imageModalNpc.id}
                npcName={imageModalNpc.name}
                open={true}
                onClose={() => setImageModalNpc(null)}
            />
        )}
    </>);

    if (selfOnly) {
        return <>{cardGrid}{modals}</>;
    }

    return (
        <div className="mt-5">
            <div className="card bg-base-100 shadow">
                <div className="card-body p-3">
                    <h2 className="card-title justify-center">
                        {currentCharacter?.isEnemy != isEnemies ? t("combat.enemies") : t("combat.team")}
                    </h2>
                    {characters.length === 0 && (
                        <div className="text-sm text-neutral-500 italic text-center">
                            {t("combat.noOneHere")}
                        </div>
                    )}
                    {cardGrid}
                </div>
            </div>
            {modals}
        </div>
    );
}
