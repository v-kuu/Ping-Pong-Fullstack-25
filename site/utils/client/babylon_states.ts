import { Globals } from "../shared/babylon_globals.ts"
import { startCountdown } from "./babylon_ui.ts"
import { Scene } from "@babylonjs/core"

export enum GameState
{
	Countdown,
	Playing,
}

export function setState(newState: GameState, scene: Scene)
{
	Globals.currentState = newState;
	
	switch (newState)
	{
		case GameState.Countdown:
			Globals.playing = false;
			startCountdown(scene, () => {
				setState(GameState.Playing, scene);
			});
			break ;

		case GameState.Playing:
			Globals.playing = true;
			break ;
	}
}
