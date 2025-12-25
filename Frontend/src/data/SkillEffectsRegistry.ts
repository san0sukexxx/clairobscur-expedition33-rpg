import type { StatusType, Stance } from "../api/ResponseModel";

export interface SkillEffect {
    effectType: StatusType | "Heal" | "Cleanse";  // StatusType + special effect types
    amount: number;               // Burning 3, Shield 2, Heal amount
    remainingTurns?: number;      // Duration
    targetType: "enemy" | "self" | "ally" | "all-enemies" | "all-allies";
    chance?: number;              // 0-100% probability
    condition?: string;           // "target-burning", "self-hp-below-50"
}

export interface SkillMetadata {
    skillId: string;              // "gustave-lumiere-assault"

    // Damage
    damageLevel: "none" | "low" | "medium" | "high" | "very-high" | "extreme";  // none=0%, low=50%, medium=100%, high=150%, very-high=200%, extreme=250%
    hitCount: number;             // 1 to 8 hits
    targetScope: "single" | "all" | "self";  // single = alvo selecionado, all = todos do tipo, self = si mesmo
    damageType: "physical" | "magical" | "true";
    usesWeaponElement: boolean;   // Use weapon's element?
    forcedElement?: string;       // "Lightning", "Fire", etc - overrides weapon element

    // Effects
    primaryEffects: SkillEffect[];       // Always applied
    conditionalEffects: SkillEffect[];   // Applied if condition met

    // Special
    generatesMagicOnCrit?: boolean;      // Lumiere Assault
    consumesShield?: boolean;
    canBeCountered?: boolean;
    canBreak?: boolean;                  // Overcharge, Shatter
    consumesCharge?: boolean;            // Skill consumes all charges when used
    damageScalesWithCharge?: boolean;    // Damage scales with charge amount
    changesStanceTo?: Stance | null;     // Using this skill changes the user's stance to this (Breaking Rules -> Offensive)
    preservesVirtuoseStance?: boolean;   // If true and in Virtuose stance, keep Virtuose; otherwise go Stanceless (Fleuret Fury)
    isGradient?: boolean;                // Uses Gradient Charge instead of MP (cost = gradient charges)
    destroysShields?: boolean;           // Destroys all Shielded status effects (Breaking Rules)
    grantsAPPerShield?: number;          // Grants AP per shield destroyed (Breaking Rules)
    damageScalesWithBurn?: boolean;      // Damage increases per Burn stack on target (Burning Canvas)
    burnDamageBonus?: number;            // % damage bonus per Burn stack (default 10%)
    consumesBurn?: boolean;              // Consumes Burn stacks for damage (Combustion)
    maxBurnConsumption?: number;         // Maximum Burn stacks consumed (default 10)
    burnConsumptionBonus?: number;       // % damage bonus per Burn consumed (default 10%)
    executionThreshold?: number;         // If target HP% is below this, execute instantly (Gommage: 25%)
    markedDamageBonus?: number;          // % damage bonus against Marked targets (Gustave's Homage: 50%)
    setsHpTo?: number;                   // Sets self HP to specific value (Last Chance: 1)
    refillsAP?: boolean;                 // Refills all AP to maximum (Last Chance)
    reappliesStance?: boolean;           // Reapplies current stance (Mezzo Forte)
    grantsAPRange?: { min: number; max: number };  // Grants random AP between min and max (Mezzo Forte: 2-4)
    costReductionFromStance?: { stance: Stance; reducedCost: number };  // Cost reduction when used from specific stance (Percee, Momentum Strike)
    damageScalesWithHitsReceived?: boolean;  // Damage increases per hit taken since last turn (Revenge, Payback)
    costReductionPerParry?: number;      // AP cost reduced per successful parry (Payback)
    switchesToVirtuoseIfBurning?: boolean;  // Switches to Virtuose if target is burning (Swift Stride)
    appliesSelfDefenseless?: boolean;    // Applies Defenseless to self (Stendhal)
    conditionalBurnBonus?: { fromStance: Stance; bonusBurn: number };  // Extra burn when used from specific stance (Spark, Rain of Fire, Pyrolyse)
    doubleCritDamage?: boolean;          // Critical hits deal double damage instead of normal crit (Sword Ballet)
    consumesForetell?: boolean;          // Consumes all Foretell stacks from target for bonus damage/heal (Twilight Slash, Harvest)
    foretellDamageBonus?: number;        // Damage bonus per Foretell consumed (default 2 = +2 damage per stack)
    foretellHealBonus?: number;          // Heal bonus per Foretell consumed (e.g., 5 = +5% heal per stack for Harvest)
    extendsTwilight?: boolean;           // Extends Twilight status duration by 1 turn if source has Twilight (Twilight Dance)
    delaysTurn?: number;                 // Delays target's turn by this many positions (Delaying Slash: 2)
    consumesForetellPerHit?: boolean;    // Consumes 1 Foretell per hit for damage bonus (Sealed Fate: 200% = 3x total)
    foretellPerHitMultiplier?: number;   // Damage multiplier when consuming Foretell per hit (default 3.0 = 200% bonus)
    appliesForetellOnCrit?: number;      // Applies additional Foretell stacks on critical hits (Spectral Sweep: +1 per crit)
    propagatesBurnDamage?: boolean;      // Propagates damage to other Burning enemies (Searing Bond: 50% damage + 1 Foretell)
    grantsMpPerForetell?: number;        // Grants MP to random ally per Foretell consumed (Plentiful Harvest: 1 MP per stack)
    drainsAlliesHp?: boolean;            // Drains all allies HP to 1, adds drained HP to damage (Our Sacrifice)
    consumesAllEnemiesForetell?: boolean; // Consumes Foretell from ALL enemies, adds to damage (Our Sacrifice: +1 per stack)
    redistributesForetell?: boolean;     // Redistributes target's Foretell to all other enemies (Card Weaver)
    grantsExtraTurn?: boolean;           // Grants an extra turn to the user (Card Weaver - shows toast only)
    cleansesAndCopiesBuffs?: boolean;    // Cleanses all debuffs from target and copies buffs to other allies (Dark Cleansing)
    randomAllyCount?: { min: number; max: number };  // Applies to random number of allies (Rush: 1-3)
}

