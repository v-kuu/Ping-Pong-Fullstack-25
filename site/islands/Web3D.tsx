import { Canvas } from "../components/Canvas.tsx";
import { useEffect } from "preact/hooks";
import { draw, init, keyup, keydown, memory } from "../assets/web3d.wasm";

// This is a placeholder for the other game module
export function Web3D() {
  useEffect(() => {
    // Set up the canvas for low resolution rendering.
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    canvas.style.imageRendering = "pixelated";
    canvas.width = 360;
    canvas.height = 200;

    // Create a 2D rendering context.
    const context = canvas.getContext("2d") as CanvasRenderingContext2D;
    context.fillStyle = "#f0f";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const bytes = new Uint8Array(memory.buffer);

    // Make an ImageData object for updating the canvas.
    const imageData = context.createImageData(canvas.width, canvas.height);
    const frameSize = canvas.width * canvas.height * 4;
    // Make a callback function for updating the frame.
    const render = (timestamp: DOMHighResTimeStamp) => {
      const frameAddr = draw(timestamp);
      imageData.data.set(bytes.subarray(frameAddr, frameAddr + frameSize));
      context.putImageData(imageData, 0, 0);
      requestAnimationFrame(render);
    };

    // Set up event handlers and render the first frame.
    onkeydown = (event) => keydown(event.keyCode);
    onkeyup = (event) => keyup(event.keyCode);
    canvas.oncontextmenu = (event) => event.preventDefault();
    init(Math.random() * (1 << 31))
    render(performance.now());
  });
  return <Canvas />;
}
