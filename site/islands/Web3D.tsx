import { Canvas } from "../components/Canvas.tsx";
import { useEffect } from "preact/hooks";

export function Web3D() {
  // Set up the canvas for low resolution rendering.
  useEffect(() => {
    // Set up the canvas for low resolution rendering.
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    canvas.style.imageRendering = "pixelated";
    canvas.width = 360;
    canvas.height = 200;
    const context = canvas.getContext("2d") as CanvasRenderingContext2D;

    (async () => {
      const wasmResponse = await fetch("/web3d.wasm");
      const wasmBytes = await wasmResponse.arrayBuffer();
      const { keydown, keyup, draw, init, memory } = (await WebAssembly.instantiate(wasmBytes)).instance.exports as any;

      const bytes = new Uint8Array(memory.buffer);
      const imageData = context.createImageData(canvas.width, canvas.height);
      const frameSize = canvas.width * canvas.height * 4;
      // Make a callback function for updating the frame  
      const render = (timestamp: DOMHighResTimeStamp) => {
        const frameAddr = draw(timestamp);
        imageData.data.set(bytes.subarray(frameAddr, frameAddr + frameSize));
        context.putImageData(imageData, 0, 0);
        requestAnimationFrame(render);
      };
      // Set up event handlers and render the first frame
      onkeydown = (event) => keydown(event.key.toUpperCase().charCodeAt(0));
      onkeyup = (event) => keyup(event.key.toUpperCase().charCodeAt(0));
      canvas.oncontextmenu = (event) => event.preventDefault();
      init(Date.now());
      render(performance.now());
    })();
  });
  return <Canvas />;
}
