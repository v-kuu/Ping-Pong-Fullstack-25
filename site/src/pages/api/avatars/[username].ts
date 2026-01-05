import type { APIRoute } from "astro";

const AVATARS_DIR = import.meta.env.PROD 
  ? `${process.cwd()}/dist/client/avatars`
  : `${process.cwd()}/public/avatars`;

const DEFAULT_AVATAR_PATH = import.meta.env.PROD
  ? `${process.cwd()}/dist/client/avatar.png`
  : `${process.cwd()}/public/avatar.png`;

export const GET: APIRoute = async ({ params }) => {
  const { username } = params;
  
  if (!username) {
    return new Response("Not found", { status: 404 });
  }

  const avatarPath = `${AVATARS_DIR}/${username}.png`;
  const file = Bun.file(avatarPath);

  if (await file.exists()) {
    return new Response(file, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300", // Cache for 5 minutes
      },
    });
  }

  // Return default avatar if user doesn't have one
  const defaultAvatar = Bun.file(DEFAULT_AVATAR_PATH);
  return new Response(defaultAvatar, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
