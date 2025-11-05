import { type GetPlayerResponse } from "../api/APIPlayer";

export function calculateMaxHP(player: GetPlayerResponse | null): number {
    return (player?.playerSheet?.resistance ?? 0) * 5;
}

export function calculateMaxMP(player: GetPlayerResponse | null): number {
    return (player?.playerSheet?.hability ?? 0) * 5;
}

export function calculateMaxPA(player: GetPlayerResponse | null): number {
    return (player?.playerSheet?.power ?? 0) * 5;
}

export function rollCommandForInitiative(player: GetPlayerResponse) {
    return "1d6";
}

export function initiativeTotal(player: GetPlayerResponse, diceResult: any) {
    const isCriticalFailure = isCriticalFailureRoll(diceResult);

    if (isCriticalFailure) {
        return 1;
    }

    const total = diceTotal(diceResult);
    const hability = player.playerSheet?.hability ?? 0;
    const criticalMulti = calculateCriticalMulti(diceResult);

    return total + (hability * criticalMulti);
}

export function calculateCriticalMulti(diceResult: any) {
    return 1 + countCriticalRolls(diceResult);
}

export function diceTotal(diceResult: any) {
    return diceResult.reduce((total: number, group: any) => {
        return total + group.value;
    }, 0);
}

export function countCriticalRolls(result: any[]): number {
    return result.reduce((total, group) => {
        const maxInGroup = group.rolls.filter(
            (roll: any) => roll.value === roll.sides
        ).length;
        return total + maxInGroup;
    }, 0);
}

export function isCriticalFailureRoll(diceResult: any): boolean {
    if (!Array.isArray(diceResult)) return false;

    for (const group of diceResult) {
      if (!Array.isArray(group.rolls)) return false;
  
      for (const roll of group.rolls) {
        if (roll.value !== 1) {
          return false;
        }
      }
    }
  
    return true;
}