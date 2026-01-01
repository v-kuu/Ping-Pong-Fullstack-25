import type { APIRoute } from "astro";
import { db, Friendships, eq, and } from "astro:db";

export const POST: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const requestId = params.id ? parseInt(params.id) : NaN;
  if (isNaN(requestId)) {
    return new Response(JSON.stringify({ error: "Invalid request ID" }), {
      status: 400,
    });
  }

  try {
    const request = await db
      .select()
      .from(Friendships)
      .where(
        and(
          eq(Friendships.id, requestId),
          eq(Friendships.friendId, user.id),
          eq(Friendships.status, "pending")
        )
      )
      .limit(1)
      .get();

    if (!request) {
      return new Response(JSON.stringify({ error: "Request not found" }), {
        status: 404,
      });
    }

    await db
      .delete(Friendships)
      .where(eq(Friendships.id, requestId));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
    });
  } catch (error) {
    console.error("Failed to decline friend request:", error);
    return new Response(JSON.stringify({ error: "Failed to decline request" }), {
      status: 500,
    });
  }
};
