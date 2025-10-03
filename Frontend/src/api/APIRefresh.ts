import { APIService } from "./APIService";
import { type InitiativeResponse, type BattleCharacterInfo } from "./ResponseModel"
import { type Element } from "../types/WeaponDTO"

export type ActionsType =
  | "character-joined-battle"
  | "battle-started"
  | "attack"
  | "skill-used"
  | "item-used"
  | "free-shot";

export interface CharacterJoinedBattleResponse {
  initiative: InitiativeResponse;
  character: BattleCharacterInfo;
}

export interface AttackResponse {
  originBattleIds: number[];
  targetBattleIds: number[];
  damage: number;
  element: Element;
}

export interface ActionResponse {
  type: ActionsType;
  characterJoinedBattle?: CharacterJoinedBattleResponse;
  attack?: AttackResponse;
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
    {
      type: "attack",
      attack: {
        originBattleIds: [3],
        targetBattleIds: [1, 2],
        damage: 30,
        element: "Physical"
      }
    },
  ];

  return list;
}
