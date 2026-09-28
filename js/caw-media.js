(function(){
 function setup(){
  if(document.getElementById("cawLightbox"))return;
  const o=document.createElement("div");o.id="cawLightbox";o.className="caw-lightbox";o.innerHTML='<button class="caw-lightbox-close" aria-label="Close">×</button><button class="caw-lightbox-prev" aria-label="Previous">‹</button><div class="caw-lightbox-stage"></div><button class="caw-lightbox-next" aria-label="Next">›</button><div class="caw-lightbox-caption"></div>';
  document.body.appendChild(o);
  let items=[],index=0;
  function render(){const el=items[index];if(!el)return;o.querySelector(".caw-lightbox-stage").innerHTML=el.dataset.kind==="video"?'<video controls autoplay playsinline src="'+el.dataset.src+'"></video>':'<img src="'+el.dataset.src+'" alt="Caw media">';o.querySelector(".caw-lightbox-caption").textContent=(index+1)+" / "+items.length;o.classList.add("open")}
  document.addEventListener("click",e=>{const m=e.target.closest(".caw-media[data-lightbox]");if(!m)return;e.preventDefault();items=[...document.querySelectorAll(".caw-media[data-lightbox]")];index=Math.max(0,items.indexOf(m));render()});
  o.querySelector(".caw-lightbox-close").onclick=()=>o.classList.remove("open");
  o.querySelector(".caw-lightbox-prev").onclick=()=>{index=(index-1+items.length)%items.length;render()};
  o.querySelector(".caw-lightbox-next").onclick=()=>{index=(index+1)%items.length;render()};
  o.addEventListener("click",e=>{if(e.target===o)o.classList.remove("open")});
  document.addEventListener("keydown",e=>{if(!o.classList.contains("open"))return;if(e.key==="Escape")o.classList.remove("open");if(e.key==="ArrowLeft")o.querySelector(".caw-lightbox-prev").click();if(e.key==="ArrowRight")o.querySelector(".caw-lightbox-next").click()});
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup);else setup();
})();