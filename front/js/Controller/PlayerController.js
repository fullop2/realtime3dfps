import {ObjectController,Builder,Input,Resource,AnimationManager} from "./ObjectController.js";
import {NetworkManager} from "../Manager/Manager.js";
import * as UI from "../UI.js";

export class PlayerController extends ObjectController{
  constructor(object, animation, serverData){
    super(object);
    this._animation = new AnimationManager(object,animation);
    this._inputDelay = 0.1;
    this._inputTime = 0;

    this._mid = new THREE.Vector2(0,0);

    this._attackDelay = 0;
    this._attackState = -1;
    this._attackVec = [0,0];

    this._dead = false;
    this._removeFlag = true;

    this._hp = serverData.hp;
    this._MaxHp = serverData.hp;

    this._element = serverData.element;

    this._constUIGroup = new UI.UIGroup();
    let crosshair = UI.createImg(0.5,0.5,100,100,"./crosshair.png",2);
    this._constUIGroup.add(crosshair);

    this._score = 0;
    this._scoreText = UI.createText(0.9,0.1,100,20,"0",2);
    this._scoreText.classList.add('displayText');
    this._scoreText.style.fontSize = '45px';
    this._constUIGroup.add(this._scoreText);

    this._time = 0;
    this._timeText = UI.createText(0.87,0.02,150,20,"0",2);
    this._timeText.classList.add('displayText',"animated","heartBeat","infAnimation");
    this._timeText.style.fontSize = '30px';
    this._constUIGroup.add(this._timeText);

    let elementBackUI = UI.createImg(0.1,0.1,170,170,"./img/circle.png",2);
    this._constUIGroup.add(elementBackUI);

    this._elementUI = 0;
    this._elementUI = UI.createImg(0.1,0.1,150,150,"./items/none.png",3);
    this._elementUI.classList.add("animated","pulse","infAnimation");
    this._elementUI.alt = "none";
    this._constUIGroup.add(this._elementUI);

    this._hpBarWidth = 300;
    let hpBarUI = UI.createText(0.5,0.9,this._hpBarWidth+10,30,"",2);
    hpBarUI.style.backgroundColor = 'white';
    hpBarUI.style.borderRadius = '10px';
    this._constUIGroup.add(hpBarUI);

    this._hpBar = UI.createText(0.5,0.9,this._hpBarWidth,20,"",2);
    this._hpBar.style.backgroundColor = 'red';
    this._hpBar.style.borderRadius = '10px';
    this._constUIGroup.add(this._hpBar);
    this._constUIGroup.show();

    Builder.scene.UIGroups["playerController"] = this._constUIGroup;
   }
  get animation(){
    return this._animation;
  }

  shot(deltaTime){
    // new bullet event to server
    // calculate ballet's position and vector
    if((this._inputTime -= deltaTime) <= 0 && Input.mouseDown){
      Builder.raycaster.setFromCamera(this._mid,Builder.scene.camera); // raycasting from camera
      let intersects = Builder.raycaster.intersectObjects( Builder.scene.raycastableObject,true); // find intersect objects from all object in scene
      if(intersects.length){
        let intersectPosition = intersects[0].point.clone(); // first object = nearest object
        let characterPosition = this.object.position.clone(); // my player position
        characterPosition.y += 0.15; // adjust position
        intersectPosition.sub(characterPosition);

        NetworkManager.socket.emit("addbullet",{
            vector: intersectPosition
        });

        this._inputTime = this._inputDelay;
      }
    }
  }
  calcDirection(zd,xd){
    let length = Math.sqrt(zd*zd + xd*xd);
    zd = zd /= length;
    xd = xd /= length;
    return [zd,xd];
  }
  release(){
    this._constUIGroup.release();
    delete Builder.scene.UIGroups["playerController"];
  }

