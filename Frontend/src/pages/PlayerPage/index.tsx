import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useLocation, matchPath, useParams } from "react-router-dom";
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

  // Set HP to max when setup completes
  const prevSetupComplete = useRef(false);
  useEffect(() => {
    if (setupComplete && !prevSetupComplete.current && player) {
      const maxHp = calculateMaxHP(player, weaponInfo);
      if (player.playerSheet?.hpCurrent !== maxHp) {
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
      <FloatingDiceRoller
        diceBoardRef={diceBoardRef}
        timeoutDiceBoardRef={timeoutDiceBoardRef}
        playerId={player?.id}
        className={
          tab === "combate"
            ? (!player?.fightInfo || player?.fightInfo?.battleStatus === "finished")
              ? "bottom-16 right-4"
              : combatBottomSheetOpen ? "bottom-16 right-4" : "bottom-28 right-4"
            : tab === "habilidades" ? "bottom-24 right-4"
            : "bottom-4 right-4"
        }
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
          isInventoryActiveInCombat={isInventoryActiveInCombat}
          onReviveRequested={handleReviveRequested}
          onPotionUsed={handlePotionUsed}
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
