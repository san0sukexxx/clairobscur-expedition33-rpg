import type { BattleReward } from "./ResponseModel";
import { APIPlayerWeapons } from "./APIPlayerWeapons";
import { APIPicto } from "./APIPicto";

export class APIRewards {
    /**
     * Distribui uma recompensa (arma ou picto) para um jogador
     * @param playerId ID do jogador que receberá a recompensa
     * @param reward Recompensa a ser distribuída
     */
    static async claimReward(playerId: number, reward: BattleReward): Promise<void> {
        if (reward.type === "weapon") {
            // Adicionar arma ao jogador
            await APIPlayerWeapons.add({
                playerId,
                weaponId: reward.itemId,
                level: reward.level
            });
        } else if (reward.type === "picto") {
            // Adicionar picto ao jogador
            // Garantir que o pictoId está em minúsculas (kebab-case)
            const pictoId = reward.itemId.toLowerCase();
            console.log("Adicionando picto:", { playerId, pictoId, level: reward.level });
            await APIPicto.createPlayerPicto({
                playerId,
                pictoId,
                level: reward.level
            });
        }
    }

    /**
     * Distribui múltiplas recompensas para um jogador
     * @param playerId ID do jogador que receberá as recompensas
     * @param rewards Lista de recompensas a serem distribuídas
     */
    static async claimMultipleRewards(playerId: number, rewards: BattleReward[]): Promise<void> {
        const promises = rewards.map(reward => this.claimReward(playerId, reward));
        await Promise.all(promises);
    }
}
