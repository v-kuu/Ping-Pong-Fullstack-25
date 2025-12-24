import { EyeOpen, EyeClosed } from "../components/Icons.tsx";
import { useState } from "preact/hooks";
import { validatePassword, validatePasswordMatch } from "../utils/validation.ts";

export function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  function validateInput(e: Event) {
    if (!validatePasswordMatch(e)) {
      setPasswordMismatch(true);
    }
  }

  return (
    <div class="card">
      <form
        method="POST"
        action="/register"
        class="space-y-6"
        onSubmit={validateInput}
      >
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700" for="username">
            Username
          </label>
          <input
            type="text"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 outline-none"
            pattern="[A-Za-z][A-Za-z0-9\-]*"
            title="Only letters, numbers or dash, must start with a letter"
            minLength={3}
            maxLength={30}
            placeholder="AwesomeUser"
            id="username"
            name="username"
            required
          />
          <p class="text-xs text-gray-500">
            3-30 characters: letters, numbers or dash
          </p>
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700" for="email">
            Email
          </label>
          <input
            type="email"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 outline-none"
            placeholder="you@example.com"
            id="email"
            name="email"
            required
          />
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700" for="password">
            Password
          </label>
          <div class="relative">
            <input
              type={showPassword ? "text" : "password"}
              class="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 outline-none"
              minLength={8}
              pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
              title="Must be more than 8 characters, including number, lowercase letter, uppercase letter"
              placeholder="••••••••"
              id="password"
              name="password"
              required
              onInput={(e) => {
                const value = (e.target as HTMLInputElement).value;
                setPassword(value);
                setShowPasswordRequirements(
                  value.length > 0 && !validatePassword(value),
                );
              }}
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeClosed /> : <EyeOpen />}
            </button>
          </div>
          {showPasswordRequirements && (
            <ul class="text-xs text-red-500 space-y-1 ml-4 bg-red-50 p-2 rounded">
              <li>• 8+ characters</li>
              <li>• 1 number</li>
              <li>• 1 lowercase</li>
              <li>• 1 uppercase</li>
            </ul>
          )}
        </div>

        <div class="space-y-2">
          <label
            class="block text-sm font-medium text-gray-700"
            for="confirmPassword"
          >
            Confirm Password
          </label>
          <div class="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              class={`w-full px-4 py-3 pr-12 rounded-lg border ${passwordMismatch ? "border-red-500" : "border-gray-300"} text-gray-900 focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 outline-none`}
              placeholder="••••••••"
              required
              id="confirmPassword"
              name="confirmPassword"
              onInput={() => {
                const confirmPasswordInput = document.getElementById(
                  "confirmPassword",
                ) as HTMLInputElement;
                const passwordInput = document.getElementById(
                  "password",
                ) as HTMLInputElement;
                setPasswordMismatch(
                  confirmPasswordInput.value !== passwordInput.value,
                );
              }}
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeClosed /> : <EyeOpen />}
            </button>
          </div>
          {passwordMismatch && (
            <p class="text-xs text-red-500">Passwords do not match</p>
          )}
        </div>

        <button id="formButton" class="btn w-full py-3 text-lg">
          Create Account
        </button>
      </form>
    </div>
  );
}
