import { Hono } from "hono";

export const apiRouter = new Hono();

apiRouter.get("/:name", (c) => {
  const name = c.req.param("name");
  return c.text(`Hello, ${name.charAt(0).toUpperCase() + name.slice(1)}!`);
});
