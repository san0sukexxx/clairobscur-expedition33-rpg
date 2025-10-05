import { roundDownOneDecimal } from "./MathUtils";

export function calculatePictoSpeed(value: number, level: number): number {
    return value / 20 * level;
}

export function displayPictoSpeed(power: number, level: number): number {
    return Math.round((power) * level);
}

export function displayPictoDefense(power: number, level: number): number {
    return Math.round((power / 5) * level);
}

export function displayPictoHealth(power: number, level: number): number {
    return Math.round((power / 2) * level);
}

export function displayPictoCritical(power: number, level: number): number {
    return Math.round((power / 5) * level);
}

export function displayPictoAttributeSpeed(value: number, level: number): string {
    return "+" + roundDownOneDecimal((value) * level / 1000);
}

export function displayPictoAttributeDefense(value: number, level: number): string {
    return "+" + roundDownOneDecimal((value / 5) * level / 1000);
}

export function displayPictoAttributeHealth(value: number, level: number): string {
    return "+" + roundDownOneDecimal((value / 2) * level / 1000);
}

export function displayPictoAttributeCritical(value: number, level: number): string {
    return "x" + roundDownOneDecimal((value / 5) * level / 10);
}