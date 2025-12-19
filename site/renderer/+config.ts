import type { Config } from "vike/types";

export default {
  clientRouting: true,
  hydrationCanBeAborted: true,
  passToClient: ["pageProps", "urlPathname"],
  meta: {
    Layout: {
      env: { server: true, client: true },
    },
    Head: {
      env: { server: true },
    },
    title: {
      env: { server: true, client: true },
    },
  },
} satisfies Config;
