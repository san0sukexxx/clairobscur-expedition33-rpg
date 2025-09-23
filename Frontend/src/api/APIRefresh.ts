import { APIService } from "./APIService";
import { type InitiativeResponse, type BattleCharacterInfo } from "./ResponseModel"

export type ActionsType =
  | "character-joined-battle"
  | "battle-started"
  | "skill-used"
  | "item-used"
  | "attack"
  | "free-shot";

export interface CharacterJoinedBattleResponse {
  initiative: InitiativeResponse;
  character: BattleCharacterInfo;
}

export interface ActionResponse {
  type: ActionsType;
  characterJoinedBattle?: CharacterJoinedBattleResponse;
  // TODO
}

export interface GetRefreshResponse {
  actions?: ActionResponse[];
}

export class APIRefresh {
  static async getInfo(playerId: string): Promise<GetRefreshResponse> {
    const actions = makeMockActions(playerId);
    return APIService.respond<GetRefreshResponse>(
      { actions },
      600
    );
  }
}

function makeMockActions(playerId: string): ActionResponse[] {
  const list: ActionResponse[] = [
    {
      type: "character-joined-battle",
      characterJoinedBattle: {
        initiative: {
            playFirst: false,
            battleID: 4,
            value: 11,
            hability: 5
        },
        character: {
            battleID: 4,
            id: "sciel",
            name: "Sciel",
            healthPoints: 40,
            maxHealthPoints: 45,
            magicPoints: 30,
            maxMagicPoints: 32,
            type: "player",
            isEnemy: false
        }
      },
    },
    {
      type: "battle-started"
    },
  ];

  return list;
}
