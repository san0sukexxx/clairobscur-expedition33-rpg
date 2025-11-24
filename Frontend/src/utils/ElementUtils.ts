import { type ElementModifierType } from "../api/ResponseModel"

export const ELEMENT_EMOTE: Record<string, string> = {
  Physical: "⚔️",
  Void: "🕳️",
  Light: "✨",
  Lightning: "⚡️",
  Fire: "🔥",
  Ice: "❄️",
  Dark: "🌑",
  Earth: "🪨",
  Unkown: "❓"
} as const;

export function getElementModifierText(type: ElementModifierType): string {
    switch (type) {
        case "imune":
            return "Imune";
        case "weak":
            return "Vulnerável";
        case "resistent":
            return "Resistente";
        default:
            return "";
    }
}