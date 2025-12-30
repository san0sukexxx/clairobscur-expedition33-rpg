

export function calculateCriticalMulti(diceResult: any, pictos?: any[], target?: any) {
    return 1 + countCriticalRolls(diceResult, pictos, target);
}

export function calculateFailureDiv(diceResult: any) {
    return 1 + countFailuresRolls(diceResult);
}

export function diceTotal(diceResult: any) {
    return diceResult.reduce((total: number, group: any) => {
        return total + group.value;
    }, 0);
}

export function countCriticalRolls(result: any[], pictos?: any[], target?: any): number {
    if (!Array.isArray(result)) return 0;

    // Check if player has Critical Burn picto equipped (slot 0-2)
    const hasCriticalBurn = pictos?.some(p =>
        p.pictoId?.toLowerCase() === "critical-burn" &&
        typeof p.slot === "number" &&
        p.slot >= 0 &&
        p.slot <= 2
    ) ?? false;

    // Check if target is Burning
    const targetIsBurning = target?.status?.some((s: any) =>
        s.effectName === "Burning" || s.effectName === "burning"
    ) ?? false;

    // Critical Burn only works if BOTH conditions are met:
    // 1. Player has the picto equipped
    // 2. Target has Burning status
    const canCritOn5 = hasCriticalBurn && targetIsBurning;

    let countCrit = 0;  // Count of critical rolls (5s if conditions met, or 6s)
    let count1 = 0;     // Count of failures (1s)

    for (const group of result) {
        if (!Array.isArray(group.rolls)) continue;

        for (const roll of group.rolls) {
            // With Critical Burn picto AND target burning: 5 and 6 are crits
            // Otherwise: only 6 is crit
            if (canCritOn5 && roll.value === 5) {
                countCrit++;
            }
            if (roll.value === 6) countCrit++;
            if (roll.value === 1) count1++;
        }
    }

    return Math.max(0, countCrit - count1);
}
export function countFailuresRolls(result: any[]): number {
    if (!Array.isArray(result)) return 0;

    let count6 = 0;
    let count1 = 0;

    for (const group of result) {
        if (!Array.isArray(group.rolls)) continue;

        for (const roll of group.rolls) {
            if (roll.value === 6) count6++;
            if (roll.value === 1) count1++;
        }
    }

    return Math.max(0, count1 - count6);
}
export function isCriticalFailureRoll(diceResult: any): boolean {
    if (!Array.isArray(diceResult)) return false;

    let ones = 0;
    let sixes = 0;

    for (const group of diceResult) {
        if (!Array.isArray(group.rolls)) return false;

        for (const roll of group.rolls) {
            if (roll.value === 1) ones++;
            if (roll.value === 6) sixes++;
        }
    }

    return ones > sixes;
}