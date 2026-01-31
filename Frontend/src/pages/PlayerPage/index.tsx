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
  useDefenseActions
} from "../../hooks/player";

// Utils
import { APIPlayer } from "../../api/APIPlayer";
import { APIBattle, type CreateAttackRequest } from "../../api/APIBattle";
import { APIItem } from "../../api/APIItem";
import type { AttackType, BattleCharacterInfo } from "../../api/ResponseModel";
import { COMBAT_MENU_ACTIONS, type CombatMenuAction } from "../../utils/CombatMenuActions";
import { SkillEffectsRegistry } from "../../data/SkillEffectsRegistry";
import { FaCheckCircle, FaSkull, FaDivide } from "react-icons/fa";
import { rollWithTimeout } from "../../utils/RollUtils";
import {
  rollCommandForInitiative,
  rollCommandForAttack,
  initiativeTotal,
  calculateAttackDamage,
  playerPictosTotalSpeed,
  calculatePlayerCriticalMulti,
  calculateRawWeaponPower,
  calculateMaxHP,
  calculateMaxMP
} from "../../utils/PlayerCalculator";
import {
  calculateFailureDiv,
  diceTotal,
  countCriticalRolls,
  countFailuresRolls
} from "../../utils/DiceCalculator";
import { calculateNpcAttackReceivedDamage, checkForFragile, npcIsFlying } from "../../utils/NpcCalculator";
import { triggerOnBattleStart, triggerOnKill } from "../../utils/PictoEffectsIntegration";
import { executeWeaponPassives } from "../../utils/WeaponPassives_Index";
import { isVerso } from "../../constants/player/characterIds";

