import { useCallback, type RefObject, type MutableRefObject } from "react";
import { motion } from "framer-motion";
import { FaThumbtack } from "react-icons/fa";
import { APIPlayer, type GetPlayerResponse, type AbilityScores } from "../api/APIPlayer";
import { useToast } from "./Toast";
import { t } from "../i18n";
import { rollWithTimeout } from "../utils/RollUtils";
import type { DiceBoardRef } from "./DiceBoard";
import { diceTotal } from "../utils/DiceCalculator";

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

const MOD_LABEL: Record<AbilityKey, string> = {
    strength:     "STR",
    dexterity:    "DEX",
    constitution: "CON",
    intelligence: "INT",
    wisdom:       "WIS",
    charisma:     "CHA",
};

function calcMod(score: number) {
    return Math.floor((score - 10) / 2);
}

function profBonus(totalPoints: number) {
    return Math.floor((Math.max(1, totalPoints) - 1) / 4) + 2;
}

function bonusStr(n: number) {
    return n >= 0 ? `+${n}` : String(n);
}

interface SkillEntry {
    proficient: boolean;
    pinned: boolean;
}

type SkillsMap = Record<string, SkillEntry>;

function parseSkillsMap(raw?: string): SkillsMap {
    if (!raw) return {};
    try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        const map: SkillsMap = {};
        for (const [key, value] of Object.entries(parsed)) {
            if (typeof value === "boolean") {
                // Legacy v1: just a boolean for proficiency
                map[key] = { proficient: value, pinned: false };
            } else if (value !== null && typeof value === "object") {
                const obj = value as Record<string, unknown>;
                map[key] = {
                    proficient: obj.proficient === true,
                    pinned: obj.pinned === true,
                };
            }
        }
        return map;
    } catch { return {}; }
}

interface Props {
    player: GetPlayerResponse | null;
    setPlayer: React.Dispatch<React.SetStateAction<GetPlayerResponse | null>>;
    diceBoardRef: RefObject<DiceBoardRef | null>;
    timeoutDiceBoardRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
}

export default function SkillsSection({ player, setPlayer, diceBoardRef, timeoutDiceBoardRef }: Props) {
    const { showToast } = useToast();
    const scores   = player?.playerSheet?.abilityScores ?? {};
    const totalPts = player?.playerSheet?.totalPoints ?? 1;
    const pb       = profBonus(totalPts);
    const skillsMap = parseSkillsMap(player?.playerSheet?.skillsData);

    const save = useCallback(async (nextMap: SkillsMap) => {
        if (!player) return;
        const raw = JSON.stringify(nextMap);
        const updated: GetPlayerResponse = {
            ...player,
            playerSheet: { ...player.playerSheet, skillsData: raw },
        };
        setPlayer(updated);
        try {
            await APIPlayer.update(player.id, {
                playerSheet: { ...player.playerSheet, skillsData: raw },
            });
        } catch {
            showToast(t("skills.saveError"));
            setPlayer(player);
        }
    }, [player, setPlayer, showToast]);

    function toggleProficient(id: string) {
        const prev = skillsMap[id] ?? { proficient: false, pinned: false };
        save({ ...skillsMap, [id]: { ...prev, proficient: !prev.proficient } });
    }

    function togglePinned(id: string) {
        const prev = skillsMap[id] ?? { proficient: false, pinned: false };
        save({ ...skillsMap, [id]: { ...prev, pinned: !prev.pinned } });
    }

    function handleRoll(labelKey: string, bonus: number) {
        const label = t(labelKey);
        const mod = bonus >= 0 ? `+${bonus}` : String(bonus);
        rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, "1d20", (result) => {
            const roll = diceTotal(result);
            showToast(`${label}: ${roll} ${mod} = ${roll + bonus}`);
        });
    }

    const sortedSkills = [...SKILLS].sort((a, b) => {
        const aPinned = skillsMap[a.id]?.pinned === true;
        const bPinned = skillsMap[b.id]?.pinned === true;
        if (aPinned !== bPinned) return aPinned ? -1 : 1;
        return t(a.labelKey).localeCompare(t(b.labelKey));
    });

    return (
        <div className="rounded-box bg-base-100 shadow p-4">
            <div className="flex items-center justify-between mb-3">
                <p className="text-[9px] font-extrabold tracking-widest opacity-70 uppercase">
                    {t("skills.title")}
                </p>
                <span className="text-[10px] font-bold opacity-50 uppercase">
                    {t("skills.profBonus")}: {bonusStr(pb)}
                </span>
            </div>

            {/* Header */}
            <div className="grid grid-cols-[1.5rem_2rem_3rem_1fr_3.5rem] gap-x-2 mb-1 px-1">
                <span className="text-[9px] font-bold uppercase opacity-50 text-center">{t("skills.colPin")}</span>
                <span className="text-[9px] font-bold uppercase opacity-50 text-center">{t("skills.colProf")}</span>
                <span className="text-[9px] font-bold uppercase opacity-50 text-center">{t("skills.colMod")}</span>
                <span className="text-[9px] font-bold uppercase opacity-50">{t("skills.colSkill")}</span>
                <span className="text-[9px] font-bold uppercase opacity-50 text-right">{t("skills.colBonus")}</span>
            </div>

            {/* Rows */}
            <div className="flex flex-col">
                {sortedSkills.map(({ id, ability, labelKey }) => {
                    const entry      = skillsMap[id] ?? { proficient: false, pinned: false };
                    const { proficient, pinned } = entry;
                    const score      = scores[ability] ?? 10;
                    const mod        = calcMod(score);
                    const bonus      = mod + (proficient ? pb : 0);

                    return (
                        <motion.div
                            key={id}
                            layout
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            className="grid grid-cols-[1.5rem_2rem_3rem_1fr_3.5rem] gap-x-2 items-center py-2 px-1 border-b border-base-200 last:border-b-0"
                        >
                            {/* PIN */}
                            <button
                                onClick={() => togglePinned(id)}
                                className="flex items-center justify-center"
                                aria-label={pinned ? t("skills.unpin") : t("skills.pin")}
                            >
                                <FaThumbtack className={`text-sm transition-all ${
                                    pinned
                                        ? "text-base-content"
                                        : "text-base-content/30 rotate-45"
                                }`} />
                            </button>

                            {/* PROF dot */}
                            <button
                                onClick={() => toggleProficient(id)}
                                className="flex items-center justify-center"
                                aria-label={proficient ? t("skills.removeProficiency") : t("skills.addProficiency")}
                            >
                                <span className={`w-3.5 h-3.5 rounded-full border-2 transition-colors ${
                                    proficient
                                        ? "bg-base-content border-base-content"
                                        : "bg-transparent border-base-content/40"
                                }`} />
                            </button>

                            {/* MOD */}
                            <span className="text-[10px] font-bold uppercase text-base-content/50 text-center">
                                {MOD_LABEL[ability]}
                            </span>

                            {/* SKILL name — click to roll */}
                            <button
                                onClick={() => handleRoll(labelKey, bonus)}
                                className="text-sm text-left hover:text-primary transition-colors cursor-pointer"
                            >
                                {t(labelKey)}
                            </button>

                            {/* BONUS — click to roll */}
                            <button
                                onClick={() => handleRoll(labelKey, bonus)}
                                className="ml-auto flex items-center justify-center w-12 h-7 rounded border border-base-content/30 bg-base-200 hover:border-primary hover:text-primary transition-colors cursor-pointer"
                            >
                                <span className="text-sm font-bold tabular-nums">
                                    {bonusStr(bonus)}
                                </span>
                            </button>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
