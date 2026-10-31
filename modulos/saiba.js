/* saiba.js: o ⓘ que abre a explicação (F1-PR5c, 31/10/2026). Pedido do dono: tela com título curto, uma frase e uma ação; o
   resto vira um ⓘ que abre ao toque. Qualquer <button class="ibtn-i" data-i="id"> abre o <div class="i-pop" id="id"> ao lado,
   pela janela comum (EJ.pop: ✕/Esc/Voltar/toque fora fecham, uma por vez); o botão "Entendi" de dentro também fecha.
   Nada sai daqui para fora. */
(function(){
"use strict";
document.addEventListener("click",function(e){
  var b=e.target&&e.target.closest?e.target.closest(".ibtn-i"):null;
  if(b){var pop=document.getElementById(b.getAttribute("data-i"));if(!pop||!window.EJ)return;e.preventDefault();
    pop.hidden=false;EJ.pop(b,pop,{rotulo:b.getAttribute("aria-label")||"ⓘ",altura:420});
    /* a janela comum supõe um menu de 260 px; a explicação é mais larga, então encosta na borda direita quando não cabe (celular) */
    var L=document.documentElement.clientWidth,r=pop.getBoundingClientRect();
    if(r.right>L-8)pop.style.left=Math.max(8,L-8-r.width)+"px";
    return;}
  var ok=e.target&&e.target.closest?e.target.closest(".i-pop .i-ok"):null;
  if(ok&&window.EJ){var p=ok.closest(".i-pop");if(p)EJ.fecha(p);}
});
})();
