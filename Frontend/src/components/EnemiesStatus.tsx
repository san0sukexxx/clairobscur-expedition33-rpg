import React from "react";

type Character = {
    id: string;
    name: string;
    avatar: string;
    hp: number;
    hpMax: number;
    mp: number;
    mpMax: number;
};

const PARTY: Character[] = [
    { id: "g1", name: "Golem", avatar: "/enemies/golem.png", hp: 722, hpMax: 722, mp: 3, mpMax: 5 },
    { id: "g2", name: "Golem", avatar: "/enemies/golem.png", hp: 722, hpMax: 722, mp: 3, mpMax: 5 },
    { id: "g3", name: "Golem", avatar: "/enemies/golem.png", hp: 722, hpMax: 722, mp: 3, mpMax: 5 },
];

function pct(cur: number, max: number) {
    return Math.max(0, Math.min(100, Math.round((cur / max) * 100)));
}

export default function EnemiesStatus() {
    return (
        <div className="card bg-base-100 shadow">
            <div className="card-body">
                <h2 className="card-title justify-center">Inimigos</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {PARTY.map((ch) => (
                        <div key={ch.id} className="rounded-xl bg-base-200/60 p-3 shadow-sm">
                            {/* Topo: avatar + nome */}
                            <div className="flex items-center gap-3">
                                <div className="avatar">
                                    <div className="w-14 h-14 rounded-full ring ring-base-300 ring-offset-2 ring-offset-base-200">
                                        <img src={ch.avatar} alt={ch.name} />
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
                                        <span className="font-mono">{ch.hp}/{ch.hpMax}</span>
                                    </div>
                                    <progress
                                        className="progress progress-error w-full"
                                        value={pct(ch.hp, ch.hpMax)}
                                        max={100}
                                        aria-label="HP"
                                    />
                                </div>

                                {/* MP */}
                                <div>
                                    <div className="flex items-center justify-between text-xs uppercase">
                                        <span className="opacity-70">MP</span>
                                        <span className="font-mono">{ch.mp}/{ch.mpMax}</span>
                                    </div>
                                    <progress
                                        className="progress progress-info w-full"
                                        value={pct(ch.mp, ch.mpMax)}
                                        max={100}
                                        aria-label="MP"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}
