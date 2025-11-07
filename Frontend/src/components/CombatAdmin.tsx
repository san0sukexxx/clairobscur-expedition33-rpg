import { useState, useEffect, useMemo, useCallback } from "react"
import { APIBattle, type AddBattleCharacterInitiativeData } from "../api/APIBattle"
import { type GetPlayerResponse } from "../api/APIPlayer"
import { FaUser } from "react-icons/fa"
import { getCharacterLabelById } from "../utils/CharacterUtils"
import { getNPCMaxHealth, randomizeNpcInitiativeTotal } from "../utils/NpcCalculator"
import { calculateMaxHP, calculateMaxMP } from "../utils/PlayerCalculator"
import { getAllNPCsSorted, getNpcById } from "../data/NPCsList"
import { type BattleCharacterType } from "../api/ResponseModel"
import { type Campaign } from "../api/APICampaign"
import { type BattleWithDetailsResponse } from "../api/APIBattle"
import InitiativesQueue from "./InitiativesQueue"

export interface CombatEntity {
    rowId?: number
    externalId: number | string
    name: string
    type: BattleCharacterType
    currentHp: number
    maxHp: number
    currentMp?: number
    maxMp?: number
    avatarUrl?: string
    characterId?: string
    isReadyToStart: boolean
}

export interface CombatAdminProps {
    campaignInfo: Campaign
    initialStatus: string
    players: GetPlayerResponse[]
    onStatusChanged?: (newStatus: string) => void
}

type TeamKey = "A" | "B"

