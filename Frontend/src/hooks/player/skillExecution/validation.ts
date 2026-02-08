import type { BattleCharacterInfo } from "../../../api/ResponseModel";
import type { GetPlayerResponse } from "../../../api/APIPlayer";
import { SkillEffectsRegistry, type SkillMetadata } from "../../../data/SkillEffectsRegistry";
import { getEnrichedCharacterSkills } from "../../../utils/SkillUtils";
import { hasRequiredStains, hasAllStainTypes, shouldHaveFreeCast } from "./stainEffects";
import { calculateHpCost } from "./perfectionEffects";

export interface ValidationResult {
  valid: boolean;
  error?: string;
  source?: BattleCharacterInfo;
  skillMetadata?: SkillMetadata;
  skillCost?: number;
  isGradientSkill?: boolean;
}

export function validateSkillExecution(
  player: GetPlayerResponse | null | undefined,
  skillId: string
): ValidationResult {
  if (!player?.fightInfo) {
    return { valid: false, error: "playerPage.errors.errorCharacterNotFoundInBattle" };
  }

  const source = player.fightInfo?.characters?.find(
    c => c.battleID === player.fightInfo?.playerBattleID
  );

  if (!source) {
    return { valid: false, error: "playerPage.errors.errorCharacterNotFoundInBattle" };
  }

  const skillMetadata = SkillEffectsRegistry[skillId];
  if (!skillMetadata) {
    return { valid: false, error: "playerPage.errors.errorSkillNotFound" };
  }

  const enrichedSkills = getEnrichedCharacterSkills(player);
  const fullSkill = enrichedSkills.find(s => s.id === skillId);
  let skillCost = fullSkill?.cost ?? 0;
  const isGradientSkill = fullSkill?.isGradient ?? false;

  // Check for stance-based cost reduction
  if (skillMetadata.costReductionFromStance) {
    const { stance, reducedCost } = skillMetadata.costReductionFromStance;
    if (source.stance === stance) {
      skillCost = reducedCost;
    }
  }

  // Check for parry-based cost reduction (Payback)
  if (skillMetadata.costReductionPerParry) {
    const parriesCount = source.parriesThisTurn ?? 0;
    const reduction = parriesCount * skillMetadata.costReductionPerParry;
    skillCost = Math.max(0, skillCost - reduction);
  }

  // Lune: Check for stain-based free cast
  if (shouldHaveFreeCast(source, skillMetadata)) {
    skillCost = 0;
  }

  // Lune: Validate required stains
  if (skillMetadata.consumesStains && !hasRequiredStains(source, skillMetadata.consumesStains)) {
    return {
      valid: false,
      error: "playerPage.skills.insufficientStains",
      skillCost,
      source
    };
  }

  // Lune: Validate all stain types required (Elemental Genesis)
  if (skillMetadata.requiresAllStains && !hasAllStainTypes(source)) {
    return {
      valid: false,
      error: "playerPage.skills.requiresAllStains",
      skillCost,
      source
    };
  }

  // Verso: Validate HP cost skills
  if (skillMetadata.costsHpPercent) {
    const hpCost = calculateHpCost(source, skillMetadata.costsHpPercent);
    // Must have more HP than cost (can't kill self)
    if (source.healthPoints <= hpCost) {
      return {
        valid: false,
        error: "playerPage.skills.insufficientHP",
        skillCost,
        source
      };
    }
  }

  // Validate MP for non-gradient skills
  if (!isGradientSkill) {
    const currentMp = source.magicPoints ?? 0;
    if (currentMp < skillCost) {
      return {
        valid: false,
        error: "playerPage.skills.insufficientMP",
        skillCost,
        source
      };
    }
  }

  return {
    valid: true,
    source,
    skillMetadata,
    skillCost,
    isGradientSkill
  };
}
