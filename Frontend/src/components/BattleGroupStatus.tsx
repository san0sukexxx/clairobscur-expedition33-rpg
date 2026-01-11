import React from "react";
import { FaSkull } from "react-icons/fa";
import { type GetPlayerResponse } from "../api/APIPlayer";
import { type BattleCharacterInfo } from "../api/ResponseModel";
import AnimatedStatBar from "./AnimatedStatBar";
import { BestialWheel } from "./BestialWheel";
import { getStatusLabel, shouldShowStatusAmmount } from "../utils/BattleUtils";
import { npcIsFlying } from "../utils/NpcCalculator";
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
}

function pct(cur: number, max: number) {
    return Math.max(0, Math.min(100, Math.round((cur / max) * 100)));
}

export default function BattleGroupStatus({
    player,
    isEnemies,
    currentCharacter,
    isAttacking,
    onSelectTarget,
    isReviveMode = false,
    isExecutingSkill = false,
    isAdmin = false,
    excludeSelf = false
}: BattleGroupStatusProps) {
    if (player?.fightInfo?.characters == undefined) return null;

    const characters = player.fightInfo.characters.filter(ch => ch.isEnemy == isEnemies);

    return (
        <div className="mt-5">
            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h2 className="card-title justify-center">
                        {currentCharacter?.isEnemy != isEnemies ? "Inimigos" : "Equipe"}
                    </h2>

                    {characters.length == 0 && (
                        <div className="text-sm text-neutral-500 italic text-center">
                            Ninguém por aqui ainda
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {characters.map((ch) => {
                            const isDead = ch.healthPoints === 0;
                            const isSelf = excludeSelf && currentCharacter && ch.battleID === currentCharacter.battleID;
                            const isSelectable = !isExecutingSkill && !isSelf && ((isAttacking && !isDead) || (isReviveMode && isDead));

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
                                            : "pointer-events-none"
                                        }
                ${isExecutingSkill ? "opacity-50" : ""}
            `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="avatar">
                                            <div className={`w-14 h-14 rounded-full ring ring-base-300 ring-offset-2 ring-offset-base-200 
                                                ${isDead ? "grayscale" : ""}`}>
                                                <img
                                                    src={ch.type == "npc" ? `/enemies/${ch.id}.png` : `/characters/${ch.id}.webp`}
                                                    alt={ch.name}
                                                />
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

                                                        return (
                                                            <span key={idx} className="px-1 py-0.5 rounded bg-base-300">
                                                                {getStatusLabel(st.effectName)}{" "}
                                                                {showAmmount && st.ammount != null ? st.ammount : ""}{" "}
                                                                {st.remainingTurns ? `(${st.remainingTurns})` : ""}
                                                            </span>
                                                        );
                                                    })}

                                                {npcIsFlying(ch) && (
                                                    <span key="flying" className="px-1 py-0.5 rounded bg-base-300">
                                                        Voando
                                                    </span>
                                                )}
                                            </div>

                                            {isDead && <FaSkull className="text-error" title="Morto" />}
                                        </div>
                                    </div>

                                    <div className="mt-3 space-y-2">

                                        <div>
                                            <div className="flex items-center justify-between text-xs uppercase">
                                                <span className="opacity-70">HP</span>
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
                                                <div>
                                                    <div className="flex items-center justify-between text-xs uppercase">
                                                        <span className="opacity-70">MP</span>
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
                                                <div className="w-full">
                                                    <BestialWheel position={ch.bestialWheelPosition} />
                                                </div>
                                            )}

                                        {/* Lune's Stain System */}
                                        {ch.id.toLowerCase().includes("lune") && (() => {
                                            const stains = [ch.stainSlot1, ch.stainSlot2, ch.stainSlot3, ch.stainSlot4];
                                            const hasAnyStain = stains.some(s => s !== null && s !== undefined);

                                            return (
                                                <div className="mt-2 flex items-center gap-2 text-xs">
                                                    <span className="opacity-70 uppercase">Manchas</span>
                                                    {!hasAnyStain ? (
                                                        <div className="badge badge-ghost badge-sm opacity-60">Nenhuma</div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5">
                                                            {stains.map((stain, idx) => {
                                                                if (!stain) {
                                                                    return (
                                                                        <div
                                                                            key={idx}
                                                                            className="w-5 h-5 rounded-full border-2 border-base-300 bg-base-200/30"
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

                                        {/* Verso's Perfection Rank System */}
                                        {ch.id.toLowerCase().includes("verso") && ch.perfectionRank && (() => {
                                            const currentRank = ch.perfectionRank; // D, C, B, A, S
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
                                                <div className="mt-2">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs opacity-70 uppercase">Perfeição</span>
                                                        <div className={`
                                                            px-2 py-0.5 rounded border-2 font-bold text-sm
                                                            ${getRankColor(currentRank)}
                                                        `}>
                                                            Rank {currentRank}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs mb-0.5">
                                                        <span className="opacity-50">Progresso</span>
                                                        <span className="font-mono">
                                                            {rankProgress}/{rankMax}
                                                        </span>
                                                    </div>
                                                    <AnimatedStatBar
                                                        value={pct(rankProgress, rankMax)}
                                                        label="Rank Progress"
                                                        fillClass={getRankFillClass(currentRank)}
                                                        ghostClass={getRankGhostClass(currentRank)}
                                                    />
                                                </div>
                                            );
                                        })()}

                                        {ch.maxChargePoints !== undefined &&
                                            ch.maxChargePoints !== null &&
                                            ch.maxChargePoints > 0 && (
                                                <div>
                                                    <div className="flex items-center justify-between text-xs uppercase">
                                                        <span className="opacity-70">Carga</span>
                                                        <span className="font-mono">
                                                            {ch.chargePoints ?? 0}/{ch.maxChargePoints}
                                                        </span>
                                                    </div>
                                                    <AnimatedStatBar
                                                        value={pct(ch.chargePoints ?? 0, ch.maxChargePoints!)}
                                                        label="Carga"
                                                        fillClass="bg-warning"
                                                        ghostClass="bg-warning/30"
                                                    />
                                                </div>
                                            )}

                                        {/* Sun/Moon charges for Sciel */}
                                        {ch.id.toLowerCase().includes("sciel") && (
                                            <div className="mt-2 flex items-center gap-3 text-sm">
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
                                            </div>
                                        )}

                                        {/* Stance indicator for Maelle only */}
                                        {ch.stance !== undefined &&
                                         ch.id.toLowerCase().includes("maelle") && (
                                            <div className="mt-2">
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="opacity-70">Postura</span>
                                                    {ch.stance === "Defensive" && (
                                                        <div className="badge badge-info badge-sm">Defensiva</div>
                                                    )}
                                                    {ch.stance === "Offensive" && (
                                                        <div className="badge badge-error badge-sm">Ofensiva</div>
                                                    )}
                                                    {ch.stance === "Virtuous" && (
                                                        <div className="badge bg-purple-500 text-white border-purple-500 badge-sm">Virtuosa</div>
                                                    )}
                                                    {!ch.stance && (
                                                        <div className="badge badge-ghost badge-sm">Sem postura</div>
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
        </div>
    );
}
