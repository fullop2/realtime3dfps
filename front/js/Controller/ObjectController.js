import {Builder} from "../Builder.js";
import {Input,Resource,AnimationManager} from "../Manager/Manager.js";
import * as UI from "../UI.js";

/*
* base object controller
*/
class ObjectController{
  constructor(object){
    this._object = object;
  }
  get object(){
    return this._object;
  }
  setObject(object){
    this._object = object;
  }
}

export {ObjectController,Builder,Input,Resource,AnimationManager,UI};
