import { useEffect, useState } from "preact/hooks";
import type { MatchData, UserProfileData } from "@/utils/types";
import { UserProfileCard } from "./UserProfileCard";

interface PublicUserInfoProps {
  username: string;
  isOwnProfile?: boolean;
  isLoggedIn?: boolean;
}

export function PublicUserInfo({ username, isOwnProfile = false, isLoggedIn = false }: PublicUserInfoProps) {
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [friendStatus, setFriendStatus] = useState<"none" | "pending" | "accepted">("none");

  useEffect(() => {
    Promise.all([
      fetch(`/api/public-user/${username}`),
      isLoggedIn ? fetch(`/api/friendship-status/${username}`) : Promise.resolve(null),
    ])
      .then(async ([userRes, statusRes]) => {
        if (!userRes.ok) {
          throw new Error("User not found");
        }
        const data = await userRes.json();
        setUser(data.user);
        setMatches(data.matches);

        if (statusRes && statusRes.ok) {
          const statusData = await statusRes.json();
          setFriendStatus(statusData.status);
        }
      })
      .catch((e) => {
        setError(e.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [username, isLoggedIn]);

  const handleAddFriend = async () => {
    try {
      const res = await fetch(`/api/friend-request/${username}`, {
        method: "POST",
      });
      if (res.ok) {
        setFriendStatus("pending");
      }
    } catch (e) {
      console.error("Failed to send friend request:", e);
    }
  };

  if (loading) {
    return (
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-center p-4">Loading...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div class="min-h-screen flex items-center justify-center">
        <p class="text-center p-4">User not found</p>
      </div>
    );
  }

  return (
    <div class="min-h-screen flex flex-col items-center justify-start pt-8 p-4">
      <div class="w-full max-w-7xl">
        <UserProfileCard
          user={user}
          matches={matches}
          showAddFriend={!isOwnProfile && isLoggedIn}
          friendStatus={friendStatus}
          onAddFriend={handleAddFriend}
          maxWidth="max-w-full"
        />
      </div>
    </div>
  );
}
