import type { ComponentChildren } from "preact";
import { useEffect, useState } from "preact/hooks";
import "../src/styles.css";

export interface ButtonProps {
  id?: string;
  onClick?: () => void;
  children?: ComponentChildren;
  disabled?: boolean;
}

export function Button(props: ButtonProps) {
  return <button {...props} class="btn" />;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"synthwave" | "dracula">("synthwave");

  useEffect(() => {
    // Check initial theme from DOM, which is set by the inline script in Base.astro/GameLayout.astro
    const docTheme = document.documentElement.getAttribute("data-theme");
    if (docTheme === "dracula") {
      setTheme("dracula");
    } else {
      setTheme("synthwave");
    }
  }, []);

  const toggleTheme = () => {
    const isDracula = theme === "dracula";
    const newTheme = isDracula ? "synthwave" : "dracula";

    const root = document.documentElement;
    root.setAttribute("data-theme", newTheme);

    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-base-300 bg-base-100 hover:bg-base-200 h-10 w-10 relative"
      aria-label="Toggle theme"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class={`h-[1.2rem] w-[1.2rem] transition-all absolute ${
          theme === "dracula" ? "-rotate-90 scale-0" : "rotate-0 scale-100"
        }`}
      >
        <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
        <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
        <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class={`h-[1.2rem] w-[1.2rem] transition-all absolute ${
          theme === "dracula" ? "rotate-0 scale-100" : "rotate-90 scale-0"
        }`}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M8 9.5h.01" stroke-width="3" />
        <path d="M16 9.5h.01" stroke-width="3" />
        <path d="M7 14c1.5 2 6.5 2 10 0" />
        <path d="M9 15l1 2 1-2" fill="currentColor" stroke="none" />
        <path d="M14 15l1 2 1-2" fill="currentColor" stroke="none" />
        <path d="M9 15l1 2 1-2" stroke-width="1" />
        <path d="M14 15l1 2 1-2" stroke-width="1" />
      </svg>
      <span class="sr-only">Toggle theme</span>
    </button>
  );
}
