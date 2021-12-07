import {ObjectController,Builder,Input,Resource,AnimationManager,UI} from "./ObjectController.js";

export class NPCController extends ObjectController{
  constructor(object,name){
    super(object);
    this._npcName = name;

    this._text = new UI.UIGroup();
    let text = UI.createText(0.5, 0.8, 200, 30, "E : 대화한다", "white","./npc_interact.png",2);
    this._text.add(text);

    this._log = new UI.UIGroup();
    text = UI.createText(0.5, 0.75, 500, 200, "불상이 있다. 경건함이 느껴진다.", "white","./npc_interact.png",2);
    this._log.add(text);

    this._mid = new THREE.Vector2(0,0);
   }
   findMe(){
     Builder.raycaster.setFromCamera(this._mid,Builder.scene.camera);
     let intersects = Builder.raycaster.intersectObjects( Builder.scene.children,true );
     if(intersects.length){
       let object = intersects[0].object;
       if(intersects[0].distance > 1.5){
         return false; // too far
       }
       while(!(object instanceof THREE.Scene))
       {
         if(object.parent == undefined){
           break;
         }
         object = object.parent;
       }
       if(object.uuid === this.object.uuid){
         return true;
       }
       else{
         return false;
       }
     }
     else{
       return false;
     }
   }

   update(deltaTime){
     if(this.findMe()){

       if(Input.keyDown('69')){
         this._text.hide();
         this._log.show();
       }
       else{
         this._text.show();
       }
     }
     else{
       this._text.hide();
     }

     if(Input.keyDown('67')){
       this._log.hide();
     }

     return true;
   }
   talk(){

   }
}
