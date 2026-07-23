import type { NextConfig } from "next"
import withSerwist from "@serwist/next"

const disableSerwist = process.env.NODE_ENV !== "production"

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},
  allowedDevOrigins: ["35.219.12.151"],
}

export default withSerwist({
  swSrc: "sw.ts",
  swDest: "public/sw.js",
  disable: disableSerwist,
})(nextConfig)
