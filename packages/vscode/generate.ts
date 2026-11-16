import editJsonFile from 'edit-json-file'
import settings from '../language-server/src/settings'
import { SEMANTIC_TOKEN_MODIFIERS } from '../language/src/common'
import { MASTER_CSS_SEMANTIC_TOKEN_SCOPE_MAP } from '../language/src/semantic/scopes'
import {
  MASTER_CSS_SHIKI_INJECT_TO,
  MASTER_CSS_SHIKI_SCOPE_NAME
} from '../language/src/shiki'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { cpSync, readFileSync, rmSync, writeFileSync } from 'node:fs'

const packageJSONPath = fileURLToPath(new URL('./package.json', import.meta.url))
const pkg = editJsonFile(packageJSONPath, { stringify_width: 2 })
const compilerRequire = createRequire(fileURLToPath(new URL('../compiler/package.json', import.meta.url)))
const MASTER_CSS_GRAMMAR_PATH = './node_modules/@stet-css/language/syntaxes/master-css.tmLanguage.json'

pkg.unset('contributes.languages')
pkg.unset('contributes.css')
pkg.set('files', [
  'dist',
  'data',
  'LICENSE',
  'icon.png'
])
pkg.set('contributes.grammars', [
  {
    scopeName: MASTER_CSS_SHIKI_SCOPE_NAME,
    path: MASTER_CSS_GRAMMAR_PATH,
    injectTo: [...MASTER_CSS_SHIKI_INJECT_TO]
  }
])
pkg.set('contributes.configurationDefaults', {
  'css.lint.unknownAtRules': 'ignore',
  'scss.lint.unknownAtRules': 'ignore',
  'less.lint.unknownAtRules': 'ignore'
})

pkg.set('contributes.semanticTokenModifiers', SEMANTIC_TOKEN_MODIFIERS
  .filter((modifier) => modifier !== 'declaration' && modifier !== 'defaultLibrary')
  .map((modifier) => ({
    id: modifier,
    description: `StetCSS ${modifier} semantic token modifier.`
  })))

pkg.set('contributes.semanticTokenScopes', [
  {
    scopes: MASTER_CSS_SEMANTIC_TOKEN_SCOPE_MAP
  }
])

pkg.set('contributes.configuration', {
  title: 'StetCSS',
  properties: {
    'stetCSS.includedLanguages': {
      'type': 'array',
      'items': {
        'type': 'string'
      },
      'default': settings.includedLanguages
    },
    'stetCSS.exclude': {
      'type': 'array',
      'items': {
        'type': 'string'
      },
      'default': settings.exclude,
      'description': 'Configure glob patterns to exclude from all StetCSS language-service features.'
    },
    'stetCSS.classAttributes': {
      'type': 'array',
      'items': {
        'type': 'string'
      },
      'default': settings.classAttributes
    },
    'stetCSS.classAttributeBindings': {
      'type': 'object',
      'default': settings.classAttributeBindings
    },
    'stetCSS.classDeclarations': {
      'type': 'array',
      'items': {
        'type': 'string'
      },
      'default': settings.classDeclarations
    },
    'stetCSS.classFunctions': {
      'type': 'array',
      'items': {
        'type': 'string'
      },
      'default': settings.classFunctions
    },
    'stetCSS.suggestSyntax': {
      'type': 'boolean',
      'default': settings.suggestSyntax
    },
    'stetCSS.inspectSyntax': {
      'type': 'boolean',
      'default': settings.inspectSyntax
    },
    'stetCSS.renderSyntaxColors': {
      'type': 'boolean',
      'default': settings.renderSyntaxColors
    },
    'stetCSS.formatDirectives': {
      'type': 'boolean',
      'default': settings.formatDirectives,
      'description': 'Enables StetCSS directive formatting in CSS-family documents.'
    },
    'stetCSS.embeddedSyntaxHighlighting': {
      'type': 'string',
      'enum': ['active', 'always', 'off'],
      'default': settings.embeddedSyntaxHighlighting,
      'description': 'Controls embedded StetCSS utility highlighting in markup and scripts. Active highlights the class context at the active editor selection, always highlights all discovered embedded utilities, and off disables embedded utility highlighting. StetCSS syntax inside CSS documents is always highlighted.'
    },
    'stetCSS.workspaces': {
      'type': [
        'string',
        'array'
      ],
      'default': settings.workspaces,
      'description': 'Configure StetCSS workspaces. The default auto mode detects CSS files with @import "@stet-css/core" and package.json files that declare StetCSS package dependencies.'
    }
  }
})

pkg.save()
const packageJSON = readFileSync(packageJSONPath, 'utf8')
if (!packageJSON.endsWith('\n')) writeFileSync(packageJSONPath, `${packageJSON}\n`)

const cssTreeDataDir = join(dirname(compilerRequire.resolve('css-tree/package.json')), 'data')
const extensionDataDir = fileURLToPath(new URL('./data', import.meta.url))
rmSync(extensionDataDir, { recursive: true, force: true })
cpSync(cssTreeDataDir, extensionDataDir, { recursive: true, dereference: true })
