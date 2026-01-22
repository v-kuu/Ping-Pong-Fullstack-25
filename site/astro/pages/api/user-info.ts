import type { APIRoute } from "astro";
import { unauthorized, success } from "@/utils/site/apiHelpers";

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user) {
    return unauthorized();
  }

  return success({
    username: locals.user.username,
    email: locals.user.email,
  });
};
