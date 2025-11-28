import { useMemo, useState, useEffect } from "react";
import BattleGroupStatus from "./BattleGroupStatus";
import CombatMenu from "./CombatMenu";
import { COMBAT_MENU_ACTIONS, type CombatMenuAction } from "../utils/CombatMenuActions";
import InitiativesQueue from "./InitiativesQueue";
import { CgSandClock } from "react-icons/cg";
import type { GetPlayerResponse } from "../api/APIPlayer";
import type { BattleCharacterInfo } from "../api/ResponseModel";
import PlayerStatusFloating from "./PlayerStatusFloating";

interface CombatsSectionProps {
    onMenuAction: (action: CombatMenuAction) => void;
    player: GetPlayerResponse | null;
    onSelectTarget?: (target: BattleCharacterInfo) => void;
}

export default function CombatSection({ onMenuAction, player, onSelectTarget }: CombatsSectionProps) {
    const [tab, setTab] = useState<"enemies" | "team">("enemies");
    const [isAttacking, setIsAttacking] = useState<Boolean>(false);

    const currentCharacter = useMemo(() => {
        return player?.fightInfo?.characters?.find(c => c.battleID == player.fightInfo?.playerBattleID)
    }, [player?.fightInfo?.characters]);

    const currentTeamTab = useMemo(() => {
        return currentCharacter?.isEnemy ? "enemies" : "team"
    }, [currentCharacter]);

    const opositeTeamTab = useMemo(() => {
        return currentCharacter?.isEnemy ? "team" : "enemies"
    }, [currentCharacter]);

    useEffect(() => {
        if (currentCharacter) {
            setTab(opositeTeamTab);
        }
    }, [currentCharacter]);

    function handleSelectAttackTarget(target: BattleCharacterInfo) {
        setIsAttacking(false);
        onSelectTarget?.(target);
    }

    function handleMenuAction(action: CombatMenuAction) {
        switch (action) {
            case COMBAT_MENU_ACTIONS.Team:
                setTab(currentTeamTab);
                break;

            case COMBAT_MENU_ACTIONS.Enemies:
                setTab(opositeTeamTab);
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

            case COMBAT_MENU_ACTIONS.Initiative:
                onMenuAction(COMBAT_MENU_ACTIONS.Initiative);
                break;

            case COMBAT_MENU_ACTIONS.JoinBattle:
                onMenuAction(COMBAT_MENU_ACTIONS.JoinBattle);
                break;

            case COMBAT_MENU_ACTIONS.EndTurn:
                onMenuAction(COMBAT_MENU_ACTIONS.EndTurn);
                break;

            case COMBAT_MENU_ACTIONS.FreeShot:
                setTab(opositeTeamTab);
                setIsAttacking(true);
                onMenuAction(COMBAT_MENU_ACTIONS.FreeShot);
                break;

            case COMBAT_MENU_ACTIONS.Attack:
                setIsAttacking(true);
                setTab(opositeTeamTab);
                onMenuAction(COMBAT_MENU_ACTIONS.Attack);
                break;

            case COMBAT_MENU_ACTIONS.Cancel:
                setIsAttacking(false);
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

            <PlayerStatusFloating
                player={player}
            />

            <InitiativesQueue
                characters={player?.fightInfo?.characters}
                initiatives={player?.fightInfo?.initiatives}
                turns={player?.fightInfo?.turns}
                isStarted={player?.fightInfo?.battleStatus == "started"}
                showBattleId={false} />

            {tab === "enemies" && (
                <BattleGroupStatus player={player} isEnemies={true} currentCharacter={currentCharacter} isAttacking={isAttacking} onSelectTarget={handleSelectAttackTarget} />
            )}

            {tab === "team" && (
                <BattleGroupStatus player={player} isEnemies={false} currentCharacter={currentCharacter} isAttacking={isAttacking} onSelectTarget={handleSelectAttackTarget} />
            )}

            <CombatMenu
                player={player}
                onAction={handleMenuAction}
                tab={tab}
                currentTeamTab={currentTeamTab}
                opositeTeamTab={opositeTeamTab}
                isAttacking={isAttacking}
            />

            <div className="h-[100px]" />
        </div>
    );
}