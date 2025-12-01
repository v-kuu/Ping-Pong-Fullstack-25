import { define } from "../utils.ts";
import { Login } from "../islands/Login.tsx";

export default define.page(() => {
  return (
    <main class="vt323-regular flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div class="w-full max-w-md p-8 bg-white rounded shadow-md">
        <h2 class="text-2xl font-bold mb-6 text-center">
          Hit Me With Your Best Shot!
        </h2>
        <Login />
      </div>
    </main>
  );
});
