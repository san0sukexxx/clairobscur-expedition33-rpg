import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdOutlineKeyboardBackspace } from "react-icons/md";
import { FullscreenButton } from "../components/FullscreenButton";
import { setLocale, getLocale, type Locale } from "../i18n";
import { t } from "../i18n";
import { getTheme, setTheme, THEMES, type Theme } from "../utils/theme";

const LANGUAGES: { id: Locale; labelKey: string; flag: string }[] = [
  { id: "pt-BR", labelKey: "settings.languagePtBR", flag: "🇧🇷" },
  { id: "en",    labelKey: "settings.languageEn",   flag: "🇬🇧" },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const [currentLocale, setCurrentLocale] = useState<Locale>(getLocale());
  const [currentTheme, setCurrentTheme] = useState<Theme>(getTheme());

  function handleLocaleSelect(locale: Locale) {
    if (locale === currentLocale) return;
    setCurrentLocale(locale);
    setLocale(locale);
    window.location.reload();
  }

  function handleThemeSelect(theme: Theme) {
    setCurrentTheme(theme);
    setTheme(theme);
  }

  return (
    <div className="min-h-dvh bg-base-200">
      {/* Navbar */}
      <div className="navbar bg-base-100 shadow sticky top-0 z-10">
        <div className="flex-1">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-lg font-bold hover:opacity-80 transition"
          >
            <MdOutlineKeyboardBackspace className="text-2xl" />
            <span>{t("settings.title")}</span>
          </button>
        </div>
        <div className="flex-none flex items-center">
          <FullscreenButton />
        </div>
      </div>

      <main className="p-4 max-w-lg mx-auto space-y-4">
        {/* Language section */}
        <div className="rounded-box bg-base-100 shadow p-4 space-y-3">
          <p className="text-[9px] font-extrabold tracking-widest opacity-70 uppercase">
            {t("settings.language")}
          </p>
          <div className="flex flex-col gap-2">
            {LANGUAGES.map(({ id, labelKey, flag }) => (
              <button
                key={id}
                onClick={() => handleLocaleSelect(id)}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg text-left transition border ${
                  currentLocale === id
                    ? "bg-primary/15 border-primary/40 text-primary font-bold"
                    : "bg-base-200 border-transparent hover:bg-base-300"
                }`}
              >
                <span className="text-2xl">{flag}</span>
                <span className="text-sm font-semibold">{t(labelKey)}</span>
                {currentLocale === id && (
                  <span className="ml-auto w-2.5 h-2.5 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Theme section */}
        <div className="rounded-box bg-base-100 shadow p-4 space-y-3">
          <p className="text-[9px] font-extrabold tracking-widest opacity-70 uppercase">
            {t("settings.theme")}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((theme) => {
              const isSelected = theme === currentTheme;
              return (
                <button
                  key={theme}
                  data-theme={theme}
                  onClick={() => handleThemeSelect(theme)}
                  className={`rounded-xl overflow-hidden border-2 transition-all text-left ${
                    isSelected
                      ? "border-primary scale-[1.03] shadow-md"
                      : "border-base-300 hover:border-base-content/30"
                  }`}
                >
                  {/* Color preview strip */}
                  <div className="flex h-6">
                    <div className="flex-1 bg-primary" />
                    <div className="flex-1 bg-secondary" />
                    <div className="flex-1 bg-accent" />
                    <div className="flex-1 bg-neutral" />
                  </div>
                  {/* Label */}
                  <div className="bg-base-100 px-2 py-1.5 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-base-content capitalize">
                      {theme}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
