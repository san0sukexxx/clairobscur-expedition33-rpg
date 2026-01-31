import type { Dispatch, SetStateAction, RefObject, MutableRefObject } from "react";
import type { GetPlayerResponse } from "../../api/APIPlayer";
import type { Campaign } from "../../api/APICampaign";
import type { WeaponInfo, BattleCharacterInfo, AttackResponse, DefenseOption, AttackType, StatusResponse } from "../../api/ResponseModel";
import type { DiceBoardRef } from "../../components/DiceBoard";
import type { WeaponDTO } from "../../types/WeaponDTO";

/**
 * Tab types for PlayerPage navigation
 */
export type PlayerTab = "ficha" | "combate" | "habilidades" | "inventario" | "arma" | "pictos" | "luminas";

/**
 * Combat tab types
 */
export type CombatTabType = "enemies" | "team" | null;

/**
 * Skills initial tab types
 */
export type SkillsTabType = "list" | "picker";

/**
 * Props for usePlayerData hook
 */
export interface UsePlayerDataReturn {
  player: GetPlayerResponse | null;
  setPlayer: Dispatch<SetStateAction<GetPlayerResponse | null>>;
  campaignInfo: Campaign | null;
  loading: boolean;
  error: string | null;
  lastBattleLog: number | undefined;
  setLastBattleLog: Dispatch<SetStateAction<number | undefined>>;
}

/**
 * Props for useModalManager hook
 */
export interface UseModalManagerReturn {
  modalOpen: boolean;
  modalTitle: string | undefined;
  modalBody: React.ReactNode;
  openModal: (title: string, body: React.ReactNode) => void;
  closeModal: () => void;
  setModalBody: Dispatch<SetStateAction<React.ReactNode>>;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  setModalTitle: Dispatch<SetStateAction<string | undefined>>;
}

/**
 * Props for useTabNavigation hook
 */
export interface UseTabNavigationReturn {
  tab: PlayerTab;
  setTab: (tab: PlayerTab) => void;
  combatTab: CombatTabType;
  setCombatTab: Dispatch<SetStateAction<CombatTabType>>;
  skillsInitialTab: SkillsTabType;
  setSkillsInitialTab: Dispatch<SetStateAction<SkillsTabType>>;
  isUsingSkillMode: boolean;
  setIsUsingSkillMode: Dispatch<SetStateAction<boolean>>;
  isInventoryActiveInCombat: boolean;
  setIsInventoryActiveInCombat: Dispatch<SetStateAction<boolean>>;
  isReviveMode: boolean;
  setIsReviveMode: Dispatch<SetStateAction<boolean>>;
  revivePercent: number;
  setRevivePercent: Dispatch<SetStateAction<number>>;
}

/**
 * Props for useDiceBoard hook
 */
export interface UseDiceBoardReturn {
  diceBoardRef: RefObject<DiceBoardRef | null>;
  timeoutDiceBoardRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  clearDiceTimeout: () => void;
}

/**
 * Props for useWeaponInfo hook
 */
export interface UseWeaponInfoReturn {
  weaponInfo: WeaponInfo;
  weaponList: WeaponDTO[];
}

/**
 * Props for skill execution
 */
export interface SkillExecutionState {
  isExecutingSkill: boolean;
  setIsExecutingSkill: Dispatch<SetStateAction<boolean>>;
  pendingSkillId: string | null;
  setPendingSkillId: Dispatch<SetStateAction<string | null>>;
  isSelectingSkillTarget: boolean;
  setIsSelectingSkillTarget: Dispatch<SetStateAction<boolean>>;
  excludeSelfFromTargeting: boolean;
  setExcludeSelfFromTargeting: Dispatch<SetStateAction<boolean>>;
  isExecutingMezzoForte: boolean;
  setIsExecutingMezzoForte: Dispatch<SetStateAction<boolean>>;
}

/**
 * Props for combat actions
 */
export interface CombatActionsState {
  attackType: AttackType;
  setAttackType: Dispatch<SetStateAction<AttackType>>;
  hitCharacters: Set<number>;
  setHitCharacters: Dispatch<SetStateAction<Set<number>>>;
  lampmasterStacks: number;
  setLampmasterStacks: Dispatch<SetStateAction<number>>;
}

/**
 * Shared context for PlayerPage
 */
export interface PlayerPageContext {
  // Data
  player: GetPlayerResponse | null;
  setPlayer: Dispatch<SetStateAction<GetPlayerResponse | null>>;
  campaignInfo: Campaign | null;
  weaponInfo: WeaponInfo;
  weaponList: WeaponDTO[];

  // UI State
  loading: boolean;
  error: string | null;
  isAdmin: boolean;

  // Navigation
  tab: PlayerTab;
  setTab: (tab: PlayerTab) => void;

  // Combat
  isExecutingSkill: boolean;

  // Utilities
  showToast: (message: string, options?: { duration?: number }) => void;
  checkPlayerLoop: () => Promise<void>;
}

/**
 * Defense handler function type
 */
export type DefenseHandler = (attack: AttackResponse, defense: DefenseOption) => Promise<void>;

/**
 * Status resolve handler function type
 */
export type StatusResolveHandler = (status: StatusResponse, currentCharacter: BattleCharacterInfo | undefined) => void;

/**
 * Target selection handler function type
 */
export type TargetSelectionHandler = (target: BattleCharacterInfo) => void;
