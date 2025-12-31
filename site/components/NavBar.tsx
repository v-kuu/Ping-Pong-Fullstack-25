import { UserCircle } from "./Icons.tsx";
import clsx from "clsx";

interface NavItem {
  name: string;
  href: string;
}

const loggedOutItems: NavItem[] = [
  { name: "Login", href: "/login" },
  { name: "Signup", href: "/signup" },
];

const loggedInItems: NavItem[] = [
  { name: "Profile", href: "/profile" },
  { name: "Log out", href: "/logout" },
];

export default function NavigationBar(props: {
  active: string;
  class?: string;
  user?: { username: string } | null;
}) {
  const items = props.user ? loggedInItems : loggedOutItems;

  return (
    <nav class={clsx("flex", props.class)}>
      <div class="dropdown dropdown-end">
        <div tabIndex={0} role="button" class="btn btn-ghost btn-circle avatar">
          {props.user ? (
            <div class="w-10 rounded-full overflow-hidden">
              <img src="/avatar.png" alt="Avatar" />
            </div>
          ) : (
            <div class="icon w-6 h-6">
              <UserCircle />
            </div>
          )}
        </div>
        <div class="dropdown-end dropdown-content mt-3">
          <ul
            tabIndex={-1}
            class="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
          >
            {items.map((item) => (
              <li
                key={item.href}
                aria-current={props.active === item.href ? "page" : undefined}
              >
                <a
                  href={item.href}
                  class={`p-1 sm:p-2 ${
                    props.active === item.href ? "font-bold" : ""
                  } hover:underline aria-[current]:font-bold`}
                >
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
