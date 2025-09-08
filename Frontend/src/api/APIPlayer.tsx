import { APIService } from "./APIService";

export interface PlayerResponse {
  id: string;
  playerSheet?: PlayerSheetResponse;
  weapons?: WeaponResponse[];
  pictos?: PictoResponse[];
  items?: ItemResponse[];
  skills?: SkillResponse[];
  fightInfo?: FightInfoResponse;
  actions?: ActionResponse[];
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
  initiatives?: string[]; // enemies ids or team member id
  characters?: BattleCharacterInfo[]; // enemies and allies
}

export interface ActionResponse {
  type: string; // TODO: create enum. Ex: skill, item, attack, free shot
  identifier: string;
  targetsID: string[];
  ammount: number;
  origin: ActionOrigin;
}

export interface ActionOrigin {
  type: string; // TODO: create enum. Ex: enemy, player
  identifier: string;
}

export interface BattleCharacterInfo {
  battleID: string;
  id: string; // known NPC ID or Player ID. Ex.: ice-golem
  healthPoints: number;
  magicPoints?: number;
  status?: StatusResponse[];
  type: string; // player or npc
  isEnemy: boolean;
}

export interface StatusResponse {
  id: string;
  ammount: number; // Ex.: 3 burn
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
        { id: "Scieleson", inUse: true, level: 8 },
      
      ],
      pictos: [],
      items: [{ description: "Potion of Healing" }],
      skills: [{ id: "skill-1", slot: 0 }],
      fightInfo: {
        initiatives: [],
        characters: [],
      },
      actions: [],
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
    // Se fosse uma API real:
    // await APIService.put(`/players/${player.id}`, player);

    // Mock: apenas simula latência e erro eventual
    await APIService.respond<null>(null, 600);
  }
}