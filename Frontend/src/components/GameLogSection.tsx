import { useEffect, useState, useCallback } from "react";
import { FaSync } from "react-icons/fa";
import { APIGameLog, type GameLogEntry } from "../api/APIGameLog";
import type { GetPlayerResponse } from "../api/APIPlayer";
import { t } from "../i18n";

// Skill id → i18n key
const SKILL_LABEL_KEY: Record<string, string> = {
    acrobatics:    "skills.acrobatics",
    animalHandling:"skills.animalHandling",
    arcana:        "skills.arcana",
    athletics:     "skills.athletics",
    deception:     "skills.deception",
    history:       "skills.history",
    insight:       "skills.insight",
    intimidation:  "skills.intimidation",
    investigation: "skills.investigation",
    medicine:      "skills.medicine",
    nature:        "skills.nature",
    perception:    "skills.perception",
    performance:   "skills.performance",
    persuasion:    "skills.persuasion",
    religion:      "skills.religion",
    sleightOfHand: "skills.sleightOfHand",
    stealth:       "skills.stealth",
    survival:      "skills.survival",
};

// Ability key → i18n key
const ABILITY_LABEL_KEY: Record<string, string> = {
    strength:     "characterSheet.strength",
    dexterity:    "characterSheet.dexterity",
    constitution: "characterSheet.constitution",
    intelligence: "characterSheet.intelligence",
    wisdom:       "characterSheet.wisdom",
    charisma:     "characterSheet.charisma",
    armorClass:   "characterSheet.armorClass",
    initiative:   "characterSheet.initiative",
};

function getRollLabel(entry: GameLogEntry): string {
    if (entry.rollType === "savingThrow" && entry.abilityKey) {
        const ability = t(ABILITY_LABEL_KEY[entry.abilityKey] ?? entry.abilityKey).slice(0, 3).toUpperCase();
        return `${ability}: ${t("gameLog.save")}`;
    }
    if (entry.rollType === "abilityCheck" && entry.abilityKey) {
        return t(ABILITY_LABEL_KEY[entry.abilityKey] ?? entry.abilityKey);
    }
    if (entry.rollType === "skill" && entry.skillId) {
        return t(SKILL_LABEL_KEY[entry.skillId] ?? entry.skillId);
    }
    if (entry.rollType === "sense" && entry.senseKey) {
        return t(entry.senseKey);
    }
    if (entry.rollType === "customRoll") {
        return t("characterSheet.customRoll");
    }
    return entry.rollType;
}

function getResultString(entry: GameLogEntry): string {
    if (entry.rollType === "customRoll") {
        const values = entry.abilityKey || String(entry.total);
        return `${values} = ${entry.total}`;
    }
    const mod = entry.modifier;
    const sign = mod >= 0 ? "+" : "";
    if (mod === 0) return `${entry.diceRolled} = ${entry.total}`;
    return `${entry.diceRolled}${sign}${mod} = ${entry.total}`;
}

function getRelativeTime(isoString: string): string {
    const now = Date.now();
    const then = new Date(isoString).getTime();
    const diffMs = now - then;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return t("gameLog.justNow");
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} ${t("gameLog.minutesAgo")}`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} ${t("gameLog.hoursAgo")}`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay} ${t("gameLog.daysAgo")}`;
}

interface Props {
    player?: GetPlayerResponse | null;
    campaignId?: number | null;
}

export function GameLogSection({ player, campaignId }: Props) {
    const [entries, setEntries] = useState<GameLogEntry[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchLog = useCallback(async () => {
        setLoading(true);
        try {
            if (campaignId) {
                const data = await APIGameLog.listForCampaign(campaignId);
                setEntries(data);
            } else if (player?.id) {
                const data = await APIGameLog.listForPlayer(player.id);
                setEntries(data);
            }
        } catch {
            // silently ignore
        } finally {
            setLoading(false);
        }
    }, [player?.id, campaignId]);

    useEffect(() => {
        fetchLog();
        const interval = setInterval(fetchLog, 2000);
        return () => clearInterval(interval);
    }, [fetchLog]);

    return (
        <div className="rounded-box bg-base-100 shadow p-4 flex flex-col gap-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <p className="text-[9px] font-extrabold tracking-widest opacity-70 uppercase">
                    {t("gameLog.title")}
                </p>
                <button
                    onClick={fetchLog}
                    disabled={loading}
                    className="btn btn-ghost btn-xs btn-circle"
                    aria-label={t("gameLog.refresh")}
                >
                    <FaSync className={`text-sm ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {/* Entries */}
            {entries.length === 0 ? (
                <p className="text-sm opacity-50 text-center py-6">{t("gameLog.empty")}</p>
            ) : (
                <div className="flex flex-col gap-2">
                    {entries.map((entry) => (
                        <GameLogCard key={entry.id} entry={entry} />
                    ))}
                </div>
            )}
        </div>
    );
}

function GameLogCard({ entry }: { entry: GameLogEntry }) {
    const avatarSrc = entry.characterId
        ? `/characters/${entry.characterId}.webp`
        : null;

    const rollLabel = getRollLabel(entry);
    const resultStr = getResultString(entry);
    const timeStr = getRelativeTime(entry.createdAt);

    return (
        <div className="flex items-center gap-3 bg-base-200 rounded-lg px-3 py-2">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-base-300 flex items-center justify-center">
                {avatarSrc ? (
                    <img
                        src={avatarSrc}
                        alt={entry.playerName ?? ""}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span className="text-xs font-bold opacity-50">
                        {(entry.playerName ?? "?").slice(0, 1).toUpperCase()}
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold truncate">{entry.playerName ?? "—"}</span>
                    <span className="text-[10px] opacity-40 shrink-0">{timeStr}</span>
                </div>
                <span className="text-[10px] font-extrabold tracking-widest uppercase opacity-60">
                    {rollLabel}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-black text-primary">{resultStr}</span>
                    <span className="text-[10px] opacity-40">{entry.diceCommand}</span>
                </div>
            </div>
        </div>
    );
}
