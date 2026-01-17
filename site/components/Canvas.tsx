// Pong canvas - stretches to fill container
export function CanvasPong() {
  return <canvas id="renderCanvas" class="w-full h-full" />;
}

// Web3D canvas - letterboxed to maintain aspect ratio
export function CanvasWeb3D() {
  return (
    <div class="w-full h-full flex items-center justify-center bg-black">
      <canvas
        id="renderCanvas"
        style="width: 100%; height: 100%; object-fit: contain;"
      />
    </div>
  );
}
