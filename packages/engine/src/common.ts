import { STET_CSS_VALUE_UNIT_PATTERN, STET_CSS_VALUE_UNITS } from '@stet-css/lexer'
import type { StetCSSManifestConditionIdentifier } from '@stet-css/schema/manifest'

export const VALUE_DELIMITERS = {
  '(': ')',
  '\'': '\'',
  '"': '"',
  '{': '}'
}
/** Pixels in one rem; it is not configurable. Query numbers are output as written; px converts to rem only where values are compared (rule priority, class inspection). */
export const ROOT_FONT_SIZE = 16
export const SELECTOR_SIGNS = [':', '_', '>', '+', '~']
export const SELECTOR_COMBINATORS = ['_', '>', '+', '~']
export const QUERY_COMPARISON_OPERATORS = ['>', '<', '=']
export const QUERY_LOGICAL_OPERATORS = ['&']
export const SEPARATOR_SIGNS = [',', '|']
export const DELIMITER_SIGN = '|'
export const SEPARATOR_SIGN = ','
export const AT_SIGN = '@'
export const VALUE_UNITS = [...STET_CSS_VALUE_UNITS]
export const UNIT_REGEX = new RegExp(`^([+-.]?\\d+(?:\\.?\\d+)?)(${STET_CSS_VALUE_UNIT_PATTERN})?$`)
export const CLASS_ATTRIBUTES = ['class', 'className']
export const CLASS_DECLARATIONS = []
export const CLASS_FUNCTIONS = ['clsx', 'cva', 'ctl', 'cv', 'class', 'classnames', 'classVariant', 'styled(?:\\s+)?(?:\\.\\w+)?', 'classList(?:\\s+)?\\.(?:add|remove|toggle|replace)']
export const MATCH_NAME_BOUNDARY = new Set(['!', '*', '>', '+', '~', ':', '[', '@', '_', '.'])
export const CONDITION_COMPARISON_OPERATORS = ['>=', '<=', '>', '<', '=']
export const CONDITION_LOGICAL_OPERATORS = {
  '&': 'and',
  '!': 'not',
  // native
  'not': 'not',
  'and': 'and',
  'or': 'or',
  'only': 'only',
  ',': 'or',

}
// the order is intentional and should not be changed
export const CONDITION_IDENTIFIERS: StetCSSManifestConditionIdentifier[] = ['container', 'starting-style', 'supports', 'media', 'layer']
export const COMPARISION_OPERATORS = ['>=', '<=', '>', '<', '=']
export const CONDITION_COMPARABLE_FEATURES = ['width', 'height', 'resolution']
export const CONDITION_FEATURE_ALIASES = {
  w: 'width',
  h: 'height'
} as const
export const __UNSORTED__ = '__UNSORTED__'
