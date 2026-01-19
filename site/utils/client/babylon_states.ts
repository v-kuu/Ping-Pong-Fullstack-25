import { GameState, Globals } from "../shared/babylon_globals.ts"
import { startCountdown } from "./babylon_ui.ts"
import { Scene } from "@babylonjs/core"

export function setState(newState: GameState, scene: Scene)
{
	Globals.currentState = newState;

	switch (newState)
	{
		case GameState.WaitingPlayers:
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
			Globals.playing = false;
			break ;
	}
}
