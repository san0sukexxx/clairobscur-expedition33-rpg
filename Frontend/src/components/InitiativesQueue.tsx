import { type PlayerResponse } from "../api/APIPlayer";

interface InitiativesQueueProps {
    player: PlayerResponse | null;
    isStarted: boolean;
}

export default function InitiativesQueue({ player, isStarted }: InitiativesQueueProps) {
    if (player?.fightInfo?.characters == undefined
        || player?.fightInfo?.initiatives == undefined
    ) { return; }

    const characters = player?.fightInfo?.characters;
    const initiatives = player?.fightInfo?.initiatives.sort((a, b) => {
        if (a.playFirst !== b.playFirst) {
            return a.playFirst ? -1 : 1;
        }
        if (a.value !== b.value) {
            return b.value - a.value;
        }
        return b.hability - a.hability;
    });

    return (
        <div className="rounded-xl border border-neutral-700 bg-neutral-900 shadow-md p-4 w-full max-w-md mb-5">
            {/* fila */}
            <div className="flex items-end gap-2 overflow-x-auto">
                {initiatives.map((initiative, index) => {
                    const isActive = index === 0 && isStarted;

                    const ch = characters.find(ch => ch.battleID == initiative.battleID);

                    if (ch == undefined) { return; }

                    return (
                        <div key={ch.id} className="flex flex-col items-center">
                            <div
                                className={`relative flex-shrink-0 overflow-hidden rounded-md border-2 ${isActive
                                    ? "w-16 h-16 border-yellow-400 shadow-lg"
                                    : "w-12 h-12 border-neutral-700"
                                    }`}
                                title={ch.name}
                            >
                                <img
                                    src={ch.type == "npc" ? `/enemies/${ch.id}.png` : `/characters/${ch.id}.webp`}
                                    alt={ch.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
