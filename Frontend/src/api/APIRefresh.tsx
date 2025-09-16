import { APIService } from "./APIService";

export type ActionsType = "player-joined" | "npc-joined" | "skill-used" | "item-used" | "attack" | "free-shot";

export interface ActionResponse {
  type: ActionsType;
  identifier: string;
  targetsID: string[];
  ammount: number;
  originIdentifier: string;
}

export interface GetRefreshResponse {
  actions?: ActionResponse[];
}

export class APIRefresh {

  // static async getInfo(playerId: string): Promise<GetRefreshResponse> {
  //   const mock: ActionResponse = [{}];

  //   return APIService.respond<GetRefreshResponse>(
  //     { actions: mock },
  //     600
  //   );
  // }
}