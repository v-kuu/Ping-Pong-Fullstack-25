import { useState } from "preact/hooks";

interface Friend {
  id: number;
  username: string;
  status: "online" | "offline" | "playing";
}

export function FriendsList() {
  const [friends] = useState<Friend[]>([
    { id: 1, username: "PlayerOne", status: "online" },
    { id: 2, username: "ProGamer", status: "playing" },
    { id: 3, username: "NoobMaster", status: "offline" },
  ]);

  const statusColors = {
    online: "bg-success",
    playing: "bg-warning",
    offline: "bg-neutral",
  };

  return (
    <div class="w-full max-w-2xl">
      <h2 class="text-2xl font-bold mb-6">Friends</h2>

      {friends.length === 0 ? (
        <p class="opacity-70">No friends yet</p>
      ) : (
        <div class="card bg-base-200 p-4">
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {friends.map((friend) => (
                  <tr key={friend.id}>
                    <td>
                      <a
                        href={`/profile/${friend.username}`}
                        class="link link-primary hover:underline font-medium"
                      >
                        {friend.username}
                      </a>
                    </td>
                    <td>
                      <div class="flex items-center gap-2">
                        <span
                          class={`w-3 h-3 rounded-full ${statusColors[friend.status]}`}
                        />
                        <span class="capitalize text-sm">{friend.status}</span>
                      </div>
                    </td>
                    <td>
                      <button class="btn btn-ghost btn-xs">Message</button>
                    </td>
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
