import { test, expect } from 'vitest'
import { ClassPositionCache, getClassPositions, languageSettings, type LanguageSettings } from '../../src'
import createDoc, { languageIdOfExt } from '../helpers/create-doc'

function resolveSettings(settings?: LanguageSettings): LanguageSettings {
  return {
    ...languageSettings,
    ...settings,
    classAttributeBindings: {
      ...languageSettings.classAttributeBindings,
      ...settings?.classAttributeBindings
    }
  }
}

export function getClassPosition(doc: ReturnType<typeof createDoc>, position: Parameters<typeof doc.offsetAt>[0], settings?: LanguageSettings) {
  const resolvedSettings = resolveSettings(settings)
  const classPositionCache = new ClassPositionCache()
  const cachedOxcClassPosition = getClassPositions(doc, resolvedSettings, {
    position,
    includeEmpty: true,
    provider: 'oxc',
    oxcMode: 'cache-only',
    cache: classPositionCache
  })[0]
  if (cachedOxcClassPosition) return cachedOxcClassPosition

  const regexClassPosition = getClassPositions(doc, resolvedSettings, {
    position,
    includeEmpty: true,
    provider: 'regex'
  })[0]
  if (regexClassPosition && !regexClassPosition.raw.includes('${')) {
    return regexClassPosition
  }

  return getClassPositions(doc, resolvedSettings, {
    position,
    includeEmpty: true,
    provider: 'oxc',
    cache: classPositionCache
  })[0] ?? regexClassPosition
}

export const expectClassPosition = (target: string, contents: string[], ext: keyof typeof languageIdOfExt = 'html', settings?: LanguageSettings) => {
  const doc = createDoc(ext, contents.join(''))
  const classPosition = getClassPosition(doc, doc.positionAt(contents[0].length + target.length), settings)
  expect(classPosition).toMatchObject({
    range: {
      start: contents[0].length,
      end: contents[0].length + target.length
    },
    raw: target,
    token: target
      .replace(/\\"/g, '"')
      .replace(/\\'/g, '\'')
      .replace(/\\`/g, '`')
  })
  expect(classPosition?.contextRange.start).toBeLessThanOrEqual(contents[0].length)
  expect(classPosition?.contextRange.end).toBeGreaterThanOrEqual(contents[0].length + target.length)
  return classPosition
}

test.concurrent('empty class with single quotes', () => {
  const target = ''
  const contents = ['<div class=\'', target, '\'></div>']
  expectClassPosition(target, contents)
})

test.concurrent('empty class with double quotes', () => {
  const target = ''
  const contents = ['<div class="', target, '"></div>']
  expectClassPosition(target, contents)
})

test.concurrent('one class', () => {
  const target = 'class-a'
  const contents = ['<div class="', target, '"></div>']
  expectClassPosition(target, contents)
})

test.concurrent('two classes', () => {
  const target = 'class-b'
  const contents = ['<div class="class-a ', target, '"></div>']
  expectClassPosition(target, contents)
})

test.concurrent('full-width spaces are part of the class token', () => {
  const target = 'class-a\u3000class-b'
  const contents = ['<div class="', target, '"></div>']
  expectClassPosition(target, contents)
})

test.concurrent('valid classes', () => {
  const target = 'bg:black'
  const contents = ['<div class="class-a ', target, '"></div>']
  expectClassPosition(target, contents)
})

test.concurrent('class in CSS @compose', () => {
  const target = 'bg:primary'
  const contents = ['.btn { @compose inline-flex ', target, '; }']
  expectClassPosition(target, contents, 'css')
})

test.concurrent('class in Vue style @compose', () => {
  const target = 'bg:primary'
  const contents = ['<template><button /></template><style>.btn { @compose inline-flex ', target, '; }</style>']
  expectClassPosition(target, contents, 'vue')
})

test.concurrent('ignores quoted CSS @compose classes', () => {
  const doc = createDoc('css', '.btn { @compose "inline-flex bg:primary"; }')

  expect(getClassPosition(doc, doc.positionAt(doc.getText().indexOf('bg:primary')))).toBeUndefined()
})

/**
 * Prevents (#241): a CSS `@compose` written without its last `;` reading the block's `}` and
 * everything after it as its class list, so the editor offered completion and hover on `}` and the
 * next rule's text. The class list stops at the `}` that closes the rule, as in native CSS.
 * Reverse check: dropping the nested `}` stop in the lexer's `collectCSSDirectiveRanges` reds this test.
 */
test.concurrent('ends a CSS @compose class list at the closing brace when it has no semicolon', () => {
  const doc = createDoc('css', '@layer a { .w { @compose block\n  fg:red } }\n.x { color: red }')
  const positions = getClassPositions(doc, resolveSettings())

  expect(positions.map((classPosition) => classPosition.token)).toEqual(['block', 'fg:red'])
  expect(positions.map((classPosition) => doc.getText().slice(classPosition.contextRange.start, classPosition.contextRange.end)))
    .toEqual(['block\n  fg:red', 'block\n  fg:red'])
})

test.concurrent('quote in class', () => {
  const target = `content:''`
  const contents = ['<div class="class-a ', target, '"></div>']
  expectClassPosition(target, contents)
})

test.concurrent('group syntax', () => {
  const target = '{abs}'
  const contents = ['<div class="class-a ', target, '"></div>']
  expectClassPosition(target, contents)
})

test.concurrent('ignores class attributes inside HTML comments', () => {
  const doc = createDoc('html', '<!-- <div class="fg:red"></div> -->\n<div class="fg:blue"></div>')

  expect(getClassPositions(doc, resolveSettings()).map((classPosition) => classPosition.token)).toEqual([
    'fg:blue'
  ])
  expect(getClassPosition(doc, doc.positionAt(17))).toBeUndefined()
})

test.concurrent('nested strings and literals', () => {
  const target = `content:\\'\\'`
  const contents = [`export default () => <div className={'block `, target, `'}>hello world</div>`]
  expectClassPosition(target, contents, 'tsx')
})
