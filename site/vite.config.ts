import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";
import wasm from "vite-plugin-wasm";
import { run } from "vite-plugin-run";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const make = () => {
	return {
		name: "make-plugin",
        apply: "build",
		buildStart: () => {
			exec('make -sC web3d', (_, _output, _error) => {});
		},
	};
};

export default defineConfig({
  root: "./",
  plugins: [
    run([
      {
        name: "compile web3d",
        run: ["make", "-sC", "web3d"],
        pattern: ["web3d/*.c", "web3d/*.h"],
      },
    ]),
    preact(),
    tailwindcss(),
    wasm(),
    make(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
