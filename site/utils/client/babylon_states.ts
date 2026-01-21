import { GameState, Globals, ServerVars } from "../shared/babylon_globals.ts"
import { startCountdown, messageGameOver, updateScore } from "./babylon_ui.ts"
import { Scene } from "@babylonjs/core"

export function setState(newState: GameState, scene: Scene)
{
	ServerVars.currentState = newState;

	switch (newState)
	{
		case GameState.WaitingPlayers:
			resetGame(scene);
			Globals.playing = false;
			break;

		case GameState.Countdown:
			Globals.playing = false;
			startCountdown(scene);
			break ;

		case GameState.Playing:
			Globals.playing = true;
			break ;

		case GameState.GameOver:
			messageGameOver(scene);
			Globals.playing = false;
			break ;
	}
}

function resetGame(scene: Scene)
{
	let gameOver = scene.getMeshByName("GameOver");
	gameOver?.dispose();
}
