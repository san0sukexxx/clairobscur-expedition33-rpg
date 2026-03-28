import { FullscreenButton } from "../components/FullscreenButton";
import { setLocale, type Locale } from "../i18n";

const LANGUAGES: { locale: Locale; flag: string; label: string }[] = [
  { locale: "pt-BR", flag: "🇧🇷", label: "Português" },
  { locale: "en",    flag: "🇺🇸", label: "English"   },
];

export default function LanguageSelectPage() {
  function handleSelect(locale: Locale) {
    setLocale(locale);
    window.location.replace("/");
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-base-200 px-4 relative">
      <div className="absolute top-3 right-3">
        <FullscreenButton />
      </div>
      <div className="flex flex-col items-center gap-10">
        <h1 className="text-2xl font-bold tracking-widest text-base-content/80 uppercase">
          Select your language
        </h1>

        <div className="flex gap-4 px-6">
          {LANGUAGES.map(({ locale, flag, label }) => (
            <button
              key={locale}
              onClick={() => handleSelect(locale)}
              className="
                flex flex-col items-center gap-2
                px-6 py-5
                rounded-xl border-2 border-base-300
                bg-base-100
                hover:border-primary hover:bg-primary/5
                active:scale-95
                transition-all duration-150
                cursor-pointer
                group
              "
            >
              <span
                className="text-5xl leading-none select-none"
                role="img"
                aria-label={label}
              >
                {flag}
              </span>
              <span className="text-xs font-semibold tracking-wide text-base-content/70 group-hover:text-primary transition-colors">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
