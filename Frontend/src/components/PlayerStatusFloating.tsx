import { type GetPlayerResponse } from "../api/APIPlayer";
import { type BattleCharacterInfo } from "../api/ResponseModel";
import { getStatusLabel, shouldShowStatusAmmount } from "../utils/BattleUtils";
import { getEnrichedCharacterSkills } from "../utils/SkillUtils";
import AnimatedStatBar from "./AnimatedStatBar";

interface PlayerStatusFloatingProps {
    player: GetPlayerResponse | null;
}

function pct(cur: number, max: number) {
    return Math.max(0, Math.min(100, Math.round((cur / max) * 100)));
}

export default function PlayerStatusFloating({ player }: PlayerStatusFloatingProps) {
    const characters = player?.fightInfo?.characters ?? [];
    const playerBattleID = player?.fightInfo?.playerBattleID;

    const ch: BattleCharacterInfo | undefined =
        characters.find(c => c.battleID === playerBattleID) ?? characters.find(c => !c.isEnemy);

    if (!ch) return null;

    // Check if player is in the turns queue
    const playerInTurns = player?.fightInfo?.turns?.some(
        turn => turn.battleCharacterId === playerBattleID
    ) ?? false;

    // Check if player has any gradient skills equipped in slots
    const hasGradientSkills = player?.skills?.some(playerSkill => {
        if (playerSkill.slot === null || playerSkill.slot === undefined) return false;
        const skillData = getEnrichedCharacterSkills(player).find(s => s.id === playerSkill.skillId);
        return skillData?.isGradient ?? false;
    }) ?? false;

    return (
        <div className="fixed bottom-20 left-4 z-40">
            <div
                className="
                    rounded-xl bg-base-100/95 shadow-lg border border-base-300
                    p-3 w-64
                "
            >
                {ch.status && ch.status.length > 0 && (
                    <div className="mb-2 flex flex-row flex-wrap gap-1">
                        {ch.status.map((st, idx) => (
                            <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded bg-base-300 text-[10px] opacity-90"
                            >
                                {getStatusLabel(st.effectName)}{" "}
                                {shouldShowStatusAmmount(st.effectName) && st.ammount}
                                {st.remainingTurns ? ` (${st.remainingTurns})` : ""}
                            </span>
                        ))}
                    </div>
                )}

                <div className="flex flex-row gap-3 items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center justify-between text-[10px] uppercase">
                            <span className="opacity-70">HP</span>
                            <span className="font-mono text-xs">
                                {ch.healthPoints}/{ch.maxHealthPoints}
                            </span>
                        </div>
                        <AnimatedStatBar
                            value={pct(ch.healthPoints, ch.maxHealthPoints)}
                            label="HP"
                            fillClass="bg-error"
                            ghostClass="bg-error/30"
                        />
                    </div>

                    {ch.magicPoints !== undefined &&
                        ch.magicPoints !== null &&
                        ch.maxMagicPoints !== undefined &&
                        ch.maxMagicPoints !== null && (
                            <div className="flex-1">
                                <div className="flex items-center justify-between text-[10px] uppercase">
                                    <span className="opacity-70">MP</span>
                                    <span className="font-mono text-xs">
                                        {ch.magicPoints}/{ch.maxMagicPoints}
                                    </span>
                                </div>
                                <AnimatedStatBar
                                    value={pct(ch.magicPoints!, ch.maxMagicPoints!)}
                                    label="MP"
                                    fillClass="bg-info"
                                    ghostClass="bg-info/30"
                                />
                            </div>
                        )}
                </div>

                {/* Charge bar for Gustave - below HP/MP */}
                {ch.maxChargePoints !== undefined &&
                    ch.maxChargePoints !== null &&
                    ch.maxChargePoints > 0 && (
                        <div className="mt-2">
                            <div className="flex items-center justify-between text-[10px] uppercase">
                                <span className="opacity-70">Carga</span>
                                <span className="font-mono text-xs">
                                    {ch.chargePoints ?? 0}/{ch.maxChargePoints}
                                </span>
                            </div>
                            <AnimatedStatBar
                                value={pct(ch.chargePoints ?? 0, ch.maxChargePoints!)}
                                label="Carga"
                                fillClass="bg-warning"
                                ghostClass="bg-warning/30"
                            />
                        </div>
                    )}

                {/* Gradient bar - only if player has gradient skills equipped and is in turns */}
                {hasGradientSkills && playerInTurns && (
                        <div className="mt-2">
                            <div className="flex items-center justify-between text-[10px] uppercase">
                                <span className="opacity-70">Gradiente</span>
                                <span className="font-mono text-xs">
                                    {Math.floor((ch.gradientPoints ?? 0) / 12)}/3
                                </span>
                            </div>
                            <AnimatedStatBar
                                value={pct((ch.gradientPoints ?? 0) % 12, 12)}
                                label="Gradiente"
                                fillClass="bg-purple-500"
                                ghostClass="bg-purple-500/30"
                            />
                        </div>
                    )}

                {/* Sun/Moon charges for Sciel */}
                {ch.id.toLowerCase().includes("sciel") && (
                    <div className="mt-2 flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1.5">
                            <span className="text-amber-400">☀</span>
                            <span className="font-mono font-semibold text-amber-300">
                                {ch.sunCharges ?? 0}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-purple-400">☾</span>
                            <span className="font-mono font-semibold text-purple-300">
                                {ch.moonCharges ?? 0}
                            </span>
                        </div>
                    </div>
                )}

                {/* Stance indicator for Maelle only */}
                {ch.stance !== undefined &&
                 ch.id.toLowerCase().includes("maelle") && (
                    <div className="mt-2">
                        <div className="flex items-center gap-2 text-[10px]">
                            <span className="opacity-70">Postura</span>
                            {ch.stance === "Defensive" && (
                                <div className="badge badge-info badge-sm">Defensiva</div>
                            )}
                            {ch.stance === "Offensive" && (
                                <div className="badge badge-error badge-sm">Ofensiva</div>
                            )}
                            {ch.stance === "Virtuous" && (
                                <div className="badge badge-secondary badge-sm">Virtuosa</div>
                            )}
                            {!ch.stance && (
                                <div className="badge badge-ghost badge-sm">Sem postura</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Lune's Stain System */}
                {ch.id.toLowerCase().includes("lune") && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                        <span className="opacity-70 uppercase">Manchas</span>
                        <div className="flex items-center gap-1.5">
                            {[ch.stainSlot1, ch.stainSlot2, ch.stainSlot3, ch.stainSlot4].map((stain, idx) => {
                                if (!stain) {
                                    return (
                                        <div
                                            key={idx}
                                            className="w-5 h-5 rounded-full border-2 border-base-300 bg-base-200/30"
                                            title="Empty Slot"
                                        />
                                    );
                                }

                                const stainLower = stain.toLowerCase();
                                return (
                                    <img
                                        key={idx}
                                        src={`/stains/${stainLower}-stain.png`}
                                        alt={stain}
                                        title={`${stain} Stain`}
                                        className="w-5 h-5 object-contain"
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
