import { zxcvbn } from "@zxcvbn-ts/core";

export function validatePassword(value: string): boolean {
  const result = zxcvbn(value);
  return value.length >= 12 && result.score >= 2;
}

export function validateUsername(username: string): boolean {
  return USERNAME_RULES.every((rule) => rule.test(username));
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

// helper
export function createResponse(
  body: Record<string, any>,
  status: number,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const USERNAME_RULES = [
  {
    label: "3-30 characters",
    test: (u: string) => u.length >= 3 && u.length <= 30,
  },
  { label: "Starts with letter", test: (u: string) => /^[A-Za-z]/.test(u) },
  {
    label: "Letters, numbers, dash only",
    test: (u: string) => /^[A-Za-z][A-Za-z0-9\-]*$/.test(u),
  },
];
