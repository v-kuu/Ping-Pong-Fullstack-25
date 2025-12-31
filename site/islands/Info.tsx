import { useEffect, useState } from "preact/hooks";
import type { MatchData, UserData } from "@/utils/types";

interface UserInfoProps {
  user?: UserData | null;
  matches?: MatchData[];
}

export function UserInfo({
  user: initialUser,
  matches: initialMatches,
}: UserInfoProps) {
  const [user, setUser] = useState<UserData | null>(initialUser ?? null);
  const [matches, setMatches] = useState<MatchData[]>(initialMatches ?? []);
  const [loading, setLoading] = useState(!initialUser);

  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
      setMatches(initialMatches ?? []);
      setLoading(false);
      return;
    }
    fetchData();
    function fetchData() {
      Promise.all([fetch("/api/user-info"), fetch("/api/user-matches")])
        .then(async ([userRes, matchesRes]) => {
          if (userRes.ok) {
            setUser(await userRes.json());
          }
          if (matchesRes.ok) {
            setMatches(await matchesRes.json());
          }
        })
        .catch((e) => {
          console.error("Failed to fetch user data", e);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [initialUser]);

  if (loading) {
    return <div class="text-center p-4">Loading...</div>;
  }

  if (!user) {
    return <p>Failed to load user information</p>;
  }

  return (
    <div class="w-full max-w-2xl">
      <h2 class="text-2xl font-bold mb-6">User Information</h2>

      <div class="card bg-base-200 p-6 mb-6">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-16 h-16 rounded-full overflow-hidden bg-base-300 bg-cover bg-center bg-[url('/avatar.png')]" />
          <div>
            <h3 class="text-xl font-bold">{user.username}</h3>
            <p class="opacity-70">{user.email}</p>
          </div>
        </div>
        <p class="text-lg">
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
                    <td>{match.opponentName}</td>
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
