import { Userinfo } from "./Info.tsx";
import { UpdatePassword } from "../components/Password.tsx";
import { ChangeAvatar } from "./Avatar.tsx";

export function Setting() {
  return (
    <div className="drawer lg:drawer-open">
      <input id="my-drawer-3" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col items-center justify-center">
        <Userinfo />
        <UpdatePassword />
        <ChangeAvatar />
        <label htmlFor="my-drawer-3" className="btn drawer-button lg:hidden">
          Open drawer
        </label>
      </div>
      <div className="drawer-side">
        <label
          htmlFor="my-drawer-3"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>
        <ul className="menu bg-base-200 min-h-full w-80 p-4">
          <li>
            <a>User information</a>
          </li>
          <li>
            <a>Password</a>
          </li>
          <li>
            <a>Avatar</a>
          </li>
        </ul>
      </div>
    </div>
  );
}
