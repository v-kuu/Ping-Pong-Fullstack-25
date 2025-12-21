import { Elysia } from "elysia";
import { staticPlugin } from "@elysiajs/static";

const app = new Elysia()
  .use(staticPlugin({ assets: "static", prefix: "/" }))

  // Serve Vite build output (JS, CSS bundles) from dist/assets/
  .use(staticPlugin({ assets: "dist/assets", prefix: "/assets" }))

  // API routes
  .get("/api/:name", ({ params }) => {
    const name = params.name;
    return `Hello, ${name.charAt(0).toUpperCase() + name.slice(1)}!`;
  })

  // Page routes - serve index.html for client-side routing
  .get("/", () => Bun.file("dist/index.html"))
  .get("/game", () => Bun.file("dist/index.html"))
  .get("/login", () => Bun.file("dist/index.html"))
  .get("/signup", () => Bun.file("dist/index.html"))
  .get("/settings", () => Bun.file("dist/index.html"))
  .get("/privacy-policy", () => Bun.file("dist/index.html"))
  .get("/terms-of-service", () => Bun.file("dist/index.html"))

  .listen(3000);

console.log(`🦊 Elysia server running at http://localhost:${app.server?.port}`);
