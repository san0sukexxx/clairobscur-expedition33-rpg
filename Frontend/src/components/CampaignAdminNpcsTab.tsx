import { useState, useMemo, useEffect, type RefObject, type MutableRefObject } from "react";
import { FaSkull, FaChevronDown, FaChevronUp, FaFistRaised, FaShieldAlt, FaHeart, FaBrain, FaEye, FaTheaterMasks, FaArrowUp, FaUndo } from "react-icons/fa";
import { GiRunningShoe } from "react-icons/gi";
import { getAllNPCsSorted, handleNpcImgError } from "../utils/NpcUtils";
import { getLocationById } from "../utils/LocationUtils";
import { ELEMENT_EMOTE, getElementName } from "../utils/ElementUtils";
import { getAbilityModifier } from "../utils/AttackCalculator";
import { getAttackTypeLabel, getStatusLabel, shouldShowStatusAmmount } from "../utils/BattleUtils";
import { diceTotal } from "../utils/DiceCalculator";
import { dispatchRoll } from "../utils/rollDispatcher";
import type { DiceBoardRef } from "../components/DiceBoard";
import { t, getPictoName, getWeaponName } from "../i18n";
import type { NPCInfo, NPCAttack } from "../api/ResponseModel";
import type { Campaign } from "../api/APICampaign";
import { crToXp, calculateNPCDifficulty, formatCR } from "../utils/NpcDifficulty";

const ATTR_CONFIG = [
    { key: "strength", label: () => t("combatAdmin.npcDetails.str"), icon: FaFistRaised, color: "text-red-400" },
    { key: "dexterity", label: () => t("combatAdmin.npcDetails.dex"), icon: GiRunningShoe, color: "text-green-400" },
    { key: "constitution", label: () => t("combatAdmin.npcDetails.con"), icon: FaHeart, color: "text-orange-400" },
    { key: "intelligence", label: () => t("combatAdmin.npcDetails.int"), icon: FaBrain, color: "text-blue-400" },
    { key: "wisdom", label: () => t("combatAdmin.npcDetails.wis"), icon: FaEye, color: "text-yellow-400" },
    { key: "charisma", label: () => t("combatAdmin.npcDetails.cha"), icon: FaTheaterMasks, color: "text-pink-400" },
] as const;

interface NpcsTabProps {
    diceBoardRef: RefObject<DiceBoardRef | null>;
    timeoutDiceBoardRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
    focusNpcId?: string | null;
    onFocusHandled?: () => void;
    onPictoClick?: (pictoId: string) => void;
    onWeaponClick?: (weaponId: string) => void;
    campaignInfo?: Campaign | null;
}

