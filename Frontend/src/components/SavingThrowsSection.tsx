import type { RefObject, MutableRefObject } from "react";
import type { GetPlayerResponse, AbilityScores } from "../api/APIPlayer";
import type { DiceBoardRef } from "./DiceBoard";
import { rollWithTimeout } from "../utils/RollUtils";
import { diceTotal } from "../utils/DiceCalculator";
import { useToast } from "./Toast";
import { t } from "../i18n";

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
function SavingThrowRow({ label, mod, onRoll }: { label: string; mod: number; onRoll: () => void }) {
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
                {/* Outer border */}
                <path
                    d="M8 1.5 L152 1.5 L158.5 8 L158.5 36 L152 42.5 L8 42.5 L1.5 36 L1.5 8 Z"
                    stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.5"
                />
                {/* Inner border */}
                <path
                    d="M10 4 L150 4 L156 10 L156 34 L150 40 L10 40 L4 34 L4 10 Z"
                    stroke="currentColor" strokeOpacity="0.2" strokeWidth="0.75"
                />
                {/* Vertical divider before modifier */}
                <line x1="108" y1="6" x2="108" y2="38" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" />
                {/* Modifier box inner border */}
                <path
                    d="M110 6 L151 6 L155 10 L155 34 L151 38 L110 38 Z"
                    stroke="currentColor" strokeOpacity="0.2" strokeWidth="0.75"
                />
            </svg>

            {/* Circle indicator */}
            <div className="relative z-10 ml-3 w-2.5 h-2.5 rounded-full border-2 border-base-content/40 shrink-0" />

            {/* Label */}
            <span className="relative z-10 flex-1 text-[9px] font-extrabold tracking-wide uppercase opacity-75 text-left px-2 leading-tight truncate">
                {label}
            </span>

            {/* Modifier value — right box */}
            <div className="relative z-10 w-12 flex items-center justify-center shrink-0">
                <span className="text-base font-black">{modStr(mod)}</span>
            </div>
        </button>
    );
}

interface Props {
    player: GetPlayerResponse | null;
    diceBoardRef: RefObject<DiceBoardRef | null>;
    timeoutDiceBoardRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
}

export function SavingThrowsSection({ player, diceBoardRef, timeoutDiceBoardRef }: Props) {
    const { showToast } = useToast();
    const scores = player?.playerSheet?.abilityScores ?? {};

    function roll(label: string, mod: number) {
        rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, "1d20", (result) => {
            const rolled = diceTotal(result);
            const total = rolled + mod;
            showToast(`${label}: ${rolled} ${modStr(mod)} = ${total}`);
        });
    }

    const wis = scores.wisdom ?? 10;
    const int_ = scores.intelligence ?? 10;
    const wisMod = calcMod(wis);
    const intMod = calcMod(int_);

    const senses = [
        { labelKey: "characterSheet.passivePerception",    value: 10 + wisMod },
        { labelKey: "characterSheet.passiveInvestigation", value: 10 + intMod },
        { labelKey: "characterSheet.passiveInsight",       value: 10 + wisMod },
    ];

    return (
        <div className="rounded-box bg-base-100 shadow p-4 flex flex-col gap-4">
            {/* Saving Throws */}
            <div>
                <p className="text-[9px] font-extrabold tracking-widest opacity-70 uppercase mb-2">
                    {t("characterSheet.savingThrows")}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                    {SAVING_THROWS.map(({ key, labelKey }) => {
                        const score = scores[key] ?? 10;
                        const mod = calcMod(score);
                        const label = t(labelKey);
                        return (
                            <SavingThrowRow
                                key={key}
                                label={label}
                                mod={mod}
                                onRoll={() => roll(label, mod)}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Senses */}
            <div>
                <p className="text-[9px] font-extrabold tracking-widest opacity-70 uppercase mb-2">
                    {t("characterSheet.senses")}
                </p>
                <div className="flex flex-col gap-1">
                    {senses.map(({ labelKey, value }) => {
                        const label = t(labelKey);
                        return (
                            <button
                                key={labelKey}
                                onClick={() => roll(label, value - 10)}
                                className="flex items-center gap-3 bg-base-200 rounded-lg px-3 py-1.5 hover:brightness-110 active:scale-95 transition cursor-pointer"
                            >
                                <span
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                                    style={{ background: "color-mix(in oklch, oklch(var(--b3)) 70%, oklch(var(--p)) 30%)" }}
                                >
                                    {value}
                                </span>
                                <span className="text-[10px] font-extrabold tracking-widest uppercase opacity-80">
                                    {label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
