import earcut from "earcut";
// @ts-ignore
(globalThis as any).earcut = earcut;
import { Engine } from "@babylonjs/core";
import { useEffect } from "preact/hooks";
import { Canvas } from "../components/Canvas.tsx";
import { createScene } from "../utils/client/babylon_scene.ts";
import { Globals } from "../utils/shared/babylon_globals.ts";

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

    // Open WebSocket
    const ws = new WebSocket("ws://" + location.hostname + ":3001/ws");
    // const ws = new WebSocket("ws://localhost:3001/ws");

    ws.onopen = () => {
        console.log("Connected to server");
    };

    ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === "physics_sync") {
			Globals.ballVel._x = data.ballVel._x;
			Globals.ballVel._y = data.ballVel._y;
			Globals.ballVel._z = data.ballVel._z;

			Globals.vel1._x = data.vel1._x;
			Globals.vel1._y = data.vel1._y;
			Globals.vel1._z = data.vel1._z;

			Globals.vel2._x = data.vel2._x;
			Globals.vel2._y = data.vel2._y;
			Globals.vel2._z = data.vel2._z;
        }
    }

    // Input handling
    const handleKey = (e: KeyboardEvent) => {
        if (ws.readyState !== WebSocket.OPEN)
            return;
        if (e.key === "w")
            ws.send(JSON.stringify({ type: "move", direction: "up" }));
        if (e.key === "s")
            ws.send(JSON.stringify({ type: "move", direction: "down" }));
    }

    window.addEventListener("keydown", handleKey);

    return () => {
      removeEventListener("resize", () => engine.resize());
      window.removeEventListener("keydown", handleKey);
      engine.dispose();
      ws.close()
    };
  }, []);
  return <Canvas />;
}
