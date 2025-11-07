import { useRef, useMemo, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaList, FaDice } from "react-icons/fa";
import { GiStripedSword } from "react-icons/gi";
import { APIPlayer } from "../api/APIPlayer";
import { APIPlayerWeapons } from "../api/APIPlayerWeapons";
import { type PlayerResponse } from "../api/MockAPIPlayer";
import { type WeaponResponse } from "../api/ResponseModel";
import { type WeaponDTO, type Rank, type PassiveDTO } from "../types/WeaponDTO";
import { displayWeaponPlusDices, displayWeaponAttributeRank, displayWeaponPlusPower } from "../utils/WeaponCalculator";
import { ELEMENT_EMOTE } from "../utils/ElementUtils";

type SelectorWeapon = {
  id: string;
  name: string;
  image: string;
  level: number;
  power: number;
  element: string;
  elementName: string;
  scaling: Record<string, Rank>;
  rotation: number;
  passives: PassiveDTO[];
};

interface WeaponSectionProps {
  player: PlayerResponse | null;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerResponse | null>>;
  weaponList: WeaponDTO[];
  isAdmin: boolean;
}

function useActiveWeapon(weaponList: WeaponDTO[], player?: PlayerResponse | null): SelectorWeapon | null {
  return useMemo(() => {
    const equippedId = player?.playerSheet?.weaponId ?? null;
    if (equippedId == null) return null;
    const playerWeapon = player?.weapons?.find(w => w.id === equippedId) ?? null;
    if (playerWeapon == null) return null;
    const weaponData = weaponList.find(w => w.name === playerWeapon.id);
    if (weaponData == null) return null;
    const rawElement = weaponData.attributes.element;
    const elementEmote = ELEMENT_EMOTE[rawElement] ?? "❓";

    return {
      id: playerWeapon.id,
      name: weaponData.name,
      image: `/weapons/${weaponData.name}.webp`,
      level: playerWeapon.level,
      power: weaponData.attributes.power,
      element: elementEmote,
      elementName: rawElement,
      scaling: weaponData.attributes.scaling,
      rotation: weaponData.rotation,
      passives: weaponData.passives,
    };
  }, [
    weaponList,
    player?.weapons,
    player?.playerSheet?.weaponId,
  ]);
}

type ModalMode = "add" | "change" | "remove";

function findWeaponByName(weaponList: WeaponDTO[], name: string): WeaponDTO | undefined {
  return weaponList.find(w => w.name === name);
}

const levelColor = (lvl: number) =>
  lvl >= 20 ? "text-red-400"
    : lvl >= 10 ? "text-yellow-400"
      : "text-sky-400";

