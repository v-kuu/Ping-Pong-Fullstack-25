import {
	Scene,
	DefaultRenderingPipeline,
	SSAORenderingPipeline,
	SSRRenderingPipeline,
	Constants,
	CubeTexture,
} from "@babylonjs/core"

export function enablePostProcess(scene: Scene, envTexture: CubeTexture)
{
	//babylonsj bag of tricks
	let pipeline = new DefaultRenderingPipeline(
		"defaultPipeline",
		true,
		scene,
		[scene.activeCamera],
	);
	enableAmbientOcclusion(scene);
	enableScreenSpaceReflections(scene, envTexture);
}

function enableAmbientOcclusion(scene: Scene)
{
	let ssao = new SSAORenderingPipeline("ssao", scene, 0.75);
	ssao.fallOff = 0.000001;
	ssao.area = 1;
	ssao.radius = 0.0001;
	ssao.totalStrength = 1.0;
	ssao.base = 0.5;
	scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(
		"ssao",
		scene.activeCamera,
	);
}

function enableScreenSpaceReflections(scene: Scene, envTexture: CubeTexture)
{
	let ssr = new SSRRenderingPipeline(
		"ssr",
		scene,
		[scene.activeCamera],
		true,
		Constants.TEXTURETYPE_UNSIGNED_BYTE
	);

	ssr.environmentTexture = envTexture;
	ssr.strength = 1;
	ssr.reflectionSpecularFalloffExponent = 1.;
	ssr.enableAutomaticThicknessComputation = true;
	ssr.thickness = 0;
	ssr.step = 3;
	ssr.blurDispersionStrength = 0;
	ssr.roughnessFactor = 0;
}
