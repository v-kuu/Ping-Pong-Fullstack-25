import type { APIRoute } from "astro";
import { db, Users, Friendships, eq, or } from "astro:db";

export const POST: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const friendUsername = params.username;
  if (!friendUsername) {
    return new Response(JSON.stringify({ error: "Username required" }), {
      status: 400,
    });
  }

  try {
    const friendResult = await db
      .select()
      .from(Users)
      .where(eq(Users.username, friendUsername))
      .limit(1);

    if (friendResult.length === 0) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    const friend = friendResult[0];

    if (friend.id === user.id) {
      return new Response(JSON.stringify({ error: "Cannot add yourself" }), {
        status: 400,
      });
    }

    const existing = await db
      .select()
      .from(Friendships)
      .where(
        or(
          eq(Friendships.userId, user.id),
          eq(Friendships.friendId, user.id)
        )
      )
      .get();

    if (existing) {
      return new Response(JSON.stringify({ error: "Already friends or request pending" }), {
        status: 400,
      });
    }

    const result = await db.insert(Friendships).values({
      userId: user.id,
      friendId: friend.id,
      status: "pending",
    }).returning();

    return new Response(JSON.stringify({ success: true, friendship: result[0] }), {
      status: 200,
    });
  } catch (error) {
    console.error("Failed to send friend request:", error);
    return new Response(JSON.stringify({ error: "Failed to send friend request" }), {
      status: 500,
    });
  }
};
