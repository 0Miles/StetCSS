export default defineNuxtConfig({
  ssr: false,
  css: ['~/app.css'],
  modules: [
    ['../../../src/module', {
      // Reads `adapter-probe.md` backwards, so the class it finds is spelled out in no project
      // file (this config is one) and no built-in adapter can find it.
      adapters: [{
        name: 'probe',
        test: /adapter-probe\.md$/,
        async extract({ content }) {
          return [content.trim().split('').reverse().join('')]
        }
      }]
    }]
  ]
})
