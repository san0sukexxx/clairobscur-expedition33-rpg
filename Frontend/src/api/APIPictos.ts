import { APIService } from "./APIService";
import { type PictoResponse } from "../api/ResponseModel";

export interface GetPictosListResponse {
    pictos: PictoResponse[];
}

export class APIPictos {

    static async getPictosList(): Promise<GetPictosListResponse> {
        const mock: PictoResponse[] = [
            {
                "name": "Energy Master",
                "status": {
                    "health": 2245
                },
                "description": "Every AP gain is increased by 1.",
                "color": "green"
            },
            {
                "name": "Energising Turn",
                "status": {
                    "speed": 532
                },
                "description": "+1 AP on turn start.",
                "color": "green"
            },
            {
                "name": "Energising Attack I",
                "status": {
                    "speed": 399,
                    "criticalRate": 11
                },
                "description": "+1 AP on Base Attack.",
                "color": "green"
            },
            {
                "name": "Energising Parry",
                "status": {
                    "health": 2666
                },
                "description": "+1 AP on successful Parry.",
                "color": "green"
            },
            {
                "name": "Augmented First Strike",
                "status": {
                    "speed": 420,
                    "criticalRate": 12
                },
                "description": "50% increased damage on the first hit. Once per battle.",
                "color": "red"
            },
            {
                "name": "Survivor",
                "status": {
                    "speed": 399,
                    "criticalRate": 11
                },
                "description": "Survive fatal damage with 1 Health. Once per battle.",
                "color": "blue"
            }
        ];

        // Simula latência e retorna
        return APIService.respond<GetPictosListResponse>(
            { pictos: mock },
            600
        );
    }
}