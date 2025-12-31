export interface MatchData {
  id: number;
  game: string;
  player1Id: number;
  player2Id: number;
  winnerId: number | null;
  startedAt: string;
  score: string | null;
  opponentName: string;
  won: boolean;
}

export interface UserData {
  username: string;
  email: string;
  elo: number;
}
