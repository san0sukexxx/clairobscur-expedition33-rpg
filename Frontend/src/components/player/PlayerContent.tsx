import { useEffect, useRef, useMemo, type Dispatch, type SetStateAction, type RefObject, type MutableRefObject } from "react";
import type { GetPlayerResponse } from "../../api/APIPlayer";
import type { Campaign } from "../../api/APICampaign";
import type { BattleCharacterInfo, WeaponInfo } from "../../api/ResponseModel";
import type { WeaponDTO } from "../../types/WeaponDTO";
import type { DiceBoardRef } from "../DiceBoard";
import { COMBAT_MENU_ACTIONS, type CombatMenuAction } from "../../utils/CombatMenuActions";
import type { PlayerTab, CombatTabType, SpecialAttacksTabType } from "../../pages/PlayerPage/PlayerPage.types";

import WeaponSection from "../WeaponSection";
import PlayerSheet from "../PlayerSheet";
import { AbilityScoresSection } from "../AbilityScoresSection";
import { AbilityScoreSetup } from "../AbilityScoreSetup";
import { SavingThrowsSection } from "../SavingThrowsSection";
import { SensesSection } from "../SensesSection";
import { CombatStatsSection } from "../CombatStatsSection";
import PictosTab from "../PictosTab";
import LuminasSection from "../LuminasSection";
import SpecialAttacksSection from "../SpecialAttacksSection";
import SkillsSection from "../SkillsSection";
import { SkillProficiencySetup } from "../setup/SkillProficiencySetup";
import { ASIPickerSetup } from "../setup/ASIPickerSetup";
import ItemsSection from "../ItemsSection";
import CombatSection from "../CombatSection";
import { NotesSection } from "../NotesSection";
import { GameLogSection } from "../GameLogSection";

interface PlayerContentProps {
  tab: PlayerTab;
  setTab: (tab: PlayerTab) => void;
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
  isSelectingSpecialAttackTarget: boolean;
  pendingSpecialAttackId: string | null;
  combatTab: CombatTabType;
  setCombatTab: Dispatch<SetStateAction<CombatTabType>>;
  isExecutingSkill: boolean;
  excludeSelfFromTargeting: boolean;
  hitCharacters: Set<number>;

  // Skills props
  specialAttacksInitialTab: SpecialAttacksTabType;
  isUsingSpecialAttackMode: boolean;
  onUseSpecialAttack: (skillId: string) => void;

  // Skill info card
  activeSkillId: string | null;
  onDismissSkillCard: () => void;

  // Dice refs
  diceBoardRef: RefObject<DiceBoardRef | null>;
  timeoutDiceBoardRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;

  // Bottom sheet
  onBottomSheetChange?: (open: boolean) => void;
}

/**
 * Main content area that renders the active tab
 */
