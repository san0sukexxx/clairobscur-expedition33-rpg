import { APIPlayer, type GetPlayerResponse } from "../api/APIPlayer";
import { useCallback } from "react";
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


interface PlayerSheetProps {
    player: GetPlayerResponse | null;
    setPlayer: React.Dispatch<React.SetStateAction<GetPlayerResponse | null>>;
    campaignInfo: Campaign | null;
}

export default function PlayerSheet({ player, setPlayer, campaignInfo }: PlayerSheetProps) {
    async function sync(p: GetPlayerResponse) {
        await APIPlayer.update(p.id, { playerSheet: p.playerSheet ?? {} });
    }

    const handleLevelChange = useCallback(async (level: number) => {
        if (!player) return;
        const next = {
            ...player,
            playerSheet: { ...player.playerSheet, totalPoints: level },
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

                        <label className="form-control w-24">
                            <span className="label-text text-center">{t("characterSheet.xp")}</span>
                            <input
                                type="number"
                                className="input input-bordered text-center font-bold w-full"
                                min={0}
                                value={player?.playerSheet?.xp ?? 0}
                                onChange={async (e) => {
                                    if (!player) return;
                                    const next = {
                                        ...player,
                                        playerSheet: { ...player.playerSheet, xp: Number(e.target.value) },
                                    };
                                    setPlayer(next);
                                    await sync(next);
                                }}
                                disabled={!player}
                            />
                        </label>
                    </div>

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
