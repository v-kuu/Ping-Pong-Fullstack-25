import type { APIRoute } from "astro";
import { db, Friendships, eq, and } from "astro:db";

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const requestId = params.id ? parseInt(params.id) : NaN;
  if (isNaN(requestId)) {
    return new Response(JSON.stringify({ error: "Invalid request ID" }), {
      status: 400,
    });
  }

  let statusAction: "accepted" | "rejected";
  try {
    const body = await request.json();
    statusAction = body.status;
    if (statusAction !== "accepted" && statusAction !== "rejected") {
      throw new Error("Invalid status");
    }
  } catch (e) {
    return new Response(
      JSON.stringify({
        error: "Invalid body, expected { status: 'accepted' | 'rejected' }",
      }),
      { status: 400 },
    );
  }

  try {
    const friendship = await db
      .select()
      .from(Friendships)
      .where(
        and(
          eq(Friendships.id, requestId),
          eq(Friendships.friendId, user.id), // Must be the recipient to accept/reject
          eq(Friendships.status, "pending"),
        ),
      )
      .limit(1)
      .then((res) => res[0]);

    if (!friendship) {
      return new Response(
        JSON.stringify({ error: "Request not found or not pending" }),
        {
          status: 404,
        },
      );
    }

    if (statusAction === "accepted") {
      await db
        .update(Friendships)
        .set({ status: "accepted" })
        .where(eq(Friendships.id, requestId));
    } else {
      // Rejected - delete the record
      await db.delete(Friendships).where(eq(Friendships.id, requestId));
    }

    return new Response(
      JSON.stringify({ success: true, status: statusAction }),
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Failed to update friend request:", error);
    return new Response(JSON.stringify({ error: "Failed to update request" }), {
      status: 500,
    });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const requestId = params.id ? parseInt(params.id) : NaN;
  if (isNaN(requestId)) {
    return new Response(JSON.stringify({ error: "Invalid request ID" }), {
      status: 400,
    });
  }

  try {
    // Allow cancelling if YOU are the sender
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
      return new Response(
        JSON.stringify({ error: "Request not found or cannot cancel" }),
        {
          status: 404,
        },
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Request cancelled" }),
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Failed to cancel friend request:", error);
    return new Response(JSON.stringify({ error: "Failed to cancel request" }), {
      status: 500,
    });
  }
};
