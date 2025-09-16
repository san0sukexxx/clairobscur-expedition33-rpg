// src/types/Weapon.ts

// Ranks possíveis
export type Rank = "S" | "A" | "B" | "C" | "D" | "E";
export type AttributeType = "vitality" | "agility" | "defense" | "luck";
export type Element = "Physical" | "Void" | "Light" | "Lightning" | "Fire" | "Ice" | "Dark" | "Earth";

// Estrutura de uma passiva
export interface PassiveDTO {
  level: number;
  effect: string;
}

// Estrutura dos atributos
export interface AttributesDTO {
  power: number;
  element: Element;
  scaling: Record<AttributeType, Rank>;
}

// Estrutura de uma arma
export interface WeaponDTO {
  name: string;
  attributes: AttributesDTO;
  passives: PassiveDTO[];
  rotation: number;
}
