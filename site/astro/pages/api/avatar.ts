import type { APIRoute } from "astro";
import { unlink } from "node:fs/promises";
import { unauthorized, badRequest, success, internalError } from "@/utils/site/apiHelpers";

// In dev, write to public/avatars (served directly)
// In prod, write to dist/client/avatars (where static files are served from)
const AVATARS_DIR = import.meta.env.PROD
  ? `${process.cwd()}/dist/client/avatars`
  : `${process.cwd()}/public/avatars`;

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];

function getAvatarPath(username: string): string {
  return `${AVATARS_DIR}/${username}.png`;
}

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return unauthorized();
  }

  try {
    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return badRequest("No file provided");
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return badRequest("Invalid file type. Allowed: PNG, JPEG, GIF, WebP");
    }

    if (file.size > MAX_FILE_SIZE) {
      return badRequest("File too large. Maximum size is 2MB");
    }

    const avatarPath = getAvatarPath(locals.user.username);

    // Write file to disk using Bun (overwrites if exists)
    await Bun.write(avatarPath, file);

    return success({
      message: "Avatar updated successfully",
      avatarUrl: `/api/avatars/${locals.user.username}`
    });
  } catch (error) {
    console.error("Failed to upload avatar:", error);
    return internalError("Failed to upload avatar");
  }
};

export const DELETE: APIRoute = async ({ locals }) => {
  if (!locals.user) {
    return unauthorized();
  }

  try {
    const avatarPath = getAvatarPath(locals.user.username);
    const avatarFile = Bun.file(avatarPath);

    if (await avatarFile.exists()) {
      await unlink(avatarPath);
    }

    return success({
      message: "Avatar removed successfully",
      avatarUrl: "/avatar.png"
    });
  } catch (error) {
    console.error("Failed to remove avatar:", error);
    return internalError("Failed to remove avatar");
  }
};

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user) {
    return unauthorized();
  }

  const avatarPath = getAvatarPath(locals.user.username);
  const hasCustomAvatar = await Bun.file(avatarPath).exists();

  return success({
    hasCustomAvatar,
    avatarUrl: hasCustomAvatar
      ? `/api/avatars/${locals.user.username}`
      : "/avatar.png"
  });
};
