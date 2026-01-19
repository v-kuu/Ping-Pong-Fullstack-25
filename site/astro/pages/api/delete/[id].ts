import type { APIRoute } from "astro";
import { db, Users, Matches, Sessions, Friendships, eq, or } from "astro:db";
import { internalError, noContent } from "@/utils/site/apiHelpers.ts";

export const DELETE: APIRoute = async ({ params }) => {
  const userId = +params.id;

  try {
    await db.delete(Sessions).where(eq(Sessions.userId, userId));
    await db.delete(Friendships).where(
      or(
        eq(Friendships.userId, userId),
        eq(Friendships.friendId, userId)
      )
    );
    await db.delete(Matches).where(
      or(
        eq(Matches.player1Id, userId),
        eq(Matches.player2Id, userId)
      )
    );
    await db.delete(Users)
      .where(eq(Users.id, userId))
      .run();

    return noContent();
  } catch (error) {
    console.error("Failed to delete user:", error);
    return internalError(error.message);
  }
};