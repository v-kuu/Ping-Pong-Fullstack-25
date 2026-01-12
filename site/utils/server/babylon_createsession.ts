import {
	Scene,
	NullEngine,
} from "@babylonjs/core"
import { setupServerEntities } from "./babylon_serverentities.ts"
import {
	GameState,
	setState
} from "../babylon_states.ts"

export function createSession(engine: NullEngine): Scene
{
	let scene = new Scene(engine);
	scene.collisionsEnabled = true;

	//entity setup
	setupServerEntities(scene);

	setState(GameState.Countdown, scene);
	return scene;
};
