export interface MatchData {
  id: number;
  game: "pong" | "web3d";
  playerIds: number[];
  scores: number[] | null;
  createdAt: string;
  opponentName: string;
  playerNames: string[];
  playerScores: { name: string; score: number; isCurrentUser: boolean }[];
  placement: number;
  totalPlayers: number;
  won: boolean;
}

export interface UserProfileData {
  username: string;
  email: string;
  elo: number;
}
