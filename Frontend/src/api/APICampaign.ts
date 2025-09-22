// APICampaign.ts
import { APIService } from "./APIService";

export interface Campaign {
  id: number;
  name: string;
  active: boolean;
  characters: string[];
}

export interface ListCampaignsResponse {
  data: Campaign[];
  total: number;
}

export interface CreateCampaignInput {
  name: string;
  active: boolean;
  characters: string[];
}

export interface CreateCampaignResponse {
  data: Campaign;
}

export class APICampaign {
  static async list(): Promise<ListCampaignsResponse> {
    const campaigns: Campaign[] = [
      { id: 1, name: "Campanha Alpha", active: true,  characters: ["gustave", "maelle"] },
      { id: 2, name: "Campanha Beta",  active: false, characters: ["sciel"] },
      { id: 3, name: "Campanha Gama",  active: true,  characters: ["lune", "verso"] },
    ];

    return APIService.respond<ListCampaignsResponse>({
      data: campaigns,
      total: campaigns.length,
    });
  }

  static async create(input: CreateCampaignInput): Promise<CreateCampaignResponse> {
    const newCampaign: Campaign = {
      id: Math.floor(Math.random() * 10000), // simulando um ID vindo do servidor
      ...input,
    };

    // Retorna a resposta simulada com um pequeno delay
    return APIService.respond<CreateCampaignResponse>(
      { data: newCampaign },
      600
    );

    // Se quiser usar uma chamada POST “real” no futuro:
    // return APIService.post<CreateCampaignResponse>("/campaigns", input);
  }

  //  static async list(): Promise<ListCampaignsResponse> {
  //    return APIService.reject("Falha ao carregar campanhas");
  // }
}
