

export function calculateCriticalMulti(diceResult: any) {
    return 1 + countCriticalRolls(diceResult);
}

export function calculateFailureDiv(diceResult: any) {
    return 1 + countFailuresRolls(diceResult);
}

export function diceTotal(diceResult: any) {
    return diceResult.reduce((total: number, group: any) => {
        return total + group.value;
    }, 0);
}

export function countCriticalRolls(result: any[]): number {
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

    return Math.max(0, count6 - count1);
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