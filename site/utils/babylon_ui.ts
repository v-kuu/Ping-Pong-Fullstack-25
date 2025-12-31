import * as GUI from "@babylonjs/gui"
import { Globals } from "./babylon_globals.ts"

export function createRectangle()
{
	const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
	let rect1 = new GUI.Rectangle();
	rect1.width = 0.2;
	rect1.height = "40px";
	rect1.cornerRadius = 20;
	rect1.color = "Orange";
	rect1.thickness = 4;
	rect1.background = "green";

	Globals.scoreText.color = "white";
	Globals.scoreText.fontSize = 20;

	Globals.scoreText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
	Globals.scoreText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;

	rect1.addControl(Globals.scoreText);
	advancedTexture.addControl(rect1);
	updateScore();
	return rect1;
}

export function updateScore()
{
	Globals.scoreText.text = `${Globals.score1} : ${Globals.score2}`;
}
