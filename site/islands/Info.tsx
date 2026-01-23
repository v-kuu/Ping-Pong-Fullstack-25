import { useEffect, useState } from "preact/hooks";
import type { MatchData, UserProfileData } from "@/utils/site/types";
import { UserProfileCard } from "@/components/Card.tsx";

interface PublicUserInfoProps {
  username: string;
  isOwnProfile?: boolean;
  isLoggedIn?: boolean;
}

export function PublicUserInfo({
  username,
  isOwnProfile = false,
  isLoggedIn = false,
}: PublicUserInfoProps) {
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [friendStatus, setFriendStatus] = useState<
    "none" | "sent" | "received" | "accepted"
  >("none");
  const [requestId, setRequestId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/public-user/${username}`),
      isLoggedIn
        ? fetch(`/api/friendship-status/${username}`)
        : Promise.resolve(null),
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
          setRequestId(statusData.requestId);
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
      if (friendStatus === "none") {
        // Send Request
        const res = await fetch(`/api/friends/requests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });
        if (res.ok) {
          setFriendStatus("sent");
        }
      } else if (friendStatus === "received" && requestId) {
        // Accept Request
        const res = await fetch(`/api/friends/requests/${requestId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "accepted" }),
        });
        if (res.ok) {
          setFriendStatus("accepted");
        }
      }
    } catch (e) {
      console.error("Failed to update friendship:", e);
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

  const handleSendMessage = () => {
    if (user) {
      sessionStorage.setItem("profileTab", "messages");
      sessionStorage.setItem("messageUserId", String(user.id));
      window.location.href = "/profile";
    }
  };

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
        {!isOwnProfile && isLoggedIn && (
          <div class="mt-4 flex justify-center">
            <button class="btn btn-primary" onClick={handleSendMessage}>
              Send Message
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
