import type { APIRoute } from "astro";
import { db, Users, eq } from "astro:db";

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();

    const username = formData.get("username")?.toString().trim();
    const password = formData.get("password")?.toString();

    if (!username || !password) {
      return Response.json(
        { error: "Username and password are required" },
        { status: 400 },
      );
    }

    // Username validation
    const usernamePattern = /^[A-Za-z][A-Za-z0-9\-]{2,29}$/;
    if (!usernamePattern.test(username)) {
      return Response.json({ error: "Invalid username format" }, { status: 400 });
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
      return Response.json(
        { error: "Invalid username or password" },
        { status: 401 },
      );
    }

    const foundUser = user[0];

    // Verify password using Bun
    const isValidPassword = await Bun.password.verify(
      password,
      foundUser.password,
    );

    if (!isValidPassword) {
      return Response.json(
        { error: "Invalid username or password" },
        { status: 401 },
      );
    }

    // Login successful, need to implement the rest later
    return Response.json(
      { success: true, message: "Login successful" },
      { status: 200 },
    );
  } catch (error) {
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
};
