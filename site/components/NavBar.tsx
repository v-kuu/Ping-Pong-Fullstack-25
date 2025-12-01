import * as Icons from "./Icons.tsx";

export default function NavigationBar(props: {
  active: string;
  class?: string;
}) {
  const items = [
    {
      name: "Login",
      href: "/login",
    },
    {
      name: "Signup",
      href: "/signup",
    },
    {
      name: "Settings",
      href: "/settings",
    },
  ];
  return (
    <nav class={"flex " + (props.class ?? "")} f-client-nav={false}>
      <div class="dropdown dropdown-end">
        <div tabIndex={0} role="button" class="btn btn-ghost btn-circle avatar">
          <div class="icon w-6 h-6">
            <Icons.UserCircle />
          </div>
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
