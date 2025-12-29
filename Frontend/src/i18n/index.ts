/**
 * i18n Translation System for Pictos and Weapons
 *
 * This module provides helper functions to get picto and weapon names, descriptions,
 * and passive effects in different languages using kebab-case IDs.
 *
 * Usage:
 * ```typescript
 * // Pictos
 * const name = getPictoName("energy-master", "pt-BR")  // "Mestre de Energia"
 * const desc = getPictoDescription("energy-master", "en")  // "Every AP gain is increased by 1."
 *
 * // Weapons
 * const weaponName = getWeaponName("abysseram", "pt-BR")  // "Abysseram"
 * const passive = getWeaponPassive("abysseram", 4, "pt-BR")  // "50% de dano aumentado no Rank D..."
 * ```
 */

import enTranslations from "./locales/en.json";
import ptBRTranslations from "./locales/pt-BR.json";

export type Locale = "en" | "pt-BR";

interface PictoTranslation {
  name: string;
  description: string;
}

interface WeaponTranslation {
  name: string;
  passives: Record<string, string>;  // level -> effect description
}

interface Translations {
  pictos: Record<string, PictoTranslation>;
  weapons: Record<string, WeaponTranslation>;
}

const translations: Record<Locale, Translations> = {
  en: enTranslations as Translations,
  "pt-BR": ptBRTranslations as Translations,
};

// Default locale (can be changed based on user preference)
let currentLocale: Locale = "pt-BR";

/**
 * Set the current locale for translations
 * @param locale The locale to use ("en" or "pt-BR")
 */
export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

/**
 * Get the current locale
 * @returns The current locale
 */
export function getLocale(): Locale {
  return currentLocale;
}

/**
 * Get a picto's translated name by its kebab-case ID
 * @param pictoId The kebab-case ID (e.g., "energy-master")
 * @param locale The locale to use (defaults to current locale)
 * @returns The translated picto name
 */
export function getPictoName(pictoId: string, locale?: Locale): string {
  const targetLocale = locale || currentLocale;
  const picto = translations[targetLocale]?.pictos[pictoId];

  if (!picto) {
    console.warn(`Translation not found for picto: ${pictoId} in locale: ${targetLocale}`);
    return pictoId; // Fallback to ID
  }

  return picto.name;
}

/**
 * Get a picto's translated description by its kebab-case ID
 * @param pictoId The kebab-case ID (e.g., "energy-master")
 * @param locale The locale to use (defaults to current locale)
 * @returns The translated picto description
 */
export function getPictoDescription(pictoId: string, locale?: Locale): string {
  const targetLocale = locale || currentLocale;
  const picto = translations[targetLocale]?.pictos[pictoId];

  if (!picto) {
    console.warn(`Translation not found for picto: ${pictoId} in locale: ${targetLocale}`);
    return "";
  }

  return picto.description;
}

/**
 * Get a picto's full translation (name and description)
 * @param pictoId The kebab-case ID (e.g., "energy-master")
 * @param locale The locale to use (defaults to current locale)
 * @returns The picto translation object with name and description
 */
export function getPicto(pictoId: string, locale?: Locale): PictoTranslation | null {
  const targetLocale = locale || currentLocale;
  const picto = translations[targetLocale]?.pictos[pictoId];

  if (!picto) {
    console.warn(`Translation not found for picto: ${pictoId} in locale: ${targetLocale}`);
    return null;
  }

  return picto;
}

/**
 * Check if a picto ID exists in the translation system
 * @param pictoId The kebab-case ID to check
 * @returns True if the picto exists in translations
 */
export function hasPicto(pictoId: string): boolean {
  return !!translations[currentLocale]?.pictos[pictoId];
}

/**
 * Get all available picto IDs
 * @returns Array of all picto kebab-case IDs
 */
export function getAllPictoIds(): string[] {
  return Object.keys(translations.en.pictos);
}

/**
 * Convert a display name to kebab-case ID
 * @param displayName The display name (e.g., "Energy Master")
 * @returns The kebab-case ID (e.g., "energy-master")
 */
