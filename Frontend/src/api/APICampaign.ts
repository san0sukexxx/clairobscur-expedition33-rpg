// APICampaign.ts
import { api } from "./api";

export interface Campaign {
  id: number;
  name: string;
  active: boolean;      // campo interno local
  characters: string[];
}

export interface CreateCampaignInput {
  name: string;
  characters: string[]; // <- sem 'active'
}

export interface CreateCampaignResponse {
  id: number;           // backend retorna { id }
}

type CampaignFromServer = {
  id: number;
  name: string;
  characters: string[];
};

function mapFromServer(c: CampaignFromServer): Campaign {
  return {
    id: c.id,
    name: c.name,
    characters: c.characters ?? [],
    active: true, // default local, já que o backend não envia
  };
}

export class APICampaign {
  static async list(): Promise<Campaign[]> {
    const raw = await api.get<CampaignFromServer[]>("campaigns");
    return (raw ?? []).map(mapFromServer);
  }

  static async create(input: CreateCampaignInput): Promise<CreateCampaignResponse> {
    return api.post<CreateCampaignInput, CreateCampaignResponse>("campaigns", input);
  }

  static async update(id: number, input: Partial<CreateCampaignInput>): Promise<Campaign> {
    const updated = await api.put<Partial<CreateCampaignInput>, CampaignFromServer>(
      `campaigns/${id}`,
      input
    );
    return mapFromServer(updated);
  }

  static async remove(id: number): Promise<boolean> {
    await api.delete<void>(`campaigns/${id}`);
    return true;
  }
}
