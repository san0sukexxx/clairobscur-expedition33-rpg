import { type GetPlayerResponse } from "../api/APIPlayer";
import { calculateWeaponPlusDices, calculateWeaponPlusPower } from "./WeaponCalculator";
import { type WeaponDTO } from "../types/WeaponDTO";

export function calculateMaxHP(player: GetPlayerResponse | null): number {
    return (player?.playerSheet?.resistance ?? 0) * 5;
}

export function calculateRawWeaponPower(player: GetPlayerResponse | null, weaponList: WeaponDTO[]): number {
    if (player?.playerSheet?.weaponId == null) {
        return 0;
    }

    const weaponDetails = weaponList.find(w => w.name == player.playerSheet?.weaponId);
    const weapon = player?.weapons?.find(w => w.id == player.playerSheet?.weaponId);
    return (calculateWeaponPlusPower(weaponDetails?.attributes.power ?? 0, weapon?.level ?? 0) ?? 0);
}

export function calculateBasicAttackDamage(player: GetPlayerResponse | null, weaponList: WeaponDTO[], diceResult: any): number {
    const total = diceTotal(diceResult);
    const failures = calculateFailureDiv(diceResult)
    var playerPower = (player?.playerSheet?.power ?? 0) * calculateCriticalMulti(diceResult);

    if (failures > 0) {
        playerPower = Math.floor(playerPower / failures);
    }
    return playerPower + calculateRawWeaponPower(player, weaponList) + total;
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
    const total = diceTotal(diceResult);
    const failures = calculateFailureDiv(diceResult);
    var playerInitiative = (player?.playerSheet?.hability ?? 0) * calculateCriticalMulti(diceResult);

    if (failures > 0) {
        playerInitiative = Math.floor(playerInitiative / failures);
    }

    return total + playerInitiative;
}

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