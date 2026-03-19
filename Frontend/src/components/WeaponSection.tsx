import { useRef, useMemo, useState, type RefObject, type MutableRefObject } from "react";
import { FaChevronLeft, FaChevronRight, FaList, FaChartLine, FaLock } from "react-icons/fa";
import { APIPlayer, type GetPlayerResponse } from "../api/APIPlayer";
import { APIPlayerWeapons } from "../api/APIPlayerWeapons";
import { type WeaponResponse } from "../api/ResponseModel";
import { type WeaponDTO, type Rank, type PassiveDTO } from "../types/WeaponDTO";
import { displayWeaponPlusPower, displayWeaponVitalityBonus, displayWeaponDefenseBonus, displayWeaponProficiencyBonus, displayWeaponDexterityBonus, getWeaponDamageDice } from "../utils/WeaponCalculator";
import { ELEMENT_EMOTE, getElementName } from "../utils/ElementUtils";
import { t, getWeaponPassive, toKebabCase, hasWeapon } from "../i18n";
import { isGustave } from "../constants/player/characterIds";
import { calculateMaxHP } from "../utils/PlayerCalculator";
import type { WeaponInfo } from "../api/ResponseModel";
import { WeaponsDataLoader } from "../utils/WeaponsDataLoader";
import type { DiceBoardRef } from "./DiceBoard";
import { renderTextWithDiceButtons } from "../utils/DiceTextRenderer";

// Helper to find the correct weapon ID considering character variations
function getWeaponTranslationId(weaponName: string, weaponList: WeaponDTO[]): string {
  const baseId = toKebabCase(weaponName);

  // Try base ID first
  if (hasWeapon(baseId)) {
    return baseId;
  }

  // Try with character suffixes
  const suffixes = ["-verso", "-lune", "-maelle", "-monoco", "-sciel"];
  for (const suffix of suffixes) {
    const idWithSuffix = baseId + suffix;
    if (hasWeapon(idWithSuffix)) {
      return idWithSuffix;
    }
  }

  // Fallback to base ID
  return baseId;
}

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
  player: GetPlayerResponse | null;
  setPlayer: React.Dispatch<React.SetStateAction<GetPlayerResponse | null>>;
  weaponList: WeaponDTO[];
  isAdmin: boolean;
  diceBoardRef?: RefObject<DiceBoardRef | null>;
  timeoutDiceBoardRef?: MutableRefObject<ReturnType<typeof setTimeout> | null>;
}

