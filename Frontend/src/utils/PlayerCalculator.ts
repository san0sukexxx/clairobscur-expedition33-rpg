import { type GetPlayerResponse } from "../api/APIPlayer";
import { calculateWeaponPlusPower, calculateWeaponCounterMaxPower, calculateWeaponLuckBonus } from "./WeaponCalculator";
import { type WeaponDTO } from "../types/WeaponDTO";
import { type AttackType, type BattleCharacterInfo, type DefenseOption, type StatusResponse, type StatusType, type WeaponInfo, type Stance } from "../api/ResponseModel";
import {
    calculateCriticalBonus,
    calculateFailureDiv,
    diceTotal,
    countCriticalRolls
} from "./DiceCalculator";
import { getNpcById } from "../utils/NpcUtils"
import { getWeaponElementModifier, hasHastened, hasProtected, hasShield, hasSlowed, hasStatus, hasUnprotected } from "./NpcCalculator";
import { calculateWeaponVitalityBonus, calculateWeaponAgilityBonus, calculateWeaponDefenseBonus } from "./WeaponCalculator";
import { getPlayerCharacter } from "./CharacterUtils";
import { PictosList } from "../data/PictosList";
import { calculatePictoHealth, calculatePictoSpeed, calculatePictoDefense, calculatePictoCritical } from "./PictoUtils";
import { getVersoPerfectionDamageBonus } from "./BattleUtils";

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
        const luckBonus = calculateWeaponLuckBonus(weaponInfo);
        return baseCriticalBonus + pictoCritical + luckBonus;
    }

    return baseCriticalBonus;
}

export function calculateMaxHP(player: GetPlayerResponse | null, weaponInfo: WeaponInfo | null): number {
    const vitalityValue = calculateWeaponVitalityBonus(weaponInfo);
    const resistanceHealth = (player?.playerSheet?.resistance ?? 0) * 5;
    const pictosHealthBonus = playerPictosTotalHealth(player);

    return resistanceHealth + vitalityValue + pictosHealthBonus;
}

export function calculateStatusResolvedTotalValue(player: GetPlayerResponse | null, weaponInfo: WeaponInfo | null, status: StatusResponse): number {
    switch (status.effectName) {
        case "Regeneration":
            return Math.floor(calculateMaxHP(player, weaponInfo) * status.ammount / 10);
        default:
            return 0;
    }
}

export function calculateResolveStatusWithDiceTotal(player: GetPlayerResponse | null, weaponInfo: WeaponInfo | null, status: StatusResponse, diceResult: any): number {
    const total = diceTotal(diceResult)

    switch (status.effectName) {
        case "Confused":
            return total + (player?.playerSheet?.resistance ?? 0);
        default:
            return total;
    }
}

export function calculateRawWeaponPower(weaponInfo: WeaponInfo | null, attackType: AttackType): number {
    if (weaponInfo == null || attackType == "free-shot") {
        return 0;
    }

    return (calculateWeaponPlusPower(weaponInfo.details?.attributes.power ?? 0, weaponInfo.weapon?.level ?? 0) ?? 0);
}

/**
 * Calculates base power for attacks (used by both basic attacks and skills)
 * Includes: player power, critical bonus, empowered/weakened, failures, weapon power, dice total, frenzy
 * Does NOT include: element modifiers, Verso perfection bonus (those are applied separately)
 */
export function calculateBasePower(player: GetPlayerResponse | null, weaponInfo: WeaponInfo | null, diceResult: any): number {
    const total = diceTotal(diceResult);
    const failures = calculateFailureDiv(diceResult);

    let empoweredBonus = playerHasEmpowered(player) ? 4 : 0;
    empoweredBonus = playerHasWeakened(player) ? -4 : empoweredBonus;

    let playerPower = (player?.playerSheet?.power ?? 0) + calculatePlayerCriticalBonus(diceResult, player, weaponInfo) + empoweredBonus;

    if (failures > 0) {
        playerPower = playerPower - (failures * 4);
    }

    let basePower = Math.max(0, playerPower) + calculateRawWeaponPower(weaponInfo, "basic") + total;

    // Add frenzy bonus
    basePower += (getPlayerFrenzy(player)?.ammount ?? 0);

    return basePower;
}

