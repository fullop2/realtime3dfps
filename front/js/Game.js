import {Builder} from "./Builder.js";
import {Stats} from "./Stats.js";

// initialize game
export function initGame(){
  // init WegGL Renderer
  let renderer = new THREE.WebGLRenderer({antialias:true});
  Builder.setRenderer(renderer);
  renderer.setSize(window.innerWidth,window.innerHeight); // set width and height
  renderer.shadowMap.enabled = true;
  renderer.shadowMapType = THREE.PCFSoftShadowMap;
  Builder.setContainer(renderer.domElement);
  let div = document.getElementById("div-game");
  div.appendChild(renderer.domElement); // append canvas to div

  // add point lock event
  renderer.domElement.addEventListener("click",()=>{
      renderer.domElement.requestPointerLock();
  });

  // add game performance status viewer
  Builder.setStats(new Stats());
  Builder.stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild( Builder.stats.dom );

  // init timer
  Builder.clock.start();
}

// rendering loop
export function renderloop(){
	Builder.stats.begin(); // performance recording start
  Builder.renderer.render(Builder.scene,Builder.scene.camera); // render objects;
  Builder.stats.end(); // performance recording stop
  requestAnimationFrame(renderloop); // request frame
}

// update loop
export function updateloop(){
  setInterval(()=>{
      Builder.scene.update(Builder.clock.getDelta()); // update custom objects
  },15);
};

// init game
initGame();
