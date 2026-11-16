import { withMasterCSS } from '../../dist/index.js'

/** @type {import('next').NextConfig} */
const nextConfig = withMasterCSS({}, {
  adapters: [{
    // Reads `adapter-probe.md` backwards, so the class it finds is spelled out in no project
    // file (this config is one) and no built-in adapter can find it.
    name: 'probe',
    test: /adapter-probe\.md$/,
    extract: async ({ content }) => [content.trim().split('').reverse().join('')]
  }]
})

export default nextConfig
