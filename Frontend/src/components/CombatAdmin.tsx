import React from "react";
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { APIBattle, type AddBattleCharacterInitiativeData } from "../api/APIBattle"
import { type GetPlayerResponse } from "../api/APIPlayer"
import { FaUser, FaSkull, FaEdit, FaSort, FaSortUp, FaSortDown } from "react-icons/fa"
import { FaFistRaised, FaArrowUp, FaFireAlt, FaHourglassHalf, FaShieldAlt } from "react-icons/fa";
import { FaArrowsDownToLine } from "react-icons/fa6";
import { getCharacterLabelById } from "../utils/CharacterUtils"
import { getNPCMaxHealth, randomizeNpcInitiativeTotal, npcIsFlyingById } from "../utils/NpcCalculator"
import { calculateMaxHP, calculateMaxMP, calculateInitialMP } from "../utils/PlayerCalculator"
import { getAllNPCsSorted, getNpcById } from "../utils/NpcUtils"
import { type BattleCharacterType, type BattleCharacterInfo, type AttackType, type WeaponInfo, type NPCAttack, type StatusResponse, type SpecialAttackType, type NPCSpecialAttack, type StainType } from "../api/ResponseModel"
import { type Campaign } from "../api/APICampaign"
import { type BattleWithDetailsResponse } from "../api/APIBattle"
import InitiativesQueue from "./InitiativesQueue"
import GradientBar from "./GradientBar"
import AnimatedStatBar from "./AnimatedStatBar"
import DiceBoard, { type DiceBoardRef } from "../components/DiceBoard";
import { RollHistoryToast } from "../components/RollHistoryToast";
import { FloatingDiceRoller } from "../components/FloatingDiceRoller";
import { StatusConditionsModal } from "./StatusConditionsModal";
import { useToast } from "../components/Toast";
import { WeaponsDataLoader } from "../utils/WeaponsDataLoader";
import { getAttackTypeLabel, getSpecialAttackLabel, getStatusLabel, shouldShowStatusAmmount } from "../utils/BattleUtils";
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

// Swords that Gustave cannot use (they reference Perfection, a Verso-only mechanic)
const GUSTAVE_EXCLUDED_SWORDS = new Set([
    "abysseram", "blodam", "chevalam", "confuso", "contorso", "corpeso",
    "cruleram", "cultam", "danseso", "delaram", "dreameso", "dualiso",
    "gaultaram", "glaceso", "lanceram", "liteso", "nosaram", "sakaram",
    "seeram", "simoso", "sireso", "tireso"
]);

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

    const charId = characterId.toLowerCase();
    const wId = weaponId.toLowerCase();

    // Gustave can't use swords that reference Perfection (Verso-only mechanic)
    if (charId.includes("gustave") && GUSTAVE_EXCLUDED_SWORDS.has(wId)) {
        return false;
    }

    const weaponType = getWeaponType(weaponId);
    if (!weaponType) return true; // Unknown weapon type, allow it

    const allowedCharacters = WEAPON_CHARACTER_MAP[weaponType];
    if (!allowedCharacters) return true;

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
    battleId: number
    initialStatus: string
    players: GetPlayerResponse[]
    onStatusChanged?: (newStatus: string) => void
}

type TeamKey = "A" | "B"

function getDefenseSuccessLabel(defenseType: string): string {
    const keyMap: Record<string, string> = {
        "block": "block",
        "dodge": "dodge",
        "jump": "jump",
        "gradient-block": "gradientBlock",
        "take": "take",
        "counter": "counter",
        "cancel-counter": "cancelCounter"
    };
    const key = keyMap[defenseType];
    return key ? t(`combatAdmin.defenseSuccess.${key}`) : t("combatAdmin.defenseSuccess.default");
}

function getDefenseFailLabel(defenseType: string): string {
    const keyMap: Record<string, string> = {
        "block": "block",
        "dodge": "dodge",
        "jump": "jump",
        "gradient-block": "gradientBlock",
        "take": "take",
        "counter": "counter",
        "cancel-counter": "cancelCounter"
    };
    const key = keyMap[defenseType];
    return key ? t(`combatAdmin.defenseFail.${key}`) : t("combatAdmin.defenseFail.default");
}

function calculateNPCDifficulty(npcId: string): number {
    const npc = getNpcById(npcId);
    if (!npc) return 0;

    const strMod = Math.floor((npc.strength - 10) / 2);
    const dexMod = Math.floor((npc.dexterity - 10) / 2);
    const conMod = Math.floor((npc.constitution - 10) / 2);
    let difficulty = strMod + dexMod + conMod;

    // Propriedades extras (+1 cada)
    if (npc.playFirst) difficulty += 1;
    if (npc.weakTo) difficulty -= 1;
    if (npc.resistentTo) difficulty += 1;
    if (npc.imuneTo) difficulty += 1;
    if (npc.absorbElement) difficulty += 1;
    if (npc.freeShotWeakPoints) difficulty -= 1;
    if (npc.attackList && npc.attackList.length > 0) difficulty += 1;
    if (npc.specialAttackList && npc.specialAttackList.length > 0) difficulty += 1;
    if (npc.isFlying) difficulty += 1;
    if (npc.initiativeBonus) difficulty += 1;
    if (npc.maxLifeBonus) difficulty += 1;

    return difficulty;
}

