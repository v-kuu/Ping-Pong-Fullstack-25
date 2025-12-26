import { validatePassword, validatePasswordMatch } from "../utils/validation.ts";
import { useState } from "preact/hooks";

export function UpdatePassword() {
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  function validateInput(e: Event) {
    if (!validatePasswordMatch(e)) {
      setPasswordMismatch(true);
    }
  }

  return (
    <div>
      <h2>Change your password</h2>
      <form method="POST" action="/update" class="space-y-6" onSubmit={validateInput}>
        <div class="space-y-2">
          <label class="block text-sm font-medium text-white-700" for="oldPassword">
            Current Password
          </label>
          <input
            type="password"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 text-white-900 focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 outline-none"
            minLength={8}
            pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
            title="Must be more than 8 characters, including number, lowercase letter, uppercase letter"
            placeholder="Enter your current password"
            id="oldPassword"
            name="oldPassword"
            required
          />
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-white-700" for="newPassword"> // RABBIT: Invalid Tailwind class 'text-white-700' doesn't exist.
            New Password
          </label>
          <input
            type="password"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 text-white-900 focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 outline-none"
            minLength={8}
            pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
            title="Must be more than 8 characters, including number, lowercase letter, uppercase letter"
            placeholder="What should your password be?"
            id="newPassword"
            name="newPassword"
            required
            onInput={(e) => {
              const value = (e.target as HTMLInputElement).value;
              setShowPasswordRequirements(
                value.length > 0 && !validatePassword(value),
              );
            }}
          />
          {showPasswordRequirements && (
            <ul class="text-xs text-red-500 space-y-1 ml-4 bg-yellow-50 p-2 rounded">
              <li>• 8+ characters</li>
              <li>• 1 number</li>
              <li>• 1 lowercase</li>
              <li>• 1 uppercase</li>
            </ul>
          )}
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-white-700" for="confirmPassword"> // RABBIT: Invalid Tailwind class 'text-white-700' doesn't exist.
            Confirm Password
          </label>
          <input
            type="password"
            class={`w-full px-4 py-3 rounded-lg border ${passwordMismatch ? "border-red-500" : "border-gray-300"} text-white-900 focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 outline-none`} // RABBIT: Invalid Tailwind class 'text-white-900' doesn't exist.
            placeholder="Re-enter your password"
            required
            id="confirmPassword"
            name="confirmPassword"
            onInput={() => { // RABBIT: DOM access anti-pattern - using document.getElementById instead of controlled components with refs or state.
              const confirmPasswordInput = document.getElementById(
                "confirmPassword",
              ) as HTMLInputElement;
              const newPasswordInput = document.getElementById(
                "newPassword",
              ) as HTMLInputElement;
              setPasswordMismatch(
                confirmPasswordInput.value !== newPasswordInput.value,
              );
            }}
          />
          {passwordMismatch && (
            <p class="text-xs text-red-500">Passwords do not match</p>
          )}
        </div>

        <button id="formButton" class="btn w-full py-3 text-lg">
          Change Password
        </button>
      </form>
    </div>
  );
}
