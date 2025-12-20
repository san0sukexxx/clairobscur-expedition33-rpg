import type { StatusType } from "../api/ResponseModel";

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
    damageLevel: "none" | "low" | "medium" | "high" | "very-high";  // none=0%, low=50%, medium=100%, high=150%, very-high=200%
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
    }
};
