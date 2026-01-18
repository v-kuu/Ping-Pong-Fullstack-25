/**
 * Helper function for game servers to record match results
 * 
 * Usage in game servers:
 * 
 * import { recordMatch } from "@/utils/recordMatch";
 * 
 * // Pong (2 players)
 * await recordMatch({
 *   game: "pong",
 *   playerIds: [10, 20],
 *   scores: [5, 3],
 *   winnerId: 10,
 * });
 * 
 * // Web3D (4 players)
 * await recordMatch({
 *   game: "web3d",
 *   playerIds: [10, 20, 30, 40],
 *   scores: [15, 12, 8, 5],
 *   winnerId: 10,
 * });
 */

interface RecordMatchParams {
  game: "pong" | "web3d";
  playerIds: number[];
  scores: number[];
  winnerId?: number;
}

interface RecordMatchResult {
  success: boolean;
  matchId?: number | bigint;
  error?: string;
}

const API_URL = process.env.API_URL || "http://localhost:3000";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

export async function recordMatch(params: RecordMatchParams): Promise<RecordMatchResult> {
  if (!INTERNAL_API_KEY) {
    console.error("INTERNAL_API_KEY not set in environment");
    return { success: false, error: "INTERNAL_API_KEY not configured" };
  }

  try {
    const response = await fetch(`${API_URL}/api/matches`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Key": INTERNAL_API_KEY,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP ${response.status}`;
      console.error("Failed to record match:", errorMessage);
      return { success: false, error: errorMessage };
    }

    const data = await response.json();
    return { success: true, matchId: data.matchId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error recording match:", errorMessage);
    return { success: false, error: errorMessage };
  }
}
