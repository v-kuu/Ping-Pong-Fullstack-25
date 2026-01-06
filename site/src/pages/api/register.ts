import type { APIRoute } from "astro";
import { db, Users, eq, or } from "astro:db";
import { validatePassword, validateUsername } from "@/utils/validation";
import { badRequest, conflict, created, internalError } from "@/utils/apiHelpers";

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();

    const username = formData.get("username")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const password = formData.get("password")?.toString();
    const confirmPassword = formData.get("confirmPassword")?.toString();

    if (!username || !email || !password || !confirmPassword) {
      return badRequest("All fields are required");
    }

    if (!validateUsername(username)) {
      return badRequest("Invalid username format");
    }

    if (password !== confirmPassword) {
      return badRequest("Passwords do not match");
    }

    if (!validatePassword(password)) {
      return badRequest("Password must be at least 12 characters and strong enough");
    }

    const existingUser = await db
      .select()
      .from(Users)
      .where(or(eq(Users.username, username), eq(Users.email, email)))
      .limit(1);

    if (existingUser.length > 0) {
      return conflict("Username or email already taken");
    }

    const hashedPassword = await Bun.password.hash(password);

    const newUser = {
      username,
      email,
      password: hashedPassword,
    };

    await db.insert(Users).values(newUser);

    return created({ success: true, message: "Account created successfully" });
  } catch {
    return internalError();
  }
};
