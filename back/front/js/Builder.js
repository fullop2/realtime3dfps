/**
* Game Build Data
* _container : canvas container element
* _scene : current drawing scene
* _clock : THREE library based clock
* _raycaster : THREE library raycaster
* _stats : Third party frame counter 
*/
export const Builder = {
  _container : null,
  _scene : null,
  _renderer : null,
  _clock : new THREE.Clock(),
  _raycaster : new THREE.Raycaster(),
  _stats : null,
  get raycaster(){
    return this._raycaster;
  },
  get stats(){
    return this._stats;
  },
  setStats(stats){
    this._stats = stats;
  },
  get scene() {
    return this._scene;
  },
  setScene(scene){
    if(this._scene)
    {
      this._scene = null;
    }
    this._scene = scene;
  },
  get renderer() {
    return this._renderer;
  },
  setRenderer(renderer){
    this._renderer = renderer;
  },
  get clock(){
    return this._clock;
  },
  get container(){
    return this._container;
  },
  setContainer(container){
    this._container = container;
  }
};
