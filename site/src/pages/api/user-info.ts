import type { APIRoute } from "astro";
import { getSessionUser } from "@/utils/session";

export const GET: APIRoute = async ({ cookies }) => {
  const user = await getSessionUser(cookies);
  
  if (!user) {
    return new Response(JSON.stringify({ error: "Not logged in" }), { status: 401 });
  }
  
  return Response.json({
    username: user.username,
    email: user.email,
    elo: user.elo,
  });
};
