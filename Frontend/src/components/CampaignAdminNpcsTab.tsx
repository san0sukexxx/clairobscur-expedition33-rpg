import { useState, useMemo } from "react";
import { FaSkull, FaChevronDown, FaChevronUp, FaFistRaised, FaShieldAlt, FaHeart, FaBrain, FaEye, FaTheaterMasks } from "react-icons/fa";
import { GiRunningShoe } from "react-icons/gi";
import { getAllNPCsSorted, handleNpcImgError } from "../utils/NpcUtils";
import { ELEMENT_EMOTE, getElementName } from "../utils/ElementUtils";
import { getStatusLabel } from "../utils/BattleUtils";
import { t } from "../i18n";
import type { NPCInfo, NPCAttack } from "../api/ResponseModel";

const ATTR_CONFIG = [
    { key: "strength", label: () => t("combatAdmin.npcDetails.str"), icon: FaFistRaised, color: "text-red-400" },
    { key: "dexterity", label: () => t("combatAdmin.npcDetails.dex"), icon: GiRunningShoe, color: "text-green-400" },
    { key: "constitution", label: () => t("combatAdmin.npcDetails.con"), icon: FaHeart, color: "text-orange-400" },
    { key: "intelligence", label: () => t("combatAdmin.npcDetails.int"), icon: FaBrain, color: "text-blue-400" },
    { key: "wisdom", label: () => t("combatAdmin.npcDetails.wis"), icon: FaEye, color: "text-yellow-400" },
    { key: "charisma", label: () => t("combatAdmin.npcDetails.cha"), icon: FaTheaterMasks, color: "text-pink-400" },
] as const;

function abilityMod(score: number): string {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
}

function attackTypeName(type: NPCAttack["type"]): string {
    switch (type) {
        case "basic": return t("combatAdmin.actionDesc.meleeAttack");
        case "jump": return "Jump";
        case "jump-all": return "Jump (All)";
        case "gradient": return "Gradient";
        case "free-shot": return "Free Shot";
        case "skill": return "Skill";
        default: return type;
    }
}

