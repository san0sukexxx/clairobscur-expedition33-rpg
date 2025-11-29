import React from "react";
import { FaSkull } from "react-icons/fa";
import { type GetPlayerResponse } from "../api/APIPlayer";
import { type BattleCharacterInfo } from "../api/ResponseModel";
import AnimatedStatBar from "./AnimatedStatBar";
import { getStatusLabel, shouldShowStatusAmmount } from "../utils/BattleUtils";
import { npcIsFlying } from "../utils/NpcCalculator";

interface EnemiesStatusProps {
    player: GetPlayerResponse | null;
    isEnemies: Boolean;
    currentCharacter: BattleCharacterInfo | undefined;
    isAttacking: Boolean;
    onSelectTarget?: (target: BattleCharacterInfo) => void;
}

function pct(cur: number, max: number) {
    return Math.max(0, Math.min(100, Math.round((cur / max) * 100)));
}

export default function EnemiesStatus({
    player,
    isEnemies,
    currentCharacter,
    isAttacking,
    onSelectTarget
}: EnemiesStatusProps) {
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

                            return (
                                <div
                                    key={ch.battleID}
                                    role={isAttacking && !isDead ? "button" : undefined}
                                    onClick={() => {
                                        if (!isDead && isAttacking && onSelectTarget) onSelectTarget(ch);
                                    }}
                                    className={`
                rounded-xl bg-base-200/60 p-3 shadow-sm transition-all duration-200
                ${isDead ? "pointer-events-none opacity-60" : ""}
                ${!isDead && isAttacking
                                            ? "cursor-pointer hover:shadow-lg attack-glow"
                                            : "pointer-events-none"
                                        }
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