export default function WeaponSection({ player, setPlayer, weaponList, isAdmin }: WeaponSectionProps) {
  const activeWeapon = useActiveWeapon(weaponList, player);

  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const levelDialogRef = useRef<HTMLDialogElement | null>(null);

  const [modalMode, setModalMode] = useState<ModalMode>("add");
  const [modalWeapons, setModalWeapons] = useState<WeaponResponse[]>(player?.weapons ?? []);

  const [pendingWeaponToAdd, setPendingWeaponToAdd] = useState<WeaponDTO | null>(null);
  const [pendingWeaponLevel, setPendingWeaponLevel] = useState<number>(1);

  const [weaponFilter, setWeaponFilter] = useState<string>("");

  function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
  }

  const hasWeapons = useMemo(() => {
    return !!(player?.weapons && player.weapons.length > 0);
  }, [player]);

  function openSelector(mode: ModalMode) {
    if (!player) return;

    setModalMode(mode);
    setWeaponFilter("");

    if (mode === "add") {
      const currentIds = new Set((player.weapons ?? []).map(w => w.id));
      const available = weaponList.filter(dto => !currentIds.has(dto.name));

      const asResponse: WeaponResponse[] = available.map(dto => ({
        id: dto.name,
        level: 1,
      }));

      setModalWeapons(asResponse);
    } else {
      setModalWeapons(player.weapons ?? []);
    }

    dialogRef.current?.showModal();
  }

  function closeSelector() {
    dialogRef.current?.close();
  }

  function closeLevelDialog() {
    levelDialogRef.current?.close();
    setPendingWeaponToAdd(null);
  }

  const filteredModalWeapons = useMemo(() => {
    const term = weaponFilter.trim().toLowerCase();
    return modalWeapons.filter(w => {
      const dto = findWeaponByName(weaponList, w.id);
      if (!dto) return false;
      if (term === "") return true;
      return dto.name.toLowerCase().includes(term);
    });
  }, [modalWeapons, weaponList, weaponFilter]);

  async function confirmAddWeapon() {
    if (!player || !pendingWeaponToAdd) {
      closeLevelDialog();
      return;
    }

    const pickedWeaponId = pendingWeaponToAdd.name;
    const level = clamp(pendingWeaponLevel, 1, 33);

    closeLevelDialog();

    setPlayer(prev => {
      if (!prev) return prev;
      const list = prev.weapons ?? [];
      const exists = list.some(pw => pw.id === pickedWeaponId);

      const newList = exists
        ? list
        : [...list, { id: pickedWeaponId, level }];

      return {
        ...prev,
        weapons: newList,
        playerSheet: {
          ...prev.playerSheet,
        },
      };
    });

    await APIPlayerWeapons.add({
      playerId: player.id,
      weaponId: pickedWeaponId,
      level,
    });
  }

  async function updateLevel(newLevel: number) {
    if (!player?.playerSheet?.weaponId) return;

    const clamped = clamp(newLevel, 1, 33);
    const equippedWeaponId = player.playerSheet.weaponId;

    setPlayer(prev =>
      prev
        ? {
          ...prev,
          weapons: prev.weapons?.map(w =>
            w.id === equippedWeaponId ? { ...w, level: clamped } : w
          ),
        }
        : prev
    );

    await APIPlayerWeapons.update(player.id, equippedWeaponId, {
      level: clamped,
    });
  }

  async function handlePick(weaponDetails: WeaponDTO, currentLevel: number) {
    if (!player) {
      closeSelector();
      return;
    }

    const pickedWeaponId = weaponDetails.name;

    if (modalMode === "add") {
      closeSelector();

      setPendingWeaponToAdd(weaponDetails);
      setPendingWeaponLevel(currentLevel ?? 1);

      levelDialogRef.current?.showModal();
      return;
    }

    if (modalMode === "change") {
      closeSelector();

      setPlayer(prev => {
        if (!prev?.weapons?.length) return prev;
        if (!prev.weapons.some(pw => pw.id === pickedWeaponId)) return prev;
        return {
          ...prev,
          playerSheet: {
            ...prev.playerSheet,
            weaponId: pickedWeaponId,
          },
        };
      });

      await APIPlayer.update(player.id, {
        playerSheet: {
          ...player.playerSheet,
          weaponId: pickedWeaponId,
        },
      });

      return;
    }

    if (modalMode === "remove") {
      closeSelector();

      const equippedId = player.playerSheet?.weaponId ?? null;

      setPlayer(prev => {
        if (!prev) return prev;

        const newWeapons = (prev.weapons ?? []).filter(w => w.id !== pickedWeaponId);
        const shouldClearEquipped = equippedId === pickedWeaponId;

        return {
          ...prev,
          weapons: newWeapons,
          playerSheet: {
            ...prev.playerSheet,
            weaponId: shouldClearEquipped ? undefined : prev.playerSheet?.weaponId,
          },
        };
      });

      await APIPlayerWeapons.delete(player.id, pickedWeaponId);

      if (equippedId === pickedWeaponId) {
        await APIPlayer.update(player.id, {
          playerSheet: {
            ...player.playerSheet,
            weaponId: undefined,
          },
        });
      }

      return;
    }
  }

  function handleIncrease() {
    if (!activeWeapon) return;
    updateLevel(activeWeapon.level + 1);
  }

  function handleDecrease() {
    if (!activeWeapon) return;
    updateLevel(activeWeapon.level - 1);
  }

  const modalTitle =
    modalMode === "add"
      ? "Selecione a arma para adicionar"
      : modalMode === "change"
        ? "Selecione a arma para equipar"
        : "Selecione a arma para remover";

  return (
    <div className="card bg-base-100 shadow-lg">
      {isAdmin && (
        <div className="card-body pb-2 flex flex-col gap-2">
          <button
            className="btn btn-primary"
            onClick={() => openSelector("add")}
          >
            Adicionar arma
          </button>

          <button
            className="btn btn-error"
            onClick={() => openSelector("remove")}
            disabled={!player?.weapons || player.weapons.length === 0}
          >
            Remover arma
          </button>
        </div>
      )}

      {!hasWeapons && (
        <div className={`card-body ${isAdmin ? "pt-0" : ""}`}>
          <p className="text-sm text-neutral-300">
            Você não tem nenhuma arma.
          </p>
        </div>
      )}

      {hasWeapons && (
        <>
          {activeWeapon == null ? (
            <div className="card-body">
              <p className="text-sm text-neutral-300">
                Você não tem nenhuma arma equipada.
              </p>

              <button
                type="button"
                onClick={() => openSelector("change")}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-100 hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500"
              >
                <FaList aria-hidden="true" />
                <span>Ver lista de armas</span>
              </button>
            </div>
          ) : (
            <div className="card-body">
              <h2 className="text-center font-bold text-sm tracking-wide uppercase">
                Armas
              </h2>

              <div className="mt-2 flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={() => openSelector("change")}
                  aria-label="Change weapon"
                  title="Change weapon"
                  className="relative w-[220px] h-[160px] overflow-visible focus:outline-none"
                >
                  <div
                    className="absolute bg-center bg-cover rounded-md"
                    style={{
                      backgroundImage: "url('/generic_background.webp')",
                      width: "180px",
                      height: "132px",
                      left: "15px",
                      transform: "translateY(-50%)"
                    }}
                  />
                  <img
                    src={activeWeapon.image}
                    alt={activeWeapon.name}
                    className="absolute inset-0 m-auto object-contain"
                    style={{ width: "340px", height: "248px", rotate: `${activeWeapon.rotation}deg` }}
                  />
                </button>

                <span className="text-3xl font-light text-center">{activeWeapon.name}</span>

                <div className="mt-1">
                  <div className="flex items-center justify-center gap-4">
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={handleDecrease}
                      disabled={activeWeapon.level <= 1}>
                      <FaChevronLeft />
                    </button>
                    <span className="text-4xl font-extrabold text-primary">
                      {activeWeapon.level}
                    </span>
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={handleIncrease}
                      disabled={activeWeapon.level >= 33}>
                      <FaChevronRight />
                    </button>
                  </div>
                  <div className="mt-1 text-center text-xs uppercase opacity-70">Level</div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 text-center mt-6">
                <div>
                  <span className="block text-xs uppercase opacity-70">Poder</span>
                  {displayWeaponPlusDices(activeWeapon.power, activeWeapon.level) !== null && (
                    <span className="inline-flex items-center justify-center gap-1 text-2xl font-bold">
                      {displayWeaponPlusDices(activeWeapon.power, activeWeapon.level)}
                      <FaDice aria-hidden="true" />
                    </span>
                  )}
                  {displayWeaponPlusPower(activeWeapon.power, activeWeapon.level) !== null && (
                    <span className="inline-flex items-center justify-center gap-1 text-2xl font-bold">
                      {displayWeaponPlusPower(activeWeapon.power, activeWeapon.level)}
                      <GiStripedSword aria-hidden="true" />
                    </span>
                  )}
                </div>
                <div>
                  <span className="block text-xs uppercase opacity-70">Elemento</span>
                  <span className="block text-2xl">{activeWeapon.element}</span>
                  <span className="block text-s">({activeWeapon.elementName})</span>
                </div>

                {(
                  [
                    ["Vitalidade", activeWeapon.scaling.vitality],
                    ["Defesa", activeWeapon.scaling.defense],
                    ["Sorte", activeWeapon.scaling.luck],
                    ["Agilidade", activeWeapon.scaling.agility],
                  ] as const
                ).map(([label, value]) =>
                  value ? (
                    <div key={label}>
                      <span className="block text-xs uppercase opacity-70">{label}</span>
                      <span className="block text-2xl font-bold">
                        {displayWeaponAttributeRank(value, activeWeapon.level)}
                      </span>
                    </div>
                  ) : null
                )}
              </div>

              <ul className="mt-4 w-full space-y-1 text-sm md:col-span-2">
                {(activeWeapon.passives ?? []).map((p: any) => (
                  <li key={p.level} className="flex w-full gap-2">
                    <span className={`font-semibold ${levelColor(p.level)}`}>Level {p.level}</span>
                    <span className="flex-1 opacity-90">: {p.effect}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <dialog ref={dialogRef} className="modal items-start pt-7">
        <div className="modal-box max-w-4xl w-[92vw] bg-neutral-900 text-neutral-100 max-h-[92dvh] flex flex-col p-0 mobile-dialog">
          <div className="sticky top-0 z-10 flex flex-col gap-4 px-6 py-4 border-b border-neutral-800 bg-neutral-900">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xl">{modalTitle}</h3>
              <form method="dialog">
                <button className="btn btn-sm" onClick={closeSelector}>X</button>
              </form>
            </div>

            <input
              type="text"
              className="input input-bordered w-full bg-neutral-800 text-neutral-100 border-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500 placeholder-neutral-500 text-sm"
              placeholder="Buscar arma pelo nome..."
              value={weaponFilter}
              onChange={e => setWeaponFilter(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="grid grid-cols-1 gap-4">
              {filteredModalWeapons.map((w) => {
                const weaponDetails = findWeaponByName(weaponList, w.id);
                if (weaponDetails == undefined) return null;

                return (
                  <button
                    key={weaponDetails.name}
                    onClick={() => handlePick(weaponDetails, w.level)}
                    className="group rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 text-left hover:border-neutral-700 hover:shadow-lg focus:outline-none"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-4">
                      <div className="text-2xl font-extrabold w-full col-span-full md:col-span-2">
                        {weaponDetails.name}
                        <span className="ml-2 text-base font-semibold text-green-400/80">
                          level {w.level}
                        </span>
                        {player?.playerSheet?.weaponId === w.id && modalMode !== "remove" ? (
                          <span className="ml-2 text-xs font-semibold text-primary">
                            (equipada)
                          </span>
                        ) : null}
                      </div>

                      <div className="shrink-0 flex items-center justify-center rounded-lg bg-black/40 p-2 ring-1 ring-neutral-500 max-h-30 md:col-start-1">
                        <img
                          src={`/weapons/${weaponDetails.name}.webp`}
                          alt={weaponDetails.name}
                          className="max-h-60 object-contain transform"
                          style={{ rotate: `${weaponDetails.rotation + 35}deg` }}
                        />
                      </div>

                      <div className="md:col-start-1">
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                          <div>
                            <div className="uppercase tracking-wide text-sm opacity-70 mb-1">PODER</div>
                            <div className="text-4xl font-black leading-tight">
                              // TODO
                              {/* {displayWeaponPower(weaponDetails.attributes.power, w.level)} */}
                            </div>
                          </div>

                          <div>
                            <div className="uppercase tracking-wide text-sm opacity-70 mb-1">ELEMENTO</div>
                            <div className="text-3xl font-semibold mt-2">
                              {ELEMENT_EMOTE[weaponDetails?.attributes?.element ?? "Unknown"]}
                            </div>
                          </div>

                          {(
                            [
                              ["Vitalidade", weaponDetails.attributes.scaling.vitality],
                              ["Defesa", weaponDetails.attributes.scaling.defense],
                              ["Sorte", weaponDetails.attributes.scaling.luck],
                              ["Agilidade", weaponDetails.attributes.scaling.agility],
                            ] as const
                          ).map(([label, value]) =>
                            value ? (
                              <div key={label}>
                                <div className="uppercase tracking-wide text-sm opacity-70 mb-1">{label}</div>
                                <div className="text-4xl font-black leading-tighttext-4xl font-serif font-bold">
                                  {displayWeaponAttributeRank(value, w.level)}
                                </div>
                              </div>
                            ) : null
                          )}
                        </div>
                      </div>

                      <ul className="mt-4 w-full space-y-1 text-sm md:col-span-2">
                        {(weaponDetails?.passives ?? []).map((p: any) => (
                          <li key={p.level} className="flex w-full gap-2">
                            <span className={`font-semibold ${levelColor(p.level)}`}>Level {p.level}</span>
                            <span className="flex-1 opacity-90">: {p.effect}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <form method="dialog" className="modal-backdrop bg-black/70">
          <button aria-label="Close" />
        </form>
      </dialog>

      <dialog ref={levelDialogRef} className="modal items-start pt-7">
        <div className="modal-box max-w-md w-[92vw] bg-neutral-900 text-neutral-100 flex flex-col p-0">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900">
            <h3 className="font-bold text-xl">Escolher nível inicial</h3>
            <form method="dialog">
              <button className="btn btn-sm" onClick={closeLevelDialog}>X</button>
            </form>
          </div>

          <div className="px-6 py-4 space-y-4">
            <p className="text-sm text-neutral-300">
              Selecione o nível desta arma (1 a 33).
            </p>

            <div className="flex items-center gap-4 justify-center">
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => setPendingWeaponLevel(v => clamp(v - 1, 1, 33))}
                disabled={pendingWeaponLevel <= 1}
              >
                <FaChevronLeft />
              </button>

              <span className="text-4xl font-extrabold text-primary">
                {pendingWeaponLevel}
              </span>

              <button
                className="btn btn-sm btn-ghost"
                onClick={() => setPendingWeaponLevel(v => clamp(v + 1, 1, 33))}
                disabled={pendingWeaponLevel >= 33}
              >
                <FaChevronRight />
              </button>
            </div>

            <button
              className="btn btn-primary w-full"
              onClick={confirmAddWeapon}
            >
              Confirmar
            </button>
          </div>
        </div>

        <form method="dialog" className="modal-backdrop bg-black/70">
          <button aria-label="Close" />
        </form>
      </dialog>
    </div>
  );
}
