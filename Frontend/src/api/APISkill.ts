import { api } from "./api";

export interface CreatePlayerSkillRequest {
    playerId: number;
    skillId: string;
    slot?: number | null;
}

export interface UpdatePlayerSkillRequest {
    slot?: number | null;
}

export class APISkill {
    static async addPlayerSkill(input: CreatePlayerSkillRequest): Promise<number> {
        return api.post<CreatePlayerSkillRequest, number>("player-Skills", input);
    }

    static async updatePlayerSkill(id: number, input: UpdatePlayerSkillRequest): Promise<void> {
        await api.put<UpdatePlayerSkillRequest, void>(`player-Skills/${id}`, input);
    }

    static async deletePlayerSkill(id: number): Promise<void> {
        await api.delete<void>(`player-Skills/${id}`);
    }
}
