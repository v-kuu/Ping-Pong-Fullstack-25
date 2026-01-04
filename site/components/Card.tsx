import type { MatchData, UserProfileData } from "@/utils/types";
import { IconPlus, Check, Clock } from "../components/Icons";

interface SuccessCardProps {
  title: string;
  message: string;
  buttonText: string;
  buttonHref: string;
}

interface UserProfileCardProps {
  user: UserProfileData;
  matches: MatchData[];
  showAddFriend?: boolean;
  friendStatus?: "none" | "sent" | "received" | "accepted";
  onAddFriend?: () => void;
  title?: string;
  maxWidth?: string;
}

export function SuccessCard({
  title,
  message,
  buttonText,
  buttonHref,
}: SuccessCardProps) {
  return (
    <div class="card text-center py-10 space-y-4">
      <div class="mx-auto w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center">
        <Check />
      </div>
      <h2 class="text-3xl font-bold text-white">{title}</h2>
      <p class="text-gray-300">{message}</p>
      <div class="flex flex-col gap-2 w-full mt-4">
        <a href={buttonHref} class="btn btn-primary w-full py-3">
          {buttonText}
        </a>
      </div>
    </div>
  );
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
              onClick={
                friendStatus === "none" || friendStatus === "received"
                  ? onAddFriend
                  : undefined
              }
              title={
                friendStatus === "received"
                  ? "Accept Request"
                  : friendStatus === "sent"
                    ? "Request Sent"
                    : "Add Friend"
              }
              class={`btn btn-circle btn-lg ${friendStatus === "accepted" || friendStatus === "sent" ? "pointer-events-none" : ""} ${
                friendStatus === "accepted"
                  ? "btn-success"
                  : friendStatus === "sent"
                    ? "btn-warning"
                    : friendStatus === "received"
                      ? "btn-primary ring-2 ring-primary ring-offset-2 ring-offset-base-100" // Highlight received requests
                      : "btn-primary"
              }`}
            >
              {friendStatus === "accepted" ? (
                <Check class="text-black" />
              ) : friendStatus === "sent" ? (
                <Clock class="text-black" />
              ) : friendStatus === "received" ? (
                <IconPlus /> // Or maybe a different icon for Accept? But Plus works as "Add Back".
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
