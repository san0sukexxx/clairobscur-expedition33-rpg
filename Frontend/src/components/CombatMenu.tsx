import { useState, useMemo } from "react";
import { FaBars } from "react-icons/fa";
import { COMBAT_MENU_ACTIONS, type CombatMenuAction } from "../utils/CombatMenuActions";
import type { GetPlayerResponse } from "../api/APIPlayer";

interface CombatMenuProps {
  player: GetPlayerResponse | null;
  onAction: (action: CombatMenuAction) => void;
  tab: String;
  currentTeamTab: String;
  opositeTeamTab: String;
  isAttacking: Boolean;
}

export default function CombatMenu({ player, onAction, tab, currentTeamTab, opositeTeamTab, isAttacking }: CombatMenuProps) {
  const [open, setOpen] = useState(false);

  function handleAction(action: CombatMenuAction) {
    setOpen(false);
    onAction(action);
  }

  const isYourTurn = useMemo(() => {
    const firstTurn = player?.fightInfo?.turns?.[0]
    if (!firstTurn) return false
    return firstTurn.battleCharacterId === player?.fightInfo?.playerBattleID
  }, [player?.fightInfo])

  return (
    <div className="fixed bottom-20 right-4">
      {/* Botão principal */}
      <button
        className="btn btn-primary btn-circle shadow-lg"
        onClick={() => setOpen((prev) => !prev)}
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
          {tab == opositeTeamTab && !isAttacking && (
            <button className="btn btn-sm w-32" onClick={() => handleAction(COMBAT_MENU_ACTIONS.Team)}>
              Equipe
            </button>
          )}

          {tab == currentTeamTab && !isAttacking && (
            <button className="btn btn-sm w-32" onClick={() => handleAction(COMBAT_MENU_ACTIONS.Enemies)}>
              Inimigos
            </button>
          )}

          {player?.fightInfo?.battleStatus == "starting" && !isAttacking && player?.fightInfo?.canRollInitiative && (
            <button className="btn btn-sm w-32" onClick={() => handleAction(COMBAT_MENU_ACTIONS.Initiative)}>
              Rolar Iniciativa
            </button>
          )}

          {player?.fightInfo?.battleStatus == "started" && !isAttacking && player?.fightInfo?.canRollInitiative && (
            <button className="btn btn-sm w-32" onClick={() => handleAction(COMBAT_MENU_ACTIONS.JoinBattle)}>
              Entrar na batalha
            </button>
          )}

          {isYourTurn && !isAttacking && (
            <>
              <button className="btn btn-sm w-32" onClick={() => handleAction(COMBAT_MENU_ACTIONS.Inventory)}>
                Itens
              </button>
              <button className="btn btn-sm w-32" onClick={() => handleAction(COMBAT_MENU_ACTIONS.Skills)}>
                Habilidades
              </button>
              <button className="btn btn-sm w-32" onClick={() => handleAction(COMBAT_MENU_ACTIONS.FreeShot)}>
                Tiro livre
              </button>
              <button className="btn btn-sm w-32" onClick={() => handleAction(COMBAT_MENU_ACTIONS.Attack)}>
                Atacar
              </button>
              <button className="btn btn-sm w-32" onClick={() => handleAction(COMBAT_MENU_ACTIONS.EndTurn)}>
                Encerrar o turno
              </button>
            </>
          )}

          {isAttacking && (
            <button className="btn btn-sm w-32" onClick={() => handleAction(COMBAT_MENU_ACTIONS.Cancel)}>
              Cancelar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
