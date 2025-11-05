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
}

export interface UpdatePlayerInput {
    playerSheet: PlayerSheetResponse;
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
}
