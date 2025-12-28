import { useMemo, useState, useEffect, useRef } from "react";
import BattleGroupStatus from "./BattleGroupStatus";
import CombatMenu from "./CombatMenu";
import { COMBAT_MENU_ACTIONS, type CombatMenuAction } from "../utils/CombatMenuActions";
import InitiativesQueue from "./InitiativesQueue";
import GradientBar from "./GradientBar";
import { CgSandClock } from "react-icons/cg";
import type { GetPlayerResponse } from "../api/APIPlayer";
import type { BattleCharacterInfo } from "../api/ResponseModel";
import PlayerStatusFloating from "./PlayerStatusFloating";

interface CombatsSectionProps {
    onMenuAction: (action: CombatMenuAction) => void;
    player: GetPlayerResponse | null;
    onSelectTarget?: (target: BattleCharacterInfo) => void;
    isReviveMode?: boolean;
    isSelectingSkillTarget?: boolean;
    forcedTab?: "enemies" | "team" | null;
    onTabChange?: (tab: "enemies" | "team" | null) => void;
    isExecutingSkill?: boolean;
    isAdmin: boolean;
}

export default function CombatSection({ onMenuAction, player, onSelectTarget, isReviveMode = false, isSelectingSkillTarget = false, forcedTab, onTabChange, isExecutingSkill = false, isAdmin }: CombatsSectionProps) {
    const [internalTab, setInternalTab] = useState<"enemies" | "team">("enemies");
    const [isAttacking, setIsAttacking] = useState<Boolean>(false);

    const tab = forcedTab ?? internalTab;
    const setTab = (newTab: "enemies" | "team") => {
        if (onTabChange) {
            onTabChange(newTab);
        } else {
            setInternalTab(newTab);
        }
    };

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
        if (currentCharacter && !forcedTab) {
            setTab(opositeTeamTab);
        }
    }, [currentCharacter, opositeTeamTab, forcedTab]);

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

            case COMBAT_MENU_ACTIONS.Flee:
                onMenuAction(COMBAT_MENU_ACTIONS.Flee);
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
                onMenuAction(COMBAT_MENU_ACTIONS.Cancel);
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

            {player?.fightInfo?.battleStatus == "finished" && (
                <div className="alert alert-success shadow-lg mt-1 mb-5 gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="font-semibold">Batalha finalizada</span>
                </div>
            )}

            <PlayerStatusFloating
                player={player}
            />

            <GradientBar characters={player?.fightInfo?.characters} player={player} turns={player?.fightInfo?.turns} />

            <InitiativesQueue
                characters={player?.fightInfo?.characters}
                initiatives={player?.fightInfo?.initiatives}
                turns={player?.fightInfo?.turns}
                isStarted={player?.fightInfo?.battleStatus == "started" || player?.fightInfo?.battleStatus == "finished"}
                showBattleId={false}
                isAdmin={isAdmin} />

            {tab === "enemies" && (
                <BattleGroupStatus player={player} isEnemies={true} currentCharacter={currentCharacter} isAttacking={isAttacking || isSelectingSkillTarget} onSelectTarget={handleSelectAttackTarget} isReviveMode={isReviveMode} isExecutingSkill={isExecutingSkill} isAdmin={isAdmin} />
            )}

            {tab === "team" && (
                <BattleGroupStatus player={player} isEnemies={false} currentCharacter={currentCharacter} isAttacking={isAttacking || isSelectingSkillTarget} onSelectTarget={handleSelectAttackTarget} isReviveMode={isReviveMode} isExecutingSkill={isExecutingSkill} isAdmin={isAdmin} />
            )}

            <CombatMenu
                player={player}
                onAction={handleMenuAction}
                tab={tab}
                currentTeamTab={currentTeamTab}
                opositeTeamTab={opositeTeamTab}
                isAttacking={isAttacking}
                isExecutingSkill={isExecutingSkill}
                isSelectingSkillTarget={isSelectingSkillTarget}
            />

            <div className="h-[100px]" />
        </div>
    );
}