import { SectionTitle, SubTitle, DecorativeRule } from "./ManualPage";
import { t } from "../i18n";

export function ManualMasterContent() {
  return (
    <>
      {/* ── INTRODUÇÃO ── */}
      <SectionTitle>{t("manual.master.intro")}</SectionTitle>
      <p>{t("manual.master.introText")}</p>

      {/* ── GERENCIANDO CAMPANHAS ── */}
      <SectionTitle>{t("manual.master.campaigns")}</SectionTitle>
      <p>{t("manual.master.campaignsText")}</p>
      <SubTitle>{t("manual.master.campaignCreation")}</SubTitle>
      <p>{t("manual.master.campaignCreationText")}</p>

      {/* ── ATRIBUTOS E MODIFICADORES ── */}
      <SectionTitle>{t("manual.master.attributes")}</SectionTitle>
      <p>{t("manual.master.attributesText")}</p>
      <table className="w-full text-xs my-2 border-collapse">
        <thead>
          <tr style={{ borderBottom: "2px solid #c9ad6a" }}>
            <th className="text-left py-1">{t("manual.master.score")}</th>
            <th className="text-center py-1">{t("manual.master.modifier")}</th>
            <th className="text-left py-1 pl-4">{t("manual.master.score")}</th>
            <th className="text-center py-1">{t("manual.master.modifier")}</th>
          </tr>
        </thead>
        <tbody>
          {[[6, -2, 14, 2], [7, -2, 15, 2], [8, -1, 16, 3], [9, -1, 17, 3], [10, 0, 18, 4], [11, 0, 19, 4], [12, 1, 20, 5], [13, 1, 22, 6]].map(([s1, m1, s2, m2], i) => (
            <tr key={i} style={{ borderBottom: "1px solid #d4c9a8" }}>
              <td className="py-0.5">{s1}</td>
              <td className="text-center">{m1 >= 0 ? `+${m1}` : m1}</td>
              <td className="pl-4">{s2}</td>
              <td className="text-center">{m2 >= 0 ? `+${m2}` : m2}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs italic mt-1" style={{ color: "#58473a" }}>{t("manual.master.modifierFormula")}</p>

      <SubTitle>{t("manual.master.proficiency")}</SubTitle>
      <p>{t("manual.master.proficiencyText")}</p>

      {/* ── COMBATE ── */}
      <SectionTitle>{t("manual.master.combat")}</SectionTitle>
      <p>{t("manual.master.combatText")}</p>

      <SubTitle>{t("manual.master.initiative")}</SubTitle>
      <p>{t("manual.master.initiativeText")}</p>

      <SubTitle>{t("manual.master.attackRolls")}</SubTitle>
      <p>{t("manual.master.attackRollsText")}</p>
      <div className="my-2 p-2 rounded" style={{ background: "#e8dcc4", border: "1px solid #c9b88c" }}>
        <p className="text-xs font-bold" style={{ color: "#58180d" }}>{t("manual.master.attackFormula")}</p>
        <p className="text-xs mt-1">{t("manual.master.attackFormulaDetail")}</p>
        <p className="text-xs font-bold mt-2" style={{ color: "#58180d" }}>{t("manual.master.damageFormula")}</p>
        <p className="text-xs mt-1">{t("manual.master.damageFormulaDetail")}</p>
      </div>

      <SubTitle>{t("manual.master.armorClass")}</SubTitle>
      <p>{t("manual.master.armorClassText")}</p>

      <SubTitle>{t("manual.master.defenseTypes")}</SubTitle>
      <p>{t("manual.master.defenseTypesText")}</p>
      <ul className="list-none ml-0 space-y-1 my-2">
        {["block", "dodge", "jump", "counter", "gradientBlock", "take"].map(d => (
          <li key={d} className="text-xs">
            <strong style={{ color: "#58180d" }}>{t(`manual.master.defense.${d}`)}.</strong>{" "}
            {t(`manual.master.defense.${d}Desc`)}
          </li>
        ))}
      </ul>

      <SubTitle>{t("manual.master.elements")}</SubTitle>
      <p>{t("manual.master.elementsText")}</p>

      <SubTitle>{t("manual.master.break")}</SubTitle>
      <p>{t("manual.master.breakText")}</p>

      {/* ── NPCS ── */}
      <SectionTitle>{t("manual.master.npcs")}</SectionTitle>
      <p>{t("manual.master.npcsText")}</p>

      <SubTitle>{t("manual.master.npcStats")}</SubTitle>
      <p>{t("manual.master.npcStatsText")}</p>

      <SubTitle>{t("manual.master.challengeRating")}</SubTitle>
      <p>{t("manual.master.challengeRatingText")}</p>

      <SubTitle>{t("manual.master.npcAttacks")}</SubTitle>
      <p>{t("manual.master.npcAttacksText")}</p>

      <SubTitle>{t("manual.master.intensity")}</SubTitle>
      <p>{t("manual.master.intensityText")}</p>
      <ul className="list-none ml-0 space-y-1 my-2">
        {["low", "medium", "high", "veryHigh", "extreme", "maximum"].map(i => (
          <li key={i} className="text-xs">
            <strong style={{ color: "#58180d" }}>{t(`manual.master.intensityLevel.${i}`)}.</strong>{" "}
            {t(`manual.master.intensityLevel.${i}Desc`)}
          </li>
        ))}
      </ul>

      <SubTitle>{t("manual.master.flyingEnemies")}</SubTitle>
      <p>{t("manual.master.flyingEnemiesText")}</p>

      {/* ── EFEITOS DE STATUS ── */}
      <SectionTitle>{t("manual.master.statusEffects")}</SectionTitle>
      <p>{t("manual.master.statusEffectsText")}</p>

      <SubTitle>{t("manual.master.positiveStatus")}</SubTitle>
      <ul className="list-none ml-0 space-y-1 my-2">
        {["hastened", "empowered", "regeneration", "shell", "shielded", "powerful", "rush", "aureole", "guardian", "successiveParry"].map(s => (
          <li key={s} className="text-xs">
            <strong style={{ color: "#58180d" }}>{t(`manual.master.status.${s}`)}.</strong>{" "}
            {t(`manual.master.status.${s}Desc`)}
          </li>
        ))}
      </ul>

      <SubTitle>{t("manual.master.negativeStatus")}</SubTitle>
      <ul className="list-none ml-0 space-y-1 my-2">
        {["slowed", "weakened", "unprotected", "cursed", "stunned", "confused", "frozen", "entangled", "silenced", "exhausted", "dizzy", "broken", "burning", "blight", "vulnerable", "inverted", "powerless"].map(s => (
          <li key={s} className="text-xs">
            <strong style={{ color: "#58180d" }}>{t(`manual.master.status.${s}`)}.</strong>{" "}
            {t(`manual.master.status.${s}Desc`)}
          </li>
        ))}
      </ul>

      {/* ── RECURSOS DE EQUIPE ── */}
      <SectionTitle>{t("manual.master.teamResources")}</SectionTitle>

      <SubTitle>{t("manual.master.gradient")}</SubTitle>
      <p>{t("manual.master.gradientText")}</p>

      <SubTitle>{t("manual.master.shields")}</SubTitle>
      <p>{t("manual.master.shieldsText")}</p>

      {/* ── EXPERIÊNCIA E RECOMPENSAS ── */}
      <SectionTitle>{t("manual.master.xpRewards")}</SectionTitle>
      <p>{t("manual.master.xpRewardsText")}</p>

      {/* ── MECÂNICAS DE PERSONAGENS ── */}
      <SectionTitle>{t("manual.master.characterMechanics")}</SectionTitle>
      <p>{t("manual.master.characterMechanicsText")}</p>

      {["gustave", "maelle", "lune", "sciel", "verso", "monoco"].map(c => (
        <div key={c}>
          <SubTitle>{t(`manual.master.char.${c}`)}</SubTitle>
          <p>{t(`manual.master.char.${c}Desc`)}</p>
        </div>
      ))}

      <DecorativeRule />
    </>
  );
}
