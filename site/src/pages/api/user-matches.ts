import type { APIRoute } from "astro";
import { db, Matches, Users, eq, or, sql, inArray } from "astro:db";
import { getSessionUser } from "@/utils/session";

export const GET: APIRoute = async ({ cookies }) => {
  const user = await getSessionUser(cookies);
  
  if (!user) {
    return new Response(JSON.stringify({ error: "Not logged in" }), { status: 401 });
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
  
  const playerIds = Array.from(new Set(userMatches.flatMap(m => [m.player1Id, m.player2Id])));
  
  const allPlayers = playerIds.length > 0
    ? await db.select().from(Users).where(inArray(Users.id, playerIds))
    : [];
  
  const playerMap = new Map(allPlayers.map(p => [p.id, p]));
  
  const enrichedMatches = userMatches.map(match => {
    const opponentId = match.player1Id === userId ? match.player2Id : match.player1Id;
    const opponent = playerMap.get(opponentId);
    const won = match.winnerId === userId;
    
    return {
      id: match.id,
      game: match.game,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      winnerId: match.winnerId,
      startedAt: match.startedAt,
      score: match.score,
      opponentName: opponent?.username || "Unknown",
      won,
    };
  });
  
  return Response.json(enrichedMatches);
};
