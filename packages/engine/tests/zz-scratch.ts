import { createDefaultCSS } from './helpers/css-tester'
for (const c of process.argv.slice(2)) {
  const css = createDefaultCSS()
  try { css.ensureClassRules(c) } catch (e) { console.log(c, 'THROW', (e as Error).message); continue }
  console.log(JSON.stringify(c), '=>', css.text)
}
