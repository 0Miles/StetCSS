import { isUndeclaredModeError, type MasterCSS } from '@stet-css/engine'

/**
 * `css.generate()` for lint policy. A class naming an undeclared mode generates no rules here:
 * `no-invalid-classes` reports it, and sorting, conflict and canonical checks treat it like any
 * other class without rules instead of aborting the whole lint run.
 */
export default function generateRules(css: MasterCSS, className: string): ReturnType<MasterCSS['generate']> {
  try {
    return css.generate(className)
  } catch (error) {
    if (isUndeclaredModeError(error)) return []
    throw error
  }
}
