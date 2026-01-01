import type { APIRoute } from "astro";
import { db, Friendships, Users, eq, and, desc } from "astro:db";

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify([]), { status: 200 });
  }

  try {
    const requests = await db
      .select()
      .from(Friendships)
      .where(
        and(
          eq(Friendships.friendId, user.id),
          eq(Friendships.status, "pending")
        )
      )
      .orderBy(desc(Friendships.id));

    const result = await Promise.all(
      requests.map(async (r) => {
        const userResult = await db
          .select()
          .from(Users)
          .where(eq(Users.id, r.userId))
          .limit(1)
          .get();

        if (!userResult) return null;

        return {
          id: r.id,
          userId: userResult.id,
          username: userResult.username,
          elo: userResult.elo,
        };
      })
    );

    return new Response(JSON.stringify(result.filter(Boolean)), {
      status: 200,
    });
  } catch (error) {
    console.error("Failed to get friend requests:", error);
    return new Response(JSON.stringify([]), { status: 200 });
  }
};
