import { useEffect, useState } from "preact/hooks";
import { signal, computed, effect } from "@preact/signals";
import { Show } from "@preact-signals/utils/components";
import type { MatchData, UserProfileData } from "@/utils/types";
import { UserProfileCard } from "../components/UserProfileCard";
import { UpdatePassword } from "./Password.tsx";
import { ChangeAvatar } from "./Avatar.tsx";
import { FriendsList } from "./Friends";

type Tab = "info" | "pass" | "avatar" | "friends";
const getInitialTab = (): Tab => {
  if (typeof window === "undefined") return "info";
  const saved = sessionStorage.getItem("profileTab") as Tab | null;
  return saved && ["info", "pass", "avatar", "friends"].includes(saved) ? saved : "info";
};
const activeTab = signal<Tab>(getInitialTab());

const showInfo = computed(() => activeTab.value === "info");
const showPass = computed(() => activeTab.value === "pass");
const showAvatar = computed(() => activeTab.value === "avatar");
const showFriends = computed(() => activeTab.value === "friends");

if (typeof window !== "undefined") {
  effect(() => {
    sessionStorage.setItem("profileTab", activeTab.value);
  });
}

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
  }, []);

  // Pre-load avatar to check if custom avatar exists
  useEffect(() => {
    if (!userData?.username) return;
    
    const customAvatarUrl = `/avatars/${userData.username}.png`;
    const img = new Image();
    img.onload = () => {
      setAvatarUrl(`${customAvatarUrl}?t=${Date.now()}`);
    };
    img.onerror = () => {
      setAvatarUrl("/avatar.png");
    };
    img.src = `${customAvatarUrl}?t=${Date.now()}`;
  }, [userData?.username]);

  // Listen for avatar updates
  useEffect(() => {
    if (!userData?.username) return;
    
    const handleAvatarUpdate = () => {
      const customAvatarUrl = `/avatars/${userData.username}.png`;
      const img = new Image();
      img.onload = () => {
        setAvatarUrl(`${customAvatarUrl}?t=${Date.now()}`);
      };
      img.onerror = () => {
        setAvatarUrl("/avatar.png");
      };
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

  return (
    <div class="min-h-screen flex">
      <div class="drawer lg:drawer-open">
        <input id="my-drawer-3" type="checkbox" class="drawer-toggle" />

        <div class="drawer-content flex-1 flex flex-col items-center justify-start pt-8 px-4">
          <label
            htmlFor="my-drawer-3"
            aria-label="open sidebar"
            class="btn btn-square btn-ghost absolute top-4 left-4 lg:hidden"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </label>

          <div class="w-full max-w-4xl flex flex-col items-center gap-6">
            <div class="w-full max-w-2xl flex justify-center">
              <div class={mounted ? "" : "opacity-0 transition-opacity duration-0"}>
                <Show when={showInfo}>
                  {loading ? (
                    <div class="text-center p-4">Loading...</div>
                  ) : userData ? (
                    <UserProfileCard
                      user={userData}
                      matches={userMatches}
                      title="User Information"
                      avatarUrl={avatarUrl}
                    />
                  ) : (
                    <p>Failed to load user information</p>
                  )}
                </Show>

                <Show when={showPass}>
                  <UpdatePassword />
                </Show>
                <Show when={showAvatar}>
                  {userData && (
                    <ChangeAvatar
                      username={userData.username}
                    />
                  )}
                </Show>

                <Show when={showFriends}>
                  <FriendsList />
                </Show>
              </div>
            </div>
          </div>
        </div>

        <div class="drawer-side z-40">
          <label
            htmlFor="my-drawer-3"
            aria-label="close sidebar"
            class="drawer-overlay"
          ></label>
          <ul class="menu bg-base-200 min-h-full w-64 p-4">
            <li>
              <button
                type="button"
                onClick={() => (activeTab.value = "info")}
                class={activeTab.value === "info" ? "active" : ""}
              >
                User information
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => (activeTab.value = "pass")}
                class={activeTab.value === "pass" ? "active" : ""}
              >
                Password
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => (activeTab.value = "avatar")}
                class={activeTab.value === "avatar" ? "active" : ""}
              >
                Avatar
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => (activeTab.value = "friends")}
                class={activeTab.value === "friends" ? "active" : ""}
              >
                Friends
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
