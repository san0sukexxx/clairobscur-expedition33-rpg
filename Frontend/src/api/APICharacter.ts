import { MockAPIService } from "./MockAPIService";

export type ListCharacter = {
    id: string;
    name: string;
    character: string;
};

export interface ListCharactersResponse {
    data: ListCharacter[];
    total: number;
}

export class APICharacter {
    static async list(campaign?: string): Promise<ListCharactersResponse> {
        if (!campaign) throw new Error("Parâmetro 'campaign' ausente");

        const MOCK: ListCharacter[] = [
            { id: "c1", name: "Juliano", character: "Verso" },
            { id: "c2", name: "Julia", character: "Sciel" },
            { id: "c3", name: "Tamara", character: "Lune" },
        ];

        return MockAPIService.respond<ListCharactersResponse>({
            data: MOCK,
            total: MOCK.length,
        });
    }

    //  static async list(): Promise<ListCampaignsResponse> {
    //    return APIService.reject("Falha ao carregar campanhas");
    // }
}
