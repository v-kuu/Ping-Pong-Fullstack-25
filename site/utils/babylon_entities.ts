import {
	Scene,
	LoadAssetContainerAsync,
	MeshBuilder,
	PBRMaterial,
	Mesh,
	Vector3,
	DirectionalLight,
	CascadedShadowGenerator,
} from "@babylonjs/core"
import { setupCollisions } from "./babylon_physics_helpers.ts"
import { Globals } from "./babylon_globals.ts"

export enum Sides
{
	WEST,
	NORTH,
	EAST,
	SOUTH
}

function loadMat(path: string, scene: Scene): PBRMaterial | null
{
	try
	{
		LoadAssetContainerAsync(path, scene).then(
		container =>
		{
			if (container.materials)
			{
				return container.materials[0];
			}
			else
			{
				console.error("No materials found in model");
				return null;
			}
		});
	}
	catch (e)
	{
		console.error("Error loading the asset:", e);
		return null;
	}
}

function createGround(scene: Scene)
{
	let ground = MeshBuilder.CreateGround(
		"ground", { width: Globals.mapWidth, height: Globals.mapHeight }, scene
	);
	ground.receiveShadows = true;
	const pbrMat = loadMat("painted_metal/xeutbhl_tier_3.gltf", scene);
	if (pbrMat)
		ground.material = pbrMat;
}

function createBall(scene: Scene): Mesh
{
	let ball = MeshBuilder.CreateSphere(
		"ball", { diameter: 0.5, segments: 32 }, scene);
	ball.position.y = 0.25;
	const pbrMat = loadMat("marble/tgjpcanc_tier_3.gltf", scene);
	if (pbrMat)
		ball.material = pbrMat;
	ball.checkCollisions = true;
	ball.ellipsoid = new Vector3(0.25, 0.25, 0.25);
	return ball;
}

function createPlayer(leftPlayer: boolean, scene: Scene): Mesh
{
	let player = MeshBuilder.CreateBox(
		"player", { width: 0.5, height: 0.3, depth: Globals.playerSize }, scene);
	player.position.x = leftPlayer ? -6 : 6;
	player.position.y = 0.2;
	const pbrMat = leftPlayer
		? loadMat("polypropylene/schbehmp_tier_3.gltf", scene)
		: loadMat("polyvinyl/sccnbdnp_tier_3.gltf", scene);
	if (pbrMat)
		player.material = pbrMat;
	player.checkCollisions = true;
	player.ellipsoid = new Vector3(0.25, 0.15, Globals.playerSize / 2);
	return player;
}

function createWalls(scene: Scene): Mesh[]
{
	const pbrMat = loadMat("damaged_concrete/vdcnfcd_tier_3.gltf", scene);

	//north
	let walls: Mesh[] = [];
	walls[Sides.NORTH] = MeshBuilder.CreateBox(
		"horizontal", { width: Globals.mapWidth, height: 0.3, depth: 0.3}, scene);
	walls[Sides.NORTH].position.y = 0.3;
	walls[Sides.NORTH].position.z = Globals.mapHeight / 2;
	if (pbrMat)
		walls[Sides.NORTH].material = pbrMat;
	walls[Sides.NORTH].checkCollisions = true;
	
	//south
	walls[Sides.SOUTH] = MeshBuilder.CreateBox(
		"horizontal", { width: Globals.mapWidth, height: 0.3, depth: 0.3}, scene);
	walls[Sides.SOUTH].position.y = 0.3;
	walls[Sides.SOUTH].position.z = Globals.mapHeight / -2;
	if (pbrMat)
		walls[Sides.SOUTH].material = pbrMat;
	walls[Sides.SOUTH].checkCollisions = true;

	//east
	walls[Sides.EAST] = MeshBuilder.CreateBox(
		"vertical", {width: 1, height: 1, depth: 1}, scene);
	walls[Sides.EAST].scaling = new Vector3(0.3, 0.3, Globals.mapHeight);
	walls[Sides.EAST].position.y = 0.3;
	walls[Sides.EAST].position.x = Globals.mapWidth / 2;
	if (pbrMat)
		walls[Sides.EAST].material = pbrMat;
	walls[Sides.EAST].checkCollisions = true;

	//west
	walls[Sides.WEST] = MeshBuilder.CreateBox(
		"vertical", {width: 1, height: 1, depth: 1}, scene);
	walls[Sides.WEST].scaling = new Vector3(0.3, 0.3, Globals.mapHeight);
	walls[Sides.WEST].position.y = 0.3;
	walls[Sides.WEST].position.x = Globals.mapWidth / -2;
	if (pbrMat)
		walls[Sides.WEST].material = pbrMat;
	walls[Sides.WEST].checkCollisions = true;
	return walls;
}

export function setupEntities(light: DirectionalLight, scene: Scene)
{
	createGround(scene);

	let ball = createBall(scene);
	let player1 = createPlayer(true, scene);
	let player2 = createPlayer(false, scene);
	let wallMeshes: Mesh[] = createWalls(scene);
	
	const csm = new CascadedShadowGenerator(4096, light);
	csm.autoCalcDepthBounds = true;
	csm.addShadowCaster(ball);
	csm.addShadowCaster(player1);
	csm.addShadowCaster(player2);
	for (const wall of wallMeshes)
	{
		csm.addShadowCaster(wall);
	}
	
	setupCollisions(player1, player2, wallMeshes, ball, scene);
	scene.onBeforeRenderObservable.add(() =>
	{
		const delta = scene.getEngine().getDeltaTime() / 1e3;
		if (Globals.playing)
		{
			player1.moveWithCollisions(Globals.vel1);
			player2.moveWithCollisions(Globals.vel2);
			ball.moveWithCollisions(Globals.ballVel.scale(delta * Globals.ballSpeed));
		}
		else
		{
			player1.position.z = 0;
			player2.position.z = 0;
		}

	});
}
