import type { APIRoute } from "astro";
import { db, Friendships, Users, eq, or, and, inArray } from "astro:db";

function getOnlineStatus(lastSeen: Date | null | undefined): "online" | "offline" {
    if (!lastSeen) return "offline";
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    return lastSeen > thirtySecondsAgo ? "online" : "offline";
}

export const GET: APIRoute = async ({ locals }) => {
    const user = locals.user;
    if (!user) {
        return new Response(JSON.stringify([]), { status: 200 });
    }

    try {
        const friendships = await db
            .select()
            .from(Friendships)
            .where(
                and(
                    or(
                        eq(Friendships.userId, user.id),
                        eq(Friendships.friendId, user.id)
                    ),
                    eq(Friendships.status, "accepted")
                )
            );

        if (friendships.length === 0) {
            return new Response(JSON.stringify([]), { status: 200 });
        }

        const friendIds = friendships.map((f) =>
            f.userId === user.id ? f.friendId : f.userId
        );

        const friends = await db
            .select({
                id: Users.id,
                username: Users.username,
                elo: Users.elo,
                lastSeen: Users.lastSeen,
            })
            .from(Users)
            .where(inArray(Users.id, friendIds));

        const formattedFriends = friends.map((f) => ({
            id: f.id,
            username: f.username,
            elo: f.elo,
            status: getOnlineStatus(f.lastSeen),
        }));

        return new Response(JSON.stringify(formattedFriends), { status: 200 });
    } catch (error) {
        console.error("Failed to get friends:", error);
        return new Response(JSON.stringify([]), { status: 200 });
    }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
    const user = locals.user;
    if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
        });
    }

    try {
        const { friendId } = await request.json();
        if (!friendId) {
            return new Response(JSON.stringify({ error: "Friend ID required" }), {
                status: 400,
            });
        }

        const result = await db
            .delete(Friendships)
            .where(
                and(
                    or(
                        and(
                            eq(Friendships.userId, user.id),
                            eq(Friendships.friendId, friendId)
                        ),
                        and(
                            eq(Friendships.userId, friendId),
                            eq(Friendships.friendId, user.id)
                        )
                    ),
                    eq(Friendships.status, "accepted")
                )
            )
            .returning();

        if (result.length === 0) {
            return new Response(JSON.stringify({ error: "Friendship not found" }), {
                status: 404,
            });
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        console.error("Failed to remove friend:", error);
        return new Response(JSON.stringify({ error: "Failed to remove friend" }), {
            status: 500,
        });
    }
};
