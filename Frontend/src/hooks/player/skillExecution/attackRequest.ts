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
}

/**
 * Builds an attack request for NPC targets
 */
export function buildNpcAttackRequest(params: AttackRequestParams): CreateAttackRequest {
  const {
    source, targetId, targetChar, resolved, hitDamage, finalDamage,
    skillCost, isGradientSkill, hitIndex, totalHits, chargeIncrease
  } = params;

  const effects = [...getStatusEffectsForTarget(resolved.effects, targetId)];

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

  return {
    sourceBattleId: source.battleID,
    targetBattleId: targetId,
    totalDamage: finalDamage,
    attackType: "skill",
    effects: effects,
    skillCost: hitIndex === 0 ? skillCost : 0,
    isGradient: hitIndex === 0 && isGradientSkill,
    isLastHit: hitIndex === totalHits - 1,
    chargeIncrease: chargeIncrease
  };
}

/**
 * Builds an attack request for player targets
 */
export function buildPlayerAttackRequest(params: AttackRequestParams): CreateAttackRequest {
  const {
    source, targetId, resolved, hitDamage,
    skillCost, isGradientSkill, hitIndex, totalHits, chargeIncrease
  } = params;

  const effects = [...getStatusEffectsForTarget(resolved.effects, targetId)];

  return {
    sourceBattleId: source.battleID,
    targetBattleId: targetId,
    totalPower: hitDamage,
    attackType: "skill",
    effects: effects,
    skillCost: hitIndex === 0 ? skillCost : 0,
    isGradient: hitIndex === 0 && isGradientSkill,
    isLastHit: hitIndex === totalHits - 1,
    chargeIncrease: chargeIncrease
  };
}
