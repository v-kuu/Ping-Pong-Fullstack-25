import { APIRoute } from "astro";
import { db, Users, eq } from "astro:db";

export const DELETE: APIRoute = async({ locals, params }) => {
  const user = locals.user;
  const del = params.username;
  if (user === del) {
    await db.delete(Users, eq(Users.username, del));
  }
}