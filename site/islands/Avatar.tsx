import { useState, useRef, useEffect } from "preact/hooks";

interface AvatarProps {
  username: string;
}

export function NavAvatar({ username }: AvatarProps) {
  const [cacheKey, setCacheKey] = useState(Date.now());
  const [imgSrc, setImgSrc] = useState("/avatar.png");

  const customAvatarUrl = `/api/avatars/${username}`;

  // Pre-load custom avatar to check if it exists
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImgSrc(`${customAvatarUrl}?t=${cacheKey}`);
    };
    img.onerror = () => {
      setImgSrc("/avatar.png");
    };
    img.src = `${customAvatarUrl}?t=${cacheKey}`;
  }, [username, cacheKey, customAvatarUrl]);

  // Listen for avatar updates from the profile page
  useEffect(() => {
    const handleAvatarUpdate = () => {
      setCacheKey(Date.now());
    };

    window.addEventListener("avatar-updated", handleAvatarUpdate);
    return () => window.removeEventListener("avatar-updated", handleAvatarUpdate);
  }, []);

  return (
    <div class="w-10 h-10 rounded-full overflow-hidden bg-base-300">
      <img
        src={imgSrc}
        alt="Avatar"
        class="w-full h-full object-cover"
      />
    </div>
  );
}

export function ChangeAvatar({ username }: AvatarProps) {
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(`/api/avatars/${username}`);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [hasCustomAvatar, setHasCustomAvatar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAvatar, setCheckingAvatar] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cacheKey = useRef(Date.now());

  useEffect(() => {
    // Check if user has a custom avatar
    fetch("/api/avatar")
      .then((res) => res.json())
      .then((data) => {
        setHasCustomAvatar(data.hasCustomAvatar);
        setCurrentAvatarUrl(data.avatarUrl + `?t=${cacheKey.current}`);
      })
      .catch(console.error)
      .finally(() => setCheckingAvatar(false));
  }, []);

  const handleFileSelect = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: "error", text: "Invalid file type. Use PNG, JPEG, GIF, or WebP." });
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "File too large. Maximum size is 2MB." });
      return;
    }

    setSelectedFile(file);
    setMessage(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("avatar", selectedFile);

      const res = await fetch("/api/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        cacheKey.current = Date.now();
        setCurrentAvatarUrl(data.avatarUrl + `?t=${cacheKey.current}`);
        setHasCustomAvatar(true);
        setPreviewUrl(null);
        setSelectedFile(null);
        setMessage({ type: "success", text: "Avatar updated successfully!" });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        // Dispatch event for NavBar and Profile to update
        window.dispatchEvent(new CustomEvent("avatar-updated"));
      } else {
        setMessage({ type: "error", text: data.error || "Failed to upload avatar" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to upload avatar" });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setLoading(true);
    setMessage(null);
    setShowDeleteConfirm(false);

    try {
      const res = await fetch("/api/avatar", {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        cacheKey.current = Date.now();
        setCurrentAvatarUrl("/avatar.png");
        setHasCustomAvatar(false);
        setMessage({ type: "success", text: "Avatar removed. Using default avatar." });
        // Dispatch event for NavBar and Profile to update
        window.dispatchEvent(new CustomEvent("avatar-updated"));
      } else {
        setMessage({ type: "error", text: data.error || "Failed to remove avatar" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to remove avatar" });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPreview = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageError = () => {
    setCurrentAvatarUrl("/avatar.png");
    setHasCustomAvatar(false);
  };

  if (checkingAvatar) {
    return (
      <div class="w-full max-w-2xl">
        <div class="card bg-base-200 p-6">
          <div class="flex justify-center">
            <span class="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div class="w-full max-w-2xl">
      <div class="card bg-base-200 p-6">
        <h2 class="text-2xl font-bold mb-6">Change Avatar</h2>

        {/* Current/Preview Avatar Display */}
        <div class="flex flex-col items-center gap-6 mb-6">
          <div class="relative">
            <div class="w-40 h-40 rounded-full overflow-hidden ring-4 ring-base-300 shadow-xl">
              <img
                src={previewUrl || currentAvatarUrl}
                alt="Avatar"
                class="w-full h-full object-cover"
                onError={handleImageError}
              />
            </div>
            {previewUrl && (
              <div class="absolute -top-2 -right-2 badge badge-primary badge-lg">
                Preview
              </div>
            )}
          </div>

          <div class="text-center">
            <p class="text-lg font-medium">{username}</p>
            <p class="text-sm opacity-70">
              {previewUrl
                ? "Preview of new avatar"
                : hasCustomAvatar
                  ? "Custom avatar"
                  : "Default avatar"}
            </p>
          </div>
        </div>

        {/* File Input */}
        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text font-medium">Select new avatar</span>
            <span class="label-text-alt">PNG, JPEG, GIF, WebP (max 2MB)</span>
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
            onChange={handleFileSelect}
            class="file-input file-input-bordered file-input-primary w-full"
            disabled={loading}
          />
        </div>

        {/* Action Buttons */}
        <div class="flex flex-wrap gap-3 justify-center mt-6">
          {previewUrl ? (
            <>
              <button
                onClick={handleUpload}
                disabled={loading}
                class="btn btn-primary btn-wide"
              >
                {loading ? (
                  <>
                    <span class="loading loading-spinner loading-sm"></span>
                    Uploading...
                  </>
                ) : (
                  "Save Avatar"
                )}
              </button>
              <button
                onClick={handleCancelPreview}
                disabled={loading}
                class="btn btn-ghost"
              >
                Cancel
              </button>
            </>
          ) : (
            hasCustomAvatar && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
                class="btn btn-outline btn-error"
              >
                Remove Custom Avatar
              </button>
            )
          )}
        </div>

        {/* Status Messages */}
        {message && (
          <div
            class={`alert mt-6 ${
              message.type === "success" ? "alert-success" : "alert-error"
            }`}
          >
            <span>{message.text}</span>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div class="modal modal-open">
            <div class="modal-box">
              <h3 class="font-bold text-lg">Remove Custom Avatar?</h3>
              <p class="py-4">
                Your custom avatar will be deleted and replaced with the default avatar.
                This action cannot be undone.
              </p>
              <div class="modal-action">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  class="btn btn-ghost"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveAvatar}
                  class="btn btn-error"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span class="loading loading-spinner loading-sm"></span>
                      Removing...
                    </>
                  ) : (
                    "Remove"
                  )}
                </button>
              </div>
            </div>
            <div
              class="modal-backdrop"
              onClick={() => !loading && setShowDeleteConfirm(false)}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}
