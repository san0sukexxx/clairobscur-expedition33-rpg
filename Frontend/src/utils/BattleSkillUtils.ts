import { SkillEffectsRegistry, type SkillEffect, type SkillMetadata } from "../data/SkillEffectsRegistry";
import type { BattleCharacterInfo, StatusType, Stance } from "../api/ResponseModel";
import { APIBattle, type AttackStatusEffectRequest } from "../api/APIBattle";

// ==================== INTERFACES ====================

export interface ResolvedSkill {
    skillId: string;
    hitCount: number;             // Número de rolagens necessárias
    damageLevel: "none" | "low" | "medium" | "high";  // Nível de dano (none=0%, low=50%, medium=100%, high=150%)
    damageType: "physical" | "magical" | "true";
    effects: ResolvedEffect[];
    targetIds: number[];          // BattleCharacterIDs
    metadata: SkillMetadata;      // Metadata original para referência
}

export interface ResolvedEffect {
    targetBattleId: number;
    effectType: StatusType | "Heal" | "Cleanse";  // Include special effect types
    amount: number;
    remainingTurns?: number;
}

// ==================== CONDITION EVALUATION ====================

/**
 * Avalia se uma condição é verdadeira
 */
export function evaluateCondition(
    condition: string | undefined,
    source: BattleCharacterInfo,
    target: BattleCharacterInfo,
    allCharacters: BattleCharacterInfo[]
): boolean {
    if (!condition) return true;

    switch (condition) {
        case "target-burning":
            return target.status?.some(s => s.effectName === "Burning") ?? false;

        case "target-marked":
            return target.status?.some(s => s.effectName === "Marked") ?? false;

        case "target-frozen":
            return target.status?.some(s => s.effectName === "Frozen") ?? false;

        case "target-poisoned":
            return target.status?.some(s => s.effectName === "Plagued") ?? false;

        case "self-hp-below-50":
            return source.healthPoints < (source.maxHealthPoints / 2);

        case "self-hp-below-25":
            return source.healthPoints < (source.maxHealthPoints / 4);

        case "ally-dead":
            return allCharacters.some(c =>
                !c.isEnemy && c.battleID !== source.battleID && c.healthPoints === 0
            );

        case "all-allies-alive":
            return allCharacters
                .filter(c => !c.isEnemy)
                .every(c => c.healthPoints > 0);

        default:
            console.warn(`Unknown condition: ${condition}`);
            return false;
    }
}

/**
 * Calcula quantidade de stacks de um status
 */
export function getStatusStacks(
    target: BattleCharacterInfo,
    effectName: string
): number {
    const status = target.status?.find(s => s.effectName === effectName);
    return status?.ammount ?? 0;
}

// ==================== SKILL RESOLUTION ====================

/**
 * Resolve uma skill em metadata executável (sem calcular dano - isso será feito por hit)
 */
export function resolveSkill(
    skillId: string,
    source: BattleCharacterInfo,
    primaryTarget: BattleCharacterInfo,
    allCharacters: BattleCharacterInfo[]
): ResolvedSkill {
    const metadata = SkillEffectsRegistry[skillId];
    if (!metadata) {
        throw new Error(`Skill not found in registry: ${skillId}`);
    }

    // Determinar todos os alvos baseado em targetScope
    const targetIds = resolveTargets(
        metadata.targetScope,
        primaryTarget,
        allCharacters,
        source
    );

    // Resolver efeitos primários
    const primaryEffects = resolveEffects(
        metadata.primaryEffects,
        source,
        allCharacters,
        targetIds
    );

    // Resolver efeitos condicionais
    const conditionalEffects = metadata.conditionalEffects
        .filter(effect =>
            evaluateCondition(effect.condition, source, primaryTarget, allCharacters)
        )
        .flatMap(effect =>
            resolveEffects([effect], source, allCharacters, targetIds)
        );

    return {
        skillId,
        hitCount: metadata.hitCount,
        damageLevel: metadata.damageLevel,
        damageType: metadata.damageType,
        effects: [...primaryEffects, ...conditionalEffects],
        targetIds,
        metadata
    };
}

