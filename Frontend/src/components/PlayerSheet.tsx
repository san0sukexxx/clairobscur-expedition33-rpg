import { type PlayerResponse } from "../api/MockAPIPlayer";
import { APIPlayer } from "../api/APIPlayer";
import CharacterSelect from "../components/CharacterSelect";
import { APICampaign, type Campaign } from "../api/APICampaign";

interface PlayerSheetProps {
    player: PlayerResponse | null;
    setPlayer: React.Dispatch<React.SetStateAction<PlayerResponse | null>>;
    campaignInfo: Campaign | null;
}

export default function PlayerSheet({ player, setPlayer, campaignInfo }: PlayerSheetProps) {
    async function sync(p: PlayerResponse) {
        await APIPlayer.update(p.id, { playerSheet: p.playerSheet ?? {} });
    }

    return (
        <div className="card bg-base-100 shadow">
            <div className="card-body">
                <h2 className="card-title">Ficha</h2>

                <div className="grid grid-cols-1 gap-3">
                    <label className="form-control flex flex-col items-start gap-1">
                        <span className="label-text">Nome</span>
                        <input
                            name="name"
                            className="input input-bordered w-full"
                            placeholder="Nome"
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
                        }}
                        allowedCharacters={campaignInfo?.characters ?? []}
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <label className="form-control">
                            <span className="label-text">Total de pontos</span>
                            <input
                                className="input input-bordered"
                                placeholder="Ex.: 10"
                                type="number"
                                value={player?.playerSheet?.totalPoints ?? ""}
                                onChange={async (e) => {
                                    if (!player) return;
                                    const next = {
                                        ...player,
                                        playerSheet: {
                                            ...player.playerSheet,
                                            totalPoints: Number(e.target.value),
                                        },
                                    };
                                    setPlayer(next);
                                    await sync(next);
                                }}
                            />
                        </label>

                        <label className="form-control">
                            <span className="label-text">XP</span>
                            <input
                                className="input input-bordered"
                                placeholder="Ex.: 10"
                                type="number"
                                value={player?.playerSheet?.xp ?? ""}
                                onChange={async (e) => {
                                    if (!player) return;
                                    const next = {
                                        ...player,
                                        playerSheet: {
                                            ...player.playerSheet,
                                            xp: Number(e.target.value),
                                        },
                                    };
                                    setPlayer(next);
                                    await sync(next);
                                }}
                            />
                        </label>
                    </div>

                    <div className="card bg-base-200 shadow">
                        <div className="card-body">
                            <div className="grid grid-cols-2 gap-3">
                                <label className="form-control">
                                    <span className="label-text">Poder</span>
                                    <input
                                        type="number"
                                        className="input input-bordered"
                                        value={player?.playerSheet?.power ?? ""}
                                        onChange={async (e) => {
                                            if (!player) return;
                                            const next = {
                                                ...player,
                                                playerSheet: {
                                                    ...player.playerSheet,
                                                    power: Number(e.target.value),
                                                },
                                            };
                                            setPlayer(next);
                                            await sync(next);
                                        }}
                                    />
                                </label>
                                <label className="form-control">
                                    <span className="label-text">PA</span>
                                    <span className="pl-1 text-sm text-gray-500">
                                        máx. {player?.playerSheet?.power ?? ""}
                                    </span>
                                    <input
                                        type="number"
                                        className="input input-bordered"
                                        value={player?.playerSheet?.apCurrent ?? ""}
                                        onChange={async (e) => {
                                            if (!player) return;
                                            const next = {
                                                ...player,
                                                playerSheet: {
                                                    ...player.playerSheet,
                                                    apCurrent: Number(e.target.value),
                                                },
                                            };
                                            setPlayer(next);
                                            await sync(next);
                                        }}
                                    />
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <label className="form-control">
                                    <span className="label-text">Habilidade</span>
                                    <input
                                        type="number"
                                        className="input input-bordered"
                                        value={player?.playerSheet?.hability ?? ""}
                                        onChange={async (e) => {
                                            if (!player) return;
                                            const next = {
                                                ...player,
                                                playerSheet: {
                                                    ...player.playerSheet,
                                                    hability: Number(e.target.value),
                                                },
                                            };
                                            setPlayer(next);
                                            await sync(next);
                                        }}
                                    />
                                </label>
                                <label className="form-control">
                                    <span className="label-text">PM</span>
                                    <span className="pl-1 text-sm text-gray-500">
                                        máx.{" "}
                                        {((player?.playerSheet?.hability ?? 0) * 5) === 0
                                            ? 1
                                            : (player?.playerSheet?.hability ?? 0) * 5}
                                    </span>
                                    <input
                                        type="number"
                                        className="input input-bordered"
                                        value={player?.playerSheet?.mpCurrent ?? ""}
                                        onChange={async (e) => {
                                            if (!player) return;
                                            const next = {
                                                ...player,
                                                playerSheet: {
                                                    ...player.playerSheet,
                                                    mpCurrent: Number(e.target.value),
                                                },
                                            };
                                            setPlayer(next);
                                            await sync(next);
                                        }}
                                    />
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <label className="form-control">
                                    <span className="label-text">Resistência</span>
                                    <input
                                        type="number"
                                        className="input input-bordered"
                                        value={player?.playerSheet?.resistance ?? ""}
                                        onChange={async (e) => {
                                            if (!player) return;
                                            const next = {
                                                ...player,
                                                playerSheet: {
                                                    ...player.playerSheet,
                                                    resistance: Number(e.target.value),
                                                },
                                            };
                                            setPlayer(next);
                                            await sync(next);
                                        }}
                                    />
                                </label>
                                <label className="form-control">
                                    <span className="label-text">PV</span>
                                    <span className="pl-1 text-sm text-gray-500">
                                        máx.{" "}
                                        {((player?.playerSheet?.resistance ?? 0) * 5) === 0
                                            ? 1
                                            : (player?.playerSheet?.resistance ?? 0) * 5}
                                    </span>
                                    <input
                                        type="number"
                                        className="input input-bordered"
                                        value={player?.playerSheet?.hpCurrent ?? ""}
                                        onChange={async (e) => {
                                            if (!player) return;
                                            const next = {
                                                ...player,
                                                playerSheet: {
                                                    ...player.playerSheet,
                                                    hpCurrent: Number(e.target.value),
                                                },
                                            };
                                            setPlayer(next);
                                            await sync(next);
                                        }}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    <label className="form-control flex flex-col items-start gap-1">
                        <span className="label-text">Anotações</span>
                        <textarea
                            className="textarea textarea-bordered w-full h-48 rounded-md"
                            placeholder="Anotações"
                            value={player?.playerSheet?.notes ?? ""}
                            onChange={async (e) => {
                                if (!player) return;
                                const next = {
                                    ...player,
                                    playerSheet: {
                                        ...player.playerSheet,
                                        notes: e.target.value,
                                    },
                                };
                                setPlayer(next);
                                await sync(next);
                            }}
                            disabled={!player}
                        />
                    </label>
                </div>
            </div>
        </div>
    );
}
