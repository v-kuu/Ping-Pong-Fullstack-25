import { Vector3, Mesh } from "@babylonjs/core";

export enum GameState
{
	WaitingPlayers,
	Countdown,
	Playing,
	GameOver,
}

export type GlobalState =
{
	mapWidth: number;
	mapHeight: number;
	playerWidth: number,
	playerHeight: number,
	playerDepth: number;
	playing: boolean;
	maxScore: number;
	moveSpeed: number;
	ballSpeed: number;
	ballVel: Vector3;
	vel1: Vector3;
	vel2: Vector3;
	player1KeyDown: boolean;
	player1KeyUp: boolean;
	player2KeyDown: boolean;
	player2KeyUp: boolean;
	userName: string;
	score1Mesh: Mesh | null;
	score2Mesh: Mesh | null;
}

export interface ServerState
{
	ballPos: Vector3;
	p1Pos: Vector3;
	p2Pos: Vector3;
	score1: number;
	score2: number;
	currentState: GameState;
}

export const ServerVars: ServerState =
{
	ballPos: new Vector3(),
	p1Pos: new Vector3(),
	p2Pos: new Vector3(),
	score1: 0,
	score2: 0,
	currentState: GameState.WaitingPlayers
}

export const Globals: GlobalState =
{
	mapWidth: 14,
	mapHeight: 6,
	playerWidth: 0.3,
	playerHeight: 0.3,
	playerDepth: 2,
	playing: false,
	maxScore: 5,
	moveSpeed: 6,
	ballSpeed: 6,
	ballVel: new Vector3(-1, 0, 0),
	vel1: new Vector3(),
	vel2: new Vector3(),
	player1KeyDown: false,
	player1KeyUp: false,
	player2KeyDown: false,
	player2KeyUp: false,
	userName: "" as string,
	score1Mesh: null,
	score2Mesh: null,
};

