# Master CSS Astro example

This example uses `@stet-css/astro` with no options, which builds static CSS.

The integration:

- reads classes from the project's files, including `.astro` templates that only the server build compiles
- emits their rules into one CSS file at build time
- ships no runtime to the browser

## Project structure

```
/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   └── Card.astro
│   ├── layouts/
│   │   └── Layout.astro
│   ├── pages/
│   │   └── index.astro
│   └── styles/
│       └── global.css
└── package.json
```

`astro.config.js` registers `masterCSS()`.

`src/styles/global.css` imports the Master CSS default stylesheet, and `src/layouts/Layout.astro` imports that file:

```css
@import '@stet-css/core';
```

Import the stylesheet from a CSS file rather than an inline `<style>` block: Astro inlines `@import` in `<style>` blocks before Vite plugins see them.

`src/pages/index.astro` toggles classes from a client script. They are written in the file, so the static CSS already has their rules.

## Commands

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm run dev`             | Starts local dev server at `localhost:3000`      |
| `npm run build`           | Builds the production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |
