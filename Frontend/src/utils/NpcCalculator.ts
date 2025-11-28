import { type NPCInfo, type Element, type ElementModifier, type ElementModifierType, type WeaponInfo, type BattleCharacterInfo } from "../api/ResponseModel"
import { getNpcById } from "../data/NPCsList"
import { type GetPlayerResponse } from "../api/APIPlayer";
import { type WeaponDTO } from "../types/WeaponDTO";

import {
    calculateCriticalMulti,
    calculateFailureDiv,
    diceTotal
} from "./DiceCalculator";

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

export function hasShield(target: BattleCharacterInfo): boolean {
    return target.status?.some(s => s.effectName == "Shielded") ?? false
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
        return 0;
    }

    const totalDefense = randomizeNpcDefenseTotal(npcInfo);
    return Math.max(1, damage - totalDefense)
}

export function calculateNpcAttackPower(id: string, diceResult: any): number {
    const npcInfo = getNpcById(id)
    const total = diceTotal(diceResult);
    const failures = calculateFailureDiv(diceResult)
    var npcPower = (npcInfo?.power ?? 0) * calculateCriticalMulti(diceResult);

    if (failures > 0) {
        npcPower = Math.floor(npcPower / failures);
    }
    return npcPower + total;
}

export function rollCommandForNpcInitiative(id: string) {
    return "1d6";
}

export function rollCommandForNpcAttack(id: string) {
    return "1d6";
}

export function getWeaponElementModifier(id: string, weaponInfo: WeaponInfo | null): ElementModifier | undefined {
    const npcInfo = getNpcById(id)
    
    if (npcInfo?.imuneTo != undefined || npcInfo?.resistentTo != undefined || npcInfo?.weakTo != undefined) {
        if (weaponInfo != undefined && weaponInfo.details != null) {
            if(npcInfo?.imuneTo == weaponInfo.details?.attributes.element) {
                return {
                    multiplier: 0,
                    type: "imune"
                };
            }
            if(npcInfo?.resistentTo == weaponInfo.details?.attributes.element) {
                return {
                    multiplier: 0.5,
                    type: "resistent"
                };
            }
            if(npcInfo?.weakTo == weaponInfo.details?.attributes.element) {
                return {
                    multiplier: 1.5,
                    type: "weak"
                };
            }
        }
    }
}