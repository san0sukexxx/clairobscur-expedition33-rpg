import type { DiceTheme } from "../components/DiceBoard";

export interface RollOptions {
    theme?: DiceTheme;
}

// Module-level queue — shared across all concurrent rollWithTimeout calls
let pendingCallbacks: Array<(result: any) => void> = [];
let isRolling = false;

export function rollWithTimeout(
    diceBoardRef: React.RefObject<any>,
    timeoutDiceBoardRef: React.RefObject<number | null>,
    command: string,
    callback: (result: any) => void,
    options?: RollOptions
) {
    if (!diceBoardRef.current) return;

    // Clear any pending hide-board timeout so it doesn't fire mid-roll
    if (timeoutDiceBoardRef.current != null) {
        clearTimeout(timeoutDiceBoardRef.current);
        timeoutDiceBoardRef.current = null;
    }

    pendingCallbacks.push(callback);

    if (!isRolling) {
        // First roll in this batch — start a new roll on the board
        isRolling = true;
        diceBoardRef.current.roll(command, (result: any) => {
            isRolling = false;
            const callbacks = [...pendingCallbacks];
            pendingCallbacks = [];

            // result is an array of groups, one per roll()/add() call in order.
            // Each callback receives its own group wrapped in an array to match
            // the format callers expect (raw[0]?.rolls, etc.).
            callbacks.forEach((cb, i) => {
                const group = result[i];
                if (group !== undefined) cb([group]);
            });

            if (timeoutDiceBoardRef.current != null) {
                clearTimeout(timeoutDiceBoardRef.current);
            }
            timeoutDiceBoardRef.current = window.setTimeout(() => {
                diceBoardRef.current?.hideBoard();
                timeoutDiceBoardRef.current = null;
            }, 5000);
        }, options?.theme);
    } else {
        // A roll is already in progress — add more dice without canceling it
        diceBoardRef.current.add(command);
    }
}

export type DiceRollResult = {
    rolls: number[]
    total: number
    criticals: number
    failures: number
}

export function rollD6(count: number): DiceRollResult {
    const rolls: number[] = []

    for (let i = 0; i < count; i++) {
        const roll = Math.floor(Math.random() * 6) + 1
        rolls.push(roll)
    }

    const sixes = rolls.filter(r => r === 6).length
    const ones = rolls.filter(r => r === 1).length

    return {
        rolls,
        total: rolls.reduce((a, b) => a + b, 0),
        criticals: Math.max(0, sixes - ones),
        failures: Math.max(0, ones - sixes),
    }
}
