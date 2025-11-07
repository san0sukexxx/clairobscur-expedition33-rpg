import { type GetPlayerResponse } from "../api/APIPlayer";
import { calculateWeaponPlusDices, calculateWeaponPlusPower } from "./WeaponCalculator";
import { type WeaponDTO } from "../types/WeaponDTO";

export function calculateMaxHP(player: GetPlayerResponse | null): number {
    return (player?.playerSheet?.resistance ?? 0) * 5;
}

export function calculateRawWeaponPower(player: GetPlayerResponse | null, weaponList: WeaponDTO[], diceResult: any): number {
    if (player?.playerSheet?.weaponId == null) {
        return (player?.playerSheet?.power ?? 0);
    }

    const weaponDetails = weaponList.find(w => w.name == player.playerSheet?.weaponId);
    const weapon = player?.weapons?.find(w => w.id == player.playerSheet?.weaponId);
    return (calculateWeaponPlusPower(weaponDetails?.attributes.power ?? 0, weapon?.level ?? 0) ?? 0);
}

export function calculateBasicAttackDamage(player: GetPlayerResponse | null, weaponList: WeaponDTO[], diceResult: any): number {
    const total = diceTotal(diceResult);
    return (player?.playerSheet?.power ?? 0) + calculateRawWeaponPower(player, weaponList, diceResult) + total;
}

export function calculateMaxMP(player: GetPlayerResponse | null): number {
    return (player?.playerSheet?.hability ?? 0) * 5;
}

export function calculateMaxPA(player: GetPlayerResponse | null): number {
    return (player?.playerSheet?.power ?? 0);
}

export function rollCommandForInitiative(player: GetPlayerResponse) {
    return "1d6";
}

export function rollCommandFoBasicAttack(player: GetPlayerResponse, weaponList: WeaponDTO[]) {
    const weaponDetails = weaponList.find(w => w.name == player.playerSheet?.weaponId);
    const weapon = player?.weapons?.find(w => w.id == player.playerSheet?.weaponId);
    const dices = calculateWeaponPlusDices(weaponDetails?.attributes.power ?? 0, weapon?.level ?? 0) + 1;
    return `${dices}d6`;
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