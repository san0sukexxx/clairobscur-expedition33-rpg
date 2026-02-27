import { useState } from "react";
import { t } from "../../i18n";
import type { AbilityScores } from "../../api/APIPlayer";

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

type AbilityKey = keyof AbilityScores;

const ABILITIES: { key: AbilityKey; labelKey: string }[] = [
    { key: "strength",     labelKey: "characterSheet.strength"     },
    { key: "dexterity",    labelKey: "characterSheet.dexterity"    },
    { key: "constitution", labelKey: "characterSheet.constitution" },
    { key: "intelligence", labelKey: "characterSheet.intelligence" },
    { key: "wisdom",       labelKey: "characterSheet.wisdom"       },
    { key: "charisma",     labelKey: "characterSheet.charisma"     },
];

type Assignments = Partial<Record<AbilityKey, number>>;

interface StandardArraySetupProps {
    onConfirm: (scores: Required<AbilityScores>) => void;
}

export function StandardArraySetup({ onConfirm }: StandardArraySetupProps) {
    const [assignments, setAssignments] = useState<Assignments>({});

    function handleChange(key: AbilityKey, raw: string) {
        const next = { ...assignments };
        if (raw === "") {
            delete next[key];
        } else {
            next[key] = parseInt(raw);
        }
        setAssignments(next);
    }

    // Values already assigned to OTHER abilities
    function takenValues(currentKey: AbilityKey): Set<number> {
        const taken = new Set<number>();
        for (const [k, v] of Object.entries(assignments)) {
            if (k !== currentKey && v !== undefined) taken.add(v);
        }
        return taken;
    }

    const allAssigned = ABILITIES.every(({ key }) => assignments[key] !== undefined);

    function handleConfirm() {
        if (!allAssigned) return;
        onConfirm({
            strength:     assignments.strength!,
            dexterity:    assignments.dexterity!,
            constitution: assignments.constitution!,
            intelligence: assignments.intelligence!,
            wisdom:       assignments.wisdom!,
            charisma:     assignments.charisma!,
        });
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Ability selects */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {ABILITIES.map(({ key, labelKey }) => {
                    const taken = takenValues(key);
                    const current = assignments[key];
                    const availableOptions = STANDARD_ARRAY.filter(v => !taken.has(v));

                    return (
                        <div key={key} className="flex flex-col gap-1">
                            <span className="text-[11px] font-extrabold tracking-wider uppercase">
                                {t(labelKey)}
                            </span>
                            <select
                                className="select select-bordered select-sm w-full"
                                value={current ?? ""}
                                onChange={(e) => handleChange(key, e.target.value)}
                            >
                                <option value="">--</option>
                                {availableOptions.map(v => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                                {/* Keep current value visible even if "taken" check would hide it */}
                                {current !== undefined && !availableOptions.includes(current) && (
                                    <option value={current}>{current}</option>
                                )}
                            </select>
                            <span className="text-[10px] font-bold text-center uppercase opacity-60">
                                {t("setup.total")}: {current ?? "--"}
                            </span>
                        </div>
                    );
                })}
            </div>

            <button
                onClick={handleConfirm}
                disabled={!allAssigned}
                className="btn btn-primary w-full"
            >
                {t("setup.confirmAbilityScores")}
            </button>
        </div>
    );
}
