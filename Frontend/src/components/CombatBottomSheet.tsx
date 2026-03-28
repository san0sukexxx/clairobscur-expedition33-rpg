import type { RefObject, MutableRefObject } from "react";
import { useEffect, useMemo, useState } from "react";
import { Drawer } from "vaul";
import { FaChevronUp } from "react-icons/fa";
import { GiPerspectiveDiceSixFacesRandom } from "react-icons/gi";
import type { GetPlayerResponse } from "../api/APIPlayer";
import type { DiceBoardRef } from "./DiceBoard";
import { useWeaponInfo } from "../hooks/player/useWeaponInfo";
import { calculateAttackBonus, calculateDamageBonus, calculateProficiencyBonus, getAbilityModifier, getBasicAttackAttribute } from "../utils/AttackCalculator";
import { getWeaponDamageDice, calculateWeaponDexterityBonus } from "../utils/WeaponCalculator";
import { playerPictosTotalSpeed, abilityScoreCap } from "../utils/PlayerCalculator";
import { rollWithTimeout } from "../utils/RollUtils";
import { diceTotal } from "../utils/DiceCalculator";
import { dispatchRoll } from "../utils/rollDispatcher";
import { renderTextWithDiceButtons } from "../utils/DiceTextRenderer";
import { APIGameLog } from "../api/APIGameLog";
import { APIBattle } from "../api/APIBattle";
import { getPlayerCharacter } from "../utils/CharacterUtils";
import { getWeaponPassive, toKebabCase, hasWeapon, t, getPictoName, getPictoDescription } from "../i18n";
import AnimatedStatBar from "./AnimatedStatBar";
import { isGustave } from "../constants/player/characterIds";
import { getPictoByName, getDisabledPictoIds } from "../utils/PictoUtils";
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
    activeSkillId?: string | null;
    onHighlightStatus?: () => void;
}

