import {Builder} from "./Builder.js";
import {Resource,Load} from "./Manager/Manager.js";
import {GScene} from "./GScene.js";
import {PointerLockControls} from "./three/examples/jsm/controls/PointerLockControls.js";
import {ShooterController} from "./Controller/ShooterController.js";
//import {Flycontrols} from "./three/examples/jsm/controls/FlyControls.js";
import * as UI from "./UI.js";
import {LoadingScene} from "./LoadingScene.js";
import {PlayerController} from "./Controller/PlayerController.js";
//import {NPCController} from "./Controller/NPCController.js";
import {NetworkManager,AnimationManager} from "./Manager/Manager.js";
/*
* MainScene main scene of Game
* based socket.io tcp connection
*/

const VECTORUP = new THREE.Vector3(0,1,0);

export function selectColor(element){
  if(element == "none"){return 0x333333;}
  else if(element == "fire"){return 0xff0000;}
  else if(element == "water"){return 0x0000ff;}
  else if(element == "grass"){return 0x00ff00;}
  else if(element == "heal"){return 0xcccccc;}
}

export class MainScene extends GScene{
  constructor(){
    let camera = new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,1000);
    camera.position.y = 0.6;
    super(camera);
    this._loadingScene = new LoadingScene(camera);

    this._speed = 0.01;
    this.UIGroups = {};

    this._players = {};
    this._bullets = {};

    this._items = {};

    this._ballGeometry = new THREE.SphereGeometry( 0.1, 16, 16 );
    /* raycastable
    player, plain, sky, obstacle
    */
    this._raycastableObject = [];

