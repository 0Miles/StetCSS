import { withMasterCSS } from '../dist/index.js'

/** @type {import('next').NextConfig} */
const nextConfig = withMasterCSS({
  reactStrictMode: true
})

export default nextConfig
