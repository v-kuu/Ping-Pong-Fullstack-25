import { useState } from "preact/hooks";
import { validatePassword, validateEmail } from "../utils/validation.ts";
import { SuccessCard } from "@/components/Card.tsx";

export function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setServerError(null);

    if (!validateEmail(email)) {
      setServerError("Invalid email format.");
      return;
    }

    if (!validatePassword(password) || password !== confirm) {
      setServerError(
        "Password must be at least 12 characters and strong enough.",
      );
      return;
    }

    if (!acceptedTerms) {
      setServerError("You must accept the Terms of Service to register.");
      return;
    }

    if (!acceptedPrivacy) {
      setServerError("You must accept the Privacy Policy to register.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("confirmPassword", confirm);

      const res = await fetch("/api/register", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setIsSuccess(true);
    } catch (err: any) {
      setServerError(err.message);
    }
  };

  return isSuccess ? (
    <SuccessCard
      title="Account Created!"
      message="Your account has been successfully registered."
      buttonText="Go to Login"
      buttonHref="/login"
    />
  ) : (
    <form
      class="flex flex-col gap-4 rounded-box bg-base-200 border border-base-content/20 p-6 max-w-md"
      onSubmit={handleSubmit}
    >
      <h1 class="text-3xl font-bold self-center">Gi'mme the Deeds</h1>

      <span class="self-center">
        Already have an account?&nbsp;
        <a class="link link-secondary" href="/login">
          Log in
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
          pattern="[A-Za-z][A-Za-z0-9\-]*"
          minLength={3}
          maxLength={30}
          required
        />
      </div>

      <div class="space-y-1">
        <label class="label-text">Email</label>
        <input
          type="email"
          class="input input-bordered w-full"
          value={email}
          onInput={(e: any) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
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
          autoComplete="new-password"
          required
        />
      </div>

      <div class="space-y-1">
        <label class="label-text">Confirm password</label>
        <input
          type="password"
          class="input input-bordered w-full"
          value={confirm}
          onInput={(e: any) => setConfirm(e.target.value)}
          placeholder="•••••••••"
          autoComplete="new-password"
          required
        />
      </div>

      <label class="label cursor-pointer justify-start gap-2">
        <input
          type="checkbox"
          class="checkbox checkbox-sm"
          checked={acceptedTerms}
          onChange={(e: any) => setAcceptedTerms(e.target.checked)}
        />
        <span class="label-text text-sm">
          I accept the{" "}
          <a
            href="/terms-of-service"
            class="link link-secondary"
            target="_blank"
          >
            Terms of Service
          </a>
        </span>
      </label>
      <label class="label cursor-pointer justify-start gap-2">
        <input
          type="checkbox"
          class="checkbox checkbox-sm"
          checked={acceptedPrivacy}
          onChange={(e: any) => setAcceptedPrivacy(e.target.checked)}
        />
        <span class="label-text text-sm">
          I accept the{" "}
          <a href="/privacy-policy" class="link link-secondary" target="_blank">
            Privacy Policy
          </a>
        </span>
      </label>

      <button class="btn btn-primary" type="submit">
        Create
      </button>
    </form>
  );
}
