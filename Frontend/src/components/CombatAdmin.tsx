import { useState, useEffect, useMemo, useCallback } from "react"
import { APIBattle } from "../api/APIBattle"
import { type GetPlayerResponse } from "../api/APIPlayer"
import { FaUser } from "react-icons/fa"
import { getCharacterLabelById } from "../utils/CharacterUtils"
import { getAllEnemiesSorted } from "../data/EnemiesList"
import { type BattleCharacterType } from "../api/ResponseModel"

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
}

export interface CombatAdminProps {
    battleId: number
    initialStatus: string
    players: GetPlayerResponse[]
    onStatusChanged?: (newStatus: string) => void
}

type TeamKey = "A" | "B"

export default function CombatAdmin({
    battleId,
    initialStatus,
    players,
    onStatusChanged
}: CombatAdminProps) {
    const [battleStatus, setBattleStatus] = useState<string>(initialStatus)
    const [updatingStatus, setUpdatingStatus] = useState<boolean>(false)

    const [showAddModal, setShowAddModal] = useState<boolean>(false)
    const [targetTeam, setTargetTeam] = useState<TeamKey>("A")
    const [filterText, setFilterText] = useState<string>("")

    const [teamA, setTeamA] = useState<CombatEntity[]>([])
    const [teamB, setTeamB] = useState<CombatEntity[]>([])

    const [justAddedId, setJustAddedId] = useState<string | number | null>(null)
    const [bulkAdded, setBulkAdded] = useState<boolean>(false)

    useEffect(() => {
        setBattleStatus(initialStatus)
    }, [battleId, initialStatus])

    const playersById = useMemo(() => {
        const map = new Map<number, GetPlayerResponse>()
        players.forEach((p) => {
            map.set(p.id, p)
        })
        return map
    }, [players])

    const loadTeams = useCallback(async () => {
        const battleChars = await APIBattle.listCharacters(battleId)

        const mapped: CombatEntity[] = battleChars.map((bc) => {
            if (bc.characterType === "player") {
                const numericId = parseInt(bc.externalId, 10)
                const playerInfo = playersById.get(numericId)

                const charId = playerInfo?.playerSheet?.characterId || ""
                const avatarUrl = charId
                    ? `/characters/${charId}.webp`
                    : undefined

                return {
                    rowId: bc.id,
                    externalId: bc.externalId,
                    name:
                        playerInfo?.playerSheet?.name?.trim() ||
                        bc.characterName,
                    type: "player",
                    currentHp: bc.healthPoints,
                    maxHp: bc.maxHealthPoints,
                    currentMp: bc.magicPoints,
                    maxMp: bc.maxMagicPoints,
                    characterId: charId,
                    avatarUrl
                }
            } else {
                return {
                    rowId: bc.id,
                    externalId: bc.externalId,
                    name: bc.characterName,
                    type: "npc",
                    currentHp: bc.healthPoints,
                    maxHp: bc.maxHealthPoints,
                    characterId: bc.characterName,
                    avatarUrl: `/enemies/${bc.externalId}.png`
                }
            }
        })

        const aTeam = mapped.filter(
            (m) =>
                m &&
                battleChars.find((bc) => bc.id === m.rowId)?.isEnemy ===
                false
        )

        const bTeam = mapped.filter(
            (m) =>
                m &&
                battleChars.find((bc) => bc.id === m.rowId)?.isEnemy === true
        )

        setTeamA(aTeam)
        setTeamB(bTeam)
    }, [battleId, playersById])

    useEffect(() => {
        loadTeams()
    }, [loadTeams])

    async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const newStatus = e.target.value
        setBattleStatus(newStatus)
        setUpdatingStatus(true)
        try {
            await APIBattle.update(battleId, { battleStatus: newStatus })
            onStatusChanged?.(newStatus)
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

    async function handleAddToTeam(entity: CombatEntity) {
        await APIBattle.addCharacter({
            battleId,
            externalId: String(entity.externalId),
            characterName: entity.name,
            characterType: entity.type,
            team: targetTeam,
            healthPoints: entity.currentHp,
            maxHealthPoints: entity.maxHp,
            magicPoints: undefined,
            maxMagicPoints: undefined
        })

        setJustAddedId(entity.externalId)
        setBulkAdded(false)

        setTimeout(() => {
            setJustAddedId((current) =>
                current === entity.externalId ? null : current
            )
        }, 2000)

        await loadTeams()
    }

    async function handleAddAllPlayers(entities: CombatEntity[]) {
        for (const ent of entities) {
            await APIBattle.addCharacter({
                battleId,
                externalId: String(ent.externalId),
                characterName: ent.name,
                characterType: ent.type,
                team: targetTeam,
                healthPoints: ent.currentHp,
                maxHealthPoints: ent.maxHp,
                magicPoints: undefined,
                maxMagicPoints: undefined
            })
        }

        setBulkAdded(true)
        setJustAddedId(null)

        setTimeout(() => {
            setBulkAdded(false)
        }, 2000)

        await loadTeams()
    }

    async function handleRemoveFromTeam(rowId?: number) {
        if (!rowId) return
        await APIBattle.removeCharacter(rowId)
        await loadTeams()
    }

    const availablePlayers: CombatEntity[] = useMemo(() => {
        return players.map((p) => {
            const cid = p.playerSheet?.characterId || ""
            return {
                externalId: p.id,
                name: p.playerSheet?.name?.trim() || `Player #${p.id}`,
                type: "player" as const,
                currentHp: p.playerSheet?.hpCurrent ?? 0,
                maxHp: p.playerSheet?.hpCurrent ?? 0,
                characterId: cid,
                avatarUrl: cid ? `/characters/${cid}.webp` : undefined
            }
        })
    }, [players])

    const availableEnemies: CombatEntity[] = useMemo(() => {
        return getAllEnemiesSorted().map((enemy) => ({
            externalId: enemy.id,
            name: enemy.name,
            type: "npc" as const,
            currentHp: enemy.healthPoints,
            maxHp: enemy.maxHealthPoints,
            characterId: enemy.name,
            avatarUrl: `/enemies/${enemy.id}.png`
        }))
    }, [])

    const filteredPlayers = useMemo(() => {
        const f = filterText.trim().toLowerCase()
        if (!f) return availablePlayers
        return availablePlayers.filter((p) =>
            p.name.toLowerCase().includes(f)
        )
    }, [filterText, availablePlayers])

    const filteredEnemies = useMemo(() => {
        const f = filterText.trim().toLowerCase()
        if (!f) return availableEnemies
        return availableEnemies.filter((e) =>
            e.name.toLowerCase().includes(f)
        )
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
                        <button
                            className="btn btn-xs btn-primary"
                            onClick={() => openAddModal(teamKey)}
                        >
                            Adicionar
                        </button>
                    </div>

                    {members.length === 0 ? (
                        <div className="text-sm opacity-60">
                            Nenhum membro neste time.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table table-zebra w-full">
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th className="w-1/6 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {members.map((m) => (
                                        <tr key={m.rowId ?? m.externalId}>
                                            <td>{m.name}</td>
                                            <td className="text-right">
                                                <button
                                                    className="btn btn-xs btn-error"
                                                    onClick={() =>
                                                        handleRemoveFromTeam(m.rowId)
                                                    }
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
                            <h3 className="font-bold text-lg">
                                Adicionar ao time {targetTeam}
                            </h3>
                            <p className="text-sm opacity-70">
                                Selecione quem entra neste combate.
                            </p>
                        </div>
                        <button
                            className="btn btn-sm btn-ghost"
                            onClick={closeAddModal}
                        >
                            ✕
                        </button>
                    </div>

                    <div className="form-control">
                        <label className="label flex items-center gap-4">
                            <span className="label-text text-sm font-semibold">
                                Filtro por nome
                            </span>

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
                            <div className="font-semibold text-sm">
                                Jogadores
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    className="btn btn-xs btn-secondary"
                                    onClick={() =>
                                        handleAddAllPlayers(filteredPlayers)
                                    }
                                >
                                    Adicionar todos
                                </button>
                                {bulkAdded ? (
                                    <span className="text-xs text-success font-semibold">
                                        Adicionados!
                                    </span>
                                ) : null}
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
                                            <td
                                                colSpan={4}
                                                className="text-center text-sm opacity-60 py-6"
                                            >
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
                                                        <button
                                                            className="btn btn-xs btn-primary"
                                                            onClick={() =>
                                                                handleAddToTeam(entity)
                                                            }
                                                        >
                                                            Adicionar
                                                        </button>
                                                        {justAddedId ===
                                                            entity.externalId ? (
                                                            <span className="text-xs text-success font-semibold">
                                                                Adicionado!
                                                            </span>
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
                        <div className="px-4 py-2 border-b font-semibold text-sm">
                            NPCs
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
                                    {filteredEnemies.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="text-center text-sm opacity-60 py-6"
                                            >
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
                                                        <button
                                                            className="btn btn-xs btn-primary"
                                                            onClick={() =>
                                                                handleAddToTeam(entity)
                                                            }
                                                        >
                                                            Adicionar
                                                        </button>
                                                        {justAddedId ===
                                                            entity.externalId ? (
                                                            <span className="text-xs text-success font-semibold">
                                                                Adicionado!
                                                            </span>
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
                        <button
                            className="btn btn-sm"
                            onClick={closeAddModal}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>

                <div
                    className="modal-backdrop bg-black/40"
                    onClick={closeAddModal}
                />
            </div>
        )
    }

    return (
        <>
            <div className="card bg-base-100 shadow">
                <div className="card-body gap-6">
                    <div className="flex flex-col items-start gap-2">
                        <div className="text-lg font-semibold">
                            Combate #{battleId}
                        </div>

                        <div className="form-control w-full max-w-xs">
                            <label className="label">
                                <span className="label-text font-semibold">
                                    Status do combate
                                </span>
                            </label>
                            <select
                                className="select select-bordered select-sm"
                                value={battleStatus}
                                onChange={handleStatusChange}
                                disabled={updatingStatus}
                            >
                                <option value="starting">
                                    Aguardando início
                                </option>
                                <option value="started">Em andamento</option>
                                <option value="finished">Terminada</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderTeamCard("Time A", "A", teamA)}
                        {renderTeamCard("Time B", "B", teamB)}
                    </div>
                </div>
            </div>

            {renderAddModal()}
        </>
    )
}
