import type { APIRoute } from "astro";
import { db } from "@/db/index.ts";
import { users } from "@/db/schema.ts";
import { eq, or } from "drizzle-orm";
import type { NewUser } from "@/db/schema.ts";
import {
  validatePassword,
  validateUsername,
  createResponse,
} from "@/utils/validation";

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();

    const username = formData.get("username")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const password = formData.get("password")?.toString();
    const confirmPassword = formData.get("confirmPassword")?.toString();

    if (!username || !email || !password || !confirmPassword) {
      return createResponse({ error: "All fields are required" }, 400);
    }

    if (!validateUsername(username)) {
      return createResponse({ error: "Invalid username format" }, 400);
    }

    if (password !== confirmPassword) {
      return createResponse({ error: "Passwords do not match" }, 400);
    }

    if (!validatePassword(password)) {
      return createResponse(
        {
          error:
            "Password must be at least 12 characters and strong enough",
        },
        400,
      );
    }

    // Database Check
    const existingUser = await db
      .select()
      .from(users)
      .where(or(eq(users.username, username), eq(users.email, email)))
      .limit(1);

    if (existingUser.length > 0) {
      return createResponse({ error: "Username or email already taken" }, 409);
    }

    const hashedPassword = await Bun.password.hash(password);

    const newUser: NewUser = {
      username,
      email,
      password: hashedPassword,
    };

    await db.insert(users).values(newUser);

    return createResponse(
      { success: true, message: "Account created successfully" },
      201,
    );
  } catch {
    return createResponse({ error: "Internal Server Error" }, 500);
  }
};
