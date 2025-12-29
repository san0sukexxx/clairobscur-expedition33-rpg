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

    if (pendingStatus.length === 0) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-md h-[80vh] flex flex-col">
                <h3 className="font-bold text-lg mb-2">{t("pendingStatus.title")}</h3>
                <p className="text-sm opacity-80 mb-4">
                    {t("pendingStatus.message")}
                </p>

                <div className="flex-1 flex flex-col gap-2 mb-4 overflow-y-auto">
                    {pendingStatus.map((st, idx) => {
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
                                        {st.remainingTurns
                                            ? `(${st.remainingTurns} ${
                                                  st.remainingTurns > 1 ? t("pendingStatus.turns") : t("pendingStatus.turn")
                                              })`
                                            : ""}
                                    </span>

                                    <button
                                        className="btn btn-xs btn-primary"
                                        onClick={() => onTapResolve(st, currentCharacter)}
                                    >
                                        {getResolveButtonLabel(st.effectName)}
                                    </button>
                                </div>

                                <div className="text-xs opacity-60 pl-1">
                                    {getStatusDescription(st.effectName)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
