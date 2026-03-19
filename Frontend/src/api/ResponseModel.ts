import type { WeaponDTO } from "../types/WeaponDTO";

export type StatusType =
    "Empowered" | "Regeneration" |
    "Unprotected" | "Slowed" | "Weakened" | "Cursed" |
    "Stunned" | "Charm" | "Frozen" | "Entangled" |
    "Exhausted" | "Frenzy" | "Rage" |
    "Inverted" | "Marked" | "Blight" | "Burning" |
    "Silenced" | "Dizzy" | "Broken" | "free-shot" | "jump" | "gradient" | "Fleeing" |
    "FireVulnerability" | "Guardian" | "Foretell" | "Twilight" | "Powerless" |
    "Rush" | "Shield" | "Powerful" | "Shell" | "invisible-barrier" |
    "DamageReduction" | "SuccessiveParry" | "Aureole" | "FortunesFury" | "IntenseFlames" | "Earthquake" | "StormCaller" | "Typhoon" | "Charging" | "DamageEscalation" |
    "BlueFlower" | "RedFlower";

export type Element = "Physical" | "Void" | "Light" | "Lightning" | "Fire" | "Ice" | "Dark" | "Earth";
export type ElementModifierType = "imune" | "weak" | "resistent" | "absorb";
export type AttackType = "basic" | "gradient" | "free-shot" | "skill";
export type SpecialAttackType = "give-status";
export type PictoColor = "green" | "red" | "blue" | "yellow";
export type BattleCharacterType = "player" | "npc";
export type BattleStatus = "starting" | "started" | "finished";
export type Stance = "Defensive" | "Offensive" | "Virtuous";

export interface InitiativeResponse {
    playFirst: boolean;
    battleID: number;
    value: number;
    hability: number;
}

export interface BattleTurnResponse {
    id: number
    battleId: number
    battleCharacterId: number
    playOrder: number
}

export interface StatusResponse {
    effectName: StatusType;
    ammount: number; // Ex.: Burning 3
    remainingTurns?: number | null;
    isResolved: boolean;
}

export type StainType = "Lightning" | "Earth" | "Fire" | "Ice" | "Light";

export interface BattleCharacterInfo {
    battleID: number;
    id: string; // known NPC ID or Player ID. Ex.: ice-golem
    name: string;
    healthPoints: number;
    maxHealthPoints: number;
    magicPoints?: number;
    maxMagicPoints?: number;
    chargePoints?: number;
    maxChargePoints?: number;
    sunCharges?: number;
    moonCharges?: number;
    gradientPoints?: number;
    actionPoints?: number;
    maxActionPoints?: number;
    power?: number; // Character's power/might stat
    stance?: Stance | null;
    stainSlot1?: StainType | null;
    stainSlot2?: StainType | null;
    stainSlot3?: StainType | null;
    stainSlot4?: StainType | null;
    perfectionRank?: string | null;
    rankProgress?: number | null;
    bestialWheelPosition?: number | null;
    status?: StatusResponse[];
    type: BattleCharacterType;
    isEnemy: boolean;
    canRollInitiative?: boolean;
    parriesThisTurn?: number;
    hitsTakenThisTurn?: number;
    foretellConsumedTotal?: number;
    freeShotWeakPoints?: number;
    breakCount?: number;
}

export type RewardType = "weapon" | "picto";

export interface BattleReward {
    type: RewardType;
    itemId: string;  // Weapon name or Picto name
    level: number;   // Level of the reward
}

export interface NPCInfo {
    id: string;
    name: string;
    // D&D 5e ability scores
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
    // Combat options
    playFirst?: boolean;
    weakTo?: Element | Element[];
    resistentTo?: Element | Element[];
    imuneTo?: Element | Element[];
    absorbElement?: Element | Element[];
    freeShotWeakPoints?: number;
    passives?: string[];
    attackList?: NPCAttack[];
    isFlying?: boolean;
    initiativeBonus?: number;
    maxLifeBonus?: number;
    armorClass?: number;
    challengeRating?: string;
    proficiencyBonus?: number;
    damageDie?: number;  // Die size for damage rolls (default 6 = d6)
    conditionImmunities?: StatusType[];
    damageVulnerabilities?: string[];
    damageImmunities?: string[];
    drops?: { pictos?: string[]; weapons?: string[] };
    isBoss?: boolean;
    noBasicAttack?: boolean;
}

export interface NPCStatusItem {
    type: StatusType;
    ammount: number;
    remainingTurns?: number;
}

export type NPCAttackTargeting = "single" | "multiple" | "all";
export type AttackIntensity = "high" | "veryHigh" | "extreme" | "maximum";

export interface NPCAttack {
    type: AttackType;
    statusList?: NPCStatusItem[];  // Optional list of status effects to apply
    quantity?: number;  // Number of times this attack will be used in sequence
    quantityText?: string;  // Custom text for quantity (e.g., "2 a 3 golpes"), overrides quantity display
    name?: string;  // Custom name to display on the button (overrides default label)
    additionalDamage?: number;  // Flat damage bonus added to each attack roll
    intensity?: AttackIntensity;  // Attack intensity: normal(1 die), high(2), veryHigh(3), extreme(4), maximum(5)
    description?: string;  // Manual D&D-style description (overrides auto-generated)
    element?: Element;  // Damage element (defaults to Physical)
    targetsAll?: boolean;  // Attack hits all enemies (legacy, same as targeting: "all")
    targeting?: NPCAttackTargeting;  // "single" = same target, "multiple" = different targets, "all" = all enemies
    attackModifier?: number;  // Extra modifier added to the attack roll (can be negative to make attacks easier to dodge)
}

