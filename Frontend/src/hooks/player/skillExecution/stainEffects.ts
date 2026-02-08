import type { BattleCharacterInfo, StainType, Element } from "../../../api/ResponseModel";
import type { SkillMetadata } from "../../../data/SkillEffectsRegistry";
import { APIBattle } from "../../../api/APIBattle";
import { t } from "../../../i18n";

export type StainSlots = {
  stainSlot1: StainType | null;
  stainSlot2: StainType | null;
  stainSlot3: StainType | null;
  stainSlot4: StainType | null;
};

/**
 * Gets all current stains from a character
 */
export function getCharacterStains(source: BattleCharacterInfo): StainType[] {
  const stains: StainType[] = [];
  if (source.stainSlot1) stains.push(source.stainSlot1);
  if (source.stainSlot2) stains.push(source.stainSlot2);
  if (source.stainSlot3) stains.push(source.stainSlot3);
  if (source.stainSlot4) stains.push(source.stainSlot4);
  return stains;
}

/**
 * Counts stains of a specific type
 */
export function countStainType(source: BattleCharacterInfo, stainType: StainType): number {
  let count = 0;
  if (source.stainSlot1 === stainType) count++;
  if (source.stainSlot2 === stainType) count++;
  if (source.stainSlot3 === stainType) count++;
  if (source.stainSlot4 === stainType) count++;
  return count;
}

/**
 * Gets the total number of stains
 */
export function getTotalStainCount(source: BattleCharacterInfo): number {
  let count = 0;
  if (source.stainSlot1) count++;
  if (source.stainSlot2) count++;
  if (source.stainSlot3) count++;
  if (source.stainSlot4) count++;
  return count;
}

/**
 * Checks if character has the required stains for a skill
 */
export function hasRequiredStains(
  source: BattleCharacterInfo,
  requirements: Array<{ stain: "Lightning" | "Earth" | "Fire" | "Ice"; count: number }> | undefined
): boolean {
  if (!requirements || requirements.length === 0) return true;

  for (const req of requirements) {
    const available = countStainType(source, req.stain as StainType);
    if (available < req.count) {
      return false;
    }
  }
  return true;
}

/**
 * Checks if character has all 4 stain types (for Elemental Genesis)
 */
export function hasAllStainTypes(source: BattleCharacterInfo): boolean {
  const stains = getCharacterStains(source);
  const hasLightning = stains.includes("Lightning");
  const hasEarth = stains.includes("Earth");
  const hasFire = stains.includes("Fire");
  const hasIce = stains.includes("Ice");
  return hasLightning && hasEarth && hasFire && hasIce;
}

/**
 * Consumes stains from character and returns consumed count for damage bonus calculation
 * Returns the total number of stains consumed (each stain = +25% damage bonus)
 */
export async function consumeStains(
  source: BattleCharacterInfo,
  requirements: Array<{ stain: "Lightning" | "Earth" | "Fire" | "Ice"; count: number }> | undefined,
  showToast: (message: string) => void
): Promise<{ consumed: number; slots: StainSlots }> {
  if (!requirements || requirements.length === 0) {
    return {
      consumed: 0,
      slots: {
        stainSlot1: source.stainSlot1 ?? null,
        stainSlot2: source.stainSlot2 ?? null,
        stainSlot3: source.stainSlot3 ?? null,
        stainSlot4: source.stainSlot4 ?? null,
      }
    };
  }

  // Create working copy of stains
  const slots: (StainType | null)[] = [
    source.stainSlot1 ?? null,
    source.stainSlot2 ?? null,
    source.stainSlot3 ?? null,
    source.stainSlot4 ?? null,
  ];

  let totalConsumed = 0;

  // Consume required stains
  for (const req of requirements) {
    let toConsume = req.count;
    for (let i = 0; i < 4 && toConsume > 0; i++) {
      if (slots[i] === req.stain) {
        slots[i] = null;
        toConsume--;
        totalConsumed++;
      }
    }
  }

  const newSlots: StainSlots = {
    stainSlot1: slots[0],
    stainSlot2: slots[1],
    stainSlot3: slots[2],
    stainSlot4: slots[3],
  };

  // Update stains in backend
  await APIBattle.updateStains(source.battleID, newSlots);

  if (totalConsumed > 0) {
    showToast(t("playerPage.skills.stainsConsumed", { count: totalConsumed }));
  }

  return { consumed: totalConsumed, slots: newSlots };
}

