import {ObjectController,Builder,Input,Resource,AnimationManager} from "./ObjectController.js";

// shooter = bullet
export class ShooterController extends ObjectController{
  constructor(object,position,vector,speed,time){
    super(object);
    this.object.position.set(position.x,position.y,position.z);
    this._vector = vector;
    this._speed = speed;
    this._time = time;
   }
   setTime(aTime)
   {
     this._time = aTime;
   }
   update(deltaTime){
     this.object.position.x += this._vector.x * deltaTime * this._speed;
     this.object.position.y += this._vector.y * deltaTime * this._speed;
     this.object.position.z += this._vector.z * deltaTime * this._speed;

     if((this._time -= deltaTime) < 0)
     {
       return false;
     }
     return true;
   }
}