export function calculateAttackDamage(player: GetPlayerResponse | null, weaponInfo: WeaponInfo | null, npcBattleCharacterInfo: BattleCharacterInfo, diceResult: any, attackType: AttackType, stance?: Stance | null, playerChar?: BattleCharacterInfo): number {
    if (hasShield(npcBattleCharacterInfo)) {
        return 0;
    }

    let damage = 0;
    if (attackType == "basic") {
        damage = calculateBasicAttackDamage(player, weaponInfo, npcBattleCharacterInfo, diceResult, playerChar);
    } else if (attackType == "free-shot") {
        damage = calculateFreeShotAttackDamage(player, npcBattleCharacterInfo, diceResult, attackType, weaponInfo, playerChar);
    } else {
        damage = 1;
    }

    // Apply stance modifiers to damage dealt
    if (stance === "Offensive") {
        damage = damage + 4;  // +4 damage dealt
    } else if (stance === "Virtuous") {
        damage = damage + 8;  // +8 damage dealt
    }
    // Note: Defensive stance does NOT reduce damage dealt

    return Math.max(0, damage);
}

export function calculateFreeShotPlus(player: GetPlayerResponse | null, npcBattleCharacterInfo: BattleCharacterInfo, attackType: AttackType): number {
    if (attackType != "free-shot") { return 0; }
    const npcInfo = getNpcById(npcBattleCharacterInfo.id)

    if (npcInfo?.freeShotWeakPoints != undefined) {
        const statusFreeShot = npcBattleCharacterInfo.status?.find(s => s.effectName == "free-shot")

        if (!statusFreeShot || statusFreeShot.ammount < npcInfo.freeShotWeakPoints) {
            return (player?.playerSheet?.power ?? 0)
        }
    }

    return 0
}

export function calculateFreeShotAttackDamage(player: GetPlayerResponse | null, npcBattleCharacterInfo: BattleCharacterInfo, diceResult: any, attackType: AttackType, weaponInfo: WeaponInfo | null, playerChar?: BattleCharacterInfo): number {
    const total = diceTotal(diceResult);
    const failures = calculateFailureDiv(diceResult)
    var criticalBonus = calculatePlayerCriticalBonus(diceResult, player, weaponInfo);

    var playerPower = (player?.playerSheet?.power ?? 0) + criticalBonus;
    if (failures > 0) {
        playerPower = playerPower - (failures * 4);
    }
    playerPower += calculateFreeShotPlus(player, npcBattleCharacterInfo, attackType)

    const playerDizzy = getPlayerDizzy(player)
    let damage = Math.max(0, playerPower) + total
    if (playerDizzy) {
        damage = damage - 4;
    }

    // Verso's Perfection Rank: Damage bonus for free-shot attacks
    const isVerso = playerChar?.id?.toLowerCase().includes("verso");
    if (isVerso) {
        const versoPerfectionBonus = getVersoPerfectionDamageBonus(playerChar?.perfectionRank);
        damage = damage + versoPerfectionBonus;
    }

    return Math.max(0, damage);
}

