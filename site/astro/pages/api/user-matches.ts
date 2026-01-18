import type { APIRoute } from "astro";
import { db, Matches, Users, inArray } from "astro:db";
import { processMatchData, getPlayerIdsFromMatches } from "@/utils/matchHelpers";
import { unauthorized, success } from "@/utils/apiHelpers";

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;
  
  if (!user) {
    return unauthorized("Not logged in");
  }
  
  const userId = user.id;
  
  const allMatches = await db
    .select()
    .from(Matches)
    .limit(100);
  
  const userMatches = allMatches.filter((match) => {
    const playerIds = Array.isArray(match.playerIds) ? match.playerIds : [];
    return playerIds.includes(userId);
  });
  
  const playerIds = getPlayerIdsFromMatches(userMatches);
  
  const allPlayers = playerIds.length > 0
    ? await db.select().from(Users).where(inArray(Users.id, playerIds))
    : [];
  
  const enrichedMatches = processMatchData(userMatches, userId, allPlayers);
  
  return success(enrichedMatches);
};
