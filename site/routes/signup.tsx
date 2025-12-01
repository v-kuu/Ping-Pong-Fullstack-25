import { define } from "../utils.ts";
import { Signup } from "../islands/Signup.tsx";

export default define.page(() => {
  return (
    <main class="vt323-regular flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div class="w-full max-w-md p-8 bg-white rounded shadow-md">
        <h2 class="text-2xl font-bold mb-6 text-center">Gi'mme the Deeds</h2>
        <Signup />
      </div>
    </main>
  );
});
