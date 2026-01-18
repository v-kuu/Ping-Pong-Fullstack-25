import { APIRoute } from "astro";
import { db, Users, eq } from "astro:db";
import { redirect, forbidden } from "@/utils/site/apiHelpers";

export const DELETE: APIRoute = async({ locals }) => {
  console.log(locals);
  const result = await db
    .delete(Users)
    .where(eq(Users.username, locals.user.username))
    .catch(error) => {
      console.error(error);
      return forbidden();
    }
  console.log(result);
  return redirect('/logout');
}