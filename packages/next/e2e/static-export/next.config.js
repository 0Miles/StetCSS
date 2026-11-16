import { withStetCSS } from '../../dist/index.js'

/** @type {import('next').NextConfig} */
const nextConfig = withStetCSS({
  output: 'export'
})

export default nextConfig
