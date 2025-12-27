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
import { APISkill } from "../api/APISkill";
import { type BattleCharacterInfo, type AttackResponse, type DefenseOption, type AttackType, type WeaponInfo, type StatusResponse, type StatusType } from "../api/ResponseModel";
import { resolveSkill, calculateSkillHitDamage, applySpecialEffects, getStatusEffectsForTarget } from "../utils/BattleSkillUtils";
import { SkillEffectsRegistry } from "../data/SkillEffectsRegistry";
import { getEnrichedCharacterSkills, getSkillById } from "../utils/SkillUtils";
import { executeAllSpecialMechanics } from "../utils/SkillSpecialMechanics";
import { getVersoPerfectionDamageMultiplier } from "../utils/BattleUtils";
import { hasRequiredStains, consumeStains, addStains, updateCharacterStains, transformStain } from "../utils/StainUtils";
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

  // Reload player data when characterId changes (to refresh skills list after backend cleanup)
  const previousCharacterId = useRef<string | undefined>(undefined);

  useEffect(() => {
    const currentCharId = player?.playerSheet?.characterId;

    if (previousCharacterId.current && currentCharId && previousCharacterId.current !== currentCharId) {
      // Character changed, reload player data
      if (character) {
        APIPlayer.get(parseInt(character)).then(updatedPlayer => {
          setPlayer(updatedPlayer);
        }).catch(error => {
          console.error("Erro ao recarregar dados do player:", error);
        });
      }
    }

    previousCharacterId.current = currentCharId;
  }, [player?.playerSheet?.characterId, character]);

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
      const playerChar = player?.fightInfo?.characters?.find(c => c.battleID === player.fightInfo?.playerBattleID)
      const total = calculateAttackDamage(player, weaponInfo, target, result, attackType, playerChar?.stance, playerChar)

      // Verso's Perfection Rank: Get multiplier for display purposes
      const isVerso = playerChar?.id?.toLowerCase().includes("verso");
      const versoPerfectionMultiplier = isVerso ? getVersoPerfectionDamageMultiplier(playerChar?.perfectionRank) : 1.0;

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
          {isVerso && versoPerfectionMultiplier > 1.0 && (
            <p>
              Rank {playerChar?.perfectionRank} de Perfeição: <b>(x{versoPerfectionMultiplier})</b>
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
      const playerBattleId = player.fightInfo?.playerBattleID;
      if (!playerBattleId) return;

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
      const source = player.fightInfo?.characters?.find(
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
      const isGradientSkill = fullSkill?.isGradient ?? false;

      // Validate resources (MP or Gradient charges)
      if (isGradientSkill) {
        const currentGradientCharges = Math.floor((source.gradientPoints ?? 0) / 12);
        if (currentGradientCharges < skillCost) {
          showToast(`Cargas de Gradiente insuficientes! Necessário: ${skillCost}, Disponível: ${currentGradientCharges}`);
          setPendingSkillId(null);
          setIsSelectingSkillTarget(false);
          return;
        }
      } else {
        const currentMp = source.magicPoints ?? 0;
        if (currentMp < skillCost) {
          showToast(`MP insuficiente! Necessário: ${skillCost}, Disponível: ${currentMp}`);
          setPendingSkillId(null);
          setIsSelectingSkillTarget(false);
          return;
        }
      }

      // Validate stain requirements (ONLY for skills that explicitly require all 4 stains)
      if (!hasRequiredStains(source, skillMetadata)) {
        // Only block if skill requires all 4 elemental stains (e.g., Elemental Genesis)
        if (skillMetadata.requiresAllStains) {
          showToast("Requer todas as 4 manchas elementais (Raio, Terra, Fogo, Gelo)!");
          setPendingSkillId(null);
          setIsSelectingSkillTarget(false);
          setIsExecutingSkill(false);
          return;
        }
        // Note: consumesStains is OPTIONAL - skill can be used without stains for base effect
      }

      // Try to consume stains if available (for bonus effects)
      let stainsConsumed = false;
      let currentStainsAfterConsumption: [string | null, string | null, string | null, string | null] = [
        source.stainSlot1 ?? null,
        source.stainSlot2 ?? null,
        source.stainSlot3 ?? null,
        source.stainSlot4 ?? null
      ];

      if (skillMetadata.consumesStains || skillMetadata.requiresAllStains) {
        const newStains = consumeStains(source, skillMetadata);

        // Check if any stains were actually consumed (compare arrays)
        const originalStains = [source.stainSlot1, source.stainSlot2, source.stainSlot3, source.stainSlot4];
        const stainsChanged = originalStains.some((stain, idx) => stain !== newStains[idx]);

        if (stainsChanged) {
          await updateCharacterStains(source.battleID, newStains);
          stainsConsumed = true;
          currentStainsAfterConsumption = newStains; // Save stains after consumption
          await checkPlayerLoop(); // Update frontend immediately
        }
      }

      let resolved = resolveSkill(
        skillId,
        source,
        target,
        player.fightInfo?.characters ?? []
      );

      // Powerful: Roll 1d6 to determine target scope (1-3 = self only, 4-6 = all allies)
      if (resolved.metadata.rollsForTargetScope) {
        const diceRoll = Math.floor(Math.random() * 6) + 1;  // 1-6
        if (diceRoll >= 4) {
          // 4-6: All allies
          showToast(`Rolou ${diceRoll}! Powerful afeta toda equipe!`);
          const newTargetScope = "all-allies";
          const alliesTargets = (player.fightInfo?.characters ?? [])
            .filter(c => c.isEnemy === source.isEnemy && c.healthPoints > 0)
            .map(c => c.battleID);

          // Update resolved targets and effects
          resolved = {
            ...resolved,
            targetIds: alliesTargets,
            effects: resolved.effects.map(eff => ({
              ...eff,
              targetType: "all-allies" as any
            }))
          };
        } else {
          // 1-3: Self only
          showToast(`Rolou ${diceRoll}! Powerful afeta apenas Verso.`);
          resolved = {
            ...resolved,
            targetIds: [source.battleID]
          };
        }
      }

      // Rank-conditional duration: Change effect duration at specific rank (e.g., Powerful at A: 5 turns)
      if (resolved.metadata.rankConditionalDuration) {
        const { rank, duration } = resolved.metadata.rankConditionalDuration;
        if (source.perfectionRank === rank) {
          // Update all effects with the new duration
          resolved = {
            ...resolved,
            effects: resolved.effects.map(eff => ({
              ...eff,
              remainingTurns: duration
            }))
          };
          showToast(`Rank ${rank} de Perfeição! Duração: ${duration} turnos!`);
        }
      }

      // Get skill metadata to extract type (sun/moon for Sciel)
      const skillData = getSkillById(skillId);
      const skillType = skillData?.type;  // "sun" or "moon" for Sciel skills

      // Calculate charge bonus for skills that scale with charge (e.g., Overcharge)
      let chargeBonus = 0;
      if (resolved.metadata.damageScalesWithCharge) {
        const currentCharge = source.chargePoints ?? 0;
        chargeBonus = currentCharge;  // +1 damage per charge
      }

      // Burning Canvas: Calculate burn damage multiplier
      let burnMultiplier = 1.0;
      if (resolved.metadata.damageScalesWithBurn) {
        const targetStatuses = target.status ?? [];
        const burnStacks = targetStatuses
          .filter(s => s.effectName === "Burning")
          .reduce((sum, s) => sum + (s.ammount ?? 0), 0);

        if (burnStacks > 0) {
          const bonusPerBurn = (resolved.metadata.burnDamageBonus ?? 10) / 100;  // Default 10% = 0.1
          burnMultiplier = 1.0 + (burnStacks * bonusPerBurn);
          showToast(`${burnStacks} Queimadura(s) no alvo! Dano +${Math.floor(burnStacks * bonusPerBurn * 100)}%`);
        }
      }

      // Combustion: Calculate burn consumption multiplier and prepare to consume burns
      let burnConsumptionMultiplier = 1.0;
      let burnsToConsume = 0;
      if (resolved.metadata.consumesBurn) {
        const targetStatuses = target.status ?? [];
        const burnStacks = targetStatuses
          .filter(s => s.effectName === "Burning")
          .reduce((sum, s) => sum + (s.ammount ?? 0), 0);

        if (burnStacks > 0) {
          const maxConsume = resolved.metadata.maxBurnConsumption ?? 10;
          burnsToConsume = Math.min(burnStacks, maxConsume);
          const bonusPerBurn = (resolved.metadata.burnConsumptionBonus ?? 10) / 100;
          burnConsumptionMultiplier = 1.0 + (burnsToConsume * bonusPerBurn);
          showToast(`Consumindo ${burnsToConsume} Queimadura(s)! Dano +${Math.floor(burnsToConsume * bonusPerBurn * 100)}%`);
        }
      }

      // Degagement: Check if target has Fire Vulnerability for double Fire damage
      let fireVulnerabilityMultiplier = 1.0;
      if (resolved.metadata.forcedElement === "Fire") {
        const targetStatuses = target.status ?? [];
        const hasFireVulnerability = targetStatuses.some(s => s.effectName === "FireVulnerability");
        if (hasFireVulnerability) {
          fireVulnerabilityMultiplier = 2.0;  // Double damage
          showToast("Alvo vulnerável a Fogo! Dano x2!");
        }
      }

      // Gustave's Homage: Check if target has Marked status for bonus damage
      let markedDamageMultiplier = 1.0;
      if (resolved.metadata.markedDamageBonus) {
        const targetStatuses = target.status ?? [];
        const isMarked = targetStatuses.some(s => s.effectName === "Marked");
        if (isMarked) {
          const bonusPercent = resolved.metadata.markedDamageBonus;
          markedDamageMultiplier = 1.0 + (bonusPercent / 100);
          showToast(`Alvo Marcado! Dano +${bonusPercent}%`);
        }
      }

      // Breaking Rules: Count shields on target and prepare to destroy them
      let shieldsDestroyed = 0;
      if (resolved.metadata.destroysShields) {
        const targetStatuses = target.status ?? [];
        shieldsDestroyed = targetStatuses.filter(s => s.effectName === "Shielded").length;
        if (shieldsDestroyed > 0) {
          showToast(`Destruindo ${shieldsDestroyed} shield(s)!`);
        }
      }

      // Breaking Rules: Check if target has Unprotected (Defenseless) for conditional effects
      let targetHasUnprotected = false;
      let targetHasNoForetell = false;
      let targetIsBurning = false;
      if (resolved.metadata.conditionalEffects && resolved.metadata.conditionalEffects.length > 0) {
        const targetStatuses = target.status ?? [];
        targetHasUnprotected = targetStatuses.some(s => s.effectName === "Unprotected");
        targetIsBurning = targetStatuses.some(s => s.effectName === "Burning");

        // Focused Foretell: Check if target has no Foretell stacks
        const foretellStacks = targetStatuses
          .filter(s => s.effectName === "Foretell")
          .reduce((sum, s) => sum + (s.ammount ?? 0), 0);
        targetHasNoForetell = foretellStacks === 0;
      }

      // Our Sacrifice: Drain allies HP and consume all enemies Foretell
      let hpDrained = 0;
      let allEnemiesForetellConsumed = 0;
      if (resolved.metadata.drainsAlliesHp || resolved.metadata.consumesAllEnemiesForetell) {
        const allCharacters = player.fightInfo?.characters ?? [];

        // Drain allies HP to 1
        if (resolved.metadata.drainsAlliesHp) {
          const aliveAllies = allCharacters.filter(c =>
            !c.isEnemy &&
            c.battleID !== source.battleID &&
            c.healthPoints > 1  // Only drain if HP > 1
          );

          for (const ally of aliveAllies) {
            const hpToDrain = ally.healthPoints - 1;
            hpDrained += hpToDrain;
            await APIBattle.updateCharacterHp(ally.battleID, 1);
          }

          if (hpDrained > 0) {
            showToast(`HP drenado de aliados: ${hpDrained} (Dano +${hpDrained})`);
          }
        }

        // Consume Foretell from ALL enemies
        if (resolved.metadata.consumesAllEnemiesForetell) {
          const allEnemies = allCharacters.filter(c => c.isEnemy);

          for (const enemy of allEnemies) {
            const enemyForetell = enemy.status
              ?.filter(s => s.effectName === "Foretell")
              .reduce((sum, s) => sum + (s.ammount ?? 0), 0) ?? 0;

            if (enemyForetell > 0) {
              allEnemiesForetellConsumed += enemyForetell;
              // Consume via backend (will be done in attack request)
            }
          }

          if (allEnemiesForetellConsumed > 0) {
            showToast(`Predição total de inimigos: ${allEnemiesForetellConsumed} (Dano +${allEnemiesForetellConsumed})`);
          }
        }
      }

      // Twilight Slash / Harvest / Plentiful Harvest: Calculate Foretell consumption bonus and prepare to consume
      let foretellBonus = 0;
      let foretellsToConsume = 0;
      let foretellHealBonus = 0;  // Bonus de cura por Predição (Harvest)
      let mpToGrant = 0;  // MP a conceder por Predição (Plentiful Harvest)
      if (resolved.metadata.consumesForetell) {
        const targetStatuses = target.status ?? [];
        const foretellStacks = targetStatuses
          .filter(s => s.effectName === "Foretell")
          .reduce((sum, s) => sum + (s.ammount ?? 0), 0);

        if (foretellStacks > 0) {
          foretellsToConsume = foretellStacks;

          // Harvest: Calcula bonus de cura
          if (resolved.metadata.foretellHealBonus) {
            foretellHealBonus = foretellStacks * resolved.metadata.foretellHealBonus;
            showToast(`Consumindo ${foretellsToConsume} Predições! Cura +${foretellHealBonus}%`);
          }
          // Plentiful Harvest: Calcula MP a conceder para aliado
          else if (resolved.metadata.grantsMpPerForetell) {
            mpToGrant = foretellStacks * resolved.metadata.grantsMpPerForetell;
            showToast(`Consumindo ${foretellsToConsume} Predições! MP a conceder: ${mpToGrant}`);
          }
          // Twilight Slash: Calcula bonus de dano
          else if (resolved.metadata.foretellDamageBonus) {
            const bonusPerForetell = resolved.metadata.foretellDamageBonus;
            foretellBonus = foretellStacks * bonusPerForetell;
            showToast(`Consumindo ${foretellsToConsume} Predições! Dano +${foretellBonus}`);
          }
        }
      }

      // Variable to store last dice result for mechanics that need it (e.g., Elemental Trick)
      let lastDiceResult: number[] = [];

      if (resolved.hitCount > 0) {
        for (let hitIndex = 0; hitIndex < resolved.hitCount; hitIndex++) {
          await new Promise<void>((resolve, reject) => {
            rollWithTimeout(
              diceBoardRef,
              timeoutDiceBoardRef,
              rollCommandForAttack(weaponInfo, "basic"),
              async (result) => {
                try {
                  // Store last dice result
                  lastDiceResult = result;
                  // Calculate base damage similar to basic attack (player power + weapon + dice + criticals)
                  const total = diceTotal(result);
                  const failures = calculateFailureDiv(result);

                  let empoweredMulti = playerHasEmpowered(player) ? 2 : 1;
                  empoweredMulti = playerHasWeakened(player) ? 0.5 : empoweredMulti;

                  // Sword Ballet: Double crit damage (4x total instead of 2x)
                  let critMulti = calculatePlayerCriticalMulti(result, player);
                  if (resolved.metadata.doubleCritDamage && critMulti > 1) {
                    critMulti = critMulti * 2;  // 2x becomes 4x
                    if (hitIndex === 0) {
                      showToast(`Crítico duplo! (${critMulti}x de dano)`);
                    }
                  }

                  let playerPower = (player?.playerSheet?.power ?? 0) * critMulti * empoweredMulti;

                  if (failures > 0) {
                    playerPower = Math.floor(playerPower / failures);
                  }

                  const weaponPower = calculateRawWeaponPower(weaponInfo, "basic");
                  const basePower = playerPower + weaponPower + total;

                  // Apply skill damage multiplier
                  const baseHitDamage = calculateSkillHitDamage(resolved, basePower, result);

                  // Sealed Fate / Firing Shadow: Consume 1 Foretell per hit for bonus damage
                  // For AOE skills, we'll try to consume from each target individually in the attack loop
                  // For single target, we consume here once per hit
                  let foretellPerHitMultiplier = 1.0;
                  const foretellConsumedPerTarget = new Map<number, boolean>();

                  if (resolved.metadata.consumesForetellPerHit) {
                    // Pre-consume for all targets (each target independently)
                    for (const targetId of resolved.targetIds) {
                      const consumed = await APIBattle.consumeOneForetell(targetId);
                      foretellConsumedPerTarget.set(targetId, consumed);
                      if (consumed && hitIndex === 0) {
                        const targetChar = (player.fightInfo?.characters ?? []).find(c => c.battleID === targetId);
                        showToast(`${targetChar?.name ?? 'Alvo'}: Predição consumida! Dano x${resolved.metadata.foretellPerHitMultiplier ?? 3.0}`);
                      }
                    }
                  }

                  // Twilight: Check if source has Twilight status for +150% damage (2.5x total)
                  const sourceStatuses = source.status ?? [];
                  const hasTwilight = sourceStatuses.some(s => s.effectName === "Twilight");
                  const twilightMultiplier = hasTwilight ? 2.5 : 1.0;

                  // Verso's Perfection Rank: Damage multiplier based on current rank
                  const isVerso = source.id?.toLowerCase().includes("verso");
                  let versoPerfectionMultiplier = isVerso ? getVersoPerfectionDamageMultiplier(source.perfectionRank) : 1.0;

                  // Rank-conditional bonus: Additional bonus for specific skills at specific ranks (e.g., Assault Zero at B: +50%)
                  // This is ADDITIVE with the base rank bonus, not multiplicative
                  if (isVerso && resolved.metadata.rankConditionalBonus) {
                    const { rank, damageMultiplier } = resolved.metadata.rankConditionalBonus;
                    if (source.perfectionRank === rank) {
                      // Add the bonuses together: e.g., B Rank (+40%) + Assault Zero (+50%) = +90% total
                      const baseBonus = versoPerfectionMultiplier - 1.0;  // e.g., 1.4 - 1.0 = 0.4 (40%)
                      const conditionalBonus = damageMultiplier - 1.0;    // e.g., 1.5 - 1.0 = 0.5 (50%)
                      versoPerfectionMultiplier = 1.0 + baseBonus + conditionalBonus;  // 1.0 + 0.4 + 0.5 = 1.9 (90%)
                      const totalBonusPercent = Math.round((versoPerfectionMultiplier - 1.0) * 100);
                      showToast(`Rank ${rank} de Perfeição! Dano +${totalBonusPercent}% (bônus da habilidade!)`);
                    } else if (versoPerfectionMultiplier > 1.0) {
                      const bonusPercent = Math.round((versoPerfectionMultiplier - 1.0) * 100);
                      showToast(`Rank ${source.perfectionRank} de Perfeição! Dano +${bonusPercent}%`);
                    }
                  } else if (isVerso && versoPerfectionMultiplier > 1.0) {
                    const bonusPercent = Math.round((versoPerfectionMultiplier - 1.0) * 100);
                    showToast(`Rank ${source.perfectionRank} de Perfeição! Dano +${bonusPercent}%`);
                  }

                  let primaryTargetDamage = 0;  // Save damage for Searing Bond propagation

                  for (const targetId of resolved.targetIds) {
                    // Apply per-target Foretell consumption multiplier (Sealed Fate / Firing Shadow)
                    const targetForetellMultiplier = foretellConsumedPerTarget.get(targetId)
                      ? (resolved.metadata.foretellPerHitMultiplier ?? 3.0)
                      : 1.0;

                    // Apply charge bonus, foretell bonus, HP drained, and all enemies foretell (additive) then per-hit foretell multiplier, twilight, Verso's perfection, burn multipliers, fire vulnerability, and marked bonus (multiplicative)
                    const damageWithCharge = baseHitDamage + chargeBonus + foretellBonus + hpDrained + allEnemiesForetellConsumed;
                    const damageWithForetellPerHit = Math.floor(damageWithCharge * targetForetellMultiplier);
                    const damageWithTwilight = Math.floor(damageWithForetellPerHit * twilightMultiplier);
                    const damageWithPerfection = Math.floor(damageWithTwilight * versoPerfectionMultiplier);
                    const damageWithBurnScaling = Math.floor(damageWithPerfection * burnMultiplier);
                    const damageWithBurnConsumption = Math.floor(damageWithBurnScaling * burnConsumptionMultiplier);
                    const damageWithFireVulnerability = Math.floor(damageWithBurnConsumption * fireVulnerabilityMultiplier);
                    const hitDamage = Math.floor(damageWithFireVulnerability * markedDamageMultiplier);

                    // Save damage from first target for Searing Bond propagation
                    if (targetId === resolved.targetIds[0]) {
                      primaryTargetDamage = hitDamage;
                    }

                    const effects = hitIndex === 0
                      ? getStatusEffectsForTarget(resolved.effects, targetId)
                      : [];

                    // Find the target character to check if it's NPC or player
                    const targetChar = (player.fightInfo?.characters ?? []).find(c => c.battleID === targetId);
                    const isNpcTarget = targetChar?.type === "npc";

                    // Apply conditional effects if conditions are met
                    let finalEffects = [...effects];
                    if (hitIndex === 0 && resolved.metadata.conditionalEffects) {
                      // Breaking Rules: Add conditional effects for Unprotected target
                      if (targetHasUnprotected) {
                        const unprotectedEffects = resolved.metadata.conditionalEffects
                          .filter(e => e.condition === "target-unprotected")
                          .map(e => ({
                            effectType: e.effectType as StatusType,
                            ammount: e.amount,
                            remainingTurns: e.remainingTurns ?? 0
                          }));
                        finalEffects = [...finalEffects, ...unprotectedEffects];
                      }

                      // Focused Foretell: Add conditional effects for target without Foretell
                      if (targetHasNoForetell) {
                        const noForetellEffects = resolved.metadata.conditionalEffects
                          .filter(e => e.condition === "target-no-foretell")
                          .map(e => ({
                            effectType: e.effectType as StatusType,
                            ammount: e.amount,
                            remainingTurns: e.remainingTurns ?? 0
                          }));
                        finalEffects = [...finalEffects, ...noForetellEffects];
                      }
                    }

                    // Egide: Extend Taunt duration if source has Protected (Shield) status
                    if (hitIndex === 0 && skillId === "maelle-egide") {
                      const sourceStatuses = source.status ?? [];
                      const hasProtected = sourceStatuses.some(s => s.effectName === "Protected");
                      if (hasProtected) {
                        // Extend Taunt duration from 2 to 3 turns
                        finalEffects = finalEffects.map(effect => {
                          if (effect.effectType === "Taunt") {
                            return { ...effect, remainingTurns: 3 };
                          }
                          return effect;
                        });
                        showToast("Duração do Égide estendida! (3 turnos)");
                      }
                    }

                    // Twilight: Double all Foretell stacks inflicted if source has Twilight status
                    if (hitIndex === 0 && hasTwilight) {
                      finalEffects = finalEffects.map(effect => {
                        if (effect.effectType === "Foretell") {
                          return { ...effect, ammount: (effect.ammount ?? 0) * 2 };
                        }
                        return effect;
                      });
                    }

                    // Spectral Sweep: Apply additional Foretell on critical hits
                    if (resolved.metadata.appliesForetellOnCrit && critMulti > 1) {
                      const bonusForetell = resolved.metadata.appliesForetellOnCrit;
                      // Check if there's already a Foretell effect to add to
                      const existingForetell = finalEffects.find(e => e.effectType === "Foretell");
                      if (existingForetell) {
                        // Add to existing Foretell
                        finalEffects = finalEffects.map(effect => {
                          if (effect.effectType === "Foretell") {
                            const newAmount = (effect.ammount ?? 0) + bonusForetell;
                            if (hitIndex === 0) {
                              showToast(`Crítico! +${bonusForetell} Predição adicional`);
                            }
                            return { ...effect, ammount: newAmount };
                          }
                          return effect;
                        });
                      } else {
                        // Create new Foretell effect
                        finalEffects.push({
                          effectType: "Foretell",
                          ammount: bonusForetell,
                          remainingTurns: 0
                        });
                        if (hitIndex === 0) {
                          showToast(`Crítico! +${bonusForetell} Predição`);
                        }
                      }
                    }

                    // Conditional Burn Bonus (Spark, Rain of Fire, Pyrolyse)
                    if (hitIndex === 0 && resolved.metadata.conditionalBurnBonus) {
                      const { fromStance, bonusBurn } = resolved.metadata.conditionalBurnBonus;
                      if (source.stance === fromStance) {
                        // Add bonus burn to Burning effects
                        finalEffects = finalEffects.map(effect => {
                          if (effect.effectType === "Burning") {
                            const newAmount = (effect.ammount ?? 0) + bonusBurn;
                            showToast(`Bonus de postura! +${bonusBurn} Queimaduras (${newAmount} total)`);
                            return { ...effect, ammount: newAmount };
                          }
                          return effect;
                        });
                      }
                    }

                    // NPCs receive totalDamage (direct damage), players receive totalPower (pending attack)
                    const attackRequest: CreateAttackRequest = isNpcTarget
                      ? {
                          sourceBattleId: source.battleID,
                          targetBattleId: targetId,
                          totalDamage: hitDamage,
                          attackType: "skill",
                          effects: finalEffects,
                          skillCost: hitIndex === 0 ? skillCost : 0,
                          consumesCharge: hitIndex === 0 && resolved.metadata.consumesCharge,
                          isGradient: hitIndex === 0 && resolved.metadata.isGradient,
                          destroysShields: hitIndex === 0 && resolved.metadata.destroysShields,
                          grantsAPPerShield: hitIndex === 0 && resolved.metadata.destroysShields ? resolved.metadata.grantsAPPerShield : undefined,
                          consumesBurn: hitIndex === 0 && burnsToConsume > 0 ? burnsToConsume : undefined,
                          consumesForetell: hitIndex === 0 && foretellsToConsume > 0 ? foretellsToConsume : undefined,
                          executionThreshold: resolved.metadata.executionThreshold,
                          skillType: hitIndex === 0 ? skillType : undefined
                        }
                      : {
                          sourceBattleId: source.battleID,
                          targetBattleId: targetId,
                          totalPower: hitDamage,
                          attackType: "skill",
                          effects: finalEffects,
                          skillCost: hitIndex === 0 ? skillCost : 0,
                          consumesCharge: hitIndex === 0 && resolved.metadata.consumesCharge,
                          isGradient: hitIndex === 0 && resolved.metadata.isGradient,
                          destroysShields: hitIndex === 0 && resolved.metadata.destroysShields,
                          grantsAPPerShield: hitIndex === 0 && resolved.metadata.destroysShields ? resolved.metadata.grantsAPPerShield : undefined,
                          consumesBurn: hitIndex === 0 && burnsToConsume > 0 ? burnsToConsume : undefined,
                          consumesForetell: hitIndex === 0 && foretellsToConsume > 0 ? foretellsToConsume : undefined,
                          executionThreshold: resolved.metadata.executionThreshold,
                          skillType: hitIndex === 0 ? skillType : undefined
                        };

                    await APIBattle.attack(attackRequest);
                  }

                  // Searing Bond: Propagate damage to other Burning enemies
                  if (hitIndex === resolved.hitCount - 1 && resolved.metadata.propagatesBurnDamage) {
                    // Only propagate on last hit
                    const primaryTargetId = resolved.targetIds[0]; // Single target skill
                    const allEnemies = (player.fightInfo?.characters ?? []).filter(c => c.isEnemy);

                    // Find other burning enemies (not the primary target)
                    const otherBurningEnemies = allEnemies.filter(enemy =>
                      enemy.battleID !== primaryTargetId &&
                      enemy.status?.some(s => s.effectName === "Burning")
                    );

                    if (otherBurningEnemies.length > 0) {
                      const propagatedDamage = Math.floor(primaryTargetDamage / 2); // 50% of damage

                      for (const enemy of otherBurningEnemies) {
                        const isNpc = enemy.type === "npc";

                        // Apply half damage + 1 Foretell to each burning enemy
                        const propagationRequest: CreateAttackRequest = isNpc
                          ? {
                              sourceBattleId: source.battleID,
                              targetBattleId: enemy.battleID,
                              totalDamage: propagatedDamage,
                              attackType: "skill",
                              effects: [
                                {
                                  effectType: "Foretell",
                                  ammount: 1,
                                  remainingTurns: 0
                                }
                              ],
                              skillCost: 0 // No cost for propagation
                            }
                          : {
                              sourceBattleId: source.battleID,
                              targetBattleId: enemy.battleID,
                              totalPower: propagatedDamage,
                              attackType: "skill",
                              effects: [
                                {
                                  effectType: "Foretell",
                                  ammount: 1,
                                  remainingTurns: 0
                                }
                              ],
                              skillCost: 0 // No cost for propagation
                            };

                        await APIBattle.attack(propagationRequest);
                      }

                      showToast(`Vínculo Ardente: ${otherBurningEnemies.length} inimigo(s) afetado(s)!`);
                    }
                  }

                  // Show toast with damage
                  showToast(`Total: ${primaryTargetDamage}`);

                  resolve();
                } catch (error) {
                  reject(error);
                }
              }
            );
          });
        }
      } else {
        // For skills without hits (status-only skills), still need to consume resources
        // Send a dummy attack to trigger MP/Gradient consumption in backend
        if (skillCost > 0) {
          const firstTargetId = resolved.targetIds[0];
          if (firstTargetId) {
            const targetChar = (player.fightInfo?.characters ?? []).find(c => c.battleID === firstTargetId);
            const isNpcTarget = targetChar?.type === "npc";

            const attackRequest: CreateAttackRequest = isNpcTarget
              ? {
                  sourceBattleId: source.battleID,
                  targetBattleId: firstTargetId,
                  totalDamage: 0,  // No damage, just resource consumption
                  attackType: "skill",
                  effects: [],
                  skillCost: skillCost,
                  isGradient: isGradientSkill
                }
              : {
                  sourceBattleId: source.battleID,
                  targetBattleId: firstTargetId,
                  totalPower: 0,  // No damage, just resource consumption
                  attackType: "skill",
                  effects: [],
                  skillCost: skillCost,
                  isGradient: isGradientSkill
                };

            await APIBattle.attack(attackRequest);
          }
        }

        // Apply status effects
        for (const targetId of resolved.targetIds) {
          let effects = getStatusEffectsForTarget(resolved.effects, targetId);

          // Egide: Extend Taunt duration if source has Protected (Shield) status
          if (skillId === "maelle-egide") {
            const sourceStatuses = source.status ?? [];
            const hasProtected = sourceStatuses.some(s => s.effectName === "Protected");
            if (hasProtected) {
              // Extend Taunt duration from 2 to 3 turns
              effects = effects.map(effect => {
                if (effect.effectType === "Taunt") {
                  return { ...effect, remainingTurns: 3 };
                }
                return effect;
              });
              showToast("Duração do Égide estendida! (3 turnos)");
            }
          }

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
      }

      await applySpecialEffects(resolved.effects, player.fightInfo?.characters ?? [], foretellHealBonus);

      if (resolved.metadata.canBreak) {
        for (const targetId of resolved.targetIds) {
          await APIBattle.breakTarget(targetId);
        }
      }

      // Twilight Dance: Extend Twilight duration if source has Twilight status
      if (resolved.metadata.extendsTwilight) {
        const sourceStatuses = source.status ?? [];
        const hasTwilight = sourceStatuses.some(s => s.effectName === "Twilight");
        if (hasTwilight) {
          await APIBattle.extendStatusDuration(source.battleID, "Twilight", 1);
          showToast("Duração do Crepúsculo estendida! (+1 turno)");
        }
      }

      // Delaying Slash: Delay target's turn by X positions
      if (resolved.metadata.delaysTurn) {
        for (const targetId of resolved.targetIds) {
          await APIBattle.delayTurn(targetId, resolved.metadata.delaysTurn);
          showToast(`Turno atrasado em ${resolved.metadata.delaysTurn} posições!`);
        }
      }

      // Our Sacrifice: Consume Foretell from all enemies
      if (resolved.metadata.consumesAllEnemiesForetell && allEnemiesForetellConsumed > 0) {
        const allCharacters = player.fightInfo?.characters ?? [];
        const allEnemies = allCharacters.filter(c => c.isEnemy);

        for (const enemy of allEnemies) {
          const enemyForetell = enemy.status
            ?.filter(s => s.effectName === "Foretell")
            .reduce((sum, s) => sum + (s.ammount ?? 0), 0) ?? 0;

          if (enemyForetell > 0) {
            // Resolve status to consume all Foretell
            await APIBattle.resolveStatus({
              battleCharacterId: enemy.battleID,
              effectType: "Foretell",
              totalValue: 0  // Set to 0 to remove all
            });
          }
        }
      }

      // Change stance if skill changes stance (e.g., Breaking Rules -> Offensive)
      if (resolved.metadata.changesStanceTo !== undefined) {
        // Fleuret Fury special case: preserves Virtuose stance if already there
        const shouldChangeStance = resolved.metadata.preservesVirtuoseStance && source.stance === 'Virtuous'
          ? false  // Keep Virtuose stance
          : source.stance !== resolved.metadata.changesStanceTo;

        if (shouldChangeStance) {
          const newStance = resolved.metadata.changesStanceTo;
          await APIBattle.updateCharacterStance(source.battleID, newStance);
          const stanceName = newStance === 'Offensive' ? 'Ofensiva' :
                            newStance === 'Defensive' ? 'Defensiva' :
                            newStance === 'Virtuous' ? 'Virtuosa' : 'Sem Postura';
          showToast(`Postura alterada para ${stanceName}!`);
        }
      }

      // Last Chance: Set HP to 1 and refill AP to maximum
      if (resolved.metadata.setsHpTo !== undefined) {
        await APIBattle.updateCharacterHp(source.battleID, resolved.metadata.setsHpTo);
        showToast(`Vida reduzida para ${resolved.metadata.setsHpTo}!`);
      }

      if (resolved.metadata.refillsAP) {
        const maxMp = source.maxMagicPoints ?? 0;
        await APIBattle.updateCharacterMp(source.battleID, maxMp);
        showToast(`PA recarregado para ${maxMp}!`);
      }

      // Mezzo Forte: Reapply current stance (triggers stance benefits again)
      if (resolved.metadata.reappliesStance && source.stance) {
        await APIBattle.updateCharacterStance(source.battleID, source.stance);
        const stanceName = source.stance === 'Offensive' ? 'Ofensiva' :
                          source.stance === 'Defensive' ? 'Defensiva' :
                          source.stance === 'Virtuous' ? 'Virtuosa' : 'Sem Postura';
        showToast(`Postura ${stanceName} reaplicada!`);
      }

      // Mezzo Forte / Swift Stride: Grant random AP between min and max
      if (resolved.metadata.grantsAPRange) {
        const { min, max } = resolved.metadata.grantsAPRange;
        const apGranted = Math.floor(Math.random() * (max - min + 1)) + min;
        const currentMp = source.magicPoints ?? 0;
        const maxMp = source.maxMagicPoints ?? 0;
        const newMp = Math.min(currentMp + apGranted, maxMp);
        await APIBattle.updateCharacterMp(source.battleID, newMp);
        if (apGranted > 0) {
          showToast(`+${apGranted} PA concedidos! (${currentMp} → ${newMp})`);
        }
      }

      // From Fire: Heal self if target is burning
      if (targetIsBurning && resolved.metadata.conditionalEffects) {
        const healEffect = resolved.metadata.conditionalEffects.find(
          e => e.effectType === "Heal" && e.condition === "target-burning"
        );

        if (healEffect) {
          const healPercent = healEffect.amount;  // 20%
          const maxHp = source.maxHealthPoints;
          const healAmount = Math.floor(maxHp * (healPercent / 100));

          await APIBattle.heal(source.battleID, healAmount);
          showToast(`Alvo Queimando! Verso curado em ${healPercent}% (${healAmount} HP)!`);
        }
      }

      // Swift Stride: Switch to Virtuose if target is burning
      if (resolved.metadata.switchesToVirtuoseIfBurning) {
        const targetStatuses = target.status ?? [];
        const isBurning = targetStatuses.some(s => s.effectName === "Burning");
        if (isBurning) {
          await APIBattle.updateCharacterStance(source.battleID, "Virtuous");
          showToast("Alvo está Queimando! Mudou para postura Virtuosa!");
        }
      }

      // Stendhal: Apply self-Defenseless
      if (resolved.metadata.appliesSelfDefenseless) {
        await APIBattle.addStatus({
          battleCharacterId: source.battleID,
          effectType: "Unprotected",
          ammount: 0,
          remainingTurns: 2
        });
        showToast("Indefeso aplicado em si mesma!");
      }

      // Execute all special skill mechanics
      await executeAllSpecialMechanics({
        source,
        target,
        resolved,
        allCharacters: player.fightInfo?.characters ?? [],
        showToast
      }, mpToGrant);

      // Gain stains after skill execution
      if (skillMetadata.gainsStains && skillMetadata.gainsStains.length > 0) {
        // Use stains after consumption (not from player state which might be stale)
        const newStains = addStains(currentStainsAfterConsumption, skillMetadata.gainsStains);
        await updateCharacterStains(source.battleID, newStains);
        await checkPlayerLoop(); // Update frontend immediately
      }

      // Handle Elemental Trick: Gain random stain on crit
      if (skillMetadata.gainsStainOnCrit) {
        const critRolls = countCriticalRolls(lastDiceResult);
        if (critRolls > 0) {
          const updatedSource = player.fightInfo?.characters?.find(
            c => c.battleID === player.fightInfo?.playerBattleID
          );

          if (updatedSource) {
            const randomStains = ["Lightning", "Earth", "Fire", "Ice"] as const;
            const randomStain = randomStains[Math.floor(Math.random() * randomStains.length)];

            const currentStains: [string | null, string | null, string | null, string | null] = [
              updatedSource.stainSlot1 ?? null,
              updatedSource.stainSlot2 ?? null,
              updatedSource.stainSlot3 ?? null,
              updatedSource.stainSlot4 ?? null
            ];

            const newStains = addStains(currentStains, [randomStain]);
            await updateCharacterStains(source.battleID, newStains);
            await checkPlayerLoop(); // Update frontend immediately

            showToast(`Crítico! Mancha ${randomStain} ganha!`);
          }
        }
      }

      // Handle Electrify: Transform Fire to Light
      if (skillMetadata.transformsStainToLight) {
        const updatedSource = player.fightInfo?.characters?.find(
          c => c.battleID === player.fightInfo?.playerBattleID
        );

        if (updatedSource) {
          const { from, to } = skillMetadata.transformsStainToLight;
          const newStains = transformStain(updatedSource, from, to);
          await updateCharacterStains(source.battleID, newStains);
          await checkPlayerLoop(); // Update frontend immediately

          showToast(`Mancha ${from} transformada em ${to}!`);
        }
      }

      // Handle Assault Zero: Rank up on crit
      if (skillMetadata.ranksUpOnCrit) {
        const critRolls = countCriticalRolls(lastDiceResult);
        if (critRolls > 0) {
          try {
            const success = await APIBattle.rankUpCharacter(source.battleID);
            if (success) {
              await checkPlayerLoop(); // Update frontend immediately to show new rank

              const updatedSource = player.fightInfo?.characters?.find(
                c => c.battleID === player.fightInfo?.playerBattleID
              );
              const newRank = updatedSource?.perfectionRank ?? "?";

              showToast(`Crítico! Rank subiu para ${newRank}!`);
            }
          } catch (error) {
            console.error("Erro ao subir rank:", error);
          }
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
        const playerChar = player?.fightInfo?.characters?.find(c => c.battleID === player.fightInfo?.playerBattleID)
        let defenseValue = attack.totalPower;
        if (result != null) {
          defenseValue = calculateDefense(attack.totalPower, player, weaponInfo, result, defense, playerChar?.stance);
        } else {
          // When taking damage without rolling, still apply stance modifiers
          if (playerChar?.stance === "Defensive") {
            defenseValue = Math.floor(defenseValue * 0.5)  // -50% damage received
          } else if (playerChar?.stance === "Offensive") {
            defenseValue = Math.floor(defenseValue * 1.5)  // +50% damage received
          }
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
