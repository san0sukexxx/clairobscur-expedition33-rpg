import { getIntensityDiceCount, type StatusType, type SpecialAttackType, type NPCInfo, type NPCAttack } from "../api/ResponseModel";
import { t } from "../i18n";
import { getElementName } from "./ElementUtils";

export function getBattleStatusLabel(status: string): string {
    switch (status) {
        case "starting":
            return t("battle.status.starting");
        case "started":
            return t("battle.status.started");
        case "finished":
            return t("battle.status.finished");
        default:
            return status;
    }
}

export function getAttackTypeLabel(type: string): string {
    switch (type) {
        case "basic":
            return t("battle.attackType.basic");
        case "gradient":
            return t("battle.attackType.gradient");
        default:
            return type;
    }
}

export function getSpecialAttackLabel(specialAttack: SpecialAttackType): string {
    switch (specialAttack) {
        case "give-status":
            return t("battle.skillType.giveStatus");
        default:
            return specialAttack;
    }
}

export function getStatusLabel(status: StatusType): string {
    switch (status) {

        case "Empowered": return t("battle.statusEffects.Empowered");
        case "Regeneration": return t("battle.statusEffects.Regeneration");
        case "Unprotected": return t("battle.statusEffects.Unprotected");
        case "Slowed": return t("battle.statusEffects.Slowed");
        case "Weakened": return t("battle.statusEffects.Weakened");
        case "Cursed": return t("battle.statusEffects.Cursed");
        case "Stunned": return t("battle.statusEffects.Stunned");
        case "Charm": return t("battle.statusEffects.Charm");
        case "Frozen": return t("battle.statusEffects.Frozen");
        case "Entangled": return t("battle.statusEffects.Entangled");

        case "Exhausted": return t("battle.statusEffects.Exhausted");
        case "Frenzy": return t("battle.statusEffects.Frenzy");
        case "Rage": return t("battle.statusEffects.Rage");
        case "Inverted": return t("battle.statusEffects.Inverted");
        case "Marked": return t("battle.statusEffects.Marked");
        case "Blight": return t("battle.statusEffects.Blight");
        case "Burning": return t("battle.statusEffects.Burning");
        case "IntenseFlames": return t("battle.statusEffects.IntenseFlames");
        case "StormCaller": return t("battle.statusEffects.StormCaller");
        case "Typhoon": return t("battle.statusEffects.Typhoon");
        case "Silenced": return t("battle.statusEffects.Silenced");
        case "Dizzy": return t("battle.statusEffects.Dizzy");
        case "Broken": return t("battle.statusEffects.Broken");
        case "Fleeing": return t("battle.statusEffects.Fleeing");
        case "FireVulnerability": return t("battle.statusEffects.FireVulnerability");
        case "Guardian": return t("battle.statusEffects.Guardian");
        case "Foretell": return t("battle.statusEffects.Foretell");
        case "Twilight": return t("battle.statusEffects.Twilight");
        case "Powerless": return t("battle.statusEffects.Powerless");
        case "Rush": return t("battle.statusEffects.Rush");

        case "Shield": return t("battle.statusEffects.Shield");
        case "Powerful": return t("battle.statusEffects.Powerful");
        case "Shell": return t("battle.statusEffects.Shell");


        case "DamageReduction": return t("battle.statusEffects.DamageReduction");
        case "SuccessiveParry": return t("battle.statusEffects.SuccessiveParry");
        case "Aureole": return t("battle.statusEffects.Aureole");

        case "FortunesFury": return t("battle.statusEffects.FortunesFury");

        case "Earthquake": return t("battle.statusEffects.Earthquake");
        case "free-shot": return t("battle.statusEffects.freeShot");
        case "jump": return t("battle.statusEffects.jump");
        case "gradient": return t("battle.statusEffects.gradient");
        case "invisible-barrier": return t("battle.statusEffects.invisibleBarrier");
        case "DamageEscalation": return t("battle.statusEffects.DamageEscalation");
        case "Charging": return t("battle.statusEffects.Charging");
        case "BlueFlower": return t("battle.statusEffects.BlueFlower");
        case "RedFlower": return t("battle.statusEffects.RedFlower");
        default: return status;
    }
}

