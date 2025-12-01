import { APIPlayer, type GetPlayerResponse } from "../api/APIPlayer";
import CharacterSelect from "../components/CharacterSelect";
import { type Campaign } from "../api/APICampaign";
import { calculateMaxHP, calculateMaxMP, calculateMaxPA, calculateInitialMP } from "../utils/PlayerCalculator";
import type { WeaponInfo } from "../api/ResponseModel";

interface PlayerSheetProps {
    player: GetPlayerResponse | null;
    setPlayer: React.Dispatch<React.SetStateAction<GetPlayerResponse | null>>;
    campaignInfo: Campaign | null;
    weaponInfo: WeaponInfo | null;
}

export default function PlayerSheet({ player, setPlayer, campaignInfo, weaponInfo }: PlayerSheetProps) {
    async function sync(p: GetPlayerResponse) {
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

                    {/* <div className="grid grid-cols-2 gap-3">
                        <label className="form-control">
                            <span className="label-text">Total de pontos</span>
                            <input
                                className="input input-bordered"
                                placeholder="Ex.: 10"
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

                        <label className="form-control">
                            <span className="label-text">XP</span>
                            <input
                                className="input input-bordered"
                                placeholder="Ex.: 10"
                                type="number"
                                value={player?.playerSheet?.xp ?? ""}
                                onChange={async (e) => {
                                    if (!player) return;

                                    const raw = e.target.value;

                                    const next = {
                                        ...player,
                                        playerSheet: {
                                            ...player.playerSheet,
                                            xp: raw === "" ? undefined : Number(raw),
                                        },
                                    };

                                    setPlayer(next);
                                    await sync(next);
                                }}
                            />
                        </label>
                    </div> */}

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

                                            const raw = e.target.value;

                                            const next = {
                                                ...player,
                                                playerSheet: {
                                                    ...player.playerSheet,
                                                    power: raw === "" ? undefined : Number(raw),
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
                                        máx.{" "}
                                        {calculateMaxPA(player)}
                                    </span>
                                    <input
                                        type="number"
                                        className="input input-bordered"
                                        value={player?.playerSheet?.apCurrent ?? ""}
                                        onChange={async (e) => {
                                            if (!player) return;

                                            const raw = e.target.value;

                                            const next = {
                                                ...player,
                                                playerSheet: {
                                                    ...player.playerSheet,
                                                    apCurrent: raw === "" ? undefined : Number(raw),
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

                                            const raw = e.target.value;

                                            const next = {
                                                ...player,
                                                playerSheet: {
                                                    ...player.playerSheet,
                                                    hability: raw === "" ? undefined : Number(raw),
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
                                        {calculateMaxMP(player)}
                                    </span>
                                    <div className="rounded-lg py-2 px-3 font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                        PM Inicial: {calculateInitialMP(player)}
                                    </div>

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

                                            const raw = e.target.value;

                                            const next = {
                                                ...player,
                                                playerSheet: {
                                                    ...player.playerSheet,
                                                    resistance: raw === "" ? undefined : Number(raw),
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
                                        {calculateMaxHP(player, weaponInfo)}
                                    </span>
                                    <input
                                        type="number"
                                        className="input input-bordered"
                                        value={player?.playerSheet?.hpCurrent ?? ""}
                                        onChange={async (e) => {
                                            if (!player) return;

                                            const raw = e.target.value;

                                            const next = {
                                                ...player,
                                                playerSheet: {
                                                    ...player.playerSheet,
                                                    hpCurrent: raw === "" ? undefined : Number(raw),
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
