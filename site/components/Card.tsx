import type { MatchData, UserProfileData } from "@/utils/types";
import { IconPlus, Check, Clock } from "../components/Icons";
import { UserAvatar } from "./Avatar.tsx";

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
  avatarKey?: number;
  /** Pre-resolved avatar URL (bypasses UserAvatar's onError logic) */
  avatarUrl?: string;
}

function getGameIcon(game: string): string {
  return game === "pong" ? "🎾" : "🎮";
}

function getMedal(placement: number): string {
  switch (placement) {
    case 1: return "🥇";
    case 2: return "🥈";
    case 3: return "🥉";
    default: return "";
  }
}

function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function LeaderboardModal({
  match,
  modalId
}: {
  match: MatchData;
  modalId: string;
}) {
  const playerScores = Array.isArray(match.playerScores) ? match.playerScores : [];
  const maxScore = playerScores.length > 0 ? playerScores[0].score : 0;

  return (
    <dialog id={modalId} className="modal">
      <div className="modal-box max-w-md">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
        </form>
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <span>🎮</span>
          Web3D Match Results
        </h3>
        <div className="space-y-2">
          {playerScores.map((player, idx) => {
            const rank = playerScores.filter(p => p.score > player.score).length + 1;
            const medal = getMedal(rank);
            const progressPercent = maxScore > 0 ? (player.score / maxScore) * 100 : 0;
            return (
              <a
                key={idx}
                href={`/profile/${player.name}`}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-base-content/10 ${player.isCurrentUser ? "bg-primary/20 ring-1 ring-primary" : "bg-base-300/50"
                  }`}
              >
                <span className="w-8 text-center font-bold">
                  {medal || getOrdinalSuffix(rank)}
                </span>
                <span className="flex-1 font-medium">{player.name}</span>
                <div className="flex items-center gap-2 w-24">
                  <div className="flex-1 h-2 bg-base-300 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${player.isCurrentUser ? "bg-primary" : "bg-base-content/40"}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="font-mono text-sm w-8 text-right">{player.score}</span>
                </div>
              </a>
            );
          })}
        </div>
        <p className="text-xs opacity-50 mt-4 text-center">
          {new Date(match.completedAt).toLocaleDateString()}
        </p>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}

function MatchRow({ match }: { match: MatchData }) {
  const gameIcon = getGameIcon(match.game);
  const medal = getMedal(match.placement);
  const placementText = getOrdinalSuffix(match.placement);

  const playerScores = Array.isArray(match.playerScores) ? match.playerScores : [];

  if (match.game === "pong") {
    const myScore = playerScores.find(p => p.isCurrentUser)?.score ?? 0;
    const opponentScore = playerScores.find(p => !p.isCurrentUser)?.score ?? 0;

    return (
      <tr className="hover:bg-base-300/50 transition-colors">
        <td>
          <div className="flex items-center gap-2">
            <span className="text-lg">{gameIcon}</span>
            <a href={`/profile/${match.opponentName}`} class="link link-primary hover:underline font-medium">
              {match.opponentName}
            </a>
          </div>
        </td>
        <td className="text-center">
          <span className={match.won ? "text-success font-bold" : "text-error font-bold"}>
            {myScore}-{opponentScore}
          </span>
        </td>
        <td className="text-right">
          {new Date(match.completedAt).toLocaleDateString()}
        </td>
      </tr>
    );
  }

  // Web3D - Simple summary row with modal
  const modalId = `match-modal-${match.id}`;

  return (
    <tr
      className="hover:bg-base-300/50 transition-colors cursor-pointer"
      onClick={() => (document.getElementById(modalId) as HTMLDialogElement)?.showModal()}
    >
      <td>
        <div className="flex items-center gap-2">
          <span className="text-lg">{gameIcon}</span>
          <span className="text-xs opacity-50">click to view</span>
        </div>
      </td>
      <td className="text-center">
        <div className="flex items-center justify-center gap-2">
          {medal && <span className="text-lg">{medal}</span>}
          <span className={match.won ? "text-success font-bold" : "font-medium"}>
            {placementText}/{playerScores.length}
          </span>
        </div>
      </td>
      <td className="text-right">
        {new Date(match.completedAt).toLocaleDateString()}
        {/* Modal inside td to keep HTML valid */}
        <div onClick={(e) => e.stopPropagation()}>
          <LeaderboardModal match={match} modalId={modalId} />
        </div>
      </td>
    </tr>
  );
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
  avatarKey,
  avatarUrl,
}: UserProfileCardProps) {
  return (
    <div class={`w-full ${maxWidth}`}>
      <div class="card bg-base-200 p-6">
        {title && <h2 class="text-2xl font-bold mb-6">{title}</h2>}

        <div class="flex items-center justify-between gap-4 mb-6">
          <div class="flex items-center gap-4">
            {avatarUrl ? (
              <div class="w-16 h-16 rounded-full overflow-hidden bg-base-300">
                <img
                  src={avatarUrl}
                  alt={`${user.username}'s avatar`}
                  class="w-full h-full object-cover"
                />
              </div>
            ) : (
              <UserAvatar
                username={user.username}
                class="w-16 h-16"
                cacheKey={avatarKey}
              />
            )}
            <div>
              <h3 class="text-xl font-bold">{user.username}</h3>
              <p class="text-sm opacity-70">{user.email}</p>
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
              class={`btn btn-circle btn-lg ${friendStatus === "accepted" || friendStatus === "sent" ? "pointer-events-none" : ""} ${friendStatus === "accepted"
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
                  <th>Opponents</th>
                  <th>Result</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match) => (
                  <MatchRow key={match.id} match={match} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function VideoCard(props: { title: string; url: string; link: string }) {
  return (
    <div class="card text-center bg-base-200 p-4 max-w-1/3 max-h-1/3">
      <a
        href={props.link}
        class="link link-primary hover:underline mb-2 inline-block"
      >
        <h3 class="text-xl font-bold mb-4">Play {props.title}</h3>
      </a>
      <div class="aspect-w-16 aspect-h-9">
        <video muted autoplay loop class="w-full h-full object-contain rounded">
          <source src={props.url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
}
