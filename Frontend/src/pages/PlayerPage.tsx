import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useLocation, matchPath } from "react-router-dom";
import { useParams, useNavigate } from "react-router-dom";
import { t } from "../i18n";
import { FaUser, FaSkull, FaCheckCircle, FaDivide, FaShieldAlt, FaTimes, FaFire, FaUsers, FaExclamationTriangle } from "react-icons/fa";
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
import { triggerOnHealAlly, triggerOnFreeAim, triggerOnBattleStart, triggerOnTurnStart, triggerOnKill, triggerOnDodge } from "../utils/PictoEffectsIntegration";
import { executeWeaponPassives } from "../utils/WeaponPassives_Index";
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
  const [isExecutingMezzoForte, setIsExecutingMezzoForte] = useState(false);
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
  const [excludeSelfFromTargeting, setExcludeSelfFromTargeting] = useState(false);
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

  // Lampmaster Light: Track consecutive uses for damage escalation (max 5 stacks)
  const [lampmasterStacks, setLampmasterStacks] = useState(0);

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
      setExcludeSelfFromTargeting(false);
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
      }

      // Sempre atualizar pictos, weapons, luminas e fightInfo
      setPlayer(prev =>
        prev
          ? {
            ...prev,
            fightInfo: playerInfo?.fightInfo ?? undefined,
            pictos: playerInfo?.pictos ?? prev.pictos,
            weapons: playerInfo?.weapons ?? prev.weapons,
            luminas: playerInfo?.luminas ?? prev.luminas
          }
          : prev
      );

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
        {loading && <div className="text-center opacity-70 py-16">{t("common.loading")}</div>}

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
            <CombatSection onMenuAction={handleCombatMenuAction} player={player} onSelectTarget={handleSelectAttackTarget} isReviveMode={isReviveMode} isSelectingSkillTarget={isSelectingSkillTarget} forcedTab={combatTab} onTabChange={setCombatTab} isExecutingSkill={isExecutingSkill} isAdmin={isAdmin} excludeSelfFromTargeting={excludeSelfFromTargeting} />
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
          setError(t("errors.errorLoading") + " " + e?.message);
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
      setError(t("errors.errorLoading") + " " + e?.message);
    }
  }

  function checkBattleLog(playerInfo: GetPlayerResponse) {
    const logs = playerInfo.battleLogs ?? []
    if (logs.length === 0) return

    const fightEvents = new Set([
      "ADD_CHARACTER",
      "REMOVE_CHARACTER",
      "SET_INITIATIVE",
      "INITIATIVES_REORDERED",
      "BATTLE_STARTED",
      "BATTLE_FINISHED",
      "TURN_ENDED",
      "TURN_ADDED",
      "TURNS_REORDERED",
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

          // Trigger picto effects for battle start (after initiative rolled)
          if (player.fightInfo) {
            const sourceChar = player.fightInfo.characters?.find(c => c.battleID === player.fightInfo?.playerBattleID);
            const allChars = player.fightInfo.characters ?? [];
            if (sourceChar && player.fightInfo.battleId) {
              await triggerOnBattleStart(sourceChar, allChars, player.fightInfo.battleId, player.pictos, player.luminas);

              // Trigger weapon passive effects for battle start
              if (weaponInfo.details?.name && weaponInfo.weapon?.level) {
                await executeWeaponPassives(
                  "on-battle-start",
                  sourceChar,
                  allChars,
                  player.fightInfo.battleId,
                  weaponInfo.details.name,
                  weaponInfo.weapon.level
                );
              }
            }
          }
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

    // Calculate hit count for Combo Attack pictos (only for basic attacks)
    const executeAttackWithHitCount = async () => {
      let totalHits = 1; // Base: 1 hit

      // Only check for combo modifiers on basic attacks
      if (attackType === "basic" && player?.fightInfo?.playerBattleID) {
        try {
          const modifiers = await APIBattle.getModifiers(player.fightInfo!.playerBattleID);
          const comboModifiers = modifiers.filter(
            m => m.modifierType === "base-attack" && m.isActive && m.flatBonus > 0
          );
          const extraHits = comboModifiers.reduce((sum, m) => sum + m.flatBonus, 0);
          totalHits = 1 + extraHits;

          if (totalHits > 1) {
            showToast(`Combo Attack! ${totalHits} hits!`);
          }
        } catch (error) {
          console.error("Error getting combo modifiers:", error);
          // Continue with 1 hit if error
        }
      }

      // Execute each hit sequentially
      for (let hitIndex = 0; hitIndex < totalHits; hitIndex++) {
        await new Promise<void>((resolve) => {
          rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, rollCommandForAttack(weaponInfo, attackType), result => {
      const playerChar = player?.fightInfo?.characters?.find(c => c.battleID === player.fightInfo?.playerBattleID)
      const criticalRolls = countCriticalRolls(result, player?.pictos, target)
      const criticalMulti = calculatePlayerCriticalMulti(result, player, target)
      const rollTotal = diceTotal(result)
      const weaponPower = calculateRawWeaponPower(weaponInfo, attackType)
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

      // Breaker: Check if player has breaker picto and target has Broken or Fragile
      const hasBreaker = player?.pictos?.some(p =>
        p.pictoId?.toLowerCase() === "breaker" &&
        p.slot !== null && p.slot !== undefined &&
        p.slot >= 0 &&
        p.slot <= 2
      ) ?? false;
      const targetHasBroken = target.status?.some(s => s.effectName === "Broken") ?? false;
      const targetHasFragile = target.status?.some(s => s.effectName === "Fragile") ?? false;
      const breakerBonus = (hasBreaker && (targetHasBroken || targetHasFragile)) ? 25 : 0;

      // Breaking Burn: Check if player has breaking-burn picto and target has Burning AND (Broken or Fragile)
      const hasBreakingBurn = player?.pictos?.some(p =>
        p.pictoId?.toLowerCase() === "breaking-burn" &&
        p.slot !== null && p.slot !== undefined &&
        p.slot >= 0 &&
        p.slot <= 2
      ) ?? false;
      const targetHasBurning = target.status?.some(s => s.effectName === "Burning") ?? false;
      const breakingBurnBonus = (hasBreakingBurn && targetHasBurning && (targetHasBroken || targetHasFragile)) ? 25 : 0;

      // Enfeebling Mark: Check if attacker (player) has Marked status
      // Note: Enfeebling Mark penalty is applied in backend DamageModifierService
      const playerHasMarked = playerChar?.status?.some(s => s.effectName === "Marked") ?? false;
      const enfeeblingMarkPenalty = (playerHasMarked && target.type === "player") ? 30 : 0;

      // Burn Affinity: Check if player has burn-affinity and target has Burning
      const hasBurnAffinity = player?.pictos?.some(p =>
        p.pictoId?.toLowerCase() === "burn-affinity" &&
        p.slot !== null && p.slot !== undefined && p.slot >= 0 && p.slot <= 2
      ) ?? false;
      const burnAffinityBonus = (hasBurnAffinity && targetHasBurning) ? 25 : 0;

      // Teamwork: Check if player has teamwork and all allies are alive
      const hasTeamwork = player?.pictos?.some(p =>
        p.pictoId?.toLowerCase() === "teamwork" &&
        p.slot !== null && p.slot !== undefined && p.slot >= 0 && p.slot <= 2
      ) ?? false;
      const allies = player?.fightInfo?.characters?.filter(c =>
        c.type === "player" && c.battleID !== playerChar?.battleID
      ) ?? [];
      const allAlliesAlive = allies.length > 0 && allies.every(a => a.healthPoints > 0);
      const teamworkBonus = (hasTeamwork && allAlliesAlive) ? 10 : 0;

      // Faster Than Strong: Check if player has DamageReduction status
      const hasDamageReduction = playerChar?.status?.some(s =>
        s.effectName === "DamageReduction"
      ) ?? false;
      const damageReductionAmount = playerChar?.status
        ?.find(s => s.effectName === "DamageReduction")?.ammount ?? 0;

      // Augmented Counter: Counter damage bonus is applied in backend DamageModifierService
      // No need to show in UI as it's automatically calculated during counterattacks

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
          {breakerBonus > 0 && (
            <h3 className="flex items-center gap-2 text-green-600 font-bold text-lg">
              <FaCheckCircle className="w-6 h-6" />
              Breaker: Alvo {targetHasBroken ? "Broken" : "Fragile"} <b>(+{breakerBonus}%)</b>
            </h3>
          )}
          {breakingBurnBonus > 0 && (
            <h3 className="flex items-center gap-2 text-orange-600 font-bold text-lg">
              <FaCheckCircle className="w-6 h-6" />
              Breaking Burn: Alvo Burning+{targetHasBroken ? "Broken" : "Fragile"} <b>(+{breakingBurnBonus}%)</b>
            </h3>
          )}
          {enfeeblingMarkPenalty > 0 && (
            <h3 className="flex items-center gap-2 text-red-600 font-bold text-lg">
              <FaTimes className="w-6 h-6" />
              Você está Marcado! Alvo pode ter Enfeebling Mark <b>(-{enfeeblingMarkPenalty}%)</b>
            </h3>
          )}
          {burnAffinityBonus > 0 && (
            <h3 className="flex items-center gap-2 text-orange-600 font-bold text-lg">
              <FaFire className="w-6 h-6" />
              Burn Affinity: Alvo Burning <b>(+{burnAffinityBonus}%)</b>
            </h3>
          )}
          {teamworkBonus > 0 && (
            <h3 className="flex items-center gap-2 text-blue-600 font-bold text-lg">
              <FaUsers className="w-6 h-6" />
              Teamwork: Todos aliados vivos <b>(+{teamworkBonus}%)</b>
            </h3>
          )}
          {hasDamageReduction && damageReductionAmount > 0 && (
            <h3 className="flex items-center gap-2 text-red-600 font-bold text-lg">
              <FaExclamationTriangle className="w-6 h-6" />
              Faster Than Strong: Turno extra ativo <b>(-{damageReductionAmount}%)</b>
            </h3>
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
            }

            await APIBattle.attack(attackInfo)
          }

          // Check if enemy was killed (Dead Energy picto trigger)
          if (player.fightInfo?.battleId) {
            const sourceChar = player.fightInfo.characters?.find(c => c.battleID === player.fightInfo?.playerBattleID);
            if (sourceChar) {
              // Get updated battle state to check if target died
              const updatedBattle = await APIBattle.getById(player.fightInfo.battleId);
              const allChars = updatedBattle.characters ?? [];
              const targetAfterAttack = allChars.find(c => c.battleID === target.battleID);

              // If target HP is 0 or target no longer exists, they were killed
              if (!targetAfterAttack || targetAfterAttack.healthPoints <= 0) {
                if (target.isEnemy) {
                  // Trigger Dead Energy and other on-kill effects
                  await triggerOnKill(
                    sourceChar,
                    target,
                    allChars,
                    player.fightInfo.battleId,
                    player.pictos,
                    player.luminas
                  );
                }
              }
            }
          }

          // Trigger weapon passive effects for base attack
          if (attackType === "basic" && player.fightInfo) {
            const sourceChar = player.fightInfo.characters?.find(c => c.battleID === player.fightInfo?.playerBattleID);
            const allChars = player.fightInfo.characters ?? [];
            if (sourceChar && player.fightInfo.battleId && weaponInfo.details?.name && weaponInfo.weapon?.level) {
              const damageAmount = target.type === "npc" ? calculateNpcAttackReceivedDamage(target, total) : total;
              await executeWeaponPassives(
                "on-base-attack",
                sourceChar,
                allChars,
                player.fightInfo.battleId,
                weaponInfo.details.name,
                weaponInfo.weapon.level,
                target,
                { damageAmount }
              );
            }
          }

          // Trigger picto effects for free aim
          if (attackType === "free-shot" && player.fightInfo) {
            const sourceChar = player.fightInfo.characters?.find(c => c.battleID === player.fightInfo?.playerBattleID);
            const allChars = player.fightInfo.characters ?? [];
            if (sourceChar && player.fightInfo.battleId) {
              await triggerOnFreeAim(sourceChar, allChars, player.fightInfo.battleId, player.pictos, player.luminas);

              // Trigger weapon passive effects for free aim
              if (weaponInfo.details?.name && weaponInfo.weapon?.level) {
                await executeWeaponPassives(
                  "on-free-aim",
                  sourceChar,
                  allChars,
                  player.fightInfo.battleId,
                  weaponInfo.details.name,
                  weaponInfo.weapon.level,
                  undefined,
                  { damageAmount: rollTotal }
                );
              }
            }
          }

        } catch (e) {
          showToast("Erro ao atacar")
        }

        resolve(); // Resolve the Promise for this hit
      };

      callAttack();
    });  // End of rollWithTimeout callback
        });  // End of Promise
      }

      setIsExecutingSkill(false);
    };

    // Execute the attack with hit count
    executeAttackWithHitCount();
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
        setExcludeSelfFromTargeting(false);
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
      skillMetadata.targetScope === "ally" ||
      skillMetadata.targetScope === "all-allies" ||
      skillMetadata.primaryEffects.some(e => e.targetType === "self" || e.targetType === "ally" || e.targetType === "all-allies") ||
      skillMetadata.conditionalEffects.some(e => e.targetType === "self" || e.targetType === "ally" || e.targetType === "all-allies");

    // Get current character to determine which team they are on
    const currentCharacter = player?.fightInfo?.characters?.find(
      c => c.battleID === player.fightInfo?.playerBattleID
    );

    // Auto-execute self-targeted utility skills (like Mezzo Forte)
    if (skillMetadata.targetScope === "self" && skillMetadata.damageLevel === "none" && !targetsEnemies) {
      setPendingSkillId(skillId);
      setTab("combate");
      setIsUsingSkillMode(false);
      if (currentCharacter) {
        handleExecuteSkill(skillId, currentCharacter);
      } else {
        showToast("Erro: Personagem não encontrado");
      }
      return;
    }

    // Auto-execute all-enemies skills (like Guard Down)
    if (skillMetadata.targetScope === "all-enemies" && currentCharacter) {
      setPendingSkillId(skillId);
      setTab("combate");
      setIsUsingSkillMode(false);
      handleExecuteSkill(skillId, currentCharacter);
      return;
    }

    // Auto-execute all-allies skills (like All Set)
    if (skillMetadata.targetScope === "all-allies" && currentCharacter) {
      setPendingSkillId(skillId);
      setTab("combate");
      setCombatTab(currentCharacter.isEnemy ? "enemies" : "team");
      setIsUsingSkillMode(false);
      handleExecuteSkill(skillId, currentCharacter);
      return;
    }

    // Store the skill to be used and switch to combat tab for target selection
    setPendingSkillId(skillId);
    setTab("combate");
    setIsUsingSkillMode(false);

    // Skills with targetScope "ally" should exclude self from targeting
    setExcludeSelfFromTargeting(skillMetadata.targetScope === "ally");

    // Determine correct tab based on target type and character's team
    // If character is on enemy team (isEnemy = true):
    //   - targetsEnemies means target opposite team (team A = "team")
    //   - targetsAllies means target same team (team B = "enemies")
    // If character is on ally team (isEnemy = false):
    //   - targetsEnemies means target opposite team (team B = "enemies")
    //   - targetsAllies means target same team (team A = "team")

    if (targetsEnemies && !targetsAllies) {
      // Target enemies (opposite team)
      setCombatTab(currentCharacter?.isEnemy ? "team" : "enemies");
    } else if (targetsAllies && !targetsEnemies) {
      // Target allies (same team)
      setCombatTab(currentCharacter?.isEnemy ? "enemies" : "team");
    } else {
      // Default to enemies (opposite team) if ambiguous
      setCombatTab(currentCharacter?.isEnemy ? "team" : "enemies");
    }

    setIsSelectingSkillTarget(true);
  }

  async function handleExecuteSkill(skillId: string, target: BattleCharacterInfo) {
    if (!player?.fightInfo) return;

    // Prevent duplicate execution for Mezzo Forte
    if (skillId === "maelle-mezzo-forte" && isExecutingMezzoForte) {
      return;
    }

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
      let skillCost = fullSkill?.cost ?? 0;
      const isGradientSkill = fullSkill?.isGradient ?? false;

      // Monoco's Bestial Wheel special effects
      // Each skill has a special effect when used on a specific mask color
      // Máscara Onipotente (gold, position 0) acts as a wildcard for any skill's special effect
      const bestialWheelPosition = source.bestialWheelPosition ?? -1;
      const wheelPattern = ["gold", "blue", "blue", "purple", "purple", "red", "red", "green", "green"];
      const currentMask = wheelPattern[bestialWheelPosition] ?? "";
      const isMonoco = source.id.toLowerCase().includes("monoco");

      if (isMonoco && !isGradientSkill) {
        // Abbest Wind: Cost 0 MP on Máscara Ágil (purple) or Máscara Onipotente (gold wildcard)
        if (skillId === "monoco-abbest-wind" && (currentMask === "purple" || currentMask === "gold")) {
          skillCost = 0;
        }
        // TODO: Add other Monoco skills' special mask effects here
        // Example: if (skillId === "monoco-other-skill" && (currentMask === "blue" || currentMask === "gold")) { ... }
      }

      // Maelle's stance-based cost reduction (Percee, Momentum Strike)
      if (skillMetadata.costReductionFromStance && !isGradientSkill) {
        const currentStance = source.stance;
        if (currentStance === skillMetadata.costReductionFromStance.stance) {
          skillCost = skillMetadata.costReductionFromStance.reducedCost;
        }
      }

      // Payback: Cost reduction per parry (using parriesThisTurn counter)
      if (skillMetadata.costReductionPerParry && !isGradientSkill) {
        const parriesCount = source.parriesThisTurn ?? 0;
        if (parriesCount > 0) {
          const reductionPerParry = skillMetadata.costReductionPerParry;
          const totalReduction = parriesCount * reductionPerParry;
          const originalCost = skillCost;
          skillCost = Math.max(0, skillCost - totalReduction);
          showToast(`${parriesCount} Aparada(s) bem sucedida(s)! Custo reduzido de ${originalCost} para ${skillCost} MP`);
        }
      }

      // Validate resources (MP or Gradient charges)
      if (isGradientSkill) {
        const currentGradientCharges = Math.floor((source.gradientPoints ?? 0) / 12);
        if (currentGradientCharges < skillCost) {
          showToast(`Cargas de Gradiente insuficientes! Necessário: ${skillCost}, Disponível: ${currentGradientCharges}`);
          setPendingSkillId(null);
          setIsSelectingSkillTarget(false);
          setExcludeSelfFromTargeting(false);
          return;
        }
      } else {
        const currentMp = source.magicPoints ?? 0;
        if (currentMp < skillCost) {
          showToast(`MP insuficiente! Necessário: ${skillCost}, Disponível: ${currentMp}`);
          setPendingSkillId(null);
          setIsSelectingSkillTarget(false);
          setExcludeSelfFromTargeting(false);
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
          setExcludeSelfFromTargeting(false);
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

      // Roll 1d6 to determine target scope
      if (resolved.metadata.rollsForTargetScope) {
        // Rush (Sciel): 1-2 = single ally, 3-6 = all allies
        if (skillId === "sciel-rush") {
          await new Promise<void>((resolvePromise) => {
            rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, "1d6", async (result) => {
              const diceRoll = result && result.length > 0 ? result[0].value : 1;

              if (diceRoll >= 3) {
                // 3-6: All allies
                showToast(`Rolou ${diceRoll}! Rapidez aplicada em todos os aliados!`);
                const alliesTargets = (player.fightInfo?.characters ?? [])
                  .filter(c => c.isEnemy === source.isEnemy && c.healthPoints > 0)
                  .map(c => c.battleID);

                // Update resolved to target all allies
                resolved = {
                  ...resolved,
                  targetIds: alliesTargets,
                  effects: alliesTargets.flatMap(targetId =>
                    resolved.effects.map(eff => ({
                      ...eff,
                      targetBattleId: targetId,
                      targetType: "all-allies" as any
                    }))
                  )
                };
              } else {
                // 1-2: Single ally only (keep original target)
                showToast(`Rolou ${diceRoll}! Rapidez aplicada apenas no alvo escolhido.`);
              }

              resolvePromise();
            });
          });
        }
        // Guard Up (Maelle): 3-6 = all allies, 1-2 = single target only
        else if (skillId === "maelle-guard-up") {
          await new Promise<void>((resolvePromise) => {
            rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, "1d6", async (result) => {
              const diceRoll = result && result.length > 0 ? result[0].value : 1;

              if (diceRoll >= 3) {
                // 3-6: All allies
                showToast(`Rolou ${diceRoll}! Escudo aplicado em toda a equipe!`);
                const alliesTargets = (player.fightInfo?.characters ?? [])
                  .filter(c => c.isEnemy === source.isEnemy && c.healthPoints > 0)
                  .map(c => c.battleID);

                // Update resolved targets and regenerate effects for each target
                resolved = {
                  ...resolved,
                  targetIds: alliesTargets,
                  effects: alliesTargets.flatMap(targetId =>
                    resolved.effects.map(eff => ({
                      ...eff,
                      targetBattleId: targetId,
                      targetType: "all-allies" as any
                    }))
                  )
                };
              } else {
                // 1-2: Single target only (keep original target)
                showToast(`Rolou ${diceRoll}! Escudo aplicado apenas no alvo escolhido.`);
                // Update effects to have correct targetBattleId for the chosen ally
                const chosenTargetId = resolved.targetIds[0];
                resolved = {
                  ...resolved,
                  effects: resolved.effects.map(eff => ({
                    ...eff,
                    targetBattleId: chosenTargetId,
                    targetType: "ally" as any
                  }))
                };
              }

              resolvePromise();
            });
          });
        }
        // Powerful (Verso): 1-3 = self only, 4-6 = all allies
        else {
          const diceRoll = Math.floor(Math.random() * 6) + 1;  // 1-6
          if (diceRoll >= 4) {
            // 4-6: All allies
            showToast(`Rolou ${diceRoll}! Powerful afeta toda equipe!`);
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

      // Burning Canvas: Calculate burn damage bonus (flat)
      let burnBonus = 0;
      if (resolved.metadata.damageScalesWithBurn) {
        const targetStatuses = target.status ?? [];
        const burnStacks = targetStatuses
          .filter(s => s.effectName === "Burning")
          .reduce((sum, s) => sum + (s.ammount ?? 0), 0);

        if (burnStacks > 0) {
          const bonusPerBurn = resolved.metadata.burnDamageBonus ?? 2;  // Default +2 per Burn
          burnBonus = burnStacks * bonusPerBurn;
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

      // Breaking Rules: Destroy shields (backend handles this and logs MP recovery)

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

        // Drain allies HP to 1 (including self)
        if (resolved.metadata.drainsAlliesHp) {
          const turnList = player.fightInfo?.turns ?? [];
          const battleIdsInTurns = new Set(turnList.map(t => t.battleCharacterId));

          const aliveAllies = allCharacters.filter(c =>
            !c.isEnemy &&
            c.healthPoints > 1 &&  // Only drain if HP > 1
            battleIdsInTurns.has(c.battleID)  // Only allies who entered battle (in turn list)
          );

          for (const ally of aliveAllies) {
            const hpToDrain = ally.healthPoints - 1;
            hpDrained += hpToDrain;
            await APIBattle.updateCharacterHp(ally.battleID, 1);
          }

          if (hpDrained > 0) {
            showToast(`HP drenado de aliados em combate: ${hpDrained} (Dano +${hpDrained})`);
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

      // Calculate actual hit count (random if minHits/maxHits defined)
      const actualHitCount = resolved.metadata.minHits && resolved.metadata.maxHits
        ? Math.floor(Math.random() * (resolved.metadata.maxHits - resolved.metadata.minHits + 1)) + resolved.metadata.minHits
        : resolved.hitCount;

      // Show toast for variable hit skills
      if (resolved.metadata.minHits && resolved.metadata.maxHits) {
        showToast(`${actualHitCount} acerto(s)!`);
      }

      if (actualHitCount > 0) {
        for (let hitIndex = 0; hitIndex < actualHitCount; hitIndex++) {
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

                  // Get target for Critical Burn picto check
                  const targetChar = resolved.targetIds.length > 0
                    ? (player.fightInfo?.characters ?? []).find(c => c.battleID === resolved.targetIds[0])
                    : undefined;

                  // Sword Ballet: Double crit damage (4x total instead of 2x)
                  let critMulti = calculatePlayerCriticalMulti(result, player, targetChar);
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

                  // Cultist Blood: Sacrifice 90% HP to increase damage (additive, happens once on first hit)
                  let hpSacrificeBonus = 0;
                  if (hitIndex === 0 && resolved.metadata.sacrificesHpPercent) {
                    const percentToSacrifice = resolved.metadata.sacrificesHpPercent;
                    const currentHp = source.healthPoints;
                    const hpToSacrifice = Math.floor(currentHp * (percentToSacrifice / 100));
                    if (hpToSacrifice > 0) {
                      const newHp = currentHp - hpToSacrifice;
                      await APIBattle.updateCharacterHp(source.battleID, Math.max(1, newHp));
                      hpSacrificeBonus = hpToSacrifice;
                      showToast(`Sacrificando ${percentToSacrifice}% HP (${hpToSacrifice})! Dano +${hpSacrificeBonus}`);
                    }
                  }

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
                        showToast(`${targetChar?.name ?? 'Alvo'}: Predição consumida! Dano x${resolved.metadata.foretellPerHitMultiplier ?? 2.0}`);
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
                    if (source.perfectionRank === rank && damageMultiplier) {
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

                  // Cultist Slashes: Damage scales inversely with HP (lower HP = more damage)
                  // Formula: 1.0 at 100% HP, up to 2.0 at 0% HP (linear scaling)
                  let lowHpMultiplier = 1.0;
                  if (resolved.metadata.damageScalesWithLowHp) {
                    const hpPercent = source.healthPoints / source.maxHealthPoints;
                    lowHpMultiplier = 1.0 + (1.0 - hpPercent);  // 100% HP = 1.0x, 50% HP = 1.5x, 0% HP = 2.0x
                    if (hitIndex === 0 && lowHpMultiplier > 1.0) {
                      const bonusPercent = Math.round((lowHpMultiplier - 1.0) * 100);
                      showToast(`HP baixo! Dano +${bonusPercent}%`);
                    }
                  }

                  // Lampmaster Light: Damage escalates with consecutive uses (+20% per stack, max 5)
                  let lampmasterMultiplier = 1.0;
                  if (resolved.metadata.damageEscalatesPerUse) {
                    lampmasterMultiplier = 1.0 + (lampmasterStacks * 0.2);  // 0 stacks = 1.0x, 5 stacks = 2.0x
                    if (hitIndex === 0) {
                      const bonusPercent = Math.round((lampmasterMultiplier - 1.0) * 100);
                      if (bonusPercent > 0) {
                        showToast(`Lampmaster Stacks: ${lampmasterStacks} (+${bonusPercent}% dano)`);
                      }
                      // Increment stacks after this use (max 5)
                      setLampmasterStacks(prev => Math.min(prev + 1, 5));
                    }
                  } else if (hitIndex === 0 && skillId !== "monoco-lampmaster-light") {
                    // Reset Lampmaster stacks if using any other skill
                    if (lampmasterStacks > 0) {
                      setLampmasterStacks(0);
                    }
                  }

                  // Revenge: Damage scales with hits taken since last turn
                  // Uses hitsTakenThisTurn counter (automatically tracked)
                  let hitsReceivedBonus = 0;
                  if (resolved.metadata.damageScalesWithHitsReceived) {
                    const hitsTaken = source.hitsTakenThisTurn ?? 0;
                    if (hitsTaken > 0) {
                      // Each hit received adds +10% damage (similar to other scaling mechanics)
                      hitsReceivedBonus = hitsTaken * 10;
                    }
                  }

                  // Monoco's Bestial Wheel: Máscara Onipotente (gold, position 0) increases damage by 50%
                  const wheelPattern = ["gold", "blue", "blue", "purple", "purple", "red", "red", "green", "green"];
                  const bestialWheelPosition = source.bestialWheelPosition ?? -1;
                  const currentMask = wheelPattern[bestialWheelPosition] ?? "";
                  const isMonoco = source.id?.toLowerCase().includes("monoco");
                  const almightyMaskMultiplier = (isMonoco && currentMask === "gold") ? 1.5 : 1.0;

                  let primaryTargetDamage = 0;  // Save damage for Searing Bond propagation

                  // For random targeting, select one random enemy per hit
                  let targetsForThisHit = resolved.targetIds;
                  if (resolved.metadata.targetScope === "random") {
                    const enemies = (player.fightInfo?.characters ?? []).filter(c => c.isEnemy !== source.isEnemy);
                    if (enemies.length > 0) {
                      const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];
                      targetsForThisHit = [randomEnemy.battleID];
                    }
                  }

                  for (const targetId of targetsForThisHit) {
                    // Calculate shield bonus for Chevaliere Piercing
                    let shieldBonus = 0;
                    if (resolved.metadata.damagePerShieldStack && player.fightInfo) {
                      const targetChar = player.fightInfo.characters?.find(c => c.battleID === targetId);
                      const shieldStacks = targetChar?.status?.find(s => s.effectName === "Shielded")?.ammount ?? 0;
                      shieldBonus = shieldStacks * resolved.metadata.damagePerShieldStack;
                    }

                    // Danseuse Waltz: Bonus damage vs Burning targets (multiplicative)
                    let burningTargetMultiplier = 1.0;
                    if (resolved.metadata.bonusDamageVsBurning && player.fightInfo) {
                      const targetChar = player.fightInfo.characters?.find(c => c.battleID === targetId);
                      const isBurning = targetChar?.status?.some(s => s.effectName === "Burning") ?? false;
                      if (isBurning) {
                        burningTargetMultiplier = 1.5;  // 50% bonus damage vs Burning
                        if (hitIndex === 0) {
                          showToast(`Alvo queimando! Dano +50%`);
                        }
                      }
                    }

                    // Mighty Strike: Double damage vs Stunned targets (multiplicative)
                    let stunnedTargetMultiplier = 1.0;
                    if (resolved.metadata.doubleDamageVsStunned && player.fightInfo) {
                      const targetChar = player.fightInfo.characters?.find(c => c.battleID === targetId);
                      const isStunned = targetChar?.status?.some(s => s.effectName === "Stunned") ?? false;
                      if (isStunned) {
                        stunnedTargetMultiplier = 2.0;  // Double damage vs Stunned
                        if (hitIndex === 0) {
                          showToast(`Alvo atordoado! Dano x2`);
                        }
                      }
                    }

                    // Obscur Sword: Bonus damage vs Powerless targets (multiplicative)
                    let powerlessTargetMultiplier = 1.0;
                    if (resolved.metadata.bonusDamageVsPowerless && player.fightInfo) {
                      const targetChar = player.fightInfo.characters?.find(c => c.battleID === targetId);
                      const isPowerless = targetChar?.status?.some(s => s.effectName === "Powerless") ?? false;
                      if (isPowerless) {
                        powerlessTargetMultiplier = 1.5;  // 50% bonus damage vs Powerless
                        if (hitIndex === 0) {
                          showToast(`Alvo impotente! Dano +50%`);
                        }
                      }
                    }

                    // Apply per-target Foretell consumption multiplier (Sealed Fate / Firing Shadow)
                    const targetForetellMultiplier = foretellConsumedPerTarget.get(targetId)
                      ? (resolved.metadata.foretellPerHitMultiplier ?? 2.0)
                      : 1.0;

                    // Apply charge bonus, foretell bonus, HP drained, all enemies foretell, HP sacrifice, shield bonus, and burn bonus (additive) then per-hit foretell multiplier, twilight, Verso's perfection, low HP multiplier, lampmaster escalation, hits received bonus, almighty mask, burning target, stunned target, powerless target, burn consumption, fire vulnerability, and marked bonus (multiplicative)
                    const damageWithCharge = baseHitDamage + chargeBonus + foretellBonus + hpDrained + allEnemiesForetellConsumed + hpSacrificeBonus + shieldBonus + burnBonus;
                    const damageWithForetellPerHit = Math.floor(damageWithCharge * targetForetellMultiplier);
                    const damageWithTwilight = Math.floor(damageWithForetellPerHit * twilightMultiplier);
                    const damageWithPerfection = Math.floor(damageWithTwilight * versoPerfectionMultiplier);
                    const damageWithLowHp = Math.floor(damageWithPerfection * lowHpMultiplier);
                    const damageWithLampmaster = Math.floor(damageWithLowHp * lampmasterMultiplier);
                    const hitsReceivedMultiplier = 1.0 + (hitsReceivedBonus / 100);  // Convert percentage to multiplier
                    const damageWithHitsReceived = Math.floor(damageWithLampmaster * hitsReceivedMultiplier);
                    const damageWithAlmightyMask = Math.floor(damageWithHitsReceived * almightyMaskMultiplier);
                    const damageWithBurningTarget = Math.floor(damageWithAlmightyMask * burningTargetMultiplier);
                    const damageWithStunnedTarget = Math.floor(damageWithBurningTarget * stunnedTargetMultiplier);
                    const damageWithPowerlessTarget = Math.floor(damageWithStunnedTarget * powerlessTargetMultiplier);
                    const damageWithBurnConsumption = Math.floor(damageWithPowerlessTarget * burnConsumptionMultiplier);
                    const damageWithFireVulnerability = Math.floor(damageWithBurnConsumption * fireVulnerabilityMultiplier);
                    const hitDamage = Math.floor(damageWithFireVulnerability * markedDamageMultiplier);

                    // Save damage from first target for Searing Bond propagation
                    if (targetId === resolved.targetIds[0]) {
                      primaryTargetDamage = hitDamage;
                    }

                    const effects = getStatusEffectsForTarget(resolved.effects, targetId);

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

                    // Egide: Extend Guardian duration if source has Protected (Shield) status
                    if (hitIndex === 0 && skillId === "maelle-egide") {
                      const sourceStatuses = source.status ?? [];
                      const hasProtected = sourceStatuses.some(s => s.effectName === "Protected");
                      if (hasProtected) {
                        // Extend Guardian duration from 2 to 3 turns
                        finalEffects = finalEffects.map(effect => {
                          if (effect.effectType === "Guardian") {
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
                    if (resolved.metadata.conditionalBurnBonus) {
                      const { fromStance, bonusBurn } = resolved.metadata.conditionalBurnBonus;
                      if (source.stance === fromStance) {
                        // Add bonus burn to Burning effects
                        finalEffects = finalEffects.map(effect => {
                          if (effect.effectType === "Burning") {
                            const newAmount = (effect.ammount ?? 0) + bonusBurn;
                            if (hitIndex === 0) {
                              showToast(`Bonus de postura! +${bonusBurn} Queimaduras por acerto`);
                            }
                            return { ...effect, ammount: newAmount };
                          }
                          return effect;
                        });
                      }
                    }

                    // Sapling Absorption: Heal source HP per hit (5% base, 10% at Caster/Almighty Mask)
                    if (resolved.metadata.healsHpPercentPerHit) {
                      const wheelPattern = ["gold", "blue", "blue", "purple", "purple", "red", "red", "green", "green"];
                      const bestialWheelPosition = source.bestialWheelPosition ?? -1;
                      const currentMask = wheelPattern[bestialWheelPosition] ?? "";
                      const isCasterOrAlmighty = currentMask === "blue" || currentMask === "gold";

                      // Double healing if at Caster/Almighty Mask
                      const healMultiplier = (resolved.metadata.doublesHealAtCasterMask && isCasterOrAlmighty) ? 2 : 1;
                      const healPercent = resolved.metadata.healsHpPercentPerHit * healMultiplier;
                      const healAmount = Math.floor(source.maxHealthPoints * (healPercent / 100));
                      const newHp = Math.min(source.healthPoints + healAmount, source.maxHealthPoints);

                      await APIBattle.updateCharacterHp(source.battleID, newHp);

                      if (hitIndex === 0) {
                        showToast(`Absorção! Cura de ${healPercent}% HP (${healAmount})`);
                      }
                    }

                    // Check for Fragile status on NPCs (damage > 2x resistance)
                    if (isNpcTarget && targetChar) {
                      const willGetFragile = checkForFragile(targetChar, hitDamage);
                      if (willGetFragile && !finalEffects.some(e => e.effectType === "Fragile")) {
                        finalEffects.push({
                          effectType: "Fragile",
                          ammount: 1,
                          remainingTurns: 2
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
                          isGradient: hitIndex === 0 && isGradientSkill,
                          destroysShields: hitIndex === 0 && resolved.metadata.destroysShields,
                          grantsMPPerShield: hitIndex === 0 && resolved.metadata.destroysShields ? resolved.metadata.grantsMPPerShield : undefined,
                          consumesBurn: hitIndex === 0 && burnsToConsume > 0 ? burnsToConsume : undefined,
                          consumesForetell: hitIndex === 0 && foretellsToConsume > 0 ? foretellsToConsume : undefined,
                          executionThreshold: resolved.metadata.executionThreshold,
                          skillType: skillType,
                          bestialWheelAdvance: hitIndex === 0 ? (
                            resolved.metadata.forceAlmightyMask
                              ? ((9 - bestialWheelPosition) % 9)  // Calculate positions to reach 0 (Almighty Mask)
                              : resolved.metadata.bestialWheelAdvance
                          ) : undefined,
                          isLastHit: hitIndex === actualHitCount - 1,
                          ignoresShields: resolved.metadata.ignoresShields,
                          shouldRemoveMarked: resolved.metadata.markedDamageBonus ? false : undefined
                        }
                      : {
                          sourceBattleId: source.battleID,
                          targetBattleId: targetId,
                          totalPower: hitDamage,
                          attackType: "skill",
                          effects: finalEffects,
                          skillCost: hitIndex === 0 ? skillCost : 0,
                          consumesCharge: hitIndex === 0 && resolved.metadata.consumesCharge,
                          isGradient: hitIndex === 0 && isGradientSkill,
                          destroysShields: hitIndex === 0 && resolved.metadata.destroysShields,
                          grantsMPPerShield: hitIndex === 0 && resolved.metadata.destroysShields ? resolved.metadata.grantsMPPerShield : undefined,
                          consumesBurn: hitIndex === 0 && burnsToConsume > 0 ? burnsToConsume : undefined,
                          consumesForetell: hitIndex === 0 && foretellsToConsume > 0 ? foretellsToConsume : undefined,
                          executionThreshold: resolved.metadata.executionThreshold,
                          skillType: skillType,
                          bestialWheelAdvance: hitIndex === 0 ? (
                            resolved.metadata.forceAlmightyMask
                              ? ((9 - bestialWheelPosition) % 9)  // Calculate positions to reach 0 (Almighty Mask)
                              : resolved.metadata.bestialWheelAdvance
                          ) : undefined,
                          isLastHit: hitIndex === actualHitCount - 1,
                          ignoresShields: resolved.metadata.ignoresShields,
                          shouldRemoveMarked: resolved.metadata.markedDamageBonus ? false : undefined
                        };

                    await APIBattle.attack(attackRequest);

                    // Check if enemy was killed (Dead Energy picto trigger)
                    if (player.fightInfo?.battleId) {
                      // Get updated battle state to check if target died
                      const updatedBattle = await APIBattle.getById(player.fightInfo.battleId);
                      const allChars = updatedBattle.characters ?? [];
                      const targetAfterAttack = allChars.find(c => c.battleID === targetId);

                      // If target HP is 0 or target no longer exists, they were killed
                      if (!targetAfterAttack || targetAfterAttack.healthPoints <= 0) {
                        const killedEnemy = player.fightInfo.characters?.find(c => c.battleID === targetId);
                        if (killedEnemy && killedEnemy.isEnemy) {
                          // Trigger Dead Energy and other on-kill effects
                          await triggerOnKill(
                            source,
                            killedEnemy,
                            allChars,
                            player.fightInfo.battleId,
                            player.pictos,
                            player.luminas
                          );
                        }
                      }
                    }

                    // Trigger weapon passive effects for skill used (only on first hit)
                    if (hitIndex === 0 && player.fightInfo?.battleId && weaponInfo.details?.name && weaponInfo.weapon?.level) {
                      const allChars = player.fightInfo.characters ?? [];
                      const targetChar = allChars.find(c => c.battleID === targetId);
                      await executeWeaponPassives(
                        "on-skill-used",
                        source,
                        allChars,
                        player.fightInfo.battleId,
                        weaponInfo.details.name,
                        weaponInfo.weapon.level,
                        targetChar,
                        {
                          damageAmount: hitDamage,
                          skillElement: resolved.metadata.forcedElement || weaponInfo.details.attributes.element,
                          skillName: skillId
                        }
                      );
                    }
                  }

                  // Searing Bond: Propagate damage to other Burning enemies
                  if (hitIndex === actualHitCount - 1 && resolved.metadata.propagatesBurnDamage) {
                    // Only propagate on last hit
                    const primaryTargetId = resolved.targetIds[0]; // Single target skill
                    const allEnemies = (player.fightInfo?.characters ?? []).filter(c => c.isEnemy);

                    // Get Foretell amount from skill metadata (same as primary target)
                    const foretellEffect = resolved.metadata.primaryEffects.find(e => e.effectType === "Foretell");
                    const foretellAmount = foretellEffect?.amount ?? 1;

                    // Find other burning enemies (not the primary target)
                    const otherBurningEnemies = allEnemies.filter(enemy =>
                      enemy.battleID !== primaryTargetId &&
                      enemy.status?.some(s => s.effectName === "Burning")
                    );

                    if (otherBurningEnemies.length > 0) {
                      const propagatedDamage = Math.floor(primaryTargetDamage / 2); // 50% of damage

                      for (const enemy of otherBurningEnemies) {
                        const isNpc = enemy.type === "npc";

                        // Check for Fragile on propagated damage
                        const propagationEffects: AttackStatusEffectRequest[] = [
                          {
                            effectType: "Foretell",
                            ammount: foretellAmount,  // Same amount as primary target
                            remainingTurns: 0
                          }
                        ];

                        if (isNpc) {
                          const willGetFragile = checkForFragile(enemy, propagatedDamage);
                          if (willGetFragile) {
                            propagationEffects.push({
                              effectType: "Fragile",
                              ammount: 1,
                              remainingTurns: 2
                            });
                          }
                        }

                        // Apply half damage + Foretell (same amount as primary target) to each burning enemy
                        const propagationRequest: CreateAttackRequest = isNpc
                          ? {
                              sourceBattleId: source.battleID,
                              targetBattleId: enemy.battleID,
                              totalDamage: propagatedDamage,
                              attackType: "skill",
                              effects: propagationEffects,
                              skillCost: 0 // No cost for propagation
                            }
                          : {
                              sourceBattleId: source.battleID,
                              targetBattleId: enemy.battleID,
                              totalPower: propagatedDamage,
                              attackType: "skill",
                              effects: propagationEffects,
                              skillCost: 0 // No cost for propagation
                            };

                        await APIBattle.attack(propagationRequest);

                        // Check if propagated damage killed the enemy (Dead Energy trigger)
                        if (player.fightInfo?.battleId) {
                          const updatedBattle = await APIBattle.getById(player.fightInfo.battleId);
                          const allChars = updatedBattle.characters ?? [];
                          const enemyAfterPropagation = allChars.find(c => c.battleID === enemy.battleID);

                          // If enemy HP is 0 or enemy no longer exists, they were killed
                          if (!enemyAfterPropagation || enemyAfterPropagation.healthPoints <= 0) {
                            // Trigger Dead Energy and other on-kill effects
                            await triggerOnKill(
                              source,
                              enemy,
                              allChars,
                              player.fightInfo.battleId,
                              player.pictos,
                              player.luminas
                            );
                          }
                        }
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
        // For skills without hits (utility skills like Mezzo Forte)

        // Check if this is Mezzo Forte or similar utility skill
        const isMezzoForte = resolved.metadata.grantsMPDiceRoll !== undefined;

        if (isMezzoForte) {
          // Mezzo Forte: Roll dice for MP recovery, maintain stance, grant MP
          // Set flag to prevent duplicate execution
          setIsExecutingMezzoForte(true);

          try {
            // First, consume the MP cost
            const initialMp = source.magicPoints ?? 0;
            const mpAfterCost = Math.max(0, initialMp - skillCost);
            await APIBattle.updateCharacterMp(source.battleID, mpAfterCost);

            // Roll 1d6 for MP recovery using rollWithTimeout
            if (resolved.metadata.grantsMPDiceRoll) {
              await new Promise<void>((resolvePromise) => {
                rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, "1d6", async (result) => {
                  // Get dice roll value from result array
                  const diceRoll = result && result.length > 0 ? result[0].value : 1;
                  const mpToGrant = diceRoll <= 3
                    ? resolved.metadata.grantsMPDiceRoll!.low
                    : resolved.metadata.grantsMPDiceRoll!.high;

                  // Add recovery to MP after cost
                  const maxMp = source.maxMagicPoints ?? 0;
                  const newMp = maxMp > 0 ? Math.min(mpAfterCost + mpToGrant, maxMp) : (mpAfterCost + mpToGrant);

                  await APIBattle.updateCharacterMp(source.battleID, newMp);
                  resolvePromise();
                });
              });
            }
          } finally {
            // Reset flag after execution
            setIsExecutingMezzoForte(false);
          }

          // Grant MP
          if (resolved.metadata.grantsMPRange) {
            const { min, max } = resolved.metadata.grantsMPRange;
            const apGrant = Math.floor(Math.random() * (max - min + 1)) + min;
            if (apGrant > 0) {
              const currentAP = source.chargePoints ?? 0;
              const newAP = currentAP + apGrant;
              await APIBattle.updateCharacterAP(source.battleID, newAP);
            }
          }

          // Reapply stance
          if (resolved.metadata.reappliesStance && source.stance) {
            await APIBattle.updateCharacterStance(source.battleID, source.stance);
          }
        } else {
          // Other skills without hits - consume MP or Gradient
          if (isGradientSkill) {
            // Gradient skills consume gradient charges (skillCost * 12 points per charge)
            const currentGradientPoints = source.gradientPoints ?? 0;
            const gradientCost = skillCost * 12;
            const newGradient = Math.max(0, currentGradientPoints - gradientCost);
            await APIBattle.updateTeamGradient(source.battleID, newGradient);
            showToast(`${skillCost} Carga(s) de Gradiente consumida(s)!`);
          } else if (skillCost > 0) {
            const currentMp = source.magicPoints ?? 0;
            const newMp = currentMp - skillCost;
            await APIBattle.updateCharacterMp(source.battleID, newMp);
          }
        }

        // Apply status effects
        for (const targetId of resolved.targetIds) {
          let effects = getStatusEffectsForTarget(resolved.effects, targetId);

          // Egide: Extend Guardian duration if source has Protected (Shield) status
          if (skillId === "maelle-egide") {
            const sourceStatuses = source.status ?? [];
            const hasProtected = sourceStatuses.some(s => s.effectName === "Protected");
            if (hasProtected) {
              // Extend Guardian duration from 2 to 3 turns
              effects = effects.map(effect => {
                if (effect.effectType === "Guardian") {
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

      // Orphelin Cheers: Grant MP to affected allies if at Caster/Almighty Mask
      if (resolved.metadata.grantsMpAtCasterMask) {
        const wheelPattern = ["gold", "blue", "blue", "purple", "purple", "red", "red", "green", "green"];
        const bestialWheelPosition = source.bestialWheelPosition ?? -1;
        const currentMask = wheelPattern[bestialWheelPosition] ?? "";
        const isCasterOrAlmighty = currentMask === "blue" || currentMask === "gold";

        if (isCasterOrAlmighty) {
          const apToGrant = resolved.metadata.grantsMpAtCasterMask;
          for (const targetId of resolved.targetIds) {
            // Grant MP logic would need backend support - for now, just show toast
            showToast(`${apToGrant} PM concedidos ao aliado!`);
          }
        }
      }

      // Pelerin Heal: Heal HP if at Caster/Almighty Mask
      if (resolved.metadata.healsHpPercentAtCasterMask && player.fightInfo) {
        const wheelPattern = ["gold", "blue", "blue", "purple", "purple", "red", "red", "green", "green"];
        const bestialWheelPosition = source.bestialWheelPosition ?? -1;
        const currentMask = wheelPattern[bestialWheelPosition] ?? "";
        const isCasterOrAlmighty = currentMask === "blue" || currentMask === "gold";

        if (isCasterOrAlmighty) {
          const healPercent = resolved.metadata.healsHpPercentAtCasterMask;
          const allAllies = (player.fightInfo.characters ?? []).filter(c => !c.isEnemy);

          for (const ally of allAllies) {
            const healAmount = Math.floor(ally.maxHealthPoints * (healPercent / 100));
            await APIBattle.updateCharacterHp(ally.battleID, Math.min(ally.healthPoints + healAmount, ally.maxHealthPoints));
          }

          showToast(`Cura instantânea de ${healPercent}% HP aplicada a todos os aliados!`);
        }
      }

      if (resolved.metadata.canBreak && player.fightInfo?.characters) {
        for (const targetId of resolved.targetIds) {
          const target = player.fightInfo.characters.find(c => c.battleID === targetId);
          const isFragile = target?.status?.some(s => s.effectName === "Fragile") ?? false;

          if (isFragile) {
            await APIBattle.breakTarget(targetId);
          }
        }
      }

      // Phoenix Flame: Revive all dead allies with 50-70% HP based on dice roll
      if (skillId === "maelle-phoenix-flame" && player.fightInfo) {
        const deadAllies = (player.fightInfo.characters ?? []).filter(
          c => !c.isEnemy && c.healthPoints === 0
        );

        if (deadAllies.length > 0) {
          await new Promise<void>((resolvePromise) => {
            rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, "1d6", async (result) => {
              const diceRoll = result && result.length > 0 ? result[0].value : 1;
              const revivePercent = diceRoll >= 4 ? 70 : 50;

              showToast(`Rolou ${diceRoll}! Revivendo aliados com ${revivePercent}% de HP!`);

              for (const ally of deadAllies) {
                const reviveHp = Math.floor(ally.maxHealthPoints * (revivePercent / 100));
                await APIBattle.updateCharacterHp(ally.battleID, reviveHp);
              }

              resolvePromise();
            });
          });
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

      // Dark Cleansing: Cleanses target and copies buffs to other allies
      if (resolved.metadata.cleansesAndCopiesBuffs && player.fightInfo?.characters) {
        const targetId = resolved.targetIds[0];
        const target = player.fightInfo.characters.find(c => c.battleID === targetId);

        if (target) {
          // Cleanse debuffs from target
          await APIBattle.cleanse(targetId);

          // Get all buffs from target (positive effects)
          const buffs = target.status?.filter(s => {
            const buffTypes = ["Empowered", "Protected", "Hastened", "Shield", "Regeneration", "Shell", "Twilight"];
            return buffTypes.includes(s.effectName);
          }) ?? [];

          if (buffs.length > 0) {
            // Get all other allies (excluding target)
            const otherAllies = player.fightInfo.characters.filter(
              c => !c.isEnemy && c.battleID !== targetId && c.healthPoints > 0
            );

            // Copy buffs to other allies
            for (const ally of otherAllies) {
              for (const buff of buffs) {
                // Special check: Twilight can only be copied to Sciel characters
                if (buff.effectName === "Twilight") {
                  const isSciel = ally.id.toLowerCase().includes("sciel");
                  if (!isSciel) {
                    continue; // Skip copying Twilight to non-Sciel characters
                  }
                }

                await APIBattle.addStatus({
                  battleCharacterId: ally.battleID,
                  effectType: buff.effectName as any,
                  ammount: buff.ammount ?? 0,
                  remainingTurns: buff.remainingTurns ?? null
                });
              }
            }

            showToast(`Buffs copiados para outros aliados!`);
          }
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

      // Last Chance: Set HP to 1 and refill MP to maximum
      if (resolved.metadata.setsHpTo !== undefined) {
        await APIBattle.updateCharacterHp(source.battleID, resolved.metadata.setsHpTo);
        showToast(`Vida reduzida para ${resolved.metadata.setsHpTo}!`);
      }

      if (resolved.metadata.refillsMP) {
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

      // Swift Stride: Grant random MP between min and max
      // NOTE: Mezzo Forte handles its own MP/MP, so skip this for skills with dice roll MP
      if (resolved.metadata.grantsMPRange && !resolved.metadata.grantsMPDiceRoll) {
        const { min, max } = resolved.metadata.grantsMPRange;
        const apGranted = Math.floor(Math.random() * (max - min + 1)) + min;
        // Calculate MP after skill cost was consumed by backend
        const mpAfterCost = (source.magicPoints ?? 0) - skillCost;
        const maxMp = source.maxMagicPoints ?? 0;
        const newMp = Math.min(mpAfterCost + apGranted, maxMp);
        await APIBattle.updateCharacterMp(source.battleID, newMp);
        if (apGranted > 0) {
          showToast(`+${apGranted} PM concedidos! (${mpAfterCost} → ${newMp})`);
        }
      }

      // Intervention: Grant MP and immediate turn to ally
      if ((resolved.metadata.grantsImmediateTurn || resolved.metadata.grantsMP) && player.fightInfo?.characters) {
        const targetId = resolved.targetIds[0];
        const target = player.fightInfo.characters.find(c => c.battleID === targetId);

        if (target) {
          // Grant MP to target
          if (resolved.metadata.grantsMP) {
            const currentMP = target.magicPoints ?? 0;
            const maxMP = target.maxMagicPoints ?? 10;
            const newMP = Math.min(currentMP + resolved.metadata.grantsMP, maxMP);
            await APIBattle.updateCharacterMp(targetId, newMP);
            showToast(`${target.name} recebeu ${resolved.metadata.grantsMP} PM! (${currentMP} → ${newMP})`);
          }

          // Grant immediate turn (reorder turns to put target next)
          if (resolved.metadata.grantsImmediateTurn && player.fightInfo.turns) {
            const turns = player.fightInfo.turns;

            // Find current turn index (should be 0 - the one that just played)
            const currentTurnIndex = 0;

            // Find target's next turn
            const targetTurnIndex = turns.findIndex((t, idx) =>
              idx > currentTurnIndex && t.battleCharacterId === targetId
            );

            if (targetTurnIndex > 0) {
              // Reorder: move target's turn to position 1 (right after current)
              const reorderedTurns = [...turns];
              const [targetTurn] = reorderedTurns.splice(targetTurnIndex, 1);
              reorderedTurns.splice(1, 0, targetTurn);

              // Send reordered turn IDs to backend
              const turnIds = reorderedTurns.map(t => t.id);
              await APIBattle.reorderTurns(turnIds);

              showToast(`${target.name} jogará imediatamente!`);
            }
          }
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

          // Trigger picto effects for heal (Verso self-heal from burn)
          if (player.fightInfo && player.fightInfo.battleId) {
            const allChars = player.fightInfo.characters ?? [];
            await triggerOnHealAlly(source, source, allChars, player.fightInfo.battleId, player.pictos, player.luminas, healAmount);
          }
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

      // Troubadour Trumpet: Apply random buffs to 1-3 random allies
      if (resolved.metadata.appliesRandomBuffs && player.fightInfo) {
        const wheelPattern = ["gold", "blue", "blue", "purple", "purple", "red", "red", "green", "green"];
        const bestialWheelPosition = source.bestialWheelPosition ?? -1;
        const currentMask = wheelPattern[bestialWheelPosition] ?? "";
        const isCasterOrAlmighty = currentMask === "blue" || currentMask === "gold";

        // Number of buffs to apply per ally (1 normally, 2 at Caster/Almighty)
        const buffsPerAlly = (resolved.metadata.doublesBuffsAtCasterMask && isCasterOrAlmighty) ? 2 : 1;

        // Number of allies to buff (1-3 random)
        const allyCount = resolved.metadata.randomAllyCount
          ? Math.floor(Math.random() * (resolved.metadata.randomAllyCount.max - resolved.metadata.randomAllyCount.min + 1)) + resolved.metadata.randomAllyCount.min
          : 1;

        // Get all allies
        const allAllies = (player.fightInfo.characters ?? []).filter(c => !c.isEnemy && c.healthPoints > 0);

        // Select random allies
        const shuffledAllies = [...allAllies].sort(() => Math.random() - 0.5);
        const selectedAllies = shuffledAllies.slice(0, Math.min(allyCount, allAllies.length));

        // Possible buffs
        const possibleBuffs: StatusType[] = ["Empowered", "Protected", "Shielded", "Regeneration", "Hastened"];

        // Apply buffs to each selected ally
        for (const ally of selectedAllies) {
          for (let i = 0; i < buffsPerAlly; i++) {
            const randomBuff = possibleBuffs[Math.floor(Math.random() * possibleBuffs.length)];
            const buffAmount = randomBuff === "Shielded" ? 1 : 0;
            const buffDuration = randomBuff === "Regeneration" || randomBuff === "Hastened" ? 3 : undefined;

            await APIBattle.addStatus({
              battleCharacterId: ally.battleID,
              effectType: randomBuff,
              ammount: buffAmount,
              remainingTurns: buffDuration
            });
          }
        }

        const buffText = buffsPerAlly === 2 ? "2 buffs aleatórios" : "1 buff aleatório";
        showToast(`Trombeta! ${buffText} aplicados em ${selectedAllies.length} aliado(s)!`);
      }

      // Stendhal: Remove self-Shields
      if (resolved.metadata.consumesShield) {
        const sourceStatuses = source.status ?? [];
        const shieldEffects = sourceStatuses.filter(s => s.effectName === "Shielded");

        if (shieldEffects.length > 0) {
          await APIBattle.removeStatus(source.battleID, "Shielded");
          showToast(`${shieldEffects.length} Escudo(s) removido(s)!`);
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
      setExcludeSelfFromTargeting(false);

    } catch (error) {
      console.error("Erro ao usar skill:", error);
      showToast("Erro ao usar habilidade");
      setPendingSkillId(null);
      setIsSelectingSkillTarget(false);
      setIsExecutingSkill(false);
      setExcludeSelfFromTargeting(false);
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

    return new Promise<void>(async (resolve, reject) => {
      const callDefend = async (payload: CreateDefenseRequest) => {
        try {
          await APIBattle.defend(payload);
          // Reload player data after API call
          const playerInfo = await APIPlayer.get(player.id, lastBattleLog);
          checkBattleLog(playerInfo);
          resolve();
        } catch (e) {
          showToast("Erro ao encerrar o defender");
          reject(e);
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
          // Reload player data after API call
          const playerInfo = await APIPlayer.get(player.id, lastBattleLog);
          checkBattleLog(playerInfo);
          resolve();
        } catch (e) {
          showToast("Erro ao encerrar o executar o counter");
          reject(e);
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

              // Trigger picto effects on successful dodge
              if (playerChar && player.fightInfo?.battleId) {
                const attacker = player.fightInfo?.characters?.find(c => c.battleID === attack.sourceBattleId);
                await triggerOnDodge(
                  playerChar,
                  attacker,
                  player.fightInfo.characters ?? [],
                  player.fightInfo.battleId,
                  player.pictos,
                  player.luminas
                );
              }
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
            defenseType: defense,
          };

          await callDefend(payload);

          showToast(description);
          setIsExecutingSkill(false);
        } catch (e) {
          showToast("Falha ao registrar a defesa");
          setIsExecutingSkill(false);
          reject(e);
        }
      };

      const takeTheDamage = () => {
        executeDefense(null);
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
        takeTheDamage();
      }
    });
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
