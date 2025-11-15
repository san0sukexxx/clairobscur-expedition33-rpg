import { api } from "./api";

export interface Campaign {
  id: number;
  name: string;
  battleId?: number | null;
  characters: string[];
}

export interface CreateCampaignInput {
  name: string;
  characters: string[];
}

export interface CreateCampaignResponse {
  id: number;
}

export class APICampaign {
  static async list(): Promise<Campaign[]> {
    return await api.get<Campaign[]>("campaigns");
  }

  static async get(id: number): Promise<Campaign> {
    return await api.get<Campaign>(`campaigns/${id}`);
  }

  static async create(input: CreateCampaignInput): Promise<CreateCampaignResponse> {
    return api.post<CreateCampaignInput, CreateCampaignResponse>("campaigns", input);
  }

  static async update(id: number, input: Partial<CreateCampaignInput>): Promise<number> {
    return await api.put<Partial<CreateCampaignInput>, number>(
      `campaigns/${id}`,
      input
    );
  }

  static async remove(id: number): Promise<boolean> {
    await api.delete<void>(`campaigns/${id}`);
    return true;
  }

  static async edit(id: number, input: Partial<CreateCampaignInput>): Promise<number> {
    return await api.put<Partial<CreateCampaignInput>, number>(`campaigns/${id}`, input);
  }
}
