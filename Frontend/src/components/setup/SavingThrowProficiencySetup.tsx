import { useState } from "react";
import { APIPlayer, type GetPlayerResponse } from "../../api/APIPlayer";
import { useToast } from "../Toast";
import { t } from "../../i18n";

type AbilityKey = "strength" | "dexterity" | "constitution" | "intelligence" | "wisdom" | "charisma";

const ABILITIES: { key: AbilityKey; labelKey: string; abbr: string }[] = [
    { key: "strength",     labelKey: "characterSheet.strength",     abbr: "STR" },
    { key: "dexterity",    labelKey: "characterSheet.dexterity",     abbr: "DEX" },
    { key: "constitution", labelKey: "characterSheet.constitution",  abbr: "CON" },
    { key: "intelligence", labelKey: "characterSheet.intelligence",  abbr: "INT" },
    { key: "wisdom",       labelKey: "characterSheet.wisdom",        abbr: "WIS" },
    { key: "charisma",     labelKey: "characterSheet.charisma",      abbr: "CHA" },
];

const MAX_SELECTIONS = 2;

interface Props {
    player: GetPlayerResponse | null;
    setPlayer: React.Dispatch<React.SetStateAction<GetPlayerResponse | null>>;
}

export function SavingThrowProficiencySetup({ player, setPlayer }: Props) {
    const { showToast } = useToast();
    const [selected, setSelected] = useState<Set<AbilityKey>>(new Set());
    const [saving, setSaving] = useState(false);

    function toggle(key: AbilityKey) {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else if (next.size < MAX_SELECTIONS) {
                next.add(key);
            }
            return next;
        });
    }

    async function handleConfirm() {
        if (!player || selected.size !== MAX_SELECTIONS) return;
        setSaving(true);
        try {
            const proficiencies = Array.from(selected);
            await APIPlayer.update(player.id, {
                playerSheet: {
                    ...player.playerSheet,
                    savingThrowProficiencies: proficiencies,
                },
            });
            await APIPlayer.updateSetupProgress(player.id, "savingThrowProficiency", true);

            setPlayer({
                ...player,
                playerSheet: {
                    ...player.playerSheet,
                    savingThrowProficiencies: proficiencies,
                },
                setupProgress: [
                    ...(player.setupProgress?.filter(s => s.section !== "savingThrowProficiency") ?? []),
                    { section: "savingThrowProficiency", done: true },
                ],
            });
        } catch {
            showToast(t("common.errorSaving"));
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="rounded-box bg-base-100 shadow p-4 flex flex-col gap-4">
            <div>
                <h2 className="text-2xl font-bold">{t("setup.savingThrowProficiencyTitle")}</h2>
                <p className="text-sm opacity-60 mt-1">{t("setup.savingThrowProficiencyDesc")}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ABILITIES.map(({ key, labelKey, abbr }) => {
                    const isSelected = selected.has(key);
                    const isDisabled = !isSelected && selected.size >= MAX_SELECTIONS;
                    return (
                        <button
                            key={key}
                            onClick={() => toggle(key)}
                            disabled={isDisabled || saving}
                            className={`
                                flex items-center gap-3 rounded-lg px-4 py-3 border-2 transition text-left
                                ${isSelected
                                    ? "border-primary bg-primary/10 text-primary"
                                    : isDisabled
                                        ? "border-base-300 bg-base-200 opacity-40 cursor-not-allowed"
                                        : "border-base-300 bg-base-200 hover:border-primary/50"}
                            `}
                        >
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition ${isSelected ? "border-primary bg-primary" : "border-base-content/30"}`}>
                                {isSelected && (
                                    <svg className="w-2.5 h-2.5 text-primary-content" viewBox="0 0 10 10" fill="none">
                                        <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                )}
                            </div>
                            <div>
                                <span className="text-xs font-black tracking-widest uppercase opacity-60 block">{abbr}</span>
                                <span className="text-sm font-semibold">{t(labelKey)}</span>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="flex items-center justify-between">
                <span className="text-sm opacity-50">
                    {selected.size} / {MAX_SELECTIONS} {t("setup.savingThrowProficiencySelected")}
                </span>
                <button
                    onClick={handleConfirm}
                    disabled={selected.size !== MAX_SELECTIONS || saving}
                    className="btn btn-primary btn-sm"
                >
                    {saving
                        ? <span className="loading loading-spinner loading-xs" />
                        : t("setup.savingThrowProficiencyConfirm")}
                </button>
            </div>
        </div>
    );
}
