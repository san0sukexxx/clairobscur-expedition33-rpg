import type { GetPlayerResponse } from "../api/APIPlayer";
import type { SkillResponse } from "../api/ResponseModel";
import { SkillsList } from "../data/SkillList";

export function getPlayerHasSkill(id: string, player: GetPlayerResponse): boolean {
    if(!player.skills || player.skills.length == 0) {
        return false;
    }
    
    return player.skills.find(
        (skill) => skill.id === id
    ) != undefined;
}

export function getSkillIsBlocked(id: string, player: GetPlayerResponse): boolean {
    const skillInfo = getSkillById(id)

    if(!skillInfo || !skillInfo.pre_requisite || skillInfo.pre_requisite.length === 0) {
        return false;
    }
    
    if(!player.skills || player.skills.length == 0) {
        return true;
    }
    
    return player.skills.find(
        (skill) => skill.id === id
    ) != undefined;
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