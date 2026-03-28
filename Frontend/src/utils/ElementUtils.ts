import { type Element, type ElementModifierType } from "../api/ResponseModel";
import { t } from "../i18n";

export function toElementArray(el: Element | Element[] | undefined): Element[] {
    if (!el) return [];
    return Array.isArray(el) ? el : [el];
}

export function formatElements(el: Element | Element[] | undefined): string {
    return toElementArray(el).map(e => `${ELEMENT_EMOTE[e] ?? ""} ${getElementName(e)}`).join(", ");
}

export function hasElement(el: Element | Element[] | undefined): boolean {
    return Array.isArray(el) ? el.length > 0 : !!el;
}

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