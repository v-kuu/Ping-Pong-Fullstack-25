import { define } from "../utils.ts";
import PrivacyPolicy from "../components/PrivacyPolicy.tsx";

export default define.page(() => {
    return (
        <main>
            <div class="w-full max-w-md">
            <div class="center card">
                 <PrivacyPolicy />
            </div>
            </div>
        </main>
    );
});
