import { ThemeToggle } from "./Button.tsx";
import { NavAvatar } from "@/islands/Avatar.tsx";
import NavigationBar from "./NavBar.tsx";
import { UserCircle, HomeLogo, PingLogo, WebLogo } from "./Icons.tsx";

export default function Header(props: {
  active: string;
  user?: { username: string } | null;
}) {
  const { active, user } = props;

  return (
    <header>
      <div class="navbar bg-base-100 shadow-sm">
        <div class="flex-1 menu menu-horizontal">
          <HomeLogo />
          <PingLogo />
          <WebLogo />
        </div>
        <nav class="flex items-center gap-2 flex-none">
          <ThemeToggle />
          <NavigationBar active={active} user={user}>
            {user ? (
              <NavAvatar username={user.username} />
            ) : (
              <div class="icon w-6 h-6">
                <UserCircle />
              </div>
            )}
          </NavigationBar>
        </nav>
      </div>
    </header>
  );
}
