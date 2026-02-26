import { APIPlayer, type GetPlayerResponse } from "../api/APIPlayer";
import CharacterSelect from "../components/CharacterSelect";
import { type Campaign } from "../api/APICampaign";
import { t } from "../i18n";

interface PlayerSheetProps {
    player: GetPlayerResponse | null;
    setPlayer: React.Dispatch<React.SetStateAction<GetPlayerResponse | null>>;
    campaignInfo: Campaign | null;
}

export default function PlayerSheet({ player, setPlayer, campaignInfo }: PlayerSheetProps) {
    async function sync(p: GetPlayerResponse) {
        await APIPlayer.update(p.id, { playerSheet: p.playerSheet ?? {} });
    }

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
                            <input
                                className="input input-bordered text-center font-bold"
                                placeholder="—"
                                type="number"
                                value={player?.playerSheet?.totalPoints ?? ""}
                                onChange={async (e) => {
                                    if (!player) return;
                                    const raw = e.target.value;
                                    const next = {
                                        ...player,
                                        playerSheet: {
                                            ...player.playerSheet,
                                            totalPoints: raw === "" ? undefined : Number(raw),
                                        },
                                    };
                                    setPlayer(next);
                                    await sync(next);
                                }}
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
                </div>
            </div>
        </div>
    );
}
