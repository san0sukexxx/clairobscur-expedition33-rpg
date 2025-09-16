import { useState } from "react";
import BattleGroupStatus from "./BattleGroupStatus";
import CombatMenu from "./CombatMenu";
import { COMBAT_MENU_ACTIONS, type CombatMenuAction } from "../utils/CombatMenuActions";
import { type PlayerResponse } from "../api/APIPlayer";

interface CombatsSectionProps {
  onMenuAction: (action: CombatMenuAction) => void;
  player: PlayerResponse | null;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerResponse | null>>;
}

export default function CombatSection({ onMenuAction, player, setPlayer }: CombatsSectionProps) {
    const [tab, setTab] = useState<"enemies" | "team">("enemies");

    function handleMenuAction(action: CombatMenuAction) {
    
        switch (action) {
            case COMBAT_MENU_ACTIONS.Team:
                setTab("team");
                break;

            case COMBAT_MENU_ACTIONS.Enemies:
                setTab("enemies");
                break;

            case COMBAT_MENU_ACTIONS.Inventory:
                onMenuAction(COMBAT_MENU_ACTIONS.Inventory);
                break;

            case COMBAT_MENU_ACTIONS.Skills:
                onMenuAction(COMBAT_MENU_ACTIONS.Skills);
                break;

            case COMBAT_MENU_ACTIONS.FreeShot:
                setTab("enemies");
                break;

            case COMBAT_MENU_ACTIONS.Attack:
                setTab("enemies");
                break;

            default:
                console.log("Ação desconhecida:", action);
        }
    }

    return (
        <div>
            {tab === "enemies" && (
                <BattleGroupStatus player={player} setPlayer={setPlayer} isEnemies={true} />
            )}

            {tab === "team" && (
                <BattleGroupStatus player={player} setPlayer={setPlayer} isEnemies={false} />
            )}

            <CombatMenu player={player} onAction={handleMenuAction} tab={tab} />
        </div>
    );
}