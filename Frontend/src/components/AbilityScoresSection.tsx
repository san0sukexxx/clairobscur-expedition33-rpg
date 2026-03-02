import { type RefObject, type MutableRefObject } from "react";
import { type GetPlayerResponse, type AbilityScores } from "../api/APIPlayer";
import { t } from "../i18n";
import { rollWithTimeout } from "../utils/RollUtils";
import type { DiceBoardRef } from "./DiceBoard";
import { diceTotal } from "../utils/DiceCalculator";
import { APIGameLog } from "../api/APIGameLog";
import { dispatchRoll } from "../utils/rollDispatcher";
import type { WeaponInfo } from "../api/ResponseModel";
import { calculateWeaponVitalityBonus, calculateWeaponDexterityBonus } from "../utils/WeaponCalculator";

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
    onRoll: () => void;
}

function StatCard({ label, score, onRoll }: StatCardProps) {
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
                <span className="font-bold text-sm">{score}</span>
            </div>
        </div>
    );
}

interface AbilityScoresSectionProps {
    player: GetPlayerResponse | null;
    setPlayer: React.Dispatch<React.SetStateAction<GetPlayerResponse | null>>;
    weaponInfo: WeaponInfo;
    diceBoardRef: RefObject<DiceBoardRef | null>;
    timeoutDiceBoardRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
}

export function AbilityScoresSection({ player, setPlayer: _, weaponInfo, diceBoardRef, timeoutDiceBoardRef }: AbilityScoresSectionProps) {
    function handleRoll(key: AbilityKey, label: string, score: number) {
        const mod = Math.floor((score - 10) / 2);
        const modStr = calcMod(score);
        rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, "1d20", (result) => {
            const roll = diceTotal(result);
            const total = roll + mod;
            const diceCommand = mod === 0 ? "1d20" : mod > 0 ? `1d20+${mod}` : `1d20${mod}`;
            dispatchRoll({ label, diceRolled: roll, modifier: mod, total, diceCommand });
            if (player?.id) {
                APIGameLog.create(player.id, {
                    rollType: "abilityCheck",
                    abilityKey: key,
                    diceRolled: roll,
                    modifier: mod,
                    total,
                    diceCommand,
                }).catch(() => {});
            }
        });
    }

    const scores = player?.playerSheet?.abilityScores ?? {};
    const weaponConBonus = calculateWeaponVitalityBonus(weaponInfo);
    const weaponDexBonus = calculateWeaponDexterityBonus(weaponInfo);

    function getEffectiveScore(key: AbilityKey, baseScore: number): number {
        if (key === "constitution") return Math.min(20, baseScore + weaponConBonus);
        if (key === "dexterity") return Math.min(20, baseScore + weaponDexBonus);
        return baseScore;
    }

    return (
        <div className="rounded-box bg-base-100 shadow p-4 overflow-visible">
            <div className="grid grid-cols-3 gap-4">
                {ABILITIES.map(({ key, labelKey }) => {
                    const label = t(labelKey);
                    const baseScore = scores[key] ?? 10;
                    const score = getEffectiveScore(key, baseScore);
                    return (
                        <StatCard
                            key={key}
                            label={label}
                            score={score}
                            onRoll={() => handleRoll(key, label, score)}
                        />
                    );
                })}
            </div>
        </div>
    );
}
