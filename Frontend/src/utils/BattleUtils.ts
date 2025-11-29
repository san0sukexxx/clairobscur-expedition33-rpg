import type { GetPlayerResponse } from "../api/APIPlayer";
import { type AttackType, type AttackResponse, type StatusType, type BattleCharacterInfo, type SkillType, type StatusResponse } from "../api/ResponseModel";

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

export function getStatusDescription(status: StatusType): string {
    switch (status) {
        case "Frozen": return "Não pode realizar ações. Cada valor em 1d6 reduz em 1 o congelamento. Receber um ataque remove todo congelamento.";
        case "Shielded": return "Cada escudo anula um ataque completamente.";
        case "Burning": return "Causa dano no início do turno. Cada queimadura causa 1d6 de dano.";
        case "Hastened": return "Melhora a esquiva e o pulo.";
        case "Slowed": return "Dificulta a esquiva e o pulo.";
        case "Empowered": return "Melhora seu ataque.";
        case "Weakened": return "Enfraquece seu ataque.";
        case "Protected": return "Melhora sua defesa ao aparar.";
        case "Unprotected": return "Dificulta sua defesa ao aparar.";
        case "Regeneration": return "Restaura uma porcentagem da sua vida a cada turno.";

        // TODO
        case "Cursed": return "Aplica penalidades variadas e reduz efetividade.";
        case "Stunned": return "Impede o personagem de agir neste turno.";
        case "Confused": return "Ações podem falhar ou ter efeitos inesperados.";
        case "Entangled": return "Diminui mobilidade e pode impedir ações.";
        case "Exhausted": return "Reduz a capacidade de ataque e defesa.";
        case "Frenzy": return "Aumenta o dano, mas reduz precisão e defesa.";
        case "Rage": return "Concede grande dano extra, mas prejudica defesa.";
        case "Inverted": return "Inverte efeitos ou estatísticas temporariamente.";
        case "Marked": return "Este alvo recebe dano aumentado.";
        case "Plagued": return "Causa dano contínuo e reduz atributos.";
        case "Silenced": return "Impede uso de habilidades mágicas.";
        case "Dizzy": return "Reduz precisão e pode causar falha em ataques.";
        case "free-shot": return "Acumula bônus para ataques básicos.";
        case "jump": return "Ignora terreno ou obstáculos temporariamente.";
        case "gradient": return "Efeito especial de uso interno.";
        default: return "Efeito ativo.";
    }
}

export function getResolveButtonLabel(status: StatusType): string {
    switch (status) {
        case "Frozen":
        case "Burning":
            return "Resolver";
        default:
            return "Ok";
    }
}

export function statusNeedsResolveRoll(status: StatusResponse): boolean {
    switch (status.effectName) {
        case "Frozen":
        case "Burning":
            return true;
        default:
            return false;
    }
}