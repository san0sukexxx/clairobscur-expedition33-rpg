import { useState, useRef, useEffect, useMemo } from "react";
import { FaChevronLeft, FaChevronRight, FaList } from "react-icons/fa";
import { type PlayerResponse, type WeaponResponse } from "../api/APIPlayer";
import { type WeaponDTO, type Rank, type PassiveDTO } from "../types/WeaponDTO";
import { displayWeaponPower, displayWeaponAttributeRank } from "../utils/WeaponUtils";

const ELEMENT_EMOTE: Record<string, string> = {
  Physical: "⚔️",
  Void: "🕳️",
  Light: "✨",
  Lightning: "⚡️",
  Fire: "🔥",
  Ice: "❄️",
  Dark: "🌑",
  Earth: "🪨",
  Unkown: "❓"
} as const;

type SelectorWeapon = {
  id: string;
  name: string;
  image: string;
  level: number;
  power: number;
  element: string;
  scaling: Record<string, Rank>;
  rotation: number;
  passives: PassiveDTO[];
};

interface WeaponSectionProps {
  player: PlayerResponse | null;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerResponse | null>>;
  weaponList: WeaponDTO[];
}

function useActiveWeapon(weaponList: WeaponDTO[], player?: PlayerResponse | null): SelectorWeapon | null {
  return useMemo(() => {
    const playerWeapon = player?.weapons?.find(w => w.inUse) ?? null;

    if (playerWeapon == null) {
      return null;
    }

    const weaponData = weaponList.find(w => w.name == playerWeapon.id);

    if (weaponData == null) {
      return null;
    }

    const rawElement = weaponData.attributes.element;
    const elementEmote = ELEMENT_EMOTE[rawElement] ?? "❓";

    return {
      id: playerWeapon.id,
      name: weaponData.name,
      image: `/weapons/${weaponData.name}.webp`,
      level: playerWeapon.level,
      power: weaponData.attributes.power,
      element: elementEmote,
      scaling: weaponData.attributes.scaling,
      rotation: weaponData.rotation,
      passives: weaponData.passives,
    };
  }, [weaponList, player?.weapons]);
}

function findWeaponByName(weaponList: WeaponDTO[], name: string): WeaponDTO | undefined {
  return weaponList.find(w => w.name == name);
}

const levelColor = (lvl: number) =>
  lvl >= 20 ? "text-red-400"
    : lvl >= 10 ? "text-yellow-400"
      : "text-sky-400";

