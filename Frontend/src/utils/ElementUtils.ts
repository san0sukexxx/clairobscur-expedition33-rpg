import { type ElementModifierType } from "../api/ResponseModel";
import { t } from "../i18n";

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

export function getElementName(element: string): string {
    return t(`weapons.elements.${element}`) || element;
}

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