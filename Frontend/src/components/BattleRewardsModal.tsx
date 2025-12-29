import React, { useState } from "react";
import type { BattleReward } from "../api/ResponseModel";
import type { GetPlayerResponse } from "../api/APIPlayer";
import { t, getWeaponName, getPictoName, getPictoEnglishName, getWeaponEnglishName, toKebabCase } from "../i18n";

interface BattleRewardsModalProps {
    rewards: BattleReward[];
    players: GetPlayerResponse[];
    onClose: () => void;
    onClaimReward: (reward: BattleReward, playerId: number) => Promise<void>;
}

export default function BattleRewardsModal({ rewards, players, onClose, onClaimReward }: BattleRewardsModalProps) {
    const [claimingReward, setClaimingReward] = useState<string | null>(null);

    const handleClaimClick = async (reward: BattleReward, playerId: number) => {
        const rewardKey = `${reward.type}-${reward.itemId}`;
        setClaimingReward(rewardKey);
        try {
            await onClaimReward(reward, playerId);
        } finally {
            setClaimingReward(null);
        }
    };

    if (rewards.length === 0) {
        return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                <div className="bg-base-200 p-8 rounded-lg shadow-2xl max-w-md w-full">
                    <h2 className="text-2xl font-bold text-center mb-4">{t("battle.victoryTitle")}</h2>
                    <p className="text-center mb-6">{t("battle.noRewards")}</p>
                    <button
                        onClick={onClose}
                        className="btn btn-primary w-full"
                    >
                        {t("common.close")}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-base-200 p-8 rounded-lg shadow-2xl max-w-2xl w-full">
                <h2 className="text-3xl font-bold text-center mb-2 text-success">
                    {t("battle.victoryTitle")}
                </h2>
                <p className="text-center text-lg mb-6 opacity-80">
                    {t("battle.rewardsEarned")}
                </p>

                <div className="space-y-4 mb-6">
                    {rewards.map((reward, index) => {
                        const isWeapon = reward.type === "weapon";
                        const kebabId = toKebabCase(reward.itemId);
                        const displayName = isWeapon
                            ? getWeaponName(kebabId)
                            : getPictoName(kebabId);
                        const englishName = isWeapon
                            ? getWeaponEnglishName(kebabId)
                            : getPictoEnglishName(kebabId);

                        const imagePath = isWeapon
                            ? `/weapons/${englishName}.png`
                            : `/pictos/${englishName}.png`;

                        const rewardKey = `${reward.type}-${reward.itemId}`;
                        const isClaimingThis = claimingReward === rewardKey;

                        return (
                            <div
                                key={index}
                                className="flex items-center gap-4 bg-base-300 p-4 rounded-lg"
                            >
                                <div className="avatar">
                                    <div className="w-16 h-16 rounded-lg">
                                        <img
                                            src={imagePath}
                                            alt={displayName}
                                            onError={(e) => {
                                                e.currentTarget.src = "/placeholder-item.png";
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <h3 className="font-bold text-lg">{displayName}</h3>
                                    <div className="flex items-center gap-2 text-sm opacity-70">
                                        <span className={`badge ${isWeapon ? "badge-warning" : "badge-info"}`}>
                                            {isWeapon ? t("rewards.weapon") : t("rewards.picto")}
                                        </span>
                                        <span className="badge badge-outline">
                                            {t("rewards.level")} {reward.level}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {players.map(player => (
                                        <button
                                            key={player.id}
                                            onClick={() => handleClaimClick(reward, player.id)}
                                            className="btn btn-success btn-sm"
                                            disabled={isClaimingThis}
                                        >
                                            {isClaimingThis ? (
                                                <span className="loading loading-spinner loading-xs"></span>
                                            ) : (
                                                player.characterId
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <button
                    onClick={onClose}
                    className="btn btn-ghost w-full"
                >
                    {t("common.close")}
                </button>
            </div>
        </div>
    );
}
