import { type GetPlayerResponse } from "../api/APIPlayer";
import type { BattleCharacterInfo, StatusResponse } from "../api/ResponseModel";
import { getStatusLabel } from "../utils/BattleUtils";
import { getActiveTurnCharacter } from "../utils/CharacterUtils";
import { getCurrentPlayerPendingStatus } from "../utils/StatusCalculator";

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
                <h3 className="font-bold text-lg mb-2">Efeitos pendentes</h3>
                <p className="text-sm opacity-80 mb-4">
                    Resolva os efeitos abaixo antes de realizar suas ações neste turno.
                </p>

                <div className="flex-1 flex flex-col gap-2 mb-4 overflow-y-auto">
                    {pendingStatus.map((st, idx) => (
                        <div
                            key={idx}
                            className="flex items-center justify-between rounded bg-base-200 px-2 py-1 text-sm gap-2"
                        >
                            <span className="flex-1">
                                {getStatusLabel(st.effectName)} {st.ammount}{" "}
                                {st.remainingTurns
                                    ? `(${st.remainingTurns} turno${st.remainingTurns > 1 ? "s" : ""
                                    })`
                                    : ""}
                            </span>

                            <button
                                className="btn btn-xs btn-primary"
                                onClick={() => onTapResolve(st, currentCharacter)}>
                                Resolver
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
