import sortClasses from '../../src/rules/sort-classes'
import noConflictingClasses from '../../src/rules/no-conflicting-classes'
import noInvalidClasses from '../../src/rules/no-invalid-classes'
import { jsxTester } from '../testers'

const svelte = {
  filename: 'test.svelte',
  languageOptions: { parser: await import('svelte-eslint-parser') }
}

const vue = {
  filename: 'test.vue',
  languageOptions: { parser: await import('vue-eslint-parser') }
}

/**
 * Fault: class lists in these contexts were never linted, so misordered and unknown classes went
 * unreported: Svelte `class={…}` expressions, Astro's `class:list` (a namespaced JSX attribute),
 * `classList` calls on a member such as `element.classList.add(…)`, and Vue `:class` bindings
 * other than arrays and objects (a ternary, `&&`, a plain string).
 *
 * A string inside a Svelte `{expression}` that touches static text, as in `x{on ? 'a b' : ''}`,
 * is concatenated into the class around it at runtime: its touching end is a fragment and must
 * never be sorted, deduplicated or validated, the same decision #197 made for static text.
 *
 * The ticket's `m:2x` emits invalid CSS in the StetCSS preset, which sort-classes leaves alone, so
 * the repros use `m:0.5rem`.
 *
 * A callee matches by any dotted suffix of its static names, the rule @stet-css/language's
 * get-class-positions.ts applies to `stetcss lint` too (its class-list-calls.test.ts holds the same
 * member-call cases).
 *
 * Reverse check: matching only the whole callee name turns the seven member-call cases red;
 * reading only plain JSX attribute names turns the class:list case red; dropping the Svelte
 * mustache branch turns the five Svelte expression cases red; visiting only array and object Vue
 * bindings turns the four Vue binding cases red; not passing expression neighbours into the
 * mustache turns the five fragment cases red; dropping the v-bind check turns the custom
 * directive case red. The Svelte `class:list` and computed identifier cases lock decisions.
 */
