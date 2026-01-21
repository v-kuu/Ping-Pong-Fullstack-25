import type { APIRoute } from "astro";
import { db, Messages, Users, eq, or, and, desc, lt } from "astro:db";
import {
  unauthorized,
  success,
  badRequest,
  notFound,
  internalError,
} from "@/utils/site/apiHelpers";

export const GET: APIRoute = async ({ params, url, locals }) => {
  const user = locals.user;
  if (!user) {
    return unauthorized();
  }

  const odId = parseInt(params.userId || "", 10);
  if (isNaN(odId)) {
    return badRequest("Invalid user ID");
  }

  const limit = Math.min(
    parseInt(url.searchParams.get("limit") || "50", 10),
    100,
  );
  const before = url.searchParams.get("before");

  try {
    // Verify the other user exists
    const [od] = await db
      .select({ id: Users.id, username: Users.username })
      .from(Users)
      .where(eq(Users.id, odId));

    if (!od) {
      return notFound("User not found");
    }

    // Build query for messages between these two users
    let query = db
      .select({
        id: Messages.id,
        fromId: Messages.fromId,
        toId: Messages.toId,
        content: Messages.content,
        createdAt: Messages.createdAt,
        read: Messages.read,
      })
      .from(Messages)
      .where(
        or(
          and(eq(Messages.fromId, user.id), eq(Messages.toId, odId)),
          and(eq(Messages.fromId, odId), eq(Messages.toId, user.id)),
        ),
      )
      .orderBy(desc(Messages.createdAt))
      .limit(limit + 1);

    let messages = await query;

    // Pagination handling
    if (before) {
      const beforeId = parseInt(before, 10);
      messages = messages.filter((m) => m.id < beforeId);
    }

    const hasMore = messages.length > limit;
    if (hasMore) {
      messages = messages.slice(0, limit);
    }

    // Mark unread messages as read (messages sent TO current user)
    const unreadIds = messages
      .filter((m) => m.toId === user.id && !m.read)
      .map((m) => m.id);

    if (unreadIds.length > 0) {
      await db
        .update(Messages)
        .set({ read: true })
        .where(or(...unreadIds.map((id) => eq(Messages.id, id))));
    }

    // Return messages in chronological order for display
    messages.reverse();

    return success({
      messages: messages.map((m) => ({
        id: m.id,
        fromId: m.fromId,
        toId: m.toId,
        content: m.content,
        createdAt: m.createdAt,
        read: m.read,
        isFromMe: m.fromId === user.id,
      })),
      hasMore,
      odUsername: od.username,
    });
  } catch (error) {
    console.error("Failed to get messages:", error);
    return internalError("Failed to get messages");
  }
};
