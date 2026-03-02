import type { RefObject, MutableRefObject } from "react";
import type { GetPlayerResponse, AbilityScores } from "../api/APIPlayer";
import type { DiceBoardRef } from "./DiceBoard";
import { rollWithTimeout } from "../utils/RollUtils";
import { diceTotal } from "../utils/DiceCalculator";
import { t } from "../i18n";
import { APIGameLog } from "../api/APIGameLog";
import { dispatchRoll } from "../utils/rollDispatcher";
import type { WeaponInfo } from "../api/ResponseModel";
import { calculateWeaponProficiencyBonus } from "../utils/WeaponCalculator";
import { calculateProficiencyBonus } from "../utils/AttackCalculator";

type AbilityKey = keyof AbilityScores;

const SAVING_THROWS: { key: AbilityKey; labelKey: string }[] = [
    { key: "strength",     labelKey: "characterSheet.strength"     },
    { key: "dexterity",    labelKey: "characterSheet.dexterity"    },
    { key: "constitution", labelKey: "characterSheet.constitution" },
    { key: "intelligence", labelKey: "characterSheet.intelligence" },
    { key: "wisdom",       labelKey: "characterSheet.wisdom"       },
    { key: "charisma",     labelKey: "characterSheet.charisma"     },
];

function calcMod(score: number) {
    return Math.floor((score - 10) / 2);
}

function modStr(mod: number) {
    return mod >= 0 ? `+${mod}` : String(mod);
}

/* ── Saving throw row ── */
function SavingThrowRow({ label, mod, proficient, onRoll }: { label: string; mod: number; proficient: boolean; onRoll: () => void }) {
    return (
        <button
            onClick={onRoll}
            className="relative flex items-center bg-base-200 text-base-content hover:brightness-110 active:scale-95 transition cursor-pointer h-11"
            style={{ clipPath: "polygon(5% 0%, 95% 0%, 100% 18%, 100% 82%, 95% 100%, 5% 100%, 0% 82%, 0% 18%)" }}
        >
            {/* SVG decorative border */}
            <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 160 44"
                preserveAspectRatio="none"
                fill="none"
            >
                <path
                    d="M8 1.5 L152 1.5 L158.5 8 L158.5 36 L152 42.5 L8 42.5 L1.5 36 L1.5 8 Z"
                    stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.5"
                />
                <path
                    d="M10 4 L150 4 L156 10 L156 34 L150 40 L10 40 L4 34 L4 10 Z"
                    stroke="currentColor" strokeOpacity="0.2" strokeWidth="0.75"
                />
                <line x1="108" y1="6" x2="108" y2="38" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" />
                <path
                    d="M110 6 L151 6 L155 10 L155 34 L151 38 L110 38 Z"
                    stroke="currentColor" strokeOpacity="0.2" strokeWidth="0.75"
                />
            </svg>

            {/* Proficiency indicator */}
            <div className={`relative z-10 ml-3 w-2.5 h-2.5 rounded-full border-2 shrink-0 ${
                proficient ? "bg-primary border-primary" : "border-base-content/40"
            }`} />

            {/* Label */}
            <span className="relative z-10 flex-1 text-[9px] font-extrabold tracking-wide uppercase opacity-75 text-left px-2 leading-tight truncate">
                {label}
            </span>

            {/* Modifier value — right box */}
            <div className="relative z-10 w-12 flex items-center justify-center shrink-0">
                <span className={`text-base font-black ${proficient ? "text-primary" : ""}`}>
                    {modStr(mod)}
                </span>
            </div>
        </button>
    );
}

interface Props {
    player: GetPlayerResponse | null;
    weaponInfo: WeaponInfo;
    diceBoardRef: RefObject<DiceBoardRef | null>;
    timeoutDiceBoardRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
}

export function SavingThrowsSection({ player, weaponInfo, diceBoardRef, timeoutDiceBoardRef }: Props) {
    const scores = player?.playerSheet?.abilityScores ?? {};
    const proficiencies = player?.playerSheet?.savingThrowProficiencies ?? [];
    const level = player?.playerSheet?.totalPoints ?? 1;
    const proficiencyBonus = calculateProficiencyBonus(level) + calculateWeaponProficiencyBonus(weaponInfo);

    function roll(key: AbilityKey, label: string, mod: number) {
        rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, "1d20", (result) => {
            const rolled = diceTotal(result);
            const total = rolled + mod;
            const diceCommand = mod === 0 ? "1d20" : mod > 0 ? `1d20+${mod}` : `1d20${mod}`;
            const abbr = label.slice(0, 3).toUpperCase();
            dispatchRoll({ label: `${abbr}: ${t("gameLog.save")}`, diceRolled: rolled, modifier: mod, total, diceCommand });
            if (player?.id) {
                APIGameLog.create(player.id, {
                    rollType: "savingThrow",
                    abilityKey: key,
                    diceRolled: rolled,
                    modifier: mod,
                    total,
                    diceCommand,
                }).catch(() => {});
            }
        });
    }

    return (
        <div className="rounded-box bg-base-100 shadow p-4 flex flex-col gap-3">
            <p className="text-[9px] font-extrabold tracking-widest opacity-70 uppercase">
                {t("characterSheet.savingThrows")}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
                {SAVING_THROWS.map(({ key, labelKey }) => {
                    const score = scores[key] ?? 10;
                    const proficient = proficiencies.includes(key);
                    const mod = calcMod(score) + (proficient ? proficiencyBonus : 0);
                    const label = t(labelKey);
                    return (
                        <SavingThrowRow
                            key={key}
                            label={label}
                            mod={mod}
                            proficient={proficient}
                            onRoll={() => roll(key, label, mod)}
                        />
                    );
                })}
            </div>
        </div>
    );
}
