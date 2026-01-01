import type { MatchData } from "@/utils/types";

interface BaseUserData {
  username: string;
  elo: number;
  email?: string;
}

interface UserProfileCardProps {
  user: BaseUserData;
  matches: MatchData[];
  showAddFriend?: boolean;
  title?: string;
}

export function UserProfileCard({
  user,
  matches,
  showAddFriend = false,
  title = "User Information",
}: UserProfileCardProps) {
  return (
    <div class="w-full max-w-2xl">
      {title && <h2 class="text-2xl font-bold mb-6">{title}</h2>}

      <div class="card bg-base-200 p-6 mb-6">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-full overflow-hidden bg-base-300 bg-cover bg-center bg-[url('/avatar.png')]" />
            <div>
              <h3 class="text-xl font-bold">{user.username}</h3>
            </div>
          </div>
          {showAddFriend && (
            <button class="btn btn-primary btn-circle btn-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          )}
        </div>
        <p class="text-lg mt-4">
          ELO: <span class="font-bold">{user.elo}</span>
        </p>
      </div>

      <h3 class="text-xl font-bold mb-4">Recent Matches</h3>
      {matches.length === 0 ? (
        <p class="opacity-70">No matches yet</p>
      ) : (
        <div class="card bg-base-200 p-4">
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Opponent</th>
                  <th>Result</th>
                  <th>Score</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match) => (
                  <tr key={match.id}>
                    <td>
                      <a
                        href={`/profile/${match.opponentName}`}
                        class="link link-primary hover:underline"
                      >
                        {match.opponentName}
                      </a>
                    </td>
                    <td>
                      <span
                        class={
                          match.won ? "text-success font-bold" : "text-error"
                        }
                      >
                        {match.won ? "Won" : "Lost"}
                      </span>
                    </td>
                    <td>{match.score || "-"}</td>
                    <td>{new Date(match.startedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