export function calculateBasicAttackDamage(player: GetPlayerResponse | null, weaponInfo: WeaponInfo | null, npcTarget: BattleCharacterInfo, diceResult: any, playerChar?: BattleCharacterInfo): number {
    const npcInfo = getNpcById(npcTarget.id)

    // Use calculateBasePower for common calculations
    let attackDamage = calculateBasePower(player, weaponInfo, diceResult);

    // Apply element modifier (specific to basic attacks)
    const weaponElement = weaponInfo?.details?.attributes?.element;
    let elementModifier = npcInfo ? getWeaponElementModifier(npcTarget.id, weaponInfo) : undefined;

    // Check for FireVulnerability status (works like weakTo Fire: +4 damage)
    if (!elementModifier && weaponElement === "Fire" && hasStatus(npcTarget, "FireVulnerability")) {
        elementModifier = { flatBonus: 4, type: "weak" };
    }

    const elementBonus = elementModifier?.flatBonus ?? 0;
    attackDamage = attackDamage + elementBonus;

    console.log("=== Basic Attack Element ===");
    console.log("Weapon Element:", weaponElement ?? "None");
    if (elementModifier) {
        console.log("Element Modifier Type:", elementModifier.type);
        console.log("Element Bonus:", elementBonus);
    } else {
        console.log("No element modifier (neutral)");
    }

    // Verso's Perfection Rank: Damage bonus for basic attacks
    const isVerso = playerChar?.id?.toLowerCase().includes("verso");
    if (isVerso) {
        const versoPerfectionBonus = getVersoPerfectionDamageBonus(playerChar?.perfectionRank);
        attackDamage = attackDamage + versoPerfectionBonus;
    }

    return Math.max(0, attackDamage);
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
        var resistance = (player?.playerSheet?.resistance ?? 0) + calculatePlayerCriticalBonus(diceResult, player, weaponInfo) + protectedBonus;
        if (failures > 0) {
            resistance = resistance - (failures * 4);
        }

        playerDefense = Math.max(0, resistance) + diceTotalSum;
    } else if (defenseOption == "gradient-block") {
        var power = (player?.playerSheet?.power ?? 0) + calculatePlayerCriticalBonus(diceResult, player, weaponInfo);

        if (failures > 0) {
            power = power - (failures * 2);
        }

        power -= 2;

        playerDefense = Math.max(0, power) + diceTotalSum;
    } else if (defenseOption == "jump") {
        var hability = (player?.playerSheet?.hability ?? 0) + calculatePlayerCriticalBonus(diceResult, player, weaponInfo) + hastenedBonus;
        if (failures > 0) {
            hability = hability - (failures * 2);
        }

        playerDefense = Math.max(0, hability) + diceTotalSum;
    }

    if (defenseOption == "dodge") {
        // Reduced bonus for better PvP balance
        playerDefense += Math.floor((player?.playerSheet?.hability ?? 0) / 2) + hastenedBonus;
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
            playerDefense += calculateWeaponAgilityBonus(weaponInfo)
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

export function calculateMaxLuminas(player: GetPlayerResponse | null): number {
    return (player?.playerSheet?.power ?? 0) * 10;
}

export function calculateSkillPoints(player: GetPlayerResponse | null): number {
    return (player?.playerSheet?.totalPoints ?? 0) * 2;
}

export function calculateInitialMP(player: GetPlayerResponse | null): number {
    return (player?.playerSheet?.hability ?? 0);
}

export function calculateMaxPA(player: GetPlayerResponse | null): number {
    return (player?.playerSheet?.power ?? 0);
}

export function rollCommandForInitiative(weaponInfo: WeaponInfo | null) {
    return "1d6";
}

export function rollCommandForBasicAttack(weaponInfo: WeaponInfo | null) {
    return `1d6`;
}

export function rollCommandForAttack(weaponInfo: WeaponInfo | null, attackType: AttackType) {
    return `1d6`;
}

export function rollCommandForDefense(player: GetPlayerResponse, weaponInfo: WeaponInfo | null, defenseOption: DefenseOption) {
    return "1d6";
}

export function initiativeTotal(player: GetPlayerResponse, diceResult: any, weaponInfo?: WeaponInfo | null) {
    const total = diceTotal(diceResult);
    const failures = calculateFailureDiv(diceResult);
    var playerInitiative = (player?.playerSheet?.hability ?? 0) + calculateCriticalBonus(diceResult);

    if (failures > 0) {
        playerInitiative = playerInitiative - (failures * 4);
    }

    const pictosSpeedBonus = playerPictosTotalSpeed(player);
    const weaponAgilityBonus = calculateWeaponAgilityBonus(weaponInfo ?? null);

    return total + Math.max(0, playerInitiative) + pictosSpeedBonus + weaponAgilityBonus;
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