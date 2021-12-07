
/* Chat Server

GAME SERVER <------- CHAT SERVER
    ^                     ^
    |                     |
    |                     |
GAME CLIENT --------------|

GAME SERVER'S CLIENT : WEB, CHAT SERVER
CHAT SERVER'S CLIENT : WEB

CHAT SERVER RECEIVE DATA FROM GAME SERVER ALSO!
*/

const express = require('express');
const app = express();
const server = require('http').createServer(app);
const chatServer = require('socket.io')(server).listen(3005,()=>{
    console.log(Date().substring(0,24)+' Chat server listening on port 3005.');
});
const fs = require('fs');
const io = require('socket.io-client');
const gameServerSocket = io.connect('http://localhost:3000',
{secure: true, rejectUnauthorized: false});

let players = {};

/* client for game server part*/
gameServerSocket.emit('chatServerRequest');

gameServerSocket.on('login',(player,nickname)=>{
  players[player] = nickname;
  chatServer.emit("msg",messageLogin(players[player]));
});
gameServerSocket.on('spawn',(player,playerData)=>{
  chatServer.emit("msg",messageSpawn(players[player],playerData.position));
});
gameServerSocket.on("kill",player=>{
  if(players[player] != undefined)
  {
    chatServer.emit("msg",messageKill(players[player]));
  }
});
gameServerSocket.on("logout",player=>{
  if(players[player] != undefined)
  {
    chatServer.emit("msg",messageLogout(players[player]));
    delete players[player];
  }
});
gameServerSocket.on("kick",(player,reason)=>{
  if(players[player] != undefined)
  {
    chatServer.emit("msg",messageKick(players[player],reason));
    delete players[player];
  }
});

/* server for game client part */
chatServer.on("connection",socket=>{
  socket.on("nicknameValidation",nickname=>{
    for(let id in players){
      if(nickname == players[id]){
        socket.emit("nicknameValidation","false");
        return;
      }
    }
    socket.emit("nicknameValidation","true");
  });

  socket.on("newMsg",(id,msg)=>{
    if(msg.length > 40){
      msg = msg.substring(0,40);
    }
    let ip = socket.request.connection.remoteAddress;
    chatServer.emit("msg",message(players[id],msg,ip));
  });


});

function shortDate(){
  return Date().substring(0,24);
}
function shortTime(){
  return "["+Date().substring(16,21)+"]";
}
function messageSpawn(nickname,pos){
  let position = `(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)})`;
  let msg = " " + nickname + " has spawned " + position;
  return shortTime() + msg;
}
function messageLogin(nickname){
  let msg = " " + nickname + " has joined the server";
  return shortTime() + msg;
}
function messageLogout(nickname){
  let msg = " " + nickname + " left the server";
  return shortTime() + msg;
}
function messageKick(nickname, reason){
  let msg = " " + nickname + " is kicked by "+reason;
  return shortTime() + msg;
}
function messageKill(nickname){
  let msg = " " + nickname + " is dead";
  return shortTime() + msg;
}
function messageSys(nickname,aMsg,ip){
  let msg = " [SYS] " + nickname + " : " + aMsg;
  console.log("IP ["+ ip + "] "+ shortDate() + msg);
  return shortTime() + msg;
}
function message(nickname,aMsg,ip){
  let msg = " " + nickname + " : " + aMsg;
  console.log("IP ["+ ip + "] "+ shortDate() + msg);
  return shortTime() + msg;
}

function writeToServer(ip,nickname,string)
{
  let data = Date() + "/ Chat Log " + nickname + " : "+string;
  fs.writeFileSync("./chatlog.log",Date()+string,'utf8');
}
