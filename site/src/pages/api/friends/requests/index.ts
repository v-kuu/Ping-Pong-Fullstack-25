import type { APIRoute } from "astro";
import { db, Users, Friendships, eq, or, and, desc, inArray } from "astro:db";

export const GET: APIRoute = async ({ locals }) => {
    const user = locals.user;
    if (!user) {
        return new Response(JSON.stringify([]), { status: 200 });
    }

    try {
        // Get received requests
        const receivedRequests = await db
            .select()
            .from(Friendships)
            .where(
                and(
                    eq(Friendships.friendId, user.id),
                    eq(Friendships.status, "pending")
                )
            )
            .orderBy(desc(Friendships.id));

        if (receivedRequests.length === 0) {
            return new Response(JSON.stringify([]), { status: 200 });
        }

        const senderIds = receivedRequests.map((r) => r.userId);

        const senders = await db
            .select({
                id: Users.id,
                username: Users.username,
                elo: Users.elo,
            })
            .from(Users)
            .where(inArray(Users.id, senderIds));

        const senderMap = new Map(senders.map(s => [s.id, s]));

        const result = receivedRequests.map(r => {
            const sender = senderMap.get(r.userId);
            if (!sender) return null;
            return {
                id: r.id, // Friendship ID (request ID)
                userId: sender.id,
                username: sender.username,
                elo: sender.elo
            };
        }).filter(Boolean);

        return new Response(JSON.stringify(result), { status: 200 });
    } catch (error) {
        console.error("Failed to get friend requests:", error);
        return new Response(JSON.stringify({ error: "Failed to get requests" }), { status: 500 });
    }
};

export const POST: APIRoute = async ({ request, locals }) => {
    const user = locals.user;
    if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
        });
    }

    let username: string;
    try {
        const body = await request.json();
        username = body.username;
    } catch (e) {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
    }

    if (!username) {
        return new Response(JSON.stringify({ error: "Username required" }), {
            status: 400,
        });
    }

    if (username === user.username) {
        return new Response(JSON.stringify({ error: "Cannot add yourself" }), {
            status: 400,
        });
    }

    try {
        const friendResult = await db
            .select()
            .from(Users)
            .where(eq(Users.username, username))
            .limit(1);

        if (friendResult.length === 0) {
            return new Response(JSON.stringify({ error: "User not found" }), {
                status: 404,
            });
        }

        const friend = friendResult[0];

        // Check for ANY existing friendship between these two users
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
            return new Response(JSON.stringify({ error: "Already friends or request pending" }), {
                status: 400,
            });
        }

        const result = await db.insert(Friendships).values({
            userId: user.id,
            friendId: friend.id,
            status: "pending",
        }).returning();

        return new Response(JSON.stringify({ success: true, friendship: result[0] }), {
            status: 200,
        });
    } catch (error) {
        console.error("Failed to send friend request:", error);
        return new Response(JSON.stringify({ error: "Failed to send friend request" }), {
            status: 500,
        });
    }
};
