import { useState } from "react";
import { t } from "../../i18n";
import type { AbilityScores } from "../../api/APIPlayer";

type AbilityKey = keyof AbilityScores;

const ABILITY_KEYS: AbilityKey[] = [
    "strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma",
];

// D&D 5e standard point-buy cost table
const POINT_COST: Record<number, number> = {
    8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9,
};

const SCORES = [8, 9, 10, 11, 12, 13, 14, 15];
const TOTAL_POINTS = 27;

interface PointBuySetupProps {
    onConfirm: (scores: Required<AbilityScores>) => void;
}

export function PointBuySetup({ onConfirm }: PointBuySetupProps) {
    const [scores, setScores] = useState<Required<AbilityScores>>({
        strength: 8, dexterity: 8, constitution: 8,
        intelligence: 8, wisdom: 8, charisma: 8,
    });

    const usedPoints = Object.values(scores).reduce(
        (sum, s) => sum + (POINT_COST[s] ?? 0), 0
    );
    const remaining = TOTAL_POINTS - usedPoints;

    function handleChange(key: AbilityKey, value: number) {
        setScores(prev => ({ ...prev, [key]: value }));
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Points remaining */}
            <div className="flex flex-col items-center">
                <span className="text-[10px] font-extrabold tracking-[0.15em] uppercase opacity-60">
                    {t("setup.pointsRemaining")}
                </span>
                <span className="text-3xl font-black tabular-nums">
                    <span className={remaining < 0 ? "text-error" : ""}>{remaining}</span>
                    <span className="text-base-content/30"> / {TOTAL_POINTS}</span>
                </span>
            </div>

            {/* Ability columns */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {ABILITY_KEYS.map(key => {
                    const current = scores[key];
                    const currentCost = POINT_COST[current] ?? 0;

                    return (
                        <div key={key} className="flex flex-col items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wide">{t(`characterSheet.${key}`)}</span>

                            <select
                                className="select select-bordered select-sm w-full"
                                value={current}
                                onChange={(e) => handleChange(key, Number(e.target.value))}
                            >
                                {SCORES.map(score => {
                                    const cost = POINT_COST[score] ?? 0;
                                    const delta = cost - currentCost;
                                    const disabled = score !== current && delta > remaining;
                                    const costLabel = cost === 0
                                        ? String(score)
                                        : `${score} (-${cost} ${cost === 1 ? t("setup.point") : t("setup.points")})`;
                                    return (
                                        <option key={score} value={score} disabled={disabled}>
                                            {costLabel}
                                        </option>
                                    );
                                })}
                            </select>

                            <span className="text-xs font-bold tabular-nums">
                                {t("setup.total")}: {current}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-end">
                <button
                    onClick={() => onConfirm(scores)}
                    disabled={remaining < 0}
                    className="btn btn-ghost btn-sm"
                >
                    {t("setup.applyAbilityScores")}
                </button>
            </div>
        </div>
    );
}
