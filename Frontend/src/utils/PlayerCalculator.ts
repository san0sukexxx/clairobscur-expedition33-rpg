import { type GetPlayerResponse } from "../api/APIPlayer";
import { calculateWeaponPlusPower, calculateWeaponCounterMaxPower } from "./WeaponCalculator";
import { type WeaponDTO } from "../types/WeaponDTO";
import { type BattleCharacterInfo, type DefenseOption, type StatusResponse, type StatusType, type WeaponInfo, type Stance } from "../api/ResponseModel";
import {
    calculateCriticalBonus,
    calculateFailureDiv,
    diceTotal,
    countCriticalRolls
} from "./DiceCalculator";
import { hasHastened, hasProtected, hasSlowed, hasStatus, hasUnprotected } from "./NpcCalculator";
import { calculateWeaponVitalityBonus, calculateWeaponDexterityBonus, calculateWeaponDefenseBonus } from "./WeaponCalculator";
import { getPlayerCharacter } from "./CharacterUtils";
import { PictosList } from "../data/PictosList";
import { calculatePictoHealth, calculatePictoSpeed, calculatePictoDefense, calculatePictoCritical } from "./PictoUtils";

export function playerPictosTotalHealth(player: GetPlayerResponse | null): number {
    let total = 0;
    if (player?.pictos && player.pictos.length > 0) {
        const equippedPictos = player.pictos.filter(picto => picto.slot !== null && picto.slot !== undefined);

        for (const picto of equippedPictos) {
            const pictoInfo = PictosList.find(p => p.name === picto.pictoId);
            if (pictoInfo?.status?.health) {
                total += calculatePictoHealth(pictoInfo.status.health, picto.level ?? 1);
            }
        }
    }
    return total;
}

export function playerPictosTotalSpeed(player: GetPlayerResponse | null): number {
    let total = 0;
    if (player?.pictos && player.pictos.length > 0) {
        const equippedPictos = player.pictos.filter(picto => picto.slot !== null && picto.slot !== undefined);

        for (const picto of equippedPictos) {
            const pictoInfo = PictosList.find(p => p.name === picto.pictoId);
            if (pictoInfo?.status?.speed) {
                total += calculatePictoSpeed(pictoInfo.status.speed, picto.level ?? 1);
            }
        }
    }
    return total;
}

export function playerPictosTotalDefense(player: GetPlayerResponse | null): number {
    let total = 0;
    if (player?.pictos && player.pictos.length > 0) {
        const equippedPictos = player.pictos.filter(picto => picto.slot !== null && picto.slot !== undefined);

        for (const picto of equippedPictos) {
            const pictoInfo = PictosList.find(p => p.name === picto.pictoId);
            if (pictoInfo?.status?.defense) {
                total += calculatePictoDefense(pictoInfo.status.defense, picto.level ?? 1);
            }
        }
    }
    return total;
}

export function playerPictosTotalCritical(player: GetPlayerResponse | null): number {
    let total = 0;
    if (player?.pictos && player.pictos.length > 0) {
        const equippedPictos = player.pictos.filter(picto => picto.slot !== null && picto.slot !== undefined);

        for (const picto of equippedPictos) {
            const pictoInfo = PictosList.find(p => p.name === picto.pictoId);
            if (pictoInfo?.status?.criticalRate) {
                total += calculatePictoCritical(pictoInfo.status.criticalRate, picto.level ?? 1);
            }
        }
    }
    return total;
}

export function calculatePlayerCriticalBonus(diceResult: any, player: GetPlayerResponse | null, weaponInfo: WeaponInfo | null, target?: BattleCharacterInfo): number {
    const baseCriticalBonus = calculateCriticalBonus(diceResult);
    const criticalRolls = countCriticalRolls(diceResult);

    if (criticalRolls > 0) {
        const pictoCritical = playerPictosTotalCritical(player);
        return baseCriticalBonus + pictoCritical;
    }

    return baseCriticalBonus;
}

const HIT_DIE_BY_CHARACTER: Record<string, number> = {
    verso:   10,
    gustave: 10,
    maelle:  8,
    sciel:   8,
    monoco:  8,
    lune:    8,
};

