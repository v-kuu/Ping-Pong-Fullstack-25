import {
	Scene,
	MeshBuilder,
	Mesh,
	Vector3,
} from "@babylonjs/core"
import { setupCollisions } from "./babylon_physics_helpers.ts"
import { Globals } from "../shared/babylon_globals.ts"

export enum Sides
{
	WEST,
	NORTH,
	EAST,
	SOUTH
}

function createBall(scene: Scene): Mesh
{
	let ball = MeshBuilder.CreateSphere(
		"ball", { diameter: 0.5, segments: 32 }, scene);
	ball.position.y = 0.25;
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

	return walls;
}

export function setupServerEntities(scene: Scene)
{
	let ball = createBall(scene);
	let player1 = createPlayer(true, scene);
	let player2 = createPlayer(false, scene);
	let wallMeshes: Mesh[] = createWalls(scene);

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
			ball.position.setAll(0);
		}

	});
}
