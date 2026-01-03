import { useState, useEffect } from "preact/hooks";

interface NavAvatarProps {
  username: string;
}

export function NavAvatar({ username }: NavAvatarProps) {
  const [cacheKey, setCacheKey] = useState(Date.now());
  const [imgSrc, setImgSrc] = useState("/avatar.png");

  const customAvatarUrl = `/avatars/${username}.png`;

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
