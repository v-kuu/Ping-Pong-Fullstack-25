import type { APIRoute } from "astro";
import { db, Friendships, Users, eq, or, and, inArray } from "astro:db";
import { unauthorized, success, notFound, badRequest, internalError } from "@/utils/site/apiHelpers";

function getOnlineStatus(lastSeen: Date | null | undefined): "online" | "offline" {
    if (!lastSeen) return "offline";
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    return lastSeen > thirtySecondsAgo ? "online" : "offline";
}

export const GET: APIRoute = async ({ locals }) => {
    const user = locals.user;
    if (!user) {
        return success([]);
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
            return success([]);
        }

        const friendIds = friendships.map((f) =>
            f.userId === user.id ? f.friendId : f.userId
        );

        const friends = await db
            .select({
                id: Users.id,
                username: Users.username,
                lastSeen: Users.lastSeen,
            })
            .from(Users)
            .where(inArray(Users.id, friendIds));

        const formattedFriends = friends.map((f) => ({
            id: f.id,
            username: f.username,
            status: getOnlineStatus(f.lastSeen),
        }));

        return success(formattedFriends);
    } catch (error) {
        console.error("Failed to get friends:", error);
        return success([]);
    }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
    const user = locals.user;
    if (!user) {
        return unauthorized();
    }

    try {
        const { friendId } = await request.json();
        if (!friendId) {
            return badRequest("Friend ID required");
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
            return notFound("Friendship not found");
        }

        return success({ success: true });
    } catch (error) {
        console.error("Failed to remove friend:", error);
        return internalError("Failed to remove friend");
    }
};
