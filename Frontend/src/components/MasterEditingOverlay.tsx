import { GiAxeSwing } from "react-icons/gi";
import { t } from "../i18n";

export default function MasterEditingOverlay() {
    return (
        <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
            <GiAxeSwing className="text-white text-7xl animate-half-turn" />
            <div className="text-white text-xl mt-6 text-center leading-relaxed">
                <p>{t("masterEditing.title")}</p>
                <p>{t("masterEditing.wait")}</p>
            </div>
        </div>
    );
}
