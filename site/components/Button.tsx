import type { ComponentChildren } from "preact";
import "../src/styles.css";

export interface ButtonProps {
  id?: string;
  onClick?: () => void;
  children?: ComponentChildren;
  disabled?: boolean;
}

export function Button(props: ButtonProps) {
  return <button {...props} class="btn" />; // RABBIT: Unsafe spread - allows invalid HTML attributes and 'class' can be overridden by props.class. Destructure specific props instead.
}