export function getCharacterHitDie(characterId: string | undefined): number {
    return HIT_DIE_BY_CHARACTER[characterId?.toLowerCase() ?? ""] ?? 8;
}

export function calculateMaxHP(player: GetPlayerResponse | null, weaponInfo: WeaponInfo | null): number {
    const characterId = player?.playerSheet?.characterId;
    const hitDie = getCharacterHitDie(characterId);
    const level = player?.playerSheet?.totalPoints ?? 1;
    const con = player?.playerSheet?.abilityScores?.constitution ?? 10;
    const weaponConBonus = calculateWeaponVitalityBonus(weaponInfo);
    const pictoConBonus = playerPictosTotalHealth(player);
    const effectiveCon = Math.min(20, con + weaponConBonus + pictoConBonus);
    const conMod = Math.floor((effectiveCon - 10) / 2);

    // D&D 5e formula: max die at level 1 + avg die per subsequent level, + CON mod each level
    const avgPerLevel = Math.floor(hitDie / 2) + 1;
    const baseHp = hitDie + conMod + (level - 1) * (avgPerLevel + conMod);

    return Math.max(1, baseHp);
}

export function calculateRawWeaponPower(weaponInfo: WeaponInfo | null, attackType: string): number {
    if (weaponInfo == null || attackType == "free-shot") {
        return 0;
    }

    return (calculateWeaponPlusPower(weaponInfo.details?.attributes.power ?? 0, weaponInfo.weapon?.level ?? 0) ?? 0);
}

export function calculateDefense(totalDamage: number, player: GetPlayerResponse | null, weaponInfo: WeaponInfo | null, diceResult: any, defenseOption: DefenseOption, stance?: Stance | null): number {
    if (playerHasShield(player)) {
        return 0;
    }

    const playerCharacter = getPlayerCharacter(player);
    if (!playerCharacter) { return 0 }

    if (defenseOption == "take") {
        // Apply stance modifiers to damage received when taking damage
        let damage = totalDamage;
        if (stance === "Defensive") {
            damage = damage - 4;  // -4 damage received
        } else if (stance === "Offensive") {
            damage = damage + 4;  // +4 damage received
        }
        return Math.max(0, damage);
    }

    let hastenedBonus = hasHastened(playerCharacter) ? 4 : 0;
    hastenedBonus = hasSlowed(playerCharacter) ? -4 : hastenedBonus;

    let protectedBonus = hasProtected(playerCharacter) ? 4 : 0;
    protectedBonus = hasUnprotected(playerCharacter) ? -4 : protectedBonus;

    const diceTotalSum = diceTotal(diceResult);
    const failures = calculateFailureDiv(diceResult)
    var playerDefense = 0;

    if (defenseOption == "block" || defenseOption == "dodge") {
        var resistance = calculatePlayerCriticalBonus(diceResult, player, weaponInfo) + protectedBonus;
        if (failures > 0) {
            resistance = resistance - (failures * 4);
        }

        playerDefense = Math.max(0, resistance) + diceTotalSum;
    } else if (defenseOption == "gradient-block") {
        var power = calculatePlayerCriticalBonus(diceResult, player, weaponInfo);

        if (failures > 0) {
            power = power - (failures * 2);
        }

        power -= 2;

        playerDefense = Math.max(0, power) + diceTotalSum;
    } else if (defenseOption == "jump") {
        var hability = calculatePlayerCriticalBonus(diceResult, player, weaponInfo) + hastenedBonus;
        if (failures > 0) {
            hability = hability - (failures * 2);
        }

        playerDefense = Math.max(0, hability) + diceTotalSum;
    }

    if (defenseOption == "dodge") {
        // Reduced bonus for better PvP balance
        playerDefense += hastenedBonus;
    }

    if (defenseOption == "dodge" || defenseOption == "jump") {
        // Reduced speed bonus for better PvP balance
        playerDefense += Math.floor(playerPictosTotalSpeed(player) / 2);
    }

    if (defenseOption == "block") {
        playerDefense += playerPictosTotalDefense(player);
    }

    switch (defenseOption) {
        case "dodge":
        case "jump":
            playerDefense += calculateWeaponDexterityBonus(weaponInfo)
            break
        case "block":
            playerDefense += calculateWeaponDefenseBonus(weaponInfo)
            break
        case "gradient-block":
            playerDefense += calculateRawWeaponPower(weaponInfo, "basic")
    }

    playerDefense = playerHasMarked(player) ? playerDefense - 4 : playerDefense;

    let damageReceived = totalDamage - Math.max(0, playerDefense);

    // Apply stance modifiers to damage received after defense calculation
    if (stance === "Defensive") {
        damageReceived = damageReceived - 4;  // -4 damage received
    } else if (stance === "Offensive") {
        damageReceived = damageReceived + 4;  // +4 damage received
    }

    return damageReceived;
}

