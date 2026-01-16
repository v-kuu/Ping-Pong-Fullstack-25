import {
	Vector3,
	Scene,
} from "@babylonjs/core"
import { Sides } from "./babylon_serverentities.ts"
import { GameState, Globals } from "../shared/babylon_globals.ts"
import {
	setState,
} from "./babylon_serverstates.ts"

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

export function setupCollisions(player1: any, player2: any, wallMeshes: any, ball: any, scene: Scene)
{
	const walls = [
		{ mesh: wallMeshes[Sides.WEST], type: Sides.WEST },
		{ mesh: wallMeshes[Sides.NORTH], type: Sides.NORTH },
		{ mesh: wallMeshes[Sides.EAST], type: Sides.EAST },
		{ mesh: wallMeshes[Sides.SOUTH], type: Sides.SOUTH },
	];

	const players = [
		{ mesh: player1, isLeft: true },
		{ mesh: player2, isLeft: false }
	];

	ball.onCollideObservable.add((collidedMesh) => {
		const wall = walls.find(w => w.mesh === collidedMesh)
		if (wall) {
			if (wall.type % 2 === 0) {
				var dir = wall.type - 1;
				Globals.ballVel = new Vector3(dir, 0, 0);
				ball.position.x = 0;
				ball.position.y = 0.25;
				ball.position.z = 0;
				if (dir > 0)
					Globals.score1++;
				else
					Globals.score2++;
				setState(GameState.Countdown, scene);
			}
			else {
				Globals.ballVel.z *= -1;
			}
		}
		const player = players.find(p => p.mesh === collidedMesh);
		if (player) {
			Globals.ballVel = bounceOffPlayer(ball, player, Globals.ballVel);
			ball.position.x += Globals.ballVel.x * 0.1;
			ball.position.y = 0.25;
		}
		Globals.ballVel.y = 0;
	});
}
