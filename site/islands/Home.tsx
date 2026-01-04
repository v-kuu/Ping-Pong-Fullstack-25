import { Button } from "../components/Button.tsx";

export function Home() {
  return (
    <div class="object-fill flex flex-col items-center justify-center pixelify-sans-500">
      <div class="card prose prose-slate max-w-none font-extrabold backdrop-blur-2xl">
        <h1>Hi ya there</h1>
        <p>Welcome, we have games.</p>
      </div>
      <div class="menu gap-1">
        <div class="menu menu-horizontal gap-1">
          <div>
            <img src="/pong.gif" alt="Pong Game" />
          </div>
          <img src="/web3d.gif" alt="Web3D Game" />
        </div>
        <div class="w-full flex justify-between">
          <p>Pong</p>
          <p>&nbsp;&nbsp;Web3D</p>
        </div>
        <div class="w-full flex justify-center gap-10">
          <a href="/pong">
            <Button>Play PONG</Button>
          </a>
          <a href="/login">
            <Button>Login</Button>
          </a>
          <a href="/signup">
            <Button> Register </Button>
          </a>
          <a href="/game">
            <Button>Play Web3D</Button>
          </a>
          <p>
            Enjoy <br />
            stay!
          </p>
        </div>
      </div>
    </div>
  );
}
