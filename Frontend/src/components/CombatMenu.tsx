import { useState, useMemo, useEffect } from "react";
import { FaBars } from "react-icons/fa";
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
}

export default function CombatMenu({ player, onAction, tab, currentTeamTab, opositeTeamTab, isAttacking, isExecutingSkill = false, isSelectingSkillTarget = false }: CombatMenuProps) {
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

    const mp = currentCharacter?.magicPoints ?? 0

    if (isExhausted) {
      return !isFrozen && !isStunned && mp >= 2
    }

    return !isFrozen && !isStunned && mp > 0
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

  if (!hasBattle) {
    return null;
  }

  return (
    <div className="fixed bottom-9 right-4 z-41">
      {/* Botão principal */}
      <button
        className={`btn btn-primary btn-circle shadow-lg ${isExecutingSkill ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={() => !isExecutingSkill && setOpen((prev) => !prev)}
        disabled={isExecutingSkill}
      >
        <FaBars size={20} />
      </button>

      {/* Menu flutuante */}
      {open && (
        <div
          className="
            absolute bottom-16 right-0
            bg-base-100 shadow-lg rounded-xl p-2
            flex flex-col gap-2
          "
        >
          {/* Quando selecionando alvo de habilidade, mostrar apenas Cancelar */}
          {isSelectingSkillTarget ? (
            <button className="btn btn-sm w-32" onClick={() => handleAction(COMBAT_MENU_ACTIONS.Cancel)}>
              {t("common.cancel")}
            </button>
          ) : (
            <>
              {tab == opositeTeamTab && !isAttacking && (
                <button className="btn btn-sm w-32" onClick={() => handleAction(COMBAT_MENU_ACTIONS.Team)}>
                  {t("combat.team")}
                </button>
              )}

              {tab == currentTeamTab && !isAttacking && (
                <button className="btn btn-sm w-32" onClick={() => handleAction(COMBAT_MENU_ACTIONS.Enemies)}>
                  {t("combat.enemies")}
                </button>
              )}

              {player?.fightInfo?.battleStatus == "starting" && !isAttacking && player?.fightInfo?.canRollInitiative && (
                <button className="btn btn-sm w-32" onClick={() => handleAction(COMBAT_MENU_ACTIONS.Initiative)}>
                  {t("combat.rollInitiative")}
                </button>
              )}

              {player?.fightInfo?.battleStatus == "started" && !isAttacking && player?.fightInfo?.canRollInitiative && (
                <button className="btn btn-sm w-32" onClick={() => handleAction(COMBAT_MENU_ACTIONS.JoinBattle)}>
                  {t("combat.joinBattle")}
                </button>
              )}

              {isYourTurn && !isAttacking && (
                <>
                  {isFleeing ? (
                    <button className="btn btn-sm w-32" onClick={() => handleAction(COMBAT_MENU_ACTIONS.EndTurn)}>
                      {t("combat.endTurn")}
                    </button>
                  ) : (
                    <>
                      {canUseItems && (
                        <button className="btn btn-sm w-32" onClick={() => handleAction(COMBAT_MENU_ACTIONS.Inventory)}>
                          {t("combat.items")}
                        </button>
                      )}
                      {canUseHabilities && (
                        <button className="btn btn-sm w-32" onClick={() => handleAction(COMBAT_MENU_ACTIONS.Skills)}>
                          {t("combat.skills")}
                        </button>
                      )}
                      {canUseFlee && (
                        <button className="btn btn-sm w-32" onClick={() => handleAction(COMBAT_MENU_ACTIONS.Flee)}>
                          {t("combat.flee")}
                        </button>
                      )}
                      {canUseFreeShot && (
                        <button className="btn btn-sm w-32" onClick={() => handleAction(COMBAT_MENU_ACTIONS.FreeShot)}>
                          {t("combat.freeShot")}
                        </button>
                      )}
                      {canAttack && (
                        <button className="btn btn-sm w-32" onClick={() => handleAction(COMBAT_MENU_ACTIONS.Attack)}>
                          {t("combat.attack")}
                        </button>
                      )}
                      <button className="btn btn-sm w-32" onClick={() => handleAction(COMBAT_MENU_ACTIONS.EndTurn)}>
                        {t("combat.endTurn")}
                      </button>
                    </>
                  )}
                </>
              )}

              {isAttacking && (
                <button className="btn btn-sm w-32" onClick={() => handleAction(COMBAT_MENU_ACTIONS.Cancel)}>
                  {t("common.cancel")}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
