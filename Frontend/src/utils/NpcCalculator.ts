import { type NPCInfo, type BattleCharacterInfo, type StatusType, type StatusResponse } from "../api/ResponseModel"
import { getNpcById } from "../utils/NpcUtils"

export function randomizeNpcInitiativeTotal(npc: NPCInfo) {
    const diceResult = Math.floor(Math.random() * 6) + 1

    if (diceResult == 1) {
        return 1;
    }

    const criticalBonus = diceResult == 6 ? 4 : 0;
    const failurePenalty = diceResult == 1 ? 2 : 0;
    const initiativeBonus = npc.initiativeBonus ?? 0;

    const dexMod = Math.floor((npc.dexterity - 10) / 2);
    return diceResult + dexMod + criticalBonus - failurePenalty + initiativeBonus;
}

export function getNPCMaxHealth(npc: NPCInfo) {
    const baseHealth = npc.constitution;
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

export function getStatus(target: BattleCharacterInfo, status: StatusType): StatusResponse | undefined {
    return target.status?.find(s => s.effectName === status);
}

export function hasStatus(target: BattleCharacterInfo, status: StatusType): boolean {
    return target.status?.some(s => s.effectName === status) ?? false;
}

export const hasShield = (t: BattleCharacterInfo) => hasStatus(t, "Shield");
export const hasHastened = (t: BattleCharacterInfo) => hasStatus(t, "Rush");
export const hasSlowed = (t: BattleCharacterInfo) => hasStatus(t, "Slowed");
export const hasWeakened = (t: BattleCharacterInfo) => hasStatus(t, "Weakened");
export const hasEmpowered = (t: BattleCharacterInfo) => hasStatus(t, "Empowered");
export const hasShell = (t: BattleCharacterInfo) => hasStatus(t, "Shell");
export const hasUnprotected = (t: BattleCharacterInfo) => hasStatus(t, "Unprotected");
export const getFrenzyStatus = (t: BattleCharacterInfo) => getStatus(t, "Frenzy");
export const hasMarked = (t: BattleCharacterInfo) => hasStatus(t, "Marked");
export const hasBroken = (t: BattleCharacterInfo) => hasStatus(t, "Broken");
