import {
	Scene,
	ArcRotateCamera,
	Engine,
	Vector3,
	Color4,
	DirectionalLight,
	CubeTexture,
	KeyboardEventTypes,
} from "@babylonjs/core"
import { Inspector } from "@babylonjs/inspector"
import { Control } from "@babylonjs/gui"
import { setupEntities } from "./babylon_entities.ts"
import { registerBuiltInLoaders } from "@babylonjs/loaders/dynamic"
import { Globals } from "./babylon_globals.ts"
import { createRectangle } from "./babylon_ui.ts"
import {
	GameState,
	setState
} from "./babylon_states.ts"
import { enablePostProcess } from "./babylon_postprocess.ts"

export function createScene(engine: Engine, canvas: HTMLCanvasElement): Scene
{
	registerBuiltInLoaders();
	let scene = new Scene(engine);
	const envTexture = new CubeTexture("/clouds.env", scene);
	let helper = scene.createDefaultEnvironment({
		environmentTexture: envTexture,
		createSkybox: false,
	});
	if (helper && helper.ground)
		helper.ground.dispose();
	scene.collisionsEnabled = true;
	scene.environmentIntensity = 3.0;
	scene.clearColor = new Color4(0, 0, 0, 0);

	//camera setup
	let camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 6, 15, new Vector3(0, 0, 0), scene);
	camera.attachControl(canvas, true);
	camera.lowerBetaLimit = camera.upperBetaLimit = camera.beta;
	camera.lowerAlphaLimit = camera.upperAlphaLimit = camera.alpha;
	camera.panningAxis = new Vector3(1, 1, 0);
	camera.panningSensibility = 1e3;

	//light setup
	const light = new DirectionalLight("light", new Vector3(-0.7, -1, -0.5), scene);
	light.autoCalcShadowZBounds = true;
	light.intensity = 1.0;

	//entity setup
	setupEntities(light, scene);

	//input setup
	const keys = {};
	let inspectorVisible: boolean = false;
	let togglePAvailable: boolean = true;
	window.addEventListener("keydown", (e) => keys[e.key] = true);
	window.addEventListener("keyup", (e) => keys[e.key] = false);
	scene.onBeforeRenderObservable.add(() => {
		const delta = scene.getEngine().getDeltaTime() / 1e3;
		const distance = Globals.moveSpeed * delta;
		Globals.vel1 = new Vector3();
		Globals.vel2 = new Vector3();
		if (keys["w"]) {
			Globals.vel1.z = distance;
		}
		if (keys["s"]) {
			Globals.vel1.z = -distance
		}
		if (keys["i"]) {
			Globals.vel2.z = distance;
		}
		if (keys["k"]) {
			Globals.vel2.z = -distance;
		}
		if (keys["f"]) {
			canvas.requestFullscreen();
		}
		if (keys["p"] && togglePAvailable) {
			inspectorVisible ? Inspector.Show(scene, {}) : Inspector.Hide();
			inspectorVisible = !inspectorVisible;
			togglePAvailable = false;
		}
		if (!keys["p"]) {
			togglePAvailable = true;
		}
	});

	//gui
	createRectangle().verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

	enablePostProcess(scene, envTexture);
	setState(GameState.Countdown, scene);
	return scene;
};
