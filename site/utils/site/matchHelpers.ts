import type { MatchData } from "./types";

interface MatchRecord {
  id: number;
  game: string;
  playerIds: number[] | unknown;
  createdAt: Date | string | null | undefined;
  scores: number[] | unknown;
}

interface Player {
  id: number;
  username: string;
}

/**
 * Get all player IDs from a match record
 */
export function getMatchPlayerIds(match: MatchRecord): number[] {
  return Array.isArray(match.playerIds) ? match.playerIds : [];
}

/**
 * Get all unique player IDs from multiple matches
 */
export function getPlayerIdsFromMatches(matches: MatchRecord[]): number[] {
  const allIds = matches.flatMap(getMatchPlayerIds);
  return Array.from(new Set(allIds));
}

/**
 * Get medal emoji for placement
 */
function getPlacementMedal(placement: number): string {
  switch (placement) {
    case 1: return "🥇";
    case 2: return "🥈";
    case 3: return "🥉";
    default: return "";
  }
}

/**
 * Get ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
 */
function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Process raw match data into enriched MatchData for API responses
 */
export function processMatchData(
  matches: MatchRecord[],
  currentUserId: number,
  players: Player[],
): MatchData[] {
  if (matches.length === 0) return [];

  const playerMap = new Map(players.map((p) => [p.id, p]));

  return matches.map((match) => {
    const playerIds = getMatchPlayerIds(match);
    const scores = Array.isArray(match.scores) ? match.scores : [];

    const playerScores = playerIds.map((id, index) => ({
      name: playerMap.get(id)?.username || "Unknown",
      score: scores[index] ?? 0,
      isCurrentUser: id === currentUserId,
    }));

    playerScores.sort((a, b) => b.score - a.score);

    const currentUserScore = playerScores.find(p => p.isCurrentUser)?.score ?? 0;
    // Calculate placement: 1 + number of players with strictly higher score
    const placement = playerScores.filter(p => p.score > currentUserScore).length + 1;
    const totalPlayers = playerIds.length;

    const opponentId = playerIds.find(id => id !== currentUserId);
    const opponentName = playerMap.get(opponentId || 0)?.username || "Unknown";

    return {
      id: match.id,
      game: match.game as "pong" | "web3d",
      playerIds,
      scores,
      createdAt: match.createdAt instanceof Date
        ? match.createdAt.toISOString()
        : (match.createdAt || ""),
      opponentName,
      playerNames: playerIds.map(id => playerMap.get(id)?.username || "Unknown"),
      playerScores,
      placement,
      totalPlayers,
      won: playerScores[0]?.isCurrentUser ?? false,
    };
  });
}
