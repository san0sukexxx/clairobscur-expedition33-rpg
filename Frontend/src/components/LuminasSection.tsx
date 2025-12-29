import React, { useMemo, useState } from "react"
import { type PictoInfo, type LuminaResponse } from "../api/ResponseModel"
import { t } from "../i18n"
import {
    displayPictoAttributeCritical,
    displayPictoAttributeDefense,
    displayPictoAttributeHealth,
    displayPictoAttributeSpeed,
    displayPictoCritical,
    displayPictoDefense,
    displayPictoHealth,
    displayPictoSpeed,
    getPictoByName,
    getAllPictosSorted,
    pictoColorHex,
} from "../utils/PictoUtils"
import type { GetPlayerResponse } from "../api/APIPlayer"
import { APILumina } from "../api/APILumina"
import { FaChartLine } from "react-icons/fa"
import { calculateMaxLuminas } from "../utils/PlayerCalculator"

interface LuminasSectionProps {
    player: GetPlayerResponse | null
    setPlayer: React.Dispatch<React.SetStateAction<GetPlayerResponse | null>>
    isAdmin: boolean
}

type ModalType = "slot" | "admin-add" | "admin-remove" | null

function getLuminaName(l: LuminaResponse | null | undefined): string {
    if (!l) return ""
    return l.pictoId
}

