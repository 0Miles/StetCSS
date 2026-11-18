import sortClasses from '../../src/rules/sort-classes'
import noConflictingClasses from '../../src/rules/no-conflicting-classes'
import noInvalidClasses from '../../src/rules/no-invalid-classes'
import { jsxTester } from '../testers'

const svelte = {
  filename: 'test.svelte',
  languageOptions: { parser: await import('svelte-eslint-parser') }
}

/**
 * Fault: Svelte text touching an `{expression}`, as in `bg:{color}-50`, was linted as a complete
 * class list, so sorting split the runtime class apart (`bg:{color}m:0.5rem -50`), conflict fixes
 * deleted classes that only looked duplicated (`block flex{x}` lost `block`), and the fragments
 * were reported as invalid classes. Fragments touching an expression must stay where they are;
 * the whole classes beside them are still linted.
 *
 * Reverse check: at the base commit (05347e7cb) the three ticket repros were red with the ticket's
 * symptoms; skipping the fragment trim in resolve-class-node turns the seven Svelte cases red and
 * leaves the ignoredKeys cases green.
 */
jsxTester.run('#197 sort-classes leaves class fragments touching Svelte expressions alone', sortClasses, {
  valid: [
    { name: 'the ticket repro', code: '<div class="fg:white bg:{color}-50 m:0.5rem"></div>', ...svelte },
    { name: 'a fragment on both sides of an expression', code: '<div class="m:0.5rem fg:{a}x{b}-50 bg:black"></div>', ...svelte }
  ],
  invalid: [
    {
      name: 'whole classes before a fragment are sorted around it',
      code: '<div class="fg:white m:0.5rem bg:{color}-50"></div>',
      output: '<div class="m:0.5rem fg:white bg:{color}-50"></div>',
      errors: [{ messageId: 'invalidClassOrder' }],
      ...svelte
    },
    {
      name: 'whole classes after a fragment are sorted around it',
      code: '<div class="bg:{color}-50 fg:white m:0.5rem"></div>',
      output: '<div class="bg:{color}-50 m:0.5rem fg:white"></div>',
      errors: [{ messageId: 'invalidClassOrder' }],
      ...svelte
    }
  ]
})

jsxTester.run('#197 no-conflicting-classes keeps classes beside Svelte expression fragments', noConflictingClasses, {
  valid: [
    { name: 'the ticket repro', code: '<div class="block flex{x}"></div>', ...svelte },
    { name: 'a fragment after an expression', code: '<div class="{x}flex block"></div>', ...svelte }
  ],
  invalid: [
    {
      name: 'a conflict between whole classes still reports',
      code: '<div class="block flex {x}"></div>',
      output: '<div class="flex {x}"></div>',
      errors: [{ messageId: 'collisionClass' }],
      ...svelte
    }
  ]
})

jsxTester.run('#197 no-invalid-classes skips fragments touching Svelte expressions', noInvalidClasses, {
  valid: [
    {
      name: 'fragments on both sides',
      code: '<div class="fg:white bg:{color}-50 m:0.5rem"></div>',
      options: [{ disallowUnknownClass: true }],
      ...svelte
    }
  ],
  invalid: [
    {
      name: 'a whole class beside a fragment is still checked',
      code: '<div class="text-decoration:bad() rrr bg:{color}-50"></div>',
      options: [{ disallowUnknownClass: true }],
      errors: [{ messageId: 'invalidClass' }, { messageId: 'disallowUnknownClass' }],
      ...svelte
    }
  ]
})

const cvaCode = `cva('inline-flex', {
  variants: { intent: { primary: 'bg:blue', danger: 'bg:red' } },
  compoundVariants: [{ intent: 'primary danger', class: 'uppercase' }],
  defaultVariants: { intent: 'primary danger' }
})`

/**
 * Fault: the `ignoredKeys` setting, `compoundVariants` and `defaultVariants` by default, was
 * accepted but never applied, so cva variant names were sorted (`'primary danger'` became
 * `'danger primary'`, changing which variant applies) and reported as unknown classes.
 *
 * Reverse check: skipping the ignoredKeys test in with-visit-class-node turns the four ignored-key
 * cases red and leaves the Svelte cases green.
 */
jsxTester.run('#197 sort-classes skips ignoredKeys', sortClasses, {
  valid: [
    { name: 'cva variant names under the default ignored keys', code: cvaCode },
    {
      name: 'a quoted ignored key',
      code: `cva('inline-flex', { 'defaultVariants': { intent: 'primary danger' } })`
    },
    {
      name: 'a configured ignored key',
      code: `cva('inline-flex', { variantNames: { intent: 'primary danger' } })`,
      settings: { '@stet-css': { ignoredKeys: ['variantNames'] } }
    }
  ],
  invalid: [
    {
      name: 'a key outside ignoredKeys is still a class list',
      code: `cva('inline-flex', { variantNames: { intent: 'fg:white m:0.5rem' } })`,
      output: `cva('inline-flex', { variantNames: { intent: 'm:0.5rem fg:white' } })`,
      errors: [{ messageId: 'invalidClassOrder' }]
    }
  ]
})

jsxTester.run('#197 no-invalid-classes skips ignoredKeys', noInvalidClasses, {
  valid: [
    { name: 'cva variant names under the default ignored keys', code: cvaCode, options: [{ disallowUnknownClass: true }] }
  ],
  invalid: []
})
