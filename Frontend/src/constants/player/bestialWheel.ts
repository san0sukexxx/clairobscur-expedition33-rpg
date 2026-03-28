/**
 * Monoco's Bestial Wheel pattern and utilities
 */

export type MaskColor = "gold" | "blue" | "purple" | "red" | "green";

/**
 * The pattern of masks on Monoco's Bestial Wheel
 * Position 0: Máscara Onipotente (gold) - wildcard
 * Position 1-2: Máscara Conjuradora (blue) - caster
 * Position 3-4: Máscara Ágil (purple) - agile
 * Position 5-6: Máscara Feroz (red) - fierce
 * Position 7-8: Máscara Protetora (green) - protector
 */
export const BESTIAL_WHEEL_PATTERN: MaskColor[] = [
  "gold",   // 0 - Onipotente (Almighty)
  "blue",   // 1 - Conjuradora (Caster)
  "blue",   // 2 - Conjuradora (Caster)
  "purple", // 3 - Ágil (Agile)
  "purple", // 4 - Ágil (Agile)
  "red",    // 5 - Feroz (Fierce)
  "red",    // 6 - Feroz (Fierce)
  "green",  // 7 - Protetora (Protector)
  "green"   // 8 - Protetora (Protector)
];

export const WHEEL_SIZE = BESTIAL_WHEEL_PATTERN.length;

/**
 * Get the mask at a specific wheel position
 */
export function getMaskAtPosition(position: number): MaskColor | "" {
  if (position < 0 || position >= WHEEL_SIZE) return "";
  return BESTIAL_WHEEL_PATTERN[position];
}

/**
 * Check if mask is Caster or Almighty (gold or blue)
 */
export function isCasterOrAlmighty(mask: MaskColor | ""): boolean {
  return mask === "blue" || mask === "gold";
}

/**
 * Check if mask is Almighty (gold)
 */
export function isAlmightyMask(mask: MaskColor | ""): boolean {
  return mask === "gold";
}

/**
 * Calculate positions needed to reach Almighty Mask (position 0)
 */
export function positionsToAlmighty(currentPosition: number): number {
  return (WHEEL_SIZE - currentPosition) % WHEEL_SIZE;
}

/**
 * Get mask name in Portuguese
 */
export function getMaskNamePt(mask: MaskColor | ""): string {
  switch (mask) {
    case "gold": return "Onipotente";
    case "blue": return "Conjuradora";
    case "purple": return "Ágil";
    case "red": return "Feroz";
    case "green": return "Protetora";
    default: return "";
  }
}
