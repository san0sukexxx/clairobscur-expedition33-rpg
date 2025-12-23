import React from "react";
import { FaSkull } from "react-icons/fa";
import { type GetPlayerResponse } from "../api/APIPlayer";
import { type BattleCharacterInfo } from "../api/ResponseModel";
import AnimatedStatBar from "./AnimatedStatBar";
import { getStatusLabel, shouldShowStatusAmmount } from "../utils/BattleUtils";
import { npcIsFlying } from "../utils/NpcCalculator";

interface BattleGroupStatusProps {
    player: GetPlayerResponse | null;
    isEnemies: Boolean;
    currentCharacter: BattleCharacterInfo | undefined;
    isAttacking: Boolean;
    onSelectTarget?: (target: BattleCharacterInfo) => void;
    isReviveMode?: boolean;
    isExecutingSkill?: boolean;
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
    isExecutingSkill = false
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
                            const isSelectable = !isExecutingSkill && ((isAttacking && !isDead) || (isReviveMode && isDead));

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

                                            <div className="flex flex-row flex-wrap gap-1 text-[10px] opacity-80">
                                                {ch.status
                                                    ?.filter(s => s.effectName !== "free-shot")
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

                                        {/* Stance indicator for Maelle only */}
                                        {ch.stance !== undefined &&
                                         ch.id.toLowerCase().includes("maelle") && (
                                            <div className="mt-2">
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="opacity-70">Postura</span>
                                                    {ch.stance === "Defensive" && (
                                                        <div className="badge badge-info">Defensiva</div>
                                                    )}
                                                    {ch.stance === "Offensive" && (
                                                        <div className="badge badge-error">Ofensiva</div>
                                                    )}
                                                    {ch.stance === "Virtuous" && (
                                                        <div className="badge badge-secondary">Virtuosa</div>
                                                    )}
                                                    {!ch.stance && (
                                                        <div className="badge badge-ghost">Sem postura</div>
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
