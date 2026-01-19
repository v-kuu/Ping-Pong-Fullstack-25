import {
	Scene,
	StandardMaterial,
	MeshBuilder,
	Color3,
	Vector3,
	Tools,
	Mesh,
	Animation,
	Texture,
} from "@babylonjs/core";
import { FireProceduralTexture } from "@babylonjs/procedural-textures";
import { Globals } from "../shared/babylon_globals.ts";

async function get3dFont(): Promise<any>
{
	const url = "https://assets.babylonjs.com/fonts/Droid Sans_Regular.json";
	try
	{
		const response = await fetch(url);
		if (!response.ok)
		throw new Error(`Response status: ${response.status}`);
		const result = await response.json();
		return result;
	}
	catch (error)
	{
		console.error(error.message);
		return null;
	}
}
const fontData = await get3dFont();

function animateCountdown(mesh: Mesh, material: StandardMaterial)
{
	mesh.scaling.setAll(0.1);
	material.alpha = 1;

	Animation.CreateAndStartAnimation(
		"scaleAnim",
		mesh,
		"scaling",
		60,
		60,
		new Vector3(0.1, 0.1, 0.1),
		new Vector3(1, 1, 1),
		Animation.ANIMATIONLOOPMODE_CONSTANT,
	);
}

export async function startCountdown(scene: Scene)
{
	let textMat = new StandardMaterial("text", scene);
	textMat.diffuseColor = Color3.Black();
	textMat.emissiveColor = Color3.Gray();
	const values = ["3", "2", "1", "GO!"];

	for (const value of values)
	{
		let countdownMesh = MeshBuilder.CreateText(
			"countdown",
			value,
			fontData,
			{
				size: value === "GO!" ? 2.5 : 2,
				depth: 0.5,
			},
			scene,
		);
		if (countdownMesh)
		{
			countdownMesh.material = textMat;
			countdownMesh.position.z = Globals.mapHeight / 2 + 1.5;
			countdownMesh.rotation.x = Tools.ToRadians(45);
			animateCountdown(countdownMesh, textMat);
			await Tools.DelayAsync(1000);
			countdownMesh.dispose();
		}
	}
}

function createScoreMesh(
	scene: Scene,
	name: string,
	value: string,
	color: Color3[],
): Mesh | null
{
	let mat = new StandardMaterial(name, scene);
	let tex = new FireProceduralTexture(name, 1024, scene);
	tex.fireColors = color;
	mat.diffuseTexture = tex;
	mat.emissiveTexture = tex;

	let scoreMesh = MeshBuilder.CreateText(
		name,
		value,
		fontData,
		{
			size: 2.5,
			depth: 0.5,
		},
		scene,
	);
	if (scoreMesh)
	{
		scoreMesh.material = mat;
		scoreMesh.position.z = Globals.mapHeight / 2 + 1;
		scoreMesh.rotation.x = Tools.ToRadians(45);
	}
	return scoreMesh;
}

export function initUI(scene: Scene)
{
	initScores(scene);
	initAvatars(scene);
}

function initScores(scene: Scene)
{
	Globals.score1Mesh = createScoreMesh(
		scene,
		"score1",
		"0",
		FireProceduralTexture.BlueFireColors,
	);
	if (Globals.score1Mesh)
		Globals.score1Mesh.position.x = Globals.mapWidth / -2 + 0.5;

	Globals.score2Mesh = createScoreMesh(
		scene,
		"score2",
		"0",
		FireProceduralTexture.RedFireColors,
	);
	if (Globals.score2Mesh)
		Globals.score2Mesh.position.x = Globals.mapWidth / 2 - 0.5;
}

function initAvatars(scene: Scene)
{
	createAvatar(scene, 1);
	createAvatar(scene, 2);
}

async function createAvatar(scene: Scene, id: number)
{
	let url = "/avatar.png";
	if (Globals.userName.username) {
  	try
  	{
  		let res = await fetch("/api/avatars/" + Globals.userName.username.username);
  		if (!res.ok)
  			throw new Error("Failed to fetch avatar");
  		url = res.url;
  	}
  	catch (error)
  	{
  		console.error(error);
  	}
	}
	let avatar = MeshBuilder.CreatePlane("avatar", { size: 2 }, scene);
	avatar.billboardMode = Mesh.BILLBOARDMODE_ALL;

	let avatarMat = new StandardMaterial("avatarMat", scene);
	avatarMat.diffuseTexture = new Texture(url, scene);
	avatarMat.diffuseTexture.hasAlpha = true;
	avatarMat.useAlphaFromDiffuseTexture = true;
	avatarMat.backFaceCulling = false;
	avatar.material = avatarMat;
	avatar.position.x =
		id === 1 ? Globals.mapWidth / -2 + 2.5 : Globals.mapWidth / 2 - 2.5;
	avatar.position.z = Globals.mapHeight / 2 + 3;
}

export function updateScore(scene: Scene, id: number)
{
	if (id === 1 && Globals.score1Mesh)
		Globals.score1Mesh.dispose();
	else if (Globals.score2Mesh)
		Globals.score2Mesh.dispose();
	let name = id === 1 ? "score1" : "score2";
	let value = id === 1 ? `${Globals.score1}` : `${Globals.score2}`;
	let color =
		id === 1
			? FireProceduralTexture.BlueFireColors
			: FireProceduralTexture.RedFireColors;
	let mesh = createScoreMesh(scene, name, value, color);
	if (mesh)
		mesh.position.x = id === 1 ? Globals.mapWidth / -2 + 0.5 : Globals.mapWidth / 2 - 0.5;
	id === 1 ? (Globals.score1Mesh = mesh) : (Globals.score2Mesh = mesh);
}

export function messageGameOver(scene: Scene)
{
	let mat = new StandardMaterial("GameOver", scene);
	mat.diffuseColor = Color3.Red();
	mat.emissiveColor = Color3.Red();

	let scoreMesh = MeshBuilder.CreateText(
		"GameOver",
		"KO",
		fontData,
		{
			size: 2.5,
			depth: 0.5,
		},
		scene,
	);
	if (scoreMesh)
	{
		scoreMesh.material = mat;
		scoreMesh.position.z = Globals.mapHeight / 2 + 1;
		scoreMesh.rotation.x = Tools.ToRadians(45);
	}
}