export function shouldShowStatusAmmount(type: StatusType): boolean {
    const skillsWithoutAmmount: StatusType[] = [

        "Rush",
        "Slowed",
        "Empowered",
        "Weakened",
        "Shell",
        "Unprotected",
        "Cursed",
        "Stunned",
        "Entangled",
        "Exhausted",
        "Inverted",
        "Marked",
        "Silenced",
        "Dizzy",
        "Broken",
        "Fleeing",
        "FireVulnerability",
        "Guardian",

        "FortunesFury",
        "Charging"
    ];

    return !skillsWithoutAmmount.includes(type);
}

/** Auto-generate a D&D-style action description from NPC + attack data */
export function generateActionDescription(npc: NPCInfo, atk: NPCAttack): string {
    if (atk.description) return t(atk.description);

    const strMod = Math.floor((npc.strength - 10) / 2);
    const profBonus = npc.proficiencyBonus ?? 2;
    const hitBonus = strMod + profBonus;
    const hitSign = hitBonus >= 0 ? `+${hitBonus}` : `${hitBonus}`;

    const dieSize = npc.damageDie ?? 6;
    const numDice = getIntensityDiceCount(atk.intensity);
    const flatDmg = strMod + (atk.additionalDamage ?? 0);
    const avgDmg = Math.floor(numDice * ((dieSize + 1) / 2) + flatDmg);
    const flatPart = flatDmg === 0 ? "" : flatDmg > 0 ? `+${flatDmg}` : `${flatDmg}`;
    const dmgExpr = `${avgDmg} (${numDice}d${dieSize}${flatPart})`;

    let desc = `${hitSign} ${t("combatAdmin.actionDesc.toHit")}`;
    const elementName = getElementName(atk.element ?? "Physical");
    desc += `. ${t("combatAdmin.actionDesc.hit")}: ${dmgExpr} ${t("combatAdmin.actionDesc.damageOfType")} ${elementName}`;

    if (atk.quantity && atk.quantity > 1) {
        desc += `, ${atk.quantity} ${t("combatAdmin.actionDesc.hits")}`;
    }

    if (atk.targeting === "all" || atk.targetsAll) {
        desc += ` (${t("combatAdmin.actionDesc.targetsAll")})`;
    } else if (atk.targeting === "single" && atk.quantity && atk.quantity > 1) {
        desc += ` (${t("combatAdmin.actionDesc.targetsSingle")})`;
    }

    if (atk.statusList && atk.statusList.length > 0) {
        const effects = atk.statusList.map(s => {
            let eff = getStatusLabel(s.type);
            if (s.remainingTurns != null) {
                eff += ` ${t("combatAdmin.actionDesc.forTurns", { count: s.remainingTurns })}`;
            }
            return eff;
        });
        desc += `. ${t("combatAdmin.actionDesc.targetGains")} ${effects.join(", ")}`;
    }

    desc += ".";
    return desc;
}

/** Auto-generate a D&D-style description for the basic "Atacar" action */
export function generateBasicAttackDescription(npc: NPCInfo): string {
    const strMod = Math.floor((npc.strength - 10) / 2);
    const profBonus = npc.proficiencyBonus ?? 2;
    const hitBonus = strMod + profBonus;
    const hitSign = hitBonus >= 0 ? `+${hitBonus}` : `${hitBonus}`;

    const dieSize = npc.damageDie ?? 6;
    const flatDmg = strMod;
    const avgDmg = Math.floor((dieSize + 1) / 2 + flatDmg);
    const flatPart = flatDmg === 0 ? "" : flatDmg > 0 ? `+${flatDmg}` : `${flatDmg}`;
    const dmgExpr = `${avgDmg} (1d${dieSize}${flatPart})`;

    return `${t("combatAdmin.actionDesc.meleeAttack")}: ${hitSign} ${t("combatAdmin.actionDesc.toHit")}. ${t("combatAdmin.actionDesc.hit")}: ${dmgExpr} ${t("combatAdmin.actionDesc.damageOfType")} ${getElementName("Physical")}.`;
}
