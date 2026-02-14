import type { CreateAttackRequest } from "../../../api/APIBattle";
import type { BattleCharacterInfo } from "../../../api/ResponseModel";
import { checkForFragile } from "../../../utils/NpcCalculator";
import { getStatusEffectsForTarget, type ResolvedSkill } from "../../../utils/BattleSkillUtils";

export interface AttackRequestParams {
  source: BattleCharacterInfo;
  targetId: number;
  targetChar: BattleCharacterInfo | undefined;
  resolved: ResolvedSkill;
  hitDamage: number;
  finalDamage: number;
  skillCost: number;
  isGradientSkill: boolean;
  hitIndex: number;
  totalHits: number;
  chargeIncrease?: number;
  consumesCharge?: boolean;
  consumesBurn?: number;  // Number of Burn stacks to consume from target
  targetIndex?: number;   // Index of target in targetIds array (for applying effects only once)
  skillType?: string;     // "sun" or "moon" for Sciel's charge system
  bestialWheelAdvance?: number;  // Monoco's Bestial Wheel advancement
  ignoresShields?: boolean;      // Damage bypasses shields (Chevaliere Piercing)
}

/**
 * Builds an attack request for NPC targets
 */
export function buildNpcAttackRequest(params: AttackRequestParams): CreateAttackRequest {
  const {
    source, targetId, targetChar, resolved, hitDamage, finalDamage,
    skillCost, isGradientSkill, hitIndex, totalHits, chargeIncrease, consumesCharge, consumesBurn, targetIndex, skillType,
    bestialWheelAdvance, ignoresShields
  } = params;

  // For random targetScope, effects are resolved against the placeholder target,
  // so we need to get effects for any enemy target (the first resolved targetId)
  const effectLookupId = resolved.metadata.targetScope === "random"
    ? resolved.targetIds[0]
    : targetId;
  const effects = [...getStatusEffectsForTarget(resolved.effects, effectLookupId)];

  // Check if attack will cause Fragile
  if (targetChar) {
    const willGetFragile = checkForFragile(targetChar, hitDamage);
    if (willGetFragile) {
      effects.push({
        effectType: "Fragile",
        ammount: 1,
        remainingTurns: 2
      });
    }
  }

  // Only apply once-per-skill effects on first hit AND first target
  const isFirstHitFirstTarget = hitIndex === 0 && (targetIndex === 0 || targetIndex === undefined);

  return {
    sourceBattleId: source.battleID,
    targetBattleId: targetId,
    totalDamage: finalDamage,
    attackType: "skill",
    effects: effects,
    skillCost: isFirstHitFirstTarget ? skillCost : 0,  // Only charge MP once
    isGradient: isFirstHitFirstTarget && isGradientSkill,
    isLastHit: hitIndex === totalHits - 1,
    chargeIncrease: chargeIncrease,
    consumesCharge: isFirstHitFirstTarget ? consumesCharge : undefined,
    consumesBurn: consumesBurn,
    executionThreshold: resolved.metadata.executionThreshold,
    shouldRemoveMarked: resolved.metadata.dontRemoveMark ? false : undefined,
    grantsGradientPoints: isFirstHitFirstTarget ? resolved.metadata.grantsGradientPoints : undefined,
    // skillType NOT sent here - Sun/Moon charges are incremented explicitly via incrementSunMoonCharge
    bestialWheelAdvance: isFirstHitFirstTarget ? bestialWheelAdvance : undefined,
    ignoresShields: ignoresShields || undefined
  };
}

/**
 * Builds an attack request for player targets
 */
export function buildPlayerAttackRequest(params: AttackRequestParams): CreateAttackRequest {
  const {
    source, targetId, resolved, hitDamage,
    skillCost, isGradientSkill, hitIndex, totalHits, chargeIncrease, consumesCharge, consumesBurn, targetIndex, skillType,
    bestialWheelAdvance, ignoresShields
  } = params;

  // For random targetScope, effects are resolved against the placeholder target
  const effectLookupId = resolved.metadata.targetScope === "random"
    ? resolved.targetIds[0]
    : targetId;
  const effects = [...getStatusEffectsForTarget(resolved.effects, effectLookupId)];

  // Only apply once-per-skill effects on first hit AND first target
  const isFirstHitFirstTarget = hitIndex === 0 && (targetIndex === 0 || targetIndex === undefined);

  return {
    sourceBattleId: source.battleID,
    targetBattleId: targetId,
    totalPower: hitDamage,
    attackType: "skill",
    effects: effects,
    skillCost: isFirstHitFirstTarget ? skillCost : 0,  // Only charge MP once
    isGradient: isFirstHitFirstTarget && isGradientSkill,
    isLastHit: hitIndex === totalHits - 1,
    chargeIncrease: chargeIncrease,
    consumesCharge: isFirstHitFirstTarget ? consumesCharge : undefined,
    consumesBurn: consumesBurn,
    executionThreshold: resolved.metadata.executionThreshold,
    shouldRemoveMarked: resolved.metadata.dontRemoveMark ? false : undefined,
    grantsGradientPoints: isFirstHitFirstTarget ? resolved.metadata.grantsGradientPoints : undefined,
    // skillType NOT sent here - Sun/Moon charges are incremented explicitly via incrementSunMoonCharge
    bestialWheelAdvance: isFirstHitFirstTarget ? bestialWheelAdvance : undefined,
    ignoresShields: ignoresShields || undefined
  };
}
