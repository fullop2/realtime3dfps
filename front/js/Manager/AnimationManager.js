
/*
* Animation Manager
* animated by gltf model 2.0
*/
export class AnimationManager{
  constructor(object, animations){
    this._animations = animations;
    this._mixer = new THREE.AnimationMixer( object );
    this._state = animations[0]["name"];
  }
  get state(){
    return this._state;
  }
  setState(state){
    if(this._state != state){
      this.play(state);
    }
  }
  play(state){

    let clip = THREE.AnimationClip.findByName( this._animations, this._state );
    let action = this._mixer.clipAction( clip );
    action.stop();

    this._state = state;

    clip = THREE.AnimationClip.findByName( this._animations, this._state );
    action = this._mixer.clipAction( clip );
    action.play();
  }

  update(deltaTime){
    this._mixer.update( deltaTime );
  }
}
