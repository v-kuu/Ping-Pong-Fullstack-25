import { useEffect, useState } from "preact/hooks";
import type { MatchData, PublicUserData } from "@/utils/types";
import { UserProfileCard } from "./UserProfileCard";

interface PublicUserInfoProps {
  username: string;
  isOwnProfile?: boolean;
  isLoggedIn?: boolean;
}

export function PublicUserInfo({ username, isOwnProfile = false, isLoggedIn = false }: PublicUserInfoProps) {
  const [user, setUser] = useState<PublicUserData | null>(null);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/public-user/${username}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("User not found");
        }
        const data = await res.json();
        setUser(data.user);
        setMatches(data.matches);
      })
      .catch((e) => {
        setError(e.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [username]);

  if (loading) {
    return <div class="text-center p-4">Loading...</div>;
  }

  if (error || !user) {
    return <p class="text-center p-4">User not found</p>;
  }

  return <UserProfileCard user={user} matches={matches} showAddFriend={!isOwnProfile && isLoggedIn} />;
}
