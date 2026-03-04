import { APIPlayer, type GetPlayerResponse } from "../api/APIPlayer";
import { useCallback, useState } from "react";
import CharacterSelect from "../components/CharacterSelect";
import { type Campaign } from "../api/APICampaign";
import { t } from "../i18n";

interface CharacterClassInfo {
    raceKey: string;
    classKey: string;
    attributeKey: string;
}

const CHARACTER_INFO: Record<string, CharacterClassInfo> = {
    verso:   { raceKey: "characterSheet.races.human",   classKey: "characterSheet.classes.fighter",  attributeKey: "characterSheet.attributes.strength"     },
    gustave: { raceKey: "characterSheet.races.human",   classKey: "characterSheet.classes.fighter",  attributeKey: "characterSheet.attributes.strength"     },
    maelle:  { raceKey: "characterSheet.races.human",   classKey: "characterSheet.classes.rogue",    attributeKey: "characterSheet.attributes.dexterity"    },
    sciel:   { raceKey: "characterSheet.races.human",   classKey: "characterSheet.classes.warlock",  attributeKey: "characterSheet.attributes.charisma"     },
    monoco:  { raceKey: "characterSheet.races.gestral", classKey: "characterSheet.classes.druid",    attributeKey: "characterSheet.attributes.wisdom"       },
    lune:    { raceKey: "characterSheet.races.human",   classKey: "characterSheet.classes.wizard",   attributeKey: "characterSheet.attributes.intelligence" },
};

// D&D 5e – XP needed to advance from level N to N+1
const XP_THRESHOLDS: Record<number, number> = {
    1:  300,     2:  600,     3:  1800,    4:  3800,
    5:  7500,    6:  9000,    7:  11000,   8:  14000,
    9:  16000,   10: 21000,   11: 25000,   12: 30000,
    13: 35000,   14: 40000,   15: 45000,   16: 50000,
    17: 55000,   18: 65000,   19: 75000,   20: 0,
};

function xpForLevel(level: number): number {
    return XP_THRESHOLDS[level] ?? 0;
}

interface PlayerSheetProps {
    player: GetPlayerResponse | null;
    setPlayer: React.Dispatch<React.SetStateAction<GetPlayerResponse | null>>;
    campaignInfo: Campaign | null;
}

