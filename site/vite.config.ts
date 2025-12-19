import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import vike from "vike/plugin";
import tailwindcss from "@tailwindcss/vite";
import wasm from "vite-plugin-wasm"
import { watchAndRun } from 'vite-plugin-watch-and-run'
import path from 'node:path'
import devServer from "@hono/vite-dev-server";

export default defineConfig({
  root: "./",
  build: {
    target: "esnext",
  },
  plugins: [ wasm(),
    watchAndRun([{
      name: 'web3d',
      watch: path.resolve('./web3d/*.c'),
      run: 'make -sC web3d reload',
	  watchKind: ['change'],
	  delay: 150
    }]),
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
