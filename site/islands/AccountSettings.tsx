import { validateUsername, validateEmail } from "../utils/validation.ts";
import { useState, useEffect } from "preact/hooks";

interface AccountSettingsProps {
  username: string;
  email: string;
}

export function AccountSettings({ username, email }: AccountSettingsProps) {
  const [usernameValue, setUsernameValue] = useState(username);
  const [emailValue, setEmailValue] = useState(email);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");

  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null);

  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [initialUsername] = useState(username);
  const [initialEmail] = useState(email);

  useEffect(() => {
    if (usernameValue !== initialUsername) {
      if (!validateUsername(usernameValue)) {
        setUsernameError("Username must be 3-30 chars, start with letter");
      } else {
        setUsernameError(null);
      }
    } else {
      setUsernameError(null);
    }
  }, [usernameValue, initialUsername]);

  useEffect(() => {
    if (emailValue !== initialEmail) {
      if (!validateEmail(emailValue)) {
        setEmailError("Invalid email format");
      } else {
        setEmailError(null);
      }
    } else {
      setEmailError(null);
    }
  }, [emailValue, initialEmail]);

  useEffect(() => {
    if (newPassword.length > 0) {
      setShowPasswordRequirements(true);
      if (newPassword.length < 12) {
        setPasswordError("12+ characters required");
      } else {
        setPasswordError(null);
      }
    } else {
      setShowPasswordRequirements(false);
    }
  }, [newPassword]);

  useEffect(() => {
    if (confirmPassword.length > 0) {
      setPasswordMismatch(newPassword !== confirmPassword);
    } else {
      setPasswordMismatch(false);
    }
  }, [confirmPassword, newPassword]);

  const hasChanges = () => {
    return (
      usernameValue !== initialUsername ||
      emailValue !== initialEmail ||
      newPassword.length > 0
    );
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setMessage(null);
    setCurrentPasswordError(null);

    if (!currentPassword) {
      setCurrentPasswordError("Current password required");
      return;
    }

    if (usernameError || emailError || passwordError || passwordMismatch) {
      setMessage({ type: "error", text: "Fix errors above" });
      return;
    }

    if (!hasChanges()) {
      setMessage({ type: "error", text: "No changes to save" });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("currentPassword", currentPassword);
      if (usernameValue !== initialUsername) {
        formData.append("newUsername", usernameValue);
      }
      if (emailValue !== initialEmail) {
        formData.append("newEmail", emailValue);
      }
      if (newPassword.length > 0) {
        formData.append("newPassword", newPassword);
      }

      const res = await fetch("/api/account", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Account updated!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        if (data.newUsername && data.newUsername !== initialUsername) {
          window.dispatchEvent(new CustomEvent("username-updated", { detail: { newUsername: data.newUsername } }));
        }
        if (data.avatarRenamed) {
          window.dispatchEvent(new CustomEvent("avatar-updated"));
        }
      } else {
        if (data.error === "Invalid current password") {
          setCurrentPasswordError("Current password incorrect");
        } else if (data.error?.includes("Username")) {
          setUsernameError(data.error);
        } else if (data.error?.includes("email")) {
          setEmailError(data.error);
        } else {
          setMessage({ type: "error", text: data.error || "Update failed" });
        }
      }
    } catch {
      setMessage({ type: "error", text: "Update failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="w-full max-w-md">
      <form
        class="flex flex-col gap-4 rounded-box bg-base-200 border border-base-content/20 p-6"
        onSubmit={handleSubmit}
        action="/api/account"
        method="POST"
      >
        <h2 class="text-2xl font-bold">Account Settings</h2>

        {message && (
          <div class={`alert ${message.type === "success" ? "alert-success" : "alert-error"}`}>
            <span>{message.text}</span>
          </div>
        )}

        <div class="space-y-1">
          <label class="label-text">Username</label>
          <input
            type="text"
            class={`input input-bordered w-full ${usernameError ? "input-error" : ""}`}
            value={usernameValue}
            onInput={(e: any) => setUsernameValue(e.target.value)}
            pattern="[A-Za-z][A-Za-z0-9\-]*"
            minLength={3}
            maxLength={30}
          />
          {usernameError && <p class="text-xs text-error">{usernameError}</p>}
        </div>

        <div class="space-y-1">
          <label class="label-text">Email</label>
          <input
            type="email"
            class={`input input-bordered w-full ${emailError ? "input-error" : ""}`}
            value={emailValue}
            onInput={(e: any) => setEmailValue(e.target.value)}
          />
          {emailError && <p class="text-xs text-error">{emailError}</p>}
        </div>

        <div class="divider my-1">Change Password</div>

        <div class="space-y-1">
          <label class="label-text">New Password</label>
          <input
            type="password"
            class={`input input-bordered w-full ${passwordError ? "input-error" : ""}`}
            value={newPassword}
            onInput={(e: any) => setNewPassword(e.target.value)}
            placeholder="Leave blank to keep current"
          />
          {showPasswordRequirements && (
            <p class="text-xs text-error">12+ chars and strong enough</p>
          )}
        </div>

        {newPassword.length > 0 && (
          <div class="space-y-1">
            <label class="label-text">Confirm New Password</label>
            <input
              type="password"
              class={`input input-bordered w-full ${passwordMismatch ? "input-error" : ""}`}
              value={confirmPassword}
              onInput={(e: any) => setConfirmPassword(e.target.value)}
            />
            {passwordMismatch && <p class="text-xs text-error">Passwords do not match</p>}
          </div>
        )}

        <div class="divider my-1">Verify Identity</div>

        <div class="space-y-1">
          <label class="label-text">Current Password</label>
          <input
            type="password"
            class={`input input-bordered w-full ${currentPasswordError ? "input-error" : ""}`}
            value={currentPassword}
            onInput={(e: any) => {
              setCurrentPassword(e.target.value);
              setCurrentPasswordError(null);
            }}
          />
          {currentPasswordError && <p class="text-xs text-error">{currentPasswordError}</p>}
        </div>

        <button
          type="submit"
          class="btn btn-primary mt-2"
          disabled={loading || !hasChanges()}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
