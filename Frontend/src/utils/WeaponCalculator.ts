import type { WeaponInfo } from "../api/ResponseModel";
import { roundDownOneDecimal } from "./MathUtils";

export function calculateWeaponPower(power: number, level: number): number {
  return roundDownOneDecimal((power / 7) * level / 1000);
}
export function calculateWeaponPlusDices(power: number, level: number): number {
  const weaponPower = calculateWeaponPower(power, level);
  const [integerPart, decimalPart] = weaponPower.toString().split(".").map(Number);
  return integerPart;
}
export function calculateWeaponPlusPower(power: number, level: number): number | null {
  const weaponPower = calculateWeaponPower(power, level);
  const [integerPart, decimalPart] = weaponPower.toString().split(".").map(Number);
  if (decimalPart == undefined) return null;
  return decimalPart;
}
export function calculateWeaponCounterMaxPower(power: number, level: number): number | null {
  const weaponPower = calculateWeaponPower(power, level);
  const [integerPart, decimalPart] = weaponPower.toString().split(".").map(Number);
  if (decimalPart == undefined) return integerPart * 3;
  return integerPart * 3 + decimalPart;
}
export function displayWeaponPlusDices(power: number, level: number): string | null {
  return "+" + calculateWeaponPlusDices(power, level);
}
export function displayWeaponPlusPower(power: number, level: number): string | null {
  const weaponPower = calculateWeaponPlusPower(power, level);
  if (weaponPower == null) return null;
  return "+" + weaponPower;
}

const ranks = ["S", "A", "B", "C", "D"];
export function displayWeaponAttributeRank(rank: string, level: number): string {
  const index = ranks.indexOf(rank);

  if (index === -1) return rank;

  if (level < 4) {
    return ranks[Math.min(index + 2, ranks.length - 1)];
  }

  if (level < 20) {
    return ranks[Math.min(index + 1, ranks.length - 1)];
  }

  if (level === 33) {
    return ranks[Math.max(index - 1, 0)];
  }

  return rank;
}
export function rankToValue(rank: string, level: number): number {
  const weaponRank = displayWeaponAttributeRank(rank, level)
  const index = ranks.indexOf(weaponRank);
  if (index === -1) return 0;
  return (ranks.length - index);
}
export function calculateWeaponVitalityBonus(weaponInfo: WeaponInfo | null): number {
  if (weaponInfo?.details?.attributes.scaling.vitality == undefined) { return 0; }
  const rank = weaponInfo?.details?.attributes.scaling.vitality;
  return rankToValue(rank, weaponInfo.weapon?.level ?? 0) * 5
}
export function calculateWeaponAgilityBonus(weaponInfo: WeaponInfo | null): number {
  if (weaponInfo?.details?.attributes.scaling.agility == undefined) { return 0; }
  const rank = weaponInfo?.details?.attributes.scaling.agility;
  return rankToValue(rank, weaponInfo.weapon?.level ?? 0)
}
export function calculateWeaponDefenseBonus(weaponInfo: WeaponInfo | null): number {
  if (weaponInfo?.details?.attributes.scaling.defense == undefined) { return 0; }
  const rank = weaponInfo?.details?.attributes.scaling.defense;
  return rankToValue(rank, weaponInfo.weapon?.level ?? 0)
}
export function displayWeaponVitalityBonus(rank: string, level: number): string {
  return "+" + rankToValue(rank, level) * 5
}
export function displayWeaponDefenseBonus(rank: string, level: number): string {
  return "+" + rankToValue(rank, level)
}
export function displayWeaponLuckBonus(rank: string, level: number): string {
  return "+" + rankToValue(rank, level)
}
export function displayWeaponAgilityBonus(rank: string, level: number): string {
  return "+" + rankToValue(rank, level)
}