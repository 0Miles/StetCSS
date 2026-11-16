import { withStetCSS } from '../dist/index.js'

/** @type {import('next').NextConfig} */
const nextConfig = withStetCSS({
  reactStrictMode: true
})

export default nextConfig
