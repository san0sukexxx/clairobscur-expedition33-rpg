import { type GetPlayerResponse } from "../api/APIPlayer";
import { type BattleCharacterInfo, type StatusResponse, type StatusType, type WeaponInfo } from "../api/ResponseModel";
import {
    calculateCriticalBonus,
    calculateFailureDiv,
    diceTotal,
    countCriticalRolls
} from "./DiceCalculator";
import { hasStatus } from "./NpcCalculator";
import { calculateWeaponVitalityBonus, calculateWeaponDefenseBonus, calculateWeaponDexterityBonus } from "./WeaponCalculator";
import { getPlayerCharacter } from "./CharacterUtils";
import { calculatePictoHealth, calculatePictoSpeed, calculatePictoDefense, calculatePictoAbility, getPictoByName } from "./PictoUtils";

export function playerPictosTotalHealth(player: GetPlayerResponse | null): number {
    let total = 0;
    if (player?.pictos && player.pictos.length > 0) {
        const equippedPictos = player.pictos.filter(picto => picto.slot !== null && picto.slot !== undefined);

        for (const picto of equippedPictos) {
            const pictoInfo = getPictoByName(picto.pictoId);
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
            const pictoInfo = getPictoByName(picto.pictoId);
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
            const pictoInfo = getPictoByName(picto.pictoId);
            if (pictoInfo?.status?.defense) {
                total += calculatePictoDefense(pictoInfo.status.defense, picto.level ?? 1);
            }
        }
    }
    return total;
}

export function playerPictosTotalStrength(player: GetPlayerResponse | null): number {
    return playerPictosTotalAbility(player, 'strength');
}

export function playerPictosTotalIntelligence(player: GetPlayerResponse | null): number {
    return playerPictosTotalAbility(player, 'intelligence');
}

export function playerPictosTotalWisdom(player: GetPlayerResponse | null): number {
    return playerPictosTotalAbility(player, 'wisdom');
}

export function playerPictosTotalCharisma(player: GetPlayerResponse | null): number {
    return playerPictosTotalAbility(player, 'charisma');
}

function playerPictosTotalAbility(player: GetPlayerResponse | null, ability: 'strength' | 'intelligence' | 'wisdom' | 'charisma'): number {
    let total = 0;
    if (player?.pictos && player.pictos.length > 0) {
        const equippedPictos = player.pictos.filter(picto => picto.slot !== null && picto.slot !== undefined);

        for (const picto of equippedPictos) {
            const pictoInfo = getPictoByName(picto.pictoId);
            if (pictoInfo?.status?.[ability]) {
                total += calculatePictoAbility(pictoInfo.status[ability], picto.level ?? 1);
            }
        }
    }
    return total;
}

export function calculatePlayerCriticalBonus(diceResult: any, player: GetPlayerResponse | null, weaponInfo: WeaponInfo | null, target?: BattleCharacterInfo): number {
    return calculateCriticalBonus(diceResult);
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

export function calculateArmorClass(player: GetPlayerResponse | null, weaponInfo: WeaponInfo | null): number {
    const baseDex = player?.playerSheet?.abilityScores?.dexterity ?? 10;
    const effectiveDex = Math.min(20, baseDex + calculateWeaponDexterityBonus(weaponInfo) + playerPictosTotalSpeed(player));
    const dexMod = Math.floor((effectiveDex - 10) / 2);
    return 10 + dexMod + calculateWeaponDefenseBonus(weaponInfo) + playerPictosTotalDefense(player);
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

export function calculateMaxMP(player: GetPlayerResponse | null): number {
    return 9;
}

export function calculateMaxLuminas(player: GetPlayerResponse | null): number {
    const level = player?.playerSheet?.totalPoints ?? 1;
    const bonus = player?.playerSheet?.luminaBonusPoints ?? 0;
    return (level * 8) + bonus;
}

/** Pontos de habilidade especial acumulados por nível. */
const SPECIAL_ATTACK_POINTS_BY_LEVEL: Record<number, number> = {
    1: 0,   2: 1,   3: 3,   4: 6,   5: 10,
    6: 15,  7: 21,  8: 28,  9: 36,  10: 45,
    11: 55, 12: 65, 13: 76, 14: 87, 15: 98,
    16: 109, 17: 120, 18: 131, 19: 142, 20: 153,
};

export function calculateSpecialAttackPoints(player: GetPlayerResponse | null): number {
    const level = player?.playerSheet?.totalPoints ?? 1;
    return SPECIAL_ATTACK_POINTS_BY_LEVEL[level] ?? 0;
}

export function calculateInitialMP(player: GetPlayerResponse | null): number {
    const baseInt = player?.playerSheet?.abilityScores?.intelligence ?? 10;
    const effectiveInt = Math.min(20, baseInt + playerPictosTotalIntelligence(player));
    const intMod = Math.floor((effectiveInt - 10) / 2);
    return 2 + intMod;
}

export function calculateMaxPA(player: GetPlayerResponse | null): number {
    return 0;
}

export function rollCommandForInitiative(weaponInfo: WeaponInfo | null) {
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