export function PlayerContent({
  tab,
  setTab,
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
  isSelectingSpecialAttackTarget,
  pendingSpecialAttackId,
  combatTab,
  setCombatTab,
  isExecutingSkill,
  excludeSelfFromTargeting,
  hitCharacters,
  specialAttacksInitialTab,
  isUsingSpecialAttackMode,
  onUseSpecialAttack,
  activeSkillId,
  onDismissSkillCard,
  diceBoardRef,
  timeoutDiceBoardRef,
  onBottomSheetChange,
}: PlayerContentProps) {
  const abilityScoresRef = useRef<HTMLDivElement>(null);

  const hasName = !!player?.playerSheet?.name?.trim();
  const hasCharacter = !!player?.playerSheet?.characterId;
  const sheetReady = hasName && hasCharacter;

  const ASI_LEVELS = [4, 8, 12, 16, 19];
  const currentLevel = player?.playerSheet?.totalPoints ?? 0;
  const pendingAsiLevel = ASI_LEVELS.find(
    lvl => lvl <= currentLevel && !player?.asiHistory?.some(h => h.level === lvl)
  ) ?? null;

  const abilityScoresDone = player?.setupProgress?.find(s => s.section === "abilityScores")?.done ?? false;
  const savingThrowProficiencyDone = true;
  const skillProficiencyDone = player?.setupProgress?.find(s => s.section === "skillProficiency")?.done ?? false;
  const prevSheetReady = useRef(sheetReady);
  const hasLoadedOnce = useRef(false);

  const setupComplete = useMemo(() => {
    return abilityScoresDone && skillProficiencyDone;
  }, [abilityScoresDone, skillProficiencyDone]);

  // Auto-navigate to pericias after ability scores setup
  // Skip on initial load (when player data arrives for the first time)
  const prevAbilityScoresDone = useRef(abilityScoresDone);
  useEffect(() => {
    if (hasLoadedOnce.current && abilityScoresDone && !prevAbilityScoresDone.current) {
      setTab("pericias");
    }
    prevAbilityScoresDone.current = abilityScoresDone;
  }, [abilityScoresDone, setTab]);

  // Auto-navigate to habilidades after skill proficiency setup
  // Skip on initial load (when player data arrives for the first time)
  const prevSkillProficiencyDone = useRef(skillProficiencyDone);
  useEffect(() => {
    if (hasLoadedOnce.current && skillProficiencyDone && !prevSkillProficiencyDone.current) {
      setTab("habilidades");
    }
    prevSkillProficiencyDone.current = skillProficiencyDone;
  }, [skillProficiencyDone, setTab]);

  // On first load, resume setup at the correct tab
  const hasResumedSetup = useRef(false);
  useEffect(() => {
    if (loading || hasResumedSetup.current || !player) return;
    hasResumedSetup.current = true;
    if (abilityScoresDone && !skillProficiencyDone) {
      setTab("pericias");
    } else if (abilityScoresDone && skillProficiencyDone) {
      // setup complete — don't override user's tab
    } else {
      // ability scores not done — stay on ficha
      if (tab !== "ficha") setTab("ficha");
    }
  }, [loading, player, abilityScoresDone, skillProficiencyDone, tab, setTab]);

  useEffect(() => {
    if (loading) return;
    if (!hasLoadedOnce.current) {
      hasLoadedOnce.current = true;
      prevSheetReady.current = sheetReady;
      return;
    }
    if (sheetReady && !prevSheetReady.current) {
      setTimeout(() => {
        abilityScoresRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
    prevSheetReady.current = sheetReady;
  }, [sheetReady, loading]);

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
          {sheetReady && pendingAsiLevel !== null && (
            <ASIPickerSetup
              player={player}
              setPlayer={setPlayer}
              asiLevel={pendingAsiLevel}
            />
          )}
          {sheetReady && (
            <>
              {abilityScoresDone && savingThrowProficiencyDone && (
                <CombatStatsSection
                  player={player}
                  setPlayer={setPlayer}
                  weaponInfo={weaponInfo}
                  diceBoardRef={diceBoardRef}
                  timeoutDiceBoardRef={timeoutDiceBoardRef}
                  onBattleInitiative={() => onMenuAction(COMBAT_MENU_ACTIONS.Initiative)}
                />
              )}

              <div ref={abilityScoresRef}>
                {!abilityScoresDone && (
                  <AbilityScoreSetup
                    player={player}
                    setPlayer={setPlayer}
                    diceBoardRef={diceBoardRef}
                    timeoutDiceBoardRef={timeoutDiceBoardRef}
                  />
                )}
                {abilityScoresDone && (
                  <AbilityScoresSection
                    player={player}
                    setPlayer={setPlayer}
                    weaponInfo={weaponInfo}
                    diceBoardRef={diceBoardRef}
                    timeoutDiceBoardRef={timeoutDiceBoardRef}
                  />
                )}
              </div>

              {abilityScoresDone && savingThrowProficiencyDone && (
                <>
                  <SavingThrowsSection
                    player={player}
                    weaponInfo={weaponInfo}
                    diceBoardRef={diceBoardRef}
                    timeoutDiceBoardRef={timeoutDiceBoardRef}
                  />
                  <SensesSection player={player} />
                </>
              )}
            </>
          )}
        </>
      )}

      {tab === "arma" && (
        <WeaponSection
          player={player}
          setPlayer={setPlayer}
          weaponList={weaponList}
          isAdmin={isAdmin}
          diceBoardRef={diceBoardRef}
          timeoutDiceBoardRef={timeoutDiceBoardRef}
        />
      )}

      {tab === "pictos" && (
        <PictosTab
          player={player}
          setPlayer={setPlayer}
          isAdmin={isAdmin}
          campaignId={campaignInfo?.id}
          diceBoardRef={diceBoardRef}
          timeoutDiceBoardRef={timeoutDiceBoardRef}
        />
      )}

      {tab === "luminas" && (
        <LuminasSection
          player={player}
          setPlayer={setPlayer}
          isAdmin={isAdmin}
          diceBoardRef={diceBoardRef}
          timeoutDiceBoardRef={timeoutDiceBoardRef}
        />
      )}

      {tab === "inventario" && (
        <ItemsSection
          player={player}
          setPlayer={setPlayer}
          diceBoardRef={diceBoardRef}
          timeoutDiceBoardRef={timeoutDiceBoardRef}
          onItemUsed={player?.fightInfo ? () => setTab("combate") : undefined}
        />
      )}

      {tab === "combate" && (
        <CombatSection
          onMenuAction={onMenuAction}
          player={player}
          onSelectTarget={onSelectTarget}
          isReviveMode={isReviveMode || pendingSpecialAttackId === "lune-rebirth"}
          isSelectingSpecialAttackTarget={isSelectingSpecialAttackTarget}
          forcedTab={combatTab}
          onTabChange={setCombatTab}
          isExecutingSkill={isExecutingSkill}
          isAdmin={isAdmin}
          excludeSelfFromTargeting={excludeSelfFromTargeting}
          hitCharacters={hitCharacters}
          activeSkillId={activeSkillId}
          onDismissSkillCard={onDismissSkillCard}
          diceBoardRef={diceBoardRef}
          timeoutDiceBoardRef={timeoutDiceBoardRef}
          onBottomSheetChange={onBottomSheetChange}
          weaponInfo={weaponInfo}
        />
      )}

      {tab === "habilidades" && (
        <SpecialAttacksSection
          player={player}
          setPlayer={setPlayer}
          isAdmin={isAdmin}
          initialTab={specialAttacksInitialTab}
          isUsingSpecialAttackMode={isUsingSpecialAttackMode}
          onUseSpecialAttack={onUseSpecialAttack}
        />
      )}

      {tab === "pericias" && (
        skillProficiencyDone ? (
          <SkillsSection
            player={player}
            setPlayer={setPlayer}
            weaponInfo={weaponInfo}
            isAdmin={isAdmin}
            diceBoardRef={diceBoardRef}
            timeoutDiceBoardRef={timeoutDiceBoardRef}
          />
        ) : (
          <SkillProficiencySetup
            player={player}
            setPlayer={setPlayer}
          />
        )
      )}

      {tab === "notas" && (
        <NotesSection
          player={player}
          setPlayer={setPlayer}
        />
      )}

      {tab === "gamelog" && (
        <GameLogSection player={player} />
      )}
    </section>
  );
}
