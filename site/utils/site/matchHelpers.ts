import type { MatchData } from "./types";

export function processMatchData(
  matches: Array<{
    id: number;
    game: string;
    player1Id: number;
    player2Id: number;
    winnerId: number | null;
    startedAt: Date | string | null | undefined;
    score: string | null;
  }>,
  currentUserId: number,
  players: Array<{ id: number; username: string }>,
): MatchData[] {
  if (matches.length === 0) return [];

  const playerMap = new Map(players.map((p) => [p.id, p]));

  return matches.map((match) => {
    const opponentId = match.player1Id === currentUserId ? match.player2Id : match.player1Id;
    const opponent = playerMap.get(opponentId);
    return {
      id: match.id,
      game: match.game,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      winnerId: match.winnerId,
      startedAt: match.startedAt instanceof Date ? match.startedAt.toISOString() : (match.startedAt || ""),
      score: match.score,
      opponentName: opponent?.username || "Unknown",
      won: match.winnerId === currentUserId,
    };
  });
}

export function getPlayerIdsFromMatches(matches: Array<{ player1Id: number; player2Id: number }>): number[] {
  return Array.from(new Set(matches.flatMap((m) => [m.player1Id, m.player2Id])));
}
