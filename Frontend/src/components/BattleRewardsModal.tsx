import React, { useState } from "react";
import type { BattleReward } from "../api/ResponseModel";
import type { GetPlayerResponse } from "../api/APIPlayer";
import { t, getWeaponName, getPictoName, getPictoEnglishName, getWeaponEnglishName, toKebabCase } from "../i18n";

// Map weapon types to characters that can use them
const WEAPON_CHARACTER_MAP: Record<string, string[]> = {
    "sword": ["verso", "gustave"],
    "lune": ["lune"],
    "maelle": ["maelle"],
    "monoco": ["monoco"],
    "sciel": ["sciel"]
};

// Determine weapon type from weapon ID
function getWeaponType(weaponId: string): string | null {
    const id = weaponId.toLowerCase();

    // Check if it's a sword (verso/gustave weapons)
    if (id.includes("verso") || id.includes("gustave") ||
        ["lanceram", "abysseram", "algueron", "angerim", "verleso", "lunerim", "maellum", "noahram", "scieleson"].includes(id)) {
        return "sword";
    }

    // Check if it's a Lune weapon
    if (id.includes("lune") || id.startsWith("baguette-lune")) {
        return "lune";
    }

    // Check if it's a Maelle weapon
    if (id.includes("maelle") || id.startsWith("baguette-maelle")) {
        return "maelle";
    }

    // Check if it's a Monoco weapon
    if (id.includes("monoco")) {
        return "monoco";
    }

    // Check if it's a Sciel weapon
    if (id.includes("sciel")) {
        return "sciel";
    }

    return null;
}

// Check if a character can use a weapon
function canCharacterUseWeapon(characterId: string | undefined, weaponId: string): boolean {
    if (!characterId) return false;

    const weaponType = getWeaponType(weaponId);
    if (!weaponType) return true; // Unknown weapon type, allow it

    const allowedCharacters = WEAPON_CHARACTER_MAP[weaponType];
    if (!allowedCharacters) return true;

    const charId = characterId.toLowerCase();
    return allowedCharacters.some(char => charId.includes(char));
}

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

                        // For weapons, use English name from translations (which matches the file name)
                        // For pictos, use English name from translations
                        const imageFileName = isWeapon
                            ? getWeaponEnglishName(kebabId)
                            : getPictoEnglishName(kebabId);

                        const imagePath = isWeapon
                            ? `/weapons/${imageFileName}.webp`
                            : `/pictos/${imageFileName}.webp`;

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
                                                e.currentTarget.src = "/placeholder-item.webp";
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
                                    {players.map(player => {
                                        // Check if player already has this item (case-insensitive comparison)
                                        const playerAlreadyHasItem = isWeapon
                                            ? player.weapons?.some(w => w.id.toLowerCase() === kebabId.toLowerCase())
                                            : player.pictos?.some(p => p.pictoId.toLowerCase() === kebabId.toLowerCase());

                                        // Check if character can use this weapon
                                        const canUseWeapon = !isWeapon || canCharacterUseWeapon(player.playerSheet?.characterId, kebabId);

                                        // Determine if button should be disabled
                                        const isDisabled = isClaimingThis || playerAlreadyHasItem || !canUseWeapon;

                                        // Determine tooltip
                                        let tooltipText: string | undefined;
                                        if (playerAlreadyHasItem) {
                                            tooltipText = t("rewards.alreadyOwned");
                                        } else if (!canUseWeapon) {
                                            tooltipText = t("rewards.cannotUse");
                                        }

                                        return (
                                            <button
                                                key={player.id}
                                                onClick={() => handleClaimClick(reward, player.id)}
                                                className={`btn btn-sm ${isDisabled ? 'btn-disabled' : 'btn-success'}`}
                                                disabled={isDisabled}
                                                title={tooltipText}
                                            >
                                                {isClaimingThis ? (
                                                    <span className="loading loading-spinner loading-xs"></span>
                                                ) : (
                                                    player.playerSheet?.characterId
                                                )}
                                            </button>
                                        );
                                    })}
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
