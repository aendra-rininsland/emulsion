import type { Theme } from "./types.js";

const modules = import.meta.glob<{ default: Theme }>("/src/themes/*/index.ts", { eager: true });

const registry = new Map<string, Theme>();
for (const path in modules) {
  const match = /\/src\/themes\/([^/]+)\/index\.ts$/.exec(path);
  if (!match) continue;
  registry.set(match[1]!, modules[path]!.default);
}

const DEFAULT_THEME_NAME = "default";

/**
 * Resolve a theme by name, falling back to the built-in default theme when the
 * requested theme isn't installed (e.g. EMULSION_THEME set to a typo or a theme
 * that hasn't been added to src/themes/ yet).
 */
export function getTheme(name: string | undefined): Theme {
  const theme = (name && registry.get(name)) ?? registry.get(DEFAULT_THEME_NAME);
  if (!theme) {
    throw new Error(
      `No theme named "${DEFAULT_THEME_NAME}" found in src/themes/ — the default theme is required.`
    );
  }
  return theme;
}

export function listThemeNames(): string[] {
  return [...registry.keys()];
}
