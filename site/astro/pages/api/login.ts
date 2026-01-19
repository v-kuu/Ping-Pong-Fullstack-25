import type { APIRoute } from "astro";
import { db, Sessions, Users, eq } from "astro:db";
import { validateEmail } from "@/utils/site/validation";
import { badRequest, unauthorized, success, internalError } from "@/utils/site/apiHelpers";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const formData = await request.formData();

    const email = formData.get("email")?.toString().trim();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
      return badRequest("Email and password are required");
    }

    if (!validateEmail(email)) {
      return badRequest("Invalid email format");
    }

    const user = await db
      .select({
        id: Users.id,
        email: Users.email,
        password: Users.password,
      })
      .from(Users)
      .where(eq(Users.email, email))
      .limit(1);

    if (user.length === 0) {
      return unauthorized("Invalid email or password");
    }

    const foundUser = user[0];

    const isValidPassword = await Bun.password.verify(
      password,
      foundUser.password,
    );

    if (!isValidPassword) {
      return unauthorized("Invalid email or password");
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
