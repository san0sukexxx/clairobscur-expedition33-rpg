import { api } from "./api"
import { type BattleCharacterInfo, type BattleCharacterType, type InitiativeResponse, type BattleTurnResponse } from "./ResponseModel"

export interface Battle {
    id: number
    campaignId: number
    battleStatus: string
}

export interface BattleWithDetailsResponse extends Battle {
    characters: BattleCharacterInfo[]
    initiatives: InitiativeResponse[]
    turns: BattleTurnResponse[]
}

export interface CreateBattleInput {
    campaignId: number
    battleStatus: string
}

export interface UpdateBattleInput {
    battleStatus: string
}

export interface AddBattleCharacterRequest {
    battleId: number
    externalId: string
    characterName: string
    characterType: BattleCharacterType
    team: "A" | "B"
    healthPoints: number
    maxHealthPoints: number
    magicPoints?: number
    maxMagicPoints?: number
    initiative?: AddBattleCharacterInitiativeData,
    canRollInitiative: boolean
}

export interface AddBattleCharacterInitiativeData {
    initiativeValue: number
    hability: number
    playFirst: boolean
}

export interface CreateBattleInitiativeRequest {
    battleCharacterId: number
    value: number
    hability: number
    playFirst?: boolean
}

export interface CreateBattleTurnRequest {
    battleCharacterId: number
}

export class APIBattle {
    static async create(input: CreateBattleInput): Promise<number> {
        return api.post<CreateBattleInput, number>("battles", input)
    }

    static async listByCampaign(campaignId: number): Promise<Battle[]> {
        return api.get<Battle[]>(`battles/campaign/${campaignId}`)
    }

    static async getById(battleId: number): Promise<BattleWithDetailsResponse> {
        return api.get<BattleWithDetailsResponse>(`battles/${battleId}`)
    }

    static async update(id: number, input: UpdateBattleInput): Promise<void> {
        await api.put<UpdateBattleInput, void>(`battles/${id}`, input)
    }

    static async delete(id: number): Promise<void> {
        await api.delete<void>(`battles/${id}`)
    }

    static async addCharacter(req: AddBattleCharacterRequest): Promise<number> {
        return api.post<AddBattleCharacterRequest, number>(
            `battles/${req.battleId}/characters`,
            req
        )
    }

    static async removeCharacter(id: number): Promise<void> {
        await api.delete<void>(`battles/characters/${id}`)
    }

    static async useBattle(battleId: number, campaignId: number): Promise<void> {
        await api.put<{ campaignId: number }, void>(`battles/${battleId}/use`, { campaignId })
    }

    static async clearBattle(campaignId: number): Promise<void> {
        await api.put<{ campaignId: number }, void>("battles/clear", { campaignId })
    }

    static async addInitiative(input: CreateBattleInitiativeRequest): Promise<InitiativeResponse> {
        return api.post<CreateBattleInitiativeRequest, InitiativeResponse>("battle-initiatives", input)
    }

    static async joinBattle(input: CreateBattleTurnRequest): Promise<void> {
        return api.post<CreateBattleTurnRequest, void>("battle-turns", input)
    }

    static async start(battleId: number, battleStatus: string): Promise<void> {
        await api.post<{ battleStatus: string }, void>(`battles/${battleId}/start`, { battleStatus })
    }
}
