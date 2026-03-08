import { useState, useMemo, useEffect } from "react";
import { FaChevronDown, FaChevronUp, FaGift } from "react-icons/fa";
import { GiCrossedSwords } from "react-icons/gi";
import { WeaponsDataLoader } from "../utils/WeaponsDataLoader";
import { displayWeaponPlusPower, displayWeaponVitalityBonus, displayWeaponDefenseBonus, displayWeaponDexterityBonus, displayWeaponProficiencyBonus, getWeaponDamageDice } from "../utils/WeaponCalculator";
import { ELEMENT_EMOTE, getElementName } from "../utils/ElementUtils";
import { t, getWeaponName, getWeaponPassive } from "../i18n";
import { getLocationById } from "../utils/LocationUtils";
import { APIPlayerWeapons } from "../api/APIPlayerWeapons";
import { getCharacterLabelById } from "../utils/CharacterUtils";
import { useToast } from "./Toast";
import type { WeaponDTO, AttributeType } from "../types/WeaponDTO";
import type { GetPlayerResponse } from "../api/APIPlayer";
import type { Campaign } from "../api/APICampaign";

interface WeaponEntry {
    weapon: WeaponDTO;
    character: string;
    weaponId: string;
}

const CHARACTER_LABELS: Record<string, string> = {
    gustave: "Gustave",
    verso: "Verso",
    maelle: "Maelle",
    lune: "Lune",
    sciel: "Sciel",
    monoco: "Monoco",
};

const CHARACTERS = ["gustave", "verso", "maelle", "lune", "sciel", "monoco"] as const;

const SCALING_CONFIG: { key: AttributeType; label: () => string; display: (rank: string, level: number) => string }[] = [
    { key: "vitality", label: () => t("weapons.vitality"), display: displayWeaponVitalityBonus },
    { key: "dexterity", label: () => t("weapons.dexterity"), display: displayWeaponDexterityBonus },
    { key: "defense", label: () => t("weapons.defense"), display: displayWeaponDefenseBonus },
    { key: "luck", label: () => t("weapons.proficiencyBonus"), display: displayWeaponProficiencyBonus },
];

function buildWeaponList(): WeaponEntry[] {
    const entries: WeaponEntry[] = [];
    const seen = new Set<string>();

    for (const char of CHARACTERS) {
        const file = WeaponsDataLoader.fileForCharacter(char);
        const weapons = WeaponsDataLoader.getByFile(file);
        for (const w of weapons) {
            const key = `${char}:${w.name}`;
            if (seen.has(key)) continue;

            // Gustave can't use Verso exclusives
            if (char === "gustave" && WeaponsDataLoader.VERSO_EXCLUSIVE_WEAPONS.has(w.name)) continue;
            // Verso can't use non-exclusive swords (shared ones are Gustave's)
            if (char === "verso" && !WeaponsDataLoader.VERSO_EXCLUSIVE_WEAPONS.has(w.name)) continue;

            seen.add(key);
            entries.push({
                weapon: w,
                character: char,
                weaponId: w.name.toLowerCase().replace(/\s+/g, "-"),
            });
        }
    }

    entries.sort((a, b) => getWeaponName(a.weaponId).localeCompare(getWeaponName(b.weaponId), "pt-BR"));
    return entries;
}

interface WeaponsTabProps {
    focusWeaponId?: string | null;
    onFocusHandled?: () => void;
    players?: GetPlayerResponse[];
    campaignInfo?: Campaign | null;
}

