import {
	Scene,
	NullEngine,
	ArcRotateCamera,
	Vector3,
} from "@babylonjs/core"
import { setupServerEntities } from "./babylon_serverentities.ts"
import {
	GameState,
	setState
} from "./babylon_serverstates.ts"
import { Globals } from "../shared/babylon_globals.ts"

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
			// console.log("P1 Up")
		}
		if (Globals.player1KeyDown) {
			Globals.vel1.z = -distance
			// console.log("P1 Down")
		}
		if (Globals.player2KeyUp) {
			Globals.vel2.z = distance;
			// console.log("P2 Up")
		}
		if (Globals.player2KeyDown) {
			Globals.vel2.z = -distance
			// console.log("P2 Down")
		}
		Globals.player1KeyUp = false;
		Globals.player1KeyDown = false;
		Globals.player2KeyUp = false;
		Globals.player2KeyDown = false;
	});

	setState(GameState.Countdown, scene);
	return scene;
};
