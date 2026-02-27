import type { GetPlayerResponse } from "../api/APIPlayer";
import { t } from "../i18n";

function calcMod(score: number) {
    return Math.floor((score - 10) / 2);
}

interface Props {
    player: GetPlayerResponse | null;
}

export function SensesSection({ player }: Props) {
    const scores = player?.playerSheet?.abilityScores ?? {};

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
        <div className="rounded-box bg-base-100 shadow p-4 flex flex-col gap-3">
            <p className="text-[9px] font-extrabold tracking-widest opacity-70 uppercase">
                {t("characterSheet.senses")}
            </p>
            <div className="flex flex-col gap-1">
                {senses.map(({ labelKey, value }) => (
                    <div
                        key={labelKey}
                        className="flex items-center gap-3 bg-base-200 rounded-lg px-3 py-1.5"
                    >
                        <span
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                            style={{ background: "color-mix(in oklch, oklch(var(--b3)) 70%, oklch(var(--p)) 30%)" }}
                        >
                            {value}
                        </span>
                        <span className="text-[10px] font-extrabold tracking-widest uppercase opacity-80">
                            {t(labelKey)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
