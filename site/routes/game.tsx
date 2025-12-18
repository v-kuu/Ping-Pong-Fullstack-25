import { Head } from "fresh/runtime";
import { define } from "../utils.ts";
import { Web3D } from "../islands/Web3D.tsx";

export default define.page(() => {
  return (
    <div class="px-4 py-8 mx-auto fresh-gradient min-h-screen">
      <Head>
        <title>W E B 3 D</title>
      </Head>
      <Web3D />
    </div>
  );
});
