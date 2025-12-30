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
        const response = await api.post<CanActivateRequest, boolean>("battle/picto-effects/can-activate", request)
        console.log("[APIPictoTracker] canActivate response:", response)
        // api.post já retorna o valor diretamente, não precisa acessar .data
        return response
    },

    /**
     * Registra o uso de um efeito de picto
     */
    async trackEffect(request: TrackPictoEffectRequest): Promise<PictoEffectTracker> {
        const response = await api.post<TrackPictoEffectRequest, PictoEffectTracker>("battle/picto-effects/track", request)
        return response
    },

    /**
     * Busca o tracker de um efeito específico
     */
    async getTracker(battleId: number, battleCharacterId: number, pictoName: string): Promise<PictoEffectTracker | null> {
        try {
            const response = await api.get<PictoEffectTracker>(
                `battle/picto-effects/tracker/${battleId}/${battleCharacterId}/${pictoName}`
            )
            return response
        } catch {
            return null
        }
    },

    /**
     * Lista todos os trackers de uma batalha
     */
    async listByBattle(battleId: number): Promise<PictoEffectTracker[]> {
        const response = await api.get<PictoEffectTracker[]>(`battle/picto-effects/battle/${battleId}`)
        return response
    },

    /**
     * Lista todos os trackers de um personagem
     */
    async listByCharacter(battleCharacterId: number): Promise<PictoEffectTracker[]> {
        const response = await api.get<PictoEffectTracker[]>(`battle/picto-effects/character/${battleCharacterId}`)
        return response
    },

    /**
     * Reseta os contadores no fim do turno
     */
    async resetOnTurnEnd(battleId: number, battleCharacterId: number): Promise<void> {
        await api.post(`battle/picto-effects/reset-turn`, {
            battleId,
            battleCharacterId
        })
    }
}
