import type { APIRoute } from "astro";
import { db, Matches } from "astro:db";
import { badRequest, created, internalError, unauthorized } from "@/utils/apiHelpers";

const VALID_GAMES = ["pong", "web3d"] as const;
type GameType = (typeof VALID_GAMES)[number];

interface CreateMatchRequest {
  game: GameType;
  playerIds: number[];
  scores: number[];
  winnerId?: number;
  startedAt?: string;
}

export const POST: APIRoute = async ({ request }) => {
  // Verify internal API key
  const apiKey = request.headers.get("X-Internal-Key");
  const expectedKey = process.env.INTERNAL_API_KEY;

  if (!apiKey || apiKey !== expectedKey) {
    return unauthorized("Invalid or missing internal API key");
  }

  try {
    const body = await request.json() as CreateMatchRequest;

    // Validate required fields
    if (!body.game || !VALID_GAMES.includes(body.game)) {
      return badRequest(`Invalid game type. Must be one of: ${VALID_GAMES.join(", ")}`);
    }

    if (!Array.isArray(body.playerIds) || body.playerIds.length < 2) {
      return badRequest("playerIds must be an array with at least 2 player IDs");
    }

    if (!body.playerIds.every((id) => typeof id === "number")) {
      return badRequest("All player IDs must be numbers");
    }

    if (!Array.isArray(body.scores)) {
      return badRequest("scores must be an array");
    }

    if (body.scores.length !== body.playerIds.length) {
      return badRequest(`scores array length (${body.scores.length}) must match number of players (${body.playerIds.length})`);
    }

    if (!body.scores.every((s) => typeof s === "number")) {
      return badRequest("All scores must be numbers");
    }

    if (body.winnerId !== undefined && !body.playerIds.includes(body.winnerId)) {
      return badRequest("winnerId must be one of the player IDs");
    }

    const result = await db.insert(Matches).values({
      game: body.game,
      playerIds: body.playerIds,
      scores: body.scores,
      winnerId: body.winnerId ?? null,
      startedAt: body.startedAt ? new Date(body.startedAt) : undefined,
      completedAt: new Date(),
    });

    return created({ matchId: result.lastInsertRowid });
  } catch (error) {
    console.error("Failed to record match:", error);
    return internalError("Failed to record match");
  }
};
