import sortClasses from '../../src/rules/sort-classes'
import noInvalidClasses from '../../src/rules/no-invalid-classes'
import { jsxTester } from '../testers'

const vue = {
  filename: 'test.vue',
  languageOptions: { parser: await import('vue-eslint-parser') }
}
const svelte = {
  filename: 'test.svelte',
  languageOptions: { parser: await import('svelte-eslint-parser') }
}
const angular = {
  languageOptions: { parser: await import('@angular-eslint/template-parser') }
}

/**
 * Fault: the build decodes character references in class attributes (#194), but the plugin
 * could not map a decoded class list back onto an attribute spelled with references, so #196
 * left such attributes reported over their whole value and never fixed (#240). Classes are read
 * the way the host decodes the attribute (HTML's rules in Vue, Svelte and Angular templates,
 * JSX's in JSX, the attribute before the expression in a Vue `:class` binding), and each fix
 * rewrites the classes at their source spelling, keeping every reference where it is written. A
 * space spelled `&#x20` without its `;` gets one before a class starting with a hex digit, which
 * it would otherwise read on into. Expected outputs are the fixes of the same lists written
 * without references.
 *
 * A string the decoder cannot map back, such as one quoted with `&quot;`, or one in a Vue
 * expression the build reads as written (an interpolation), is still reported over its whole
 * value without a fix.
 *
 * Reverse checks in resolve-class-node: reading JSX attribute strings as written reds the JSX
 * sort case and the `hiddenn` report; reading VLiteral and SvelteLiteral as written reds the Vue
 * and Svelte attribute cases; missing the Vue `:class` binding reds the binding cases; decoding
 * every Vue template expression reds the interpolation case, and every `v-bind` the `:title` case; treating every list as fixable reds
 * the `&quot;` case. In @stet-css/lint, joining edited items without checking how they decode
 * reds the `&#x20` cases.
 *
 * Cases stay inline rather than in tests/fixtures/issues/240/: each is one attribute whose exact
 * spelling is the point, and RuleTester's code/output pairs show each fix next to its input.
 */
jsxTester.run('#240 sort-classes fixes class attributes spelled with character references', sortClasses, {
  valid: [
    { name: 'a JSX list already in order by its decoded classes', code: '<div className="bg:black&#32;fg:white" />' }
  ],
  invalid: [
    {
      name: 'a JSX attribute string',
      code: '<div className="fg:white&#32;bg:black" />',
      output: '<div className="bg:black&#32;fg:white" />',
      errors: [{ messageId: 'invalidClassOrder' }]
    },
    {
      name: 'a static Vue class attribute',
      code: '<template><div class="b&amp;c fg:white bg:black"></div></template>',
      output: '<template><div class="bg:black fg:white b&amp;c"></div></template>',
      errors: [{ messageId: 'invalidClassOrder' }],
      ...vue
    },
    {
      name: 'a string in a Vue class binding',
      code: '<template><div :class="[\'fg:white&#32;bg:black\']"></div></template>',
      output: '<template><div :class="[\'bg:black&#32;fg:white\']"></div></template>',
      errors: [{ messageId: 'invalidClassOrder' }],
      ...vue
    },
    {
      name: 'a Svelte class attribute',
      code: '<div class="fg:&#x77;hite&#32;bg:black"></div>',
      output: '<div class="bg:black&#32;fg:&#x77;hite"></div>',
      errors: [{ messageId: 'invalidClassOrder' }],
      ...svelte
    },
    {
      name: 'an Angular class attribute',
      code: '<div class="fg:white&#32;bg:black"></div>',
      output: '<div class="bg:black&#32;fg:white"></div>',
      errors: [{ messageId: 'invalidClassOrder' }],
      ...angular
    },
    {
      name: 'a space spelled without its `;` before a class that now starts with a hex digit',
      code: '<template><div class="bg:black&#x20m:0.5rem"></div></template>',
      output: '<template><div class="m:0.5rem&#x20;bg:black"></div></template>',
      errors: [{ messageId: 'invalidClassOrder' }],
      ...vue
    },
    {
      name: 'the same space in a Vue class binding',
      code: '<template><div :class="[\'bg:black&#x20m:0.5rem\']"></div></template>',
      output: '<template><div :class="[\'m:0.5rem&#x20;bg:black\']"></div></template>',
      errors: [{ messageId: 'invalidClassOrder' }],
      ...vue
    },
    {
      name: 'the same space in a Svelte class attribute',
      code: '<div class="bg:black&#x20m:0.5rem"></div>',
      output: '<div class="m:0.5rem&#x20;bg:black"></div>',
      errors: [{ messageId: 'invalidClassOrder' }],
      ...svelte
    },
    {
      name: 'a string in a Vue interpolation, which the build reads as written, is reported without a fix',
      code: '<template><div>{{ clsx(\'fg:white&#32;bg:black\') }}</div></template>',
      output: null,
      errors: [{ messageId: 'invalidClassOrder' }],
      ...vue
    },
    {
      name: 'a string in a Vue binding other than `:class`, which the build reads as written, is reported without a fix',
      code: '<template><div :title="clsx(`fg:white&#32;bg:black`)"></div></template>',
      output: null,
      errors: [{ messageId: 'invalidClassOrder' }],
      ...vue
    },
    {
      name: 'a Vue binding string quoted with entities is reported over its whole value without a fix',
      code: '<template><div :class="[&quot;fg:white bg:black&quot;]"></div></template>',
      output: null,
      errors: [{ messageId: 'invalidClassOrder', line: 1, column: 25, endLine: 1, endColumn: 54 }],
      ...vue
    }
  ]
})

jsxTester.run('#240 no-invalid-classes reports the decoded class where it is spelled', noInvalidClasses, {
  valid: [
    { code: '<div className="block&#32;hidden" />', options: [{ disallowUnknownClass: true }] as any },
    { code: '<template><div class="block&#32;hidden"></div></template>', options: [{ disallowUnknownClass: true }] as any, ...vue }
  ],
  invalid: [
    {
      code: '<div className="block&#32;hiddenn" />',
      errors: [{
        messageId: 'disallowUnknownClass',
        data: { message: 'Unknown StetCSS class "hiddenn". It is not generated by the active manifest.' },
        line: 1,
        column: 27,
        endLine: 1,
        endColumn: 34
      }],
      options: [{ disallowUnknownClass: true }] as any
    }
  ]
})