/**
 * Consumes ALL stains from character (for skills like Elemental Genesis)
 */
export async function consumeAllStains(
  source: BattleCharacterInfo,
  showToast: (message: string) => void
): Promise<{ consumed: number; slots: StainSlots }> {
  const consumed = getTotalStainCount(source);

  const emptySlots: StainSlots = {
    stainSlot1: null,
    stainSlot2: null,
    stainSlot3: null,
    stainSlot4: null,
  };

  await APIBattle.updateStains(source.battleID, emptySlots);

  if (consumed > 0) {
    showToast(t("playerPage.skills.stainsConsumed", { count: consumed }));
  }

  return { consumed, slots: emptySlots };
}

/**
 * Gains stains after skill use
 */
export async function gainStains(
  source: BattleCharacterInfo,
  stainsToGain: Array<"Lightning" | "Earth" | "Fire" | "Ice" | "Light"> | undefined,
  showToast: (message: string) => void
): Promise<StainSlots> {
  if (!stainsToGain || stainsToGain.length === 0) {
    return {
      stainSlot1: source.stainSlot1 ?? null,
      stainSlot2: source.stainSlot2 ?? null,
      stainSlot3: source.stainSlot3 ?? null,
      stainSlot4: source.stainSlot4 ?? null,
    };
  }

  // Create working copy of stains
  const slots: (StainType | null)[] = [
    source.stainSlot1 ?? null,
    source.stainSlot2 ?? null,
    source.stainSlot3 ?? null,
    source.stainSlot4 ?? null,
  ];

  let gained = 0;

  // Fill empty slots with new stains
  for (const stain of stainsToGain) {
    const emptyIndex = slots.findIndex(s => s === null);
    if (emptyIndex !== -1) {
      slots[emptyIndex] = stain as StainType;
      gained++;
    }
  }

  const newSlots: StainSlots = {
    stainSlot1: slots[0],
    stainSlot2: slots[1],
    stainSlot3: slots[2],
    stainSlot4: slots[3],
  };

  await APIBattle.updateStains(source.battleID, newSlots);

  if (gained > 0) {
    showToast(t("playerPage.skills.stainsGained", { stains: stainsToGain.join(", ") }));
  }

  return newSlots;
}

/**
 * Calculates damage bonus from consumed stains (25% per stain)
 */
export function calculateStainDamageBonus(consumedStains: number, noStainDamageBonus?: boolean): number {
  if (noStainDamageBonus) return 0;
  return consumedStains * 0.25; // 25% per stain
}

/**
 * Gets the dominant stain type for stainDeterminedElement
 * If tie, returns the first one found (Lightning > Earth > Fire > Ice)
 */
export function getDominantStain(source: BattleCharacterInfo): Element | null {
  const stains = getCharacterStains(source);
  if (stains.length === 0) return null;

  const counts: Record<string, number> = {};
  for (const stain of stains) {
    counts[stain] = (counts[stain] || 0) + 1;
  }

  let maxCount = 0;
  let dominant: StainType | null = null;

  // Priority order: Lightning, Earth, Fire, Ice
  const priority: StainType[] = ["Lightning", "Earth", "Fire", "Ice"];

  for (const stain of priority) {
    if (counts[stain] && counts[stain] > maxCount) {
      maxCount = counts[stain];
      dominant = stain;
    }
  }

  return dominant as Element | null;
}

/**
 * Gets a random element from the available elements
 */
export function getRandomElement(elements: Element[] | undefined): Element {
  if (!elements || elements.length === 0) {
    return "Physical";
  }
  const index = Math.floor(Math.random() * elements.length);
  return elements[index];
}

/**
 * Checks if skill should have free cast (0 MP cost) due to stains
 */