export default function CampaignAdminNpcsTab({ diceBoardRef, timeoutDiceBoardRef, focusNpcId, onFocusHandled, onPictoClick, onWeaponClick, campaignInfo }: NpcsTabProps) {
    const [filterText, setFilterText] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(focusNpcId ?? null);
    const [currentLocationOnly, setCurrentLocationOnly] = useState(() => localStorage.getItem("npcs.currentLocationOnly") === "true");

    useEffect(() => {
        if (focusNpcId) {
            setExpandedId(focusNpcId);
            setFilterText("");
            requestAnimationFrame(() => {
                document.getElementById(`npc-${focusNpcId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
            });
            onFocusHandled?.();
        }
    }, [focusNpcId]);

    const currentLocationNpcIds = useMemo(() => {
        if (!currentLocationOnly || !campaignInfo?.currentLocationId) return null;
        const loc = getLocationById(campaignInfo.currentLocationId);
        if (!loc) return new Set<string>();
        const ids = new Set<string>(loc.residentNpcIds ?? []);
        for (const enc of loc.encounters ?? []) {
            for (const npcId of enc.npcIds) ids.add(npcId);
        }
        return ids;
    }, [currentLocationOnly, campaignInfo?.currentLocationId]);

    const npcs = useMemo(() => {
        let all = getAllNPCsSorted();
        if (currentLocationNpcIds) {
            all = all.filter((npc) => currentLocationNpcIds.has(npc.id));
        }
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
    }, [filterText, currentLocationNpcIds]);

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

                {campaignInfo?.currentLocationId && (
                    <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-sm checkbox-primary"
                            checked={currentLocationOnly}
                            onChange={(e) => { setCurrentLocationOnly(e.target.checked); localStorage.setItem("npcs.currentLocationOnly", String(e.target.checked)); }}
                        />
                        <span className="text-sm">{t("locations.currentLocationOnly")}</span>
                    </label>
                )}

                {npcs.length === 0 && (
                    <div className="alert alert-info mt-4 text-sm">
                        Nenhum NPC encontrado.
                    </div>
                )}

                <div className="mt-4 flex flex-col divide-y divide-base-300">
                    {npcs.map((npc) => {
                        const isExpanded = expandedId === npc.id;
                        return (
                            <div key={npc.id} id={`npc-${npc.id}`} className="py-2 px-1">
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
                                            {(() => {
                                                const xp = crToXp(calculateNPCDifficulty(npc.id));
                                                return xp > 0 ? (
                                                    <span className="badge badge-xs bg-amber-500/20 text-amber-500 border-amber-500/30">
                                                        {xp.toLocaleString()} XP
                                                    </span>
                                                ) : null;
                                            })()}
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
                                {isExpanded && (
                                    <NpcDetails
                                        npc={npc}
                                        diceBoardRef={diceBoardRef}
                                        timeoutDiceBoardRef={timeoutDiceBoardRef}
                                        onPictoClick={onPictoClick}
                                        onWeaponClick={onWeaponClick}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

interface NpcDetailsProps {
    npc: NPCInfo;
    diceBoardRef: RefObject<DiceBoardRef | null>;
    timeoutDiceBoardRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
    onPictoClick?: (pictoId: string) => void;
    onWeaponClick?: (weaponId: string) => void;
}

function NpcDetails({ npc, diceBoardRef, timeoutDiceBoardRef, onPictoClick, onWeaponClick }: NpcDetailsProps) {
    const [npcIntensityOffset, setNpcIntensityOffset] = useState(0);

    // ── dice rolling helpers ──

    const rollActionDice = (diceCmd: string, modifier: number, label: string) => {
        if (!diceBoardRef.current) return;
        if (timeoutDiceBoardRef.current != null) {
            clearTimeout(timeoutDiceBoardRef.current);
            timeoutDiceBoardRef.current = null;
        }
        diceBoardRef.current.roll([diceCmd], (result) => {
            const rawTotal = diceTotal(result);
            const diceValues: number[] = [];
            for (const group of result) {
                if (Array.isArray(group.rolls)) {
                    for (const roll of group.rolls) diceValues.push(roll.value);
                }
            }
            dispatchRoll({
                label,
                diceRolled: rawTotal,
                modifier,
                total: rawTotal + modifier,
                diceCommand: `${diceCmd}${modifier >= 0 ? "+" : ""}${modifier}`,
                diceValues,
            });
            if (timeoutDiceBoardRef.current != null) {
                clearTimeout(timeoutDiceBoardRef.current);
            }
            timeoutDiceBoardRef.current = window.setTimeout(() => {
                diceBoardRef.current?.hideBoard();
                timeoutDiceBoardRef.current = null;
            }, 5000);
        });
    };

    const rollAbility = (abilityLabel: string, mod: number) => {
        rollActionDice("1d20", mod, `${npc.name} - ${abilityLabel}`);
    };

    const DiceBtn = ({ diceCmd, modifier, label }: { diceCmd: string; modifier: number; label: string }) => {
        const modSign = modifier >= 0 ? `+${modifier}` : `${modifier}`;
        return (
            <button
                className="inline-flex items-center px-1.5 py-0.5 mx-0.5 bg-amber-700 text-amber-100 hover:bg-amber-500 hover:text-white rounded text-xs font-mono font-bold cursor-pointer transition-colors align-baseline"
                onClick={(e) => { e.stopPropagation(); rollActionDice(diceCmd, modifier, label); }}
            >
                {diceCmd === "1d20" ? modSign : modifier === 0 ? `(${diceCmd})` : `(${diceCmd}${modSign})`}
            </button>
        );
    };

    function calcDamage(baseDice: number, baseMod: number) {
        const totalDice = Math.max(1, baseDice + npcIntensityOffset);
        const atMinDice = baseDice + npcIntensityOffset < 1;
        const mod = atMinDice ? 0 : baseMod;
        return { numDice: totalDice, flatDmg: mod, avgDmg: Math.floor(totalDice * 3.5 + mod) };
    }

    // ── derived values ──

    const strMod = getAbilityModifier(npc.strength);
    const profBonus = npc.proficiencyBonus ?? 2;
    const hitBonus = strMod + profBonus;
    const npcName = npc.name;

    return (
        <div className="bg-base-200/50 rounded-lg p-3 mt-2 space-y-3 text-sm">
            {/* Atributos (clicáveis) */}
            <div>
                <span className="font-bold text-xs">{t("combatAdmin.npcDetails.attributes")}</span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-1">
                    {ATTR_CONFIG.map(({ key, label, icon: Icon, color }) => {
                        const val = npc[key];
                        const mod = getAbilityModifier(val);
                        return (
                            <div key={key} className="bg-base-300 rounded-lg p-2 text-center">
                                <div className="flex items-center justify-center gap-1 mb-0.5">
                                    <Icon className={`w-3 h-3 ${color}`} />
                                    <span className="text-xs font-bold opacity-70">{label()}</span>
                                </div>
                                <span className="text-lg font-bold">{val}</span>
                                <button
                                    className="btn btn-sm btn-neutral font-mono px-2 min-h-0 h-6 ml-1 text-xs"
                                    onClick={() => rollAbility(label(), mod)}
                                >
                                    {mod >= 0 ? `+${mod}` : mod}
                                </button>
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
                {(() => {
                    const cr = calculateNPCDifficulty(npc.id);
                    const xp = crToXp(cr);
                    return xp > 0 ? (
                        <div className="bg-amber-500/15 text-amber-500 rounded-lg px-3 py-1.5">
                            <span className="text-xs font-bold">XP:</span>
                            <span className="font-bold ml-1">{xp.toLocaleString()}</span>
                        </div>
                    ) : null;
                })()}
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

            {/* Passivas */}
            {(npc.passives?.length ?? 0) > 0 && (
                <div>
                    <span className="font-bold text-xs">{t("combatAdmin.npcDetails.passives")}</span>
                    <div className="flex flex-col gap-1 mt-1">
                        {npc.passives!.map((passive, idx) => (
                            <div key={idx} className="rounded-md px-3 py-2 text-sm leading-relaxed border border-transparent">
                                <span className="text-cyan-300">{"▸ "}</span><span className="italic opacity-90 text-cyan-300">{t(passive)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Ações (D&D style com dados clicáveis) */}
            {(npc.attackList?.length ?? 0) > 0 && (
                <div>
                    <span className="font-bold text-xs">{t("combatAdmin.npcDetails.actions")}</span>
                    <div className="flex flex-col gap-1 mt-1">
                        {npc.attackList!.map((atk, idx) => {
                            const actionName = atk.name ? t(atk.name) || atk.name : getAttackTypeLabel(atk.type);

                            const hasDamage = atk.additionalDamage != null || atk.additionalDices != null;
                            const baseDice = 1 + (atk.additionalDices ?? 0);
                            const baseMod = strMod + (atk.additionalDamage ?? 0);
                            const { numDice, flatDmg, avgDmg } = calcDamage(baseDice, baseMod);

                            const statusParts: string[] = [];
                            if (atk.statusList) {
                                for (const s of atk.statusList) {
                                    let part = getStatusLabel(s.type);
                                    if (shouldShowStatusAmmount(s.type) && s.ammount > 0) part += ` x${s.ammount}`;
                                    if (s.remainingTurns) part += ` (${s.remainingTurns}t)`;
                                    statusParts.push(part);
                                }
                            }

                            return (
                                <div key={idx} className="rounded-md px-3 py-2 text-sm leading-relaxed border border-transparent">
                                    <span>
                                        <strong className={atk.description && !hasDamage ? "text-amber-300" : "text-red-300"}>{"▸ "}{actionName}.</strong>{" "}
                                        {atk.description && <span className="italic opacity-90">{t(atk.description)} </span>}
                                        {hasDamage && (
                                            <span className="italic opacity-90">
                                                <DiceBtn diceCmd="1d20" modifier={hitBonus} label={`${npcName} – ${actionName} (${t("combatAdmin.actionDesc.toHit")})`} />
                                                {" "}{t("combatAdmin.actionDesc.toHit")}
                                                . {t("combatAdmin.actionDesc.hit")}: {avgDmg}{" "}
                                                <DiceBtn diceCmd={`${numDice}d6`} modifier={flatDmg} label={`${npcName} – ${actionName} (${t("combatAdmin.actionDesc.hit")})`} />
                                                {atk.quantity != null && atk.quantity > 1 && <>, {atk.quantity} {t("combatAdmin.actionDesc.hits")}</>}
                                                {statusParts.length > 0 && <>. {t("combatAdmin.actionDesc.targetGains")} {statusParts.join(", ")}</>}
                                                .
                                            </span>
                                        )}
                                        {!hasDamage && !atk.description && (
                                            <span className="italic opacity-90">
                                                <DiceBtn diceCmd="1d20" modifier={hitBonus} label={`${npcName} – ${actionName} (${t("combatAdmin.actionDesc.toHit")})`} />
                                                {" "}{t("combatAdmin.actionDesc.toHit")}
                                                . {t("combatAdmin.actionDesc.hit")}: {avgDmg}{" "}
                                                <DiceBtn diceCmd={`${numDice}d6`} modifier={flatDmg} label={`${npcName} – ${actionName} (${t("combatAdmin.actionDesc.hit")})`} />
                                                {atk.quantity != null && atk.quantity > 1 && <>, {atk.quantity} {t("combatAdmin.actionDesc.hits")}</>}
                                                {statusParts.length > 0 && <>. {t("combatAdmin.actionDesc.targetGains")} {statusParts.join(", ")}</>}
                                                .
                                            </span>
                                        )}
                                    </span>
                                </div>
                            );
                        })}

                        {/* Ação básica "Atacar" — hidden if NPC already has basic in attackList */}
                        {!npc.attackList?.some(a => a.type === "basic") && (() => {
                            const { numDice, flatDmg, avgDmg } = calcDamage(1, strMod);
                            return (
                                <div className="rounded-md px-3 py-2 text-sm leading-relaxed border border-transparent">
                                    <span>
                                        <strong className="text-red-300">{"▸ "}{t("combatAdmin.actionDesc.meleeAttack")}.</strong>{" "}
                                        <span className="italic opacity-90">
                                            <DiceBtn diceCmd="1d20" modifier={hitBonus} label={`${npcName} – ${t("combatAdmin.actionDesc.meleeAttack")} (${t("combatAdmin.actionDesc.toHit")})`} />
                                            {" "}{t("combatAdmin.actionDesc.toHit")}
                                            . {t("combatAdmin.actionDesc.hit")}: {avgDmg}{" "}
                                            <DiceBtn diceCmd={`${numDice}d6`} modifier={flatDmg} label={`${npcName} – ${t("combatAdmin.actionDesc.meleeAttack")} (${t("combatAdmin.actionDesc.hit")})`} />
                                            .
                                        </span>
                                    </span>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Intensity buttons */}
                    <div className="flex items-center justify-center gap-3 pt-1">
                        {npcIntensityOffset > 0 && (
                            <button
                                className="btn btn-sm btn-warning btn-outline"
                                onClick={() => setNpcIntensityOffset(0)}
                            >
                                <FaUndo /> {t("combatAdmin.labels.resetIntensity")}
                            </button>
                        )}
                        <button
                            className="btn btn-sm btn-success btn-outline"
                            onClick={() => setNpcIntensityOffset(prev => prev + 1)}
                        >
                            <FaArrowUp /> {t("combatAdmin.labels.increaseIntensity")}
                        </button>
                    </div>
                </div>
            )}

            {/* Drops */}
            {npc.drops && ((npc.drops.pictos?.length ?? 0) > 0 || (npc.drops.weapons?.length ?? 0) > 0) && (
                <div>
                    <span className="font-bold text-xs">{t("combatAdmin.npcDetails.drops")}</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                        {npc.drops.weapons?.map((weaponId) => (
                            <span
                                key={weaponId}
                                className="badge badge-sm badge-warning gap-1 cursor-pointer hover:brightness-125 transition-all"
                                onClick={() => onWeaponClick?.(weaponId)}
                            >
                                ⚔️ {getWeaponName(weaponId)}
                            </span>
                        ))}
                        {npc.drops.pictos?.map((pictoId) => (
                            <span
                                key={pictoId}
                                className="badge badge-sm badge-success gap-1 cursor-pointer hover:brightness-125 transition-all"
                                onClick={() => onPictoClick?.(pictoId)}
                            >
                                🎴 {getPictoName(pictoId)}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
