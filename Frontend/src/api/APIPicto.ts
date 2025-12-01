// APIPicto.ts
import { api } from "./api"

export interface Picto {
    id: number
    name: string
    description: string
    color: string
    baseLuminaCost: number
    speed?: number | null
    criticalRate?: number | null
    health?: number | null
    defense?: number | null
}

export interface CreatePictoInput {
    name: string
    description: string
    color: string
    baseLuminaCost: number
    speed?: number | null
    criticalRate?: number | null
    health?: number | null
    defense?: number | null
}

export interface UpdatePictoInput {
    name: string
    description: string
    color: string
    baseLuminaCost: number
    speed?: number | null
    criticalRate?: number | null
    health?: number | null
    defense?: number | null
}

export interface PlayerPicto {
    id: number
    playerId: number
    pictoId: number
    level: number
}

export interface CreatePlayerPictoInput {
    playerId: number
    pictoId: number
    level: number
}

export interface UpdatePlayerPictoInput {
    level: number
}

export class APIPicto {
    static async list(): Promise<Picto[]> {
        return api.get<Picto[]>("pictos")
    }

    static async getById(id: number): Promise<Picto> {
        return api.get<Picto>(`pictos/${id}`)
    }

    static async create(input: CreatePictoInput): Promise<number> {
        return api.post<CreatePictoInput, number>("pictos", input)
    }

    static async update(id: number, input: UpdatePictoInput): Promise<void> {
        await api.put<UpdatePictoInput, void>(`pictos/${id}`, input)
    }

    static async delete(id: number): Promise<void> {
        await api.delete<void>(`pictos/${id}`)
    }

    static async listPlayerPictos(): Promise<PlayerPicto[]> {
        return api.get<PlayerPicto[]>("player-pictos")
    }

    static async getPlayerPictoById(id: number): Promise<PlayerPicto> {
        return api.get<PlayerPicto>(`player-pictos/${id}`)
    }

    static async createPlayerPicto(input: CreatePlayerPictoInput): Promise<number> {
        return api.post<CreatePlayerPictoInput, number>("player-pictos", input)
    }

    static async updatePlayerPicto(id: number, input: UpdatePlayerPictoInput): Promise<void> {
        await api.put<UpdatePlayerPictoInput, void>(`player-pictos/${id}`, input)
    }

    static async deletePlayerPicto(id: number): Promise<void> {
        await api.delete<void>(`player-pictos/${id}`)
    }
}
