import { useState } from "react";
import { FaBars } from "react-icons/fa";
import { COMBAT_MENU_ACTIONS, type CombatMenuAction } from "../utils/CombatMenuActions";

interface CombatMenuProps {
  onAction: (action: CombatMenuAction) => void;
}

export default function CombatMenu({ onAction }: CombatMenuProps) {
  const [open, setOpen] = useState(false);

  function handleAction(action: CombatMenuAction) {
    setOpen(false);
    onAction(action);
  }

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
          <button className="btn btn-sm w-32" onClick={() => handleAction(COMBAT_MENU_ACTIONS.Team)}>
            Equipe
          </button>
          <button className="btn btn-sm w-32" onClick={() => handleAction(COMBAT_MENU_ACTIONS.Enemies)}>
            Inimigos
          </button>
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
        </div>
      )}
    </div>
  );
}
