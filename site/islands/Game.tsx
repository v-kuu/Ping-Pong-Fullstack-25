import {
	Scene,
	ArcRotateCamera,
	Engine,
	Vector3,
	Color3,
	DirectionalLight,
	MeshBuilder,
	CascadedShadowGenerator,
	HighlightLayer
} from "@babylonjs/core"
import { useEffect } from "preact/hooks"

export function Game() {
	useEffect(() => {
	const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
	const engine = new Engine(canvas, true, { stencil: true});

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

	function createScene(): Scene
	{
		var scene = new Scene(engine);

		//camera setup
		var camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 6, 20, new Vector3(0, 0, 0), scene);
		camera.attachControl(canvas, true);
		camera.lowerBetaLimit = camera.upperBetaLimit = camera.beta;
		camera.lowerAlphaLimit = camera.upperAlphaLimit = camera.alpha;
		camera.panningAxis = new Vector3(1, 1, 0);
		camera.panningSensibility = 1e3;

		//light setup
		const light = new DirectionalLight("light", new Vector3(-0.7, -1, -0.5), scene);
		light.autoCalcShadowZBounds = true;
		light.intensity = 0.7;

		//entity setup
		var sphere = MeshBuilder.CreateSphere("sphere", { diameter: 0.5, segments: 32 }, scene);
		sphere.position.y = 0.25;
		var ground = MeshBuilder.CreateGround("ground", { width: 12, height: 6 }, scene);
		ground.receiveShadows = true;
		var box1 = MeshBuilder.CreateBox("player1", { width: 0.5, height: 0.3, depth: 3 }, scene);
		box1.position.x = -6;
		box1.position.y = 0.2;
		var box2 = MeshBuilder.CreateBox("player2", { width: 0.5, height: 0.3, depth: 3 }, scene);
		box2.position.x = 6;
		box2.position.y = 0.2;

		//highlight layer
		const hl = new HighlightLayer("hl1", scene);
		hl.addMesh(box1, Color3.Blue());
		hl.addMesh(box2, Color3.Red());

		//shadow setup
		const csm = new CascadedShadowGenerator(4096, light);
		csm.autoCalcDepthBounds = true;
		csm.addShadowCaster(sphere);
		csm.addShadowCaster(box1);
		csm.addShadowCaster(box2);

		//input setup
		const keys = {};
		window.addEventListener("keydown", (e) => keys[e.key] = true);
		window.addEventListener("keyup", (e) => keys[e.key] = false);
		const moveSpeed = 6;
		scene.onBeforeRenderObservable.add(() => {
			const delta = scene.getEngine().getDeltaTime() / 1e3;
			const distance = moveSpeed * delta;
			if (keys["w"]) {
				box1.position.z += distance;
			}
			if (keys["s"]) {
				box1.position.z -= distance;
			}
			if (keys["i"]) {
				box2.position.z += distance;
			}
			if (keys["k"]) {
				box2.position.z -= distance;
			}
		});
		return scene;
	};

	const scene = createScene();
	engine.runRenderLoop(() => scene.render());
	window.addEventListener("resize", () => engine.resize());
	
	return () => {
		window.removeEventListener("resize", () => engine.resize());
		engine.dispose();
	}
	}, []);
	return <canvas id="renderCanvas" class="w-full h-screen border-0" />;
}
