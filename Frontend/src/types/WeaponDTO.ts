// src/types/Weapon.ts

// Ranks possíveis
export type Rank = "S" | "A" | "B" | "C" | "D" | "E";

// Estrutura de uma passiva
export interface PassiveDTO {
  level: number;
  effect: string;
}

// Estrutura dos atributos
export interface AttributesDTO {
  power: number;
  element: string; // exemplo: "Dark", "Physical"
  scaling: Record<string, Rank>;
  // se quiser limitar, podemos criar um type fixo com chaves: vitality, agility, defense, etc.
}

// Estrutura de uma arma
export interface WeaponDTO {
  name: string;
  attributes: AttributesDTO;
  passives: PassiveDTO[];
  rotation: number;
}