jsxTester.run('#198 sort-classes lints the missed class contexts', sortClasses, {
  valid: [
    {
      name: 'a string touching static text before a Svelte expression keeps its fragment',
      code: `<div class="x{on ? 'fg:white m:0.5rem' : ''}"></div>`,
      ...svelte
    },
    {
      name: 'a string touching static text after a Svelte expression keeps its fragment',
      code: `<div class="{on ? 'fg:white m:0.5rem' : ''}-x"></div>`,
      ...svelte
    },
    {
      // An array inside text is stringified with commas, not a class list.
      name: 'an array touching static text is skipped',
      code: `<div class="x{['fg:white m:0.5rem']}"></div>`,
      ...svelte
    },
    {
      name: 'an ignored key inside a Svelte class expression',
      code: `<div class={{ defaultVariants: 'fg:white m:0.5rem' }}></div>`,
      ...svelte
    },
    {
      name: 'an ignored key inside a Vue class binding',
      code: `<template><div :class="{ defaultVariants: 'fg:white m:0.5rem' }"></div></template>`,
      ...vue
    },
    {
      // Only v-bind binds classes; a custom directive's `class` argument is its own value.
      name: 'a custom Vue directive with the argument class',
      code: `<template><div v-tooltip:class="on ? 'fg:white m:0.5rem' : ''"></div></template>`,
      ...vue
    },
    {
      // Svelte's `class:list` is a class directive: it toggles the one class `list`.
      name: 'a Svelte class directive named list',
      code: `<div class:list={on ? 'fg:white m:0.5rem' : ''}></div>`,
      ...svelte
    },
    {
      name: 'a computed identifier key reads a variable',
      code: `element[classList].add('fg:white m:0.5rem')`
    }
  ],
  invalid: [
    {
      name: 'the ticket repro: a Svelte class expression',
      code: `<div class={cond ? 'bg:black m:0.5rem' : ''}></div>`,
      output: `<div class={cond ? 'm:0.5rem bg:black' : ''}></div>`,
      errors: [{ messageId: 'invalidClassOrder' }],
      ...svelte
    },
    {
      name: 'a Svelte 5 class array and object',
      code: `<div class={['fg:white m:0.5rem', { 'fg:white m:0.5rem': on }]}></div>`,
      output: `<div class={['m:0.5rem fg:white', { 'm:0.5rem fg:white': on }]}></div>`,
      errors: [{ messageId: 'invalidClassOrder' }, { messageId: 'invalidClassOrder' }],
      ...svelte
    },
    {
      name: 'a Svelte expression set off from static text by whitespace',
      code: `<div class="block {on ? 'fg:white m:0.5rem' : ''}"></div>`,
      output: `<div class="block {on ? 'm:0.5rem fg:white' : ''}"></div>`,
      errors: [{ messageId: 'invalidClassOrder' }],
      ...svelte
    },
    {
      name: 'whole classes after a fragment inside a Svelte expression are sorted',
      code: `<div class="bg:{dark ? 'black fg:white m:0.5rem' : 'white'}"></div>`,
      output: `<div class="bg:{dark ? 'black m:0.5rem fg:white' : 'white'}"></div>`,
      errors: [{ messageId: 'invalidClassOrder' }],
      ...svelte
    },
    {
      name: 'the ticket repro: Astro class:list',
      code: `<div class:list={['bg:black m:0.5rem', { 'bg:black m:0.5rem': on }]} />`,
      output: `<div class:list={['m:0.5rem bg:black', { 'm:0.5rem bg:black': on }]} />`,
      errors: [{ messageId: 'invalidClassOrder' }, { messageId: 'invalidClassOrder' }]
    },
    {
      name: 'the ticket repro: element.classList.add',
      code: `element.classList.add('bg:black m:0.5rem')`,
      output: `element.classList.add('m:0.5rem bg:black')`,
      errors: [{ messageId: 'invalidClassOrder' }]
    },
    {
      name: 'the ticket repro: document.body.classList.toggle',
      code: `document.body.classList.toggle('bg:black m:0.5rem', on)`,
      output: `document.body.classList.toggle('m:0.5rem bg:black', on)`,
      errors: [{ messageId: 'invalidClassOrder' }]
    },
    {
      name: 'a this chain',
      code: `this.el.classList.replace('bg:black m:0.5rem', 'bg:black m:0.5rem')`,
      output: `this.el.classList.replace('m:0.5rem bg:black', 'm:0.5rem bg:black')`,
      errors: [{ messageId: 'invalidClassOrder' }, { messageId: 'invalidClassOrder' }]
    },
    {
      name: 'an optional chain',
      code: `element.classList?.add('bg:black m:0.5rem')`,
      output: `element.classList?.add('m:0.5rem bg:black')`,
      errors: [{ messageId: 'invalidClassOrder' }]
    },
    {
      name: 'a non-null assertion',
      code: `element.classList!.add('bg:black m:0.5rem')`,
      output: `element.classList!.add('m:0.5rem bg:black')`,
      errors: [{ messageId: 'invalidClassOrder' }]
    },
    {
      name: 'a computed string key',
      code: `element['classList'].add('bg:black m:0.5rem')`,
      output: `element['classList'].add('m:0.5rem bg:black')`,
      errors: [{ messageId: 'invalidClassOrder' }]
    },
    {
      name: 'the ticket repro: a Vue class ternary',
      code: `<template><div :class="on ? 'bg:black m:0.5rem' : ''"></div></template>`,
      output: `<template><div :class="on ? 'm:0.5rem bg:black' : ''"></div></template>`,
      errors: [{ messageId: 'invalidClassOrder' }],
      ...vue
    },
    {
      name: 'a Vue class logical expression',
      code: `<template><div v-bind:class="on && 'bg:black m:0.5rem'"></div></template>`,
      output: `<template><div v-bind:class="on && 'm:0.5rem bg:black'"></div></template>`,
      errors: [{ messageId: 'invalidClassOrder' }],
      ...vue
    },
    {
      name: 'a Vue class string',
      code: `<template><div :class="'bg:black m:0.5rem'"></div></template>`,
      output: `<template><div :class="'m:0.5rem bg:black'"></div></template>`,
      errors: [{ messageId: 'invalidClassOrder' }],
      ...vue
    }
  ]
})

