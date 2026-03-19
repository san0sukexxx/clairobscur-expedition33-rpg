import React from "react";
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import { APIBattle, type AddBattleCharacterInitiativeData } from "../api/APIBattle"
import { APIEncounter, type EncounterResponse } from "../api/APIEncounter"
import { APIPicto } from "../api/APIPicto"
import { type GetPlayerResponse } from "../api/APIPlayer"
import { FaUser, FaSkull, FaEdit, FaSort, FaSortUp, FaSortDown, FaChevronDown, FaChevronUp, FaCheck } from "react-icons/fa"
import { FaFistRaised, FaArrowUp, FaFireAlt, FaHourglassHalf, FaShieldAlt, FaUndo, FaMinus, FaPlus } from "react-icons/fa";
import { FaArrowsDownToLine, FaArrowDown } from "react-icons/fa6";
import { getCharacterLabelById, applyNpcNameSuffixes, CHARACTERS_LIST } from "../utils/CharacterUtils"
import { getNPCMaxHealth, randomizeNpcInitiativeTotal, npcIsFlyingById } from "../utils/NpcCalculator"
import { getAbilityModifier } from "../utils/AttackCalculator"
import { getElementName, ELEMENT_EMOTE, hasElement, toElementArray } from "../utils/ElementUtils"
import { dispatchRoll } from "../utils/rollDispatcher"
import { diceTotal } from "../utils/DiceCalculator"
import { APIGameLog } from "../api/APIGameLog"
import { calculateMaxHP, calculateMaxMP, calculateInitialMP, calculateArmorClass } from "../utils/PlayerCalculator"
import { getAllNPCsSorted, getNpcById, handleNpcImgError } from "../utils/NpcUtils"
import { getIntensityDiceCount, type BattleCharacterType, type BattleCharacterInfo, type AttackType, type WeaponInfo, type NPCAttack, type StatusResponse, type SpecialAttackType, type NPCSpecialAttack, type StainType } from "../api/ResponseModel"
import { type Campaign } from "../api/APICampaign"
import { type BattleWithDetailsResponse } from "../api/APIBattle"
import InitiativesQueue from "./InitiativesQueue"
import GradientBar from "./GradientBar"
import AnimatedStatBar from "./AnimatedStatBar"
import DiceBoard, { type DiceBoardRef } from "../components/DiceBoard";
import { RollHistoryToast } from "../components/RollHistoryToast";
import { FloatingDiceRoller } from "../components/FloatingDiceRoller";
import { StatusConditionsModal } from "./StatusConditionsModal";
import { HpEditModal } from "./HpEditModal";
import { ApEditModal } from "./ApEditModal";
import { useToast } from "../components/Toast";
import { WeaponsDataLoader } from "../utils/WeaponsDataLoader";
import { calculateNPCDifficulty, formatCR, crToXp } from "../utils/NpcDifficulty";
import { renderTextWithDiceButtons } from "../utils/DiceTextRenderer";
import { getAttackTypeLabel, getSpecialAttackLabel, getStatusLabel, shouldShowStatusAmmount, generateActionDescription, generateBasicAttackDescription } from "../utils/BattleUtils";
import { t, getWeaponName, getPictoName, toKebabCase, getWeaponEnglishName, getPictoEnglishName, getLocationName, getWeaponPassive, getPictoDescription } from "../i18n";
import type { BattleReward } from "../api/ResponseModel";
import { APIRewards } from "../api/APIRewards";
import { PictosList } from "../data/PictosList";
import { pictoColorHex, calculatePictoSpeed, calculatePictoHealth, calculatePictoDefense, calculatePictoAbility } from "../utils/PictoUtils";
import { SpecialAttacksList } from "../data/SpecialAttackList";
import { getLocationById } from "../utils/LocationUtils";
import NpcImageModal from "./NpcImageModal";


const canCharacterUseWeapon = WeaponsDataLoader.canCharacterUseWeapon.bind(WeaponsDataLoader);

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
    breakCount?: number
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


