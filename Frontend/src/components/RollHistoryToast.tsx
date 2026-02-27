import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { GiDiceTwentyFacesTwenty } from "react-icons/gi";
import type { RollEvent } from "../utils/rollDispatcher";

const BORDER = "rgba(34, 211, 238, 0.65)";
const GLOW   = "rgba(34, 211, 238, 0.12)";

function CompactCard({ entry }: { entry: RollEvent }) {
    return (
        <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-base-300"
            style={{ border: `1px solid ${BORDER}`, boxShadow: `0 0 8px ${GLOW}` }}
        >
            <span className="text-xs font-extrabold text-success flex-1 truncate tracking-wide">
                {entry.label}
            </span>
            <span className="text-xl font-black tabular-nums">{entry.total}</span>
        </div>
    );
}

function ExpandedCard({ entry }: { entry: RollEvent }) {
    const formula =
        entry.modifier === 0
            ? String(entry.diceRolled)
            : entry.modifier > 0
            ? `${entry.diceRolled}+${entry.modifier}`
            : `${entry.diceRolled}${entry.modifier}`;

    return (
        <div
            className="px-3 py-3 rounded-lg bg-base-300"
            style={{
                border: `1.5px solid ${BORDER}`,
                boxShadow: `0 0 18px ${GLOW}, inset 0 0 8px rgba(34,211,238,0.04)`,
            }}
        >
            <p className="text-[11px] font-extrabold text-success tracking-widest uppercase mb-2">
                {entry.label}
            </p>
            <div className="flex items-center gap-3">
                <GiDiceTwentyFacesTwenty className="text-3xl opacity-50 shrink-0" />
                <span className="text-2xl font-black tabular-nums">{formula}</span>
                <span className="ml-auto text-4xl font-black tabular-nums">= {entry.total}</span>
            </div>
            <p className="text-[10px] opacity-35 mt-1.5 font-mono">{entry.diceCommand}</p>
        </div>
    );
}

export function RollHistoryToast() {
    const [history, setHistory] = useState<RollEvent[]>([]);
    const [visible, setVisible] = useState(false);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        function handleRoll(e: Event) {
            const roll = (e as CustomEvent<RollEvent>).detail;
            setHistory(prev => [...prev, roll].slice(-3));
            setVisible(true);
            if (hideTimer.current) clearTimeout(hideTimer.current);
            hideTimer.current = setTimeout(() => setVisible(false), 7000);
        }
        window.addEventListener("roll-result", handleRoll);
        return () => {
            window.removeEventListener("roll-result", handleRoll);
            if (hideTimer.current) clearTimeout(hideTimer.current);
        };
    }, []);

    if (history.length === 0) return null;

    return createPortal(
        <motion.div
            className="fixed bottom-4 left-4 z-[9000] flex flex-col gap-2 w-64 pointer-events-none select-none"
            animate={{ opacity: visible ? 1 : 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            <AnimatePresence initial={false} mode="popLayout">
                {history.map((entry, i) => {
                    const isLatest = i === history.length - 1;
                    const opacity = isLatest ? 1 : i === history.length - 2 ? 0.65 : 0.4;
                    return (
                        <motion.div
                            key={entry.id}
                            layout
                            initial={{ opacity: 0, y: 24, scale: 0.93 }}
                            animate={{ opacity, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.95 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                        >
                            {isLatest
                                ? <ExpandedCard entry={entry} />
                                : <CompactCard entry={entry} />
                            }
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </motion.div>,
        document.body
    );
}
