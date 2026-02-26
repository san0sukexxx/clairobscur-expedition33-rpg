import type { Dispatch, SetStateAction, RefObject, MutableRefObject } from "react";
import type { GetPlayerResponse } from "../../api/APIPlayer";
import type { Campaign } from "../../api/APICampaign";
import type { BattleCharacterInfo, WeaponInfo } from "../../api/ResponseModel";
import type { WeaponDTO } from "../../types/WeaponDTO";
import type { DiceBoardRef } from "../DiceBoard";
import type { CombatMenuAction } from "../../utils/CombatMenuActions";
import type { PlayerTab, CombatTabType, SkillsTabType } from "../../pages/PlayerPage/PlayerPage.types";

import WeaponSection from "../WeaponSection";
import PlayerSheet from "../PlayerSheet";
import { AbilityScoresSection } from "../AbilityScoresSection";
import { SavingThrowsSection } from "../SavingThrowsSection";
import { CombatStatsSection } from "../CombatStatsSection";
import PictosTab from "../PictosTab";
import LuminasSection from "../LuminasSection";
import SkillsSection from "../SkillsSection";
import ItemsSection from "../ItemsSection";
import CombatSection from "../CombatSection";

interface PlayerContentProps {
  tab: PlayerTab;
  loading: boolean;
  error: string | null;
  player: GetPlayerResponse | null;
  setPlayer: Dispatch<SetStateAction<GetPlayerResponse | null>>;
  campaignInfo: Campaign | null;
  weaponInfo: WeaponInfo;
  weaponList: WeaponDTO[];
  isAdmin: boolean;

  // Combat props
  onMenuAction: (action: CombatMenuAction) => void;
  onSelectTarget: (target: BattleCharacterInfo) => void;
  isReviveMode: boolean;
  isSelectingSkillTarget: boolean;
  pendingSkillId: string | null;
  combatTab: CombatTabType;
  setCombatTab: Dispatch<SetStateAction<CombatTabType>>;
  isExecutingSkill: boolean;
  excludeSelfFromTargeting: boolean;
  hitCharacters: Set<number>;

  // Inventory props
  isInventoryActiveInCombat: boolean;
  onReviveRequested: (percent: number) => void;
  onPotionUsed: () => void;

  // Skills props
  skillsInitialTab: SkillsTabType;
  isUsingSkillMode: boolean;
  onUseSkill: (skillId: string) => void;

  // Dice refs
  diceBoardRef: RefObject<DiceBoardRef | null>;
  timeoutDiceBoardRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
}

/**
 * Main content area that renders the active tab
 */
export function PlayerContent({
  tab,
  loading,
  error,
  player,
  setPlayer,
  campaignInfo,
  weaponInfo,
  weaponList,
  isAdmin,
  onMenuAction,
  onSelectTarget,
  isReviveMode,
  isSelectingSkillTarget,
  pendingSkillId,
  combatTab,
  setCombatTab,
  isExecutingSkill,
  excludeSelfFromTargeting,
  hitCharacters,
  isInventoryActiveInCombat,
  onReviveRequested,
  onPotionUsed,
  skillsInitialTab,
  isUsingSkillMode,
  onUseSkill,
  diceBoardRef,
  timeoutDiceBoardRef,
}: PlayerContentProps) {
  if (loading || error) {
    return null;
  }

  return (
    <section className="space-y-4">
      {tab === "ficha" && (
        <>
          <PlayerSheet
            player={player}
            setPlayer={setPlayer}
            campaignInfo={campaignInfo}
          />
          <CombatStatsSection
            player={player}
            setPlayer={setPlayer}
            diceBoardRef={diceBoardRef}
            timeoutDiceBoardRef={timeoutDiceBoardRef}
          />
          <AbilityScoresSection
            player={player}
            setPlayer={setPlayer}
            diceBoardRef={diceBoardRef}
            timeoutDiceBoardRef={timeoutDiceBoardRef}
          />
          <SavingThrowsSection
            player={player}
            diceBoardRef={diceBoardRef}
            timeoutDiceBoardRef={timeoutDiceBoardRef}
          />
        </>
      )}

      {tab === "arma" && (
        <WeaponSection
          player={player}
          setPlayer={setPlayer}
          weaponList={weaponList}
          isAdmin={isAdmin}
        />
      )}

      {tab === "pictos" && (
        <PictosTab
          player={player}
          setPlayer={setPlayer}
          isAdmin={isAdmin}
        />
      )}

      {tab === "luminas" && (
        <LuminasSection
          player={player}
          setPlayer={setPlayer}
          isAdmin={isAdmin}
        />
      )}

      {tab === "inventario" && (
        <ItemsSection
          player={player}
          setPlayer={setPlayer}
          isInventoryActiveInCombat={isInventoryActiveInCombat}
          weaponInfo={weaponInfo}
          onReviveRequested={onReviveRequested}
          onPotionUsed={onPotionUsed}
        />
      )}

      {tab === "combate" && (
        <CombatSection
          onMenuAction={onMenuAction}
          player={player}
          onSelectTarget={onSelectTarget}
          isReviveMode={isReviveMode || pendingSkillId === "lune-rebirth"}
          isSelectingSkillTarget={isSelectingSkillTarget}
          forcedTab={combatTab}
          onTabChange={setCombatTab}
          isExecutingSkill={isExecutingSkill}
          isAdmin={isAdmin}
          excludeSelfFromTargeting={excludeSelfFromTargeting}
          hitCharacters={hitCharacters}
        />
      )}

      {tab === "habilidades" && (
        <SkillsSection
          player={player}
          setPlayer={setPlayer}
          isAdmin={isAdmin}
          initialTab={skillsInitialTab}
          isUsingSkillMode={isUsingSkillMode}
          onUseSkill={onUseSkill}
        />
      )}
    </section>
  );
}
