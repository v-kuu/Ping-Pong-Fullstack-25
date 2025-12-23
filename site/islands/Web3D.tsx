import { Canvas } from "../components/Canvas.tsx";
import { useEffect, useRef } from "preact/hooks";

interface WasmModule {
  init: (seed: number) => void;
  draw: (timestamp: number) => number;
  keydown: (keycode: number) => void;
  keyup: (keycode: number) => void;
  memory: WebAssembly.Memory;
}

export function Web3D() {
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
