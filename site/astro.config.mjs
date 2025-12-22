import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import tailwindcss from "@tailwindcss/vite";
import bun from "@nurodev/astro-bun";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

process.env.ASTRO_TELEMETRY_DISABLED = '1';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  integrations: [
    preact(),
    {
      name: "web3d-watcher",
      hooks: {
        "astro:server:setup": ({ server }) => {
          if (server.config.mode !== "development") return;
          
          const web3dPath = resolve(__dirname, "web3d");
          server.watcher.add(web3dPath);
          
          server.watcher.on("change", (path) => {
            if (path.includes("/web3d/") && path.endsWith(".c")) {
              console.log(`C file changed: ${path}`);
              console.log("Rebuilding WASM...");
              
              const result = spawnSync("make -sC web3d", { shell: true, encoding: "utf8" });
              
              if (result.error) {
                console.error(`WASM build failed: ${result.error.message}`);
              } else {
                console.log("WASM rebuilt successfully");
              }
            }
          });
        },
      },
    },
  ],
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