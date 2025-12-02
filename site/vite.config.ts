import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";
import viteFastify from "@fastify/vite/plugin";

export default defineConfig({
  root: "./",
  plugins: [fresh(), tailwindcss(), viteFastify({ useRelativePaths: true })],
});
