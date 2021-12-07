/*
* UIs create UI from HTML.
*/

// create custom element with tagname
// invisible from out of this file
function createUI(percentX, percentY, width, height, elementName, zIndex, inAnimation, outAnimation){
  let element = document.createElement(elementName);
  element.classList.add("UI");
  element.style.width = width+"px";
  element.style.height = height+"px";
  element.style.left = (window.innerWidth*percentX - (width/2))+"px";
  element.style.top = (window.innerHeight*percentY - (height/2))+"px";
  element.outAnimation = outAnimation;
  element.inAnimation = inAnimation;
  element.style.display = "none";
  return element;
}

// create text UI with attribute
export function createText(percentX, percentY, width, height, text, color, backgroundImage, zIndex, inAnimation, outAnimation){
  let textDiv = createUI(percentX,percentY, width, height,"div",zIndex,inAnimation,outAnimation);
  textDiv.style.backgroundImage = "url("+backgroundImage+")";
  textDiv.style.backgroundSize = "contain";
  textDiv.style.color = color;
  if(inAnimation != undefined){
    inAnimation.forEach(attr=>{
      textDiv.classList.add(attr);
    });
  }
  textDiv.innerHTML += text;

  return textDiv;
}

// create Img UI with attribute
export function createImg(percentX, percentY, width, height, src, zIndex, bootstrapClasses, inAnimation, outAnimation){
  let img = createUI(percentX,percentY, width, height,"img",zIndex,inAnimation,outAnimation);
  img.src = src;
  if(inAnimation != undefined){
    inAnimation.forEach(attr=>{
      img.classList.add(attr);
    });
  }

  return img;
}

// create buttom UI with attribute and action function
export function createButton(percentX, percentY, width, height, text, zIndex, bootstrapClasses, inAnimation, outAnimation, action) {
  let btn = createUI(percentX,percentY, width, height,"button",zIndex,inAnimation,outAnimation);
  btn.setAttribute("type","button");

  btn.innerHTML = text;

  // bootstrap
  btn.classList.add("btn");
  bootstrapClasses.forEach(attr=>{
    btn.classList.add(attr);
  })

  btn.innerHTML = text;
  // animate.css
  btn.outAnimation = outAnimation;
  btn.inAnimation = inAnimation;
  inAnimation.forEach(attr=>{
    btn.classList.add(attr);
  });

  btn.classList.add('animated');

  btn.addEventListener("click",action);

  return btn;
}

// UIGroup. show or hide UI by group
export class UIGroup {
  constructor(){
    this._UIs = [];
    this._visibility = false;
    this._container = document.getElementById("div-game");
  }

  add(ui){
      this._UIs.push(ui);
      this._container.appendChild(ui);
  }

  show(){
    if(!this._visibility){
      this._visibility = !this._visibility;
      this._UIs.forEach((ui)=>{
        ui.style.display = "block";
        if(ui.inAnimation != undefined){
          ui.outAnimation.forEach(attr=>{
            ui.classList.remove(attr);
          });
          ui.inAnimation.forEach(attr=>{
            ui.classList.add(attr);
          });
        }
      });
    }
  }
  hide(){
    if(this._visibility){
      this._visibility = !this._visibility;
      this._UIs.forEach((ui)=>{
        setTimeout(()=>{
          ui.style.display = "none";
        },this._inputDelay*1000);

        if(ui.outAnimation != undefined){
          ui.inAnimation.forEach(attr=>{
            ui.classList.remove(attr);
          });
          ui.outAnimation.forEach(attr=>{
            ui.classList.add(attr);
          });
        }
      }); // end forEach
    }
  }

  release(){
    const parent = document.getElementById("div-game");
    for(let x of this._UIs){
      parent.removeChild(x);
    }
  }
}
