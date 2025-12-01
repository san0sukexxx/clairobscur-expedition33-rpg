import { api } from "./api"

export interface CreatePlayerPictoInput {
    playerId: number
    pictoId: string
    level: number
}

export interface UpdatePlayerPictoInput {
    level: number
}

export interface UpdatePlayerPictoSlotInput {
    slot: number | null
}

export class APIPicto {
    static async createPlayerPicto(input: CreatePlayerPictoInput): Promise<number> {
        return api.post<CreatePlayerPictoInput, number>("player-pictos", input)
    }

    static async updatePlayerPicto(id: number, input: UpdatePlayerPictoInput): Promise<void> {
        await api.put<UpdatePlayerPictoInput, void>(`player-pictos/${id}`, input)
    }

    static async updatePlayerPictoSlot(id: number, input: UpdatePlayerPictoSlotInput): Promise<void> {
        await api.put<UpdatePlayerPictoSlotInput, void>(`player-pictos/${id}/slot`, input)
    }

    static async deletePlayerPicto(id: number): Promise<void> {
        await api.delete<void>(`player-pictos/${id}`)
    }
}
