import { useMemo, useState, useRef, useCallback } from "react"
import { FaSkull } from "react-icons/fa"
import { type BattleCharacterInfo, type InitiativeResponse, type BattleTurnResponse } from "../api/ResponseModel"
import { handleNpcImgError } from "../utils/NpcUtils"
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
    displayIndex?: Map<number, number>
}

type AnyItem = InitiativeResponse | BattleTurnResponse

export default function InitiativesQueue({ characters, initiatives, turns, isStarted, showBattleId, isAdmin, onReorder, displayIndex }: InitiativesQueueProps) {
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

        const fromIndex = draggedIndex
        setDraggedIndex(null)
        setDragOverIndex(null)

        if (fromIndex !== dropIndex) {
            await handleDropDirect(fromIndex, dropIndex)
        }
    }

    const handleDragEnd = () => {
        setDraggedIndex(null)
        setDragOverIndex(null)
    }

    /* ── Touch support (mobile) ── */
    const itemRefs = useRef<(HTMLDivElement | null)[]>([])
    const touchDragIndex = useRef<number | null>(null)
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const getDropIndex = useCallback((touchX: number, touchY: number): number | null => {
        for (let i = 0; i < itemRefs.current.length; i++) {
            const el = itemRefs.current[i]
            if (!el) continue
            const rect = el.getBoundingClientRect()
            if (touchX >= rect.left && touchX <= rect.right && touchY >= rect.top && touchY <= rect.bottom) {
                return i
            }
        }
        return null
    }, [])

    const handleTouchStart = (index: number) => {
        if (!isAdmin) return
        longPressTimer.current = setTimeout(() => {
            touchDragIndex.current = index
            setDraggedIndex(index)
        }, 200)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchDragIndex.current === null) {
            // Cancel long press if finger moves before activation
            if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null }
            return
        }
        e.preventDefault()
        const touch = e.touches[0]
        const overIndex = getDropIndex(touch.clientX, touch.clientY)
        setDragOverIndex(overIndex)
    }

    const handleTouchEnd = () => {
        if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null }
        if (touchDragIndex.current === null) return

        const fromIndex = touchDragIndex.current
        const toIndex = dragOverIndex

        touchDragIndex.current = null
        setDraggedIndex(null)
        setDragOverIndex(null)

        if (toIndex !== null && fromIndex !== toIndex) {
            handleDropDirect(fromIndex, toIndex)
        }
    }

    const handleDropDirect = async (fromIndex: number, toIndex: number) => {
        const newQueue = [...sortedQueue]
        const [draggedItem] = newQueue.splice(fromIndex, 1)
        newQueue.splice(toIndex, 0, draggedItem)

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
            {isAdmin && (
                <div className="text-xs text-base-content/50 mb-2 text-center">
                    {t("combat.dragToReorder")}
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
                            ref={(el) => { itemRefs.current[index] = el }}
                            className="flex flex-col items-center"
                            draggable={isAdmin}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={handleDragEnd}
                            onTouchStart={() => handleTouchStart(index)}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                        >
                            <div
                                className={`relative flex-shrink-0 overflow-hidden rounded-md border-2 transition-all bg-base-300 ${
                                    isActive
                                        ? showBattleId
                                            ? "w-20 h-20 border-warning shadow-lg"
                                            : "w-16 h-16 border-warning shadow-lg"
                                        : showBattleId
                                            ? "w-16 h-16 border-base-300"
                                            : "w-12 h-12 border-base-300"
                                } ${
                                    isAdmin ? 'cursor-move hover:border-primary' : ''
                                } ${
                                    isDragging ? 'opacity-50 scale-95' : ''
                                } ${
                                    isDragOver ? 'border-primary scale-105' : ''
                                }`}
                                title={ch.name}
                            >
                                <img
                                    src={ch.type === "npc" ? `/enemies/${ch.id}.png` : `/characters/${ch.id}.webp`}
                                    alt={ch.name}
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
                                <span className="text-xs text-base-content/50 mt-1">
                                    #{displayIndex?.get(battleId) ?? battleId}
                                </span>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
