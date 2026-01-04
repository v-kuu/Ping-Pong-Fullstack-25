import { Button } from "../components/Button.tsx";

export function Home() {
  return (
    <div class="object-fill flex flex-col items-center justify-center">
      <div class="prose max-w-none items-center">
        <h1>Hi ya there</h1>
        <p>Welcome, we have games.</p>
      </div>
      <br />
      <a href="/pong">
        <Button>Play PONG</Button>
      </a>
      <br />
      <a href="/game">
        <Button>Play Web3D</Button>
      </a>
      <br />
      <Button>
        <a href="/login"> Login </a>
      </Button>
      <br />
      <a href="/signup">
        <Button> Register </Button>
      </a>
    </div>
  );
}
