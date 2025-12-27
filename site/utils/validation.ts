export function validatePassword(value: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(value));
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

export const PASSWORD_RULES = [
  { label: "8+ characters", test: (p: string) => p.length >= 8 },
  { label: "1 number", test: (p: string) => /\d/.test(p) },
  { label: "1 lowercase", test: (p: string) => /[a-z]/.test(p) },
  { label: "1 uppercase", test: (p: string) => /[A-Z]/.test(p) },
  {
    label: "1 special character",
    test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p),
  },
];
