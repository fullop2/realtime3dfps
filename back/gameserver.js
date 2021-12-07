const express = require('express');
const app = express();
app.use('/',express.static('./front/'));
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const fs = require('fs');

let scoreBoard = [];


let playerSpeedTracker = {};
let players = {};
let playersCC = [];
let items = [];
let bullets = [];
let objects = [];
let willBeRemoveBullets = [];
let willBeRemoveItems = [];
let nowTime = Date.now();

const ALIVETIMECOUNT = 180500;
const ADDITIONALTIME = 10000;
const MAXHP = 300;
const NORMALSPEED = 3;
const BASEDELTATIME = 0.016;
const MAXDELTATIME = 0.02;
const MaxSpeedPerDeltatime = (2 * NORMALSPEED)*MAXDELTATIME;
const MaxAllowedSpeedPerDeltatime = (2 * NORMALSPEED + 0.2)*MAXDELTATIME;

const BULLETSPEED = {"none":8,"fire":7,"water":9,"grass":8,"earth":8};
const DAMAGE = {CONFLICT : 5, NORMAL : 8, COUNTER : 10 };
let chatSocket;
// on connect server - client

function LOGWITHDATE(string){
  console.log(Date().substring(0,24)+" : "+string);
}

io.on('connection',socket=>{

  socket.on('chatServerRequest',()=>{
    chatSocket = socket;
    LOGWITHDATE("Chat server successfully connected.");
  });

  socket.on("init",()=>{
    socket.emit("spawnAll",{players:players,bullets:bullets,items:items}); // 접속한 당사자는 모든 정보를 준다
  });

  socket.on('login',(player,nickname)=>{
    socket.id = player;
    socket.nickname = nickname;
    LOGWITHDATE(
      "CONNECT : " +
      "IP [" +socket.request.connection.remoteAddress + "] " +
      "NICKNAME : " + nickname);
    chatSocket.emit("login",socket.id,socket.nickname);
  });

  socket.on('spawn',()=>{
    if(players[socket.id] == undefined){
      players[socket.id] = createPlayer();
      playerSpeedTracker[socket.id] = createSpeedTracker();
      LOGWITHDATE("SPAWN : NICKNAME : " + socket.nickname);
      io.emit('spawn',socket.id,players[socket.id]); // 이미 접속 해있던 사람들에겐 이 사람의 정보만 준다
    }
  });

  socket.on('updatePlayer',data=>{

    if(players[socket.id] != undefined &&
      players[socket.id].time > 0 &&
      players[socket.id].hp > 0)
    {
      players[socket.id].time = players[socket.id].endTime - Date.now();
      // client crack protect
      let length = getEuclideDistance(players[socket.id].position, data.position);
      /*
      if(length > MaxAllowedSpeedPerDeltatime || playerSpeedTracker[socket.id].enableTrack){
        let tracker = playerSpeedTracker[socket.id];
        if(!playerSpeedTracker[socket.id].enableTrack){
          playerSpeedTracker[socket.id].enableTrack = true;
          playerSpeedTracker[socket.id].startTime = Date.now();
          setTimeout(()=>{
            const averageDistance = tracker.totalDistance / ((Date.now() - tracker.startTime) * 0.001) * BASEDELTATIME;
            if(averageDistance > MaxAllowedSpeedPerDeltatime){
              LOGWITHDATE("["+socket.request.connection.remoteAddress+"]"+"SPEED TOO FAST!");
              io.emit("kick",socket.id,"moved too fast!");
              delete players[socket.id];
              socket.disconnect();
            }
            else{
              playerSpeedTracker[socket.id].enableTrack = false;
              playerSpeedTracker[socket.id].totalDistance = 0;
            }
          },3000);
        }
        else{
          playerSpeedTracker[socket.id].totalDistance += getEuclideDistance(players[socket.id].position, data.position);
        }
      }
      else{
        players[socket.id].position = data.position;
      }*/
      //clearCCForPlayer(players[socket.id]);
      players[socket.id].position = data.position;
      players[socket.id].rotation = data.rotation;
      players[socket.id].state = data.state;
    }
    else{
      if(players[socket.id] != undefined && players[socket.id].state != "Dead")
      {
        players[socket.id].state = "Dead";
        io.emit("kill",socket.id);
        const data = scoreBoard.find(sb=>{return sb.player == socket.nickname});

        scoreBoard.push({
          score:players[socket.id].score,
          player:socket.nickname});
        scoreBoard.sort((a,b)=>{return b.score - a.score;});
        LOGWITHDATE(
          "Player DEAD NICKNAME : "+socket.nickname);
        setTimeout(()=>{
          /*
            save score
          */
          delete players[socket.id];
          io.emit('removeplayer',socket.id);
        },2000);
      }
    }
  });

  socket.on('addbullet',data=>{
    if(players[socket.id] != undefined)
    {
      if(Date.now() - players[socket.id].lastBulletShotTime < 0.08){
        return;
      }
      players[socket.id].lastBulletShotTime = Date.now();
      let player = players[socket.id];

      let bulletId = socket.id+Math.ceil(Math.random()*100000);
      data.id = bulletId;
      data.time = 1;
      data.speed = BULLETSPEED[player.element];
      data.element = player.element;
      data.player = socket.id;
      data.position = {};
      data.position.x = player.position.x;
      data.position.y = player.position.y+0.15;
      data.position.z = player.position.z;

      normalizeVector(data.vector);
      bullets.push(data);
      io.emit('addbullet',data);
    }
  });
  socket.on('update',()=>{
    io.emit('update',players,willBeRemoveBullets,willBeRemoveItems);
    willBeRemoveBullets = [];
    willBeRemoveItems = [];
  });
  socket.on('forceDisconnect',()=>{
    if(players[socket.id] != undefined)
    {
      delete players[socket.id];
      io.emit('logout',socket.id); // clients will get
      LOGWITHDATE(
        "DISCONNECT : " +
        "IP [" +socket.request.connection.remoteAddress + "]");
    }
  });
  socket.on('disconnect',()=>{
    if(players[socket.id] != undefined)
    {
      delete players[socket.id];
      io.emit('logout',socket.id); // clients will get
      LOGWITHDATE(
        "DISCONNECT : " +
        "IP [" +socket.request.connection.remoteAddress + "]");
    }
  });
});
setInterval(updateServerData,16);
setInterval(addItem,3000);

