import { APIService } from "./APIService";
import { type InitiativeResponse, type BattleCharacterInfo } from "./ResponseModel"
import { type Element } from "../types/WeaponDTO"

export type ActionsType =
  | "character-joined-battle"
  | "battle-started"
  | "attack"
  | "magic-points-changed"
  | "health-points-changed"
  | "skill-used"
  | "item-used";

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

export interface MagicPointsChanged {
  battleIds: number[];
  totalChange: number;
}

export interface HealthPointsChanged {
  battleIds: number[];
  totalChange: number;
}

export interface ActionResponse {
  type: ActionsType;
  characterJoinedBattle?: CharacterJoinedBattleResponse;
  attack?: AttackResponse;
  magicPointsChanged?: MagicPointsChanged;
  healthPointsChanged?: HealthPointsChanged;
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
    // {
    //   type: "character-joined-battle",
    //   characterJoinedBattle: {
    //     initiative: {
    //       playFirst: false,
    //       battleID: 4,
    //       value: 11,
    //       hability: 5
    //     },
    //     character: {
    //       battleID: 4,
    //       id: "sciel",
    //       name: "Sciel",
    //       healthPoints: 40,
    //       maxHealthPoints: 45,
    //       magicPoints: 30,
    //       maxMagicPoints: 32,
    //       type: "player",
    //       isEnemy: false
    //     }
    //   },
    // },
    // {
    //   type: "battle-started"
    // },
    {
      type: "attack",
      attack: {
        originBattleIds: [3],
        targetBattleIds: [1],
        damage: 30,
        element: "Physical"
      }
    },
    // {
    //   type: "health-points-changed",
    //   healthPointsChanged: {
    //     battleIds: [1],
    //     totalChange: -30
    //   }
    // },
    // {
    //   type: "magic-points-changed",
    //   magicPointsChanged: {
    //     battleIds: [3],
    //     totalChange: -15
    //   }
    // },
  ];

  return list;
}
