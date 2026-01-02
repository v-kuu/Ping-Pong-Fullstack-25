import { useEffect, useState } from "preact/hooks";
import { Check, XMark } from "../components/Icons";

interface Friend {
  id: number;
  username: string;
  status: "online" | "offline" | "playing";
  elo: number;
}

interface PendingRequest {
  id: number;
  userId: number;
  username: string;
  elo: number;
}

export function FriendsList() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [addUsername, setAddUsername] = useState("");
  const [addMessage, setAddMessage] = useState<
    "success" | "error" | "not_found" | "already" | null
  >(null);

  useEffect(() => {
    fetchFriendsData();
  }, []);

  const fetchFriendsData = async () => {
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        fetch("/api/friends"),
        fetch("/api/friend-requests/received"),
      ]);

      if (friendsRes.ok) {
        setFriends(await friendsRes.json());
      }
      if (requestsRes.ok) {
        setPendingRequests(await requestsRes.json());
      }
    } catch (e) {
      console.error("Failed to fetch friends data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (e: Event) => {
    e.preventDefault();
    if (!addUsername.trim()) return;

    setAddMessage(null);
    try {
      const res = await fetch(`/api/friend-request/${addUsername.trim()}`, {
        method: "POST",
      });

      if (res.ok) {
        setAddMessage("success");
        setAddUsername("");
        fetchFriendsData();
      } else {
        const data = await res.json();
        if (data.error === "User not found") {
          setAddMessage("not_found");
        } else if (
          data.error.includes("already") ||
          data.error.includes("pending")
        ) {
          setAddMessage("already");
        } else {
          setAddMessage("error");
        }
      }
    } catch (e) {
      setAddMessage("error");
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    try {
      const res = await fetch(`/api/friend-requests/${requestId}/accept`, {
        method: "POST",
      });
      if (res.ok) {
        fetchFriendsData();
      }
    } catch (e) {
      console.error("Failed to accept request:", e);
    }
  };

  const handleDeclineRequest = async (requestId: number) => {
    try {
      const res = await fetch(`/api/friend-requests/${requestId}/decline`, {
        method: "POST",
      });
      if (res.ok) {
        fetchFriendsData();
      }
    } catch (e) {
      console.error("Failed to decline request:", e);
    }
  };

  const statusColors = {
    online: "bg-success",
    playing: "bg-warning",
    offline: "bg-neutral",
  };

  if (loading) {
    return (
      <div class="w-full max-w-4xl">
        <div class="card bg-base-200 p-6">
          <p class="text-center">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="w-full max-w-4xl">
      <div class="card bg-base-200 p-6 mb-6">
        <h2 class="text-2xl font-bold mb-4">Add Friend</h2>
        <form onSubmit={handleAddFriend} class="flex gap-2">
          <input
            type="text"
            value={addUsername}
            onInput={(e) => setAddUsername(e.currentTarget.value)}
            placeholder="Enter username"
            class="input input-bordered flex-1"
          />
          <button type="submit" class="btn btn-primary">
            Add
          </button>
        </form>
        {addMessage === "success" && (
          <p class="text-success mt-2">Friend request sent!</p>
        )}
        {addMessage === "not_found" && (
          <p class="text-error mt-2">User not found</p>
        )}
        {addMessage === "already" && (
          <p class="text-warning mt-2">Already friends or request pending</p>
        )}
        {addMessage === "error" && (
          <p class="text-error mt-2">Failed to send request</p>
        )}
      </div>

      {pendingRequests.length > 0 && (
        <div class="card bg-base-200 p-6 mb-6">
          <h2 class="text-xl font-bold mb-4">Friend Requests</h2>
          <div class="space-y-2">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                class="flex items-center justify-between p-3 bg-base-300 rounded-lg"
              >
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-base-100 bg-cover bg-center bg-[url('/avatar.png')]" />
                  <div>
                    <a
                      href={`/profile/${request.username}`}
                      class="link link-primary hover:underline font-medium"
                    >
                      {request.username}
                    </a>
                    <p class="text-sm opacity-70">ELO: {request.elo}</p>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button
                    onClick={() => handleAcceptRequest(request.id)}
                    class="btn btn-circle btn-sm btn-success"
                  >
                    <Check />
                  </button>
                  <button
                    onClick={() => handleDeclineRequest(request.id)}
                    class="btn btn-circle btn-sm btn-error"
                  >
                    <XMark />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div class="card bg-base-200 p-6">
        <h2 class="text-2xl font-bold mb-6">Friends</h2>

        {friends.length === 0 ? (
          <p class="opacity-70">No friends yet</p>
        ) : (
          <div class="space-y-2">
            {friends.map((friend) => (
              <div
                key={friend.id}
                class="flex items-center justify-between p-3 bg-base-300 rounded-lg"
              >
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-full bg-base-100 bg-cover bg-center bg-[url('/avatar.png')]" />
                  <div>
                    <a
                      href={`/profile/${friend.username}`}
                      class="link link-primary hover:underline font-medium"
                    >
                      {friend.username}
                    </a>
                    <p class="text-sm opacity-70">ELO: {friend.elo}</p>
                  </div>
                </div>
                <div class="flex items-center gap-4">
                  <div class="flex items-center gap-2">
                    <span
                      class={`w-3 h-3 rounded-full ${statusColors[friend.status]}`}
                    />
                    <span class="capitalize text-sm">{friend.status}</span>
                  </div>
                  <button class="btn btn-sm btn-outline">Request Game</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