export default function CampaignAdminNpcsTab() {
    const [filterText, setFilterText] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const npcs = useMemo(() => {
        const all = getAllNPCsSorted();
        if (!filterText.trim()) return all;
        const search = filterText.toLowerCase();
        return all.filter((npc) =>
            npc.name.toLowerCase().includes(search) ||
            npc.id.toLowerCase().includes(search) ||
            npc.challengeRating?.toLowerCase().includes(search) ||
            npc.weakTo?.toLowerCase().includes(search) ||
            npc.resistentTo?.toLowerCase().includes(search) ||
            npc.imuneTo?.toLowerCase().includes(search)
        );
    }, [filterText]);

    return (
        <div className="card bg-base-100 shadow">
            <div className="card-body">
                <div className="flex items-center justify-between">
                    <h2 className="card-title flex items-center gap-2">
                        <FaSkull className="opacity-60" />
                        NPCs
                    </h2>
                    <span className="badge badge-ghost">{npcs.length}</span>
                </div>

                <input
                    type="text"
                    className="input input-bordered input-sm w-full mt-2"
                    placeholder={t("locations.filterPlaceholder")}
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                />

                {npcs.length === 0 && (
                    <div className="alert alert-info mt-4 text-sm">
                        Nenhum NPC encontrado.
                    </div>
                )}

                <div className="mt-4 flex flex-col divide-y divide-base-300">
                    {npcs.map((npc) => {
                        const isExpanded = expandedId === npc.id;
                        return (
                            <div key={npc.id} className="py-2 px-1">
                                {/* Header */}
                                <div
                                    className="flex items-center gap-3 cursor-pointer"
                                    onClick={() => setExpandedId(isExpanded ? null : npc.id)}
                                >
                                    <div className="w-10 h-10 rounded-full bg-base-300 overflow-hidden flex items-center justify-center shrink-0">
                                        <img
                                            src={`/enemies/${npc.id}.png`}
                                            alt={npc.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => handleNpcImgError(e, npc.id)}
                                        />
                                        <FaSkull className="hidden text-base-content opacity-40 text-sm" />
                                    </div>

                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="font-semibold text-sm">{npc.name}</span>
                                        <div className="flex flex-wrap gap-1 mt-0.5">
                                            {npc.challengeRating && (
                                                <span className="badge badge-xs badge-ghost">
                                                    ND {npc.challengeRating}
                                                </span>
                                            )}
                                            {npc.armorClass && (
                                                <span className="badge badge-xs badge-ghost">
                                                    CA {npc.armorClass}
                                                </span>
                                            )}
                                            {npc.weakTo && (
                                                <span className="badge badge-xs badge-warning">
                                                    {ELEMENT_EMOTE[npc.weakTo]} Fraco
                                                </span>
                                            )}
                                            {npc.resistentTo && (
                                                <span className="badge badge-xs badge-info">
                                                    {ELEMENT_EMOTE[npc.resistentTo]} Resist.
                                                </span>
                                            )}
                                            {npc.imuneTo && (
                                                <span className="badge badge-xs badge-error">
                                                    {ELEMENT_EMOTE[npc.imuneTo]} Imune
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="shrink-0">
                                        {isExpanded
                                            ? <FaChevronUp className="w-3 h-3 opacity-50" />
                                            : <FaChevronDown className="w-3 h-3 opacity-50" />
                                        }
                                    </div>
                                </div>

                                {/* Expanded details */}
                                {isExpanded && <NpcDetails npc={npc} />}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function NpcDetails({ npc }: { npc: NPCInfo }) {
    return (
        <div className="bg-base-200/50 rounded-lg p-3 mt-2 space-y-3 text-sm">
            {/* Atributos */}
            <div>
                <span className="font-bold text-xs">{t("combatAdmin.npcDetails.attributes")}</span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-1">
                    {ATTR_CONFIG.map(({ key, label, icon: Icon, color }) => {
                        const val = npc[key];
                        return (
                            <div key={key} className="bg-base-300 rounded-lg p-2 text-center">
                                <div className="flex items-center justify-center gap-1 mb-0.5">
                                    <Icon className={`w-3 h-3 ${color}`} />
                                    <span className="text-xs font-bold opacity-70">{label()}</span>
                                </div>
                                <span className="text-lg font-bold">{val}</span>
                                <span className="text-xs opacity-50 ml-1">({abilityMod(val)})</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Stats de combate */}
            <div className="flex flex-wrap gap-2">
                {npc.armorClass != null && (
                    <div className="bg-base-300 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                        <FaShieldAlt className="text-blue-400 w-3 h-3" />
                        <span className="text-xs font-bold">{t("combatAdmin.npcDetails.armorClass")}</span>
                        <span className="font-bold">{npc.armorClass}</span>
                    </div>
                )}
                {npc.challengeRating && (
                    <div className="bg-base-300 rounded-lg px-3 py-1.5">
                        <span className="text-xs font-bold">{t("combatAdmin.npcDetails.challenge")}:</span>
                        <span className="font-bold ml-1">{npc.challengeRating}</span>
                    </div>
                )}
                {npc.proficiencyBonus != null && (
                    <div className="bg-base-300 rounded-lg px-3 py-1.5">
                        <span className="text-xs font-bold">{t("combatAdmin.npcDetails.proficiencyBonus")}:</span>
                        <span className="font-bold ml-1">+{npc.proficiencyBonus}</span>
                    </div>
                )}
                {npc.initiativeBonus != null && (
                    <div className="bg-base-300 rounded-lg px-3 py-1.5">
                        <span className="text-xs font-bold">{t("combatAdmin.npcDetails.initBonus")}:</span>
                        <span className="font-bold ml-1">+{npc.initiativeBonus}</span>
                    </div>
                )}
                {npc.maxLifeBonus != null && (
                    <div className="bg-base-300 rounded-lg px-3 py-1.5">
                        <span className="text-xs font-bold">{t("combatAdmin.npcDetails.maxHpBonus")}:</span>
                        <span className="font-bold ml-1">+{npc.maxLifeBonus}</span>
                    </div>
                )}
                {npc.freeShotWeakPoints != null && (
                    <div className="bg-base-300 rounded-lg px-3 py-1.5">
                        <span className="text-xs font-bold">{t("combatAdmin.npcDetails.weakPoints")}:</span>
                        <span className="font-bold ml-1">{npc.freeShotWeakPoints}</span>
                    </div>
                )}
                {npc.playFirst && (
                    <div className="bg-warning/20 text-warning rounded-lg px-3 py-1.5 text-xs font-bold">
                        {t("combatAdmin.npcDetails.playFirst")}
                    </div>
                )}
                {npc.isFlying && (
                    <div className="bg-info/20 text-info rounded-lg px-3 py-1.5 text-xs font-bold">
                        {t("combatAdmin.npcDetails.flying")}
                    </div>
                )}
            </div>

            {/* Elementos */}
            {(npc.weakTo || npc.resistentTo || npc.imuneTo || npc.absorbElement) && (
                <div>
                    <span className="font-bold text-xs">Elementos</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {npc.weakTo && (
                            <span className="badge badge-warning gap-1">
                                {ELEMENT_EMOTE[npc.weakTo]} {t("combatAdmin.npcDetails.vulnerability")}: {getElementName(npc.weakTo)}
                            </span>
                        )}
                        {npc.resistentTo && (
                            <span className="badge badge-info gap-1">
                                {ELEMENT_EMOTE[npc.resistentTo]} {t("combatAdmin.npcDetails.resistance")}: {getElementName(npc.resistentTo)}
                            </span>
                        )}
                        {npc.imuneTo && (
                            <span className="badge badge-error gap-1">
                                {ELEMENT_EMOTE[npc.imuneTo]} {t("combatAdmin.npcDetails.immunity")}: {getElementName(npc.imuneTo)}
                            </span>
                        )}
                        {npc.absorbElement && (
                            <span className="badge badge-success gap-1">
                                {ELEMENT_EMOTE[npc.absorbElement]} {t("combatAdmin.npcDetails.absorb")}: {getElementName(npc.absorbElement)}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Vulnerabilidades / Imunidades de dano */}
            {((npc.damageVulnerabilities?.length ?? 0) > 0 || (npc.damageImmunities?.length ?? 0) > 0) && (
                <div className="flex flex-wrap gap-2">
                    {npc.damageVulnerabilities?.map((v) => (
                        <span key={v} className="badge badge-warning badge-sm gap-1">
                            ⚠️ {v}
                        </span>
                    ))}
                    {npc.damageImmunities?.map((v) => (
                        <span key={v} className="badge badge-error badge-sm gap-1">
                            🛡️ {v}
                        </span>
                    ))}
                </div>
            )}

            {/* Imunidades de condição */}
            {(npc.conditionImmunities?.length ?? 0) > 0 && (
                <div>
                    <span className="font-bold text-xs">{t("combatAdmin.npcDetails.conditionImmunities")}</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                        {npc.conditionImmunities!.map((status) => (
                            <span key={status} className="badge badge-sm badge-outline">
                                {getStatusLabel(status)}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Ações */}
            {(npc.attackList?.length ?? 0) > 0 && (
                <div>
                    <span className="font-bold text-xs">{t("combatAdmin.npcDetails.actions")}</span>
                    <div className="flex flex-col gap-1.5 mt-1">
                        {npc.attackList!.map((atk, idx) => (
                            <div key={idx} className="bg-base-300 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-xs">
                                        {atk.name ? t(atk.name) || atk.name : attackTypeName(atk.type)}
                                    </span>
                                    <span className="badge badge-xs badge-ghost">{attackTypeName(atk.type)}</span>
                                    {atk.element && (
                                        <span className="badge badge-xs badge-outline">
                                            {ELEMENT_EMOTE[atk.element]} {getElementName(atk.element)}
                                        </span>
                                    )}
                                    {(atk.quantity ?? 1) > 1 && (
                                        <span className="badge badge-xs badge-accent">
                                            x{atk.quantity}
                                        </span>
                                    )}
                                    {atk.additionalDamage != null && atk.additionalDamage > 0 && (
                                        <span className="badge badge-xs badge-warning">
                                            +{atk.additionalDamage} {t("combatAdmin.npcDetails.damage")}
                                        </span>
                                    )}
                                    {atk.additionalDices != null && atk.additionalDices > 0 && (
                                        <span className="badge badge-xs badge-info">
                                            +{atk.additionalDices}d
                                        </span>
                                    )}
                                </div>
                                {atk.description && (
                                    <p className="text-xs opacity-60 mt-1">{atk.description}</p>
                                )}
                                {(atk.statusList?.length ?? 0) > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {atk.statusList!.map((s, si) => (
                                            <span key={si} className="badge badge-xs badge-outline">
                                                {getStatusLabel(s.type)} {s.ammount > 0 ? `x${s.ammount}` : ""}
                                                {s.remainingTurns ? ` (${s.remainingTurns}t)` : ""}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
