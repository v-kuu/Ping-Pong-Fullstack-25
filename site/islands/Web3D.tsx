import { Canvas } from "../components/Canvas.tsx";
<<<<<<< HEAD
import { useEffect, useRef } from "preact/hooks";

interface WasmModule {
  init: (seed: number) => void;
  draw: (timestamp: number) => number;
  keydown: (keycode: number) => void;
  keyup: (keycode: number) => void;
  memory: WebAssembly.Memory;
}
=======
import { useEffect } from "preact/hooks";
import { draw, init, keyup, keydown, memory } from "../assets/web3d.wasm";
>>>>>>> main

export function Web3D() {
<<<<<<< HEAD
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wasmRef = useRef<WasmModule | null>(null);

  useEffect(() => {
    const loadWasm = async () => {
      try {
        const wasmResponse = await fetch('/web3d.wasm');
        const wasmBytes = await wasmResponse.arrayBuffer();
        const wasmInstance = await WebAssembly.instantiate(wasmBytes);
        const wasm = wasmInstance.instance.exports as unknown as WasmModule;
        
        if (!wasm.init || !wasm.draw || !wasm.memory) {
          console.error('WASM module missing required exports');
          return;
        }

        wasmRef.current = wasm;
        wasm.init(Date.now());

        // Set up rendering
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = 360;
        canvas.height = 200;
        
        const bytes = new Uint8Array(wasm.memory.buffer);
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        const frameSize = canvas.width * canvas.height * 4;

        // Keyboard event handlers
        const handleKeyDown = (e: KeyboardEvent) => {
          if (wasmRef.current) {
            wasmRef.current.keydown(e.keyCode);
          }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
          if (wasmRef.current) {
            wasmRef.current.keyup(e.keyCode);
          }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Rendering loop
        const render = (timestamp: DOMHighResTimeStamp) => {
          if (wasmRef.current) {
            const frameAddr = wasmRef.current.draw(timestamp);
            if (frameAddr > 0) {
              imageData.data.set(bytes.subarray(frameAddr, frameAddr + frameSize));
              ctx.putImageData(imageData, 0, 0);
            }
          }
          requestAnimationFrame(render);
        };

        requestAnimationFrame(render);

        return () => {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
        };
      } catch (error) {
        console.error('Failed to load WASM:', error);
      }
    };

    loadWasm();
  }, []);

  return <Canvas ref={canvasRef} />;
}
=======
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
>>>>>>> main
