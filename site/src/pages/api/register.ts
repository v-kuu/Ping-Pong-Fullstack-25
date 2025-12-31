import type { APIRoute } from "astro";
import { db, Users, eq, or } from "astro:db";
import {
  validatePassword,
  validateUsername,
} from "@/utils/validation";

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();

    const username = formData.get("username")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const password = formData.get("password")?.toString();
    const confirmPassword = formData.get("confirmPassword")?.toString();

    if (!username || !email || !password || !confirmPassword) {
      return Response.json({ error: "All fields are required" }, { status: 400 });
    }

    if (!validateUsername(username)) {
      return Response.json({ error: "Invalid username format" }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return Response.json({ error: "Passwords do not match" }, { status: 400 });
    }

    if (!validatePassword(password)) {
      return Response.json(
        {
          error:
            "Password must be at least 12 characters and strong enough",
        },
        { status: 400 },
      );
    }

    // Database Check
    const existingUser = await db
      .select()
      .from(Users)
      .where(or(eq(Users.username, username), eq(Users.email, email)))
      .limit(1);

    if (existingUser.length > 0) {
      return Response.json({ error: "Username or email already taken" }, { status: 409 });
    }

    const hashedPassword = await Bun.password.hash(password);

    const newUser = {
      username,
      email,
      password: hashedPassword,
    };

    await db.insert(Users).values(newUser);

    return Response.json(
      { success: true, message: "Account created successfully" },
      { status: 201 },
    );
  } catch {
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
};
