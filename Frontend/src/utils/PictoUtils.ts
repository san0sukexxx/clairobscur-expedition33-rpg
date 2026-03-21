import { PictosList } from "../data/PictosList";
import type { PictoColor, PictoInfo, PictoResponse, LuminaResponse } from "../api/ResponseModel";
import type { GetPlayerResponse } from "../api/APIPlayer";
import { calculateMaxLuminas } from "./PlayerCalculator";

export function calculatePictoSpeed(value: number, level: number): number {
    return Math.floor((value / 200) * level);
}

export function calculatePictoDefense(value: number, level: number): number {
    return Math.floor((value / 1000) * level);
}

export function calculatePictoHealth(value: number, level: number): number {
    return Math.floor((value / 1000) * level);
}

export function calculatePictoAbility(value: number, level: number): number {
    return Math.floor((value / 450) * level);
}

export function displayPictoSpeed(value: number, level: number): number {
    return value;
}

export function displayPictoDefense(value: number, level: number): number {
    return value;
}

export function displayPictoHealth(value: number, level: number): number {
    return value;
}

export function displayPictoAbility(value: number, level: number): number {
    return value;
}

export function displayPictoAttributeSpeed(value: number, level: number): string {
    return "+" + calculatePictoSpeed(value, level);
}

export function displayPictoAttributeDefense(value: number, level: number): string {
    return "+" + calculatePictoDefense(value, level);
}

export function displayPictoAttributeHealth(value: number, level: number): string {
    return "+" + calculatePictoHealth(value, level);
}

export function displayPictoAttributeAbility(value: number, level: number): string {
    return "+" + calculatePictoAbility(value, level);
}

export function getPictoByName(name: string): PictoInfo | undefined {
    if (!name) return undefined;

    const nameLower = name.toLowerCase();

    // Try to find by id first (kebab-case like "dodger")
    const byId = PictosList.find(
        (picto) => picto.id?.toLowerCase() === nameLower
    );
    if (byId) return byId;

    // Try to find by translated name
    const byName = PictosList.find(
        (picto) => picto.name?.toLowerCase() === nameLower
    );
    if (byName) return byName;

    // Fallback: try to find by imageId (English name)
    return PictosList.find(
        (picto) => picto.imageId?.toLowerCase() === nameLower
    );
}

export function getAllPictosSorted(): PictoInfo[] {
    return [...PictosList].sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR")
    );
}

export const pictoColorHex: Record<PictoColor, string> = {
  green: "rgb(26, 230, 103)",
  red: "rgb(227, 30, 25)",
  blue: "rgb(140, 255, 255)",
  yellow: "rgb(235, 220, 170)",
}

/**
 * Returns a Set of picto IDs (PictoResponse.id) that should be disabled
 * because the total lumina cost of equipped pictos + luminas exceeds the max.
 * Disables pictos with the highest luminaCost first.
 */
export function getDisabledPictoIds(player: GetPlayerResponse | null): Set<number> {
  const disabled = new Set<number>();
  if (!player) return disabled;

  const maxLumina = calculateMaxLuminas(player);
  const equippedPictos = (player.pictos ?? []).filter(p => typeof p.slot === "number");
  const equippedLuminas = (player.luminas ?? []).filter((l): l is LuminaResponse => l.isEquiped);

  const luminasCost = equippedLuminas.reduce((sum, l) => {
    const info = getPictoByName(l.pictoId);
    return sum + (info?.luminaCost ?? 0);
  }, 0);

  const pictosWithCost = equippedPictos.map(p => ({
    picto: p,
    cost: getPictoByName(p.pictoId)?.luminaCost ?? 0,
  })).sort((a, b) => b.cost - a.cost); // most expensive first

  let totalCost = luminasCost + pictosWithCost.reduce((sum, p) => sum + p.cost, 0);

  for (const { picto, cost } of pictosWithCost) {
    if (totalCost <= maxLumina) break;
    disabled.add(picto.id);
    totalCost -= cost;
  }

  return disabled;
}
