import { useState, useEffect, useMemo } from "react";
import type { WeaponInfo } from "../../api/ResponseModel";
import type { GetPlayerResponse } from "../../api/APIPlayer";
import { WeaponsDataLoader } from "../../utils/WeaponsDataLoader";
import type { UseWeaponInfoReturn } from "../../pages/PlayerPage/PlayerPage.types";

/**
 * Hook to manage weapon info loading and state
 */
export function useWeaponInfo(player: GetPlayerResponse | null): UseWeaponInfoReturn {
  const [weaponInfo, setWeaponInfo] = useState<WeaponInfo>({
    weapon: null,
    details: null,
  });

  const weaponList = useMemo(() => {
    return WeaponsDataLoader.getByFile(
      WeaponsDataLoader.fileForCharacter(player?.playerSheet?.characterId)
    );
  }, [player?.playerSheet?.characterId]);

  useEffect(() => {
    const weaponId = player?.playerSheet?.weaponId;

    if (!weaponId) {
      setWeaponInfo({ weapon: null, details: null });
      return;
    }

    const weapon = player?.weapons?.find(w => w.id === weaponId) ?? null;
    const details = weaponList.find(w => w.name === weaponId) ?? null;

    setWeaponInfo({ weapon, details });
  }, [player?.playerSheet?.weaponId, player?.weapons, weaponList]);

  return {
    weaponInfo,
    weaponList
  };
}
