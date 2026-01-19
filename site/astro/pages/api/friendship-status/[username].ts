import type { APIRoute } from "astro";
import { db, Users, Friendships, eq, or, and } from "astro:db";
import { success } from "@/utils/site/apiHelpers";

const NONE_RESPONSE = { status: "none", requestId: null };

export const GET: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  const friendUsername = params.username;

  if (!user || !friendUsername) {
    return success(NONE_RESPONSE);
  }

  if (friendUsername === user.username) {
    return success({ status: "self", requestId: null });
  }

  try {
    const [friend] = await db
      .select()
      .from(Users)
      .where(eq(Users.username, friendUsername))
      .limit(1);

    if (!friend) {
      return success(NONE_RESPONSE);
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
      return success(NONE_RESPONSE);
    }

    if (friendship.status === "accepted") {
      return success({ status: "accepted", requestId: friendship.id });
    }

    const status = friendship.userId === user.id ? "sent" : "received";
    return success({ status, requestId: friendship.id });
  } catch (error) {
    console.error("Failed to get friendship status:", error);
    return success(NONE_RESPONSE);
  }
};
