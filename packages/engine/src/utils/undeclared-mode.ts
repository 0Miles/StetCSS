/** The modes a project has until it declares its own with `@theme <mode>`. */
export const PRESET_MODES: readonly string[] = ['light', 'dark']

/**
 * Thrown when a class, `@compose` or `@variant` names a preset mode (`light` / `dark`) the project
 * did not declare. Declaring any `@theme <mode>` replaces the preset modes, so the token is a
 * mistake rather than a container name. Build paths let it fail the build; tooling and the runtime
 * catch it with {@link isUndeclaredModeError} and report the class instead.
 */
export class UndeclaredModeError extends Error {
  constructor(subject: string, mode: string, declaredModes: readonly string[]) {
    const declared = declaredModes.length
      ? `declared modes: ${declaredModes.map((each) => `"${each}"`).join(', ')}`
      : 'no modes are declared'
    super(`${subject} uses mode "${mode}", which is not declared (${declared}). `
      + `Declaring any @theme <mode> {} replaces the default light and dark modes; add @theme ${mode} {} to use @${mode}.`)
    this.name = 'UndeclaredModeError'
  }
}

/** Matches by name so a second copy of the engine (bundled tooling) still recognizes the error. */
export function isUndeclaredModeError(error: unknown): error is UndeclaredModeError {
  return error instanceof Error && error.name === 'UndeclaredModeError'
}

/**
 * `css.generate()` for tooling and the runtime: a class naming an undeclared mode yields no rules
 * plus the error to report, instead of throwing. Build paths call `generate()` and fail.
 */
export function tryGenerate<R>(css: { generate(className: string): R[] }, className: string): { rules: R[], error?: UndeclaredModeError } {
  try {
    return { rules: css.generate(className) }
  } catch (error) {
    if (!isUndeclaredModeError(error)) throw error
    return { rules: [], error }
  }
}

/**
 * Whether a bare condition token names a preset mode that is neither a declared mode nor a
 * defined condition (a breakpoint or condition named `dark`). Callers check variants first.
 */
export function isUndeclaredPresetMode(token: string, css: { modes: readonly string[], conditions: { has(name: string): boolean } }) {
  return PRESET_MODES.includes(token) && !css.modes.includes(token) && !css.conditions.has(token)
}
