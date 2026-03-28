import { useState } from "react";
import { APIPlayer, type GetPlayerResponse } from "../../api/APIPlayer";
import { useToast } from "../Toast";
import { t } from "../../i18n";

type AbilityKey = "strength" | "dexterity" | "constitution" | "intelligence" | "wisdom" | "charisma";

const ABILITIES: AbilityKey[] = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];

interface Props {
    player: GetPlayerResponse | null;
    setPlayer: React.Dispatch<React.SetStateAction<GetPlayerResponse | null>>;
    asiLevel: number;
}

export function ASIPickerSetup({ player, setPlayer, asiLevel }: Props) {
    const { showToast } = useToast();
    const [mode, setMode] = useState<"one" | "two">("one");
    const [attr1, setAttr1] = useState<AbilityKey | "">("");
    const [attr2, setAttr2] = useState<AbilityKey | "">("");
    const [saving, setSaving] = useState(false);

    const canConfirm = mode === "one"
        ? attr1 !== ""
        : attr1 !== "" && attr2 !== "" && attr1 !== attr2;

    async function handleConfirm() {
        if (!player || !canConfirm) return;
        setSaving(true);
        try {
            await APIPlayer.applyAsi(player.id, {
                level: asiLevel,
                attribute1: attr1 as AbilityKey,
                amount1: mode === "one" ? 2 : 1,
                attribute2: mode === "two" ? (attr2 as AbilityKey) : undefined,
                amount2: mode === "two" ? 1 : undefined,
            });
            const updated = await APIPlayer.get(player.id);
            setPlayer(updated);
        } catch {
            showToast(t("common.errorSaving"));
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="rounded-box bg-base-100 shadow p-4 flex flex-col gap-4 border border-primary/30">
            <div>
                <h2 className="text-xl font-bold text-primary">
                    {t("asi.levelTitle", { level: asiLevel })}
                </h2>
                <p className="text-sm opacity-60 mt-1">{t("asi.description")}</p>
            </div>

            {/* Mode selector */}
            <div className="flex gap-2">
                <button
                    onClick={() => { setMode("one"); setAttr2(""); }}
                    className={`btn btn-sm flex-1 ${mode === "one" ? "btn-primary" : "btn-outline"}`}
                >
                    {t("asi.chooseOne")}
                </button>
                <button
                    onClick={() => setMode("two")}
                    className={`btn btn-sm flex-1 ${mode === "two" ? "btn-primary" : "btn-outline"}`}
                >
                    {t("asi.chooseTwo")}
                </button>
            </div>

            {/* Attribute selectors */}
            <div className={`grid gap-3 ${mode === "two" ? "grid-cols-2" : "grid-cols-1"}`}>
                <label className="form-control">
                    <span className="label-text text-xs opacity-60 mr-2">
                        {mode === "one" ? "+2" : "+1"}
                    </span>
                    <select
                        className="select select-bordered select-sm"
                        value={attr1}
                        onChange={e => setAttr1(e.target.value as AbilityKey | "")}
                    >
                        <option value="">—</option>
                        {ABILITIES.map(a => (
                            <option key={a} value={a} disabled={mode === "two" && a === attr2}>
                                {t(`asi.${a}`)}
                            </option>
                        ))}
                    </select>
                </label>

                {mode === "two" && (
                    <label className="form-control">
                        <span className="label-text text-xs opacity-60 mr-2">+1</span>
                        <select
                            className="select select-bordered select-sm"
                            value={attr2}
                            onChange={e => setAttr2(e.target.value as AbilityKey | "")}
                        >
                            <option value="">—</option>
                            {ABILITIES.map(a => (
                                <option key={a} value={a} disabled={a === attr1}>
                                    {t(`asi.${a}`)}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleConfirm}
                    disabled={!canConfirm || saving}
                    className="btn btn-primary btn-sm"
                >
                    {saving
                        ? <span className="loading loading-spinner loading-xs" />
                        : t("asi.confirm")}
                </button>
            </div>
        </div>
    );
}
