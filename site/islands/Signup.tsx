import { useState } from "preact/hooks";
import {
  TextInput,
  EmailInput,
  PasswordInput,
  PasswordRules,
  UsernameRules,
  PasswordMatch,
  ErrorMessage,
  SuccessMessage,
} from "../components/Form";
import { validatePassword } from "../utils/validation";

export function Signup() {
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const checkRules = (val: string) => validatePassword(val);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setServerError(null);

    if (!checkRules(password) || password !== confirm) {
      setServerError("Please fix the password errors before submitting.");
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

  if (isSuccess) {
    return (
      <SuccessMessage onRedirect={() => (window.location.href = "/login")} />
    );
  }

  return (
    <div class="card">
      <form class="space-y-6" onSubmit={handleSubmit} novalidate>
        {serverError && <ErrorMessage message={serverError} />}

        <div class="space-y-2">
          <TextInput
            label="Username"
            name="username"
            value={username}
            onInput={setUsername}
            disabled={isSuccess}
            pattern="[A-Za-z][A-Za-z0-9\-]*"
            minLength={3}
            maxLength={30}
            placeholder="AwesomeUser"
            autoComplete="username"
            hint="3-30 characters: letters, numbers or dash"
          />
          <UsernameRules username={username} />
        </div>

        <EmailInput
          label="Email"
          name="email"
          value={email}
          onInput={setEmail}
          disabled={isSuccess}
          placeholder="you@example.com"
          autoComplete="email"
        />

        <div class="space-y-2">
          <PasswordInput
            label="Password"
            name="password"
            value={password}
            onInput={setPassword}
            disabled={isSuccess}
            placeholder="•••••••••"
            autoComplete="new-password"
            showPassword={showPass}
            onToggleShow={() => setShowPass(!showPass)}
          />
          <PasswordRules password={password} />
        </div>

        <div class="space-y-2">
          <PasswordInput
            label="Confirm Password"
            name="confirmPassword"
            value={confirm}
            onInput={setConfirm}
            disabled={isSuccess}
            placeholder="•••••••••"
            autoComplete="new-password"
            showPassword={showConfirm}
            onToggleShow={() => setShowConfirm(!showConfirm)}
          />
          <PasswordMatch password={password} confirmPassword={confirm} />
        </div>

        <button
          type="submit"
          class="btn w-full py-3 text-lg"
          disabled={isSuccess}
        >
          {isSuccess ? "Creating Account..." : "Create Account"}
        </button>
      </form>
    </div>
  );
}
