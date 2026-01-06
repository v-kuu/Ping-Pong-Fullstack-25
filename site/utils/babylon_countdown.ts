import {
	Scene,
	StandardMaterial,
	MeshBuilder,
	Color3,
	Vector3,
	Tools,
	Mesh,
	Animation,
} from "@babylonjs/core"

async function get3dFont() : Promise<any>
{
	const url = "https://assets.babylonjs.com/fonts/Droid Sans_Regular.json";
	try
	{
		const response = await fetch(url);
		if (!response.ok)
		{
			throw new Error(`Response status: ${response.status}`);
		}
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
		Animation.ANIMATIONLOOPMODE_CONSTANT
	);

	Animation.CreateAndStartAnimation(
		"fadeAnim",
		material,
		"alpha",
		60,
		60,
		1,
		0,
		Animation.ANIMATIONLOOPMODE_CONSTANT
	);
}

export async function startCountdown(scene: Scene, posZ: number, onComplete: () => void)
{
	let textMat = new StandardMaterial("text", scene);
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
			scene
		);
		if (countdownMesh)
		{
			countdownMesh.material = textMat;
			countdownMesh.position.z = posZ;
			countdownMesh.rotation.x = Tools.ToRadians(45);
			animateCountdown(countdownMesh, textMat);
			if (value === "GO!")
				onComplete();
			await Tools.DelayAsync(1000);
			countdownMesh.dispose();
		}
	}
}