export const SkillEffectsRegistry: Record<string, SkillMetadata> = {
    // ==================== GUSTAVE (8 skills) ====================

    "gustave-lumiere-assault": {
        skillId: "gustave-lumiere-assault",
        damageLevel: "medium",  // 100% weapon damage
        hitCount: 5,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: true,
        primaryEffects: [],
        conditionalEffects: [],
        generatesMagicOnCrit: true
    },

    "gustave-marking-shot": {
        skillId: "gustave-marking-shot",
        damageLevel: "low",  // 50% weapon damage
        hitCount: 1,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: false,
        forcedElement: "Lightning",
        primaryEffects: [
            {
                effectType: "Marked",
                amount: 0,
                remainingTurns: 3,
                targetType: "enemy"
            }
        ],
        conditionalEffects: []
    },

    "gustave-overcharge": {
        skillId: "gustave-overcharge",
        damageLevel: "high",  // 150% weapon damage base
        hitCount: 1,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: false,
        forcedElement: "Lightning",
        primaryEffects: [],
        conditionalEffects: [],
        canBreak: true,
        consumesCharge: true,          // Consumes all charges when used
        damageScalesWithCharge: true   // Damage increases by +1 per charge
    },

    "gustave-powerful": {
        skillId: "gustave-powerful",
        damageLevel: "none",  // No damage
        hitCount: 0,
        targetScope: "all",  // Atinge todos aliados
        damageType: "physical",
        usesWeaponElement: false,
        primaryEffects: [
            {
                effectType: "Empowered",
                amount: 0,
                remainingTurns: 3,
                targetType: "all-allies"
            }
        ],
        conditionalEffects: []
    },

    "gustave-recovery": {
        skillId: "gustave-recovery",
        damageLevel: "none",  // No damage
        hitCount: 0,
        targetScope: "self",
        damageType: "physical",
        usesWeaponElement: false,
        primaryEffects: [
            {
                effectType: "Heal",
                amount: 50,  // 50% of max HP
                targetType: "self"
            },
            {
                effectType: "Cleanse",
                amount: 0,
                targetType: "self"
            }
        ],
        conditionalEffects: []
    },

    "gustave-from-fire": {
        skillId: "gustave-from-fire",
        damageLevel: "medium",  // 100% weapon damage
        hitCount: 3,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: true,
        primaryEffects: [],
        conditionalEffects: [
            {
                effectType: "Heal",
                amount: 20,  // 20% of max HP
                targetType: "self",
                condition: "target-burning"
            }
        ]
    },

    "gustave-shatter": {
        skillId: "gustave-shatter",
        damageLevel: "high",  // 150% weapon damage
        hitCount: 1,
        targetScope: "all",
        damageType: "physical",
        usesWeaponElement: false,
        forcedElement: "Lightning",
        primaryEffects: [],
        conditionalEffects: [],
        canBreak: true
    },

    "gustave-strike-storm": {
        skillId: "gustave-strike-storm",
        damageLevel: "very-high",  // 200% weapon damage
        hitCount: 6,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: true,
        primaryEffects: [],
        conditionalEffects: []
    },

    // ==================== MAELLE ====================

    // Offensive Stance Skills
    "maelle-offensive-switch": {
        skillId: "maelle-offensive-switch",
        damageLevel: "low",  // 50%
        hitCount: 1,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: true,         // Uses weapon's element
        changesStanceTo: "Offensive",    // Changes stance to Offensive
        primaryEffects: [
            {
                effectType: "Unprotected",  // Defenceless
                amount: 0,
                remainingTurns: 3,
                targetType: "enemy"
            }
        ],
        conditionalEffects: []
    },

    "maelle-guard-down": {
        skillId: "maelle-guard-down",
        damageLevel: "none",  // Support skill
        hitCount: 0,
        targetScope: "all",
        damageType: "physical",
        usesWeaponElement: false,
        changesStanceTo: "Offensive",        // Changes stance to Offensive when used
        primaryEffects: [
            {
                effectType: "Unprotected",  // Defenseless - enemies take +25% damage for 3 turns
                amount: 0,
                remainingTurns: 3,
                targetType: "all-enemies"
            }
        ],
        conditionalEffects: []
    },

    "maelle-spark": {
        skillId: "maelle-spark",
        damageLevel: "low",
        hitCount: 1,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: false,
        forcedElement: "Fire",
        changesStanceTo: "Defensive",    // Changes stance to Defensive
        conditionalBurnBonus: { fromStance: "Offensive", bonusBurn: 2 },  // +2 Burn if used from Offensive (5 total)
        primaryEffects: [
            {
                effectType: "Burning",
                amount: 3,  // Base 3 Burn (5 if from Offensive)
                targetType: "enemy"
            }
        ],
        conditionalEffects: []
    },

    "maelle-degagement": {
        skillId: "maelle-degagement",
        damageLevel: "low",
        hitCount: 1,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: false,
        forcedElement: "Fire",
        changesStanceTo: "Offensive",     // Changes stance to Offensive when used
        primaryEffects: [
            {
                effectType: "FireVulnerability",
                amount: 0,
                remainingTurns: 2,
                targetType: "enemy"
            }
        ],
        conditionalEffects: []
    },

    "maelle-revenge": {
        skillId: "maelle-revenge",
        damageLevel: "high",
        hitCount: 1,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: false,
        forcedElement: "Fire",
        changesStanceTo: "Defensive",    // Changes stance to Defensive
        damageScalesWithHitsReceived: true,  // Damage increases per hit taken since last turn
        primaryEffects: [],
        conditionalEffects: [],
        canBreak: true
    },

    "maelle-breaking-rules": {
        skillId: "maelle-breaking-rules",
        damageLevel: "low",
        hitCount: 2,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: false,
        changesStanceTo: "Offensive",     // Using this skill changes stance to Offensive
        destroysShields: true,            // Destroys all Shielded status effects
        grantsAPPerShield: 1,             // Gains 1 AP per shield destroyed
        primaryEffects: [],
        conditionalEffects: [
            {
                effectType: "free-shot",  // Play a second turn
                amount: 1,
                remainingTurns: 0,
                targetType: "self",
                condition: "target-unprotected"  // If target is Defenseless
            }
        ]
    },

    "maelle-fencers-flurry": {
        skillId: "maelle-fencers-flurry",
        damageLevel: "medium",
        hitCount: 1,
        targetScope: "all",
        damageType: "physical",
        usesWeaponElement: true,             // Uses weapon's element
        changesStanceTo: "Offensive",        // Changes stance to Offensive when used
        primaryEffects: [
            {
                effectType: "Unprotected",   // Defenseless - enemies take +25% damage
                amount: 0,
                remainingTurns: 1,
                targetType: "all-enemies"
            }
        ],
        conditionalEffects: []
    },

    "maelle-burning-canvas": {
        skillId: "maelle-burning-canvas",
        damageLevel: "high",
        hitCount: 5,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Void",
        changesStanceTo: "Offensive",     // Changes stance to Offensive when used
        damageScalesWithBurn: true,       // Damage increases per Burn on target
        burnDamageBonus: 10,              // +10% damage per Burn stack
        primaryEffects: [
            {
                effectType: "Burning",
                amount: 1,  // 1 Burn per hit (5 total)
                remainingTurns: 3,
                targetType: "enemy"
            }
        ],
        conditionalEffects: []
    },

    "maelle-pyrolyse": {
        skillId: "maelle-pyrolyse",
        damageLevel: "extreme",
        hitCount: 3,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: false,
        forcedElement: "Fire",
        changesStanceTo: "Defensive",    // Changes stance to Defensive
        conditionalBurnBonus: { fromStance: "Offensive", bonusBurn: 2 },  // +2 Burn per hit if from Offensive (7 total per hit)
        primaryEffects: [
            {
                effectType: "Burning",
                amount: 5,  // Base 5 Burn per hit (7 if from Offensive)
                targetType: "enemy"
            }
        ],
        conditionalEffects: []
    },

    // Defensive Stance Skills
    "maelle-guard-up": {
        skillId: "maelle-guard-up",
        damageLevel: "none",
        hitCount: 0,
        targetScope: "all",  // Up to 3 allies
        damageType: "physical",
        usesWeaponElement: false,
        changesStanceTo: "Offensive",        // Changes stance to Offensive when used
        primaryEffects: [
            {
                effectType: "Protected",  // Shell - reduces damage taken, extends Egide duration
                amount: 0,
                remainingTurns: 3,
                targetType: "all-allies"
            }
        ],
        conditionalEffects: []
    },

    "maelle-rain-of-fire": {
        skillId: "maelle-rain-of-fire",
        damageLevel: "medium",
        hitCount: 2,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: false,
        forcedElement: "Fire",
        changesStanceTo: "Offensive",    // Changes stance to Offensive
        conditionalBurnBonus: { fromStance: "Defensive", bonusBurn: 2 },  // +2 Burn per hit if from Defensive (5 total per hit)
        primaryEffects: [
            {
                effectType: "Burning",
                amount: 3,  // Base 3 Burn per hit (5 if from Defensive)
                targetType: "enemy"
            }
        ],
        conditionalEffects: []
    },

    "maelle-phantom-strike": {
        skillId: "maelle-phantom-strike",
        damageLevel: "very-high",
        hitCount: 4,
        targetScope: "all",
        damageType: "physical",
        usesWeaponElement: false,
        forcedElement: "Void",
        changesStanceTo: "Defensive",    // Changes stance to Defensive
        primaryEffects: [],  // Gradient charge gain (+35%) not implemented in status system
        conditionalEffects: []
    },

    "maelle-egide": {
        skillId: "maelle-egide",
        damageLevel: "none",
        hitCount: 0,
        targetScope: "self",
        damageType: "physical",
        usesWeaponElement: false,
        changesStanceTo: "Defensive",     // Changes stance to Defensive when used
        primaryEffects: [
            {
                effectType: "Taunt",
                amount: 0,
                remainingTurns: 2,        // Lasts 2 turns (3 if Shielded)
                targetType: "self"
            }
        ],
        conditionalEffects: []
    },

    // Virtuose Stance Skills
    "maelle-percee": {
        skillId: "maelle-percee",
        damageLevel: "medium",
        hitCount: 1,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: false,
        changesStanceTo: "Defensive",    // Changes stance to Defensive
        costReductionFromStance: { stance: "Virtuous", reducedCost: 2 },  // 5 AP normally, 2 AP from Virtuose
        markedDamageBonus: 50,           // +50% damage against Marked targets
        primaryEffects: [],
        conditionalEffects: []
    },

    "maelle-swift-stride": {
        skillId: "maelle-swift-stride",
        damageLevel: "low",
        hitCount: 1,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: false,
        switchesToVirtuoseIfBurning: true,  // Switches to Virtuose if target is burning
        grantsAPRange: { min: 0, max: 2 },  // Grants 0-2 AP randomly
        primaryEffects: [],
        conditionalEffects: []
    },

    "maelle-fleuret-fury": {
        skillId: "maelle-fleuret-fury",
        damageLevel: "high",
        hitCount: 3,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: false,
        changesStanceTo: null,               // Changes to Stanceless normally
        preservesVirtuoseStance: true,       // But stays in Virtuose if already there
        primaryEffects: [],
        conditionalEffects: [],
        canBreak: true
    },

    "maelle-momentum-strike": {
        skillId: "maelle-momentum-strike",
        damageLevel: "high",
        hitCount: 1,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: true,
        changesStanceTo: "Defensive",    // Changes stance to Defensive
        costReductionFromStance: { stance: "Virtuous", reducedCost: 4 },  // 7 AP normally, 4 AP from Virtuose
        markedDamageBonus: 50,           // +50% damage against Marked targets
        primaryEffects: [],
        conditionalEffects: []
    },

    "maelle-last-chance": {
        skillId: "maelle-last-chance",
        damageLevel: "none",
        hitCount: 0,
        targetScope: "self",
        damageType: "physical",
        usesWeaponElement: false,
        changesStanceTo: "Virtuous",     // Changes stance to Virtuose
        setsHpTo: 1,                     // Reduces self HP to 1
        refillsAP: true,                 // Refills all AP to maximum
        primaryEffects: [],
        conditionalEffects: []
    },

    // Stanceless/Support Skills
    "maelle-combustion": {
        skillId: "maelle-combustion",
        damageLevel: "medium",
        hitCount: 2,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: false,
        changesStanceTo: "Offensive",     // Changes stance to Offensive when used
        consumesBurn: true,               // Consumes Burn stacks from target
        maxBurnConsumption: 10,           // Maximum 10 Burn stacks consumed
        burnConsumptionBonus: 10,         // +10% damage per Burn consumed
        primaryEffects: [],
        conditionalEffects: []
    },

    "maelle-stendhal": {
        skillId: "maelle-stendhal",
        damageLevel: "extreme",
        hitCount: 1,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: false,
        forcedElement: "Void",
        changesStanceTo: null,           // Changes to Stanceless
        consumesShield: true,            // Removes self-Shields
        appliesSelfDefenseless: true,    // Applies Defenseless to self
        primaryEffects: [],
        conditionalEffects: []
    },

    "maelle-mezzo-forte": {
        skillId: "maelle-mezzo-forte",
        damageLevel: "none",
        hitCount: 0,
        targetScope: "self",
        damageType: "physical",
        usesWeaponElement: false,
        reappliesStance: true,           // Reapplies current stance (maintains position)
        grantsAPRange: { min: 2, max: 4 },  // Grants 2-4 AP randomly
        primaryEffects: [],
        conditionalEffects: []
    },

    "maelle-payback": {
        skillId: "maelle-payback",
        damageLevel: "very-high",
        hitCount: 1,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: false,
        changesStanceTo: "Defensive",    // Changes stance to Defensive
        damageScalesWithHitsReceived: true,  // Damage increases per hit taken since last turn
        costReductionPerParry: 1,        // AP cost reduced by 1 per successful parry (from 9 AP base)
        primaryEffects: [],
        conditionalEffects: [],
        canBreak: true
    },

    "maelle-sword-ballet": {
        skillId: "maelle-sword-ballet",
        damageLevel: "extreme",
        hitCount: 5,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: true,
        changesStanceTo: "Defensive",    // Changes stance to Defensive
        doubleCritDamage: true,          // Critical hits deal double damage (4x total instead of 2x)
        primaryEffects: [],
        conditionalEffects: []
    },

    "maelle-gustaves-homage": {
        skillId: "maelle-gustaves-homage",
        damageLevel: "high",
        hitCount: 8,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: false,
        forcedElement: "Lightning",
        changesStanceTo: "Virtuous",         // Changes to Virtuose stance
        markedDamageBonus: 50,               // +50% damage against Marked targets (doesn't remove Mark)
        primaryEffects: [],
        conditionalEffects: []
    },

    // Gradient Skills
    "maelle-phoenix-flame": {
        skillId: "maelle-phoenix-flame",
        damageLevel: "none",
        hitCount: 0,
        targetScope: "all",
        damageType: "physical",
        usesWeaponElement: false,
        forcedElement: "Fire",
        isGradient: true,
        changesStanceTo: "Offensive",    // Changes stance to Offensive
        primaryEffects: [
            {
                effectType: "Burning",
                amount: 10,
                remainingTurns: 3,
                targetType: "all-enemies"
            }
        ],
        conditionalEffects: []  // Mass revival (50-70% HP) not implemented in status system
    },

    "maelle-gommage": {
        skillId: "maelle-gommage",
        damageLevel: "extreme",
        hitCount: 1,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Void",
        isGradient: true,
        changesStanceTo: "Virtuous",         // Changes to Virtuose stance
        executionThreshold: 25,              // Instantly kills if target HP <= 25%
        primaryEffects: [],
        conditionalEffects: []
    },

    "maelle-virtuose-strike": {
        skillId: "maelle-virtuose-strike",
        damageLevel: "high",
        hitCount: 5,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: false,
        isGradient: true,
        changesStanceTo: "Virtuous",     // Changes stance to Virtuose
        primaryEffects: [],
        conditionalEffects: []
    },

    // ==================== LUNE (25 skills) ====================

    // Starting Skills
    "lune-ice-lance": {
        skillId: "lune-ice-lance",
        damageLevel: "medium",
        hitCount: 1,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Ice",
        primaryEffects: [
            {
                effectType: "Slowed",
                amount: 0,
                remainingTurns: 3,
                targetType: "enemy"
            }
        ],
        conditionalEffects: []
        // Stain mechanics: Consumes 1 Earth for damage; Gains +1 Ice, +1 Light
    },

    "lune-immolation": {
        skillId: "lune-immolation",
        damageLevel: "low",
        hitCount: 1,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Fire",
        primaryEffects: [
            {
                effectType: "Burning",
                amount: 3,  // +2 if target is Marked
                targetType: "enemy"
            }
        ],
        conditionalEffects: [
            {
                effectType: "Burning",
                amount: 5,  // 3 + 2 bonus
                targetType: "enemy",
                condition: "target-marked"
            }
        ]
        // Stain mechanics: Consumes Ice for damage; Gains +1 Fire
    },

    "lune-earth-rising": {
        skillId: "lune-earth-rising",
        damageLevel: "low",
        hitCount: 1,
        targetScope: "all",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Earth",
        primaryEffects: [],
        conditionalEffects: []
        // Stain mechanics: Consumes Lightning for damage; Gains +1 Earth
    },

    "lune-electrify": {
        skillId: "lune-electrify",
        damageLevel: "low",
        hitCount: 3,  // +1 per crit
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Lightning",
        primaryEffects: [],
        conditionalEffects: []
        // Stain mechanics: Gains +2 Lightning; Consumes 1 Fire to generate 1 Light
        // Special: Critical hits trigger bonus attacks
    },

    "lune-thermal-transfer": {
        skillId: "lune-thermal-transfer",
        damageLevel: "low",
        hitCount: 2,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Ice",
        primaryEffects: [],
        conditionalEffects: []
        // Stain mechanics: Consumes 2 Earth for extra turn; Gains +1 Ice
        // Special: Grants 4 AP if target has Burn
    },

    "lune-thunderfall": {
        skillId: "lune-thunderfall",
        damageLevel: "medium",
        hitCount: 2,  // 2-6 random, +1 per crit
        targetScope: "all",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Lightning",
        primaryEffects: [],
        conditionalEffects: []
        // Stain: Consumes Fire for damage; Gains +1 Lightning, +1 Light
    },

    "lune-wildfire": {
        skillId: "lune-wildfire",
        damageLevel: "medium",
        hitCount: 1,
        targetScope: "all",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Fire",
        primaryEffects: [
            {
                effectType: "Burning",
                amount: 3,
                targetType: "enemy"
            }
        ],
        conditionalEffects: []
        // Stain: Consumes 2 Ice for damage; Gains +1 Fire, +1 Light
    },

    "lune-elemental-trick": {
        skillId: "lune-elemental-trick",
        damageLevel: "low",
        hitCount: 4,  // 1 per element
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        primaryEffects: [],
        conditionalEffects: []
        // Elements: Ice, Fire, Lightning, Earth; Crits generate stains
    },

    "lune-mayhem": {
        skillId: "lune-mayhem",
        damageLevel: "high",
        hitCount: 1,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        primaryEffects: [],
        conditionalEffects: [],
        canBreak: true  // If 4+ Stains consumed
        // Stain: Consumes ALL stains for damage; Break if 4+ consumed
    },

    "lune-crippling-tsunami": {
        skillId: "lune-crippling-tsunami",
        damageLevel: "medium",
        hitCount: 1,
        targetScope: "all",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Ice",
        primaryEffects: [
            {
                effectType: "Slowed",
                amount: 0,
                remainingTurns: 3,
                targetType: "enemy"
            }
        ],
        conditionalEffects: []
        // Stain: Consumes Earth+Lightning+Fire for damage; Gains +1 Ice, +1 Light
    },

    "lune-rockslide": {
        skillId: "lune-rockslide",
        damageLevel: "medium",
        hitCount: 2,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Earth",
        primaryEffects: [],
        conditionalEffects: [],
        canBreak: true
        // Stain: Consumes Lightning+Ice+Fire for damage; Gains +1 Earth, +1 Light
    },

    "lune-healing-light": {
        skillId: "lune-healing-light",
        damageLevel: "none",
        hitCount: 0,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Light",
        primaryEffects: [
            {
                effectType: "Heal",
                amount: 0,  // Healing amount calculated separately
                targetType: "ally"
            },
            {
                effectType: "Cleanse",
                amount: 0,
                targetType: "ally"
            }
        ],
        conditionalEffects: []
        // Stain: Consumes 2 Earth for 0 AP cost; Gains +1 Light
    },

    "lune-rebirth": {
        skillId: "lune-rebirth",
        damageLevel: "none",
        hitCount: 0,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Light",
        primaryEffects: [],
        conditionalEffects: []
        // Special: Revives ally 30-70% HP + grants 2 AP
        // Stain: Consumes 3 Lightning for 0 AP cost; Gains +1 Light
    },

    "lune-revitalization": {
        skillId: "lune-revitalization",
        damageLevel: "none",
        hitCount: 0,
        targetScope: "all",  // 1-3 allies
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Light",
        primaryEffects: [
            {
                effectType: "Heal",
                amount: 0,  // 40-60% Health
                targetType: "ally"
            }
        ],
        conditionalEffects: [
            {
                effectType: "Regeneration",
                amount: 0,
                remainingTurns: 3,
                targetType: "ally",
                condition: "if-3-earth-stains"
            }
        ]
        // Stain: Gains +1 Light; Consumes 3 Earth for Regeneration
    },

    "lune-lightning-dance": {
        skillId: "lune-lightning-dance",
        damageLevel: "very-high",
        hitCount: 6,  // +1 per crit
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Lightning",
        primaryEffects: [],
        conditionalEffects: []
        // Stain: Consumes Earth+Ice+Fire for damage; Gains +1 Lightning, +1 Light
    },

    "lune-storm-caller": {
        skillId: "lune-storm-caller",
        damageLevel: "medium",
        hitCount: 0,  // Duration-based (3 turns)
        targetScope: "all",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Lightning",
        primaryEffects: [],
        conditionalEffects: []
        // Special: Duration effect - enemies take damage at turn end + when hit
        // Stain: Consumes 2 Fire for double strikes; Gains +1 Lightning, +1 Light
    },

    "lune-terraquake": {
        skillId: "lune-terraquake",
        damageLevel: "low",
        hitCount: 0,  // Duration-based (3-5 turns)
        targetScope: "all",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Earth",
        primaryEffects: [],
        conditionalEffects: [],
        canBreak: true
        // Special: Duration effect - deals Earth damage + Break every turn
        // Increases Break damage by 50%
        // Stain: Consumes 2 Lightning for 5 turns; Gains +1 Earth, +1 Light
    },

    "lune-typhoon": {
        skillId: "lune-typhoon",
        damageLevel: "high",
        hitCount: 0,  // Duration-based (3-5 turns)
        targetScope: "all",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Ice",
        primaryEffects: [],
        conditionalEffects: []
        // Special: Duration effect - damages enemies + heals allies each turn
        // Stain: Consumes 2 Earth for 5 turns; Gains +1 Ice, +1 Light
    },

    "lune-crustal-crush": {
        skillId: "lune-crustal-crush",
        damageLevel: "high",
        hitCount: 5,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Earth",
        primaryEffects: [],
        conditionalEffects: [],
        canBreak: true
        // Stain: Consumes Lightning for damage; Gains +1 Earth, +1 Light
    },

    "lune-elemental-genesis": {
        skillId: "lune-elemental-genesis",
        damageLevel: "extreme",
        hitCount: 8,  // Random element per hit
        targetScope: "all",
        damageType: "magical",
        usesWeaponElement: false,
        primaryEffects: [],
        conditionalEffects: []
        // Special: Requires all 4 elemental stains; Random element per hit
        // Does NOT grant stains
    },

    "lune-fire-rage": {
        skillId: "lune-fire-rage",
        damageLevel: "high",
        hitCount: 0,  // Duration-based (until damaged)
        targetScope: "all",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Fire",
        primaryEffects: [],
        conditionalEffects: []
        // Special: Escalating damage each turn until Lune is hit; Self-Stun if interrupted
        // Stain: Consumes 2 Ice for damage; Gains +1 Fire, +1 Light
    },

    "lune-hell": {
        skillId: "lune-hell",
        damageLevel: "very-high",
        hitCount: 2,
        targetScope: "all",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Fire",
        primaryEffects: [
            {
                effectType: "Burning",
                amount: 5,  // Per hit
                targetType: "enemy"
            }
        ],
        conditionalEffects: []
        // Special: Self-damage if fails
        // Stain: Consumes Ice+Earth+Lightning for damage; Gains +1 Fire, +1 Light
    },

    // Gradient Skills
    "lune-sky-break": {
        skillId: "lune-sky-break",
        damageLevel: "extreme",
        hitCount: 1,
        targetScope: "all",
        damageType: "magical",
        usesWeaponElement: false,
        isGradient: true,
        primaryEffects: [],
        conditionalEffects: [],
        canBreak: true
        // Element varies based on which Stain type Lune has most
        // Does not consume a turn; Gains +3 Light
    },

    "lune-tree-of-life": {
        skillId: "lune-tree-of-life",
        damageLevel: "none",
        hitCount: 0,
        targetScope: "all",  // All allies
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Light",
        isGradient: true,
        primaryEffects: [
            {
                effectType: "Heal",
                amount: 0,
                targetType: "all-allies"
            },
            {
                effectType: "Cleanse",
                amount: 0,
                targetType: "all-allies"
            }
        ],
        conditionalEffects: []
        // Does not consume a turn; Gains +2 Light
    },

    "lune-tremor": {
        skillId: "lune-tremor",
        damageLevel: "high",
        hitCount: 1,
        targetScope: "all",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Earth",
        isGradient: true,
        primaryEffects: [],
        conditionalEffects: [],
        destroysShields: true
        // Special: Removes all enemies' Shields
        // Does not consume a turn; Gains +1 Light
    },

    // ==================== VERSO (26 skills) ====================
    // Perfection System: Ranks D → C → B → A → S
    // Gain ranks by dealing damage, parrying, dodging
    // Lose 1 rank per enemy turn when damaged

    // Starting Skills
    "verso-assault-zero": {
        skillId: "verso-assault-zero",
        damageLevel: "low",
        hitCount: 5,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: true,
        primaryEffects: [],
        conditionalEffects: []
        // Perfection: B Rank = Increased damage
        // Crits generate +1 Perfection rank point
    },

    "verso-from-fire": {
        skillId: "verso-from-fire",
        damageLevel: "medium",
        hitCount: 3,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: true,
        primaryEffects: [],
        conditionalEffects: []
        // Perfection: B Rank = Increased damage
        // Heals 20% HP if target Burns
    },

    "verso-marking-shot": {
        skillId: "verso-marking-shot",
        damageLevel: "low",
        hitCount: 1,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: true,
        primaryEffects: [
            {
                effectType: "Marked",
                amount: 0,
                remainingTurns: 3,
                targetType: "enemy"
            }
        ],
        conditionalEffects: []
        // Perfection: C Rank = Increased damage
    },

    "verso-quick-strike": {
        skillId: "verso-quick-strike",
        damageLevel: "low",
        hitCount: 1,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: false,
        primaryEffects: [],
        conditionalEffects: []
        // Perfection: D Rank = Gives more Perfection
    },

    // Support Skills
    "verso-perfect-recovery": {
        skillId: "verso-perfect-recovery",
        damageLevel: "none",
        hitCount: 0,
        targetScope: "self",
        damageType: "physical",
        usesWeaponElement: false,
        primaryEffects: [
            {
                effectType: "Heal",
                amount: 50,  // 50% HP (100% at C Rank)
                targetType: "self"
            },
            {
                effectType: "Cleanse",
                amount: 0,
                targetType: "self"
            }
        ],
        conditionalEffects: []
        // Perfection: C Rank = Recovers 100% HP instead of 50%
        // Gives 0-2 Perfection
    },

    "verso-powerful": {
        skillId: "verso-powerful",
        damageLevel: "none",
        hitCount: 0,
        targetScope: "all",  // 1-3 allies
        damageType: "physical",
        usesWeaponElement: false,
        primaryEffects: [
            {
                effectType: "Empowered",
                amount: 0,
                remainingTurns: 3,  // 5 at A Rank
                targetType: "ally"
            }
        ],
        conditionalEffects: []
        // Perfection: A Rank = Duration extends to 5 turns
        // Gives 0-2 Perfection
    },

    "verso-purification": {
        skillId: "verso-purification",
        damageLevel: "medium",
        hitCount: 2,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Light",
        primaryEffects: [
            {
                effectType: "Cleanse",
                amount: 0,
                targetType: "self"
            }
        ],
        conditionalEffects: []
        // Perfection: B Rank = Increased damage
    },

    "verso-blitz": {
        skillId: "verso-blitz",
        damageLevel: "low",
        hitCount: 1,  // Plays twice
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: false,
        primaryEffects: [],
        conditionalEffects: [],
        executionThreshold: 10  // Kills non-boss enemies < 10% HP
        // Perfection: B Rank = Increased damage
    },

    "verso-paradigm-shift": {
        skillId: "verso-paradigm-shift",
        damageLevel: "low",
        hitCount: 3,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: false,
        primaryEffects: [],
        conditionalEffects: []
        // Perfection: C Rank = Grants +1 AP (max 4 AP recovery)
        // Returns 1-3 AP back
    },

    "verso-follow-up": {
        skillId: "verso-follow-up",
        damageLevel: "medium",
        hitCount: 1,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Light",
        primaryEffects: [],
        conditionalEffects: []
        // Perfection: S Rank = AP cost reduces to 2 (from 5)
        // Damage increases per Free Aim shot this turn (up to 10 stacks)
    },

    "verso-berserk-slash": {
        skillId: "verso-berserk-slash",
        damageLevel: "medium",
        hitCount: 3,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: false,
        primaryEffects: [],
        conditionalEffects: []
        // Perfection: C Rank = Increased damage
        // Damage increases based on missing HP
    },

    "verso-ascending-assault": {
        skillId: "verso-ascending-assault",
        damageLevel: "low",
        hitCount: 1,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: true,
        primaryEffects: [],
        conditionalEffects: []
        // Perfection: S Rank = AP cost reduces to 2 (from 5)
        // Damage +30% per use (max 150% after 5 uses)
    },

    "verso-radiant-slash": {
        skillId: "verso-radiant-slash",
        damageLevel: "low",
        hitCount: 1,
        targetScope: "all",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Light",
        primaryEffects: [],
        conditionalEffects: [],
        canBreak: true
        // Perfection: C Rank = Increased damage
    },

    "verso-perfect-break": {
        skillId: "verso-perfect-break",
        damageLevel: "very-high",
        hitCount: 1,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Light",
        primaryEffects: [],
        conditionalEffects: [],
        canBreak: true
        // Perfection: B Rank = AP cost reduces to 5 (from 7)
        // When enemy breaks, auto-upgrade to S Rank
    },

    "verso-defiant-strike": {
        skillId: "verso-defiant-strike",
        damageLevel: "high",
        hitCount: 2,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: false,
        primaryEffects: [
            {
                effectType: "Marked",
                amount: 2,
                remainingTurns: 3,
                targetType: "enemy"
            }
        ],
        conditionalEffects: []
        // Perfection: B Rank = Increased damage
        // Costs 30% current HP
    },

    "verso-burden": {
        skillId: "verso-burden",
        damageLevel: "none",
        hitCount: 0,
        targetScope: "all",  // All allies + self
        damageType: "physical",
        usesWeaponElement: false,
        primaryEffects: [],
        conditionalEffects: []
        // Removes all Status Effects from allies and applies to Verso
        // Gains 1 Perfection Rank
    },

    "verso-leadership": {
        skillId: "verso-leadership",
        damageLevel: "none",
        hitCount: 0,
        targetScope: "all",  // Other allies
        damageType: "physical",
        usesWeaponElement: false,
        primaryEffects: [],
        conditionalEffects: []
        // Perfection: C Rank = Grants +1 AP (total 3-5 AP)
        // Reduces Perfection Rank by 1; Gives 2-4 AP to allies
    },

    "verso-overload": {
        skillId: "verso-overload",
        damageLevel: "none",
        hitCount: 0,
        targetScope: "self",
        damageType: "physical",
        usesWeaponElement: false,
        primaryEffects: [],
        conditionalEffects: [],
        setsHpTo: 1,
        refillsAP: true
        // Sets Perfection to S Rank and refills all AP
        // Sets HP to 1 (high risk/reward)
    },

    "verso-speed-burst": {
        skillId: "verso-speed-burst",
        damageLevel: "high",
        hitCount: 5,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Light",
        primaryEffects: [],
        conditionalEffects: []
        // Perfection: C Rank = Increased damage
        // Damage increased by Speed difference with target
    },

    "verso-light-holder": {
        skillId: "verso-light-holder",
        damageLevel: "medium",
        hitCount: 5,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Light",
        primaryEffects: [],
        conditionalEffects: []
        // Perfection: A Rank = Grants +2 AP when activated
        // Gains 1 Perfection Rank upon completion
    },

    "verso-phantom-stars": {
        skillId: "verso-phantom-stars",
        damageLevel: "extreme",
        hitCount: 5,
        targetScope: "all",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Light",
        primaryEffects: [],
        conditionalEffects: [],
        canBreak: true
        // Perfection: S Rank = AP cost reduces to 5 (from 9)
    },

    "verso-end-bringer": {
        skillId: "verso-end-bringer",
        damageLevel: "extreme",
        hitCount: 6,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: false,
        primaryEffects: [],
        conditionalEffects: []
        // Perfection: A Rank = Can reapply Stun (stun-lock)
        // Increased damage if target is Stunned
    },

    "verso-steeled-strike": {
        skillId: "verso-steeled-strike",
        damageLevel: "extreme",
        hitCount: 13,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: false,
        primaryEffects: [],
        conditionalEffects: []
        // Perfection: S Rank = Increased damage
        // Requires one-turn delay; interrupted if damaged
    },

    // Gradient Skills
    "verso-striker": {
        skillId: "verso-striker",
        damageLevel: "high",
        hitCount: 1,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: false,
        isGradient: true,
        primaryEffects: [],
        conditionalEffects: [],
        canBreak: true
        // Does not consume a turn
        // Relationship Level 4 with Esquie
    },

    "verso-sabotage": {
        skillId: "verso-sabotage",
        damageLevel: "medium",
        hitCount: 1,
        targetScope: "all",
        damageType: "physical",
        usesWeaponElement: false,
        isGradient: true,
        primaryEffects: [
            {
                effectType: "Marked",
                amount: 0,
                remainingTurns: 3,
                targetType: "enemy"
            }
        ],
        conditionalEffects: []
        // Does not consume a turn
        // Story-unlocked
    },

    "verso-angels-eyes": {
        skillId: "verso-angels-eyes",
        damageLevel: "extreme",
        hitCount: 8,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: false,
        isGradient: true,
        primaryEffects: [],
        conditionalEffects: []
        // Gains +1 Perfection per hit
        // Applies Aureole (revives if dies)
        // Does not consume a turn
        // Relationship Level 7 with Esquie
    },

    // ==================== MONOCO (47 skills) ====================
    // Bestial Wheel Pointer System: Advances pointer with each skill
    // Masks: Agile, Balanced, Caster, Heavy, Almighty
    // Different masks provide different bonuses
    // Skills acquired by defeating enemies while Monoco is in party

    // Starting Skills
    "monoco-chalier-combo": {
        skillId: "monoco-chalier-combo",
        damageLevel: "high",
        hitCount: 6,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: true,
        primaryEffects: [],
        conditionalEffects: []
        // Bestial Wheel: +3 positions
        // Bonus at Balanced Mask or Almighty Mask
        // Starting skill (no prerequisites)
    },

    "monoco-stalact-punches": {
        skillId: "monoco-stalact-punches",
        damageLevel: "medium",
        hitCount: 4,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Ice",
        primaryEffects: [],
        conditionalEffects: [],
        canBreak: true
        // Bestial Wheel: +4 positions
        // Bonus at Heavy Mask or Almighty Mask
        // Starting skill (no prerequisites)
    },

    // Enemy Drop Skills - Damage Skills
    "monoco-abbest-wind": {
        skillId: "monoco-abbest-wind",
        damageLevel: "low",
        hitCount: 1,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: true,
        primaryEffects: [],
        conditionalEffects: []
        // Bestial Wheel: +2 positions
        // Cost: 0 AP at Agile or Almighty Mask
        // Grants extra turn immediately after use
    },

    "monoco-aberration-light": {
        skillId: "monoco-aberration-light",
        damageLevel: "high",
        hitCount: 2,
        targetScope: "all-enemies",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Light",
        primaryEffects: [
            {
                effectType: "Burning",
                amount: 4,
                targetType: "enemy"
            }
        ],
        conditionalEffects: [
            {
                condition: "agile-mask",
                effectType: "Burning",
                amount: 6,  // 4 base + 2 bonus at Agile Mask
                targetType: "enemy"
            }
        ]
        // Bestial Wheel: +4 positions
        // 4 Burn per hit (6 at Agile/Almighty Mask)
    },

    "monoco-ballet-charm": {
        skillId: "monoco-ballet-charm",
        damageLevel: "low",
        hitCount: 1,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Light",
        primaryEffects: [
            {
                effectType: "Weakened",  // Powerless
                amount: 0,
                remainingTurns: 3,
                targetType: "enemy"
            }
        ],
        conditionalEffects: []
        // Bestial Wheel: +3 positions
        // Bonus damage at Caster or Almighty Mask
    },

    "monoco-benisseur-mortar": {
        skillId: "monoco-benisseur-mortar",
        damageLevel: "medium",
        hitCount: 3,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Ice",
        primaryEffects: [
            {
                effectType: "Marked",
                amount: 0,
                remainingTurns: 3,
                targetType: "enemy"
            }
        ],
        conditionalEffects: []
        // Bestial Wheel: +6 positions
        // Auto-switch to Almighty Mask if target is Marked
        // Bonus damage at Caster or Almighty Mask
    },

    "monoco-bruler-bash": {
        skillId: "monoco-bruler-bash",
        damageLevel: "medium",
        hitCount: 3,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: true,
        primaryEffects: [],
        conditionalEffects: [],
        canBreak: true
        // Bestial Wheel: +4 positions
        // Bonus damage at Caster or Almighty Mask
    },

    "monoco-chapelier-slash": {
        skillId: "monoco-chapelier-slash",
        damageLevel: "high",
        hitCount: 3,
        targetScope: "all-enemies",
        damageType: "physical",
        usesWeaponElement: true,
        primaryEffects: [
            {
                effectType: "Marked",
                amount: 0,
                remainingTurns: 3,
                targetType: "enemy"
            }
        ],
        conditionalEffects: []
        // Bestial Wheel: +4 positions
        // Applies Mark to all hit enemies
        // Bonus damage at Agile or Almighty Mask
    },

    "monoco-chevaliere-ice": {
        skillId: "monoco-chevaliere-ice",
        damageLevel: "high",
        hitCount: 3,
        targetScope: "all-enemies",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Ice",
        primaryEffects: [
            {
                effectType: "Slowed",
                amount: 0,
                remainingTurns: 3,
                targetType: "enemy"
            }
        ],
        conditionalEffects: []
        // Bestial Wheel: +2 positions
        // Bonus damage at Balanced or Almighty Mask
    },

    "monoco-chevaliere-piercing": {
        skillId: "monoco-chevaliere-piercing",
        damageLevel: "medium",
        hitCount: 6,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: true,
        primaryEffects: [],
        conditionalEffects: []
        // Bestial Wheel: +3 positions
        // Pierces shields
        // Damage increases per shield on target
        // Bonus damage at Agile or Almighty Mask
    },

    "monoco-chevaliere-thrusts": {
        skillId: "monoco-chevaliere-thrusts",
        damageLevel: "high",
        hitCount: 3,
        targetScope: "all-enemies",
        damageType: "physical",
        usesWeaponElement: true,
        primaryEffects: [],
        conditionalEffects: []
        // Bestial Wheel: +3 positions
        // Critical hits deal double damage
        // Bonus damage at Heavy or Almighty Mask
    },

    "monoco-clair-enfeeble": {
        skillId: "monoco-clair-enfeeble",
        damageLevel: "medium",
        hitCount: 1,
        targetScope: "all-enemies",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Light",
        primaryEffects: [
            {
                effectType: "Weakened",  // Powerless
                amount: 0,
                remainingTurns: 3,
                targetType: "enemy"
            }
        ],
        conditionalEffects: []
        // Bestial Wheel: +3 positions
        // Bonus damage at Balanced or Almighty Mask
    },

    "monoco-contorsionniste-blast": {
        skillId: "monoco-contorsionniste-blast",
        damageLevel: "medium",
        hitCount: 1,
        targetScope: "all-enemies",
        damageType: "physical",
        usesWeaponElement: true,
        primaryEffects: []
        // Bestial Wheel: +2 positions
        // Heals all allies by 10% HP per enemy hit
        // Bonus damage at Balanced or Almighty Mask
    },

    "monoco-creation-void": {
        skillId: "monoco-creation-void",
        damageLevel: "extreme",
        hitCount: 3,
        targetScope: "random",  // Random targets
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Dark",
        primaryEffects: [],
        conditionalEffects: []
        // Bestial Wheel: +4 positions
        // More damage if same target hit multiple times
        // Bonus damage at Caster or Almighty Mask
    },

    "monoco-cultist-blood": {
        skillId: "monoco-cultist-blood",
        damageLevel: "medium",
        hitCount: 3,
        targetScope: "all-enemies",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Dark",
        primaryEffects: [],
        conditionalEffects: []
        // Bestial Wheel: +5 positions
        // Sacrifices 90% of user's HP for increased damage
        // Bonus damage at Heavy or Almighty Mask
    },

    "monoco-cultist-slashes": {
        skillId: "monoco-cultist-slashes",
        damageLevel: "medium",
        hitCount: 3,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Dark",
        primaryEffects: [],
        conditionalEffects: []
        // Bestial Wheel: +3 positions
        // Damage increases inversely with remaining HP
        // Bonus damage at Agile or Almighty Mask
    },

    "monoco-danseuse-waltz": {
        skillId: "monoco-danseuse-waltz",
        damageLevel: "high",
        hitCount: 3,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Fire",
        primaryEffects: [],
        conditionalEffects: []
        // Bestial Wheel: +3 positions
        // Enhanced damage vs Burned targets
        // Bonus damage at Balanced or Almighty Mask
    },

    "monoco-demineur-thunder": {
        skillId: "monoco-demineur-thunder",
        damageLevel: "low",
        hitCount: 1,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Lightning",
        primaryEffects: [],
        conditionalEffects: [],
        canBreak: true
        // Bestial Wheel: +5 positions
        // Extra break damage
        // Bonus break at Caster or Almighty Mask
    },

    "monoco-duallist-storm": {
        skillId: "monoco-duallist-storm",
        damageLevel: "extreme",
        hitCount: 4,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: true,
        primaryEffects: [],
        conditionalEffects: [],
        canBreak: true
        // Bestial Wheel: +1 position only
        // Bonus damage at Almighty Mask only
        // Optimal combo: Duallist Storm → Sapling Absorption → Duallist Storm
    },

    "monoco-echassier-stabs": {
        skillId: "monoco-echassier-stabs",
        damageLevel: "medium",
        hitCount: 2,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: true,
        primaryEffects: [
            {
                effectType: "Marked",
                amount: 0,
                remainingTurns: 3,
                targetType: "enemy"
            }
        ],
        conditionalEffects: []
        // Bestial Wheel: +4 positions
        // Mark applied on second hit
        // Bonus damage at Agile or Almighty Mask
    },

    "monoco-eveque-spear": {
        skillId: "monoco-eveque-spear",
        damageLevel: "high",
        hitCount: 1,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Earth",
        primaryEffects: [
            {
                effectType: "Weakened",  // Powerless
                amount: 0,
                remainingTurns: 3,
                targetType: "enemy"
            }
        ],
        conditionalEffects: []
        // Bestial Wheel: +3 positions
        // Bonus damage at Heavy or Almighty Mask
    },

    "monoco-gault-fury": {
        skillId: "monoco-gault-fury",
        damageLevel: "low",
        hitCount: 4,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: true,
        primaryEffects: [
            {
                effectType: "Marked",
                amount: 0,
                remainingTurns: 3,
                targetType: "enemy"
            }
        ],
        conditionalEffects: []
        // Bestial Wheel: +2 positions
        // Bonus damage at Balanced or Almighty Mask
    },

    "monoco-glaise-earthquakes": {
        skillId: "monoco-glaise-earthquakes",
        damageLevel: "medium",
        hitCount: 3,
        targetScope: "all-enemies",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Earth",
        primaryEffects: [
            {
                effectType: "Empowered",  // Powerful to self
                amount: 0,
                remainingTurns: 3,
                targetType: "self"
            }
        ],
        conditionalEffects: [
            {
                condition: "heavy-mask",
                effectType: "Empowered",  // Powerful to all allies
                amount: 0,
                remainingTurns: 3,
                targetType: "all-allies"
            }
        ]
        // Bestial Wheel: +6 positions
        // Grants Powerful to all allies at Heavy/Almighty Mask
    },

    "monoco-grosse-tete-whack": {
        skillId: "monoco-grosse-tete-whack",
        damageLevel: "high",
        hitCount: 5,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: true,
        primaryEffects: [
            {
                effectType: "Unprotected",  // Defenceless
                amount: 0,
                remainingTurns: 3,
                targetType: "enemy"
            }
        ],
        conditionalEffects: []
        // Bestial Wheel: +4 positions
        // Bonus damage at Heavy or Almighty Mask
    },

    "monoco-hexga-crush": {
        skillId: "monoco-hexga-crush",
        damageLevel: "medium",
        hitCount: 2,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Earth",
        primaryEffects: [
            {
                effectType: "Unprotected",  // Defenceless
                amount: 0,
                remainingTurns: 3,
                targetType: "enemy"
            }
        ],
        conditionalEffects: [
            {
                condition: "heavy-mask",
                effectType: "Unprotected",  // Defenceless for 5 turns
                amount: 0,
                remainingTurns: 5,
                targetType: "enemy"
            }
        ]
        // Bestial Wheel: +6 positions
        // Defenceless duration: 3 turns (5 at Heavy/Almighty)
    },

    "monoco-jar-lampstorm": {
        skillId: "monoco-jar-lampstorm",
        damageLevel: "medium",
        hitCount: 4,
        targetScope: "all-enemies",
        damageType: "physical",
        usesWeaponElement: true,
        primaryEffects: [],
        conditionalEffects: []
        // Bestial Wheel: +6 positions
        // Bonus damage at Heavy or Almighty Mask
    },

    "monoco-lampmaster-light": {
        skillId: "monoco-lampmaster-light",
        damageLevel: "high",
        hitCount: 1,
        targetScope: "all-enemies",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Light",
        primaryEffects: [],
        conditionalEffects: []
        // Bestial Wheel: +1 position only
        // Damage escalates with each cast (max after 5 uses)
        // Bonus damage at Almighty Mask only
    },

    "monoco-lancelier-impale": {
        skillId: "monoco-lancelier-impale",
        damageLevel: "low",
        hitCount: 1,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Ice",
        primaryEffects: [
            {
                effectType: "Slowed",
                amount: 0,
                remainingTurns: 3,
                targetType: "enemy"
            }
        ],
        conditionalEffects: []
        // Bestial Wheel: +4 positions
        // Bonus damage at Agile or Almighty Mask
    },

    "monoco-luster-slices": {
        skillId: "monoco-luster-slices",
        damageLevel: "low",
        hitCount: 3,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: true,
        primaryEffects: [
            {
                effectType: "Hastened",  // Rush
                amount: 0,
                remainingTurns: 3,
                targetType: "self"
            }
        ],
        conditionalEffects: []
        // Bestial Wheel: +3 positions
        // Applies Rush to self for 3 turns
        // Bonus damage at Agile or Almighty Mask
    },

    "monoco-moissonneuse-vendange": {
        skillId: "monoco-moissonneuse-vendange",
        damageLevel: "high",
        hitCount: 3,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: true,
        primaryEffects: [],
        conditionalEffects: [],
        canBreak: true
        // Bestial Wheel: +2 positions
        // Bonus damage at Balanced or Almighty Mask
    },

    "monoco-obscur-sword": {
        skillId: "monoco-obscur-sword",
        damageLevel: "high",
        hitCount: 5,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Dark",
        primaryEffects: [],
        conditionalEffects: []
        // Bestial Wheel: +3 positions
        // Enhanced damage vs Powerless targets
        // Bonus damage at Heavy or Almighty Mask
    },

    "monoco-portier-crash": {
        skillId: "monoco-portier-crash",
        damageLevel: "high",
        hitCount: 1,
        targetScope: "all-enemies",
        damageType: "physical",
        usesWeaponElement: true,
        primaryEffects: [],
        conditionalEffects: [],
        canBreak: true
        // Bestial Wheel: +5 positions
        // Bonus damage at Heavy or Almighty Mask
    },

    "monoco-ramasseur-bonk": {
        skillId: "monoco-ramasseur-bonk",
        damageLevel: "low",
        hitCount: 1,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Dark",
        primaryEffects: [],
        conditionalEffects: [],
        canBreak: true
        // Bestial Wheel: +4 positions
        // At Agile Mask: fills 20% of Break Bar
        // Enhanced break at Agile or Almighty Mask
    },

    "monoco-rocher-hammering": {
        skillId: "monoco-rocher-hammering",
        damageLevel: "medium",
        hitCount: 4,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: true,
        primaryEffects: [],
        conditionalEffects: [],
        canBreak: true
        // Bestial Wheel: +3 positions
        // Bonus damage at Heavy or Almighty Mask
    },

    "monoco-sakapatate-estoc": {
        skillId: "monoco-sakapatate-estoc",
        damageLevel: "low",
        hitCount: 1,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Lightning",
        primaryEffects: [],
        conditionalEffects: []
        // Bestial Wheel: +3 positions
        // Enhanced damage vs Stunned targets
        // Bonus damage at Balanced or Almighty Mask
    },

    "monoco-sakapatate-explosion": {
        skillId: "monoco-sakapatate-explosion",
        damageLevel: "medium",
        hitCount: 3,
        targetScope: "random",  // Random enemies
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Lightning",
        primaryEffects: [],
        conditionalEffects: []
        // Bestial Wheel: +6 positions
        // Critical hits trigger additional hit
        // Bonus damage at Caster or Almighty Mask
    },

    "monoco-sakapatate-fire": {
        skillId: "monoco-sakapatate-fire",
        damageLevel: "extreme",
        hitCount: 3,
        targetScope: "all-enemies",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Fire",
        primaryEffects: [
            {
                effectType: "Burning",
                amount: 3,
                targetType: "enemy"
            }
        ],
        conditionalEffects: []
        // Bestial Wheel: +1 position only
        // 3 Burn per hit (9 total Burn possible)
        // Bonus damage at Almighty Mask only
        // Optimal combo: Sakapatate Fire → Sapling Absorption → Sakapatate Fire
    },

    "monoco-sakapatate-slam": {
        skillId: "monoco-sakapatate-slam",
        damageLevel: "high",
        hitCount: 1,
        targetScope: "all-enemies",
        damageType: "physical",
        usesWeaponElement: true,
        primaryEffects: [],
        conditionalEffects: []
        // Bestial Wheel: +5 positions
        // Enhanced damage vs Marked targets
        // Bonus damage at Heavy or Almighty Mask
    },

    "monoco-sapling-absorption": {
        skillId: "monoco-sapling-absorption",
        damageLevel: "high",
        hitCount: 3,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Dark",
        primaryEffects: [],
        conditionalEffects: []
        // Bestial Wheel: +5 positions
        // Recovers 5% HP per hit (10% at Caster/Almighty)
        // Bonus healing at Caster or Almighty Mask
    },

    "monoco-stalact-punches": {
        skillId: "monoco-stalact-punches",
        damageLevel: "medium",
        hitCount: 4,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Ice",
        primaryEffects: [],
        conditionalEffects: [],
        canBreak: true
        // Already defined above as starting skill
    },

    // Support/Utility Skills
    "monoco-cruler-barrier": {
        skillId: "monoco-cruler-barrier",
        damageLevel: "none",
        hitCount: 0,
        targetScope: "ally",
        damageType: "physical",
        usesWeaponElement: false,
        primaryEffects: [
            {
                effectType: "Shielded",
                amount: 1,  // 1-2 Shields
                targetType: "ally"
            }
        ],
        conditionalEffects: []
        // Bestial Wheel: +4 positions
        // Grants 2 AP to target at Heavy/Almighty Mask
    },

    "monoco-orphelin-cheers": {
        skillId: "monoco-orphelin-cheers",
        damageLevel: "none",
        hitCount: 0,
        targetScope: "ally",  // 1-3 allies
        damageType: "physical",
        usesWeaponElement: false,
        primaryEffects: [
            {
                effectType: "Empowered",  // Powerful
                amount: 0,
                remainingTurns: 3,
                targetType: "ally"
            }
        ],
        conditionalEffects: []
        // Bestial Wheel: +3 positions
        // Applies to 1-3 allies
        // At Caster/Almighty: grants 3 AP + 3x multiplier
    },

    "monoco-pelerin-heal": {
        skillId: "monoco-pelerin-heal",
        damageLevel: "none",
        hitCount: 0,
        targetScope: "all-allies",
        damageType: "physical",
        usesWeaponElement: false,
        primaryEffects: [
            {
                effectType: "Regeneration",
                amount: 0,
                remainingTurns: 3,
                targetType: "all-allies"
            }
        ],
        conditionalEffects: []
        // Bestial Wheel: +3 positions
        // At Caster/Almighty: bonus 40% HP healing
    },

    "monoco-potier-energy": {
        skillId: "monoco-potier-energy",
        damageLevel: "none",
        hitCount: 0,
        targetScope: "all-allies",
        damageType: "physical",
        usesWeaponElement: false,
        primaryEffects: [],
        conditionalEffects: []
        // Bestial Wheel: +6 positions
        // Grants 1-3 AP to all allies
        // At Caster/Almighty: +1 extra AP
    },

    "monoco-troubadour-trumpet": {
        skillId: "monoco-troubadour-trumpet",
        damageLevel: "none",
        hitCount: 0,
        targetScope: "ally",  // 1-3 allies
        damageType: "physical",
        usesWeaponElement: false,
        primaryEffects: [],
        conditionalEffects: []
        // Bestial Wheel: +4 positions
        // Applies random buffs to 1-3 allies
        // At Caster/Almighty: applies second random buff
    },

    // Gradient Skills
    "monoco-mighty-strike": {
        skillId: "monoco-mighty-strike",
        damageLevel: "high",
        hitCount: 2,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: true,
        primaryEffects: [],
        conditionalEffects: []
        // Gradient Skill: 1 Gradient Charge
        // Double damage vs Stunned targets
        // Advances to Almighty Mask
        // Does not consume turn
        // Automatically unlocked (story progression)
    },

    "monoco-break-point": {
        skillId: "monoco-break-point",
        damageLevel: "extreme",
        hitCount: 1,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: true,
        primaryEffects: [],
        conditionalEffects: [],
        canBreak: true
        // Gradient Skill: 3 Gradient Charges
        // Fills target's Break Bar and applies Break
        // Does not consume turn
        // Relationship Level 7 with Monoco
    },

    "monoco-sanctuary": {
        skillId: "monoco-sanctuary",
        damageLevel: "none",
        hitCount: 0,
        targetScope: "all-allies",
        damageType: "physical",
        usesWeaponElement: false,
        primaryEffects: [
            {
                effectType: "Shielded",
                amount: 2,
                targetType: "all-allies"
            },
            {
                effectType: "Regeneration",
                amount: 0,
                remainingTurns: 3,
                targetType: "all-allies"
            }
        ],
        conditionalEffects: []
        // Gradient Skill: 2 Gradient Charges
        // Gives 2 Shields + Regen to all allies
        // Does not consume turn
        // Relationship Level 4 with Monoco
    },

    // ==================== SCIEL ====================

    "sciel-twilight-slash": {
        skillId: "sciel-twilight-slash",
        damageLevel: "low",  // 50% weapon damage
        hitCount: 1,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: false,
        forcedElement: "Dark",
        primaryEffects: [],
        conditionalEffects: [],
        consumesForetell: true,  // Consome todas as Predições
        foretellDamageBonus: 2   // +2 de dano por Predição (dobro)
    },

    "sciel-focused-foretell": {
        skillId: "sciel-focused-foretell",
        damageLevel: "medium",  // 100% weapon damage
        hitCount: 1,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: true,
        primaryEffects: [
            {
                effectType: "Foretell",
                amount: 2,  // Base: 2 Predições (ou 3 se alvo não tiver Foretell)
                remainingTurns: 0,  // Foretell não tem duração de turnos
                targetType: "enemy"
            }
        ],
        conditionalEffects: [
            {
                condition: "target-no-foretell",  // Se alvo não tem Predições
                effectType: "Foretell",
                amount: 1,  // +1 Predição adicional (total 3, ou 6 com Crepúsculo que dobra tudo)
                remainingTurns: 0,
                targetType: "enemy"
            }
        ]
    },

    "sciel-marking-card": {
        skillId: "sciel-marking-card",
        damageLevel: "low",  // 50% weapon damage
        hitCount: 2,
        targetScope: "all",
        damageType: "physical",
        usesWeaponElement: false,
        forcedElement: "Dark",
        primaryEffects: [
            {
                effectType: "Foretell",
                amount: 2,  // 2 Foretell por acerto (total 4)
                remainingTurns: 0,
                targetType: "all-enemies"
            }
        ],
        conditionalEffects: []
    },

    "sciel-bad-omen": {
        skillId: "sciel-bad-omen",
        damageLevel: "medium",  // 100% weapon damage
        hitCount: 2,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: false,
        forcedElement: "Dark",
        primaryEffects: [
            {
                effectType: "Marked",
                amount: 0,
                remainingTurns: 3,
                targetType: "enemy"
            },
            {
                effectType: "Foretell",
                amount: 3,
                remainingTurns: 0,
                targetType: "enemy"
            }
        ],
        conditionalEffects: []
    },

    "sciel-sealed-fate": {
        skillId: "sciel-sealed-fate",
        damageLevel: "medium",  // 100% weapon damage per hit
        hitCount: 3,  // 3 hits, each consuming 1 Foretell
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: false,
        forcedElement: "Dark",
        primaryEffects: [
            {
                effectType: "Foretell",
                amount: 5,
                remainingTurns: 0,
                targetType: "enemy"
            }
        ],
        conditionalEffects: [],
        consumesForetellPerHit: true,    // ✅ Cada hit consome 1 Predição
        foretellPerHitMultiplier: 3.0    // ✅ 200% bonus = 3x dano total quando consome
    },

    "sciel-shadow-bringer": {
        skillId: "sciel-shadow-bringer",
        damageLevel: "high",  // 150% weapon damage
        hitCount: 10,
        targetScope: "all",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Dark",
        isGradient: true,
        primaryEffects: [
            {
                effectType: "Foretell",
                amount: 1,  // 1 Foretell por acerto (total 10)
                remainingTurns: 0,
                targetType: "all-enemies"
            }
        ],
        conditionalEffects: []
    },

    "sciel-doom": {
        skillId: "sciel-doom",
        damageLevel: "extreme",  // 250% weapon damage
        hitCount: 1,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Dark",
        isGradient: true,
        canBreak: true,
        primaryEffects: [
            {
                effectType: "Foretell",
                amount: 10,
                remainingTurns: 0,
                targetType: "enemy"
            }
        ],
        conditionalEffects: []
    },

    "sciel-delaying-slash": {
        skillId: "sciel-delaying-slash",
        damageLevel: "medium",  // 100% weapon damage
        hitCount: 2,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: true,
        primaryEffects: [],
        conditionalEffects: [],
        consumesForetell: true,          // ✅ Consome todas as Predições
        foretellDamageBonus: 2,          // ✅ +2 de dano por Predição
        delaysTurn: 2                    // ✅ Atrasa turno do alvo em 2 posições
    },

    "sciel-dark-cleansing": {
        skillId: "sciel-dark-cleansing",
        damageLevel: "none",  // 0% damage
        hitCount: 0,
        targetScope: "single",  // Aliado alvo
        damageType: "physical",
        usesWeaponElement: false,
        primaryEffects: [],
        conditionalEffects: [],
        cleansesAndCopiesBuffs: true  // ✅ Remove debuffs do alvo e copia buffs para outros aliados
    },

    "sciel-dark-wave": {
        skillId: "sciel-dark-wave",
        damageLevel: "high",  // 150% weapon damage
        hitCount: 3,
        targetScope: "all",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Dark",
        primaryEffects: [],
        conditionalEffects: [],
        consumesForetell: true,          // Consome todas as Predições
        foretellDamageBonus: 2           // +2 de dano por Predição
    },

    "sciel-grim-harvest": {
        skillId: "sciel-grim-harvest",
        damageLevel: "medium",  // 100% weapon damage
        hitCount: 1,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Dark",
        primaryEffects: [
            {
                effectType: "Heal",
                amount: 30,  // 30% max HP base
                targetType: "all-allies"
            }
        ],
        conditionalEffects: [],
        consumesForetell: true,        // Consome todas as Predições do alvo
        foretellHealBonus: 5           // +5% de cura por Predição consumida (cura todos aliados)
    },

    "sciel-harvest": {
        skillId: "sciel-harvest",
        damageLevel: "medium",  // 100% weapon damage
        hitCount: 1,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: true,
        primaryEffects: [
            {
                effectType: "Heal",
                amount: 40,  // 40% max HP base
                targetType: "self"
            }
        ],
        conditionalEffects: [],
        consumesForetell: true,        // Consome todas as Predições do alvo
        foretellHealBonus: 5           // +5% de cura por Predição consumida
    },

    "sciel-searing-bond": {
        skillId: "sciel-searing-bond",
        damageLevel: "medium",  // 100% weapon damage
        hitCount: 1,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Dark",
        primaryEffects: [
            {
                effectType: "Foretell",
                amount: 5,  // 5 Predições no alvo principal
                remainingTurns: 0,
                targetType: "enemy"
            }
        ],
        conditionalEffects: [],
        propagatesBurnDamage: true  // ✅ Propaga 50% dano + 1 Predição para outros inimigos queimando
    },

    "sciel-phantom-blade": {
        skillId: "sciel-phantom-blade",
        damageLevel: "high",  // 150% weapon damage
        hitCount: 1,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: false,
        forcedElement: "Dark",
        canBreak: true,
        primaryEffects: [],
        conditionalEffects: [],
        consumesForetell: true,          // Consome todas as Predições
        foretellDamageBonus: 2           // +2 de dano por Predição
    },

    "sciel-spectral-sweep": {
        skillId: "sciel-spectral-sweep",
        damageLevel: "medium",  // 100% weapon damage (2-6 hits variable)
        hitCount: 4,  // Average of 2-6 hits
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: true,
        primaryEffects: [
            {
                effectType: "Foretell",
                amount: 1,  // 1 Predição base por hit
                remainingTurns: 0,
                targetType: "enemy"
            }
        ],
        conditionalEffects: [],
        appliesForetellOnCrit: 1  // ✅ +1 Predição adicional em hits críticos
    },

    "sciel-firing-shadow": {
        skillId: "sciel-firing-shadow",
        damageLevel: "low",  // 50% weapon damage (Dark element AOE, 3 hits)
        hitCount: 3,
        targetScope: "all",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Dark",
        primaryEffects: [],
        conditionalEffects: [],
        consumesForetellPerHit: true,    // ✅ Cada hit consome 1 Predição
        foretellPerHitMultiplier: 3.0    // ✅ 200% bonus = 3x dano total quando consome
    },

    "sciel-fortunes-fury": {
        skillId: "sciel-fortunes-fury",
        damageLevel: "none",  // No damage, buff only
        hitCount: 0,
        targetScope: "single",  // Single ally target
        damageType: "physical",
        usesWeaponElement: false,
        primaryEffects: [
            {
                effectType: "Empowered",  // Double damage for 1 turn
                amount: 0,
                remainingTurns: 1,
                targetType: "ally"
            }
        ],
        conditionalEffects: []
        // Grants Sun Charge via skillType: "sun"
    },

    "sciel-our-sacrifice": {
        skillId: "sciel-our-sacrifice",
        damageLevel: "extreme",  // 250% weapon damage base
        hitCount: 1,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Dark",
        primaryEffects: [],
        conditionalEffects: [],
        drainsAlliesHp: true,              // ✅ Drena HP de aliados para 1 (+1 dano por HP drenado)
        consumesAllEnemiesForetell: true   // ✅ Consome Foretell de TODOS inimigos (+1 dano por Predição)
    },

    "sciel-plentiful-harvest": {
        skillId: "sciel-plentiful-harvest",
        damageLevel: "medium",  // 100% weapon damage
        hitCount: 2,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: true,
        primaryEffects: [],
        conditionalEffects: [],
        consumesForetell: true,         // ✅ Consome todas as Predições do alvo
        grantsMpPerForetell: 1          // ✅ Concede 1 PM a aliado aleatório por Predição consumida
    },

    "sciel-rush": {
        skillId: "sciel-rush",
        damageLevel: "none",  // No damage, buff only
        hitCount: 0,
        targetScope: "self",  // Will be handled by special logic
        damageType: "physical",
        usesWeaponElement: false,
        primaryEffects: [
            {
                effectType: "Hastened",  // Increases Speed
                amount: 0,
                remainingTurns: 3,
                targetType: "ally"
            }
        ],
        conditionalEffects: [],
        randomAllyCount: { min: 1, max: 3 }  // ✅ Aplica em 1-3 aliados aleatórios
    },

    "sciel-all-set": {
        skillId: "sciel-all-set",
        damageLevel: "none",
        hitCount: 0,
        targetScope: "all",
        damageType: "physical",
        usesWeaponElement: false,
        primaryEffects: [
            {
                effectType: "Hastened",
                amount: 0,
                remainingTurns: 3,
                targetType: "all-allies"
            }
        ],
        conditionalEffects: []
        // Aplica Rapidez em 1-3 aliados aleatórios
    },

    "sciel-intervention": {
        skillId: "sciel-intervention",
        damageLevel: "none",
        hitCount: 0,
        targetScope: "self",
        damageType: "physical",
        usesWeaponElement: false,
        primaryEffects: [
            {
                effectType: "Protected",
                amount: 2,
                remainingTurns: 2,
                targetType: "self"
            }
        ],
        conditionalEffects: []
    },

    "sciel-card-weaver": {
        skillId: "sciel-card-weaver",
        damageLevel: "none",
        hitCount: 0,
        targetScope: "single",  // Alvo selecionado para redistribuir Foretell
        damageType: "physical",
        usesWeaponElement: false,
        primaryEffects: [],
        conditionalEffects: [],
        redistributesForetell: true,  // Redistribui Foretell do alvo para outros inimigos
        grantsExtraTurn: true         // Turno extra (toast only)
    },

    "sciel-final-path": {
        skillId: "sciel-final-path",
        damageLevel: "extreme",  // 250% weapon damage
        hitCount: 1,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Dark",
        primaryEffects: [
            {
                effectType: "Foretell",
                amount: 10,
                remainingTurns: 1,  // 1-hit duration
                targetType: "enemy"
            }
        ],
        conditionalEffects: [],
        canBreak: true  // ✅ Pode causar Break
        // Grants 1 Sun Charge - handled by skillType: "sun" in PlayerPage
    },

    "sciel-twilight-dance": {
        skillId: "sciel-twilight-dance",
        damageLevel: "extreme",  // 250% weapon damage (4 hits)
        hitCount: 4,
        targetScope: "single",
        damageType: "magical",
        usesWeaponElement: false,
        forcedElement: "Dark",
        primaryEffects: [],
        conditionalEffects: [],
        consumesForetell: true,          // Consome todas as Predições
        foretellDamageBonus: 2,          // +2 de dano por Predição
        extendsTwilight: true            // Estende Crepúsculo em +1 turno se ativo
    },

    "sciel-end-slice": {
        skillId: "sciel-end-slice",
        damageLevel: "extreme",  // 250% weapon damage (Gradiente)
        hitCount: 1,
        targetScope: "single",
        damageType: "physical",
        usesWeaponElement: true,
        isGradient: true,
        primaryEffects: [],
        conditionalEffects: [],
        consumesForetell: true,          // Consome todas as Predições
        foretellDamageBonus: 3           // +3 de dano por Predição (50% a mais que normal)
    }
};
