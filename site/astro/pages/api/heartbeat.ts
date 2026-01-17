import type { APIRoute } from "astro";
import { db, Users, eq } from "astro:db";
import { unauthorized, noContent, internalError } from "@/utils/site/apiHelpers";

export const POST: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user) {
    return unauthorized();
  }

  try {
    await db
      .update(Users)
      .set({ lastSeen: new Date() })
      .where(eq(Users.id, user.id));

    return noContent();
  } catch (error) {
    console.error("Failed to update lastSeen:", error);
    return internalError();
  }
};
