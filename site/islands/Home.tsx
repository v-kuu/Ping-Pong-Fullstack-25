import { VideoCard } from "@/components/Card.tsx";

interface Props {
  user?: { username: string } | null;
}

export function Home({ user }: Props) {
  if (user) {
    return (
      <div class="justify-center items-center text-center prose max-w-none gap-2 pixelify-sans-500">
        <div class="backdrop-blur-3xl">
          <h1>Welcome back, {user.username}</h1>
          <p>Ready to play?</p>
        </div>
        <div class="flex justify-center gap-4">
          <VideoCard title="Pong" url="pong.mp4" link="/pong" clickable={true} />
          <VideoCard title="Web3D" url="web3d.mp4" link="/game" clickable={true} />
        </div>
      </div>
    );
  }

  return (
    <div class="justify-center items-center text-center prose max-w-none gap-2 pixelify-sans-500 pt-8">
      <div class="backdrop-blur-3xl">
        <h1 class="text-7xl">
          <span class="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Pong</span>
          {" x "}
          <span class="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">Web3D</span>
        </h1>
        <div class="flex gap-4 justify-center mb-4">
          <a href="/signup" class="btn btn-primary">Sign up</a>
          <a href="/login" class="btn btn-ghost">Log in</a>
        </div>
      </div>
      <div class="flex justify-center gap-4">
        <VideoCard title="Pong" url="pong.mp4" link="/pong" clickable={false} />
        <VideoCard title="Web3D" url="web3d.mp4" link="/game" clickable={false} />
      </div>
    </div>
  );
}
