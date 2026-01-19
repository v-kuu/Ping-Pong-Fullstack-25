import type { APIRoute } from "astro";
import { db, Users, Matches, eq, or, sql, inArray } from "astro:db";
import type { MatchData } from "@/utils/site/types";
import { processMatchData, getPlayerIdsFromMatches } from "@/utils/site/matchHelpers";
import { badRequest, notFound, success } from "@/utils/site/apiHelpers";

export const GET: APIRoute = async ({ params }) => {
  const username = params.username;

  if (!username) {
    return badRequest("Username required");
  }

  const userResult = await db
    .select({
      id: Users.id,
      username: Users.username,
      elo: Users.elo,
    })
    .from(Users)
    .where(eq(Users.username, username))
    .limit(1);

  if (userResult.length === 0) {
    return notFound("User not found");
  }

  const user = userResult[0];

  const allMatches = await db
    .select()
    .from(Matches)
    .limit(100);

  const userMatches = allMatches.filter((match) => {
    const playerIds = Array.isArray(match.playerIds) ? match.playerIds : [];
    return playerIds.includes(user.id);
  });

  const playerIds = getPlayerIdsFromMatches(userMatches);

  const allPlayers =
    playerIds.length > 0
      ? await db.select().from(Users).where(inArray(Users.id, playerIds))
      : [];

  const matches: MatchData[] = processMatchData(userMatches, user.id, allPlayers);

  return success({ user: { username: user.username, elo: user.elo }, matches });
};
