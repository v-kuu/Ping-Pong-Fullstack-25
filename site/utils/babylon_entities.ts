import {
	Scene,
	LoadAssetContainerAsync,
	MeshBuilder,
} from "@babylonjs/core"

export async function createGround(width: number, height: number, scene: Scene)
{
	let ground = MeshBuilder.CreateGround(
		"ground", { width: width, height: height }, scene
	);
	ground.receiveShadows = true;
	try
	{
		const container = await LoadAssetContainerAsync("painted_metal/xeutbhl_tier_3.gltf", scene);
		if (container.materials)
			ground.material = container.materials[0];
		else
			console.error("No materials found in model");
	}
	catch (e)
	{
		console.error("Error loading the asset:", e);
	}
}
