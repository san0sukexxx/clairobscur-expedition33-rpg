import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useLocation, matchPath } from "react-router-dom";
import { useParams, useNavigate } from "react-router-dom";
import { FaUser, FaSkull, FaCheckCircle, FaDivide, FaShieldAlt } from "react-icons/fa";
import { LuSwords, LuSword } from "react-icons/lu";
import { GiBackpack, GiStoneTablet, GiCrystalShine, GiMagicSwirl } from "react-icons/gi";
import { MdOutlineKeyboardBackspace } from "react-icons/md";
import WeaponSection from "../components/WeaponSection";
import PlayerSheet from "../components/PlayerSheet";
import PictosTab from "../components/PictosTab";
import LuminasSection from "../components/LuminasSection";
import SkillsSection from "../components/SkillsSection";
import ItemsSection from "../components/ItemsSection";
import CombatSection from "../components/CombatSection";
import { COMBAT_MENU_ACTIONS, type CombatMenuAction } from "../utils/CombatMenuActions";
import { APIPlayer, type CreatePlayerInput, type GetPlayerResponse } from "../api/APIPlayer";
import { APICampaign, type Campaign } from "../api/APICampaign";
import { APIBattle, type AttackStatusEffectRequest, type CreateAttackRequest, type CreateDefenseRequest, type ResolveStatusRequest } from "../api/APIBattle";
import { APIItem } from "../api/APIItem";
import { type BattleCharacterInfo, type AttackResponse, type DefenseOption, type AttackType, type WeaponInfo, type StatusResponse } from "../api/ResponseModel";
import { resolveSkill, calculateSkillHitDamage, applySpecialEffects, getStatusEffectsForTarget } from "../utils/BattleSkillUtils";
import { SkillEffectsRegistry } from "../data/SkillEffectsRegistry";
import { getEnrichedCharacterSkills } from "../utils/SkillUtils";
import { WeaponsDataLoader } from "../lib/WeaponsDataLoader";
import DiceBoard, { type DiceBoardRef } from "../components/DiceBoard";
import {
  rollCommandForInitiative,
  rollCommandForDefense,
  initiativeTotal,
  calculateDefense,
  calculateMaxCounterDamage,
  rollCommandForAttack,
  calculateAttackDamage,
  calculateFreeShotPlus,
  playerHasShield,
  playerHasEmpowered,
  playerHasWeakened,
  calculateStatusResolvedTotalValue,
  calculateResolveStatusWithDiceTotal,
  getPlayerFrenzy,
  playerHasDizzy,
  playerPictosTotalSpeed,
  calculatePlayerCriticalMulti,
  calculateMaxHP,
  calculateMaxMP
} from "../utils/PlayerCalculator";

import {
  calculateFailureDiv,
  diceTotal,
  countCriticalRolls,
  countFailuresRolls
} from "../utils/DiceCalculator";

import { rollWithTimeout } from "../utils/RollUtils";
import PanelModal from "../components/PanelModal";
import { useToast } from "../components/Toast";
import { calculateRawWeaponPower } from "../utils/PlayerCalculator";
import { calculateNpcAttackReceivedDamage, checkForFragile, getWeaponElementModifier, hasEmpowered, hasHastened, hasShield, npcIsFlying } from "../utils/NpcCalculator";
import MasterEditingOverlay from "../components/MasterEditingOverlay"
import PendingAttacksModal from "../components/PendingAttacksModal"
import { getElementModifierText } from "../utils/ElementUtils";
import PendingStatusModal from "../components/PendingStatusModal";
import { rollCommandForResolveStatus } from "../utils/StatusCalculator";
import { statusNeedsResolveRoll } from "../utils/BattleUtils";

