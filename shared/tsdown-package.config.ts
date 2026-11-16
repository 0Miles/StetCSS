import { existsSync, readFileSync } from 'node:fs'
import { dirname, extname, resolve } from 'node:path'
import { defineConfig, type TsdownInputOption, type TsdownPlugin } from 'tsdown'

interface PackageJSON {
  name?: string
  types?: string
  exports?: unknown
}

const packageRoot = process.cwd()
const packageJSON = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8')) as PackageJSON

const entryByPackageName: Record<string, TsdownInputOption> = {
  '@stet-css/eslint-plugin': ['src/**/*.{js,ts}']
}

const externalLanguageSyntaxJSON: TsdownPlugin = {
  name: 'external-language-syntax-json',
  resolveId: {
    order: 'pre',
    handler(source) {
      if (/^\.\.\/(?:\.\.\/)?syntaxes\/master-css\.tmLanguage\.json$/.test(source)) {
        return {
          id: source,
          external: true
        }
      }
    }
  }
}

const externalVirtualModules: TsdownPlugin = {
  name: 'external-virtual-modules',
  resolveId: {
    order: 'pre',
    handler(source) {
      if (source.startsWith('virtual:')) {
        return {
          id: source,
          external: true
        }
      }
    }
  }
}

const relativeImportSpecifierPattern = /((?:\bfrom\s*|\bimport\s*)['"])(\.{1,2}\/[^'"]+)(['"])/g
const dynamicImportSpecifierPattern = /(\bimport\(['"])(\.{1,2}\/[^'"]+)(['"]\))/g

// dist mirrors src (`unbundle` with `root: 'src'`), so a specifier that names a
// directory in src names the same directory in dist and needs its index file:
// `./options` -> `./options/index.js`, never `./options.js`.
function addJSExtensionToRelativeSpecifier(chunkFileName: string) {
  const sourceDir = resolve(packageRoot, 'src', dirname(chunkFileName))
  return (match: string, prefix: string, specifier: string, suffix: string) => {
    if (/[?#]/.test(specifier) || extname(specifier)) return match
    const isDirectory = !existsSync(resolve(sourceDir, `${specifier}.ts`)) && existsSync(resolve(sourceDir, specifier, 'index.ts'))
    return `${prefix}${specifier}${isDirectory ? '/index' : ''}.js${suffix}`
  }
}

const preserveDeclarationRelativeImports: TsdownPlugin = {
  name: 'preserve-declaration-relative-imports',
  renderChunk: {
    order: 'post',
    handler(code, chunk) {
      if (!chunk.fileName.endsWith('.d.ts')) return
      const addJSExtension = addJSExtensionToRelativeSpecifier(chunk.fileName)
      return code
        .replace(relativeImportSpecifierPattern, addJSExtension)
        .replace(dynamicImportSpecifierPattern, addJSExtension)
    }
  }
}

function hasExportTypes(exports: unknown): boolean {
  return exports !== undefined && JSON.stringify(exports).includes('"types"')
}

export default defineConfig({
  cwd: packageRoot,
  entry: entryByPackageName[packageJSON.name || ''] || ['src/**/*.ts'],
  unbundle: true,
  root: 'src',
  tsconfig: './tsconfig.prod.json',
  fixedExtension: false,
  deps: {
    skipNodeModulesBundle: true,
    dts: {
      neverBundle: [/^[^./]/, /^\.{1,2}\//]
    }
  },
  plugins: [
    preserveDeclarationRelativeImports,
    externalVirtualModules,
    ...(packageJSON.name === '@stet-css/language' ? [externalLanguageSyntaxJSON] : [])
  ],
  dts: Boolean(packageJSON.types || hasExportTypes(packageJSON.exports))
})
