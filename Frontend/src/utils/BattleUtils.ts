import { type AttackType, type AttackResponse, type StatusType, type BattleCharacterInfo, type SkillType } from "../api/ResponseModel";

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

export function getSkillLabel(skill: SkillType): string {
    switch (skill) {
        case "give-status":
            return "Dar status";
        default:
            return skill;
    }
}

export function getStatusLabel(status: StatusType): string {
    switch (status) {
        case "Hastened": return "Acelerado";
        case "Empowered": return "Fortalecido";
        case "Protected": return "Protegido";
        case "Regeneration": return "Regeneração";
        case "Unprotected": return "Desprotegido";
        case "Slowed": return "Lento";
        case "Weakened": return "Enfraquecido";
        case "Cursed": return "Amaldiçoado";
        case "Stunned": return "Atordoado";
        case "Confused": return "Confuso";
        case "Frozen": return "Congelado";
        case "Entangled": return "Enroscado";
        case "Shielded": return "Escudado";
        case "Exhausted": return "Exausto";
        case "Frenzy": return "Frenesi";
        case "Rage": return "Fúria";
        case "Inverted": return "Invertido";
        case "Marked": return "Marcado";
        case "Plagued": return "Pesteado";
        case "Burning": return "Queimando";
        case "Silenced": return "Silenciado";
        case "Dizzy": return "Tonto";
        case "free-shot": return "Free Shot";
        case "jump": return "Pular";
        case "gradient": return "Gradiente";
        default: return status;
    }
}