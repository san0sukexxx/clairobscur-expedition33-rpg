import { type GetPlayerResponse } from "../api/APIPlayer";
import { calculateWeaponPlusDices, calculateWeaponPlusPower, calculateWeaponCounterMaxPower } from "./WeaponCalculator";
import { type WeaponDTO } from "../types/WeaponDTO";
import { type DefenseOption, type WeaponInfo } from "../api/ResponseModel";
import {
    calculateCriticalMulti,
    calculateFailureDiv,
    diceTotal
} from "./DiceCalculator";
import { getNpcById } from "../data/NPCsList";
import { getWeaponElementModifier } from "./NpcCalculator";
import { calculateWeaponVitalityBonus } from "./WeaponCalculator";

export function calculateMaxHP(player: GetPlayerResponse | null, weaponInfo: WeaponInfo | null): number {
    const vitalityValue = calculateWeaponVitalityBonus(weaponInfo);
    const resistanceHealth = (player?.playerSheet?.resistance ?? 0) * 5
    
    return resistanceHealth + vitalityValue;
}

export function calculateRawWeaponPower(weaponInfo: WeaponInfo | null): number {
    if (weaponInfo == null) {
        return 0;
    }

    return (calculateWeaponPlusPower(weaponInfo.details?.attributes.power ?? 0, weaponInfo.weapon?.level ?? 0) ?? 0);
}

export function calculateBasicAttackDamage(player: GetPlayerResponse | null, weaponInfo: WeaponInfo | null, npcId: string, diceResult: any): number {
    const npcInfo = getNpcById(npcId)

    const total = diceTotal(diceResult);
    const failures = calculateFailureDiv(diceResult)
    var playerPower = (player?.playerSheet?.power ?? 0) * calculateCriticalMulti(diceResult);

    if (failures > 0) {
        playerPower = Math.floor(playerPower / failures);
    }
    const attackDamage = playerPower + calculateRawWeaponPower(weaponInfo) + total;

    if (npcInfo != undefined) {
        return Math.floor(
            attackDamage * (getWeaponElementModifier(npcId, weaponInfo)?.multiplier ?? 1)
        );
    }

    return attackDamage;
}

export function calculateDefense(totalDamage: number, player: GetPlayerResponse | null, weaponInfo: WeaponInfo | null, diceResult: any, defenseOption: DefenseOption): number {
    if (defenseOption == "take") {
        return totalDamage;
    }

    const diceTotalSum = diceTotal(diceResult);
    const failures = calculateFailureDiv(diceResult)
    var playerDefense = 0;

    if (defenseOption == "block" || defenseOption == "dodge") {
        var resistance = (player?.playerSheet?.resistance ?? 0) * calculateCriticalMulti(diceResult);
        if (failures > 0) {
            resistance = Math.floor(resistance / failures);
        }

        playerDefense = resistance + diceTotalSum;
    } else if (defenseOption == "gradient-block") {
        var power = (player?.playerSheet?.power ?? 0) * calculateCriticalMulti(diceResult);

        if (failures > 0) {
            power = Math.floor(power / failures);
        }

        power -= 2;

        playerDefense = power + diceTotalSum;
    } else if (defenseOption == "jump") {
        var hability = (player?.playerSheet?.hability ?? 0) * calculateCriticalMulti(diceResult);
        if (failures > 0) {
            hability = Math.floor(hability / failures);
        }

        playerDefense = hability + diceTotalSum;
    }

    if (defenseOption == "dodge") {
        playerDefense += player?.playerSheet?.hability ?? 0;
    }

    return totalDamage - playerDefense;
}

export function calculateMaxCounterDamage(player: GetPlayerResponse | null, weaponList: WeaponDTO[]): number {
    const playerPower = (player?.playerSheet?.power ?? 0)
    if (player?.playerSheet?.weaponId == null) {
        return playerPower;
    }

    const weaponDetails = weaponList.find(w => w.name == player.playerSheet?.weaponId);
    const weapon = player?.weapons?.find(w => w.id == player.playerSheet?.weaponId);

    return playerPower + (calculateWeaponCounterMaxPower(weaponDetails?.attributes.power ?? 0, weapon?.level ?? 0) ?? 0);
}

export function calculateMaxMP(player: GetPlayerResponse | null): number {
    return (player?.playerSheet?.hability ?? 0) * 3;
}

export function calculateInitialMP(player: GetPlayerResponse | null): number {
    return (player?.playerSheet?.hability ?? 0);
}

export function calculateMaxPA(player: GetPlayerResponse | null): number {
    return (player?.playerSheet?.power ?? 0);
}

export function rollCommandForInitiative(player: GetPlayerResponse) {
    return "1d6";
}

export function rollCommandForBasicAttack(player: GetPlayerResponse, weaponInfo: WeaponInfo | null) {
    const dices = calculateWeaponPlusDices(weaponInfo?.details?.attributes.power ?? 0, weaponInfo?.weapon?.level ?? 0) + 1;
    return `${dices}d6`;
}

export function rollCommandForDefense(player: GetPlayerResponse, weaponInfo: WeaponInfo | null, defenseOption: DefenseOption) {
    return "1d6";
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