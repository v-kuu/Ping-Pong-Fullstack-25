import { Globals } from "../shared/babylon_globals.ts"
import { Scene, Tools } from "@babylonjs/core"

export enum GameState
{
	WaitingPlayers,
	Countdown,
	Playing,
}

export function setState(newState: GameState, scene: Scene)
{
	Globals.currentState = newState;

	switch (newState)
	{
		case GameState.WaitingPlayers:
			break;

		case GameState.Countdown:
			Globals.playing = false;
			Tools.DelayAsync(3000).then(() =>
			{
				setState(GameState.Playing, scene);
			});
			break ;

		case GameState.Playing:
			Globals.playing = true;
			break ;
	}
}
