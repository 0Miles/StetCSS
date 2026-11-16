const PRESET_MODES = new Set(['light', 'dark'])

/**
 * Declaring any `@theme <mode>` replaces the preset light and dark modes. Callers resolve declared
 * modes and variants first; a bare `light` or `dark` condition left over that is not a defined
 * condition either is a mistake, not a container name, so callers report it with
 * {@link formatUndeclaredModeMessage} instead of emitting `@container light` / `@container dark`.
 */
export function isUndeclaredPresetMode(token: string, conditions: { has(name: string): boolean }) {
  return PRESET_MODES.has(token) && !conditions.has(token)
}

export function formatUndeclaredModeMessage(subject: string, mode: string, modes: readonly string[]) {
  const declared = modes.length
    ? `declared modes: ${modes.map((each) => `"${each}"`).join(', ')}`
    : 'no modes are declared'
  return `${subject} uses mode "${mode}", which is not declared (${declared}). `
    + `Declaring any @theme <mode> {} replaces the default light and dark modes; add @theme ${mode} {} to use @${mode}.`
}
