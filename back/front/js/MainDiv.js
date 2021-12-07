import {NetworkManager} from "./Manager/Manager.js";
import {initChat} from "./Chat.js";

const regex = /\w{6,12}/;

export function initDivEvent(){
  let btn = document.getElementById("btnJoin");
  let nick = document.getElementById("nick");
  nick.value = "Guest"+Math.ceil(Math.random()*1000);
  btn.addEventListener("click",()=>{
    if(!nick.value.match(regex))
    {
      alert("영문자 숫자만 가능합니다");
      nick.value = "";
      return;
    }
    NetworkManager.chatSocket.emit("nicknameValidation",nick.value);
    NetworkManager.chatSocket.on("nicknameValidation",valid=>{
      if(valid=="true"){
        NetworkManager.setNickname(nick.value);
        NetworkManager.login();
        NetworkManager.spawn();
        initChat();
        let div = document.getElementById("divLogin");
        let parent = div.parentElement;
        div.classList.remove('bounceIn');
        div.classList.add('bounceOut');
        setTimeout(()=>{parent.removeChild(div);},1000);
      }
      else{
        alert("닉네임이 중복됩니다");
        nick.value = "";
      }
    });
  });
  $('#btnRespawn').click(function(){
    NetworkManager.spawn();

    $(this).parent().removeClass('bounceIn');
    $(this).parent().addClass('bounceOut');
    setTimeout(()=>{$('#divResult').toggle();},1000);
  });
}
