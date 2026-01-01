import type { MatchData, UserProfileData } from "@/utils/types";
import { IconPlus, Check, Clock } from "../components/Icons";

interface UserProfileCardProps {
  user: UserProfileData;
  matches: MatchData[];
  showAddFriend?: boolean;
  friendStatus?: "none" | "pending" | "accepted";
  onAddFriend?: () => void;
  title?: string;
  maxWidth?: string;
}

export function UserProfileCard({
  user,
  matches,
  showAddFriend = false,
  friendStatus = "none",
  onAddFriend,
  title = "User Information",
  maxWidth = "max-w-4xl",
}: UserProfileCardProps) {
  return (
    <div class={`w-full ${maxWidth}`}>
      <div class="card bg-base-200 p-6">
        {title && <h2 class="text-2xl font-bold mb-6">{title}</h2>}

        <div class="flex items-center justify-between gap-4 mb-6">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-full overflow-hidden bg-base-300 bg-cover bg-center bg-[url('/avatar.png')]" />
            <div>
              <h3 class="text-xl font-bold">{user.username}</h3>
            </div>
          </div>
          {showAddFriend && onAddFriend && (
            <button
              onClick={onAddFriend}
              disabled={friendStatus !== "none"}
              class={`btn btn-circle btn-lg ${
                friendStatus === "accepted"
                  ? "btn-success"
                  : friendStatus === "pending"
                  ? "btn-warning"
                  : "btn-primary"
              }`}
            >
              {friendStatus === "accepted" ? (
                <Check />
              ) : friendStatus === "pending" ? (
                <Clock />
              ) : (
                <IconPlus />
              )}
            </button>
          )}
        </div>
        <p class="text-lg">
          ELO: <span class="font-bold">{user.elo}</span>
        </p>
      </div>

      <div class="card bg-base-200 p-6 mt-6">
        <h3 class="text-xl font-bold mb-4">Recent Matches</h3>
        {matches.length === 0 ? (
          <p class="opacity-70">No matches yet</p>
        ) : (
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
        )}
      </div>
    </div>
  );
}
