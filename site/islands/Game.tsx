import earcut from "earcut";
// @ts-ignore
(globalThis as any).earcut = earcut;
import { Engine } from "@babylonjs/core";
import { useEffect } from "preact/hooks";
import { Canvas } from "../components/Canvas.tsx";
import { createScene } from "../utils/babylon_scene.ts";
import { Globals } from "../utils/babylon_globals.ts";

export function Game(username: string) {
	Globals.userName = username;
	useEffect(() =>
	{
		const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
		const engine = new Engine(canvas, true, { stencil: true });
		const preventScroll = (e: WheelEvent) => e.preventDefault();
		canvas.addEventListener("wheel", preventScroll, { passive: false });

		//debug info
		const gl = engine._gl;
		if (gl)
		{
			const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
			if (debugInfo)
			{
				const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
				const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
				console.log("GPU Vendor: ", vendor);
				console.log("GPU Renderer: ", renderer);
			}
			else
				console.log("WEBGL_debug_renderer_info not supported by this browser");
		}

		const scene = createScene(engine, canvas);
		engine.runRenderLoop(() => scene.render());
		addEventListener("resize", () => engine.resize());

		return () =>
		{
			removeEventListener("resize", () => engine.resize());
			engine.dispose();
		};
	}, []);
	return <Canvas />;
}
