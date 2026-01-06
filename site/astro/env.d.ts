/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user: import("astro:db").Users.$inferSelect | null;
  }
}

declare module "astro:content" {
  interface RenderResult {}
}

declare module "astro:middleware" {
  interface MiddlewareContext {}
}
