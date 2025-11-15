import { type NPCInfo } from "../api/ResponseModel"
import { getNpcById } from "../data/NPCsList"

export function randomizeNpcInitiativeTotal(npc: NPCInfo) {
    const diceResult = Math.floor(Math.random() * 6) + 1

    if (diceResult == 1) {
        return 1;
    }

    const criticalMulti = diceResult == 6 ? 2 : 1;
    const failureDiv = diceResult == 1 ? 2 : 1;

    return diceResult + (npc.hability * criticalMulti / failureDiv);
}

export function randomizeNpcDefenseTotal(npc: NPCInfo) {
    const diceResult = Math.floor(Math.random() * 6) + 1

    const criticalMulti = diceResult == 6 ? 2 : 1;
    const failureDiv = diceResult == 1 ? 2 : 1;

    return diceResult + (npc.resistance * criticalMulti / failureDiv);
}

export function getNPCMaxHealth(npc: NPCInfo) {
    return npc.resistance * 5;
}

export function calculateAttackReceivedDamage(id: string, damage: number) {
    const npcInfo = getNpcById(id)

    if (npcInfo == undefined) { return 1 }

    const totalDefense = randomizeNpcDefenseTotal(npcInfo);
    return Math.max(1, damage - totalDefense)
}