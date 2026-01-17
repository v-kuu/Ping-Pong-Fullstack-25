import { VideoCard } from "@/components/Card.tsx";

export function Home() {
  return (
    <div class="justify-center items-center text-center prose max-w-none gap-2 pixelify-sans-500">
      <div class="backdrop-blur-3xl">
        <h1>Hi ya there</h1>
        <p>Welcome, we have games.</p>
      </div>
      <div class="flex justify-center gap-4">
        <VideoCard title="Pong" url="pong.mp4" link="/pong" />
        <VideoCard title="Web3D" url="web3d.mp4" link="/game" />
      </div>
    </div>
  );
}
