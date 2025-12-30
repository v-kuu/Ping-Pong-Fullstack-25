import {
	Scene,
	LoadAssetContainerAsync,
	MeshBuilder,
	PBRMaterial,
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
		{
			const pbrMat: PBRMaterial = container.materials[0];
			pbrMat.roughness = 0.5;
			pbrMat.metallic = 1.0;
			ground.material = pbrMat;
		}
		else
			console.error("No materials found in model");
	}
	catch (e)
	{
		console.error("Error loading the asset:", e);
	}
}
