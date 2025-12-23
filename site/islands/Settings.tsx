import { Userinfo } from "./Info.tsx";
import { UpdatePassword } from "../components/Password.tsx";
import { ChangeAvatar } from "./Avatar.tsx";
import { signal } from "@preact/signals";
import { Show } from "@preact-signals/utils/components";

const isInfo = signal(true);
const isPass = signal(false);
const isAvatar = signal(false);

export function Setting() {
  return (
    <div class="drawer lg:drawer-open">
      <input id="my-drawer-3" type="checkbox" class="drawer-toggle" />
      <div className="prose max-w-none drawer-content flex flex-col items-center justify-center">
        <Show when={isInfo}>
          <Userinfo />
        </Show>
        <Show when={isPass}>
          <UpdatePassword />
        </Show>
        <Show when={isAvatar}>
          <ChangeAvatar />
        </Show>
        <label htmlFor="my-drawer-3" class="btn drawer-button lg:hidden">
          Open drawer
        </label>
      </div>
      <div class="drawer-side">
        <label
          htmlFor="my-drawer-3"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>
        <ul class="menu bg-base-200 min-h-full w-80 p-4">
          <li>
            <button
              type="button"
              onClick={() => {
                isInfo.value = true;
                isPass.value = false;
                isAvatar.value = false;
              }}
            >
              User information
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => {
                isPass.value = true;
                isInfo.value = false;
                isAvatar.value = false;
              }}
            >
              Password
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => {
                isAvatar.value = true;
                isPass.value = false;
                isInfo.value = false;
              }}
            >
              Avatar
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
