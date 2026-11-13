import { defaultClassLintSettings } from '@stet-css/lint'

const settings = {
  ...defaultClassLintSettings
}

export default settings

export interface Settings {
  classAttributes?: string[]
  classFunctions?: string[]
  classDeclarations?: string[]
  ignoredKeys: string[]
}