export default function CombatAdmin({
    campaignInfo,
    battleId,
    initialStatus,
    players,
    onStatusChanged
}: CombatAdminProps) {
    const focusRef = useCallback((node: HTMLInputElement | null) => {
        if (node) setTimeout(() => node.focus(), 50);
    }, []);

    const [battleDetails, setBattleDetails] = useState<BattleWithDetailsResponse | null>(null)
    const [battleStatus, setBattleStatus] = useState<string>(initialStatus)
    const [updatingStatus, setUpdatingStatus] = useState<boolean>(false)
    const [imageModalNpc, setImageModalNpc] = useState<{ id: string; name: string } | null>(null)
    const [showAddModal, setShowAddModal] = useState<boolean>(false)
    const [targetTeam, setTargetTeam] = useState<TeamKey>("A")
    const [filterText, setFilterText] = useState<string>("")
    const [currentLocationOnly, setCurrentLocationOnly] = useState(() => localStorage.getItem("combatAdmin.currentLocationOnly") === "true")
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
    const [npcIntensityOffset, setNpcIntensityOffset] = useState(0)
    const diceBoardRef = useRef<DiceBoardRef>(null)
    const timeoutDiceBoardRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { showToast } = useToast();
    const [editingHp, setEditingHp] = useState<CombatEntity | null>(null);
    const [editingMp, setEditingMp] = useState<CombatEntity | null>(null);
    const [sortColumn, setSortColumn] = useState<"name" | "difficulty" | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [battleRewards, setBattleRewards] = useState<BattleReward[]>([]);
    const [encounterBonusXp, setEncounterBonusXp] = useState(0);
    const [showGradientModal, setShowGradientModal] = useState(false);
    const [gradientCharges, setGradientCharges] = useState("");
    const [gradientCurrentCharges, setGradientCurrentCharges] = useState(0);
    const [editingTeamIsEnemy, setEditingTeamIsEnemy] = useState(false);
    const [pendingBreak, setPendingBreak] = useState<{ entity: CombatEntity; breakIndex: number } | null>(null);
    const [editBreakValue, setEditBreakValue] = useState(0);
    const [showGustaveChargeModal, setShowGustaveChargeModal] = useState(false);
    const [gustaveChargePoints, setGustaveChargePoints] = useState("");
    const [gustaveCurrentChargePoints, setGustaveCurrentChargePoints] = useState(0);
    const [editingGustaveCharacterId, setEditingGustaveCharacterId] = useState<number | null>(null);
    const [showScielChargesModal, setShowScielChargesModal] = useState(false);
    const [scielSunCharges, setScielSunCharges] = useState("");
    const [scielMoonCharges, setScielMoonCharges] = useState("");
    const [scielTwilight, setScielTwilight] = useState("");
    const [scielTwilightTurns, setScielTwilightTurns] = useState("");
    const [scielCurrentSun, setScielCurrentSun] = useState(0);
    const [scielCurrentMoon, setScielCurrentMoon] = useState(0);
    const [scielCurrentTwilight, setScielCurrentTwilight] = useState(0);
    const [scielCurrentTwilightTurns, setScielCurrentTwilightTurns] = useState(2);
    const [editingScielCharacterId, setEditingScielCharacterId] = useState<number | null>(null);
    const [showLuneStainsModal, setShowLuneStainsModal] = useState(false);
    const [luneStains, setLuneStains] = useState<(StainType | null)[]>([null, null, null, null]);
    const [editingLuneCharacterId, setEditingLuneCharacterId] = useState<number | null>(null);
    const [isPassingTurn, setIsPassingTurn] = useState(false);
    const [npcStatBlockOpen, setNpcStatBlockOpen] = useState(false);
    const [effectsModalCharId, setEffectsModalCharId] = useState<number | null>(null);
    const [effectsModalStatuses, setEffectsModalStatuses] = useState<StatusResponse[]>([]);
    const [expandedAdminStatus, setExpandedAdminStatus] = useState<string | null>(null);
    const [expandedNpcRowId, setExpandedNpcRowId] = useState<number | null>(null);
    const [encounters, setEncounters] = useState<EncounterResponse[]>([]);
    const [selectedEncounterId, setSelectedEncounterId] = useState<number | null>(null);
    const [loadingEncounter, setLoadingEncounter] = useState(false);
    const [showEncounterModal, setShowEncounterModal] = useState(false);
    const [encounterFilter, setEncounterFilter] = useState("");
    const [encounterLocationOnly, setEncounterLocationOnly] = useState(() => localStorage.getItem("combatAdmin.encounterLocationOnly") === "true");
    const [localPlayers, setLocalPlayers] = useState(players);

    const lastReloadTimeRef = useRef<number>(0)
    const isReloadingRef = useRef<boolean>(false)

    // Função para coletar recompensas do encontro associado à batalha
    const collectBattleRewards = useCallback(async (encounterId?: number, characters?: BattleCharacterInfo[]) => {
        if (!encounterId || !characters) return [];

        // Verificar se há algum jogador vivo
        const hasAlivePlayer = characters.some(
            ch => ch.type === "player" && ch.healthPoints > 0
        );

        if (!hasAlivePlayer) {
            return []; // Sem recompensas se todos os jogadores morreram
        }

        try {
            const encounter = await APIEncounter.getById(encounterId);
            setEncounterBonusXp(encounter.bonusXp ?? 0);
            return encounter.rewards.map(r => ({
                type: r.rewardType as BattleReward["type"],
                itemId: r.itemId,
                level: r.level,
            }));
        } catch {
            return [];
        }
    }, []);

    // Coletar recompensas quando a batalha estiver finalizada (ao carregar ou recarregar a página)
    useEffect(() => {
        if (battleStatus === 'finished' && battleDetails?.characters && battleRewards.length === 0) {
            collectBattleRewards(battleDetails.encounterId, battleDetails.characters).then(rewards => {
                if (rewards.length > 0) {
                    setBattleRewards(rewards);
                }
            });
        }
    }, [battleStatus, battleDetails?.characters, battleDetails?.encounterId, battleRewards.length, collectBattleRewards]);

    // Drops dos NPCs que estavam na batalha
    const npcDrops = useMemo(() => {
        if (battleStatus !== 'finished' || !battleDetails?.characters) return [];
        const hasAlivePlayer = battleDetails.characters.some(ch => ch.type === "player" && ch.healthPoints > 0);
        if (!hasAlivePlayer) return [];

        const drops: BattleReward[] = [];
        const seenIds = new Set<string>();
        for (const ch of battleDetails.characters) {
            if (ch.type !== "npc") continue;
            const npc = getNpcById(ch.id);
            if (!npc?.drops || seenIds.has(npc.id)) continue;
            seenIds.add(npc.id);
            for (const weaponId of npc.drops.weapons ?? []) {
                drops.push({ type: "weapon", itemId: weaponId, level: 1 });
            }
            for (const pictoId of npc.drops.pictos ?? []) {
                drops.push({ type: "picto", itemId: pictoId, level: 1 });
            }
        }
        return drops;
    }, [battleStatus, battleDetails?.characters]);

    const totalBattleXp = useMemo(() => {
        if (!battleDetails?.characters) return encounterBonusXp;
        const npcXp = battleDetails.characters
            .filter(ch => ch.type === "npc")
            .reduce((sum, ch) => sum + crToXp(calculateNPCDifficulty(ch.id)), 0);
        return npcXp + encounterBonusXp;
    }, [battleDetails?.characters, encounterBonusXp]);

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
        setGradientCharges("");
        setGradientCurrentCharges(currentCharges);
        setEditingTeamIsEnemy(isEnemy);
        setShowGradientModal(true);
    }, [battleDetails?.characters]);

    const handleConfirmGradient = useCallback(async () => {
        if (gradientCharges === "") {
            setShowGradientModal(false);
            return;
        }

        const teamCharacter = editingTeamIsEnemy
            ? battleDetails?.characters?.find(ch => ch.isEnemy)
            : battleDetails?.characters?.find(ch => !ch.isEnemy);

        if (!teamCharacter?.battleID) {
            showToast(t("combatAdmin.toasts.noCharacterInTeam"));
            return;
        }

        const charges = parseInt(gradientCharges) || 0;
        const newGradientPoints = charges * 12;

        try {
            await APIBattle.updateTeamGradient(teamCharacter.battleID, newGradientPoints);
            setShowGradientModal(false);
            await reloadBattleDetails();
            showToast(t("combatAdmin.toasts.gradientChargesUpdated", { charges }));
        } catch (error) {
            console.error("Erro ao atualizar gradiente:", error);
            showToast(t("combatAdmin.toasts.errorUpdatingGradient"));
        }
    }, [gradientCharges, editingTeamIsEnemy, battleDetails?.characters, reloadBattleDetails, showToast]);

    const handleOpenGustaveChargeModal = useCallback((character: BattleCharacterInfo) => {
        setGustaveChargePoints("");
        setGustaveCurrentChargePoints(character.chargePoints ?? 0);
        setEditingGustaveCharacterId(character.battleID);
        setShowGustaveChargeModal(true);
    }, []);

    const handleConfirmGustaveCharge = useCallback(async () => {
        if (gustaveChargePoints === "") {
            setShowGustaveChargeModal(false);
            return;
        }

        if (editingGustaveCharacterId === null) {
            showToast(t("combatAdmin.toasts.noCharacterSelected"));
            return;
        }

        const charges = parseInt(gustaveChargePoints) || 0;

        try {
            await APIBattle.updateCharacterChargePoints(editingGustaveCharacterId, charges);
            setShowGustaveChargeModal(false);
            await reloadBattleDetails();
            showToast(t("combatAdmin.toasts.gustaveChargesUpdated", { charges }));
        } catch (error) {
            console.error("Erro ao atualizar cargas:", error);
            showToast(t("combatAdmin.toasts.errorUpdatingCharges"));
        }
    }, [gustaveChargePoints, editingGustaveCharacterId, reloadBattleDetails, showToast]);

    const handleOpenScielChargesModal = useCallback((character: BattleCharacterInfo) => {
        const twilightStatus = character.status?.find(s => s.effectName === "Twilight");
        setScielCurrentSun(character.sunCharges ?? 0);
        setScielCurrentMoon(character.moonCharges ?? 0);
        setScielCurrentTwilight(twilightStatus?.ammount ?? 0);
        setScielCurrentTwilightTurns(twilightStatus?.remainingTurns ?? 2);
        setScielSunCharges("");
        setScielMoonCharges("");
        setScielTwilight("");
        setScielTwilightTurns("");
        setEditingScielCharacterId(character.battleID);
        setShowScielChargesModal(true);
    }, []);

    const handleConfirmScielCharges = useCallback(async () => {
        if (editingScielCharacterId === null) {
            showToast(t("combatAdmin.toasts.noCharacterSelected"));
            return;
        }

        const sunVal = scielSunCharges === "" ? scielCurrentSun : (parseInt(scielSunCharges) || 0);
        const moonVal = scielMoonCharges === "" ? scielCurrentMoon : (parseInt(scielMoonCharges) || 0);
        const twilightVal = scielTwilight === "" ? scielCurrentTwilight : (parseInt(scielTwilight) || 0);
        const twilightTurnsVal = scielTwilightTurns === "" ? scielCurrentTwilightTurns : (parseInt(scielTwilightTurns) || 1);

        try {
            await APIBattle.updateSunMoonCharges(editingScielCharacterId, sunVal, moonVal);

            const currentChar = battleDetails?.characters?.find(ch => ch.battleID === editingScielCharacterId);
            const hadTwilight = currentChar?.status?.some(s => s.effectName === "Twilight") ?? false;

            if (twilightVal > 0 && !hadTwilight) {
                await APIBattle.addStatus({
                    battleCharacterId: editingScielCharacterId,
                    effectType: "Twilight",
                    ammount: twilightVal,
                    remainingTurns: twilightTurnsVal,
                });
            } else if (twilightVal > 0 && hadTwilight) {
                await APIBattle.removeStatus(editingScielCharacterId, "Twilight");
                await APIBattle.addStatus({
                    battleCharacterId: editingScielCharacterId,
                    effectType: "Twilight",
                    ammount: twilightVal,
                    remainingTurns: twilightTurnsVal,
                });
            } else if (twilightVal === 0 && hadTwilight) {
                await APIBattle.removeStatus(editingScielCharacterId, "Twilight");
            }

            setShowScielChargesModal(false);
            await reloadBattleDetails();
            showToast(t("combatAdmin.toasts.scielChargesUpdated"));
        } catch (error) {
            console.error("Erro ao atualizar cargas de Sciel:", error);
            showToast(t("combatAdmin.toasts.errorUpdatingCharges"));
        }
    }, [scielSunCharges, scielMoonCharges, scielTwilight, scielTwilightTurns, scielCurrentSun, scielCurrentMoon, scielCurrentTwilight, scielCurrentTwilightTurns, editingScielCharacterId, battleDetails?.characters, reloadBattleDetails, showToast]);

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

    // Carregar encontros da campanha
    useEffect(() => {
        APIEncounter.listByCampaign(campaignInfo.id).then(setEncounters).catch(() => {});
    }, [campaignInfo.id]);

    // Sync localPlayers com prop players
    useEffect(() => {
        setLocalPlayers(players);
    }, [players]);

    // Se a batalha já tem encounterId (recarregamento), restaurar seleção
    useEffect(() => {
        if (battleDetails?.encounterId && !selectedEncounterId) {
            setSelectedEncounterId(battleDetails.encounterId);
        }
    }, [battleDetails?.encounterId]);

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

        // Apply alphabetic suffixes to duplicate NPCs (A, B, C...)
        applyNpcNameSuffixes(battleDetails.characters);

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
                    status: bc.status,
                    breakCount: bc.breakCount ?? 0
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
                    status: bc.status,
                    breakCount: bc.breakCount ?? 0
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

    // Map real battleIDs to sequential display indices (#1, #2, ...)
    const displayIndex = useMemo(() => {
        const map = new Map<number, number>();
        if (!battleDetails?.characters) return map;
        battleDetails.characters.forEach((bc, i) => {
            map.set(bc.battleID, i + 1);
        });
        return map;
    }, [battleDetails]);

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

            // Ao iniciar a batalha, o primeiro jogador na ordem de turno recebe +1 MP
            if (newStatus === "started") {
                const updated = await APIBattle.getById(battleId);
                if (updated?.turns && updated.characters) {
                    const firstTurn = updated.turns.find(t => t.playOrder === 1);
                    if (firstTurn) {
                        const firstChar = updated.characters.find(c => c.battleID === firstTurn.battleCharacterId);
                        if (firstChar && firstChar.type === "player") {
                            const newMp = Math.min((firstChar.magicPoints ?? 0) + 1, firstChar.maxMagicPoints ?? 999);
                            await APIBattle.updateCharacterMp(firstChar.battleID, newMp);
                            await reloadBattleDetails();
                        }
                    }
                }
            }

            // Se a batalha foi finalizada, buscar os dados atualizados e coletar recompensas
            if (newStatus === "finished") {
                const updatedBattle = await APIBattle.getById(battleId);
                if (updatedBattle?.characters) {
                    const rewards = await collectBattleRewards(updatedBattle.encounterId, updatedBattle.characters);
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
            canRollInitiative: entity.type == "player",
            freeShotWeakPoints: entity.type === "npc" ? (getNpcById(String(entity.externalId))?.freeShotWeakPoints ?? 0) : undefined
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
            const charId = ent.characterId?.toLowerCase() ?? ""
            const isGustave = charId === "gustave" || charId.includes("gustave")
            const isMaelle = charId === "maelle" || charId.includes("maelle")
            const isSciel = charId === "sciel" || charId.includes("sciel")
            const isLune = charId === "lune" || charId.includes("lune")
            const isVerso = charId === "verso" || charId.includes("verso")
            const isMonoco = charId === "monoco" || charId.includes("monoco")
            const randomBestialPosition = isMonoco ? Math.floor(Math.random() * 9) : undefined

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
                canRollInitiative: ent.type == "player",
                freeShotWeakPoints: ent.type === "npc" ? (getNpcById(String(ent.externalId))?.freeShotWeakPoints ?? 0) : undefined
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

    async function handleLoadEncounter(encounterId: number) {
        if (!battleId) return;
        setLoadingEncounter(true);
        try {
            const encounter = await APIEncounter.getById(encounterId);

            // Atualizar a batalha com o encounterId
            await APIBattle.update(battleId, { battleStatus: battleStatus, encounterId });

            // Limpar equipe B antes de adicionar os NPCs do encontro
            for (const member of teamB) {
                if (member.rowId) {
                    await APIBattle.removeCharacter(member.rowId);
                }
            }

            // Para cada NPC no encontro, adicionar diretamente à equipe B
            for (const encounterNpc of encounter.npcs) {
                const npcInfo = getNpcById(encounterNpc.npcId);
                if (!npcInfo) continue;

                for (let i = 0; i < encounterNpc.quantity; i++) {
                    const initiative: AddBattleCharacterInitiativeData = {
                        initiativeValue: randomizeNpcInitiativeTotal(npcInfo),
                        hability: Math.floor((npcInfo.dexterity - 10) / 2),
                        playFirst: npcInfo.playFirst ?? false
                    };

                    await APIBattle.addCharacter({
                        battleId: battleId,
                        externalId: npcInfo.id,
                        characterName: npcInfo.name,
                        characterType: "npc",
                        team: "B",
                        healthPoints: getNPCMaxHealth(npcInfo),
                        maxHealthPoints: getNPCMaxHealth(npcInfo),
                        initiative,
                        canRollInitiative: false,
                        freeShotWeakPoints: npcInfo.freeShotWeakPoints ?? 0
                    });
                }
            }

            // Se o encontro tem personagens jogáveis, carregar recompensas diretamente
            if (encounter.playerCharacterIds && encounter.playerCharacterIds.length > 0) {
                setBattleRewards(encounter.rewards.map(r => ({
                    type: r.rewardType as BattleReward["type"],
                    itemId: r.itemId,
                    level: r.level,
                })));
                setEncounterBonusXp(encounter.bonusXp ?? 0);
            }

            setSelectedEncounterId(encounterId);
            await reloadBattleDetails(true);
            showToast(t("combatAdmin.encounter.loaded"));
        } catch (error) {
            console.error("Erro ao carregar encontro:", error);
            showToast("Erro ao carregar encontro");
        } finally {
            setLoadingEncounter(false);
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

        // Filter by current location
        if (currentLocationOnly && campaignInfo.currentLocationId) {
            const loc = getLocationById(campaignInfo.currentLocationId);
            if (loc?.residentNpcIds) {
                const npcSet = new Set(loc.residentNpcIds);
                filtered = filtered.filter((e) => npcSet.has(e.externalId.toString()));
            }
        }

        // Apply filter by name or difficulty
        if (f) {
            filtered = filtered.filter((e) => {
                const matchesName = e.name.toLowerCase().includes(f);
                const difficulty = formatCR(calculateNPCDifficulty(e.externalId.toString()));
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
    }, [filterText, availableEnemies, sortColumn, sortDirection, currentLocationOnly, campaignInfo.currentLocationId])

    function renderAvatarCell(entity: CombatEntity) {
        const isPlayerWithImage = entity.type === "player" && entity.avatarUrl;
        const isNpc = entity.type === "npc";

        const grayscaleClass = entity.currentHp === 0 ? "grayscale" : "";

        return (
            <div className="avatar">
                <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center bg-base-300 overflow-hidden ${isNpc ? "cursor-zoom-in" : ""}`}
                    onClick={() => { if (isNpc) setImageModalNpc({ id: String(entity.externalId), name: entity.name }); }}
                >
                    {isPlayerWithImage || isNpc ? (
                        <>
                            <img
                                src={entity.avatarUrl}
                                alt={entity.name}
                                className={grayscaleClass}
                                onError={(e) => isNpc
                                    ? handleNpcImgError(e, String(entity.externalId))
                                    : (() => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        ((e.target as HTMLElement).nextElementSibling as HTMLElement)?.classList.remove('hidden');
                                    })()
                                }
                            />
                            <FaSkull className={`hidden text-base-content opacity-40 text-lg ${grayscaleClass}`} />
                        </>
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
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-lg font-semibold">{t("combatAdmin.labels.npcTurn")}</div>
                            <div className="text-sm opacity-70">
                                {currentNpc?.name} <span className="font-mono badge badge-ghost badge-xs">#{displayIndex.get(currentNpc?.battleID ?? 0) ?? "?"}</span>
                            </div>
                        </div>
                        <button
                            className="btn btn-sm btn-warning hover:brightness-110 shrink-0"
                            onClick={() => npcPassTurnTapped()}
                            disabled={isPassingTurn}
                        >
                            <FaHourglassHalf className="mr-1" />
                            {t("combatAdmin.labels.passTurn")}
                        </button>
                    </div>

                    {/* NPC Stat Block */}
                    {npcInfo && (() => {
                        const strMod = getAbilityModifier(npcInfo.strength);
                        const dexMod = getAbilityModifier(npcInfo.dexterity);
                        const conMod = getAbilityModifier(npcInfo.constitution);
                        const intMod = getAbilityModifier(npcInfo.intelligence);
                        const wisMod = getAbilityModifier(npcInfo.wisdom);
                        const chaMod = getAbilityModifier(npcInfo.charisma);

                        const abilities = [
                            { key: "str", label: t("combatAdmin.npcDetails.str"), score: npcInfo.strength, mod: strMod },
                            { key: "dex", label: t("combatAdmin.npcDetails.dex"), score: npcInfo.dexterity, mod: dexMod },
                            { key: "con", label: t("combatAdmin.npcDetails.con"), score: npcInfo.constitution, mod: conMod },
                            { key: "int", label: t("combatAdmin.npcDetails.int"), score: npcInfo.intelligence, mod: intMod },
                            { key: "wis", label: t("combatAdmin.npcDetails.wis"), score: npcInfo.wisdom, mod: wisMod },
                            { key: "cha", label: t("combatAdmin.npcDetails.cha"), score: npcInfo.charisma, mod: chaMod },
                        ];

                        const rollAbility = (abilityLabel: string, mod: number) => {
                            if (!diceBoardRef.current) return;
                            if (timeoutDiceBoardRef.current != null) {
                                clearTimeout(timeoutDiceBoardRef.current);
                                timeoutDiceBoardRef.current = null;
                            }
                            diceBoardRef.current.roll(["1d20"], (result) => {
                                const rawTotal = diceTotal(result);
                                const diceValues: number[] = [];
                                for (const group of result) {
                                    if (Array.isArray(group.rolls)) {
                                        for (const roll of group.rolls) diceValues.push(roll.value);
                                    }
                                }
                                dispatchRoll({
                                    label: `${npcInfo.name} - ${abilityLabel}`,
                                    diceRolled: rawTotal,
                                    modifier: mod,
                                    total: rawTotal + mod,
                                    diceCommand: `1d20${mod >= 0 ? "+" : ""}${mod}`,
                                    diceValues,
                                });
                                APIGameLog.createForCampaign(campaignInfo.id, {
                                    rollType: "customRoll",
                                    abilityKey: `${npcInfo.name} - ${abilityLabel}`,
                                    diceRolled: rawTotal,
                                    modifier: mod,
                                    total: rawTotal + mod,
                                    diceCommand: `1d20${mod >= 0 ? "+" : ""}${mod}`,
                                });
                                if (timeoutDiceBoardRef.current != null) {
                                    clearTimeout(timeoutDiceBoardRef.current);
                                }
                                timeoutDiceBoardRef.current = window.setTimeout(() => {
                                    diceBoardRef.current?.hideBoard();
                                    timeoutDiceBoardRef.current = null;
                                }, 5000);
                            });
                        };

                        const hasElementalInfo = hasElement(npcInfo.weakTo) || hasElement(npcInfo.resistentTo) || hasElement(npcInfo.imuneTo) || hasElement(npcInfo.absorbElement);
                        const hasDndExtras = (npcInfo.damageVulnerabilities?.length ?? 0) > 0 || (npcInfo.damageImmunities?.length ?? 0) > 0 || (npcInfo.conditionImmunities?.length ?? 0) > 0;
                        const hasChallenge = npcInfo.challengeRating || npcInfo.proficiencyBonus;
                        const hasProperties = npcInfo.isFlying || npcInfo.playFirst || (currentNpc?.freeShotWeakPoints ?? 0) > 0 || npcInfo.initiativeBonus || npcInfo.maxLifeBonus;

                        return (
                            <div className="bg-base-300/50 rounded-lg text-sm">
                                <button
                                    className="w-full flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-base-300/50 rounded-lg transition-colors"
                                    onClick={() => setNpcStatBlockOpen(prev => !prev)}
                                >
                                    <span className="text-xs font-semibold opacity-70">{t("combatAdmin.npcDetails.attributes")}</span>
                                    {npcStatBlockOpen ? <FaChevronUp className="text-xs opacity-50" /> : <FaChevronDown className="text-xs opacity-50" />}
                                </button>

                                <div className="grid transition-[grid-template-rows] duration-300 ease-in-out" style={{ gridTemplateRows: npcStatBlockOpen ? "1fr" : "0fr" }}>
                                    <div className="overflow-hidden">
                                        <div className="px-3 pb-3 space-y-3">
                                            <div className="grid grid-cols-3 gap-2 text-center combat-abilities-grid">
                                                {abilities.map(a => (
                                                    <div key={a.key} className="flex flex-col items-center gap-0.5">
                                                        <span className="font-bold text-xs opacity-70">{a.label}</span>
                                                        <span className="text-sm">{a.score}</span>
                                                        <button
                                                            className="btn btn-sm btn-neutral font-mono px-3 min-h-0 h-7"
                                                            onClick={() => rollAbility(a.label, a.mod)}
                                                        >
                                                            {a.mod >= 0 ? `+${a.mod}` : a.mod}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            {hasDndExtras && (
                                                <div className="flex flex-col gap-0.5 text-xs">
                                                    {(npcInfo.damageVulnerabilities?.length ?? 0) > 0 && <span><strong>{t("combatAdmin.npcDetails.damageVulnerabilities")}:</strong> {npcInfo.damageVulnerabilities!.join(", ")}</span>}
                                                    {(npcInfo.damageImmunities?.length ?? 0) > 0 && <span><strong>{t("combatAdmin.npcDetails.damageImmunities")}:</strong> {npcInfo.damageImmunities!.join(", ")}</span>}
                                                    {(npcInfo.conditionImmunities?.length ?? 0) > 0 && <span><strong>{t("combatAdmin.npcDetails.conditionImmunities")}:</strong> {npcInfo.conditionImmunities!.map(s => getStatusLabel(s)).join(", ")}</span>}
                                                </div>
                                            )}

                                            {hasChallenge && (
                                                <div className="flex gap-4 text-xs">
                                                    {npcInfo.challengeRating && <span><strong>{t("combatAdmin.npcDetails.challenge")}:</strong> {npcInfo.challengeRating}</span>}
                                                    {npcInfo.proficiencyBonus && <span><strong>{t("combatAdmin.npcDetails.proficiencyBonus")}:</strong> +{npcInfo.proficiencyBonus}</span>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {npcInfo && (hasElement(npcInfo.weakTo) || hasElement(npcInfo.resistentTo) || hasElement(npcInfo.imuneTo) || hasElement(npcInfo.absorbElement)) && (
                        <div className="flex flex-col gap-1 text-xs combat-elemental-row">
                            {hasElement(npcInfo.weakTo) && (
                                <div>
                                    <span className="font-semibold">{t("combatAdmin.npcDetails.vulnerability")}:</span>
                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                        {toElementArray(npcInfo.weakTo).map(el => (
                                            <span key={el} className="badge badge-xs badge-warning gap-0.5">{ELEMENT_EMOTE[el]} {getElementName(el)}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {hasElement(npcInfo.resistentTo) && (
                                <div>
                                    <span className="font-semibold">{t("combatAdmin.npcDetails.resistance")}:</span>
                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                        {toElementArray(npcInfo.resistentTo).map(el => (
                                            <span key={el} className="badge badge-xs badge-info gap-0.5">{ELEMENT_EMOTE[el]} {getElementName(el)}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {hasElement(npcInfo.imuneTo) && (
                                <div>
                                    <span className="font-semibold">{t("combatAdmin.npcDetails.immunity")}:</span>
                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                        {toElementArray(npcInfo.imuneTo).map(el => (
                                            <span key={el} className="badge badge-xs badge-error gap-0.5">{ELEMENT_EMOTE[el]} {getElementName(el)}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {hasElement(npcInfo.absorbElement) && (
                                <div>
                                    <span className="font-semibold">{t("combatAdmin.npcDetails.absorb")}:</span>
                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                        {toElementArray(npcInfo.absorbElement).map(el => (
                                            <span key={el} className="badge badge-xs badge-success gap-0.5">{ELEMENT_EMOTE[el]} {getElementName(el)}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {npcInfo && (npcInfo.isFlying || npcInfo.playFirst || (npcInfo.initiativeBonus != null && npcInfo.initiativeBonus !== 0) || (npcInfo.maxLifeBonus != null && npcInfo.maxLifeBonus !== 0)) && (
                        <div className="flex flex-wrap gap-1 items-center">
                            {npcInfo.isFlying && <span className="badge badge-xs badge-info">{t("combatAdmin.npcDetails.flying")}</span>}
                            {npcInfo.playFirst && <span className="badge badge-xs badge-warning">{t("combatAdmin.npcDetails.playFirst")}</span>}
                            {npcInfo.initiativeBonus != null && npcInfo.initiativeBonus !== 0 && <span className="badge badge-xs badge-ghost">{t("combatAdmin.npcDetails.initBonus")}: {npcInfo.initiativeBonus >= 0 ? "+" : ""}{npcInfo.initiativeBonus}</span>}
                            {npcInfo.maxLifeBonus != null && npcInfo.maxLifeBonus !== 0 && <span className="badge badge-xs badge-ghost">{t("combatAdmin.npcDetails.maxHpBonus")}: {npcInfo.maxLifeBonus >= 0 ? "+" : ""}{npcInfo.maxLifeBonus}</span>}
                        </div>
                    )}

                    {/* Weak Points +/- */}
                    {currentNpc && (() => {
                        const wpVal = currentNpc.freeShotWeakPoints ?? 0;
                        return (
                            <div className="flex items-center gap-2 text-xs">
                                <span className="font-semibold opacity-70">{t("combatAdmin.npcDetails.weakPoints")}:</span>
                                <button
                                    className="btn btn-xs btn-ghost px-1 min-h-0 h-5"
                                    onClick={async () => {
                                        if (currentNpc.battleID && wpVal > 0) {
                                            await APIBattle.updateWeakPoints(currentNpc.battleID, wpVal - 1);
                                            await reloadBattleDetails(true);
                                        }
                                    }}
                                    disabled={wpVal <= 0}
                                >
                                    <FaMinus size={8} />
                                </button>
                                <span className="font-mono font-bold">{wpVal}</span>
                                <button
                                    className="btn btn-xs btn-ghost px-1 min-h-0 h-5"
                                    onClick={async () => {
                                        if (currentNpc.battleID) {
                                            await APIBattle.updateWeakPoints(currentNpc.battleID, wpVal + 1);
                                            await reloadBattleDetails(true);
                                        }
                                    }}
                                >
                                    <FaPlus size={8} />
                                </button>
                            </div>
                        );
                    })()}

                    {/* ━━━ D&D-style Actions Section ━━━ */}
                    {(() => {
                        const strMod = npcInfo ? getAbilityModifier(npcInfo.strength) : 0;
                        const profBonus = npcInfo?.proficiencyBonus ?? 2;
                        const hitBonus = strMod + profBonus;
                        const hitSign = hitBonus >= 0 ? `+${hitBonus}` : `${hitBonus}`;

                        const rollActionDice = (diceCmd: string, modifier: number, label: string) => {
                            if (!diceBoardRef.current) return;
                            if (timeoutDiceBoardRef.current != null) {
                                clearTimeout(timeoutDiceBoardRef.current);
                                timeoutDiceBoardRef.current = null;
                            }
                            diceBoardRef.current.roll([diceCmd], (result) => {
                                const rawTotal = diceTotal(result);
                                const diceValues: number[] = [];
                                for (const group of result) {
                                    if (Array.isArray(group.rolls)) {
                                        for (const roll of group.rolls) diceValues.push(roll.value);
                                    }
                                }
                                dispatchRoll({
                                    label,
                                    diceRolled: rawTotal,
                                    modifier,
                                    total: rawTotal + modifier,
                                    diceCommand: `${diceCmd}${modifier >= 0 ? "+" : ""}${modifier}`,
                                    diceValues,
                                });
                                APIGameLog.createForCampaign(campaignInfo.id, {
                                    rollType: "customRoll",
                                    abilityKey: label,
                                    diceRolled: rawTotal,
                                    modifier,
                                    total: rawTotal + modifier,
                                    diceCommand: `${diceCmd}${modifier >= 0 ? "+" : ""}${modifier}`,
                                });
                                if (timeoutDiceBoardRef.current != null) {
                                    clearTimeout(timeoutDiceBoardRef.current);
                                }
                                timeoutDiceBoardRef.current = window.setTimeout(() => {
                                    diceBoardRef.current?.hideBoard();
                                    timeoutDiceBoardRef.current = null;
                                }, 5000);
                            });
                        };

                        const DiceBtn = ({ diceCmd, modifier, label }: { diceCmd: string; modifier: number; label: string }) => {
                            const modSign = modifier >= 0 ? `+${modifier}` : `${modifier}`;
                            return (
                                <button
                                    className="inline-flex items-center px-1.5 py-0.5 mx-0.5 bg-amber-700 text-amber-100 hover:bg-amber-500 hover:text-white rounded text-xs font-mono font-bold cursor-pointer transition-colors align-baseline"
                                    onClick={(e) => { e.stopPropagation(); rollActionDice(diceCmd, modifier, label); }}
                                >
                                    {diceCmd === "1d20" ? modSign : modifier === 0 ? `(${diceCmd})` : `(${diceCmd}${modSign})`}
                                </button>
                            );
                        };

                        const npcName = npcInfo?.name ?? "";

                        const dieSize = npcInfo?.damageDie ?? 6;
                        const dieAvg = (dieSize + 1) / 2;

                        function calcDamage(baseDice: number, baseMod: number) {
                            const totalDice = Math.max(1, baseDice + npcIntensityOffset);
                            const atMinDice = baseDice + npcIntensityOffset < 1;
                            const mod = atMinDice ? 0 : baseMod;
                            return { numDice: totalDice, flatDmg: mod, avgDmg: Math.floor(totalDice * dieAvg + mod) };
                        }

                        return (
                            <div className="flex flex-col gap-1">
                                {/* Passives */}
                                {(npcInfo?.passives?.length ?? 0) > 0 && (
                                    <>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="flex-1 border-t border-cyan-700/60" />
                                            <span className="text-sm font-bold tracking-wide text-cyan-400 uppercase">{t("combatAdmin.npcDetails.passives")}</span>
                                            <div className="flex-1 border-t border-cyan-700/60" />
                                        </div>
                                        {npcInfo!.passives!.map((passive, idx) => {
                                            const text = t(passive);
                                            const dicePlaceholder = "{{dice}}";
                                            if (text.includes(dicePlaceholder)) {
                                                const suicideAtk = npcInfo?.attackList?.find(a => a.name?.includes("suicideBomb"));
                                                const mineDice = getIntensityDiceCount(suicideAtk?.intensity);
                                                const mineMod = strMod + (suicideAtk?.additionalDamage ?? 0);
                                                const { numDice: mNumDice, flatDmg: mFlatDmg } = calcDamage(mineDice, mineMod);
                                                const parts = text.split(dicePlaceholder);
                                                return (
                                                    <div key={idx} className="rounded-md px-3 py-2 text-sm leading-relaxed border border-transparent">
                                                        <span className="text-cyan-300">{"▸ "}</span>
                                                        <span className="italic opacity-90">
                                                            {parts[0]}
                                                            <DiceBtn diceCmd={`${mNumDice}d${dieSize}`} modifier={mFlatDmg} label={`${npcName} – ${t("combatAdmin.npcPassives.mineExplosion", "Explosão da Mina")}`} />
                                                            {parts[1]}
                                                        </span>
                                                    </div>
                                                );
                                            }
                                            return (
                                                <div key={idx} className="rounded-md px-3 py-2 text-sm leading-relaxed border border-transparent">
                                                    <span className="text-cyan-300">{"▸ "}</span><span className="italic opacity-90">{text}</span>
                                                </div>
                                            );
                                        })}
                                    </>
                                )}

                                <div className="flex items-center gap-2 mb-1">
                                    <div className="flex-1 border-t border-red-700/60" />
                                    <span className="text-sm font-bold tracking-wide text-red-400 uppercase">{t("combatAdmin.npcDetails.actions")}</span>
                                    <div className="flex-1 border-t border-red-700/60" />
                                </div>

                                {npcInfo?.attackList?.map((atk, idx, arr) => {
                                    const actionName = atk.name ? t(atk.name) : getAttackTypeLabel(atk.type);
                                    const hasDamage = atk.additionalDamage != null || atk.intensity != null;
                                    const prevName = idx > 0 ? (arr[idx - 1].name ?? arr[idx - 1].type) : null;
                                    const isContinuation = atk.name && prevName === atk.name;

                                    const baseDice = getIntensityDiceCount(atk.intensity);
                                    const baseMod = strMod + (atk.additionalDamage ?? 0);
                                    const { numDice, flatDmg, avgDmg } = calcDamage(baseDice, baseMod);

                                    const statusParts = atk.statusList?.map(s => {
                                        let eff = getStatusLabel(s.type);
                                        if (s.remainingTurns != null) {
                                            eff += ` ${t("combatAdmin.actionDesc.forTurns", { count: s.remainingTurns })}`;
                                        }
                                        return eff;
                                    });

                                    return (
                                        <div key={idx} className={`rounded-md px-3 py-2 text-sm leading-relaxed border border-transparent ${isContinuation ? "pl-7 -mt-1" : ""}`}>
                                            <span>
                                                {isContinuation
                                                    ? <span className="text-red-300 opacity-60">{"↳ "}</span>
                                                    : <strong className={atk.description && !hasDamage ? "text-amber-300" : "text-red-300"}>{"▸ "}{actionName}.</strong>
                                                }{" "}
                                                {atk.description && <span className="italic opacity-90">{renderTextWithDiceButtons(t(atk.description), `${npcName} – ${actionName}`, diceBoardRef, timeoutDiceBoardRef)} </span>}
                                                {hasDamage && (
                                                    <span className="italic opacity-90">
                                                        <DiceBtn diceCmd="1d20" modifier={hitBonus + (atk.attackModifier ?? 0)} label={`${npcName} – ${actionName} (${t("combatAdmin.actionDesc.toHit")})`} />
                                                        {" "}{t("combatAdmin.actionDesc.toHit")}
                                                        . {t("combatAdmin.actionDesc.hit")}: {avgDmg}{" "}
                                                        <DiceBtn diceCmd={`${numDice}d${dieSize}`} modifier={flatDmg} label={`${npcName} – ${actionName} (${t("combatAdmin.actionDesc.hit")})`} />
                                                        {atk.quantityText ? <>, {t(atk.quantityText)}</> : atk.quantity != null && atk.quantity > 1 && <>, {atk.quantity} {t("combatAdmin.actionDesc.hits")}</>}
                                                        {(atk.targeting === "all" || atk.targetsAll) && <> ({t("combatAdmin.actionDesc.targetsAll")})</>}
                                                        {atk.targeting === "single" && atk.quantity != null && atk.quantity > 1 && <> ({t("combatAdmin.actionDesc.targetsSingle")})</>}
                                                        {statusParts && statusParts.length > 0 && <>. {t("combatAdmin.actionDesc.targetGains")} {statusParts.join(", ")}</>}
                                                        .
                                                    </span>
                                                )}
                                                {!hasDamage && !atk.description && (
                                                    <span className="italic opacity-90">
                                                        <DiceBtn diceCmd="1d20" modifier={hitBonus + (atk.attackModifier ?? 0)} label={`${npcName} – ${actionName} (${t("combatAdmin.actionDesc.toHit")})`} />
                                                        {" "}{t("combatAdmin.actionDesc.toHit")}
                                                        . {t("combatAdmin.actionDesc.hit")}: {avgDmg}{" "}
                                                        <DiceBtn diceCmd={`${numDice}d${dieSize}`} modifier={flatDmg} label={`${npcName} – ${actionName} (${t("combatAdmin.actionDesc.hit")})`} />
                                                        {atk.quantityText ? <>, {t(atk.quantityText)}</> : atk.quantity != null && atk.quantity > 1 && <>, {atk.quantity} {t("combatAdmin.actionDesc.hits")}</>}
                                                        {(atk.targeting === "all" || atk.targetsAll) && <> ({t("combatAdmin.actionDesc.targetsAll")})</>}
                                                        {atk.targeting === "single" && atk.quantity != null && atk.quantity > 1 && <> ({t("combatAdmin.actionDesc.targetsSingle")})</>}
                                                        {statusParts && statusParts.length > 0 && <>. {t("combatAdmin.actionDesc.targetGains")} {statusParts.join(", ")}</>}
                                                        .
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    );
                                })}

                                {(npcInfo?.specialAttackList?.length ?? 0) > 0 && npcInfo?.specialAttackList?.map((skill, idx) => {
                                    const skillName = getSpecialAttackLabel(skill.type);
                                    const statusParts = skill.statusList?.map(s => {
                                        const label = getStatusLabel(s.type);
                                        const showAmt = shouldShowStatusAmmount(s.type);
                                        const turns = s.remainingTurns != null ? ` ${t("combatAdmin.actionDesc.forTurns", { count: s.remainingTurns })}` : "";
                                        return `${label}${showAmt && s.ammount ? ` ${s.ammount}` : ""}${turns}`;
                                    }) ?? [];
                                    const skillDesc = statusParts.length > 0 ? `${t("combatAdmin.actionDesc.targetGains")} ${statusParts.join(", ")}.` : "";
                                    return (
                                        <div key={`special-${idx}`} className="rounded-md px-3 py-2 text-sm leading-relaxed border border-transparent">
                                            <span>
                                                <strong className="text-red-300">{"▸ "}{skillName}.</strong>{" "}
                                                <span className="italic opacity-90">{skillDesc}</span>
                                            </span>
                                        </div>
                                    );
                                })}

                                {/* Basic "Atacar" action — hidden if NPC already has basic in attackList */}
                                {!npcInfo?.noBasicAttack && !npcInfo?.attackList?.some(a => a.type === "basic") && (() => {
                                    const { numDice: basicNumDice, flatDmg: basicFlatDmg, avgDmg: basicAvgDmg } = calcDamage(1, strMod);
                                    return (
                                        <div className="rounded-md px-3 py-2 text-sm leading-relaxed border border-transparent">
                                            <span>
                                                <strong className="text-red-300">{"▸ "}{t("combat.attack")}.</strong>{" "}
                                                <span className="italic opacity-90">
                                                    <DiceBtn diceCmd="1d20" modifier={hitBonus} label={`${npcName} – ${t("combat.attack")} (${t("combatAdmin.actionDesc.toHit")})`} />
                                                    {" "}{t("combatAdmin.actionDesc.toHit")}
                                                    . {t("combatAdmin.actionDesc.hit")}: {basicAvgDmg}{" "}
                                                    <DiceBtn diceCmd={`${basicNumDice}d${dieSize}`} modifier={basicFlatDmg} label={`${npcName} – ${t("combat.attack")} (${t("combatAdmin.actionDesc.hit")})`} />
                                                    .
                                                </span>
                                            </span>
                                        </div>
                                    );
                                })()}
                            </div>
                        );
                    })()}

                    {/* Intensity +/- buttons */}
                    <div className="flex items-center justify-center gap-3 pt-1">
                        {npcIntensityOffset > 0 && (
                            <button
                                className="btn btn-sm btn-warning btn-outline"
                                onClick={() => setNpcIntensityOffset(0)}
                            >
                                <FaUndo /> {t("combatAdmin.labels.resetIntensity")}
                            </button>
                        )}
                        <button
                            className="btn btn-sm btn-success btn-outline"
                            onClick={() => setNpcIntensityOffset(prev => prev + 1)}
                        >
                            <FaArrowUp /> {t("combatAdmin.labels.increaseIntensity")}
                        </button>
                    </div>

                </div>
            </div>
        );
    }

    function renderCharacterPanel(m: CombatEntity) {
        if (m.type !== "player") return null;

        const char = battleDetails?.characters.find(c => c.battleID === m.rowId);
        if (!char) return null;

        const charId = m.characterId?.toLowerCase() ?? "";

        // Verso – Perfection Rank
        if (charId === "verso" || charId.includes("verso")) {
            const currentRank = char.perfectionRank ?? "D";
            const rankProgress = char.rankProgress ?? 0;
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
                await APIBattle.updateCharacterRank(char.battleID, newRank, 0);
                reloadBattleDetails();
            };

            return (
                <div className="rounded-lg bg-base-100/50 p-2 combat-sub-card">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span>{t("combatAdmin.labels.versoPerfectionRank")}</span>
                        <span className="text-xs opacity-60 font-mono">{rankProgress} pts</span>
                    </div>
                    <div className="flex gap-2">
                        {ranks.map(rank => (
                            <button
                                key={rank}
                                className={`btn btn-xs flex-1 ${currentRank === rank ? rankActiveColors[rank] : rankOutlineColors[rank]}`}
                                onClick={() => handleRankChange(rank)}
                            >
                                {rank}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        // Gustave – Charge Points
        if (charId === "gustave" || charId.includes("gustave")) {
            const chargePoints = char.chargePoints ?? 0;
            const maxChargePoints = char.maxChargePoints ?? 10;
            const pct = Math.max(0, Math.min(100, Math.round((chargePoints / maxChargePoints) * 100)));

            return (
                <div className="rounded-lg bg-base-100/50 p-2 combat-sub-card">
                    <div className="flex items-center justify-between text-sm mb-1">
                        <span>{t("combatAdmin.labels.gustaveCharges")}</span>
                        <div className="flex items-center gap-2">
                            <span className="font-bold">{chargePoints}/{maxChargePoints}</span>
                            <button
                                onClick={() => handleOpenGustaveChargeModal(char)}
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
            );
        }

        // Sciel – Sun/Moon Charges
        if (charId === "sciel" || charId.includes("sciel")) {
            const sunCharges = char.sunCharges ?? 0;
            const moonCharges = char.moonCharges ?? 0;
            const twilightStatus = char.status?.find(s => s.effectName === "Twilight");

            return (
                <div className="rounded-lg bg-base-100/50 p-2 combat-sub-card">
                    <div className="flex items-center justify-between text-sm mb-1">
                        <span>{t("combatAdmin.labels.scielCharges")}</span>
                        <button
                            onClick={() => handleOpenScielChargesModal(char)}
                            className="btn btn-xs btn-ghost"
                            title={t("combatAdmin.labels.editScielCharges")}
                        >
                            <FaEdit />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
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
            );
        }

        // Lune – Stains
        if (charId === "lune" || charId.includes("lune")) {
            const stainSlots = [char.stainSlot1, char.stainSlot2, char.stainSlot3, char.stainSlot4];
            const stainImageMap: Record<string, string> = {
                Lightning: "/stains/lightning-stain.png",
                Earth: "/stains/earth-stain.png",
                Fire: "/stains/fire-stain.png",
                Ice: "/stains/ice-stain.png",
                Light: "/stains/light-stain.png"
            };

            return (
                <div className="rounded-lg bg-base-100/50 p-2 combat-sub-card">
                    <div className="flex items-center justify-between text-sm mb-1">
                        <span>{t("combatAdmin.labels.luneStains")}</span>
                        <button
                            onClick={() => handleOpenLuneStainsModal(char)}
                            className="btn btn-xs btn-ghost"
                            title={t("combatAdmin.labels.editLuneStains")}
                        >
                            <FaEdit />
                        </button>
                    </div>
                    <div className="flex gap-2 justify-center">
                        {stainSlots.map((stain, idx) => (
                            <div
                                key={idx}
                                className="w-10 h-10 rounded-lg border border-base-300 flex items-center justify-center bg-base-200"
                            >
                                {stain ? (
                                    <img src={stainImageMap[stain]} alt={stain} className="w-7 h-7" />
                                ) : (
                                    <span className="text-base-content/40 text-xs">—</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // Maelle – Stance
        if (charId === "maelle" || charId.includes("maelle")) {
            const currentStance = char.stance;
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
                await APIBattle.updateCharacterStance(char.battleID, newStance);
                showToast(t("combatAdmin.toasts.stanceChanged", { stance: stanceLabels[newStance] }));
                reloadBattleDetails();
            };

            return (
                <div className="rounded-lg bg-base-100/50 p-2 combat-sub-card">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span>{t("combatAdmin.labels.maelleStance")}</span>
                        <span className={`badge ${currentStance ? stanceColors[currentStance] : "badge-ghost"}`}>
                            {currentStance ? stanceLabels[currentStance] : t("combatAdmin.stances.none")}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            className={`btn btn-xs flex-1 ${currentStance === "Offensive" ? "btn-error" : "btn-outline btn-error"}`}
                            onClick={() => handleStanceChange("Offensive")}
                        >
                            {t("combatAdmin.stances.offensive")}
                        </button>
                        <button
                            className={`btn btn-xs flex-1 ${currentStance === "Defensive" ? "btn-info" : "btn-outline btn-info"}`}
                            onClick={() => handleStanceChange("Defensive")}
                        >
                            {t("combatAdmin.stances.defensive")}
                        </button>
                        <button
                            className={`btn btn-xs flex-1 ${currentStance === "Virtuous" ? "bg-purple-500 text-white border-purple-500 hover:bg-purple-600" : "btn-outline border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white"}`}
                            onClick={() => handleStanceChange("Virtuous")}
                        >
                            {t("combatAdmin.stances.virtuous")}
                        </button>
                    </div>
                </div>
            );
        }

        return null;
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
                        <div className="flex flex-col min-w-0 overflow-hidden combat-members-list">
                            {members.map((m, memberIdx) => {
                                const isRowSelectable = isSelectingTarget && m.currentHp > 0
                                const entityAttacks =
                                    battleDetails?.attacks?.filter(a => a.targetBattleId === m.rowId) ?? []

                                return (
                                    <React.Fragment key={m.rowId}>
                                    {memberIdx > 0 && <hr className="border-base-content/40 mt-2 mb-5 combat-member-separator" />}
                                    <div
                                        className={`py-3 space-y-1 min-w-0 combat-member-card ${isRowSelectable ? "target-glow cursor-pointer" : ""}`}
                                        onClick={isRowSelectable ? () => handleTargetSelected(m) : undefined}
                                    >
                                        {/* Linha principal: tudo inline em tela grande */}
                                        <div className="combat-main-row">
                                            {/* Parte 1: Avatar + Nome + badges */}
                                            <div className="flex items-center gap-2 flex-wrap min-w-0 combat-info-section">
                                                {renderAvatarCell(m)}
                                                {m.type === "npc" ? (
                                                    <span
                                                        className={`font-semibold text-sm truncate cursor-pointer hover:underline flex items-center gap-1 ${m.currentHp === 0 ? "text-base-content/40 line-through" : ""}`}
                                                        onClick={(e) => {
                                                            if (!isRowSelectable) {
                                                                e.stopPropagation();
                                                                setExpandedNpcRowId(prev => prev === m.rowId! ? null : m.rowId!);
                                                            }
                                                        }}
                                                    >
                                                        {m.name}
                                                        {expandedNpcRowId === m.rowId
                                                            ? <FaChevronUp className="w-2.5 h-2.5 shrink-0" />
                                                            : <FaChevronDown className="w-2.5 h-2.5 shrink-0" />}
                                                    </span>
                                                ) : (
                                                    <span className={`font-semibold text-sm truncate ${m.currentHp === 0 ? "text-base-content/40 line-through" : ""}`}>
                                                        {m.name}
                                                    </span>
                                                )}
                                                {m.currentHp === 0 && (
                                                    <FaSkull className="text-red-600 w-3.5 h-3.5 shrink-0" title={t("combatAdmin.labels.dead")} />
                                                )}
                                                <span className="badge badge-ghost badge-xs font-mono shrink-0">#{displayIndex.get(m.rowId ?? 0) ?? "?"}</span>
                                                <span className={`badge badge-xs shrink-0 ${m.isReadyToStart ? "badge-success" : "badge-warning"}`}>
                                                    {m.isReadyToStart ? t("combatAdmin.labels.ready") : t("combatAdmin.labels.waiting")}
                                                </span>
                                            </div>

                                            {/* Parte 2: HP bar */}
                                            <div className="flex items-center gap-1 min-w-0 combat-hp-section">
                                                <div className="flex items-center gap-1 flex-1 min-w-0 cursor-pointer rounded hover:bg-base-300/40 transition-colors" onClick={(e) => { e.stopPropagation(); openHpEditModal(m); }}>
                                                    <span className="text-[10px] font-mono opacity-70 shrink-0">HP {m.currentHp}/{m.maxHp}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <AnimatedStatBar
                                                            value={Math.round((m.currentHp / m.maxHp) * 100)}
                                                            label="HP"
                                                            fillClass="bg-error"
                                                            ghostClass="bg-error/30"
                                                            breakMarkers={[
                                                                { position: 66, triggered: (m.breakCount ?? 0) >= 1 },
                                                                { position: 33, triggered: (m.breakCount ?? 0) >= 2 },
                                                            ]}
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    className="btn btn-xs btn-ghost text-warning p-0"
                                                    onClick={(e) => { e.stopPropagation(); setEditBreakValue(2 - (m.breakCount ?? 0)); setPendingBreak({ entity: m, breakIndex: m.breakCount ?? 0 }); }}
                                                    title={t("combatAdmin.labels.breakConfirmTitle")}
                                                >
                                                    💥
                                                </button>
                                                <button
                                                    className="btn btn-xs btn-ghost text-info p-0"
                                                    onClick={(e) => { e.stopPropagation(); openHpEditModal(m); }}
                                                >
                                                    <FaEdit size={10} />
                                                </button>
                                            </div>

                                            {/* Parte 3: MP bar */}
                                            {m.currentMp !== undefined && m.maxMp !== undefined && (
                                                <div className="flex items-center gap-1 min-w-0 combat-mp-section">
                                                    <div className="flex items-center gap-1 flex-1 min-w-0 cursor-pointer rounded hover:bg-base-300/40 transition-colors" onClick={(e) => { e.stopPropagation(); openMpEditModal(m); }}>
                                                        <span className="text-[10px] font-mono opacity-70 shrink-0">AP {m.currentMp}/{m.maxMp}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <AnimatedStatBar
                                                                value={Math.round((m.currentMp / m.maxMp) * 100)}
                                                                label="AP"
                                                                fillClass="bg-info"
                                                                ghostClass="bg-info/30"
                                                            />
                                                        </div>
                                                    </div>
                                                    <button
                                                        className="btn btn-xs btn-ghost text-info p-0"
                                                        onClick={(e) => { e.stopPropagation(); openMpEditModal(m); }}
                                                    >
                                                        <FaEdit size={10} />
                                                    </button>
                                                </div>
                                            )}

                                            {/* Parte 4: AC + Botões (mesma linha sempre) */}
                                            <div className="flex items-center gap-2 shrink-0 combat-actions-section">
                                                {(() => {
                                                    let ac: number | undefined;
                                                    if (m.type === "npc") {
                                                        const npcData = getNpcById(m.characterId ?? "");
                                                        if (npcData) {
                                                            const dexMod = getAbilityModifier(npcData.dexterity);
                                                            ac = npcData.armorClass ?? (10 + dexMod);
                                                        }
                                                    } else {
                                                        const playerData = players.find(p => p.playerSheet?.characterId === m.characterId);
                                                        if (playerData) {
                                                            ac = calculateArmorClass(playerData, loadWeaponInfo(playerData));
                                                        }
                                                    }
                                                    if (ac == null) return null;
                                                    return (
                                                        <span className="badge badge-sm badge-outline font-mono shrink-0" title={t("combatAdmin.npcDetails.armorClass")}>
                                                            {t("combatAdmin.npcDetails.armorClass")} {ac}
                                                        </span>
                                                    );
                                                })()}
                                                {!isRowSelectable && (
                                                    <>
                                                        <button
                                                            className="btn btn-xs btn-outline btn-info shrink-0"
                                                            onClick={(e) => { e.stopPropagation(); setEffectsModalCharId(m.rowId!); setEffectsModalStatuses(m.status ?? []); }}
                                                        >
                                                            Condições
                                                        </button>
                                                        <button
                                                            className="btn btn-xs btn-error shrink-0"
                                                            onClick={(e) => { e.stopPropagation(); handleRemove(m.rowId!); }}
                                                        >
                                                            Remover
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Linha 4: Efeitos/Status */}
                                        {((m.status && m.status.length > 0) || npcIsFlyingById(m.characterId)) && (
                                            <div className="flex flex-row flex-wrap items-center gap-1 mt-1">
                                                {m.status?.map((st, idx) => {
                                                    const showAmount = shouldShowStatusAmmount(st.effectName);
                                                    const showTurns = st.effectName !== "IntenseFlames" && st.remainingTurns;

                                                    return (
                                                        <span
                                                            key={idx}
                                                            className="px-1 py-0.5 rounded bg-base-300 text-[10px] opacity-80 cursor-pointer hover:opacity-100 transition-opacity"
                                                            onClick={(e) => { e.stopPropagation(); setExpandedAdminStatus(prev => prev === `${m.rowId}-${st.effectName}` ? null : `${m.rowId}-${st.effectName}`); }}
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

                                                <button
                                                    className="btn btn-xs btn-ghost text-info p-0"
                                                    onClick={(e) => { e.stopPropagation(); setEffectsModalCharId(m.rowId!); setEffectsModalStatuses(m.status ?? []); }}
                                                >
                                                    <FaEdit size={10} />
                                                </button>
                                            </div>
                                        )}

                                        {expandedAdminStatus?.startsWith(`${m.rowId}-`) && (
                                            <p className="text-[10px] opacity-70 leading-relaxed">
                                                {t(`battle.statusDescriptions.${expandedAdminStatus.split("-").slice(1).join("-")}`) || t("battle.statusDescriptions.default")}
                                            </p>
                                        )}

                                        <div className="mt-2">{renderCharacterPanel(m)}</div>

                                        {/* Weak Points - sempre visível para NPCs */}
                                        {m.type === "npc" && (() => {
                                            const bc = battleDetails?.characters.find(c => c.battleID === m.rowId);
                                            const npcStatic = getNpcById(m.characterId ?? "");
                                            const wp = bc?.freeShotWeakPoints ?? 0;
                                            return (
                                                <div className="flex items-center gap-2 text-xs mt-1">
                                                    <span className="font-semibold opacity-70">{t("combatAdmin.npcDetails.weakPoints")}:</span>
                                                    <button
                                                        className="btn btn-xs btn-ghost px-1 min-h-0 h-5"
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            if (m.rowId && wp > 0) {
                                                                await APIBattle.updateWeakPoints(m.rowId, wp - 1);
                                                                await reloadBattleDetails(true);
                                                            }
                                                        }}
                                                        disabled={wp <= 0}
                                                    >
                                                        <FaMinus size={8} />
                                                    </button>
                                                    <span className="font-mono font-bold">{wp}</span>
                                                    <button
                                                        className="btn btn-xs btn-ghost px-1 min-h-0 h-5"
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            if (m.rowId) {
                                                                await APIBattle.updateWeakPoints(m.rowId, wp + 1);
                                                                await reloadBattleDetails(true);
                                                            }
                                                        }}
                                                    >
                                                        <FaPlus size={8} />
                                                    </button>
                                                </div>
                                            );
                                        })()}

                                        {/* NPC Stat Block colapsável */}
                                        {m.type === "npc" && (() => {
                                            const isExpanded = expandedNpcRowId === m.rowId;
                                            const npc = getNpcById(m.characterId ?? "");
                                            const battleChar = battleDetails?.characters.find(c => c.battleID === m.rowId);
                                            if (!npc) return null;
                                            const strMod = getAbilityModifier(npc.strength);
                                            const dexMod = getAbilityModifier(npc.dexterity);
                                            const conMod = getAbilityModifier(npc.constitution);
                                            const intMod = getAbilityModifier(npc.intelligence);
                                            const wisMod = getAbilityModifier(npc.wisdom);
                                            const chaMod = getAbilityModifier(npc.charisma);

                                            const abilities = [
                                                { key: "str", label: t("combatAdmin.npcDetails.str"), score: npc.strength, mod: strMod },
                                                { key: "dex", label: t("combatAdmin.npcDetails.dex"), score: npc.dexterity, mod: dexMod },
                                                { key: "con", label: t("combatAdmin.npcDetails.con"), score: npc.constitution, mod: conMod },
                                                { key: "int", label: t("combatAdmin.npcDetails.int"), score: npc.intelligence, mod: intMod },
                                                { key: "wis", label: t("combatAdmin.npcDetails.wis"), score: npc.wisdom, mod: wisMod },
                                                { key: "cha", label: t("combatAdmin.npcDetails.cha"), score: npc.charisma, mod: chaMod },
                                            ];

                                            const rollAbility = (abilityLabel: string, mod: number) => {
                                                if (!diceBoardRef.current) return;
                                                if (timeoutDiceBoardRef.current != null) {
                                                    clearTimeout(timeoutDiceBoardRef.current);
                                                    timeoutDiceBoardRef.current = null;
                                                }
                                                const diceCommand = `1d20`;
                                                diceBoardRef.current.roll([diceCommand], (result) => {
                                                    const rawTotal = diceTotal(result);
                                                    const diceValues: number[] = [];
                                                    for (const group of result) {
                                                        if (Array.isArray(group.rolls)) {
                                                            for (const roll of group.rolls) diceValues.push(roll.value);
                                                        }
                                                    }
                                                    dispatchRoll({
                                                        label: `${npc.name} - ${abilityLabel}`,
                                                        diceRolled: rawTotal,
                                                        modifier: mod,
                                                        total: rawTotal + mod,
                                                        diceCommand: `1d20${mod >= 0 ? "+" : ""}${mod}`,
                                                        diceValues,
                                                    });
                                                    APIGameLog.createForCampaign(campaignInfo.id, {
                                                        rollType: "customRoll",
                                                        abilityKey: `${npc.name} - ${abilityLabel}`,
                                                        diceRolled: rawTotal,
                                                        modifier: mod,
                                                        total: rawTotal + mod,
                                                        diceCommand: `1d20${mod >= 0 ? "+" : ""}${mod}`,
                                                    });
                                                    if (timeoutDiceBoardRef.current != null) {
                                                        clearTimeout(timeoutDiceBoardRef.current);
                                                    }
                                                    timeoutDiceBoardRef.current = window.setTimeout(() => {
                                                        diceBoardRef.current?.hideBoard();
                                                        timeoutDiceBoardRef.current = null;
                                                    }, 5000);
                                                });
                                            };

                                            const hasElementalInfo = hasElement(npc.weakTo) || hasElement(npc.resistentTo) || hasElement(npc.imuneTo) || hasElement(npc.absorbElement);
                                            const hasDndExtras = (npc.damageVulnerabilities?.length ?? 0) > 0 || (npc.damageImmunities?.length ?? 0) > 0 || (npc.conditionImmunities?.length ?? 0) > 0;
                                            const hasChallenge = npc.challengeRating || npc.proficiencyBonus;
                                            const currentWeakPoints = battleChar?.freeShotWeakPoints ?? 0;
                                            const hasProperties = npc.isFlying || npc.playFirst || currentWeakPoints > 0 || npc.initiativeBonus || npc.maxLifeBonus;

                                            return (
                                                <div
                                                    className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                                                    style={{ gridTemplateRows: isExpanded ? "1fr" : "0fr" }}
                                                >
                                                <div className="overflow-hidden">
                                                <div className="bg-base-300/50 rounded-lg p-3 space-y-3 text-sm" onClick={(e) => e.stopPropagation()}>
                                                    {/* Ability Scores — 3 colunas mobile, 6 colunas desktop */}
                                                    <div className="grid grid-cols-3 gap-2 text-center combat-abilities-grid">
                                                        {abilities.map(a => (
                                                            <div key={a.key} className="flex flex-col items-center gap-0.5">
                                                                <span className="font-bold text-xs opacity-70">{a.label}</span>
                                                                <span className="text-sm">{a.score}</span>
                                                                <button
                                                                    className="btn btn-sm btn-neutral font-mono px-3 min-h-0 h-7"
                                                                    onClick={() => rollAbility(a.label, a.mod)}
                                                                >
                                                                    {a.mod >= 0 ? `+${a.mod}` : a.mod}
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Elemental Affinities */}
                                                    {hasElementalInfo && (
                                                        <div className="flex flex-col gap-1 text-xs combat-elemental-row">
                                                            {hasElement(npc.weakTo) && (
                                                                <div>
                                                                    <span className="font-semibold">{t("combatAdmin.npcDetails.vulnerability")}:</span>
                                                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                                                        {toElementArray(npc.weakTo).map(el => (
                                                                            <span key={el} className="badge badge-xs badge-warning gap-0.5">{ELEMENT_EMOTE[el]} {getElementName(el)}</span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {hasElement(npc.resistentTo) && (
                                                                <div>
                                                                    <span className="font-semibold">{t("combatAdmin.npcDetails.resistance")}:</span>
                                                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                                                        {toElementArray(npc.resistentTo).map(el => (
                                                                            <span key={el} className="badge badge-xs badge-info gap-0.5">{ELEMENT_EMOTE[el]} {getElementName(el)}</span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {hasElement(npc.imuneTo) && (
                                                                <div>
                                                                    <span className="font-semibold">{t("combatAdmin.npcDetails.immunity")}:</span>
                                                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                                                        {toElementArray(npc.imuneTo).map(el => (
                                                                            <span key={el} className="badge badge-xs badge-error gap-0.5">{ELEMENT_EMOTE[el]} {getElementName(el)}</span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {hasElement(npc.absorbElement) && (
                                                                <div>
                                                                    <span className="font-semibold">{t("combatAdmin.npcDetails.absorb")}:</span>
                                                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                                                        {toElementArray(npc.absorbElement).map(el => (
                                                                            <span key={el} className="badge badge-xs badge-success gap-0.5">{ELEMENT_EMOTE[el]} {getElementName(el)}</span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* D&D Extras */}
                                                    {hasDndExtras && (
                                                        <div className="flex flex-col gap-0.5 text-xs">
                                                            {(npc.damageVulnerabilities?.length ?? 0) > 0 && (
                                                                <span><strong>{t("combatAdmin.npcDetails.damageVulnerabilities")}:</strong> {npc.damageVulnerabilities!.join(", ")}</span>
                                                            )}
                                                            {(npc.damageImmunities?.length ?? 0) > 0 && (
                                                                <span><strong>{t("combatAdmin.npcDetails.damageImmunities")}:</strong> {npc.damageImmunities!.join(", ")}</span>
                                                            )}
                                                            {(npc.conditionImmunities?.length ?? 0) > 0 && (
                                                                <span><strong>{t("combatAdmin.npcDetails.conditionImmunities")}:</strong> {npc.conditionImmunities!.map(s => getStatusLabel(s)).join(", ")}</span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Challenge / Proficiency */}
                                                    {hasChallenge && (
                                                        <div className="flex gap-4 text-xs">
                                                            {npc.challengeRating && (
                                                                <span><strong>{t("combatAdmin.npcDetails.challenge")}:</strong> {npc.challengeRating}</span>
                                                            )}
                                                            {npc.proficiencyBonus && (
                                                                <span><strong>{t("combatAdmin.npcDetails.proficiencyBonus")}:</strong> +{npc.proficiencyBonus}</span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Passives (D&D stat block style) */}
                                                    {(npc.passives?.length ?? 0) > 0 && (
                                                        <div className="flex flex-col gap-1 text-xs">
                                                            <div className="flex items-center gap-1">
                                                                <div className="flex-1 border-t border-cyan-700/40" />
                                                                <span className="font-bold text-sm text-cyan-400 uppercase tracking-wide">{t("combatAdmin.npcDetails.passives")}</span>
                                                                <div className="flex-1 border-t border-cyan-700/40" />
                                                            </div>
                                                            {npc.passives!.map((passive, idx) => (
                                                                <div key={idx} className="leading-snug">
                                                                    <span className="text-cyan-300">{"▸ "}</span><span className="italic opacity-90">{t(passive).replace("{{dice}}", "")}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Actions (D&D stat block style) */}
                                                    {(npc.attackList?.length ?? 0) > 0 && (
                                                        <div className="flex flex-col gap-1 text-xs">
                                                            <div className="flex items-center gap-1">
                                                                <div className="flex-1 border-t border-red-700/40" />
                                                                <span className="font-bold text-sm text-red-400 uppercase tracking-wide">{t("combatAdmin.npcDetails.actions")}</span>
                                                                <div className="flex-1 border-t border-red-700/40" />
                                                            </div>
                                                            {npc.attackList!.map((atk, idx) => {
                                                                const actionName = atk.name ? t(atk.name) : getAttackTypeLabel(atk.type);
                                                                const actionDesc = generateActionDescription(npc, atk);
                                                                return (
                                                                    <div key={idx} className="leading-snug">
                                                                        <strong className="text-red-300">{actionName}.</strong>{" "}
                                                                        <span className="italic opacity-90">{renderTextWithDiceButtons(actionDesc, `${npc.name ?? ""} – ${actionName}`, diceBoardRef, timeoutDiceBoardRef)}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {/* Properties */}
                                                    {hasProperties && (
                                                        <div className="flex flex-wrap gap-1 items-center">
                                                            {npc.isFlying && <span className="badge badge-xs badge-info">{t("combatAdmin.npcDetails.flying")}</span>}
                                                            {npc.playFirst && <span className="badge badge-xs badge-warning">{t("combatAdmin.npcDetails.playFirst")}</span>}
                                                            {npc.initiativeBonus != null && npc.initiativeBonus !== 0 && (
                                                                <span className="badge badge-xs badge-ghost">{t("combatAdmin.npcDetails.initBonus")}: {npc.initiativeBonus >= 0 ? "+" : ""}{npc.initiativeBonus}</span>
                                                            )}
                                                            {npc.maxLifeBonus != null && npc.maxLifeBonus !== 0 && (
                                                                <span className="badge badge-xs badge-ghost">{t("combatAdmin.npcDetails.maxHpBonus")}: {npc.maxLifeBonus >= 0 ? "+" : ""}{npc.maxLifeBonus}</span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Weak Points +/- */}
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="font-semibold opacity-70">{t("combatAdmin.npcDetails.weakPoints")}:</span>
                                                        <button
                                                            className="btn btn-xs btn-ghost px-1 min-h-0 h-5"
                                                            onClick={async () => {
                                                                if (m.rowId && currentWeakPoints > 0) {
                                                                    await APIBattle.updateWeakPoints(m.rowId, currentWeakPoints - 1);
                                                                    await reloadBattleDetails(true);
                                                                }
                                                            }}
                                                            disabled={currentWeakPoints <= 0}
                                                        >
                                                            <FaMinus size={8} />
                                                        </button>
                                                        <span className="font-mono font-bold">{currentWeakPoints}</span>
                                                        <button
                                                            className="btn btn-xs btn-ghost px-1 min-h-0 h-5"
                                                            onClick={async () => {
                                                                if (m.rowId) {
                                                                    await APIBattle.updateWeakPoints(m.rowId, currentWeakPoints + 1);
                                                                    await reloadBattleDetails(true);
                                                                }
                                                            }}
                                                        >
                                                            <FaPlus size={8} />
                                                        </button>
                                                    </div>
                                                </div>
                                                </div>
                                                </div>
                                            );
                                        })()}

                                        {/* Sub-linhas de ataque */}
                                        {entityAttacks.map(a => {
                                            const defesaFalhou = a.totalDefended == null || a.totalDefended > 0

                                            return (
                                                <div key={`attack-${a.id}`} className="flex flex-wrap items-center gap-2 bg-base-300/40 rounded px-2 py-1 text-xs">
                                                    <span className="badge badge-sm badge-error">{t("combatAdmin.labels.attacked")}</span>

                                                    <span className="opacity-70">{t("combatAdmin.labels.totalPower")}:</span>
                                                    <span className="font-mono">{a.totalPower}</span>

                                                    <span className="opacity-70">{t("combatAdmin.labels.attacker")}:</span>
                                                    <span className="font-mono">#{displayIndex.get(a.sourceBattleId) ?? "?"}</span>

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
                                    </React.Fragment>
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
        // Look up live entity data instead of using stale snapshot
        const liveHp = [...teamA, ...teamB].find(e => e.rowId === editingHp.rowId) ?? editingHp;
        return (
            <HpEditModal
                open
                name={liveHp.name}
                currentHp={liveHp.currentHp}
                maxHp={liveHp.maxHp}
                onClose={() => setEditingHp(null)}
                onConfirm={async (newHp, newMaxHp) => {
                    if (!editingHp) return;
                    if (newHp !== liveHp.currentHp) {
                        handleHpSet(liveHp, newHp);
                    }
                    if (newMaxHp !== liveHp.maxHp) {
                        try {
                            await APIBattle.updateCharacterMaxHp(liveHp.rowId ?? 0, newMaxHp);
                        } catch (e) {
                            console.error(e);
                            showToast(t("combatAdmin.toasts.errorUpdatingHp"));
                        }
                    }
                    setEditingHp(null);
                }}
            />
        );
    }

    function renderBreakEditModal() {
        if (!pendingBreak) return null;
        const { entity } = pendingBreak;
        const currentRemaining = 2 - (entity.breakCount ?? 0);
        const newBreakCount = 2 - editBreakValue;
        const oldBreakCount = entity.breakCount ?? 0;
        return createPortal(
            <dialog className="modal modal-open" style={{ zIndex: 9999 }}>
                <div className="modal-box max-w-xs">
                    <h3 className="font-bold text-lg">{t("combatAdmin.labels.breakEditTitle")}</h3>
                    <p className="text-sm opacity-70 mb-4">{entity.name}</p>
                    <div className="flex items-center justify-center gap-4">
                        <button
                            className="btn btn-circle btn-sm"
                            disabled={editBreakValue <= 0}
                            onClick={() => setEditBreakValue(v => Math.max(0, v - 1))}
                        >−</button>
                        <div className="flex gap-2">
                            {[0, 1].map(i => (
                                <div
                                    key={i}
                                    className={`w-4 h-8 rounded border-2 ${i < editBreakValue ? "bg-yellow-400 border-yellow-500 shadow-[0_0_6px_rgba(250,204,21,0.9)]" : "border-gray-500/60 bg-gray-400/15"}`}
                                />
                            ))}
                        </div>
                        <button
                            className="btn btn-circle btn-sm"
                            disabled={editBreakValue >= 2}
                            onClick={() => setEditBreakValue(v => Math.min(2, v + 1))}
                        >+</button>
                    </div>
                    <p className="text-center text-xs opacity-50 mt-2">{editBreakValue}/2</p>
                    <div className="modal-action">
                        <button className="btn btn-ghost btn-sm" onClick={() => setPendingBreak(null)}>{t("common.cancel")}</button>
                        <button className="btn btn-warning btn-sm" disabled={editBreakValue === currentRemaining} onClick={async () => {
                            if (entity.rowId != null) {
                                await APIBattle.updateBreakCount(entity.rowId, newBreakCount);
                                if (newBreakCount > oldBreakCount) {
                                    await APIBattle.addStatus({
                                        battleCharacterId: entity.rowId,
                                        effectType: "Broken",
                                        ammount: 1,
                                        remainingTurns: 1,
                                    });
                                }
                            }
                            setPendingBreak(null);
                        }}>{t("combatAdmin.labels.confirm")}</button>
                    </div>
                </div>
                <div className="modal-backdrop" onClick={() => setPendingBreak(null)} />
            </dialog>,
            document.body
        );
    }

    function renderEditMpModal() {
        if (!editingMp) return null;
        // Look up live entity data instead of using stale snapshot
        const liveMp = [...teamA, ...teamB].find(e => e.rowId === editingMp.rowId) ?? editingMp;
        return (
            <ApEditModal
                open
                name={liveMp.name}
                currentAp={liveMp.currentMp ?? 0}
                maxAp={liveMp.maxMp ?? 0}
                onClose={() => setEditingMp(null)}
                onConfirm={(newAp) => {
                    if (!editingMp) return;
                    if (newAp !== (liveMp.currentMp ?? 0)) {
                        handleMpSet(liveMp, newAp);
                    }
                    setEditingMp(null);
                }}
            />
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
                            placeholder={String(gradientCurrentCharges)}
                            min={0}
                            max={3}
                            onChange={(e) => setGradientCharges(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleConfirmGradient(); }}
                            ref={focusRef}
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
                            placeholder={String(gustaveCurrentChargePoints)}
                            min={0}
                            max={maxCharges}
                            onChange={(e) => setGustaveChargePoints(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleConfirmGustaveCharge(); }}
                            ref={focusRef}
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
                            placeholder={String(scielCurrentSun)}
                            min={0}
                            max={20}
                            onChange={(e) => setScielSunCharges(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleConfirmScielCharges(); }}
                            ref={focusRef}
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
                            placeholder={String(scielCurrentMoon)}
                            min={0}
                            max={20}
                            onChange={(e) => setScielMoonCharges(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleConfirmScielCharges(); }}
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
                            placeholder={String(scielCurrentTwilight)}
                            min={0}
                            max={40}
                            onChange={(e) => setScielTwilight(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleConfirmScielCharges(); }}
                        />
                    </div>

                    {((scielTwilight !== "" && (parseInt(scielTwilight) || 0) > 0) || (scielTwilight === "" && scielCurrentTwilight > 0)) && (
                        <div>
                            <label className="label">
                                <span className="label-text">{t("combatAdmin.labels.twilightTurns")}</span>
                            </label>
                            <input
                                type="number"
                                className="input input-bordered w-full"
                                value={scielTwilightTurns}
                                placeholder={String(scielCurrentTwilightTurns)}
                                min={1}
                                max={99}
                                onChange={(e) => setScielTwilightTurns(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleConfirmScielCharges(); }}
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
                <div className="modal-box max-w-5xl w-full max-h-[90vh] sm:max-h-[80vh] overflow-y-auto flex flex-col gap-4 sm:gap-6 p-4 sm:p-6">
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
                        <label className={`flex items-center gap-2 mt-1 select-none ${campaignInfo.currentLocationId ? "cursor-pointer" : "opacity-40 cursor-not-allowed"}`}>
                            <input
                                type="checkbox"
                                className="checkbox checkbox-sm checkbox-primary"
                                checked={currentLocationOnly}
                                disabled={!campaignInfo.currentLocationId}
                                onChange={(e) => { setCurrentLocationOnly(e.target.checked); localStorage.setItem("combatAdmin.currentLocationOnly", String(e.target.checked)); }}
                            />
                            <span className="text-sm">{t("combatAdmin.labels.currentLocationOnly")}</span>
                        </label>
                    </div>

                    <div className="border rounded-lg">
                        <div className="px-4 py-2 border-b flex items-center justify-between">
                            <div className="font-semibold text-sm">{t("combatAdmin.labels.players")}</div>
                            <div className="flex items-center gap-2">
                                {bulkAdded ? <FaCheck className="text-success w-4 h-4" /> : null}
                                <button className="btn btn-xs btn-secondary" onClick={() => handleAddAllPlayers(filteredPlayers)}>
                                    {t("combatAdmin.labels.addAll")}
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[28vh] overflow-y-auto">
                            {filteredPlayers.length === 0 ? (
                                <div className="text-center text-sm opacity-60 py-6">
                                    {t("combatAdmin.labels.noPlayersFound")}
                                </div>
                            ) : (
                                <div className="flex flex-col divide-y divide-base-300">
                                    {filteredPlayers.map((entity, idx) => (
                                        <div key={`player-${entity.externalId}-${idx}`} className="flex items-center gap-2 px-3 py-2">
                                            {renderAvatarCell(entity)}
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <span className="font-semibold text-sm truncate">{entity.name}</span>
                                                <span className="text-xs opacity-60 truncate">{renderCharacterCell(entity)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {justAddedId === entity.externalId ? (
                                                    <FaCheck className="text-success w-4 h-4" />
                                                ) : null}
                                                <button className="btn btn-xs btn-primary" onClick={() => handleAddToTeam(entity)}>
                                                    {t("combatAdmin.labels.add")}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="border rounded-lg">
                        <div className="px-4 py-2 border-b flex items-center justify-between">
                            <div className="font-semibold text-sm">{t("combatAdmin.labels.npcs")}</div>
                            <div className="flex items-center gap-2 text-xs opacity-70">
                                <button className="btn btn-xs btn-ghost gap-1" onClick={() => handleSort("name")}>
                                    {t("combatAdmin.labels.name")} {getSortIcon("name")}
                                </button>
                                <button className="btn btn-xs btn-ghost gap-1" onClick={() => handleSort("difficulty")}>
                                    {t("combatAdmin.labels.difficulty")} {getSortIcon("difficulty")}
                                </button>
                            </div>
                        </div>
                        <div className="max-h-[50vh] overflow-y-auto">
                            {filteredEnemies.length === 0 ? (
                                <div className="text-center text-sm opacity-60 py-6">
                                    Nenhum inimigo encontrado.
                                </div>
                            ) : (
                                <div className="flex flex-col divide-y divide-base-300">
                                    {filteredEnemies.map((entity, idx) => (
                                        <div key={`npc-${entity.externalId}-${idx}`} className="flex items-center gap-2 px-3 py-2">
                                            {renderAvatarCell(entity)}
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <span className="font-semibold text-sm truncate">{entity.name}</span>
                                                <span className="text-xs opacity-60">
                                                    CR {formatCR(calculateNPCDifficulty(entity.externalId.toString()))}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {justAddedId === entity.externalId ? (
                                                    <FaCheck className="text-success w-4 h-4" />
                                                ) : null}
                                                <button className="btn btn-xs btn-primary" onClick={() => handleAddToTeam(entity)}>
                                                    {t("combatAdmin.labels.add")}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
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
            <FloatingDiceRoller diceBoardRef={diceBoardRef} timeoutDiceBoardRef={timeoutDiceBoardRef} className="bottom-4 right-4" />

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

                    {/* Seleção de Encontro (apenas durante setup) */}
                    {battleStatus === 'starting' && encounters.length > 0 && (
                        <>
                            <div className="card bg-base-200 shadow-inner">
                                <div className="p-4 flex items-center gap-3">
                                    <button
                                        className="btn btn-sm btn-outline flex-1"
                                        disabled={loadingEncounter}
                                        onClick={() => { setEncounterFilter(""); setShowEncounterModal(true); }}
                                    >
                                        {loadingEncounter ? (
                                            <span className="loading loading-spinner loading-sm" />
                                        ) : selectedEncounterId ? (
                                            (() => { const enc = encounters.find(e => e.id === selectedEncounterId); return t("combatAdmin.encounter.selected", { name: enc?.locationId ? getLocationName(enc.locationId) : `#${enc?.id}` }); })()
                                        ) : (
                                            t("combatAdmin.encounter.select")
                                        )}
                                    </button>
                                    {selectedEncounterId && (
                                        <button
                                            className="btn btn-sm btn-ghost btn-square text-error"
                                            title={t("combatAdmin.encounter.clear")}
                                            onClick={() => { setSelectedEncounterId(null); }}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Modal de seleção de encontro */}
                            {showEncounterModal && (
                                <dialog className="modal modal-open">
                                    <div className="modal-box w-[95vw] max-w-2xl max-h-[85vh] flex flex-col p-4 sm:p-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-bold text-lg">{t("combatAdmin.encounter.select")}</h3>
                                            <button className="btn btn-sm btn-ghost" onClick={() => setShowEncounterModal(false)}>✕</button>
                                        </div>

                                        <input
                                            type="text"
                                            className="input input-bordered input-sm w-full mb-2"
                                            placeholder={t("combatAdmin.encounter.filterPlaceholder")}
                                            value={encounterFilter}
                                            onChange={(e) => setEncounterFilter(e.target.value)}
                                            autoFocus
                                        />
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                                            <label className={`flex items-center gap-2 select-none ${campaignInfo.currentLocationId ? "cursor-pointer" : "opacity-40 cursor-not-allowed"}`}>
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-sm checkbox-primary"
                                                    checked={encounterLocationOnly}
                                                    disabled={!campaignInfo.currentLocationId}
                                                    onChange={(e) => { setEncounterLocationOnly(e.target.checked); localStorage.setItem("combatAdmin.encounterLocationOnly", String(e.target.checked)); }}
                                                />
                                                <span className="text-sm">{t("combatAdmin.labels.currentLocationOnly")}</span>
                                            </label>
                                        </div>

                                        <div className="overflow-y-auto flex-1 space-y-2 -mx-1 px-1 py-1">
                                            {encounters
                                                .filter(enc => {
                                                    if (encounterLocationOnly && campaignInfo.currentLocationId) {
                                                        if (enc.locationId !== campaignInfo.currentLocationId) return false;
                                                    }
                                                    if (encounterFilter) {
                                                        const displayName = enc.name || (enc.locationId ? getLocationName(enc.locationId) : `#${enc.id}`);
                                                        return displayName.toLowerCase().includes(encounterFilter.toLowerCase());
                                                    }
                                                    return true;
                                                })
                                                .map(enc => {
                                                    const npcCount = enc.npcs.reduce((sum, n) => sum + n.quantity, 0);
                                                    const rewardCount = enc.rewards.length;
                                                    const totalCR = enc.npcs.reduce((sum, n) => sum + calculateNPCDifficulty(n.npcId) * n.quantity, 0);
                                                    const isSelected = enc.id === selectedEncounterId;

                                                    return (
                                                        <div
                                                            key={enc.id}
                                                            className={`card bg-base-200 cursor-pointer hover:bg-base-300 transition-colors ${isSelected ? 'ring-2 ring-primary' : ''}`}
                                                            onClick={() => {
                                                                handleLoadEncounter(enc.id);
                                                                setShowEncounterModal(false);
                                                            }}
                                                        >
                                                            <div className="p-3">
                                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                                                                    <span className="font-bold">
                                                                        {enc.name ? (
                                                                            <>
                                                                                {enc.name}
                                                                                {enc.locationId && <span className="ml-2 text-xs font-normal opacity-60">{getLocationName(enc.locationId)}</span>}
                                                                            </>
                                                                        ) : (enc.locationId ? getLocationName(enc.locationId) : `${t("encounters.title")} #${enc.id}`)}
                                                                    </span>
                                                                    <div className="flex flex-wrap gap-1 text-xs">
                                                                        <span className="badge badge-sm badge-ghost">{t("combatAdmin.encounter.npcs", { count: npcCount })}</span>
                                                                        <span className="badge badge-sm badge-ghost">{t("combatAdmin.encounter.rewards", { count: rewardCount })}</span>
                                                                        <span className="badge badge-sm badge-warning">{t("combatAdmin.encounter.totalCR", { cr: formatCR(totalCR) })}</span>
                                                                    </div>
                                                                </div>

                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {enc.playerCharacterIds?.map(charId => {
                                                                        const char = CHARACTERS_LIST.find(c => c.id === charId);
                                                                        return (
                                                                            <div key={charId} className="flex items-center gap-1.5 bg-primary/10 rounded-full px-2 py-0.5 border border-primary/30">
                                                                                <div className="w-5 h-5 rounded-full bg-base-300 overflow-hidden shrink-0">
                                                                                    <img src={`/characters/${charId}.webp`} alt={char?.label ?? charId} className="w-full h-full object-cover" />
                                                                                </div>
                                                                                <span className="text-xs font-medium">{char?.label ?? charId}</span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                    {enc.npcs.map((npc, idx) => {
                                                                        const npcInfo = getNpcById(npc.npcId);
                                                                        return (
                                                                            <div key={idx} className="flex items-center gap-1 bg-base-300 rounded-lg px-2 py-1">
                                                                                <div className="avatar">
                                                                                    <div
                                                                                        className="w-6 h-6 rounded flex items-center justify-center bg-base-300 cursor-zoom-in"
                                                                                        onClick={() => setImageModalNpc({ id: npc.npcId, name: npcInfo?.name ?? npc.npcId })}
                                                                                    >
                                                                                        <img
                                                                                            src={`/enemies/${npc.npcId}.png`}
                                                                                            alt={npcInfo?.name ?? npc.npcId}
                                                                                            onError={(e) => handleNpcImgError(e, npc.npcId)}
                                                                                        />
                                                                                        <FaSkull className="hidden text-base-content opacity-40 text-xs" />
                                                                                    </div>
                                                                                </div>
                                                                                <span className="text-xs">{npcInfo?.name ?? npc.npcId}</span>
                                                                                {npc.quantity > 1 && (
                                                                                    <span className="badge badge-xs badge-primary">×{npc.quantity}</span>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                    <form method="dialog" className="modal-backdrop">
                                        <button onClick={() => setShowEncounterModal(false)}>close</button>
                                    </form>
                                </dialog>
                            )}
                        </>
                    )}

                    {/* Mostrar recompensas no lugar da barra de turnos se a batalha terminou */}
                    {battleStatus === 'finished' && (battleRewards.length > 0 || npcDrops.length > 0 || totalBattleXp > 0) ? (
                        <div className="card bg-base-200 p-6">
                            <h2 className="text-3xl font-bold text-center mb-2 text-success">
                                {t("combat.victoryTitle")}
                            </h2>
                            <p className="text-center text-lg mb-2 opacity-80">
                                {t("combat.rewardsEarned")}
                            </p>
                            {totalBattleXp > 0 && (() => {
                                const playerCount = battleDetails?.characters?.filter(ch => ch.type === "player").length ?? 1;
                                const xpPerPlayer = Math.floor(totalBattleXp / playerCount);
                                return (
                                    <>
                                        <p className={`text-center text-xl font-bold ${playerCount > 1 ? "mb-1" : "mb-6"} text-amber-500`}>
                                            +{totalBattleXp.toLocaleString()} XP
                                        </p>
                                        {playerCount > 1 && (
                                            <p className="text-center text-sm opacity-60 mb-6">
                                                {xpPerPlayer.toLocaleString()} {t("combat.xpPerPlayer")}
                                            </p>
                                        )}
                                    </>
                                );
                            })()}

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
                                            className="flex flex-col gap-3 bg-base-300 p-4 rounded-lg"
                                        >
                                            <div className="flex items-center gap-4">
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

                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-lg">{displayName}</h3>
                                                    <div className="flex flex-wrap items-center gap-1 text-sm opacity-70">
                                                        {isWeapon ? (
                                                            <span className="badge badge-sm badge-warning">
                                                                {t("rewards.weapon")}
                                                            </span>
                                                        ) : (
                                                            <span
                                                                className="badge badge-sm"
                                                                style={{
                                                                    backgroundColor: pictoColor ? pictoColorHex[pictoColor as keyof typeof pictoColorHex] : "rgba(255,255,255,0.3)",
                                                                    color: "black"
                                                                }}
                                                            >
                                                                {t("rewards.picto")}
                                                            </span>
                                                        )}
                                                        <span className="badge badge-sm badge-outline whitespace-nowrap">
                                                            {t("rewards.level")} {reward.level}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Weapon/Picto attributes & passives */}
                                            {isWeapon ? (() => {
                                                // Find weapon DTO across all weapon files
                                                let weaponDto: import("../types/WeaponDTO").WeaponDTO | undefined;
                                                for (const weapons of WeaponsDataLoader.getAllSeparated().values()) {
                                                    weaponDto = weapons.find(w => toKebabCase(w.name) === kebabId || w.name === reward.itemId);
                                                    if (weaponDto) break;
                                                }
                                                if (!weaponDto) return null;
                                                const { attributes, passives } = weaponDto;
                                                return (
                                                    <div className="bg-base-200 rounded-lg p-3 text-sm space-y-2">
                                                        <div className="flex flex-wrap gap-2">
                                                            <span className="badge badge-sm">{t("weapons.power")}: {attributes.power}</span>
                                                            <span className="badge badge-sm">{ELEMENT_EMOTE[attributes.element] ?? ""} {getElementName(attributes.element)}</span>
                                                            {Object.entries(attributes.scaling).map(([attr, rank]) => (
                                                                <span key={attr} className="badge badge-sm badge-outline">
                                                                    {t(`weapons.${attr}`)}: {rank}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        {passives.length > 0 && (
                                                            <div className="space-y-1">
                                                                <span className="text-xs font-semibold opacity-70">{t("weapons.passives")}</span>
                                                                {passives.map((p, i) => (
                                                                    <div key={i} className="text-xs opacity-80 flex gap-1">
                                                                        <span className="font-bold whitespace-nowrap">Lv.{p.level}:</span>
                                                                        <span>{getWeaponPassive(kebabId, p.level) || p.effect}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })() : (() => {
                                                const pictoInfo = PictosList.find((p: any) => p.id === kebabId);
                                                if (!pictoInfo) return null;
                                                const statEntries = Object.entries(pictoInfo.status).filter(([, v]) => v !== undefined && v !== 0);
                                                const level = reward.level ?? 1;
                                                const calcStat = (stat: string, raw: number) => {
                                                    switch (stat) {
                                                        case "speed": return calculatePictoSpeed(raw, level);
                                                        case "health": return calculatePictoHealth(raw, level);
                                                        case "defense": return calculatePictoDefense(raw, level);
                                                        default: return calculatePictoAbility(raw, level);
                                                    }
                                                };
                                                return (
                                                    <div className="bg-base-200 rounded-lg p-3 text-sm space-y-2">
                                                        {statEntries.length > 0 && (
                                                            <div className="flex flex-wrap gap-2">
                                                                {statEntries.map(([stat, value]) => (
                                                                    <span key={stat} className="badge badge-sm">
                                                                        {t(`pictos.${stat}`)}: +{calcStat(stat, value as number)}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {pictoInfo.description && (
                                                            <div className="text-xs opacity-80">
                                                                {getPictoDescription(kebabId)}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}

                                            <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full">
                                                {localPlayers.map(player => {
                                                    const rawCharacterName = player.playerSheet?.characterId || "?";
                                                    const characterName = rawCharacterName.charAt(0).toUpperCase() + rawCharacterName.slice(1);
                                                    const playerName = player.playerSheet?.name || "?";

                                                    const battleChar = battleDetails?.characters.find(
                                                        ch => ch.type === "player" && ch.id === String(player.id)
                                                    );
                                                    const battleID = battleChar?.battleID;

                                                    const baseLabel = battleID
                                                        ? `#${displayIndex.get(battleID) ?? "?"} ${characterName} (${playerName})`
                                                        : `${characterName} (${playerName})`;

                                                    if (isWeapon) {
                                                        // Arma: manter lógica original (desabilitado se já possui)
                                                        const alreadyHas = player.weapons?.some(w => w.id.toLowerCase() === kebabId.toLowerCase());
                                                        const canUse = canCharacterUseWeapon(player.playerSheet?.characterId, kebabId);
                                                        const isDisabled = alreadyHas || !canUse;
                                                        const tooltipText = alreadyHas ? t("rewards.alreadyOwned") : !canUse ? t("rewards.cannotUse") : undefined;

                                                        return (
                                                            <button
                                                                key={player.id}
                                                                onClick={async () => {
                                                                    try {
                                                                        await APIRewards.claimReward(player.id, reward);
                                                                        showToast(`${displayName} ${t("rewards.level")} ${reward.level} → ${characterName}!`);
                                                                    } catch (error) {
                                                                        console.error("Erro ao reivindicar recompensa:", error);
                                                                        showToast(t("combatAdmin.toasts.errorClaimingReward"));
                                                                    }
                                                                }}
                                                                className={`btn btn-sm w-full sm:w-auto ${isDisabled ? 'btn-disabled' : 'btn-success'}`}
                                                                disabled={isDisabled}
                                                                title={tooltipText}
                                                            >
                                                                {baseLabel}
                                                            </button>
                                                        );
                                                    }

                                                    // Picto: lógica de upgrade inteligente
                                                    const existingPicto = player.pictos?.find(p => p.pictoId.toLowerCase() === kebabId.toLowerCase());

                                                    if (!existingPicto) {
                                                        // Novo picto → botão "Claim"
                                                        return (
                                                            <button
                                                                key={player.id}
                                                                onClick={async () => {
                                                                    try {
                                                                        await APIRewards.claimReward(player.id, reward);
                                                                        // Atualizar localPlayers para refletir o novo picto
                                                                        setLocalPlayers(prev => prev.map(p =>
                                                                            p.id === player.id
                                                                                ? {
                                                                                    ...p,
                                                                                    pictos: [...(p.pictos ?? []), {
                                                                                        id: Date.now(), // ID temporário
                                                                                        playerId: player.id,
                                                                                        pictoId: kebabId.toLowerCase(),
                                                                                        level: reward.level,
                                                                                        slot: null
                                                                                    }]
                                                                                }
                                                                                : p
                                                                        ));
                                                                        showToast(`${displayName} ${t("rewards.level")} ${reward.level} → ${characterName}!`);
                                                                    } catch (error) {
                                                                        console.error("Erro ao reivindicar recompensa:", error);
                                                                        showToast(t("combatAdmin.toasts.errorClaimingReward"));
                                                                    }
                                                                }}
                                                                className="btn btn-sm btn-success w-full sm:w-auto"
                                                            >
                                                                {baseLabel}
                                                            </button>
                                                        );
                                                    }

                                                    const currentLevel = existingPicto.level ?? 1;

                                                    if (currentLevel >= 4) {
                                                        // Nível máximo → botão desabilitado
                                                        return (
                                                            <button
                                                                key={player.id}
                                                                className="btn btn-sm btn-disabled w-full sm:w-auto"
                                                                disabled
                                                                title={t("rewards.maxLevel")}
                                                            >
                                                                {baseLabel} - {t("rewards.maxLevel")}
                                                            </button>
                                                        );
                                                    }

                                                    // Upgrade → botão "↑ Nv. X+1"
                                                    const nextLevel = currentLevel + 1;
                                                    return (
                                                        <button
                                                            key={player.id}
                                                            onClick={async () => {
                                                                try {
                                                                    await APIPicto.updatePlayerPicto(existingPicto.id, { level: nextLevel });
                                                                    // Atualizar localPlayers para refletir o novo nível
                                                                    setLocalPlayers(prev => prev.map(p =>
                                                                        p.id === player.id
                                                                            ? {
                                                                                ...p,
                                                                                pictos: p.pictos?.map(pic =>
                                                                                    pic.id === existingPicto.id
                                                                                        ? { ...pic, level: nextLevel }
                                                                                        : pic
                                                                                )
                                                                            }
                                                                            : p
                                                                    ));
                                                                    showToast(`${displayName} ${t("rewards.upgraded", { level: nextLevel })} → ${characterName}!`);
                                                                } catch (error) {
                                                                    console.error("Erro ao fazer upgrade:", error);
                                                                    showToast(t("combatAdmin.toasts.errorClaimingReward"));
                                                                }
                                                            }}
                                                            className="btn btn-sm btn-info w-full sm:w-auto"
                                                        >
                                                            {baseLabel} - {t("rewards.upgrade", { level: nextLevel })}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Drops dos NPCs — hidden if battle has an associated encounter */}
                            {npcDrops.length > 0 && !battleDetails?.encounterId && (
                                <>
                                    <div className="divider my-2">{t("combatAdmin.npcDetails.drops")}</div>
                                    <div className="space-y-4">
                                        {npcDrops.map((reward, index) => {
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

                                            let pictoColor = null;
                                            if (!isWeapon) {
                                                const pictoInfo = PictosList.find((p: any) => p.id === kebabId);
                                                pictoColor = pictoInfo?.color;
                                            }

                                            return (
                                                <div key={`drop-${index}`} className="flex flex-col gap-3 bg-base-300 p-4 rounded-lg">
                                                    <div className="flex items-center gap-4">
                                                        <div className="avatar">
                                                            <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-base-200">
                                                                {isWeapon ? (
                                                                    <img
                                                                        src={imagePath}
                                                                        alt={displayName}
                                                                        className="w-full h-full object-contain"
                                                                        onError={(e) => { e.currentTarget.src = "/placeholder-item.png"; }}
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

                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-bold text-lg">{displayName}</h3>
                                                            <div className="flex flex-wrap items-center gap-1 text-sm opacity-70">
                                                                {isWeapon ? (
                                                                    <span className="badge badge-sm badge-warning">{t("rewards.weapon")}</span>
                                                                ) : (
                                                                    <span
                                                                        className="badge badge-sm"
                                                                        style={{
                                                                            backgroundColor: pictoColor ? pictoColorHex[pictoColor as keyof typeof pictoColorHex] : "rgba(255,255,255,0.3)",
                                                                            color: "black"
                                                                        }}
                                                                    >
                                                                        {t("rewards.picto")}
                                                                    </span>
                                                                )}
                                                                <span className="badge badge-sm badge-outline whitespace-nowrap">
                                                                    {t("rewards.level")} {reward.level}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full">
                                                        {localPlayers.map(player => {
                                                            const rawCharacterName = player.playerSheet?.characterId || "?";
                                                            const characterName = rawCharacterName.charAt(0).toUpperCase() + rawCharacterName.slice(1);
                                                            const playerName = player.playerSheet?.name || "?";

                                                            const battleChar = battleDetails?.characters.find(
                                                                ch => ch.type === "player" && ch.id === String(player.id)
                                                            );
                                                            const battleID = battleChar?.battleID;

                                                            const baseLabel = battleID
                                                                ? `#${displayIndex.get(battleID) ?? "?"} ${characterName} (${playerName})`
                                                                : `${characterName} (${playerName})`;

                                                            if (isWeapon) {
                                                                const alreadyHas = player.weapons?.some(w => w.id.toLowerCase() === kebabId.toLowerCase());
                                                                const canUse = canCharacterUseWeapon(player.playerSheet?.characterId, kebabId);
                                                                const isDisabled = alreadyHas || !canUse;
                                                                const tooltipText = alreadyHas ? t("rewards.alreadyOwned") : !canUse ? t("rewards.cannotUse") : undefined;

                                                                return (
                                                                    <button
                                                                        key={player.id}
                                                                        onClick={async () => {
                                                                            try {
                                                                                await APIRewards.claimReward(player.id, reward);
                                                                                showToast(`${displayName} ${t("rewards.level")} ${reward.level} → ${characterName}!`);
                                                                            } catch (error) {
                                                                                console.error("Erro ao reivindicar recompensa:", error);
                                                                                showToast(t("combatAdmin.toasts.errorClaimingReward"));
                                                                            }
                                                                        }}
                                                                        className={`btn btn-sm w-full sm:w-auto ${isDisabled ? 'btn-disabled' : 'btn-success'}`}
                                                                        disabled={isDisabled}
                                                                        title={tooltipText}
                                                                    >
                                                                        {baseLabel}
                                                                    </button>
                                                                );
                                                            }

                                                            const existingPicto = player.pictos?.find(p => p.pictoId.toLowerCase() === kebabId.toLowerCase());

                                                            if (!existingPicto) {
                                                                return (
                                                                    <button
                                                                        key={player.id}
                                                                        onClick={async () => {
                                                                            try {
                                                                                await APIRewards.claimReward(player.id, reward);
                                                                                setLocalPlayers(prev => prev.map(p =>
                                                                                    p.id === player.id
                                                                                        ? {
                                                                                            ...p,
                                                                                            pictos: [...(p.pictos ?? []), {
                                                                                                id: Date.now(),
                                                                                                playerId: player.id,
                                                                                                pictoId: kebabId.toLowerCase(),
                                                                                                level: reward.level,
                                                                                                slot: null
                                                                                            }]
                                                                                        }
                                                                                        : p
                                                                                ));
                                                                                showToast(`${displayName} ${t("rewards.level")} ${reward.level} → ${characterName}!`);
                                                                            } catch (error) {
                                                                                console.error("Erro ao reivindicar recompensa:", error);
                                                                                showToast(t("combatAdmin.toasts.errorClaimingReward"));
                                                                            }
                                                                        }}
                                                                        className="btn btn-sm btn-success w-full sm:w-auto"
                                                                    >
                                                                        {baseLabel}
                                                                    </button>
                                                                );
                                                            }

                                                            const currentLevel = existingPicto.level ?? 1;

                                                            if (currentLevel >= 4) {
                                                                return (
                                                                    <button
                                                                        key={player.id}
                                                                        className="btn btn-sm btn-disabled w-full sm:w-auto"
                                                                        disabled
                                                                        title={t("rewards.maxLevel")}
                                                                    >
                                                                        {baseLabel} - {t("rewards.maxLevel")}
                                                                    </button>
                                                                );
                                                            }

                                                            const nextLevel = currentLevel + 1;
                                                            return (
                                                                <button
                                                                    key={player.id}
                                                                    onClick={async () => {
                                                                        try {
                                                                            await APIPicto.updatePlayerPicto(existingPicto.id, { level: nextLevel });
                                                                            setLocalPlayers(prev => prev.map(p =>
                                                                                p.id === player.id
                                                                                    ? {
                                                                                        ...p,
                                                                                        pictos: p.pictos?.map(pic =>
                                                                                            pic.id === existingPicto.id
                                                                                                ? { ...pic, level: nextLevel }
                                                                                                : pic
                                                                                        )
                                                                                    }
                                                                                    : p
                                                                            ));
                                                                            showToast(`${displayName} ${t("rewards.upgraded", { level: nextLevel })} → ${characterName}!`);
                                                                        } catch (error) {
                                                                            console.error("Erro ao fazer upgrade:", error);
                                                                            showToast(t("combatAdmin.toasts.errorClaimingReward"));
                                                                        }
                                                                    }}
                                                                    className="btn btn-sm btn-info w-full sm:w-auto"
                                                                >
                                                                    {baseLabel} - {t("rewards.upgrade", { level: nextLevel })}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
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
                                onReorder={reloadBattleDetails}
                                displayIndex={displayIndex} />

                            {teamHasGradientPlayer(getActiveTurnCharacter()?.isEnemy ?? false) && (
                                <GradientBar
                                    characters={battleDetails?.characters}
                                    player={undefined}
                                    turns={battleDetails?.turns}
                                    forceShowTeamIsEnemy={getActiveTurnCharacter()?.isEnemy ?? false}
                                    isAdmin={true}
                                    onEditGradient={() => handleOpenGradientModal(getActiveTurnCharacter()?.isEnemy ?? false)}
                                />
                            )}

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
                    {renderBreakEditModal()}
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
            {imageModalNpc && (
                <NpcImageModal
                    npcId={imageModalNpc.id}
                    npcName={imageModalNpc.name}
                    open={true}
                    onClose={() => setImageModalNpc(null)}
                />
            )}
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
            "PICTO_EFFECTS_RESET",
            "WEAK_POINTS_CHANGED"
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
                collectBattleRewards(battleInfo.encounterId, battleInfo.characters).then(rewards => {
                    setBattleRewards(rewards);
                });
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

    function teamHasGradientPlayer(isEnemy: boolean): boolean {
        const teamPlayers = battleDetails?.characters?.filter(
            ch => ch.isEnemy === isEnemy && ch.type === "player"
        ) ?? [];
        if (teamPlayers.length === 0) return false;

        return teamPlayers.some(ch =>
            SpecialAttacksList.some(sa => sa.character === ch.id && sa.isGradient)
        );
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
        setIsSelectingTarget(true)
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
