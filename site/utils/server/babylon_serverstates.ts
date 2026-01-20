import { GameState, Globals, ServerVars } from "../shared/babylon_globals.ts"
import { Scene, Tools } from "@babylonjs/core"

export function setState(newState: GameState, scene: Scene)
{
	ServerVars.currentState = newState;

	switch (newState)
	{
		case GameState.WaitingPlayers:
			Globals.playing = false;
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

		case GameState.GameOver:
			Globals.playing = false;
			break ;
	}
}
