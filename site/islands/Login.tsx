import { useState } from "preact/hooks";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setServerError(null);

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);

      const res = await fetch("/api/login", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid email or password");
      }

      window.location.href = "/";
    } catch (err: any) {
      setServerError(err.message);
    }
  };

  return (
    <form
      class="flex flex-col gap-4 rounded-box bg-base-200 border border-base-content/20 p-6 max-w-md"
      onSubmit={handleSubmit}
    >
      <h1 class="text-3xl font-bold self-center">
        Hit Me With Your Best Shot!
      </h1>

      <span class="self-center">
        Don't have an account?&nbsp;
        <a class="link link-secondary" href="/signup">
          Register
        </a>
      </span>

      {serverError && <div class="alert alert-error">{serverError}</div>}

      <div class="space-y-1">
        <label class="label-text">Email
          <input
            type="email"
            class="input input-bordered w-full"
            value={email}
            onInput={(e: any) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            name="mail"
            required
          />
        </label>
      </div>

      <div class="space-y-1">
        <label class="label-text">Password
          <input
            type="password"
            class="input input-bordered w-full"
            value={password}
            onInput={(e: any) => setPassword(e.target.value)}
            placeholder="•••••••••"
            autoComplete="current-password"
            required
            name="password"
          />
        </label>
      </div>

      <button class="btn btn-primary" type="submit">
        Login
      </button>
    </form>
  );
}
