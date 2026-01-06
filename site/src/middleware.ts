import { defineMiddleware } from "astro:middleware";
import { db, Sessions, Users, eq } from "astro:db";

export const onRequest = defineMiddleware(async (context, next) => {
  const { locals, cookies } = context;
  const sessionId = cookies.get("session")?.value;

  if (sessionId) {
    const session = await db
      .select()
      .from(Sessions)
      .innerJoin(Users, eq(Sessions.userId, Users.id))
      .where(eq(Sessions.id, sessionId))
      .limit(1)
      .get();

    if (session) {
      locals.user = session.Users;

      // Middleware updates lastSeen on every authenticated request.
      // This eliminates the need for client-side heartbeat polling.
      // To revert to explicit heartbeat approach:
      // 1. Remove this update logic
      // 2. Restore heartbeat client script in Base.astro
      // 3. Keep /api/heartbeat endpoint (already exists)
      await db
        .update(Users)
        .set({ lastSeen: new Date() })
        .where(eq(Users.id, session.Users.id));
    } else {
      locals.user = null;
    }
  } else {
    locals.user = null;
  }

  return next();
});
