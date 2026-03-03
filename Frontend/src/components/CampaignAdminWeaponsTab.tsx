import { useState, useMemo } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { GiCrossedSwords } from "react-icons/gi";
import { WeaponsDataLoader } from "../utils/WeaponsDataLoader";
import { displayWeaponPlusPower, displayWeaponVitalityBonus, displayWeaponDefenseBonus, displayWeaponDexterityBonus, displayWeaponProficiencyBonus, getWeaponDamageDice } from "../utils/WeaponCalculator";
import { ELEMENT_EMOTE, getElementName } from "../utils/ElementUtils";
import { t, getWeaponName, getWeaponPassive } from "../i18n";
import type { WeaponDTO, AttributeType } from "../types/WeaponDTO";

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

export default function CampaignAdminWeaponsTab() {
    const [filterText, setFilterText] = useState("");
    const [expandedKey, setExpandedKey] = useState<string | null>(null);

    const allWeapons = useMemo(() => buildWeaponList(), []);

    const weapons = useMemo(() => {
        if (!filterText.trim()) return allWeapons;
        const search = filterText.toLowerCase();
        return allWeapons.filter((e) =>
            getWeaponName(e.weaponId).toLowerCase().includes(search) ||
            e.weapon.name.toLowerCase().includes(search) ||
            CHARACTER_LABELS[e.character]?.toLowerCase().includes(search)
        );
    }, [filterText, allWeapons]);

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
                            <div key={key} className="py-3 px-1">
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

                                {isExpanded && <WeaponDetails entry={entry} />}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function WeaponDetails({ entry }: { entry: WeaponEntry }) {
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
        </div>
    );
}
