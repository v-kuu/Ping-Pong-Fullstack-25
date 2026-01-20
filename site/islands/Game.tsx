import earcut from "earcut";
// @ts-ignore
(globalThis as any).earcut = earcut;
import { Engine } from "@babylonjs/core";
import { useEffect } from "preact/hooks";
import { CanvasPong } from "../components/Canvas.tsx";
import { createScene } from "../utils/client/babylon_scene.ts";
import { Globals, ServerVars } from "../utils/shared/babylon_globals.ts";
import { updateScore } from "@/utils/client/babylon_ui.ts";
import { setState } from "../utils/client/babylon_states.ts"

export function Game({user}: {user: { id: number; username: string } | null}) {
  const username = user ? user.username : "Guest";
  const playerId = user ? user.id : 0;
	Globals.userName = username;
	useEffect(() => {
		const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
		const engine = new Engine(canvas, true, { stencil: true });
		const preventScroll = (e: WheelEvent) => e.preventDefault();
		canvas.addEventListener("wheel", preventScroll, { passive: false });

		const scene = createScene(engine, canvas);
		engine.runRenderLoop(() => scene.render());
		addEventListener("resize", () => engine.resize());

		// Open WebSocket
		const ws = new WebSocket("ws://" + location.hostname + ":3001/ws" + "?id=" + encodeURIComponent(playerId));

		ws.onopen = () => {
			console.log("Connected to server");
		};

		ws.onmessage = (e) => {
			const data = JSON.parse(e.data);
			if (data.type === "physics_sync") {
				let newState = data.ServerState;
				ServerVars.ballPos.copyFrom(newState.ballPos);
				ServerVars.p1Pos.copyFrom(newState.p1Pos);
				ServerVars.p2Pos.copyFrom(newState.p2Pos);

				if (ServerVars.score1 !== newState.score1) {
					ServerVars.score1 = newState.score1;
					updateScore(scene, 1);
				}
				if (ServerVars.score2 !== newState.score2) {
					ServerVars.score2 = newState.score2;
					updateScore(scene, 2);
				}
				if (ServerVars.currentState !== newState.currentState) {
					setState(newState.currentState, scene);
				}
			}
		}

		// Input handling
		const keys = new Set<string>();
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "w" || e.key === "s")
				keys.add(e.key)
		}
		const onKeyUp = (e: KeyboardEvent) => {
			keys.delete(e.key)
		}
		const sendInput = () => {
			if (ws.readyState !== WebSocket.OPEN)
				return;
			ws.send(JSON.stringify({
				type: "move",
				keys: Array.from(keys)
			}))
		};

		window.addEventListener("keydown", onKeyDown);
		window.addEventListener("keyup", onKeyUp);
		const inputInterval = setInterval(sendInput, 16);

		return () => {
			removeEventListener("resize", () => engine.resize());
			window.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("keyup", onKeyUp);
			clearInterval(inputInterval);
			engine.dispose();
			ws.close()
		};
	}, []);
	return <CanvasPong />;
}
