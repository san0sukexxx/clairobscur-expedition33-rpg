import React from "react";
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { APIBattle, type AddBattleCharacterInitiativeData } from "../api/APIBattle"
import { type GetPlayerResponse } from "../api/APIPlayer"
import { FaUser, FaSkull, FaEdit, FaSort, FaSortUp, FaSortDown } from "react-icons/fa"
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
import GradientBar from "./GradientBar"
import AnimatedStatBar from "./AnimatedStatBar"
import DiceBoard, { type DiceBoardRef } from "../components/DiceBoard";
import { useToast } from "../components/Toast";
import { rollWithTimeout } from "../utils/RollUtils";
import { WeaponsDataLoader } from "../lib/WeaponsDataLoader";
import { getAttackTypeLabel, getSkillLabel, getStatusLabel, shouldShowStatusAmmount } from "../utils/BattleUtils";
import { calculateNpcStatusResolvedTotalValue } from "../utils/StatusCalculator";
import { t, getWeaponName, getPictoName, toKebabCase, getWeaponEnglishName, getPictoEnglishName } from "../i18n";
import type { BattleReward } from "../api/ResponseModel";
import { APIRewards } from "../api/APIRewards";
import { PictosList } from "../data/PictosList";
import { pictoColorHex } from "../utils/PictoUtils";

// Map weapon types to characters that can use them
const WEAPON_CHARACTER_MAP: Record<string, string[]> = {
    "sword": ["verso", "gustave"],
    "lune": ["lune"],
    "maelle": ["maelle"],
    "monoco": ["monoco"],
    "sciel": ["sciel"]
};

// Determine weapon type from weapon ID
function getWeaponType(weaponId: string): string | null {
    const id = weaponId.toLowerCase();

    // Check if it's a sword (verso/gustave weapons)
    if (id.includes("verso") || id.includes("gustave") ||
        ["lanceram", "abysseram", "algueron", "angerim", "verleso", "lunerim", "maellum", "noahram", "scieleson"].includes(id)) {
        return "sword";
    }

    // Check if it's a Lune weapon
    if (id.includes("lune") || id.startsWith("baguette-lune")) {
        return "lune";
    }

    // Check if it's a Maelle weapon
    if (id.includes("maelle") || id.startsWith("baguette-maelle")) {
        return "maelle";
    }

    // Check if it's a Monoco weapon
    if (id.includes("monoco")) {
        return "monoco";
    }

    // Check if it's a Sciel weapon
    if (id.includes("sciel")) {
        return "sciel";
    }

    return null;
}

// Check if a character can use a weapon
function canCharacterUseWeapon(characterId: string | undefined, weaponId: string): boolean {
    if (!characterId) return false;

    const weaponType = getWeaponType(weaponId);
    if (!weaponType) return true; // Unknown weapon type, allow it

    const allowedCharacters = WEAPON_CHARACTER_MAP[weaponType];
    if (!allowedCharacters) return true;

    const charId = characterId.toLowerCase();
    return allowedCharacters.some(char => charId.includes(char));
}

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

function getDefenseSuccessLabel(defenseType: string): string {
    const labels: Record<string, string> = {
        "block": "Aparou",
        "dodge": "Desviou",
        "jump": "Pulou",
        "gradient-block": "Aparou o gradiente",
        "take": "Aceitou o dano",
        "counter": "Contra-atacou",
        "cancel-counter": "Cancelou counter"
    };
    return labels[defenseType] || "Defendido";
}

function getDefenseFailLabel(defenseType: string): string {
    const labels: Record<string, string> = {
        "block": "Falhou em aparar",
        "dodge": "Falhou em desviar",
        "jump": "Falhou em pular",
        "gradient-block": "Falhou em aparar o gradiente",
        "take": "Recebeu todo o dano",
        "counter": "Falhou no counter",
        "cancel-counter": "Falhou em cancelar counter"
    };
    return labels[defenseType] || "Falhou na defesa";
}

