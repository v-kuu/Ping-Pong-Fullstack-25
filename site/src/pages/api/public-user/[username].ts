import type { APIRoute } from "astro";
import { db, Users, Matches, eq, or, sql, inArray } from "astro:db";
import type { MatchData } from "@/utils/types";
import { processMatchData, getPlayerIdsFromMatches } from "@/utils/matchHelpers";
import { badRequest, notFound, success } from "@/utils/apiHelpers";

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

  const userMatches = await db
    .select({
      id: Matches.id,
      game: Matches.game,
      player1Id: Matches.player1Id,
      player2Id: Matches.player2Id,
      winnerId: Matches.winnerId,
      startedAt: Matches.startedAt,
      score: Matches.score,
    })
    .from(Matches)
    .where(or(eq(Matches.player1Id, user.id), eq(Matches.player2Id, user.id)))
    .orderBy(sql`${Matches.startedAt} DESC`)
    .limit(20);

  const playerIds = getPlayerIdsFromMatches(userMatches);

  const allPlayers =
    playerIds.length > 0
      ? await db.select().from(Users).where(inArray(Users.id, playerIds))
      : [];

  const matches: MatchData[] = processMatchData(userMatches, user.id, allPlayers);

  return success({ user: { username: user.username, elo: user.elo }, matches });
};
