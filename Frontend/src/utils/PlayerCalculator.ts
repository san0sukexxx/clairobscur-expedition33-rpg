import { type GetPlayerResponse } from "../api/APIPlayer";
import { calculateWeaponPlusDices, calculateWeaponPlusPower, calculateWeaponCounterMaxPower } from "./WeaponCalculator";
import { type WeaponDTO } from "../types/WeaponDTO";
import { type AttackType, type BattleCharacterInfo, type DefenseOption, type WeaponInfo } from "../api/ResponseModel";
import {
    calculateCriticalMulti,
    calculateFailureDiv,
    diceTotal
} from "./DiceCalculator";
import { getNpcById } from "../data/NPCsList";
import { getWeaponElementModifier } from "./NpcCalculator";
import { calculateWeaponVitalityBonus, calculateWeaponAgilityBonus, calculateWeaponDefenseBonus } from "./WeaponCalculator";

export function calculateMaxHP(player: GetPlayerResponse | null, weaponInfo: WeaponInfo | null): number {
    const vitalityValue = calculateWeaponVitalityBonus(weaponInfo);
    const resistanceHealth = (player?.playerSheet?.resistance ?? 0) * 5

    return resistanceHealth + vitalityValue;
}

export function calculateRawWeaponPower(weaponInfo: WeaponInfo | null, attackType: AttackType): number {
    if (weaponInfo == null || attackType == "free-shot") {
        return 0;
    }

    return (calculateWeaponPlusPower(weaponInfo.details?.attributes.power ?? 0, weaponInfo.weapon?.level ?? 0) ?? 0);
}

export function calculateAttackDamage(player: GetPlayerResponse | null, weaponInfo: WeaponInfo | null, npcBattleCharacterInfo: BattleCharacterInfo, diceResult: any, attackType: AttackType): number {
    if (attackType == "basic") {
        return calculateBasicAttackDamage(player, weaponInfo, npcBattleCharacterInfo.id, diceResult);
    } else if (attackType == "free-shot") {
        return calculateFreeShotAttackDamage(player, npcBattleCharacterInfo, diceResult, attackType);
    }

    return 1;
}

export function calculateFreeShotPlus(player: GetPlayerResponse | null, npcBattleCharacterInfo: BattleCharacterInfo, attackType: AttackType): number {
    if(attackType != "free-shot") { return 0; }
    const npcInfo = getNpcById(npcBattleCharacterInfo.id)

    if (npcInfo?.freeShotWeakPoints != undefined) {
        const statusFreeShot = npcBattleCharacterInfo.status?.find(s => s.effectName == "free-shot")

        console.log(statusFreeShot)

        if (!statusFreeShot || statusFreeShot.ammount < npcInfo.freeShotWeakPoints) {
            return (player?.playerSheet?.power ?? 0)
        }
    }

    return 0
}

export function calculateFreeShotAttackDamage(player: GetPlayerResponse | null, npcBattleCharacterInfo: BattleCharacterInfo, diceResult: any, attackType: AttackType): number {
    const total = diceTotal(diceResult);
    const failures = calculateFailureDiv(diceResult)
    var criticalMulti = calculateCriticalMulti(diceResult)

    var playerPower = (player?.playerSheet?.power ?? 0) * criticalMulti;
    if (failures > 0) {
        playerPower = Math.floor(playerPower / failures);
    }
    playerPower += calculateFreeShotPlus(player, npcBattleCharacterInfo, attackType)

    return playerPower + total;
}

export function calculateBasicAttackDamage(player: GetPlayerResponse | null, weaponInfo: WeaponInfo | null, npcId: string, diceResult: any): number {
    const npcInfo = getNpcById(npcId)

    const total = diceTotal(diceResult);
    const failures = calculateFailureDiv(diceResult)
    var playerPower = (player?.playerSheet?.power ?? 0) * calculateCriticalMulti(diceResult);

    if (failures > 0) {
        playerPower = Math.floor(playerPower / failures);
    }
    const attackDamage = playerPower + calculateRawWeaponPower(weaponInfo, "basic") + total;

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

export function rollCommandForInitiative(weaponInfo: WeaponInfo | null) {
    const agilityBonus = calculateWeaponAgilityBonus(weaponInfo) + 1
    return agilityBonus + "d6";
}

export function rollCommandForBasicAttack(weaponInfo: WeaponInfo | null) {
    const dices = calculateWeaponPlusDices(weaponInfo?.details?.attributes.power ?? 0, weaponInfo?.weapon?.level ?? 0) + 1;
    return `${dices}d6`;
}

export function rollCommandForAttack(weaponInfo: WeaponInfo | null, attackType: AttackType) {
    var dices = 1;

    if (attackType == "basic") {
        dices = calculateWeaponPlusDices(weaponInfo?.details?.attributes.power ?? 0, weaponInfo?.weapon?.level ?? 0) + 1;
    } else if (attackType == "free-shot") {
        dices = 1;
    }
    return `${dices}d6`;
}

export function rollCommandForDefense(player: GetPlayerResponse, weaponInfo: WeaponInfo | null, defenseOption: DefenseOption) {
    var defenseDices = 1

    switch (defenseOption) {
        case "dodge":
        case "jump":
            defenseDices += calculateWeaponAgilityBonus(weaponInfo)
            break
        case "block":
            defenseDices += calculateWeaponDefenseBonus(weaponInfo)
            break
        case "gradient-block":
            return rollCommandForBasicAttack(weaponInfo)
    }
    return defenseDices + "d6";
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