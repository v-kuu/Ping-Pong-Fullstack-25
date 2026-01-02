import type { APIRoute } from "astro";
import { db, Users, Friendships, eq, or, and } from "astro:db";

const NONE_RESPONSE = { status: "none", requestId: null };

export const GET: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  const friendUsername = params.username;

  if (!user || !friendUsername) {
    return new Response(JSON.stringify(NONE_RESPONSE), { status: 200 });
  }

  if (friendUsername === user.username) {
    return new Response(JSON.stringify({ status: "self", requestId: null }), {
      status: 200,
    });
  }

  try {
    const [friend] = await db
      .select()
      .from(Users)
      .where(eq(Users.username, friendUsername))
      .limit(1);

    if (!friend) {
      return new Response(JSON.stringify(NONE_RESPONSE), { status: 200 });
    }

    const [friendship] = await db
      .select()
      .from(Friendships)
      .where(
        or(
          and(
            eq(Friendships.userId, user.id),
            eq(Friendships.friendId, friend.id),
          ),
          and(
            eq(Friendships.userId, friend.id),
            eq(Friendships.friendId, user.id),
          ),
        ),
      )
      .limit(1);

    if (!friendship) {
      return new Response(JSON.stringify(NONE_RESPONSE), { status: 200 });
    }

    if (friendship.status === "accepted") {
      return new Response(
        JSON.stringify({ status: "accepted", requestId: friendship.id }),
        { status: 200 },
      );
    }

    const status = friendship.userId === user.id ? "sent" : "received";
    return new Response(JSON.stringify({ status, requestId: friendship.id }), {
      status: 200,
    });
  } catch (error) {
    console.error("Failed to get friendship status:", error);
    return new Response(JSON.stringify(NONE_RESPONSE), { status: 200 });
  }
};
