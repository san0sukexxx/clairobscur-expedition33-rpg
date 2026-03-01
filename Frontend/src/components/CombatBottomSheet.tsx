import type { RefObject, MutableRefObject } from "react";
import { useMemo, useState } from "react";
import { FaChevronUp, FaChevronDown } from "react-icons/fa";
import { GiPerspectiveDiceSixFacesRandom } from "react-icons/gi";
import type { GetPlayerResponse } from "../api/APIPlayer";
import type { DiceBoardRef } from "./DiceBoard";
import { useWeaponInfo } from "../hooks/player/useWeaponInfo";
import { calculateAttackBonus, calculateDamageBonus, getAbilityModifier } from "../utils/AttackCalculator";
import { getWeaponDamageDice } from "../utils/WeaponCalculator";
import { rollWithTimeout } from "../utils/RollUtils";
import { diceTotal } from "../utils/DiceCalculator";
import { dispatchRoll } from "../utils/rollDispatcher";
import { getWeaponPassive, toKebabCase, hasWeapon, t } from "../i18n";
import { ELEMENT_EMOTE, getElementName } from "../utils/ElementUtils";
import type { WeaponDTO } from "../types/WeaponDTO";

function getWeaponTranslationId(weaponName: string, weaponList: WeaponDTO[]): string {
    const baseId = toKebabCase(weaponName);
    if (hasWeapon(baseId)) return baseId;

    const suffixes = ["-verso", "-lune", "-maelle", "-monoco", "-sciel"];
    for (const suffix of suffixes) {
        const idWithSuffix = baseId + suffix;
        if (hasWeapon(idWithSuffix)) return idWithSuffix;
    }

    return baseId;
}

const levelColor = (lvl: number) =>
    lvl >= 4 ? "text-red-400"
        : lvl >= 3 ? "text-yellow-400"
            : "text-sky-400";

interface CombatBottomSheetProps {
    player: GetPlayerResponse | null;
    open: boolean;
    onOpen: () => void;
    onClose: () => void;
    diceBoardRef: RefObject<DiceBoardRef | null>;
    timeoutDiceBoardRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
}