// Skill Execution (simplified inline for correct integration)
import { getEnrichedCharacterSkills } from "../../utils/SkillUtils";
import { resolveSkill, calculateSkillHitDamage, getStatusEffectsForTarget } from "../../utils/BattleSkillUtils";
import { executeAllSpecialMechanics } from "../../utils/SkillSpecialMechanics";

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

  // Initiative roll
  const rollInitiative = useCallback(() => {
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
    rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, rollCommandForInitiative(weaponInfo), async (result) => {
      const criticalRolls = countCriticalRolls(result);
      const criticalMulti = calculatePlayerCriticalMulti(result, player);
      const rollTotal = diceTotal(result);
      const total = initiativeTotal(player, result);
      const failures = countFailuresRolls(result);
      const failuresDiv = calculateFailureDiv(result);

      openModal(
        t("playerPage.modals.rollResult"),
        <div className="space-y-2">
          <p>{t("playerPage.initiative.roll")}: {rollTotal}</p>
          {criticalRolls > 0 && (
            <h3 className="flex items-center gap-2 text-green-600 font-bold text-lg">
              <FaCheckCircle className="w-6 h-6" />
              {t("playerPage.initiative.criticals")}: <b>{criticalRolls}</b>
            </h3>
          )}
          {failures > 0 && (
            <h3 className="flex items-center gap-2 text-red-600 font-bold text-lg">
              <FaSkull className="w-6 h-6" />
              {t("playerPage.initiative.criticalFailures")}: <b>{failures}</b>
            </h3>
          )}
          <p>
            {t("playerPage.initiative.ability")}: <b>{player.playerSheet?.hability ?? 0}</b>
            {criticalRolls > 0 && <b> (x{criticalMulti})</b>}
            {failures > 0 && (
              <span className="inline-flex items-center gap-1 font-bold ml-2">
                (<FaDivide className="w-4 h-4" /> {failuresDiv} )
              </span>
            )}
          </p>
          <p>{t("playerPage.initiative.pictoBonus")}: <b>{playerPictosTotalSpeed(player)}</b></p>
          <h1 className="text-2xl font-bold">{t("playerPage.initiative.total")}: {total}</h1>
        </div>
      );

      try {
        const savedInitiative = await APIBattle.addInitiative({
          battleCharacterId: player.fightInfo?.playerBattleID ?? 0,
          value: total,
          hability: player.playerSheet?.hability ?? 0,
          playFirst: criticalRolls > 0,
        });

        setPlayer((prev) => {
          if (!prev || !prev.fightInfo) return prev;
          const fi = prev.fightInfo;
          const current = fi.initiatives ?? [];
          return {
            ...prev,
            fightInfo: {
              ...fi,
              initiatives: [...current, savedInitiative],
            },
          };
        });

        if (player.fightInfo) {
          const sourceChar = player.fightInfo.characters?.find(c => c.battleID === player.fightInfo?.playerBattleID);
          const allChars = player.fightInfo.characters ?? [];
          if (sourceChar && player.fightInfo.battleId) {
            await triggerOnBattleStart(sourceChar, allChars, player.fightInfo.battleId, player.pictos, player.luminas);
            if (weaponInfo.details?.name && weaponInfo.weapon?.level) {
              await executeWeaponPassives(
                "on-battle-start", sourceChar, allChars, player.fightInfo.battleId,
                weaponInfo.details.name, weaponInfo.weapon.level
              );
            }
          }
        }
      } catch (err) {
        showToast(t("playerPage.errors.errorRegisteringInitiative"));
      }
      setIsExecutingSkill(false);
    });
  }, [player, setPlayer, weaponInfo, diceBoardRef, timeoutDiceBoardRef, showToast, openModal]);

  // Join battle
  const joinBattle = useCallback(() => {
    if (!player) return;
    if (player.fightInfo) {
      setPlayer({
        ...player,
        fightInfo: { ...player.fightInfo, canRollInitiative: false }
      });
    }

    const joinBattleCall = async () => {
      try {
        await APIBattle.joinBattle({ battleCharacterId: player.fightInfo?.playerBattleID ?? 0 });
        showToast(t("playerPage.battle.joinedBattle"));
      } catch (e) {
        showToast(t("playerPage.errors.errorSavingPlayer"));
      }
    };
    joinBattleCall();
  }, [player, setPlayer, showToast]);

  // End turn
  const endTurn = useCallback(() => {
    if (!player) return;
    const endTurnCall = async () => {
      try {
        await APIBattle.endTurn(player.fightInfo?.playerBattleID ?? 0);
      } catch (e) {
        showToast(t("playerPage.errors.errorEndingTurn"));
      }
    };
    endTurnCall();
  }, [player, showToast]);

  // Flee
  const attemptFlee = useCallback(() => {
    openModal(
      t("playerPage.flee.title"),
      <div className="space-y-4">
        <p>{t("playerPage.flee.confirmation")}</p>
        <p className="text-sm text-gray-500">{t("playerPage.flee.warning")}</p>
        <div className="flex gap-2 justify-end">
          <button className="btn btn-ghost" onClick={handleModalClose}>
            {t("playerPage.flee.cancel")}
          </button>
          <button className="btn btn-primary" onClick={confirmFlee}>
            {t("playerPage.flee.confirm")}
          </button>
        </div>
      </div>
    );
  }, [openModal]);

  const confirmFlee = useCallback(async () => {
    if (!player?.fightInfo) return;
    try {
      const playerId = player.id;
      const playerBattleId = player.fightInfo?.playerBattleID;
      if (!playerBattleId) return;
      showToast(t("playerPage.battle.attemptingFlee"));
      await APIBattle.flee(playerId, playerBattleId);
      await APIBattle.endTurn(playerBattleId);
      handleModalClose();
    } catch (e) {
      console.error("Erro ao tentar fugir:", e);
      showToast(t("playerPage.errors.errorFleeing"));
    }
  }, [player, showToast]);

  // Combat menu action handler
  const handleCombatMenuAction = useCallback((action: CombatMenuAction) => {
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
  }, [setTab, setIsInventoryActiveInCombat, setSkillsInitialTab, setIsUsingSkillMode, rollInitiative, joinBattle, endTurn, setAttackType, attemptFlee]);

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
      const isVersoChar = isVerso(source.id);

      if (actualHitCount > 0) {
        setIsExecutingSkill(true);
        let hitIndex = 0;

        while (hitIndex < actualHitCount) {
          await new Promise<void>((resolvePromise) => {
            rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, rollCommandForAttack(weaponInfo, "basic"), async (result) => {
              allDiceResults.push(result);
              const total = diceTotal(result);
              const critMulti = calculatePlayerCriticalMulti(result, player, target);
              let playerPower = (player?.playerSheet?.power ?? 0) * critMulti;
              const weaponPower = calculateRawWeaponPower(weaponInfo, "basic");
              const basePower = playerPower + weaponPower + total;
              const hitDamage = calculateSkillHitDamage(resolved, basePower, result);

              showToast(t("playerPage.battle.attackDamage", { index: hitIndex + 1, damage: hitDamage }));

              for (const targetId of resolved.targetIds) {
                const targetChar = (player.fightInfo?.characters ?? []).find(c => c.battleID === targetId);
                const isNpcTarget = targetChar?.type === "npc";
                const effects = getStatusEffectsForTarget(resolved.effects, targetId);

                const attackRequest: CreateAttackRequest = isNpcTarget
                  ? {
                      sourceBattleId: source.battleID,
                      targetBattleId: targetId,
                      totalDamage: hitDamage,
                      attackType: "skill",
                      effects: effects,
                      skillCost: hitIndex === 0 ? skillCost : 0,
                      isGradient: hitIndex === 0 && isGradientSkill,
                      isLastHit: hitIndex === actualHitCount - 1
                    }
                  : {
                      sourceBattleId: source.battleID,
                      targetBattleId: targetId,
                      totalPower: hitDamage,
                      attackType: "skill",
                      effects: effects,
                      skillCost: hitIndex === 0 ? skillCost : 0,
                      isGradient: hitIndex === 0 && isGradientSkill,
                      isLastHit: hitIndex === actualHitCount - 1
                    };

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

  // Attack target handler
  const handleSelectAttackTarget = useCallback((target: BattleCharacterInfo) => {
    if (player == null) return;

    if (npcIsFlying(target) && attackType != "free-shot") {
      showToast(t("playerPage.battle.flyingEnemyWarning"), { duration: 3000 });
      return;
    }

    setIsExecutingSkill(true);

    const executeAttack = async () => {
      await new Promise<void>((resolve) => {
        rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, rollCommandForAttack(weaponInfo, attackType), async (result) => {
          const playerChar = player?.fightInfo?.characters?.find(c => c.battleID === player.fightInfo?.playerBattleID);
          const total = calculateAttackDamage(player, weaponInfo, target, result, attackType, playerChar?.stance, playerChar);

          try {
            if (target.type == "npc") {
              const totalDamageToNpc = calculateNpcAttackReceivedDamage(target, total);
              const willGetFragile = checkForFragile(target, total);

              let effects: any[] = [];
              if (willGetFragile) {
                effects.push({ effectType: "Fragile", ammount: 1, remainingTurns: 2 });
              }

              await APIBattle.attack({
                totalDamage: totalDamageToNpc,
                targetBattleId: target.battleID,
                sourceBattleId: player.fightInfo?.playerBattleID ?? 0,
                attackType: attackType,
                effects: effects
              });
            } else {
              await APIBattle.attack({
                totalPower: total,
                targetBattleId: target.battleID,
                sourceBattleId: player.fightInfo?.playerBattleID ?? 0,
                attackType: attackType
              });
            }

            setHitCharacters(prev => new Set(prev).add(target.battleID));
            setTimeout(() => {
              setHitCharacters(prev => {
                const next = new Set(prev);
                next.delete(target.battleID);
                return next;
              });
            }, 600);

            if (player.fightInfo?.battleId) {
              const sourceChar = player.fightInfo.characters?.find(c => c.battleID === player.fightInfo?.playerBattleID);
              if (sourceChar) {
                const updatedBattle = await APIBattle.getById(player.fightInfo.battleId);
                const allChars = updatedBattle.characters ?? [];
                const targetAfterAttack = allChars.find(c => c.battleID === target.battleID);

                if (!targetAfterAttack || targetAfterAttack.healthPoints <= 0) {
                  if (target.isEnemy) {
                    await triggerOnKill(sourceChar, target, allChars, player.fightInfo.battleId, player.pictos, player.luminas);
                  }
                }
              }
            }
          } catch (e) {
            showToast(t("playerPage.errors.errorAttacking"));
          }

          resolve();
        });
      });

      setIsExecutingSkill(false);
    };

    executeAttack();
  }, [player, attackType, weaponInfo, diceBoardRef, timeoutDiceBoardRef, showToast]);

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
