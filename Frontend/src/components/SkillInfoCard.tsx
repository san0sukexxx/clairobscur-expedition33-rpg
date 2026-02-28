import { getSpecialAttackById } from "../utils/SpecialAttackUtils";
import { DiamondThumb, highlightSkillDescription } from "../utils/SpecialAttackDisplayUtils";
import { t } from "../i18n";

interface SkillInfoCardProps {
    skillId: string;
    onDismiss: () => void;
}

export default function SkillInfoCard({ skillId, onDismiss }: SkillInfoCardProps) {
    const skill = getSpecialAttackById(skillId);
    if (!skill) return null;

    return (
        <div className="relative rounded-2xl bg-base-100 border border-base-300 overflow-hidden mb-4">
            {/* Close button */}
            <button
                className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-base-300 hover:bg-base-300/70 text-base-content/70 hover:text-base-content transition-colors"
                onClick={onDismiss}
                aria-label={t("common.close")}
            >
                ×
            </button>

            {/* Header */}
            <div className="grid grid-cols-[56px_1fr] items-center gap-3 p-4 pr-12">
                <DiamondThumb image={skill.image} alt={skill.name} />
                <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                        <span className="text-base font-semibold leading-tight">{skill.name}</span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold leading-none text-base-100 shadow-md ${skill.isGradient ? 'bg-purple-600' : 'bg-blue-600'}`}>
                            {skill.isGradient
                                ? `${skill.cost} ${skill.cost === 1 ? t("specialAttackPicker.charge") : t("specialAttackPicker.charges")}`
                                : skill.cost
                            }
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        {skill.type && (
                            <span className={`rounded-full border px-2 py-0.5 ${
                                skill.type === "sun"
                                    ? "border-amber-400/30 text-amber-300"
                                    : "border-purple-400/30 text-purple-300"
                            }`}>
                                {skill.type === "sun" ? "☀" : "☾"}
                            </span>
                        )}
                        {skill.isGradient && (
                            <span className="rounded-full border border-fuchsia-400/30 px-2 py-0.5 text-fuchsia-200">{t("specialAttackPicker.gradient")}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Description */}
            <div className="px-6 pb-4">
                <div className="whitespace-pre-line text-[15px] leading-snug text-base-content/90 break-words">
                    {highlightSkillDescription(skill.description, skill.id)}
                </div>
            </div>
        </div>
    );
}