function calculateNPCDifficulty(npcId: string): number {
    const npc = getNpcById(npcId);
    if (!npc) return 0;

    // Base: Poder + Habilidade + Resistência
    let difficulty = npc.power + npc.hability + npc.resistance;

    // Propriedades extras (+1 cada)
    if (npc.playFirst) difficulty += 1;
    if (npc.weakTo) difficulty += 1;
    if (npc.resistentTo) difficulty += 1;
    if (npc.imuneTo) difficulty += 1;
    if (npc.absorbElement) difficulty += 1;
    if (npc.freeShotWeakPoints) difficulty += 1;
    if (npc.attackList && npc.attackList.length > 0) difficulty += 1;
    if (npc.skillList && npc.skillList.length > 0) difficulty += 1;
    if (npc.isFlying) difficulty += 1;
    if (npc.initiativeBonus) difficulty += 1;
    if (npc.maxLifeBonus) difficulty += 1;

    return difficulty;
}

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
    const [sortColumn, setSortColumn] = useState<"name" | "difficulty" | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [battleRewards, setBattleRewards] = useState<BattleReward[]>([]);
    const [showGradientModal, setShowGradientModal] = useState(false);
    const [gradientCharges, setGradientCharges] = useState(0);
    const [editingTeamIsEnemy, setEditingTeamIsEnemy] = useState(false);

    const processedEffectsRef = useRef<Set<string>>(new Set())
    const lastActiveCharacterIdRef = useRef<number | undefined>(undefined)

    // Função para coletar recompensas de NPCs derrotados
    const collectBattleRewards = useCallback((characters: BattleCharacterInfo[]) => {
        const rewards: BattleReward[] = [];

        console.log("=== collectBattleRewards ===");
        console.log("Total de personagens:", characters.length);

        // Verificar se há algum jogador vivo
        const hasAlivePlayer = characters.some(
            ch => ch.type === "player" && ch.healthPoints > 0
        );
        console.log("Há jogador vivo?", hasAlivePlayer);

        if (!hasAlivePlayer) {
            console.log("Nenhum jogador vivo, sem recompensas");
            return rewards; // Sem recompensas se todos os jogadores morreram
        }

        // Coletar recompensas de todos os NPCs mortos
        characters.forEach(ch => {
            console.log(`Personagem: ${ch.name} (${ch.id}), Tipo: ${ch.type}, HP: ${ch.healthPoints}`);
            if (ch.type === "npc" && ch.healthPoints <= 0) {
                console.log(`  -> NPC morto, buscando recompensa para ID: ${ch.id}`);
                const npc = getNpcById(ch.id);
                console.log(`  -> NPC encontrado:`, npc);
                if (npc?.reward) {
                    console.log(`  -> Recompensa encontrada:`, npc.reward);
                    rewards.push(npc.reward);
                } else {
                    console.log(`  -> Nenhuma recompensa definida para este NPC`);
                }
            }
        });

        console.log("Total de recompensas coletadas:", rewards.length);
        return rewards;
    }, []);

    // Coletar recompensas quando a batalha estiver finalizada (ao carregar ou recarregar a página)
    useEffect(() => {
        if (battleStatus === 'finished' && battleDetails?.characters && battleRewards.length === 0) {
            console.log("Batalha já finalizada, coletando recompensas...");
            const rewards = collectBattleRewards(battleDetails.characters);
            if (rewards.length > 0) {
                setBattleRewards(rewards);
            }
        }
    }, [battleStatus, battleDetails?.characters, battleRewards.length, collectBattleRewards]);

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

    const handleOpenGradientModal = useCallback((isEnemy: boolean) => {
        const currentGradient = isEnemy
            ? (battleDetails?.characters?.find(ch => ch.isEnemy)?.gradientPoints ?? 0)
            : (battleDetails?.characters?.find(ch => !ch.isEnemy)?.gradientPoints ?? 0);
        const currentCharges = Math.floor(currentGradient / 12);
        setGradientCharges(currentCharges);
        setEditingTeamIsEnemy(isEnemy);
        setShowGradientModal(true);
    }, [battleDetails?.characters]);

    const handleConfirmGradient = useCallback(async () => {
        const teamCharacter = editingTeamIsEnemy
            ? battleDetails?.characters?.find(ch => ch.isEnemy)
            : battleDetails?.characters?.find(ch => !ch.isEnemy);

        if (!teamCharacter?.battleID) {
            showToast("Nenhum personagem encontrado neste time.");
            return;
        }

        const newGradientPoints = gradientCharges * 12;

        try {
            await APIBattle.updateTeamGradient(teamCharacter.battleID, newGradientPoints);
            setShowGradientModal(false);
            await reloadBattleDetails();
            showToast(`Cargas de gradiente atualizadas para ${gradientCharges}/3`);
        } catch (error) {
            console.error("Erro ao atualizar gradiente:", error);
            showToast("Erro ao atualizar gradiente.");
        }
    }, [gradientCharges, editingTeamIsEnemy, battleDetails?.characters, reloadBattleDetails, showToast]);

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

            // Se a batalha foi finalizada, buscar os dados atualizados e coletar recompensas
            if (newStatus === "finished") {
                console.log("Batalha finalizada, buscando dados para coletar recompensas...");
                const updatedBattle = await APIBattle.getById(campaignInfo.battleId);
                console.log("Dados da batalha atualizada:", updatedBattle);
                if (updatedBattle?.characters) {
                    console.log("Coletando recompensas...");
                    const rewards = collectBattleRewards(updatedBattle.characters);
                    setBattleRewards(rewards);
                } else {
                    console.log("Nenhum personagem encontrado na batalha atualizada");
                }
            }
        } catch (error) {
            console.error("Erro completo ao atualizar o status do combate:", error);
            console.error("Stack trace:", error instanceof Error ? error.stack : "N/A");
            alert("Erro ao atualizar o status do combate: " + (error instanceof Error ? error.message : String(error)))
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

    function handleSort(column: "name" | "difficulty") {
        if (sortColumn === column) {
            // Toggle direction
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            // New column, default to ascending
            setSortColumn(column);
            setSortDirection("asc");
        }
    }

    function getSortIcon(column: "name" | "difficulty") {
        if (sortColumn !== column) {
            return <FaSort className="inline ml-1 opacity-50" />;
        }
        return sortDirection === "asc"
            ? <FaSortUp className="inline ml-1" />
            : <FaSortDown className="inline ml-1" />;
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

        // Detect if character is Gustave and initialize charge system
        const isGustave = (entity.characterId?.toLowerCase() === "gustave") ||
                         String(entity.externalId).toLowerCase().includes("gustave")

        // Detect if character is Maelle and initialize stance system
        const isMaelle = (entity.characterId?.toLowerCase() === "maelle") ||
                        String(entity.externalId).toLowerCase().includes("maelle")

        // Detect if character is Sciel and initialize sun/moon charge system
        const isSciel = (entity.characterId?.toLowerCase() === "sciel") ||
                       String(entity.externalId).toLowerCase().includes("sciel")

        // Detect if character is Lune and initialize stain system (4 empty slots)
        const isLune = (entity.characterId?.toLowerCase() === "lune") ||
                      String(entity.externalId).toLowerCase().includes("lune")

        // Detect if character is Verso and initialize perfection rank system
        const isVerso = (entity.characterId?.toLowerCase() === "verso") ||
                       String(entity.externalId).toLowerCase().includes("verso")

        // Detect if character is Monoco and initialize bestial wheel system
        const isMonoco = (entity.characterId?.toLowerCase() === "monoco") ||
                        String(entity.externalId).toLowerCase().includes("monoco")

        // Random initial position for Bestial Wheel (0-8)
        const randomBestialPosition = isMonoco ? Math.floor(Math.random() * 9) : undefined

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
            chargePoints: isGustave ? 0 : undefined,
            maxChargePoints: isGustave ? 10 : undefined,
            sunCharges: isSciel ? 0 : undefined,
            moonCharges: isSciel ? 0 : undefined,
            stance: isMaelle ? null : undefined,
            stainSlot1: isLune ? null : undefined,
            stainSlot2: isLune ? null : undefined,
            stainSlot3: isLune ? null : undefined,
            stainSlot4: isLune ? null : undefined,
            perfectionRank: isVerso ? "D" : undefined,
            rankProgress: isVerso ? 0 : undefined,
            bestialWheelPosition: randomBestialPosition,
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


    async function handleRemove(rowId: number) {
        if (!rowId) return
        try {
            await APIBattle.removeCharacter(rowId)
            await reloadBattleDetails()
        } catch (error) {
            console.error("Erro ao remover personagem:", error)
        }
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
        let filtered = availableEnemies;

        // Apply filter by name or difficulty
        if (f) {
            filtered = availableEnemies.filter((e) => {
                const matchesName = e.name.toLowerCase().includes(f);
                const difficulty = calculateNPCDifficulty(e.externalId.toString()).toString();
                const matchesDifficulty = difficulty.includes(f);
                return matchesName || matchesDifficulty;
            });
        }

        // Apply sorting
        if (sortColumn) {
            filtered = [...filtered].sort((a, b) => {
                let compareResult = 0;

                if (sortColumn === "name") {
                    compareResult = a.name.localeCompare(b.name);
                } else if (sortColumn === "difficulty") {
                    const diffA = calculateNPCDifficulty(a.externalId.toString());
                    const diffB = calculateNPCDifficulty(b.externalId.toString());
                    compareResult = diffA - diffB;
                }

                return sortDirection === "asc" ? compareResult : -compareResult;
            });
        }

        return filtered;
    }, [filterText, availableEnemies, sortColumn, sortDirection])

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
        // Ocultar se a batalha estiver finalizada
        if (battleStatus === 'finished') {
            return;
        }

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
        // Ocultar se a batalha estiver finalizada
        if (battleStatus === 'finished') {
            return;
        }

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
                                    {atk.name || getAttackTypeLabel(atk.type)}
                                    {atk.quantity && atk.quantity > 1 && (
                                        <span className="ml-1 badge badge-warning badge-sm">
                                            x{atk.quantity}
                                        </span>
                                    )}
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
                                                    className={isRowSelectable ? "target-glow cursor-pointer" : ""}
                                                    onClick={isRowSelectable ? () => handleTargetSelected(m) : undefined}
                                                >
                                                    <td>{renderAvatarCell(m)}</td>
                                                    <td>{m.rowId}</td>

                                                    <td>
                                                        <div className={m.currentHp === 0 ? "inline-flex items-center gap-1" : ""}>
                                                            <span
                                                                className={`font-semibold ${m.currentHp === 0 ? "text-neutral-500 line-through" : ""
                                                                    }`}
                                                            >
                                                                {m.name}
                                                            </span>

                                                            {m.currentHp === 0 && (
                                                                <FaSkull className="ml-4 text-red-600 w-4 h-4" title="Morto" />
                                                            )}
                                                        </div>
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
                                                                onClick={() => handleRemove(m.rowId!)}
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
                                                                                <span className="badge badge-success badge-sm">
                                                                                    {a.defenseType ? getDefenseSuccessLabel(a.defenseType) : 'Defendido'}
                                                                                </span>
                                                                            )}

                                                                            {defesaFalhou && (
                                                                                <span className="badge badge-error badge-sm">
                                                                                    {a.defenseType ? getDefenseFailLabel(a.defenseType) : 'Falhou na defesa'}
                                                                                </span>
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

    function renderGradientModal() {
        if (!showGradientModal) return null;

        return (
            <dialog className="modal modal-open">
                <div className="modal-box space-y-4">
                    <h3 className="font-bold text-lg">Editar Cargas de Gradiente</h3>

                    <p className="text-sm opacity-80">
                        Time: <span className="font-mono">{editingTeamIsEnemy ? "Time B (Inimigos)" : "Time A (Aliados)"}</span>
                    </p>

                    <div>
                        <label className="label">
                            <span className="label-text">Cargas (0-3)</span>
                        </label>
                        <input
                            type="number"
                            className="input input-bordered w-full"
                            value={gradientCharges}
                            min={0}
                            max={3}
                            onChange={(e) => setGradientCharges(parseInt(e.target.value) || 0)}
                        />
                    </div>

                    <div className="modal-action">
                        <button className="btn" onClick={() => setShowGradientModal(false)}>
                            Cancelar
                        </button>

                        <button className="btn btn-primary" onClick={handleConfirmGradient}>
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
                            <span className="label-text text-sm font-semibold">Filtro</span>
                            <input
                                type="text"
                                className="input input-bordered input-sm flex-1"
                                placeholder="Digite para filtrar por nome ou dificuldade..."
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
                        <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
                            <table className="table table-compact w-full">
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th
                                            className="cursor-pointer hover:bg-base-200 select-none"
                                            onClick={() => handleSort("name")}
                                        >
                                            Nome {getSortIcon("name")}
                                        </th>
                                        <th
                                            className="text-center cursor-pointer hover:bg-base-200 select-none"
                                            onClick={() => handleSort("difficulty")}
                                        >
                                            Dificuldade {getSortIcon("difficulty")}
                                        </th>
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
                                                <td className="text-center">
                                                    <span className="badge badge-ghost">
                                                        {calculateNPCDifficulty(entity.externalId.toString())}
                                                    </span>
                                                </td>
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
                </div>

                <div className="modal-backdrop bg-black/40" onClick={closeAddModal} />
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

                    {/* Mostrar recompensas no lugar da barra de turnos se a batalha terminou */}
                    {battleStatus === 'finished' && battleRewards.length > 0 ? (
                        <div className="card bg-base-200 p-6">
                            <h2 className="text-3xl font-bold text-center mb-2 text-success">
                                {t("combat.victoryTitle")}
                            </h2>
                            <p className="text-center text-lg mb-6 opacity-80">
                                {t("combat.rewardsEarned")}
                            </p>

                            <div className="space-y-4">
                                {battleRewards.map((reward, index) => {
                                    const isWeapon = reward.type === "weapon";
                                    const kebabId = toKebabCase(reward.itemId);
                                    const displayName = isWeapon
                                        ? getWeaponName(kebabId)
                                        : getPictoName(kebabId);
                                    const englishName = isWeapon
                                        ? getWeaponEnglishName(kebabId)
                                        : getPictoEnglishName(kebabId);

                                    const imagePath = isWeapon
                                        ? `/weapons/${englishName}.webp`
                                        : `/pictos/${englishName}.webp`;

                                    // Buscar informações do picto para pegar a cor
                                    let pictoColor = null;
                                    if (!isWeapon) {
                                        const pictoInfo = PictosList.find((p: any) => p.id === kebabId);
                                        pictoColor = pictoInfo?.color;
                                    }

                                    return (
                                        <div
                                            key={index}
                                            className="flex items-center gap-4 bg-base-300 p-4 rounded-lg"
                                        >
                                            <div className="avatar">
                                                <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-black/30">
                                                    {isWeapon ? (
                                                        <img
                                                            src={imagePath}
                                                            alt={displayName}
                                                            className="w-full h-full object-contain"
                                                            onError={(e) => {
                                                                e.currentTarget.src = "/placeholder-item.png";
                                                            }}
                                                        />
                                                    ) : (
                                                        <div
                                                            className="w-12 h-12"
                                                            style={{
                                                                backgroundColor: pictoColor ? pictoColorHex[pictoColor as keyof typeof pictoColorHex] : "rgba(255,255,255,0.3)",
                                                                WebkitMaskImage: `url("${imagePath}")`,
                                                                maskImage: `url("${imagePath}")`,
                                                                WebkitMaskRepeat: "no-repeat",
                                                                maskRepeat: "no-repeat",
                                                                WebkitMaskSize: "contain",
                                                                maskSize: "contain",
                                                                WebkitMaskPosition: "center",
                                                                maskPosition: "center",
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex-1">
                                                <h3 className="font-bold text-lg">{displayName}</h3>
                                                <div className="flex items-center gap-2 text-sm opacity-70">
                                                    {isWeapon ? (
                                                        <span className="badge badge-warning">
                                                            {t("rewards.weapon")}
                                                        </span>
                                                    ) : (
                                                        <span
                                                            className="badge"
                                                            style={{
                                                                backgroundColor: pictoColor ? pictoColorHex[pictoColor as keyof typeof pictoColorHex] : "rgba(255,255,255,0.3)",
                                                                color: "black"
                                                            }}
                                                        >
                                                            {t("rewards.picto")}
                                                        </span>
                                                    )}
                                                    <span className="badge badge-outline">
                                                        {t("rewards.level")} {reward.level}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium opacity-70">Dar recompensa para:</span>
                                                {players.map(player => {
                                                    const rawCharacterName = player.playerSheet?.characterId || "?";
                                                    // Capitalizar primeira letra
                                                    const characterName = rawCharacterName.charAt(0).toUpperCase() + rawCharacterName.slice(1);
                                                    const playerName = player.playerSheet?.name || "?";

                                                    // Encontrar o battleID do personagem
                                                    const battleChar = battleDetails?.characters.find(
                                                        ch => ch.type === "player" && ch.id === String(player.id)
                                                    );
                                                    const battleID = battleChar?.battleID;

                                                    const buttonLabel = battleID
                                                        ? `#${battleID} ${characterName} (${playerName})`
                                                        : `${characterName} (${playerName})`;

                                                    // Check if player already has this item (case-insensitive comparison)
                                                    const playerAlreadyHasItem = isWeapon
                                                        ? player.weapons?.some(w => w.id.toLowerCase() === kebabId.toLowerCase())
                                                        : player.pictos?.some(p => p.pictoId.toLowerCase() === kebabId.toLowerCase());

                                                    // Check if character can use this weapon
                                                    const canUseWeapon = !isWeapon || canCharacterUseWeapon(player.playerSheet?.characterId, kebabId);

                                                    // Determine if button should be disabled
                                                    const isDisabled = playerAlreadyHasItem || !canUseWeapon;

                                                    // Determine tooltip
                                                    let tooltipText: string | undefined;
                                                    if (playerAlreadyHasItem) {
                                                        tooltipText = t("rewards.alreadyOwned");
                                                    } else if (!canUseWeapon) {
                                                        tooltipText = t("rewards.cannotUse");
                                                    }

                                                    return (
                                                        <button
                                                            key={player.id}
                                                            onClick={async () => {
                                                                try {
                                                                    await APIRewards.claimReward(player.id, reward);
                                                                    showToast(`${displayName} ${t("rewards.level")} ${reward.level} reivindicado por ${characterName}!`);
                                                                } catch (error) {
                                                                    console.error("Erro ao reivindicar recompensa:", error);
                                                                    showToast("Erro ao reivindicar recompensa");
                                                                }
                                                            }}
                                                            className={`btn btn-sm ${isDisabled ? 'btn-disabled' : 'btn-success'}`}
                                                            disabled={isDisabled}
                                                            title={tooltipText}
                                                        >
                                                            {buttonLabel}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <>
                            <InitiativesQueue
                                characters={battleDetails?.characters}
                                initiatives={battleDetails?.initiatives}
                                turns={battleDetails?.turns}
                                isStarted={battleStatus == "started" || battleStatus == "finished"}
                                showBattleId={true}
                                isAdmin={true}
                                onReorder={reloadBattleDetails} />

                            <GradientBar
                                characters={battleDetails?.characters}
                                player={undefined}
                                turns={battleDetails?.turns}
                                forceShowTeamIsEnemy={getActiveTurnCharacter()?.isEnemy ?? false}
                                isAdmin={true}
                                onEditGradient={() => handleOpenGradientModal(getActiveTurnCharacter()?.isEnemy ?? false)}
                            />
                        </>
                    )}

                    {/* Equipes A e B - sempre visíveis */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderAttackOptions()}
                        {renderActionOptions()}
                        {renderTeamCard("Time A", "A", teamA)}
                        {renderTeamCard("Time B", "B", teamB)}
                    </div>

                    {renderEditEntityModal()}
                    {renderGradientModal()}
                </div>
            </div>

            {renderAddModal()}
        </>
    )

    function checkBattleLog(battleInfo: BattleWithDetailsResponse) {
        const logs = battleInfo.battleLogs ?? [];
        if (logs.length === 0) return;

        const relevantEvents = new Set([
            "ADD_CHARACTER",
            "REMOVE_CHARACTER",
            "SET_INITIATIVE",
            "INITIATIVES_REORDERED",
            "BATTLE_STARTED",
            "BATTLE_FINISHED",
            "DAMAGE_DEALT",
            "TURN_ADDED",
            "TURN_ENDED",
            "TURNS_REORDERED",
            "ATTACK_PENDING",
            "ALLOW_COUNTER",
            "COUNTER_RESOLVED",
            "STATUS_RESOLVED",
            "STATUS_ADDED",
            "HP_CHANGED",
            "MP_CHANGED",
            "MP_RECOVERED",
            "GRADIENT_CHANGED",
            "FLEEING",
            "HEAL_APPLIED",
            "STATUS_CLEANSED",
            "BREAK_APPLIED"
        ]);

        const shouldUpdate = logs.some(log => relevantEvents.has(log.eventType));

        if (shouldUpdate) {
            applyFightInfoUpdate(battleInfo);
        }

        const hasBattleFinished = logs.some(log => log.eventType === "BATTLE_FINISHED");

        if (hasBattleFinished && battleInfo.battleStatus) {
            setBattleStatus(battleInfo.battleStatus);
            onStatusChanged?.(battleInfo.battleStatus);

            // Coletar recompensas quando a batalha terminar
            if (battleInfo.characters) {
                const rewards = collectBattleRewards(battleInfo.characters);
                console.log("Recompensas coletadas:", rewards);
                console.log("Personagens:", battleInfo.characters);
                setBattleRewards(rewards);
            }
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
        startTargeting(npcAttack.type)
    }

    function npcSkillTapped(skill: NPCSkill) {
        setAttackType(null)
        setNPCAttack(null)
        setNPCSkill(skill)
        startTargeting(undefined)
    }

    function npcAttackTapped(type: AttackType) {
        setNPCSkill(null)
        setAttackType(type)
        setNPCAttack(null)
        startTargeting(type)
    }

    function startTargeting(type?: AttackType) {
        const currentAttackType = type ?? attackType;
        if (currentAttackType == "jump-all") {
            handleMultipleAttack()
        } else {
            setIsSelectingTarget(true)
        }
    }

    async function handleMultipleAttack() {
        const character = getActiveTurnCharacter()
        const npcId = character?.id ?? ""

        // Get quantity from npcAttack, default to 1
        const attackQuantity = npcAttack?.quantity ?? 1;

        // Execute attack multiple times based on quantity
        for (let i = 0; i < attackQuantity; i++) {
            await new Promise<void>((resolve) => {
                const rollCommand = rollCommandForNpcAttack(npcId, npcAttack);
                rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, rollCommand, async (result) => {
                    const enemies = battleDetails?.characters.filter(c => c.isEnemy != character?.isEnemy)

                    if (enemies) {
                        for (const enemy of enemies) {
                            if (character) {
                                await doTheAttack(character, enemy.battleID, enemy.type, result, i + 1, attackQuantity)
                            }
                        }
                    }
                    resolve();
                });
            });
        }
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

        // Get quantity from npcAttack, default to 1
        const attackQuantity = npcAttack?.quantity ?? 1;

        // Execute attack multiple times based on quantity
        const executeAttacks = async () => {
            for (let i = 0; i < attackQuantity; i++) {
                await new Promise<void>((resolve) => {
                    const rollCommand = rollCommandForNpcAttack(npcId, npcAttack);
                    rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, rollCommand, async (result) => {
                        if (character) {
                            await doTheAttack(character, targetEntity.rowId ?? 0, targetEntity.type, result, i + 1, attackQuantity)
                        }
                        resolve();
                    });
                });
            }
        };

        executeAttacks();
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

    async function doTheAttack(sourceInfo: BattleCharacterInfo, targetID: number, targetType: BattleCharacterType, result: any, attackNumber?: number, totalAttacks?: number) {
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
            npcAttack.statusList?.forEach(s => {
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

        let totalPower = calculateNpcAttackPower(sourceInfo, result);

        // Apply additional damage from npcAttack
        if (npcAttack?.additionalDamage) {
            totalPower += npcAttack.additionalDamage;
        }

        if (targetType == "npc") {
            attackInfo.totalDamage = calculateNpcAttackReceivedDamage(sourceInfo, totalPower);
            const attackLabel = totalAttacks && totalAttacks > 1
                ? `Ataque ${attackNumber}/${totalAttacks}: Causou ${attackInfo.totalDamage} de dano`
                : `Causou ${attackInfo.totalDamage} de dano`;
            showToast(attackLabel);
        } else {
            attackInfo.totalPower = totalPower;
            const attackLabel = totalAttacks && totalAttacks > 1
                ? `Ataque ${attackNumber}/${totalAttacks}: Atacou com ${attackInfo.totalPower} de dano`
                : `Atacou com ${attackInfo.totalPower} de dano`;
            showToast(attackLabel);
        }

        try {
            await APIBattle.attack(attackInfo)
        } catch (e) {
            showToast("Erro ao encerrar o atacar");
        }
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
