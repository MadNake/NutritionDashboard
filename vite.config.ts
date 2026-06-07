import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    // Dev: Vite serves the SPA with HMR on 5173 and proxies /api to the
    // Cloudflare Pages Functions running under `wrangler pages dev` on 8788.
    proxy: {
      "/api": "http://localhost:8788",
    },
  },
})