export default function PlayerPage() {
  const [tab, setTab] = useState<"ficha" | "combate" | "habilidades" | "inventario" | "arma" | "pictos" | "luminas">("ficha");
  const alreadyRan = useRef(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [wasMasterEditing, setWasMasterEditing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [player, setPlayer] = useState<GetPlayerResponse | null>(null);
  const [campaignInfo, setCampaignInfo] = useState<Campaign | null>(null);
  const diceBoardRef = useRef<DiceBoardRef>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState<string | undefined>(undefined);
  const [modalBody, setModalBody] = useState<React.ReactNode>(null);
  const [attackType, setAttackType] = useState<AttackType>("basic");
  const [isInventoryActiveInCombat, setIsInventoryActiveInCombat] = useState(false);
  const [isReviveMode, setIsReviveMode] = useState(false);
  const [revivePercent, setRevivePercent] = useState(30);
  const [combatTab, setCombatTab] = useState<"enemies" | "team" | null>(null);
  const [skillsInitialTab, setSkillsInitialTab] = useState<"list" | "picker">("list");
  const [isUsingSkillMode, setIsUsingSkillMode] = useState(false);
  const [pendingSkillId, setPendingSkillId] = useState<string | null>(null);
  const [isSelectingSkillTarget, setIsSelectingSkillTarget] = useState(false);
  const [isExecutingSkill, setIsExecutingSkill] = useState(false);
  const { showToast } = useToast();
  const { pathname } = useLocation();
  const isAdmin = !!matchPath(
    { path: "/campaign-player-admin/:campaign/:character", end: true },
    pathname
  );

  const [lastBattleLog, setLastBattleLog] = useState<number | undefined>();

  const timeoutDiceBoardRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const weaponList = useMemo(() => {
    return WeaponsDataLoader.getByFile(
      WeaponsDataLoader.fileForCharacter(player?.playerSheet?.characterId)
    );
  }, [player?.playerSheet?.characterId]);

  const [weaponInfo, setWeaponInfo] = useState<WeaponInfo>({
    weapon: null,
    details: null,
  });

  useEffect(() => {
    const weaponId = player?.playerSheet?.weaponId;

    if (!weaponId) {
      setWeaponInfo({ weapon: null, details: null });
      return;
    }

    const weapon = player?.weapons?.find(w => w.id === weaponId) ?? null;
    const details = weaponList.find(w => w.name === weaponId) ?? null;

    setWeaponInfo({ weapon, details });
  }, [player?.playerSheet?.weaponId, player?.weapons, weaponList]);

  const { campaign, character } = useParams<{
    campaign: string;
    character: string;
  }>();

  useEffect(() => {
    setup();
  }, []);

  useEffect(() => {
    if (tab !== "inventario") {
      setIsInventoryActiveInCombat(false);
    }
    if (tab !== "habilidades") {
      setSkillsInitialTab("list");
      setIsUsingSkillMode(false);
    }
    if (tab !== "combate") {
      setIsReviveMode(false);
      setCombatTab(null);
      setIsSelectingSkillTarget(false);
      setPendingSkillId(null);
    }
  }, [tab]);

  const checkPlayerLoop = useCallback(async () => {
    try {
      if (!player) return;

      const playerInfo = await APIPlayer.get(player.id, lastBattleLog);

      checkBattleLog(playerInfo);

      const hadBattle = player?.fightInfo != null;
      const hasBattleNow = playerInfo?.fightInfo != null;

      if (hadBattle !== hasBattleNow) {
        showToast(
          hasBattleNow
            ? "Uma batalha está em andamento"
            : "A batalha foi encerrada"
        );

        setPlayer(prev =>
          prev
            ? {
              ...prev,
              fightInfo: playerInfo?.fightInfo ?? undefined
            }
            : prev
        );
      }

      setWasMasterEditing(prev => {
        if (playerInfo.isMasterEditing && !prev) {
          setPlayer(p => (p ? { ...p, isMasterEditing: true } : p));
          return true;
        } else if (!playerInfo.isMasterEditing && prev) {
          setPlayer(playerInfo);
          return false;
        }
        return prev;
      });
    } catch (e: any) {
      showToast("Erro ao verificar editing");
    }
  }, [player, lastBattleLog]);

  useEffect(() => {
    const id = setInterval(() => {
      void checkPlayerLoop();
    }, 2000);

    return () => clearInterval(id);
  }, [checkPlayerLoop]);

  return (
    <div className="min-h-dvh bg-base-200">
      <DiceBoard ref={diceBoardRef} />

      {!isAdmin && player?.isMasterEditing && (
        <MasterEditingOverlay />
      )}

      <PendingStatusModal
        player={player}
        onTapResolve={onResolveStatus}
      />

      <PendingAttacksModal
        player={player}
        weaponList={weaponList}
        onSelectDefense={handleSelectDefense}
      />

      <PanelModal
        open={modalOpen}
        onClose={handleModalClose}
        title={modalTitle}
        size="md"
        showClose={false}
      >
        {modalBody}
      </PanelModal>

      {/* Navbar topo */}
      <div className="navbar bg-base-100 shadow sticky top-0 z-10">
        <div className="flex-1">
          <button
            onClick={() => !isExecutingSkill && handleNavigateBackToAdmin()}
            disabled={isExecutingSkill}
            className={`flex items-center gap-2 text-lg font-bold transition ${
              isExecutingSkill
                ? "opacity-50 cursor-not-allowed"
                : "hover:opacity-80"
            }`}
          >
            <MdOutlineKeyboardBackspace className="text-2xl" />
            <span>Ficha do Jogador</span>
          </button>
        </div>
      </div>

      {/* Conteúdo (deixa espaço para a btm-nav) */}
      <main className="p-4 max-w-md mx-auto pb-24">
        {loading && <div className="text-center opacity-70 py-16">Carregando…</div>}

        {error && !loading && (
          <div className="text-center text-error py-16">{error}</div>
        )}

        {/* Conteúdo da aba */}
        <section className="space-y-4">
          {!loading && !error && tab === "ficha" && (
            <PlayerSheet player={player} setPlayer={setPlayer} campaignInfo={campaignInfo} weaponInfo={weaponInfo} />
          )}

          {!loading && !error && tab === "arma" && (
            <WeaponSection player={player} setPlayer={setPlayer} weaponList={weaponList} isAdmin={isAdmin} />
          )}

          {!loading && !error && tab === "pictos" && (
            <PictosTab player={player} setPlayer={setPlayer} isAdmin={isAdmin} />
          )}

          {!loading && !error && tab === "luminas" && (
            <LuminasSection player={player} setPlayer={setPlayer} isAdmin={isAdmin} />
          )}

          {!loading && !error && tab === "inventario" && (
            <ItemsSection player={player} setPlayer={setPlayer} isInventoryActiveInCombat={isInventoryActiveInCombat} weaponInfo={weaponInfo} onReviveRequested={handleReviveRequested} onPotionUsed={handlePotionUsed} />
          )}

          {!loading && !error && tab === "combate" && (
            <CombatSection onMenuAction={handleCombatMenuAction} player={player} onSelectTarget={handleSelectAttackTarget} isReviveMode={isReviveMode} isSelectingSkillTarget={isSelectingSkillTarget} forcedTab={combatTab} onTabChange={setCombatTab} isExecutingSkill={isExecutingSkill} />
          )}

          {!loading && !error && tab === "habilidades" && (
            <SkillsSection player={player} setPlayer={setPlayer} isAdmin={isAdmin} initialTab={skillsInitialTab} isUsingSkillMode={isUsingSkillMode} onUseSkill={handleUseSkill} />
          )}
        </section>
      </main>

      {/* Abas fixas no rodapé — somente ícones, distribuídos igualmente */}
      <div className="fixed bottom-0 left-0 right-0 bg-base-100 border-t shadow-lg">
        <nav className="grid grid-cols-7">
          <button
            className={`py-3 ${tab === "ficha" ? "text-primary" : "text-base-content/70"} ${isExecutingSkill ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => !isExecutingSkill && setTab("ficha")}
            disabled={isExecutingSkill}
            aria-label="Ficha"
          >
            <FaUser className="mx-auto text-2xl" />
          </button>

          <button
            className={`py-3 ${tab === "arma" ? "text-primary" : "text-base-content/70"} ${isExecutingSkill ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => !isExecutingSkill && setTab("arma")}
            disabled={isExecutingSkill}
            aria-label="Arma"
          >
            <LuSword className="mx-auto text-2xl" />
          </button>

          <button
            className={`py-3 ${tab === "pictos" ? "text-primary" : "text-base-content/70"} ${isExecutingSkill ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => !isExecutingSkill && setTab("pictos")}
            disabled={isExecutingSkill}
            aria-label="Pictos"
          >
            <GiStoneTablet className="mx-auto text-2xl" />
          </button>

          <button
            className={`py-3 ${tab === "luminas" ? "text-primary" : "text-base-content/70"} ${isExecutingSkill ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => !isExecutingSkill && setTab("luminas")}
            disabled={isExecutingSkill}
            aria-label="Luminas"
          >
            <GiCrystalShine className="mx-auto text-2xl" />
          </button>

          <button
            className={`py-3 ${tab === "inventario" ? "text-primary" : "text-base-content/70"} ${isExecutingSkill ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => !isExecutingSkill && setTab("inventario")}
            disabled={isExecutingSkill}
            aria-label="Inventário"
          >
            <GiBackpack className="mx-auto text-2xl" />
          </button>

          <button
            className={`py-3 ${tab === "habilidades" ? "text-primary" : "text-base-content/70"} ${isExecutingSkill ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => !isExecutingSkill && setTab("habilidades")}
            disabled={isExecutingSkill}
            aria-label="Habilidades"
          >
            <GiMagicSwirl className="mx-auto text-2xl" />
          </button>

          <button
            className={`py-3 ${tab === "combate" ? "text-primary" : "text-base-content/70"} ${isExecutingSkill ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => !isExecutingSkill && setTab("combate")}
            disabled={isExecutingSkill}
            aria-label="Combate"
          >
            <LuSwords className="mx-auto text-2xl" />
          </button>
        </nav>
      </div>
    </div>
  );

  function setup() {
    if (alreadyRan.current) return;
    alreadyRan.current = true;

    if (character == undefined) {
      const createSheet = async () => {
        try {
          const input: CreatePlayerInput = { campaign: Number(campaign)! };
          const response = await APIPlayer.create(input);

          navigate(`/campaign-player/${campaign}/${response.id}`, { replace: true });
        } catch (e: any) {
          setError("Erro ao carregar dados: " + e?.message);
        }
      };

      createSheet();
    } else {
      fetchInfo();
    }

  }

  async function fetchInfo() {
    try {
      if (!campaign || !character) return;
      const campaignId = parseInt(campaign);

      const [campaignInfo, playerResponse] = await Promise.all([
        APICampaign.get(campaignId),
        APIPlayer.get(parseInt(character))
      ]);

      const lastBattleLog = getLastBattleLogFromPlayer(playerResponse);
      setLastBattleLog(lastBattleLog);

      setPlayer(playerResponse);
      setCampaignInfo(campaignInfo);

      setLoading(false);
    } catch (e: any) {
      console.error("Erro ao carregar player:", e);
      setError("Erro ao carregar player: " + e?.message);
    }
  }

  function checkBattleLog(playerInfo: GetPlayerResponse) {
    const logs = playerInfo.battleLogs ?? []
    if (logs.length === 0) return

    const fightEvents = new Set([
      "ADD_CHARACTER",
      "REMOVE_CHARACTER",
      "SET_INITIATIVE",
      "BATTLE_STARTED",
      "BATTLE_FINISHED",
      "TURN_ENDED",
      "TURN_ADDED",
      "ALLOW_COUNTER",
      "STATUS_ADDED",
      "ATTACK_PENDING",
      "COUNTER_RESOLVED",
      "DAMAGE_DEALT",
      "STATUS_RESOLVED",
      "HP_CHANGED",
      "MP_CHANGED",
      "FLEEING",
      "HEAL_APPLIED",
      "STATUS_CLEANSED",
      "BREAK_APPLIED"
    ])

    const sheetEvents = new Set([
      "ATTACK_PENDING",
      "COUNTER_RESOLVED",
      "DAMAGE_DEALT",
      "STATUS_ADDED",
      "STATUS_RESOLVED",
      "BATTLE_FINISHED",
      "HEAL_APPLIED",
      "STATUS_CLEANSED",
      "BREAK_APPLIED"
    ])

    const shouldUpdateFight = logs.some(log => fightEvents.has(log.eventType))
    const shouldUpdateSheet = logs.some(log => sheetEvents.has(log.eventType))

    if (shouldUpdateSheet) {
      applySheetInfoUpdate(playerInfo)
    }

    if (shouldUpdateFight) {
      applyFightInfoUpdate(playerInfo)
    }

    const lastBattleLog = getLastBattleLogFromPlayer(playerInfo)
    setLastBattleLog(lastBattleLog)
  }


  function applyFightInfoUpdate(playerInfo: GetPlayerResponse) {
    setPlayer(prev =>
      prev
        ? {
          ...prev,
          fightInfo: playerInfo.fightInfo ?? prev.fightInfo
        }
        : prev
    );
  }

  function applySheetInfoUpdate(playerInfo: GetPlayerResponse) {
    setPlayer(prev =>
      prev
        ? {
          ...prev,
          playerSheet: playerInfo.playerSheet ?? prev.playerSheet,
          pictos: playerInfo.pictos ?? prev.pictos,
          luminas: playerInfo.luminas ?? prev.luminas
        }
        : prev
    );
  }

  function getLastBattleLogFromPlayer(playerInfo: GetPlayerResponse) {
    if (playerInfo.battleLogs && playerInfo.battleLogs.length > 0) {

      let lastId = 0;

      for (const log of playerInfo.battleLogs) {
        if (log.id > lastId) {
          lastId = log.id;
        }
      }

      return lastId;
    }

    return undefined;
  }

  function rollInitiative() {
    if (!player) return;

    if (player.fightInfo) {
      setPlayer({
        ...player,
        fightInfo: {
          ...player.fightInfo,
          canRollInitiative: false
        }
      });
    }

    setIsExecutingSkill(true);
    rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, rollCommandForInitiative(weaponInfo), result => {
      const criticalRolls = countCriticalRolls(result)
      const criticalMulti = calculatePlayerCriticalMulti(result, player)
      const rollTotal = diceTotal(result)
      const total = initiativeTotal(player, result)
      const failures = countFailuresRolls(result)
      const failuresDiv = calculateFailureDiv(result)

      setModalTitle("Resultado da rolagem")

      setModalBody(
        <div className="space-y-2">
          <p>Rolagem: {rollTotal}</p>
          {criticalRolls > 0 && (
            <h3 className="flex items-center gap-2 text-green-600 font-bold text-lg">
              <FaCheckCircle className="w-6 h-6" />
              Críticos: <b>{criticalRolls}</b>
            </h3>
          )}
          {failures > 0 && (
            <h3 className="flex items-center gap-2 text-red-600 font-bold text-lg">
              <FaSkull className="w-6 h-6" />
              Falhas críticas: <b>{failures}</b>
            </h3>
          )}
          <p>
            Habilidade: <b>{player.playerSheet?.hability ?? 0}</b>
            {criticalRolls > 0 && <b> (x{criticalMulti})</b>}
            {failures > 0 && (
              <span className="inline-flex items-center gap-1 font-bold ml-2">
                (<FaDivide className="w-4 h-4" /> {failuresDiv} )
              </span>
            )}
          </p>
          <p>Bônus Pictos: <b>{playerPictosTotalSpeed(player)}</b></p>
          <h1 className="text-2xl font-bold">Total: {total}</h1>
        </div>
      )

      setModalOpen(true)

      const callAddInitiative = async () => {
        try {
          const savedInitiative = await APIBattle.addInitiative({
            battleCharacterId: player.fightInfo?.playerBattleID ?? 0,
            value: total,
            hability: player.playerSheet?.hability ?? 0,
            playFirst: criticalRolls > 0,
          })

          setPlayer((prev) => {
            if (!prev || !prev.fightInfo) return prev

            const fi = prev.fightInfo
            const current = fi.initiatives ?? []

            return {
              ...prev,
              fightInfo: {
                ...fi,
                initiatives: [...current, savedInitiative],
              },
            }
          })
        } catch (err) {
          showToast("Erro ao registrar iniciativa")
        }
        setIsExecutingSkill(false);
      };

      callAddInitiative();
    })

  }

  function joinBattle() {
    if (!player) return;

    if (player.fightInfo) {
      setPlayer({
        ...player,
        fightInfo: {
          ...player.fightInfo,
          canRollInitiative: false
        }
      });
    }


    const joinBattleCall = async () => {
      try {
        await APIBattle.joinBattle({
          battleCharacterId: player.fightInfo?.playerBattleID ?? 0
        })
        showToast("Agora você está participando da batalha");
      } catch (e) {
        showToast("Erro ao salvar player");
      }
    };

    joinBattleCall();
  }

  function endTurn() {
    if (!player) return;

    const endTurnCall = async () => {
      try {
        await APIBattle.endTurn(player.fightInfo?.playerBattleID ?? 0)
      } catch (e) {
        showToast("Erro ao encerrar o turno");
      }
    };

    endTurnCall();
  }

  function handleSelectAttackTarget(target: BattleCharacterInfo) {
    if (player == null) { return }

    if (isReviveMode) {
      handleReviveTarget(target);
      return;
    }

    // Handle skill usage
    if (pendingSkillId) {
      setIsExecutingSkill(true);
      handleExecuteSkill(pendingSkillId, target);
      return;
    }

    if (npcIsFlying(target) && attackType != "free-shot") {
      showToast("Este inimigo está voando e só pode ser atingido por tiros livres", { duration: 3000 });
      return;
    }

    setIsExecutingSkill(true);
    rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, rollCommandForAttack(weaponInfo, attackType), result => {
      const criticalRolls = countCriticalRolls(result)
      const criticalMulti = calculatePlayerCriticalMulti(result, player)
      const rollTotal = diceTotal(result)
      const weaponPower = calculateRawWeaponPower(weaponInfo, attackType)
      const total = calculateAttackDamage(player, weaponInfo, target, result, attackType)
      const failures = countFailuresRolls(result)
      const failuresDiv = calculateFailureDiv(result)
      const elementModifier = getWeaponElementModifier(target.id, weaponInfo)
      const freeShotPlus = calculateFreeShotPlus(player, target, attackType)
      const isShielded = hasShield(target)
      const isEmpowered = playerHasEmpowered(player)
      const isWeakened = playerHasWeakened(player)
      const playerFrenzy = getPlayerFrenzy(player)
      const isDizzy = playerHasDizzy(player)

      setModalTitle("Resultado da rolagem")

      setModalBody(
        <div className="space-y-2">
          <p>Rolagem: {rollTotal}</p>
          {criticalRolls > 0 && (
            <h3 className="flex items-center gap-2 text-green-600 font-bold text-lg">
              <FaCheckCircle className="w-6 h-6" />
              Críticos: <b>{criticalRolls}</b>
            </h3>
          )}
          {failures > 0 && (
            <h3 className="flex items-center gap-2 text-red-600 font-bold text-lg">
              <FaSkull className="w-6 h-6" />
              Falhas críticas: <b>{failures}</b>
            </h3>
          )}
          <p>
            Poder: <b>{player.playerSheet?.power ?? 0}</b>
            {criticalRolls > 0 && <b> (x{criticalMulti})</b>}
            {failures > 0 && (
              <span className="inline-flex items-center gap-1 font-bold ml-2">
                (<FaDivide className="w-4 h-4" /> {failuresDiv} )
              </span>
            )}
          </p>
          {isEmpowered && (
            <p>
              Poderoso: <b>(x2)</b>
            </p>
          )}
          {isWeakened && (
            <p>
              Enfraquecido:
              <span className="inline-flex items-center gap-1 font-bold ml-2">
                (<FaDivide className="w-4 h-4" /> 2 )
              </span>
            </p>
          )}
          {weaponPower > 0 && (
            <p>
              Arma: <b>{weaponPower}</b>
            </p>
          )}
          {freeShotPlus > 0 && (
            <h3 className="flex items-center gap-2 text-green-600 font-bold text-lg">
              <FaCheckCircle className="w-6 h-6" />
              Vulnerabilidade tiro-livre <b>(+{freeShotPlus})</b>
            </h3>
          )}
          {((playerFrenzy?.ammount ?? 0) > 0) && attackType != "free-shot" && (
            <p>
              Frenesi <b>(+{playerFrenzy?.ammount})</b>
            </p>
          )}
          {elementModifier != undefined && (
            <p>
              Elemento da arma: <b>{getElementModifierText(elementModifier.type)}</b>
              <span className="inline-flex items-center gap-1 font-bold ml-2">
                (x{elementModifier.multiplier})
              </span>
            </p>
          )}
          {isDizzy && attackType == "free-shot" && (
            <p>
              Está tonto:
              <span className="inline-flex items-center gap-1 font-bold ml-2">
                (<FaDivide className="w-4 h-4" /> 2 )
              </span>
            </p>
          )}
          {isShielded && (
            <h3 className="flex items-center gap-2 text-red-600 font-bold text-lg">
              <FaShieldAlt className="w-6 h-6" />
              Possui escudo (Anula todo dano)
            </h3>
          )}
          <h1 className="text-2xl font-bold">Total: {total}</h1>
        </div>
      )

      setModalOpen(true)

      const callAttack = async () => {
        try {
          if (target.type == "npc") {
            const totalDamageToNpc = calculateNpcAttackReceivedDamage(target, total);
            const willGetFragile = checkForFragile(target, total);

            let effects: AttackStatusEffectRequest[] = []
            const attackInfo: CreateAttackRequest = {
              totalDamage: totalDamageToNpc,
              targetBattleId: target.battleID,
              sourceBattleId: player.fightInfo?.playerBattleID ?? 0,
              attackType: attackType,
              effects: effects
            }

            if (willGetFragile) {
              effects.push({
                effectType: "Fragile",
                ammount: 1,
                remainingTurns: 2
              })
            }

            await APIBattle.attack(attackInfo)
          } else {
            const attackInfo: CreateAttackRequest = {
              totalPower: total,
              targetBattleId: target.battleID,
              sourceBattleId: player.fightInfo?.playerBattleID ?? 0,
              attackType: attackType
              // TODO:
              // effects: [
              //     {
              //         effectType: "burn",
              //         ammount: 5
              //     }
              // ]
            }

            await APIBattle.attack(attackInfo)
          }

        } catch (e) {
          showToast("Erro ao atacar")
        }
        setIsExecutingSkill(false);
      };

      callAttack();
    });
  }

  function handleModalClose() {
    if (timeoutDiceBoardRef.current) {
      diceBoardRef.current?.hideBoard();
      clearTimeout(timeoutDiceBoardRef.current);
      timeoutDiceBoardRef.current = null;
    }
    setModalOpen(false);
  }

  function handleCombatMenuAction(action: CombatMenuAction) {
    switch (action) {
      case COMBAT_MENU_ACTIONS.Inventory:
        setTab("inventario");
        setIsInventoryActiveInCombat(true);
        break;
      case COMBAT_MENU_ACTIONS.Skills:
        setSkillsInitialTab("picker");
        setIsUsingSkillMode(true);
        setTab("habilidades");
        break;
      case COMBAT_MENU_ACTIONS.Initiative:
        rollInitiative();
        break;
      case COMBAT_MENU_ACTIONS.JoinBattle:
        joinBattle();
        break;
      case COMBAT_MENU_ACTIONS.EndTurn:
        endTurn();
        break;
      case COMBAT_MENU_ACTIONS.Attack:
        setAttackType("basic");
        break;
      case COMBAT_MENU_ACTIONS.FreeShot:
        setAttackType("free-shot");
        break;
      case COMBAT_MENU_ACTIONS.Flee:
        attemptFlee();
        break;
      case COMBAT_MENU_ACTIONS.Cancel:
        setPendingSkillId(null);
        setIsSelectingSkillTarget(false);
        setIsUsingSkillMode(false);
        break;
      default:
        break;
    }
  }

  function attemptFlee() {
    setModalTitle("Tentar fugir");
    setModalBody(
      <div className="space-y-4">
        <p>Tem certeza que deseja tentar fugir da batalha?</p>
        <p className="text-sm text-gray-500">Toda sua equipe receberá o status "Fugindo".</p>
        <div className="flex gap-2 justify-end">
          <button className="btn btn-ghost" onClick={handleModalClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={confirmFlee}>
            Confirmar
          </button>
        </div>
      </div>
    );
    setModalOpen(true);
  }

  async function confirmFlee() {
    if (!player?.fightInfo) return;

    try {
      const playerId = player.id;
      const playerBattleId = player.fightInfo.playerBattleID;

      showToast("Tentando fugir...");
      await APIBattle.flee(playerId, playerBattleId);
      await APIBattle.endTurn(playerBattleId);
      handleModalClose();
    } catch (e) {
      console.error("Erro ao tentar fugir:", e);
      showToast("Erro ao tentar fugir");
    }
  }

  function handleReviveRequested(percent: number) {
    setRevivePercent(percent);

    const currentCharacter = player?.fightInfo?.characters?.find(
      c => c.battleID === player.fightInfo?.playerBattleID
    );
    const teamTab = currentCharacter?.isEnemy ? "enemies" : "team";

    setCombatTab(teamTab as "enemies" | "team");
    setTab("combate");
    setIsReviveMode(true);
  }

  function handlePotionUsed() {
    setTab("combate");
  }

  function handleUseSkill(skillId: string) {
    // Get skill metadata to determine target type
    const skillMetadata = SkillEffectsRegistry[skillId];

    if (!skillMetadata) {
      showToast("Erro: Habilidade não encontrada");
      return;
    }

    // Determine if skill targets enemies or allies
    const targetsEnemies =
      skillMetadata.damageLevel !== "none" || // Damage skills target enemies
      skillMetadata.primaryEffects.some(e => e.targetType === "enemy" || e.targetType === "all-enemies") ||
      skillMetadata.conditionalEffects.some(e => e.targetType === "enemy" || e.targetType === "all-enemies");

    const targetsAllies =
      skillMetadata.targetScope === "self" ||
      skillMetadata.primaryEffects.some(e => e.targetType === "self" || e.targetType === "ally" || e.targetType === "all-allies") ||
      skillMetadata.conditionalEffects.some(e => e.targetType === "self" || e.targetType === "ally" || e.targetType === "all-allies");

    // Store the skill to be used
    setPendingSkillId(skillId);
    setTab("combate");
    setIsUsingSkillMode(false);

    // Set correct tab and activate target glow
    if (targetsEnemies && !targetsAllies) {
      setCombatTab("enemies");
    } else if (targetsAllies && !targetsEnemies) {
      setCombatTab("team");
    } else {
      // Default to enemies if ambiguous
      setCombatTab("enemies");
    }

    setIsSelectingSkillTarget(true);
  }

  async function handleExecuteSkill(skillId: string, target: BattleCharacterInfo) {
    if (!player?.fightInfo) return;

    try {
      const source = player.fightInfo.characters?.find(
        c => c.battleID === player.fightInfo?.playerBattleID
      );

      if (!source) {
        showToast("Erro: Personagem não encontrado na batalha");
        return;
      }

      // Get skill cost and check if player has enough MP
      const skillMetadata = SkillEffectsRegistry[skillId];
      if (!skillMetadata) {
        showToast("Erro: Habilidade não encontrada");
        return;
      }

      // Get skill info from SkillList to get the cost
      const skillInfo = player.skills?.find(s => s.skillId === skillId);
      if (!skillInfo) {
        showToast("Erro: Você não possui esta habilidade");
        return;
      }

      // Find the full skill data including cost
      const enrichedSkills = getEnrichedCharacterSkills(player);
      const fullSkill = enrichedSkills.find(s => s.id === skillId);
      const skillCost = fullSkill?.cost ?? 0;
      const currentMp = source.magicPoints ?? 0;

      if (currentMp < skillCost) {
        showToast(`MP insuficiente! Necessário: ${skillCost}, Disponível: ${currentMp}`);
        setPendingSkillId(null);
        setIsSelectingSkillTarget(false);
        return;
      }

      const resolved = resolveSkill(
        skillId,
        source,
        target,
        player.fightInfo.characters ?? []
      );

      // Calculate charge bonus for skills that scale with charge (e.g., Overcharge)
      let chargeBonus = 0;
      if (resolved.metadata.damageScalesWithCharge) {
        const currentCharge = source.chargePoints ?? 0;
        chargeBonus = currentCharge;  // +1 damage per charge
      }

      if (resolved.hitCount > 0) {
        for (let hitIndex = 0; hitIndex < resolved.hitCount; hitIndex++) {
          await new Promise<void>((resolve, reject) => {
            rollWithTimeout(
              diceBoardRef,
              timeoutDiceBoardRef,
              rollCommandForAttack(weaponInfo, "basic"),
              async (result) => {
                try {
                  // Calculate base damage similar to basic attack (player power + weapon + dice + criticals)
                  const total = diceTotal(result);
                  const failures = calculateFailureDiv(result);

                  let empoweredMulti = playerHasEmpowered(player) ? 2 : 1;
                  empoweredMulti = playerHasWeakened(player) ? 0.5 : empoweredMulti;

                  let playerPower = (player?.playerSheet?.power ?? 0) * calculatePlayerCriticalMulti(result, player) * empoweredMulti;

                  if (failures > 0) {
                    playerPower = Math.floor(playerPower / failures);
                  }

                  const weaponPower = calculateRawWeaponPower(weaponInfo, "basic");
                  const basePower = playerPower + weaponPower + total;

                  // Apply skill damage multiplier
                  const baseHitDamage = calculateSkillHitDamage(resolved, basePower, result);
                  const hitDamage = baseHitDamage + chargeBonus;  // Apply charge bonus

                  for (const targetId of resolved.targetIds) {
                    const effects = hitIndex === 0
                      ? getStatusEffectsForTarget(resolved.effects, targetId)
                      : [];

                    // Find the target character to check if it's NPC or player
                    const targetChar = (player.fightInfo.characters ?? []).find(c => c.battleID === targetId);
                    const isNpcTarget = targetChar?.type === "npc";

                    // NPCs receive totalDamage (direct damage), players receive totalPower (pending attack)
                    const attackRequest: CreateAttackRequest = isNpcTarget
                      ? {
                          sourceBattleId: source.battleID,
                          targetBattleId: targetId,
                          totalDamage: hitDamage,
                          attackType: "skill",
                          effects: effects,
                          skillCost: hitIndex === 0 ? skillCost : 0,
                          consumesCharge: hitIndex === 0 && resolved.metadata.consumesCharge
                        }
                      : {
                          sourceBattleId: source.battleID,
                          targetBattleId: targetId,
                          totalPower: hitDamage,
                          attackType: "skill",
                          effects: effects,
                          skillCost: hitIndex === 0 ? skillCost : 0,
                          consumesCharge: hitIndex === 0 && resolved.metadata.consumesCharge
                        };

                    await APIBattle.attack(attackRequest);
                  }

                  // Show toast with damage
                  showToast(`Total: ${hitDamage}`);

                  resolve();
                } catch (error) {
                  reject(error);
                }
              }
            );
          });
        }
      } else {
        for (const targetId of resolved.targetIds) {
          const effects = getStatusEffectsForTarget(resolved.effects, targetId);

          if (effects.length > 0) {
            for (const effect of effects) {
              await APIBattle.addStatus({
                battleCharacterId: targetId,
                effectType: effect.effectType,
                ammount: effect.ammount ?? 0,
                remainingTurns: effect.remainingTurns ?? 0
              });
            }
          }
        }

        if (skillCost > 0) {
          const newMp = Math.max(0, currentMp - skillCost);
          await APIBattle.updateCharacterMp(source.battleID, newMp);
        }
      }

      await applySpecialEffects(resolved.effects, player.fightInfo.characters ?? []);

      if (resolved.metadata.canBreak) {
        for (const targetId of resolved.targetIds) {
          await APIBattle.breakTarget(targetId);
        }
      }

      setPendingSkillId(null);
      setIsSelectingSkillTarget(false);
      setIsExecutingSkill(false);

    } catch (error) {
      console.error("Erro ao usar skill:", error);
      showToast("Erro ao usar habilidade");
      setPendingSkillId(null);
      setIsSelectingSkillTarget(false);
      setIsExecutingSkill(false);
    }
  }

  async function handleReviveTarget(target: BattleCharacterInfo) {
    if (!player) return;

    try {
      const maxHp = calculateMaxHP(player, weaponInfo);
      const maxMp = calculateMaxMP(player);

      await APIItem.useItem({
        playerId: player.id,
        itemId: "revive-elixir",
        maxHp,
        maxMp,
        recoveryPercent: revivePercent,
        targetBattleCharacterId: target.battleID
      });

      const item = player.items?.find(i => i.itemId === "revive-elixir");
      if (item) {
        setPlayer(prev => {
          if (!prev) return prev;
          const items = (prev.items ?? []).map(i =>
            i.id === item.id ? { ...i, quantity: Math.max(0, i.quantity - 1) } : i
          );
          return { ...prev, items };
        });
      }

      setIsReviveMode(false);
      showToast(`${target.name} foi revivido com ${revivePercent}% de HP!`);
    } catch (e) {
      console.error("Erro ao reviver:", e);
      showToast("Erro ao usar poção de reviver");
    }
  }

  async function handleNavigateBackToAdmin() {
    if (player == undefined || campaignInfo == undefined) { return; }

    if (isAdmin) {
      try {
        await APIPlayer.setMasterEditing(player.id, false);
        navigate(`/campaign-admin/${campaignInfo.id}`);
      } catch {
        console.log(error);
      }
    } else {
      navigate(`/character-sheet-list/${campaign}`);
    }
  }

  async function handleSelectDefense(attack: AttackResponse, defense: DefenseOption) {
    if (!player || !diceBoardRef.current) {
      return;
    }

    const callDefend = async (payload: CreateDefenseRequest) => {
      try {
        await APIBattle.defend(payload);
      } catch (e) {
        showToast("Erro ao encerrar o defender");
      }
    };

    const callCounter = async (battleCharacterId: number, maxDamage: number) => {
      try {
        await APIBattle.applyDefense(battleCharacterId, maxDamage);
        if (maxDamage > 0) {
          showToast("Você contra-atacou!");
        } else {
          showToast("Você não contra-atacou");
        }
      } catch (e) {
        showToast("Erro ao encerrar o executar o counter");
      }
    };

    const executeDefense = async (result: any | null) => {
      try {
        let defenseValue = attack.totalPower;
        if (result != null) {
          defenseValue = calculateDefense(attack.totalPower, player, weaponInfo, result, defense);
        }

        let description = "Você recebeu todo o dano.";

        if (defense === "block") {
          if (defenseValue > 0) {
            description = `Você não conseguiu aparar, o golpe causou ${defenseValue} de dano`;
          } else {
            description = `Você conseguiu aparar o golpe!`;
          }
        } else if (defense === "gradient-block") {
          if (defenseValue > 0) {
            description = `Você não conseguiu aparar, o golpe causou ${defenseValue} de dano`;
          } else {
            description = `Você conseguiu aparar o golpe! É hora de um contra-ataque!`;
          }
        } else if (defense === "dodge") {
          if (defenseValue > 0) {
            description = `Você não conseguiu desviar, o golpe causou ${defenseValue} de dano`;
          } else {
            description = `Você conseguiu desviar do golpe!`;
          }
        } else if (defense === "jump") {
          if (defenseValue > 0) {
            description = `Você não conseguiu pular do ataque e recebeu ${defenseValue} de dano`;
          } else {
            description = `Você conseguiu pular do ataque!`;
          }
        }

        if (defenseValue == 0 && playerHasShield(player)) {
          description = "Um escudo foi usado, você não recebeu dano"
        }

        const payload: CreateDefenseRequest = {
          attackId: attack.id,
          totalDamage: defenseValue,
        };

        callDefend(payload);

        showToast(description);
        setIsExecutingSkill(false);
      } catch (e) {
        showToast("Falha ao registrar a defesa");
        setIsExecutingSkill(false);
      }
    };

    const takeTheDamage = async () => {
      executeDefense(null)
    };

    if (defense == "counter") {
      callCounter(attack.targetBattleId, calculateMaxCounterDamage(player, weaponList));
    } else if (defense == "cancel-counter") {
      callCounter(attack.targetBattleId, 0);
    } else if (defense != "take") {
      setIsExecutingSkill(true);
      rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, rollCommandForDefense(player, weaponInfo, defense), result => {
        executeDefense(result);
      });
    } else {
      takeTheDamage()
    }
  }

  function onResolveStatus(status: StatusResponse, currentCharacter: BattleCharacterInfo | undefined) {
    const callResolveStatus = async (payload: ResolveStatusRequest) => {
      try {
        await APIBattle.resolveStatus(payload);
        setIsExecutingSkill(false);
      } catch (e) {
        showToast("Erro resolver o status");
        setIsExecutingSkill(false);
      }
    };

    if (!statusNeedsResolveRoll(status)) {
      const total = calculateStatusResolvedTotalValue(player, weaponInfo, status)
      callResolveStatus({
        battleCharacterId: currentCharacter?.battleID ?? 0,
        effectType: status.effectName,
        totalValue: total
      })

      return;
    }

    setIsExecutingSkill(true);
    rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, rollCommandForResolveStatus(status), result => {
      const total = calculateResolveStatusWithDiceTotal(player, weaponInfo, status, result)

      callResolveStatus({
        battleCharacterId: currentCharacter?.battleID ?? 0,
        effectType: status.effectName,
        totalValue: total
      })
    })
  }
}
