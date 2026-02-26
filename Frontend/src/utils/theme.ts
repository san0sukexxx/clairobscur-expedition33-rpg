const THEME_KEY = "app-theme";
const DEFAULT_THEME = "forest";

export const THEMES = [
  "light", "dark", "cupcake", "bumblebee", "emerald", "corporate",
  "synthwave", "retro", "cyberpunk", "valentine", "halloween", "garden",
  "forest", "aqua", "lofi", "pastel", "fantasy", "wireframe", "black",
  "luxury", "dracula", "cmyk", "autumn", "business", "acid", "lemonade",
  "night", "coffee", "winter", "dim", "nord", "sunset",
] as const;

export type Theme = typeof THEMES[number];

export function getTheme(): Theme {
  const saved = localStorage.getItem(THEME_KEY);
  return (THEMES as readonly string[]).includes(saved ?? "") ? (saved as Theme) : DEFAULT_THEME;
}

export function setTheme(theme: Theme): void {
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.setAttribute("data-theme", theme);
}

export function applyTheme(): void {
  document.documentElement.setAttribute("data-theme", getTheme());
}
