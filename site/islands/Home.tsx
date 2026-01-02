import NothingBurger from "./NothingBurger.tsx";
import { Game } from "./Game.tsx";
import { Web3D } from "./Web3D.tsx";
import { Button } from "../components/Button.tsx";
import { signal } from "@preact/signals";
import { Show } from "@preact/signals/utils";

const whatToRender = signal<string>("");

export function Home(initialState: string) {
  whatToRender.value = initialState;
  return (
    <main>
      <Show when={whatToRender.value === ""}>
        <Button onClick={() => (whatToRender.value = "game")}>Play PONG</Button>
        <Button onClick={() => (whatToRender.value = "web3d")}>
          Play Web3D
        </Button>
        <NothingBurger />
      </Show>
      <Show when={whatToRender.value === "game"}>
        <Game />
      </Show>
      <Show when={whatToRender.value === "web3d"}>
        <Web3D />
      </Show>
    </main>
  );
}
