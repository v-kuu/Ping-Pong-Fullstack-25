import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

export default defineConfig({
  integrations: [preact()],
  output: 'server',
  publicDir: 'static',
  server: {
    port: 3000,
  },
  vite: {
    css: {
      postcss: {
        plugins: [require('@tailwindcss/postcss')],
      },
    },
  },
});
