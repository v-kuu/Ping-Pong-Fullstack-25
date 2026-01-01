import { useEffect, useState } from "preact/hooks";
import type { MatchData, UserData } from "@/utils/types";
import { UserProfileCard } from "./UserProfileCard";

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
    <UserProfileCard user={user} matches={matches} title="User Information" />
  );
}
