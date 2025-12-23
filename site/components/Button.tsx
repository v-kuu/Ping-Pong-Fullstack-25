import type { ComponentChildren } from "preact";
import "../assets/styles.css";

export interface ButtonProps {
  id?: string;
  onClick?: () => void;
  children?: ComponentChildren;
  disabled?: boolean;
}

export function Button(props: ButtonProps) {
  return <button {...props} class="btn" />;
}
