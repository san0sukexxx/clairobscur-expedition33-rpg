import { api } from "./api";
import { type WeaponResponse, type FightInfoResponse, type BattleLogResponse, type PictoResponse, type LuminaResponse, type PlayerItemResponse, type PlayerSkillResponse } from "./ResponseModel";

export interface AbilityScores {
    strength?: number;
    dexterity?: number;
    constitution?: number;
    intelligence?: number;
    wisdom?: number;
    charisma?: number;
}

export interface PlayerSheetResponse {
    name?: string;
    characterId?: string;
    totalPoints?: number;
    xp?: number;
    apCurrent?: number;
    mpCurrent?: number;
    hpCurrent?: number;
    hpMax?: number;
    armorClass?: number;
    conditions?: string[];
    weaponId?: string;
    abilityScores?: AbilityScores;
}

export interface CreatePlayerInput {
    campaign: number;
}

export interface CreatePlayerResponse {
    id: number;
}

export interface GetPlayerResponse {
    id: number;
    playerSheet?: PlayerSheetResponse;
    weapons?: WeaponResponse[];
    fightInfo?: FightInfoResponse;
    isMasterEditing?: boolean;
    battleLogs?: BattleLogResponse[];
    pictos?: PictoResponse[];
    luminas?: LuminaResponse[];
    items?: PlayerItemResponse[];
    skills?: PlayerSkillResponse[];
}

export interface UpdatePlayerInput {
    playerSheet: PlayerSheetResponse;
}

export interface SetMasterEditingInput {
    isMasterEditing: boolean;
}

export class APIPlayer {
    static async create(input: CreatePlayerInput): Promise<CreatePlayerResponse> {
        return api.post<CreatePlayerInput, CreatePlayerResponse>("players", input);
    }

    static async get(id: number, lastBattleLog?: number): Promise<GetPlayerResponse> {
        const query = lastBattleLog !== undefined
            ? `?battleLogId=${lastBattleLog}`
            : "";

        return api.get<GetPlayerResponse>(`players/${id}${query}`);
    }

    static async list(): Promise<GetPlayerResponse[]> {
        return api.get<GetPlayerResponse[]>("players");
    }

    static async update(id: number, input: UpdatePlayerInput): Promise<GetPlayerResponse> {
        return api.put<UpdatePlayerInput, GetPlayerResponse>(`players/${id}`, input);
    }

    static async setMasterEditing(playerId: number, isMasterEditing: boolean): Promise<void> {
        const input = {
            isMasterEditing: isMasterEditing
        }
        return api.put<SetMasterEditingInput, void>(`players/${playerId}/master-editing`, input);
    }

}
