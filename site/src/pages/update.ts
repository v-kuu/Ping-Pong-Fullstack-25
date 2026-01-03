import type { APIRoute } from "astro";
import { db, Users, eq } from "astro:db";
import { validatePassword, validateUsername, validateEmail } from "@/utils/validation";
import { join } from "path";
import { existsSync, renameSync } from "fs";

const AVATARS_DIR = join(process.cwd(), "public", "avatars");

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  if (!locals.user) {
    return redirect("/login");
  }

  try {
    const formData = await request.formData();

    const currentPassword = formData.get("currentPassword")?.toString();
    const newUsername = formData.get("newUsername")?.toString().trim();
    const newEmail = formData.get("newEmail")?.toString().trim();
    const newPassword = formData.get("newPassword")?.toString();

    if (!currentPassword) {
      return redirect("/profile?error=current_password_required#account");
    }

    const user = locals.user;

    const validPassword = await Bun.password.verify(currentPassword, user.password);
    if (!validPassword) {
      return redirect("/profile?error=invalid_current_password#account");
    }

    const updates: { username?: string; email?: string; password?: string; updatedAt: Date } = {
      updatedAt: new Date(),
    };

    if (newUsername && newUsername !== user.username) {
      if (!validateUsername(newUsername)) {
        return redirect("/profile?error=invalid_username_format#account");
      }

      const existingUser = await db
        .select()
        .from(Users)
        .where(eq(Users.username, newUsername))
        .limit(1);

      if (existingUser.length > 0) {
        return redirect("/profile?error=username_taken#account");
      }

      const oldAvatarPath = join(AVATARS_DIR, `${user.username}.png`);
      const newAvatarPath = join(AVATARS_DIR, `${newUsername}.png`);

      if (existsSync(oldAvatarPath)) {
        renameSync(oldAvatarPath, newAvatarPath);
      }

      updates.username = newUsername;
    }

    if (newEmail && newEmail !== user.email) {
      if (!validateEmail(newEmail)) {
        return redirect("/profile?error=invalid_email_format#account");
      }

      const existingUser = await db
        .select()
        .from(Users)
        .where(eq(Users.email, newEmail))
        .limit(1);

      if (existingUser.length > 0) {
        return redirect("/profile?error=email_taken#account");
      }

      updates.email = newEmail;
    }

    if (newPassword && newPassword.length > 0) {
      if (!validatePassword(newPassword)) {
        return redirect("/profile?error=weak_password#account");
      }

      updates.password = await Bun.password.hash(newPassword);
    }

    await db
      .update(Users)
      .set(updates)
      .where(eq(Users.id, user.id));

    return redirect("/profile?success=account_updated#account");
  } catch {
    return redirect("/profile?error=update_failed#account");
  }
};
