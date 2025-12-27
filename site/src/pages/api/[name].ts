import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ params }) => {
  const name = params.name ?? "world";
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
  return new Response(`Hello, ${capitalized}!`, {
    headers: { "Content-Type": "text/plain" },
  });
};
