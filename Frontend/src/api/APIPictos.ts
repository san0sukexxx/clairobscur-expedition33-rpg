import { MockAPIService } from "./MockAPIService";
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
                "color": "green",
                "level": 1,
                "luminaCost": 30
            },
            {
                "name": "Energising Turn",
                "status": {
                    "speed": 532
                },
                "description": "+1 AP on turn start.",
                "color": "green",
                "level": 5,
                "luminaCost": 32
            },
            {
                "name": "Energising Attack I",
                "status": {
                    "speed": 399,
                    "criticalRate": 11
                },
                "description": "+1 AP on Base Attack.",
                "color": "green",
                "level": 7,
                "luminaCost": 33,
                "battleCount": 6
            },
            {
                "name": "Energising Parry",
                "status": {
                    "health": 2666
                },
                "description": "+1 AP on successful Parry.",
                "color": "green",
                "level": 10,
                "luminaCost": 34,
                "battleCount": 1
            },
            {
                "name": "Augmented First Strike",
                "status": {
                    "speed": 420,
                    "criticalRate": 12
                },
                "description": "50% increased damage on the first hit. Once per battle.",
                "color": "red",
                "level": 12,
                "luminaCost": 35,
                "battleCount": 12
            },
            {
                "name": "Survivor",
                "status": {
                    "speed": 399,
                    "criticalRate": 11
                },
                "description": "Survive fatal damage with 1 Health. Once per battle.",
                "color": "blue",
                "level": 3,
                "luminaCost": 36
            }
        ];

        // Simula latência e retorna
        return MockAPIService.respond<GetPictosListResponse>(
            { pictos: mock },
            600
        );
    }
}