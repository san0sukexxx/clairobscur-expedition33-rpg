import { useState } from "react";
import BattleGroupStatus from "./BattleGroupStatus";
import CombatMenu from "./CombatMenu";
import { COMBAT_MENU_ACTIONS, type CombatMenuAction } from "../utils/CombatMenuActions";
import { type PlayerResponse } from "../api/MockAPIPlayer";
import InitiativesQueue from "./InitiativesQueue";
import { CgSandClock } from "react-icons/cg";

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

            case COMBAT_MENU_ACTIONS.Initiative:
                onMenuAction(COMBAT_MENU_ACTIONS.Initiative);
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
            {player?.fightInfo?.battleStatus == "starting" && (
                <div className="alert alert-info shadow-lg mt-1 mb-5 gap-1">
                    <CgSandClock className="h-6 w-6" />
                    <span className="font-semibold">Aguardando jogadores...</span>
                </div>
            )}

            <InitiativesQueue player={player} isStarted={player?.fightInfo?.battleStatus == "started"} />

            {tab === "enemies" && (
                <BattleGroupStatus player={player} isEnemies={true} />
            )}

            {tab === "team" && (
                <BattleGroupStatus player={player} isEnemies={false} />
            )}

            <CombatMenu player={player} onAction={handleMenuAction} tab={tab} />
        </div>
    );
}