function useActiveWeapon(weaponList: WeaponDTO[], player?: GetPlayerResponse | null): SelectorWeapon | null {
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
  lvl >= 4 ? "text-red-400"
    : lvl >= 3 ? "text-yellow-400"
      : "text-sky-400";

export default function WeaponSection({ player, setPlayer, weaponList, isAdmin, diceBoardRef, timeoutDiceBoardRef }: WeaponSectionProps) {
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

  /** Clamp hpCurrent to new max HP when weapon changes reduce it */
  function clampHpToMax(p: GetPlayerResponse): GetPlayerResponse {
    const weaponId = p.playerSheet?.weaponId;
    const weapon = weaponId ? p.weapons?.find(w => w.id === weaponId) ?? null : null;
    const details = weaponId ? weaponList.find(w => w.name === weaponId) ?? null : null;
    const wi: WeaponInfo = { weapon, details };
    const maxHp = calculateMaxHP(p, wi);
    const currentHp = p.playerSheet?.hpCurrent ?? 0;
    if (currentHp > maxHp) {
      return { ...p, playerSheet: { ...p.playerSheet, hpCurrent: maxHp } };
    }
    return p;
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
      const characterId = player.playerSheet?.characterId;
      const available = weaponList.filter(dto => {
        if (currentIds.has(dto.name)) return false;
        return true;
      });

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
    const characterId = player?.playerSheet?.characterId;
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
    const level = clamp(pendingWeaponLevel, 1, 4);

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

    const clamped = clamp(newLevel, 1, 4);
    const equippedWeaponId = player.playerSheet.weaponId;

    let hpWasClamped = false;
    let clampedHp = 0;

    setPlayer(prev => {
      if (!prev) return prev;
      const updated = clampHpToMax({
        ...prev,
        weapons: prev.weapons?.map(w =>
          w.id === equippedWeaponId ? { ...w, level: clamped } : w
        ),
      });
      if ((updated.playerSheet?.hpCurrent ?? 0) < (prev.playerSheet?.hpCurrent ?? 0)) {
        hpWasClamped = true;
        clampedHp = updated.playerSheet?.hpCurrent ?? 0;
      }
      return updated;
    });

    await APIPlayerWeapons.update(player.id, equippedWeaponId, {
      level: clamped,
    });

    if (hpWasClamped) {
      await APIPlayer.update(player.id, {
        playerSheet: { ...player.playerSheet, hpCurrent: clampedHp },
      });
    }
  }

  async function handleUnequip() {
    if (!player) return;

    let clampedHp: number | undefined;

    setPlayer(prev => {
      if (!prev) return prev;
      const updated = clampHpToMax({
        ...prev,
        playerSheet: { ...prev.playerSheet, weaponId: undefined },
      });
      if ((updated.playerSheet?.hpCurrent ?? 0) < (prev.playerSheet?.hpCurrent ?? 0)) {
        clampedHp = updated.playerSheet?.hpCurrent ?? 0;
      }
      return updated;
    });

    await APIPlayer.update(player.id, {
      playerSheet: {
        ...player.playerSheet,
        weaponId: undefined,
        ...(clampedHp != null ? { hpCurrent: clampedHp } : {}),
      },
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

      let clampedHp: number | undefined;

      setPlayer(prev => {
        if (!prev?.weapons?.length) return prev;
        if (!prev.weapons.some(pw => pw.id === pickedWeaponId)) return prev;
        const updated = clampHpToMax({
          ...prev,
          playerSheet: { ...prev.playerSheet, weaponId: pickedWeaponId },
        });
        if ((updated.playerSheet?.hpCurrent ?? 0) < (prev.playerSheet?.hpCurrent ?? 0)) {
          clampedHp = updated.playerSheet?.hpCurrent ?? 0;
        }
        return updated;
      });

      await APIPlayer.update(player.id, {
        playerSheet: {
          ...player.playerSheet,
          weaponId: pickedWeaponId,
          ...(clampedHp != null ? { hpCurrent: clampedHp } : {}),
        },
      });

      return;
    }

    if (modalMode === "remove") {
      closeSelector();

      const equippedId = player.playerSheet?.weaponId ?? null;
      let clampedHpRemove: number | undefined;

      setPlayer(prev => {
        if (!prev) return prev;

        const newWeapons = (prev.weapons ?? []).filter(w => w.id !== pickedWeaponId);
        const shouldClearEquipped = equippedId === pickedWeaponId;

        const updated = clampHpToMax({
          ...prev,
          weapons: newWeapons,
          playerSheet: {
            ...prev.playerSheet,
            weaponId: shouldClearEquipped ? undefined : prev.playerSheet?.weaponId,
          },
        });
        if ((updated.playerSheet?.hpCurrent ?? 0) < (prev.playerSheet?.hpCurrent ?? 0)) {
          clampedHpRemove = updated.playerSheet?.hpCurrent ?? 0;
        }
        return updated;
      });

      await APIPlayerWeapons.delete(player.id, pickedWeaponId);

      if (equippedId === pickedWeaponId) {
        await APIPlayer.update(player.id, {
          playerSheet: {
            ...player.playerSheet,
            weaponId: undefined,
            ...(clampedHpRemove != null ? { hpCurrent: clampedHpRemove } : {}),
          },
        });
      } else if (clampedHpRemove != null) {
        await APIPlayer.update(player.id, {
          playerSheet: { ...player.playerSheet, hpCurrent: clampedHpRemove },
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
      ? t("weapons.modal.titleAdd")
      : modalMode === "change"
        ? t("weapons.modal.titleChange")
        : t("weapons.modal.titleRemove");

  return (
    <div className="card bg-base-100 shadow-lg">
      {isAdmin && (
        <div className="card-body pb-2 flex flex-col gap-2">
          <button
            className="btn btn-primary"
            onClick={() => openSelector("add")}
          >
            {t("weapons.addWeapon")}
          </button>

          <button
            className="btn btn-error"
            onClick={() => openSelector("remove")}
            disabled={!player?.weapons || player.weapons.length === 0}
          >
            {t("weapons.removeWeapon")}
          </button>
        </div>
      )}

      {!hasWeapons && (
        <div className={`card-body ${isAdmin ? "pt-0" : ""}`}>
          <p className="text-sm text-base-content/70">
            {t("weapons.noWeapon")}
          </p>
        </div>
      )}

      {hasWeapons && (
        <>
          {activeWeapon == null ? (
            <div className="card-body">
              <p className="text-sm text-base-content/70">
                {t("weapons.noWeapon")}
              </p>

              <button
                type="button"
                onClick={() => openSelector("change")}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-base-300 bg-base-200 px-4 py-2 text-sm font-semibold text-base-content hover:bg-base-300 focus:outline-none focus:ring-2 focus:ring-base-content/30"
              >
                <FaList aria-hidden="true" />
                <span>{t("weapons.selectWeapon")}</span>
              </button>
            </div>
          ) : (
            <div className="card-body">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center">
                <div />
                <h2 className="font-bold text-sm tracking-wide uppercase">
                  {t("weapons.title")}
                </h2>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleUnequip}
                    className="btn btn-xs btn-ghost text-error"
                    title={t("weapons.changeWeapon")}
                    aria-label={t("weapons.changeWeapon")}
                  >
                    Desequipar
                  </button>
                </div>
              </div>

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
                      disabled={activeWeapon.level >= 4}>
                      <FaChevronRight />
                    </button>
                  </div>
                  <div className="mt-1 text-center text-xs uppercase opacity-70">{t("weapons.level")}</div>

                  <div className="flex items-center justify-center gap-1 text-sm font-medium text-base-content/60">
                    ( {activeWeapon.power} <FaChartLine aria-hidden="true" />)
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 text-center mt-6">
                <div className="min-w-0">
                  <span className="block text-xs uppercase opacity-70 truncate">{t("weapons.power")}</span>
                  {displayWeaponPlusPower(activeWeapon.power, activeWeapon.level) !== null && (
                    <span className="inline-flex items-center justify-center gap-1 text-2xl font-bold">
                      {displayWeaponPlusPower(activeWeapon.power, activeWeapon.level)}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="block text-xs uppercase opacity-70 truncate">{t("weapons.dices")}</span>
                  <span className="inline-flex items-center justify-center gap-1 text-2xl font-bold">
                    {getWeaponDamageDice(activeWeapon.level)}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="block text-xs uppercase opacity-70 truncate">{t("weapons.element")}</span>
                  <span className="block text-2xl">{activeWeapon.element}</span>
                  <span className="block text-s">({getElementName(activeWeapon.elementName)})</span>
                </div>

                {(
                  [
                    [t("weapons.vitality"), activeWeapon.scaling.vitality],
                    [t("weapons.defense"), activeWeapon.scaling.defense],
                    [t("weapons.dexterity"), activeWeapon.scaling.dexterity],
                  ] as const
                ).map(([label, value]) =>
                  value ? (
                    <div key={label} className="min-w-0">
                      <span className="block text-xs uppercase opacity-70 truncate">{label}</span>
                      {label == t("weapons.vitality") && (
                        <span className="block text-2xl font-bold flex items-center justify-center gap-1">
                          {displayWeaponVitalityBonus(value, activeWeapon.level)}
                        </span>
                      )}
                      {label == t("weapons.defense") && (
                        <span className="block text-2xl font-bold flex items-center justify-center gap-1">
                          {displayWeaponDefenseBonus(value, activeWeapon.level)}
                        </span>
                      )}
                      {label == t("weapons.dexterity") && (
                        <span className="block text-2xl font-bold flex items-center justify-center gap-1">
                          {displayWeaponDexterityBonus(value, activeWeapon.level)}
                        </span>
                      )}
                    </div>
                  ) : null
                )}
                {activeWeapon.scaling.luck && (
                  <>
                    <div className="min-w-0">
                      <span className="block text-xs uppercase opacity-70 truncate">{t("weapons.proficiencyBonus")}</span>
                      <span className="block text-2xl font-bold flex items-center justify-center gap-1">
                        {displayWeaponProficiencyBonus(activeWeapon.scaling.luck, activeWeapon.level)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {!isGustave(player?.playerSheet?.characterId) && (
              <ul className="mt-4 w-full space-y-1 text-sm md:col-span-2">
                {(activeWeapon.passives ?? []).map((p: any) => {
                  const weaponId = getWeaponTranslationId(activeWeapon.name, weaponList);
                  const translatedEffect = getWeaponPassive(weaponId, p.level);
                  const effectText = translatedEffect || p.effect;
                  const locked = p.level > activeWeapon.level;

                  return (
                    <li key={p.level} className={`flex w-full items-start gap-2 ${locked ? "opacity-40" : ""}`}>
                      {locked
                        ? <FaLock className="mt-0.5 shrink-0 text-base-content/60" />
                        : <span className="w-3.5 shrink-0" />}
                      <span className={`font-semibold ${levelColor(p.level)}`}>Level {p.level}</span>
                      <span className="flex-1 opacity-90">: {renderTextWithDiceButtons(effectText, activeWeapon.name, diceBoardRef, timeoutDiceBoardRef)}</span>
                    </li>
                  );
                })}
              </ul>
              )}
            </div>
          )}
        </>
      )}

      <dialog ref={dialogRef} className="modal items-start pt-7">
        <div className="modal-box max-w-4xl w-[92vw] bg-base-100 text-base-content max-h-[92dvh] flex flex-col p-0 mobile-dialog">
          <div className="sticky top-0 z-10 flex flex-col gap-4 px-6 py-4 border-b border-base-300 bg-base-100">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xl">{modalTitle}</h3>
              <form method="dialog">
                <button className="btn btn-sm" onClick={closeSelector}>X</button>
              </form>
            </div>

            <input
              type="text"
              className="input input-bordered w-full bg-base-200 text-base-content border-base-300 focus:outline-none focus:ring-2 focus:ring-base-content/30 text-sm"
              placeholder={t("weapons.modal.searchPlaceholder")}
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
                    className="group rounded-2xl border border-base-300 bg-base-100 p-4 text-left hover:border-base-content/30 hover:shadow-lg focus:outline-none"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-4">
                      <div className="text-2xl font-extrabold w-full col-span-full md:col-span-2">
                        {weaponDetails.name}
                        <span className="ml-2 text-base font-semibold text-green-400/80">
                          {t("weapons.level")} {w.level}
                        </span>
                        {player?.playerSheet?.weaponId === w.id && modalMode !== "remove" ? (
                          <span className="ml-2 text-xs font-semibold text-primary">
                            ({t("weapons.modal.equipped")})
                          </span>
                        ) : null}

                        <span className="ml-2 inline-flex items-center gap-1 text-sm font-medium text-base-content/60">
                          ( {weaponDetails.attributes.power}
                          <FaChartLine aria-hidden="true" className="text-base-content/60" />)
                        </span>

                      </div>

                      <div className="shrink-0 flex items-center justify-center rounded-lg bg-base-200 p-2 ring-1 ring-base-content/30 max-h-30 md:col-start-1">
                        <img
                          src={`/weapons/${weaponDetails.name}.webp`}
                          alt={weaponDetails.name}
                          className="max-h-60 object-contain transform"
                          style={{ rotate: `${weaponDetails.rotation + 35}deg` }}
                        />
                      </div>

                      <div className="md:col-start-1">
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                          <div className="min-w-0">
                            <div className="uppercase tracking-wide text-sm opacity-70 mb-1 truncate">{t("weapons.power")}</div>
                            <div className="space-y-1">
                              {displayWeaponPlusPower(weaponDetails.attributes.power, w.level) !== null && (
                                <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                                  {displayWeaponPlusPower(weaponDetails.attributes.power, w.level)}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="min-w-0">
                            <div className="uppercase tracking-wide text-sm opacity-70 mb-1 truncate">{t("weapons.element")}</div>
                            <div className="text-3xl font-semibold mt-2">
                              {ELEMENT_EMOTE[weaponDetails?.attributes?.element ?? "Unknown"]}
                            </div>
                          </div>

                          {(
                            [
                              ["vitality",  t("weapons.vitality"), weaponDetails.attributes.scaling.vitality],
                              ["defense",   t("weapons.defense"),  weaponDetails.attributes.scaling.defense],
                              ["dexterity",  t("weapons.dexterity"), weaponDetails.attributes.scaling.dexterity],
                            ] as const
                          ).map(([key, label, value]) =>
                            value ? (
                              <div key={key} className="min-w-0">
                                <div className="uppercase tracking-wide text-sm opacity-70 mb-1 truncate">{label}</div>
                                {key === "vitality" && (
                                  <span className="block text-2xl font-bold flex items-center justify-center gap-1">
                                    {displayWeaponVitalityBonus(value, w.level)}
                                  </span>
                                )}
                                {key === "defense" && (
                                  <span className="block text-2xl font-bold flex items-center justify-center gap-1">
                                    {displayWeaponDefenseBonus(value, w.level)}
                                  </span>
                                )}
                                {key === "dexterity" && (
                                  <span className="block text-2xl font-bold flex items-center justify-center gap-1">
                                    {displayWeaponDexterityBonus(value, w.level)}
                                  </span>
                                )}
                              </div>
                            ) : null
                          )}
                          {weaponDetails.attributes.scaling.luck && (
                            <>
                              <div className="min-w-0">
                                <div className="uppercase tracking-wide text-sm opacity-70 mb-1 truncate">{t("weapons.proficiencyBonus")}</div>
                                <span className="block text-2xl font-bold flex items-center justify-center gap-1">
                                  {displayWeaponProficiencyBonus(weaponDetails.attributes.scaling.luck, w.level)}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {!isGustave(player?.playerSheet?.characterId) && (
                      <ul className="mt-4 w-full space-y-1 text-sm md:col-span-2">
                        {(weaponDetails?.passives ?? []).map((p: any) => {
                          const weaponId = getWeaponTranslationId(weaponDetails.name, weaponList);
                          const translatedEffect = getWeaponPassive(weaponId, p.level);
                          const effectText = translatedEffect || p.effect;
                          const locked = p.level > w.level;
                          return (
                            <li key={p.level} className={`flex w-full items-start gap-2 ${locked ? "opacity-40" : ""}`}>
                              {locked
                                ? <FaLock className="mt-0.5 shrink-0 text-base-content/60" />
                                : <span className="w-3.5 shrink-0" />}
                              <span className={`font-semibold ${levelColor(p.level)}`}>{t("weapons.level")} {p.level}</span>
                              <span className="flex-1 opacity-90">: {renderTextWithDiceButtons(effectText, weaponDetails.name, diceBoardRef, timeoutDiceBoardRef)}</span>
                            </li>
                          );
                        })}
                      </ul>
                      )}
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
        <div className="modal-box max-w-md w-[92vw] bg-base-100 text-base-content flex flex-col p-0">
          <div className="flex items-center justify-between px-6 py-4 border-b border-base-300 bg-base-100">
            <h3 className="font-bold text-xl">{t("weapons.modal.chooseLevel")}</h3>
            <form method="dialog">
              <button className="btn btn-sm" onClick={closeLevelDialog}>X</button>
            </form>
          </div>

          <div className="px-6 py-4 space-y-4">
            <p className="text-sm text-base-content/70">
              {t("weapons.modal.chooseLevelDescription")}
            </p>

            <div className="flex items-center gap-4 justify-center">
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => setPendingWeaponLevel(v => clamp(v - 1, 1, 4))}
                disabled={pendingWeaponLevel <= 1}
              >
                <FaChevronLeft />
              </button>

              <span className="text-4xl font-extrabold text-primary">
                {pendingWeaponLevel}
              </span>

              <button
                className="btn btn-sm btn-ghost"
                onClick={() => setPendingWeaponLevel(v => clamp(v + 1, 1, 4))}
                disabled={pendingWeaponLevel >= 4}
              >
                <FaChevronRight />
              </button>
            </div>

            <button
              className="btn btn-primary w-full"
              onClick={confirmAddWeapon}
            >
              {t("weapons.modal.confirm")}
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
