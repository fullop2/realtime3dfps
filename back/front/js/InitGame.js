import {renderloop,updateloop} from "./Game.js";
import {MainScene} from "./MainScene.js";
import {initDivEvent} from "./MainDiv.js";

let mainScene = new MainScene(); // make new scene
updateloop(); // loop start
renderloop(); //
mainScene.init(); // init after loop start. main loading 3d model data.
initDivEvent();
