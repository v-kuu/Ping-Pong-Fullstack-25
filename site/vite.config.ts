import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";
import wasm from "vite-plugin-wasm";
import { run } from "vite-plugin-run";

export default defineConfig({
  root: "./",
  plugins: [fresh(), tailwindcss(), wasm(), run([{ name: 'compile web3d', run: ['make', '-sC', 'web3d'], pattern: ['web3d/*.c'],}]),],
  optimizeDeps: {
      exclude: ["@babylonjs/core"],
  },
});


