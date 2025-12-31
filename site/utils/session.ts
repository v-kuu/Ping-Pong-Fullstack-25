import { db, Sessions, Users, eq } from "astro:db";

export async function getSessionUser(cookies: { get: (name: string) => { value?: string | undefined } | undefined } | undefined) {
  if (!cookies) return null;
  
  const sessionId = cookies.get("session")?.value;
  if (!sessionId) return null;

  try {
    const session = await db
      .select()
      .from(Sessions)
      .innerJoin(Users, eq(Sessions.userId, Users.id))
      .where(eq(Sessions.id, sessionId))
      .limit(1)
      .get();

    return session?.Users || null;
  } catch {
    return null;
  }
}
