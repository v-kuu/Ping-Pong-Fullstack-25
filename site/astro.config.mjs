import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import tailwindcss from "@tailwindcss/vite";
import bun from "@nurodev/astro-bun";
import { resolve } from "node:path";

process.env.ASTRO_TELEMETRY_DISABLED = "1";

export default defineConfig({
  integrations: [
    preact(),
    {
      name: "web3d-watcher",
      hooks: {
        "astro:server:setup": ({ server }) => {
          if (server.config.mode !== "development") return;

          const web3dPath = resolve(import.meta.dirname, "web3d");
          server.watcher.add(web3dPath);

          server.watcher.on("change", (path) => {
            if (path.includes("/web3d/") && path.endsWith(".c")) {
              console.log(`C file changed: ${path}`);
              console.log("Rebuilding WASM...");

              const { exitCode, stderr } = Bun.spawnSync([
                "make",
                "-sC",
                "web3d",
              ]);
              if (exitCode !== 0) {
                console.error(`WASM build failed: ${stderr.toString()}`);
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
    host: true,
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