///////////////////////////////////////////////////////////////
function getEuclideDistance(pos1, pos2){
    return Math.sqrt(
      Math.pow(pos1.x - pos2.x, 2) +
      Math.pow(pos1.y - pos2.y, 2) +
      Math.pow(pos1.z - pos2.z, 2));
}
function lengthVector(vector){
  return Math.sqrt(vector.x*vector.x + vector.y*vector.y + vector.z*vector.z);
}
function normalizeVector(vector){
  const length = lengthVector(vector);
  vector.x /= length; vector.y /= length; vector.z /= length;
}
function originVector(vector){
  vector.x = 0; vector.y = 0; vector.z = 0;
}
function addVector(target,from){
  target.x = target.x + from.x; target.y = target.y + from.y; target.z = target.z + from.z;
}
function subVector(target,from){
  target.x = target.x - from.x; target.y = target.y - from.y; target.z = target.z - from.z;
}
function scalarAddVector(target,scalar){
  target.x += scalar; target.y += scalar; target.z += scalar;
}
function scalarMulVector(target,scalar){
  target.x *= scalar; target.y *= scalar; target.z *= scalar;
}
function copyVector3(vector){
  return {x : vector.x, y : vector.y, z : vector.z};
}

function createSpeedTracker(){
  return {
    enableTrack: false,
    totalDistance: 0,
    startTime:Date.now()
  };
}

function createPlayer(){
  return {
    position : {x : Math.random()*20, y : 0, z : 10 - Math.random()*20},
    rotation : 0,
    state : "Idle",
    time : ALIVETIMECOUNT,
    endTime:Date.now()+ALIVETIMECOUNT,
    hp : MAXHP,
    score : 0,
    element : "none",
    cc : "normal",
    strength: 0,
    armor : 0,
    ccInterval : 0,
    ccTimeout : 0,
    lastBulletShotTime : Date.now()
  };
}

let speedmulvec = {x:0,y:0,z:0};

function updateServerData(){
  let deltaTime = (Date.now() - nowTime) * 0.001;
  nowTime = Date.now();

  // remove timeout bullet
  bullets = bullets.filter(bullet=>{
    bullet.time -= deltaTime;
    if(bullet.time > 0)
    {
      addVector(speedmulvec,bullet.vector);
      scalarMulVector(speedmulvec,(bullet.speed * deltaTime));
      addVector(bullet.position, speedmulvec);
      originVector(speedmulvec);
      return true;
    }
    else{
      willBeRemoveBullets.push(bullet);
      return false;
    }
  });

  // collided player and bullet
  for(let userid in players){
    let playerPos = copyVector3(players[userid].position);
    playerPos.y+=0.13;
    bullets = bullets.filter((bullet)=>{
      if(bullet.player == userid){return true;}
      let length = getEuclideDistance(playerPos, bullet.position);
      if(length < 0.3 && players[userid].hp > 0)
      {
        fureDamageForPlayer(players[userid],bullet);
        addCCForPlayer(players[userid],bullet);

        willBeRemoveBullets.push(bullet);

        if(players[userid].hp <= 0){
          players[bullet.player].score += 1000;
        }
        else{
          players[bullet.player].score += 10;
        }
        return false;
      }
      return true;
    });

    items = items.filter(item=>{
      if(getEuclideDistance(playerPos, item.position) < 0.5)
      {
        itemInteractWithPlayer(players[userid],item.type);
        willBeRemoveItems.push(item);
        return false;
      }
      return true;
    });
  }
}