export function calculateMaxCounterDamage(player: GetPlayerResponse | null, weaponList: WeaponDTO[]): number {
    const playerPower = 0;
    if (player?.playerSheet?.weaponId == null) {
        return playerPower;
    }

    const weaponDetails = weaponList.find(w => w.name == player.playerSheet?.weaponId);
    const weapon = player?.weapons?.find(w => w.id == player.playerSheet?.weaponId);

    return playerPower + (calculateWeaponCounterMaxPower(weaponDetails?.attributes.power ?? 0, weapon?.level ?? 0) ?? 0);
}

export function calculateMaxMP(player: GetPlayerResponse | null): number {
    return 9;
}

export function calculateMaxLuminas(player: GetPlayerResponse | null): number {
    return 0;
}

export function calculateSpecialAttackPoints(player: GetPlayerResponse | null): number {
    return (player?.playerSheet?.totalPoints ?? 0) * 3;
}

export function calculateInitialMP(player: GetPlayerResponse | null): number {
    const intelligence = player?.playerSheet?.abilityScores?.intelligence ?? 10;
    const intMod = Math.floor((intelligence - 10) / 2);
    return 2 + intMod;
}

export function calculateMaxPA(player: GetPlayerResponse | null): number {
    return 0;
}

export function rollCommandForInitiative(weaponInfo: WeaponInfo | null) {
    return "1d6";
}

export function rollCommandForDefense(player: GetPlayerResponse, weaponInfo: WeaponInfo | null, defenseOption: DefenseOption) {
    return "1d6";
}

export function initiativeTotal(player: GetPlayerResponse, diceResult: any, weaponInfo?: WeaponInfo | null) {
    const total = diceTotal(diceResult);
    const failures = calculateFailureDiv(diceResult);
    var playerInitiative = calculateCriticalBonus(diceResult);

    if (failures > 0) {
        playerInitiative = playerInitiative - (failures * 4);
    }

    return total + Math.max(0, playerInitiative);
}

export function playerHasStatus(player: GetPlayerResponse | null, status: StatusType): boolean {
    const currentCharacter = getPlayerCharacter(player);
    if (!currentCharacter) { return false }

    return hasStatus(currentCharacter, status);
}

export function getPlayerStatus(player: GetPlayerResponse | null, status: StatusType): StatusResponse | undefined {
    const currentCharacter = getPlayerCharacter(player);
    if (!currentCharacter) { return undefined }

    return currentCharacter.status?.find(s => s.effectName === status);
}

export const playerHasShield = (p: GetPlayerResponse | null) => playerHasStatus(p, "Shielded");
export const playerHasEmpowered = (p: GetPlayerResponse | null) => playerHasStatus(p, "Empowered");
export const playerHasWeakened = (p: GetPlayerResponse | null) => playerHasStatus(p, "Weakened");
export const playerHasEntangled = (p: GetPlayerResponse | null) => playerHasStatus(p, "Entangled");
export const playerHasExhausted = (p: GetPlayerResponse | null) => playerHasStatus(p, "Exhausted");
export const playerHasMarked = (p: GetPlayerResponse | null) => playerHasStatus(p, "Marked");
export const getPlayerFrenzy = (p: GetPlayerResponse | null) => getPlayerStatus(p, "Frenzy");
export const getPlayerDizzy = (p: GetPlayerResponse | null) => getPlayerStatus(p, "Dizzy");
export const playerHasDizzy = (p: GetPlayerResponse | null) => playerHasStatus(p, "Dizzy");
