import { MockAPIService } from "./MockAPIService";
import { type PlayerSheetResponse } from "./APIPlayer";
import { type InitiativeResponse, type StatusResponse, type BattleCharacterInfo, type PictoResponse, type SkillResponse, type WeaponResponse } from "./ResponseModel";

export type BattleStatus = "starting" | "started" | "finished";

export interface PlayerResponse {
  id: number;
  playerSheet?: PlayerSheetResponse;
  weapons?: WeaponResponse[];
  pictos?: PictoResponse[];
  luminas?: PictoResponse[];
  items?: ItemResponse[];
  skills?: SkillResponse[];
  fightInfo?: FightInfoResponse;
  status?: StatusResponse[];
}

export interface ItemResponse {
  id?: string;
  description: string;
  quantity?: number;
  maxQuantity?: number;
}

export interface FightInfoResponse {
  playerBattleID: number;
  initiatives?: InitiativeResponse[];
  characters?: BattleCharacterInfo[];
  battleStatus: BattleStatus;
  canRollInitiative: boolean;
}

export interface CreatePlayerInput {
  campaign: string;
}

export interface CreatePlayerResponse {
  playerID: string;
}

export interface GetPlayerResponse {
  player: PlayerResponse;
}

export class MockAPIPlayer {
  static async create(
    input: CreatePlayerInput
  ): Promise<CreatePlayerResponse> {

    return MockAPIService.respond<CreatePlayerResponse>(
      { playerID: String(Date.now()) },
      600
    );

    // Se quiser usar um POST “real” do seu APIService:
    // return APIService.post<CreatePlayerResponse>("/players", input);
  }

  static async getInfo(playerId: number): Promise<GetPlayerResponse> {
    // Aqui você pode mockar dados iniciais de um Player
    const mock: PlayerResponse = {
      id: playerId,
      playerSheet: {
        name: "Mock Player",
        characterId: "sciel",
        totalPoints: 10,
        hpCurrent: 15,
        mpCurrent: 20,
        xp: 5,
        power: 3,
        hability: 4,
        resistance: 6,
        apCurrent: 7,
        notes: "Notes"
      },
      weapons: [
        { id: "Abysseram", level: 3 },
        { id: "Baguette", level: 6 },
        { id: "Chevalam", level: 21 },
        { id: "Kralim", level: 8 },
        { id: "Sadon", level: 8 },
      ],
      pictos: [
        {
          "name": "Energy Master",
          "status": {
            "health": 2245
          },
          "description": "Every AP gain is increased by 1.",
          "color": "green",
          "level": 5,
          "slot": 0,
          "luminaCost": 31
        },
        {
          "name": "Augmented First Strike",
          "status": {
            "speed": 420,
            "criticalRate": 12
          },
          "description": "50% increased damage on the first hit. Once per battle.",
          "color": "red",
          "level": 15,
          "slot": 2,
          "luminaCost": 30
        },
      ],
      luminas: [
        {
          "name": "Energising Parry",
          "status": {
            "health": 2666
          },
          "description": "+1 AP on successful Parry.",
          "color": "green",
          "level": 10,
          "luminaCost": 34,
          "battleCount": 6
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
          "luminaCost": 36,
          "battleCount": 4
        },
      ],
      items: [{ description: "Bacon frito", quantity: 1, maxQuantity: 1 }],
      skills: [
        {
          "id": "sciel-focused-foretell",
          "name": "Focused Foretell",
          "cost": 2,
          "description": "Deals medium single target Physical damage.\n1 hit.\nApplies 2 Foretell.\nApplies 3 additional Foretell if target has 0 Foretell",
          "type": "sun",
          "isGradient": false,
          "image": "Sciel_FocusedForetell.webp",
          "isBlocked": false,
          "isUnlocked": true,
        },
        {
          "id": "sciel-final-path",
          "name": "Final Path",
          "cost": 8,
          "description": "Final Path is a Skill in Clair Obscur Expedition 33.\nSkills are unique abilities for the playable Characters of the game; each character consists of a skill tree that requires skill points and other skills to unlock.",
          "type": "moon",
          "isGradient": true,
          "image": "Sciel_FinalPath.webp",
          "isBlocked": false,
          "isUnlocked": false
        },
        {
          "id": "sciel-final-path1",
          "name": "Final Path1",
          "cost": 8,
          "description": "Final Path is a Skill in Clair Obscur Expedition 33.\nSkills are unique abilities for the playable Characters of the game; each character consists of a skill tree that requires skill points and other skills to unlock.",
          "type": "moon",
          "isGradient": true,
          "image": "Sciel_FinalPath.webp",
          "isBlocked": false,
          "isUnlocked": false,
          "pre_requisite": [
            {
              "id": "sciel-focused-foretell",
              "name": "Focused Foretell",
              "image": "Sciel_FocusedForetell.webp",
            },
            {
              "id": "sciel-focused-foretell",
              "name": "Focused Foretell",
              "image": "Sciel_FocusedForetell.webp"
            }
          ]
        }
      ],
      fightInfo: {
        playerBattleID: 1,
        initiatives: [
          {
            playFirst: false,
            battleID: 1,
            value: 11,
            hability: 3
          },
          {
            playFirst: false,
            battleID: 2,
            value: 11,
            hability: 4
          },
          {
            playFirst: false,
            battleID: 3,
            value: 15,
            hability: 3
          }],
        characters: [
          {
            battleID: 1,
            id: "golem",
            name: "Golem",
            healthPoints: 32,
            maxHealthPoints: 45,
            status: [],
            type: "npc",
            isEnemy: true
          },
          {
            battleID: 2,
            id: "grosse-tete",
            name: "Grosse Tête",
            healthPoints: 40,
            maxHealthPoints: 45,
            status: [],
            type: "npc",
            isEnemy: true
          },
          {
            battleID: 3,
            id: "gustave",
            name: "Gustave",
            healthPoints: 50,
            maxHealthPoints: 60,
            magicPoints: 30,
            maxMagicPoints: 36,
            status: [],
            type: "player",
            isEnemy: false
          }
        ],
        canRollInitiative: true,
        battleStatus: "starting"
      },
      status: [],
    };

    // Simula latência e retorna
    return MockAPIService.respond<GetPlayerResponse>(
      { player: mock },
      600
    );

    // Se quiser usar um GET “real” do seu APIService:
    // return APIService.get<GetPlayerResponse>(`/players/${playerId}`);
  }

  static async save(player: PlayerResponse): Promise<void> {
    await MockAPIService.respond<null>(null, 600);
  }

  static async saveRollInitiative(player: PlayerResponse, total: number): Promise<void> {
    console.log(total);
    await MockAPIService.respond<null>(null, 600);
  }
}