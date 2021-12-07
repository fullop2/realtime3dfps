import {Input,NetworkManager} from "./Manager/Manager.js";

export function initChat(){

  let div = document.createElement("div");
  div.id = "chat";
  let chatDiv = document.createElement("div");
  chatDiv.id = "chatDiv";
  div.appendChild(chatDiv);

  NetworkManager.chatSocket.on("msg",msg=>{
    let newMsg = document.createElement("p");
    newMsg.innerHTML = msg;
    chatDiv.appendChild(newMsg);
    while(chatDiv.scrollHeight > 2000){
      chatDiv.removeChild(chatDiv.children[0]);
    }
    chatDiv.scrollTop = chatDiv.scrollHeight;
  });

  let chatInputBox = document.createElement("input");
  chatInputBox.id = "chatInputBox";
  chatInputBox.type = "text";
  chatInputBox.maxLength = "40";
  chatInputBox.class = "form-control";
  document.addEventListener("keydown",e=>{
    if(e.keyCode == 13){
      if(chatInputBox.style.display == "none"){
        chatInputBox.style.display = "block";
        chatInputBox.focus();
        Input.setLockInput(true);
        chatDiv.style.backgroundColor = "rgba(0,0,0,0.3)";
      }
      else{
        if(chatInputBox.value != ""){
          NetworkManager.chat(chatInputBox.value);
          chatInputBox.value = "";
        }
        chatInputBox.style.display = "none";
        Input.setLockInput(false);
        chatDiv.style.backgroundColor = "rgba(0,0,0,0)";
      }
    }
  });

  div.appendChild(chatInputBox);

  document.body.appendChild(div);
}