export default function PlayerSheet({ player, setPlayer, campaignInfo }: PlayerSheetProps) {
    const [xpOpen, setXpOpen] = useState(false);
    const [xpInput, setXpInput] = useState("");

    async function sync(p: GetPlayerResponse) {
        await APIPlayer.update(p.id, { playerSheet: p.playerSheet ?? {} });
    }

    const handleLevelChange = useCallback(async (level: number) => {
        if (!player) return;
        const next = {
            ...player,
            playerSheet: { ...player.playerSheet, totalPoints: level, xp: 0 },
        };
        setPlayer(next);
        await sync(next);
        const updated = await APIPlayer.get(player.id);
        setPlayer(updated);
    }, [player]);

    const handleAddXp = useCallback(async (amount: number) => {
        if (!player || amount <= 0) return;
        let xp = (player.playerSheet?.xp ?? 0) + amount;
        let level = player.playerSheet?.totalPoints ?? 1;
        const maxLevel = 20;

        while (level < maxLevel && xp >= xpForLevel(level)) {
            xp -= xpForLevel(level);
            level++;
        }

        if (level >= maxLevel) {
            level = maxLevel;
            xp = Math.min(xp, 0);
        }

        const next = {
            ...player,
            playerSheet: { ...player.playerSheet, xp, totalPoints: level },
        };
        setPlayer(next);
        await sync(next);
        const updated = await APIPlayer.get(player.id);
        setPlayer(updated);
    }, [player]);

    return (
        <div className="card bg-base-100 shadow">
            <div className="card-body">
                <div className="grid grid-cols-1 gap-3">
                    <div className="flex gap-3 items-end">
                        <label className="form-control flex-1">
                            <span className="label-text">{t("common.name")}</span>
                            <input
                                name="name"
                                className="input input-bordered w-full text-lg font-semibold"
                                placeholder={t("common.name")}
                                value={player?.playerSheet?.name ?? ""}
                                onChange={async (e) => {
                                    if (!player) return;
                                    const next = {
                                        ...player,
                                        playerSheet: { ...player.playerSheet, name: e.target.value },
                                    };
                                    setPlayer(next);
                                    await sync(next);
                                }}
                                disabled={!player}
                            />
                        </label>

                        <label className="form-control w-20">
                            <span className="label-text text-center">{t("characterSheet.characterLevel")}</span>
                            <select
                                className="select select-bordered text-center font-bold"
                                value={player?.playerSheet?.totalPoints ?? 1}
                                onChange={(e) => handleLevelChange(Number(e.target.value))}
                            >
                                {Array.from({ length: 20 }, (_, i) => i + 1).map(lvl => (
                                    <option key={lvl} value={lvl}>{lvl}</option>
                                ))}
                            </select>
                        </label>

                    </div>

                    {/* XP bar - thin, right below name */}
                    {(() => {
                        const level = player?.playerSheet?.totalPoints ?? 1;
                        const currentXp = player?.playerSheet?.xp ?? 0;
                        const needed = xpForLevel(level);
                        const pct = needed > 0 ? Math.min(100, (currentXp / needed) * 100) : 100;
                        return (
                            <div
                                className="w-full cursor-pointer -mt-1"
                                onClick={() => { setXpOpen(true); setXpInput(""); }}
                                title={`${currentXp} / ${needed} XP`}
                            >
                                <div className="w-full h-1.5 rounded-full bg-base-300 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-amber-500 transition-all duration-300"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })()}

                    {/* XP modal */}
                    {xpOpen && (() => {
                        const level = player?.playerSheet?.totalPoints ?? 1;
                        const currentXp = player?.playerSheet?.xp ?? 0;
                        const needed = xpForLevel(level);
                        const pct = needed > 0 ? Math.min(100, (currentXp / needed) * 100) : 100;
                        const isMaxLevel = level >= 20;
                        return (
                            <dialog className="modal modal-open" onClick={(e) => { if (e.target === e.currentTarget) setXpOpen(false); }}>
                                <div className="modal-box max-w-sm">
                                    <h3 className="font-bold text-lg mb-1">{t("characterSheet.xp")}</h3>
                                    <p className="text-sm text-base-content/60 mb-4">
                                        {t("characterSheet.characterLevel")} {level}{isMaxLevel ? " (Max)" : ""}
                                    </p>

                                    {/* Progress bar */}
                                    <div className="relative mb-1">
                                        <div className="w-full h-4 rounded-full bg-base-300 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-amber-500 transition-all duration-300"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-base-content">
                                            {isMaxLevel ? "MAX" : `${currentXp.toLocaleString()} / ${needed.toLocaleString()}`}
                                        </span>
                                    </div>

                                    {!isMaxLevel && (
                                        <>
                                            <p className="text-xs text-base-content/50 mb-4 text-right">
                                                {t("characterSheet.xpRemaining")}: {(needed - currentXp).toLocaleString()}
                                            </p>

                                            {/* XP input */}
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    className="input input-bordered input-sm flex-1"
                                                    placeholder={t("characterSheet.xpAdd")}
                                                    min={1}
                                                    value={xpInput}
                                                    onChange={(e) => setXpInput(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            const val = parseInt(xpInput);
                                                            if (!isNaN(val) && val > 0) {
                                                                handleAddXp(val);
                                                                setXpInput("");
                                                            }
                                                        }
                                                    }}
                                                    disabled={!player}
                                                />
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    disabled={!player || !xpInput || isNaN(parseInt(xpInput)) || parseInt(xpInput) <= 0}
                                                    onClick={() => {
                                                        const val = parseInt(xpInput);
                                                        if (!isNaN(val) && val > 0) {
                                                            handleAddXp(val);
                                                            setXpInput("");
                                                        }
                                                    }}
                                                >+XP</button>
                                            </div>
                                        </>
                                    )}

                                    <div className="modal-action">
                                        <button className="btn btn-sm" onClick={() => setXpOpen(false)}>
                                            {t("common.close")}
                                        </button>
                                    </div>
                                </div>
                            </dialog>
                        );
                    })()}

                    <CharacterSelect
                        selected={player?.playerSheet?.characterId}
                        onSelect={async (id) => {
                            if (!player) return;
                            const next = {
                                ...player,
                                playerSheet: { ...player.playerSheet, characterId: id },
                                weapons: player.weapons
                                    ? player.weapons.map((w) => ({ ...w, inUse: false }))
                                    : player.weapons,
                            };
                            setPlayer(next);
                            await sync(next);

                            const updatedPlayer = await APIPlayer.get(player.id);
                            setPlayer(updatedPlayer);
                        }}
                        allowedCharacters={campaignInfo?.characters ?? []}
                    />

                    {(() => {
                        const info = CHARACTER_INFO[player?.playerSheet?.characterId?.toLowerCase() ?? ""];
                        if (!info) return null;
                        return (
                            <div className="flex flex-wrap gap-2 pt-1">
                                <span className="rounded-full border border-base-300 bg-base-200 px-3 py-0.5 text-xs font-semibold text-base-content/70">
                                    {t(info.raceKey)}
                                </span>
                                <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
                                    {t(info.classKey)}
                                </span>
                                <span className="rounded-full border border-secondary/40 bg-secondary/10 px-3 py-0.5 text-xs font-semibold text-secondary">
                                    {t(info.attributeKey)}
                                </span>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}