    Builder.setScene(this._loadingScene);
    this._controls = new PointerLockControls( camera, Builder.container );
  }
  get players(){
    return this._players;
  }
  get bullets(){
    return this._bullets;
  }
  get raycastableObject(){
    return this._raycastableObject;
  }
  get items(){
    return this._items;
  }
  // add new player with data from server
  addNewPlayer(id, serverData){
    let playerObject = cloneGltf(Resource.getModel("character"));
    let playerScene = playerObject.scene;

    playerScene.scale.x =
    playerScene.scale.y =
    playerScene.scale.z = 0.25;

    playerScene.position.x = serverData.position.x;
    playerScene.position.y = serverData.position.y;
    playerScene.position.z = serverData.position.z;
    playerScene.rotation.y = serverData.rotation;

    let animationManager = new AnimationManager(playerScene, playerObject.animations);
    animationManager.setState("Idle");
    playerObject.anim = animationManager;
    this.players[id] = playerObject;
    this.add(playerScene);
    this.raycastableObject.push(playerScene);
  }

  addItem(item){
    let geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
    let texture = Resource.getModel(item.type+"Item");
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter =THREE.NearestMipmapNearestFilter;
    let material = new THREE.MeshBasicMaterial( { color: 0xffffff, map: texture});
    item.mesh = new THREE.Mesh( geometry, material );
    item.mesh.position.x = item.position.x;
    item.mesh.position.y = item.position.y;
    item.mesh.position.z = item.position.z;
    item.mesh.rotation.x = Math.random()*2;
    item.mesh.rotation.z = Math.random()*2;
    this._items[item.id] = item;
    this.add(item.mesh);
  }
  // init socket connect
  initNetwork(){

    NetworkManager.init();

    NetworkManager.socket.on("spawnAll",serverData=>{
      for(let id in serverData.players)
      {
        const serverPlayer = serverData.players[id];
          this.addNewPlayer(id,serverData.players[id]);
      }
      serverData.bullets.forEach(ballData=>{
        this.addBullet(ballData);
      });
      serverData.items.forEach(item=>{
        if(this._items[item.id] == undefined){
          this.addItem(item);
        }
      });
    });
    // on newLogin connection : new player connected to server event
    NetworkManager.socket.on("spawn",(id,serverPlayer)=>{
      if(id != NetworkManager.userid){
        this.addNewPlayer(id,serverPlayer);
      }
      else{
        const playerModel = cloneGltf(Resource.getModel("character"));
        let player = playerModel.scene;
        player.scale.x = player.scale.y = player.scale.z = 0.25;
        player.position.x = serverPlayer.position.x;
        player.position.z = serverPlayer.position.z;
        let anim = playerModel.animations;
        let playerController = new PlayerController(player, anim, serverPlayer);
        this.addController(playerController);
        this.players[id] = playerController;
      }
    });
    // on logout connection : player logout event
    NetworkManager.socket.on("logout",id=>{
      this.removePlayer(id);
    });
    // on kill connection : player dead
    NetworkManager.socket.on("kill",id=>{
      if(this.players[id] != undefined){
        if(id == NetworkManager.userid){
          //this._controls = new FlyControls();
          /*
            display score panel
          */
          this.players[id]._dead = true;
          this.players[id].animation.setState("Dead");
          this.players[id].release();

          $('#btnRespawn').prop("disabled",true);
          $('#divResult').removeClass('bounceOut');
          $('#divResult').addClass('bounceIn');
          $('#scoreboard').attr('src', './score');
          $('#divResult').toggle();
          setTimeout(()=>{
            $('#btnRespawn').prop("disabled",false);
          },2200);
        }
        else{
          this.players[id].anim.setState("Dead");
        }
      }
    });
    // on removeplayer connection : player character remove event
    NetworkManager.socket.on("removeplayer",id=>{
      this.removePlayer(id);
    });
    NetworkManager.socket.on("newItem",item=>{
      if(this._items[item.id] == undefined){
        this.addItem(item);
      }
    });
    NetworkManager.socket.on("removeItem",item=>{
      if(this._items[item.id] != undefined){
        this.remove(this._items[item.id].mesh);
        delete this._items[item.id].mesh;
        delete this._items[item.id];
      }
    });
    NetworkManager.socket.on("addbullet",data=>{
      this.addBullet(data);
    });
    NetworkManager.socket.on("validSpeed",data=>{
        this.players[NetworkManager.userid].object.position.set(data.x,data.y,data.z);
    });
    NetworkManager.socket.on("update",(players,willBeRemoveBullets,willBeRemoveItems)=>{
      for(let id in this.players)
      {
        if(players[id] == undefined){
          this.remove(this.players[id]);
          delete this.players[id];
        }
        else if(id != NetworkManager.userid){
          if(players[id] != undefined){
            let server = players[id];
            let localObject = this.players[id].scene;
            localObject.position.x = server.position.x;
            localObject.position.y = server.position.y;
            localObject.position.z = server.position.z;
            localObject.rotation.y = server.rotation;
            this.players[id].anim.setState(server.state);
          }
        }
        else if(id == NetworkManager.userid){
          this.players[id]._hp = players[id].hp;
          this.players[id]._element = players[id].element;
          this.players[id]._score = players[id].score;
          this.players[id]._time = players[id].time;
        }
      }
      for(let serverBullet of willBeRemoveBullets)
      {
        if(this.bullets[serverBullet.id] != undefined)
        {
          this.bullets[serverBullet.id].setTime(-1);
          delete this.bullets[serverBullet.id];
        }
      }
      for(let serverItem of willBeRemoveItems)
      {
        if(this.items[serverItem.id] != undefined)
        {
          this.remove(this.items[serverItem.id].mesh);
          delete this.items[serverItem.id];
        }
      }
    });
  }

  addBullet(data){
    let ball = Resource.getModel(data.element+"Rocket").clone();
    ball.scale.setScalar(0.07);
    let quat = new THREE.Quaternion().setFromUnitVectors(VECTORUP,data.vector);
    ball.rotation.setFromQuaternion(quat);
    this.add(ball);
    let ballController = new ShooterController(ball,data.position,data.vector,data.speed,data.time);
    this.bullets[data.id] = ballController;
    this.addController(ballController);
  }

  removePlayer(id){
    if(this.players[id] != undefined)
    {
      if(id == NetworkManager.userid){
        this.players[id]._removeFlag = false;
      }
      else{
        this._raycastableObject = this._raycastableObject.filter(value=>{
          if(this.players[id].scene == value){return false;}
          else {return true;}
        });
        this.remove(this.players[id].scene);
        delete this.players[id];
      }
    }
  }

	init(){

    // skybox imgs
    const imgs = ['./skybox/clouds1_east.bmp',
     './skybox/clouds1_west.bmp',
     './skybox/clouds1_up.bmp',
     './skybox/clouds1_down.bmp',
     './skybox/clouds1_north.bmp',
     './skybox/clouds1_south.bmp'];


     // set promises
    let promises = [
      Load.cubeTex(imgs,'skybox'),
      Load.texture('./items/healpack.png','healItem'),
      Load.texture('./items/none.png','noneItem'),
      Load.texture('./items/fire.png','fireItem'),
      Load.texture('./items/water.png','waterItem'),
      Load.texture('./items/grass.png','grassItem'),
      Load.character('./shooter.glb','character'),
      Load.texture('./grass.png','grass'),
      Load.model('./walls.glb',"walls"),
      Load.model('./rockets/red_rocket.glb','fireRocket'),
      Load.model('./rockets/blue_rocket.glb','waterRocket'),
      Load.model('./rockets/green_rocket.glb','grassRocket'),
      Load.model('./rockets/gray_rocket.glb','noneRocket')
    ];
    // when all promises success then
	  Promise.all(promises)
    .then(resources=>{ // add all resource to ResourceManager
      for(let resource of resources){
        Resource.setModel(resource['name'], resource['model']);
      }
    })
    .then(()=>{ // make plane
      let geometry = new THREE.PlaneGeometry( 50, 50, 50 ); // make vertices
      let texture = Resource.getModel('grass'); // get texture from resource
      texture.wrapS = THREE.RepeatWrapping; // repeat
      texture.wrapT = THREE.RepeatWrapping; // on
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter =THREE.NearestMipmapNearestFilter;
      texture.repeat.set( 50, 50 ); // repeat count set
      let material = new THREE.MeshBasicMaterial({map:texture}); // set material
      let plane = new THREE.Mesh( geometry, material ); // create mesh (includes object data)
      plane.castShadow = false;
      plane.receiveShadow = true;
      plane.rotateX( - Math.PI / 2);
      plane.position.set(0,0,0);
      this.add( plane ); // add to scene
      this.raycastableObject.push(plane);
    })
    .then(()=>{
      let geometry = new THREE.SphereGeometry( 300, 32, 32 );
      let material = new THREE.MeshBasicMaterial( {color: 0xffffff, alphaTest: 0, visible: false, side: THREE.BackSide});
      let boundingSphere = new THREE.Mesh( geometry, material );
      this.add(boundingSphere);
      this.raycastableObject.push(boundingSphere);
    })
    .then(()=>{
      let walls = Resource.getModel('walls');
      walls.children[0].scale.setScalar(0.0294);
      walls.children[0].scale.z = 0.005;
      walls.children[0].position.x = walls.children[0].position.z = 25;
      walls.children[0].material =  new THREE.MeshDepthMaterial( {color: 0x333333} );

      this.add(walls.children[0]);
    })
    .then(()=>{ // make light

      var light = new THREE.PointLight( 0xcccccc, 3, 1000 ); // add point light
      light.castShadow = true;
      light.position.set( -10, 10, -10 );
      this.add( light );
      light = new THREE.HemisphereLight( 0xffffbb, 0x101010, 10 ); // add hemisphere light
      this.add(light);

    })
    .then(()=>{ // initialize game
      this._loadingScene.release(); // all loading ended then remove loadingScene
      this._loadingScene = null;
      Builder.setScene(this); // set scene this
      Builder.scene.background = Resource.getModel("skybox"); // load model from ResourceManager textured box
      this.initNetwork(); // init Network recv functions
    });
	}

  update(deltaTime){ // update

    super.update(deltaTime); // GScene.update
    NetworkManager.update(); // request server to get Update Data
    for(let id in this.players)
    {
      if(id != NetworkManager.userid){
          this.players[id].anim.update(deltaTime); // update all player's animation
      }
    }
    for(let id in this.items){
      this.items[id].mesh.rotation.y += 0.01;
      this.items[id].mesh.rotation.z += 0.01;
    }
  }

  release(){
    this.UIGroups.forEach(uig=>{uig.release();}); // when delete release UI element
  }
}
