import { useMemo } from "react"
import { FaSkull, FaChevronLeft, FaChevronRight } from "react-icons/fa"
import { type BattleCharacterInfo, type InitiativeResponse, type BattleTurnResponse } from "../api/ResponseModel"
import { handleNpcImgError } from "../utils/NpcUtils"
import { APIBattle } from "../api/APIBattle"
import { useToast } from "./Toast"

interface InitiativesQueueProps {
    characters?: BattleCharacterInfo[] | undefined
    initiatives?: InitiativeResponse[] | undefined
    turns?: BattleTurnResponse[] | undefined
    isStarted: boolean,
    showBattleId: boolean
    isAdmin: boolean
    onReorder?: () => void
    displayIndex?: Map<number, number>
}

type AnyItem = InitiativeResponse | BattleTurnResponse

export default function InitiativesQueue({ characters, initiatives, turns, isStarted, showBattleId, isAdmin, onReorder, displayIndex }: InitiativesQueueProps) {
    const { showToast } = useToast()

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

    const handleMove = async (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= sortedQueue.length) return

        const newQueue = [...sortedQueue]
        const [item] = newQueue.splice(fromIndex, 1)
        newQueue.splice(toIndex, 0, item)

        if (isStarted) {
            const turnIds = newQueue.map(item => (item as BattleTurnResponse).id)
            try {
                await APIBattle.reorderTurns(turnIds)
                showToast("Ordem dos turnos atualizada")
                await new Promise(resolve => setTimeout(resolve, 300))
                if (onReorder) onReorder()
            } catch (error) {
                console.error("Error reordering turns:", error)
                showToast("Erro ao reordenar turnos")
            }
        } else {
            const initiativeCharacterIds = newQueue.map(item => (item as InitiativeResponse).battleID)
            try {
                await APIBattle.reorderInitiatives(initiativeCharacterIds)
                showToast("Ordem de iniciativa atualizada")
                await new Promise(resolve => setTimeout(resolve, 300))
                if (onReorder) onReorder()
            } catch (error) {
                console.error("Error reordering initiatives:", error)
                showToast("Erro ao reordenar iniciativas")
            }
        }
    }

    if (!characters || characters.length === 0) return null
    if (sortedQueue.length === 0) return null

    return (
        <div className="w-full max-w-none self-stretch min-w-0 rounded-xl border border-base-300 bg-base-100 shadow-md p-4">
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
                        <div key={key} className="flex flex-col items-center gap-1 flex-shrink-0">
                            <div
                                className={`relative overflow-hidden rounded-md border-2 transition-all bg-base-300 ${
                                    isActive
                                        ? showBattleId
                                            ? "w-20 h-20 border-warning shadow-lg"
                                            : "w-16 h-16 border-warning shadow-lg"
                                        : showBattleId
                                            ? "w-16 h-16 border-base-300"
                                            : "w-12 h-12 border-base-300"
                                }`}
                                title={!isAdmin && ch.nameHidden ? "???" : ch.name}
                            >
                                <img
                                    src={ch.type === "npc" ? `/enemies/${ch.id}.png` : `/characters/${ch.id}.webp`}
                                    alt={!isAdmin && ch.nameHidden ? "???" : ch.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => ch.type === "npc"
                                        ? handleNpcImgError(e, ch.id)
                                        : (() => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            ((e.target as HTMLElement).nextElementSibling as HTMLElement)?.classList.remove('hidden');
                                        })()
                                    }
                                />
                                <div className="hidden absolute inset-0 flex items-center justify-center">
                                    <FaSkull className="text-base-content opacity-40 text-lg" />
                                </div>
                            </div>

                            {showBattleId && (
                                <span className="text-xs text-base-content/50">
                                    #{displayIndex?.get(battleId) ?? battleId}
                                </span>
                            )}

                            {isAdmin && (
                                <div className="flex gap-0.5">
                                    <button
                                        className="btn btn-xs btn-ghost px-1 min-h-0 h-5 disabled:opacity-20"
                                        disabled={index === 0}
                                        onClick={() => handleMove(index, index - 1)}
                                    >
                                        <FaChevronLeft size={10} />
                                    </button>
                                    <button
                                        className="btn btn-xs btn-ghost px-1 min-h-0 h-5 disabled:opacity-20"
                                        disabled={index === sortedQueue.length - 1}
                                        onClick={() => handleMove(index, index + 1)}
                                    >
                                        <FaChevronRight size={10} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
