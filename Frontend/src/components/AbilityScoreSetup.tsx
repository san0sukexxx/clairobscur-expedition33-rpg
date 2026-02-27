import { useState, type RefObject, type MutableRefObject } from "react";
import { APIPlayer, type GetPlayerResponse, type AbilityScores } from "../api/APIPlayer";
import { calcStartingHp } from "../utils/CharacterUtils";
import { StandardArraySetup } from "./setup/StandardArraySetup";
import { ManualRolledSetup } from "./setup/ManualRolledSetup";
import { PointBuySetup } from "./setup/PointBuySetup";
import { useToast } from "./Toast";
import { t } from "../i18n";
import type { DiceBoardRef } from "./DiceBoard";

export type GenerationMethod = "standardArray" | "manualRolled" | "pointBuy";

interface AbilityScoreSetupProps {
    player: GetPlayerResponse | null;
    setPlayer: React.Dispatch<React.SetStateAction<GetPlayerResponse | null>>;
    diceBoardRef: RefObject<DiceBoardRef | null>;
    timeoutDiceBoardRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
}

export function AbilityScoreSetup({ player, setPlayer, diceBoardRef, timeoutDiceBoardRef }: AbilityScoreSetupProps) {
    const { showToast } = useToast();
    const [method, setMethod] = useState<GenerationMethod | "">("");
    const [saving, setSaving] = useState(false);

    async function handleConfirm(scores: Required<AbilityScores>) {
        if (!player) return;
        setSaving(true);
        try {
            const hpMax = calcStartingHp(player.playerSheet?.characterId, scores.constitution);

            await APIPlayer.update(player.id, {
                playerSheet: {
                    ...player.playerSheet,
                    abilityScores: scores,
                    hpMax,
                    hpCurrent: hpMax,
                },
            });
            await APIPlayer.updateSetupProgress(player.id, "abilityScores", true);

            setPlayer({
                ...player,
                playerSheet: {
                    ...player.playerSheet,
                    abilityScores: scores,
                    hpMax,
                    hpCurrent: hpMax,
                },
                setupProgress: [
                    ...(player.setupProgress?.filter(s => s.section !== "abilityScores") ?? []),
                    { section: "abilityScores", done: true },
                ],
            });
        } catch {
            showToast(t("common.errorSaving"));
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="rounded-box bg-base-100 shadow p-4 flex flex-col gap-4">
            <h2 className="text-2xl font-bold">{t("setup.abilityScoresTitle")}</h2>

            <select
                className="select select-bordered w-full"
                value={method}
                onChange={(e) => setMethod(e.target.value as GenerationMethod | "")}
                disabled={saving}
            >
                <option value="">{t("setup.chooseMethod")}</option>
                <option value="standardArray">{t("setup.standardArray")}</option>
                <option value="manualRolled">{t("setup.manualRolled")}</option>
                <option value="pointBuy">{t("setup.pointBuy")}</option>
            </select>

            {method === "standardArray" && (
                <StandardArraySetup onConfirm={handleConfirm} />
            )}

            {method === "manualRolled" && (
                <ManualRolledSetup
                    diceBoardRef={diceBoardRef}
                    timeoutDiceBoardRef={timeoutDiceBoardRef}
                    onConfirm={handleConfirm}
                />
            )}

            {method === "pointBuy" && (
                <PointBuySetup onConfirm={handleConfirm} />
            )}

            {saving && (
                <div className="flex justify-center">
                    <span className="loading loading-spinner loading-sm" />
                </div>
            )}
        </div>
    );
}
