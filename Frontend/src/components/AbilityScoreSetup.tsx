import { useState, type RefObject, type MutableRefObject } from "react";
import { APIPlayer, type GetPlayerResponse, type AbilityScores } from "../api/APIPlayer";
import { calcStartingHp } from "../utils/CharacterUtils";
import { StandardArraySetup } from "./setup/StandardArraySetup";
import { ManualRolledSetup } from "./setup/ManualRolledSetup";
import { PointBuySetup } from "./setup/PointBuySetup";
import { useToast } from "./Toast";
import { t } from "../i18n";
import type { DiceBoardRef } from "./DiceBoard";
import { FaInfoCircle } from "react-icons/fa";
import { getAttackAttribute } from "../utils/AttackCalculator";
import PanelModal from "./PanelModal";

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
    const [showInfo, setShowInfo] = useState(false);
    const characterId = player?.playerSheet?.characterId ?? "";
    const primaryAbility = getAttackAttribute(characterId);
    const characterName = characterId.charAt(0).toUpperCase() + characterId.slice(1);

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
            <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{t("setup.abilityScoresTitle")}</h2>
                <button
                    onClick={() => setShowInfo(true)}
                    className="text-base-content/50 hover:text-primary transition-colors"
                    aria-label={t("setup.infoTitle")}
                >
                    <FaInfoCircle className="h-5 w-5" />
                </button>
            </div>

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

            <PanelModal
                open={showInfo}
                onClose={() => setShowInfo(false)}
                title={t("setup.infoTitle")}
                size="md"
            >
                <div className="flex flex-col gap-5 text-sm leading-relaxed text-neutral-300">
                    {/* Métodos */}
                    <div>
                        <h4 className="text-base font-semibold text-neutral-100 mb-2">{t("setup.infoMethodsTitle")}</h4>
                        <ul className="flex flex-col gap-2 list-disc pl-4">
                            <li>{t("setup.infoStandardArray")}</li>
                            <li>{t("setup.infoManualRolled")}</li>
                            <li>{t("setup.infoPointBuy")}</li>
                        </ul>
                    </div>

                    {/* Atributos */}
                    <div>
                        <h4 className="text-base font-semibold text-neutral-100 mb-2">{t("setup.infoAttributesTitle")}</h4>
                        <ul className="flex flex-col gap-2 list-disc pl-4">
                            <li><strong>{t("characterSheet.strength")}</strong> — {t("characterSheet.descStrength")}</li>
                            <li><strong>{t("characterSheet.dexterity")}</strong> — {t("characterSheet.descDexterity")}</li>
                            <li><strong>{t("characterSheet.constitution")}</strong> — {t("characterSheet.descConstitution")}</li>
                            <li><strong>{t("characterSheet.intelligence")}</strong> — {t("characterSheet.descIntelligence")}</li>
                            <li><strong>{t("characterSheet.wisdom")}</strong> — {t("characterSheet.descWisdom")}</li>
                            <li><strong>{t("characterSheet.charisma")}</strong> — {t("characterSheet.descCharisma")}</li>
                        </ul>
                    </div>

                    {/* Atributo principal */}
                    <div>
                        <h4 className="text-base font-semibold text-neutral-100 mb-2">{t("setup.infoPrimaryTitle")}</h4>
                        <p className="text-primary font-semibold">
                            {t("characterSheet.descPrimaryAbility", { characterName, abilityName: t(`characterSheet.${primaryAbility}`) })}
                        </p>
                    </div>
                </div>
            </PanelModal>
        </div>
    );
}