/** Returns the number of damage dice for the given attack intensity (omitted = normal = 1 die) */
export function getIntensityDiceCount(intensity?: AttackIntensity): number {
    switch (intensity) {
        case "high": return 2;
        case "veryHigh": return 3;
        case "extreme": return 4;
        case "maximum": return 5;
        default: return 1;
    }
}


export type TerrainType = "forest" | "mountain" | "desert" | "swamp" | "cave" | "ruins" | "city" | "plains" | "coast" | "underground" | "volcano" | "tundra";
export type DangerLevel = "safe" | "low" | "medium" | "high" | "deadly";

export interface LocationEncounter {
    npcIds: string[];           // NPCs que aparecem neste encontro
    description?: string;       // Descrição do encontro
    probability?: string;       // Ex.: "comum", "raro"
}

export interface LocationInfo {
    id: string;
    description?: string;
    imageUrl?: string;
    terrain?: TerrainType;
    dangerLevel?: DangerLevel;
    encounters?: LocationEncounter[];
    loot?: BattleReward[];      // Recompensas possíveis nesta localização
    residentNpcIds?: string[];        // NPCs vinculados ao sistema (combate)
    referenceNpcNames?: string[];     // NPCs de referência (apenas nome)
    connectedLocationIds?: string[];  // Locais conectados/acessíveis
    notes?: string;             // Notas livres do mestre
}

export interface PictoResponse {
    id: number,
    playerId: number,
    pictoId: string,
    level?: number;
    slot?: number | null;
    battleCount?: number;
}

export type PictoTrigger =
    | "on-heal-ally"
    | "on-revived"
    | "on-free-aim"
    | "on-battle-start"
    | "on-healing-tint"
    | "on-turn-start"
    | "on-turn-end"
    | "on-attack"
    | "on-parry"
    | "on-dodge"
    | "on-crit"
    | "on-skill-use"
    | "on-damage-taken";

export interface PictoInfo {
    id: string;  // kebab-case ID (e.g., "energy-master")
    imageId: string;  // English name for image filename (e.g., "Energy Master")
    name: string;  // Localized name (e.g., "Mestre de Energia" or "Energy Master")
    status: PictoStatusResponse;
    description: string;
    color: PictoColor;
    luminaCost: number;
    effectTriggers?: PictoTrigger[];  // When this picto's effect activates
}

export interface PictoStatusResponse {
    speed?: number;
    health?: number;
    defense?: number;
    strength?: number;
    intelligence?: number;
    wisdom?: number;
    charisma?: number;
}

export interface LuminaResponse {
    id: number
    playerId: number
    pictoId: string
    isEquiped: boolean
}

export interface PlayerItemResponse {
    id: number
    playerId: number
    itemId: string
    quantity: number
    maxQuantity: number
    lastRecoveryPercent: number | null
    diceCount: number | null
    diceSize: number | null
}

export interface PlayerSpecialAttackResponse {
    id: string;
    specialAttackId: string;
    slot?: number | null;
}

export interface SpecialAttackResponse {
    id: string;
    character: string;
    name: string;
    cost: number;
    unlockCost?: number;
    description: string;
    type?: string;
    isGradient?: boolean;
    masterUnlock?: boolean;  // Requires master permission to unlock
    image: string;
    preRequisite?: string[];
    isBlocked?: boolean;
}

export interface WeaponResponse {
    id: string;
    level: number;
}

export interface FightInfoResponse {
    battleId: number;
    playerBattleID: number;
    initiatives?: InitiativeResponse[];
    characters?: BattleCharacterInfo[];
    turns?: BattleTurnResponse[];
    battleStatus: BattleStatus;
    canRollInitiative: boolean;
}

export interface BattleLogResponse {
    id: number;
    eventType: string;
    eventJson?: string;
    battleId: number;
}

export interface AttackStatusEffectResponse {
    id: number
    effectType: StatusType
    ammount: number
    remainingTurns?: number | null
}

export interface ElementModifier {
    type: ElementModifierType
    flatBonus: number
}

export interface WeaponInfo {
    weapon: WeaponResponse | null;
    details: WeaponDTO | null;
}

// ==================== Picto Effect System ====================

export interface PictoEffectTracker {
    id: number;
    battleId: number;
    battleCharacterId: number;
    pictoName: string;
    effectType: string;
    timesTriggered: number;
    lastTurnTriggered?: number;
}

export interface DamageModifier {
    id: number;
    battleCharacterId: number;
    modifierType: string;
    multiplier: number;
    flatBonus: number;
    conditionType?: string;
    isActive: boolean;
}

export interface StatusImmunity {
    id: number;
    battleCharacterId: number;
    statusType: StatusType;
    immunityType: 'immune' | 'resist';
    resistChance?: number;
}

export interface ElementResistance {
    id: number;
    battleCharacterId: number;
    element: Element;
    resistanceType: 'immune' | 'resist' | 'weak';
    damageMultiplier: number;
}