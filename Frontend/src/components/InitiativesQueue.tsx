import { useMemo } from "react"
import { type BattleCharacterInfo, type InitiativeResponse, type BattleTurnResponse } from "../api/ResponseModel"

interface InitiativesQueueProps {
    characters?: BattleCharacterInfo[] | undefined
    initiatives?: InitiativeResponse[] | undefined
    turns?: BattleTurnResponse[] | undefined
    isStarted: boolean,
    showBattleId: boolean
}

type AnyItem = InitiativeResponse | BattleTurnResponse

export default function InitiativesQueue({ characters, initiatives, turns, isStarted, showBattleId }: InitiativesQueueProps) {
    const sortedQueue = useMemo<AnyItem[]>(() => {
        if (isStarted) {
            return turns ?? []
        } else {
            const list = initiatives ?? []
            return [...list].sort((a, b) => {
                if (a.playFirst !== b.playFirst) return a.playFirst ? -1 : 1
                if (a.value !== b.value) return b.value - a.value
                return b.hability - a.hability
            })
        }
    }, [isStarted, initiatives, turns])

    function findCharacter(id: number): BattleCharacterInfo | undefined {
        if (!characters) return undefined
        return characters.find(ch => ch.battleID === id)
    }

    if (!characters || characters.length === 0) return null
    if (sortedQueue.length === 0) return null

    return (
        <div className="w-full max-w-none self-stretch min-w-0 rounded-xl border border-neutral-700 bg-neutral-900 shadow-md p-4">
            <div className="w-full min-w-0 flex items-end gap-2 overflow-x-auto">
                {sortedQueue.map((item: any, index) => {
                    const isActive = isStarted && index === 0
                    const ch = isStarted
                        ? findCharacter(item.battleCharacterId)
                        : findCharacter(item.battleID)

                    const battleId = isStarted
                        ? item.battleCharacterId
                        : item.battleID

                    const key = isStarted
                        ? `turn-${item.id ?? item.battleCharacterId}-${index}`
                        : `init-${item.battleID}-${index}`

                    if (!ch) return null
                    return (
                        <div key={key} className="flex flex-col items-center">
                            <div
                                className={`relative flex-shrink-0 overflow-hidden rounded-md border-2 ${isActive
                                        ? showBattleId
                                            ? "w-20 h-20 border-yellow-400 shadow-lg"
                                            : "w-16 h-16 border-yellow-400 shadow-lg"
                                        : showBattleId
                                            ? "w-16 h-16 border-neutral-700"
                                            : "w-12 h-12 border-neutral-700"
                                    }`}
                                title={ch.name}
                            >
                                <img
                                    src={ch.type === "npc" ? `/enemies/${ch.id}.png` : `/characters/${ch.id}.webp`}
                                    alt={ch.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {showBattleId && (
                                <span className="text-xs text-neutral-400 mt-1">
                                    #{battleId}
                                </span>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
