import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import vike from "vike/plugin";
import tailwindcss from "@tailwindcss/vite";
import devServer from "@hono/vite-dev-server";

export default defineConfig({
  root: "./",
  build: {
    target: "esnext",
  },
  plugins: [
    devServer({
      entry: "server/index.ts",
      exclude: [
        /^\/@.+$/,
        /.*\.(ts|tsx|vue)($|\?)/,
        /.*\.(s?css|less)($|\?)/,
        /^\/favicon\.ico$/,
        /.*\.(svg|png)($|\?)/,
        /.*\.env($|\?)/,
        /^\/(public|assets|static)\/.+/,
        /^\/node_modules\/.*/,
      ],
      injectClientScript: false,
    }),
    preact(),
    vike(),
    tailwindcss(),
  ],
});
