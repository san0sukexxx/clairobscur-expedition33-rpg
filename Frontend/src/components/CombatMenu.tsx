import { useState, useMemo, useEffect, useRef } from "react";
import { FaBars, FaExchangeAlt, FaTimes, FaUsers, FaSkull, FaFlask, FaStar, FaCheckCircle, FaCrosshairs } from "react-icons/fa";
import { GiSwordWound, GiRunningNinja, GiJoinIn } from "react-icons/gi";
import { COMBAT_MENU_ACTIONS, type CombatMenuAction } from "../utils/CombatMenuActions";
import type { GetPlayerResponse } from "../api/APIPlayer";
import { getActiveTurnCharacter } from "../utils/CharacterUtils";
import { t } from "../i18n";

interface CombatMenuProps {
  player: GetPlayerResponse | null;
  onAction: (action: CombatMenuAction) => void;
  tab: String;
  currentTeamTab: String;
  opositeTeamTab: String;
  isAttacking: Boolean;
  isExecutingSkill?: boolean;
  isSelectingSkillTarget?: boolean;
  hidden?: boolean;
}

export default function CombatMenu({ player, onAction, tab, currentTeamTab, opositeTeamTab, isAttacking, isExecutingSkill = false, isSelectingSkillTarget = false, hidden = false }: CombatMenuProps) {
  const [open, setOpen] = useState(false);

  const currentCharacter = useMemo(() => {
    return getActiveTurnCharacter(player)
  }, [player?.fightInfo?.characters])

  const playerStatus = useMemo(() => {
    const currentChar = player?.fightInfo?.characters?.find(c => c.battleID === player.fightInfo?.playerBattleID);
    return currentChar?.status ?? [];
  }, [player?.fightInfo?.characters])

  const isFrozen = useMemo(() => {
    return playerStatus.some(ps => ps.effectName == "Frozen")
  }, [playerStatus])

  const isStunned = useMemo(() => {
    return playerStatus.some(ps => ps.effectName == "Stunned")
  }, [playerStatus])

  const isExhausted = useMemo(() => {
    return playerStatus.some(ps => ps.effectName == "Exhausted")
  }, [playerStatus])

  const isSilenced = useMemo(() => {
    return playerStatus.some(ps => ps.effectName == "Silenced")
  }, [playerStatus])

  const isFleeing = useMemo(() => {
    return playerStatus.some(ps => ps.effectName == "Fleeing")
  }, [playerStatus])

  const canUseItems = useMemo(() => {
    return !isFrozen && !isStunned && !isFleeing
  }, [player?.fightInfo?.characters])

  const canUseHabilities = useMemo(() => {
    return !isFrozen && !isStunned && !isSilenced && !isFleeing
  }, [player?.fightInfo?.characters])

  const canUseFlee = useMemo(() => {
    return !isFrozen && !isStunned && !isSilenced && !isFleeing
  }, [player?.fightInfo?.characters])

  const canUseFreeShot = useMemo(() => {
    if (isFleeing) return false
    return !isFrozen && !isStunned
  }, [player?.fightInfo?.characters])

  const canAttack = useMemo(() => {
    return !isFrozen && !isStunned && !isFleeing
  }, [player?.fightInfo?.characters])

  function handleAction(action: CombatMenuAction) {
    setOpen(false);
    onAction(action);
  }

  const isYourTurn = useMemo(() => {
    const firstTurn = player?.fightInfo?.turns?.[0]
    if (!firstTurn) return false
    return firstTurn.battleCharacterId === player?.fightInfo?.playerBattleID
  }, [player?.fightInfo])

  // Close menu when executing skill
  useEffect(() => {
    if (isExecutingSkill) {
      setOpen(false);
    }
  }, [isExecutingSkill]);

  const hasBattle = useMemo(() => {
    const battleStatus = player?.fightInfo?.battleStatus;
    return battleStatus === "starting" || battleStatus === "started";
  }, [player?.fightInfo?.battleStatus]);

  const canRollInitiative = !!player?.fightInfo?.canRollInitiative && !isAttacking;
  const isFlipOnly = canRollInitiative || (!isYourTurn && !isAttacking && !isSelectingSkillTarget && !isExecutingSkill);

  // Blink the menu button when it's the player's turn until first click
  const [hasOpenedThisTurn, setHasOpenedThisTurn] = useState(false);
  const prevIsYourTurn = useRef(isYourTurn);
  useEffect(() => {
    if (isYourTurn && !prevIsYourTurn.current) {
      setHasOpenedThisTurn(false);
    }
    prevIsYourTurn.current = isYourTurn;
  }, [isYourTurn]);

  const shouldBlink = isYourTurn && !hasOpenedThisTurn && !isFlipOnly && !isExecutingSkill;

  function handleFlipTab() {
    if (tab == opositeTeamTab) {
      handleAction(COMBAT_MENU_ACTIONS.Team);
    } else {
      handleAction(COMBAT_MENU_ACTIONS.Enemies);
    }
  }

  if (!hasBattle || hidden) {
    return null;
  }

  return (
    <div className="fixed bottom-14 right-4 z-[44] flex flex-col items-end gap-2">
      {/* Menu flutuante */}
      {open && !isFlipOnly && (
        <div
          className="
            bg-base-100 shadow-lg rounded-xl p-2
            flex flex-col gap-2
          "
        >
          {/* Quando selecionando alvo de habilidade, mostrar apenas Cancelar */}
          {isSelectingSkillTarget ? (
            <button className="btn btn-sm w-36 justify-start gap-2" onClick={() => handleAction(COMBAT_MENU_ACTIONS.Cancel)}>
              <FaTimes size={14} /> {t("common.cancel")}
            </button>
          ) : (
            <>
              {tab == opositeTeamTab && !isAttacking && (
                <button className="btn btn-sm w-36 justify-start gap-2" onClick={() => handleAction(COMBAT_MENU_ACTIONS.Team)}>
                  <FaUsers size={14} /> {t("combat.team")}
                </button>
              )}

              {tab == currentTeamTab && !isAttacking && (
                <button className="btn btn-sm w-36 justify-start gap-2" onClick={() => handleAction(COMBAT_MENU_ACTIONS.Enemies)}>
                  <FaSkull size={14} /> {t("combat.enemies")}
                </button>
              )}

              {player?.fightInfo?.battleStatus == "started" && !isAttacking && player?.fightInfo?.canRollInitiative && (
                <button className="btn btn-sm w-36 justify-start gap-2" onClick={() => handleAction(COMBAT_MENU_ACTIONS.JoinBattle)}>
                  <GiJoinIn size={16} /> {t("combat.joinBattle")}
                </button>
              )}

              {isYourTurn && !isAttacking && (
                <>
                  {isFleeing ? (
                    <button className="btn btn-sm w-36 justify-start gap-2" onClick={() => handleAction(COMBAT_MENU_ACTIONS.EndTurn)}>
                      <FaCheckCircle size={14} /> {t("combat.endTurn")}
                    </button>
                  ) : (
                    <>
                      {canUseItems && (
                        <button className="btn btn-sm w-36 justify-start gap-2" onClick={() => handleAction(COMBAT_MENU_ACTIONS.Inventory)}>
                          <FaFlask size={14} /> {t("combat.items")}
                        </button>
                      )}
                      {canUseHabilities && (
                        <button className="btn btn-sm w-36 justify-start gap-2" onClick={() => handleAction(COMBAT_MENU_ACTIONS.Skills)}>
                          <FaStar size={14} /> {t("combat.specialAttacks")}
                        </button>
                      )}
                      {canUseFlee && (
                        <button className="btn btn-sm w-36 justify-start gap-2" onClick={() => handleAction(COMBAT_MENU_ACTIONS.Flee)}>
                          <GiRunningNinja size={16} /> {t("combat.flee")}
                        </button>
                      )}
                      {canUseFreeShot && (
                        <button className="btn btn-sm w-36 justify-start gap-2" onClick={() => handleAction(COMBAT_MENU_ACTIONS.FreeShot)}>
                          <FaCrosshairs size={14} /> {t("combat.freeShot")}
                        </button>
                      )}
                      {canAttack && (
                        <button className="btn btn-sm w-36 justify-start gap-2" onClick={() => handleAction(COMBAT_MENU_ACTIONS.Attack)}>
                          <GiSwordWound size={16} /> {t("combat.attack")}
                        </button>
                      )}
                      <button className="btn btn-sm w-36 justify-start gap-2" onClick={() => handleAction(COMBAT_MENU_ACTIONS.EndTurn)}>
                        <FaCheckCircle size={14} /> {t("combat.endTurn")}
                      </button>
                    </>
                  )}
                </>
              )}

              {isAttacking && (
                <button className="btn btn-sm w-36 justify-start gap-2" onClick={() => handleAction(COMBAT_MENU_ACTIONS.Cancel)}>
                  <FaTimes size={14} /> {t("common.cancel")}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Botão principal */}
      <button
        className={`btn btn-primary btn-circle w-11 h-11 min-h-0 shadow-lg ${isExecutingSkill ? "opacity-50 cursor-not-allowed" : ""} ${shouldBlink ? "animate-combat-menu-blink" : ""}`}
        onClick={isFlipOnly ? handleFlipTab : () => { setHasOpenedThisTurn(true); setOpen((prev) => !prev); }}
        disabled={isExecutingSkill}
      >
        {isFlipOnly ? <FaExchangeAlt size={18} /> : <FaBars size={20} />}
      </button>
    </div>
  );
}
