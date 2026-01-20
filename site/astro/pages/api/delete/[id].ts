import type { APIRoute } from "astro";
import { sql, db, Users, Matches, Sessions, Friendships, eq, or, inArray } from "astro:db";
import { internalError, noContent } from "@/utils/site/apiHelpers.ts";

const AVATARS_DIR = import.meta.env.PROD
  ? `${process.cwd()}/dist/client/avatars`
  : `${process.cwd()}/public/avatars`;

export const DELETE: APIRoute = async ({ params, locals }) => {
  const userId = +params.id;

  if (locals.user) {
    const avatarPath = `${AVATARS_DIR}/${locals.user.username}.png`;
    const file = Bun.file(avatarPath);
    if(await file.exists()) {
      await file.delete();
    }
  }

  try {
    await db.delete(Sessions).where(eq(Sessions.userId, userId));

    await db.delete(Friendships).where(
      or(
        eq(Friendships.userId, userId),
        eq(Friendships.friendId, userId)
      )
    );

    await db.delete(Matches)
      .where(
        sql`${Matches.playerIds} LIKE ${userId}`
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