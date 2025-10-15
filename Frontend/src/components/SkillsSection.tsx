import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { type PlayerResponse } from "../api/MockAPIPlayer";
import SkillPickerSection from "./SkillPickerSection";
import SkillsListSection from "./SkillsListSection";
import { FaListCheck } from "react-icons/fa6";
import { FaListUl } from "react-icons/fa";

interface SkillsSectionProps {
    player: PlayerResponse | null;
    setPlayer: React.Dispatch<React.SetStateAction<PlayerResponse | null>>;
}

export default function SkillSection({ player, setPlayer }: SkillsSectionProps) {
    const [tab, setTab] = useState<"list" | "picker">("list");
    const prefersReduced = useReducedMotion();
    const prev = useRef<"list" | "picker">("list");

    function handleMenuAction() {
        prev.current = tab;
        setTab(tab === "list" ? "picker" : "list");
    }

    // Animação principal do flipper
    const rotateY = tab === "picker" ? 180 : 0;

    return (
        <div className="relative">
            {/* Wrapper com perspectiva para o 3D */}
            <div
                className="relative w-full"
                style={{ perspective: 1200 }}
            >
                <motion.div
                    // o "cartão" que gira
                    className="relative w-full"
                    animate={
                        prefersReduced
                            ? { opacity: 1 } // fallback: sem rotação, só troca de face por opacidade
                            : { rotateY }
                    }
                    initial={false}
                    transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
                    style={{
                        transformStyle: "preserve-3d",
                        // ajuda a estabilizar rendering em alguns browsers
                        willChange: prefersReduced ? undefined : "transform",
                    }}
                >
                    {/* Face frontal: LIST */}
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
                        <SkillsListSection player={player} setPlayer={setPlayer} />
                    </div>

                    {/* Face traseira: PICKER (rotacionada 180º) */}
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
                        <SkillPickerSection player={player} setPlayer={setPlayer} />
                    </div>
                </motion.div>
            </div>

            {/* Botão flutuante mantém a mesma posição */}
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
