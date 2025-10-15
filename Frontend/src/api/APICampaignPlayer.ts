import { api } from "./api";
import { type GetPlayerResponse } from "./APIPlayer";

export class APICampaignPlayer {
    static async list(campaignId: number): Promise<GetPlayerResponse[]> {
        return api.get<GetPlayerResponse[]>(`campaigns/${campaignId}/players`);
    }

    static async delete(campaignId: number, playerId: number): Promise<void> {
        await api.delete<void>(`campaigns/${campaignId}/players/${playerId}`);
    }
}
