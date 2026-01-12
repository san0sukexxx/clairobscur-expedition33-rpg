import { useState } from "react";
import { type GetPlayerResponse } from "../api/APIPlayer";
import type { BattleCharacterInfo, StatusResponse } from "../api/ResponseModel";
import {
    getResolveButtonLabel,
    getStatusDescription,
    getStatusLabel,
    shouldShowStatusAmmount
} from "../utils/BattleUtils";
import { getActiveTurnCharacter } from "../utils/CharacterUtils";
import { getCurrentPlayerPendingStatus } from "../utils/StatusCalculator";
import { t } from "../i18n";

interface PendingStatusModalProps {
    player: GetPlayerResponse | null;
    onTapResolve: (status: StatusResponse, currentCharacter: BattleCharacterInfo | undefined) => void;
}

export default function PendingStatusModal({ player, onTapResolve }: PendingStatusModalProps) {
    const currentCharacter = getActiveTurnCharacter(player);
    const pendingStatus = getCurrentPlayerPendingStatus(player);
    const [isResolvingAll, setIsResolvingAll] = useState(false);
    const [resolvingCount, setResolvingCount] = useState({ current: 0, total: 0 });

    // Keep modal open while resolving all
    if (pendingStatus.length === 0 && !isResolvingAll) return null;

    async function handleResolveAll() {
        // Capture the current list before it changes
        const statusesToResolve = [...pendingStatus];

        setIsResolvingAll(true);
        setResolvingCount({ current: 0, total: statusesToResolve.length });

        // Wait for UI to update and show "Resolvendo..." state
        await new Promise(resolve => setTimeout(resolve, 150));

        // Resolve each status one by one
        for (let i = 0; i < statusesToResolve.length; i++) {
            setResolvingCount({ current: i + 1, total: statusesToResolve.length });
            const status = statusesToResolve[i];
            onTapResolve(status, currentCharacter);

            // Longer delay to allow animations and state updates
            await new Promise(resolve => setTimeout(resolve, 600));
        }

        setIsResolvingAll(false);
        setResolvingCount({ current: 0, total: 0 });
    }

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-md h-[80vh] flex flex-col">
                <h3 className="font-bold text-lg mb-2">{t("pendingStatus.title")}</h3>
                <p className="text-sm opacity-80 mb-2">
                    {t("pendingStatus.message")}
                </p>

                {(pendingStatus.length > 1 || isResolvingAll) && (
                    <button
                        className="btn btn-sm btn-success mb-4"
                        onClick={handleResolveAll}
                        disabled={isResolvingAll}
                    >
                        {isResolvingAll ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                {t("pendingStatus.resolvingAll")} ({resolvingCount.current}/{resolvingCount.total})
                            </>
                        ) : (
                            t("pendingStatus.resolveAll")
                        )}
                    </button>
                )}

                <div className="flex-1 flex flex-col gap-2 mb-4 overflow-y-auto">
                    {pendingStatus.length === 0 && isResolvingAll ? (
                        <div className="flex flex-col items-center justify-center gap-4 py-8">
                            <span className="loading loading-spinner loading-lg text-success"></span>
                            <p className="text-sm opacity-70">
                                {t("pendingStatus.resolvingAll")} ({resolvingCount.current}/{resolvingCount.total})
                            </p>
                        </div>
                    ) : (
                        pendingStatus.map((st, idx) => {
                            const showAmmount = shouldShowStatusAmmount(st.effectName);

                            return (
                                <div
                                    key={idx}
                                    className="rounded bg-base-200 px-2 py-2 text-sm flex flex-col gap-1"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="flex-1">
                                            {getStatusLabel(st.effectName)}{" "}
                                            {showAmmount && st.ammount != null ? st.ammount : ""}{" "}
                                            {st.effectName !== "IntenseFlames" && st.remainingTurns != null
                                                ? `(${st.remainingTurns} ${
                                                      st.remainingTurns > 1 ? t("pendingStatus.turns") : t("pendingStatus.turn")
                                                  })`
                                                : ""}
                                        </span>

                                        <button
                                            className="btn btn-xs btn-primary"
                                            onClick={() => onTapResolve(st, currentCharacter)}
                                            disabled={isResolvingAll}
                                        >
                                            {getResolveButtonLabel(st.effectName)}
                                        </button>
                                    </div>

                                    <div className="text-xs opacity-60 pl-1">
                                        {getStatusDescription(st.effectName)}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
