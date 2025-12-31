import { GameState } from "./babylon_states.ts"
import { Vector3 } from "@babylonjs/core"
import { TextBlock } from "@babylonjs/gui"

export interface GlobalState
{
	mapWidth: number,
	mapHeight: number,
	playerSize: number,
	playing: boolean,
	score1: number,
	score2: number,
	moveSpeed: number,
	ballSpeed: number,
	currentState: GameState,
	ballVel: Vector3,
	vel1: Vector3,
	vel2: Vector3,
	scoreText: TextBlock,
}

export const Globals: GlobalState =
{
	mapWidth: 14,
	mapHeight: 6,
	playerSize: 2,
	playing: false,
	score1: 0,
	score2: 0,
	moveSpeed: 6,
	ballSpeed: 6,
	currentState: GameState.Countdown,
	ballVel: new Vector3(-1, 0, 0),
	vel1: new Vector3(),
	vel2: new Vector3(),
	scoreText: new TextBlock(),
};
