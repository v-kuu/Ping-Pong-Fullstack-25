import { useState } from "preact/hooks";
import { TextInput, PasswordInput, ErrorMessage } from "../components/Form.tsx";

export function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setServerError(null);

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);

      const res = await fetch("/api/login", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid username or password");
      }

      // Login successful, redirect to Web3D game
      window.location.href = "/game";
    } catch (err: any) {
      setServerError(err.message);
    }
  };

  return (
    <div class="card">
      <form class="space-y-6" onSubmit={handleSubmit} novalidate>
        {serverError && <ErrorMessage message={serverError} />}

        <TextInput
          label="Username"
          name="username"
          value={username}
          onInput={setUsername}
          pattern="[A-Za-z][A-Za-z0-9\-]*"
          minLength={3}
          maxLength={30}
          placeholder="AwesomeUser"
          autoComplete="username"
        />

        <PasswordInput
          label="Password"
          name="password"
          value={password}
          onInput={setPassword}
          placeholder="•••••••••"
          autoComplete="current-password"
          showPassword={showPassword}
          onToggleShow={() => setShowPassword(!showPassword)}
        />

        <button type="submit" class="btn w-full py-3 text-lg">
          Login
        </button>
      </form>
    </div>
  );
}
