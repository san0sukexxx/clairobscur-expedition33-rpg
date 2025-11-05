import { useMemo } from "react"
import { type BattleCharacterInfo, type InitiativeResponse } from "../api/ResponseModel"

interface InitiativesQueueProps {
    characters?: BattleCharacterInfo[] | undefined
    initiatives?: InitiativeResponse[] | undefined
    isStarted: boolean
}

export default function InitiativesQueue({ characters, initiatives, isStarted }: InitiativesQueueProps) {
    const sortedInitiatives = useMemo(() => {
        const list = (initiatives ?? [])

        return list.sort((a, b) => {
            if (a.playFirst !== b.playFirst) return a.playFirst ? -1 : 1
            if (a.value !== b.value) return b.value - a.value
            return b.hability - a.hability
        })
    }, [initiatives])

    if (characters == undefined || initiatives == undefined || characters.length === 0 || initiatives.length === 0) return null

    return (
        <div className="w-full max-w-none self-stretch min-w-0 rounded-xl border border-neutral-700 bg-neutral-900 shadow-md p-4">
            <div className="w-full min-w-0 flex items-end gap-2 overflow-x-auto">
                {sortedInitiatives.map((initiative, index) => {
                    const isActive = index === 0 && isStarted
                    const ch = characters.find(ch => ch.battleID === initiative.battleID)
                    if (!ch) return null
                    return (
                        <div key={ch.battleID} className="flex flex-col items-center">
                            <div
                                className={`relative flex-shrink-0 overflow-hidden rounded-md border-2 ${isActive ? "w-16 h-16 border-yellow-400 shadow-lg" : "w-12 h-12 border-neutral-700"}`}
                                title={ch.name}
                            >
                                <img
                                    src={ch.type === "npc" ? `/enemies/${ch.id}.png` : `/characters/${ch.id}.webp`}
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
