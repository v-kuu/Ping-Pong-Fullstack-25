import { UserInfo } from "./Info.tsx";
import { UpdatePassword } from "./Password.tsx";
import { ChangeAvatar } from "./Avatar.tsx";
import { FriendsList } from "./Friends";
import { signal, computed } from "@preact/signals";
import { Show } from "@preact-signals/utils/components";
import type { MatchData, UserData } from "@/utils/types";

type Tab = "info" | "pass" | "avatar" | "friends";
const activeTab = signal<Tab>("info");

const showInfo = computed(() => activeTab.value === "info");
const showPass = computed(() => activeTab.value === "pass");
const showAvatar = computed(() => activeTab.value === "avatar");
const showFriends = computed(() => activeTab.value === "friends");

interface ProfileMenuProps {
  user: UserData | null;
  matches?: MatchData[];
}

export function ProfileMenu({ user, matches }: ProfileMenuProps) {
  return (
    <div class="drawer lg:drawer-open">
      <input id="my-drawer-3" type="checkbox" class="drawer-toggle" />
      <div class="drawer-content flex flex-col items-center justify-center">
        <button
          class="btn btn-square btn-ghost self-start lg:hidden"
          onClick={() => {
            const checkbox = document.getElementById(
              "my-drawer-3",
            ) as HTMLInputElement;
            if (checkbox) checkbox.checked = true;
          }}
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
        </button>
        <Show when={showInfo}>
          <UserInfo user={user} matches={matches} />
        </Show>
        <Show when={showPass}>
          <UpdatePassword />
        </Show>
        <Show when={showAvatar}>
          <ChangeAvatar />
        </Show>
        <Show when={showFriends}>
          <FriendsList />
        </Show>
      </div>
      <div class="drawer-side">
        <label
          htmlFor="my-drawer-3"
          aria-label="close sidebar"
          class="drawer-overlay"
        ></label>
        <ul class="menu bg-base-200 min-h-full w-80 p-4">
          <li>
            <button type="button" onClick={() => (activeTab.value = "info")}>
              User information
            </button>
          </li>
          <li>
            <button type="button" onClick={() => (activeTab.value = "pass")}>
              Password
            </button>
          </li>
          <li>
            <button type="button" onClick={() => (activeTab.value = "avatar")}>
              Avatar
            </button>
          </li>
          <li>
            <button type="button" onClick={() => (activeTab.value = "friends")}>
              Friends
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
