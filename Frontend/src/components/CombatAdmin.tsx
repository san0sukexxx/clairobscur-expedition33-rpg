import React from "react";
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { APIBattle, type AddBattleCharacterInitiativeData } from "../api/APIBattle"
import { type GetPlayerResponse } from "../api/APIPlayer"
import { FaUser, FaSkull, FaEdit } from "react-icons/fa"
import { FaFistRaised, FaArrowUp, FaFireAlt, FaHourglassHalf, FaShieldAlt } from "react-icons/fa";
import { FaArrowsDownToLine } from "react-icons/fa6";
import { getCharacterLabelById, getActiveTurnCharacterFromBattle } from "../utils/CharacterUtils"
import { getNPCMaxHealth, randomizeNpcInitiativeTotal, calculateNpcAttackPower, rollCommandForNpcInitiative, calculateNpcAttackReceivedDamage, rollCommandForNpcAttack, npcIsFlying, npcIsFlyingById } from "../utils/NpcCalculator"
import { calculateMaxHP, calculateMaxMP, calculateInitialMP } from "../utils/PlayerCalculator"
import { getAllNPCsSorted, getNpcById } from "../utils/NpcUtils"
import { type BattleCharacterType, type BattleCharacterInfo, type AttackType, type WeaponInfo, type NPCAttack, type StatusResponse, type SkillType, type NPCSkill } from "../api/ResponseModel"
import { type Campaign } from "../api/APICampaign"
import { type BattleWithDetailsResponse, type CreateAttackRequest, type AttackStatusEffectRequest } from "../api/APIBattle"
import InitiativesQueue from "./InitiativesQueue"
import AnimatedStatBar from "./AnimatedStatBar"
import DiceBoard, { type DiceBoardRef } from "../components/DiceBoard";
import { useToast } from "../components/Toast";
import { rollWithTimeout } from "../utils/RollUtils";
import { WeaponsDataLoader } from "../lib/WeaponsDataLoader";
import { getAttackTypeLabel, getSkillLabel, getStatusLabel, shouldShowStatusAmmount } from "../utils/BattleUtils";
import { calculateNpcStatusResolvedTotalValue } from "../utils/StatusCalculator";

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
    status?: StatusResponse[]
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
    const [lastBattleLog, setLastBattleLog] = useState<number | undefined>();
    const [isSelectingTarget, setIsSelectingTarget] = useState(false)
    const [attackType, setAttackType] = useState<AttackType | null>(null)
    const [npcAttack, setNPCAttack] = useState<NPCAttack | null>(null)
    const [npcSkill, setNPCSkill] = useState<NPCSkill | null>(null)
    const diceBoardRef = useRef<DiceBoardRef>(null)
    const timeoutDiceBoardRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { showToast } = useToast();
    const [editingHp, setEditingHp] = useState<CombatEntity | null>(null);
    const [newHpValue, setNewHpValue] = useState("");

    const processedEffectsRef = useRef<Set<string>>(new Set())
    const lastActiveCharacterIdRef = useRef<number | undefined>(undefined)

    const processUnresolvedStatuses = (battleDetailsInfo: BattleWithDetailsResponse) => {
        const active = getActiveTurnCharacterFromBattle(battleDetailsInfo)
        if (!active || active.type == "player") return

        const statuses = active.status ?? []

        const unresolved = statuses.filter(
            s => s.isResolved === false && !!s.effectName
        )

        const notProcessed = unresolved.filter(
            s => !processedEffectsRef.current.has(s.effectName)
        )

        if (notProcessed.length === 0) return

        for (const status of notProcessed) {
            processedEffectsRef.current.add(status.effectName)
            void callStatusApiUntilSuccess(status, battleDetailsInfo)
        }
    }

    function checkNewTurnStarted() {
        if (!battleDetails) return

        const activeCharacter = getActiveTurnCharacter()
        const currentId = activeCharacter?.battleID

        if (currentId == null) return

        if (
            lastActiveCharacterIdRef.current !== undefined &&
            lastActiveCharacterIdRef.current !== currentId
        ) {
            processedEffectsRef.current.clear()
        }

        lastActiveCharacterIdRef.current = currentId
    }

    const reloadBattleDetails = useCallback(async () => {
        if (!campaignInfo.battleId) return
        try {
            const battleDetailsInfo = await APIBattle.getById(campaignInfo.battleId, lastBattleLog)
            if (battleDetails == null) {
                setBattleDetails(battleDetailsInfo)
                const lastBattleLog = getLastBattleLogFromBattle(battleDetailsInfo);
                setLastBattleLog(lastBattleLog);
            } else {
                checkBattleLog(battleDetailsInfo)
            }

            checkNewTurnStarted()
            if (isCurrentTurnNPC()) {
                await processUnresolvedStatuses(battleDetailsInfo)
            }
        } catch (error) {
            console.error("Erro ao carregar detalhes da batalha:", error)
        }
    }, [campaignInfo.battleId, battleStatus, lastBattleLog, processUnresolvedStatuses])

    useEffect(() => {
        reloadBattleDetails()
    }, [reloadBattleDetails])

    useEffect(() => {
        setBattleStatus(initialStatus)
    }, [campaignInfo.id, initialStatus])


    useEffect(() => {
        const id = setInterval(() => {
            void reloadBattleDetails();
        }, 2000);

        return () => clearInterval(id);
    }, [reloadBattleDetails]);

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
                    isReadyToStart: !bc.canRollInitiative,
                    status: bc.status
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
                    isReadyToStart: true,
                    status: bc.status
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

    function loadWeaponInfo(player: GetPlayerResponse): WeaponInfo | null {
        const weaponId = player?.playerSheet?.weaponId;

        if (!weaponId) {
            return null;
        }

        const weaponList = WeaponsDataLoader.getByFile(
            WeaponsDataLoader.fileForCharacter(player?.playerSheet?.characterId ?? "")
        );

        const weapon = player?.weapons?.find(w => w.id === weaponId) ?? null;
        const details = weaponList.find(w => w.name === weaponId) ?? null;

        return { weapon, details };
    }

    const availablePlayers: CombatEntity[] = useMemo(() => {
        return players.map((p) => {
            const cid = p.playerSheet?.characterId || ""
            const weaponInfo = loadWeaponInfo(p);
            return {
                externalId: p.id,
                name: p.playerSheet?.name?.trim() || `Player #${p.id}`,
                type: "player" as const,
                currentHp: p.playerSheet?.hpCurrent ?? 0,
                maxHp: calculateMaxHP(p, weaponInfo),
                currentMp: calculateInitialMP(p),
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
        const isPlayerWithImage = entity.type === "player" && entity.avatarUrl;
        const isNpc = entity.type === "npc";

        const grayscaleClass = entity.currentHp === 0 ? "grayscale" : "";

        return (
            <div className="avatar">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-base-300 overflow-hidden">
                    {isPlayerWithImage || isNpc ? (
                        <img
                            src={entity.avatarUrl}
                            alt={entity.name}
                            className={grayscaleClass}
                        />
                    ) : (
                        <FaUser className={`text-base-content opacity-60 ${grayscaleClass}`} />
                    )}
                </div>
            </div>
        );
    }

    function renderCharacterCell(entity: CombatEntity) {
        if (entity.type === "player") {
            return getCharacterLabelById(entity.characterId) || "—"
        }
        return entity.name
    }

    function renderActionOptions() {
        if (!isCurrentTurnPlayer() || battleDetails?.attacks == undefined || battleDetails?.attacks?.length == 0) {
            return;
        }

        return (
            <div className="card bg-base-200 shadow-inner flex-1">
                <div className="card-body gap-4">
                    <div className="flex flex-col items-start">
                        <div className="text-lg font-semibold">Turno do Jogador</div>
                    </div>

                    <div className="flex flex-row flex-wrap items-center gap-4">
                        <button className="btn btn-md btn-info" onClick={() => actionAllowCounter()}>
                            <FaShieldAlt className="mr-1" />
                            Permitir counter
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    function renderAttackOptions() {
        if (!isCurrentTurnNPC()) {
            return;
        }

        const currentNpc = getActiveTurnCharacter();
        const npcInfo = getNpcById(currentNpc?.id ?? "");

        return (
            <div className="card bg-base-200 shadow-inner flex-1">
                <div className="card-body gap-4">
                    <div className="flex flex-col items-start">
                        <div className="text-lg font-semibold">Turno do NPC</div>
                        <div className="text-md font-normal opacity-50">O que ele vai fazer?</div>
                    </div>

                    <div className="flex flex-row flex-wrap gap-6">
                        {npcInfo?.attackList?.map((atk, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-2">
                                <button
                                    className="btn btn-md btn-primary"
                                    onClick={() => npcCustomAttackTapped(atk)}
                                >
                                    {getAttackTypeLabel(atk.type)}
                                </button>

                                <div className="flex flex-col items-center text-sm opacity-80">
                                    {atk.statusList?.map((s, i) => {
                                        const showAmmount = shouldShowStatusAmmount(s.type);

                                        return (
                                            <div key={i} className="leading-tight text-center">
                                                {getStatusLabel(s.type)}{" "}
                                                {showAmmount && s.ammount != null ? s.ammount : ""}{" "}
                                                {s.remainingTurns !== undefined
                                                    ? ` (Por ${s.remainingTurns} turno${s.remainingTurns > 1 ? "s" : ""})`
                                                    : ""}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {(npcInfo?.skillList?.length ?? 0) > 0 && (
                        <div className="flex flex-col gap-2 mt-2">
                            <h3 className="text-lg font-semibold">Habilidades</h3>

                            <div className="flex flex-row flex-wrap items-center gap-4">
                                {npcInfo?.skillList?.map((skill, idx) => (
                                    <div key={idx} className="flex flex-col items-center gap-2">
                                        <button
                                            className="btn btn-md btn-primary"
                                            onClick={() => npcSkillTapped(skill)}
                                        >
                                            {getSkillLabel(skill.type)}
                                        </button>

                                        <div className="flex flex-col items-center text-sm opacity-80">
                                            {skill.statusList?.map((s, i) => {
                                                const showAmount = shouldShowStatusAmmount(s.type);

                                                return (
                                                    <div key={i} className="leading-tight text-center">
                                                        {getStatusLabel(s.type)} {showAmount ? s.ammount : ""}
                                                        {s.remainingTurns !== undefined
                                                            ? ` (${s.remainingTurns} turno${s.remainingTurns > 1 ? "s" : ""})`
                                                            : ""}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-2 mt-2">
                        <h3 className="text-lg font-semibold">Outras ações</h3>

                        <div className="flex flex-row flex-wrap items-center gap-4">
                            <button className="btn btn-md btn-primary" onClick={() => npcAttackTapped("basic")}>
                                <FaFistRaised className="mr-1" />
                                Ataque básico
                            </button>

                            <button className="btn btn-md btn-primary" onClick={() => npcAttackTapped("jump")}>
                                <FaArrowUp className="mr-1" />
                                Pular em um
                            </button>

                            <button className="btn btn-md btn-primary" onClick={() => npcAttackTapped("jump-all")}>
                                <FaArrowsDownToLine className="mr-1" />
                                Pular em todos
                            </button>

                            <button className="btn btn-md btn-primary" onClick={() => npcAttackTapped("gradient")}>
                                <FaFireAlt className="mr-1" />
                                Ataque Gradiente
                            </button>

                            <button
                                className="btn btn-md btn-warning hover:brightness-110"
                                onClick={() => npcPassTurnTapped()}
                            >
                                <FaHourglassHalf className="mr-1" />
                                Passar o turno
                            </button>

                            <button className="btn btn-md btn-info" onClick={() => actionAllowCounter()}>
                                <FaShieldAlt className="mr-1" />
                                Permitir counter
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
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
                                        <th>ID</th>
                                        <th>Nome</th>
                                        <th>Vida</th>
                                        <th>Mana</th>
                                        <th>Pronto?</th>
                                        <th>Efeitos</th>
                                        <th className="w-1/6 text-right">Ações</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {members.map((m) => {
                                        const isRowSelectable = isSelectingTarget && m.currentHp > 0
                                        const entityAttacks =
                                            battleDetails?.attacks?.filter(a => a.targetBattleId === m.rowId) ?? []

                                        return (
                                            <React.Fragment key={m.rowId}>
                                                <tr
                                                    className={isRowSelectable ? "attack-glow cursor-pointer" : ""}
                                                    onClick={isRowSelectable ? () => handleTargetSelected(m) : undefined}
                                                >
                                                    <td>{renderAvatarCell(m)}</td>
                                                    <td>{m.rowId}</td>

                                                    <td className="flex items-center gap-1">
                                                        <span
                                                            className={`font-semibold ${m.currentHp === 0 ? "text-neutral-500 line-through" : ""
                                                                }`}
                                                        >
                                                            {m.name}
                                                        </span>

                                                        {m.currentHp === 0 && (
                                                            <FaSkull className="ml-4 text-red-600 w-4 h-4" title="Morto" />
                                                        )}
                                                    </td>

                                                    <td className="min-w-[160px]">
                                                        <div className="text-xs font-mono mb-1">
                                                            {m.currentHp}/{m.maxHp}
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1">
                                                                <AnimatedStatBar
                                                                    value={Math.round((m.currentHp / m.maxHp) * 100)}
                                                                    label="HP"
                                                                    fillClass="bg-error"
                                                                    ghostClass="bg-error/30"
                                                                />
                                                            </div>

                                                            {m.type == "npc" && (
                                                                <button
                                                                    className="btn btn-xs btn-ghost text-info"
                                                                    onClick={() => openHpEditModal(m)}
                                                                >
                                                                    <FaEdit size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>


                                                    <td className="min-w-[120px]">
                                                        {m.currentMp !== undefined && m.maxMp !== undefined ? (
                                                            <>
                                                                <div className="text-xs font-mono mb-1">
                                                                    {m.currentMp}/{m.maxMp}
                                                                </div>
                                                                <AnimatedStatBar
                                                                    value={Math.round((m.currentMp / m.maxMp) * 100)}
                                                                    label="MP"
                                                                    fillClass="bg-info"
                                                                    ghostClass="bg-info/30"
                                                                />
                                                            </>
                                                        ) : (
                                                            <span className="opacity-60">—</span>
                                                        )}
                                                    </td>

                                                    <td>{m.isReadyToStart ? "Pronto" : "Aguardando"}</td>
                                                    <td>
                                                        <div className="flex flex-row flex-wrap gap-1">
                                                            {m.status
                                                                ?.filter(s => s.effectName != "free-shot")
                                                                .map((st, idx) => {
                                                                    const showAmount = shouldShowStatusAmmount(st.effectName);

                                                                    return (
                                                                        <span
                                                                            key={idx}
                                                                            className="px-1 py-0.5 rounded bg-base-300 text-[10px] opacity-80"
                                                                        >
                                                                            {getStatusLabel(st.effectName)} {showAmount ? st.ammount : ""}
                                                                            {st.remainingTurns ? ` (${st.remainingTurns})` : ""}
                                                                        </span>
                                                                    );
                                                                })}

                                                            {npcIsFlyingById(m.characterId) && (
                                                                <span
                                                                    key="flying"
                                                                    className="px-1 py-0.5 rounded bg-base-300 text-[10px] opacity-80"
                                                                >
                                                                    Voando
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="text-right">
                                                        {!isRowSelectable && (
                                                            <button
                                                                className="btn btn-xs btn-error"
                                                                onClick={() => openRemoveConfirm(m.rowId, m.name)}
                                                            >
                                                                Remover
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>

                                                {entityAttacks.map(a => {
                                                    const defesaFalhou = a.totalDefended == null || a.totalDefended > 0

                                                    return (
                                                        <tr key={`attack-${a.id}`} className="bg-base-300/40">
                                                            <td colSpan={6} className="py-2">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="badge badge-sm badge-error">ATACADO</span>

                                                                    <span className="opacity-70">Poder total:</span>
                                                                    <span className="font-mono">{a.totalPower}</span>

                                                                    <span className="opacity-70">Atacante:</span>
                                                                    <span className="font-mono">#{a.sourceBattleId}</span>

                                                                    {!a.isResolved && (
                                                                        <span className="badge badge-warning badge-sm">PENDENTE</span>
                                                                    )}

                                                                    {a.isResolved && (
                                                                        <>
                                                                            <span className="opacity-70">Dano recebido:</span>
                                                                            <span className="font-mono">{a.totalDefended ?? 0}</span>

                                                                            {!defesaFalhou && (
                                                                                <span className="badge badge-success badge-sm">Defendido</span>
                                                                            )}

                                                                            {defesaFalhou && (
                                                                                <span className="badge badge-error badge-sm">Falhou na defesa</span>
                                                                            )}
                                                                        </>
                                                                    )}

                                                                    {a.allowCounter && (
                                                                        <>
                                                                            {!a.isCounterResolved && (
                                                                                <span className="badge badge-info badge-sm">Counter permitido</span>
                                                                            )}

                                                                            {a.isCounterResolved && (
                                                                                <span className="badge badge-success badge-sm">Counter executado</span>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </React.Fragment>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    function renderEditEntityModal() {
        if (!editingHp) return null;

        return (
            <dialog className="modal modal-open">
                <div className="modal-box space-y-4">
                    <h3 className="font-bold text-lg">Alterar Vida</h3>

                    <p className="text-sm opacity-80">
                        Vida atual: <span className="font-mono">{editingHp.currentHp}</span><br />
                        Vida máxima: <span className="font-mono">{editingHp.maxHp}</span>
                    </p>

                    <input
                        type="number"
                        className="input input-bordered w-full"
                        value={newHpValue}
                        min={0}
                        max={editingHp.maxHp}
                        onChange={(e) => setNewHpValue(e.target.value)}
                    />

                    <div className="modal-action">
                        <button className="btn" onClick={() => setEditingHp(null)}>
                            Cancelar
                        </button>

                        <button className="btn btn-primary" onClick={confirmHpEdit}>
                            Confirmar
                        </button>
                    </div>
                </div>
            </dialog>
        );
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
            <DiceBoard ref={diceBoardRef} />

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
                        isStarted={battleStatus == "started"}
                        showBattleId={true} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderAttackOptions()}
                        {renderActionOptions()}
                        {renderTeamCard("Time A", "A", teamA)}
                        {renderTeamCard("Time B", "B", teamB)}
                    </div>

                    {renderEditEntityModal()}
                </div>
            </div>

            {renderAddModal()}
            {renderRemoveConfirmModal()}
        </>
    )

    function checkBattleLog(battleInfo: BattleWithDetailsResponse) {
        const logs = battleInfo.battleLogs ?? [];
        if (logs.length === 0) return;

        const relevantEvents = new Set([
            "ADD_CHARACTER",
            "REMOVE_CHARACTER",
            "SET_INITIATIVE",
            "BATTLE_STARTED",
            "DAMAGE_DEALT",
            "TURN_ADDED",
            "TURN_ENDED",
            "ATTACK_PENDING",
            "ALLOW_COUNTER",
            "COUNTER_RESOLVED",
            "STATUS_RESOLVED",
            "STATUS_ADDED",
            "HP_CHANGED",
        ]);

        const shouldUpdate = logs.some(log => relevantEvents.has(log.eventType));

        if (shouldUpdate) {
            applyFightInfoUpdate(battleInfo);
        }

        const lastBattleLog = getLastBattleLogFromBattle(battleInfo);
        setLastBattleLog(lastBattleLog);
    }

    function applyFightInfoUpdate(battleInfo: BattleWithDetailsResponse) {
        setBattleDetails(prev =>
            prev
                ? {
                    ...prev,
                    initiatives: battleInfo.initiatives ?? prev.initiatives,
                    characters: battleInfo.characters ?? prev.characters,
                    turns: battleInfo.turns ?? prev.turns,
                    attacks: battleInfo.attacks ?? prev.attacks,
                    battleLogs: battleInfo.battleLogs ?? prev.battleLogs
                }
                : prev
        );
    }

    function getLastBattleLogFromBattle(battleInfo: BattleWithDetailsResponse) {
        if (battleInfo.battleLogs && battleInfo.battleLogs.length > 0) {

            let lastId = 0;

            for (const log of battleInfo.battleLogs) {
                if (log.id > lastId) {
                    lastId = log.id;
                }
            }

            return lastId;
        }

        return undefined;
    }

    function getActiveTurnCharacter(): BattleCharacterInfo | undefined {
        if (battleDetails?.turns == undefined || battleDetails?.turns.length == 0) {
            return undefined;
        }

        const turn = battleDetails.turns.find(t => t.playOrder == 1);
        return battleDetails.characters.find(c => c.battleID == turn?.battleCharacterId)
    }

    function isCurrentTurnNPC() {
        const character = getActiveTurnCharacter()
        return character?.type == "npc"
    }

    function isCurrentTurnPlayer() {
        const character = getActiveTurnCharacter()
        return character?.type == "player"
    }

    function npcCustomAttackTapped(npcAttack: NPCAttack) {
        setNPCSkill(null)
        setAttackType(npcAttack.type)
        setNPCAttack(npcAttack)
        startTargeting()
    }

    function npcSkillTapped(skill: NPCSkill) {
        setAttackType(null)
        setNPCAttack(null)
        setNPCSkill(skill)
        startTargeting()
    }

    function npcAttackTapped(type: AttackType) {
        setNPCSkill(null)
        setAttackType(type)
        setNPCAttack(null)
        startTargeting()
    }

    function startTargeting() {
        if (attackType == "jump-all") {
            handleMultipleAttack()
        } else {
            setIsSelectingTarget(true)
        }
    }

    function handleMultipleAttack() {
        const character = getActiveTurnCharacter()
        const npcId = character?.id ?? ""

        rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, rollCommandForNpcAttack(npcId), result => {
            const enemies = battleDetails?.characters.filter(c => c.isEnemy != character?.isEnemy)

            if (enemies) {
                for (const enemy of enemies) {
                    if (character) {
                        doTheAttack(character, enemy.battleID, enemy.type, result)
                    }
                }
            }
        })
    }

    function handleTargetSelected(targetEntity: CombatEntity) {
        if (npcSkill) {
            handleSkillTargetSelected(targetEntity);
            return;
        }

        if (!isSelectingTarget) return
        setIsSelectingTarget(false)

        const character = getActiveTurnCharacter()
        const npcId = character?.id ?? ""

        rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, rollCommandForNpcAttack(npcId), result => {
            if (character) {
                doTheAttack(character, targetEntity.rowId ?? 0, targetEntity.type, result)
            }
        });
    }

    function handleSkillTargetSelected(targetEntity: CombatEntity) {
        const callAddStatus = async () => {
            try {
                for (const status of npcSkill?.statusList ?? []) {
                    if (status.type) {
                        processedEffectsRef.current.add(status.type)
                    }

                    await APIBattle.addStatus({
                        battleCharacterId: targetEntity.rowId ?? 0,
                        ammount: status.ammount,
                        effectType: status.type,
                        remainingTurns: status.remainingTurns
                    })
                }
                showToast("Habilidades executadas");
            } catch (e) {
                showToast("Erro ao executar habilidade");
            }
        };

        setIsSelectingTarget(false);
        callAddStatus();
    }

    function doTheAttack(sourceInfo: BattleCharacterInfo, targetID: number, targetType: BattleCharacterType, result: any) {
        var effects: AttackStatusEffectRequest[] = [];

        if (attackType == "jump" || attackType == "jump-all") {
            effects.push({
                effectType: "jump"
            })
        }
        if (attackType == "gradient") {
            effects.push({
                effectType: "gradient"
            })
        }
        if (npcAttack) {
            npcAttack.statusList.forEach(s => {
                effects.push({
                    effectType: s.type,
                    ammount: s.ammount,
                    remainingTurns: s.remainingTurns
                });
            });
        }

        var attackInfo: CreateAttackRequest = {
            targetBattleId: targetID,
            sourceBattleId: sourceInfo?.battleID ?? 0,
            effects: effects
        }

        const totalPower = calculateNpcAttackPower(sourceInfo, result);
        if (targetType == "npc") {
            attackInfo.totalDamage = calculateNpcAttackReceivedDamage(sourceInfo, totalPower);
            showToast(`Causou ${attackInfo.totalDamage} de dano`);
        } else {
            attackInfo.totalPower = totalPower;
            showToast(`Atacou com ${attackInfo.totalPower} de dano`);
        }

        const callAttack = async () => {
            try {
                await APIBattle.attack(attackInfo)
            } catch (e) {
                showToast("Erro ao encerrar o atacar");
            }
        };

        callAttack();
    }

    function npcPassTurnTapped() {
        const endTurnCall = async () => {
            try {
                const character = getActiveTurnCharacter()
                await APIBattle.endTurn(character?.battleID ?? 0)
            } catch (e) {
                showToast("Erro ao encerrar o turno");
            }
        };

        setIsSelectingTarget(false);
        endTurnCall();
    }

    function actionAllowCounter() {
        const allowCounterCall = async () => {
            try {
                await APIBattle.allowCounter(battleDetails?.id ?? 0)
            } catch (e) {
                showToast("Erro ao encerrar o turno");
            }
        };

        allowCounterCall();
    }

    async function callStatusApiUntilSuccess(
        status: StatusResponse,
        battleDetailsInfo: BattleWithDetailsResponse,
        delay = 1000
    ) {
        while (true) {
            try {
                const currentNpc = getActiveTurnCharacterFromBattle(battleDetailsInfo)
                const total = calculateNpcStatusResolvedTotalValue(currentNpc, status)
                await APIBattle.resolveStatus({
                    battleCharacterId: currentNpc?.battleID ?? 0,
                    effectType: status.effectName,
                    totalValue: total
                })

                return true
            } catch (error) {
                showToast(`Erro ao sincronizar status ${status.effectName}, tentando novamente...`)

                await new Promise(resolve => setTimeout(resolve, delay))
            }
        }
    }

    function openHpEditModal(entity: CombatEntity) {
        setEditingHp(entity);
        setNewHpValue(entity.currentHp.toString());
    }

    function confirmHpEdit() {
        const value = parseInt(newHpValue, 10);
        if (!isNaN(value) && editingHp) {
            handleHpSet(editingHp, value);
        }
        setEditingHp(null);
    }

    async function handleHpSet(entity: CombatEntity, value: number) {
        try {
            await APIBattle.updateCharacterHp(entity.rowId ?? 0, value)
            showToast("Vida atualizada")
        } catch (e) {
            console.error(e)
            showToast("Erro ao atualizar vida")
        }
    }
}
