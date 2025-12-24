export function validatePassword(value: string): boolean {
  const passwordPattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
  return passwordPattern.test(value);
}

export function validatePasswordMatch(e: Event) {
  const confirmPasswordInput = document.getElementById(
    "confirmPassword",
  ) as HTMLInputElement;
  const passwordInput = document.getElementById(
    "password",
  ) as HTMLInputElement;

  if (passwordInput.value !== confirmPasswordInput.value) {
    e.preventDefault();
    return false;
  }
  return true;
}