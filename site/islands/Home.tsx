import NothingBurger from "./NothingBurger.tsx";
import { Game } from "./Game.tsx";
import { Web3D } from "./Web3D.tsx";
import { Button } from "../components/Button.tsx";

export function Home() {
  return (
    <div class="object-fill flex flex-col items-center justify-center">
      <NothingBurger />
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
