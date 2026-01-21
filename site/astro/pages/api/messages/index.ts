import type { APIRoute } from "astro";
import { db, Messages, Users, eq, or, and, desc } from "astro:db";
import {
  unauthorized,
  success,
  badRequest,
  created,
  internalError,
} from "@/utils/site/apiHelpers";

interface ConversationRow {
  odId: number;
  odUsername: string;
  lastMessageContent: string;
  lastMessageAt: Date;
  lastMessageFromId: number;
}

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user) {
    return unauthorized();
  }

  try {
    // Get all messages involving the current user
    const allMessages = await db
      .select({
        id: Messages.id,
        fromId: Messages.fromId,
        toId: Messages.toId,
        content: Messages.content,
        createdAt: Messages.createdAt,
        read: Messages.read,
      })
      .from(Messages)
      .where(or(eq(Messages.fromId, user.id), eq(Messages.toId, user.id)))
      .orderBy(desc(Messages.createdAt));

    if (allMessages.length === 0) {
      return success([]);
    }

    // Group by conversation partner
    const conversationMap = new Map<
      number,
      {
        odId: number;
        lastMessage: (typeof allMessages)[0];
        unreadCount: number;
      }
    >();

    for (const msg of allMessages) {
      const odId = msg.fromId === user.id ? msg.toId : msg.fromId;

      if (!conversationMap.has(odId)) {
        conversationMap.set(odId, {
          odId,
          lastMessage: msg,
          unreadCount: 0,
        });
      }

      // Count unread messages sent TO the current user
      if (msg.toId === user.id && !msg.read) {
        const conv = conversationMap.get(odId)!;
        conv.unreadCount++;
      }
    }

    // Get usernames for conversation partners
    const partnerIds = Array.from(conversationMap.keys());
    const partners = await db
      .select({ id: Users.id, username: Users.username })
      .from(Users)
      .where(or(...partnerIds.map((id) => eq(Users.id, id))));

    const partnerMap = new Map(partners.map((p) => [p.id, p.username]));

    // Build response
    const conversations = Array.from(conversationMap.values()).map((conv) => ({
      odId: conv.odId,
      username: partnerMap.get(conv.odId) || "Unknown",
      lastMessage:
        conv.lastMessage.content.substring(0, 50) +
        (conv.lastMessage.content.length > 50 ? "..." : ""),
      lastActivity: conv.lastMessage.createdAt,
      unreadCount: conv.unreadCount,
      isFromMe: conv.lastMessage.fromId === user.id,
    }));

    // Sort by last activity
    conversations.sort(
      (a, b) =>
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime(),
    );

    return success(conversations);
  } catch (error) {
    console.error("Failed to get conversations:", error);
    return internalError("Failed to get conversations");
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) {
    return unauthorized();
  }

  try {
    const { toId, content } = await request.json();

    if (!toId || typeof toId !== "number") {
      return badRequest("Recipient ID required");
    }

    if (!content || typeof content !== "string") {
      return badRequest("Message content required");
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      return badRequest("Message cannot be empty");
    }

    if (trimmedContent.length > 500) {
      return badRequest("Message too long (max 500 characters)");
    }

    if (toId === user.id) {
      return badRequest("Cannot send message to yourself");
    }

    // Verify recipient exists
    const [recipient] = await db
      .select({ id: Users.id })
      .from(Users)
      .where(eq(Users.id, toId));

    if (!recipient) {
      return badRequest("Recipient not found");
    }

    // Create message
    const [message] = await db
      .insert(Messages)
      .values({
        fromId: user.id,
        toId,
        content: trimmedContent,
      })
      .returning();

    return created({
      id: message.id,
      fromId: message.fromId,
      toId: message.toId,
      content: message.content,
      createdAt: message.createdAt,
      read: message.read,
    });
  } catch (error) {
    console.error("Failed to send message:", error);
    return internalError("Failed to send message");
  }
};
