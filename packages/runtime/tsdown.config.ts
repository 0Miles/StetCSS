import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    entry: ['src/**/*.ts'],
    unbundle: true,
    root: 'src',
    tsconfig: './tsconfig.prod.json',
    fixedExtension: false,
    dts: {
      emitDtsOnly: true
    }
  },
  {
    entry: {
      index: 'src/index.ts'
    },
    platform: 'browser',
    tsconfig: './tsconfig.prod.json',
    dts: false,
    outputOptions: {
      entryFileNames: '[name].js',
      codeSplitting: false
    }
  },
  {
    entry: {
      'index.development': 'src/index.development.ts'
    },
    platform: 'browser',
    tsconfig: './tsconfig.prod.json',
    dts: false,
    outputOptions: {
      entryFileNames: '[name].js',
      codeSplitting: false
    }
  },
  {
    entry: {
      'global.min': 'src/global.min.ts'
    },
    format: 'iife',
    platform: 'browser',
    tsconfig: './tsconfig.prod.json',
    dts: false,
    deps: {
      alwaysBundle: [/^[^./]/],
      onlyBundle: false
    },
    minify: true,
    outputOptions: {
      entryFileNames: '[name].js',
      codeSplitting: false,
      comments: false
    }
  }
])
