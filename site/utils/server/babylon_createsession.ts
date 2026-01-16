import {
	Scene,
	NullEngine,
	ArcRotateCamera,
	Vector3,
} from "@babylonjs/core"
import { setupServerEntities } from "./babylon_serverentities.ts"
import {
	setState
} from "./babylon_serverstates.ts"
import { GameState, Globals } from "../shared/babylon_globals.ts"

export function createSession(engine: NullEngine): Scene
{
	let scene = new Scene(engine);
	scene.collisionsEnabled = true;

	//entity setup
	setupServerEntities(scene);

	//camera setup
	let camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 6, 15, new Vector3(0, 0, 0), scene);

	//input setup
	scene.onBeforeRenderObservable.add(() => {
		const delta = engine.getDeltaTime() / 1e3;
		const distance = Globals.moveSpeed * delta;
		Globals.vel1 = new Vector3();
		Globals.vel2 = new Vector3();
		if (Globals.player1KeyUp) {
			Globals.vel1.z = distance;
		}
		if (Globals.player1KeyDown) {
			Globals.vel1.z -= distance;
		}
		if (Globals.player2KeyUp) {
			Globals.vel2.z = distance;
		}
		if (Globals.player2KeyDown) {
			Globals.vel2.z -= distance;
		}
	});

	setState(GameState.Countdown, scene);
	return scene;
};
