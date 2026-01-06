import React from "react";
import AnimatedStatBar from "./AnimatedStatBar";
import type { BattleCharacterInfo, BattleTurnResponse } from "../api/ResponseModel";
import type { GetPlayerResponse } from "../api/APIPlayer";
import { getEnrichedCharacterSkills } from "../utils/SkillUtils";
import { t } from "../i18n";
import { FaEdit } from "react-icons/fa";

interface GradientBarProps {
    characters?: BattleCharacterInfo[];
    player?: GetPlayerResponse | null;
    turns?: BattleTurnResponse[];
    forceShowTeamIsEnemy?: boolean; // When true, show enemy team gradient; when false, show ally team gradient
    isAdmin?: boolean; // Show edit button only in admin mode
    onEditGradient?: () => void; // Callback to open edit modal
}

function pct(cur: number, max: number) {
    return Math.max(0, Math.min(100, Math.round((cur / max) * 100)));
}

export default function GradientBar({ characters, player, turns, forceShowTeamIsEnemy, isAdmin, onEditGradient }: GradientBarProps) {
    if (!characters || characters.length === 0) return null;

    // Admin mode: force show specific team
    if (forceShowTeamIsEnemy !== undefined) {
        const teamGradientPoints = forceShowTeamIsEnemy
            ? (characters.find(ch => ch.isEnemy)?.gradientPoints ?? 0)
            : (characters.find(ch => !ch.isEnemy)?.gradientPoints ?? 0);

        const charges = Math.floor(teamGradientPoints / 12);
        const progressValue = charges >= 3 ? 100 : pct(teamGradientPoints % 12, 12);

        return (
            <div className="w-full max-w-none self-stretch min-w-0 rounded-xl border border-neutral-700 bg-neutral-900 shadow-md p-4 mt-4">
                <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span>{t("combat.gradientCharges")} ({forceShowTeamIsEnemy ? "Time B" : "Time A"})</span>
                        <div className="flex items-center gap-2">
                            <span className="font-bold">{charges}/3</span>
                            {isAdmin && onEditGradient && (
                                <button
                                    onClick={onEditGradient}
                                    className="btn btn-xs btn-ghost"
                                    title="Editar cargas de gradiente"
                                >
                                    <FaEdit />
                                </button>
                            )}
                        </div>
                    </div>
                    <AnimatedStatBar
                        value={progressValue}
                        label={t("combat.gradient")}
                        fillClass="bg-purple-500"
                        ghostClass="bg-purple-500/30"
                    />
                </div>
            </div>
        );
    }

    // Player mode: check all conditions
    if (!player) return null;

    // Check if player is in the battle (present in the turn queue)
    const playerBattleID = player?.fightInfo?.playerBattleID;
    const playerChar = characters.find(ch => ch.battleID === playerBattleID);

    // If player is not in battle yet, don't show gradient bar
    if (!playerChar) return null;

    // Check if player is in the turns queue
    const playerInTurns = turns?.some(turn => turn.battleCharacterId === playerBattleID);
    if (!playerInTurns) return null;

    // Check if player has any gradient skills equipped in slots
    const hasGradientSkills = player?.skills?.some(playerSkill => {
        if (playerSkill.slot === null || playerSkill.slot === undefined) return false;
        const skillData = getEnrichedCharacterSkills(player).find(s => s.id === playerSkill.skillId);
        return skillData?.isGradient ?? false;
    }) ?? false;

    if (!hasGradientSkills) return null;

    // Get gradient points from player's team only
    const isPlayerEnemy = playerChar?.isEnemy ?? false;

    const teamGradientPoints = isPlayerEnemy
        ? (characters.find(ch => ch.isEnemy)?.gradientPoints ?? 0)
        : (characters.find(ch => !ch.isEnemy)?.gradientPoints ?? 0);

    const charges = Math.floor(teamGradientPoints / 12);
    const progressValue = charges >= 3 ? 100 : pct(teamGradientPoints % 12, 12);

    return (
        <div className="w-full max-w-none self-stretch min-w-0 rounded-xl border border-neutral-700 bg-neutral-900 shadow-md p-4 mt-4">
            <div>
                <div className="flex items-center justify-between text-sm mb-2">
                    <span>{t("combat.gradientCharges")}</span>
                    <span className="font-bold">{charges}/3</span>
                </div>
                <AnimatedStatBar
                    value={progressValue}
                    label={t("combat.gradient")}
                    fillClass="bg-purple-500"
                    ghostClass="bg-purple-500/30"
                />
            </div>
        </div>
    );
}
