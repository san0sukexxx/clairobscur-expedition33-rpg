import { type GetPlayerResponse } from "../api/APIPlayer";
import { type BattleCharacterInfo } from "../api/ResponseModel";
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

    return (
        <div className="fixed bottom-20 left-4 z-40">
            <div
                className="
                    rounded-xl bg-base-100/95 shadow-lg border border-base-300
                    p-3 w-64
                "
            >
                <div className="flex flex-row gap-3 items-center justify-between">

                    {/* HP */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between text-[10px] uppercase">
                            <span className="opacity-70">Seu HP</span>
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

                    {/* MP */}
                    {ch.magicPoints !== undefined &&
                        ch.magicPoints !== null &&
                        ch.maxMagicPoints !== undefined &&
                        ch.maxMagicPoints !== null && (
                            <div className="flex-1">
                                <div className="flex items-center justify-between text-[10px] uppercase">
                                    <span className="opacity-70">Seu MP</span>
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
            </div>
        </div>
    );
}
