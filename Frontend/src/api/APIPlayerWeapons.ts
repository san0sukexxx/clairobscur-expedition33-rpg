import { api } from "./api";

export interface AddPlayerWeaponInput {
    playerId: number;
    weaponId: string;
    level: number;
}

export interface UpdatePlayerWeaponInput {
    weaponId?: string;
    level?: number;
}

export class APIPlayerWeapons {
    static async add(input: AddPlayerWeaponInput): Promise<void> {
        return api.post<AddPlayerWeaponInput, void>("player-weapons", input);
    }

    static async update(
        playerId: number,
        weaponId: string,
        input: UpdatePlayerWeaponInput
    ): Promise<void> {
        return api.put<UpdatePlayerWeaponInput, void>(
            `player-weapons/${playerId}/${weaponId}`,
            input
        );
    }

    static async delete(playerId: number, weaponId: string): Promise<void> {
        return api.delete<void>(`player-weapons/${playerId}/${weaponId}`);
    }
}
