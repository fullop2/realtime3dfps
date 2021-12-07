import {ObjectController} from "./Controller/ObjectController.js";

/*
* GScene : base Scene extends THREE's scene
* _objectControllers : list of object actor
* _camera : current camera
* _loadingScene : async loading scene draw before current scene
*/
export class GScene extends THREE.Scene{
  constructor(camera){
    super();
    
    this._objectControllers = [];
    this._camera = camera;
    this._loadingScene = null;
  }

  get camera(){
    return this._camera;
  }
  get scene(){
    return this._scene;
  }
  get objectControllers(){
    return this._objectControllers;
  }

  // update called by main loop
  update(deltaTime){
    for(let i in this.objectControllers){
      let objectController = this.objectControllers[i];
      if(!objectController.update(deltaTime)){ // object actor not available, delete object and actor
        this.remove(objectController.object);
        this.objectControllers.splice(i,1);
      }
    }
  }
  add(object){
    if(object instanceof THREE.Object3D)
    {
      super.add(object);
    }
  }
  addController(controller){
    if(controller instanceof ObjectController)
      {
      super.add(controller.object);
      this.objectControllers.push(controller);
    }
  }

  release(){
  }
}
