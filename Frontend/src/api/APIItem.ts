import { api } from "./api"

export interface CreatePlayerItemRequest {
    playerId: number
    itemId: string
    quantity?: number
    maxQuantity?: number
}

export interface UpdatePlayerItemRequest {
    quantity?: number
    maxQuantity?: number
}

export interface UseItemRequest {
    playerId: number
    itemId: string
    maxHp: number
    maxMp: number
    recoveryPercent?: number
    targetBattleCharacterId?: number
}

export class APIItem {
    static async createPlayerItem(input: CreatePlayerItemRequest): Promise<number> {
        return api.post<CreatePlayerItemRequest, number>("player-items", input)
    }

    static async updatePlayerItem(id: number, input: UpdatePlayerItemRequest): Promise<void> {
        await api.put<UpdatePlayerItemRequest, void>(`player-items/${id}`, input)
    }

    static async deletePlayerItem(id: number): Promise<void> {
        await api.delete<void>(`player-items/${id}`)
    }

    static async useItem(input: UseItemRequest): Promise<void> {
        await api.post<UseItemRequest, void>("player-items/use", input)
    }
}
