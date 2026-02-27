import { api } from "./api";

export interface CreatePlayerSpecialAttackRequest {
    playerId: number;
    specialAttackId: string;
    slot?: number | null;
}

export interface UpdatePlayerSpecialAttackRequest {
    slot?: number | null;
}

export class APISpecialAttack {
    static async addPlayerSpecialAttack(input: CreatePlayerSpecialAttackRequest): Promise<number> {
        return api.post<CreatePlayerSpecialAttackRequest, number>("player-special-attacks", input);
    }

    static async updatePlayerSpecialAttack(id: number, input: UpdatePlayerSpecialAttackRequest): Promise<void> {
        await api.put<UpdatePlayerSpecialAttackRequest, void>(`player-special-attacks/${id}`, input);
    }

    static async deletePlayerSpecialAttack(id: number): Promise<void> {
        await api.delete<void>(`player-special-attacks/${id}`);
    }

    static async deleteAllPlayerSpecialAttacks(playerId: number): Promise<void> {
        await api.delete<void>(`player-special-attacks/player/${playerId}`);
    }
}
