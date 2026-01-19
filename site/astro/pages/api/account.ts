import type { APIRoute } from "astro";
import { db, Users, eq } from "astro:db";
import { validatePassword, validateUsername, validateEmail } from "@/utils/site/validation";
import { badRequest, unauthorized, conflict, success } from "@/utils/site/apiHelpers";
import { join } from "path";
import { existsSync, renameSync } from "fs";

const AVATARS_DIR = import.meta.env.PROD
  ? `${process.cwd()}/dist/client/avatars`
  : `${process.cwd()}/public/avatars`;

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return unauthorized("Must be logged in");
  }

  try {
    const formData = await request.formData();

    const currentPassword = formData.get("currentPassword")?.toString();
    const newUsername = formData.get("newUsername")?.toString().trim();
    const newEmail = formData.get("newEmail")?.toString().trim();
    const newPassword = formData.get("newPassword")?.toString();

    if (!currentPassword) {
      return badRequest("Current password is required");
    }

    const user = locals.user;

    const validPassword = await Bun.password.verify(currentPassword, user.password);
    if (!validPassword) {
      return unauthorized("Invalid current password");
    }

    const updates: { username?: string; email?: string; password?: string } = {};

    let avatarRenamed = false;
    let finalUsername = user.username;

    if (newUsername && newUsername !== user.username) {
      if (!validateUsername(newUsername)) {
        return badRequest("Invalid username format");
      }

      const existingUser = await db
        .select()
        .from(Users)
        .where(eq(Users.username, newUsername))
        .limit(1);

      if (existingUser.length > 0) {
        return conflict("Username already taken");
      }

      const oldAvatarPath = join(AVATARS_DIR, `${user.username}.png`);
      const newAvatarPath = join(AVATARS_DIR, `${newUsername}.png`);

      if (existsSync(oldAvatarPath)) {
        renameSync(oldAvatarPath, newAvatarPath);
        avatarRenamed = true;
      }

      updates.username = newUsername;
      finalUsername = newUsername;
    }

    if (newEmail && newEmail !== user.email) {
      if (!validateEmail(newEmail)) {
        return badRequest("Invalid email format");
      }

      const existingUser = await db
        .select()
        .from(Users)
        .where(eq(Users.email, newEmail))
        .limit(1);

      if (existingUser.length > 0) {
        return conflict("Email already taken");
      }

      updates.email = newEmail;
    }

    if (newPassword && newPassword.length > 0) {
      if (!validatePassword(newPassword)) {
        return badRequest("Password must be at least 12 characters and strong enough");
      }

      updates.password = await Bun.password.hash(newPassword);
    }

    await db
      .update(Users)
      .set(updates)
      .where(eq(Users.id, user.id));

    return success({
      success: true,
      newUsername: finalUsername,
      avatarRenamed,
    });
  } catch {
    return badRequest("Failed to update account");
  }
};
