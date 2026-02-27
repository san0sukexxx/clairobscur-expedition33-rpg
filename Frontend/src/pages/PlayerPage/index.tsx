import { useState, useCallback } from "react";
import { useLocation, matchPath, useParams } from "react-router-dom";
import { t } from "../../i18n";

// Components
import DiceBoard from "../../components/DiceBoard";
import PanelModal from "../../components/PanelModal";
import MasterEditingOverlay from "../../components/MasterEditingOverlay";
import { PlayerNavbar, PlayerContent } from "../../components/player";

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
import type { BattleCharacterInfo } from "../../api/ResponseModel";

export default function PlayerPage() {
  const { pathname } = useLocation();
  const { campaign, character } = useParams<{ campaign: string; character: string }>();
  const { showToast } = useToast();

  const isAdmin = !!matchPath(
    { path: "/campaign-player-admin/:campaign/:character", end: true },
    pathname
  );

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

  // Weapon info
  const { weaponInfo, weaponList } = useWeaponInfo(player);

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

  const handlePotionUsed = useCallback(() => {
    setTab("combate");
  }, [setTab]);

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

  return (
    <div className="min-h-dvh bg-base-200">
      <DiceBoard ref={diceBoardRef} />

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
        setTab={setTab}
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
          onUseSpecialAttack={() => {}}
          diceBoardRef={diceBoardRef}
          timeoutDiceBoardRef={timeoutDiceBoardRef}
        />
      </main>

    </div>
  );
}
