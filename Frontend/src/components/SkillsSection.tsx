import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { type GetPlayerResponse } from "../api/APIPlayer";
import SkillPickerSection from "./SkillPickerSection";
import SkillsListSection from "./SkillsListSection";
import { FaListCheck } from "react-icons/fa6";
import { FaListUl } from "react-icons/fa";
import { calculateSkillPoints } from "../utils/PlayerCalculator";
import { calculateUsedSkillPoints } from "../utils/SkillUtils";

interface SkillsSectionProps {
    player: GetPlayerResponse | null;
    setPlayer: React.Dispatch<React.SetStateAction<GetPlayerResponse | null>>;
    isAdmin: boolean;
    initialTab?: "list" | "picker";
    isUsingSkillMode?: boolean;
}

export default function SkillSection({ player, setPlayer, isAdmin, initialTab = "list", isUsingSkillMode = false }: SkillsSectionProps) {
    const [tab, setTab] = useState<"list" | "picker">(initialTab);
    const prefersReduced = useReducedMotion();
    const prev = useRef<"list" | "picker">("list");

    const totalPoints = calculateSkillPoints(player);
    const usedPoints = calculateUsedSkillPoints(player);
    const remainingPoints = totalPoints - usedPoints;
    const inBattle = !!player?.fightInfo?.turns?.some(
        turn => turn.battleCharacterId === player.fightInfo?.playerBattleID
    );

    useEffect(() => {
        setTab(initialTab);
    }, [initialTab]);

    function handleMenuAction() {
        prev.current = tab;
        setTab(tab === "list" ? "picker" : "list");
    }

    const rotateY = tab === "picker" ? 180 : 0;

    return (
        <div className="relative">
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
                        <SkillsListSection player={player} setPlayer={setPlayer} isAdmin={isAdmin} inBattle={inBattle} />
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
                        <SkillPickerSection player={player} setPlayer={setPlayer} inBattle={inBattle} isUsingSkillMode={isUsingSkillMode} />
                    </div>
                </motion.div>
            </div>

            <div className="fixed bottom-20 right-4">
                <button
                    className="btn btn-primary btn-circle shadow-lg"
                    onClick={handleMenuAction}
                    aria-label={tab === "list" ? "Ir para seleção de habilidades" : "Voltar para lista de habilidades"}
                >
                    {tab === "list" ? <FaListCheck size={20} /> : <FaListUl size={20} />}
                </button>
            </div>
        </div>
    );
}
