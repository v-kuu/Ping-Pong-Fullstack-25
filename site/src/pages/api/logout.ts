import type { APIRoute } from "astro";
import { db, Sessions, eq } from "astro:db";

export const POST: APIRoute = async ({ cookies, redirect }) => {
  const sessionId = cookies.get("session")?.value;

  if (sessionId) {
    await db.delete(Sessions).where(eq(Sessions.id, sessionId));
    cookies.delete("session");
  }

  return redirect("/logout");
};