export default function CampaignAdminWeaponsTab({ focusWeaponId, onFocusHandled, players, campaignInfo }: WeaponsTabProps) {
    const [filterText, setFilterText] = useState("");
    const [expandedKey, setExpandedKey] = useState<string | null>(null);
    const [giveModalEntry, setGiveModalEntry] = useState<WeaponEntry | null>(null);
    const [currentLocationOnly, setCurrentLocationOnly] = useState(() => localStorage.getItem("weapons.currentLocationOnly") === "true");
    const { showToast } = useToast();

    const allWeapons = useMemo(() => buildWeaponList(), []);

    useEffect(() => {
        if (focusWeaponId) {
            const entry = allWeapons.find((e) => e.weaponId === focusWeaponId);
            if (entry) {
                const key = `${entry.character}:${entry.weapon.name}`;
                setExpandedKey(key);
                setFilterText("");
                setCurrentLocationOnly(false);
                requestAnimationFrame(() => {
                    document.getElementById(`weapon-${focusWeaponId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                });
            }
            onFocusHandled?.();
        }
    }, [focusWeaponId]);

    const currentLocationLootIds = useMemo(() => {
        if (!currentLocationOnly || !campaignInfo?.currentLocationId) return null;
        const loc = getLocationById(campaignInfo.currentLocationId);
        if (!loc?.loot) return new Set<string>();
        return new Set(loc.loot.filter(r => r.type === "weapon").map(r => r.itemId));
    }, [currentLocationOnly, campaignInfo?.currentLocationId]);

    const weapons = useMemo(() => {
        let filtered = currentLocationLootIds
            ? allWeapons.filter((e) => currentLocationLootIds.has(e.weaponId))
            : allWeapons;
        if (!filterText.trim()) return filtered;
        const search = filterText.toLowerCase();
        return filtered.filter((e) =>
            getWeaponName(e.weaponId).toLowerCase().includes(search) ||
            e.weapon.name.toLowerCase().includes(search) ||
            CHARACTER_LABELS[e.character]?.toLowerCase().includes(search)
        );
    }, [filterText, allWeapons, currentLocationLootIds]);

    return (
        <div className="card bg-base-100 shadow">
            <div className="card-body">
                <div className="flex items-center justify-between">
                    <h2 className="card-title flex items-center gap-2">
                        <GiCrossedSwords className="opacity-60" />
                        {t("tabs.weapons")}
                    </h2>
                    <span className="badge badge-ghost">{weapons.length}</span>
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
                            onChange={(e) => { setCurrentLocationOnly(e.target.checked); localStorage.setItem("weapons.currentLocationOnly", String(e.target.checked)); }}
                        />
                        <span className="text-sm">{t("locations.currentLocationOnly")}</span>
                    </label>
                )}

                {weapons.length === 0 && (
                    <div className="alert alert-info mt-4 text-sm">
                        Nenhuma arma encontrada.
                    </div>
                )}

                <div className="mt-4 flex flex-col divide-y divide-base-300">
                    {weapons.map((entry) => {
                        const key = `${entry.character}:${entry.weapon.name}`;
                        const isExpanded = expandedKey === key;
                        const name = getWeaponName(entry.weaponId);

                        return (
                            <div key={key} id={`weapon-${entry.weaponId}`} className="py-3 px-1">
                                <div
                                    className="flex items-center gap-3 cursor-pointer"
                                    onClick={() => setExpandedKey(isExpanded ? null : key)}
                                >
                                    <div className="w-10 h-10 rounded bg-base-300 overflow-hidden flex items-center justify-center shrink-0">
                                        <img
                                            src={`/weapons/${entry.weapon.name}.webp`}
                                            alt={name}
                                            className="w-full h-full object-contain"
                                            style={{ transform: `rotate(${entry.weapon.rotation}deg)` }}
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                        />
                                    </div>

                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="font-semibold text-sm">{name}</span>
                                        <span className="text-xs opacity-60">{CHARACTER_LABELS[entry.character]}</span>
                                    </div>

                                    <div className="shrink-0">
                                        {isExpanded
                                            ? <FaChevronUp className="w-3 h-3 opacity-50" />
                                            : <FaChevronDown className="w-3 h-3 opacity-50" />
                                        }
                                    </div>
                                </div>

                                {isExpanded && (
                                    <WeaponDetails
                                        entry={entry}
                                        showGive={!!players?.length}
                                        onGive={() => setGiveModalEntry(entry)}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Give to character modal */}
                {giveModalEntry && players && (
                    <GiveWeaponModal
                        entry={giveModalEntry}
                        players={players}
                        onClose={() => setGiveModalEntry(null)}
                        onGive={async (player, playerName) => {
                            const existing = player.weapons?.find(w => w.id.toLowerCase() === giveModalEntry.weaponId.toLowerCase());
                            if (existing) {
                                await APIPlayerWeapons.update(player.id, giveModalEntry.weapon.name, { level: existing.level + 1 });
                            } else {
                                await APIPlayerWeapons.add({ playerId: player.id, weaponId: giveModalEntry.weapon.name, level: 1 });
                            }
                            showToast(t("weapons.weaponGranted", { name: playerName }));
                            setGiveModalEntry(null);
                        }}
                    />
                )}
            </div>
        </div>
    );
}

function WeaponDetails({ entry, showGive, onGive }: { entry: WeaponEntry; showGive?: boolean; onGive?: () => void }) {
    const [level, setLevel] = useState(1);
    const { weapon, weaponId } = entry;
    const { attributes } = weapon;

    const scalingEntries = SCALING_CONFIG
        .filter(({ key }) => attributes.scaling[key] != null)
        .map(({ key, label, display }) => ({
            label: label(),
            value: display(attributes.scaling[key], level),
        }));

    return (
        <div className="bg-base-200/50 rounded-lg p-3 mt-2 space-y-3 text-sm">
            {/* Level selector */}
            <div>
                <span className="font-bold text-xs">{t("pictos.level")}</span>
                <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4].map((lvl) => (
                        <button
                            key={lvl}
                            className={`btn btn-xs ${level === lvl ? "btn-primary" : "btn-ghost"}`}
                            onClick={() => setLevel(lvl)}
                        >
                            {lvl}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div>
                <span className="font-bold text-xs">{t("combatAdmin.npcDetails.attributes")}</span>
                <div className="flex flex-wrap gap-2 mt-1">
                    <div className="bg-base-300 rounded-lg px-3 py-1.5 flex items-center gap-2">
                        <span className="text-xs font-bold opacity-70">{t("weapons.power")}</span>
                        <span className="font-bold text-primary">{displayWeaponPlusPower(attributes.power, level)}</span>
                    </div>
                    <div className="bg-base-300 rounded-lg px-3 py-1.5 flex items-center gap-2">
                        <span className="text-xs font-bold opacity-70">{t("weapons.dices")}</span>
                        <span className="font-bold text-primary">{getWeaponDamageDice(level)}</span>
                    </div>
                    <div className="bg-base-300 rounded-lg px-3 py-1.5 flex items-center gap-2">
                        <span className="text-xs font-bold opacity-70">{t("weapons.element")}</span>
                        <span className="font-bold text-primary">{ELEMENT_EMOTE[attributes.element] ?? ""}</span>
                        <span className="font-bold text-primary">{getElementName(attributes.element)}</span>
                    </div>
                </div>
            </div>

            {/* Scaling */}
            {scalingEntries.length > 0 && (
                <div>
                    <span className="font-bold text-xs">{t("combatAdmin.npcDetails.attributes")}</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {scalingEntries.map(({ label, value }) => (
                            <div key={label} className="bg-base-300 rounded-lg px-3 py-1.5 flex items-center gap-2">
                                <span className="text-xs font-bold opacity-70">{label}</span>
                                <span className="font-bold text-primary">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Passives */}
            {weapon.passives.length > 0 && (
                <div>
                    <span className="font-bold text-xs">{t("weapons.passives")}</span>
                    <div className="flex flex-col gap-1 mt-1">
                        {weapon.passives.map((p) => {
                            const unlocked = level >= p.level;
                            const passiveText = getWeaponPassive(weaponId, p.level) || p.effect;
                            return (
                                <div
                                    key={p.level}
                                    className={`rounded-md px-3 py-1.5 text-xs ${unlocked ? "bg-base-300" : "bg-base-300/40 opacity-50"}`}
                                >
                                    <span className="font-bold">Lv.{p.level}</span>
                                    <span className="ml-2">{passiveText}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {showGive && (
                <button className="btn btn-sm btn-outline btn-primary gap-2" onClick={onGive}>
                    <FaGift className="w-3 h-3" />
                    {t("weapons.giveToCharacter")}
                </button>
            )}
        </div>
    );
}

function GiveWeaponModal({ entry, players, onClose, onGive }: {
    entry: WeaponEntry;
    players: GetPlayerResponse[];
    onClose: () => void;
    onGive: (player: GetPlayerResponse, playerName: string) => void;
}) {
    const MAX_LEVEL = 4;
    const name = getWeaponName(entry.weaponId);
    return (
        <dialog className="modal modal-open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal-box">
                <h3 className="font-bold text-lg mb-1">{t("weapons.giveToCharacter")}</h3>
                <p className="text-sm opacity-70 mb-4">{t("weapons.selectCharacterToGive")}</p>
                <p className="text-sm font-semibold mb-3">{name}</p>
                <div className="flex flex-col gap-2">
                    {players.map((p) => {
                        const pName = p.playerSheet?.name || `#${p.id}`;
                        const charLabel = getCharacterLabelById(p.playerSheet?.characterId);
                        const canUse = WeaponsDataLoader.canCharacterUseWeapon(p.playerSheet?.characterId, entry.weaponId);
                        const existing = p.weapons?.find(w => w.id.toLowerCase() === entry.weaponId.toLowerCase());
                        const currentLevel = existing?.level ?? 0;
                        const isMaxLevel = currentLevel >= MAX_LEVEL;
                        const isDisabled = !canUse || isMaxLevel;

                        return (
                            <button
                                key={p.id}
                                className={`btn btn-sm justify-start gap-2 ${isDisabled ? "btn-disabled" : "btn-outline"}`}
                                disabled={isDisabled}
                                title={!canUse ? t("rewards.cannotUse") : isMaxLevel ? t("weapons.maxLevel") : undefined}
                                onClick={() => onGive(p, pName)}
                            >
                                <span className="font-semibold">{pName}</span>
                                {charLabel && <span className="text-xs opacity-60">({charLabel})</span>}
                                {!canUse && <span className="text-xs opacity-50 ml-auto">{t("rewards.cannotUse")}</span>}
                                {canUse && existing && (
                                    <span className={`text-xs ml-auto ${isMaxLevel ? "opacity-50" : "opacity-70"}`}>
                                        {isMaxLevel ? t("weapons.maxLevel") : t("weapons.currentLevel", { level: currentLevel })}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
                <div className="modal-action">
                    <button className="btn btn-ghost btn-sm" onClick={onClose}>{t("common.cancel")}</button>
                </div>
            </div>
        </dialog>
    );
}
