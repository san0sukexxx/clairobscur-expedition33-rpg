import { type NPCInfo, type ElementModifier, type WeaponInfo, type BattleCharacterInfo, type StatusType, type StatusResponse } from "../api/ResponseModel"
import { getNpcById } from "../utils/NpcUtils"

import {
    calculateCriticalBonus,
    calculateFailureDiv,
    diceTotal
} from "./DiceCalculator";

export function randomizeNpcInitiativeTotal(npc: NPCInfo) {
    const diceResult = Math.floor(Math.random() * 6) + 1

    if (diceResult == 1) {
        return 1;
    }

    const criticalBonus = diceResult == 6 ? 4 : 0;
    const failurePenalty = diceResult == 1 ? 2 : 0;
    const initiativeBonus = npc.initiativeBonus ?? 0;

    return diceResult + npc.hability + criticalBonus - failurePenalty + initiativeBonus;
}

export function randomizeNpcDefenseTotal(npc: NPCInfo, target: BattleCharacterInfo) {
    let diceResult = Math.floor(Math.random() * 6) + 1

    const criticalBonus = diceResult == 6 ? 4 : 0;
    const failurePenalty = diceResult == 1 ? 2 : 0;
    let habilityBonus = 0
    let slowedPenalty = 0

    if (hasSlowed(target)) {
        slowedPenalty = 4;
    }
    if (hasHastened(target)) {
        habilityBonus = npc.hability;
    }

    let resistance = npc.resistance
    let protectionBonus = 0
    if (hasUnprotected(target)) {
        protectionBonus = -4;
    }
    if (hasProtected(target)) {
        protectionBonus = 4;
    }

    const total = diceResult + resistance + criticalBonus - failurePenalty + habilityBonus - slowedPenalty + protectionBonus;

    console.log("=== NPC Defense Roll ===");
    console.log("Dice:", diceResult);
    console.log("Resistance:", resistance);
    if (criticalBonus > 0) console.log("Critical Bonus:", criticalBonus);
    if (failurePenalty > 0) console.log("Failure Penalty:", -failurePenalty);
    if (habilityBonus > 0) console.log("Hability Bonus (Hastened):", habilityBonus);
    if (slowedPenalty > 0) console.log("Slowed Penalty:", -slowedPenalty);
    if (protectionBonus !== 0) console.log("Protection Bonus:", protectionBonus);
    console.log("Defense Total:", total);

    return total;
}

export function getNPCMaxHealth(npc: NPCInfo) {
    const baseHealth = npc.resistance * 5;
    const maxLifeBonus = npc.maxLifeBonus ?? 0;
    return Math.max(1, baseHealth + maxLifeBonus);
}

export function npcIsFlying(target: BattleCharacterInfo): boolean {
    if (target.type == "player") {
        return false;
    }

    return getNpcById(target.id)?.isFlying ?? false
}

export function npcIsFlyingById(id: string | undefined) {
    return getNpcById(id ?? "")?.isFlying ?? false
}

export function calculateNpcAttackReceivedDamage(target: BattleCharacterInfo, damage: number) {
    const npcInfo = getNpcById(target.id)

    if (npcInfo == undefined) { return 1 }

    if (hasShield(target)) {
        console.log("=== NPC Defense (Shielded) ===");
        console.log("NPC:", target.name);
        console.log("Damage blocked by shield");
        return 0;
    }

    let totalDefense = randomizeNpcDefenseTotal(npcInfo, target);
    const markedPenalty = hasMarked(target) ? 4 : 0;
    totalDefense = totalDefense - markedPenalty;
    const finalDamage = Math.max(1, damage - totalDefense);

    console.log("=== NPC Damage Calculation ===");
    console.log("NPC:", target.name);
    console.log("Incoming Damage:", damage);
    if (markedPenalty > 0) console.log("Marked Penalty:", -markedPenalty);
    console.log("Total Defense:", totalDefense);
    console.log("Final Damage Received:", finalDamage);

    return finalDamage;
}

export function checkForFragile(target: BattleCharacterInfo, damage: number): boolean {
    const npcInfo = getNpcById(target.id)

    if (npcInfo == undefined || hasBroken(target)) { return false }

    return npcInfo.resistance * 2 < damage
}