export default function CombatBottomSheet({ player, open, onOpen, onClose, diceBoardRef, timeoutDiceBoardRef, activeSkillId, onHighlightStatus }: CombatBottomSheetProps) {
    const { weaponInfo, weaponList } = useWeaponInfo(player);
    const { weapon, details } = weaponInfo;
    const battleChar = getPlayerCharacter(player);

    const effectiveAbilityKey = useMemo(() => {
        return activeSkillId
            ? undefined
            : getBasicAttackAttribute(player?.playerSheet?.characterId);
    }, [activeSkillId, player?.playerSheet?.characterId]);

    const attackBonus = useMemo(() => {
        if (!player) return null;
        return calculateAttackBonus(player, weaponInfo, effectiveAbilityKey);
    }, [player, weaponInfo, effectiveAbilityKey]);

    const damageBonus = useMemo(() => {
        if (!player) return null;
        return calculateDamageBonus(player, weaponInfo, effectiveAbilityKey);
    }, [player, weaponInfo, effectiveAbilityKey]);

    const dexMod = useMemo(() => {
        const baseDex = player?.playerSheet?.abilityScores?.dexterity ?? 10;
        const effectiveDex = Math.min(abilityScoreCap(player), baseDex + calculateWeaponDexterityBonus(weaponInfo) + playerPictosTotalSpeed(player));
        return getAbilityModifier(effectiveDex);
    }, [player, weaponInfo]);

    const freeShotHitMod = useMemo(() => {
        const level = player?.playerSheet?.totalPoints ?? 1;
        return dexMod + calculateProficiencyBonus(level);
    }, [dexMod, player?.playerSheet?.totalPoints]);

    const INTENSITY_KEYS = ["intensityLow", "intensityMedium", "intensityHigh", "intensityVeryHigh", "intensityExtreme", "intensityMaximum"] as const;
    const INTENSITY_DICE_MULTIPLIER = [1, 1, 2, 3, 4, 5];
    const [intensityIndex, setIntensityIndex] = useState(1);
    const [freeShotHintExpanded, setFreeShotHintExpanded] = useState(false);

    const [localMp, setLocalMp] = useState<number | null>(null);
    useEffect(() => { setLocalMp(null); }, [battleChar?.magicPoints]);
    const currentMp = localMp ?? (battleChar?.magicPoints ?? 0);

    const hasWeaponEquipped = !!(weapon && details);
    const baseDamageDice = hasWeaponEquipped ? getWeaponDamageDice(weapon!.level) : "";
    const multiplier = INTENSITY_DICE_MULTIPLIER[intensityIndex];
    const damageDice = baseDamageDice.replace(/^(\d+)/, (_, n) => String(Number(n) * multiplier));
    const weaponId = hasWeaponEquipped ? getWeaponTranslationId(details!.name, weaponList) : "";
    const unlockedPassives = hasWeaponEquipped ? details!.passives.filter(p => p.level <= weapon!.level) : [];

    return (
        <>
            {/* Trigger button */}
            {!open && (
                <button
                    onClick={onOpen}
                    className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-[42] flex justify-center py-2 bg-neutral/50 border-t border-neutral-content/10 cursor-pointer hover:bg-neutral/60 transition-colors"
                >
                    <FaChevronUp className="text-neutral-content/60" size={16} />
                </button>
            )}

            <Drawer.Root
                open={open}
                onOpenChange={(v) => v ? onOpen() : onClose()}
                noBodyStyles
            >
                <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[41]" />
                    <Drawer.Content
                        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-[42] flex flex-col bg-base-100 rounded-t-2xl outline-none"
                        style={{ height: "85dvh" }}
                    >
                        {/* Drag handle */}
                        <div className="flex justify-center pt-3 pb-2 shrink-0">
                            <div className="w-10 h-1.5 rounded-full bg-base-300" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto px-4 pb-40 space-y-4">
                            {!hasWeaponEquipped && (
                                <p className="text-sm opacity-50 text-center py-8">{t("combat.noWeaponEquipped")}</p>
                            )}
                            {hasWeaponEquipped && <>
                            {/* Weapon header */}
                            <div className="flex items-center gap-3">
                                <div className="relative w-16 h-12 shrink-0">
                                    <img
                                        src={`/weapons/${details!.name}.webp`}
                                        alt={details.name}
                                        className="absolute inset-0 m-auto object-contain w-full h-full"
                                        style={{ rotate: `${details.rotation}deg` }}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div>
                                        <span className="font-bold text-base">{weapon.id}</span>
                                        <span className="ml-2 text-sm opacity-60">{getElementName(details.attributes.element)} {ELEMENT_EMOTE[details.attributes.element] ?? "❓"}</span>
                                    </div>
                                    {(() => {
                                        const maxMp = battleChar?.maxMagicPoints ?? 0;
                                        const pct = maxMp > 0 ? (currentMp / maxMp) * 100 : 0;
                                        return (
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-semibold opacity-50 shrink-0">AP</span>
                                                <div className="flex-1">
                                                    <AnimatedStatBar
                                                        value={pct}
                                                        label="AP"
                                                        fillClass="bg-info"
                                                        ghostClass="bg-info/30"
                                                    />
                                                </div>
                                                <span className="text-xs opacity-60 shrink-0">{currentMp}/{maxMp}</span>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Weapon attack buttons */}
                            <div className="border border-base-300 rounded-lg p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold uppercase tracking-wide opacity-50">
                                        {t("combat.attack")} ({attackBonus ? t(`setup.abilityAbbr.${attackBonus.abilityKey}`) : ""})
                                    </span>
                                    {!activeSkillId && (
                                        <button
                                            className="badge badge-xs badge-warning cursor-pointer hover:brightness-90 active:scale-95"
                                            onClick={async () => {
                                                if (!battleChar) return;
                                                const newMp = currentMp + 1;
                                                setLocalMp(newMp);
                                                await APIBattle.updateCharacterMp(battleChar.battleID, newMp);
                                                onHighlightStatus?.();
                                            }}
                                        >
                                            +1 PA
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-2 mt-2">
                                    {attackBonus && (
                                        <button
                                            className="btn btn-outline btn-sm gap-2 flex-1"
                                            onClick={() => {
                                                rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, "1d20", (result) => {
                                                    const d20Roll = diceTotal(result);
                                                    const total = d20Roll + attackBonus.total;
                                                    const diceValues: number[] = [];
                                                    for (const group of result) {
                                                        if (Array.isArray(group.rolls)) {
                                                            for (const roll of group.rolls) diceValues.push(roll.value);
                                                        }
                                                    }
                                                    dispatchRoll({
                                                        label: t("combat.attack"),
                                                        diceRolled: d20Roll,
                                                        modifier: attackBonus.total,
                                                        total,
                                                        diceCommand: "1d20",
                                                        diceValues,
                                                    });
                                                    if (player?.id) {
                                                        APIGameLog.create(player.id, {
                                                            rollType: "attack",
                                                            diceRolled: d20Roll,
                                                            modifier: attackBonus.total,
                                                            total,
                                                            diceCommand: "1d20",
                                                        });
                                                    }
                                                });
                                            }}
                                        >
                                            <GiPerspectiveDiceSixFacesRandom size={18} />
                                            {t("combat.hit")} {attackBonus.total >= 0 ? "+" : ""}{attackBonus.total}
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
                                                    const diceValues: number[] = [];
                                                    for (const group of result) {
                                                        if (Array.isArray(group.rolls)) {
                                                            for (const roll of group.rolls) diceValues.push(roll.value);
                                                        }
                                                    }
                                                    dispatchRoll({
                                                        label: t("playerPage.basicAttack.damage"),
                                                        diceRolled: diceRoll,
                                                        modifier: effectiveBonus,
                                                        total,
                                                        diceCommand: damageDice,
                                                        diceValues,
                                                    });
                                                    if (player?.id) {
                                                        APIGameLog.create(player.id, {
                                                            rollType: "attack",
                                                            abilityKey: "damage",
                                                            diceRolled: diceRoll,
                                                            modifier: effectiveBonus,
                                                            total,
                                                            diceCommand: damageDice,
                                                        });
                                                    }
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
                                            : intensityIndex === 4 ? "text-red-400"
                                            : "text-fuchsia-400"
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
                                                    : intensityIndex === 4 ? "#f87171"
                                                    : "#e879f9"
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

                            {/* Free shot section */}
                            <div className="border border-base-300 rounded-lg p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold uppercase tracking-wide opacity-50">
                                        {t("combat.freeShot")} ({t("setup.abilityAbbr.dexterity")})
                                    </span>
                                    <button
                                        className="badge badge-xs badge-warning cursor-pointer hover:brightness-90 active:scale-95"
                                        onClick={async () => {
                                            if (!battleChar) return;
                                            if (currentMp <= 0) return;
                                            const newMp = currentMp - 1;
                                            setLocalMp(newMp);
                                            await APIBattle.updateCharacterMp(battleChar.battleID, newMp);
                                            onHighlightStatus?.();
                                        }}
                                    >
                                        -1 PA
                                    </button>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <button
                                        className="btn btn-outline btn-sm gap-2 flex-1"
                                        onClick={() => {
                                            rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, "1d20", (result) => {
                                                const d20Roll = diceTotal(result);
                                                const total = d20Roll + freeShotHitMod;
                                                const diceValues: number[] = [];
                                                for (const group of result) {
                                                    if (Array.isArray(group.rolls)) {
                                                        for (const roll of group.rolls) diceValues.push(roll.value);
                                                    }
                                                }
                                                dispatchRoll({
                                                    label: `${t("combat.freeShot")} - ${t("combat.attack")}`,
                                                    diceRolled: d20Roll,
                                                    modifier: freeShotHitMod,
                                                    total,
                                                    diceCommand: "1d20",
                                                    diceValues,
                                                });
                                                if (player?.id) {
                                                    APIGameLog.create(player.id, {
                                                        rollType: "attack",
                                                        abilityKey: "freeShot",
                                                        diceRolled: d20Roll,
                                                        modifier: freeShotHitMod,
                                                        total,
                                                        diceCommand: "1d20",
                                                    });
                                                }
                                            });
                                        }}
                                    >
                                        <GiPerspectiveDiceSixFacesRandom size={18} />
                                        {t("combat.hit")} {freeShotHitMod >= 0 ? "+" : ""}{freeShotHitMod}
                                    </button>
                                    <button
                                        className="btn btn-outline btn-sm gap-2 flex-1"
                                        onClick={() => {
                                            rollWithTimeout(diceBoardRef, timeoutDiceBoardRef, "1d4", (result) => {
                                                const diceRoll = diceTotal(result);
                                                const total = diceRoll + dexMod;
                                                const diceValues: number[] = [];
                                                for (const group of result) {
                                                    if (Array.isArray(group.rolls)) {
                                                        for (const roll of group.rolls) diceValues.push(roll.value);
                                                    }
                                                }
                                                dispatchRoll({
                                                    label: `${t("combat.freeShot")} - ${t("playerPage.basicAttack.damage")}`,
                                                    diceRolled: diceRoll,
                                                    modifier: dexMod,
                                                    total,
                                                    diceCommand: "1d4",
                                                    diceValues,
                                                });
                                                if (player?.id) {
                                                    APIGameLog.create(player.id, {
                                                        rollType: "attack",
                                                        abilityKey: "freeShotDamage",
                                                        diceRolled: diceRoll,
                                                        modifier: dexMod,
                                                        total,
                                                        diceCommand: "1d4",
                                                    });
                                                }
                                            });
                                        }}
                                    >
                                        <GiPerspectiveDiceSixFacesRandom size={18} />
                                        1d4{dexMod !== 0 ? ` ${dexMod >= 0 ? "+" : ""}${dexMod}` : ""}
                                    </button>
                                </div>
                                <p className="text-xs opacity-40 mt-1">
                                    {freeShotHintExpanded ? t("combat.freeShotHint") : t("combat.freeShotHintShort")}{" "}
                                    <button className="underline text-info" onClick={() => setFreeShotHintExpanded(e => !e)}>
                                        {freeShotHintExpanded ? t("common.readLess") : t("common.readMore")}
                                    </button>
                                </p>
                            </div>

                            {/* Passives sections */}
                            {(() => {
                                const disabledIds = getDisabledPictoIds(player);
                                const equippedPictos = (player?.pictos ?? []).filter(p => typeof p.slot === "number" && !disabledIds.has(p.id));
                                const equippedLuminas = (player?.luminas ?? []).filter(l => l.isEquiped);
                                const hasPictoLumina = equippedPictos.length > 0 || equippedLuminas.length > 0;

                                return (
                                    <div className="space-y-4">
                                        {/* Weapon passives */}
                                        {unlockedPassives.length > 0 && !isGustave(player?.playerSheet?.characterId) && (
                                            <div>
                                                {hasPictoLumina && (
                                                    <span className="text-xs font-semibold uppercase tracking-wide opacity-50">{t("combat.weaponPassives")}</span>
                                                )}
                                                <ul className="space-y-2 text-sm mt-1">
                                                    {unlockedPassives.map(p => {
                                                        const translatedEffect = getWeaponPassive(weaponId, p.level);
                                                        const effectText = translatedEffect || p.effect;
                                                        return (
                                                            <li key={p.level} className="flex flex-col">
                                                                <span className={`font-semibold ${levelColor(p.level)}`}>
                                                                    Level {p.level}
                                                                </span>
                                                                <span className="opacity-90">{renderTextWithDiceButtons(effectText, weapon?.id ?? "", diceBoardRef, timeoutDiceBoardRef, player?.id)}</span>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Pictos & Luminas passives */}
                                        {hasPictoLumina && (
                                            <div>
                                                <span className="text-xs font-semibold uppercase tracking-wide opacity-50">Pictos / Luminas</span>
                                                <ul className="space-y-2 text-sm mt-1">
                                                    {equippedPictos.map(picto => {
                                                        const info = getPictoByName(picto.pictoId);
                                                        const name = info?.name ?? picto.pictoId;
                                                        const description = info?.description ?? "";
                                                        return (
                                                            <li key={`picto-${picto.id}`} className="flex flex-col">
                                                                <span className="font-semibold text-primary">{name}</span>
                                                                <span className="opacity-90">{description ? renderTextWithDiceButtons(description, name, diceBoardRef, timeoutDiceBoardRef, player?.id) : ""}</span>
                                                            </li>
                                                        );
                                                    })}
                                                    {equippedLuminas.map(lumina => {
                                                        const info = getPictoByName(lumina.pictoId);
                                                        const name = info?.name ?? lumina.pictoId;
                                                        const description = info?.description ?? "";
                                                        return (
                                                            <li key={`lumina-${lumina.id}`} className="flex flex-col">
                                                                <span className="font-semibold text-primary">{name}</span>
                                                                <span className="opacity-90">{description ? renderTextWithDiceButtons(description, name, diceBoardRef, timeoutDiceBoardRef, player?.id) : ""}</span>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                            </>}
                        </div>
                    </Drawer.Content>
                </Drawer.Portal>
            </Drawer.Root>
        </>
    );
}