export default function CombatAdmin({
    campaignInfo,
    battleId,
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
    const [npcSpecialAttack, setNPCSpecialAttack] = useState<NPCSpecialAttack | null>(null)
    const [npcSpecialAttackIndex, setNpcSpecialAttackIndex] = useState<number | null>(null)
    const [npcAttackIndex, setNpcAttackIndex] = useState<number | null>(null)
    const diceBoardRef = useRef<DiceBoardRef>(null)
    const timeoutDiceBoardRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { showToast } = useToast();
    const [editingHp, setEditingHp] = useState<CombatEntity | null>(null);
    const [newHpValue, setNewHpValue] = useState("");
    const [editingMp, setEditingMp] = useState<CombatEntity | null>(null);
    const [newMpValue, setNewMpValue] = useState("");
    const [sortColumn, setSortColumn] = useState<"name" | "difficulty" | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [battleRewards, setBattleRewards] = useState<BattleReward[]>([]);
    const [showGradientModal, setShowGradientModal] = useState(false);
    const [gradientCharges, setGradientCharges] = useState(0);
    const [editingTeamIsEnemy, setEditingTeamIsEnemy] = useState(false);
    const [showGustaveChargeModal, setShowGustaveChargeModal] = useState(false);
    const [gustaveChargePoints, setGustaveChargePoints] = useState(0);
    const [editingGustaveCharacterId, setEditingGustaveCharacterId] = useState<number | null>(null);
    const [showScielChargesModal, setShowScielChargesModal] = useState(false);
    const [scielSunCharges, setScielSunCharges] = useState(0);
    const [scielMoonCharges, setScielMoonCharges] = useState(0);
    const [scielTwilight, setScielTwilight] = useState(0);
    const [scielTwilightTurns, setScielTwilightTurns] = useState(2);
    const [editingScielCharacterId, setEditingScielCharacterId] = useState<number | null>(null);
    const [showLuneStainsModal, setShowLuneStainsModal] = useState(false);
    const [luneStains, setLuneStains] = useState<(StainType | null)[]>([null, null, null, null]);
    const [editingLuneCharacterId, setEditingLuneCharacterId] = useState<number | null>(null);
    const [isPassingTurn, setIsPassingTurn] = useState(false);
    const [effectsModalCharId, setEffectsModalCharId] = useState<number | null>(null);
    const [effectsModalStatuses, setEffectsModalStatuses] = useState<StatusResponse[]>([]);
    const [expandedAdminStatus, setExpandedAdminStatus] = useState<string | null>(null);

    const lastReloadTimeRef = useRef<number>(0)
    const isReloadingRef = useRef<boolean>(false)

    // Função para coletar recompensas de NPCs derrotados
    const collectBattleRewards = useCallback((characters: BattleCharacterInfo[]) => {
        const rewards: BattleReward[] = [];

        // Verificar se há algum jogador vivo
        const hasAlivePlayer = characters.some(
            ch => ch.type === "player" && ch.healthPoints > 0
        );

        if (!hasAlivePlayer) {
            return rewards; // Sem recompensas se todos os jogadores morreram
        }

        // Coletar recompensas de todos os NPCs mortos
        characters.forEach(ch => {
            if (ch.type === "npc" && ch.healthPoints <= 0) {
                const npc = getNpcById(ch.id);
                if (npc?.reward) {
                    rewards.push(npc.reward);
                }
            }
        });

        return rewards;
    }, []);

    // Coletar recompensas quando a batalha estiver finalizada (ao carregar ou recarregar a página)
    useEffect(() => {
        if (battleStatus === 'finished' && battleDetails?.characters && battleRewards.length === 0) {
            const rewards = collectBattleRewards(battleDetails.characters);
            if (rewards.length > 0) {
                setBattleRewards(rewards);
            }
        }
    }, [battleStatus, battleDetails?.characters, battleRewards.length, collectBattleRewards]);

    const reloadBattleDetails = useCallback(async (force?: boolean) => {
        if (!battleId) return

        // Throttle: só permite uma chamada a cada 2 segundos
        const now = Date.now()
        if (!force && now - lastReloadTimeRef.current < 2000) return
        if (isReloadingRef.current) return

        isReloadingRef.current = true
        lastReloadTimeRef.current = now

        try {
            const battleDetailsInfo = await APIBattle.getById(battleId, lastBattleLog)
            if (battleDetails == null) {
                setBattleDetails(battleDetailsInfo)
                const lastBattleLog = getLastBattleLogFromBattle(battleDetailsInfo);
                setLastBattleLog(lastBattleLog);
            } else {
                checkBattleLog(battleDetailsInfo)
            }
        } catch (error) {
            console.error("Erro ao carregar detalhes da batalha:", error)
        } finally {
            isReloadingRef.current = false
        }
    }, [battleId, battleStatus, lastBattleLog])

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
            showToast(t("combatAdmin.toasts.noCharacterInTeam"));
            return;
        }

        const newGradientPoints = gradientCharges * 12;

        try {
            await APIBattle.updateTeamGradient(teamCharacter.battleID, newGradientPoints);
            setShowGradientModal(false);
            await reloadBattleDetails();
            showToast(t("combatAdmin.toasts.gradientChargesUpdated", { charges: gradientCharges }));
        } catch (error) {
            console.error("Erro ao atualizar gradiente:", error);
            showToast(t("combatAdmin.toasts.errorUpdatingGradient"));
        }
    }, [gradientCharges, editingTeamIsEnemy, battleDetails?.characters, reloadBattleDetails, showToast]);

    const handleOpenGustaveChargeModal = useCallback((character: BattleCharacterInfo) => {
        setGustaveChargePoints(character.chargePoints ?? 0);
        setEditingGustaveCharacterId(character.battleID);
        setShowGustaveChargeModal(true);
    }, []);

    const handleConfirmGustaveCharge = useCallback(async () => {
        if (editingGustaveCharacterId === null) {
            showToast(t("combatAdmin.toasts.noCharacterSelected"));
            return;
        }

        try {
            await APIBattle.updateCharacterChargePoints(editingGustaveCharacterId, gustaveChargePoints);
            setShowGustaveChargeModal(false);
            await reloadBattleDetails();
            showToast(t("combatAdmin.toasts.gustaveChargesUpdated", { charges: gustaveChargePoints }));
        } catch (error) {
            console.error("Erro ao atualizar cargas:", error);
            showToast(t("combatAdmin.toasts.errorUpdatingCharges"));
        }
    }, [gustaveChargePoints, editingGustaveCharacterId, reloadBattleDetails, showToast]);

    const handleOpenScielChargesModal = useCallback((character: BattleCharacterInfo) => {
        setScielSunCharges(character.sunCharges ?? 0);
        setScielMoonCharges(character.moonCharges ?? 0);
        const twilightStatus = character.status?.find(s => s.effectName === "Twilight");
        setScielTwilight(twilightStatus?.ammount ?? 0);
        setScielTwilightTurns(twilightStatus?.remainingTurns ?? 2);
        setEditingScielCharacterId(character.battleID);
        setShowScielChargesModal(true);
    }, []);

    const handleConfirmScielCharges = useCallback(async () => {
        if (editingScielCharacterId === null) {
            showToast(t("combatAdmin.toasts.noCharacterSelected"));
            return;
        }

        try {
            await APIBattle.updateSunMoonCharges(editingScielCharacterId, scielSunCharges, scielMoonCharges);

            const currentChar = battleDetails?.characters?.find(ch => ch.battleID === editingScielCharacterId);
            const hadTwilight = currentChar?.status?.some(s => s.effectName === "Twilight") ?? false;

            if (scielTwilight > 0 && !hadTwilight) {
                await APIBattle.addStatus({
                    battleCharacterId: editingScielCharacterId,
                    effectType: "Twilight",
                    ammount: scielTwilight,
                    remainingTurns: scielTwilightTurns,
                });
            } else if (scielTwilight > 0 && hadTwilight) {
                await APIBattle.removeStatus(editingScielCharacterId, "Twilight");
                await APIBattle.addStatus({
                    battleCharacterId: editingScielCharacterId,
                    effectType: "Twilight",
                    ammount: scielTwilight,
                    remainingTurns: scielTwilightTurns,
                });
            } else if (scielTwilight === 0 && hadTwilight) {
                await APIBattle.removeStatus(editingScielCharacterId, "Twilight");
            }

            setShowScielChargesModal(false);
            await reloadBattleDetails();
            showToast(t("combatAdmin.toasts.scielChargesUpdated"));
        } catch (error) {
            console.error("Erro ao atualizar cargas de Sciel:", error);
            showToast(t("combatAdmin.toasts.errorUpdatingCharges"));
        }
    }, [scielSunCharges, scielMoonCharges, scielTwilight, scielTwilightTurns, editingScielCharacterId, battleDetails?.characters, reloadBattleDetails, showToast]);

    const handleOpenLuneStainsModal = useCallback((character: BattleCharacterInfo) => {
        setLuneStains([
            character.stainSlot1 ?? null,
            character.stainSlot2 ?? null,
            character.stainSlot3 ?? null,
            character.stainSlot4 ?? null
        ]);
        setEditingLuneCharacterId(character.battleID);
        setShowLuneStainsModal(true);
    }, []);

    const handleConfirmLuneStains = useCallback(async () => {
        if (editingLuneCharacterId === null) return;
        try {
            await APIBattle.updateStains(editingLuneCharacterId, {
                stainSlot1: luneStains[0] ?? null,
                stainSlot2: luneStains[1] ?? null,
                stainSlot3: luneStains[2] ?? null,
                stainSlot4: luneStains[3] ?? null
            });
            setShowLuneStainsModal(false);
            await reloadBattleDetails();
        } catch (error) {
            console.error("Error updating Lune stains:", error);
        }
    }, [luneStains, editingLuneCharacterId, reloadBattleDetails]);

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
        if (battleId == undefined
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
        if (battleId == undefined || battleId == null) return

        setBattleStatus(newStatus)
        setUpdatingStatus(true)
        try {
            if (newStatus === "started") {
                await APIBattle.start(battleId, newStatus)
            } else {
                await APIBattle.update(battleId, { battleStatus: newStatus })
            }
            onStatusChanged?.(newStatus)
            await reloadBattleDetails()

            // Se a batalha foi finalizada, buscar os dados atualizados e coletar recompensas
            if (newStatus === "finished") {
                const updatedBattle = await APIBattle.getById(battleId);
                if (updatedBattle?.characters) {
                    const rewards = collectBattleRewards(updatedBattle.characters);
                    setBattleRewards(rewards);
                }
            }
        } catch (error) {
            console.error("Erro completo ao atualizar o status do combate:", error);
            console.error("Stack trace:", error instanceof Error ? error.stack : "N/A");
            alert(t("combatAdmin.toasts.errorUpdatingCombatStatus") + " " + (error instanceof Error ? error.message : String(error)))
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
        if (battleId == undefined) return
        let initiative: AddBattleCharacterInitiativeData | undefined
        if (entity.type == "npc") {
            const npcInfo = getNpcById(String(entity.externalId))
            if (npcInfo != undefined) {
                initiative = {
                    initiativeValue: randomizeNpcInitiativeTotal(npcInfo),
                    hability: Math.floor((npcInfo.dexterity - 10) / 2),
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
            battleId: battleId,
            externalId: String(entity.externalId),
            characterName: entity.name,
            characterType: entity.type,
            team: targetTeam,
            healthPoints: entity.currentHp,
            maxHealthPoints: entity.maxHp,
            magicPoints: entity.currentHp === 0 ? 0 : entity.currentMp,
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

        await reloadBattleDetails(true)
    }

    async function handleAddAllPlayers(entities: CombatEntity[]) {
        if (battleId == undefined) return
        for (const ent of entities) {
            await APIBattle.addCharacter({
                battleId: battleId,
                externalId: String(ent.externalId),
                characterName: ent.name,
                characterType: ent.type,
                team: targetTeam,
                healthPoints: ent.currentHp,
                maxHealthPoints: ent.maxHp,
                magicPoints: ent.currentHp === 0 ? 0 : ent.currentMp,
                maxMagicPoints: ent.maxMp,
                canRollInitiative: ent.type == "player"
            })
        }

        setBulkAdded(true)
        setJustAddedId(null)
        setTimeout(() => setBulkAdded(false), 2000)

        await reloadBattleDetails(true)
    }


    async function handleRemove(rowId: number) {
        if (!rowId) return
        try {
            await APIBattle.removeCharacter(rowId)
            await reloadBattleDetails(true)
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
                <div className="p-3 flex flex-col gap-3">
                    <div className="flex flex-col items-start">
                        <div className="text-lg font-semibold">{t("combatAdmin.labels.playerTurn")}</div>
                    </div>

                    <div className="flex flex-row flex-wrap items-center gap-4">
                        <button className="btn btn-md btn-info" onClick={() => actionAllowCounter()}>
                            <FaShieldAlt className="mr-1" />
                            {t("combatAdmin.labels.allowCounter")}
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
                <div className="p-3 flex flex-col gap-3">
                    <div className="flex flex-col items-start">
                        <div className="text-lg font-semibold">{t("combatAdmin.labels.npcTurn")}</div>
                    </div>

                    <div className="flex flex-row flex-wrap gap-6">
                        {npcInfo?.attackList?.map((atk, idx) => {
                            const isAtkSelected = isSelectingTarget && npcAttackIndex === idx;
                            return (
                            <div key={idx} className="flex flex-col items-center gap-2">
                                <button
                                    className={`btn btn-md ${isAtkSelected ? "btn-error" : "btn-primary"}`}
                                    onClick={() => {
                                        if (isAtkSelected) {
                                            setNPCAttack(null);
                                            setAttackType(null);
                                            setNpcAttackIndex(null);
                                            setIsSelectingTarget(false);
                                        } else {
                                            npcCustomAttackTapped(atk, idx);
                                        }
                                    }}
                                    disabled={isPassingTurn}
                                >
                                    {isAtkSelected ? t("combatAdmin.labels.cancel") : (atk.name || getAttackTypeLabel(atk.type))}
                                    {!isAtkSelected && atk.quantity && atk.quantity > 1 && (
                                        <span className="ml-1 badge badge-warning badge-sm">
                                            x{atk.quantity}
                                        </span>
                                    )}
                                </button>

                                <div className="flex flex-col items-center text-sm opacity-80">
                                    {atk.statusList?.map((s, i) => {
                                        const showAmmount = shouldShowStatusAmmount(s.type);
                                        const showTurns = s.type !== "IntenseFlames" && s.remainingTurns !== undefined;

                                        return (
                                            <div key={i} className="leading-tight text-center">
                                                {getStatusLabel(s.type)}{" "}
                                                {showAmmount && s.ammount != null ? s.ammount : ""}{" "}
                                                {showTurns
                                                    ? ` (Por ${s.remainingTurns} turno${s.remainingTurns! > 1 ? "s" : ""})`
                                                    : ""}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            );
                        })}
                    </div>

                    {(npcInfo?.specialAttackList?.length ?? 0) > 0 && (
                        <div className="flex flex-col gap-2 mt-2">
                            <h3 className="text-lg font-semibold">{t("combatAdmin.labels.specialAttacks")}</h3>

                            <div className="flex flex-row flex-wrap items-center gap-4">
                                {npcInfo?.specialAttackList?.map((skill, idx) => {
                                    const isSelected = isSelectingTarget && npcSpecialAttackIndex === idx;
                                    return (
                                    <div key={idx} className="flex flex-col items-center gap-2">
                                        <button
                                            className={`btn btn-md ${isSelected ? "btn-error" : "btn-primary"}`}
                                            onClick={() => {
                                                if (isSelected) {
                                                    setNPCSpecialAttack(null);
                                                    setNpcSpecialAttackIndex(null);
                                                    setIsSelectingTarget(false);
                                                } else {
                                                    npcSpecialAttackTapped(skill, idx);
                                                }
                                            }}
                                            disabled={isPassingTurn}
                                        >
                                            {isSelected ? t("combatAdmin.labels.cancel") : getSpecialAttackLabel(skill.type)}
                                        </button>

                                        <div className="flex flex-col items-center text-sm opacity-80">
                                            {skill.statusList?.map((s, i) => {
                                                const showAmount = shouldShowStatusAmmount(s.type);
                                                const showTurns = s.type !== "IntenseFlames" && s.remainingTurns !== undefined;

                                                return (
                                                    <div key={i} className="leading-tight text-center">
                                                        {getStatusLabel(s.type)} {showAmount ? s.ammount : ""}
                                                        {showTurns && s.remainingTurns
                                                            ? ` (${s.remainingTurns} turno${s.remainingTurns > 1 ? "s" : ""})`
                                                            : ""}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-2 mt-2">
                        <h3 className="text-lg font-semibold">{t("combatAdmin.labels.otherActions")}</h3>

                        <div className="flex flex-row flex-wrap items-center gap-4">
                            {(["basic", "jump", "gradient"] as AttackType[]).map((type) => {
                                const isActionSelected = isSelectingTarget && attackType === type && !npcAttack && npcSpecialAttackIndex === null && npcAttackIndex === null;
                                const icon = type === "basic" ? <FaFistRaised className="mr-1" /> : type === "jump" ? <FaArrowUp className="mr-1" /> : <FaFireAlt className="mr-1" />;
                                const label = type === "basic" ? t("combatAdmin.labels.basicAttack") : type === "jump" ? t("combatAdmin.labels.jumpOnOne") : t("combatAdmin.labels.gradientAttack");
                                return (
                                    <button
                                        key={type}
                                        className={`btn btn-md ${isActionSelected ? "btn-error" : "btn-primary"}`}
                                        onClick={() => {
                                            if (isActionSelected) {
                                                setAttackType(null);
                                                setIsSelectingTarget(false);
                                            } else {
                                                npcAttackTapped(type);
                                            }
                                        }}
                                        disabled={isPassingTurn}
                                    >
                                        {icon}
                                        {isActionSelected ? t("combatAdmin.labels.cancel") : label}
                                    </button>
                                );
                            })}

                            <button
                                className="btn btn-md btn-primary"
                                onClick={() => npcAttackTapped("jump-all")}
                                disabled={isPassingTurn}
                            >
                                <FaArrowsDownToLine className="mr-1" />
                                {t("combatAdmin.labels.jumpOnAll")}
                            </button>

                            <button
                                className="btn btn-md btn-warning hover:brightness-110"
                                onClick={() => npcPassTurnTapped()}
                                disabled={isPassingTurn}
                            >
                                <FaHourglassHalf className="mr-1" />
                                {t("combatAdmin.labels.passTurn")}
                            </button>

                            <button
                                className="btn btn-md btn-info"
                                onClick={() => actionAllowCounter()}
                                disabled={isPassingTurn}
                            >
                                <FaShieldAlt className="mr-1" />
                                {t("combatAdmin.labels.allowCounter")}
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
                <div className="p-3 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="text-lg font-semibold">{title}</div>
                        <button className="btn btn-xs btn-primary" onClick={() => openAddModal(teamKey)}>
                            {t("combatAdmin.labels.add")}
                        </button>
                    </div>

                    {members.length === 0 ? (
                        <div className="text-sm opacity-60">{t("combatAdmin.labels.noTeamMembers")}</div>
                    ) : (
                        <div className="flex flex-col divide-y divide-base-300 min-w-0 overflow-hidden">
                            {members.map((m) => {
                                const isRowSelectable = isSelectingTarget && m.currentHp > 0
                                const entityAttacks =
                                    battleDetails?.attacks?.filter(a => a.targetBattleId === m.rowId) ?? []

                                return (
                                    <div
                                        key={m.rowId}
                                        className={`py-2 space-y-1 min-w-0 ${isRowSelectable ? "target-glow cursor-pointer" : ""}`}
                                        onClick={isRowSelectable ? () => handleTargetSelected(m) : undefined}
                                    >
                                        {/* Linha 1: Avatar + Nome + ID + Ready + Remover */}
                                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                                            {renderAvatarCell(m)}
                                            <span className={`font-semibold text-sm truncate ${m.currentHp === 0 ? "text-base-content/40 line-through" : ""}`}>
                                                {m.name}
                                            </span>
                                            {m.currentHp === 0 && (
                                                <FaSkull className="text-red-600 w-3.5 h-3.5 shrink-0" title={t("combatAdmin.labels.dead")} />
                                            )}
                                            <span className="badge badge-ghost badge-xs font-mono shrink-0">#{m.rowId}</span>
                                            <span className={`badge badge-xs shrink-0 ${m.isReadyToStart ? "badge-success" : "badge-warning"}`}>
                                                {m.isReadyToStart ? t("combatAdmin.labels.ready") : t("combatAdmin.labels.waiting")}
                                            </span>
                                            <div className="flex-1 basis-0" />
                                            {!isRowSelectable && (
                                                <button
                                                    className="btn btn-xs btn-error shrink-0"
                                                    onClick={(e) => { e.stopPropagation(); handleRemove(m.rowId!); }}
                                                >
                                                    Remover
                                                </button>
                                            )}
                                        </div>

                                        {/* Linha 2: HP bar + MP bar */}
                                        <div className="flex gap-3 items-center">
                                            <div className="flex items-center gap-1 flex-1 min-w-0">
                                                <span className="text-[10px] font-mono opacity-70 shrink-0">HP {m.currentHp}/{m.maxHp}</span>
                                                <div className="flex-1 min-w-0">
                                                    <AnimatedStatBar
                                                        value={Math.round((m.currentHp / m.maxHp) * 100)}
                                                        label="HP"
                                                        fillClass="bg-error"
                                                        ghostClass="bg-error/30"
                                                    />
                                                </div>
                                                <button
                                                    className="btn btn-xs btn-ghost text-info p-0"
                                                    onClick={(e) => { e.stopPropagation(); openHpEditModal(m); }}
                                                >
                                                    <FaEdit size={10} />
                                                </button>
                                            </div>

                                            {m.currentMp !== undefined && m.maxMp !== undefined ? (
                                                <div className="flex items-center gap-1 flex-1 min-w-0">
                                                    <span className="text-[10px] font-mono opacity-70 shrink-0">MP {m.currentMp}/{m.maxMp}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <AnimatedStatBar
                                                            value={Math.round((m.currentMp / m.maxMp) * 100)}
                                                            label="MP"
                                                            fillClass="bg-info"
                                                            ghostClass="bg-info/30"
                                                        />
                                                    </div>
                                                    <button
                                                        className="btn btn-xs btn-ghost text-info p-0"
                                                        onClick={(e) => { e.stopPropagation(); openMpEditModal(m); }}
                                                    >
                                                        <FaEdit size={10} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex-1" />
                                            )}
                                        </div>

                                        {/* Linha 3: Efeitos/Status */}
                                        {((m.status && m.status.length > 0) || npcIsFlyingById(m.characterId)) && (
                                            <div className="flex items-start gap-1">
                                                <div className="flex flex-row flex-wrap gap-1 flex-1">
                                                    {m.status?.map((st, idx) => {
                                                        const showAmount = shouldShowStatusAmmount(st.effectName);
                                                        const showTurns = st.effectName !== "IntenseFlames" && st.remainingTurns;

                                                        return (
                                                            <span
                                                                key={idx}
                                                                className="px-1 py-0.5 rounded bg-base-300 text-[10px] opacity-80 cursor-pointer hover:opacity-100 transition-opacity"
                                                                onClick={(e) => { e.stopPropagation(); setExpandedAdminStatus(prev => prev === `${m.battleCharacterId}-${st.effectName}` ? null : `${m.battleCharacterId}-${st.effectName}`); }}
                                                            >
                                                                {getStatusLabel(st.effectName)} {showAmount ? st.ammount : ""}
                                                                {showTurns ? ` (${st.remainingTurns})` : ""}
                                                            </span>
                                                        );
                                                    })}

                                                    {npcIsFlyingById(m.characterId) && (
                                                        <span className="px-1 py-0.5 rounded bg-base-300 text-[10px] opacity-80">
                                                            Voando
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    className="btn btn-xs btn-ghost text-info shrink-0 p-0"
                                                    onClick={(e) => { e.stopPropagation(); setEffectsModalCharId(m.rowId!); setEffectsModalStatuses(m.status ?? []); }}
                                                >
                                                    <FaEdit size={10} />
                                                </button>
                                            </div>
                                        )}

                                        {expandedAdminStatus?.startsWith(`${m.battleCharacterId}-`) && (
                                            <p className="text-[10px] opacity-70 leading-relaxed">
                                                {t(`battle.statusDescriptions.${expandedAdminStatus.split("-").slice(1).join("-")}`) || t("battle.statusDescriptions.default")}
                                            </p>
                                        )}

                                        {/* Sub-linhas de ataque */}
                                        {entityAttacks.map(a => {
                                            const defesaFalhou = a.totalDefended == null || a.totalDefended > 0

                                            return (
                                                <div key={`attack-${a.id}`} className="flex flex-wrap items-center gap-2 bg-base-300/40 rounded px-2 py-1 text-xs">
                                                    <span className="badge badge-sm badge-error">{t("combatAdmin.labels.attacked")}</span>

                                                    <span className="opacity-70">{t("combatAdmin.labels.totalPower")}:</span>
                                                    <span className="font-mono">{a.totalPower}</span>

                                                    <span className="opacity-70">{t("combatAdmin.labels.attacker")}:</span>
                                                    <span className="font-mono">#{a.sourceBattleId}</span>

                                                    {!a.isResolved && (
                                                        <span className="badge badge-warning badge-sm">{t("combatAdmin.labels.pending")}</span>
                                                    )}

                                                    {a.isResolved && (
                                                        <>
                                                            <span className="opacity-70">{t("combatAdmin.labels.damageReceived")}:</span>
                                                            <span className="font-mono">{a.totalDefended ?? 0}</span>

                                                            {!defesaFalhou && (
                                                                <span className="badge badge-success badge-sm">
                                                                    {a.defenseType ? getDefenseSuccessLabel(a.defenseType) : t("combatAdmin.defenseSuccess.default")}
                                                                </span>
                                                            )}

                                                            {defesaFalhou && (
                                                                <span className="badge badge-error badge-sm">
                                                                    {a.defenseType ? getDefenseFailLabel(a.defenseType) : t("combatAdmin.defenseFail.default")}
                                                                </span>
                                                            )}
                                                        </>
                                                    )}

                                                    {a.allowCounter && (
                                                        <>
                                                            {!a.isCounterResolved && (
                                                                <span className="badge badge-info badge-sm">{t("combatAdmin.labels.counterAllowed")}</span>
                                                            )}

                                                            {a.isCounterResolved && (
                                                                <span className="badge badge-success badge-sm">{t("combatAdmin.labels.counterExecuted")}</span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )
                            })}
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
                    <h3 className="font-bold text-lg">{t("combatAdmin.labels.changeHp")}</h3>

                    <p className="text-sm opacity-80">
                        {t("combatAdmin.labels.currentHp")}: <span className="font-mono">{editingHp.currentHp}</span><br />
                        {t("combatAdmin.labels.maxHp")}: <span className="font-mono">{editingHp.maxHp}</span>
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
                            {t("combatAdmin.labels.cancel")}
                        </button>

                        <button className="btn btn-primary" onClick={confirmHpEdit}>
                            {t("combatAdmin.labels.confirm")}
                        </button>
                    </div>
                </div>
            </dialog>
        );
    }

    function renderEditMpModal() {
        if (!editingMp) return null;

        return (
            <dialog className="modal modal-open">
                <div className="modal-box space-y-4">
                    <h3 className="font-bold text-lg">{t("combatAdmin.labels.changeMp")}</h3>

                    <p className="text-sm opacity-80">
                        {t("combatAdmin.labels.currentMp")}: <span className="font-mono">{editingMp.currentMp}</span><br />
                        {t("combatAdmin.labels.maxMp")}: <span className="font-mono">{editingMp.maxMp}</span>
                    </p>

                    <input
                        type="number"
                        className="input input-bordered w-full"
                        value={newMpValue}
                        min={0}
                        max={editingMp.maxMp}
                        onChange={(e) => setNewMpValue(e.target.value)}
                    />

                    <div className="modal-action">
                        <button className="btn" onClick={() => setEditingMp(null)}>
                            {t("combatAdmin.labels.cancel")}
                        </button>

                        <button className="btn btn-primary" onClick={confirmMpEdit}>
                            {t("combatAdmin.labels.confirm")}
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
                    <h3 className="font-bold text-lg">{t("combatAdmin.labels.editGradientCharges")}</h3>

                    <p className="text-sm opacity-80">
                        {t("combatAdmin.labels.team")}: <span className="font-mono">{editingTeamIsEnemy ? t("combatAdmin.labels.teamBEnemies") : t("combatAdmin.labels.teamAAllies")}</span>
                    </p>

                    <div>
                        <label className="label">
                            <span className="label-text">{t("combatAdmin.labels.chargesRange")}</span>
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
                            {t("combatAdmin.labels.cancel")}
                        </button>

                        <button className="btn btn-primary" onClick={handleConfirmGradient}>
                            {t("combatAdmin.labels.confirm")}
                        </button>
                    </div>
                </div>
            </dialog>
        );
    }

    function renderGustaveChargeModal() {
        if (!showGustaveChargeModal) return null;

        const activeChar = getActiveTurnCharacter();
        const maxCharges = activeChar?.maxChargePoints ?? 10;

        return (
            <dialog className="modal modal-open">
                <div className="modal-box space-y-4">
                    <h3 className="font-bold text-lg">{t("combatAdmin.labels.editGustaveCharges")}</h3>

                    <div>
                        <label className="label">
                            <span className="label-text">{t("combatAdmin.labels.charges")} (0-{maxCharges})</span>
                        </label>
                        <input
                            type="number"
                            className="input input-bordered w-full"
                            value={gustaveChargePoints}
                            min={0}
                            max={maxCharges}
                            onChange={(e) => setGustaveChargePoints(parseInt(e.target.value) || 0)}
                        />
                    </div>

                    <div className="modal-action">
                        <button className="btn" onClick={() => setShowGustaveChargeModal(false)}>
                            {t("combatAdmin.labels.cancel")}
                        </button>

                        <button className="btn btn-primary" onClick={handleConfirmGustaveCharge}>
                            {t("combatAdmin.labels.confirm")}
                        </button>
                    </div>
                </div>
            </dialog>
        );
    }

    function renderScielChargesModal() {
        if (!showScielChargesModal) return null;

        return (
            <dialog className="modal modal-open">
                <div className="modal-box space-y-4">
                    <h3 className="font-bold text-lg">{t("combatAdmin.labels.editScielCharges")}</h3>

                    <div>
                        <label className="label">
                            <span className="label-text">{t("combatAdmin.labels.sunCharges")} (0-20)</span>
                        </label>
                        <input
                            type="number"
                            className="input input-bordered w-full"
                            value={scielSunCharges}
                            min={0}
                            max={20}
                            onChange={(e) => setScielSunCharges(parseInt(e.target.value) || 0)}
                        />
                    </div>

                    <div>
                        <label className="label">
                            <span className="label-text">{t("combatAdmin.labels.moonCharges")} (0-20)</span>
                        </label>
                        <input
                            type="number"
                            className="input input-bordered w-full"
                            value={scielMoonCharges}
                            min={0}
                            max={20}
                            onChange={(e) => setScielMoonCharges(parseInt(e.target.value) || 0)}
                        />
                    </div>

                    <div>
                        <label className="label">
                            <span className="label-text">{t("combatAdmin.labels.twilightEclipse")} (0 = inativo)</span>
                        </label>
                        <input
                            type="number"
                            className="input input-bordered w-full"
                            value={scielTwilight}
                            min={0}
                            max={40}
                            onChange={(e) => setScielTwilight(parseInt(e.target.value) || 0)}
                        />
                    </div>

                    {scielTwilight > 0 && (
                        <div>
                            <label className="label">
                                <span className="label-text">{t("combatAdmin.labels.twilightTurns")}</span>
                            </label>
                            <input
                                type="number"
                                className="input input-bordered w-full"
                                value={scielTwilightTurns}
                                min={1}
                                max={99}
                                onChange={(e) => setScielTwilightTurns(parseInt(e.target.value) || 1)}
                            />
                        </div>
                    )}

                    <div className="modal-action">
                        <button className="btn" onClick={() => setShowScielChargesModal(false)}>
                            {t("combatAdmin.labels.cancel")}
                        </button>

                        <button className="btn btn-primary" onClick={handleConfirmScielCharges}>
                            {t("combatAdmin.labels.confirm")}
                        </button>
                    </div>
                </div>
            </dialog>
        );
    }

    function renderLuneStainsModal() {
        if (!showLuneStainsModal) return null;

        const stainOptions: { value: StainType | ""; label: string }[] = [
            { value: "", label: t("combatAdmin.labels.stainEmpty") },
            { value: "Lightning", label: t("combatAdmin.labels.stainLightning") },
            { value: "Earth", label: t("combatAdmin.labels.stainEarth") },
            { value: "Fire", label: t("combatAdmin.labels.stainFire") },
            { value: "Ice", label: t("combatAdmin.labels.stainIce") },
            { value: "Light", label: t("combatAdmin.labels.stainLight") },
        ];

        const stainImageMap: Record<string, string> = {
            Lightning: "/stains/lightning-stain.png",
            Earth: "/stains/earth-stain.png",
            Fire: "/stains/fire-stain.png",
            Ice: "/stains/ice-stain.png",
            Light: "/stains/light-stain.png"
        };

        return (
            <dialog className="modal modal-open">
                <div className="modal-box space-y-4">
                    <h3 className="font-bold text-lg">{t("combatAdmin.labels.editLuneStains")}</h3>

                    {[0, 1, 2, 3].map((idx) => (
                        <div key={idx} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg border border-base-300 flex items-center justify-center bg-base-200">
                                {luneStains[idx] ? (
                                    <img src={stainImageMap[luneStains[idx]!]} alt={luneStains[idx]!} className="w-7 h-7" />
                                ) : (
                                    <span className="text-base-content/40">—</span>
                                )}
                            </div>
                            <select
                                className="select select-bordered flex-1"
                                value={luneStains[idx] ?? ""}
                                onChange={(e) => {
                                    const newStains = [...luneStains];
                                    newStains[idx] = e.target.value === "" ? null : e.target.value as StainType;
                                    setLuneStains(newStains);
                                }}
                            >
                                {stainOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    ))}

                    <div className="modal-action">
                        <button className="btn" onClick={() => setShowLuneStainsModal(false)}>
                            {t("combatAdmin.labels.cancel")}
                        </button>
                        <button className="btn btn-primary" onClick={handleConfirmLuneStains}>
                            {t("combatAdmin.labels.confirm")}
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
                            <h3 className="font-bold text-lg">{t("combatAdmin.labels.addToTeam", { team: targetTeam })}</h3>
                            <p className="text-sm opacity-70">{t("combatAdmin.labels.selectCombatParticipants")}</p>
                        </div>
                        <button className="btn btn-sm btn-ghost" onClick={closeAddModal}>
                            ✕
                        </button>
                    </div>

                    <div className="form-control">
                        <label className="label flex items-center gap-4">
                            <span className="label-text text-sm font-semibold">{t("combatAdmin.labels.filter")}</span>
                            <input
                                type="text"
                                className="input input-bordered input-sm flex-1"
                                placeholder={t("combatAdmin.labels.filterPlaceholder")}
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                            />
                        </label>
                    </div>

                    <div className="border rounded-lg">
                        <div className="px-4 py-2 border-b flex items-center justify-between">
                            <div className="font-semibold text-sm">{t("combatAdmin.labels.players")}</div>
                            <div className="flex items-center gap-2">
                                <button className="btn btn-xs btn-secondary" onClick={() => handleAddAllPlayers(filteredPlayers)}>
                                    {t("combatAdmin.labels.addAll")}
                                </button>
                                {bulkAdded ? <span className="text-xs text-success font-semibold">{t("combatAdmin.labels.added")}!</span> : null}
                            </div>
                        </div>

                        <div className="overflow-x-auto max-h-[28vh] overflow-y-auto">
                            <table className="table table-compact table-xs w-full">
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>{t("combatAdmin.labels.name")}</th>
                                        <th>{t("combatAdmin.labels.character")}</th>
                                        <th className="w-1/6 text-right">{t("combatAdmin.labels.actions")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPlayers.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="text-center text-sm opacity-60 py-6">
                                                {t("combatAdmin.labels.noPlayersFound")}
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
                                                            {t("combatAdmin.labels.add")}
                                                        </button>
                                                        {justAddedId === entity.externalId ? (
                                                            <span className="text-xs text-success font-semibold">{t("combatAdmin.labels.added")}!</span>
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
                        <div className="px-4 py-2 border-b font-semibold text-sm">{t("combatAdmin.labels.npcs")}</div>
                        <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
                            <table className="table table-compact table-xs w-full">
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th
                                            className="cursor-pointer hover:bg-base-200 select-none"
                                            onClick={() => handleSort("name")}
                                        >
                                            {t("combatAdmin.labels.name")} {getSortIcon("name")}
                                        </th>
                                        <th
                                            className="text-center cursor-pointer hover:bg-base-200 select-none"
                                            onClick={() => handleSort("difficulty")}
                                        >
                                            {t("combatAdmin.labels.difficulty")} {getSortIcon("difficulty")}
                                        </th>
                                        <th className="w-1/6 text-right">{t("combatAdmin.labels.actions")}</th>
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
                                                            {t("combatAdmin.labels.add")}
                                                        </button>
                                                        {justAddedId === entity.externalId ? (
                                                            <span className="text-xs text-success font-semibold">{t("combatAdmin.labels.added")}!</span>
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
            <RollHistoryToast />
            <FloatingDiceRoller diceBoardRef={diceBoardRef} timeoutDiceBoardRef={timeoutDiceBoardRef} />

            <div className="flex flex-col gap-4">
                    <div className="flex flex-col items-start gap-2">
                        <div className="text-lg font-semibold">Combate #{battleId}</div>

                        <div className="form-control w-full max-w-xs">
                            <label className="label">
                                <span className="label-text font-semibold">{t("combatAdmin.labels.combatStatus")}</span>
                            </label>

                            <div className="flex items-center gap-3">
                                <span className="text-sm">
                                    {battleStatus === 'starting'
                                        ? t("combatAdmin.statusLabels.waitingToStart")
                                        : battleStatus === 'started'
                                            ? t("combatAdmin.statusLabels.inProgress")
                                            : t("combatAdmin.statusLabels.finished")}
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
                                        {battleStatus === 'starting' ? t("combatAdmin.statusLabels.startBattle") : t("combatAdmin.statusLabels.endBattle")}
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
                                                <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-base-200">
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
                                                                    showToast(t("combatAdmin.toasts.errorClaimingReward"));
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

                            {/* Rank de Perfeição do Verso - só aparece se for a vez do Verso */}
                            {(() => {
                                const activeChar = getActiveTurnCharacter();
                                const isVerso = activeChar && (
                                    activeChar.id?.toLowerCase() === "verso" ||
                                    activeChar.id?.toLowerCase().includes("verso")
                                );
                                if (!isVerso) return null;

                                const currentRank = activeChar.perfectionRank ?? "D";
                                const rankProgress = activeChar.rankProgress ?? 0;
                                const ranks = ["D", "C", "B", "A", "S"] as const;

                                const rankActiveColors: Record<string, string> = {
                                    "D": "bg-gray-500 text-white border-gray-500",
                                    "C": "bg-amber-400 text-black border-amber-400",
                                    "B": "bg-blue-500 text-white border-blue-500",
                                    "A": "bg-purple-500 text-white border-purple-500",
                                    "S": "bg-red-500 text-white border-red-500"
                                };
                                const rankOutlineColors: Record<string, string> = {
                                    "D": "border border-gray-500 text-gray-400 bg-transparent",
                                    "C": "border border-amber-400 text-amber-300 bg-transparent",
                                    "B": "border border-blue-500 text-blue-400 bg-transparent",
                                    "A": "border border-purple-500 text-purple-400 bg-transparent",
                                    "S": "border border-red-500 text-red-400 bg-transparent"
                                };

                                const handleRankChange = async (newRank: string) => {
                                    await APIBattle.updateCharacterRank(activeChar.battleID, newRank, 0);
                                    reloadBattleDetails();
                                };

                                return (
                                    <div className="w-full max-w-none self-stretch min-w-0 rounded-xl border border-base-300 bg-base-100 shadow-md p-3 mt-2">
                                        <div>
                                            <div className="flex items-center justify-between text-sm mb-3">
                                                <span>{t("combatAdmin.labels.versoPerfectionRank")}</span>
                                                <span className="text-xs opacity-60 font-mono">{rankProgress} pts</span>
                                            </div>
                                            <div className="flex gap-2">
                                                {ranks.map(rank => (
                                                    <button
                                                        key={rank}
                                                        className={`btn btn-sm flex-1 ${currentRank === rank ? rankActiveColors[rank] : rankOutlineColors[rank]}`}
                                                        onClick={() => handleRankChange(rank)}
                                                    >
                                                        {rank}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Barra de Cargas do Gustave - só aparece se o personagem ativo for Gustave */}
                            {(() => {
                                const activeChar = getActiveTurnCharacter();
                                const isGustave = activeChar && (
                                    activeChar.id?.toLowerCase() === "gustave" ||
                                    activeChar.id?.toLowerCase().includes("gustave")
                                );
                                if (!isGustave || activeChar.maxChargePoints === undefined) return null;

                                const chargePoints = activeChar.chargePoints ?? 0;
                                const maxChargePoints = activeChar.maxChargePoints ?? 10;
                                const pct = Math.max(0, Math.min(100, Math.round((chargePoints / maxChargePoints) * 100)));

                                return (
                                    <div className="w-full max-w-none self-stretch min-w-0 rounded-xl border border-base-300 bg-base-100 shadow-md p-3 mt-2">
                                        <div>
                                            <div className="flex items-center justify-between text-sm mb-2">
                                                <span>{t("combatAdmin.labels.gustaveCharges")}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold">{chargePoints}/{maxChargePoints}</span>
                                                    <button
                                                        onClick={() => handleOpenGustaveChargeModal(activeChar)}
                                                        className="btn btn-xs btn-ghost"
                                                        title={t("combatAdmin.labels.editGustaveCharges")}
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                </div>
                                            </div>
                                            <AnimatedStatBar
                                                value={pct}
                                                label={t("combatAdmin.labels.charges")}
                                                fillClass="bg-yellow-500"
                                                ghostClass="bg-yellow-500/30"
                                            />
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Cargas de Sol/Lua da Sciel - só aparece se for a vez da Sciel */}
                            {(() => {
                                const activeChar = getActiveTurnCharacter();
                                const isSciel = activeChar && (
                                    activeChar.id?.toLowerCase() === "sciel" ||
                                    activeChar.id?.toLowerCase().includes("sciel")
                                );
                                if (!isSciel) return null;

                                const sunCharges = activeChar.sunCharges ?? 0;
                                const moonCharges = activeChar.moonCharges ?? 0;
                                const twilightStatus = activeChar.status?.find(s => s.effectName === "Twilight");

                                return (
                                    <div className="w-full max-w-none self-stretch min-w-0 rounded-xl border border-base-300 bg-base-100 shadow-md p-3 mt-2">
                                        <div>
                                            <div className="flex items-center justify-between text-sm mb-2">
                                                <span>{t("combatAdmin.labels.scielCharges")}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold">☀️ {sunCharges} / 🌙 {moonCharges}</span>
                                                    {twilightStatus && (
                                                        <span className="badge bg-purple-600 text-white border-purple-600 badge-sm">{t("combatAdmin.labels.twilightActive")} {twilightStatus.ammount} ({twilightStatus.remainingTurns})</span>
                                                    )}
                                                    <button
                                                        onClick={() => handleOpenScielChargesModal(activeChar)}
                                                        className="btn btn-xs btn-ghost"
                                                        title={t("combatAdmin.labels.editScielCharges")}
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <AnimatedStatBar
                                                    value={Math.min(100, sunCharges * 5)}
                                                    label={`☀️ ${sunCharges}`}
                                                    fillClass="bg-amber-400"
                                                    ghostClass="bg-amber-400/30"
                                                />
                                                <AnimatedStatBar
                                                    value={Math.min(100, moonCharges * 5)}
                                                    label={`🌙 ${moonCharges}`}
                                                    fillClass="bg-indigo-400"
                                                    ghostClass="bg-indigo-400/30"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Manchas da Lune - só aparece se for a vez da Lune */}
                            {(() => {
                                const activeChar = getActiveTurnCharacter();
                                const isLuneTurn = activeChar && (
                                    activeChar.id?.toLowerCase() === "lune" ||
                                    activeChar.id?.toLowerCase().includes("lune")
                                );
                                if (!isLuneTurn) return null;

                                const stainSlots = [
                                    activeChar.stainSlot1,
                                    activeChar.stainSlot2,
                                    activeChar.stainSlot3,
                                    activeChar.stainSlot4
                                ];

                                const stainImageMap: Record<string, string> = {
                                    Lightning: "/stains/lightning-stain.png",
                                    Earth: "/stains/earth-stain.png",
                                    Fire: "/stains/fire-stain.png",
                                    Ice: "/stains/ice-stain.png",
                                    Light: "/stains/light-stain.png"
                                };

                                return (
                                    <div className="w-full max-w-none self-stretch min-w-0 rounded-xl border border-base-300 bg-base-100 shadow-md p-3 mt-2">
                                        <div className="flex items-center justify-between text-sm mb-2">
                                            <span>{t("combatAdmin.labels.luneStains")}</span>
                                            <button
                                                onClick={() => handleOpenLuneStainsModal(activeChar)}
                                                className="btn btn-xs btn-ghost"
                                                title={t("combatAdmin.labels.editLuneStains")}
                                            >
                                                <FaEdit />
                                            </button>
                                        </div>
                                        <div className="flex gap-3 justify-center">
                                            {stainSlots.map((stain, idx) => (
                                                <div
                                                    key={idx}
                                                    className="w-12 h-12 rounded-lg border border-base-300 flex items-center justify-center bg-base-200"
                                                >
                                                    {stain ? (
                                                        <img
                                                            src={stainImageMap[stain]}
                                                            alt={stain}
                                                            className="w-8 h-8"
                                                        />
                                                    ) : (
                                                        <span className="text-base-content/40 text-xs">—</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Barra de Postura da Maelle - só aparece se for a vez da Maelle */}
                            {(() => {
                                const activeChar = getActiveTurnCharacter();
                                const isMaelleTurn = activeChar && (
                                    activeChar.id?.toLowerCase() === "maelle" ||
                                    activeChar.id?.toLowerCase().includes("maelle")
                                );
                                if (!isMaelleTurn) return null;

                                const maelleChar = activeChar;

                                const currentStance = maelleChar.stance;
                                const stanceLabels: Record<string, string> = {
                                    "Offensive": t("combatAdmin.stances.offensive"),
                                    "Defensive": t("combatAdmin.stances.defensive"),
                                    "Virtuous": t("combatAdmin.stances.virtuous")
                                };
                                const stanceColors: Record<string, string> = {
                                    "Offensive": "btn-error",
                                    "Defensive": "btn-info",
                                    "Virtuous": "bg-purple-500 text-white border-purple-500"
                                };

                                const handleStanceChange = async (newStance: "Offensive" | "Defensive" | "Virtuous") => {
                                    await APIBattle.updateCharacterStance(maelleChar.battleID, newStance);
                                    showToast(t("combatAdmin.toasts.stanceChanged", { stance: stanceLabels[newStance] }));
                                    reloadBattleDetails();
                                };

                                return (
                                    <div className="w-full max-w-none self-stretch min-w-0 rounded-xl border border-base-300 bg-base-100 shadow-md p-3 mt-2">
                                        <div>
                                            <div className="flex items-center justify-between text-sm mb-3">
                                                <span>{t("combatAdmin.labels.maelleStance")}</span>
                                                <span className={`badge ${currentStance ? stanceColors[currentStance] : "badge-ghost"}`}>
                                                    {currentStance ? stanceLabels[currentStance] : t("combatAdmin.stances.none")}
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    className={`btn btn-sm flex-1 ${currentStance === "Offensive" ? "btn-error" : "btn-outline btn-error"}`}
                                                    onClick={() => handleStanceChange("Offensive")}
                                                >
                                                    {t("combatAdmin.stances.offensive")}
                                                </button>
                                                <button
                                                    className={`btn btn-sm flex-1 ${currentStance === "Defensive" ? "btn-info" : "btn-outline btn-info"}`}
                                                    onClick={() => handleStanceChange("Defensive")}
                                                >
                                                    {t("combatAdmin.stances.defensive")}
                                                </button>
                                                <button
                                                    className={`btn btn-sm flex-1 ${currentStance === "Virtuous" ? "bg-purple-500 text-white border-purple-500 hover:bg-purple-600" : "btn-outline border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white"}`}
                                                    onClick={() => handleStanceChange("Virtuous")}
                                                >
                                                    {t("combatAdmin.stances.virtuous")}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </>
                    )}

                    {/* Equipes A e B - sempre visíveis */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {renderAttackOptions()}
                        {renderActionOptions()}
                        {renderTeamCard(t("combatAdmin.labels.teamA"), "A", teamA)}
                        {renderTeamCard(t("combatAdmin.labels.teamB"), "B", teamB)}
                    </div>

                    {renderEditEntityModal()}
                    {renderEditMpModal()}
                    <StatusConditionsModal
                        open={effectsModalCharId !== null}
                        onClose={async () => {
                            setEffectsModalCharId(null);
                            if (battleId) {
                                const freshData = await APIBattle.getById(battleId);
                                setBattleDetails(freshData);
                            }
                        }}
                        battleCharacterId={effectsModalCharId ?? 0}
                        statuses={effectsModalStatuses}
                    />
                    {renderGradientModal()}
                    {renderGustaveChargeModal()}
                    {renderScielChargesModal()}
                    {renderLuneStainsModal()}
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
            "TURN_DELAYED",
            "TURNS_REORDERED",
            "ATTACK_PENDING",
            "ALLOW_COUNTER",
            "COUNTER_RESOLVED",
            "STATUS_RESOLVED",
            "STATUS_ADDED",
            "STATUS_REMOVED",
            "STATUS_EXTENDED",
            "HP_CHANGED",
            "MAX_HP_CHANGED",
            "MP_CHANGED",
            "MP_RECOVERED",
            "AP_CHANGED",
            "GRADIENT_CHANGED",
            "CHARGE_POINTS_CHANGED",
            "STAINS_CHANGED",
            "STANCE_CHANGED",
            "RANK_CHANGED",
            "FLEEING",
            "HEAL_APPLIED",
            "STATUS_CLEANSED",
            "BREAK_APPLIED",
            "AUTO_DEATH",
            "PICTO_EFFECT_TRACKED",
            "PICTO_EFFECTS_CLEARED",
            "PICTO_EFFECTS_RESET"
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

    function npcCustomAttackTapped(npcAttack: NPCAttack, index: number) {
        setNPCSpecialAttack(null)
        setNpcSpecialAttackIndex(null)
        setAttackType(npcAttack.type)
        setNPCAttack(npcAttack)
        setNpcAttackIndex(index)
        startTargeting(npcAttack.type)
    }

    function npcSpecialAttackTapped(skill: NPCSpecialAttack, index: number) {
        setAttackType(null)
        setNPCAttack(null)
        setNpcAttackIndex(null)
        setNPCSpecialAttack(skill)
        setNpcSpecialAttackIndex(index)
        startTargeting(undefined)
    }

    function npcAttackTapped(type: AttackType) {
        setNPCSpecialAttack(null)
        setNpcSpecialAttackIndex(null)
        setNpcAttackIndex(null)
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

    function handleMultipleAttack() {
        setIsSelectingTarget(false);
    }

    function handleTargetSelected(targetEntity: CombatEntity) {
        setIsSelectingTarget(false);
        setNPCAttack(null);
        setAttackType(null);
        setNpcAttackIndex(null);
        setNPCSpecialAttack(null);
        setNpcSpecialAttackIndex(null);
    }

    function handleSpecialAttackTargetSelected(targetEntity: CombatEntity) {
        setIsSelectingTarget(false);
    }

    function npcPassTurnTapped() {
        const endTurnCall = async () => {
            setIsPassingTurn(true);
            try {
                const character = getActiveTurnCharacter()
                await APIBattle.endTurn(character?.battleID ?? 0)
                await reloadBattleDetails(true);
            } catch (e) {
                showToast(t("combatAdmin.toasts.errorEndingTurn"));
            } finally {
                setIsPassingTurn(false);
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
                showToast(t("combatAdmin.toasts.errorEndingTurn"));
            }
        };

        allowCounterCall();
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
            showToast(t("combatAdmin.toasts.hpUpdated"))
        } catch (e) {
            console.error(e)
            showToast(t("combatAdmin.toasts.errorUpdatingHp"))
        }
    }

    function openMpEditModal(entity: CombatEntity) {
        setEditingMp(entity);
        setNewMpValue((entity.currentMp ?? 0).toString());
    }

    function confirmMpEdit() {
        const value = parseInt(newMpValue, 10);
        if (!isNaN(value) && editingMp) {
            handleMpSet(editingMp, value);
        }
        setEditingMp(null);
    }

    async function handleMpSet(entity: CombatEntity, value: number) {
        try {
            await APIBattle.updateCharacterMp(entity.rowId ?? 0, value)
            showToast(t("combatAdmin.toasts.mpUpdated"))
        } catch (e) {
            console.error(e)
            showToast(t("combatAdmin.toasts.errorUpdatingMp"))
        }
    }
}
