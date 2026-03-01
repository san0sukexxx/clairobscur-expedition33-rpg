import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { type GetPlayerResponse } from "../api/APIPlayer";
import SpecialAttackPickerSection from "./SpecialAttackPickerSection";
import SpecialAttacksListSection from "./SpecialAttacksListSection";
import { FaListCheck } from "react-icons/fa6";
import { FaListUl } from "react-icons/fa";
import { calculateSpecialAttackPoints } from "../utils/PlayerCalculator";
import { calculateUsedSpecialAttackPoints } from "../utils/SpecialAttackUtils";
import { t } from "../i18n";

interface SpecialAttacksSectionProps {
    player: GetPlayerResponse | null;
    setPlayer: React.Dispatch<React.SetStateAction<GetPlayerResponse | null>>;
    isAdmin: boolean;
    initialTab?: "list" | "picker";
    isUsingSpecialAttackMode?: boolean;
    onUseSpecialAttack?: (specialAttackId: string) => void;
}

export default function SpecialAttacksSection({ player, setPlayer, isAdmin, initialTab = "list", isUsingSpecialAttackMode = false, onUseSpecialAttack }: SpecialAttacksSectionProps) {
    const [tab, setTab] = useState<"list" | "picker">(initialTab);
    const prefersReduced = useReducedMotion();
    const prev = useRef<"list" | "picker">("list");

    const totalPoints = calculateSpecialAttackPoints(player);
    const usedPoints = calculateUsedSpecialAttackPoints(player);
    const remainingPoints = totalPoints - usedPoints;
    const inBattle = !!player?.fightInfo?.turns?.some(
        turn => turn.battleCharacterId === player.fightInfo?.playerBattleID
    ) && player?.fightInfo?.battleStatus !== "finished";

    useEffect(() => {
        setTab(initialTab);
    }, [initialTab]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [tab]);

    function handleMenuAction() {
        prev.current = tab;
        setTab(tab === "list" ? "picker" : "list");
    }

    const rotateY = tab === "picker" ? 180 : 0;

    return (
        <div className="relative pb-100">
            <div
                className="relative w-full"
                style={{ perspective: 1200 }}
            >
                <motion.div
                    className="relative w-full"
                    animate={
                        prefersReduced
                            ? { opacity: 1 }
                            : { rotateY }
                    }
                    initial={false}
                    transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
                    style={{
                        transformStyle: "preserve-3d",
                        willChange: prefersReduced ? undefined : "transform",
                    }}
                >
                    <div
                        aria-hidden={tab !== "list"}
                        className="relative"
                        style={{
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                            pointerEvents: tab === "list" ? "auto" : "none",
                            opacity: prefersReduced && tab !== "list" ? 0 : 1,
                        }}
                    >
                        <SpecialAttacksListSection player={player} setPlayer={setPlayer} isAdmin={isAdmin} inBattle={inBattle} />
                    </div>

                    <div
                        aria-hidden={tab !== "picker"}
                        className="absolute inset-0"
                        style={{
                            transform: "rotateY(180deg)",
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                            pointerEvents: tab === "picker" ? "auto" : "none",
                            opacity: prefersReduced && tab !== "picker" ? 0 : 1,
                        }}
                    >
                        <SpecialAttackPickerSection player={player} setPlayer={setPlayer} inBattle={inBattle} isUsingSpecialAttackMode={isUsingSpecialAttackMode} onUseSpecialAttack={onUseSpecialAttack} />
                    </div>
                </motion.div>
            </div>

            <div className="fixed bottom-9 right-4">
                <button
                    className="btn btn-primary btn-circle w-11 h-11 min-h-0 shadow-lg"
                    onClick={handleMenuAction}
                    aria-label={tab === "list" ? "Ir para seleção de ataques especiais" : "Voltar para lista de ataques especiais"}
                >
                    {tab === "list" ? <FaListCheck size={20} /> : <FaListUl size={20} />}
                </button>
            </div>
        </div>
    );
}