  // It should be calculated by the server to make the process safe,
  // but it is done by the client to minimize user input delay
  update(deltaTime){

    /* hp bar UI */
    this._hpBar.style.width = (this._hp / this._MaxHp * 300)+"px";

    /* score UI */
    if(this._scoreText.innerText != this._score ){
      this._scoreText.classList.add("animated","heartBeat","faster");
      this._scoreText.innerText = this._score;
      setTimeout(()=>{
        this._scoreText.classList.remove("animated","heartBeat","faster");
      },500);
    }

    /* element UI */
    if(this._elementUI.alt != this._element){
      this._elementUI.classList.remove("animated","pulse","infAnimation");
      this._elementUI.classList.add("animated","flip","faster");
      this._elementUI.alt = this._element;
      setTimeout(()=>{
        this._elementUI.src = "./items/"+this._element+".png";
      },250);
      setTimeout(()=>{
        this._elementUI.classList.remove("animated","flip","faster");
        this._elementUI.classList.add("animated","pulse","infAnimation");
      },500);
    }

    /* time UI */
    const now = Date.now();
    this._timeText.innerText = (this._time > 0 ? (this._time/1000).toFixed(1) : 0) + " lefts";


    // update character animation FSM(Finite State Machine)
    if(this._dead){
      this.animation.setState("Dead");
      this.animation.update(deltaTime);
      return this._removeFlag;
    }/*
    if(Input.keyDown('32')){
        this.animation.setState("Jump");
    }*/
    else if(!Input.keyDown('68') && !Input.keyDown('65') && !Input.keyDown('83') && !Input.keyDown('87') && !Input.mouseDown ){
      this.animation.setState("Idle");
    }
    else if(Input.mouseDown){
        if(Input.keyDown('87')){
            this.animation.setState("RunShot");
        }
        else if(Input.keyDown('65')){
            this.animation.setState("Left");
        }
        else if(Input.keyDown('68')){
            this.animation.setState("Right");
        }
        else if(Input.keyDown('83')){
            this.animation.setState("Back");
        }
        else{
          this.animation.setState("Shot");
        }
    }
    else{
      if(Input.keyDown('87') || Input.keyDown('65') || Input.keyDown('83') || Input.keyDown('68')){
          this.animation.setState("Run");
      }
      else{
        this.animation.setState("Idle");
      }
    }


    this.shot(deltaTime);

    // update character position rotation
    let speed = 3;
    let run = 1;
    if(Input.keyDown('16') && !Input.mouseDown){
      run = 2;
    }
    let target = new THREE.Vector3();
    Builder.scene.camera.getWorldDirection(target); // get direction of camera

    const front = target.z;
    const right = target.x;

    let powLength = target.x*target.x + target.z*target.z;
    let xp = Math.sqrt(target.x*target.x / powLength);
    let zp = Math.sqrt(target.z*target.z / powLength);

    xp = -(target.x >= 0 ? xp : -xp);
    zp = -(target.z >= 0 ? zp : -zp);

    let dir = [0,0];

     // calc direction from what you input and camera direction
     // arctan to get character rotation
     // front = camera's front (from now you see at)
     // right = camera's right
     //  \|/
     //  -*- front
     //  /|\
     // right
     // atan2 match x,z view point vector to -pi to pi
    if(Input.keyDown('87') && Input.keyDown('65')){
      dir = this.calcDirection(front - right,right + front);
      this.object.rotation.y = (Math.atan2(xp,zp) - Math.PI*3/4);
    }
    else if(Input.keyDown('87') && Input.keyDown('68')){
      dir = this.calcDirection(front + right,right - front);
      this.object.rotation.y = (Math.atan2(xp,zp) + Math.PI*3/4);
    }
    else if(Input.keyDown('83') && Input.keyDown('65')){
      dir = this.calcDirection(-front - right,-right + front);
      this.object.rotation.y = (Math.atan2(xp,zp) - Math.PI/4);
    }
    else if(Input.keyDown('83') && Input.keyDown('68')){
      dir = this.calcDirection(-front + right,-right - front);
      this.object.rotation.y = (Math.atan2(xp,zp) + Math.PI/4);
    }
    else if(Input.keyDown('87')){
      dir = [front,right];
      this.object.rotation.y = (Math.atan2(xp,zp) - Math.PI);
    }
    else if(Input.keyDown('83')){
      dir = [-front,-right];
      this.object.rotation.y = (Math.atan2(xp,zp));
    }
    else if(Input.keyDown('65')){
      dir = [-right,front];
      this.object.rotation.y = (Math.atan2(xp,zp) - Math.PI/2);
    }
    else if(Input.keyDown('68')){
      dir = [right,-front];
      this.object.rotation.y = (Math.atan2(xp,zp) + Math.PI/2);
    }
    if(Input.mouseDown){
      this.object.rotation.y = (Math.atan2(xp,zp) - Math.PI);
    }

    let d = new THREE.Vector2(dir[0],dir[1]);
    d.normalize();
    let dx = d.x * run * deltaTime * speed;
    if(this.object.position.z + dx > 24){
      this.object.position.z = 24;
    }
    else if(this.object.position.z + dx < -24){
      this.object.position.z = -24;
    }
    else{
      this.object.position.z += dx;
    }



    let dy = d.y * run * deltaTime * speed;
    if(this.object.position.x + dy > 24){
      this.object.position.x = 24;
    }
    else if(this.object.position.x + dy < -24){
      this.object.position.x = -24;
    }
    else{
      this.object.position.x += dy;
    }

    Builder.scene.camera.position.z = this.object.position.z - target.z*0.5;
    Builder.scene.camera.position.x = this.object.position.x - target.x*0.5;

    Builder.scene.players[NetworkManager.userid];
    // update user data in server
    NetworkManager.playerUpdate(this.object.position, this.object.rotation.y, this.animation.state);
    this.animation.update(deltaTime);

    return true;
  }
}
