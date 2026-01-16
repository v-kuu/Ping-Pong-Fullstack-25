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
import { Globals } from "../shared/babylon_globals.ts"

export enum Sides
{
	WEST,
	NORTH,
	EAST,
	SOUTH
}

async function loadMat(path: string, scene: Scene): Promise<PBRMaterial | null>
{
	try
	{
		const container = await LoadAssetContainerAsync(path, scene);
		if (container.materials)
		{
			return container.materials[0] as PBRMaterial;
		}
		else
		{
			console.error("No materials found in model");
			return null;
		}
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
	loadMat("painted_metal/xeutbhl_tier_3.gltf", scene).then(pbrMat =>
	{
		ground.material = pbrMat;
	});
}

function createBall(scene: Scene): Mesh
{
	let ball = MeshBuilder.CreateSphere(
		"ball", { diameter: 0.5, segments: 32 }, scene);
	ball.position.y = 0.25;
	loadMat("marble/tgjpcanc_tier_3.gltf", scene).then(pbrMat =>
	{
		ball.material = pbrMat;
	});
	ball.checkCollisions = true;
	ball.ellipsoid = new Vector3(0.25, 0.25, 0.25);
	return ball;
}

function createPlayer(leftPlayer: boolean, scene: Scene): Mesh
{
	let playerName = leftPlayer ? "player1" : "player2";
	let player = MeshBuilder.CreateBox(
		playerName,
		{
			width: Globals.playerWidth,
			height: Globals.playerHeight,
			depth: Globals.playerDepth
		},
		scene
	);
	player.position.x = leftPlayer ? -6 : 6;
	player.position.y = 0.2;
	const path = leftPlayer
		? "polypropylene/schbehmp_tier_3.gltf" : "polyvinyl/sccnbdnp_tier_3.gltf";
	loadMat(path, scene).then(pbrMat =>
	{
		player.material = pbrMat;
	});
	player.checkCollisions = true;
	player.ellipsoid = new Vector3(
		Globals.playerWidth / 2, Globals.playerHeight / 2, Globals.playerDepth / 2);
	return player;
}

function createWalls(scene: Scene): Mesh[]
{
	//north
	let walls: Mesh[] = [];
	walls[Sides.NORTH] = MeshBuilder.CreateBox(
		"horizontal", { width: Globals.mapWidth, height: 0.6, depth: 0.3}, scene);
	walls[Sides.NORTH].position.y = 0.3;
	walls[Sides.NORTH].position.z = Globals.mapHeight / 2;
	walls[Sides.NORTH].checkCollisions = true;

	//south
	walls[Sides.SOUTH] = MeshBuilder.CreateBox(
		"horizontal", { width: Globals.mapWidth, height: 0.6, depth: 0.3}, scene);
	walls[Sides.SOUTH].position.y = 0.3;
	walls[Sides.SOUTH].position.z = Globals.mapHeight / -2;
	walls[Sides.SOUTH].checkCollisions = true;

	//east
	walls[Sides.EAST] = MeshBuilder.CreateBox(
		"vertical", {width: 1, height: 1, depth: 1}, scene);
	walls[Sides.EAST].scaling = new Vector3(0.3, 0.6, Globals.mapHeight);
	walls[Sides.EAST].position.y = 0.3;
	walls[Sides.EAST].position.x = Globals.mapWidth / 2;
	walls[Sides.EAST].checkCollisions = true;

	//west
	walls[Sides.WEST] = MeshBuilder.CreateBox(
		"vertical", {width: 1, height: 1, depth: 1}, scene);
	walls[Sides.WEST].scaling = new Vector3(0.3, 0.6, Globals.mapHeight);
	walls[Sides.WEST].position.y = 0.3;
	walls[Sides.WEST].position.x = Globals.mapWidth / -2;
	walls[Sides.WEST].checkCollisions = true;

	loadMat("damaged_concrete/vdcnfcd_tier_3.gltf", scene).then(pbrMat =>
	{
		for (const wall of walls)
		{
			wall.material = pbrMat;
		}
	});
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

	scene.onBeforeRenderObservable.add(() =>
	{
		const ballMesh = scene.getMeshByName("ball");
		const p1Mesh = scene.getMeshByName("player1");
		const p2Mesh = scene.getMeshByName("player2");

		if (ballMesh)
		{
			if (Globals.playing)
			{
				ballMesh.position.x += Globals.ballDelta.x;
				ballMesh.position.z += Globals.ballDelta.z;
			}
			if (Globals.updateAvailable)
			{
				Globals.updateAvailable = false;
				const error = Globals.ballVel.subtract(ballMesh.position);
				ballMesh.position.addInPlace(error.scaleInPlace(0.6));
			}
		}
		if (p1Mesh)
			p1Mesh.position.copyFrom(Globals.vel1);
		if (p2Mesh)
			p2Mesh.position.copyFrom(Globals.vel2);
	});
}
