import type { GetPlayerResponse } from "../api/APIPlayer";
import type { SkillResponse } from "../api/ResponseModel";
import { SkillsList } from "../data/SkillList";

export function getPlayerHasSkill(id: string, player: GetPlayerResponse): boolean {
    if(!player.skills || player.skills.length == 0) {
        return false;
    }

    return player.skills.find(
        (skill) => skill.skillId === id
    ) != undefined;
}

export function hasPrerequisitesFulfilled(id: string, player: GetPlayerResponse): boolean {
    const skillInfo = getSkillById(id)

    if(!skillInfo || !skillInfo.pre_requisite || skillInfo.pre_requisite.length === 0) {
        return true;
    }

    if(!player.skills || player.skills.length == 0) {
        return false;
    }

    return skillInfo.pre_requisite.some(preReqId =>
        player.skills!.find(skill => skill.skillId === preReqId) !== undefined
    );
}

export function getSkillIsBlocked(id: string, player: GetPlayerResponse): boolean {
    const skillInfo = getSkillById(id)

    if(!skillInfo || !skillInfo.isBlocked) {
        return false;
    }

    if(!skillInfo.pre_requisite || skillInfo.pre_requisite.length === 0) {
        return false;
    }

    if(!player.skills || player.skills.length == 0) {
        return true;
    }

    return !skillInfo.pre_requisite.some(preReqId =>
        player.skills!.find(skill => skill.skillId === preReqId) !== undefined
    );
}

export function getSkillById(id: string): SkillResponse | undefined {
    return SkillsList.find(
        (skill) => skill.id === id
    );
}

export function getSkillByName(name: string): SkillResponse | undefined {
    return SkillsList.find(
        (skill) => skill.name.toLowerCase() === name.toLowerCase()
    );
}

export function getAllPictosSorted(): SkillResponse[] {
    return [...SkillsList].sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR")
    );
}

export function getEnrichedCharacterSkills(
    player: GetPlayerResponse | null
): SkillResponse[] {
    if (!player?.playerSheet?.characterId) return [];

    const characterId = player.playerSheet.characterId;

    return SkillsList
        .filter(skill => skill.character === characterId)
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export function calculateUsedSkillPoints(player: GetPlayerResponse | null): number {
    if (!player?.skills) return 0;

    return player.skills.reduce((total, playerSkill) => {
        const skillInfo = getSkillById(playerSkill.skillId);
        return total + (skillInfo?.cost ?? 0);
    }, 0);
}