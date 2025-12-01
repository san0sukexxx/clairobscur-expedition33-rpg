import { roundDownOneDecimal } from "./MathUtils";
import { PictosList } from "../data/PictosList";
import type { PictoInfo } from "../api/ResponseModel";

export function calculatePictoSpeed(value: number, level: number): number {
    return value / 20 * level;
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
    return "+" + Math.floor((value / 1400) * level);
}

export function displayPictoAttributeDefense(value: number, level: number): string {
    return "+" + Math.floor((value / 1000) * level);
}

export function displayPictoAttributeHealth(value: number, level: number): string {
    return "+" + Math.floor((value / 2500) * level);
}

export function displayPictoAttributeCritical(value: number, level: number): string {
    return "x" + roundDownOneDecimal((value / 5) * level / 10);
}

export function getPictoByName(name: string): PictoInfo | undefined {
    return PictosList.find(
        (picto) => picto.name.toLowerCase() === name.toLowerCase()
    );
}

export function getAllPictosSorted(): PictoInfo[] {
    return [...PictosList].sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR")
    );
}