export function shouldHaveFreeCast(
  source: BattleCharacterInfo,
  metadata: SkillMetadata
): boolean {
  if (!metadata.consumeStainsForFreeCast || !metadata.consumesStains) {
    return false;
  }
  return hasRequiredStains(source, metadata.consumesStains);
}

/**
 * Transforms a Fire stain to Light stain (for Electrify skill)
 */
export async function transformFireToLight(
  source: BattleCharacterInfo,
  showToast: (message: string) => void
): Promise<StainSlots> {
  const slots: (StainType | null)[] = [
    source.stainSlot1 ?? null,
    source.stainSlot2 ?? null,
    source.stainSlot3 ?? null,
    source.stainSlot4 ?? null,
  ];

  let transformed = false;
  for (let i = 0; i < 4; i++) {
    if (slots[i] === "Fire") {
      slots[i] = "Light";
      transformed = true;
      break; // Only transform one
    }
  }

  const newSlots: StainSlots = {
    stainSlot1: slots[0],
    stainSlot2: slots[1],
    stainSlot3: slots[2],
    stainSlot4: slots[3],
  };

  if (transformed) {
    await APIBattle.updateStains(source.battleID, newSlots);
    showToast(t("playerPage.skills.stainTransformed", { from: "Fire", to: "Light" }));
  }

  return newSlots;
}

export interface StainEffectResults {
  damageMultiplier: number;
  shouldGrantSecondTurn: boolean;
  shouldDoublesDamage: boolean;
  shouldGrantRegeneration: boolean;
  dotDuration: number | null;
  determinedElement: Element | null;
  canBreak: boolean;
}

/**
 * Processes all stain-related effects for a skill
 */
export function processStainEffects(
  source: BattleCharacterInfo,
  metadata: SkillMetadata,
  consumedStains: number
): StainEffectResults {
  const results: StainEffectResults = {
    damageMultiplier: 1 + calculateStainDamageBonus(consumedStains, metadata.noStainDamageBonus),
    shouldGrantSecondTurn: false,
    shouldDoublesDamage: false,
    shouldGrantRegeneration: false,
    dotDuration: null,
    determinedElement: null,
    canBreak: false,
  };

  // stainGrantsSecondTurn - grants second turn when stains consumed
  if (metadata.stainGrantsSecondTurn && consumedStains > 0) {
    results.shouldGrantSecondTurn = true;
  }

  // stainDoublesDamage - doubles damage when stains consumed
  if (metadata.stainDoublesDamage && consumedStains > 0) {
    results.shouldDoublesDamage = true;
    results.damageMultiplier *= 2;
  }

  // stainGrantsRegeneration - applies Regeneration when stains consumed
  if (metadata.stainGrantsRegeneration && consumedStains > 0) {
    results.shouldGrantRegeneration = true;
  }

  // stainExtendsDoT - extends DoT duration when stains consumed
  if (metadata.stainExtendsDoT) {
    if (consumedStains >= (metadata.consumesStains?.reduce((sum, s) => sum + s.count, 0) ?? 0)) {
      results.dotDuration = metadata.stainExtendsDoT.extendedDuration;
    } else {
      results.dotDuration = metadata.stainExtendsDoT.baseDuration;
    }
  }

  // stainDeterminedElement - element determined by dominant stain
  if (metadata.stainDeterminedElement) {
    results.determinedElement = getDominantStain(source);
  }

  // canBreakWithStains - can Break if 4+ stains consumed
  if (metadata.canBreakWithStains && consumedStains >= 4) {
    results.canBreak = true;
  }

  return results;
}

/**
 * Gains a stain matching the current weapon/skill element on critical hit
 */
export async function gainStainOnCrit(
  source: BattleCharacterInfo,
  element: Element,
  showToast: (message: string) => void
): Promise<void> {
  // Only gain stain if element matches one of the stain types
  const stainElements: StainType[] = ["Lightning", "Earth", "Fire", "Ice"];
  if (!stainElements.includes(element as StainType)) {
    return;
  }

  await gainStains(source, [element as "Lightning" | "Earth" | "Fire" | "Ice"], showToast);
}
