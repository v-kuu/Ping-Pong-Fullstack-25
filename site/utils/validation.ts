import { zxcvbn } from "@zxcvbn-ts/core";

export function validatePassword(value: string): boolean {
  const result = zxcvbn(value);
  return value.length >= 12 && result.score >= 2;
}

export function validateUsername(username: string): boolean {
  // 3-30 chars, starts with letter, only letters/numbers/dash
  return /^[A-Za-z][A-Za-z0-9-]{2,29}$/.test(username);
}

export function validateEmail(email: string): boolean {
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(email);
}

export function validatePasswordMatch(e: Event) {
  const confirmPasswordInput = document.getElementById(
    "confirmPassword",
  ) as HTMLInputElement;
  const passwordInput = document.getElementById("password") as HTMLInputElement;

  if (passwordInput.value !== confirmPasswordInput.value) {
    e.preventDefault();
    return false;
  }
  return true;
}