export function toKebabCase(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Find a picto ID by its English name (useful for migration)
 * @param englishName The English display name
 * @returns The kebab-case ID or null if not found
 */
export function findPictoIdByName(englishName: string): string | null {
  const kebabId = toKebabCase(englishName);
  return hasPicto(kebabId) ? kebabId : null;
}

/**
 * Get the English name for a picto (used for image filenames)
 * @param pictoId The kebab-case ID
 * @returns The English name for the picto
 */
export function getPictoEnglishName(pictoId: string): string {
  const picto = translations.en?.pictos[pictoId];

  if (!picto) {
    console.warn(`English name not found for picto: ${pictoId}`);
    return pictoId;
  }

  return picto.name;
}

// ==================== WEAPON TRANSLATIONS ====================

/**
 * Get a weapon's translated name by its kebab-case ID
 * @param weaponId The kebab-case ID (e.g., "abysseram")
 * @param locale The locale to use (defaults to current locale)
 * @returns The translated weapon name
 */
export function getWeaponName(weaponId: string, locale?: Locale): string {
  const targetLocale = locale || currentLocale;
  const weapon = translations[targetLocale]?.weapons[weaponId];

  if (!weapon) {
    console.warn(`Translation not found for weapon: ${weaponId} in locale: ${targetLocale}`);
    return weaponId; // Fallback to ID
  }

  return weapon.name;
}

/**
 * Get the English name for a weapon (used for image filenames and backend)
 * @param weaponId The kebab-case ID
 * @returns The English name for the weapon
 */
export function getWeaponEnglishName(weaponId: string): string {
  const weapon = translations.en?.weapons[weaponId];

  if (!weapon) {
    console.warn(`English name not found for weapon: ${weaponId}`);
    return weaponId;
  }

  return weapon.name;
}

/**
 * Get a weapon's passive effect description by weapon ID and level
 * @param weaponId The kebab-case ID (e.g., "abysseram")
 * @param level The passive level (4, 10, or 20)
 * @param locale The locale to use (defaults to current locale)
 * @returns The translated passive effect description
 */
export function getWeaponPassive(weaponId: string, level: number, locale?: Locale): string {
  const targetLocale = locale || currentLocale;
  const weapon = translations[targetLocale]?.weapons[weaponId];

  if (!weapon) {
    console.warn(`Translation not found for weapon: ${weaponId} in locale: ${targetLocale}`);
    return "";
  }

  const passive = weapon.passives[level.toString()];
  if (!passive) {
    console.warn(`Passive not found for weapon ${weaponId} at level ${level}`);
    return "";
  }

  return passive;
}

/**
 * Get all passive effects for a weapon
 * @param weaponId The kebab-case ID
 * @param locale The locale to use (defaults to current locale)
 * @returns Record of level -> effect description
 */
export function getWeaponPassives(weaponId: string, locale?: Locale): Record<string, string> {
  const targetLocale = locale || currentLocale;
  const weapon = translations[targetLocale]?.weapons[weaponId];

  if (!weapon) {
    console.warn(`Translation not found for weapon: ${weaponId} in locale: ${targetLocale}`);
    return {};
  }

  return weapon.passives;
}

/**
 * Get a weapon's full translation (name and all passives)
 * @param weaponId The kebab-case ID
 * @param locale The locale to use (defaults to current locale)
 * @returns The weapon translation object
 */
export function getWeapon(weaponId: string, locale?: Locale): WeaponTranslation | null {
  const targetLocale = locale || currentLocale;
  const weapon = translations[targetLocale]?.weapons[weaponId];

  if (!weapon) {
    console.warn(`Translation not found for weapon: ${weaponId} in locale: ${targetLocale}`);
    return null;
  }

  return weapon;
}

/**
 * Check if a weapon ID exists in the translation system
 * @param weaponId The kebab-case ID to check
 * @returns True if the weapon exists in translations
 */
export function hasWeapon(weaponId: string): boolean {
  return !!translations[currentLocale]?.weapons[weaponId];
}

/**
 * Get all available weapon IDs
 * @returns Array of all weapon kebab-case IDs
 */
export function getAllWeaponIds(): string[] {
  return Object.keys(translations.en.weapons);
}
