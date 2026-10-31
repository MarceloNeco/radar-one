/* rotas.js: o shell com os quatro destinos (F1-PR5, 31/10/2026): Hoje · Explorar · Indicadores · Salvos.
   - as vistas próprias (#hoje, #explorar, #salvos) ligam e desligam aqui; Indicadores é a vista #infograficos de sempre
   - a barra de baixo (celular) ou lateral (computador) marca o destino atual com aria-current
   - histórico por camada (diretriz "Botão Voltar do celular"): trocar de aba não empilha (replaceState); de Hoje para uma aba é
     uma camada; na tela inicial o Voltar avisa "toque de novo para sair" e só o segundo toque sai
   - sem # no endereço, abre em #hoje
   O que sai daqui: window.Rotas = { cuida, destino, vai, eleicoesLigado, rotaEleitoral, eleicoes }; o principal.js pergunta
   cuida(base) para não cair em "inicio". Desde o F1-PR6 este módulo carrega antes do principal.js: sem # no endereço, Hoje
   liga aqui e a capa não chega a aparecer. */
(function(){
"use strict";
var DEST={hoje:"hoje",explorar:"explorar",indicadores:"infograficos",salvos:"salvos"};
var PROPRIAS=["hoje","explorar","salvos","resultado"];
/* F1-PR10 (ADR 0009): a tabela de aliases (dados/aliases.json): âncora antiga → rota nova (+ âncora dentro da tela). Chega antes do
   principal.js (app.js espera carregaAliases) para o # antigo já estar trocado quando a primeira tela abre; nas trocas seguintes,
   o hashchange cuida. Sem a tabela (sem rede na 1ª visita), o alias é identidade e nada muda. */
var BASE_URL=new URL("../",import.meta.url),ALIASES={};
function carregaAliases(){
  return fetch(new URL("dados/aliases.json",BASE_URL).href,{cache:"no-cache"}).then(function(r){return r.ok?r.json():null;})
    .then(function(j){ALIASES=(j&&j.aliases)||{};aplicaAlias();}).catch(function(){});
}
function rolaAte(id,n){var e=document.getElementById(id);n=n||0;
  if(e&&e.getClientRects().length){if(window.ancoraEm)ancoraEm(e);else e.scrollIntoView();return;}
  if(n<40)setTimeout(function(){rolaAte(id,n+1);},60);}
function aplicaAlias(){
  var b=base(),a=ALIASES[b];if(!a)return false;
  if(a.rota&&a.rota!==b){var resto=(location.hash||"").slice(1).split("/").slice(1);
    try{history.replaceState(history.state,"","#"+[a.rota].concat(resto).join("/"));}catch(e){}dispara();}
  if(a.ancora)rolaAte(a.ancora);
  return true;
}   /* resultado: tela da eleição desenhada por eleicoes/resultado.js (F1-PR6b) */
/* F1-PR6: as telas da eleição (hub, Colinha, Congresso, Presidência e as páginas de 2026) ficam no módulo eleicoes/, que só
   carrega quando o interruptor "eleicoes" está ligado ou quando um link direto pede; desligado, o cartão de Hoje, os atalhos e o
   grupo do ☰ somem pelo data-recurso="eleicoes" (recursos.js), mas os links antigos continuam abrindo (ADR 0009) */
var ELEICAO=["hub","colinha","congresso","mandato","resultado","inicio","historico","macrotemas","score","documentos","metodo","glossario"];
function eleicoesLigado(){return (!window.SolverRecursos||SolverRecursos.ligado("eleicoes",true))&&!(window.Calendario&&Calendario.fase()==="acompanhamento");}   /* F1-PR7: no acompanhamento a eleição some da navegação sem desligar o recurso */
function rotaEleitoral(b){b=b||base();return ELEICAO.indexOf(b)>-1||/^gl-/.test(b);}
var carregando=null;
function eleicoes(){
  if(!carregando)carregando=import("./eleicoes/congresso.js").then(function(){return import("./eleicoes/colinha.js");}).then(function(){return import("./eleicoes/resultado.js");})
    .then(function(){document.documentElement.setAttribute("data-eleicoes","carregado");});
  return carregando;
}
var EN=(window.IDIOMA||"pt")==="en";
function T(pt,en){return EN?en:pt;}
function base(){return (location.hash||"#hoje").slice(1).split("/")[0];}
function cuida(b){return PROPRIAS.indexOf(b)>-1;}
function destino(b){b=b||base();if(cuida(b))return b;if(b==="infograficos"||/^g-/.test(b))return "indicadores";return null;}
function pinta(){
  var b=base(),d=destino(b);
  PROPRIAS.forEach(function(v){var e=document.getElementById("v-"+v);if(e)e.classList.toggle("on",v===b);});
  [].forEach.call(document.querySelectorAll(".barra a[data-dest]"),function(a){
    if(a.getAttribute("data-dest")===d)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");});
  document.documentElement.setAttribute("data-destino",d||"eleicoes");
  if(b==="hoje")cartaoEleicao();
}
/* o cartão da eleição em Hoje: o texto vem do calendário e muda sozinho com a fase ("Eleição 2026 · encerrada") */
function cartaoEleicao(){
  var t=document.getElementById("hoje-el-t"),s=document.getElementById("hoje-el-s");if(!t||!window.Calendario)return;
  try{t.textContent=Calendario.cabecalho();
    /* F1-PR7: a linha de baixo acompanha a fase (ADR 0010): antes da eleição não há Colinha nem resultado para prometer */
    if(s){var f=Calendario.fase();s.textContent=f==="pre-campanha"?T("Candidaturas, planos e Congresso","Candidates, plans and Congress")
      :typeof f==="number"?T("Colinha, planos, Congresso e Presidência","Cheat sheet, plans, Congress and Presidency")
      :T("Arquivo da eleição: resultado, planos, Colinha e Congresso","Election archive: results, plans, cheat sheet and Congress");}
  }catch(e){}
}
function dispara(){var ev;try{ev=new HashChangeEvent("hashchange");}catch(e){ev=document.createEvent("Event");ev.initEvent("hashchange",false,false);}dispatchEvent(ev);}
function vai(d){
  var alvo="#"+(DEST[d]||d);
  if(location.hash===alvo){scrollTo({top:0,behavior:"auto"});return;}
  var de=destino();
  if(de&&de!=="hoje"){   /* de uma aba para outra: troca no lugar, sem empilhar (abas ficam uma camada acima de Hoje) */
    try{history.replaceState(history.state,"",alvo);}catch(e){location.hash=alvo;return;}
    dispara();
  } else location.hash=alvo;   /* de Hoje (ou de uma tela das Eleições) para uma aba: uma camada nova */
}
/* aviso curto, sem janela (uma janela criaria mais uma camada no histórico) */
function aviso(txt){
  var a=document.getElementById("rotas-aviso");
  if(!a){a=document.createElement("div");a.id="rotas-aviso";a.className="rotas-aviso";a.setAttribute("role","status");a.setAttribute("aria-live","polite");document.body.appendChild(a);}
  a.textContent=txt;a.classList.add("on");clearTimeout(aviso.t);aviso.t=setTimeout(function(){a.classList.remove("on");},3200);
}
document.addEventListener("click",function(e){var a=e.target&&e.target.closest?e.target.closest(".barra a[data-dest]"):null;if(!a)return;e.preventDefault();vai(a.getAttribute("data-dest"));});
addEventListener("hashchange",pinta);
addEventListener("hashchange",aplicaAlias);
if(window.Calendario&&Calendario.aoMudar)Calendario.aoMudar(function(){if(base()==="hoje")cartaoEleicao();});   /* a fase mudou (pela data ou pelo RootifyONE): o cartão de Hoje acompanha */
window.Rotas={cuida:cuida,destino:destino,vai:vai,eleicoesLigado:eleicoesLigado,rotaEleitoral:rotaEleitoral,eleicoes:eleicoes,carregaAliases:carregaAliases,aplicaAlias:aplicaAlias};   /* antes de qualquer hashchange: o principal.js pergunta cuida() */
/* entrada: sem # abre em Hoje; a primeira entrada do histórico fica marcada para o aviso do Voltar */
if(!location.hash){try{history.replaceState({inicio:1},"","#hoje");}catch(e){location.hash="#hoje";}dispara();}
else if(base()==="hoje"){try{history.replaceState(Object.assign({},history.state||{},{inicio:1}),"",location.href);}catch(e){}}
else if(cuida(base()))dispara();   /* link direto para #explorar ou #salvos: liga a vista já aqui (o principal.js chega depois e respeita cuida()) */
/* a guarda: o Chrome ignora pushState sem toque da pessoa, por isso ela nasce no primeiro toque (e volta depois do aviso) */
var guarda=false;
addEventListener("pointerdown",function(){if(guarda)return;guarda=true;if(base()==="hoje"){try{history.pushState({guarda:1},"",location.href);}catch(e){}}},{capture:true});
addEventListener("popstate",function(){
  var s=history.state;
  if(s&&s.inicio&&base()==="hoje"&&guarda){
    aviso(T("Toque em Voltar de novo para sair do RadarONE.","Tap Back again to leave RadarONE."));
    guarda=false;   /* o próximo Voltar sai; um toque novo recria a guarda */
  }
});
pinta();
})();