export default function WeaponSection({ player, setPlayer, weaponList }: WeaponSectionProps) {
  const activeWeapon = useActiveWeapon(weaponList, player);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const openSelector = () => dialogRef.current?.showModal();
  const closeSelector = () => dialogRef.current?.close();

  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

  function updateLevel(newLevel: number) {
    setPlayer(prev =>
      prev
        ? {
          ...prev,
          weapons: prev.weapons?.map(w =>
            w.inUse
              ? { ...w, level: clamp(newLevel, 1, 33) }
              : w
          ),
        }
        : prev
    );
  }

  const handlePick = (w: WeaponDTO) => {
    setPlayer(prev => {
      if (!prev?.weapons?.length) return prev;

      if (!prev.weapons.some(pw => pw.id === w.name)) return prev;

      return {
        ...prev,
        weapons: prev.weapons.map(pw => {

          return pw.id === w.name
            ? { ...pw, inUse: true }
            : { ...pw, inUse: false }
        }),
      };
    });
    closeSelector();
  };

  function handleIncrease() {
    if (activeWeapon == null) return;
    updateLevel(activeWeapon.level + 1);
  }

  function handleDecrease() {
    if (activeWeapon == null) return;
    updateLevel(activeWeapon.level - 1);
  }

  if (player?.weapons?.length == 0) {
    return <div>Você não tem nenhuma arma.</div>;
  }

  return (
    <div className="card bg-base-100 shadow-lg">
      {activeWeapon == null ?
        <div className="card-body">
          <p className="text-sm text-neutral-300">
            Você não tem nenhuma arma equipada.
          </p>

          <button
            type="button"
            onClick={openSelector}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-100 hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500"
          >
            <FaList aria-hidden="true" />
            <span>Ver lista de armas</span>
          </button>
        </div>
        :
        <div className="card-body">
          {/* Cabeçalho */}
          <h2 className="text-center font-bold text-sm tracking-wide uppercase">
            Armas
          </h2>

          {/* Cabeçalho - imagem + nome + level centralizados */}
          <div className="mt-2 flex flex-col items-center gap-3">
            {/* Imagem com fundo menor à esquerda */}
            <button
              type="button"
              onClick={openSelector}
              aria-label="Change weapon"
              title="Change weapon"
              className="relative w-[220px] h-[160px] overflow-visible focus:outline-none"
            >
              {/* Background menor e deslocado à esquerda */}
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
              {/* Imagem da arma por cima, rotacionada -125° */}
              <img
                src={activeWeapon.image}
                alt={activeWeapon.name}
                className="absolute inset-0 m-auto object-contain"
                style={{ width: "340px", height: "248px", rotate: `${activeWeapon.rotation}deg` }}
              />
            </button>

            {/* Nome da arma (centralizado) */}
            <span className="text-3xl font-light text-center">{activeWeapon.name}</span>

            {/* Level (tudo centralizado) */}
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
                <button className="btn btn-sm btn-ghost"
                  onClick={handleIncrease}
                  disabled={activeWeapon.level >= 33}>
                  <FaChevronRight />
                </button>
              </div>
              <div className="mt-1 text-center text-xs uppercase opacity-70">Level</div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 text-center mt-6">
            <div>
              <span className="block text-xs uppercase opacity-70">Poder</span>
              <span className="block text-2xl font-bold">{displayWeaponPower(activeWeapon.power, activeWeapon.level)}</span>
            </div>
            <div>
              <span className="block text-xs uppercase opacity-70">Elemento</span>
              <span className="block text-2xl">{activeWeapon.element}</span>
            </div>
            {/* Scaling stats */}
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
                  <span className="block text-2xl font-bold">{displayWeaponAttributeRank(value, activeWeapon.level)}</span>
                </div>
              ) : null
            )}
          </div>

          {/* Passivas ocupando 100% */}
          <ul className="mt-4 w-full space-y-1 text-sm md:col-span-2">
            {(activeWeapon?.passives ?? []).map((p: any) => (
              <li key={p.level} className="flex w-full gap-2">
                <span className={`font-semibold ${levelColor(p.level)}`}>Level {p.level}</span>
                <span className="flex-1 opacity-90">: {p.effect}</span>
              </li>
            ))}
          </ul>
        </div>
      }

      {/* Modal (DaisyUI <dialog>) */}
      <dialog ref={dialogRef} className="modal items-start pt-7">
        <div className="modal-box max-w-4xl w-[92vw] bg-neutral-900 text-neutral-100 max-h-[92dvh] flex flex-col p-0 mobile-dialog">

          {/* HEADER fixo */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900">
            <h3 className="font-bold text-xl">Selecione a arma</h3>
            <form method="dialog">
              <button className="btn btn-sm" onClick={closeSelector}>X</button>
            </form>
          </div>

          {/* CONTEÚDO rolável */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="grid grid-cols-1 gap-4">
              {player?.weapons?.map((w) => {
                const weaponDetails = findWeaponByName(weaponList, w.id);

                if (weaponDetails == undefined) return;

                return (
                  <button
                    key={weaponDetails.name}
                    onClick={() => handlePick(weaponDetails)}
                    className="group rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 text-left hover:border-neutral-700 hover:shadow-lg focus:outline-none"
                  >
                    {/* GRID: [imagem | conteúdo] + passivas full-width */}
                    <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-4">
                      {/* Nome ocupa a linha inteira */}
                      <div className="text-2xl font-extrabold w-full col-span-full md:col-span-2">
                        {weaponDetails.name}
                        <span className="ml-2 text-base font-semibold text-green-400/80">
                          level {w.level}
                        </span>
                      </div>
                      {/* Coluna 1: imagem */}
                      <div className="shrink-0 flex items-center justify-center rounded-lg bg-black/40 p-2 ring-1 ring-neutral-500 max-h-30 md:col-start-1">
                        <img
                          src={`/weapons/${weaponDetails.name}.webp`}
                          alt={weaponDetails.name}
                          className="max-h-60 object-contain transform"
                          style={{ rotate: `${weaponDetails.rotation + 35}deg` }}
                        />
                      </div>

                      {/* Coluna 2: título + stats */}
                      <div className="md:col-start-1">
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                          {/* Power */}
                          <div>
                            <div className="uppercase tracking-wide text-sm opacity-70 mb-1">PODER</div>
                            <div className="text-4xl font-black leading-tight">
                              {displayWeaponPower(weaponDetails.attributes.power, w.level)}
                            </div>
                          </div>

                          {/* Element */}
                          <div>
                            <div className="uppercase tracking-wide text-sm opacity-70 mb-1">ELEMENTO</div>
                            <div className="text-3xl font-semibold mt-2">
                              {ELEMENT_EMOTE[weaponDetails?.attributes?.element ?? "Unknown"]}
                            </div>
                          </div>

                          {/* Scaling stats */}
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

                      {/* Passivas ocupando 100% */}
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

        {/* Backdrop preto translúcido */}
        <form method="dialog" className="modal-backdrop bg-black/70">
          <button aria-label="Close" />
        </form>
      </dialog>
    </div >
  );
}
