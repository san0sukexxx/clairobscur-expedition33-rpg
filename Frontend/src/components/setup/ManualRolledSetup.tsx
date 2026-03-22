import { useState, type RefObject, type MutableRefObject } from "react";
import { t } from "../../i18n";
import type { AbilityScores } from "../../api/APIPlayer";
import { rollWithTimeout } from "../../utils/RollUtils";
import type { DiceBoardRef } from "../DiceBoard";

type AbilityKey = keyof AbilityScores;

const ABILITY_KEYS: AbilityKey[] = [
    "strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma",
];

interface RollResult {
    dice: number[]; // 4 dice sorted descending; first 3 kept, last dropped
    total: number;
}

function processResult(raw: any): RollResult {
    const rolls: number[] = raw[0]?.rolls?.map((r: any) => r.value as number) ?? [];
    const sorted = [...rolls].sort((a, b) => b - a);
    const total = sorted[0] + sorted[1] + sorted[2];
    return { dice: sorted, total };
}

interface ManualRolledSetupProps {
    diceBoardRef: RefObject<DiceBoardRef | null>;
    timeoutDiceBoardRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
    onConfirm: (scores: Required<AbilityScores>) => void;
}

export function ManualRolledSetup({ diceBoardRef, timeoutDiceBoardRef, onConfirm }: ManualRolledSetupProps) {
    const [rolls, setRolls] = useState<(RollResult | null)[]>(Array(6).fill(null));
    const [assignments, setAssignments] = useState<(AbilityKey | "")[]>(Array(6).fill(""));
    const [rolling, setRolling] = useState<Set<number>>(new Set());

    function handleRoll(i: number) {
        setRolling(prev => new Set(prev).add(i));
        rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, "4d6", (result) => {
            const roll = processResult(result);
            setRolls(prev => {
                const next = [...prev];
                next[i] = roll;
                return next;
            });
            setAssignments(prev => {
                const next = [...prev];
                next[i] = "";
                return next;
            });
            setRolling(prev => {
                const next = new Set(prev);
                next.delete(i);
                return next;
            });
        });
    }

    function handleAssign(i: number, key: AbilityKey | "") {
        setAssignments(prev => {
            const next = [...prev];
            next[i] = key;
            return next;
        });
    }

    function handleReset() {
        setRolls(Array(6).fill(null));
        setAssignments(Array(6).fill(""));
    }

    function takenAbilities(currentIndex: number): Set<AbilityKey> {
        const taken = new Set<AbilityKey>();
        assignments.forEach((a, i) => {
            if (i !== currentIndex && a !== "") taken.add(a as AbilityKey);
        });
        return taken;
    }

    const allDone = rolls.every(r => r !== null) &&
        assignments.every(a => a !== "") &&
        new Set(assignments).size === 6;

    function handleApply() {
        if (!allDone) return;
        const scores = {} as Required<AbilityScores>;
        assignments.forEach((key, i) => {
            if (key && rolls[i]) scores[key as AbilityKey] = rolls[i]!.total;
        });
        onConfirm(scores);
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {Array.from({ length: 6 }, (_, i) => {
                    const roll = rolls[i];
                    const isRolling = rolling.has(i);
                    const taken = takenAbilities(i);
                    const current = assignments[i];

                    return (
                        <div key={i} className="flex flex-col items-center gap-2">
                            {isRolling ? (
                                <>
                                    <span className="text-2xl font-black text-base-content/30">--</span>
                                    <div className="h-[22px] flex items-center">
                                        <span className="loading loading-dots loading-xs" />
                                    </div>
                                    <button disabled className="btn btn-success btn-sm w-full">
                                        {t("setup.roll")}
                                    </button>
                                </>
                            ) : roll ? (
                                <>
                                    <span className="text-2xl font-black tabular-nums">
                                        {roll.total}
                                    </span>
                                    <div className="flex gap-0.5 flex-wrap justify-center">
                                        {roll.dice.map((d, di) => (
                                            <span
                                                key={di}
                                                className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                                                    di < 3
                                                        ? "bg-primary text-primary-content"
                                                        : "bg-base-300 text-base-content/40"
                                                }`}
                                            >
                                                {d}
                                            </span>
                                        ))}
                                    </div>
                                    <select
                                        className="select select-bordered select-sm w-full"
                                        value={current}
                                        onChange={(e) => handleAssign(i, e.target.value as AbilityKey | "")}
                                    >
                                        <option value="">--</option>
                                        {ABILITY_KEYS
                                            .filter(key => !taken.has(key))
                                            .map(key => (
                                                <option key={key} value={key}>{t(`characterSheet.${key}`)}</option>
                                            ))
                                        }
                                        {current !== "" && taken.has(current as AbilityKey) && (
                                            <option value={current}>
                                                {t(`characterSheet.${current}`)}
                                            </option>
                                        )}
                                    </select>
                                </>
                            ) : (
                                <>
                                    <span className="text-2xl font-black text-base-content/30">--</span>
                                    <div className="h-[22px]" />
                                    <button
                                        onClick={() => handleRoll(i)}
                                        className="btn btn-success btn-sm w-full"
                                    >
                                        {t("setup.roll")}
                                    </button>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-end gap-2">
                <button onClick={handleReset} className="btn btn-ghost btn-sm">
                    {t("setup.resetGroup")}
                </button>
                <button
                    onClick={handleApply}
                    disabled={!allDone}
                    className="btn btn-ghost btn-sm"
                >
                    {t("setup.applyAbilityScores")}
                </button>
            </div>
        </div>
    );
}
