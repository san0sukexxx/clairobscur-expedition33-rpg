import { roundDownOneDecimal } from "./MathUtils";
import { PictosList } from "../data/PictosList";
import type { PictoColor, PictoInfo } from "../api/ResponseModel";

export function calculatePictoSpeed(value: number, level: number): number {
    return Math.floor((value / 1400) * level);
}

export function calculatePictoDefense(value: number, level: number): number {
    return Math.floor((value / 1000) * level);
}

export function calculatePictoHealth(value: number, level: number): number {
    return Math.floor((value / 2500) * level);
}

export function calculatePictoCritical(value: number, level: number): number {
    return roundDownOneDecimal((value / 8) * level / 10);
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

export function displayPictoCritical(value: number, level: number): number {
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

export function displayPictoAttributeCritical(value: number, level: number): string {
    return "x" + calculatePictoCritical(value, level);
}

export function getPictoByName(name: string): PictoInfo | undefined {
    // Try to find by translated name first
    const byName = PictosList.find(
        (picto) => picto.name.toLowerCase() === name.toLowerCase()
    );
    if (byName) return byName;

    // Fallback: try to find by imageId (English name)
    return PictosList.find(
        (picto) => picto.imageId.toLowerCase() === name.toLowerCase()
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