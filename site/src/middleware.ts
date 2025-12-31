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
    } else {
      locals.user = null;
    }
  } else {
    locals.user = null;
  }

  return next();
});
