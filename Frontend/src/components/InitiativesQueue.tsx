import { useMemo, useState } from "react"
import { type BattleCharacterInfo, type InitiativeResponse, type BattleTurnResponse } from "../api/ResponseModel"
import { APIBattle } from "../api/APIBattle"
import { useToast } from "./Toast"
import { t } from "../i18n"

interface InitiativesQueueProps {
    characters?: BattleCharacterInfo[] | undefined
    initiatives?: InitiativeResponse[] | undefined
    turns?: BattleTurnResponse[] | undefined
    isStarted: boolean,
    showBattleId: boolean
    isAdmin: boolean
    onReorder?: () => void
}

type AnyItem = InitiativeResponse | BattleTurnResponse

export default function InitiativesQueue({ characters, initiatives, turns, isStarted, showBattleId, isAdmin, onReorder }: InitiativesQueueProps) {
    const { showToast } = useToast()
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

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

    const handleDragStart = (e: React.DragEvent, index: number) => {
        if (!isAdmin) return
        setDraggedIndex(index)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e: React.DragEvent, index: number) => {
        if (!isAdmin) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setDragOverIndex(index)
    }

    const handleDragLeave = () => {
        setDragOverIndex(null)
    }

    const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
        if (!isAdmin || draggedIndex === null) return
        e.preventDefault()

        if (draggedIndex === dropIndex) {
            setDraggedIndex(null)
            setDragOverIndex(null)
            return
        }

        // Create new order
        const newQueue = [...sortedQueue]
        const [draggedItem] = newQueue.splice(draggedIndex, 1)
        newQueue.splice(dropIndex, 0, draggedItem)

        // Extract IDs based on type
        if (isStarted) {
            // Reorder turns
            const turnIds = newQueue.map(item => (item as BattleTurnResponse).id)
            try {
                await APIBattle.reorderTurns(turnIds)
                showToast("Ordem dos turnos atualizada")
                // Wait a bit for backend to process
                await new Promise(resolve => setTimeout(resolve, 300))
                if (onReorder) onReorder()
            } catch (error) {
                console.error("Error reordering turns:", error)
                showToast("Erro ao reordenar turnos")
            }
        } else {
            // Reorder initiatives
            // Use battleCharacterId (battleID in InitiativeResponse)
            const initiativeCharacterIds = newQueue.map(item => (item as InitiativeResponse).battleID)
            try {
                await APIBattle.reorderInitiatives(initiativeCharacterIds)
                showToast("Ordem de iniciativa atualizada")
                // Wait a bit for backend to process
                await new Promise(resolve => setTimeout(resolve, 300))
                if (onReorder) onReorder()
            } catch (error) {
                console.error("Error reordering initiatives:", error)
                showToast("Erro ao reordenar iniciativas")
            }
        }

        setDraggedIndex(null)
        setDragOverIndex(null)
    }

    const handleDragEnd = () => {
        setDraggedIndex(null)
        setDragOverIndex(null)
    }

    if (!characters || characters.length === 0) return null
    if (sortedQueue.length === 0) return null

    return (
        <div className="w-full max-w-none self-stretch min-w-0 rounded-xl border border-neutral-700 bg-neutral-900 shadow-md p-4">
            {isAdmin && (
                <div className="text-xs text-neutral-400 mb-2 text-center">
                    Arraste para reordenar
                </div>
            )}
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

                    const isDragging = draggedIndex === index
                    const isDragOver = dragOverIndex === index

                    if (!ch) return null
                    return (
                        <div
                            key={key}
                            className="flex flex-col items-center"
                            draggable={isAdmin}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={handleDragEnd}
                        >
                            <div
                                className={`relative flex-shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                                    isActive
                                        ? showBattleId
                                            ? "w-20 h-20 border-yellow-400 shadow-lg"
                                            : "w-16 h-16 border-yellow-400 shadow-lg"
                                        : showBattleId
                                            ? "w-16 h-16 border-neutral-700"
                                            : "w-12 h-12 border-neutral-700"
                                } ${
                                    isAdmin ? 'cursor-move hover:border-blue-400' : ''
                                } ${
                                    isDragging ? 'opacity-50 scale-95' : ''
                                } ${
                                    isDragOver ? 'border-blue-500 scale-105' : ''
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
