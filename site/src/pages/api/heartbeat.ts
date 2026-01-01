import type { APIRoute } from "astro";
import { db, Users, eq } from "astro:db";

export const POST: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(null, { status: 401 });
  }

  try {
    await db
      .update(Users)
      .set({ lastSeen: new Date() })
      .where(eq(Users.id, user.id));

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("Failed to update lastSeen:", error);
    return new Response(null, { status: 500 });
  }
};
