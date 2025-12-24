import { EyeOpen, EyeClosed } from "../components/Icons.tsx";
import { useState } from "preact/hooks";

export function Login() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div class="card">
      <form method="POST" action="/login" class="space-y-6">
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
              placeholder="••••••••"
              id="password"
              name="password"
              required
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeClosed /> : <EyeOpen />}
            </button>
          </div>
        </div>

        <button id="formButton" class="btn w-full py-3 text-lg">
          Login
        </button>
      </form>
    </div>
  );
}
