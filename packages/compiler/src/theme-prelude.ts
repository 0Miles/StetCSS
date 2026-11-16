/** Parses an `@theme` prelude such as `dark`, `inline` or `static` into its mode and modifiers. */
export default function parseThemePrelude(prelude: string | undefined): { mode?: string, inline?: boolean, static?: boolean } {
  if (!prelude) return {}
  const parts = prelude.split(/\s+/).filter(Boolean)
  let mode: string | undefined
  let inline = false
  let isStatic = false
  for (const part of parts) {
    if (part === 'inline' || part === 'static') {
      if (part === 'inline') {
        if (inline) throw new Error('@theme inline modifier cannot be repeated')
        inline = true
      } else {
        if (isStatic) throw new Error('@theme static modifier cannot be repeated')
        isStatic = true
      }
      continue
    }
    if (mode) {
      throw new Error('@theme mode must be a single token')
    }
    mode = part
  }
  if (inline && isStatic) {
    throw new Error('@theme inline and static cannot be combined')
  }
  if (inline && mode) {
    throw new Error('@theme inline cannot be mode-specific')
  }
  return {
    ...(mode ? { mode } : {}),
    ...(inline ? { inline: true } : {}),
    ...(isStatic ? { static: true } : {})
  }
}
