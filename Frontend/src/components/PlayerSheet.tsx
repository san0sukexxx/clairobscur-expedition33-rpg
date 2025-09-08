import { type PlayerResponse } from "../api/APIPlayer";
import CharacterSelect from "../components/CharacterSelect";

interface PlayerSheetProps {
    player: PlayerResponse | null;
    setPlayer: React.Dispatch<React.SetStateAction<PlayerResponse | null>>;
}

export default function PlayerSheet({ player, setPlayer }: PlayerSheetProps) {
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
                            onChange={(e) =>
                                setPlayer((prev) =>
                                    prev
                                        ? {
                                            ...prev,
                                            playerSheet: {
                                                ...prev.playerSheet,
                                                name: e.target.value,
                                            },
                                        }
                                        : prev
                                )
                            }
                            disabled={!player}
                        />
                    </label>

                    <CharacterSelect
                        selected={player?.playerSheet?.character ?? "gustave"}
                        onSelect={(id) =>
                            setPlayer((prev) =>
                                prev
                                    ? {
                                        ...prev,
                                        playerSheet: {
                                            ...prev.playerSheet,
                                            character: id,
                                        },
                                        weapons: prev.weapons
                                            ? prev.weapons.map((w) => ({ ...w, inUse: false }))
                                            : prev.weapons,
                                    }
                                    : prev
                            )
                        }
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <label className="form-control">
                            <span className="label-text">Total de pontos</span>
                            <input className="input input-bordered" placeholder="Ex.: 10" type="number"
                                value={player?.playerSheet?.totalPoints ?? ""}
                                onChange={(e) =>
                                    setPlayer((prev) =>
                                        prev
                                            ? {
                                                ...prev,
                                                playerSheet: {
                                                    ...prev.playerSheet,
                                                    totalPoints: Number(e.target.value),
                                                },
                                            }
                                            : prev
                                    )
                                } />
                        </label>

                        <label className="form-control">
                            <span className="label-text">XP</span>
                            <input className="input input-bordered" placeholder="Ex.: 10" type="number"
                                value={player?.playerSheet?.xp ?? ""}
                                onChange={(e) =>
                                    setPlayer((prev) =>
                                        prev
                                            ? {
                                                ...prev,
                                                playerSheet: {
                                                    ...prev.playerSheet,
                                                    xp: Number(e.target.value),
                                                },
                                            }
                                            : prev
                                    )
                                } />
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
                                        onChange={(e) =>
                                            setPlayer((prev) =>
                                                prev
                                                    ? {
                                                        ...prev,
                                                        playerSheet: {
                                                            ...prev.playerSheet,
                                                            power: Number(e.target.value),
                                                        },
                                                    }
                                                    : prev
                                            )
                                        }
                                    />
                                </label>
                                <label className="form-control">
                                    <span className="label-text">PA</span> <span className="pl-1 text-sm text-gray-500">máx. {player?.playerSheet?.power ?? ""}</span>
                                    <input
                                        type="number"
                                        className="input input-bordered"
                                        value={player?.playerSheet?.actionPoints ?? ""}
                                        onChange={(e) =>
                                            setPlayer((prev) =>
                                                prev
                                                    ? {
                                                        ...prev,
                                                        playerSheet: {
                                                            ...prev.playerSheet,
                                                            actionPoints: Number(e.target.value),
                                                        },
                                                    }
                                                    : prev
                                            )
                                        }
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
                                        onChange={(e) =>
                                            setPlayer((prev) =>
                                                prev
                                                    ? {
                                                        ...prev,
                                                        playerSheet: {
                                                            ...prev.playerSheet,
                                                            hability: Number(e.target.value),
                                                        },
                                                    }
                                                    : prev
                                            )
                                        }
                                    />
                                </label>
                                <label className="form-control">
                                    <span className="label-text">PM</span>
                                    <span className="pl-1 text-sm text-gray-500">
                                        máx. {((player?.playerSheet?.hability ?? 0) * 5) === 0
                                            ? 1
                                            : (player?.playerSheet?.hability ?? 0) * 5}
                                    </span>
                                    <input
                                        type="number"
                                        className="input input-bordered"
                                        value={player?.playerSheet?.magicPoints ?? ""}
                                        onChange={(e) =>
                                            setPlayer((prev) =>
                                                prev
                                                    ? {
                                                        ...prev,
                                                        playerSheet: {
                                                            ...prev.playerSheet,
                                                            magicPoints: Number(e.target.value),
                                                        },
                                                    }
                                                    : prev
                                            )
                                        }
                                    />
                                </label>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="form-control">
                                    <span className="label-text">Resistência</span>
                                    <input
                                        type="number"
                                        className="input input-bordered"
                                        value={player?.playerSheet?.resistence ?? ""}
                                        onChange={(e) =>
                                            setPlayer((prev) =>
                                                prev
                                                    ? {
                                                        ...prev,
                                                        playerSheet: {
                                                            ...prev.playerSheet,
                                                            resistence: Number(e.target.value),
                                                        },
                                                    }
                                                    : prev
                                            )
                                        }
                                    />
                                </label>
                                <label className="form-control">
                                    <span className="label-text">PV</span>
                                    <span className="pl-1 text-sm text-gray-500">
                                        máx. {((player?.playerSheet?.resistence ?? 0) * 5) === 0
                                            ? 1
                                            : (player?.playerSheet?.resistence ?? 0) * 5}
                                    </span>
                                    <input
                                        type="number"
                                        className="input input-bordered"
                                        value={player?.playerSheet?.healthPoints ?? ""}
                                        onChange={(e) =>
                                            setPlayer((prev) =>
                                                prev
                                                    ? {
                                                        ...prev,
                                                        playerSheet: {
                                                            ...prev.playerSheet,
                                                            healthPoints: Number(e.target.value),
                                                        },
                                                    }
                                                    : prev
                                            )
                                        }
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
                            onChange={(e) =>
                                setPlayer((prev) =>
                                    prev
                                        ? {
                                            ...prev,
                                            playerSheet: {
                                                ...prev.playerSheet,
                                                notes: e.target.value,
                                            },
                                        }
                                        : prev
                                )
                            }
                            disabled={!player}
                        />
                    </label>
                </div>
            </div>
        </div>
    );
}
