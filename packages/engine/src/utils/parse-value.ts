import { ROOT_FONT_SIZE, UNIT_REGEX } from '../common'
import type { NumberValueComponent, StringValueComponent } from '@stet-css/schema/css-syntax'

export default function parseValue(
  token: string | number,
  unit = ''
) {
  const isNumber = typeof token === 'number'
  const defaultUnit = unit

  // 如果是純數字
  if (isNumber) {
    return {
      unit: defaultUnit,
      type: 'number',
      value: defaultUnit === 'rem' || defaultUnit === 'em'
        ? token / ROOT_FONT_SIZE
        : token
    } as NumberValueComponent
  }

  const matches = token.match(UNIT_REGEX)
  if (matches) {
    let value = parseFloat(matches[1])
    let parsedUnit = matches[2] || ''

    if (!parsedUnit && (defaultUnit === 'rem' || defaultUnit === 'em')) {
      value = value / ROOT_FONT_SIZE
      parsedUnit = defaultUnit
    }

    return {
      token,
      value,
      unit: parsedUnit || defaultUnit,
      type: 'number',
    } as NumberValueComponent
  }

  // 無法解析則當作純字串
  return { token, value: token, type: 'string' } as StringValueComponent
}
