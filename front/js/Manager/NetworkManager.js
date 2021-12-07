/*
* make connection to server
* host : my ip : 3000 (node js server)
* based nodejs, socket.io
*/


export const NetworkManager = {
  userid : Date.now()+Math.ceil(Math.random()*1000),
  nickname : "",
  _socket :io.connect('http://106.10.50.52/'),
  _chatSocket : io.connect('ws://106.10.50.52:3005/'),
  get socket(){
    return this._socket;
  },
  get chatSocket(){
    return this._chatSocket;
  },
  setNickname(nickname){
    this.nickname = nickname;
  },
  init(){
    this.socket.emit("init");
  },
  login(){
    this.socket.emit("login",this.userid,this.nickname);
  },
  spawn(){
      this.socket.emit("spawn");
  },
  playerUpdate(position,rotation,state){
    this.socket.emit("updatePlayer",{
      position:position,
      rotation:rotation,
      state:state
    });
  },
  update(deltaTime){
    this.socket.emit("update");
  },
  chat(msg){
    this._chatSocket.emit("newMsg",this.userid,msg);
  }
};
