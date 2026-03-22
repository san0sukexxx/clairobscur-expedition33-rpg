import type { BattleReward } from "./ResponseModel";
import { APIPlayerWeapons } from "./APIPlayerWeapons";
import { APIPicto } from "./APIPicto";
import { toKebabCase } from "../i18n";
import { WeaponsDataLoader } from "../utils/WeaponsDataLoader";

export class APIRewards {
    /**
     * Resolve the canonical weapon name (as stored in JSON) from a kebab-case or display name.
     * The weapon system uses the JSON "name" field as the ID (e.g., "Lanceram", not "lanceram").
     */
    private static resolveWeaponName(itemId: string): string {
        const lower = itemId.toLowerCase();
        for (const [, weapons] of WeaponsDataLoader.getAllSeparated()) {
            const match = weapons.find(w => w.name.toLowerCase() === lower);
            if (match) return match.name;
        }
        return itemId;
    }

    /**
     * Distribui uma recompensa (arma ou picto) para um jogador
     * @param playerId ID do jogador que receberá a recompensa
     * @param reward Recompensa a ser distribuída
     */
    static async claimReward(playerId: number, reward: BattleReward): Promise<void> {
        if (reward.type === "weapon") {
            // Resolver o nome canônico da arma (case do JSON)
            const weaponName = this.resolveWeaponName(reward.itemId);
            await APIPlayerWeapons.add({
                playerId,
                weaponId: weaponName,
                level: reward.level
            });
        } else if (reward.type === "picto") {
            const kebabId = toKebabCase(reward.itemId);
            await APIPicto.createPlayerPicto({
                playerId,
                pictoId: kebabId,
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
