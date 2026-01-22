import type { APIRoute } from "astro";
import { db, Users, Friendships, eq, or, and, inArray } from "astro:db";
import { unauthorized, success, notFound, badRequest, internalError } from "@/utils/site/apiHelpers";

export const GET: APIRoute = async ({ locals }) => {
    const user = locals.user;
    if (!user) {
        return success([]);
    }

    try {
        const receivedRequests = await db
            .select()
            .from(Friendships)
            .where(
                and(
                    eq(Friendships.friendId, user.id),
                    eq(Friendships.status, "pending")
                )
            );

        if (receivedRequests.length === 0) {
            return success([]);
        }

        const senderIds = receivedRequests.map((r) => r.userId);

        const senders = await db
            .select({
                id: Users.id,
                username: Users.username,
            })
            .from(Users)
            .where(inArray(Users.id, senderIds));

        const senderMap = new Map(senders.map(s => [s.id, s]));

        const result = receivedRequests.map(r => {
            const sender = senderMap.get(r.userId);
            if (!sender) return null;
            return {
                id: r.id,
                userId: sender.id,
                username: sender.username,
            };
        }).filter(Boolean);

        return success(result);
    } catch (error) {
        console.error("Failed to get friend requests:", error);
        return internalError("Failed to get requests");
    }
};

export const POST: APIRoute = async ({ request, locals }) => {
    const user = locals.user;
    if (!user) {
        return unauthorized();
    }

    let username: string;
    try {
        const body = await request.json();
        username = body.username;
    } catch (e) {
        return badRequest("Invalid JSON");
    }

    if (!username) {
        return badRequest("Username required");
    }

    if (username === user.username) {
        return badRequest("Cannot add yourself");
    }

    try {
        const friendResult = await db
            .select()
            .from(Users)
            .where(eq(Users.username, username))
            .limit(1);

        if (friendResult.length === 0) {
            return notFound("User not found");
        }

        const friend = friendResult[0];

        const existing = await db
            .select()
            .from(Friendships)
            .where(
                or(
                    and(eq(Friendships.userId, user.id), eq(Friendships.friendId, friend.id)),
                    and(eq(Friendships.userId, friend.id), eq(Friendships.friendId, user.id))
                )
            )
            .limit(1)
            .then(res => res[0]);

        if (existing) {
            return badRequest("Already friends or request pending");
        }

        const result = await db.insert(Friendships).values({
            userId: user.id,
            friendId: friend.id,
            status: "pending",
        }).returning();

        return success({ success: true, friendship: result[0] });
    } catch (error) {
        console.error("Failed to send friend request:", error);
        return internalError("Failed to send friend request");
    }
};
