import { api } from "./api";

export interface CreatePlayerSkillRequest {
    playerId: number;
    skillId: string;
}

export class APISkill {
    static async addPlayerSkill(input: CreatePlayerSkillRequest): Promise<number> {
        return api.post<CreatePlayerSkillRequest, number>("player-Skills", input);
    }

    static async deletePlayerSkill(id: number): Promise<void> {
        await api.delete<void>(`player-Skills/${id}`);
    }
}
