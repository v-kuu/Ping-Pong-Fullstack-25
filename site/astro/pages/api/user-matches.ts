import type { APIRoute } from "astro";
import { db, Matches, Users, eq, or, sql, inArray } from "astro:db";
import { processMatchData, getPlayerIdsFromMatches } from "@/utils/matchHelpers";
import { unauthorized, success } from "@/utils/apiHelpers";

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;
  
  if (!user) {
    return unauthorized("Not logged in");
  }
  
  const userId = user.id;
  
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
    .where(or(eq(Matches.player1Id, userId), eq(Matches.player2Id, userId)))
    .orderBy(sql`${Matches.startedAt} DESC`)
    .limit(10);
  
  const playerIds = getPlayerIdsFromMatches(userMatches);
  
  const allPlayers = playerIds.length > 0
    ? await db.select().from(Users).where(inArray(Users.id, playerIds))
    : [];
  
  const enrichedMatches = processMatchData(userMatches, userId, allPlayers);
  
  return success(enrichedMatches);
};