export default function CombatAdmin({
    campaignInfo,
    initialStatus,
    players,
    onStatusChanged
}: CombatAdminProps) {
    const [battleDetails, setBattleDetails] = useState<BattleWithDetailsResponse | null>(null)
    const [battleStatus, setBattleStatus] = useState<string>(initialStatus)
    const [updatingStatus, setUpdatingStatus] = useState<boolean>(false)
    const [showAddModal, setShowAddModal] = useState<boolean>(false)
    const [targetTeam, setTargetTeam] = useState<TeamKey>("A")
    const [filterText, setFilterText] = useState<string>("")
    const [teamA, setTeamA] = useState<CombatEntity[]>([])
    const [teamB, setTeamB] = useState<CombatEntity[]>([])
    const [justAddedId, setJustAddedId] = useState<string | number | null>(null)
    const [bulkAdded, setBulkAdded] = useState<boolean>(false)
    const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false)
    const [removeTarget, setRemoveTarget] = useState<{ rowId: number; name: string } | null>(null)

    const reloadBattleDetails = useCallback(async () => {
        if (!campaignInfo.battleId) return
        try {
            const data = await APIBattle.getById(campaignInfo.battleId)
            setBattleDetails(data)
        } catch (error) {
            console.error("Erro ao carregar detalhes da batalha:", error)
        }
    }, [campaignInfo.battleId, battleStatus])

    useEffect(() => {
        reloadBattleDetails()
    }, [reloadBattleDetails])

    useEffect(() => {
        setBattleStatus(initialStatus)
    }, [campaignInfo.id, initialStatus])

    useEffect(() => {
        if (campaignInfo.battleId == undefined
            || battleDetails == undefined
            || battleDetails == null) return

        const mapped: CombatEntity[] = battleDetails.characters.map((bc) => {
            if (bc.type === "player") {
                const charId = bc.id
                const avatarUrl = charId ? `/characters/${charId}.webp` : undefined

                return {
                    rowId: bc.battleID,
                    externalId: bc.id,
                    name: bc.name,
                    type: "player",
                    currentHp: bc.healthPoints,
                    maxHp: bc.maxHealthPoints,
                    currentMp: bc.magicPoints,
                    maxMp: bc.maxMagicPoints,
                    characterId: charId,
                    avatarUrl,
                    isReadyToStart: !bc.canRollInitiative
                }
            } else {
                return {
                    rowId: bc.battleID,
                    externalId: bc.id,
                    name: bc.name,
                    type: "npc",
                    currentHp: bc.healthPoints,
                    maxHp: bc.maxHealthPoints,
                    characterId: bc.id,
                    avatarUrl: `/enemies/${bc.id}.png`,
                    isReadyToStart: true
                }
            }
        })

        const aTeam = mapped.filter(
            (m) => m && battleDetails?.characters.find((bc) => bc.battleID === m.rowId)?.isEnemy === false
        )
        const bTeam = mapped.filter(
            (m) => m && battleDetails?.characters.find((bc) => bc.battleID === m.rowId)?.isEnemy === true
        )

        setTeamA(aTeam)
        setTeamB(bTeam)
    }, [battleDetails])

    async function handleStatusChange(newStatus: string) {
        if (campaignInfo.battleId == undefined || campaignInfo.battleId == null) return

        setBattleStatus(newStatus)
        setUpdatingStatus(true)
        try {
            if (newStatus === "started") {
                await APIBattle.start(campaignInfo.battleId, newStatus)
            } else {
                await APIBattle.update(campaignInfo.battleId, { battleStatus: newStatus })
            }
            onStatusChanged?.(newStatus)
            await reloadBattleDetails()
        } catch {
            alert("Erro ao atualizar o status do combate.")
            setBattleStatus(initialStatus)
        } finally {
            setUpdatingStatus(false)
        }
    }

    function openAddModal(team: TeamKey) {
        setTargetTeam(team)
        setFilterText("")
        setJustAddedId(null)
        setBulkAdded(false)
        setShowAddModal(true)
    }

    function closeAddModal() {
        setShowAddModal(false)
    }

    function isPlayerReadyToStart(playerInfo: GetPlayerResponse | undefined): boolean {
        return playerInfo?.fightInfo?.canRollInitiative ?? true
    }

    async function handleAddToTeam(entity: CombatEntity) {
        if (campaignInfo.battleId == undefined) return
        let initiative: AddBattleCharacterInitiativeData | undefined
        if (entity.type == "npc") {
            const npcInfo = getNpcById(String(entity.externalId))
            if (npcInfo != undefined) {
                initiative = {
                    initiativeValue: randomizeNpcInitiativeTotal(npcInfo),
                    hability: npcInfo.hability,
                    playFirst: npcInfo.playFirst ?? false
                }
            }
        }
        await APIBattle.addCharacter({
            battleId: campaignInfo.battleId,
            externalId: String(entity.externalId),
            characterName: entity.name,
            characterType: entity.type,
            team: targetTeam,
            healthPoints: entity.currentHp,
            maxHealthPoints: entity.maxHp,
            magicPoints: entity.currentMp,
            maxMagicPoints: entity.maxMp,
            initiative,
            canRollInitiative: entity.type == "player"
        })

        setJustAddedId(entity.externalId)
        setBulkAdded(false)
        setTimeout(() => {
            setJustAddedId((current) => (current === entity.externalId ? null : current))
        }, 2000)

        await reloadBattleDetails()
    }

    async function handleAddAllPlayers(entities: CombatEntity[]) {
        if (campaignInfo.battleId == undefined) return
        for (const ent of entities) {
            await APIBattle.addCharacter({
                battleId: campaignInfo.battleId,
                externalId: String(ent.externalId),
                characterName: ent.name,
                characterType: ent.type,
                team: targetTeam,
                healthPoints: ent.currentHp,
                maxHealthPoints: ent.maxHp,
                magicPoints: ent.currentMp,
                maxMagicPoints: ent.maxMp,
                canRollInitiative: ent.type == "player"
            })
        }

        setBulkAdded(true)
        setJustAddedId(null)
        setTimeout(() => setBulkAdded(false), 2000)

        await reloadBattleDetails()
    }


    function openRemoveConfirm(rowId?: number, name?: string) {
        if (!rowId) return
        setRemoveTarget({ rowId, name: name ?? "Personagem" })
        setConfirmRemoveOpen(true)
    }

    function closeRemoveConfirm() {
        setConfirmRemoveOpen(false)
        setRemoveTarget(null)
    }

    async function confirmRemove() {
        if (!removeTarget) return
        await APIBattle.removeCharacter(removeTarget.rowId)
        await reloadBattleDetails()
        closeRemoveConfirm()
    }

    const availablePlayers: CombatEntity[] = useMemo(() => {
        return players.map((p) => {
            const cid = p.playerSheet?.characterId || ""
            return {
                externalId: p.id,
                name: p.playerSheet?.name?.trim() || `Player #${p.id}`,
                type: "player" as const,
                currentHp: p.playerSheet?.hpCurrent ?? 0,
                maxHp: calculateMaxHP(p),
                currentMp: p.playerSheet?.mpCurrent ?? 0,
                maxMp: calculateMaxMP(p),
                characterId: cid,
                avatarUrl: cid ? `/characters/${cid}.webp` : undefined,
                isReadyToStart: isPlayerReadyToStart(p)
            }
        })
    }, [players])

    const availableEnemies: CombatEntity[] = useMemo(() => {
        return getAllNPCsSorted().map((npc) => ({
            externalId: npc.id,
            name: npc.name,
            type: "npc" as const,
            currentHp: getNPCMaxHealth(npc),
            maxHp: getNPCMaxHealth(npc),
            characterId: npc.name,
            avatarUrl: `/enemies/${npc.id}.png`,
            isReadyToStart: true
        }))
    }, [])

    const filteredPlayers = useMemo(() => {
        const f = filterText.trim().toLowerCase()
        if (!f) return availablePlayers
        return availablePlayers.filter((p) => p.name.toLowerCase().includes(f))
    }, [filterText, availablePlayers])

    const filteredEnemies = useMemo(() => {
        const f = filterText.trim().toLowerCase()
        if (!f) return availableEnemies
        return availableEnemies.filter((e) => e.name.toLowerCase().includes(f))
    }, [filterText, availableEnemies])

    function renderAvatarCell(entity: CombatEntity) {
        const isPlayerWithImage = entity.type === "player" && entity.avatarUrl
        const isNpc = entity.type === "npc"
        return (
            <div className="avatar">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-base-300">
                    {isPlayerWithImage ? (
                        <img src={entity.avatarUrl} alt={entity.name} />
                    ) : isNpc ? (
                        <img src={entity.avatarUrl} alt={entity.name} />
                    ) : (
                        <FaUser className="text-base-content opacity-60" />
                    )}
                </div>
            </div>
        )
    }

    function renderCharacterCell(entity: CombatEntity) {
        if (entity.type === "player") {
            return getCharacterLabelById(entity.characterId) || "—"
        }
        return entity.name
    }

    function renderTeamCard(title: string, teamKey: TeamKey, members: CombatEntity[]) {
        return (
            <div className="card bg-base-200 shadow-inner flex-1">
                <div className="card-body gap-4">
                    <div className="flex items-center justify-between">
                        <div className="text-lg font-semibold">{title}</div>
                        <button className="btn btn-xs btn-primary" onClick={() => openAddModal(teamKey)}>
                            Adicionar
                        </button>
                    </div>

                    {members.length === 0 ? (
                        <div className="text-sm opacity-60">Nenhum membro neste time.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table table-zebra w-full">
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>Nome</th>
                                        <th>Pronto?</th>
                                        <th className="w-1/6 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {members.map((m) => (
                                        <tr key={m.rowId ?? m.externalId}>
                                            <td>{renderAvatarCell(m)}</td>
                                            <td>{m.name}</td>
                                            <td>{m.isReadyToStart ? "Pronto" : "Aguardando"}</td>
                                            <td className="text-right">
                                                <button
                                                    className="btn btn-xs btn-error"
                                                    onClick={() => openRemoveConfirm(m.rowId, m.name)}
                                                >
                                                    Remover
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    function renderAddModal() {
        if (!showAddModal) return null
        return (
            <div className="modal modal-open">
                <div className="modal-box max-w-5xl w-full max-h-[80vh] overflow-y-auto flex flex-col gap-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="font-bold text-lg">Adicionar ao time {targetTeam}</h3>
                            <p className="text-sm opacity-70">Selecione quem entra neste combate.</p>
                        </div>
                        <button className="btn btn-sm btn-ghost" onClick={closeAddModal}>
                            ✕
                        </button>
                    </div>

                    <div className="form-control">
                        <label className="label flex items-center gap-4">
                            <span className="label-text text-sm font-semibold">Filtro por nome</span>
                            <input
                                type="text"
                                className="input input-bordered input-sm flex-1"
                                placeholder="Digite para filtrar..."
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                            />
                        </label>
                    </div>

                    <div className="border rounded-lg">
                        <div className="px-4 py-2 border-b flex items-center justify-between">
                            <div className="font-semibold text-sm">Jogadores</div>
                            <div className="flex items-center gap-2">
                                <button className="btn btn-xs btn-secondary" onClick={() => handleAddAllPlayers(filteredPlayers)}>
                                    Adicionar todos
                                </button>
                                {bulkAdded ? <span className="text-xs text-success font-semibold">Adicionados!</span> : null}
                            </div>
                        </div>

                        <div className="overflow-x-auto max-h-[28vh] overflow-y-auto">
                            <table className="table table-compact w-full">
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>Nome</th>
                                        <th>Personagem</th>
                                        <th className="w-1/6 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPlayers.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="text-center text-sm opacity-60 py-6">
                                                Nenhum jogador encontrado.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredPlayers.map((entity, idx) => (
                                            <tr key={`player-${entity.externalId}-${idx}`}>
                                                <td>{renderAvatarCell(entity)}</td>
                                                <td>{entity.name}</td>
                                                <td>{renderCharacterCell(entity)}</td>
                                                <td className="text-right">
                                                    <div className="flex items-center gap-2 justify-end">
                                                        <button className="btn btn-xs btn-primary" onClick={() => handleAddToTeam(entity)}>
                                                            Adicionar
                                                        </button>
                                                        {justAddedId === entity.externalId ? (
                                                            <span className="text-xs text-success font-semibold">Adicionado!</span>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="border rounded-lg">
                        <div className="px-4 py-2 border-b font-semibold text-sm">NPCs</div>
                        <div className="overflow-x-auto max-h-[28vh] overflow-y-auto">
                            <table className="table table-compact w-full">
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>Nome</th>
                                        <th>Personagem</th>
                                        <th className="w-1/6 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEnemies.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="text-center text-sm opacity-60 py-6">
                                                Nenhum inimigo encontrado.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredEnemies.map((entity, idx) => (
                                            <tr key={`npc-${entity.externalId}-${idx}`}>
                                                <td>{renderAvatarCell(entity)}</td>
                                                <td>{entity.name}</td>
                                                <td>{renderCharacterCell(entity)}</td>
                                                <td className="text-right">
                                                    <div className="flex items-center gap-2 justify-end">
                                                        <button className="btn btn-xs btn-primary" onClick={() => handleAddToTeam(entity)}>
                                                            Adicionar
                                                        </button>
                                                        {justAddedId === entity.externalId ? (
                                                            <span className="text-xs text-success font-semibold">Adicionado!</span>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="modal-action">
                        <button className="btn btn-sm" onClick={closeAddModal}>
                            Cancelar
                        </button>
                    </div>
                </div>

                <div className="modal-backdrop bg-black/40" onClick={closeAddModal} />
            </div>
        )
    }

    function renderRemoveConfirmModal() {
        if (!confirmRemoveOpen || !removeTarget) return null
        return (
            <div className="modal modal-open">
                <div className="modal-box w-full max-w-md">
                    <h3 className="font-bold text-lg">Remover do time</h3>
                    <p className="py-4">
                        Tem certeza de que deseja remover <span className="font-semibold">{removeTarget.name}</span> do time?
                    </p>
                    <div className="modal-action">
                        <button className="btn btn-sm" onClick={closeRemoveConfirm}>
                            Cancelar
                        </button>
                        <button className="btn btn-sm btn-error" onClick={confirmRemove}>
                            Remover
                        </button>
                    </div>
                </div>
                <div className="modal-backdrop bg-black/40" onClick={closeRemoveConfirm} />
            </div>
        )
    }

    return (
        <>
            <div className="card bg-base-100 shadow">
                <div className="card-body gap-6">
                    <div className="flex flex-col items-start gap-2">
                        <div className="text-lg font-semibold">Combate #{campaignInfo.battleId}</div>

                        <div className="form-control w-full max-w-xs">
                            <label className="label">
                                <span className="label-text font-semibold">Status do combate</span>
                            </label>

                            <div className="flex items-center gap-3">
                                <span className="text-sm">
                                    {battleStatus === 'starting'
                                        ? 'Aguardando início'
                                        : battleStatus === 'started'
                                            ? 'Em andamento'
                                            : 'Terminada'}
                                </span>

                                {battleStatus !== 'finished' && (
                                    <button
                                        className={`btn btn-sm ${battleStatus === 'starting' ? 'btn-primary' : 'btn-error'
                                            }`}
                                        onClick={() =>
                                            handleStatusChange(
                                                battleStatus === 'starting' ? 'started' : 'finished'
                                            )
                                        }
                                        disabled={updatingStatus}
                                    >
                                        {battleStatus === 'starting' ? 'Iniciar batalha' : 'Encerrar batalha'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <InitiativesQueue
                        characters={battleDetails?.characters}
                        initiatives={battleDetails?.initiatives}
                        turns={battleDetails?.turns}
                        isStarted={battleStatus == "started"} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderTeamCard("Time A", "A", teamA)}
                        {renderTeamCard("Time B", "B", teamB)}
                    </div>
                </div>
            </div>

            {renderAddModal()}
            {renderRemoveConfirmModal()}
        </>
    )
}
