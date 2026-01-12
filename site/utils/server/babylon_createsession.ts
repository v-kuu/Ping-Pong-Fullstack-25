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
		if (Globals.playerKeyUp) {
			Globals.vel1.z = distance;
			console.log("Up")
			Globals.playerKeyUp = !Globals.playerKeyUp;
		}
		if (Globals.playerKeyDown) {
			Globals.vel1.z = -distance
			console.log("Alas")
			Globals.playerKeyDown = !Globals.playerKeyDown;
		}
	});

	setState(GameState.Countdown, scene);
	return scene;
};
