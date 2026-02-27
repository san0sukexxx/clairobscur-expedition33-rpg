import type { GetPlayerResponse } from "../api/APIPlayer";
import type { SpecialAttackResponse } from "../api/ResponseModel";
import { SpecialAttacksList } from "../data/SpecialAttackList";

export function getPlayerHasSpecialAttack(id: string, player: GetPlayerResponse): boolean {
    if(!player.specialAttacks || player.specialAttacks.length == 0) {
        return false;
    }

    return player.specialAttacks.find(
        (sa) => sa.specialAttackId === id
    ) != undefined;
}

export function hasPrerequisitesFulfilled(id: string, player: GetPlayerResponse): boolean {
    const specialAttackInfo = getSpecialAttackById(id)

    if(!specialAttackInfo || !specialAttackInfo.preRequisite || specialAttackInfo.preRequisite.length === 0) {
        return true;
    }

    if(!player.specialAttacks || player.specialAttacks.length == 0) {
        return false;
    }

    return specialAttackInfo.preRequisite.some(preReqId =>
        player.specialAttacks!.find(sa => sa.specialAttackId === preReqId) !== undefined
    );
}

export function getSpecialAttackIsBlocked(id: string, player: GetPlayerResponse): boolean {
    const specialAttackInfo = getSpecialAttackById(id)

    if(!specialAttackInfo || !specialAttackInfo.isBlocked) {
        return false;
    }

    if(!specialAttackInfo.preRequisite || specialAttackInfo.preRequisite.length === 0) {
        return false;
    }

    if(!player.specialAttacks || player.specialAttacks.length == 0) {
        return true;
    }

    return !specialAttackInfo.preRequisite.some(preReqId =>
        player.specialAttacks!.find(sa => sa.specialAttackId === preReqId) !== undefined
    );
}

export function getSpecialAttackById(id: string): SpecialAttackResponse | undefined {
    return SpecialAttacksList.find(
        (sa) => sa.id === id
    );
}

export function getSpecialAttackByName(name: string): SpecialAttackResponse | undefined {
    return SpecialAttacksList.find(
        (sa) => sa.name.toLowerCase() === name.toLowerCase()
    );
}

export function getAllSpecialAttacksSorted(): SpecialAttackResponse[] {
    return [...SpecialAttacksList].sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR")
    );
}

export function getEnrichedCharacterSpecialAttacks(
    player: GetPlayerResponse | null
): SpecialAttackResponse[] {
    if (!player?.playerSheet?.characterId) return [];

    const characterId = player.playerSheet.characterId;

    return SpecialAttacksList
        .filter(sa => sa.character === characterId)
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export function calculateUsedSpecialAttackPoints(player: GetPlayerResponse | null): number {
    if (!player?.specialAttacks) return 0;

    return player.specialAttacks.reduce((total, playerSA) => {
        const saInfo = getSpecialAttackById(playerSA.specialAttackId);
        return total + (saInfo?.unlockCost ?? 0);
    }, 0);
}
