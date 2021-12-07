import {Builder} from "../Builder.js";


//////////////////////////
/// user input manager ///
//////////////////////////
export const Input = {
  _isKeyDown : [],
  _mouseMovement : [0,0],
  _mousePosition : new THREE.Vector2(),
  _mouseDown : false,
  _lockInput : false,
  setLockInput(state){
    this._lockInput = state;
    document.exitPointerLock();
  },
  get lockInput(){
    return this._lockInput;
  },
  keyDown(index){
    return this._isKeyDown[index];
  },
  keyUp(index){
    return !this._isKeyDown[index];
  },
  setKeyDown(index){
    if(!this.lockInput)
      this._isKeyDown[index] = true;
  },
  setKeyUp(index){
    this._isKeyDown[index] =false;
  },
  get mouseMovement(){
    const tmp = this._mouseMovement;
    this._mouseMovement = [0,0];
    return tmp;
  },
  setMouseMovement(x,y){
    this._mouseMovement = [x,y];
  },
  get mouseDown(){
    return this._mouseDown;
  },
  get mouseUp(){
    return !this._mouseDown;
  },
  setMouseDown(state){
    this._mouseDown = state;
  },
  get mousePos(){
    return this._mousePosition;
  },
  setMousePosX(pos){
    this._mousePosition.x = pos;
  },
  setMousePosY(pos){
    this._mousePosition.y = pos;
  }
};


///////////////////////
/// key input check ///
///////////////////////
$(document).keydown(function(e){ // 어떤 키가 눌렸는지 저장
  Input.setKeyDown(e.which.toString());
});
$(document).keyup(function(e){ // 눌렸던 키를 해제
  Input.setKeyUp(e.which.toString());
});

////////////////////////
/// mouse move check ///
////////////////////////
document.addEventListener("mousemove",e=>{
  if(document.pointerLockElement === Builder.container ||
      document.mozPointerLockElement === Builder.container)
      {
        Input.setMouseMovement(e.movementX, e.movementY);
        Input.setMousePosX(( event.clientX / window.innerWidth ) * 2 - 1);
        Input.setMousePosY(- ( event.clientY / window.innerHeight ) * 2 + 1);
      }
});
document.querySelector("canvas").addEventListener("mousedown",()=>{
  if(document.pointerLockElement === Builder.container ||
      document.mozPointerLockElement === Builder.container)
      {
        Input.setMouseDown(true);
      }
});
document.querySelector("canvas").addEventListener("mouseup",()=>{
  if(document.pointerLockElement === Builder.container ||
      document.mozPointerLockElement === Builder.container)
      {
        Input.setMouseDown(false);
      }
});