export default function CombatBottomSheet({ player, open, onOpen, onClose, diceBoardRef, timeoutDiceBoardRef }: CombatBottomSheetProps) {
    const { weaponInfo, weaponList } = useWeaponInfo(player);
    const { weapon, details } = weaponInfo;

    const attackBonus = useMemo(() => {
        if (!player) return null;
        return calculateAttackBonus(player, weaponInfo);
    }, [player, weaponInfo]);

    const damageBonus = useMemo(() => {
        if (!player) return null;
        return calculateDamageBonus(player, weaponInfo);
    }, [player, weaponInfo]);

    const dexMod = useMemo(() => {
        const dexScore = player?.playerSheet?.abilityScores?.dexterity ?? 10;
        return getAbilityModifier(dexScore);
    }, [player]);

    const INTENSITY_KEYS = ["intensityLow", "intensityMedium", "intensityHigh", "intensityVeryHigh", "intensityExtreme"] as const;
    const INTENSITY_DICE_MULTIPLIER = [1, 1, 2, 3, 4];
    const [intensityIndex, setIntensityIndex] = useState(1); // starts at "Médio"

    if (!weapon || !details) return null;
    const baseDamageDice = getWeaponDamageDice(weapon.level);
    const multiplier = INTENSITY_DICE_MULTIPLIER[intensityIndex];
    const damageDice = baseDamageDice.replace(/^(\d+)/, (_, n) => String(Number(n) * multiplier));
    const weaponId = getWeaponTranslationId(details.name, weaponList);
    const unlockedPassives = details.passives.filter(p => p.level <= weapon.level);

    return (
        <>
            {/* Toggle button */}
            {!open && (
                <button
                    onClick={onOpen}
                    className="fixed bottom-0 left-0 right-0 z-42 flex justify-center py-2 bg-neutral/50 border-t border-neutral-content/10 cursor-pointer hover:bg-neutral/60 transition-colors"
                >
                    <FaChevronUp className="text-neutral-content/60" size={16} />
                </button>
            )}

            {/* Backdrop */}
            {open && (
                <div
                    className="fixed inset-0 z-41 bg-black/30"
                    onClick={onClose}
                />
            )}

            {/* Bottom sheet panel */}
            <div
                className={`fixed bottom-0 left-0 right-0 z-42 transition-transform duration-300 ease-in-out ${
                    open ? "translate-y-0" : "translate-y-full"
                }`}
                style={{ height: "60vh" }}
            >
                <div className="h-full bg-base-100/95 backdrop-blur-sm border-t border-base-300 shadow-lg flex flex-col">
                    {/* Header with close button */}
                    <button
                        onClick={onClose}
                        className="flex justify-center py-2 border-b border-base-300 cursor-pointer hover:bg-base-200/80 transition-colors"
                    >
                        <FaChevronDown className="text-base-content/60" size={16} />
                    </button>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Weapon header */}
                        <div className="flex items-center gap-3">
                            <div className="relative w-16 h-12 shrink-0">
                                <img
                                    src={`/weapons/${details.name}.webp`}
                                    alt={details.name}
                                    className="absolute inset-0 m-auto object-contain w-full h-full"
                                    style={{ rotate: `${details.rotation}deg` }}
                                />
                            </div>
                            <div>
                                <div>
                                    <span className="font-bold text-base">{weapon.id}</span>
                                    <span className="ml-2 text-sm opacity-60">Lv.{weapon.level}</span>
                                </div>
                                <div className="text-sm opacity-70">
                                    {getElementName(details.attributes.element)} {ELEMENT_EMOTE[details.attributes.element] ?? "❓"}
                                </div>
                            </div>
                        </div>

                        {/* Weapon attack buttons */}
                        <div className="border border-base-300 rounded-lg p-3 space-y-2">
                            <span className="text-xs font-semibold uppercase tracking-wide opacity-50">{t("combat.attack")}</span>
                            <div className="flex gap-2">
                                {attackBonus && (
                                    <button
                                        className="btn btn-outline btn-sm gap-2 flex-1"
                                        onClick={() => {
                                            rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, "1d20", (result) => {
                                                const d20Roll = diceTotal(result);
                                                const total = d20Roll + attackBonus.total;
                                                dispatchRoll({
                                                    label: t("combat.attack"),
                                                    diceRolled: d20Roll,
                                                    modifier: attackBonus.total,
                                                    total,
                                                    diceCommand: "1d20",
                                                });
                                            });
                                        }}
                                    >
                                        <GiPerspectiveDiceSixFacesRandom size={18} />
                                        Hit {attackBonus.total >= 0 ? "+" : ""}{attackBonus.total}
                                    </button>
                                )}
                                {damageBonus && (() => {
                                    const isLowIntensity = intensityIndex === 0;
                                    const effectiveBonus = isLowIntensity ? Math.min(damageBonus.total, 0) : damageBonus.total;
                                    return (
                                    <button
                                        className="btn btn-outline btn-sm gap-2 flex-1"
                                        onClick={() => {
                                            rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, damageDice, (result) => {
                                                const diceRoll = diceTotal(result);
                                                const total = diceRoll + effectiveBonus;
                                                dispatchRoll({
                                                    label: t("playerPage.basicAttack.damage"),
                                                    diceRolled: diceRoll,
                                                    modifier: effectiveBonus,
                                                    total,
                                                    diceCommand: damageDice,
                                                });
                                            });
                                        }}
                                    >
                                        <GiPerspectiveDiceSixFacesRandom size={18} />
                                        {damageDice}{effectiveBonus !== 0 ? ` ${effectiveBonus >= 0 ? "+" : ""}${effectiveBonus}` : ""}
                                    </button>
                                    );
                                })()}
                            </div>

                            {/* Intensity slider */}
                            <div className="pt-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold uppercase tracking-wide opacity-50">{t("combat.intensity")}</span>
                                    <span className={`text-xs font-bold ${
                                        intensityIndex === 0 ? "text-sky-400"
                                        : intensityIndex === 1 ? "text-emerald-400"
                                        : intensityIndex === 2 ? "text-amber-400"
                                        : intensityIndex === 3 ? "text-orange-400"
                                        : "text-red-400"
                                    }`}>
                                        {t(`combat.${INTENSITY_KEYS[intensityIndex]}`)}
                                    </span>
                                </div>
                                <div className="relative flex items-center gap-2">
                                    <span className="text-[10px] opacity-40 shrink-0">{t(`combat.${INTENSITY_KEYS[0]}`)}</span>
                                    <input
                                        type="range"
                                        min={0}
                                        max={INTENSITY_KEYS.length - 1}
                                        step={1}
                                        value={intensityIndex}
                                        onChange={(e) => setIntensityIndex(Number(e.target.value))}
                                        className="range range-xs flex-1"
                                        style={{
                                            accentColor:
                                                intensityIndex === 0 ? "#38bdf8"
                                                : intensityIndex === 1 ? "#34d399"
                                                : intensityIndex === 2 ? "#fbbf24"
                                                : intensityIndex === 3 ? "#fb923c"
                                                : "#f87171"
                                        }}
                                    />
                                    <span className="text-[10px] opacity-40 shrink-0">{t(`combat.${INTENSITY_KEYS[INTENSITY_KEYS.length - 1]}`)}</span>
                                </div>
                                <div className="flex justify-between px-8">
                                    {INTENSITY_KEYS.map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                                i === intensityIndex ? "bg-base-content" : "bg-base-content/20"
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Free shot button */}
                        <button
                            className="btn btn-outline btn-sm gap-2 w-full"
                            onClick={() => {
                                rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, "1d4", (result) => {
                                    const diceRoll = diceTotal(result);
                                    const total = diceRoll + dexMod;
                                    dispatchRoll({
                                        label: t("combat.freeShot"),
                                        diceRolled: diceRoll,
                                        modifier: dexMod,
                                        total,
                                        diceCommand: "1d4",
                                    });
                                });
                            }}
                        >
                            <GiPerspectiveDiceSixFacesRandom size={18} />
                            {t("combat.freeShot")} 1d4 {dexMod >= 0 ? "+" : ""}{dexMod}
                            <span className="badge badge-xs badge-warning">1 PM</span>
                        </button>

                        {/* Unlocked passives */}
                        {unlockedPassives.length > 0 && (
                            <ul className="space-y-1 text-sm">
                                {unlockedPassives.map(p => {
                                    const translatedEffect = getWeaponPassive(weaponId, p.level);
                                    const effectText = translatedEffect || p.effect;
                                    return (
                                        <li key={p.level} className="flex items-start gap-2">
                                            <span className={`font-semibold shrink-0 ${levelColor(p.level)}`}>
                                                Level {p.level}
                                            </span>
                                            <span className="flex-1 opacity-90">: {effectText}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
