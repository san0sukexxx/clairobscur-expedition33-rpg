import { useMemo, useState, useEffect, useRef } from "react";
import type { RefObject, MutableRefObject } from "react";
import { motion, useReducedMotion } from "framer-motion";
import BattleGroupStatus from "./BattleGroupStatus";
import CombatMenu from "./CombatMenu";
import { COMBAT_MENU_ACTIONS, type CombatMenuAction } from "../utils/CombatMenuActions";
import InitiativesQueue from "./InitiativesQueue";
import GradientBar from "./GradientBar";
import { CgSandClock } from "react-icons/cg";
import type { GetPlayerResponse } from "../api/APIPlayer";
import type { BattleCharacterInfo, WeaponInfo } from "../api/ResponseModel";
import type { DiceBoardRef } from "./DiceBoard";
import PlayerStatusFloating from "./PlayerStatusFloating";
import CombatBottomSheet from "./CombatBottomSheet";
import SkillInfoCard from "./SkillInfoCard";
import { t } from "../i18n";

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
    excludeSelfFromTargeting?: boolean;
    hitCharacters?: Set<number>;
    activeSkillId?: string | null;
    onDismissSkillCard?: () => void;
    diceBoardRef: RefObject<DiceBoardRef | null>;
    timeoutDiceBoardRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
    onBottomSheetChange?: (open: boolean) => void;
    weaponInfo?: WeaponInfo | null;
}

export default function CombatSection({ onMenuAction, player, onSelectTarget, isReviveMode = false, isSelectingSkillTarget = false, forcedTab, onTabChange, isExecutingSkill = false, isAdmin, excludeSelfFromTargeting = false, hitCharacters, activeSkillId, onDismissSkillCard, diceBoardRef, timeoutDiceBoardRef, onBottomSheetChange, weaponInfo }: CombatsSectionProps) {
    const [internalTab, setInternalTab] = useState<"enemies" | "team">("enemies");
    const [isAttacking, setIsAttacking] = useState<Boolean>(false);
    const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
    const [statusHighlighted, setStatusHighlighted] = useState(false);
    const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleHighlightStatus = () => {
        if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        setStatusHighlighted(true);
        highlightTimerRef.current = setTimeout(() => setStatusHighlighted(false), 3000);
    };

    useEffect(() => {
        onBottomSheetChange?.(bottomSheetOpen);
    }, [bottomSheetOpen, onBottomSheetChange]);

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
            case COMBAT_MENU_ACTIONS.Attack:
            case COMBAT_MENU_ACTIONS.Defend:
                setBottomSheetOpen(true);
                break;

            case COMBAT_MENU_ACTIONS.Cancel:
                setIsAttacking(false);
                onMenuAction(COMBAT_MENU_ACTIONS.Cancel);
                break;

            default:
                console.log("Ação desconhecida:", action);
        }
    }

    const prefersReduced = useReducedMotion();
    const rotateY = tab === "team" ? 180 : 0;

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

            {/* <PlayerStatusFloating
                player={player}
                highlighted={statusHighlighted}
                weaponInfo={weaponInfo}
            /> */}

            <InitiativesQueue
                characters={player?.fightInfo?.characters}
                initiatives={player?.fightInfo?.initiatives}
                turns={player?.fightInfo?.turns}
                isStarted={player?.fightInfo?.battleStatus == "started" || player?.fightInfo?.battleStatus == "finished"}
                showBattleId={false}
                isAdmin={isAdmin} />

            <GradientBar characters={player?.fightInfo?.characters} player={player} turns={player?.fightInfo?.turns} />

            {activeSkillId && onDismissSkillCard && (
                <div className="mt-4">
                    <SkillInfoCard skillId={activeSkillId} onDismiss={onDismissSkillCard} player={player} onHighlightStatus={handleHighlightStatus} />
                </div>
            )}

            <div className="relative w-full" style={{ perspective: 1200 }}>
                <motion.div
                    className="relative w-full"
                    animate={prefersReduced ? { opacity: 1 } : { rotateY }}
                    initial={false}
                    transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
                    style={{
                        transformStyle: "preserve-3d",
                        willChange: prefersReduced ? undefined : "transform",
                    }}
                >
                    <div
                        aria-hidden={tab !== "enemies"}
                        className={tab === "enemies" ? "relative" : "absolute inset-0"}
                        style={{
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                            pointerEvents: tab === "enemies" ? "auto" : "none",
                            opacity: prefersReduced && tab !== "enemies" ? 0 : 1,
                        }}
                    >
                        <BattleGroupStatus player={player} isEnemies={true} currentCharacter={currentCharacter} isAttacking={isAttacking || isSelectingSkillTarget} onSelectTarget={handleSelectAttackTarget} isReviveMode={isReviveMode} isExecutingSkill={isExecutingSkill} isAdmin={isAdmin} excludeSelf={excludeSelfFromTargeting} hitCharacters={hitCharacters} />
                    </div>

                    <div
                        aria-hidden={tab !== "team"}
                        className={tab === "team" ? "relative" : "absolute inset-0"}
                        style={{
                            transform: "rotateY(180deg)",
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                            pointerEvents: tab === "team" ? "auto" : "none",
                            opacity: prefersReduced && tab !== "team" ? 0 : 1,
                        }}
                    >
                        <BattleGroupStatus player={player} isEnemies={false} currentCharacter={currentCharacter} isAttacking={isAttacking || isSelectingSkillTarget} onSelectTarget={handleSelectAttackTarget} isReviveMode={isReviveMode} isExecutingSkill={isExecutingSkill} isAdmin={isAdmin} excludeSelf={excludeSelfFromTargeting} hitCharacters={hitCharacters} />
                    </div>
                </motion.div>
            </div>

            <CombatMenu
                player={player}
                onAction={handleMenuAction}
                tab={tab}
                currentTeamTab={currentTeamTab}
                opositeTeamTab={opositeTeamTab}
                isAttacking={isAttacking}
                isExecutingSkill={isExecutingSkill}
                isSelectingSkillTarget={isSelectingSkillTarget}
                hidden={bottomSheetOpen}
            />

            <CombatBottomSheet player={player} open={bottomSheetOpen} onOpen={() => setBottomSheetOpen(true)} onClose={() => setBottomSheetOpen(false)} diceBoardRef={diceBoardRef} timeoutDiceBoardRef={timeoutDiceBoardRef} activeSkillId={activeSkillId} onHighlightStatus={handleHighlightStatus} />

            <div className="h-52" />
        </div>
    );
}