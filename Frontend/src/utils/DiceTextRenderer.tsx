import type { RefObject, MutableRefObject } from "react";
import type { DiceBoardRef } from "../components/DiceBoard";
import { rollWithTimeout } from "./RollUtils";
import { diceTotal } from "./DiceCalculator";
import { dispatchRoll } from "./rollDispatcher";
import { APIGameLog } from "../api/APIGameLog";

/** Regex to detect dice notation like 1d4, 2d6, 2d6+2, 8d6-1 etc. */
const DICE_REGEX = /(\d+d\d+(?:[+-]\d+)?)/g;

/** Split text around dice patterns and render roll buttons for each match. */
export function renderTextWithDiceButtons(
    text: string,
    label: string,
    diceBoardRef?: RefObject<DiceBoardRef | null>,
    timeoutDiceBoardRef?: MutableRefObject<ReturnType<typeof setTimeout> | null>,
    playerId?: number,
    campaignId?: number | null,
): React.ReactNode {
    const parts = text.split(DICE_REGEX);
    if (parts.length === 1) return text;

    return parts.map((part, i) => {
        if (!DICE_REGEX.test(part)) return part;
        DICE_REGEX.lastIndex = 0;

        return (
            <button
                key={i}
                className="inline-flex items-center px-1.5 py-0.5 mx-0.5 bg-amber-700 text-amber-100 hover:bg-amber-500 hover:text-white rounded text-xs font-mono font-bold cursor-pointer transition-colors align-baseline"
                onClick={(e) => {
                    e.stopPropagation();
                    if (diceBoardRef && timeoutDiceBoardRef) {
                        const modMatch = part.match(/([+-]\d+)$/);
                        const modifier = modMatch ? parseInt(modMatch[1], 10) : 0;
                        const diceOnly = modMatch ? part.slice(0, modMatch.index) : part;
                        rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, diceOnly, (result) => {
                            const rawTotal = diceTotal(result);
                            const diceValues: number[] = [];
                            for (const group of result) {
                                if (Array.isArray(group.rolls)) {
                                    for (const roll of group.rolls) diceValues.push(roll.value);
                                }
                            }
                            dispatchRoll({
                                label: `${label} — ${part}`,
                                diceRolled: rawTotal,
                                modifier,
                                total: rawTotal + modifier,
                                diceCommand: part,
                                diceValues,
                            });
                            if (playerId) {
                                APIGameLog.create(playerId, {
                                    rollType: "customRoll",
                                    abilityKey: `${label} — ${part}`,
                                    diceRolled: rawTotal,
                                    modifier,
                                    total: rawTotal + modifier,
                                    diceCommand: part,
                                });
                            } else if (campaignId) {
                                APIGameLog.createForCampaign(campaignId, {
                                    rollType: "customRoll",
                                    abilityKey: `${label} — ${part}`,
                                    diceRolled: rawTotal,
                                    modifier,
                                    total: rawTotal + modifier,
                                    diceCommand: part,
                                });
                            }
                        });
                    }
                }}
            >
                ({part})
            </button>
        );
    });
}
