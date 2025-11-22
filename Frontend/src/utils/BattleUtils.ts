import { type AttackType, type AttackResponse } from "../api/ResponseModel";

export function getBattleStatusLabel(status: string): string {
    switch (status) {
        case "starting":
            return "Aguardando início";
        case "started":
            return "Em andamento";
        case "finished":
            return "Terminada";
        default:
            return status;
    }
}

export function getAttackType(attack: AttackResponse): AttackType {
    const effects = attack.effects ?? [];

    if (effects.some(e => e.effectType === "jump-all")) {
        return "jump-all";
    }

    if (effects.some(e => e.effectType === "jump")) {
        return "jump";
    }

    if (effects.some(e => e.effectType === "gradient")) {
        return "gradient";
    }

    return "basic";
}

export function getAttackTypeLabel(type: AttackType): string {
    switch (type) {
        case "basic":
            return "Ataque básico";
        case "jump":
            return "Pulo";
        case "jump-all":
            return "Pulo em área";
        case "gradient":
            return "Gradiente";
        default:
            return type;
    }
}