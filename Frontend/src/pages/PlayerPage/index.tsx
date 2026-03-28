import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useLocation, matchPath, useParams } from "react-router-dom";
import { GiCrossedSwords } from "react-icons/gi";
import { t } from "../../i18n";

// Components
import DiceBoard from "../../components/DiceBoard";
import PanelModal from "../../components/PanelModal";
import MasterEditingOverlay from "../../components/MasterEditingOverlay";
import { PlayerNavbar, PlayerContent } from "../../components/player";
import { RollHistoryToast } from "../../components/RollHistoryToast";
import { FloatingDiceRoller } from "../../components/FloatingDiceRoller";

// Hooks
import { useToast } from "../../components/Toast";
import {
  useDiceBoard,
  useModalManager,
  useTabNavigation,
  useWeaponInfo,
  usePlayerData,
  usePlayerPolling,
  useCombatActions,
  useNavigationActions,
  useReviveActions,
} from "../../hooks/player";

// Utils
import { APIPlayer } from "../../api/APIPlayer";
import type { BattleCharacterInfo } from "../../api/ResponseModel";
import type { PlayerTab } from "./PlayerPage.types";
import type { AbilityTestRequestEvent } from "../../utils/SpecialAttackDisplayUtils";
import { calculateMaxHP } from "../../utils/PlayerCalculator";
import { rollWithTimeout } from "../../utils/RollUtils";
import { diceTotal } from "../../utils/DiceCalculator";
import { dispatchRoll } from "../../utils/rollDispatcher";

