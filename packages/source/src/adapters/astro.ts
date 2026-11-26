import { removeSourceRanges } from '@stet-css/lexer'
import { getStetCSSAstroFrontmatter, getStetCSSAstroMarkupElements } from '@stet-css/lexer/astro'
import { decodeStetCSSHTMLAttributeValue } from '@stet-css/lexer/character-reference'
import { extractClassCandidates } from '../extract-class-candidates'
import { extractOxcClasses, extractParsedOxcClasses } from './oxc'
import type { SourceAdapter, SourceAdapterInput } from './types'

// A static `class` attribute: quoted, or unquoted up to the characters that end an unquoted value.
const STATIC_CLASS_ATTRIBUTE = /(?<=\s)class\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`{]+))/g

export const ASTRO_SOURCE_EXT = /\.astro(?:\?|$)/

function add(classes: Set<string>, classNames: string[]) {
  for (const className of classNames) {
    if (className) classes.add(className)
  }
}

// TypeScript's "A 'return' statement can only be used within a function body."
const RETURN_OUTSIDE_FUNCTION = 'TS(1108)'

/** Splits a component into its frontmatter script and its markup, as the Astro compiler does. */
function extractFrontmatter(content: string) {
  const frontmatter = getStetCSSAstroFrontmatter(content)
  if (!frontmatter) return { frontmatter: '', markup: content }
  return {
    frontmatter: content.slice(frontmatter.start, frontmatter.end),
    markup: content.slice(frontmatter.markupStart)
  }
}

/**
 * Astro compiles the frontmatter into the body of an async render function,
 * so it may `await` at the top level and `return` early. oxc parses such a
 * `return` into the program and only reports where it stands.
 */
function extractFrontmatterClasses(source: string, frontmatter: string) {
  return extractParsedOxcClasses(`${source}.ts`, frontmatter, {
    sourceType: 'module',
    allowsError: error => error.labels.length === 1 &&
      !!error.codeframe?.includes(RETURN_OUTSIDE_FUNCTION) &&
      frontmatter.slice(error.labels[0]!.start, error.labels[0]!.end) === 'return'
  })
}

/**
 * The Astro compiler decodes the character references in a static attribute value as the browser
 * does. Extracts every static class attribute written with a reference by its decoded value and
 * removes it from the markup, so the markup text extraction does not read it as written.
 */
function extractDecodedClassAttributes(classes: Set<string>, markup: string) {
  return markup.replace(STATIC_CLASS_ATTRIBUTE, (attribute, doubleQuoted?: string, singleQuoted?: string, unquoted?: string) => {
    const value = doubleQuoted ?? singleQuoted ?? unquoted!
    if (!value.includes('&')) return attribute
    add(classes, extractClassCandidates(decodeStetCSSHTMLAttributeValue(value).value))
    return ''
  })
}

export function extractAstroClasses(source: string, content: string): string[] {
  const classes = new Set<string>()
  const { frontmatter, markup } = extractFrontmatter(content)

  if (frontmatter) {
    add(classes, extractFrontmatterClasses(source, frontmatter))
  }

  const { scripts, elements } = getStetCSSAstroMarkupElements(markup)
  for (const script of scripts) {
    // Astro processes every `<script>` but `is:inline` ones as TypeScript; an
    // inline script is plain JavaScript, which parses as TypeScript as well.
    add(classes, extractOxcClasses(`${source}.ts`, markup.slice(script.start, script.end)))
  }
  // The markup text: the markup without its script and style elements.
  const template = extractDecodedClassAttributes(classes, removeSourceRanges(markup, elements))
  add(classes, extractClassCandidates(template))

  return [...classes]
}

export function astroAdapter(): SourceAdapter {
  return {
    name: 'astro',
    test: ASTRO_SOURCE_EXT,
    async extract({ source, content }: SourceAdapterInput) {
      return extractAstroClasses(source, content)
    }
  }
}
