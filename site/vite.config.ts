import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";
import wasm from "vite-plugin-wasm"
import { watchAndRun } from 'vite-plugin-watch-and-run'
import path from 'node:path'

export default defineConfig({
  root: "./",
  plugins: [fresh(), tailwindcss(), wasm(),
    watchAndRun([{
      name: 'web3d',
      watch: path.resolve('./web3d/*.c'),
      run: 'make -C web3d --no-print-directory'
    }])
  ],
});
