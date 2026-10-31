/* eleicoes/congresso.js: hub, Congresso e Presidência, CongressoV2 (bloco 8, v2.0)
   Movido como está do index.html 2.5.4 no F1-PR3 (31/10/2026): mesmo código, mesmos nomes; o que sai daqui para fora é só window.X (ver docs/modulos-contrato.md). */
/* =====================================================================
   v2.0: escolha inicial (hub) + módulo Congresso.
   - Endereço sem #: a primeira visita abre a escolha; depois, a última parte
     usada (planos2026:modo).
   - Congresso: #congresso (início), #congresso/afinidade, /favoritos,
     /comparar, /metodo e #congresso/ficha/<UF>/<id do TSE>.
   - Dados: congresso/indice.json e congresso/<UF>.json, gerados por
     congresso-sync.py a partir das APIs oficiais. O método está escrito em
     congresso-pautas.json e explicado na aba Método.
   - O que a pessoa marca fica só neste navegador (planos2026:congresso).
   - Aqui, e só aqui, há % de afinidade: decisão do dono do site (02/Out/2026).
   ===================================================================== */
(function(){
"use strict";
var EN=/^en/i.test(document.documentElement.getAttribute("lang")||"")||/index-en\.html$/.test(location.pathname);
function T(pt,en){return EN?en:pt;}
function mk(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;}
function $(id){return document.getElementById(id);}
function le(k){try{return JSON.parse(localStorage.getItem(k)||"null");}catch(e){return null;}}
function grava(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function link(txt,href){var a=mk("a",null,txt);a.href=href;a.target="_blank";a.rel="noopener";return a;}
var KM="planos2026:modo", KC="planos2026:congresso";
var MES=EN?["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]:["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
function dia(iso){if(!iso)return "";var d=new Date(iso.length===10?iso+"T12:00:00":iso);if(isNaN(d))return iso;
  var dd=("0"+d.getDate()).slice(-2),m=MES[d.getMonth()],y=d.getFullYear();return EN?m+"/"+dd+"/"+y:dd+"/"+m+"/"+y;}
function hora(d){return ("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2);}
/* data e hora no fuso do aparelho: 02/Out/2026 16:12 */
function quando(iso){if(!iso)return "—";var d=new Date(iso);return isNaN(d)?iso:dia(iso)+" "+hora(d);}
/* botão de seta que inverte uma ordem (A→Z / Z→A, maior / menor primeiro) */
function botaoDir(rotulo,get,set){var b=mk("button","cg-dir");b.type="button";
  function pinta(){var r=rotulo(get());b.textContent=r[0];b.setAttribute("aria-label",r[1]);b.title=r[1];}
  b.addEventListener("click",function(){set(-get());pinta();});pinta();b.pinta=pinta;return b;}
function semAcento(s){return (s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();}
function sigla(p){var s=semAcento(p).toUpperCase().replace(/\s+/g,"");return {PODEMOS:"PODE",UNIAOBRASIL:"UNIAO"}[s]||s;}
function reais(v){if(v==null)return "—";try{return new Intl.NumberFormat(EN?"en-US":"pt-BR",{style:"currency",currency:"BRL",notation:v>=1e6?"compact":"standard",maximumFractionDigits:v>=1e6?1:0}).format(v);}catch(e){return "R$ "+Math.round(v);}}
var SETA='<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
var ALCA='<svg viewBox="0 0 12 18" width="12" height="18" aria-hidden="true"><g fill="currentColor"><circle cx="3" cy="3" r="1.6"/><circle cx="9" cy="3" r="1.6"/><circle cx="3" cy="9" r="1.6"/><circle cx="9" cy="9" r="1.6"/><circle cx="3" cy="15" r="1.6"/><circle cx="9" cy="15" r="1.6"/></g></svg>';
var UFN={AC:"Acre",AL:"Alagoas",AM:"Amazonas",AP:"Amapá",BA:"Bahia",CE:"Ceará",DF:"Distrito Federal",ES:"Espírito Santo",GO:"Goiás",
  MA:"Maranhão",MG:"Minas Gerais",MS:"Mato Grosso do Sul",MT:"Mato Grosso",PA:"Pará",PB:"Paraíba",PE:"Pernambuco",PI:"Piauí",PR:"Paraná",
  RJ:"Rio de Janeiro",RN:"Rio Grande do Norte",RO:"Rondônia",RR:"Roraima",RS:"Rio Grande do Sul",SC:"Santa Catarina",SE:"Sergipe",SP:"São Paulo",TO:"Tocantins"};
var CARGO={S:T("Senado","Senate"),F:T("Câmara","Chamber")};
var CARGO_L={S:T("Senador(a)","Senator"),F:T("Deputado(a) federal","Federal deputy")};

/* ---------------- as três partes ---------------- */
var MODOS={
  colinha:{ic:"🗳️",t:T("Colinha","Cheat sheet"),d:T("Os números de todos os cargos, na ordem da urna, para mandar no WhatsApp.","Every office's number, in ballot order, to send on WhatsApp."),go:"#colinha"},
  hub:{ic:"🧭",t:T("Início","Start"),d:T("Eleições 2026 · as duas partes juntas","Elections 2026 · both parts together")},
  presidencia:{ic:"🏛️",t:T("Presidência","Presidency"),d:T("Os oito planos de governo, lidos com o mesmo critério.","The eight government plans, read with the same criteria."),go:"#inicio"},
  congresso:{ic:"⚖️",t:T("Congresso","Congress"),d:T("Senadores e deputados federais do seu estado: o que já votaram e propuseram.","Senators and federal deputies in your state: what they have voted and proposed."),go:"#congresso"}
};
function partesHash(){return (location.hash||"").slice(1).split("/");}
function modoAtual(){var h=partesHash()[0];return (h==="hub"||h==="colinha")?"hub":h==="congresso"?"congresso":"presidencia";}   /* a colinha vale para as duas partes */
function vaiModo(m){var alvo=m==="hub"?"#hub":MODOS[m].go;if(location.hash!==alvo)location.hash=alvo;else scrollTo(0,0);}
function vai(h){if(location.hash!==h)location.hash=h;else scrollTo(0,0);}

/* botão "Presidência ▾" no topo (computador) e as abas do Congresso; no celular, tudo no ☰ */
var ABAS=[["",T("Início","Home")],["afinidade",T("Afinidade","Affinity")],["favoritos",T("Favoritos","Favourites")],
          ["comparar",T("Comparar","Compare")],["mandato",T("Mandato","In office")],["metodo",T("Método","Method")]];
var Seletor={b:null,pop:null,menu:null,
  monta:function(){
    var brand=document.querySelector(".nav-in .brand");if(!brand||this.b)return;
    /* F1-PR5: o index.html já traz o botão e a fileira vazios, reservando o lugar desde a primeira pintura (o cabeçalho não pula
       quando este módulo chega); aqui só se preenche o que existe, e cria-se se não existir */
    var b=$("modo-b"),p=$("modo-pop");
    if(!b){var w=mk("div","modo");b=mk("button","modo-b");b.id="modo-b";b.type="button";p=mk("div","modo-pop");p.id="modo-pop";w.appendChild(b);w.appendChild(p);brand.parentNode.insertBefore(w,brand.nextSibling);}
    b.setAttribute("aria-haspopup","menu");b.setAttribute("aria-expanded","false");b.setAttribute("aria-controls","modo-pop");b.removeAttribute("aria-label");
    b.title=T("Trocar entre Presidência e Congresso","Switch between Presidency and Congress");
    p.setAttribute("role","menu");p.hidden=true;
    this.b=b;this.pop=p;
    b.addEventListener("click",function(){Seletor.abre();});
    var orig=$("menu");
    if(orig){var m=mk("span","menu");m.id="cg-menu";
      ABAS.forEach(function(a){var x=mk("button",null,a[1]);x.type="button";x.dataset.s=a[0];
        x.addEventListener("click",function(){vai("#congresso"+(a[0]?"/"+a[0]:""));});m.appendChild(x);});
      orig.parentNode.insertBefore(m,orig.nextSibling);this.menu=m;}
    var nav=document.querySelector("nav.nav"),sg=$("modo-seg");
    if(nav&&(!sg||!sg.children.length)){if(!sg){sg=mk("div","modo-seg");sg.id="modo-seg";nav.appendChild(sg);}
      sg.setAttribute("role","navigation");sg.setAttribute("aria-label",T("Partes do site","Site sections"));
      ["hub","colinha","presidencia","congresso"].forEach(function(k){var m=MODOS[k],x=mk("button",k==="colinha"?"ck":null);x.type="button";x.dataset.m=k;if(k==="colinha")x.setAttribute("data-recurso","colinha");
        x.appendChild(mk("span",null,m.ic));x.appendChild(document.createTextNode(m.t));
        x.addEventListener("click",function(){vaiModo(k);});sg.appendChild(x);});
      this.seg=sg;}
    this.pinta();
  },
  pinta:function(){if(!this.b)return;var m=MODOS[modoAtual()];
    if(this.seg){var h=partesHash()[0],at=h==="colinha"?"colinha":modoAtual();
      [].forEach.call(this.seg.children,function(x){if(x.dataset.m===at)x.setAttribute("aria-current","page");else x.removeAttribute("aria-current");});}
    this.b.innerHTML="";this.b.appendChild(mk("span",null,m.ic));this.b.appendChild(mk("span","mt",m.t));
    this.b.setAttribute("aria-label",m.t+" — "+T("trocar de parte","switch part"));
    var s=mk("span");s.innerHTML=SETA;this.b.appendChild(s);
    if(this.menu){var sub=partesHash()[1]||"";if(sub==="ficha")sub="afinidade";
      [].forEach.call(this.menu.children,function(x){if(x.dataset.s===sub)x.setAttribute("aria-current","page");else x.removeAttribute("aria-current");
        if(x.dataset.s==="favoritos"){var n=Cg.estado().fav.length;x.textContent=T("Favoritos","Favourites")+(n?" ("+n+")":"");}
        if(x.dataset.s==="mandato"){var k=Cg.novidades().length;x.textContent=T("Mandato","In office")+(k?" 🔔"+k:"");}});}},
  abre:function(){var p=this.pop,at=modoAtual();p.textContent="";
    ["hub","colinha","presidencia","congresso"].forEach(function(k,i){
      if(i===2)p.appendChild(mk("hr"));
      var m=MODOS[k],it=mk("button");it.type="button";it.setAttribute("role","menuitem");
      if(k===at)it.setAttribute("aria-current","page");
      if(k==="colinha")it.setAttribute("data-recurso","colinha");
      it.appendChild(mk("span","mi",m.ic));var d=mk("span");d.appendChild(mk("b",null,m.t));d.appendChild(mk("small",null,m.d));it.appendChild(d);
      it.addEventListener("click",function(){Seletor.fecha();EJ.quando(function(){vaiModo(k);});});p.appendChild(it);});
    EJ.pop(this.b,p,{focar:p.querySelector("button"),rotulo:this.b.title});},
  fecha:function(){if(this.pop)EJ.fecha(this.pop);}
};

/* ---------------- a escolha inicial (hub) ---------------- */
function pintaHub(){
  var v=$("v-hub");if(!v||v.dataset.ok)return;v.dataset.ok="1";
  var w=mk("section","wrap hub");
  /* a data e o turno vêm do calendário (window.Calendario) e trocam sozinhos quando a fase muda */
  var eb=mk("div","eyebrow",Calendario.cabecalho());w.appendChild(eb);
  var h=mk("h1");h.appendChild(document.createTextNode(T("Eleições ","Elections ")));h.appendChild(mk("span",null,"2026"));w.appendChild(h);
  w.appendChild(mk("p","lede",T("Duas ferramentas, um voto mais informado. Escolha por onde começar — dá para trocar a qualquer momento pelo nome lá em cima.",
    "Two tools, one better-informed vote. Choose where to start — you can switch at any time from the name at the top.")));
  /* Colinha da eleição: em destaque, acima das duas partes */
  var ck=mk("button","hub-ck");ck.type="button";ck.setAttribute("data-recurso","colinha");ck.appendChild(mk("span","hi","🗳️"));
  var ckt=mk("span");var ckb=mk("b",null,T("Colinha da eleição","Election cheat sheet"));ckb.appendChild(mk("span","nv",T("NOVO","NEW")));ckt.appendChild(ckb);
  var ckd=mk("span","t");ckt.appendChild(ckd);
  var textos=function(){eb.textContent=Calendario.cabecalho();ckd.textContent=T("Os números de "+Calendario.nomes()+", na ordem da urna e com foto. Monte, edite e mande no WhatsApp.",
    "The numbers for "+Calendario.nomes()+", in ballot order and with photos. Build, edit and send it on WhatsApp.");};
  textos();Calendario.aoMudar(textos);
  ck.appendChild(ckt);ck.appendChild(mk("span","go",T("Montar minha colinha →","Build my cheat sheet →")));
  ck.addEventListener("click",function(){location.hash="#colinha";});w.appendChild(ck);
  var g=mk("div","hub-g");
  [{k:"presidencia",cls:"",h:T("Presidência","Presidency"),
    p:T("Os oito planos de governo registrados no TSE, lidos com o mesmo critério.","The eight government plans registered with the electoral court, read with the same criteria."),
    li:[T("O que cada plano promete, com a página","What each plan promises, with the page"),T("Currículo, patrimônio e processos","Career, assets and court cases"),T("Dados públicos desde 1998","Public data since 1998")],
    f:T("8 candidaturas · sem ranking","8 candidacies · no ranking")},
   {k:"congresso",cls:"cg",h:T("Congresso","Congress"),
    p:T("Senadores e deputados federais do seu estado: o que já votaram e o que propuseram.","Senators and federal deputies in your state: what they have voted and proposed."),
    li:[T("Ordene suas pautas e diga sua posição em 9 temas","Rank your priorities and give your view on 9 topics"),T("Afinidade calculada com votos e propostas reais","Affinity built on real votes and bills"),T("Favoritos, comparação e a sua cola para a urna","Favourites, side-by-side comparison and your ballot memo")],
    f:T("Senado e Câmara · do seu estado","Senate and Chamber · in your state")}].forEach(function(o){
    var c=mk("button","hub-c "+o.cls);c.type="button";
    c.appendChild(mk("span","hi",MODOS[o.k].ic));c.appendChild(mk("h2",null,o.h));c.appendChild(mk("p",null,o.p));
    var ul=mk("ul");o.li.forEach(function(t){ul.appendChild(mk("li",null,t));});c.appendChild(ul);
    c.appendChild(mk("div","hf",o.f));
    c.addEventListener("click",function(){vaiModo(o.k);});g.appendChild(c);});
  w.appendChild(g);
  w.appendChild(mk("p","hub-p",T("Tudo o que você marca fica guardado só neste navegador. Nada sai daqui.","Everything you mark is kept only in this browser. Nothing leaves it.")));
  v.appendChild(w);
}

/* ---------------- lista que se ordena arrastando (ou pelas setas) ---------------- */
/* arrastar funciona com mouse, toque e caneta (Pointer Events); as setas ↑↓ e o
   teclado na alça são a alternativa de um toque (WCAG 2.5.7) */
function ordenavel(ul,aoMudar){
  var arr=null,y0=0;
  function ordem(){return [].map.call(ul.children,function(li){return li.dataset.id;});}
  function numera(){[].forEach.call(ul.children,function(li,i){li.querySelector(".n").textContent=i+1;
    var b=li.querySelectorAll(".ud button");b[0].disabled=i===0;b[1].disabled=i===ul.children.length-1;});}
  function move(li,dir){var alvo=dir<0?li.previousElementSibling:li.nextElementSibling;if(!alvo)return;
    if(dir<0)ul.insertBefore(li,alvo);else ul.insertBefore(alvo,li);numera();aoMudar(ordem());}
  ul.addEventListener("click",function(e){var b=e.target.closest(".ud button");if(!b)return;var li=b.closest("li");
    move(li,b.dataset.d==="-1"?-1:1);var f=li.querySelector('.ud button[data-d="'+b.dataset.d+'"]');if(f&&!f.disabled)f.focus();else li.querySelector(".h").focus();});
  ul.addEventListener("keydown",function(e){var h=e.target.closest(".h");if(!h)return;
    if(e.key==="ArrowUp"||e.key==="ArrowDown"){e.preventDefault();var li=h.closest("li");move(li,e.key==="ArrowUp"?-1:1);h.focus();}});
  ul.addEventListener("pointerdown",function(e){var h=e.target.closest(".h");if(!h||(e.button!==undefined&&e.button!==0))return;
    e.preventDefault();arr=h.closest("li");y0=e.clientY;arr.classList.add("arr");try{h.setPointerCapture(e.pointerId);}catch(x){}});
  ul.addEventListener("pointermove",function(e){if(!arr)return;
    var dy=e.clientY-y0;arr.style.transform="translateY("+dy+"px)";
    var r=arr.getBoundingClientRect(),meio=r.top+r.height/2;
    var ant=arr.previousElementSibling,prox=arr.nextElementSibling,mudou=false;
    if(ant){var ra=ant.getBoundingClientRect();if(meio<ra.top+ra.height/2){var t0=arr.offsetTop;ul.insertBefore(arr,ant);y0+=arr.offsetTop-t0;mudou=true;}}
    if(!mudou&&prox){var rp=prox.getBoundingClientRect();if(meio>rp.top+rp.height/2){var t1=arr.offsetTop;ul.insertBefore(prox,arr);y0+=arr.offsetTop-t1;mudou=true;}}
    if(mudou){arr.style.transform="translateY("+(e.clientY-y0)+"px)";numera();aoMudar(ordem());}});
  function solta(){if(!arr)return;arr.classList.remove("arr");arr.style.transform="";arr=null;numera();aoMudar(ordem());}
  ul.addEventListener("pointerup",solta);ul.addEventListener("pointercancel",solta);
  numera();
}

/* ---------------- módulo Congresso ---------------- */
var VOTO={S:T("Sim","Yes"),N:T("Não","No"),A:T("absteve-se","abstained"),O:T("obstrução","obstruction")};
var Cg={ind:null,uf:{},st:null,mostra:40,busca:"",carregando:null,tReq:0,
  estado:function(){if(!this.st){var s=le(KC)||{};
      this.st={uf:s.uf||"",cargo:s.cargo||"T",ord:s.ord||"geral",dir:s.dir||1,so:!!s.so,pri:s.pri||null,priOk:!!s.priOk,pos:s.pos||{},fav:s.fav||[],cmp:s.cmp||[],cola:s.cola||{},
        mtab:s.mtab||"pri",favOrd:s.favOrd||"nome",favDir:s.favDir||1,cmpDir:s.cmpDir||1,cmpVer:s.cmpVer||{cv:1,af:1,pos:1,pro:1},cmpLado:!!s.cmpLado,
        fontesEm:s.fontesEm||"",fontesRes:s.fontesRes||null};}
    return this.st;},
  salva:function(){grava(KC,this.st);},
  /* baixa um arquivo da pasta congresso/. novo=true fura o cache do navegador (botão Atualizar) */
  pega:function(nome,novo){return fetch("congresso/"+nome,novo?{cache:"no-cache"}:{}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json();});},
  garanteInd:function(novo){var self=this;
    if(this.ind&&!novo)return Promise.resolve(this.ind);
    if(this.carregando&&!novo)return this.carregando;
    this.carregando=this.pega("indice.json",novo).then(function(ind){self.ind=ind;self.carregando=null;
      var s=self.estado(),ids=ind.pautas.map(function(p){return p.id;});
      if(!s.pri||s.pri.length!==ids.length||ids.some(function(i){return s.pri.indexOf(i)<0;})){s.pri=ids;s.priOk=false;}
      return ind;},function(e){self.carregando=null;throw e;});
    return this.carregando;},
  garanteUF:function(uf,novo){var self=this;if(!uf)return Promise.resolve(null);
    if(this.uf[uf]&&!novo)return Promise.resolve(this.uf[uf]);
    return this.pega(uf+".json",novo).then(function(d){d.c.forEach(function(c){c.uf=uf;});self.uf[uf]=d;return d;});},
  falha:function(){return location.protocol==="file:"?T("Os dados do Congresso só carregam pelo site (não pelo arquivo aberto no computador).","Congress data only loads from the website (not from the file opened on the computer)."):
    T("Não consegui baixar os dados agora. Confira a internet e toque em Atualizar.","Could not download the data now. Check the connection and tap Refresh.");},
  acha:function(uf,id){var d=this.uf[uf];if(!d)return null;for(var i=0;i<d.c.length;i++)if(d.c[i].id===id)return d.c[i];return null;},

  /* ---------- contas ---------- */
  /* posição do candidato num eixo: o próprio voto; senão o padrão geral dos votos dele;
     senão a média da bancada do partido. Devolve {s: -1 (lado A) … +1 (lado B), f: fonte} */
  pos:function(c,eixo){
    if(c.e&&c.e[eixo])return {s:c.e[eixo][0],f:"voto",n:c.e[eixo][1]};
    if(c.g&&c.g[1]>=5)return {s:c.g[0],f:"geral",n:c.g[1]};
    var P=this.ind&&this.ind.partidos[sigla(c.p)];
    if(P)return {s:P.e[eixo]!=null?P.e[eixo]:P.g,f:"partido"};
    return null;},
  afPos:function(c){var s=this.estado(),self=this,soma=0,n=0,proprio=0;
    this.ind.eixos.forEach(function(e){var u=s.pos[e.id];if(!u)return;var p=self.pos(c,e.id);if(!p)return;
      soma+=1-Math.abs(u-p.s)/2;n++;if(p.f==="voto")proprio++;});
    return n?{pct:Math.round(100*soma/n),n:n,proprio:proprio}:null;},
  /* prioridades: cada proposta conta pelo peso da pauta (1ª = 1,0 … 10ª = 0,1) */
  afPri:function(c){var s=this.estado();if(!s.priOk||!c.t||c.t.n<3)return null;var soma=0;
    s.pri.forEach(function(id,i){soma+=((c.t.p[id]||0)/c.t.n)*(10-i)/10;});
    return {pct:Math.min(100,Math.round(100*soma)),n:c.t.n};},
  geral:function(c){var a=this.afPos(c),b=this.afPri(c),v=[];if(a)v.push(a.pct);if(b)v.push(b.pct);
    return {g:v.length?Math.round(v.reduce(function(x,y){return x+y;},0)/v.length):null,pos:a,pri:b};},

  /* ---------- favoritos e comparação ---------- */
  ehFav:function(c){return this.estado().fav.some(function(f){return f.u===c.uf&&f.i===c.id;});},
  ehCmp:function(c){return this.estado().cmp.some(function(f){return f.u===c.uf&&f.i===c.id;});},
  alternaFav:function(c){var s=this.estado();
    if(this.ehFav(c)){s.fav=s.fav.filter(function(f){return !(f.u===c.uf&&f.i===c.id);});
      [c.cg].forEach(function(k){if(s.cola[k])s.cola[k]=s.cola[k].filter(function(i){return i!==c.uf+"/"+c.id;});});}
    else s.fav.push({u:c.uf,i:c.id});
    this.salva();Seletor.pinta();},
  alternaCmp:function(c){var s=this.estado();
    if(this.ehCmp(c))s.cmp=s.cmp.filter(function(f){return !(f.u===c.uf&&f.i===c.id);});
    else{if(s.cmp.length>=3){aviso(T("Dá para comparar até 3. Tire um na aba Comparar.","You can compare up to 3. Remove one in the Compare tab."));return false;}s.cmp.push({u:c.uf,i:c.id});}
    this.salva();return true;},
  /* carrega os estados de uma lista de {u,i} e devolve os candidatos achados */
  resolve:function(lst){var self=this,ufs={};lst.forEach(function(f){ufs[f.u]=1;});
    return Promise.all(Object.keys(ufs).map(function(u){return self.garanteUF(u).catch(function(){return null;});}))
      .then(function(){return lst.map(function(f){return self.acha(f.u,f.i);}).filter(Boolean);});},

  /* ---------- telas ---------- */
  abre:function(){
    var v=$("v-congresso");if(!v)return;var self=this,p=partesHash(),sub=p[1]||"inicio";
    if(!v.dataset.ok){v.dataset.ok="1";this.casca(v);}
    var corpo=$("cg-corpo");corpo.textContent="";
    /* contador de novidades do mandato no menu (precisa das votações recentes e dos favoritos) */
    this.garanteInd(false).then(function(){return self.garanteRec(false);}).then(function(){return self.resolve(self.estado().fav);}).then(function(){Seletor.pinta();},function(){});
    var ufSel=$("cg-uf-top");if(ufSel)ufSel.value=this.estado().uf;
    this.garanteInd(false).then(function(){self.pintaData();
      if(sub==="afinidade")self.telaAf(corpo);
      else if(sub==="favoritos")self.telaFav(corpo);
      else if(sub==="comparar")self.telaCmp(corpo);
      else if(sub==="metodo")self.telaMet(corpo);
      else if(sub==="mandato")self.telaMandato(corpo);
      else if(sub==="ficha")self.telaFicha(corpo,p[2],p[3]);
      else self.telaInicio(corpo);
    },function(){corpo.appendChild(mk("div","wrap cg-vazio",self.falha()));});
  },
  /* faixa fixa no alto: estado, data dos dados e Atualizar */
  casca:function(v){
    var self=this,s=this.estado();
    var top=mk("div","wrap cg-top");
    var lb=mk("label",null,T("Seu estado ","Your state "));var sel=mk("select");sel.id="cg-uf-top";
    sel.appendChild(mk("option",null,T("Escolha…","Choose…"))).value="";
    Object.keys(UFN).sort(function(a,b){return UFN[a].localeCompare(UFN[b]);}).forEach(function(k){var o=mk("option",null,UFN[k]);o.value=k;sel.appendChild(o);});
    sel.value=s.uf;lb.appendChild(sel);top.appendChild(lb);
    sel.addEventListener("change",function(){s.uf=sel.value;self.mostra=40;self.salva();self.abre();});
    var d=mk("span");d.id="cg-data";top.appendChild(d);
    var bt=mk("button",null,"🔄 "+T("Atualizar","Refresh"));bt.type="button";
    bt.title=T("Busca de novo os dados oficiais (o site os confere todo dia)","Fetches the official data again (the site checks them every day)");
    var m=mk("span");m.id="cg-msg";m.setAttribute("role","status");
    bt.addEventListener("click",function(){bt.disabled=true;var antes=self.ind&&self.ind.conferido_em;m.textContent=T("Conferindo…","Checking…");
      self.garanteInd(true).then(function(ind){var u=self.estado().uf;self.uf={};return self.garanteUF(u,true).then(function(){return ind;});})
        .then(function(ind){bt.disabled=false;m.textContent=ind.conferido_em!==antes?T("Dados novos carregados às ","New data loaded at ")+hora(new Date())+".":
          T("Conferido às ","Checked at ")+hora(new Date())+T(": já está na versão mais nova.",": already the newest version.");self.abre();},
          function(){bt.disabled=false;m.textContent=self.falha();});});
    var bf=mk("button",null,"🏛 "+T("Conferir nas fontes oficiais","Check the official sources"));bf.type="button";
    bf.title=T("Busca agora, direto na Câmara, no Senado e no TSE, os votos e a data das candidaturas","Fetches the votes and the candidacy date right now, straight from the Chamber, the Senate and the electoral court");
    bf.addEventListener("click",function(){bf.disabled=true;self.fontes(m).then(function(){bf.disabled=false;self.pintaData();self.abre();},function(){bf.disabled=false;m.textContent=T("As fontes oficiais não responderam agora. Tente de novo em instantes.","The official sources did not respond now. Try again shortly.");});});
    top.appendChild(bt);top.appendChild(bf);top.appendChild(m);v.appendChild(top);
    var corpo=mk("div");corpo.id="cg-corpo";v.appendChild(corpo);
  },
  pintaData:function(){var d=$("cg-data"),i=this.ind,s=this.estado();if(!d||!i)return;
    d.textContent=T("Última sincronização: ","Last sync: ")+quando(i.conferido_em||i.atualizado_em)+" · "+T("último dado novo: ","last new data: ")+quando(i.atualizado_em)+
      (s.fontesEm?" · "+T("fontes conferidas por você: ","sources checked by you: ")+quando(s.fontesEm):"");},
  /* ---------- conferir agora nas fontes oficiais (Câmara, Senado e TSE aceitam o navegador) ----------
     Baixa de novo os votos de todas as votações usadas, corrige o que estiver diferente nos
     candidatos já carregados e recalcula a posição deles. Vale para esta visita; a cópia do
     site é refeita todo dia pelo congresso-sync.py. */
  fontes:function(m){
    var self=this,ind=this.ind,s=this.estado(),conf=0,mud=0,tocados=[];
    var por={};Object.keys(this.uf).forEach(function(u){self.uf[u].c.forEach(function(c){
      if(c.dep)(por["dep"+c.dep]=por["dep"+c.dep]||[]).push(c);if(c.sen)(por["sen"+c.sen]=por["sen"+c.sen]||[]).push(c);});});
    var lista=[];ind.eixos.forEach(function(e){e.votos.forEach(function(v){lista.push(v);});});
    ind.destaques.forEach(function(d){if(d.camara)lista.push({casa:"camara",id:d.camara.id});if(d.senado)lista.push({casa:"senado",cod:d.senado.cod,data:d.senado.data});});
    var MAPA_C={"Sim":"S","Não":"N","Abstenção":"A","Obstrução":"O"},MAPA_S={"Sim":"S","Não":"N","Abstenção":"A","P-NRV":"A"};
    function aplica(chave,quem,cod){conf++;(por[quem]||[]).forEach(function(c){c.v=c.v||{};if(c.v[chave]!==cod){c.v[chave]=cod;mud++;tocados.push(c);}});}
    var feitos=0,falhas=0,total=lista.length;
    function passo(){m.textContent=T("Conferindo nas fontes oficiais… ","Checking the official sources… ")+feitos+"/"+total;}
    passo();
    var dias={},vezSenado=Promise.resolve();
    /* o Senado recusa vários pedidos ao mesmo tempo: um dia de cada vez, com uma segunda tentativa */
    /* toda consulta tem uma segunda tentativa: as APIs públicas às vezes não respondem na primeira */
    function json2(url,op){var pega=function(){return fetch(url,op).then(function(r){if(!r.ok)throw new Error(r.status);return r.json();});};
      return pega().catch(function(){return new Promise(function(ok){setTimeout(ok,1500);}).then(pega);});}
    function senado(d){var p=vezSenado.then(function(){return json2("https://legis.senado.leg.br/dadosabertos/votacao?dataInicio="+d+"&dataFim="+d,{headers:{Accept:"application/json"}});});
      vezSenado=p.catch(function(){});return p;}
    var tarefas=lista.map(function(v){return function(){
      var pr=v.casa==="senado"?
        (dias[v.data]=dias[v.data]||senado(v.data))
          .then(function(lst){(lst||[]).forEach(function(x){if(x.codigoSessaoVotacao!==v.cod)return;(x.votos||[]).forEach(function(z){var cod=MAPA_S[z.siglaVotoParlamentar];if(cod)aplica("s"+v.cod,"sen"+z.codigoParlamentar,cod);});});}):
        json2("https://dadosabertos.camara.leg.br/api/v2/votacoes/"+v.id+"/votos")
          .then(function(j){(j.dados||[]).forEach(function(z){var cod=MAPA_C[z.tipoVoto];if(cod)aplica("c"+v.id,"dep"+z.deputado_.id,cod);});});
      return pr.then(null,function(){falhas++;}).then(function(){feitos++;passo();});};});   /* uma que falhe não para as outras */
    /* quatro pedidos por vez: rápido sem sobrecarregar as APIs públicas */
    function fila(){var t=tarefas.shift();return t?t().then(fila):Promise.resolve();}
    var tse=fetch("https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2026.zip",{method:"HEAD"})
      .then(function(r){return r.headers.get("last-modified");},function(){return null;});
    return Promise.all([fila(),fila(),fila(),fila(),tse]).then(function(r){
      if(falhas===total)throw new Error("sem resposta");
      tocados.forEach(function(c){self.recalc(c);});
      s.fontesEm=new Date().toISOString();s.fontesRes={conf:conf,mud:mud,tse:r[4]||""};self.salva();
      m.textContent=T("Fontes oficiais conferidas às ","Official sources checked at ")+hora(new Date())+": "+conf+T(" votos lidos na Câmara e no Senado; "," votes read from the Chamber and the Senate; ")+
        (mud?mud+T(" diferença(s) corrigida(s) nesta visita"," difference(s) fixed for this visit"):T("tudo igual ao do site","all identical to the site"))+
        (falhas?" · "+falhas+T(" votação(ões) não respondeu(ram); tente de novo depois"," roll call(s) did not respond; try again later"):"")+
        (r[4]?" · "+T("TSE publicou as candidaturas em ","the electoral court published candidacies on ")+quando(r[4]):"")+".";
    });
  },
  /* mesma regra do congresso-sync.py: Sim conta para o lado da votação, Não para o outro */
  recalc:function(c){var lado={},eixo={};this.ind.eixos.forEach(function(e){e.votos.forEach(function(v){var k=v.casa==="senado"?"s"+v.cod:"c"+v.id;lado[k]=v.sim;eixo[k]=e.id;});});
    var por={},t=[0,0];Object.keys(c.v||{}).forEach(function(k){var cod=c.v[k];if(!lado[k]||(cod!=="S"&&cod!=="N"))return;
      var val=((cod==="S")===(lado[k]==="A"))?-1:1;var p=por[eixo[k]]=por[eixo[k]]||[0,0];p[0]+=val;p[1]++;t[0]+=val;t[1]++;});
    var r2=function(x){return Math.round(x*100)/100;};c.e={};Object.keys(por).forEach(function(k){c.e[k]=[r2(por[k][0]/por[k][1]),por[k][1]];});
    if(t[1])c.g=[r2(t[0]/t[1]),t[1]];},
  cab:function(corpo,eyebrow,titulo,lede){var h=mk("header","wrap cg-h");h.appendChild(mk("div","eyebrow",eyebrow));
    h.appendChild(mk("h1","h-lead",titulo));if(lede)h.appendChild(mk("p","lede",lede));corpo.appendChild(h);return h;},

  /* ===== Início ===== */
  telaInicio:function(corpo){
    var self=this,s=this.estado();
    var h=this.cab(corpo,T("Congresso 2026 · Senado e Câmara dos Deputados","Congress 2026 · Senate and Chamber of Deputies"),
      T("Quem escreve as leis também está na urna","Those who write the laws are on the ballot too"),
      T("No dia 4 de outubro você não escolhe só presidente e governador. Escolhe também dois senadores e um deputado federal — e são eles que aprovam, mudam ou barram o que qualquer governo quiser fazer. Aqui você vê o que cada candidato já fez com o voto que recebeu.",
        "On 4 October you are not only choosing a president and a governor. You also choose two senators and one federal deputy — and they are the ones who pass, change or block whatever any government wants to do. Here you can see what each candidate has already done with the vote they received."));
    var bb=mk("div","cg-btns");var b1=mk("button","cg-btn",T("Começar: minha afinidade →","Start: my affinity →"));b1.type="button";b1.addEventListener("click",function(){vai("#congresso/afinidade");});
    var b2=mk("button","cg-btn sec",T("Como os números são feitos","How the numbers are made"));b2.type="button";b2.addEventListener("click",function(){vai("#congresso/metodo");});
    bb.appendChild(b1);bb.appendChild(b2);h.appendChild(bb);
    var w=mk("main","wrap");corpo.appendChild(w);
    var s1=mk("section","cg-s");s1.appendChild(mk("h2",null,T("Quem faz o quê","Who does what")));
    var g=mk("div","cg-cards");
    [["🏛️",T("Deputado(a) federal","Federal deputy"),T("Propõe e vota as leis do país, aprova o Orçamento da União e fiscaliza o governo federal. São 513 cadeiras, divididas entre os estados conforme a população. Mandato de 4 anos.",
        "Proposes and votes on national laws, approves the federal budget and oversees the federal government. There are 513 seats, split among the states by population. Four-year term.")],
     ["⚖️",T("Senador(a)","Senator"),T("Também vota as leis e ainda aprova — ou rejeita — ministros do STF, o procurador-geral da República, embaixadores e a diretoria do Banco Central. São 3 por estado. Mandato de 8 anos.",
        "Also votes on laws and approves — or rejects — Supreme Court justices, the Prosecutor-General, ambassadors and the Central Bank board. There are 3 per state. Eight-year term.")],
     ["⏳",T("Por que este voto pesa","Why this vote matters"),T("Em 2026 cada estado renova dois terços do Senado: você vota em dois nomes, e quem entrar fica até 2035. O deputado eleito agora decide por você até 2031.",
        "In 2026 each state renews two thirds of its Senate seats: you vote for two names, and whoever wins stays until 2035. The deputy elected now decides on your behalf until 2031.")]
    ].forEach(function(x){var c=mk("div","cg-card");var h3=mk("h3");h3.appendChild(mk("span",null,x[0]));h3.appendChild(document.createTextNode(x[1]));c.appendChild(h3);c.appendChild(mk("p",null,x[2]));g.appendChild(c);});
    s1.appendChild(g);w.appendChild(s1);
    var s2=mk("section","cg-s");s2.appendChild(mk("h2",null,T("Antes da urna, o histórico","Before the ballot, the record")));
    var g2=mk("div","cg-cards");
    var c1=mk("div","cg-card dest");c1.appendChild(mk("h3",null,T("Discurso se confere no voto","Speeches are checked against votes")));
    c1.appendChild(mk("p",null,T("Muita gente decide o voto para o Congresso na última hora, pelo santinho ou pela indicação de alguém. Só que todo voto de deputado e senador no plenário fica registrado. Olhar esse registro é o jeito mais direto de saber se o que a pessoa diz bate com o que ela faz.",
      "Many people decide their vote for Congress at the last minute, from a flyer or a friend's tip. But every floor vote by a deputy or senator is on record. Looking at that record is the most direct way to know whether what someone says matches what they do.")));
    var c2=mk("div","cg-card");c2.appendChild(mk("h3",null,T("Como usar, em 5 passos","How to use it, in 5 steps")));
    var ol=mk("ol");[T("Escolha o seu estado (lá em cima).","Choose your state (at the top)."),
      T("Na aba Afinidade, arraste suas pautas na ordem que importa para você e diga o que pensa em 9 temas.","In the Affinity tab, drag your priorities into the order that matters to you and say what you think on 9 topics."),
      T("Toque ★ em quem quiser acompanhar e ⇄ para comparar lado a lado.","Tap ★ on whoever you want to follow and ⇄ to compare side by side."),
      T("Em Favoritos, monte a sua cola com os números para levar à urna.","In Favourites, build your memo with the numbers to take to the polls."),
      T("Depois da eleição, na aba Mandato, acompanhe os eleitos e os seus favoritos: votações novas, presença e se mudaram de lado.","After the election, in the In office tab, follow the winners and your favourites: new roll calls, attendance and whether they switched sides.")].forEach(function(t){ol.appendChild(mk("li",null,t));});
    c2.appendChild(ol);
    var c3=mk("div","cg-card alerta");c3.appendChild(mk("h3",null,T("O que isto é — e o que não é","What this is — and what it is not")));
    var ul=mk("ul");[T("É uma lupa sobre dados oficiais do TSE, da Câmara e do Senado, com link para cada fonte.","It is a magnifying glass on official data from the electoral court, the Chamber and the Senate, with a link to each source."),
      T("Não diz em quem votar: o percentual mede só o quanto o histórico parece com as suas respostas.","It does not tell you who to vote for: the percentage only measures how much the record resembles your answers."),
      T("Quando um número é estimativa, está escrito na tela.","When a number is an estimate, it says so on screen."),
      T("Nada do que você marca sai do seu aparelho.","Nothing you mark leaves your device.")].forEach(function(t){ul.appendChild(mk("li",null,t));});
    c3.appendChild(ul);g2.appendChild(c1);g2.appendChild(c2);g2.appendChild(c3);s2.appendChild(g2);w.appendChild(s2);
    var s3=mk("section","cg-s");s3.appendChild(mk("h2",null,T("Os números do seu estado","Your state in numbers")));
    var g3=mk("div","cg-cards");s3.appendChild(g3);w.appendChild(s3);
    if(!s.uf){g3.appendChild(mk("div","cg-vazio",T("Escolha o estado lá em cima para ver quantos disputam e quantos já passaram pelo Congresso.","Choose your state at the top to see how many are running and how many have already sat in Congress.")));return;}
    var r=this.ind.ufs[s.uf]||{};
    [[r.S,T("candidaturas ao Senado","Senate candidacies")],[r.F,T("candidaturas à Câmara","Chamber candidacies")],[r.mandato,T("já passaram pelo Congresso desde 2019 (têm votos ou propostas)","have sat in Congress since 2019 (have votes or bills)")]]
      .forEach(function(x){var c=mk("div","cg-card");c.appendChild(mk("div","cg-num",x[0]!=null?String(x[0]):"—"));c.appendChild(mk("p",null,x[1]));g3.appendChild(c);});
  },

  /* ===== Afinidade ===== */
  telaAf:function(corpo){
    var self=this,s=this.estado(),ind=this.ind;
    this.cab(corpo,T("Congresso 2026 · Afinidade","Congress 2026 · Affinity"),T("Quem pensa parecido com você","Who thinks like you"),
      T("Arraste as pautas na ordem que importa para você e diga o que pensa em cada tema. A lista muda na hora.","Drag the priorities into the order that matters to you and say what you think on each topic. The list changes instantly.")).classList.add("cg-af-h");
    var w=mk("div","wrap cg-af");w.dataset.m=s.mtab;
    /* no celular: três abas fixas no alto, uma parte de cada vez */
    var mt=mk("div","cg-mtab");mt.setAttribute("role","tablist");mt.setAttribute("aria-label",T("Partes da afinidade","Affinity sections"));
    var abaM=function(k){s.mtab=k;self.salva();w.dataset.m=k;[].forEach.call(mt.children,function(x){x.setAttribute("aria-selected",String(x.dataset.k===k));});scrollTo(0,0);};
    [["pri",T("1. Pautas","1. Priorities")],["pos",T("2. Posições","2. Positions")],["lis",T("3. Lista","3. List")]].forEach(function(o){
      var b=mk("button",null,o[1]);b.type="button";b.dataset.k=o[0];b.setAttribute("role","tab");b.setAttribute("aria-selected",String(s.mtab===o[0]));
      b.addEventListener("click",function(){abaM(o[0]);});mt.appendChild(b);});
    corpo.appendChild(mt);corpo.appendChild(w);mt.className+=" wrap";
    var esq=mk("div");w.appendChild(esq);
    /* 1. prioridades */
    var b1=mk("section","cg-box mp mp-pri");b1.appendChild(mk("h2",null,T("1. Suas prioridades","1. Your priorities")));
    b1.appendChild(mk("p",null,T("Arraste pela alça ⠿ (ou use as setas). No topo, o que mais pesa no seu voto.","Drag by the ⠿ handle (or use the arrows). At the top, what weighs most in your vote.")));
    var ul=mk("ol","cg-ord");ul.setAttribute("aria-label",T("Ordem das prioridades","Order of priorities"));
    var pm={};ind.pautas.forEach(function(p){pm[p.id]=p;});
    s.pri.forEach(function(id){var p=pm[id],li=mk("li");li.dataset.id=id;
      var h=mk("button","h");h.type="button";h.innerHTML=ALCA;h.setAttribute("aria-label",T("Mover ","Move ")+(EN?p.en:p.pt)+T(" (setas para cima e para baixo)"," (up and down arrows)"));
      li.appendChild(h);li.appendChild(mk("span","n"));li.appendChild(mk("span","t",EN?p.en:p.pt));
      var ud=mk("span","ud");var up=mk("button",null,"▲");up.type="button";up.dataset.d="-1";up.setAttribute("aria-label",T("Subir ","Move up ")+(EN?p.en:p.pt));
      var dn=mk("button",null,"▼");dn.type="button";dn.dataset.d="1";dn.setAttribute("aria-label",T("Descer ","Move down ")+(EN?p.en:p.pt));
      ud.appendChild(up);ud.appendChild(dn);li.appendChild(ud);ul.appendChild(li);});
    b1.appendChild(ul);
    var nota=mk("p",null,"");nota.style.fontSize="12.5px";nota.style.color="var(--muted)";nota.style.margin="8px 0 0";
    function pintaNota(){nota.textContent=s.priOk?T("Ordem salva neste aparelho.","Order saved on this device."):T("Mexa na ordem ao menos uma vez para as prioridades entrarem na conta.","Change the order at least once for priorities to count.");}
    pintaNota();b1.appendChild(nota);esq.appendChild(b1);
    ordenavel(ul,function(o){s.pri=o;s.priOk=true;self.salva();pintaNota();self.agenda();});
    /* 2. posicionamento */
    var b2=mk("section","cg-box mp mp-pos");b2.appendChild(mk("h2",null,T("2. Posicionamento político sobre cada tema","2. Political position on each topic")));
    b2.appendChild(mk("p",null,T("Escolha um lado ou deixe em \"Neutro / Não sei\": esse tema fica fora da conta.","Pick a side or leave it on \"Neutral / Not sure\": that topic is left out of the count.")));
    ind.eixos.forEach(function(e){var tx=EN?e.en:e.pt,row=mk("div","cg-ax");row.appendChild(mk("b",null,tx.t));
      var tri=mk("div","cg-tri");tri.setAttribute("role","radiogroup");tri.setAttribute("aria-label",tx.t);
      [[-1,tx.a,""],[0,T("Neutro / Não sei","Neutral / Not sure"),"neu"],[1,tx.b,""]].forEach(function(o){
        var b=mk("button",o[2],o[1]);b.type="button";b.setAttribute("role","radio");b.setAttribute("aria-checked",String((s.pos[e.id]||0)===o[0]));
        b.addEventListener("click",function(){if(o[0])s.pos[e.id]=o[0];else delete s.pos[e.id];self.salva();
          [].forEach.call(tri.children,function(x){x.setAttribute("aria-checked",String(x===b));});self.agenda();});
        tri.appendChild(b);});
      row.appendChild(tri);b2.appendChild(row);});
    var lim=mk("button","cg-lim",T("Voltar tudo para Neutro","Reset everything to Neutral"));lim.type="button";
    lim.addEventListener("click",function(){s.pos={};self.salva();self.abre();});b2.appendChild(lim);esq.appendChild(b2);
    /* 3. resultados */
    var dir=mk("section","cg-res mp mp-lis");dir.id="cg-res";dir.setAttribute("aria-label",T("Candidatos","Candidates"));w.appendChild(dir);
    var f=mk("div","cg-f");
    var seg=mk("div","cg-seg");seg.setAttribute("role","group");seg.setAttribute("aria-label",T("Cargo","Office"));
    [["T",T("Todos","All")],["S",T("Senado","Senate")],["F",T("Câmara","Chamber")]].forEach(function(o){
      var b=mk("button",null,o[1]);b.type="button";b.setAttribute("aria-pressed",String(s.cargo===o[0]));
      b.addEventListener("click",function(){s.cargo=o[0];self.mostra=40;self.salva();[].forEach.call(seg.children,function(x){x.setAttribute("aria-pressed",String(x===b));});self.pintaLista();});
      seg.appendChild(b);});
    f.appendChild(seg);
    var or=mk("select");or.setAttribute("aria-label",T("Ordenar","Sort"));
    [["geral",T("Afinidade geral","Overall affinity")],["pos",T("Posicionamento","Political position")],["pri",T("Prioridades","Priorities")],["nome",T("Nome (A–Z)","Name (A–Z)")]].forEach(function(o){var x=mk("option",null,o[1]);x.value=o[0];or.appendChild(x);});
    or.value=s.ord;f.appendChild(or);
    var dirB=botaoDir(function(d){return s.ord==="nome"?(d>0?["A→Z",T("De A a Z (toque para inverter)","A to Z (tap to reverse)")]:["Z→A",T("De Z a A (toque para inverter)","Z to A (tap to reverse)")]):
        (d>0?["↓ "+T("maior","highest"),T("Maior primeiro (toque para inverter)","Highest first (tap to reverse)")]:["↑ "+T("menor","lowest"),T("Menor primeiro (toque para inverter)","Lowest first (tap to reverse)")]);},
      function(){return s.dir;},function(v){s.dir=v;self.salva();self.pintaLista();});
    or.addEventListener("change",function(){s.ord=or.value;s.dir=1;self.salva();dirB.pinta();self.pintaLista();});f.appendChild(dirB);
    var bu=mk("input");bu.type="search";bu.placeholder=T("Buscar nome, partido ou número","Search name, party or number");bu.value=this.busca;
    bu.setAttribute("aria-label",T("Buscar candidato","Search candidate"));
    bu.addEventListener("input",function(){self.busca=semAcento(bu.value.trim());self.mostra=40;self.pintaLista();});f.appendChild(bu);
    var cl=mk("label");var cb=mk("input");cb.type="checkbox";cb.checked=s.so;cl.appendChild(cb);cl.appendChild(document.createTextNode(T("Só quem já passou pelo Congresso","Only those who have sat in Congress")));
    cb.addEventListener("change",function(){s.so=cb.checked;self.mostra=40;self.salva();self.pintaLista();});f.appendChild(cl);
    dir.appendChild(f);var ct=mk("div","cg-cont");ct.id="cg-cont";ct.setAttribute("aria-live","polite");dir.appendChild(ct);
    var li=mk("div","cg-lista");li.id="cg-lista";dir.appendChild(li);
    var mob=mk("div","cg-mob");mob.id="cg-mob";var ms=mk("span");var mb=mk("button",null,T("Ver lista ↓","See list ↓"));mb.type="button";
    mb.addEventListener("click",function(){abaM("lis");});mob.appendChild(ms);mob.appendChild(mb);esq.appendChild(mob);
    if(!s.uf){li.appendChild(mk("div","cg-vazio",T("Escolha o seu estado lá em cima para ver os candidatos.","Choose your state at the top to see the candidates.")));return;}
    ct.textContent=T("Carregando…","Loading…");
    this.garanteUF(s.uf).then(function(){self.pintaLista();},function(){ct.textContent=self.falha();});
  },
  /* redesenha a lista logo depois de cada toque (agrupa toques seguidos) */
  agenda:function(){var self=this;if(this.tReq)cancelAnimationFrame(this.tReq);this.tReq=requestAnimationFrame(function(){self.tReq=0;self.pintaLista();});},
  ordenada:function(){var self=this,s=this.estado(),d=this.uf[s.uf];if(!d)return [];
    var L=d.c.filter(function(c){
      if(s.cargo!=="T"&&c.cg!==s.cargo)return false;
      if(s.so&&!c.v&&!c.t)return false;
      if(self.busca&&semAcento(c.n+" "+c.p+" "+c.num).indexOf(self.busca)<0)return false;
      return true;}).map(function(c){return {c:c,a:self.geral(c)};});
    var nome=function(a,b){return a.c.n.localeCompare(b.c.n,"pt")*(s.ord==="nome"?s.dir:1);};
    var val={geral:function(x){return x.a.g;},pos:function(x){return x.a.pos?x.a.pos.pct:null;},pri:function(x){return x.a.pri?x.a.pri.pct:null;}}[s.ord];
    if(val)L.sort(function(a,b){var va=val(a),vb=val(b);
      if((va==null)!==(vb==null))return va==null?1:-1;   /* sem percentual sempre no fim */
      if(vb!==va)return (vb-va)*s.dir;
      var ma=(a.c.v||a.c.t)?1:0,mb=(b.c.v||b.c.t)?1:0;if(mb!==ma)return mb-ma;return nome(a,b);});
    else L.sort(nome);
    return L;},
  pintaLista:function(){
    var self=this,s=this.estado(),box=$("cg-lista"),ct=$("cg-cont");if(!box)return;
    var d=this.uf[s.uf];if(!d)return;
    var L=this.ordenada();box.textContent="";
    var nPos=Object.keys(s.pos).length;
    ct.textContent=L.length+" "+T("candidaturas em ","candidacies in ")+UFN[s.uf]+
      (!nPos&&!s.priOk?" · "+T("ordene as pautas ou escolha um lado em algum tema para ver a afinidade","rank the priorities or pick a side on a topic to see the affinity"):"");
    var mob=$("cg-mob");if(mob){var tops=L.filter(function(x){return x.a.g!=null;}).slice(0,3);
      mob.firstChild.textContent=tops.length?T("No topo: ","Top: ")+tops.map(function(x){return x.c.n+" "+x.a.g+"%";}).join(" · "):L.length+" "+T("candidaturas","candidacies");}
    if(!L.length){box.appendChild(mk("div","cg-vazio",T("Nenhum candidato com esse filtro.","No candidate matches this filter.")));return;}
    L.slice(0,this.mostra).forEach(function(x){box.appendChild(self.cartao(x.c,x.a));});
    if(L.length>this.mostra){var b=mk("button","cg-mais",T("Mostrar mais ","Show more ")+"("+(L.length-this.mostra)+")");b.type="button";
      b.addEventListener("click",function(){self.mostra+=40;self.pintaLista();});box.appendChild(b);}
  },
  avatar:function(c,grande){var a=mk("span","cg-av"+(grande?" g":""));var h=7;for(var i=0;i<c.n.length;i++)h=(h*31+c.n.charCodeAt(i))%360;
    a.style.setProperty("--h",h);a.appendChild(document.createTextNode(c.n.split(/\s+/).filter(Boolean).map(function(w){return w[0];}).slice(0,2).join("")));
    /* foto oficial do TSE; se não vier, ficam as iniciais */
    /* foto oficial: a da Câmara ou do Senado (para quem teve mandato), senão a do registro no TSE;
       se nenhuma vier, ficam as iniciais */
    var fts=[];if(c.dep)fts.push("https://www.camara.leg.br/internet/deputado/bandep/"+c.dep+".jpg");
    if(c.sen)fts.push("https://legis.senado.leg.br/senadores/fotos-oficiais/"+c.sen);
    fts.push("cola/fotos/"+c.uf+"/"+c.id+".jpg");
    fts.push("https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/img/20322002026/"+c.id+"/"+c.uf);
    var im=mk("img");im.alt="";im.loading="lazy";im.referrerPolicy="no-referrer";im.src=fts.shift();
    im.addEventListener("error",function(){if(fts.length)im.src=fts.shift();else im.remove();});a.appendChild(im);return a;},
  marcas:function(c,a){var w=mk("span");
    if(c.v||c.t)w.appendChild(mk("span","cg-tg v",T("No Congresso desde ","In Congress since ")+(Math.min(c.dep_desde||9999,c.sen_desde||9999)<9999?Math.min(c.dep_desde||9999,c.sen_desde||9999):"2019")));
    else w.appendChild(mk("span","cg-tg",T("Sem mandato no Congresso","No seat in Congress")));
    if(a&&a.pos&&a.pos.proprio<a.pos.n)w.appendChild(mk("span","cg-tg e",a.pos.proprio?T("Posição em parte estimada","Position partly estimated"):T("Posição estimada","Position estimated")));
    if(c.r)w.appendChild(mk("span","cg-tg r",c.r));
    return w;},
  cartao:function(c,a){
    var self=this,el=mk("div","cg-c");el.tabIndex=0;el.setAttribute("role","link");
    el.setAttribute("aria-label",c.n+", "+CARGO_L[c.cg]+", "+c.p+(a.g!=null?", "+a.g+"% "+T("de afinidade","affinity"):""));
    el.appendChild(this.avatar(c));
    var nm=mk("div","cg-nm");nm.appendChild(mk("b",null,c.n));nm.appendChild(mk("small",null,CARGO[c.cg]+" · "+c.p+" · nº "+c.num));
    nm.appendChild(this.marcas(c,a));el.appendChild(nm);
    var pc=mk("div","cg-pc");
    if(a.g!=null){pc.appendChild(mk("b",null,a.g+"%"));
      var det=[];if(a.pos)det.push(T("posição ","position ")+a.pos.pct+"%");if(a.pri)det.push(T("pautas ","priorities ")+a.pri.pct+"%");
      pc.appendChild(mk("small",null,det.join(" · ")));var br=mk("div","cg-bar");var i=mk("i");i.style.width=a.g+"%";br.appendChild(i);pc.appendChild(br);}
    else pc.appendChild(mk("small",null,c.v||c.t?T("responda ao lado","answer alongside"):T("sem histórico para comparar","no record to compare")));
    el.appendChild(pc);
    var ic=mk("div","cg-ic");
    var fv=mk("button","fav","★");fv.type="button";fv.setAttribute("aria-pressed",String(this.ehFav(c)));fv.setAttribute("aria-label",T("Favorito","Favourite"));fv.title=T("Guardar nos favoritos","Save to favourites");
    fv.addEventListener("click",function(e){e.stopPropagation();self.alternaFav(c);fv.setAttribute("aria-pressed",String(self.ehFav(c)));});
    var cp=mk("button",null,"⇄");cp.type="button";cp.setAttribute("aria-pressed",String(this.ehCmp(c)));cp.setAttribute("aria-label",T("Comparar","Compare"));cp.title=T("Pôr na comparação","Add to comparison");
    cp.addEventListener("click",function(e){e.stopPropagation();self.alternaCmp(c);cp.setAttribute("aria-pressed",String(self.ehCmp(c)));});
    ic.appendChild(fv);ic.appendChild(cp);el.appendChild(ic);
    var abre=function(){vai("#congresso/ficha/"+c.uf+"/"+c.id);};
    el.addEventListener("click",abre);el.addEventListener("keydown",function(e){if((e.key==="Enter"||e.key===" ")&&e.target===el){e.preventDefault();abre();}});
    return el;},

  /* ===== Ficha do candidato ===== */
  telaFicha:function(corpo,uf,id){
    var self=this,w=mk("main","wrap");w.style.paddingBlock="18px 40px";corpo.appendChild(w);
    var volta=mk("button","cg-lim","← "+T("Voltar","Back"));volta.type="button";volta.style.fontSize="14px";
    volta.addEventListener("click",function(){if(history.length>1)history.back();else vai("#congresso/afinidade");});w.appendChild(volta);
    this.garanteUF(uf).then(function(){var c=self.acha(uf,id);
      if(!c){w.appendChild(mk("div","cg-vazio",T("Não achei esta candidatura.","Candidacy not found.")));return;}
      self.ficha(w,c);},function(){w.appendChild(mk("div","cg-vazio",self.falha()));});
  },
  ficha:function(w,c){
    var self=this,s=this.estado(),ind=this.ind,a=this.geral(c);
    var hd=mk("div","cg-fh");hd.appendChild(this.avatar(c,true));var nm=mk("div");nm.style.flex="1";
    nm.appendChild(mk("div","eyebrow",CARGO_L[c.cg]+" · "+UFN[c.uf]));nm.appendChild(mk("h1",null,c.n));
    nm.appendChild(mk("p",null,c.p+" · "+T("número ","number ")+c.num));nm.appendChild(this.marcas(c,a));hd.appendChild(nm);
    var ic=mk("div","cg-btns");ic.style.marginTop="0";
    var fv=mk("button","cg-btn sec","");fv.type="button";var pf=function(){fv.textContent=self.ehFav(c)?"★ "+T("Nos favoritos","In favourites"):"☆ "+T("Guardar","Save");};pf();
    fv.addEventListener("click",function(){self.alternaFav(c);pf();});
    var cp=mk("button","cg-btn sec","⇄ "+T("Comparar","Compare"));cp.type="button";cp.addEventListener("click",function(){if(!self.ehCmp(c))if(!self.alternaCmp(c))return;vai("#congresso/comparar");});
    ic.appendChild(fv);ic.appendChild(cp);hd.appendChild(ic);w.appendChild(hd);
    /* currículo */
    var cv=mk("div","cg-cv");
    var mand=[];if(c.dep)mand.push(T("Câmara desde ","Chamber since ")+(c.dep_desde||"2019"));if(c.sen)mand.push(T("Senado desde ","Senate since ")+(c.sen_desde||"2019"));
    [[T("Idade na eleição","Age on election day"),c.idade!=null?c.idade+T(" anos"," years"):"—"],[T("Escolaridade","Education"),c.esc||"—"],
     [T("Ocupação declarada","Declared occupation"),c.ocup||"—"],[T("Patrimônio declarado ao TSE","Assets declared to the court"),reais(c.bens)],
     [T("Congresso","Congress"),mand.length?mand.join(" · "):T("sem mandato desde 2019","no seat since 2019")]]
      .forEach(function(x){var d=mk("div");d.appendChild(mk("small",null,x[0]));d.appendChild(mk("span",null,x[1]));cv.appendChild(d);});
    w.appendChild(cv);
    var lk=mk("p");lk.style.fontSize="14px";
    if(c.dep)lk.appendChild(link(T("Perfil na Câmara ↗","Chamber profile ↗"),"https://www.camara.leg.br/deputados/"+c.dep));
    if(c.sen){if(c.dep)lk.appendChild(document.createTextNode(" · "));lk.appendChild(link(T("Perfil no Senado ↗","Senate profile ↗"),"https://www25.senado.leg.br/web/senadores/senador/-/perfil/"+c.sen));}
    if(lk.firstChild)w.appendChild(lk);
    /* afinidade */
    var sa=mk("section","cg-s");sa.appendChild(mk("h2",null,T("Afinidade com você","Affinity with you")));
    var g=mk("div","cg-cards");
    [[T("Geral","Overall"),a.g,T("média das duas abaixo","average of the two below")],
     [T("Posicionamento","Political position"),a.pos&&a.pos.pct,a.pos?a.pos.n+T(" tema(s) comparado(s), "," topic(s) compared, ")+a.pos.proprio+T(" pelo voto dele(a)"," by their own vote"):T("escolha um lado em algum tema","pick a side on some topic")],
     [T("Prioridades","Priorities"),a.pri&&a.pri.pct,a.pri?a.pri.n+T(" propostas desde 2019"," bills since 2019"):(c.t?T("mexa na ordem das pautas","change the order of priorities"):T("sem propostas registradas","no bills on record"))]]
      .forEach(function(x){var d=mk("div","cg-card");d.appendChild(mk("small",null,x[0]));d.appendChild(mk("div","cg-num",x[1]!=null?x[1]+"%":"—"));d.appendChild(mk("p",null,x[2]));g.appendChild(d);});
    sa.appendChild(g);w.appendChild(sa);
    /* posicionamento por eixo */
    var sp=mk("section","cg-s");sp.appendChild(mk("h2",null,T("Posicionamento, tema a tema","Position, topic by topic")));
    sp.appendChild(mk("p",null,T("Bolinha escura: o candidato. Bolinha verde: você. Esquerda = lado A, direita = lado B.","Dark dot: the candidate. Green dot: you. Left = side A, right = side B.")));
    ind.eixos.forEach(function(e){var tx=EN?e.en:e.pt,c1=mk("div","cg-card");c1.style.marginTop="10px";
      c1.appendChild(mk("h3",null,tx.t));c1.appendChild(self.escala(c,e));
      var p=self.pos(c,e.id);
      c1.appendChild(mk("p",null,!p?T("Sem voto e sem partido com bancada para estimar.","No vote and no party caucus to estimate from."):
        p.f==="voto"?T("Pelo voto dele(a) em ","From their vote on ")+p.n+T(" votação(ões)."," roll call(s)."):
        p.f==="geral"?T("Estimativa: não votou neste tema; usamos o padrão geral dos ","Estimate: did not vote on this topic; we used the overall pattern of their ")+p.n+T(" votos dele(a)."," votes."):
        T("Estimativa pela média da bancada do partido ","Estimate from the average of the party caucus ")+c.p+T(" (não é voto da pessoa)."," (not this person's vote).")));
      if(e.votos.length&&c.v){var ul=mk("ul","cg-vl");
        e.votos.forEach(function(v){var k=v.casa==="senado"?"s"+v.cod:"c"+v.id,cod=c.v[k];if(!cod)return;var li=mk("li");
          li.appendChild(document.createTextNode((EN?v.en:v.pt)+" — "));
          var sp2=mk("span",cod==="S"||cod==="N"?"ok":"nd",cod==="S"||cod==="N"?T("votou ","voted ")+VOTO[cod]+" ("+T("conta para o lado ","counts for side ")+((cod==="S")===(v.sim==="A")?"A":"B")+")":VOTO[cod]);
          li.appendChild(sp2);ul.appendChild(li);});
        if(ul.firstChild)c1.appendChild(ul);}
      sp.appendChild(c1);});
    w.appendChild(sp);
    /* prioridades */
    var sq=mk("section","cg-s");sq.appendChild(mk("h2",null,T("Do que tratam as propostas","What the bills are about")));
    if(!c.t)sq.appendChild(mk("div","cg-vazio",T("Nenhuma proposta de lei (PL, PLP ou PEC) registrada desde 2019 em nome desta pessoa.","No bill (PL, PLP or PEC) on record under this person's name since 2019.")));
    else{sq.appendChild(mk("p",null,c.t.n+T(" propostas de lei ou de emenda desde 2019, na ordem das suas prioridades. Uma proposta pode tocar mais de uma pauta."," bills or amendments since 2019, in the order of your priorities. One bill can touch more than one priority.")));
      var pm={};ind.pautas.forEach(function(p){pm[p.id]=p;});var gr=mk("div","cg-pb");
      s.pri.forEach(function(id,i){var n=c.t.p[id]||0,pc=Math.round(100*n/c.t.n);
        gr.appendChild(mk("span",null,(i+1)+". "+(EN?pm[id].en:pm[id].pt)));var br=mk("div","cg-bar");var ii=mk("i");ii.style.width=pc+"%";br.appendChild(ii);gr.appendChild(br);
        gr.appendChild(mk("span","q",n+" · "+pc+"%"));
        var ex=c.t.x&&c.t.x[id];if(ex&&ex.length){var e2=mk("div","cg-ex");e2.appendChild(document.createTextNode(T("Ex.: ","E.g.: ")));
          ex.forEach(function(x,j){if(j)e2.appendChild(document.createTextNode(", "));
            e2.appendChild(link(x[0],x[1].charAt(0)==="c"?"https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao="+x[1].slice(1):"https://www25.senado.leg.br/web/atividade/materias/-/materia/"+x[1].slice(1)));});
          gr.appendChild(e2);}});
      sq.appendChild(gr);}
    w.appendChild(sq);
    /* mandato em curso */
    var smd=mk("section","cg-s");smd.appendChild(mk("h2",null,T("No mandato em curso","In the current term")));
    smd.appendChild(this.blocoMandato(c));var coe=this.blocoCoerencia(c);
    if(coe){smd.appendChild(mk("h3",null,T("Antes × depois, tema a tema","Before × after, topic by topic")));smd.appendChild(coe);}
    w.appendChild(smd);
    /* votações marcantes */
    if(c.v){var sd=mk("section","cg-s");sd.appendChild(mk("h2",null,T("Votações marcantes","Landmark votes")));
      sd.appendChild(mk("p",null,T("Só para informação: não entram na conta da afinidade.","For information only: they are not part of the affinity count.")));
      var ul2=mk("ul","cg-vl");ind.destaques.forEach(function(d){[["camara","c"],["senado","s"]].forEach(function(cs){var v=d[cs[0]];if(!v)return;
        var cod=c.v[cs[1]+(cs[0]==="senado"?v.cod:v.id)];if(!cod)return;var li=mk("li");
        li.appendChild(document.createTextNode((EN?d.en:d.pt)+" ("+d.prop+", "+(cs[0]==="senado"?T("Senado","Senate"):T("Câmara","Chamber"))+") — "));
        li.appendChild(mk("span",cod==="S"||cod==="N"?"ok":"nd",VOTO[cod]));ul2.appendChild(li);});});
      if(ul2.firstChild){sd.appendChild(ul2);w.appendChild(sd);}}
  },
  /* régua de -1 (A) a +1 (B) com o candidato e a pessoa */
  escala:function(c,e){var s=this.estado(),wr=mk("div");var tx=EN?e.en:e.pt;
    var esc=mk("div","cg-esc"),p=this.pos(c,e.id),u=s.pos[e.id];
    if(u){var iu=mk("i","u");iu.style.left=(50+u*50)+"%";iu.title=T("Você","You");esc.appendChild(iu);}
    if(p){var ic=mk("i","c");ic.style.left=(50+p.s*50)+"%";if(p.f!=="voto")ic.style.opacity=".55";var em=mk("em",null,p.f==="voto"?T("voto","vote"):T("estimativa","estimate"));em.style.left=ic.style.left;esc.appendChild(em);esc.appendChild(ic);}
    esc.setAttribute("role","img");esc.setAttribute("aria-label",!p?T("sem dado","no data"):T("Candidato ","Candidate ")+(p.s<-0.33?T("mais perto do lado A","closer to side A"):p.s>0.33?T("mais perto do lado B","closer to side B"):T("no meio","in the middle")));
    wr.appendChild(esc);var l=mk("div","cg-esc-l");l.appendChild(mk("span",null,"A · "+tx.a));l.appendChild(mk("span",null,"B · "+tx.b));wr.appendChild(l);return wr;},

  /* ===== Favoritos ===== */
  telaFav:function(corpo){
    var self=this,s=this.estado();
    this.cab(corpo,T("Congresso 2026 · Favoritos","Congress 2026 · Favourites"),T("Seus favoritos","Your favourites"),
      T("Quem você marcou com ★ fica aqui, neste aparelho. Daqui dá para abrir o currículo, comparar e montar a sua cola para a urna.",
        "Whoever you starred ★ stays here, on this device. From here you can open their record, compare them and build your ballot memo."));
    var w=mk("main","wrap");w.style.paddingBottom="40px";corpo.appendChild(w);
    if(!s.fav.length){var v=mk("div","cg-vazio",T("Ainda não há favoritos. Na aba Afinidade, toque ★ ao lado de quem quiser acompanhar.","No favourites yet. In the Affinity tab, tap ★ next to whoever you want to follow."));
      var b=mk("button","cg-btn",T("Ir para Afinidade →","Go to Affinity →"));b.type="button";b.style.marginTop="12px";b.addEventListener("click",function(){vai("#congresso/afinidade");});
      v.appendChild(mk("br"));v.appendChild(b);w.appendChild(v);return;}
    this.resolve(s.fav).then(function(L){
      /* cola: até 2 ao Senado e 1 à Câmara */
      var sc=mk("section","cg-s");sc.appendChild(mk("h2",null,T("Sua cola para a urna","Your ballot memo")));
      sc.appendChild(mk("p",null,T("Marque \"Na cola\" nos favoritos abaixo: até 2 para o Senado e 1 para a Câmara. É só um lembrete seu — confira sempre o número na urna.",
        "Tick \"On memo\" in the favourites below: up to 2 for the Senate and 1 for the Chamber. It is only your reminder — always check the number at the ballot box.")));
      var cola=mk("div","cg-cola");sc.appendChild(cola);
      var pr=mk("button","cg-btn sec","🖨 "+T("Imprimir","Print"));pr.type="button";pr.style.marginTop="10px";pr.addEventListener("click",function(){window.print();});sc.appendChild(pr);
      function pintaCola(){cola.textContent="";cola.appendChild(mk("h3",null,T("Eleição 2026 · Congresso","2026 election · Congress")));
        [["S",2],["F",1]].forEach(function(k){var ids=s.cola[k[0]]||[];
          for(var i=0;i<k[1];i++){var c=null,ref=ids[i];if(ref){var pp=ref.split("/");c=self.acha(pp[0],pp[1]);}
            var lin=mk("div","lin");lin.appendChild(mk("span",null,CARGO_L[k[0]]+(k[1]>1?" "+(i+1):"")+(c?": "+c.n+" ("+c.p+")":"")));lin.appendChild(mk("b",null,c?c.num:"—"));cola.appendChild(lin);}});}
      pintaCola();w.appendChild(sc);
      var fo=mk("div","cg-f");var fs=mk("select");fs.setAttribute("aria-label",T("Ordenar favoritos","Sort favourites"));
      [["nome",T("Nome","Name")],["geral",T("Afinidade geral","Overall affinity")]].forEach(function(o){var x=mk("option",null,o[1]);x.value=o[0];fs.appendChild(x);});fs.value=s.favOrd;
      fs.addEventListener("change",function(){s.favOrd=fs.value;s.favDir=1;self.salva();self.abre();});fo.appendChild(fs);
      fo.appendChild(botaoDir(function(d){return s.favOrd==="nome"?(d>0?["A→Z",T("De A a Z","A to Z")]:["Z→A",T("De Z a A","Z to A")]):(d>0?["↓ "+T("maior","highest"),T("Maior primeiro","Highest first")]:["↑ "+T("menor","lowest"),T("Menor primeiro","Lowest first")]);},
        function(){return s.favDir;},function(v){s.favDir=v;self.salva();self.abre();}));
      w.appendChild(fo);
      L.sort(function(a,b){if(s.favOrd==="geral"){var ga=self.geral(a).g,gb=self.geral(b).g;ga=ga==null?-1:ga;gb=gb==null?-1:gb;if(ga!==gb)return (gb-ga)*s.favDir;}
        return a.n.localeCompare(b.n,"pt")*(s.favOrd==="nome"?s.favDir:1);});
      ["S","F"].forEach(function(k){var Lk=L.filter(function(c){return c.cg===k;});if(!Lk.length)return;
        var sx=mk("section","cg-s");sx.appendChild(mk("h2",null,CARGO[k]+" ("+Lk.length+")"));var lst=mk("div","cg-lista");
        Lk.forEach(function(c){var el=self.cartao(c,self.geral(c));
          var lb=mk("label");lb.style.cssText="display:flex;gap:6px;align-items:center;font-size:12.5px;white-space:nowrap";lb.addEventListener("click",function(e){e.stopPropagation();});
          var ch=mk("input");ch.type="checkbox";var ref=c.uf+"/"+c.id;ch.checked=(s.cola[k]||[]).indexOf(ref)>=0;
          ch.addEventListener("change",function(){var arr=s.cola[k]||[];
            if(ch.checked){var max=k==="S"?2:1;if(arr.length>=max){if(max===1){arr=[];[].forEach.call(lst.querySelectorAll("input[type=checkbox]"),function(x){if(x!==ch)x.checked=false;});}
                else{ch.checked=false;aviso(T("Para o Senado são 2 nomes. Desmarque um antes.","The Senate takes 2 names. Untick one first."));return;}}arr.push(ref);}
            else arr=arr.filter(function(x){return x!==ref;});
            s.cola[k]=arr;self.salva();pintaCola();});
          lb.appendChild(ch);lb.appendChild(document.createTextNode(T("Na cola","On memo")));el.insertBefore(lb,el.lastChild);lst.appendChild(el);});
        sx.appendChild(lst);w.appendChild(sx);});
    });
  },

  /* ===== Comparar ===== */
  telaCmp:function(corpo){
    var self=this,s=this.estado(),ind=this.ind;
    this.cab(corpo,T("Congresso 2026 · Comparar","Congress 2026 · Compare"),T("Lado a lado","Side by side"),
      T("Até três candidaturas, de qualquer estado. Toque ⇄ na lista ou na ficha para pôr alguém aqui.","Up to three candidacies, from any state. Tap ⇄ in the list or on a record to add someone here."));
    var w=mk("main","wrap");w.style.paddingBottom="40px";corpo.appendChild(w);
    this.resolve(s.cmp).then(function(L){
      var ch=mk("div","cg-chips");L.forEach(function(c){var sp=mk("span",null,c.n);var x=mk("button",null,"×");x.type="button";x.setAttribute("aria-label",T("Tirar ","Remove ")+c.n);
        x.addEventListener("click",function(){self.alternaCmp(c);self.abre();});sp.appendChild(x);ch.appendChild(sp);});
      if(s.fav.length&&L.length<3){var sel=mk("select");sel.setAttribute("aria-label",T("Adicionar dos favoritos","Add from favourites"));sel.appendChild(mk("option",null,T("+ Adicionar dos favoritos","+ Add from favourites"))).value="";
        self.resolve(s.fav).then(function(F){F.forEach(function(c){if(self.ehCmp(c))return;var o=mk("option",null,c.n+" ("+c.p+", "+CARGO[c.cg]+")");o.value=c.uf+"/"+c.id;sel.appendChild(o);});});
        sel.addEventListener("change",function(){if(!sel.value)return;var pp=sel.value.split("/");var c=self.acha(pp[0],pp[1]);if(c){self.alternaCmp(c);self.abre();}});ch.appendChild(sel);}
      w.appendChild(ch);
      if(!L.length){w.appendChild(mk("div","cg-vazio",T("Nada para comparar ainda. Toque ⇄ em algum candidato na aba Afinidade ou nos Favoritos.","Nothing to compare yet. Tap ⇄ on a candidate in the Affinity tab or in Favourites.")));return;}
      /* ordem das colunas (A→Z / Z→A) e o que mostrar */
      L.sort(function(a,b){return a.n.localeCompare(b.n,"pt")*s.cmpDir;});
      var A=L.map(function(c){return self.geral(c);});
      var ver=mk("div","cg-ver");ver.appendChild(mk("span",null,T("Mostrar:","Show:")));
      [["cv",T("Currículo","Record")],["af",T("Afinidade","Affinity")],["pos",T("Posicionamento","Position")],["pro",T("Propostas","Bills")]].forEach(function(o){
        var lb=mk("label"),cb=mk("input");cb.type="checkbox";cb.checked=!!s.cmpVer[o[0]];lb.appendChild(cb);lb.appendChild(document.createTextNode(o[1]));
        cb.addEventListener("change",function(){s.cmpVer[o[0]]=cb.checked?1:0;self.salva();self.abre();});ver.appendChild(lb);});
      var ll=mk("label"),lc=mk("input");lc.type="checkbox";lc.checked=s.cmpLado;ll.appendChild(lc);ll.appendChild(document.createTextNode(T("Só temas em que escolhi um lado","Only topics where I picked a side")));
      lc.addEventListener("change",function(){s.cmpLado=lc.checked;self.salva();self.abre();});ver.appendChild(ll);
      ver.appendChild(botaoDir(function(d){return d<0?["Z→A",T("Colunas de Z a A","Columns Z to A")]:["A→Z",T("Colunas de A a Z","Columns A to Z")];},
        function(){return s.cmpDir;},function(v){s.cmpDir=v;self.salva();self.abre();}));
      w.appendChild(ver);
      /* linhas: [grupo, rótulo, função que devolve texto ou elemento] */
      var linhas=[],pm={};ind.pautas.forEach(function(p){pm[p.id]=p;});
      function linha(g,rot,fn){if(s.cmpVer[g])linhas.push([rot,fn]);}
      linha("cv",T("Cargo","Office"),function(c){return CARGO_L[c.cg]+" · "+c.uf;});
      linha("cv",T("Partido e número","Party and number"),function(c){return c.p+" · "+c.num;});
      linha("cv",T("Idade","Age"),function(c){return c.idade!=null?c.idade+T(" anos"," yrs"):null;});
      linha("cv",T("Escolaridade","Education"),function(c){return c.esc;});
      linha("cv",T("Ocupação","Occupation"),function(c){return c.ocup;});
      linha("cv",T("Patrimônio","Assets"),function(c){return reais(c.bens);});
      linha("cv",T("Congresso","Congress"),function(c){var m=[];if(c.dep)m.push(T("Câmara desde ","Chamber since ")+(c.dep_desde||2019));if(c.sen)m.push(T("Senado desde ","Senate since ")+(c.sen_desde||2019));return m.length?m.join(" · "):T("sem mandato","no seat");});
      linha("af",T("Afinidade geral","Overall affinity"),function(c,a){return a.g!=null?a.g+"%":null;});
      linha("af",T("Posicionamento","Position"),function(c,a){return a.pos?a.pos.pct+"%":null;});
      linha("af",T("Prioridades","Priorities"),function(c,a){return a.pri?a.pri.pct+"%":null;});
      ind.eixos.forEach(function(e){if(s.cmpLado&&!s.pos[e.id])return;linha("pos",(EN?e.en:e.pt).t,function(c){return self.escala(c,e);});});
      linha("pro",T("Propostas desde 2019","Bills since 2019"),function(c){return c.t?String(c.t.n):"0";});
      linha("pro",T("Pautas mais frequentes","Most frequent priorities"),function(c){if(!c.t)return null;
        return Object.keys(c.t.p).sort(function(a,b){return c.t.p[b]-c.t.p[a];}).slice(0,3).map(function(k){return (EN?pm[k].en:pm[k].pt)+" ("+Math.round(100*c.t.p[k]/c.t.n)+"%)";}).join("; ");});
      if(!linhas.length){w.appendChild(mk("div","cg-vazio",T("Marque ao menos um item em \"Mostrar\".","Tick at least one item under \"Show\".")));return;}
      function valor(fn,c,i){var v=fn(c,A[i]);return v instanceof Node?v:document.createTextNode(v==null?"—":v);}
      var alvo=mk("div");w.appendChild(alvo);
      function desenha(){alvo.textContent="";
        if(matchMedia("(max-width:700px)").matches){
          /* celular: um bloco por linha, candidatos um embaixo do outro */
          var bl=mk("div","cg-cbl");var cab=mk("div");L.forEach(function(c){var it=mk("div","it");it.appendChild(self.avatar(c));var bt=mk("button","cg-lim",c.n);bt.type="button";
            bt.addEventListener("click",function(){vai("#congresso/ficha/"+c.uf+"/"+c.id);});it.appendChild(bt);cab.appendChild(it);});bl.appendChild(cab);
          linhas.forEach(function(l){var d=mk("div");d.appendChild(mk("h4",null,l[0]));
            L.forEach(function(c,i){var it=mk("div","it");it.appendChild(mk("b",null,c.n));var vv=mk("div");vv.appendChild(valor(l[1],c,i));it.appendChild(vv);d.appendChild(it);});bl.appendChild(d);});
          alvo.appendChild(bl);return;}
        var box=mk("div","cg-cmp");var tb=mk("table");var th=mk("thead");var tr=mk("tr");tr.appendChild(mk("th",null,""));
        L.forEach(function(c){var h=mk("th");h.scope="col";var bt=mk("button","cg-lim",c.n);bt.type="button";bt.style.fontWeight="600";bt.addEventListener("click",function(){vai("#congresso/ficha/"+c.uf+"/"+c.id);});
          h.appendChild(self.avatar(c));h.appendChild(mk("br"));h.appendChild(bt);tr.appendChild(h);});th.appendChild(tr);tb.appendChild(th);
        var tbd=mk("tbody");linhas.forEach(function(l){var r=mk("tr");var h=mk("th",null,l[0]);h.scope="row";r.appendChild(h);
          L.forEach(function(c,i){var td=mk("td");td.appendChild(valor(l[1],c,i));r.appendChild(td);});tbd.appendChild(r);});
        tb.appendChild(tbd);box.appendChild(tb);alvo.appendChild(box);}
      desenha();
      /* girar o celular ou mudar a janela troca entre tabela e blocos */
      try{var mq=matchMedia("(max-width:700px)");var muda=function(){if(document.body.contains(alvo))desenha();};if(mq.addEventListener)mq.addEventListener("change",muda);else mq.addListener(muda);}catch(e){}
    });
  },

  /* ===== Mandato: acompanhar depois da urna =====
     Legislatura em curso vem do indice.json (o script troca sozinho em 01/Fev/2027);
     as últimas votações vêm de recentes.json. Nada disso precisa de servidor. */
  garanteRec:function(novo){var self=this;if(this.rec&&!novo)return Promise.resolve(this.rec);
    return this.pega("recentes.json",novo).then(function(r){self.rec=r;return r;},function(){self.rec={votacoes:[]};return self.rec;});},
  /* votações novas (depois da última visita à aba Mandato) em que algum favorito votou */
  novidades:function(){var s=this.estado(),r=this.rec;if(!r||!s.fav.length)return [];
    var ids=this.idsFav();if(!ids.length)return [];
    return r.votacoes.filter(function(v){return (!s.vistoMandato||v.data>s.vistoMandato)&&ids.some(function(x){return v.v[x.k];});});},
  /* chaves dos favoritos nos arquivos de votação: d<id da Câmara> / s<código do Senado> */
  idsFav:function(){var self=this,out=[];this.estado().fav.forEach(function(f){var c=self.acha(f.u,f.i);if(!c)return;
      if(c.dep)out.push({k:"d"+c.dep,c:c});if(c.sen)out.push({k:"s"+c.sen,c:c});});return out;},
  lado:function(x){return x==null?"—":x<=-0.34?T("lado A","side A"):x>=0.34?T("lado B","side B"):T("dividido","split");},
  pct:function(a,b){return b?Math.round(100*a/b)+"%":"—";},
  /* bloco com os números do mandato em curso de um candidato (Câmara e/ou Senado) */
  blocoMandato:function(c){var self=this,ind=this.ind,w=mk("div");
    var L=ind.legislatura||{};
    if(!c.m){w.appendChild(mk("p",null,(c.r&&/^ELEITO/.test(c.r)&&L.proxima&&new Date()<new Date(L.proxima))?
        T("Eleito(a) em 2026: os números do mandato começam com a posse, em ","Elected in 2026: term figures start with the swearing-in on ")+dia(L.proxima)+".":
        T("Sem votos no plenário na legislatura em curso.","No floor votes in the current legislature.")));return w;}
    ["c","s"].forEach(function(k){var m=c.m[k];if(!m)return;var g=mk("div","cg-cards");g.style.marginTop="8px";
      [[T("Presença nas votações","Attendance at roll calls"),self.pct(m.vt,m.tot),m.vt+T(" de "," of ")+m.tot+T(" votações nominais em plenário (",
          " floor roll calls (")+(k==="c"?T("Câmara","Chamber"):T("Senado","Senate"))+T(", de ",", from ")+dia(m.de)+T(" a "," to ")+dia(m.ate)+")"],
       [T("Votou com o próprio partido","Voted with own party"),self.pct(m.pp[0],m.pp[1]),m.pp[1]+T(" votações comparadas (maioria do partido)"," roll calls compared (party majority)")],
       [T("Votou com o Governo","Voted with the Government"),m.gv?self.pct(m.gv[0],m.gv[1]):"—",m.gv?m.gv[1]+T(" votações com orientação do Governo"," roll calls with Government guidance"):T("o Senado não publica a orientação do Governo","the Senate does not publish Government guidance")]]
        .forEach(function(x){var d=mk("div","cg-card");d.appendChild(mk("small",null,x[0]));d.appendChild(mk("div","cg-num",x[1]));d.appendChild(mk("p",null,x[2]));g.appendChild(d);});
      w.appendChild(g);});
    if(c.t&&c.t.nl){var pm={};ind.pautas.forEach(function(p){pm[p.id]=p;});
      var top=Object.keys(c.t.pl||{}).sort(function(a,b){return c.t.pl[b]-c.t.pl[a];}).slice(0,3).map(function(k){return (EN?pm[k].en:pm[k].pt)+" ("+c.t.pl[k]+")";});
      w.appendChild(mk("p",null,c.t.nl+T(" propostas nesta legislatura"," bills in this legislature")+(top.length?" · "+T("mais sobre: ","mostly on: ")+top.join(", "):"")));}
    return w;},
  /* coerência: lado em cada tema antes e depois do início da legislatura em curso */
  blocoCoerencia:function(c){var self=this,ind=this.ind,L=ind.legislatura||{};
    if(!c.ea||!c.ed)return null;var tb=mk("table"),hr=mk("tr");
    [T("Tema","Topic"),T("Antes de ","Before ")+dia(L.inicio),T("Desde ","Since ")+dia(L.inicio),""].forEach(function(t){hr.appendChild(mk("th",null,t));});tb.appendChild(hr);
    var mud=0;ind.eixos.forEach(function(e){var a=c.ea[e.id],d=c.ed[e.id];if(!a&&!d)return;var r=mk("tr");
      r.appendChild(mk("td",null,(EN?e.en:e.pt).t));r.appendChild(mk("td",null,a?self.lado(a[0])+" ("+a[1]+")":"—"));r.appendChild(mk("td",null,d?self.lado(d[0])+" ("+d[1]+")":"—"));
      var troca=a&&d&&Math.abs(a[0])>=0.34&&Math.abs(d[0])>=0.34&&(a[0]>0)!==(d[0]>0);if(troca)mud++;
      r.appendChild(mk("td",troca?"cg-v cg-dif":"cg-v cg-nd",troca?T("mudou de lado","switched sides"):(a&&d?T("manteve","kept"):"")));tb.appendChild(r);});
    var w=mk("div","cg-met");var tw=mk("div","tw");tw.appendChild(tb);w.appendChild(tw);
    w.appendChild(mk("p",null,mud?T("Mudou de lado em ","Switched sides on ")+mud+T(" tema(s). Entre parênteses, quantos votos sustentam cada lado."," topic(s). In brackets, how many votes support each side."):
      T("Não mudou de lado em nenhum tema com voto antes e depois. Entre parênteses, quantos votos sustentam cada lado.","Did not switch sides on any topic with votes before and after. In brackets, how many votes support each side.")));
    return w;},
  telaMandato:function(corpo){
    var self=this,s=this.estado(),ind=this.ind,L=ind.legislatura||{};
    this.cab(corpo,T("Congresso · acompanhamento do mandato","Congress · following the term"),T("Depois da urna, acompanhe","After the ballot, keep watching"),
      T("Votar é o começo. Aqui você acompanha quem foi eleito e quem você marcou com ★: presença nas votações, fidelidade ao partido e ao governo, o que propõe e se mudou de lado.",
        "Voting is the start. Here you follow who was elected and whoever you starred ★: attendance at votes, loyalty to party and government, what they propose and whether they switched sides."));
    var w=mk("main","wrap");w.style.paddingBottom="40px";corpo.appendChild(w);
    var info=mk("div","cg-card dest");
    info.appendChild(mk("p",null,T("Legislatura em curso: ","Current legislature: ")+(L.n||"—")+T("ª, desde ","th, since ")+dia(L.inicio)+". "+
      T("Em ","On ")+dia(L.proxima)+T(" começa a próxima, com os eleitos de 2026 — este painel passa para ela sozinho, sem você fazer nada."," the next one begins, with those elected in 2026 — this panel switches to it on its own, with nothing for you to do.")));
    w.appendChild(info);
    Promise.all([this.garanteRec(false),this.resolve(s.fav),s.uf?this.garanteUF(s.uf).catch(function(){return null;}):Promise.resolve(null)]).then(function(r){
      var F=r[1];
      /* 1. novidades */
      var s1=mk("section","cg-s");s1.appendChild(mk("h2",null,T("Novidades desde a sua última visita","News since your last visit")));
      var nov=self.novidades(),idsF=self.idsFav();
      if(!s.fav.length)s1.appendChild(mk("div","cg-vazio",T("Marque candidatos com ★ (aba Afinidade) para ver aqui como eles votam nas votações novas.","Star ★ candidates (Affinity tab) to see here how they vote on new roll calls.")));
      else if(!nov.length)s1.appendChild(mk("div","cg-vazio",T("Nenhuma votação nova dos seus favoritos","No new roll call by your favourites")+(s.vistoMandato?T(" desde "," since ")+dia(s.vistoMandato):"")+"."));
      else{var maisN=mk("button","cg-mais","");maisN.type="button";
        nov.forEach(function(v,iN){var d=mk("div","cg-card cg-nov");d.style.marginTop="8px";if(iN>=5)d.hidden=true;
          d.appendChild(mk("small",null,dia(v.data)+" · "+(v.casa==="s"?T("Senado","Senate"):T("Câmara","Chamber"))+" · "+v.placar[0]+" "+T("sim","yes")+" × "+v.placar[1]+" "+T("não","no")+(v.gov?" · "+T("Governo orientou ","Government guidance: ")+VOTO[v.gov]:"")));
          var h=mk("h3",null,(v.prop?v.prop+" — ":"")+(v.em||v.desc).slice(0,160));d.appendChild(h);
          var ul=mk("ul","cg-vl");idsF.forEach(function(x){var cod=v.v[x.k];if(!cod)return;var li=mk("li");li.appendChild(document.createTextNode(x.c.n+" ("+x.c.p+"): "));
            li.appendChild(mk("span","ok",VOTO[cod]+(v.gov&&(cod==="S"||cod==="N")?(cod===v.gov?T(" · com o Governo"," · with the Government"):T(" · contra o Governo"," · against the Government")):"")));ul.appendChild(li);});
          d.appendChild(ul);
          var u=v.casa==="s"?(v.mat?"https://www25.senado.leg.br/web/atividade/materias/-/materia/"+v.mat:null):(v.pid?"https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao="+v.pid:null);
          if(u){var p=mk("p");p.appendChild(link(T("ver a proposta ↗","see the bill ↗"),u));d.appendChild(p);}
          s1.appendChild(d);});
        /* só as 5 mais recentes de início; o resto num toque */
        if(nov.length>5){maisN.textContent=T("Mostrar todas ","Show all ")+"("+nov.length+")";maisN.addEventListener("click",function(){[].forEach.call(s1.querySelectorAll(".cg-nov[hidden]"),function(x){x.hidden=false;});maisN.remove();});s1.appendChild(maisN);}
        var bv=mk("button","cg-btn sec",T("Marcar como visto","Mark as seen"));bv.type="button";bv.style.marginTop="10px";
        bv.addEventListener("click",function(){s.vistoMandato=nov[0].data;self.salva();Seletor.pinta();self.abre();});s1.appendChild(bv);}
      w.appendChild(s1);
      /* 2. eleitos do estado */
      var s2=mk("section","cg-s");s2.appendChild(mk("h2",null,T("Eleitos do seu estado","Elected in your state")));
      if(!s.uf)s2.appendChild(mk("div","cg-vazio",T("Escolha o estado lá em cima.","Choose the state at the top.")));
      else{var E=(self.uf[s.uf]?self.uf[s.uf].c:[]).filter(function(c){return c.r&&/^ELEITO/.test(c.r);});
        if(!E.length)s2.appendChild(mk("div","cg-vazio",T("O TSE ainda não publicou o resultado de ","The electoral court has not yet published the result for ")+UFN[s.uf]+
          T(". Assim que publicar, os eleitos aparecem aqui sozinhos (o site confere todo dia).",". As soon as it does, the winners show up here on their own (the site checks every day).")));
        else["S","F"].forEach(function(k){var Ek=E.filter(function(c){return c.cg===k;});if(!Ek.length)return;s2.appendChild(mk("h3",null,CARGO[k]+" ("+Ek.length+")"));
          var l=mk("div","cg-lista");Ek.sort(function(a,b){return a.n.localeCompare(b.n,"pt");}).forEach(function(c){l.appendChild(self.cartao(c,self.geral(c)));});s2.appendChild(l);});}
      w.appendChild(s2);
      /* 3. favoritos no mandato */
      var s3=mk("section","cg-s");s3.appendChild(mk("h2",null,T("Seus favoritos no mandato","Your favourites in office")));
      if(!F.length)s3.appendChild(mk("div","cg-vazio",T("Nenhum favorito ainda.","No favourites yet.")));
      F.forEach(function(c){var d=mk("div","cg-card");d.style.marginTop="10px";var h=mk("h3");var bt=mk("button","cg-lim",c.n);bt.type="button";bt.style.fontSize="17px";bt.style.fontWeight="600";
        bt.addEventListener("click",function(){vai("#congresso/ficha/"+c.uf+"/"+c.id);});h.appendChild(bt);d.appendChild(h);
        d.appendChild(mk("p",null,CARGO_L[c.cg]+" · "+c.p+" · "+c.uf+(c.r?" · "+c.r:"")));
        d.appendChild(self.blocoMandato(c));var co=self.blocoCoerencia(c);if(co){d.appendChild(mk("p",null,T("Antes × depois, tema a tema:","Before × after, topic by topic:")));d.appendChild(co);}
        s3.appendChild(d);});
      w.appendChild(s3);
      var s4=mk("section","cg-s");s4.appendChild(mk("h2",null,T("Como estes números são feitos","How these numbers are made")));
      [T("Presença: votos registrados ÷ votações nominais do plenário no período em que a pessoa estava votando (de seu primeiro ao último voto na legislatura). Licença e suplência não contam como falta.",
         "Attendance: recorded votes ÷ floor roll calls in the period the person was voting (from their first to last vote in the legislature). Leave and substitute periods do not count as absence."),
       T("Com o partido: quantas vezes o voto Sim/Não foi igual ao da maioria da bancada naquela votação. Com o Governo: igual à orientação do líder do Governo, que a Câmara publica (o Senado não).",
         "With the party: how often the Yes/No vote matched the caucus majority on that roll call. With the Government: matched the Government leader's guidance, which the Chamber publishes (the Senate does not)."),
       T("Antes × depois: o lado em cada tema (mesmas votações da aba Método) antes e depois do início da legislatura em curso. Só aparece quando há voto nos dois períodos. A partir de fev/2027, as votações novas que entrarem no método passam a contar no \"depois\".",
         "Before × after: the side on each topic (same roll calls as the Method tab) before and after the start of the current legislature. Only shown when there are votes in both periods. From Feb/2027, new roll calls added to the method count as \"after\"."),
       T("Deputados e senadores não registram plano de governo no TSE; por isso aqui o acompanhamento é pelo que fazem, não por promessa escrita. Os compromissos do presidente eleito ficam na aba Mandato da Presidência.",
         "Deputies and senators do not file a government plan with the electoral court; so here tracking is by what they do, not by written promises. The president-elect's commitments are in the Presidency's Mandate tab.")]
        .forEach(function(t){s4.appendChild(mk("p",null,t));});
      w.appendChild(s4);
    });
  },

  /* ===== Método ===== */
  telaMet:function(corpo){
    var ind=this.ind;
    this.cab(corpo,T("Congresso 2026 · Método","Congress 2026 · Method"),T("Como cada número é feito","How each number is made"),
      T("Tudo o que aparece nesta parte do site sai de dados públicos e de regras escritas aqui. Se uma regra estiver errada, dá para apontar exatamente onde.",
        "Everything in this part of the site comes from public data and from rules written down here. If a rule is wrong, you can point to exactly where."));
    var w=mk("main","wrap cg-met");w.style.paddingBottom="40px";corpo.appendChild(w);
    function sec(t,paras){var s=mk("section","cg-s");s.appendChild(mk("h2",null,t));(paras||[]).forEach(function(p){s.appendChild(mk("p",null,p));});w.appendChild(s);return s;}
    sec(T("1. De onde vêm os dados","1. Where the data comes from"),[
      T("Candidaturas, idade, escolaridade, ocupação e patrimônio: arquivos de dados abertos do TSE (consulta_cand_2026 e bem_candidato_2026). Votos nominais e propostas: APIs de dados abertos da Câmara dos Deputados e do Senado Federal. Foto: a do registro no TSE.",
        "Candidacies, age, education, occupation and assets: the electoral court's open-data files (consulta_cand_2026 and bem_candidato_2026). Roll-call votes and bills: the open-data APIs of the Chamber of Deputies and the Federal Senate. Photo: the one in the electoral court record."),
      T("O site busca tudo de novo uma vez por dia. Dados de ","The site fetches everything again once a day. Data from ")+dia(ind.atualizado_em)+".",
      T("Candidato e parlamentar são ligados pelo nome civil completo e o estado (a Câmara não publica o CPF). Se não bater, tenta o nome civil em outro estado (quem mudou de estado para concorrer) e o nome de urna — sempre só quando há uma única pessoa com aquele nome. Na dúvida, a pessoa fica sem histórico: melhor sem dado do que com o dado de outra pessoa.",
        "Candidate and legislator are linked by full legal name and state (the Chamber does not publish the CPF tax number). If that fails, it tries the legal name in another state (people who moved to run) and the ballot name — always only when a single person has that name. When in doubt, the person is left without a record: better no data than someone else's data.")]);
    var s2=sec(T("2. Prioridades: do que tratam as propostas","2. Priorities: what the bills are about"),[
      T("Contamos as propostas de lei e de emenda à Constituição (PL, PLP e PEC) apresentadas desde 2019 por cada parlamentar, como autor ou coautor. Cada proposta entra em uma ou mais pautas:",
        "We count the bills and constitutional amendments (PL, PLP and PEC) filed since 2019 by each legislator, as author or co-author. Each bill goes into one or more priorities:")]);
    var tw=mk("div","tw"),tb=mk("table"),hr=mk("tr"),dirP=1;
    var bP=mk("button",null,T("Pauta ↕","Priority ↕"));bP.type="button";bP.title=T("Ordenar de A a Z / Z a A","Sort A to Z / Z to A");
    bP.addEventListener("click",function(){var rs=[].slice.call(tb.querySelectorAll("tr")).slice(1);rs.sort(function(a,b){return a.firstChild.textContent.localeCompare(b.firstChild.textContent,"pt")*dirP;});
      dirP=-dirP;bP.textContent=T("Pauta ","Priority ")+(dirP<0?"A→Z":"Z→A");rs.forEach(function(r){tb.appendChild(r);});});
    var th0=mk("th");th0.appendChild(bP);hr.appendChild(th0);
    [T("Câmara: tema oficial da própria Câmara","Chamber: the Chamber's own official topic"),T("Palavras procuradas no resumo (Senado; e Câmara quando indicado)","Words searched in the summary (Senate; and Chamber where shown)")].forEach(function(t){hr.appendChild(mk("th",null,t));});tb.appendChild(hr);
    ind.pautas.forEach(function(p){var r=mk("tr");r.appendChild(mk("td",null,EN?p.en:p.pt));
      r.appendChild(mk("td",null,(p.temas_camara||[]).length?p.temas_camara.join("; "):T("sem tema oficial: usa as palavras ao lado","no official topic: uses the words alongside")));
      r.appendChild(mk("td",null,(p.palavras_camara?T("Câmara: ","Chamber: ")+p.palavras_camara.replace(/\\b/g,"").split("|").join(", ")+" · ":"")+T("Senado: ","Senate: ")+p.palavras.replace(/\\b/g,"").split("|").join(", ")));tb.appendChild(r);});
    tw.appendChild(tb);s2.appendChild(tw);
    s2.appendChild(mk("p",null,T("A nota de prioridades de um candidato: cada proposta vale o peso da pauta em que você a colocou — a 1ª vale 1,0, a 2ª 0,9 … a 10ª 0,1 — e somamos tudo dividido pelo total de propostas dele. 100% seria ter todas as propostas na sua pauta nº 1. Propostas sobre outros assuntos (homenagens, datas, obras locais) não somam nada.",
      "A candidate's priorities score: each bill is worth the weight of the priority where you placed it — 1st is worth 1.0, 2nd 0.9 … 10th 0.1 — and we add everything up divided by their total number of bills. 100% would mean all their bills fall under your no. 1 priority. Bills on other subjects (tributes, commemorative dates, local works) add nothing.")));
    s2.appendChild(mk("p",null,T("Mede foco, não qualidade nem posição: quem propõe muito sobre saúde pode propor coisas que você aprovaria ou não. Precisa de pelo menos 3 propostas para virar nota.",
      "It measures focus, not quality or stance: someone who files many health bills may propose things you would or would not support. At least 3 bills are needed for a score.")));
    var s3=sec(T("3. Posicionamento: como o voto vira lado A ou B","3. Position: how a vote becomes side A or B"),[
      T("Cada tema usa votações nominais reais. Para cada uma está escrito para qual lado conta o voto Sim; o Não conta para o outro lado. Abstenção, obstrução e ausência não contam. A posição do candidato no tema é a média: −1 = sempre lado A, +1 = sempre lado B.",
        "Each topic uses real roll-call votes. For each one we state which side a Yes vote counts for; a No counts for the other side. Abstention, obstruction and absence do not count. The candidate's position on the topic is the average: −1 = always side A, +1 = always side B."),
      T("Quando a pessoa não votou em nenhuma votação daquele tema, usamos uma estimativa, sempre marcada na tela: (1) o padrão geral dos votos dela em todos os temas, se tiver pelo menos 5 votos; senão (2) a média da bancada do partido atual dela nesses votos. A estimativa pelo partido não é voto da pessoa.",
        "When the person did not vote on any roll call for that topic, we use an estimate, always flagged on screen: (1) the overall pattern of their votes across all topics, if they have at least 5 votes; otherwise (2) the average of their current party's caucus on those votes. The party estimate is not the person's vote."),
      T("A nota de posicionamento: em cada tema em que você escolheu um lado, a semelhança vai de 100% (mesmo lado, sempre) a 0% (lado oposto, sempre); fazemos a média dos temas. Temas em Neutro / Não sei ficam de fora.",
        "The position score: on each topic where you picked a side, similarity runs from 100% (same side, always) to 0% (opposite side, always); we average the topics. Topics on Neutral / Not sure are left out.")]);
    ind.eixos.forEach(function(e){var tx=EN?e.en:e.pt;var d=mk("div","cg-card");d.style.marginTop="10px";d.appendChild(mk("h3",null,tx.t));
      d.appendChild(mk("p",null,"A · "+tx.a));d.appendChild(mk("p",null,"B · "+tx.b));
      if(!e.votos.length)d.appendChild(mk("p",null,T("Não há, desde 2019, votação nominal em plenário que separe claramente os dois lados deste tema. Aqui todo mundo aparece por estimativa.","Since 2019 there has been no floor roll call that clearly separates the two sides of this topic. Here everyone appears as an estimate.")));
      else{var ul=mk("ul");e.votos.forEach(function(v){var li=mk("li");
        li.appendChild(document.createTextNode((EN?v.en:v.pt)+" — "+v.prop+", "+(v.casa==="senado"?T("Senado","Senate"):T("Câmara","Chamber"))+", "+dia(v.data)+": "+v.placar[0]+" "+T("sim","yes")+" × "+v.placar[1]+" "+T("não","no")+". "+T("Sim conta para o lado ","Yes counts for side ")+v.sim+". "));
        var u=v.casa==="senado"?(v.materia?"https://www25.senado.leg.br/web/atividade/materias/-/materia/"+v.materia:null):(v.prop_id?"https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao="+v.prop_id:null);
        if(u)li.appendChild(link(T("ver ↗","see ↗"),u));ul.appendChild(li);});d.appendChild(ul);}
      s3.appendChild(d);});
    sec(T("4. Afinidade geral","4. Overall affinity"),[
      T("É a média simples da nota de posicionamento e da nota de prioridades, quando as duas existem; senão, a que existir. Sem nenhuma das duas, o candidato aparece sem percentual e vai para o fim da lista.",
        "It is the simple average of the position score and the priorities score when both exist; otherwise, whichever exists. With neither, the candidate shows no percentage and goes to the end of the list.")]);
    sec(T("5. Limites — leia antes de confiar no número","5. Limits — read before trusting the number"),[
      T("Poucas votações não resumem um mandato. Muitas decisões importantes são simbólicas (sem registro de quem votou como) ou acontecem em comissões.","A few roll calls do not sum up a term in office. Many important decisions are symbolic (no record of who voted how) or happen in committees."),
      T("Voto acompanha muito a orientação do partido. Mudanças de partido e de posição ao longo do tempo aparecem misturadas na média.","Votes follow party instructions a lot. Party switches and changes of position over time show up blended in the average."),
      T("Classificar por tema e por palavra erra: uma proposta pode cair numa pauta por uma palavra solta no resumo.","Classifying by topic and keyword makes mistakes: a bill can land in a priority because of a stray word in its summary."),
      T("Quem nunca teve mandato no Congresso não tem prioridades medidas e só tem posicionamento estimado pelo partido. Isso não é nem a favor nem contra a pessoa.","Those who never sat in Congress have no measured priorities and only a party-based position estimate. That is neither for nor against them."),
      T("O percentual não é nota de mandato nem recomendação de voto. Outras votações ou outras pautas dariam outro resultado.","The percentage is not a grade of their term nor a voting recommendation. Other roll calls or other priorities would give a different result.")]);
    var s6=sec(T("6. Votações marcantes (fora da conta)","6. Landmark votes (not counted)"),[T("Aparecem na ficha de cada candidato só para informação:","They appear on each candidate's record for information only:")]);
    var ul=mk("ul");ind.destaques.forEach(function(d){ul.appendChild(mk("li",null,(EN?d.en:d.pt)+" — "+d.prop));});s6.appendChild(ul);
  }
};

/* ---------------- Presidência · Mandato: promessas × entregas ----------------
   Compromissos = citações do plano do eleito com tipo "proposta" e especificidade 4 ou 5
   (bloco "dados"). Status = anotação editorial em presidencia-compromissos.json.
   Atos do governo = projetos e MPs do Executivo desde a posse (presidencia/mandato.json,
   gerado todo dia por congresso-sync.py). Antes da posse, tudo fica "aguardando posse". */
var PM={dados:null,mand:null,comp:null,sel:"",filtro:"",macro:"",
  ST:{andamento:["⏳",T("Em andamento","In progress")],cumprido:["✅",T("Cumprido","Delivered")],parcial:["◐",T("Cumprido em parte","Partly delivered")],
      nao_cumprido:["✖",T("Não cumprido","Not delivered")],sem_ato:["·",T("Sem ato identificado","No act identified")],aguardando:["🕒",T("Aguardando posse","Awaiting inauguration")]},
  carrega:function(){var self=this;if(this.dados)return Promise.resolve();
    try{this.dados=JSON.parse(document.getElementById("dados").textContent);}catch(e){this.dados={fichas:[],candidatos:[],macrotemas:[]};}
    var pj=function(u){return fetch(u).then(function(r){if(!r.ok)throw 0;return r.json();}).catch(function(){return null;});};
    return Promise.all([pj("presidencia/mandato.json"),pj("presidencia-compromissos.json")]).then(function(r){self.mand=r[0]||{};self.comp=r[1]||{temas:{},status:{}};});},
  status:function(f){var posse=Calendario.posse();var a=(this.comp.status||{})[f.id];
    if(a&&a.s)return a;return {s:new Date()<new Date(posse+"T00:00:00")?"aguardando":"sem_ato"};},
  pinta:function(){
    var v=$("v-mandato");if(!v)return;var self=this;
    this.carrega().then(function(){self.desenha(v);});},
  desenha:function(v){
    /* a posse e as datas dos turnos vêm do calendário (window.Calendario: padrão de fábrica ou o RootifyONE) */
    var self=this,d=this.dados,m=this.mand||{},posse=Calendario.posse();v.textContent="";
    var nome={};d.candidatos.forEach(function(c){nome[c.pre]=c.nome+" ("+c.partido+")";});
    var h=mk("header","wrap");h.style.paddingBlock="30px 8px";
    h.appendChild(mk("div","eyebrow",T("Presidência · acompanhamento do mandato 2027–2030","Presidency · following the 2027–2030 term")));
    h.appendChild(mk("h1","h-lead",T("Promessas × entregas","Promises × delivery")));
    h.appendChild(mk("p","lede",T("O que o plano registrado no TSE prometia de forma específica — com instrumento, valor, prazo ou meta — e o que o governo fez depois da posse, com o ato oficial.",
      "What the plan filed with the electoral court promised specifically — with an instrument, amount, deadline or target — and what the government did after taking office, with the official act.")));
    v.appendChild(h);
    var w=mk("main","wrap");w.style.paddingBottom="40px";v.appendChild(w);
    /* situação da eleição */
    var sit=mk("div","cg-card dest");
    sit.appendChild(mk("p",null,m.eleito?T("Eleito(a), segundo o TSE: ","Elected, according to the electoral court: ")+nome[m.eleito]+". "+T("Posse em ","Inauguration on ")+dia(posse)+".":
      (m.segundo_turno&&m.segundo_turno.length?T("Segundo turno em "+dia(Calendario.data(2))+" entre ","Run-off on "+dia(Calendario.data(2))+" between ")+m.segundo_turno.map(function(k){return nome[k];}).join(T(" e "," and "))+". ":
        T("Apuração do 1º turno em "+dia(Calendario.data(1))+". ","First-round count on "+dia(Calendario.data(1))+". "))+
      T("Quando o TSE declarar o eleito, esta aba passa a acompanhá-lo sozinha (o site confere todo dia). Até lá, veja como ficaria para cada candidatura.",
        "When the electoral court declares the winner, this tab starts following them on its own (the site checks every day). Until then, see how it would look for each candidacy.")));
    w.appendChild(sit);
    if(!this.sel)this.sel=m.eleito||(m.segundo_turno&&m.segundo_turno[0])||d.candidatos[0].pre;
    var f=mk("div","cg-f");f.style.marginTop="14px";
    var sc=mk("select");sc.setAttribute("aria-label",T("Candidatura","Candidacy"));
    d.candidatos.forEach(function(c){var o=mk("option",null,c.nome+" ("+c.partido+")"+(c.pre===m.eleito?" — "+T("eleito(a)","elected"):""));o.value=c.pre;sc.appendChild(o);});
    sc.value=this.sel;sc.addEventListener("change",function(){self.sel=sc.value;self.macro="";self.desenha(v);});f.appendChild(sc);
    var sf=mk("select");sf.setAttribute("aria-label",T("Situação","Status"));sf.appendChild(mk("option",null,T("Todas as situações","All statuses"))).value="";
    Object.keys(this.ST).forEach(function(k){var o=mk("option",null,self.ST[k][0]+" "+self.ST[k][1]);o.value=k;sf.appendChild(o);});
    sf.value=this.filtro;sf.addEventListener("change",function(){self.filtro=sf.value;self.desenha(v);});f.appendChild(sf);
    var mm={};d.macrotemas.forEach(function(x){mm[x.cod]=x;});
    var C=d.fichas.filter(function(x){return x.cand===self.sel&&x.tipo==="proposta"&&(x.nivel||0)>=4;});
    var sm=mk("select");sm.setAttribute("aria-label",T("Tema","Topic"));sm.appendChild(mk("option",null,T("Todos os temas","All topics"))).value="";
    Object.keys(C.reduce(function(a,x){a[x.macro]=1;return a;},{})).sort(function(a,b){return (mm[a]||{nome:a}).nome.localeCompare((mm[b]||{nome:b}).nome,"pt");})
      .forEach(function(k){var o=mk("option",null,(mm[k]||{nome:k}).nome);o.value=k;sm.appendChild(o);});
    sm.value=this.macro;sm.addEventListener("change",function(){self.macro=sm.value;self.desenha(v);});f.appendChild(sm);
    w.appendChild(f);
    /* placar */
    var cont={};C.forEach(function(x){var st=self.status(x).s;cont[st]=(cont[st]||0)+1;});
    var pl=mk("div","cg-cards");pl.style.marginTop="12px";
    Object.keys(this.ST).forEach(function(k){if(!cont[k])return;var c=mk("div","cg-card");c.appendChild(mk("small",null,self.ST[k][0]+" "+self.ST[k][1]));c.appendChild(mk("div","cg-num",String(cont[k])));pl.appendChild(c);});
    w.appendChild(pl);
    w.appendChild(mk("p",null,C.length+T(" compromissos específicos no plano de "," specific commitments in the plan of ")+nome[this.sel]+
      T(" (propostas com especificidade 4 ou 5, de 5). Os trechos ficam no original em português: cada um pode ser conferido na página do PDF."," (proposals with specificity 4 or 5, out of 5). Passages stay in the original Portuguese: each can be checked on the PDF page.")));
    /* compromissos por tema, com os atos do governo no mesmo tema */
    var atos=m.atos||[],temas=this.comp.temas||{},grupos={};
    C.forEach(function(x){if(self.macro&&x.macro!==self.macro)return;if(self.filtro&&self.status(x).s!==self.filtro)return;(grupos[x.macro]=grupos[x.macro]||[]).push(x);});
    Object.keys(grupos).sort(function(a,b){return (mm[a]||{nome:a}).nome.localeCompare((mm[b]||{nome:b}).nome,"pt");}).forEach(function(k){
      var sec=mk("section","cg-s");sec.appendChild(mk("h2",null,(mm[k]||{nome:k}).nome));
      grupos[k].forEach(function(x){var st=self.status(x),c=mk("div","cg-card");c.style.marginTop="8px";
        var tag=mk("span","cg-tg "+(st.s==="cumprido"?"v":st.s==="nao_cumprido"?"e":""),self.ST[st.s][0]+" "+self.ST[st.s][1]);c.appendChild(tag);
        var q=mk("p");q.style.fontStyle="italic";q.textContent="“"+x.quote+"”";c.appendChild(q);
        c.appendChild(mk("p",null,x.page+" · "+T("especificidade ","specificity ")+x.nivel+"/5"));
        if(st.nota_pt||st.nota_en)c.appendChild(mk("p",null,EN?(st.nota_en||st.nota_pt):(st.nota_pt||st.nota_en)));
        if(st.links&&st.links.length){var pl2=mk("p");st.links.forEach(function(u,i){if(i)pl2.appendChild(document.createTextNode(" · "));pl2.appendChild(link(T("fonte ","source ")+(i+1)+" ↗",u));});c.appendChild(pl2);}
        sec.appendChild(c);});
      var tk=temas[k]||[],rel=atos.filter(function(a){return a.temas.some(function(t){return tk.indexOf(t)>=0;});});
      var ad=mk("details");ad.style.marginTop="8px";ad.appendChild(mk("summary",null,T("Atos do governo neste tema desde a posse (","Government acts on this topic since inauguration (")+rel.length+")"));
      if(!rel.length)ad.appendChild(mk("p",null,new Date()<new Date(posse+"T00:00:00")?T("O mandato começa em ","The term begins on ")+dia(posse)+".":T("Nenhum projeto ou medida provisória do Executivo neste tema até agora.","No bill or provisional measure from the Executive on this topic so far.")));
      else{var ul=mk("ul");rel.slice(0,12).forEach(function(a){var li=mk("li");li.appendChild(link(a.tipo+" "+a.num+"/"+a.ano+" ↗","https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao="+a.id));
          li.appendChild(document.createTextNode(" · "+dia(a.data)+" — "+a.em));ul.appendChild(li);});ad.appendChild(ul);}
      sec.appendChild(ad);w.appendChild(sec);});
    var me=mk("section","cg-s");me.appendChild(mk("h2",null,T("Como funciona","How it works")));
    [T("A lista de compromissos não é escolha nova: são as citações do plano que este site já classificava como proposta com especificidade 4 ou 5 (ver aba Método). Diretrizes genéricas ficam de fora porque não dá para dizer se foram cumpridas.",
       "The list of commitments is not a new choice: they are the plan quotations this site already classified as proposals with specificity 4 or 5 (see the Method tab). Generic guidelines are left out because there is no way to tell whether they were delivered."),
     T("A situação de cada compromisso só muda com ato oficial verificável (lei, medida provisória, decreto, publicação no Diário Oficial), com o link da fonte. Sem ato, fica \"sem ato identificado\".",
       "A commitment's status only changes with a verifiable official act (law, provisional measure, decree, Official Gazette publication), with the source link. Without an act, it stays \"no act identified\"."),
     T("\"Atos do governo neste tema\" lista os projetos e medidas provisórias que o Executivo mandou ao Congresso desde a posse, pelo tema oficial da Câmara. É uma pista para conferir, não a prova de que o compromisso foi cumprido. Decretos e portarias não passam pela Câmara e não aparecem aqui.",
       "\"Government acts on this topic\" lists the bills and provisional measures the Executive sent to Congress since inauguration, by the Chamber's official topic. It is a lead to check, not proof that the commitment was delivered. Decrees and ordinances do not go through the Chamber and do not appear here.")]
      .forEach(function(t){me.appendChild(mk("p",null,t));});
    w.appendChild(me);
  }
};

/* aviso curto (usa o do site se houver) */
function aviso(t){var e=$("cg-aviso");if(!e){e=mk("div","cg-aviso");e.id="cg-aviso";e.setAttribute("role","status");document.body.appendChild(e);}
  e.textContent=t;e.classList.add("on");clearTimeout(aviso.t);aviso.t=setTimeout(function(){e.classList.remove("on");},3600);}

/* ---------------- liga tudo ---------------- */
function aplica(){
  var m=modoAtual();
  document.documentElement.setAttribute("data-modo",m);
  if(m!=="hub")grava(KM,m);
  Seletor.pinta();Seletor.fecha();
  if(m==="hub")pintaHub();
  if(m==="congresso")Cg.abre();
  if(m==="presidencia"&&partesHash()[0]==="mandato")PM.pinta();
}
function inicia(){
  Seletor.monta();
  /* endereço sem #: primeira visita abre a escolha; depois, a última parte usada */
  if(!location.hash){
    var ult=le(KM),alvo=ult==="congresso"?"#congresso":ult==="presidencia"?"":"#hub";
    if(alvo){try{history.replaceState(history.state,"",alvo);}catch(e){location.hash=alvo;}
      var ev;try{ev=new HashChangeEvent("hashchange");}catch(e){ev=document.createEvent("Event");ev.initEvent("hashchange",false,false);}
      dispatchEvent(ev);}
  }
  aplica();
  addEventListener("hashchange",aplica);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",inicia);else inicia();
window.CongressoV2={Cg:Cg,vaiModo:vaiModo};
})();
