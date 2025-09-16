import React from "react";
import { type PlayerResponse } from "../api/APIPlayer";
import { CgSandClock } from "react-icons/cg";

interface EnemiesStatusProps {
    player: PlayerResponse | null;
    setPlayer: React.Dispatch<React.SetStateAction<PlayerResponse | null>>;
    isEnemies: Boolean;
}

function pct(cur: number, max: number) {
    return Math.max(0, Math.min(100, Math.round((cur / max) * 100)));
}

export default function EnemiesStatus({ player, setPlayer, isEnemies }: EnemiesStatusProps) {
    if (player?.fightInfo?.characters == undefined) { return; }

    const characters = player?.fightInfo?.characters?.filter(ch => ch.isEnemy == isEnemies);

    return (
        <div>
            {player.fightInfo.battleStatus == "starting" && (
                <div className="alert alert-info shadow-lg mt-1 mb-5 gap-1">
                    <CgSandClock className="h-6 w-6" />
                    <span className="font-semibold">Aguardando jogadores...</span>
                </div>
            )}

            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h2 className="card-title justify-center">
                        {isEnemies ? "Inimigos" : "Equipe"}
                    </h2>

                    {characters.length == 0 && (
                        <div className="text-sm text-neutral-500 italic text-center">Ninguém por aqui ainda</div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {characters.map((ch) => (
                            <div key={ch.id} className="rounded-xl bg-base-200/60 p-3 shadow-sm">
                                {/* Topo: avatar + nome */}
                                <div className="flex items-center gap-3">
                                    <div className="avatar">
                                        <div className="w-14 h-14 rounded-full ring ring-base-300 ring-offset-2 ring-offset-base-200">
                                            <img src={
                                                ch.type == "npc" ? `/enemies/${ch.id}.png` : `/characters/${ch.id}.webp`
                                            }
                                                alt={ch.name} />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-baseline justify-between">
                                            <p className="font-semibold">{ch.name}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Barras */}
                                <div className="mt-3 space-y-2">
                                    {/* HP */}
                                    <div>
                                        <div className="flex items-center justify-between text-xs uppercase">
                                            <span className="opacity-70">HP</span>
                                            <span className="font-mono">{ch.healthPoints}/{ch.maxHealthPoints}</span>
                                        </div>
                                        <progress
                                            className="progress progress-error w-full"
                                            value={pct(ch.healthPoints, ch.maxHealthPoints)}
                                            max={100}
                                            aria-label="HP"
                                        />
                                    </div>
                                    {ch.magicPoints !== undefined && ch.maxMagicPoints !== undefined && (
                                        <div>
                                            <div className="flex items-center justify-between text-xs uppercase">
                                                <span className="opacity-70">MP</span>
                                                <span className="font-mono">{ch.magicPoints}/{ch.maxMagicPoints}</span>
                                            </div>
                                            <progress
                                                className="progress progress-info w-full"
                                                value={pct(ch.magicPoints, ch.maxMagicPoints)}
                                                max={100}
                                                aria-label="MP"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
