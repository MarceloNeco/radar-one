/* eleicoes/resultado.js: Resultado e apuração (F1-PR6b, 31/10/2026). Votos e % de cada candidatura, por cargo e lugar, nos
   turnos da eleição do calendário, lidos dos mesmos arquivos de resultado do TSE que o site já usa (…-u.json), com a data e a
   hora da apuração e o link da fonte. Fica escondida com o módulo Eleições (interruptor "eleicoes") e abre por link direto:
   #resultado ou #resultado/<turno>/<cargo TSE>/<lugar>. Cópia no aparelho por 1 hora (planos2026:resultado; sem rede, a última
   cópia que houver). O que sai daqui: window.Resultado. */
(function(){
"use strict";
var EN=(window.IDIOMA||"pt")==="en";function T(p,e){return EN?e:p;}
var TSE="https://resultados.tse.jus.br/oficial/",K="planos2026:resultado",HORA=36e5,MAX=8;
var UFS="AC AL AM AP BA CE DF ES GO MA MG MS MT PA PB PE PI PR RJ RN RO RR RS SC SE SP TO".split(" ");
function $(id){return document.getElementById(id);}
function mk(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;}
function cfg(){return window.Calendario?Calendario.cfg():null;}
function guard(){try{var g=JSON.parse(localStorage.getItem(K)||"null");return g&&typeof g==="object"?g:{};}catch(e){return {};}}
function grava(g){var ks=Object.keys(g);if(ks.length>MAX){ks.sort(function(a,b){return (g[a].em||"")<(g[b].em||"")?-1:1;});ks.slice(0,ks.length-MAX).forEach(function(k){delete g[k];});}
  try{localStorage.setItem(K,JSON.stringify(g));}catch(e){}}
function pede(url,prazo){
  var ctrl=window.AbortController?new AbortController():null,t=setTimeout(function(){if(ctrl)ctrl.abort();},prazo||12000);
  return fetch(url,{cache:"no-cache",signal:ctrl?ctrl.signal:undefined}).then(function(r){clearTimeout(t);if(!r.ok)throw new Error("HTTP "+r.status);return r.json();},function(e){clearTimeout(t);throw e;});
}
/* rede primeiro; a cópia guardada vale por 1 h; sem rede, a última cópia que houver (marcada como antiga) */
function com(url){
  var g=guard(),c=g[url];
  if(c&&c.em&&Date.now()-new Date(c.em).getTime()<HORA)return Promise.resolve({dados:c.dados,em:c.em,guardado:true});
  return pede(url).then(function(j){var g2=guard();g2[url]={dados:j,em:new Date().toISOString()};grava(g2);return {dados:j,em:g2[url].em,guardado:false};},
    function(e){if(c)return {dados:c.dados,em:c.em,guardado:true,antigo:true};throw e;});
}
/* da configuração do TSE (ele-c.json): por turno e código de cargo, o código da eleição e os lugares que têm arquivo */
function mapa(j,c){
  var m={};((j&&j.pl)||[]).forEach(function(p){if(p.c!==c.tse)return;(p.e||[]).forEach(function(e){if(!/ordin/i.test(e.nm||""))return;var t=String(e.t);m[t]=m[t]||{};
    (e.abr||[]).forEach(function(a){(a.cp||[]).forEach(function(x){var cd=String(x.cd),r=m[t][cd]=m[t][cd]||{ele:String(e.cd),ufs:[]};var u=String(a.cd).toUpperCase();if(r.ufs.indexOf(u)<0)r.ufs.push(u);});});});});
  return m;
}
function urlU(c,ele,cd,lugar){var l=lugar.toLowerCase();return TSE+c.tse+"/"+ele+"/dados/"+l+"/"+l+"-c"+("000"+cd).slice(-4)+"-e"+("00000"+ele).slice(-6)+"-u.json";}
var S={turno:null,cargo:null,lugar:null,mapa:null,v:0};
function cargosDo(turno){var c=cfg(),t=c.turnos[turno-1];if(!t)return [];var vistos={},L=[];
  t.cargos.forEach(function(k){if(vistos[k])return;vistos[k]=1;var d=c.cargos[k];if(!d||d.tse==null)return;L.push({k:k,tse:String(d.tse),nome:EN?d.en:d.pt,br:d.lugar==="br"});});return L;}
function lugaresDo(turno,cargo){if(cargo.br)return ["BR"];var m=S.mapa&&S.mapa[String(turno)]&&S.mapa[String(turno)][cargo.tse];
  var l=m?m.ufs.filter(function(u){return u!=="BR";}):[];return l.length?l:UFS;}   /* "BR" na configuração = há arquivo em todas as UFs */
function ufPreferida(lugares){try{var u=JSON.parse(localStorage.getItem("planos2026:colinha")||"null");u=u&&u.uf;return lugares.indexOf(u)>-1?u:null;}catch(e){return null;}}
function sel(rotulo,opcoes,atual,ao){var w=mk("label","res-sel");w.appendChild(mk("span",null,rotulo));var s=mk("select");
  opcoes.forEach(function(o){var op=mk("option",null,o[1]);op.value=o[0];if(o[0]===atual)op.selected=true;s.appendChild(op);});
  s.addEventListener("change",function(){ao(s.value);});w.appendChild(s);return w;}
function num(n){n=+n||0;return n.toLocaleString(EN?"en-US":"pt-BR");}
/* o mapa do TSE (quais lugares têm arquivo) chega antes dos seletores, senão a lista de estados sai errada e o primeiro pedido vai
   para um lugar sem arquivo; sem rede e sem cópia, os seletores saem com a lista de fábrica. Troca rápida de seletor: só a última vale */
function monta(){
  var raiz=$("res-raiz"),c=cfg();if(!raiz||!c)return;
  var v=++S.v;
  garanteMapa().catch(function(){return null;}).then(function(){if(v===S.v)montaFiltros(raiz,c);});
}
function montaFiltros(raiz,c){
  raiz.textContent="";
  var turnos=c.turnos.map(function(t,i){return i+1;});
  if(!S.turno||turnos.indexOf(S.turno)<0)S.turno=turnos[turnos.length-1];
  var cargos=cargosDo(S.turno);if(!cargos.length){raiz.appendChild(mk("p","res-aviso",T("O calendário não tem cargos neste turno.","The calendar has no offices in this round.")));return;}
  if(!S.cargo||!cargos.some(function(x){return x.k===S.cargo.k;}))S.cargo=cargos.filter(function(x){return x.br;})[0]||cargos[0];   /* abre no cargo nacional (Presidente) quando o turno tem */
  var lugares=lugaresDo(S.turno,S.cargo);if(!S.lugar||lugares.indexOf(S.lugar)<0)S.lugar=S.cargo.br?"BR":(ufPreferida(lugares)||lugares[0]);
  var f=mk("div","res-f");
  f.appendChild(sel(T("Turno","Round"),turnos.map(function(n){return [String(n),Calendario.curto(n)||(n+"º")];}),String(S.turno),function(v){S.turno=+v;S.cargo=null;S.lugar=null;navega();}));
  f.appendChild(sel(T("Cargo","Office"),cargos.map(function(x){return [x.k,x.nome];}),S.cargo.k,function(v){S.cargo=cargos.filter(function(x){return x.k===v;})[0];S.lugar=null;navega();}));
  if(!S.cargo.br)f.appendChild(sel(T("Estado","State"),lugares.map(function(u){return [u,u];}),S.lugar,function(v){S.lugar=v;navega();}));
  raiz.appendChild(f);
  var out=mk("div","res-out");out.id="res-out";out.setAttribute("aria-live","polite");raiz.appendChild(out);
  carrega(out);
}
function navega(){try{history.replaceState(history.state,"","#resultado/"+S.turno+"/"+S.cargo.tse+"/"+S.lugar);}catch(e){}monta();}
var mapaP=null;
function garanteMapa(){if(S.mapa)return Promise.resolve(S.mapa);
  if(!mapaP)mapaP=com(TSE+"comum/config/ele-c.json").then(function(x){S.mapa=mapa(x.dados,cfg());return S.mapa;},function(e){mapaP=null;throw e;});
  return mapaP;}
function carrega(out){
  out.textContent="";out.appendChild(mk("p","res-aviso",T("Carregando o resultado…","Loading the result…")));
  var c=cfg(),turno=S.turno,cargo=S.cargo,lugar=S.lugar;
  var mesmo=function(){return turno===S.turno&&cargo===S.cargo&&lugar===S.lugar;};
  garanteMapa().then(function(m){var r=m[String(turno)]&&m[String(turno)][cargo.tse];if(!r)throw {semDado:true};return com(urlU(c,r.ele,cargo.tse,lugar));})
    .then(function(x){if(mesmo())pinta(out,x,cargo,lugar);})
    .catch(function(e){if(!mesmo())return;out.textContent="";
      var semDado=(e&&e.semDado)||/HTTP 404/.test(String(e&&e.message));
      out.appendChild(mk("p","res-aviso",semDado?T("Esta fonte não informa o dado neste recorte.","This source does not report data for this selection.")
        :navigator.onLine===false?T("Sem conexão e sem cópia guardada deste resultado.","No connection and no saved copy of this result.")
        :T("Não deu para buscar o resultado agora. Tente de novo em instantes.","Could not fetch the result right now. Try again shortly.")));});
}
function pinta(out,x,cargo,lugar){
  var j=x.dados||{};out.textContent="";
  var cands=[];(j.carg||[]).forEach(function(g){(g.agr||[]).forEach(function(a){(a.par||[]).forEach(function(p){(p.cand||[]).forEach(function(cd){
    cands.push({n:cd.n,nome:cd.nmu||cd.nm,completo:cd.nm,partido:p.sg,votos:+cd.vap||0,pct:cd.pvap,st:cd.st,eleito:cd.e==="s"});});});});});
  cands.sort(function(a,b){return b.votos-a.votos;});
  var cab=mk("p","res-cab");cab.appendChild(mk("b",null,cargo.nome+(cargo.br?"":" · "+lugar)));
  cab.appendChild(mk("span",null," · "+T("apuração de ","count as of ")+(j.dg||"?")+(j.hg?" "+j.hg:"")+(j.pst?" · "+j.pst+"% "+T("das seções apuradas","of polling sections counted"):"")));
  if(x.guardado)cab.appendChild(mk("span","res-guardado"," · "+(x.antigo?T("sem conexão: última versão guardada neste aparelho","offline: last version saved on this device"):T("cópia guardada neste aparelho","copy saved on this device"))));
  out.appendChild(cab);
  if(!cands.length){out.appendChild(mk("p","res-aviso",T("Esta fonte não informa o dado neste recorte.","This source does not report data for this selection.")));return;}
  var tw=mk("div","tw res-tw"),tb=mk("table","res-tab"),th=mk("thead"),tr=mk("tr");
  [T("Nº","No."),T("Candidatura","Candidate"),T("Partido","Party"),T("Votos","Votes"),"%",T("Situação","Status")].forEach(function(h,i){var c=mk("th",null,h);if(i===3||i===4)c.className="num";tr.appendChild(c);});
  th.appendChild(tr);tb.appendChild(th);var tbody=mk("tbody");
  cands.forEach(function(c){var r=mk("tr");if(c.eleito)r.className="eleito";
    r.appendChild(mk("td","num",c.n||""));var td=mk("td");td.appendChild(mk("b",null,c.nome));if(c.completo&&c.completo!==c.nome)td.appendChild(mk("small",null,c.completo));r.appendChild(td);
    r.appendChild(mk("td",null,c.partido||""));r.appendChild(mk("td","num",num(c.votos)));r.appendChild(mk("td","num",c.pct?c.pct+"%":""));
    var st=mk("td");if(c.eleito)st.appendChild(mk("span","res-eleito",T("Eleito(a)","Elected")));else st.textContent=c.st||"";r.appendChild(st);tbody.appendChild(r);});
  tb.appendChild(tbody);tw.appendChild(tb);out.appendChild(tw);
  var fonte=mk("p","res-fonte");fonte.appendChild(document.createTextNode(T("Fonte: ","Source: ")));
  var a=mk("a",null,"Tribunal Superior Eleitoral · resultados.tse.jus.br");a.href="https://resultados.tse.jus.br/";a.target="_blank";a.rel="noopener";fonte.appendChild(a);
  fonte.appendChild(document.createTextNode(T(" · votos válidos apurados e % sobre os válidos, como o TSE divulga."," · valid votes counted and % of valid votes, as published by the electoral court.")));
  out.appendChild(fonte);
}
function daRota(){var p=(location.hash||"").slice(1).split("/");if(p[0]!=="resultado")return false;
  if(p[1]&&/^\d$/.test(p[1]))S.turno=+p[1];
  if(p[2]){var cs=cargosDo(S.turno||1).filter(function(x){return x.tse===p[2];});if(cs.length)S.cargo=cs[0];}
  if(p[3])S.lugar=p[3].toUpperCase();return true;}
function aplica(){if(daRota())monta();}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",aplica);else aplica();
addEventListener("hashchange",aplica);
window.Resultado={monta:monta,mapa:mapa,urlU:urlU};
})();
