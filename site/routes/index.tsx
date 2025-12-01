import { Head } from "fresh/runtime";
import { define } from "../utils.ts";
import { Game } from "../islands/Game.tsx";

export default define.page(function Home(ctx) {
  return (
    <div class="px-4 py-8 mx-auto fresh-gradient2 min-h-screen">
      <Head>
        <title>P O N G </title>
      </Head>
      <Game />
    </div>
  );
});
