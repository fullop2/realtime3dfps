import {OBJLoader} from "../three/examples/jsm/loaders/OBJLoader.js";

/*
* 3d model loader
* gltf, texture cube, texture
*/
export const Load = {
  _gltfLoader : new THREE.GLTFLoader(),
  _cubeTextureLoader : new THREE.CubeTextureLoader(),
  _textureLoader : new THREE.TextureLoader(),
  _objLoader : new OBJLoader(),
  get objLoader(){
    return this._objLoader;
  },
  get gltfLoader(){
    return this._gltfLoader;
  },
  get textureLoader(){
    return this._textureLoader;
  },
  get cubeTextureLoader(){
    return this._cubeTextureLoader;
  },

  model(file,name){
    const ext = file.substring(file.lastIndexOf(".")+1,file.length).toLowerCase();

    if(ext == "glb" || ext == "gltf"){
      return loadModel(this.gltfLoader,file,name);
    }
    else if(ext == 'obj'){
      return loadModel(this.objLoader,file,name);
    }
    else{
      console.error("unsupported format : "+ext);
      return null;
    }
  },
  texture(file,name){
      return loadTexture(file,name);
  },
  character(file,name){
    return new Promise((resolve,reject)=>{
        Load.gltfLoader.load(
          file,
          (gltf)=>{
            gltf.scene.traverse(node=>{
                if (node instanceof THREE.Mesh)
                {
                  node.castShadow = true;
                  //node.receiveShadow = false;
                }
            });
            resolve({ 'name' : name, 'model' : gltf});
          },
          (xhr)=>{
            console.log((xhr.loaded / xhr.total*100)+"% loaded");
          },
          (error)=>{
            console.log('An error happened at GLTF load: ' + error);
            reject(null);
          }
        );
    });
  },
  cubeTex(imgs,name){
    return new Promise((resolve,reject)=>{
      Load.cubeTextureLoader.load(imgs,
            cube=>{
              resolve({ 'name' : name, 'model' : cube});
            }
          );
    });
  },
  cubeOneTex(img,name){
    return new Promise((resolve,reject)=>{
      Load.cubeTextureLoader.load([img,img,img,img,img,img],
            cube=>{
              resolve({ 'name' : name, 'model' : cube});
            }
          );
    });
  }
}
function loadTexture(file,name){
  return new Promise((resolve,reject)=>{
      Load.textureLoader.load(
        file,
        (texture)=>{
          resolve({ 'name' : name, 'model' : texture});
        },
        (xhr)=>{
          console.log((xhr.loaded / xhr.total*100)+"% loaded");
        },
        (error)=>{
          console.log('An error happened at load: ' + error);
          reject(null);
        }
      );
  });
}

function loadModel(loader,file,name){
  return new Promise((resolve,reject)=>{
      loader.load(
        file,
        (model)=>{
            resolve({ 'name' : name, 'model' : model.scene});
        },
        (xhr)=>{
          console.log((xhr.loaded / xhr.total*100)+"% loaded");
        },
        (error)=>{
          console.log('An error happened at load: ' + error);
          reject(null);
        }
      );
  });
}
