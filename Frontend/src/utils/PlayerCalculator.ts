import { type GetPlayerResponse } from "../api/APIPlayer";
import { calculateWeaponPlusDices, calculateWeaponPlusPower, calculateWeaponCounterMaxPower } from "./WeaponCalculator";
import { type WeaponDTO } from "../types/WeaponDTO";
import { type AttackType, type BattleCharacterInfo, type DefenseOption, type StatusResponse, type StatusType, type WeaponInfo, type Stance } from "../api/ResponseModel";
import {
    calculateCriticalMulti,
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

export function calculatePlayerCriticalMulti(diceResult: any, player: GetPlayerResponse | null): number {
    const baseCriticalMulti = calculateCriticalMulti(diceResult);
    const criticalRolls = countCriticalRolls(diceResult);

    if (criticalRolls > 0) {
        const pictoCritical = playerPictosTotalCritical(player);
        return baseCriticalMulti + pictoCritical;
    }

    return baseCriticalMulti;
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
            return Math.floor(calculateMaxHP(player, weaponInfo) / status.ammount / 10);
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

export function calculateAttackDamage(player: GetPlayerResponse | null, weaponInfo: WeaponInfo | null, npcBattleCharacterInfo: BattleCharacterInfo, diceResult: any, attackType: AttackType, stance?: Stance | null): number {
    if (hasShield(npcBattleCharacterInfo)) {
        return 0;
    }

    let damage = 0;
    if (attackType == "basic") {
        damage = calculateBasicAttackDamage(player, weaponInfo, npcBattleCharacterInfo.id, diceResult);
    } else if (attackType == "free-shot") {
        damage = calculateFreeShotAttackDamage(player, npcBattleCharacterInfo, diceResult, attackType);
    } else {
        damage = 1;
    }

    // Apply stance modifiers to damage dealt
    if (stance === "Offensive") {
        damage = Math.floor(damage * 1.5);  // +50% damage
    } else if (stance === "Virtuous") {
        damage = Math.floor(damage * 3.0);  // +200% damage (3x total)
    }

    return damage;
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

export function calculateFreeShotAttackDamage(player: GetPlayerResponse | null, npcBattleCharacterInfo: BattleCharacterInfo, diceResult: any, attackType: AttackType): number {
    const total = diceTotal(diceResult);
    const failures = calculateFailureDiv(diceResult)
    var criticalMulti = calculatePlayerCriticalMulti(diceResult, player)

    var playerPower = (player?.playerSheet?.power ?? 0) * criticalMulti;
    if (failures > 0) {
        playerPower = Math.floor(playerPower / failures);
    }
    playerPower += calculateFreeShotPlus(player, npcBattleCharacterInfo, attackType)

    const playerDizzy = getPlayerDizzy(player)
    let damage = playerPower + total
    if (playerDizzy) {
        damage = Math.floor(damage / 2)
    }

    return damage;
}

export function calculateBasicAttackDamage(player: GetPlayerResponse | null, weaponInfo: WeaponInfo | null, npcId: string, diceResult: any): number {
    const npcInfo = getNpcById(npcId)

    const total = diceTotal(diceResult);
    const failures = calculateFailureDiv(diceResult)

    let empoweredMulti = playerHasEmpowered(player) ? 2 : 1;
    empoweredMulti = playerHasWeakened(player) ? 0.5 : empoweredMulti;

    var playerPower = (player?.playerSheet?.power ?? 0) * calculatePlayerCriticalMulti(diceResult, player) * empoweredMulti;

    if (failures > 0) {
        playerPower = Math.floor(playerPower / failures);
    }
    let attackDamage = playerPower + calculateRawWeaponPower(weaponInfo, "basic") + total;

    if (npcInfo != undefined) {
        attackDamage = Math.floor(
            attackDamage * (getWeaponElementModifier(npcId, weaponInfo)?.multiplier ?? 1)
        );
    }

    attackDamage += (getPlayerFrenzy(player)?.ammount ?? 0);

    return attackDamage;
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
            damage = Math.floor(damage * 0.5);  // -50% damage received
        } else if (stance === "Offensive") {
            damage = Math.floor(damage * 1.5);  // +50% damage received
        }
        return damage;
    }

    let hastenedMulti = hasHastened(playerCharacter) ? 2 : 1;
    hastenedMulti = hasSlowed(playerCharacter) ? 0.5 : hastenedMulti;

    let protectedMulti = hasProtected(playerCharacter) ? 2 : 1;
    protectedMulti = hasUnprotected(playerCharacter) ? 0.5 : protectedMulti;

    const diceTotalSum = diceTotal(diceResult);
    const failures = calculateFailureDiv(diceResult)
    var playerDefense = 0;

    if (defenseOption == "block" || defenseOption == "dodge") {
        var resistance = (player?.playerSheet?.resistance ?? 0) * calculatePlayerCriticalMulti(diceResult, player) * protectedMulti;
        if (failures > 0) {
            resistance = Math.floor(resistance / failures);
        }

        playerDefense = resistance + diceTotalSum;
    } else if (defenseOption == "gradient-block") {
        var power = (player?.playerSheet?.power ?? 0) * calculatePlayerCriticalMulti(diceResult, player);

        if (failures > 0) {
            power = Math.floor(power / failures);
        }

        power -= 2;

        playerDefense = power + diceTotalSum;
    } else if (defenseOption == "jump") {
        var hability = (player?.playerSheet?.hability ?? 0) * calculatePlayerCriticalMulti(diceResult, player) * hastenedMulti;
        if (failures > 0) {
            hability = hability / failures
        }

        playerDefense = hability + diceTotalSum;
    }

    if (defenseOption == "dodge") {
        playerDefense += (player?.playerSheet?.hability ?? 0) * hastenedMulti;
    }

    if (defenseOption == "dodge" || defenseOption == "jump") {
        playerDefense += playerPictosTotalSpeed(player);
    }

    if (defenseOption == "block") {
        playerDefense += playerPictosTotalDefense(player);
    }

    playerDefense = playerHasMarked(player) ? Math.floor(playerDefense * 0.5) : playerDefense;

    let damageReceived = totalDamage - Math.floor(playerDefense);

    // Apply stance modifiers to damage received after defense calculation
    if (stance === "Defensive") {
        damageReceived = Math.floor(damageReceived * 0.5);  // -50% damage received
    } else if (stance === "Offensive") {
        damageReceived = Math.floor(damageReceived * 1.5);  // +50% damage received
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

    const pictosSpeedBonus = playerPictosTotalSpeed(player);

    return total + playerInitiative + pictosSpeedBonus;
}

export function playerHasStatus(player: GetPlayerResponse | null, status: StatusType): boolean {
    const currentCharacter = getPlayerCharacter(player);
    if(!currentCharacter) { return false }
    
    return hasStatus(currentCharacter, status);
}

export function getPlayerStatus(player: GetPlayerResponse | null, status: StatusType): StatusResponse | undefined {
    const currentCharacter = getPlayerCharacter(player);
    if(!currentCharacter) { return undefined }
    
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