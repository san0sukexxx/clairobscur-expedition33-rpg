import { type GetPlayerResponse } from "../api/APIPlayer";
import { calculateWeaponPlusDices, calculateWeaponPlusPower } from "./WeaponCalculator";
import { type WeaponDTO } from "../types/WeaponDTO";
import {
    calculateCriticalMulti,
    calculateFailureDiv,
    diceTotal
} from "./DiceCalculator";

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