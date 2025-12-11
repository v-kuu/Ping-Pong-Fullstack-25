import { define } from "../utils.ts";
import ToS from "../components/ToS.tsx";

export default define.page(() => {
    return (
        <main>
            <div class="w-full max-w-md">
              <div class="center card">
                <ToS />
              </div>
            </div>
        </main>
    )
});
