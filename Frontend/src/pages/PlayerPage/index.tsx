import { useState, useCallback, useRef, type Dispatch, type SetStateAction } from "react";
import { useLocation, matchPath, useParams, useNavigate } from "react-router-dom";
import { t } from "../../i18n";

// Components
import DiceBoard from "../../components/DiceBoard";
import PanelModal from "../../components/PanelModal";
import MasterEditingOverlay from "../../components/MasterEditingOverlay";
import PendingAttacksModal from "../../components/PendingAttacksModal";
import PendingStatusModal from "../../components/PendingStatusModal";
import { PlayerNavbar, PlayerTabBar, PlayerContent } from "../../components/player";

// Hooks
import { useToast } from "../../components/Toast";
import {
  useDiceBoard,
  useModalManager,
  useTabNavigation,
  useWeaponInfo,
  usePlayerData,
  usePlayerPolling,
  useDefenseActions,
  useCombatActions
} from "../../hooks/player";

// Utils
import { APIPlayer } from "../../api/APIPlayer";
import { APIBattle, type CreateAttackRequest } from "../../api/APIBattle";
import { APIItem } from "../../api/APIItem";
import type { AttackType, BattleCharacterInfo } from "../../api/ResponseModel";
import { SkillEffectsRegistry } from "../../data/SkillEffectsRegistry";
import { rollWithTimeout } from "../../utils/RollUtils";
import {
  rollCommandForAttack,
  calculatePlayerCriticalBonus,
  calculateRawWeaponPower,
  calculateMaxHP,
  calculateMaxMP
} from "../../utils/PlayerCalculator";
import { diceTotal, countCriticalRolls } from "../../utils/DiceCalculator";
import { isVerso } from "../../constants/player/characterIds";

// Skill Execution (simplified inline for correct integration)
import { getEnrichedCharacterSkills } from "../../utils/SkillUtils";
import { resolveSkill, calculateSkillHitDamage, getStatusEffectsForTarget } from "../../utils/BattleSkillUtils";
import { executeAllSpecialMechanics } from "../../utils/SkillSpecialMechanics";
import { calculateNpcAttackReceivedDamage, checkForFragile } from "../../utils/NpcCalculator";

