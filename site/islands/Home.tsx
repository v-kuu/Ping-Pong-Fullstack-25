import { Button } from "../components/Button.tsx";

export function Home() {
  return (
    <div class="object-fill flex flex-col items-center justify-center">
      <div class="prose max-w-none items-center">
        <h1>Hi ya there</h1>
        <p>Welcome, we have games.</p>
      </div>
      <div class="menu">
        <a href="/pong">
          <img src="/pong.gif" alt="Pong Game" />
        </a>
        <Button>Play PONG</Button>
        <a href="/game">
          <img src="/web3d.gif" alt="Web3D Game" />
        </a>
        <Button>Play Web3D</Button>
        <br />
        <div class="w-full flex justify-center">
          <a href="/login">
            <Button>Login</Button>
          </a>
          <a href="/signup">
            <Button> Register </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
