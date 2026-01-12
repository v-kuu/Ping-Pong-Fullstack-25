import { Globals } from "../shared/babylon_globals.ts"
import { Scene, Tools } from "@babylonjs/core"

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
			//send countdown state to clients
			// somehow count down the 3 2 1 GO in server
			for (let i = 0; i < 3; i++)
			{
				Tools.DelayAsync(1000).then();
			}
			setState(GameState.Playing, scene);
			break ;

		case GameState.Playing:
			Globals.playing = true;
			//send playing state to clients
			break ;
	}
}
