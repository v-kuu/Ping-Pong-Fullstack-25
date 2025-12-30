import {
	Scene,
	ArcRotateCamera,
	Engine,
	Vector3,
	Color3,
	Color4,
	DirectionalLight,
	MeshBuilder,
	CascadedShadowGenerator,
	HighlightLayer,
	PBRMetallicRoughnessMaterial,
	CubeTexture,
	ImportMeshAsync,
} from "@babylonjs/core"
import {
	MarbleProceduralTexture,
	FireProceduralTexture,
	WoodProceduralTexture,
} from "@babylonjs/procedural-textures"
import * as GUI from "@babylonjs/gui"
import { startCountdown } from "./babylon_countdown.ts"
import { GameState } from "./babylon_states.ts"
import { registerBuiltInLoaders } from "@babylonjs/loaders/dynamic"

export function createScene(engine: Engine, canvas: HTMLCanvasElement): Scene
{
	registerBuiltInLoaders();
	let scene = new Scene(engine);
	const pmMat = loadTexture("painted_metal/xeutbhl_tier_3.gltf", scene);
	const envTexture = new CubeTexture("/alien.env", scene);
	let helper = scene.createDefaultEnvironment({
		environmentTexture: envTexture,
		skyboxTexture: envTexture,
	});
	if (helper && helper.ground)
		helper.ground.dispose();
	let currentState: GameState;
	scene.collisionsEnabled = true;
	scene.clearColor = new Color4(0, 0, 0, 0);
	const mapWidth: number = 14;
	const mapHeight: number = 6;
	const playerSize: number = 2;
	let playing: boolean = false;
	let score1: number = 0;
	let score2: number = 0;
	let scoreText: GUI.TextBlock;

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
	light.intensity = 0.7;

	//texture setup
	const marbleTex = new MarbleProceduralTexture("marble", 1024, scene);
	const fireTex = new FireProceduralTexture("fire", 1024, scene);
	const woodTex = new WoodProceduralTexture("wood", 1024, scene);

	//entity setup
	let ball = MeshBuilder.CreateSphere(
		"ball", { diameter: 0.5, segments: 32 }, scene);
	ball.position.y = 0.25;
	let sphereMat = new PBRMetallicRoughnessMaterial("sphereMat", scene);
	sphereMat.baseTexture = fireTex;
	sphereMat.emissiveTexture = fireTex;
	ball.material = sphereMat;
	ball.checkCollisions = true;
	ball.ellipsoid = new Vector3(0.25, 0.25, 0.25);

	let ground = MeshBuilder.CreateGround(
		"ground", { width: mapWidth, height: mapHeight }, scene);
	ground.receiveShadows = true;
	let groundMat = new PBRMetallicRoughnessMaterial("groundMat", scene);
	groundMat.baseTexture = marbleTex;
	groundMat.metallic = 0;
	groundMat.roughness = 0.2;
	ground.material = groundMat;

	let player1 = MeshBuilder.CreateBox(
		"player1", { width: 0.5, height: 0.3, depth: playerSize }, scene);
	player1.position.x = -6;
	player1.position.y = 0.2;
	let player1Mat = new PBRMetallicRoughnessMaterial("player1", scene);
	player1Mat.baseColor = Color3.Teal();
	player1Mat.emissiveColor = Color3.Teal();
	player1.material = player1Mat;
	player1.checkCollisions = true;
	player1.ellipsoid = new Vector3(0.25, 0.15, playerSize / 2);

	let player2 = MeshBuilder.CreateBox(
		"player2", { width: 0.5, height: 0.3, depth: playerSize }, scene);
	player2.position.x = 6;
	player2.position.y = 0.2;
	let player2Mat = new PBRMetallicRoughnessMaterial("player2", scene);
	player2Mat.baseColor = Color3.Yellow();
	player2Mat.emissiveColor = Color3.Yellow();
	player2.material = player2Mat;
	player2.checkCollisions = true;
	player2.ellipsoid = new Vector3(0.25, 0.15, playerSize / 2);

	//wall setup
	let wallMat = new PBRMetallicRoughnessMaterial("wall", scene);
	wallMat.baseTexture = woodTex;
	let northWall = MeshBuilder.CreateBox(
		"horizontal", { width: mapWidth, height: 0.3, depth: 0.3}, scene);
	northWall.position.y = 0.3;
	northWall.position.z = mapHeight / 2;
	northWall.material = wallMat;
	northWall.checkCollisions = true;

	let southWall = northWall.clone();
	southWall.position.z *= -1;

	let eastWall = MeshBuilder.CreateBox(
		"vertical", {width: 0.3, height: 0.3, depth: mapHeight}, scene);
	eastWall.position.y = 0.3;
	eastWall.position.x = mapWidth / 2;
	eastWall.material = wallMat;
	eastWall.checkCollisions = true;

	let westWall = eastWall.clone();
	westWall.position.x *= -1;

	//highlight layer
	const hl = new HighlightLayer("hl1", scene);
	hl.addMesh(ball, Color3.Red());

	//shadow setup
	const csm = new CascadedShadowGenerator(4096, light);
	csm.autoCalcDepthBounds = true;
	csm.addShadowCaster(ball);
	csm.addShadowCaster(player1);
	csm.addShadowCaster(player2);

	//ball collisions
	const walls = [
		{ mesh: westWall, type: 0 },
		{ mesh: northWall, type: 1 },
		{ mesh: eastWall, type: 2 },
		{ mesh: southWall, type: 3 },
	];

	const players = [
		{ mesh: player1, isLeft: true },
		{ mesh: player2, isLeft: false }
	];

	function bounceOffPlayer(
		ball: any, player: any, ballVel: Vector3)
	{
		const bbox = player.mesh.getBoundingInfo().boundingBox;
		const paddleHeight = bbox.maximum.z - bbox.minimum.z;
		const paddleCenter = player.mesh.position.z;

		const relativeIntersectZ = ball.position.z - paddleCenter;
		const normalizedRelativeIntersectionZ =
			relativeIntersectZ / (paddleHeight / 2);

		const maxAngle = Math.PI / 3;
		const angle = normalizedRelativeIntersectionZ * maxAngle;

		const dir = player.isLeft ? 1 : -1;
		let dirVec =  new Vector3(
			Math.cos(angle) * dir,
			0,
			Math.sin(angle)
		);
		if (dirVec.z === 0)
			dirVec.z = Math.random() < 0.5 ? -0.1 : 0.1;
		dirVec = dirVec.normalize();
		const speed = ballVel.length() * 1.03;
		return dirVec.scale(speed);
	}

	let ballVel = new Vector3(-1, 0, 0);
	ball.onCollideObservable.add((collidedMesh) => {
		const wall = walls.find(w => w.mesh === collidedMesh)
		if (wall) {
			if (wall.type % 2 === 0) {
				var dir = wall.type - 1;
				ballVel = new Vector3(dir, 0, 0);
				ball.position.x = 0;
				ball.position.y = 0.25;
				ball.position.z = 0;
				if (dir > 0)
					score1++;
				else
					score2++;
				updateScore();
				setState(GameState.Countdown);
			}
			else {
				ballVel.z *= -1;
			}
		}
		const player = players.find(p => p.mesh === collidedMesh);
		if (player) {
			ballVel = bounceOffPlayer(ball, player, ballVel);
			ball.position.x += ballVel.x * 0.1;
			ball.position.y = 0.25;
		}
		ballVel.y = 0;
	});

	//input setup
	const keys = {};
	window.addEventListener("keydown", (e) => keys[e.key] = true);
	window.addEventListener("keyup", (e) => keys[e.key] = false);
	const moveSpeed = 6;
	const ballSpeed = 6;
	scene.onBeforeRenderObservable.add(() => {
		const delta = scene.getEngine().getDeltaTime() / 1e3;
		const distance = moveSpeed * delta;
		let vel1 = new Vector3();
		let vel2 = new Vector3();
		if (keys["w"]) {
			vel1.z = distance;
		}
		if (keys["s"]) {
			vel1.z = -distance
		}
		if (keys["i"]) {
			vel2.z = distance;
		}
		if (keys["k"]) {
			vel2.z = -distance;
		}
		if (keys["f"]) {
			canvas.requestFullscreen();
		}
		if (playing)
		{
			player1.moveWithCollisions(vel1);
			player2.moveWithCollisions(vel2);
			ball.moveWithCollisions(ballVel.scale(delta * ballSpeed));
		}
	});

	//GUI
	const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
	
	function createRectangle()
	{
		let rect1 = new GUI.Rectangle();
		rect1.width = 0.2;
		rect1.height = "40px";
		rect1.cornerRadius = 20;
		rect1.color = "Orange";
		rect1.thickness = 4;
		rect1.background = "green";

		scoreText = new GUI.TextBlock();
		scoreText.color = "white";
		scoreText.fontSize = 20;

		scoreText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
		scoreText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;

		rect1.addControl(scoreText);
		advancedTexture.addControl(rect1);
		updateScore();
		return rect1;
	}
	createRectangle().verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;

	function updateScore()
	{
		scoreText.text = `${score1} : ${score2}`;
	}

	function setState(newState: GameState)
	{
		currentState = newState;
		
		switch (newState)
		{
			case GameState.Countdown:
				playing = false;
				player1.position.z = 0;
				player2.position.z = 0;
				startCountdown(scene, mapHeight / 2 + 1, () => {
					setState(GameState.Playing);
				});
				break ;

			case GameState.Playing:
				playing = true;
				break ;
		}
	}
	setState(GameState.Countdown);
	return scene;
};

async function loadTexture(path: string, scene: Scene)
{
	const ret = await ImportMeshAsync(path, scene);
	return ret;
}
