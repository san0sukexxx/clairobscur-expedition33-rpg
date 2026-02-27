import { useState, useEffect, type RefObject, type MutableRefObject } from "react";
import { APIPlayer, type GetPlayerResponse, type AbilityScores } from "../api/APIPlayer";
import { t } from "../i18n";
import { useToast } from "./Toast";
import { rollWithTimeout } from "../utils/RollUtils";
import type { DiceBoardRef } from "./DiceBoard";
import { diceTotal } from "../utils/DiceCalculator";

type AbilityKey = keyof AbilityScores;

const ABILITIES: { key: AbilityKey; labelKey: string }[] = [
    { key: "strength",     labelKey: "characterSheet.strength"     },
    { key: "dexterity",    labelKey: "characterSheet.dexterity"    },
    { key: "constitution", labelKey: "characterSheet.constitution" },
    { key: "intelligence", labelKey: "characterSheet.intelligence" },
    { key: "wisdom",       labelKey: "characterSheet.wisdom"       },
    { key: "charisma",     labelKey: "characterSheet.charisma"     },
];

function calcMod(score: number): string {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : String(mod);
}

interface StatCardProps {
    label: string;
    score: number;
    onChange: (v: number) => void;
    onRoll: () => void;
}

function StatCard({ label, score, onChange, onRoll }: StatCardProps) {
    const [inputValue, setInputValue] = useState(String(score));

    useEffect(() => {
        setInputValue(String(score));
    }, [score]);

    return (
        <div
            className="relative flex flex-col items-center gap-1 pt-2 pb-3 px-1 text-base-content bg-base-200"
            style={{ clipPath: "polygon(12% 0, 88% 0, 100% 9%, 100% 91%, 88% 100%, 12% 100%, 0 91%, 0 9%)" }}
        >
            {/* SVG frame — borders only */}
            <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 100 130"
                preserveAspectRatio="none"
                fill="none"
            >
                <path
                    d="M12 1.5 L88 1.5 L98.5 12 L98.5 118 L88 128.5 L12 128.5 L1.5 118 L1.5 12 Z"
                    stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.5"
                />
                <path
                    d="M15 5 L85 5 L95 15 L95 115 L85 125 L15 125 L5 115 L5 15 Z"
                    stroke="currentColor" strokeOpacity="0.3" strokeWidth="0.75"
                />
            </svg>

            {/* Attribute name */}
            <span className="relative z-10 text-[9px] font-extrabold tracking-[0.12em] opacity-80 uppercase text-center leading-tight">
                {label}
            </span>

            {/* Modifier box — clicável */}
            <button
                onClick={onRoll}
                className="relative z-10 self-stretch mx-2 rounded-lg border border-base-content/15 flex items-center justify-center py-1.5 cursor-pointer hover:brightness-110 active:scale-95 transition"
                style={{ background: "oklch(var(--b2))" }}
            >
                <span className="text-3xl font-black">{calcMod(score)}</span>
            </button>

            {/* Score oval */}
            <div
                className="relative z-10 flex items-center justify-center rounded-full border-2 border-base-content/40 w-10 h-7"
                style={{ background: "color-mix(in oklch, oklch(var(--b3)) 70%, oklch(var(--p)) 30%)" }}
            >
                <input
                    type="number"
                    min={1}
                    max={20}
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        const v = parseInt(e.target.value);
                        if (!isNaN(v) && v >= 1 && v <= 20) onChange(v);
                    }}
                    onBlur={() => {
                        const v = parseInt(inputValue);
                        if (isNaN(v) || v < 1) {
                            setInputValue(String(score));
                        } else if (v > 20) {
                            setInputValue("20");
                            onChange(20);
                        }
                    }}
                    className="w-10 bg-transparent text-center font-bold text-sm focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
            </div>
        </div>
    );
}

interface AbilityScoresSectionProps {
    player: GetPlayerResponse | null;
    setPlayer: React.Dispatch<React.SetStateAction<GetPlayerResponse | null>>;
    diceBoardRef: RefObject<DiceBoardRef | null>;
    timeoutDiceBoardRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
}

export function AbilityScoresSection({ player, setPlayer, diceBoardRef, timeoutDiceBoardRef }: AbilityScoresSectionProps) {
    const { showToast } = useToast();

    async function sync(p: GetPlayerResponse) {
        const scores = p.playerSheet?.abilityScores ?? {};
        await APIPlayer.update(p.id, {
            playerSheet: {
                ...p.playerSheet,
                abilityScoresData: JSON.stringify(scores),
            },
        });
    }

    async function handleChange(key: AbilityKey, value: number) {
        if (!player) return;
        const next = {
            ...player,
            playerSheet: {
                ...player.playerSheet,
                abilityScores: {
                    ...player.playerSheet?.abilityScores,
                    [key]: value,
                },
            },
        };
        setPlayer(next);
        await sync(next);
    }

    function handleRoll(label: string, score: number) {
        const mod = Math.floor((score - 10) / 2);
        const modStr = calcMod(score);
        rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, "1d20", (result) => {
            const roll = diceTotal(result);
            const total = roll + mod;
            showToast(`${label}: ${roll} ${modStr} = ${total}`);
        });
    }

    const scores = player?.playerSheet?.abilityScores ?? {};

    return (
        <div className="rounded-box bg-base-100 shadow p-4 overflow-visible">
            <div className="grid grid-cols-3 gap-4">
                {ABILITIES.map(({ key, labelKey }) => {
                    const label = t(labelKey);
                    const score = scores[key] ?? 10;
                    return (
                        <StatCard
                            key={key}
                            label={label}
                            score={score}
                            onChange={(v) => handleChange(key, v)}
                            onRoll={() => handleRoll(label, score)}
                        />
                    );
                })}
            </div>
        </div>
    );
}
