import type { APIRoute } from "astro";
import { db, Sessions, Users, eq } from "astro:db";
import { validateUsername } from "@/utils/validation";
import { badRequest, unauthorized, success, internalError } from "@/utils/apiHelpers";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const formData = await request.formData();

    const username = formData.get("username")?.toString().trim();
    const password = formData.get("password")?.toString();

    if (!username || !password) {
      return badRequest("Username and password are required");
    }

    if (!validateUsername(username)) {
      return badRequest("Invalid username format");
    }

    const user = await db
      .select({
        id: Users.id,
        username: Users.username,
        password: Users.password,
      })
      .from(Users)
      .where(eq(Users.username, username))
      .limit(1);

    if (user.length === 0) {
      return unauthorized("Invalid username or password");
    }

    const foundUser = user[0];

    const isValidPassword = await Bun.password.verify(
      password,
      foundUser.password,
    );

    if (!isValidPassword) {
      return unauthorized("Invalid username or password");
    }

    const sessionId = crypto.randomUUID();
    await db.insert(Sessions).values({ id: sessionId, userId: foundUser.id });

    cookies.set("session", sessionId, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "lax",
      path: "/",
    });

    return success({ success: true, message: "Login successful" });
  } catch (error) {
    return internalError();
  }
};