function resolveTargets(
    scope: string,
    primaryTarget: BattleCharacterInfo,
    allCharacters: BattleCharacterInfo[],
    source: BattleCharacterInfo
): number[] {
    switch (scope) {
        case "single":
            // Alvo único selecionado
            return [primaryTarget.battleID];

        case "all":
            // Todos do mesmo tipo do alvo selecionado (se selecionou inimigo, todos inimigos)
            return allCharacters
                .filter(c => c.isEnemy === primaryTarget.isEnemy)
                .map(c => c.battleID);

        case "self":
            // O próprio personagem
            return [source.battleID];

        default:
            return [primaryTarget.battleID];
    }
}

/**
 * Calcula o dano de um hit individual da skill baseado na rolagem
 * weaponPower já vem calculado do ataque básico com críticos e modificadores
 */
export function calculateSkillHitDamage(
    resolved: ResolvedSkill,
    weaponPower: number,
    _diceResult: any
): number {
    // Determinar multiplicador baseado no nível de dano
    let multiplier: number;
    switch (resolved.damageLevel) {
        case "none":
            return 0;  // Sem dano
        case "low":
            multiplier = 0.5;  // 50% do dano base
            break;
        case "medium":
            multiplier = 1.0;  // 100% do dano base
            break;
        case "high":
            multiplier = 1.5;  // 150% do dano base
            break;
        case "very-high":
            multiplier = 2.0;  // 200% do dano base
            break;
        case "extreme":
            multiplier = 2.5;  // 250% do dano base
            break;
        default:
            multiplier = 1.0;
    }

    let damage = Math.floor(weaponPower * multiplier);

    return damage;
}

function resolveEffects(
    effects: SkillEffect[],
    source: BattleCharacterInfo,
    allCharacters: BattleCharacterInfo[],
    targetIds: number[]
): ResolvedEffect[] {
    return effects.flatMap(effect => {
        const targets = getEffectTargets(
            effect.targetType,
            source,
            allCharacters,
            targetIds
        );

        return targets.map(targetId => ({
            targetBattleId: targetId,
            effectType: effect.effectType,
            amount: effect.amount,
            remainingTurns: effect.remainingTurns
        }));
    });
}

function getEffectTargets(
    targetType: string,
    source: BattleCharacterInfo,
    allCharacters: BattleCharacterInfo[],
    primaryTargetIds: number[]
): number[] {
    switch (targetType) {
        case "enemy":
            return primaryTargetIds;

        case "self":
            return [source.battleID];

        case "ally":
            // Returns the random allies selected by targetScope
            return primaryTargetIds;

        case "all-enemies":
            return allCharacters
                .filter(c => c.isEnemy !== source.isEnemy)
                .map(c => c.battleID);

        case "all-allies":
            return allCharacters
                .filter(c => c.isEnemy === source.isEnemy)
                .map(c => c.battleID);

        default:
            return primaryTargetIds;
    }
}

// ==================== EFFECT APPLICATION ====================

/**
 * Aplica efeitos especiais que não são status de combate normais
 */
export async function applySpecialEffects(
    effects: ResolvedEffect[],
    allCharacters: BattleCharacterInfo[],
    foretellHealBonus: number = 0  // Bonus de cura por Predição consumida (%)
): Promise<void> {
    const specialEffects = effects.filter(
        e => e.effectType === "Heal" || e.effectType === "Cleanse"
    );

    for (const effect of specialEffects) {
        if (effect.effectType === "Heal") {
            const target = allCharacters.find(c => c.battleID === effect.targetBattleId);
            if (target) {
                const maxHp = target.maxHealthPoints;
                // Apply base heal % + foretell bonus %
                const totalHealPercent = effect.amount + foretellHealBonus;
                const healAmount = Math.floor(maxHp * (totalHealPercent / 100));
                await APIBattle.heal(effect.targetBattleId, healAmount);
            }
        } else if (effect.effectType === "Cleanse") {
            await APIBattle.cleanse(effect.targetBattleId);
        }
    }
}

/**
 * Converte efeitos resolvidos para formato de API, filtrando efeitos especiais
 */
export function getStatusEffectsForTarget(
    effects: ResolvedEffect[],
    targetId: number
): AttackStatusEffectRequest[] {
    return effects
        .filter(e => e.targetBattleId === targetId)
        .filter(e => e.effectType !== "Heal" && e.effectType !== "Cleanse")
        .map(e => ({
            effectType: e.effectType as StatusType,
            ammount: e.amount,
            remainingTurns: e.remainingTurns
        }));
}
