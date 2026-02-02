import type { Dispatch, SetStateAction, RefObject } from "react";
import type { BattleCharacterInfo, WeaponInfo } from "../../../api/ResponseModel";
import type { GetPlayerResponse } from "../../../api/APIPlayer";
import type { DiceBoardRef } from "../../../components/DiceBoard";
import type { PlayerTab } from "../../../pages/PlayerPage/PlayerPage.types";
import type { ResolvedSkill } from "../../../utils/BattleSkillUtils";

export interface UseSkillExecutionParams {
  player: GetPlayerResponse | null | undefined;
  weaponInfo: WeaponInfo | null;
  diceBoardRef: RefObject<DiceBoardRef | null>;
  timeoutDiceBoardRef: RefObject<ReturnType<typeof setTimeout> | null>;
  showToast: (message: string) => void;
  setTab: (tab: PlayerTab) => void;
  setCombatTab: (tab: "enemies" | "team") => void;
  setIsUsingSkillMode: Dispatch<SetStateAction<boolean>>;
  setPendingSkillId: Dispatch<SetStateAction<string | null>>;
  setIsSelectingSkillTarget: Dispatch<SetStateAction<boolean>>;
  setExcludeSelfFromTargeting: Dispatch<SetStateAction<boolean>>;
  setIsExecutingSkill: Dispatch<SetStateAction<boolean>>;
  setHitCharacters: Dispatch<SetStateAction<Set<number>>>;
  checkPlayerLoop: () => void;
}

export interface SkillExecutionContext {
  player: GetPlayerResponse;
  source: BattleCharacterInfo;
  target: BattleCharacterInfo;
  weaponInfo: WeaponInfo | null;
  resolved: ResolvedSkill;
  skillCost: number;
  isGradientSkill: boolean;
  allCharacters: BattleCharacterInfo[];
  showToast: (message: string) => void;
}

export interface DiceRollContext {
  diceBoardRef: RefObject<DiceBoardRef | null>;
  timeoutDiceBoardRef: RefObject<ReturnType<typeof setTimeout> | null>;
}

export interface HitResult {
  damage: number;
  damageWithElement: number;
  finalDamage: number;
  hasCritical: boolean;
  chargeIncrease?: number;
}
