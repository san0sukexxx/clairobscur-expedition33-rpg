import { useState } from "react";

import PartyStatus from "./PartyStatus";
import EnemiesStatus from "./EnemiesStatus";
import CombatMenu from "./CombatMenu";
import { COMBAT_MENU_ACTIONS, type CombatMenuAction } from "../utils/CombatMenuActions";

interface CombatsSectionProps {
  onMenuAction: (action: CombatMenuAction) => void;
}

export default function CombatSection({ onMenuAction }: CombatsSectionProps) {
    const [tab, setTab] = useState<"enemies" | "team">("enemies");

    function handleMenuAction(action: CombatMenuAction) {
        console.log(action);
        
        switch (action) {
            case COMBAT_MENU_ACTIONS.Team:
                setTab("team");
                break;

            case COMBAT_MENU_ACTIONS.Enemies:
                setTab("enemies");
                break;

            case COMBAT_MENU_ACTIONS.Inventory:
                onMenuAction("Inventory");
                break;

            case COMBAT_MENU_ACTIONS.Skills:
                onMenuAction("Skills");
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
                <EnemiesStatus />
            )}

            {tab === "team" && (
                <PartyStatus />
            )}

            <CombatMenu onAction={handleMenuAction} />
        </div>
    );
}