jsxTester.run('#198 no-conflicting-classes keeps fragments inside Svelte expressions', noConflictingClasses, {
  valid: [
    {
      // `flex` becomes `flexx` at runtime; deleting `block` would change the element.
      name: 'a fragment touching static text after the expression',
      code: `<div class="{on ? 'block flex' : ''}x"></div>`,
      ...svelte
    }
  ],
  invalid: [
    {
      name: 'a conflict inside a Svelte class expression',
      code: `<div class={on ? 'block flex' : ''}></div>`,
      output: `<div class={on ? 'flex' : ''}></div>`,
      errors: [{ messageId: 'collisionClass' }],
      ...svelte
    }
  ]
})

jsxTester.run('#198 no-invalid-classes checks the missed class contexts', noInvalidClasses, {
  valid: [],
  invalid: [
    {
      name: 'an unknown class in element.classList.add',
      code: `element.classList.add('rrr')`,
      options: [{ disallowUnknownClass: true }],
      errors: [{ messageId: 'disallowUnknownClass' }]
    },
    {
      name: 'an unknown class in a Vue class ternary',
      code: `<template><div :class="on ? 'rrr' : ''"></div></template>`,
      options: [{ disallowUnknownClass: true }],
      errors: [{ messageId: 'disallowUnknownClass' }],
      ...vue
    }
  ]
})


/**
 * Fault: a string inside a template literal's `${…}` that touches the template text, as in
 * `` `x${on ? 'a b' : ''}` ``, joins the class around it at runtime, yet it was linted as a whole
 * class list: sort-classes moved the fragment (`xfg:white` became `xm:0.5rem`) and
 * no-conflicting-classes deleted `block` from `` `${on ? 'block flex' : ''}x` ``. Each expression
 * now gets neighbours from the quasis beside it, falling back to the template's own neighbours at
 * either end, as the Svelte mustache branch does.
 *
 * Reverse check: visiting template expressions without neighbours turns the ten fragment cases
 * red (nine sort, one conflict) and leaves the whitespace cases green; ignoring the template's
 * own neighbours at its ends turns only the Svelte nested-template case red.
 */
jsxTester.run('#198 sort-classes keeps fragments inside template literal expressions', sortClasses, {
  valid: [
    { name: 'JSX className', code: "<div className={`x${on ? 'fg:white m:0.5rem' : ''}`} />" },
    { name: 'a fragment after the expression', code: "<div className={`${on ? 'fg:white m:0.5rem' : ''}-x`} />" },
    { name: 'two expressions in a row', code: "<div className={`${a}${on ? 'fg:white m:0.5rem' : ''}`} />" },
    { name: 'a template inside a class function array', code: "clsx([`x${on ? 'fg:white m:0.5rem' : ''}`])" },
    {
      name: 'Vue :class',
      code: "<template><div :class=\"`x${on ? 'fg:white m:0.5rem' : ''}`\"></div></template>",
      ...vue
    },
    { name: 'Svelte class expression', code: "<div class={`x${on ? 'fg:white m:0.5rem' : ''}`}></div>", ...svelte },
    { name: 'Astro class:list', code: "<div class:list={`x${on ? 'fg:white m:0.5rem' : ''}`} />" },
    {
      name: 'a template touching Svelte text at its start',
      code: "<div class=\"x{`${on ? 'fg:white m:0.5rem' : ''}`}\"></div>",
      ...svelte
    }
  ],
  invalid: [
    {
      name: 'an expression set off by whitespace',
      code: "<div className={`x ${on ? 'fg:white m:0.5rem' : ''}`} />",
      output: "<div className={`x ${on ? 'm:0.5rem fg:white' : ''}`} />",
      errors: [{ messageId: 'invalidClassOrder' }]
    },
    {
      name: 'whole classes after a fragment',
      code: "<div className={`bg:${dark ? 'black fg:white m:0.5rem' : 'white'}`} />",
      output: "<div className={`bg:${dark ? 'black m:0.5rem fg:white' : 'white'}`} />",
      errors: [{ messageId: 'invalidClassOrder' }]
    }
  ]
})

jsxTester.run('#198 no-conflicting-classes keeps fragments inside template literal expressions', noConflictingClasses, {
  valid: [
    { name: 'a fragment touching the text after', code: "<div className={`${on ? 'block flex' : ''}x`} />" }
  ],
  invalid: [
    {
      name: 'an expression set off by whitespace',
      code: "<div className={`${on ? 'block flex' : ''} x`} />",
      output: "<div className={`${on ? 'flex' : ''} x`} />",
      errors: [{ messageId: 'collisionClass' }]
    }
  ]
})
