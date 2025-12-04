import { api } from "./api"

export interface CreatePlayerLuminaRequest {
    playerId: number
    pictoId: string
}

export interface UpdatePlayerLuminaRequest {
    isEquiped: boolean
}

export class APILumina {
    static async createPlayerLumina(input: CreatePlayerLuminaRequest): Promise<number> {
        return api.post<CreatePlayerLuminaRequest, number>("player-luminas", input)
    }

    static async updatePlayerLumina(id: number, input: UpdatePlayerLuminaRequest): Promise<void> {
        await api.put<UpdatePlayerLuminaRequest, void>(`player-luminas/${id}`, input)
    }

    static async deletePlayerLumina(id: number): Promise<void> {
        await api.delete<void>(`player-luminas/${id}`)
    }
}
