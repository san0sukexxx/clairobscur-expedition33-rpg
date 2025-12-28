import { api } from "./api"
import { type PictoEffectTracker } from "./ResponseModel"

export interface TrackPictoEffectRequest {
    battleId: number
    battleCharacterId: number
    pictoName: string
    effectType: "once-per-battle" | "once-per-turn"
}

export interface CanActivateRequest {
    battleId: number
    battleCharacterId: number
    pictoName: string
    effectType: "once-per-battle" | "once-per-turn"
}

export const APIPictoTracker = {
    /**
     * Verifica se um efeito de picto pode ser ativado
     */
    async canActivate(request: CanActivateRequest): Promise<boolean> {
        const response = await api.post<boolean>("/api/battle/picto-effects/can-activate", request)
        return response.data
    },

    /**
     * Registra o uso de um efeito de picto
     */
    async trackEffect(request: TrackPictoEffectRequest): Promise<PictoEffectTracker> {
        const response = await api.post<PictoEffectTracker>("/api/battle/picto-effects/track", request)
        return response.data
    },

    /**
     * Busca o tracker de um efeito específico
     */
    async getTracker(battleId: number, battleCharacterId: number, pictoName: string): Promise<PictoEffectTracker | null> {
        try {
            const response = await api.get<PictoEffectTracker>(
                `/api/battle/picto-effects/tracker/${battleId}/${battleCharacterId}/${pictoName}`
            )
            return response.data
        } catch {
            return null
        }
    },

    /**
     * Lista todos os trackers de uma batalha
     */
    async listByBattle(battleId: number): Promise<PictoEffectTracker[]> {
        const response = await api.get<PictoEffectTracker[]>(`/api/battle/picto-effects/battle/${battleId}`)
        return response.data
    },

    /**
     * Lista todos os trackers de um personagem
     */
    async listByCharacter(battleCharacterId: number): Promise<PictoEffectTracker[]> {
        const response = await api.get<PictoEffectTracker[]>(`/api/battle/picto-effects/character/${battleCharacterId}`)
        return response.data
    },

    /**
     * Reseta os contadores no fim do turno
     */
    async resetOnTurnEnd(battleId: number, battleCharacterId: number): Promise<void> {
        await api.post(`/api/battle/picto-effects/reset-turn`, {
            battleId,
            battleCharacterId
        })
    }
}
