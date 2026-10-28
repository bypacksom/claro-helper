// Lovable configures TanStack Start, React, Tailwind and Nitro.
// Keep the normal Lovable preview/build unchanged. Only CI for GitHub Pages
// enables prerendering and a Node-compatible Nitro build.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

export default defineConfig({
  ...(isGitHubPages
    ? {
        // The site is hosted at https://bypacksom.github.io/claro-helper/
        vite: { base: "/claro-helper/" },
        // The prerender crawler must run a Node server, not a Cloudflare worker.
        nitro: {
          preset: "node-server",
          output: {
            dir: ".output",
            serverDir: ".output/server",
            publicDir: ".output/public",
          },
        },
      }
    : {}),
  tanstackStart: {
    server: { entry: "server" },
    ...(isGitHubPages
      ? {
          prerender: {
            enabled: true,
            autoSubfolderIndex: true,
            autoStaticPathsDiscovery: true,
            crawlLinks: true,
            failOnError: true,
          },
        }
      : {}),
  },
});
