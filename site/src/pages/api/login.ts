import type { APIRoute } from "astro";
import { db } from "@/db/index.ts";
import { users } from "@/db/schema.ts";
import { eq } from "drizzle-orm";
import { createResponse } from "@/utils/validation.ts";

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();

    const username = formData.get("username")?.toString().trim();
    const password = formData.get("password")?.toString();

    if (!username || !password) {
      return createResponse(
        { error: "Username and password are required" },
        400,
      );
    }

    // Username validation
    const usernamePattern = /^[A-Za-z][A-Za-z0-9\-]{2,29}$/;
    if (!usernamePattern.test(username)) {
      return createResponse({ error: "Invalid username format" }, 400);
    }

    const user = await db
      .select({
        id: users.id,
        username: users.username,
        password: users.password,
      })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (user.length === 0) {
      return createResponse({ error: "Invalid username or password" }, 401);
    }

    const foundUser = user[0];

    // Verify password using Bun
    const isValidPassword = await Bun.password.verify(
      password,
      foundUser.password,
    );

    if (!isValidPassword) {
      return createResponse({ error: "Invalid username or password" }, 401);
    }

    // Login successful, need to implement the rest later
    return createResponse({ success: true, message: "Login successful" }, 200);
  } catch (error) {
    return createResponse({ error: "Internal Server Error" }, 500);
  }
};
