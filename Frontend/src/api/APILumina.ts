// APILumina.ts
import { api } from "./api"

export interface PlayerLumina {
    id: number
    playerId: number
    pictoId: string
}

export interface CreatePlayerLuminaInput {
    playerId: number
    pictoId: string
}

export interface UpdatePlayerLuminaInput {
    pictoId: string
}

export class APILumina {
    static async list(): Promise<PlayerLumina[]> {
        return api.get<PlayerLumina[]>("player-luminas")
    }

    static async getById(id: number): Promise<PlayerLumina> {
        return api.get<PlayerLumina>(`player-luminas/${id}`)
    }

    static async create(input: CreatePlayerLuminaInput): Promise<number> {
        return api.post<CreatePlayerLuminaInput, number>("player-luminas", input)
    }

    static async update(id: number, input: UpdatePlayerLuminaInput): Promise<void> {
        await api.put<UpdatePlayerLuminaInput, void>(`player-luminas/${id}`, input)
    }

    static async delete(id: number): Promise<void> {
        await api.delete<void>(`player-luminas/${id}`)
    }
}
