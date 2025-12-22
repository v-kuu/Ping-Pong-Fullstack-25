import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import tailwindcss from "@tailwindcss/vite";
import bun from "@nurodev/astro-bun";

process.env.ASTRO_TELEMETRY_DISABLED = '1';

export default defineConfig({
  integrations: [preact()],
  output: "server",
  adapter: bun(),
  server: {
    port: 3000,
    host: true
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
