import React, { useMemo, useState } from "react"
import { type PictoResponse, type PictoInfo } from "../api/ResponseModel"
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
  pictoColorHex,
} from "../utils/PictoUtils"
import type { GetPlayerResponse } from "../api/APIPlayer"
import { PictosList } from "../data/PictosList"
import { APIPicto } from "../api/APIPicto"
import { FaChartLine } from "react-icons/fa"

interface PictosTabProps {
  player: GetPlayerResponse | null
  setPlayer: React.Dispatch<React.SetStateAction<GetPlayerResponse | null>>
  isAdmin: boolean
}

type ModalType = "slot" | "admin-add" | "admin-add-level" | "admin-remove" | null

function getPictoName(p: PictoResponse | null | undefined): string {
  if (!p) return ""
  return (p as any).name ?? (p as any).pictoId ?? ""
}

export default function PictosTab({ player, setPlayer, isAdmin }: PictosTabProps) {
  const [modalType, setModalType] = useState<ModalType>(null)
  const [activeSlot, setActiveSlot] = useState<number | null>(null)
  const [query, setQuery] = useState("")
  const [pendingAddPicto, setPendingAddPicto] = useState<PictoInfo | null>(null)
  const [pendingLevel, setPendingLevel] = useState<string>("1")

  const slots: (PictoResponse | null)[] = useMemo(() => {
    const arr: (PictoResponse | null)[] = [null, null, null]
      ; (player?.pictos ?? []).forEach((p) => {
        if (typeof p.slot === "number") {
          const s = Math.max(0, Math.min(2, p.slot))
          arr[s] = p
        }
      })
    return arr
  }, [player?.pictos])

  const inventory: PictoResponse[] = useMemo(() => {
    return (player?.pictos ?? [])
      .filter((p) => typeof p.slot !== "number")
      .sort((a, b) => getPictoName(a).localeCompare(getPictoName(b), "pt-BR"))
  }, [player?.pictos])

  const slotFiltered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return inventory

    return inventory.filter((p) => {
      const name = getPictoName(p)
      const info = getPictoByName(name)
      const desc = (info?.description ?? "").toLowerCase()
      return name.toLowerCase().includes(q) || desc.includes(q)
    })
  }, [query, inventory])

  const addCandidates: PictoInfo[] = useMemo(() => {
    const ownedNames = new Set(
      (player?.pictos ?? []).map((p) => getPictoName(p).toLowerCase())
    )
    return PictosList.filter((p) => !ownedNames.has(p.name.toLowerCase())).sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR")
    )
  }, [player?.pictos])

  const addFiltered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return addCandidates

    return addCandidates.filter((p) => {
      const desc = (p.description ?? "").toLowerCase()
      return p.name.toLowerCase().includes(q) || desc.includes(q)
    })
  }, [query, addCandidates])

  const removeFiltered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return inventory

    return inventory.filter((p) => {
      const name = getPictoName(p)
      const info = getPictoByName(name)
      const desc = (info?.description ?? "").toLowerCase()
      return name.toLowerCase().includes(q) || desc.includes(q)
    })
  }, [query, inventory])

  async function upsertPictoAt(slotIndex: number, picto: PictoResponse) {
    const id = picto.id

    try {
      await APIPicto.updatePlayerPictoSlot(id, { slot: slotIndex })
    } catch (e) {
      console.error(e)
    }

    setPlayer((prev) => {
      if (!prev) return prev

      const updated: PictoResponse[] = (prev.pictos ?? []).map((p): PictoResponse => {
        if (p.id === id) {
          return { ...p, slot: slotIndex }
        }
        if (p.slot === slotIndex) {
          return { ...p, slot: null }
        }
        return p
      })

      return { ...prev, pictos: updated }
    })

    setModalType(null)
    setActiveSlot(null)
    setPendingAddPicto(null)
    setPendingLevel("1")
    setQuery("")
  }

  async function bumpLevel(slotIndex: number, delta: number) {
    let targetPicto: PictoResponse | undefined

    if (player?.pictos) {
      targetPicto = player.pictos.find((p) => p.slot === slotIndex)
    }

    if (!targetPicto) return

    const currentLevel = targetPicto.level ?? 1
    const newLevel = Math.max(1, Math.min(33, currentLevel + delta))

    try {
      await APIPicto.updatePlayerPicto(targetPicto.id, { level: newLevel })

      setPlayer((prev) => {
        if (!prev) return prev

        const next = (prev.pictos ?? []).map((p) =>
          p.slot === slotIndex ? { ...p, level: newLevel } : p
        )

        return { ...prev, pictos: next }
      })
    } catch (err) {
      console.error("Erro ao atualizar nível do picto:", err)
    }
  }

  function handleSlotActivate(idx: number) {
    if (!slots[idx]) {
      setActiveSlot(idx)
      setModalType("slot")
      setQuery("")
    }
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
    setPendingAddPicto(null)
    setPendingLevel("1")
    setQuery("")
  }

  function openAdminRemove() {
    setModalType("admin-remove")
    setActiveSlot(null)
    setPendingAddPicto(null)
    setPendingLevel("1")
    setQuery("")
  }

  function handleAdminAddPick(info: PictoInfo) {
    setPendingAddPicto(info)
    setPendingLevel("1")
    setModalType("admin-add-level")
  }

  async function handleAdminRemovePick(picto: PictoResponse) {
    try {
      await APIPicto.deletePlayerPicto(picto.id)
    } catch (e) {
      console.error(e)
    }

    setPlayer((prev) => {
      if (!prev) return prev
      const next = (prev.pictos ?? []).filter((p) => p.id !== picto.id)
      return { ...prev, pictos: next }
    })
    setModalType(null)
    setQuery("")
  }

  async function confirmAdminAddLevel() {
    if (!pendingAddPicto || !player) {
      setModalType(null)
      return
    }

    let lvl = parseInt(pendingLevel, 10)
    if (isNaN(lvl)) lvl = 1
    lvl = Math.max(1, Math.min(33, lvl))

    let newId: number | null = null

    try {
      newId = await APIPicto.createPlayerPicto({
        playerId: player.id,
        pictoId: pendingAddPicto.name,
        level: lvl
      })
    } catch (e) {
      console.error(e)
    }

    setPlayer((prev) => {
      if (!prev) return prev
      const existing = prev.pictos ?? []

      const alreadyHas = existing.some(
        (p) => p.pictoId.toLowerCase() === pendingAddPicto.name.toLowerCase()
      )
      if (alreadyHas) return prev

      const added: PictoResponse = {
        id: newId ?? 0,
        playerId: player.id,
        pictoId: pendingAddPicto.name,
        level: lvl,
        battleCount: 0
      }

      return { ...prev, pictos: [...existing, added] }
    })

    setModalType(null)
    setPendingAddPicto(null)
    setPendingLevel("1")
    setQuery("")
  }

  function closeModal() {
    setModalType(null)
    setActiveSlot(null)
    setPendingAddPicto(null)
    setPendingLevel("1")
    setQuery("")
  }

  const modalTitle =
    modalType === "admin-add"
      ? "Adicionar Picto"
      : modalType === "admin-add-level"
        ? "Definir nível"
        : modalType === "admin-remove"
          ? "Remover Picto"
          : "Selecione um Picto"

  return (
    <div className="text-white">
      <div className="flex items-center justify-between pb-3">
        <div className="text-center flex-1 text-lg tracking-widest opacity-90">PICTOS</div>
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
        {[0, 1, 2].map((idx) => {
          const selected = slots[idx]
          const name = getPictoName(selected)
          const pictoInfo = getPictoByName(name)
          const accent =
            selected && pictoInfo ? pictoColorHex[pictoInfo.color] : "rgba(255,255,255,0.15)"

          return (
            <div
              key={idx}
              className="relative rounded-2xl bg-[#141414] border border-white/10 overflow-hidden"
            >
              <div
                className="pointer-events-none absolute inset-x-3 top-4 bottom-4 rounded-xl"
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
                className={`w-full text-left p-6 pl-28 rounded-2xl transition-colors ${selected
                  ? "hover:bg-white/5 cursor-default"
                  : "h-48 grid place-items-center hover:bg-white/5"
                  }`}
              >
                <div className="absolute left-5 top-1/2 -translate-y-1/2">
                  <PlusDiamond icon={selected ? "" : "+"} picto={selected} isBig={true} />
                </div>

                {selected ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div className="text-2xl font-semibold leading-tight mr-2">
                        {name}
                      </div>
                      <button
                        className="px-3 py-1 text-sm rounded-md bg-white/10 hover:bg-white/20 border border-white/15"
                        onClick={async (e) => {
                          e.stopPropagation()

                          const id = selected?.id

                          if (id != null) {
                            try {
                              await APIPicto.updatePlayerPictoSlot(id, { slot: null })
                            } catch (err) {
                              console.error(err)
                            }
                          }

                          setPlayer((prev) => {
                            if (!prev) return prev

                            const updated = (prev.pictos ?? []).map((p) =>
                              p.id === id ? { ...p, slot: null } : p
                            )

                            return { ...prev, pictos: updated }
                          })
                        }}
                      >
                        ×
                      </button>

                    </div>

                    <div className="flex items-center gap-8">
                      <div className="grid grid-cols-1 gap-2">
                        <StatusTexts
                          pictoResponse={selected}
                          level={selected.level ?? 1}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <div className="flex items-center gap-1 text-sm">
                        <span className="opacity-70 mr-2">Nível</span>
                        <div className="flex items-center gap-2">
                          <button
                            className="w-7 h-7 grid place-items-center rounded-md border border-white/15 bg-white/5 hover:bg-white/10"
                            onClick={(e) => {
                              e.stopPropagation()
                              bumpLevel(idx, -1)
                            }}
                          >
                            ‹
                          </button>
                          <span className="text-xl font-extrabold w-10 text-center">
                            {getLevel(selected)}
                          </span>
                          <button
                            className="w-7 h-7 grid place-items-center rounded-md border border-white/15 bg-white/5 hover:bg-white/10"
                            onClick={(e) => {
                              e.stopPropagation()
                              bumpLevel(idx, +1)
                            }}
                          >
                            ›
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="h-px w-full bg-white/10 my-1" />

                    <div className="opacity-85">{pictoInfo?.description}</div>
                  </div>
                ) : (
                  <div className="text-center w-full opacity-60 tracking-wide text-lg">
                    Selecione um Picto
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Modal key={modalType ?? "closed"} open={modalType !== null} onClose={closeModal} title={modalTitle}>
        {modalType !== "admin-add-level" && (
          <SearchBox value={query} onChange={setQuery} />
        )}

        <div className="px-4 pb-4 overflow-y-auto max-h-[65vh] grid grid-cols-1 md:grid-cols-2 gap-4">
          {modalType === "slot" && activeSlot !== null && (
            <>
              {slotFiltered.map((p) => (
                <PictoCard
                  key={p.id}
                  picto={p}
                  onPick={(pp) => upsertPictoAt(activeSlot, pp)}
                />
              ))}
              {slotFiltered.length === 0 && (
                <div className="opacity-70 p-8 text-center">Nenhum Picto encontrado.</div>
              )}
            </>
          )}

          {modalType === "admin-add" && (
            <>
              {addFiltered.map((p) => (
                <PictoInfoCard key={p.name} info={p} onPick={handleAdminAddPick} />
              ))}
              {addFiltered.length === 0 && (
                <div className="opacity-70 p-8 text-center">Nenhum Picto encontrado.</div>
              )}
            </>
          )}

          {modalType === "admin-add-level" && pendingAddPicto && (
            <div className="col-span-full flex flex-col items-center gap-4 py-6">
              <div className="text-lg">
                Definir nível para{" "}
                <span className="font-semibold">{pendingAddPicto.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="opacity-80">Nível</span>
                <input
                  type="number"
                  min={1}
                  max={33}
                  value={pendingLevel}
                  onChange={(e) => setPendingLevel(e.target.value)}
                  className="w-24 text-center rounded-md bg-black/40 border border-white/20 px-2 py-1 outline-none focus:border-white/40"
                />
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 border border-white/20"
                  onClick={confirmAdminAddLevel}
                >
                  Confirmar
                </button>
                <button
                  className="px-4 py-2 rounded-md bg-black/40 hover:bg-black/60 border border-white/20"
                  onClick={closeModal}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {modalType === "admin-remove" && (
            <>
              {removeFiltered.map((p) => (
                <PictoCard
                  key={`${p.id}-${p.slot ?? "none"}-${p.level ?? 1}`}
                  picto={p}
                  onPick={handleAdminRemovePick}
                />
              ))}
              {removeFiltered.length === 0 && (
                <div className="opacity-70 p-8 text-center">Nenhum Picto encontrado.</div>
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
  picto,
  isBig = false,
}: {
  icon?: string
  picto?: PictoResponse | null
  isBig?: boolean
}) {
  const name = getPictoName(picto ?? undefined)
  const maskBase = name ? encodeURI(`/pictos/${name}.webp`) : null
  const pictoInfo = getPictoByName(name)
  const wrapperSize = isBig ? "w-14 h-14" : "w-9 h-9"
  const innerSize = isBig ? "w-11 h-11" : "w-7 h-7"
  const iconSize = isBig ? "text-x2" : "text-lg"
  const bgColor = pictoInfo ? pictoColorHex[pictoInfo.color] : "rgba(255,255,255,0.3)"

  return (
    <div
      className={`relative ${wrapperSize} rotate-45 border border-white/20 rounded-sm grid place-items-center bg-black/30 ml-2`}
      aria-label={name || "Adicionar picto"}
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
        <span className={`rotate-[-45deg] leading-none ${iconSize}`}>{icon}</span>
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
            <button onClick={onClose} className="text-2xl leading-none px-2">
              ×
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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
            ({" "}
            {displayValue}
            <FaChartLine className="inline-block text-[10px]" aria-hidden="true" />
            )
          </span>
        </span>
      ) : (
        <span className="text-2xl font-extrabold leading-none">{value}</span>
      )}
    </div>
  )
}

function StatusTexts({ pictoResponse, level }: { pictoResponse: PictoResponse; level: number }) {
  const name = getPictoName(pictoResponse)
  const picto = getPictoByName(name)
  if (!picto) return null

  return (
    <>
      <Stat
        label="Agilidade"
        value={picto.status.speed}
        displayValue={displayPictoSpeed(picto.status.speed ?? 0, level)}
        displayAttributedValue={displayPictoAttributeSpeed(picto.status.speed ?? 0, level)}
      />
      <Stat
        label="Crítico"
        value={
          picto.status.criticalRate !== undefined
            ? `${picto.status.criticalRate}%`
            : undefined
        }
        displayValue={displayPictoCritical(picto.status.criticalRate ?? 0, level)}
        displayAttributedValue={displayPictoAttributeCritical(
          picto.status.criticalRate ?? 0,
          level
        )}
      />
      <Stat
        label="HP"
        value={picto.status.health}
        displayValue={displayPictoHealth(picto.status.health ?? 0, level)}
        displayAttributedValue={displayPictoAttributeHealth(picto.status.health ?? 0, level)}
      />
      <Stat
        label="Defesa"
        value={picto.status.defense}
        displayValue={displayPictoDefense(picto.status.defense ?? 0, level)}
        displayAttributedValue={displayPictoAttributeDefense(
          picto.status.defense ?? 0,
          level
        )}
      />
    </>
  )
}

function PictoCard({
  picto,
  onPick,
}: {
  picto: PictoResponse
  onPick?: (p: PictoResponse) => void
}) {
  const level = picto.level ?? 1
  const name = getPictoName(picto)
  const pictoInfo = getPictoByName(name)

  return (
    <button
      onClick={() => onPick && onPick(picto)}
      className="w-full text-left grid grid-cols-[80px_1fr] items-center gap-4 p-4 bg-black/25 hover:bg:white/5 hover:bg-white/5 transition-colors border border-white/10 rounded-xl"
    >
      <PlusDiamond icon="" picto={picto} isBig={true} />
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <div className="text-xl font-semibold leading-tight">{name}</div>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <StatusTexts pictoResponse={picto} level={level} />
          <Stat label="Nível" value={picto.level ?? 1} />
        </div>
        <div className="opacity-80">{pictoInfo?.description}</div>
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
  const picto = getPictoByName(info.name)
  const level = 1

  return (
    <button
      onClick={() => onPick && onPick(info)}
      className="w-full text-left grid grid-cols-[80px_1fr] items-center gap-4 p-4 bg-black/25 hover:bg-white/5 transition-colors border border-white/10 rounded-xl"
    >
      <PlusDiamond icon="" picto={{ name: info.name } as unknown as PictoResponse} isBig={true} />
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <div className="text-xl font-semibold leading-tight">{info.name}</div>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {picto && (
            <StatusTexts
              pictoResponse={{ name: picto.name } as unknown as PictoResponse}
              level={level}
            />
          )}
        </div>
        <div className="opacity-80">{info.description}</div>
      </div>
    </button>
  )
}

function getLevel(p: PictoResponse | null | undefined) {
  return p?.level ?? 1
}