export default function LuminasSection({
    player,
    setPlayer,
    isAdmin,
}: LuminasSectionProps) {
    const [modalType, setModalType] = useState<ModalType>(null)
    const [activeSlot, setActiveSlot] = useState<number | null>(null)
    const [query, setQuery] = useState("")
    
    const maxCostLuminas: number = useMemo(
        () => calculateMaxLuminas(player),
        [player?.playerSheet],
    )

    const luminas: LuminaResponse[] = useMemo(
        () => (player?.luminas ?? []) as LuminaResponse[],
        [player?.luminas],
    )

    const currentLuminaCost: number = useMemo(() => {
        return luminas
            .filter((l) => l.isEquiped)
            .reduce((total, l) => {
                const pictoInfo = getPictoByName(l.pictoId)
                return total + (pictoInfo?.luminaCost ?? 0)
            }, 0)
    }, [luminas])

    const slots: (LuminaResponse | null)[] = useMemo(() => {
        const equipped = luminas.filter((l) => l.isEquiped)
        return [...equipped, null]
    }, [luminas])

    const inventory: LuminaResponse[] = useMemo(
        () =>
            luminas
                .filter((l) => !l.isEquiped)
                .sort((a, b) =>
                    getLuminaName(a).localeCompare(getLuminaName(b), "pt-BR"),
                ),
        [luminas],
    )

    const slotFiltered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return inventory

        return inventory.filter((l) => {
            const name = getLuminaName(l)
            const info = getPictoByName(name)
            const desc = (info?.description ?? "").toLowerCase()
            return name.toLowerCase().includes(q) || desc.includes(q)
        })
    }, [query, inventory])

    const addCandidates: PictoInfo[] = useMemo(() => {
        const ownedNames = new Set(luminas.map((l) => l.pictoId.toLowerCase()))
        const all = getAllPictosSorted()
        return all.filter((p) => !ownedNames.has(p.name.toLowerCase()))
    }, [luminas])

    const addFiltered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return addCandidates

        return addCandidates.filter((p) => {
            const desc = (p.description ?? "").toLowerCase()
            return p.name.toLowerCase().includes(q) || desc.includes(q)
        })
    }, [query, addCandidates])

    const removeFiltered: LuminaResponse[] = useMemo(() => {
        const q = query.trim().toLowerCase()
        const base = [...luminas]
            .filter((l) => !l.isEquiped)
            .sort((a, b) =>
                getLuminaName(a).localeCompare(getLuminaName(b), "pt-BR"),
            )

        if (!q) return base

        return base.filter((l) => {
            const name = getLuminaName(l)
            const info = getPictoByName(name)
            const desc = (info?.description ?? "").toLowerCase()
            return name.toLowerCase().includes(q) || desc.includes(q)
        })
    }, [query, luminas])

    async function equipLumina(lumina: LuminaResponse) {
        const pictoInfo = getPictoByName(lumina.pictoId)
        const luminaCost = pictoInfo?.luminaCost ?? 0

        // Verificar se equipar essa lumina excederia o limite de custo
        if (currentLuminaCost + luminaCost > maxCostLuminas) {
            alert(`Custo máximo de luminas excedido! Atual: ${currentLuminaCost}, Tentando adicionar: ${luminaCost}, Máximo: ${maxCostLuminas}`)
            return
        }

        try {
            await APILumina.updatePlayerLumina(lumina.id, { isEquiped: true })
        } catch (e) {
            console.error(e)
        }

        setPlayer((prev) => {
            if (!prev) return prev
            const current = (prev.luminas ?? []) as LuminaResponse[]

            const updated = current.map((l) =>
                l.id === lumina.id ? { ...l, isEquiped: true } : l,
            )

            return { ...prev, luminas: updated }
        })

        setModalType(null)
        setActiveSlot(null)
        setQuery("")
    }

    async function unequipLumina(lumina: LuminaResponse) {
        try {
            await APILumina.updatePlayerLumina(lumina.id, { isEquiped: false })
        } catch (e) {
            console.error(e)
        }

        setPlayer((prev) => {
            if (!prev) return prev
            const current = (prev.luminas ?? []) as LuminaResponse[]
            const updated = current.map((l) =>
                l.id === lumina.id ? { ...l, isEquiped: false } : l,
            )
            return { ...prev, luminas: updated }
        })
    }

    function handleSlotActivate(idx: number) {
        setActiveSlot(idx)
        setModalType("slot")
        setQuery("")
    }

    function onKeyActivate(e: React.KeyboardEvent<HTMLDivElement>, idx: number) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleSlotActivate(idx)
        }
    }

    function openAdminAdd() {
        setModalType("admin-add")
        setActiveSlot(null)
        setQuery("")
    }

    function openAdminRemove() {
        setModalType("admin-remove")
        setActiveSlot(null)
        setQuery("")
    }

    async function handleAdminAddPick(info: PictoInfo) {
        if (!player) {
            return
        }

        let newId: number | null = null

        try {
            newId = await APILumina.createPlayerLumina({
                playerId: player.id,
                pictoId: info.name,
            })
        } catch (e) {
            console.error(e)
        }

        setPlayer((prev) => {
            if (!prev) return prev
            const existing = (prev.luminas ?? []) as LuminaResponse[]

            const alreadyHas = existing.some(
                (l) => l.pictoId.toLowerCase() === info.name.toLowerCase(),
            )
            if (alreadyHas) return prev

            const added: LuminaResponse = {
                id: newId ?? 0,
                playerId: player.id,
                pictoId: info.name,
                isEquiped: false,
            }

            return { ...prev, luminas: [...existing, added] }
        })

        setModalType(null)
        setQuery("")
    }

    async function handleAdminRemovePick(lumina: LuminaResponse) {
        try {
            await APILumina.deletePlayerLumina(lumina.id)
        } catch (e) {
            console.error(e)
        }

        setPlayer((prev) => {
            if (!prev) return prev
            const current = (prev.luminas ?? []) as LuminaResponse[]
            const next = current.filter((l) => l.id !== lumina.id)
            return { ...prev, luminas: next }
        })
        setModalType(null)
        setQuery("")
    }

    function closeModal() {
        setModalType(null)
        setActiveSlot(null)
        setQuery("")
    }

    const modalTitle =
        modalType === "admin-add"
            ? t("luminas.addLumina")
            : modalType === "admin-remove"
                ? t("luminas.removeLumina")
                : t("luminas.selectLumina")

    return (
        <div className="text-white">
            <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-4 flex-1">
                    <div className="text-lg tracking-widest opacity-90">
                        LUMINAS
                    </div>
                    <div className={`rounded-lg py-1 px-3 text-sm font-semibold ${
                        currentLuminaCost > maxCostLuminas
                            ? "bg-red-600/20 text-red-400 border border-red-600/30"
                            : currentLuminaCost === maxCostLuminas
                                ? "bg-amber-700/10 text-amber-700 border border-amber-700/20"
                                : "bg-green-600/10 text-green-400 border border-green-600/20"
                    }`}>
                        Custo: {currentLuminaCost}/{maxCostLuminas}
                    </div>
                </div>
                {isAdmin && (
                    <div className="flex gap-2">
                        <button
                            className="px-3 py-1 text-sm rounded-md bg-green-600/70 hover:bg-green-600 transition border border-white/20"
                            onClick={openAdminAdd}
                        >
                            Adicionar
                        </button>
                        <button
                            className="px-3 py-1 text-sm rounded-md bg-red-600/70 hover:bg-red-600 transition border border-white/20"
                            onClick={openAdminRemove}
                        >
                            Remover
                        </button>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-4">
                {slots.map((selected, idx) => {
                    const name = getLuminaName(selected)
                    const pictoInfo = getPictoByName(name)
                    const accent =
                        selected && pictoInfo
                            ? pictoColorHex[pictoInfo.color]
                            : "rgba(255,255,255,0.15)"

                    return (
                        <div
                            key={selected ? `lumina-${selected.id}` : "empty-slot"}
                            className="relative rounded-2xl bg-[#141414] border border-white/10 overflow-hidden"
                        >
                            <div
                                className="pointer-events-none absolute inset-x-3 top-1 bottom-1 rounded-xl"
                                style={{
                                    border: `1px solid ${selected ? accent : "transparent"}`,
                                    clipPath:
                                        "polygon(0% 10%, 6% 10%, 7.5% 5%, 100% 5%, 100% 95%, 7.5% 95%, 6% 90%, 0% 90%)",
                                }}
                            />

                            <div
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => onKeyActivate(e, idx)}
                                onClick={() => handleSlotActivate(idx)}
                                className={`w-full text-left p-6 pl-28 rounded-2xl transition-colors ${
                                    selected
                                        ? "hover:bg.white/5 cursor-pointer"
                                        : "h-30 grid place-items-center hover:bg-white/5"
                                }`}
                            >
                                <div className="absolute left-5 top-1/2 -translate-y-1/2">
                                    <PlusDiamond
                                        icon={selected ? "" : "+"}
                                        pictoName={name}
                                        isBig={true}
                                    />
                                </div>

                                {selected ? (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-start justify-between">
                                            <div className="text-xl font-semibold leading-tight mr-2">
                                                {name}
                                            </div>
                                            <button
                                                className="px-3 py-1 text-sm rounded-md bg-white/10 hover:bg-white/20 border border-white/15"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    unequipLumina(selected)
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>

                                        <div className="opacity-85">{pictoInfo?.description}</div>
                                    </div>
                                ) : (
                                    <div className="text-center w-full opacity-60 tracking-wide text-lg">
                                        Selecione uma Lumina
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            <Modal
                key={modalType ?? "closed"}
                open={modalType !== null}
                onClose={closeModal}
                title={modalTitle}
            >
                <SearchBox value={query} onChange={setQuery} />

                <div className="px-4 pb-4 overflow-y-auto max-h-[65vh] grid grid-cols-1 md:grid-cols-2 gap-4">
                    {modalType === "slot" && activeSlot !== null && (
                        <>
                            {slotFiltered.map((l) => {
                                const pictoInfo = getPictoByName(l.pictoId)
                                const luminaCost = pictoInfo?.luminaCost ?? 0
                                const wouldExceedLimit = currentLuminaCost + luminaCost > maxCostLuminas

                                return (
                                    <LuminaCard
                                        key={l.id}
                                        lumina={l}
                                        onPick={(lum) => equipLumina(lum)}
                                        disabled={wouldExceedLimit}
                                        currentCost={currentLuminaCost}
                                        maxCost={maxCostLuminas}
                                    />
                                )
                            })}
                            {slotFiltered.length === 0 && (
                                <div className="opacity-70 p-8 text-center">
                                    Nenhuma Lumina encontrada.
                                </div>
                            )}
                        </>
                    )}

                    {modalType === "admin-add" && (
                        <>
                            {addFiltered.map((p) => (
                                <PictoInfoCard
                                    key={p.name}
                                    info={p}
                                    onPick={handleAdminAddPick}
                                />
                            ))}
                            {addFiltered.length === 0 && (
                                <div className="opacity-70 p-8 text-center">
                                    Nenhum Picto encontrado.
                                </div>
                            )}
                        </>
                    )}

                    {modalType === "admin-remove" && (
                        <>
                            {removeFiltered.map((l) => (
                                <LuminaCard
                                    key={`${l.id}-${l.isEquiped ? "on" : "off"}`}
                                    lumina={l}
                                    onPick={handleAdminRemovePick}
                                />
                            ))}
                            {removeFiltered.length === 0 && (
                                <div className="opacity-70 p-8 text-center">
                                    Nenhuma Lumina encontrada.
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Modal>
        </div>
    )
}

function PlusDiamond({
    icon = "+",
    pictoName,
    isBig = false,
}: {
    icon?: string
    pictoName?: string
    isBig?: boolean
}) {
    const name = pictoName ?? ""
    const pictoInfo = getPictoByName(name)
    const imageId = pictoInfo?.imageId ?? name
    const maskBase = imageId ? encodeURI(`/pictos/${imageId}.webp`) : null
    const wrapperSize = isBig ? "w-14 h-14" : "w-9 h-9"
    const innerSize = isBig ? "w-11 h-11" : "w-7 h-7"
    const iconSize = isBig ? "text-x2" : "text-lg"
    const bgColor = pictoInfo
        ? pictoColorHex[pictoInfo.color]
        : "rgba(255,255,255,0.3)"

    return (
        <div
            className={`relative ${wrapperSize} rotate-45 border border-white/20 rounded-sm grid place-items-center bg-black/30 ml-2`}
            aria-label={name || "Adicionar lumina"}
        >
            {maskBase ? (
                <div
                    className={`rotate-[-45deg] ${innerSize}`}
                    style={{
                        backgroundColor: bgColor,
                        WebkitMaskImage: `url("${maskBase}?scope=mask")`,
                        maskImage: `url("${maskBase}?scope=mask")`,
                        WebkitMaskRepeat: "no-repeat",
                        maskRepeat: "no-repeat",
                        WebkitMaskSize: "contain",
                        maskSize: "contain",
                        WebkitMaskPosition: "center",
                        maskPosition: "center",
                    }}
                />
            ) : (
                <span className={`rotate-[-45deg] leading-none ${iconSize}`}>
                    {icon}
                </span>
            )}
        </div>
    )
}

function Modal({
    open,
    onClose,
    children,
    title,
}: {
    open: boolean
    onClose: () => void
    children: React.ReactNode
    title: string
}) {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/70" onClick={onClose} />
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-5xl max-h-[85vh] overflow-hidden rounded-2xl bg-[#121212] border border-white/10 shadow-2xl">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <div className="text-lg tracking-wide">{title}</div>
                        <button className="text-2xl leading-none px-2" onClick={onClose}>
                            ×
                        </button>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    )
}

function SearchBox({
    value,
    onChange,
}: {
    value: string
    onChange: (v: string) => void
}) {
    return (
        <div className="p-4">
            <input
                className="w-full rounded-md bg-black/40 border border-white/15 px-3 py-2 outline-none focus:border-white/30"
                placeholder="Buscar..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    )
}

function Stat({
    label,
    value,
    displayValue,
    displayAttributedValue,
}: {
    label: string
    value: number | string | undefined
    displayValue?: string | number | undefined
    displayAttributedValue?: string | undefined
}) {
    if (value === undefined) return null

    const hasDisplay = displayValue !== undefined

    return (
        <div className="text-sm flex items-baseline gap-2">
            <span className="opacity-70">{label}</span>

            {hasDisplay ? (
                <span className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold leading-none">
                        {displayAttributedValue}
                    </span>

                    <span className="text-xs opacity-60 leading-none flex items-center gap-1">
                        (
                        {" "}
                        {displayValue}
                        <FaChartLine
                            className="inline-block text-[10px]"
                            aria-hidden="true"
                        />
                        )
                    </span>
                </span>
            ) : (
                <span className="text-2xl font-extrabold leading-none">
                    {value}
                </span>
            )}
        </div>
    )
}

function LuminaCard({
    lumina,
    onPick,
    disabled = false,
    currentCost,
    maxCost,
}: {
    lumina: LuminaResponse
    onPick?: (l: LuminaResponse) => void
    disabled?: boolean
    currentCost?: number
    maxCost?: number
}) {
    const name = getLuminaName(lumina)
    const pictoInfo = getPictoByName(name)
    const luminaCost = pictoInfo?.luminaCost ?? 0

    return (
        <button
            onClick={() => !disabled && onPick && onPick(lumina)}
            disabled={disabled}
            className={`w-full text-left grid grid-cols-[80px_1fr] items-center gap-4 p-4 transition-colors border rounded-xl ${
                disabled
                    ? "bg-black/40 opacity-50 cursor-not-allowed border-red-500/30"
                    : "bg-black/25 hover:bg-white/5 border-white/10"
            }`}
        >
            <PlusDiamond icon="" pictoName={name} isBig={true} />
            <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between">
                    <div className="text-xl font-semibold leading-tight">{name}</div>
                    {luminaCost > 0 && (
                        <div className={`rounded-lg py-1 px-2 text-sm font-semibold ${
                            disabled
                                ? "bg-red-600/20 text-red-400 border border-red-600/30"
                                : "bg-amber-700/10 text-amber-700 border border-amber-700/20"
                        }`}>
                            Custo: {luminaCost}
                        </div>
                    )}
                </div>
                <div className="opacity-80">{pictoInfo?.description}</div>
                {disabled && currentCost !== undefined && maxCost !== undefined && (
                    <div className="text-xs text-red-400 mt-1">
                        Limite excedido ({currentCost} + {luminaCost} {'>'} {maxCost})
                    </div>
                )}
            </div>
        </button>
    )
}

function PictoInfoCard({
    info,
    onPick,
}: {
    info: PictoInfo
    onPick?: (p: PictoInfo) => void
}) {
    return (
        <button
            onClick={() => onPick && onPick(info)}
            className="w-full text-left grid grid-cols-[80px_1fr] items-center gap-4 p-4 bg-black/25 hover:bg-white/5 transition-colors border border-white/10 rounded-xl"
        >
            <PlusDiamond icon="" pictoName={info.name} isBig={true} />
            <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between">
                    <div className="text-xl font-semibold leading-tight">
                        {info.name}
                    </div>
                </div>
                <div className="opacity-80">{info.description}</div>
            </div>
        </button>
    )
}
