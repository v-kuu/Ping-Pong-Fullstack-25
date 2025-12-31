export function LogoutSuccess() {
  return (
    <div class="card text-center py-10 space-y-4">
      <div class="mx-auto w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center text-3xl">
        ✓
      </div>
      <h2 class="text-3xl font-bold text-white">Logged Out!</h2>
      <p class="text-gray-300">
        You have been successfully logged out.
      </p>
      <div class="flex flex-col gap-2 w-full mt-4">
        <a href="/game" class="btn btn-primary w-full py-3">
          Play Game
        </a>
      </div>
    </div>
  );
}
