import type { APIRoute } from "astro";
import { db, Users, Friendships, eq, or, and } from "astro:db";

export const GET: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ status: "none", requestId: null }), {
      status: 200,
    });
  }

  const friendUsername = params.username;
  if (!friendUsername) {
    return new Response(JSON.stringify({ status: "none", requestId: null }), {
      status: 200,
    });
  }

  try {
    const friendResult = await db
      .select()
      .from(Users)
      .where(eq(Users.username, friendUsername))
      .limit(1);

    if (friendResult.length === 0) {
      return new Response(JSON.stringify({ status: "none", requestId: null }), {
        status: 200,
      });
    }

    const friend = friendResult[0];

    const friendship = await db
      .select()
      .from(Friendships)
      .where(
        or(
          and(eq(Friendships.userId, user.id), eq(Friendships.friendId, friend.id)),
          and(eq(Friendships.userId, friend.id), eq(Friendships.friendId, user.id))
        )
      )
      .limit(1)
      .get(); // Using .get() as we want single result

    if (!friendship) {
      return new Response(JSON.stringify({ status: "none", requestId: null }), {
        status: 200,
      });
    }

    if (friendship.status === "accepted") {
      return new Response(JSON.stringify({ status: "accepted", requestId: friendship.id }), {
        status: 200,
      });
    }

    // It is pending. Check who sent it.
    if (friendship.userId === user.id) {
      // I sent it
      return new Response(JSON.stringify({ status: "sent", requestId: friendship.id }), {
        status: 200,
      });
    } else {
      // They sent it (I received it)
      return new Response(JSON.stringify({ status: "received", requestId: friendship.id }), {
        status: 200,
      });
    }

  } catch (error) {
    console.error("Failed to get friendship status:", error);
    return new Response(JSON.stringify({ status: "none", requestId: null }), {
      status: 200,
    });
  }
};
