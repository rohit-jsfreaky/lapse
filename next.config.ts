import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const nextConfig: NextConfig = {
  devIndicators: false,
  // The render route reads fonts/ at runtime: ship it with the serverless function.
  outputFileTracingIncludes: { "/api/render": ["./fonts/**"] },
  // Hyper Elements renders PDFs and images on Node: keep their engines out of the bundle.
  serverExternalPackages: ["@react-pdf/renderer", "@resvg/resvg-js", "satori"],
  turbopack: {
    // This folder is its own project (its own repo); a git repo further up must not become the root.
    root: dirname(fileURLToPath(import.meta.url)),
    resolveAlias: {
      // Hyper Elements' PDF and image renderers target Node; these let them run in the browser.
      "@resvg/resvg-js": "./src/shims/resvg.ts",
      "@react-pdf/renderer": "./src/shims/react-pdf.js",
      crypto: "./src/shims/crypto.ts",
      harfbuzzjs: "./src/shims/harfbuzz.js",
      fs: { browser: "./src/shims/empty.ts" },
      path: { browser: "./src/shims/empty.ts" },
    },
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