export function calculateNpcAttackPower(character: BattleCharacterInfo, diceResult: any): number {
    const npcInfo = getNpcById(character.id)
    const total = diceTotal(diceResult);
    const failures = calculateFailureDiv(diceResult)
    var npcPower = (npcInfo?.power ?? 0) + calculateCriticalBonus(diceResult);

    if (failures > 0) {
        npcPower = npcPower - (failures * 4);
    }
    return Math.max(0, npcPower) + total + (getFrenzyStatus(character)?.ammount ?? 0);
}

export function rollCommandForNpcInitiative(id: string) {
    return "1d6";
}

export function rollCommandForNpcAttack(id: string, npcAttack?: any) {
    const baseDice = 1;
    const additionalDices = npcAttack?.additionalDices ?? 0;
    const totalDices = baseDice + additionalDices;
    return `${totalDices}d6`;
}

export function getWeaponElementModifier(id: string, weaponInfo: WeaponInfo | null): ElementModifier | undefined {
    const npcInfo = getNpcById(id)

    if (npcInfo?.imuneTo != undefined || npcInfo?.resistentTo != undefined || npcInfo?.weakTo != undefined || npcInfo?.absorbElement != undefined) {
        if (weaponInfo != undefined && weaponInfo.details != null) {
            if (npcInfo?.absorbElement == weaponInfo.details?.attributes.element) {
                return {
                    flatBonus: -8,  // Negative bonus = healing
                    type: "absorb"
                };
            }
            if (npcInfo?.imuneTo == weaponInfo.details?.attributes.element) {
                return {
                    flatBonus: -999,  // Nullifies damage
                    type: "imune"
                };
            }
            if (npcInfo?.resistentTo == weaponInfo.details?.attributes.element) {
                return {
                    flatBonus: -4,
                    type: "resistent"
                };
            }
            if (npcInfo?.weakTo == weaponInfo.details?.attributes.element) {
                return {
                    flatBonus: 4,
                    type: "weak"
                };
            }
        }
    }
}

/**
 * Gets element modifier for a skill attack based on a specific element (not from weapon)
 * Used for skills with forcedElement or usesWeaponElement
 */
export function getElementModifier(npcId: string, element: string | undefined): ElementModifier | undefined {
    if (!element) return undefined;

    const npcInfo = getNpcById(npcId)
    if (!npcInfo) return undefined;

    if (npcInfo.absorbElement === element) {
        return {
            flatBonus: -8,  // Negative bonus = healing
            type: "absorb"
        };
    }
    if (npcInfo.imuneTo === element) {
        return {
            flatBonus: -999,  // Nullifies damage
            type: "imune"
        };
    }
    if (npcInfo.resistentTo === element) {
        return {
            flatBonus: -4,
            type: "resistent"
        };
    }
    if (npcInfo.weakTo === element) {
        return {
            flatBonus: 4,
            type: "weak"
        };
    }

    return undefined;
}

export function getStatus(target: BattleCharacterInfo, status: StatusType): StatusResponse | undefined {
    return target.status?.find(s => s.effectName === status);
}

export function hasStatus(target: BattleCharacterInfo, status: StatusType): boolean {
    return target.status?.some(s => s.effectName === status) ?? false;
}

export const hasShield = (t: BattleCharacterInfo) => hasStatus(t, "Shielded");
export const hasHastened = (t: BattleCharacterInfo) => hasStatus(t, "Hastened");
export const hasSlowed = (t: BattleCharacterInfo) => hasStatus(t, "Slowed");
export const hasWeakened = (t: BattleCharacterInfo) => hasStatus(t, "Weakened");
export const hasEmpowered = (t: BattleCharacterInfo) => hasStatus(t, "Empowered");
export const hasProtected = (t: BattleCharacterInfo) => hasStatus(t, "Protected");
export const hasUnprotected = (t: BattleCharacterInfo) => hasStatus(t, "Unprotected");
export const getFrenzyStatus = (t: BattleCharacterInfo) => getStatus(t, "Frenzy");
export const hasMarked = (t: BattleCharacterInfo) => hasStatus(t, "Marked");
export const hasFragile = (t: BattleCharacterInfo) => hasStatus(t, "Fragile");
export const hasBroken = (t: BattleCharacterInfo) => hasStatus(t, "Broken");
