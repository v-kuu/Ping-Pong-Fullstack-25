import type { APIRoute } from "astro";
import { db, Friendships, Users, eq, or, and, desc } from "astro:db";

function getOnlineStatus(lastSeen: Date | null | undefined): "online" | "offline" {
  if (!lastSeen) return "offline";
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return lastSeen > fiveMinutesAgo ? "online" : "offline";
}

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify([]), { status: 200 });
  }

  try {
    const friendships = await db
      .select()
      .from(Friendships)
      .where(
        and(
          or(
            eq(Friendships.userId, user.id),
            eq(Friendships.friendId, user.id)
          ),
          eq(Friendships.status, "accepted")
        )
      )
      .orderBy(desc(Friendships.id));

    const friends = await Promise.all(
      friendships.map(async (f) => {
        const friendId = f.userId === user.id ? f.friendId : f.userId;
        const userResult = await db
          .select()
          .from(Users)
          .where(eq(Users.id, friendId))
          .limit(1)
          .get();

        if (!userResult) return null;

        return {
          id: userResult.id,
          username: userResult.username,
          elo: userResult.elo,
          status: getOnlineStatus(userResult.lastSeen),
        };
      })
    );

    return new Response(JSON.stringify(friends.filter(Boolean)), {
      status: 200,
    });
  } catch (error) {
    console.error("Failed to get friends:", error);
    return new Response(JSON.stringify([]), { status: 200 });
  }
};
