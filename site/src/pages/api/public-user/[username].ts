import type { APIRoute } from "astro";
import { db, Users, Matches, eq, or, sql, inArray } from "astro:db";

interface PublicUserData {
  username: string;
  elo: number;
  createdAt: string;
}

interface PublicMatchData {
  id: number;
  game: string;
  player1Id: number;
  player2Id: number;
  winnerId: number | null;
  startedAt: string;
  score: string | null;
  opponentName: string;
  opponentUsername: string;
  won: boolean;
}

export const GET: APIRoute = async ({ params }) => {
  const username = params.username;

  if (!username) {
    return new Response(JSON.stringify({ error: "Username required" }), { status: 400 });
  }

  const userResult = await db
    .select({
      id: Users.id,
      username: Users.username,
      elo: Users.elo,
      createdAt: Users.createdAt,
    })
    .from(Users)
    .where(eq(Users.username, username))
    .limit(1);

  if (userResult.length === 0) {
    return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
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

  const playerIds = userMatches.length > 0
    ? Array.from(new Set(userMatches.flatMap(m => [m.player1Id, m.player2Id])))
    : [];

  const allPlayers = playerIds.length > 0
    ? await db.select().from(Users).where(inArray(Users.id, playerIds))
    : [];

  const playerMap = new Map(allPlayers.map(p => [p.id, p]));

  const matches: PublicMatchData[] = userMatches.map(match => {
    const opponentId = match.player1Id === user.id ? match.player2Id : match.player1Id;
    const opponent = playerMap.get(opponentId);
    return {
      id: match.id,
      game: match.game,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      winnerId: match.winnerId,
      startedAt: match.startedAt?.toISOString() || "",
      score: match.score,
      opponentName: opponent?.username || "Unknown",
      opponentUsername: opponent?.username || "unknown",
      won: match.winnerId === user.id,
    };
  });

  const publicUser: PublicUserData = {
    username: user.username,
    elo: user.elo,
    createdAt: user.createdAt?.toISOString() || "",
  };

  return Response.json({
    user: publicUser,
    matches,
  });
};
