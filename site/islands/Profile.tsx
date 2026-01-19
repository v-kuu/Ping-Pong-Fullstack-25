import { useEffect, useState } from "preact/hooks";
import { signal, computed, effect } from "@preact/signals";
import { Show } from "@preact-signals/utils/components";
import type { MatchData, UserProfileData } from "@/utils/site/types";
import { UserProfileCard } from "@/components/Card.tsx";
import { AccountSettings } from "./Settings.tsx";
import { ChangeAvatar } from "./Avatar.tsx";
import { FriendsList } from "./Friends.tsx";
import { DeleteAccount } from "./Delete.tsx";

type Tab = "info" | "account" | "avatar" | "friends" | "delete";

const activeTab = signal<Tab>("info");

const showInfo = computed(() => activeTab.value === "info");
const showAccount = computed(() => activeTab.value === "account");
const showAvatar = computed(() => activeTab.value === "avatar");
const showFriends = computed(() => activeTab.value === "friends");
const showDelete = computed(() => activeTab.value === "delete");

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
    if (
      saved &&
      ["info", "account", "avatar", "friends", "delete"].includes(saved)
    ) {
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
    img.onload = () => {
      setAvatarUrl(`${customAvatarUrl}?t=${Date.now()}`);
    };
    img.onerror = () => {
      setAvatarUrl("/avatar.png");
    };
    img.src = `${customAvatarUrl}?t=${Date.now()}`;
  }, [userData?.username]);

  useEffect(() => {
    if (!userData?.username) return;

    const handleAvatarUpdate = () => {
      const customAvatarUrl = `/api/avatars/${userData.username}`;
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
    return () =>
      window.removeEventListener("avatar-updated", handleAvatarUpdate);
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
              <div
                class={mounted ? "" : "opacity-0 transition-opacity duration-0"}
              >
                <Show when={showInfo}>
                  {loading ? (
                    <div class="text-center p-4">Loading...</div>
                  ) : userData ? (
                    <div class={mounted ? "lg:-ml-64" : ""}>
                      <UserProfileCard
                        user={userData}
                        matches={userMatches}
                        title="User Information"
                        avatarUrl={avatarUrl}
                      />
                    </div>
                  ) : (
                    <p>Failed to load user information</p>
                  )}
                </Show>

                <Show when={showAccount}>
                  {userData && (
                    <div class={mounted ? "lg:-ml-64" : ""}>
                      <AccountSettings
                        username={userData.username}
                        email={userData.email}
                      />
                    </div>
                  )}
                </Show>
                <Show when={showAvatar}>
                  {userData && (
                    <div class={mounted ? "lg:-ml-64" : ""}>
                      <ChangeAvatar username={userData.username} />
                    </div>
                  )}
                </Show>
                <Show when={showFriends}>
                  <div class={mounted ? "lg:-ml-64" : ""}>
                    <FriendsList />
                  </div>
                </Show>
                <Show when={showDelete}>
                  <div class={mounted ? "lg:-ml-64" : ""}>
                    <DeleteAccount id={userData ? userData.id : 0} />
                  </div>
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
          <ul class="menu bg-base-200 min-h-full w-64 p-4 gap-5">
            <li>
              <button
                type="button"
                onClick={() => (activeTab.value = "info")}
                class={activeTab.value === "info" ? "active" : ""}
              >
                User Information
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => (activeTab.value = "account")}
                class={activeTab.value === "account" ? "active" : ""}
              >
                Account Settings
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => (activeTab.value = "avatar")}
                class={activeTab.value === "avatar" ? "active" : ""}
              >
                Change Avatar
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => (activeTab.value = "friends")}
                class={activeTab.value === "friends" ? "active" : ""}
              >
                Your Friends
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => (activeTab.value = "delete")}
                class={activeTab.value === "delete" ? "active" : ""}
              >
                Delete Account
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
