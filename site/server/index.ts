import { Hono } from "hono";
import { renderPage } from "vike/server";
import { apiRouter } from "./api_router.ts";

const app = new Hono();

// Serve static files in production
if (process.env.NODE_ENV !== "development") {
  const { serveStatic } = await import("hono/bun");
  app.use("/*", serveStatic({ root: "./dist/client" }));
}

// Vike middleware for SSR
app.all("*", async (c, next) => {
  const pageContextInit = {
    urlOriginal: c.req.url,
  };
  const pageContext = await renderPage(pageContextInit);
  const { httpResponse } = pageContext;
  if (!httpResponse) {
    return next();
  } else {
    const { body, statusCode, headers } = httpResponse;
    headers.forEach(([name, value]) => c.header(name, value));
    c.status(statusCode);
    return c.body(body);
  }
});

console.log("Server running at http://0.0.0.0:3000");

export default {
  port: 3000,
  hostname: "0.0.0.0",
  fetch: app.fetch,
};
