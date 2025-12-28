import { api } from "./api"
import { type AttackStatusEffectResponse, type BattleCharacterInfo, type BattleCharacterType, type InitiativeResponse, type BattleTurnResponse, type BattleLogResponse, type AttackResponse, type StatusType, type AttackType, type Stance, type PictoEffectTracker, type DamageModifier, type StatusImmunity, type ElementResistance } from "./ResponseModel"

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
    chargePoints?: number
    maxChargePoints?: number
    sunCharges?: number
    moonCharges?: number
    stance?: Stance | null
    stainSlot1?: string | null
    stainSlot2?: string | null
    stainSlot3?: string | null
    stainSlot4?: string | null
    perfectionRank?: string | null
    rankProgress?: number | null
    bestialWheelPosition?: number | null
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
    skillCost?: number
    consumesCharge?: boolean
    isGradient?: boolean
    destroysShields?: boolean
    grantsAPPerShield?: number
    consumesBurn?: number  // Number of Burn stacks to consume from target
    consumesForetell?: number  // Number of Foretell stacks to consume from target
    executionThreshold?: number  // If target HP% <= this, execute instantly (kill)
    skillType?: string  // "sun" or "moon" for Sciel's charge system
    bestialWheelAdvance?: number  // Advances Monoco's Bestial Wheel by this many positions
    ignoresShields?: boolean  // Damage goes through shields without removing them (Chevaliere Piercing)
}

export interface AttackStatusEffectRequest {
    effectType: StatusType
    ammount?: number
    remainingTurns?: number
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

export interface ResolveStatusRequest {
    battleCharacterId: number
    effectType: string
    totalValue?: number
}

export interface AddStatusRequest {
    battleCharacterId: number;
    effectType: StatusType;
    ammount: number;
    remainingTurns?: number | null;
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

    static async resolveStatus(input: ResolveStatusRequest): Promise<void> {
        await api.post<ResolveStatusRequest, void>("battle-status/resolve", input)
    }

    static async addStatus(body: AddStatusRequest): Promise<void> {
        await api.post("battle-status/add", body);
    }

    static async cleanse(battleCharacterId: number): Promise<void> {
        await api.post(`battle-status/cleanse/${battleCharacterId}`, {});
    }

    static async heal(battleCharacterId: number, amount: number): Promise<void> {
        await api.post(`battle-status/heal/${battleCharacterId}`, { amount });
    }

    static async breakTarget(battleCharacterId: number): Promise<void> {
        await api.post(`battle-status/break/${battleCharacterId}`, {});
    }

    static async extendStatusDuration(battleCharacterId: number, effectType: string, additionalTurns: number): Promise<void> {
        await api.post(`battle-status/extend-duration/${battleCharacterId}`, { effectType, additionalTurns });
    }

    static async delayTurn(battleCharacterId: number, delayAmount: number): Promise<void> {
        await api.post(`battle-turns/${battleCharacterId}/delay`, { delayAmount });
    }

    static async consumeOneForetell(battleCharacterId: number): Promise<boolean> {
        return api.post<{}, boolean>(`battle-status/consume-foretell/${battleCharacterId}`, {});
    }

    static async updateCharacterHp(id: number, newHp: number): Promise<void> {
        await api.put<{ newHp: number }, void>(
            `battles/characters/${id}/hp`,
            { newHp }
        )
    }

    static async updateCharacterMp(id: number, newMp: number): Promise<void> {
        await api.put<{ newMp: number }, void>(
            `battles/characters/${id}/mp`,
            { newMp }
        )
    }

    static async rankUpCharacter(battleCharacterId: number): Promise<boolean> {
        const response = await api.post<{}, { success: boolean }>(
            `battles/characters/${battleCharacterId}/rank-up`,
            {}
        );
        return response.success;
    }

    static async rankDownCharacter(battleCharacterId: number): Promise<boolean> {
        const response = await api.post<{}, { success: boolean }>(
            `battles/characters/${battleCharacterId}/rank-down`,
            {}
        );
        return response.success;
    }

    static async updateCharacterStance(id: number, newStance: Stance | null): Promise<void> {
        await api.put<{ newStance: Stance | null }, void>(
            `battles/characters/${id}/stance`,
            { newStance }
        )
    }

    static async updateStains(
        id: number,
        stains: { stainSlot1: string | null; stainSlot2: string | null; stainSlot3: string | null; stainSlot4: string | null }
    ): Promise<void> {
        await api.put<typeof stains, void>(
            `battles/characters/${id}/stains`,
            stains
        )
    }

    static async flee(playerId: number, playerBattleId: number): Promise<void> {
        await api.post<{ playerId: number, playerBattleId: number }, void>(
            `battles/flee`,
            { playerId, playerBattleId }
        )
    }

    // ==================== AP/Energy Management ====================

    static async giveAP(battleCharacterId: number, amount: number): Promise<void> {
        await api.post<{ amount: number }, void>(
            `battle/characters/${battleCharacterId}/ap`,
            { amount }
        )
    }

    static async getAP(battleCharacterId: number): Promise<number> {
        return api.get<number>(`battle/characters/${battleCharacterId}/ap`)
    }

    // ==================== Picto Effect Tracking ====================

    static async trackPictoEffect(
        battleId: number,
        battleCharacterId: number,
        pictoName: string,
        effectType: string
    ): Promise<void> {
        await api.post<{
            battleId: number;
            battleCharacterId: number;
            pictoName: string;
            effectType: string;
        }, void>('battle/picto-effects/track', {
            battleId,
            battleCharacterId,
            pictoName,
            effectType
        })
    }

    static async canActivatePictoEffect(
        battleCharacterId: number,
        pictoName: string
    ): Promise<boolean> {
        return api.get<boolean>(
            `battle/picto-effects/check/${battleCharacterId}/${pictoName}`
        )
    }

    static async resetTurnEffects(battleId: number): Promise<void> {
        await api.post<{}, void>(`battle/picto-effects/reset-turn/${battleId}`, {})
    }

    // ==================== Damage Modifiers ====================

    static async addModifier(
        battleCharacterId: number,
        modifierType: string,
        multiplier: number,
        flatBonus: number = 0,
        conditionType?: string
    ): Promise<void> {
        await api.post<{
            modifierType: string;
            multiplier: number;
            flatBonus: number;
            conditionType?: string;
        }, void>(`battle/characters/${battleCharacterId}/modifiers`, {
            modifierType,
            multiplier,
            flatBonus,
            conditionType
        })
    }

    static async getModifiers(battleCharacterId: number): Promise<DamageModifier[]> {
        return api.get<DamageModifier[]>(`battle/characters/${battleCharacterId}/modifiers`)
    }

    // ==================== Immunities & Resistances ====================

    static async addImmunity(
        battleCharacterId: number,
        statusType: string,
        immunityType: string
    ): Promise<void> {
        await api.post<{
            statusType: string;
            immunityType: string;
        }, void>(`battle/characters/${battleCharacterId}/immunities`, {
            statusType,
            immunityType
        })
    }

    static async getImmunities(battleCharacterId: number): Promise<StatusImmunity[]> {
        return api.get<StatusImmunity[]>(`battle/characters/${battleCharacterId}/immunities`)
    }

    static async addResistance(
        battleCharacterId: number,
        element: string,
        resistanceType: string,
        multiplier: number
    ): Promise<void> {
        await api.post<{
            element: string;
            resistanceType: string;
            multiplier: number;
        }, void>(`battle/characters/${battleCharacterId}/resistances`, {
            element,
            resistanceType,
            multiplier
        })
    }
}
