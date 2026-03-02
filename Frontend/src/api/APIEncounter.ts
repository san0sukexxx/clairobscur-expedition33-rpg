import { api } from "./api"

export interface EncounterNpcDto {
    npcId: string
    quantity: number
}

export interface EncounterRewardDto {
    rewardType: string
    itemId: string
    level: number
}

export interface EncounterResponse {
    id: number
    campaignId: number
    name: string
    npcs: EncounterNpcDto[]
    rewards: EncounterRewardDto[]
}

export interface CreateEncounterInput {
    campaignId: number
    name: string
}

export interface UpdateEncounterInput {
    name: string
    npcs: EncounterNpcDto[]
    rewards: EncounterRewardDto[]
}

export class APIEncounter {
    static async listByCampaign(campaignId: number): Promise<EncounterResponse[]> {
        return api.get<EncounterResponse[]>(`encounters/campaign/${campaignId}`)
    }

    static async getById(id: number): Promise<EncounterResponse> {
        return api.get<EncounterResponse>(`encounters/${id}`)
    }

    static async create(input: CreateEncounterInput): Promise<EncounterResponse> {
        return api.post<CreateEncounterInput, EncounterResponse>("encounters", input)
    }

    static async update(id: number, input: UpdateEncounterInput): Promise<EncounterResponse> {
        return api.put<UpdateEncounterInput, EncounterResponse>(`encounters/${id}`, input)
    }

    static async delete(id: number): Promise<void> {
        await api.delete<void>(`encounters/${id}`)
    }
}
