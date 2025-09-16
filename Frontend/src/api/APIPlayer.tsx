import { APIService } from "./APIService";


export type StatusType = 
  "Hastened" | "Empowered" | "Protected" | "Regeneration" | 
  "Unprotected" | "Slowed" | "Weakened" | "Cursed" | 
  "Stunned" | "Confused" | "Frozen" | "Entangled" | 
  "Shielded" | "Exhausted" | "Frenzy" | "Rage" | 
  "Inverted" | "Marked" | "Plagued" | "Burning" | 
  "Silenced" | "Dizzy";

export type BattleStatus = "starting" | "started" | "finished";
export type BattleCharacterType = "player" | "npc";


export interface PlayerResponse {
  id: string;
  playerSheet?: PlayerSheetResponse;
  weapons?: WeaponResponse[];
  pictos?: PictoResponse[];
  items?: ItemResponse[];
  skills?: SkillResponse[];
  fightInfo?: FightInfoResponse;
  status?: StatusResponse[];
}

export interface WeaponResponse {
  id: string;
  inUse: boolean;
  level: number;
}

export interface PictoResponse {
  id: string;
  level: number;
  slot: number;
}

export interface ItemResponse {
  description: string;
}

export interface SkillResponse {
  id: string;
  slot?: number;
}

export interface FightInfoResponse {
  playerBattleID?: number;
  initiativesBattleIDs?: number[]; // battleID
  characters?: BattleCharacterInfo[]; // enemies and allies
  battleStatus: BattleStatus;
}

export interface BattleCharacterInfo {
  battleID: number;
  id: string; // known NPC ID or Player ID. Ex.: ice-golem
  name: string;
  healthPoints: number;
  maxHealthPoints: number;
  magicPoints?: number;
  maxMagicPoints?: number;
  status?: StatusResponse[];
  type: BattleCharacterType;
  isEnemy: boolean;
}

export interface StatusResponse {
  type: StatusType;
  ammount: number; // Ex.: Burning 3
}

export interface PlayerSheetResponse {
  name?: string;
  character?: string;
  totalPoints?: number;
  xp?: number;
  power?: number;
  actionPoints?: number;
  hability?: number;
  magicPoints?: number;
  resistence?: number;
  healthPoints?: number;
  notes?: string;
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

export class APIPlayer {
  static async create(
    input: CreatePlayerInput
  ): Promise<CreatePlayerResponse> {

    return APIService.respond<CreatePlayerResponse>(
      { playerID: String(Date.now()) },
      600
    );

    // Se quiser usar um POST “real” do seu APIService:
    // return APIService.post<CreatePlayerResponse>("/players", input);
  }

  static async getInfo(playerId: string): Promise<GetPlayerResponse> {
    // Aqui você pode mockar dados iniciais de um Player
    const mock: PlayerResponse = {
      id: playerId,
      playerSheet: {
        name: "Mock Player",
        character: "sciel",
        totalPoints: 10,
        healthPoints: 15,
        magicPoints: 20,
        xp: 5,
        power: 3,
        hability: 4,
        resistence: 6,
        actionPoints: 7,
        notes: "Notes"
      },
      weapons: [
        { id: "Abysseram", inUse: false, level: 3 },
        { id: "Baguette", inUse: false, level: 6 },
        { id: "Chevalam", inUse: false, level: 21 },
        { id: "Kralim", inUse: false, level: 8 },
        { id: "Sadon", inUse: true, level: 8 },
      ],
      pictos: [],
      items: [{ description: "Potion of Healing" }],
      skills: [{ id: "skill-1", slot: 0 }],
      fightInfo: {
        // playerBattleID: 4,
        initiativesBattleIDs: [],
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
        battleStatus: "starting"
        // battleStatus: "started"
      },
      status: [],
    };

    // Simula latência e retorna
    return APIService.respond<GetPlayerResponse>(
      { player: mock },
      600
    );

    // Se quiser usar um GET “real” do seu APIService:
    // return APIService.get<GetPlayerResponse>(`/players/${playerId}`);
  }

  static async save(player: PlayerResponse): Promise<void> {
    await APIService.respond<null>(null, 600);
  }

  static async callRollInitiative(player: PlayerResponse): Promise<void> {
    await APIService.respond<null>(null, 600);
  }
}