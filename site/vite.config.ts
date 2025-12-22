import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";
import wasm from "vite-plugin-wasm";
import { run } from "vite-plugin-run";
import { exec } from "node:child_process";

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
        pattern: ["web3d/*.c"],
      },
    ]),
    fresh(),
    tailwindcss(),
    wasm(),
    make(),
  ],
  build: {
    target: "esnext",
  },
});
