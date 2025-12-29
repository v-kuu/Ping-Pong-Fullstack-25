import { useState } from "preact/hooks";

export function Login() {
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

      window.location.href = "/game";
    } catch (err: any) {
      setServerError(err.message);
    }
  };

  return (
    <form
      class="flex flex-col gap-4 rounded-box bg-base-200 p-6 max-w-md"
      onSubmit={handleSubmit}
    >
      <h1 class="text-3xl font-bold self-center">Hit Me With Your Best Shot!</h1>

      <span class="self-center">
        Don't have an account?
        <a class="link link-secondary" href="/signup">
          Register
        </a>
      </span>

      {serverError && <div class="alert alert-error">{serverError}</div>}

      <div class="space-y-1">
        <label class="label-text">Username</label>
        <input
          type="text"
          class="input input-bordered w-full"
          value={username}
          onInput={(e: any) => setUsername(e.target.value)}
          placeholder="AwesomeUser"
          autoComplete="username"
          required
        />
      </div>

      <div class="space-y-1">
        <label class="label-text">Password</label>
        <input
          type="password"
          class="input input-bordered w-full"
          value={password}
          onInput={(e: any) => setPassword(e.target.value)}
          placeholder="•••••••••"
          autoComplete="current-password"
          required
        />
      </div>

      <button class="btn btn-primary" type="submit">
        Login
      </button>
    </form>
  );
}
