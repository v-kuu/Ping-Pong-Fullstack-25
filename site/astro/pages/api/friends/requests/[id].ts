import type { APIRoute } from "astro";
import { db, Friendships, eq, and } from "astro:db";
import { unauthorized, notFound, badRequest, success, internalError } from "@/utils/apiHelpers";

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const user = locals.user;
  if (!user) {
    return unauthorized();
  }

  const requestId = params.id ? parseInt(params.id) : NaN;
  if (isNaN(requestId)) {
    return badRequest("Invalid request ID");
  }

  let statusAction: "accepted" | "rejected";
  try {
    const body = await request.json();
    statusAction = body.status;
    if (statusAction !== "accepted" && statusAction !== "rejected") {
      throw new Error("Invalid status");
    }
  } catch (e) {
    return badRequest("Invalid body, expected { status: 'accepted' | 'rejected' }");
  }

  try {
    const friendship = await db
      .select()
      .from(Friendships)
      .where(
        and(
          eq(Friendships.id, requestId),
          eq(Friendships.friendId, user.id),
          eq(Friendships.status, "pending"),
        ),
      )
      .limit(1)
      .then((res) => res[0]);

    if (!friendship) {
      return notFound("Request not found or not pending");
    }

    if (statusAction === "accepted") {
      await db
        .update(Friendships)
        .set({ status: "accepted" })
        .where(eq(Friendships.id, requestId));
    } else {
      await db.delete(Friendships).where(eq(Friendships.id, requestId));
    }

    return success({ success: true, status: statusAction });
  } catch (error) {
    console.error("Failed to update friend request:", error);
    return internalError("Failed to update request");
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) {
    return unauthorized();
  }

  const requestId = params.id ? parseInt(params.id) : NaN;
  if (isNaN(requestId)) {
    return badRequest("Invalid request ID");
  }

  try {
    const result = await db
      .delete(Friendships)
      .where(
        and(
          eq(Friendships.id, requestId),
          eq(Friendships.userId, user.id),
          eq(Friendships.status, "pending"),
        ),
      )
      .returning();

    if (result.length === 0) {
      return notFound("Request not found or cannot cancel");
    }

    return success({ success: true, message: "Request cancelled" });
  } catch (error) {
    console.error("Failed to cancel friend request:", error);
    return internalError("Failed to cancel request");
  }
};
