import { api } from "./api";
import { type WeaponResponse, type FightInfoResponse } from "./ResponseModel";

export interface PlayerSheetResponse {
    name?: string;
    characterId?: string;
    totalPoints?: number;
    xp?: number;
    power?: number;
    hability?: number;
    resistance?: number;
    apCurrent?: number;
    mpCurrent?: number;
    hpCurrent?: number;
    notes?: string;
    weaponId?: string;
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
    lastBattleLogId?: number;
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

    static async get(id: number): Promise<GetPlayerResponse> {
        return api.get<GetPlayerResponse>(`players/${id}`);
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
