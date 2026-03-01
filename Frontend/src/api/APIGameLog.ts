import { api } from "./api";

export interface CreateGameLogInput {
    rollType: "savingThrow" | "abilityCheck" | "skill" | "sense" | "attack" | "customRoll";
    abilityKey?: string;
    skillId?: string;
    senseKey?: string;
    diceRolled: number;
    modifier: number;
    total: number;
    diceCommand: string;
}

export interface GameLogEntry {
    id: number;
    playerId: number;
    playerName?: string;
    characterId?: string;
    rollType: string;
    abilityKey?: string;
    skillId?: string;
    senseKey?: string;
    diceRolled: number;
    modifier: number;
    total: number;
    diceCommand: string;
    createdAt: string;
}

export class APIGameLog {
    static async create(playerId: number, input: CreateGameLogInput): Promise<GameLogEntry> {
        return api.post<CreateGameLogInput, GameLogEntry>(`game-log/player/${playerId}`, input);
    }

    static async listForPlayer(playerId: number): Promise<GameLogEntry[]> {
        return api.get<GameLogEntry[]>(`game-log/player/${playerId}`);
    }

    static async listForCampaign(campaignId: number): Promise<GameLogEntry[]> {
        return api.get<GameLogEntry[]>(`game-log/campaign/${campaignId}`);
    }
}