function dmgPlayer(player,amount){
  player.hp = player.hp - (amount - player.armor);
}

function fureDamageForPlayer(player,bullet){
  if(bullet.element == "fire"){
    if(player.element == "water"){dmgPlayer(player,DAMAGE.CONFLICT);}
    else if(player.element == "grass") {dmgPlayer(player,DAMAGE.COUNTER);}
    else{dmgPlayer(player,DAMAGE.NORMAL);}
  }
  else if(bullet.element == "water"){
    if(player.element == "grass"){dmgPlayer(player,DAMAGE.CONFLICT);}
    else if(player.element == "fire") {dmgPlayer(player,DAMAGE.COUNTER);}
    else{dmgPlayer(player,DAMAGE.NORMAL);}
  }
  else if(bullet.element == "grass"){
    if(player.element == "fire"){dmgPlayer(player,DAMAGE.CONFLICT);}
    else if(player.element == "water") {dmgPlayer(player,DAMAGE.COUNTER);}
    else{dmgPlayer(player,DAMAGE.NORMAL);}
  }
  else {// none
    dmgPlayer(player,DAMAGE.NORMAL);
  }
}

function burn(player){
  if(player.cc != "burn"){
    player.cc = "burn";
    let intv = setInterval(()=>{player.hp -= 1;},300);
    setTimeout(()=>{
      player.cc = "normal";
      clearInterval(intv);
    },1600);
  }
}

function addCCForPlayer(player,bullet){
  /* burn */
  if(bullet.element == "fire" &&
     player.element != "water" &&
     player.element != "fire")
  {
    burn(player);
  }
}

function itemInteractWithPlayer(player, itemtype){
  if(itemtype == "heal")
  {
    if(player.hp + 10 > MAXHP) {player.hp = MAXHP;}
    else {player.hp += 10;}
    player.endTime += ADDITIONALTIME;
    player.score = (player.score-100 <= 0) ? 0 : (player.score-100);
  }
  else if(itemtype == "fire")
  {
    if(player.element == "grass"){
      player.hp-=10;
      player.score += 100;
    }else{player.score += 50;}
    player.element = "fire";
  }
  else if(itemtype == "water")
  {
    if(player.element == "fire"){
      player.hp-=5;
      player.score += 100;
    }else{player.score += 50;}
    player.element = "water";
  }
  else if(itemtype == "grass")
  {
    if(player.element == "water"){
      player.hp-=5;
      player.score += 100;
    }
    else{player.score += 50;}
    player.element = "grass";
  }
  else{
    player.element = "none";
    player.score += 50;
  }
}

function addItem(){
  if(items.length < 30){
    let item = {
      id:Date.now(),
      type: "heal",
      position :{x:(20 - Math.random()*40), y:0.5, z:(20 - Math.random()*40)},
    };
    let r = Math.random();
    if(r > 0.8){
      item.type = "fire";
    }
    else if(r > 0.6){
      item.type = "water";
    }
    else if(r > 0.4){
      item.type = "grass";
    }
    else if(r > 0.2){
      item.type = "none";
    }
    else{

    }
    items.push(item);
    io.emit("newItem",item);
  }
}


///////////////////////////////////////////////////////////////
/* redirect to game */
app.get('/', (req, res)=>{
    fs.readFile('/var/www/html/game.html',(error,data)=>{
      res.writeHead(200, {'Content-Type' : 'text/html'});
      res.end(data);
    });
});

const Score = require("./score");

app.get('/score', (req, res)=>{
  /* score board page */
  res.writeHead(200);
  let list = "";
  scoreBoard.forEach((value,index)=>{
    list = list + Score.tr((index+1),value.player,value.score);
  });
  const data =
    Score.headToTitle+
    'SCORE BOARD'+
    Score.titleEnd +
    list +
    Score.bodyEnd;
  res.end(data);
});

/* open http server */
server.listen(3000,()=>{
  LOGWITHDATE('Game server listening on port 3000.');
});
