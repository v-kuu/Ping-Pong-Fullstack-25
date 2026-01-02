import NothingBurger from "./NothingBurger.tsx";
import { Game } from "./Game.tsx";
import { Web3D } from "./Web3D.tsx";
import { Button } from "../components/Button.tsx";
import exportedSignal from "../utils/game.ts";
import { signal } from "@preact/signals";
import { Show, useLiveSignal } from "@preact/signals/utils";

if (exportedSignal.value === undefined) {
  exportedSignal.value = 0;
}

export function Home() {
  const whatToRender = useLiveSignal(exportedSignal);
  return (
    <div class="object-fill flex flex-col items-center justify-center">
      <Show when={() => whatToRender.value.value === 0}>
        <NothingBurger />
        <br />
        <Button onClick={() => (exportedSignal.value = 1)}>
          Play PONG
        </Button>{" "}
        <br />
        <Button onClick={() => (exportedSignal.value = 2)}>Play Web3D</Button>
        <br />
        <Button>
          <a href="/login"> Login </a>
        </Button>
        <br />
        <a href="/signup">
          <Button> Register </Button>
        </a>
      </Show>
      <Show when={() => whatToRender.value.value === 1}>
        <Game />
      </Show>
      <Show when={() => whatToRender.value.value === 2}>
        <Web3D />
      </Show>
    </div>
  );
}
