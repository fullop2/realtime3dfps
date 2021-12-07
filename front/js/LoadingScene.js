import {Builder} from "./Builder.js";
import {GScene} from "./GScene.js";
import * as UI from "./UI.js";

/*
* LoadingScene
* just display loading text msg and spinner
*/
export class LoadingScene extends GScene{
  constructor(camera){
    super(camera);
    Builder.renderer.setClearColor (0x333333, 1);
    this.loadUI();
  }

  loadUI(){
    let textDiv = UI.createText(0.5,0.5,150,50,"","white",2);
    let textNode = document.createTextNode("   Loading...");
    let span = document.createElement("span");
    span.classList.add("spinner-border", "spinner-border-lg");
    textDiv.appendChild(span);
    textDiv.appendChild(textNode);

    this._text = new UI.UIGroup();
    this._text.add(textDiv);
    this._text.show();
  }

  release(){
    this._text.release();
  }
}
