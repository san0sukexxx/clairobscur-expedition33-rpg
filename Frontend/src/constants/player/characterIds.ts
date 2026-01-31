/**
 * Character ID constants and helper functions
 */

export const CHARACTER_IDS = {
  MONOCO: "monoco",
  VERSO: "verso",
  SCIEL: "sciel",
  LUNE: "lune",
  MAELLE: "maelle",
  GUSTAVE: "gustave",
} as const;

export type CharacterIdKey = keyof typeof CHARACTER_IDS;

/**
 * Check if a character ID matches a specific character
 */
export function isCharacter(id: string | undefined, character: CharacterIdKey): boolean {
  if (!id) return false;
  return id.toLowerCase().includes(CHARACTER_IDS[character]);
}

/**
 * Check if character is Monoco
 */
export function isMonoco(id: string | undefined): boolean {
  return isCharacter(id, "MONOCO");
}

/**
 * Check if character is Verso
 */
export function isVerso(id: string | undefined): boolean {
  return isCharacter(id, "VERSO");
}

/**
 * Check if character is Sciel
 */
export function isSciel(id: string | undefined): boolean {
  return isCharacter(id, "SCIEL");
}

/**
 * Check if character is Lune
 */
export function isLune(id: string | undefined): boolean {
  return isCharacter(id, "LUNE");
}

/**
 * Check if character is Maelle
 */
export function isMaelle(id: string | undefined): boolean {
  return isCharacter(id, "MAELLE");
}

/**
 * Check if character is Gustave
 */
export function isGustave(id: string | undefined): boolean {
  return isCharacter(id, "GUSTAVE");
}
