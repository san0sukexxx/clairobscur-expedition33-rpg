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
            return "Aplicar status";
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
        case "Entangled": return "Acorrentado";
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
        case "Fragile": return "Frágil";
        case "Broken": return "Quebrado";
        case "Fleeing": return "Fugindo";
        case "free-shot": return "Free Shot";
        case "jump": return "Pular";
        case "gradient": return "Gradiente";
        default: return status;
    }
}

export function shouldShowStatusAmmount(type: StatusType): boolean {
    const skillsWithoutAmmount: StatusType[] = [
        "Hastened",
        "Slowed",
        "Empowered",
        "Weakened",
        "Protected",
        "Unprotected",
        "Cursed",
        "Stunned",
        "Entangled",
        "Exhausted",
        "Inverted",
        "Marked",
        "Silenced",
        "Dizzy",
        "Fragile",
        "Broken",
        "Fragile",
        "Broken",
        "Fleeing"
    ];

    return !skillsWithoutAmmount.includes(type);
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
        case "Cursed": return "Morre quando o contador chegar a zero.";
        case "Stunned": return "Impede o personagem de agir neste turno.";
        case "Confused": return "Seu personagem deve fazer o que o mestre disser. Você tem direito a um teste de resistência a cada início de turno.";
        case "Entangled": return "Não pode desviar de ataques, apenas aparar, aparar gradiente ou pular.";
        case "Exhausted": return "Qualquer ação que custe PM, custa 1 a mais e os personagens não podem recuperar PM de nenhuma maneira.";
        case "Frenzy": return "O personagem tem +1 por frenesi em testes de ataque (exceto tiro livre).";
        case "Rage": return "Você tem direito a uma ação de ataque básico extra, além de suas outras ações.";
        case "Inverted": return "Quando receber cura de qualquer efeito, sofre dano ao invés de se curar.";
        case "Marked": return "O personagem tem Perda no seu próximo teste de Defesa.";
        case "Plagued": return "O personagem tem –5 PV máximos até o fim da cena. Essa condição pode acumular, diminuindo 5 PV por cada acumulo, até o personagem ficar com o mínimo de 1 PV máximo.";
        case "Silenced": return "Não pode usar habilidades.";
        case "Dizzy": return "Perda em ataques usando tiro livre ou habilidades.";
        case "Fragile": return "Receber um dano maior que o dobro de sua resistência te torna frágil. Estando frágil você fica vulnerável a quebra.";
        case "Broken": return "Você não pode se defender ou pode agir.";
        case "Fleeing": return "O personagem está tentando fugir da batalha e não pode realizar nenhuma outra ação.";
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
        case "Confused":
            return "Resolver";
        default:
            return "Ok";
    }
}

export function statusNeedsResolveRoll(status: StatusResponse): boolean {
    switch (status.effectName) {
        case "Frozen":
        case "Burning":
        case "Confused":
            return true;
        default:
            return false;
    }
}