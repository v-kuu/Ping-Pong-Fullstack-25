import earcut from "earcut";
(globalThis as any).earcut = earcut;
import { Engine } from "@babylonjs/core";
import { useEffect } from "preact/hooks";
import { Canvas } from "../components/Canvas.tsx";
import { createScene } from "../utils/babylon_scene.ts";

export function Game() {
  useEffect(() => {
    const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
    const engine = new Engine(canvas, true, { stencil: true });
    addEventListener("wheel", (e) => e.preventDefault(), { passive: false });
    //debug info
    const gl = engine._gl;
    if (gl) {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        console.log("GPU Vendor: ", vendor);
        console.log("GPU Renderer: ", renderer);
      } else
        console.log("WEBGL_debug_renderer_info not supported by this browser");
    }

    const scene = createScene(engine, canvas);
    engine.runRenderLoop(() => scene.render());
    addEventListener("resize", () => engine.resize());

    return () => {
      removeEventListener("resize", () => engine.resize());
      engine.dispose();
    };
  }, []);
  return <Canvas />;
}
