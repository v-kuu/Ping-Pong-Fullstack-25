import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: "Not logged in" }), { status: 401 });
  }
  
  return Response.json({
    username: locals.user.username,
    email: locals.user.email,
    elo: locals.user.elo,
  });
};
