import { SectionTitle, SubTitle, DecorativeRule } from "./ManualPage";
import { t } from "../i18n";

export function ManualPlayerContent() {
  return (
    <>
      {/* ── INTRODUÇÃO ── */}
      <SectionTitle>{t("manual.player.intro")}</SectionTitle>
      <p>{t("manual.player.introText")}</p>

      {/* ── SUA FICHA ── */}
      <SectionTitle>{t("manual.player.sheet")}</SectionTitle>
      <p>{t("manual.player.sheetText")}</p>

      <SubTitle>{t("manual.player.attributes")}</SubTitle>
      <p>{t("manual.player.attributesText")}</p>
      <ul className="list-none ml-0 space-y-1 my-2">
        {["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"].map(a => (
          <li key={a} className="text-xs">
            <strong style={{ color: "#58180d" }}>{t(`manual.player.attr.${a}`)}.</strong>{" "}
            {t(`manual.player.attr.${a}Desc`)}
          </li>
        ))}
      </ul>

      <SubTitle>{t("manual.player.hpMp")}</SubTitle>
      <p>{t("manual.player.hpMpText")}</p>

      <SubTitle>{t("manual.player.armorClass")}</SubTitle>
      <p>{t("manual.player.armorClassText")}</p>

      {/* ── COMBATE ── */}
      <SectionTitle>{t("manual.player.combat")}</SectionTitle>
      <p>{t("manual.player.combatText")}</p>

      <SubTitle>{t("manual.player.initiative")}</SubTitle>
      <p>{t("manual.player.initiativeText")}</p>

      <SubTitle>{t("manual.player.yourTurn")}</SubTitle>
      <p>{t("manual.player.yourTurnText")}</p>

      <SubTitle>{t("manual.player.attacking")}</SubTitle>
      <p>{t("manual.player.attackingText")}</p>

      <SubTitle>{t("manual.player.defending")}</SubTitle>
      <p>{t("manual.player.defendingText")}</p>
      <ul className="list-none ml-0 space-y-1 my-2">
        {["block", "dodge", "jump", "counter", "take"].map(d => (
          <li key={d} className="text-xs">
            <strong style={{ color: "#58180d" }}>{t(`manual.player.defense.${d}`)}.</strong>{" "}
            {t(`manual.player.defense.${d}Desc`)}
          </li>
        ))}
      </ul>

      <SubTitle>{t("manual.player.elements")}</SubTitle>
      <p>{t("manual.player.elementsText")}</p>

      {/* ── EFEITOS DE STATUS ── */}
      <SectionTitle>{t("manual.player.statusEffects")}</SectionTitle>
      <p>{t("manual.player.statusEffectsText")}</p>

      <SubTitle>{t("manual.player.buffs")}</SubTitle>
      <ul className="list-none ml-0 space-y-1 my-2">
        {["hastened", "empowered", "regeneration", "shell", "shielded", "powerful", "aureole"].map(s => (
          <li key={s} className="text-xs">
            <strong style={{ color: "#58180d" }}>{t(`manual.player.status.${s}`)}.</strong>{" "}
            {t(`manual.player.status.${s}Desc`)}
          </li>
        ))}
      </ul>

      <SubTitle>{t("manual.player.debuffs")}</SubTitle>
      <ul className="list-none ml-0 space-y-1 my-2">
        {["slowed", "weakened", "cursed", "stunned", "confused", "frozen", "entangled", "silenced", "burning", "broken", "plagued"].map(s => (
          <li key={s} className="text-xs">
            <strong style={{ color: "#58180d" }}>{t(`manual.player.status.${s}`)}.</strong>{" "}
            {t(`manual.player.status.${s}Desc`)}
          </li>
        ))}
      </ul>

      {/* ── HABILIDADES ESPECIAIS ── */}
      <SectionTitle>{t("manual.player.specialAttacks")}</SectionTitle>
      <p>{t("manual.player.specialAttacksText")}</p>

      {/* ── ARMAS ── */}
      <SectionTitle>{t("manual.player.weapons")}</SectionTitle>
      <p>{t("manual.player.weaponsText")}</p>

      {/* ── PICTOS E LUMINAS ── */}
      <SectionTitle>{t("manual.player.pictos")}</SectionTitle>
      <p>{t("manual.player.pictosText")}</p>

      <SubTitle>{t("manual.player.luminas")}</SubTitle>
      <p>{t("manual.player.luminasText")}</p>

      {/* ── MECÂNICAS DOS PERSONAGENS ── */}
      <SectionTitle>{t("manual.player.characters")}</SectionTitle>
      <p>{t("manual.player.charactersText")}</p>

      {["gustave", "maelle", "lune", "sciel", "verso", "monoco"].map(c => (
        <div key={c}>
          <SubTitle>{t(`manual.player.char.${c}`)}</SubTitle>
          <p>{t(`manual.player.char.${c}Desc`)}</p>
        </div>
      ))}

      <DecorativeRule />
    </>
  );
}