export default function PlayerPage() {
  const { pathname } = useLocation();
  const { campaign, character } = useParams<{ campaign: string; character: string }>();
  const { showToast } = useToast();

  const isAdmin = !!matchPath(
    { path: "/campaign-player-admin/:campaign/:character", end: true },
    pathname
  );

  // Combat bottom sheet state (for floating dice roller positioning)
  const [combatBottomSheetOpen, setCombatBottomSheetOpen] = useState(false);

  // Dice board management
  const { diceBoardRef, timeoutDiceBoardRef, clearDiceTimeout } = useDiceBoard();

  // Modal management
  const { modalOpen, modalTitle, modalBody, openModal, closeModal, setModalBody, setModalOpen, setModalTitle } = useModalManager(clearDiceTimeout);

  // Tab navigation
  const {
    tab, setTab,
    combatTab, setCombatTab,
    specialAttacksInitialTab, setSpecialAttacksInitialTab,
    isUsingSpecialAttackMode, setIsUsingSpecialAttackMode,
    isInventoryActiveInCombat, setIsInventoryActiveInCombat,
    isReviveMode, setIsReviveMode,
    revivePercent, setRevivePercent
  } = useTabNavigation();

  // Player data
  const {
    player, setPlayer,
    campaignInfo,
    loading, error,
    lastBattleLog, setLastBattleLog
  } = usePlayerData({ campaign, character });

  // Setup progress
  const setupComplete = useMemo(() => {
    const abilityScoresDone = player?.setupProgress?.find(s => s.section === "abilityScores")?.done ?? false;
    const skillProficiencyDone = player?.setupProgress?.find(s => s.section === "skillProficiency")?.done ?? false;
    return abilityScoresDone && skillProficiencyDone;
  }, [player?.setupProgress]);

  // Weapon info
  const { weaponInfo, weaponList } = useWeaponInfo(player);

  // Set HP to max when setup completes for the first time (hpMax still at default 0)
  const prevSetupComplete = useRef(false);
  useEffect(() => {
    if (setupComplete && !prevSetupComplete.current && player) {
      const maxHp = calculateMaxHP(player, weaponInfo);
      if ((player.playerSheet?.hpMax ?? 0) === 0) {
        APIPlayer.update(player.id, {
          playerSheet: { ...player.playerSheet, hpCurrent: maxHp, hpMax: maxHp },
        });
        setPlayer(prev => prev ? {
          ...prev,
          playerSheet: { ...prev.playerSheet, hpCurrent: maxHp, hpMax: maxHp },
        } : prev);
      }
    }
    prevSetupComplete.current = setupComplete;
  }, [setupComplete]);

  // Player polling
  const { checkPlayerLoop, wasMasterEditing } = usePlayerPolling({
    player,
    setPlayer,
    lastBattleLog,
    setLastBattleLog,
    showToast
  });

  // Skill execution state
  const [isExecutingSkill, setIsExecutingSkill] = useState(false);
  const [initiativeClicked, setInitiativeClicked] = useState(false);
  useEffect(() => { setInitiativeClicked(false); }, [player?.fightInfo?.battleId]);

  // Active skill card (shown in combat after selecting from picker)
  const [activeSkillId, setActiveSkillId] = useState<string | null>(null);

  // Combat actions
  const {
    rollInitiative,
    joinBattle,
    endTurn,
    attemptFlee,
    handleCombatMenuAction,
  } = useCombatActions({
    player,
    setPlayer,
    weaponInfo,
    diceBoardRef,
    timeoutDiceBoardRef,
    showToast,
    openModal,
    closeModal,
    setIsExecutingSkill,
    setTab,
    setCombatTab,
    setSpecialAttacksInitialTab,
    setIsUsingSpecialAttackMode,
    setIsInventoryActiveInCombat,
    checkPlayerLoop
  });

  // Navigation actions
  const { handleNavigateBackToAdmin } = useNavigationActions({
    player,
    campaignInfo,
    campaign,
    isAdmin
  });

  // Revive actions
  const { handleReviveRequested, handleReviveTarget } = useReviveActions({
    player,
    setPlayer,
    weaponInfo,
    revivePercent,
    setRevivePercent,
    setIsReviveMode,
    setTab,
    setCombatTab,
    showToast
  });

  // Wrap setTab so "habilidades" auto-enters picker mode when it's the player's turn
  const setTabWithSkillMode = useCallback((newTab: PlayerTab) => {
    if (newTab === "habilidades" && player?.fightInfo) {
      const firstTurn = player.fightInfo.turns?.[0];
      const isYourTurn = firstTurn?.battleCharacterId === player.fightInfo.playerBattleID;
      if (isYourTurn) {
        setSpecialAttacksInitialTab("picker");
        setIsUsingSpecialAttackMode(true);
      }
    }
    setTab(newTab);
  }, [setTab, setSpecialAttacksInitialTab, setIsUsingSpecialAttackMode, player]);

  const handlePotionUsed = useCallback(() => {
    setTab("combate");
  }, [setTab]);

  const handleUseSpecialAttack = useCallback((skillId: string) => {
    setActiveSkillId(skillId);
    setTab("combate");
    setIsUsingSpecialAttackMode(false);
  }, [setTab, setIsUsingSpecialAttackMode]);

  const handleDismissSkillCard = useCallback(() => {
    setActiveSkillId(null);
  }, []);

  // Target selection handler
  const handleSelectTarget = useCallback((target: BattleCharacterInfo) => {
    if (player == null) return;

    if (isReviveMode) {
      handleReviveTarget(target);
      return;
    }
  }, [player, isReviveMode, handleReviveTarget]);

  // Modal close handler
  const handleModalClose = useCallback(() => {
    clearDiceTimeout();
    closeModal();
  }, [clearDiceTimeout, closeModal]);

  // Ability test roll listener (triggered from skill description badges)
  useEffect(() => {
    function handleAbilityTest(e: Event) {
      const { dc, modifier, label } = (e as CustomEvent<AbilityTestRequestEvent>).detail;
      const diceCommand = modifier === 0 ? "1d20" : modifier > 0 ? `1d20+${modifier}` : `1d20${modifier}`;
      rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, "1d20", (result) => {
        const roll = diceTotal(result);
        const total = roll + modifier;
        dispatchRoll({ label, diceRolled: roll, modifier, total, diceCommand });
      });
    }
    window.addEventListener("ability-test-request", handleAbilityTest);
    return () => window.removeEventListener("ability-test-request", handleAbilityTest);
  }, [diceBoardRef, timeoutDiceBoardRef]);

  return (
    <div className="min-h-dvh bg-base-200">
      <DiceBoard ref={diceBoardRef} />
      <RollHistoryToast />
      {tab === "combate" && (player?.fightInfo?.battleStatus == "starting" || player?.fightInfo?.battleStatus == "started") && !isExecutingSkill && player?.fightInfo?.canRollInitiative && !initiativeClicked && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <button
            className="bg-primary text-primary-content rounded-full w-32 h-32 flex flex-col items-center justify-center gap-1 shadow-lg cursor-pointer animate-pulse-scale"
            onClick={() => { setInitiativeClicked(true); player?.fightInfo?.battleStatus == "started" ? joinBattle() : rollInitiative(); }}
          >
            {player?.fightInfo?.battleStatus === "started"
              ? <GiCrossedSwords className="w-8 h-8" />
              : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-8 h-8 fill-current" aria-hidden="true"><path d="M217.5 56.4L77.9 140.2l61.4 44.7L217.5 56.4zM64 169.6V320.3l59.2-107.6L64 169.6zM104.8 388L240 469.1V398.8L104.8 388zM272 469.1L407.2 388 272 398.8v70.3zM448 320.3V169.6l-59.2 43L448 320.3zM434.1 140.2L294.5 56.4l78.2 128.4 61.4-44.7zM243.7 3.4c7.6-4.6 17.1-4.6 24.7 0l200 120c7.2 4.3 11.7 12.1 11.7 20.6V368c0 8.4-4.4 16.2-11.7 20.6l-200 120c-7.6 4.6-17.1 4.6-24.7 0l-200-120C36.4 384.2 32 376.4 32 368V144c0-8.4 4.4-16.2 11.7-20.6l200-120zM225.3 365.5L145 239.4 81.9 354l143.3 11.5zM338.9 224H173.1L256 354.2 338.9 224zM256 54.8L172.5 192H339.5L256 54.8zm30.7 310.7L430.1 354 367 239.4 286.7 365.5z"/></svg>
            }
            <span className="text-xs font-bold leading-tight text-center">{player?.fightInfo?.battleStatus == "started" ? t("combat.joinBattle") : t("combat.rollInitiative")}</span>
          </button>
        </div>
      )}

      <FloatingDiceRoller
        diceBoardRef={diceBoardRef}
        timeoutDiceBoardRef={timeoutDiceBoardRef}
        playerId={player?.id}
        className={(() => {
          const isPlayerTurn = player?.fightInfo?.turns?.[0]?.battleCharacterId === player?.fightInfo?.playerBattleID;
          if (tab === "combate") {
            if (!player?.fightInfo || player?.fightInfo?.battleStatus === "finished") return "bottom-16 right-4";
            if (combatBottomSheetOpen) return "bottom-8 right-4";
            return isPlayerTurn ? "bottom-28 right-4" : "bottom-14 right-4";
          }
          if (tab === "habilidades") return "bottom-24 right-4";
          if (tab === "inventario" && player?.fightInfo?.battleStatus !== "finished" && player?.fightInfo) return "bottom-24 right-4";
          return "bottom-4 right-4";
        })()}
      />

      {!isAdmin && player?.isMasterEditing && (
        <MasterEditingOverlay />
      )}

      <PanelModal
        open={modalOpen}
        onClose={handleModalClose}
        title={modalTitle}
        size="md"
        showClose={false}
      >
        {modalBody}
      </PanelModal>

      <PlayerNavbar
        onNavigateBack={handleNavigateBackToAdmin}
        isExecutingSkill={isExecutingSkill}
        tab={tab}
        setTab={setTabWithSkillMode}
        setupComplete={setupComplete}
      />

      <main className="p-4 max-w-md mx-auto pb-24">
        {loading && (
          <div className="text-center opacity-70 py-16">
            {t("common.loading")}
          </div>
        )}

        {error && !loading && (
          <div className="text-center text-error py-16">{error}</div>
        )}

        <PlayerContent
          tab={tab}
          setTab={setTab}
          loading={loading}
          error={error}
          player={player}
          setPlayer={setPlayer}
          campaignInfo={campaignInfo}
          weaponInfo={weaponInfo}
          weaponList={weaponList}
          isAdmin={isAdmin}
          onMenuAction={handleCombatMenuAction}
          onSelectTarget={handleSelectTarget}
          isReviveMode={isReviveMode}
          isSelectingSpecialAttackTarget={false}
          pendingSpecialAttackId={null}
          combatTab={combatTab}
          setCombatTab={setCombatTab}
          isExecutingSkill={isExecutingSkill}
          excludeSelfFromTargeting={false}
          hitCharacters={new Set()}
          specialAttacksInitialTab={specialAttacksInitialTab}
          isUsingSpecialAttackMode={isUsingSpecialAttackMode}
          onUseSpecialAttack={handleUseSpecialAttack}
          activeSkillId={activeSkillId}
          onDismissSkillCard={handleDismissSkillCard}
          diceBoardRef={diceBoardRef}
          timeoutDiceBoardRef={timeoutDiceBoardRef}
          onBottomSheetChange={setCombatBottomSheetOpen}
        />
      </main>

    </div>
  );
}
