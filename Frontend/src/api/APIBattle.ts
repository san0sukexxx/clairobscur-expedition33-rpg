import { api } from "./api"
import { type AttackStatusEffectResponse, type BattleCharacterInfo, type BattleCharacterType, type InitiativeResponse, type BattleTurnResponse, type BattleLogResponse, type AttackResponse, type EffectType, type AttackType } from "./ResponseModel"

export interface Battle {
    id: number
    campaignId: number
    battleStatus: string
}

export interface BattleWithDetailsResponse extends Battle {
    characters: BattleCharacterInfo[]
    initiatives: InitiativeResponse[]
    turns: BattleTurnResponse[]
    battleLogs?: BattleLogResponse[];
    attacks?: AttackResponse[];
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

export interface CreateAttackRequest {
    totalDamage?: number
    totalPower?: number
    targetBattleId: number
    sourceBattleId: number
    effects?: AttackStatusEffectRequest[],
    attackType?: AttackType
}

export interface AttackStatusEffectRequest {
    effectType: EffectType
    ammount?: number
}

export interface GetAttacksResponse {
    id: number
    battleId: number
    totalPower: number
    targetBattleId: number
    sourceBattleId: number
    isResolved: boolean
    effects: AttackStatusEffectResponse[]
}

export interface CreateDefenseRequest {
    attackId: number
    totalDamage: number
}

export class APIBattle {
    static async create(input: CreateBattleInput): Promise<number> {
        return api.post<CreateBattleInput, number>("battles", input)
    }

    static async listByCampaign(campaignId: number): Promise<Battle[]> {
        return api.get<Battle[]>(`battles/campaign/${campaignId}`)
    }

    static async getById(battleId: number, lastBattleLog?: number): Promise<BattleWithDetailsResponse> {
        const query = lastBattleLog !== undefined
            ? `?battleLogId=${lastBattleLog}`
            : "";

        return api.get<BattleWithDetailsResponse>(`battles/${battleId}${query}`)
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

    static async attack(input: CreateAttackRequest): Promise<void> {
        await api.post<CreateAttackRequest, void>("attacks", input)
    }

    static async getAttacks(battleId: number): Promise<GetAttacksResponse[]> {
        return api.get<GetAttacksResponse[]>(`attacks/pending/${battleId}`)
    }

    static async defend(input: CreateDefenseRequest): Promise<void> {
        await api.post<CreateDefenseRequest, void>("defenses", input)
    }

    static async endTurn(playerBattleId: number): Promise<void> {
        await api.post<{}, void>(`battle-turns/${playerBattleId}/end`, {})
    }

    static async allowCounter(battleCharacterId: number): Promise<void> {
        await api.post<{}, void>(`attacks/${battleCharacterId}/allow-counter`, {})
    }

    static async applyDefense(battleCharacterId: number, maxDamage: number): Promise<void> {
        await api.post<{ maxDamage: number }, void>(
            `defenses/apply-defense/${battleCharacterId}`,
            { maxDamage }
        )
    }
}
