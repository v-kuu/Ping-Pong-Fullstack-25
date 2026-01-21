import { useEffect, useState } from "preact/hooks";
import { signal, computed, effect } from "@preact/signals";
import { Show } from "@preact-signals/utils/components";
import type { MatchData, UserProfileData } from "@/utils/site/types";
import { UserProfileCard } from "@/components/Card.tsx";
import { AccountSettings } from "./Settings.tsx";
import { ChangeAvatar } from "./Avatar.tsx";
import { FriendsList } from "./Friends.tsx";
import { DeleteAccount } from "./Delete.tsx";
import { Messages } from "./Messages.tsx";

type Tab = "info" | "account" | "avatar" | "friends" | "messages" | "delete";

const activeTab = signal<Tab>("info");

const tabConfig: { id: Tab; label: string }[] = [
  { id: "info", label: "Profile" },
  { id: "account", label: "Settings" },
  { id: "avatar", label: "Avatar" },
  { id: "friends", label: "Friends" },
  { id: "messages", label: "Messages" },
  { id: "delete", label: "Delete" },
];

interface ProfileMenuProps {
  user: UserProfileData | null;
  matches?: MatchData[];
}

export function ProfileMenu({ user, matches }: ProfileMenuProps) {
  const [mounted, setMounted] = useState(false);
  const [userData, setUserData] = useState<UserProfileData | null>(user);
  const [userMatches, setUserMatches] = useState<MatchData[]>(matches ?? []);
  const [loading, setLoading] = useState(!user);
  const [avatarUrl, setAvatarUrl] = useState("/avatar.png");

  useEffect(() => {
    setMounted(true);
    const saved = sessionStorage.getItem("profileTab") as Tab | null;
    if (saved && tabConfig.some((t) => t.id === saved)) {
      activeTab.value = saved;
    }

    const dispose = effect(() => {
      sessionStorage.setItem("profileTab", activeTab.value);
    });
    return dispose;
  }, []);

  useEffect(() => {
    if (!userData?.username) return;

    const customAvatarUrl = `/api/avatars/${userData.username}`;
    const img = new Image();
    img.onload = () => setAvatarUrl(`${customAvatarUrl}?t=${Date.now()}`);
    img.onerror = () => setAvatarUrl("/avatar.png");
    img.src = `${customAvatarUrl}?t=${Date.now()}`;
  }, [userData?.username]);

  useEffect(() => {
    if (!userData?.username) return;

    const handleAvatarUpdate = () => {
      const customAvatarUrl = `/api/avatars/${userData.username}`;
      const img = new Image();
      img.onload = () => setAvatarUrl(`${customAvatarUrl}?t=${Date.now()}`);
      img.onerror = () => setAvatarUrl("/avatar.png");
      img.src = `${customAvatarUrl}?t=${Date.now()}`;
    };
    window.addEventListener("avatar-updated", handleAvatarUpdate);
    return () => window.removeEventListener("avatar-updated", handleAvatarUpdate);
  }, [userData?.username]);

  useEffect(() => {
    if (user) {
      setUserData(user);
      setUserMatches(matches ?? []);
      setLoading(false);
      return;
    }
    Promise.all([fetch("/api/user-info"), fetch("/api/user-matches")])
      .then(async ([userRes, matchesRes]) => {
        if (userRes.ok) setUserData(await userRes.json());
        if (matchesRes.ok) setUserMatches(await matchesRes.json());
      })
      .catch((e) => console.error("Failed to fetch user data", e))
      .finally(() => setLoading(false));
  }, [user]);

  const handleTabChange = (tab: Tab) => {
    activeTab.value = tab;
  };

  return (
    <div class="min-h-screen flex flex-col">
      <div class="lg:hidden sticky top-0 z-30 bg-base-100 border-b border-base-300">
        <div class="flex overflow-x-auto scrollbar-hide">
          {tabConfig.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              class={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab.value === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-base-content/70 hover:text-base-content"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div class="flex-1 flex">
        <aside class="hidden lg:flex lg:flex-col lg:w-44 lg:shrink-0 bg-base-200 border-r border-base-300">
          <nav class="flex-1 p-3">
            <ul class="menu menu-sm gap-1">
              {tabConfig.map((tab) => (
                <li key={tab.id}>
                  <button
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    class={activeTab.value === tab.id ? "active" : ""}
                  >
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main class="flex-1 overflow-y-auto flex justify-center">
          <div class="p-4 lg:p-8 w-full max-w-4xl">
            <div class={mounted ? "" : "opacity-0"}>
              <Show when={computed(() => activeTab.value === "info")}>
                {loading ? (
                  <div class="flex justify-center p-8">
                    <span class="loading loading-spinner loading-lg" />
                  </div>
                ) : userData ? (
                  <UserProfileCard
                    user={userData}
                    matches={userMatches}
                    title="User Information"
                    avatarUrl={avatarUrl}
                  />
                ) : (
                  <div class="alert alert-error">
                    Failed to load user information
                  </div>
                )}
              </Show>

              <Show when={computed(() => activeTab.value === "account")}>
                {userData && (
                  <AccountSettings
                    username={userData.username}
                    email={userData.email}
                  />
                )}
              </Show>

              <Show when={computed(() => activeTab.value === "avatar")}>
                {userData && <ChangeAvatar username={userData.username} />}
              </Show>

              <Show when={computed(() => activeTab.value === "friends")}>
                <FriendsList />
              </Show>

              <Show when={computed(() => activeTab.value === "messages")}>
                <Messages />
              </Show>

              <Show when={computed(() => activeTab.value === "delete")}>
                <DeleteAccount id={userData ? userData.id : 0} />
              </Show>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
