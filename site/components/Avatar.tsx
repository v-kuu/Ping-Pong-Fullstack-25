import clsx from "clsx";

interface UserAvatarProps {
  username: string;
  class?: string;
  /** Cache-busting key (e.g., Date.now()) to force refresh */
  cacheKey?: number;
}

export function UserAvatar({ username, class: className, cacheKey }: UserAvatarProps) {
  const handleError = (e: Event) => {
    const img = e.currentTarget as HTMLImageElement;
    if (!img.src.endsWith("/avatar.png")) {
      img.src = "/avatar.png";
    }
  };

  // Auto cache-bust every 30 seconds if no explicit cacheKey provided
  const timeBucket = cacheKey || Math.floor(Date.now() / 30000);
  const avatarUrl = `/api/avatars/${username}?t=${timeBucket}`;

  return (
    <div class={clsx("w-12 h-12 rounded-full overflow-hidden bg-base-300", className)}>
      <img
        src={avatarUrl}
        alt={`${username}'s avatar`}
        class="w-full h-full object-cover"
        onError={handleError}
      />
    </div>
  );
}