export default function PlayerPage() {
  const navigate = useNavigate();
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
    skillsInitialTab, setSkillsInitialTab,
    isUsingSkillMode, setIsUsingSkillMode,
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

  // Combat state
  const [attackType, setAttackType] = useState<AttackType>("basic");
  const [hitCharacters, setHitCharacters] = useState<Set<number>>(new Set());
  const [lampmasterStacks, setLampmasterStacks] = useState(0);

  // Skill execution state
  const [isExecutingSkill, setIsExecutingSkill] = useState(false);
  const [isExecutingMezzoForte, setIsExecutingMezzoForte] = useState(false);
  const [pendingSkillId, setPendingSkillId] = useState<string | null>(null);
  const [isSelectingSkillTarget, setIsSelectingSkillTarget] = useState(false);
  const [excludeSelfFromTargeting, setExcludeSelfFromTargeting] = useState(false);
  const isExecutingSkillRef = useRef(false);

  // Defense actions
  const { handleSelectDefense, onResolveStatus } = useDefenseActions({
    player,
    setPlayer,
    weaponInfo,
    weaponList,
    diceBoardRef,
    timeoutDiceBoardRef,
    showToast,
    lastBattleLog,
    setLastBattleLog,
    setIsExecutingSkill,
    setHitCharacters
  });

  // Combat actions
  const {
    rollInitiative,
    joinBattle,
    endTurn,
    attemptFlee,
    handleCombatMenuAction,
    handleSelectAttackTarget
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
    setSkillsInitialTab,
    setIsUsingSkillMode,
    setIsInventoryActiveInCombat,
    attackType,
    setAttackType,
    setPendingSkillId,
    setIsSelectingSkillTarget,
    setExcludeSelfFromTargeting,
    setHitCharacters,
    checkPlayerLoop
  });

  // Navigation handlers
  const handleNavigateBackToAdmin = useCallback(async () => {
    if (player == undefined || campaignInfo == undefined) return;

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
  }, [player, campaignInfo, isAdmin, navigate, campaign, error]);

  // Revive handlers
  const handleReviveRequested = useCallback((percent: number) => {
    setRevivePercent(percent);
    const currentCharacter = player?.fightInfo?.characters?.find(
      c => c.battleID === player.fightInfo?.playerBattleID
    );
    const teamTab = currentCharacter?.isEnemy ? "enemies" : "team";
    setCombatTab(teamTab as "enemies" | "team");
    setTab("combate");
    setIsReviveMode(true);
  }, [player, setCombatTab, setTab, setIsReviveMode, setRevivePercent]);

  const handleReviveTarget = useCallback(async (target: BattleCharacterInfo) => {
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
      showToast(t("playerPage.revive.success", { name: target.name, percent: revivePercent }));
    } catch (e) {
      console.error("Erro ao reviver:", e);
      showToast(t("playerPage.errors.errorReviving"));
    }
  }, [player, weaponInfo, revivePercent, setPlayer, setIsReviveMode, showToast]);

  const handlePotionUsed = useCallback(() => {
    setTab("combate");
  }, [setTab]);

  // Use Skill handler
  const handleUseSkill = useCallback((skillId: string) => {
    const skillMetadata = SkillEffectsRegistry[skillId];
    if (!skillMetadata) {
      showToast(t("playerPage.errors.errorSkillNotFound"));
      return;
    }

    const currentCharacter = player?.fightInfo?.characters?.find(
      c => c.battleID === player.fightInfo?.playerBattleID
    );

    // Auto-execute self-targeted skills
    if (skillMetadata.targetScope === "self" && skillMetadata.damageLevel === "none") {
      setPendingSkillId(skillId);
      setTab("combate");
      setIsUsingSkillMode(false);
      if (currentCharacter) {
        handleExecuteSkill(skillId, currentCharacter);
      }
      return;
    }

    // Store skill and switch to combat for target selection
    setPendingSkillId(skillId);
    setTab("combate");
    setIsUsingSkillMode(false);
    setExcludeSelfFromTargeting(skillMetadata.targetScope === "ally" && !skillMetadata.canTargetSelf);

    const targetsEnemies = skillMetadata.damageLevel !== "none";
    if (targetsEnemies) {
      setCombatTab(currentCharacter?.isEnemy ? "team" : "enemies");
    } else {
      setCombatTab(currentCharacter?.isEnemy ? "enemies" : "team");
    }

    setIsSelectingSkillTarget(true);
  }, [player, showToast, setTab, setCombatTab, setIsUsingSkillMode]);

  // Execute Skill (simplified)
  const handleExecuteSkill = useCallback(async (skillId: string, target: BattleCharacterInfo) => {
    if (!player?.fightInfo) return;
    if (isExecutingSkillRef.current) return;
    isExecutingSkillRef.current = true;

    try {
      const source = player.fightInfo?.characters?.find(
        c => c.battleID === player.fightInfo?.playerBattleID
      );

      if (!source) {
        showToast(t("playerPage.errors.errorCharacterNotFoundInBattle"));
        isExecutingSkillRef.current = false;
        return;
      }

      const skillMetadata = SkillEffectsRegistry[skillId];
      if (!skillMetadata) {
        showToast(t("playerPage.errors.errorSkillNotFound"));
        isExecutingSkillRef.current = false;
        return;
      }

      const enrichedSkills = getEnrichedCharacterSkills(player);
      const fullSkill = enrichedSkills.find(s => s.id === skillId);
      let skillCost = fullSkill?.cost ?? 0;
      const isGradientSkill = fullSkill?.isGradient ?? false;

      // Validate MP
      if (!isGradientSkill) {
        const currentMp = source.magicPoints ?? 0;
        if (currentMp < skillCost) {
          showToast(t("playerPage.skills.insufficientMP", { required: skillCost, available: currentMp }));
          setPendingSkillId(null);
          setIsSelectingSkillTarget(false);
          setExcludeSelfFromTargeting(false);
          isExecutingSkillRef.current = false;
          return;
        }
      }

      let resolved = resolveSkill(skillId, source, target, player.fightInfo?.characters ?? []);
      let actualHitCount = resolved.hitCount;

      // Track dice results for perfection calculation
      const allDiceResults: any[][] = [];

      if (actualHitCount > 0) {
        setIsExecutingSkill(true);
        let hitIndex = 0;

        while (hitIndex < actualHitCount) {
          await new Promise<void>((resolvePromise) => {
            rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, rollCommandForAttack(weaponInfo, "basic"), async (result) => {
              allDiceResults.push(result);
              const total = diceTotal(result);
              const critBonus = calculatePlayerCriticalBonus(result, player, weaponInfo);
              let playerPower = (player?.playerSheet?.power ?? 0) + critBonus;
              const weaponPower = calculateRawWeaponPower(weaponInfo, "basic");
              const basePower = playerPower + weaponPower + total;
              const diceRoll = result.flatMap((group: any) => group.rolls?.map((r: any) => r.value) ?? []);
              const hitDamage = calculateSkillHitDamage(resolved, basePower, diceRoll);

              // Calculate charge increase (base 1 + extra on crit if skill has extraChargePerHit)
              let chargeIncrease: number | undefined = undefined;
              if (resolved.metadata.extraChargePerHit !== undefined) {
                const hasCritical = countCriticalRolls(result) > 0;
                chargeIncrease = hasCritical ? 1 + resolved.metadata.extraChargePerHit : 1;
              }

              showToast(t("playerPage.battle.attackDamage", { index: hitIndex + 1, damage: hitDamage }));

              for (const targetId of resolved.targetIds) {
                const targetChar = (player.fightInfo?.characters ?? []).find(c => c.battleID === targetId);
                const isNpcTarget = targetChar?.type === "npc";
                const effects = [...getStatusEffectsForTarget(resolved.effects, targetId)];

                let attackRequest: CreateAttackRequest;
                if (isNpcTarget && targetChar) {
                  // Calculate NPC defense and final damage
                  const finalDamage = calculateNpcAttackReceivedDamage(targetChar, hitDamage);

                  // Check if attack will cause Fragile
                  const willGetFragile = checkForFragile(targetChar, hitDamage);
                  if (willGetFragile) {
                    effects.push({
                      effectType: "Fragile",
                      ammount: 1,
                      remainingTurns: 2
                    });
                  }

                  attackRequest = {
                    sourceBattleId: source.battleID,
                    targetBattleId: targetId,
                    totalDamage: finalDamage,
                    attackType: "skill",
                    effects: effects,
                    skillCost: hitIndex === 0 ? skillCost : 0,
                    isGradient: hitIndex === 0 && isGradientSkill,
                    isLastHit: hitIndex === actualHitCount - 1,
                    chargeIncrease: chargeIncrease
                  };
                } else {
                  attackRequest = {
                    sourceBattleId: source.battleID,
                    targetBattleId: targetId,
                    totalPower: hitDamage,
                    attackType: "skill",
                    effects: effects,
                    skillCost: hitIndex === 0 ? skillCost : 0,
                    isGradient: hitIndex === 0 && isGradientSkill,
                    isLastHit: hitIndex === actualHitCount - 1,
                    chargeIncrease: chargeIncrease
                  };
                }

                await APIBattle.attack(attackRequest);

                setHitCharacters(prev => new Set(prev).add(targetId));
                setTimeout(() => {
                  setHitCharacters(prev => {
                    const next = new Set(prev);
                    next.delete(targetId);
                    return next;
                  });
                }, 600);
              }

              hitIndex++;
              resolvePromise();
            });
          });
        }
      } else {
        // Utility skill - just consume MP
        if (skillCost > 0 && !isGradientSkill) {
          const currentMp = source.magicPoints ?? 0;
          await APIBattle.updateCharacterMp(source.battleID, currentMp - skillCost);
        }

        // Apply status effects
        for (const targetId of resolved.targetIds) {
          const effects = getStatusEffectsForTarget(resolved.effects, targetId);
          for (const effect of effects) {
            await APIBattle.addStatus({
              battleCharacterId: targetId,
              effectType: effect.effectType,
              ammount: effect.ammount ?? 0,
              remainingTurns: effect.remainingTurns ?? 0,
              sourceCharacterId: source.battleID
            });
          }
        }
      }

      setPendingSkillId(null);
      setIsSelectingSkillTarget(false);
      setIsExecutingSkill(false);
      isExecutingSkillRef.current = false;
      setExcludeSelfFromTargeting(false);

    } catch (error) {
      console.error("Erro ao usar skill:", error);
      showToast(t("playerPage.errors.errorUsingSkill"));
      setPendingSkillId(null);
      setIsSelectingSkillTarget(false);
      setIsExecutingSkill(false);
      isExecutingSkillRef.current = false;
      setExcludeSelfFromTargeting(false);
    }
  }, [player, weaponInfo, diceBoardRef, timeoutDiceBoardRef, showToast, checkPlayerLoop]);

  // Target selection handler
  const handleSelectTarget = useCallback((target: BattleCharacterInfo) => {
    if (player == null) return;

    if (isReviveMode) {
      handleReviveTarget(target);
      return;
    }

    if (pendingSkillId) {
      setIsExecutingSkill(true);
      handleExecuteSkill(pendingSkillId, target);
      return;
    }

    handleSelectAttackTarget(target);
  }, [player, isReviveMode, pendingSkillId, handleReviveTarget, handleExecuteSkill, handleSelectAttackTarget]);

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

      <PlayerNavbar
        onNavigateBack={handleNavigateBackToAdmin}
        isExecutingSkill={isExecutingSkill}
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
          isSelectingSkillTarget={isSelectingSkillTarget}
          pendingSkillId={pendingSkillId}
          combatTab={combatTab}
          setCombatTab={setCombatTab}
          isExecutingSkill={isExecutingSkill}
          excludeSelfFromTargeting={excludeSelfFromTargeting}
          hitCharacters={hitCharacters}
          isInventoryActiveInCombat={isInventoryActiveInCombat}
          onReviveRequested={handleReviveRequested}
          onPotionUsed={handlePotionUsed}
          skillsInitialTab={skillsInitialTab}
          isUsingSkillMode={isUsingSkillMode}
          onUseSkill={handleUseSkill}
        />
      </main>

      <PlayerTabBar
        tab={tab}
        setTab={setTab}
        isExecutingSkill={isExecutingSkill}
      />
    </div>
  );
}
