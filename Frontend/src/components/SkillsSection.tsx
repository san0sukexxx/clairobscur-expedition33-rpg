import { useCallback, useState, type RefObject, type MutableRefObject } from "react";
import { motion } from "framer-motion";
import { FaThumbtack } from "react-icons/fa";
import { APIPlayer, type GetPlayerResponse, type AbilityScores } from "../api/APIPlayer";
import { useToast } from "./Toast";
import { t } from "../i18n";
import { rollWithTimeout } from "../utils/RollUtils";
import type { DiceBoardRef } from "./DiceBoard";
import { diceTotal } from "../utils/DiceCalculator";
import { APIGameLog } from "../api/APIGameLog";
import { dispatchRoll } from "../utils/rollDispatcher";
import type { WeaponInfo } from "../api/ResponseModel";
import { calculateWeaponProficiencyBonus, calculateWeaponDexterityBonus } from "../utils/WeaponCalculator";
import { playerPictosTotalSpeed, playerPictosTotalHealth, playerPictosTotalStrength, playerPictosTotalIntelligence, playerPictosTotalWisdom, playerPictosTotalCharisma, abilityScoreCap } from "../utils/PlayerCalculator";
import PanelModal from "./PanelModal";

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

const SKILL_DESC_KEY: Record<string, string> = {
    acrobatics:     "skills.descAcrobatics",
    animalHandling: "skills.descAnimalHandling",
    arcana:         "skills.descArcana",
    athletics:      "skills.descAthletics",
    deception:      "skills.descDeception",
    history:        "skills.descHistory",
    insight:        "skills.descInsight",
    intimidation:   "skills.descIntimidation",
    investigation:  "skills.descInvestigation",
    medicine:       "skills.descMedicine",
    nature:         "skills.descNature",
    perception:     "skills.descPerception",
    performance:    "skills.descPerformance",
    persuasion:     "skills.descPersuasion",
    religion:       "skills.descReligion",
    sleightOfHand:  "skills.descSleightOfHand",
    stealth:        "skills.descStealth",
    survival:       "skills.descSurvival",
};

const ABILITY_I18N_KEY: Record<AbilityKey, string> = {
    strength:     "characterSheet.strength",
    dexterity:    "characterSheet.dexterity",
    constitution: "characterSheet.constitution",
    intelligence: "characterSheet.intelligence",
    wisdom:       "characterSheet.wisdom",
    charisma:     "characterSheet.charisma",
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
    weaponInfo: WeaponInfo;
    isAdmin: boolean;
    diceBoardRef: RefObject<DiceBoardRef | null>;
    timeoutDiceBoardRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
}

export default function SkillsSection({ player, setPlayer, weaponInfo, isAdmin, diceBoardRef, timeoutDiceBoardRef }: Props) {
    const { showToast } = useToast();
    const [descModal, setDescModal] = useState<{ id: string; labelKey: string } | null>(null);
    const scores   = player?.playerSheet?.abilityScores ?? {};
    const totalPts = player?.playerSheet?.totalPoints ?? 1;
    const pb       = profBonus(totalPts) + calculateWeaponProficiencyBonus(weaponInfo);
    const skillsMap = parseSkillsMap(player?.playerSheet?.skillsData);

    const pictoBonus: Record<AbilityKey, number> = {
        strength: playerPictosTotalStrength(player),
        dexterity: playerPictosTotalSpeed(player),
        constitution: playerPictosTotalHealth(player),
        intelligence: playerPictosTotalIntelligence(player),
        wisdom: playerPictosTotalWisdom(player),
        charisma: playerPictosTotalCharisma(player),
    };
    const weaponBonus: Record<AbilityKey, number> = {
        strength: 0, dexterity: calculateWeaponDexterityBonus(weaponInfo),
        constitution: 0, intelligence: 0, wisdom: 0, charisma: 0,
    };
    const cap = abilityScoreCap(player);
    function getEffectiveScore(key: AbilityKey, base: number) {
        return Math.min(cap, base + (pictoBonus[key] ?? 0) + (weaponBonus[key] ?? 0));
    }

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

    function handleRoll(skillId: string, ability: AbilityKey, labelKey: string, bonus: number) {
        const label = t(labelKey);
        const modDisplay = bonus >= 0 ? `+${bonus}` : String(bonus);
        rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, "1d20", (result) => {
            const roll = diceTotal(result);
            const total = roll + bonus;
            const diceCommand = bonus === 0 ? "1d20" : bonus > 0 ? `1d20+${bonus}` : `1d20${bonus}`;
            dispatchRoll({ label, diceRolled: roll, modifier: bonus, total, diceCommand });
            if (player?.id) {
                APIGameLog.create(player.id, {
                    rollType: "skill",
                    skillId,
                    abilityKey: ability,
                    diceRolled: roll,
                    modifier: bonus,
                    total,
                    diceCommand,
                }).catch(() => {});
            }
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
                    const baseScore  = scores[ability] ?? 10;
                    const score      = getEffectiveScore(ability, baseScore);
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
                                onClick={() => isAdmin && toggleProficient(id)}
                                disabled={!isAdmin}
                                className={`flex items-center justify-center ${!isAdmin ? "cursor-default" : ""}`}
                                aria-label={proficient ? t("skills.removeProficiency") : t("skills.addProficiency")}
                            >
                                <span className={`w-3.5 h-3.5 rounded-full border-2 transition-colors ${
                                    proficient
                                        ? "bg-base-content border-base-content"
                                        : "bg-transparent border-base-content/40"
                                }`} />
                            </button>

                            {/* MOD — click to roll */}
                            <button
                                onClick={() => handleRoll(id, ability, labelKey, bonus)}
                                className="text-[10px] font-bold uppercase text-base-content/50 text-center hover:text-primary transition-colors cursor-pointer"
                            >
                                {t(ABILITY_I18N_KEY[ability]).slice(0, 3)}
                            </button>

                            {/* SKILL name — click to show description */}
                            <button
                                onClick={() => setDescModal({ id, labelKey })}
                                className="text-sm text-left hover:text-primary transition-colors cursor-pointer"
                            >
                                {t(labelKey)}
                            </button>

                            {/* BONUS — click to roll */}
                            <button
                                onClick={() => handleRoll(id, ability, labelKey, bonus)}
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

            <PanelModal
                open={descModal !== null}
                onClose={() => setDescModal(null)}
                title={descModal ? t(descModal.labelKey) : ""}
                size="sm"
            >
                {descModal && (
                    <p className="text-sm leading-relaxed text-neutral-300">
                        {t(SKILL_DESC_KEY[descModal.id] ?? "")}
                    </p>
                )}
            </PanelModal>
        </div>
    );
}
