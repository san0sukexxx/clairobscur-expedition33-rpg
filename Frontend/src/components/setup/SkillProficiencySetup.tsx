import { useState } from "react";
import { APIPlayer, type GetPlayerResponse, type AbilityScores } from "../../api/APIPlayer";
import { useToast } from "../Toast";
import { t } from "../../i18n";

type AbilityKey = keyof AbilityScores;

interface SkillDef {
    id: string;
    ability: AbilityKey;
    labelKey: string;
}

const SKILLS: SkillDef[] = [
    { id: "acrobatics",    ability: "dexterity",    labelKey: "skills.acrobatics"    },
    { id: "animalHandling",ability: "wisdom",       labelKey: "skills.animalHandling" },
    { id: "arcana",        ability: "intelligence", labelKey: "skills.arcana"         },
    { id: "athletics",     ability: "strength",     labelKey: "skills.athletics"      },
    { id: "deception",     ability: "charisma",     labelKey: "skills.deception"      },
    { id: "history",       ability: "intelligence", labelKey: "skills.history"        },
    { id: "insight",       ability: "wisdom",       labelKey: "skills.insight"        },
    { id: "intimidation",  ability: "charisma",     labelKey: "skills.intimidation"   },
    { id: "investigation", ability: "intelligence", labelKey: "skills.investigation"  },
    { id: "medicine",      ability: "wisdom",       labelKey: "skills.medicine"       },
    { id: "nature",        ability: "intelligence", labelKey: "skills.nature"         },
    { id: "perception",    ability: "wisdom",       labelKey: "skills.perception"     },
    { id: "performance",   ability: "charisma",     labelKey: "skills.performance"    },
    { id: "persuasion",    ability: "charisma",     labelKey: "skills.persuasion"     },
    { id: "religion",      ability: "intelligence", labelKey: "skills.religion"       },
    { id: "sleightOfHand", ability: "dexterity",    labelKey: "skills.sleightOfHand"  },
    { id: "stealth",       ability: "dexterity",    labelKey: "skills.stealth"        },
    { id: "survival",      ability: "wisdom",       labelKey: "skills.survival"       },
];

const ABILITY_I18N_KEY: Record<AbilityKey, string> = {
    strength: "characterSheet.strength", dexterity: "characterSheet.dexterity",
    constitution: "characterSheet.constitution", intelligence: "characterSheet.intelligence",
    wisdom: "characterSheet.wisdom", charisma: "characterSheet.charisma",
};

const MAX_SELECTIONS = 5;

const CLASS_SKILLS: Record<string, string[]> = {
    verso:   ["acrobatics", "athletics", "history", "insight", "intimidation", "perception", "survival"],
    gustave: ["acrobatics", "athletics", "history", "insight", "intimidation", "perception", "survival"],
    maelle:  ["acrobatics", "athletics", "deception", "stealth", "intimidation", "insight", "investigation", "perception", "persuasion", "sleightOfHand"],
    sciel:   ["arcana", "deception", "history", "intimidation", "investigation", "nature", "religion"],
    monoco:  ["arcana", "athletics", "insight", "medicine", "nature", "perception", "religion", "survival"],
    lune:    ["arcana", "history", "insight", "investigation", "medicine", "religion"],
};

interface Props {
    player: GetPlayerResponse | null;
    setPlayer: React.Dispatch<React.SetStateAction<GetPlayerResponse | null>>;
}

export function SkillProficiencySetup({ player, setPlayer }: Props) {
    const { showToast } = useToast();
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);

    function toggle(id: string) {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else if (next.size < MAX_SELECTIONS) {
                next.add(id);
            }
            return next;
        });
    }

    async function handleConfirm() {
        if (!player || selected.size !== MAX_SELECTIONS) return;
        setSaving(true);
        try {
            // Build skillsData merging with any existing entries
            const existing: Record<string, { proficient: boolean; pinned: boolean }> = (() => {
                try { return JSON.parse(player.playerSheet?.skillsData ?? "{}"); } catch { return {}; }
            })();

            const nextMap = { ...existing };
            for (const skill of SKILLS) {
                nextMap[skill.id] = {
                    proficient: selected.has(skill.id),
                    pinned: existing[skill.id]?.pinned ?? false,
                };
            }

            const skillsData = JSON.stringify(nextMap);

            await APIPlayer.update(player.id, {
                playerSheet: { ...player.playerSheet, skillsData },
            });
            await APIPlayer.updateSetupProgress(player.id, "skillProficiency", true);

            setPlayer({
                ...player,
                playerSheet: { ...player.playerSheet, skillsData },
                setupProgress: [
                    ...(player.setupProgress?.filter(s => s.section !== "skillProficiency") ?? []),
                    { section: "skillProficiency", done: true },
                ],
            });
        } catch {
            showToast(t("common.errorSaving"));
        } finally {
            setSaving(false);
        }
    }

    const characterId = player?.playerSheet?.characterId?.toLowerCase() ?? "";
    const allowedIds = CLASS_SKILLS[characterId];
    const availableSkills = allowedIds ? SKILLS.filter(s => allowedIds.includes(s.id)) : SKILLS;
    const sorted = [...availableSkills].sort((a, b) => t(a.labelKey).localeCompare(t(b.labelKey)));

    return (
        <div className="rounded-box bg-base-100 shadow p-4 flex flex-col gap-4">
            <div>
                <h2 className="text-2xl font-bold">{t("skills.proficiencySetupTitle")}</h2>
                <p className="text-sm opacity-60 mt-1">{t("skills.proficiencySetupDesc")}</p>
            </div>

            <div className="flex flex-col divide-y divide-base-200">
                {sorted.map(({ id, ability, labelKey }) => {
                    const isSelected = selected.has(id);
                    const isDisabled = !isSelected && selected.size >= MAX_SELECTIONS;
                    return (
                        <button
                            key={id}
                            onClick={() => toggle(id)}
                            disabled={isDisabled || saving}
                            className={`
                                flex items-center gap-3 py-2.5 px-2 rounded transition text-left
                                ${isSelected ? "text-primary" : isDisabled ? "opacity-35 cursor-not-allowed" : "hover:bg-base-200"}
                            `}
                        >
                            {/* Proficiency dot */}
                            <span className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 transition-colors ${
                                isSelected ? "bg-primary border-primary" : "border-base-content/40"
                            }`} />

                            {/* Ability badge */}
                            <span className="text-[9px] font-black tracking-widest uppercase opacity-50 w-7 shrink-0">
                                {t(ABILITY_I18N_KEY[ability]).slice(0, 3)}
                            </span>

                            {/* Skill name */}
                            <span className="text-sm font-semibold flex-1">{t(labelKey)}</span>
                        </button>
                    );
                })}
            </div>

            <div className="flex items-center justify-between pt-1">
                <span className="text-sm opacity-50">
                    {selected.size} / {MAX_SELECTIONS} {t("skills.proficiencySetupSelected")}
                </span>
                <button
                    onClick={handleConfirm}
                    disabled={selected.size !== MAX_SELECTIONS || saving}
                    className="btn btn-primary btn-sm"
                >
                    {saving
                        ? <span className="loading loading-spinner loading-xs" />
                        : t("skills.proficiencySetupConfirm")}
                </button>
            </div>
        </div>
    );
}
