import {
	Scene,
	MeshBuilder,
	Mesh,
	Vector3,
} from "@babylonjs/core"
import { Globals } from "../shared/babylon_globals.ts";

export function AI_moves(scene: Scene) {
	const ballMesh = scene.getMeshByName("ball");
	const p2Mesh = scene.getMeshByName("player2");

	Globals.player2KeyDown = false;
	Globals.player2KeyUp = false;

	// console.log("p2: ", p2Mesh?.position._z, "ball: ",  ballMesh?.position._z);
	if (Math.abs(p2Mesh?.position.z - ballMesh?.position.z) < 0.2)
		return ;

	// Ball moving away from AI
	if (Globals.ballVel.x < 0)
	{
		if (p2Mesh?.position.z < -0.1)
			Globals.player2KeyUp = true;
		else if (p2Mesh?.position.z > 0.1)
			Globals.player2KeyDown = true;
	}
	else {
		if (p2Mesh?.position.z < ballMesh?.position.z)
			Globals.player2KeyUp = true;
		else
			Globals.player2KeyDown = true;
	}
}
