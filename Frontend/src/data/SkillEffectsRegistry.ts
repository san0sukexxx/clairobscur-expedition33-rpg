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
    }
};
