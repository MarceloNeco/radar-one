/* apoio.js: ☰, compartilhar, acessibilidade e AssistONE (bloco 7, v1.8)
   Movido como está do index.html 2.5.4 no F1-PR3 (31/10/2026): mesmo código, mesmos nomes; o que sai daqui para fora é só window.X (ver docs/modulos-contrato.md). */
/* =====================================================================
   v1.8: blocos de apoio — menu ☰ no celular, compartilhar, acessibilidade
   e o assistente AssistONE. Depende só de window.PG (ponte do script
   principal) e, para narrar, de window.VozLeitor (leitura em voz alta).
   Regras: nada aqui grava fora deste navegador; texto sempre em PT e EN.
   ===================================================================== */
(function(){
"use strict";
var EN=/^en/i.test(document.documentElement.getAttribute("lang")||"")||/index-en\.html$/.test(location.pathname);
function T(pt,en){return EN?en:pt;}
function mk(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;}
function $(id){return document.getElementById(id);}
var PG=null;
function prefs(){return PG?PG.prefs():{};}
function grava(){if(PG)PG.grava();}
var REDUZ=function(){try{return matchMedia("(prefers-reduced-motion: reduce)").matches;}catch(e){return false;}};
var ESTREITO=function(){try{return matchMedia("(max-width: 760px)").matches;}catch(e){return false;}};
var TOQUE=function(){try{return matchMedia("(pointer: coarse)").matches;}catch(e){return false;}};

/* ---------------- o que é cada tela (mapa usado pelo ☰, pela busca e pelo assistente) ---------------- */
var TELAS={
  /* F1-PR5: os destinos do shell (Indicadores é a tela "infograficos" de sempre) */
  hoje:{ic:"🏠",t:T("Hoje","Today"),d:T("O que mudou e por onde começar.","What changed and where to start."),sin:"hoje inicio comeco home today"},
  explorar:{ic:"🔎",t:T("Explorar","Explore"),d:T("Pessoas, mandatos e temas.","People, terms and topics."),sin:"explorar procurar pessoas temas explore"},
  salvos:{ic:"⭐",t:T("Salvos","Saved"),d:T("Seus favoritos e painéis, só neste aparelho.","Your favourites and panels, on this device only."),sin:"salvos favoritos paineis saved"},
  /* os cargos vêm do turno de agora no calendário (window.Calendario) */
  colinha:{ic:"🗳️",t:T("Colinha da eleição","Election cheat sheet"),d:T("Monte a lista dos números que você vai digitar na urna ("+Calendario.nomes()+"), com foto, e mande no WhatsApp.",
    "Build the list of numbers you will type at the ballot box ("+Calendario.nomes()+"), with photos, and send it on WhatsApp."),
    sin:"cola colinha cedula urna numero numeros votar whatsapp imprimir candidato foto governador senador deputado presidente"},
  hub:{ic:"🧭",t:T("Início · escolher","Start · choose"),d:T("A porta de entrada: escolha entre os planos dos presidenciáveis e os votos de quem disputa o Congresso.",
    "The front door: choose between the presidential plans and the votes of those running for Congress."),
    sin:"hub escolher entrada trocar modo presidencia congresso"},
  congresso:{ic:"⚖️",t:T("Congresso · início","Congress · home"),d:T("O que fazem deputados e senadores, por que o voto pesa e como usar esta parte.",
    "What deputies and senators do, why the vote matters and how to use this part."),
    sin:"congresso senado camara deputados senadores legislativo"},
  "congresso/afinidade":{ic:"🎯",t:T("Congresso · afinidade","Congress · affinity"),d:T("Ordene suas pautas, diga sua posição em 9 temas e veja quem pensa parecido, do seu estado.",
    "Rank your priorities, give your view on 9 topics and see who in your state thinks alike."),
    sin:"afinidade pautas prioridades posicao posicionamento candidatos estado lista"},
  "congresso/favoritos":{ic:"⭐",t:T("Congresso · favoritos","Congress · favourites"),d:T("Quem você marcou com ★ e a sua cola para a urna.","Who you starred ★ and your ballot memo."),
    sin:"favoritos estrela cola cedula urna numero"},
  "congresso/comparar":{ic:"⇄",t:T("Congresso · comparar","Congress · compare"),d:T("Até três candidaturas lado a lado.","Up to three candidacies side by side."),
    sin:"comparar lado a lado comparacao"},
  "congresso/mandato":{ic:"🔔",t:T("Congresso · mandato","Congress · in office"),d:T("Eleitos do seu estado, novidades das votações dos favoritos, presença, fidelidade e antes × depois.",
    "Elected in your state, news on your favourites' votes, attendance, loyalty and before × after."),
    sin:"mandato acompanhar eleitos presenca faltas partido governo novidades avisos coerencia"},
  mandato:{ic:"📋",t:T("Mandato: promessas × entregas","Term: promises × delivery"),d:T("Os compromissos específicos do plano do presidente eleito e o que o governo fez depois da posse.",
    "The president-elect's specific plan commitments and what the government did after taking office."),
    sin:"mandato promessas entregas compromissos cumpridas presidente eleito governo atos"},
  "congresso/metodo":{ic:"🔬",t:T("Congresso · método","Congress · method"),d:T("De onde vêm os dados e como cada pauta e posição é ligada a cada candidato.",
    "Where the data comes from and how each priority and position is linked to each candidate."),
    sin:"metodo calculo fontes votacoes como funciona limites"},
  inicio:{ic:"🏠",t:T("Início","Home"),d:T("Visão geral: quantas citações cada plano rendeu por tema, e os avisos para ler tudo direito.",
    "Overview: how many quotations each plan yielded per topic, plus the notes for reading it right."),
    sin:"capa home panorama mapa de calor"},
  historico:{ic:"👤",t:T("Currículo","Candidates"),d:T("Quem é cada candidato: trajetória, patrimônio, processos e os números dos governos que ocupou.",
    "Who each candidate is: career, assets, court cases and the figures of the governments they held."),
    sin:"candidatos biografia patrimonio processos vice equipe comparar candidaturas"},
  infograficos:{ic:"📈",t:T("Infográficos","Charts"),d:T("Séries oficiais desde 1998, divididas por governo, e comparadores para montar o seu gráfico.",
    "Official series since 1998, split by government, plus tools to build your own chart."),
    sin:"graficos series indicadores pib inflacao desemprego marcos radar sobrepor"},
  macrotemas:{ic:"🗂️",t:T("Macrotemas","Macro-topics"),d:T("As citações dos planos, tema por tema: o trecho, a página, o tipo e a especificidade.",
    "The plans' quotations, topic by topic: the passage, the page, the type and the specificity."),
    sin:"citacoes propostas diretrizes temas cartoes filtros relatorio"},
  score:{ic:"🎚️",t:T("Índice sob medida","Custom index"),d:T("Escolha até cinco temas e veja o quanto cada plano detalha o que importa para você.",
    "Pick up to five topics and see how much each plan details what matters to you."),
    sin:"recorte pesos ranking meu indice score prioridades"},
  documentos:{ic:"📄",t:T("Documentos","Documents"),d:T("Os oito PDFs originais, o perfil de cada um e todos os links que o site usa.",
    "The eight original PDFs, each one's profile and every link the site uses."),
    sin:"pdf planos fontes links uteis baixar tse"},
  metodo:{ic:"🔬",t:T("Método","Method"),d:T("Como as citações foram extraídas e conferidas, e onde o estudo pode errar.",
    "How the quotations were extracted and checked, and where the study can be wrong."),
    sin:"metodologia vies garantias limites criterio conferencia"},
  glossario:{ic:"📚",t:T("Glossário","Glossary"),d:T("Toda sigla e termo técnico do site, explicados.","Every acronym and technical term on the site, explained."),
    sin:"siglas termos definicoes significado"}
};
function telaAtual(){var t=(location.hash||"#inicio").slice(1),h=t.split("/")[0];if(TELAS[t])return t;if(h==="congresso"&&TELAS[t.split("/").slice(0,2).join("/")])return t.split("/").slice(0,2).join("/");if(/^g-/.test(h))return "infograficos";return TELAS[h]?h:"inicio";}
function vai(id){if(location.hash!=="#"+id)location.hash="#"+id;else scrollTo({top:0,behavior:"smooth"});}
function rola(sel){var e=typeof sel==="string"?document.querySelector(sel):sel;if(!e)return false;
  if(window.ancoraEm)window.ancoraEm(e);else e.scrollIntoView({behavior:REDUZ()?"auto":"smooth",block:"start"});
  e.classList.add("ao-foco");setTimeout(function(){e.classList.remove("ao-foco");},1800);return true;}
function depois(fn,ms){setTimeout(function(){EJ.quando(fn);},ms||350);}

/* ---------------- avisos (toast) sem cobrir o assistente ---------------- */
function toast(m){try{var t=$("tip");if(t){t.textContent=m;t.classList.add("on");t.style.left="";t.style.top="";
  t.style.right="18px";t.style.bottom=(document.documentElement.classList.contains("ao-on")?"96px":"18px");t.style.maxWidth="300px";
  setTimeout(function(){t.classList.remove("on");t.style.right="";t.style.bottom="";t.style.maxWidth="";},3200);}}catch(e){}}

/* ================= compartilhar ================= */
var Share={
  dados:function(){
    var v=TELAS[telaAtual()], tit="Eleições 2026 · "+v.t;
    return {title:tit,text:v.d,url:location.href};
  },
  texto:function(txt,ancora,msgOk){
    /* citação, trecho, link: no celular abre o compartilhar do aparelho; no computador copia */
    var self=this;
    if(navigator.share&&TOQUE()){navigator.share({text:txt}).catch(function(err){if(err&&err.name==="AbortError")return;self.copia(txt,msgOk);});return;}
    this.copia(txt,msgOk);
  },
  copia:function(txt,msgOk){
    function ok(){toast(msgOk||T("Copiado.","Copied."));}
    function falha(){toast(T("Não deu para copiar sozinho. Selecione o texto e copie.","Could not copy automatically. Select the text and copy it."));}
    try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(ok,falha);return;}}catch(e){}
    try{var ta=mk("textarea");ta.value=txt;ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.select();
      var r=document.execCommand("copy");document.body.removeChild(ta);r?ok():falha();}catch(e){falha();}
  },
  pagina:function(btn){
    var d=this.dados(), self=this;
    if(navigator.share&&TOQUE()){navigator.share(d).catch(function(err){if(err&&err.name==="AbortError")return;self.popover(btn,d);});return;}
    this.popover(btn,d);
  },
  popover:function(btn,d){
    var host=btn.parentNode, pop=btn.__shr;
    if(pop){EJ.pop(btn,pop,{lado:"direita"});return;}
    pop=mk("div","shr-pop");pop.hidden=true;btn.__shr=pop;
    var enc=encodeURIComponent, txt=d.title+" — "+d.text;
    pop.appendChild(mk("div","shr-t",T("Compartilhar esta tela","Share this screen")));
    [["💬","WhatsApp","https://wa.me/?text="+enc(txt+"\n"+d.url)],
     ["✈️","Telegram","https://t.me/share/url?url="+enc(d.url)+"&text="+enc(txt)],
     ["✉️","E-mail","mailto:?subject="+enc(d.title)+"&body="+enc(txt+"\n\n"+d.url)]].forEach(function(o){
      var a=mk("a");a.href=o[2];a.target="_blank";a.rel="noopener noreferrer";
      a.appendChild(mk("span","shr-ic",o[0]));a.appendChild(mk("span",null,o[1]));a.addEventListener("click",function(){EJ.fecha(pop);});pop.appendChild(a);});
    var b=mk("button");b.type="button";b.appendChild(mk("span","shr-ic","🔗"));b.appendChild(mk("span",null,T("Copiar o link","Copy the link")));
    b.addEventListener("click",function(){EJ.fecha(pop);Share.copia(d.url,T("Link copiado.","Link copied."));});
    pop.appendChild(b);
    if(navigator.share){var n=mk("button");n.type="button";n.appendChild(mk("span","shr-ic","📤"));n.appendChild(mk("span",null,T("Outros aplicativos…","Other apps…")));
      n.addEventListener("click",function(){EJ.fecha(pop);navigator.share(d).catch(function(){});});pop.appendChild(n);}
    host.appendChild(pop);
    EJ.pop(btn,pop,{lado:"direita"});
  }
};
window.PGShare=Share;
function montaShare(){
  var nav=document.querySelector(".nav-in"), ref=$("theme");
  if(!nav||!ref||$("share-b"))return;
  var w=mk("div","shr");
  var b=mk("button","ibtn");b.id="share-b";b.type="button";
  b.setAttribute("aria-label",T("Compartilhar esta tela","Share this screen"));b.title=b.getAttribute("aria-label");
  b.setAttribute("aria-haspopup","true");b.setAttribute("aria-expanded","false");
  b.innerHTML='<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="15" cy="4.5" r="2.2" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="5" cy="10" r="2.2" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="15" cy="15.5" r="2.2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M7 9l6-3.4M7 11l6 3.4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
  b.addEventListener("click",function(e){e.stopPropagation();Share.pagina(b);});
  w.appendChild(b);nav.insertBefore(w,ref);
}

/* ================= acessibilidade (Configurações) ================= */
function aplicaAcess(){
  var p=prefs(), r=document.documentElement;
  r.classList.toggle("pg-f1",p.fonte===1);r.classList.toggle("pg-f2",p.fonte===2);
  r.classList.toggle("pg-calmo",p.calmo===true);
}
window.CfgAcess=function(host){
  var el=PG.el, p=prefs();
  var s=el("div","oc-sec");s.appendChild(el("span","oc-rot",T("Acessibilidade","Accessibility")));
  var l=el("div","oc-linha");
  l.appendChild(el("span",null,T("Tamanho do texto:","Text size:")));
  [[0,"A"],[1,"A+"],[2,"A++"]].forEach(function(o){
    var on=(p.fonte||0)===o[0];
    var b=el("button","chip-cat"+(on?" on":""),o[1]);b.type="button";b.setAttribute("aria-pressed",on?"true":"false");
    b.setAttribute("aria-label",[T("Texto normal","Normal text"),T("Texto maior","Larger text"),T("Texto bem maior","Much larger text")][o[0]]);
    b.addEventListener("click",function(){if(o[0])p.fonte=o[0];else delete p.fonte;grava();aplicaAcess();PG.repintaConfig();});
    l.appendChild(b);});
  s.appendChild(l);
  var l2=el("div","oc-linha");l2.style.marginTop="8px";
  var on2=p.calmo===true;
  var b2=el("button","chip-cat"+(on2?" on":""),T("Reduzir animações","Reduce animations"));b2.type="button";b2.setAttribute("aria-pressed",on2?"true":"false");
  b2.addEventListener("click",function(){if(on2)delete p.calmo;else p.calmo=true;grava();aplicaAcess();PG.repintaConfig();});
  l2.appendChild(b2);
  s.appendChild(l2);
  s.appendChild(el("p","oc-nota",T("O texto maior vale para o site inteiro, inclusive tabelas e gráficos. \"Reduzir animações\" tira os movimentos de menus, balões e do AssistONE. A leitura em voz alta fica logo abaixo.",
    "Larger text applies to the whole site, tables and charts included. \"Reduce animations\" removes the motion of menus, balloons and AssistONE. Read-aloud settings are right below.")));
  host.appendChild(s);
};

/* ================= menu ☰ (celular) ================= */
var Gav={el:null,btn:null,aberta:false,
  monta:function(){
    var nav=document.querySelector(".nav-in"), brand=document.querySelector(".brand");
    if(!nav||!brand||$("nav-h"))return;
    var b=mk("button","ibtn nav-h");b.id="nav-h";b.type="button";
    b.setAttribute("aria-label",T("Abrir o menu","Open the menu"));b.setAttribute("aria-expanded","false");b.setAttribute("aria-controls","gav");
    b.innerHTML='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
    b.addEventListener("click",function(){Gav.abre();});
    nav.insertBefore(b,brand);
    var cur=mk("button","nav-cur");cur.id="nav-cur";cur.type="button";cur.setAttribute("aria-label",T("Página atual. Abre o menu.","Current page. Opens the menu."));
    cur.addEventListener("click",function(){Gav.abre();});
    nav.insertBefore(cur,brand.nextSibling);
    this.btn=b;
    var g=mk("nav","gav");g.id="gav";g.setAttribute("aria-label",T("Menu","Menu"));g.hidden=true;
    document.body.appendChild(g);
    this.el=g;
    this.pintaAtual();
    addEventListener("hashchange",function(){Gav.pintaAtual();});
  },
  pintaAtual:function(){var c=$("nav-cur");if(!c)return;var v=TELAS[telaAtual()];c.textContent="";
    c.appendChild(document.createTextNode(v.t));
    var s=mk("span");s.innerHTML='<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';c.appendChild(s);},
  conteudo:function(){
    var g=this.el;g.textContent="";
    var h=mk("div","gav-h");
    var ic=document.querySelector(".brand-ic");if(ic){var i2=ic.cloneNode(true);i2.style.width="22px";i2.style.height="22px";h.appendChild(i2);}
    h.appendChild(mk("b",null,"RadarONE"));
    var x=mk("button","gav-x","×");x.type="button";x.setAttribute("aria-label",T("Fechar o menu","Close the menu"));x.addEventListener("click",function(){Gav.fecha();});
    h.appendChild(x);g.appendChild(h);
    var c=mk("div","gav-c");g.appendChild(c);
    /* ações rápidas */
    var r=mk("div","gav-rap");
    [["🔍",T("Procurar","Search"),function(){Gav.fecha();depois(function(){AO.abre("busca");});},"assistone"],
     ["📤",T("Compartilhar","Share"),function(){Gav.fecha();depois(function(){var b=$("share-b");if(b)Share.pagina(b);});}],
     ["🔊",T("Ouvir","Listen"),function(){Gav.fecha();depois(function(){AO.lerTela();});}],
     ["⚙️",T("Ajustes","Settings"),function(){Gav.fecha();depois(function(){PG.abreConfig();});}]].forEach(function(o){
      var b=mk("button");b.type="button";if(o[3])b.setAttribute("data-recurso",o[3]);b.appendChild(mk("span",null,o[0]));b.appendChild(mk("span",null,o[1]));b.addEventListener("click",o[2]);r.appendChild(b);});
    c.appendChild(r);
    /* F1-PR5: o menu em grupos com título (diretriz): o que se acompanha o ano inteiro e o arquivo da eleição */
    var at=telaAtual(), cg=/^congresso/.test(at), ACOMP=["hoje","explorar","infograficos","salvos"];
    var item=function(k){
      var v=TELAS[k], b=mk("button","gav-it");b.type="button";
      if(k==="colinha")b.setAttribute("data-recurso","colinha");
      if(k===at)b.setAttribute("aria-current","page");
      b.appendChild(mk("span","gav-ic",v.ic));
      var d=mk("div");d.appendChild(document.createTextNode(v.t));d.appendChild(mk("small",null,v.d));b.appendChild(d);
      b.addEventListener("click",function(){Gav.fecha();depois(function(){vai(k);},200);});
      c.appendChild(b);};
    c.appendChild(mk("div","gav-g",T("Acompanhar","Follow")));
    ACOMP.forEach(item);
    c.appendChild(mk("div","gav-g",T("Eleições 2026","Elections 2026")));
    Object.keys(TELAS).forEach(function(k){
      if(ACOMP.indexOf(k)>-1)return;
      if(at!=="hub"&&k!=="hub"&&/^congresso/.test(k)!==cg)return;
      item(k);});
    c.appendChild(mk("div","gav-g",T("Tema","Theme")));
    var tm=mk("div","gav-lg");
    [["sistema",T("Do sistema","System")],["claro",T("Claro","Light")],["escuro",T("Escuro","Dark")]].forEach(function(o){var b=mk("button",null,o[1]);b.type="button";
      b.setAttribute("aria-pressed",(PG.temaAtual()===o[0])?"true":"false");
      b.addEventListener("click",function(){var p=prefs();if(o[0]==="sistema")delete p.tema;else p.tema=o[0];grava();PG.aplicaTema();Gav.conteudo();});tm.appendChild(b);});
    c.appendChild(tm);
    var som=$("som");
    if(som&&!som.hidden){
      var bs=mk("button","gav-it");bs.type="button";bs.appendChild(mk("span","gav-ic","🎵"));
      var ds=mk("div");ds.appendChild(document.createTextNode(T("Trilha sonora","Soundtrack")));
      ds.appendChild(mk("small",null,(window.somLigado&&window.somLigado())?T("Tocando · toque para desligar","Playing · tap to turn off"):T("Desligada · toque para ligar","Off · tap to turn on")));
      bs.appendChild(ds);bs.addEventListener("click",function(){som.click();setTimeout(function(){Gav.conteudo();},300);});c.appendChild(bs);}
    c.appendChild(mk("div","gav-g",T("Idioma","Language")));
    var lg=mk("div","gav-lg");
    [["pt","PT-BR"],["en","EN-US"]].forEach(function(o){var b=mk("button",null,o[1]);b.type="button";
      b.setAttribute("aria-pressed",(PG.IDIOMA===o[0])?"true":"false");
      b.addEventListener("click",function(){Gav.fecha();EJ.quando(function(){PG.vaiParaIdioma(o[0]);});});lg.appendChild(b);});
    c.appendChild(lg);
    c.appendChild(mk("div","gav-g",T("Ajuda e mais","Help and more")));
    [["✨","AssistONE",T("Ajuda desta tela, tour e busca","Help for this screen, tour and search"),function(){Gav.fecha();depois(function(){AO.abre();});},"assistone"],
     ["🧭",T("Tour rápido","Quick tour"),null,function(){Gav.fecha();depois(function(){AO.abre("tour");});},"assistone"],
     ["🆕",T("O que mudou","What changed"),null,function(){Gav.fecha();depois(function(){PG.abreDoc("novidades");});}],
     ["🛡️",T("Aviso de uso e privacidade","Terms of use and privacy"),null,function(){Gav.fecha();depois(function(){PG.abreDoc("aviso");});}],
     ["🏠",T("Portal SolverONE","SolverONE portal"),T("Os outros apps, em outra aba","The other apps, in a new tab"),null]].forEach(function(o){
      var b;
      if(o[3]){b=mk("button","gav-it");b.type="button";b.addEventListener("click",o[3]);if(o[4])b.setAttribute("data-recurso",o[4]);}
      else{b=mk("a","gav-it");b.href=location.origin+"/";b.target="_blank";b.rel="noopener";}
      b.appendChild(mk("span","gav-ic",o[0]));
      var d=mk("div");d.appendChild(document.createTextNode(o[1]));if(o[2])d.appendChild(mk("small",null,o[2]));b.appendChild(d);
      c.appendChild(b);});
    c.appendChild(mk("p","gav-f",T("Os ajustes ficam só neste aparelho. Nada é enviado a lugar nenhum.","Settings stay on this device only. Nothing is sent anywhere.")));
  },
  abre:function(){
    if(!this.el)return;
    if(this.aberta)return;
    this.conteudo();
    this.aberta=true;this.btn.setAttribute("aria-expanded","true");
    EJ.abre(this.el,{classe:"ej-gaveta",rotulo:T("Menu","Menu"),focar:this.el.querySelector(".gav-x"),
      aoFechar:function(){Gav.aberta=false;Gav.btn.setAttribute("aria-expanded","false");}});
  },
  fecha:function(){EJ.fecha(this.el);}
};

/* ================= AssistONE ================= */
var SVG_AO='<svg viewBox="0 0 100 100" aria-hidden="true">'+
 '<defs><radialGradient id="aoG" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#FFE9A8"/><stop offset=".55" stop-color="#E8B84A"/><stop offset="1" stop-color="#9C6A0C"/></radialGradient>'+
 '<linearGradient id="aoF" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF6D6"/><stop offset="1" stop-color="#F2D27A"/></linearGradient></defs>'+
 '<circle cx="50" cy="50" r="47" fill="url(#aoG)"/>'+
 '<circle cx="50" cy="50" r="47" fill="none" stroke="#7A5208" stroke-width="2"/>'+
 '<path d="M14 62c8 6 14 4 20-2M86 62c-8 6-14 4-20-2M22 30c6-4 10-3 14 1M78 30c-6-4-10-3-14 1" fill="none" stroke="#B98A2E" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>'+
 '<path d="M36 40c0-10 8-16 16-16 9 0 15 6 15 13 0 9-9 11-12 16-1.4 2.2-1.8 4.4-1.8 7.5" fill="none" stroke="url(#aoF)" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>'+
 '<path d="M36 40c0-10 8-16 16-16 9 0 15 6 15 13 0 9-9 11-12 16-1.4 2.2-1.8 4.4-1.8 7.5" fill="none" stroke="#7A5208" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity=".55"/>'+
 '<circle cx="53" cy="73" r="6" fill="url(#aoF)" stroke="#7A5208" stroke-width="1.2"/>'+
 '<circle cx="51" cy="71" r="1.8" fill="#fff" opacity=".9"/>'+
 '<circle cx="44" cy="35" r="2" fill="#5A3B05"/>'+
 '<path d="M41 44c3 2 6 2 9 0" fill="none" stroke="#5A3B05" stroke-width="1.6" stroke-linecap="round"/>'+
 '</svg>';
/* interruptores do RootifyONE (recursos.js): a administração pode desligar o AssistONE e as dicas por tela */
function admAO(){return !!(window.SolverRecursos&&!SolverRecursos.ligado("assistone",true));}
var AO={
  btn:null, box:null, dica:null, ligado:true, modo:"inicio", tourI:0, tourFoco:null, ctl:null,
  monta:function(){
    var p=prefs();
    this.ligado=(p.assist!==false)&&!admAO();
    if(!this.btn){
      var b=mk("button","ao-btn");b.id="ao-btn";b.type="button";
      var im=document.createElement("img");im.src="ajuda-botao.png";im.alt="";im.width=512;im.height=512;im.decoding="async";b.appendChild(im);
      b.setAttribute("aria-label","AssistONE — "+T("ajuda e assistente","help and assistant"));b.setAttribute("aria-haspopup","dialog");b.setAttribute("aria-expanded","false");b.setAttribute("aria-controls","ao-box");
      b.addEventListener("click",function(e){e.stopPropagation();AO.alterna();});
      b.setAttribute("data-recurso","assistone");
      document.body.appendChild(b);this.btn=b;
      var x=mk("div","ao-box");x.id="ao-box";x.hidden=true;
      x.setAttribute("data-recurso","assistone");
      document.body.appendChild(x);this.box=x;
      var d=mk("div","ao-dica");d.id="ao-dica";d.hidden=true;d.setAttribute("role","status");
      d.setAttribute("data-recurso","assistone");
      d.addEventListener("click",function(e){e.stopPropagation();});
      document.body.appendChild(d);this.dica=d;
      addEventListener("hashchange",function(){if(!AO.box.hidden&&AO.modo!=="tour")AO.pinta("inicio");AO.agendaDica();});
      /* o ▶ do leitor precisa de um "controle": um invisível serve para os pedidos do assistente */
      var c=mk("span","tts-ctl");c.hidden=true;c.innerHTML='<button type="button" class="tts-b" tabindex="-1"></button><button type="button" class="tts-s" tabindex="-1"></button>';
      document.body.appendChild(c);this.ctl=c;
    }
    this.aplica();
  },
  aplica:function(){
    document.documentElement.classList.toggle("ao-on",this.ligado);
    this.btn.hidden=!this.ligado;
    if(!this.ligado){this.fecha();this.dica.hidden=true;}
  },
  liga:function(v){if(admAO()){this.ligado=false;this.aplica();return;}var p=prefs();if(v)delete p.assist;else p.assist=false;grava();this.ligado=!!v;this.aplica();},
  alterna:function(){if(this.box.hidden)this.abre();else this.fecha();},
  abre:function(modo){
    if(admAO())return;
    if(!this.ligado){this.liga(true);}
    if(this.box.__ej)return;
    this.dica.hidden=true;
    this.btn.setAttribute("aria-expanded","true");
    EJ.abre(this.box,{classe:"ej-ao",rotulo:"AssistONE",temTexto:false,
      aoFechar:function(){if(AO.modo==="tour")AO.tourSai(true);AO.btn.setAttribute("aria-expanded","false");}});
    if(!REDUZ()&&!document.documentElement.classList.contains("pg-calmo")){this.box.classList.add("ao-entra");
      requestAnimationFrame(function(){requestAnimationFrame(function(){AO.box.classList.remove("ao-entra");});});}
    this.pinta(modo||(prefs().aoVisto?"inicio":"ola"));
  },
  fecha:function(){EJ.fecha(this.box);},
  cabeca:function(tit){
    var h=mk("div","ao-h");var b=mk("b");b.innerHTML=T("Assist<span>ONE</span>","Assist<span>ONE</span>");
    if(tit){b.textContent="";b.appendChild(document.createTextNode(tit));}
    h.appendChild(b);
    var x=mk("button",null,"×");x.type="button";x.setAttribute("aria-label",T("Fechar","Close"));x.addEventListener("click",function(){AO.fecha();});
    h.appendChild(x);return h;
  },
  item:function(ic,t,sub,fn,n){
    var b=mk("button","ao-it");b.type="button";b.appendChild(mk("span","ao-ic",ic));
    var d=mk("div");d.appendChild(document.createTextNode(t));if(sub)d.appendChild(mk("small",null,sub));b.appendChild(d);
    if(n!=null)b.appendChild(mk("span","ao-n",String(n)));
    b.addEventListener("click",fn);return b;
  },
  volta:function(c){var b=mk("button","ao-volta","‹ "+T("Voltar","Back"));b.type="button";b.addEventListener("click",function(){AO.pinta("inicio");});c.appendChild(b);},
  pinta:function(modo){
    this.modo=modo;var box=this.box;box.textContent="";
    var c=mk("div","ao-c");
    if(modo==="ola")this.pOla(c);
    else if(modo==="busca")this.pBusca(c);
    else if(modo==="avisos")this.pAvisos(c);
    else if(modo==="ajustes")this.pAjustes(c);
    else if(modo==="tour"){this.tourI=0;this.pTour(c);}
    else this.pInicio(c);
    box.appendChild(this.cabeca(modo==="tour"?T("Tour rápido","Quick tour"):null));box.appendChild(c);
    if(PG&&PG.traduz)try{PG.traduz(box);}catch(e){}
    var f=box.querySelector("input,button.ao-it,button");if(f&&modo!=="inicio"&&modo!=="ola")try{f.focus({preventScroll:true});}catch(e){}
  },
  /* ---- primeira visita ---- */
  pOla:function(c){
    var p=mk("p","ao-p");p.innerHTML=T("<b>Olá! Eu sou o AssistONE 👋</b><br>Estou aqui embaixo para explicar cada tela, ler o que está escrito em voz alta e mudar os ajustes. Por onde quer começar?",
      "<b>Hi! I'm AssistONE 👋</b><br>I sit down here to explain each screen, read what is written out loud and change settings. Where would you like to start?");
    c.appendChild(p);
    var l=mk("div","ao-lista");
    l.appendChild(this.item("🧭",T("Tour rápido","Quick tour"),T("Um minuto: onde fica cada coisa","One minute: where everything is"),function(){AO.viu();AO.pinta("tour");}));
    l.appendChild(this.item("📍",T("Ajuda desta tela","Help for this screen"),TELAS[telaAtual()].t,function(){AO.viu();AO.pinta("inicio");}));
    l.appendChild(this.item("🔍",T("Procurar algo","Search for something"),T("Telas, temas, candidatos, siglas…","Screens, topics, candidates, acronyms…"),function(){AO.viu();AO.pinta("busca");}));
    c.appendChild(l);
    var r=mk("div","ao-rodape");
    var a=mk("button",null,T("Agora não","Not now"));a.type="button";a.addEventListener("click",function(){AO.viu();AO.fecha();});
    var d=mk("button",null,T("Desligar o AssistONE","Turn AssistONE off"));d.type="button";d.addEventListener("click",function(){AO.viu();AO.desliga();});
    r.appendChild(a);r.appendChild(d);c.appendChild(r);
  },
  viu:function(){var p=prefs();if(!p.aoVisto){p.aoVisto=true;grava();}},
  desliga:function(){
    toast(T("AssistONE desligado. Para religar: ⚙ Configurações → AssistONE.","AssistONE is off. To turn it back on: ⚙ Settings → AssistONE."));
    this.fecha();this.liga(false);
  },
  /* ---- tela atual ---- */
  atalhosDe:function(k){
    var A={
      inicio:[[T("Ver o panorama","See the overview"),function(){rola("#heat");}],
              [T("Ir para as citações","Go to the quotations"),function(){vai("macrotemas");}],
              [T("Conhecer os candidatos","Meet the candidates"),function(){vai("historico");}]],
      historico:[[T("Escolher um candidato","Pick a candidate"),function(){rola("#gsel");}],
                 [T("Comparar candidaturas","Compare candidacies"),function(){var b=document.querySelectorAll("#cv-modo button")[1];if(b){b.click();rola("#cv-comp");}}]],
      infograficos:[[T("Índice dos gráficos","Chart index"),function(){rola(".ig-sum");}],
                    [T("Sobrepor indicadores","Overlay indicators"),function(){var d=document.querySelector("#v-infograficos details.sob-d, #v-infograficos .ig-comp-s details");if(d){d.open=true;rola(d);}}],
                    [T("Mostrar/ocultar retratos","Show/hide portraits"),function(){var p=prefs();p.fotos=!(p.fotos!==undefined?!!p.fotos:!ESTREITO());grava();PG.repintaIG();PG.escreveVer();toast(T("Pronto.","Done."));}]],
      macrotemas:[[T("Escolher um macrotema","Pick a macro-topic"),function(){rola("#mtpick");}],
                  [T("Buscar uma palavra","Search a word"),function(){var i=$("f-busca");if(i){rola(i);i.focus();}}],
                  [T("Baixar em CSV","Download as CSV"),function(){var b=document.querySelector("#mt-dl button");if(b)b.click();else toast(T("Os botões de download aparecem logo acima dos cartões.","The download buttons appear right above the cards."));}]],
      score:[[T("Escolher os temas","Pick the topics"),function(){rola("#pool");}],
             [T("Ver o resultado","See the result"),function(){rola("#sc-box");}]],
      documentos:[[T("Baixar um plano (PDF)","Download a plan (PDF)"),function(){rola("#docs");}],
                  [T("Links úteis","Useful links"),function(){rola("#links-uteis");}]],
      metodo:[[T("O que esta versão garante","What this version guarantees"),function(){rola("#v-metodo .grid2");}],
              [T("Controle de viés","Bias check"),function(){rola("#vies");}]],
      glossario:[[T("Buscar um termo","Search a term"),function(){var i=$("gl-busca");if(i){rola(i);i.focus();}}]],
      colinha:[[T("Escolher o estado","Choose the state"),function(){var i=$("ck-uf");if(i){rola(i);i.focus();}}],
               [T("Compartilhar no WhatsApp","Share on WhatsApp"),function(){var b=document.querySelector(".ck-bar .pri");if(b)b.click();}],
               [T("Imprimir a cola","Print the memo"),function(){window.print();}]],
      hub:colinhaOff()?[]:[[T("Montar a colinha da eleição","Build the election cheat sheet"),function(){vai("colinha");}]]
    };
    return A[k]||[];
  },
  gotIts:function(){
    /* os avisos recolhíveis ("Como ler", "Ressalvas", "Leia antes") da tela atual */
    var v=document.querySelector(".view.on");if(!v)return [];
    return [].filter.call(v.querySelectorAll("details.dob"),function(d){return d.offsetParent!==null||d.closest(".view.on");});
  },
  pInicio:function(c){
    var k=telaAtual(), v=TELAS[k];
    var o=mk("div","ao-onde");o.appendChild(mk("span","ao-pin","📍"));
    var d=mk("div");d.appendChild(mk("b",null,T("Você está em: ","You are in: ")+v.t));d.appendChild(mk("p",null,v.d));o.appendChild(d);c.appendChild(o);
    var at=this.atalhosDe(k);
    if(at.length){var a=mk("div","ao-atalhos");at.forEach(function(x){var b=mk("button",null,x[0]);b.type="button";b.addEventListener("click",function(){AO.fecha();depois(x[1],150);});a.appendChild(b);});c.appendChild(a);}
    var l=mk("div","ao-lista");
    var n=this.gotIts().length;
    l.appendChild(this.item("💡",T("Explicar os avisos desta tela","Explain the notices on this screen"),
      n?T("Os quadros \"Como ler\" e \"Ressalvas\", em português simples","The \"How to read\" and \"Caveats\" boxes, in plain words"):T("Esta tela não tem avisos recolhidos","This screen has no collapsed notices"),
      function(){AO.pinta("avisos");},n||null));
    l.appendChild(this.item("🔊",T("Ler esta tela em voz alta","Read this screen aloud"),T("Começa do topo; ■ para","Starts at the top; ■ stops"),function(){AO.fecha();depois(function(){AO.lerTela();},1);}));
    l.appendChild(this.item("🔍",T("Procurar algo","Search for something"),T("Telas, temas, candidatos, siglas, ajustes","Screens, topics, candidates, acronyms, settings"),function(){AO.pinta("busca");}));
    l.appendChild(this.item("🎛️",T("Ajustes rápidos","Quick settings"),T("Tema, texto maior, idioma, retratos","Theme, larger text, language, portraits"),function(){AO.pinta("ajustes");}));
    l.appendChild(this.item("📤",T("Compartilhar esta tela","Share this screen"),null,function(){AO.fecha();depois(function(){var b=$("share-b");if(b)Share.pagina(b);},100);}));
    l.appendChild(this.item("🧭",T("Tour rápido","Quick tour"),T("Onde fica cada coisa no site","Where everything is on the site"),function(){AO.pinta("tour");}));
    c.appendChild(l);
    var r=mk("div","ao-rodape");
    var a2=mk("button",null,T("Agora não","Not now"));a2.type="button";a2.addEventListener("click",function(){AO.fecha();});
    var d2=mk("button",null,T("Desligar o AssistONE","Turn AssistONE off"));d2.type="button";d2.addEventListener("click",function(){AO.desliga();});
    r.appendChild(a2);r.appendChild(d2);c.appendChild(r);
  },
  /* ---- narração: usa o mesmo leitor do ▶ dos títulos ---- */
  ler:function(escopo,titulo){
    var L=window.VozLeitor;
    if(!L){toast(T("A leitura em voz alta não carregou nesta página.","Read-aloud did not load on this page."));return;}
    L.para();
    L.alterna(this.ctl,function(){return escopo;},function(){return titulo||"";});
  },
  lerTela:function(){
    var v=document.querySelector(".view.on");if(!v)return;
    scrollTo({top:0,behavior:REDUZ()?"auto":"smooth"});
    this.ler(v,TELAS[telaAtual()].t);
  },
  /* ---- os "got-its": avisos recolhidos da tela ---- */
  resumoDe:function(d){
    /* o que o quadro diz, em uma linha: os títulos em negrito, ou a primeira frase */
    var bs=[].filter.call(d.querySelectorAll(".dob-c b, .dob-c strong"),function(b){
        var p=b.parentNode;return p&&/^(P|LI)$/.test(p.tagName)&&p.firstElementChild===b&&!(p.firstChild.nodeType===3&&p.firstChild.nodeValue.trim());})
      .map(function(b){return b.textContent.replace(/\s+/g," ").replace(/[.:]\s*$/,"").trim();})
      .filter(function(t,i,a){return t&&t.length>8&&t.length<120&&a.indexOf(t)===i;});
    if(bs.length)return bs.slice(0,4).join(" · ")+(bs.length>4?" · …":"");
    var t=(d.querySelector(".dob-c")||d).textContent.replace(/\s+/g," ").trim();
    var m=t.match(/^.{20,200}?[.!?](\s|$)/);return (m?m[0]:t.slice(0,180)+"…").trim();
  },
  pAvisos:function(c){
    this.volta(c);
    var ds=this.gotIts();
    var p=mk("p","ao-p");
    p.innerHTML=ds.length?T("Estes quadros ficam recolhidos para não atrapalhar a leitura, mas dizem <b>como ler os números sem se enganar</b>. Toque em um para abrir na tela, ou peça para eu ler.",
      "These boxes stay collapsed so they don't get in the way, but they say <b>how to read the numbers without being misled</b>. Tap one to open it on the screen, or ask me to read it.")
      :T("Esta tela não tem avisos recolhidos. Os avisos gerais do site estão na aba <b>Método</b>.","This screen has no collapsed notices. The site's general notices are in the <b>Method</b> tab.");
    c.appendChild(p);
    if(!ds.length){var b0=mk("button","ao-it");b0.type="button";b0.appendChild(mk("span","ao-ic","🔬"));b0.appendChild(mk("div",null,T("Abrir a aba Método","Open the Method tab")));b0.addEventListener("click",function(){AO.fecha();depois(function(){vai("metodo");},1);});c.appendChild(b0);return;}
    if(ds.length>1){var la=mk("div","ao-atalhos");
      var ba=mk("button",null,T("🔊 Ler todos em voz alta","🔊 Read them all aloud"));ba.type="button";
      ba.addEventListener("click",function(){ds.forEach(function(d){d.open=true;});AO.fecha();
        var w=mk("div");ds.forEach(function(d){var cl=d.cloneNode(true);cl.open=true;w.appendChild(cl);});
        /* o leitor lê um escopo só: um pacote com cópias dos quadros, sem mexer na tela */
        w.hidden=true;document.body.appendChild(w);AO.ler(w,T("Avisos desta tela","Notices on this screen"));
        setTimeout(function(){if(w.parentNode&&window.VozLeitor&&window.VozLeitor.escopo!==w)w.parentNode.removeChild(w);},4000);});
      la.appendChild(ba);
      var bb=mk("button",null,T("Abrir todos na tela","Open them all on the screen"));bb.type="button";
      bb.addEventListener("click",function(){ds.forEach(function(d){d.open=true;});AO.fecha();depois(function(){rola(ds[0]);},1);});
      la.appendChild(bb);c.appendChild(la);}
    ds.forEach(function(d){
      var sm=d.querySelector("summary"), tit=sm?sm.textContent.replace(/\s+/g," ").trim():T("Aviso","Notice");
      var w=mk("div","ao-aviso"+(d.classList.contains("rs")?" rs":""));
      w.appendChild(mk("span","ao-at",(d.classList.contains("rs")?"⚠️ ":"ℹ️ ")+tit));
      w.appendChild(mk("p",null,AO.resumoDe(d)));
      var aa=mk("div","ao-aa");
      var b1=mk("button",null,T("Abrir na tela","Open on the screen"));b1.type="button";b1.addEventListener("click",function(){d.open=true;AO.fecha();depois(function(){rola(d);},1);});
      var b2=mk("button",null,T("🔊 Ler para mim","🔊 Read it to me"));b2.type="button";b2.addEventListener("click",function(){d.open=true;AO.fecha();depois(function(){rola(d);AO.ler(d,tit);},1);});
      aa.appendChild(b1);aa.appendChild(b2);w.appendChild(aa);c.appendChild(w);});
  },
  /* ---- busca ---- */
  indice:function(){
    if(this._idx)return this._idx;
    var I=[], D=PG.D;
    Object.keys(TELAS).forEach(function(k){if(k==="colinha"&&colinhaOff())return;I.push({tipo:T("tela","screen"),t:TELAS[k].t,s:TELAS[k].sin+" "+TELAS[k].d,go:function(){vai(k);}});});
    (D.macrotemas||[]).forEach(function(m){I.push({tipo:T("macrotema","macro-topic"),t:m.nome,s:m.familia||"",go:function(){location.hash="#macrotemas/"+m.cod;}});});
    (D.candidatos||[]).forEach(function(cd){I.push({tipo:T("candidato","candidate"),t:cd.nome+" ("+cd.partido+")",s:cd.curto||"",go:function(){
      vai("historico");depois(function(){var b=[].filter.call(document.querySelectorAll("#gsel button"),function(x){return x.textContent.indexOf(cd.nome.split(" ")[0])>=0;})[0];if(b){b.click();rola("#hbox");}},400);}});});
    (window.__GLOS__||[]).forEach(function(g){I.push({tipo:T("glossário","glossary"),t:g.t,s:(g.d||"").slice(0,120),go:function(){
      vai("glossario");depois(function(){var i=$("gl-busca");if(i){i.value=g.t;i.dispatchEvent(new Event("input"));rola(i);}},300);}});});
    [[T("Tema claro ou escuro","Light or dark theme"),"tema escuro claro dark"],[T("Idioma PT-BR / EN-US","Language PT-BR / EN-US"),"idioma ingles portugues language"],
     [T("Leitura em voz alta (voz)","Read aloud (voice)"),"voz audio narrar ouvir tts"],[T("Tamanho do texto","Text size"),"fonte letra maior acessibilidade zoom"],
     [T("Cores e ordem dos candidatos","Candidate colours and order"),"cor partido ordem"],[T("Trilha sonora","Soundtrack"),"musica som"],
     [T("AssistONE (ligar/desligar)","AssistONE (on/off)"),"assistente ajuda clipe tutorial wizard ajudante"],[T("O que mudou (versões)","What changed (versions)"),"novidades versao historico"]]
      .forEach(function(o){I.push({tipo:T("ajuste","setting"),t:o[0],s:o[1],go:function(){PG.abreConfig();}});});
    this._idx=I;return I;
  },
  norm:function(t){return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");},
  lev:function(a,b){var m=a.length,n=b.length,p=[],i,j;for(j=0;j<=n;j++)p[j]=j;
    for(i=1;i<=m;i++){var pr=p[0];p[0]=i;for(j=1;j<=n;j++){var tmp=p[j];p[j]=Math.min(p[j]+1,p[j-1]+1,pr+(a[i-1]===b[j-1]?0:1));pr=tmp;}}return p[n];},
  busca:function(q){
    var self=this, nq=this.norm(q).trim();if(nq.length<2)return {r:[],sug:[]};
    var termos=nq.split(/\s+/), I=this.indice();
    var r=I.map(function(it){var h=self.norm(it.t+" "+it.s);var pts=0;
      termos.forEach(function(t){if(self.norm(it.t).indexOf(t)===0)pts+=3;else if(self.norm(it.t).indexOf(t)>=0)pts+=2;else if(h.indexOf(t)>=0)pts+=1;});
      return {it:it,p:pts};}).filter(function(x){return x.p>0;}).sort(function(a,b){return b.p-a.p;}).slice(0,12).map(function(x){return x.it;});
    var sug=[];
    if(!r.length){var pal={};I.forEach(function(it){self.norm(it.t).split(/[^a-z0-9]+/).forEach(function(w){if(w.length>3)pal[w]=1;});});
      sug=Object.keys(pal).map(function(w){return {w:w,d:self.lev(termos[0],w)};}).filter(function(x){return x.d<=Math.max(1,Math.floor(termos[0].length/3));})
        .sort(function(a,b){return a.d-b.d;}).slice(0,4).map(function(x){return x.w;});}
    return {r:r,sug:sug};
  },
  pBusca:function(c){
    this.volta(c);
    var w=mk("div","ao-busca");var i=mk("input");i.type="search";i.placeholder=T("Digite o que procura…","Type what you are looking for…");
    i.setAttribute("aria-label",T("Procurar no site","Search the site"));w.appendChild(i);c.appendChild(w);
    var res=mk("div","ao-res");c.appendChild(res);
    var dica=mk("p","ao-vazio",T("Exemplos: educação, Lula, IPCA, tema escuro, glossário.","Examples: education, Lula, IPCA, dark theme, glossary."));c.appendChild(dica);
    function pinta(){
      res.textContent="";var q=i.value;var o=AO.busca(q);
      dica.hidden=q.trim().length>=2;
      if(q.trim().length>=2&&!o.r.length){
        var v=mk("p","ao-vazio",T("Nada encontrado com esse nome.","Nothing found with that name."));res.appendChild(v);
        if(o.sug.length){var s=mk("p","ao-vazio");s.appendChild(document.createTextNode(T("Você quis dizer: ","Did you mean: ")));
          o.sug.forEach(function(sg,k){var b=mk("button",null,sg);b.type="button";b.style.cssText="font:inherit;color:var(--accent);background:none;border:0;padding:0 4px;cursor:pointer;text-decoration:underline";
            b.addEventListener("click",function(){i.value=sg;pinta();});s.appendChild(b);});res.appendChild(s);}
        var g=mk("button",null,T("Abrir o glossário","Open the glossary"));g.type="button";g.addEventListener("click",function(){AO.fecha();depois(function(){vai("glossario");},1);});res.appendChild(g);
        return;}
      o.r.forEach(function(it){var b=mk("button");b.type="button";b.appendChild(mk("span","ao-tipo",it.tipo));b.appendChild(mk("span","ao-tt",it.t));
        b.addEventListener("click",function(){AO.fecha();depois(it.go,120);});res.appendChild(b);});
    }
    i.addEventListener("input",pinta);
    i.addEventListener("keydown",function(e){if(e.key==="Enter"){var b=res.querySelector("button");if(b)b.click();}});
  },
  /* ---- ajustes rápidos ---- */
  pAjustes:function(c){
    this.volta(c);var p=prefs(), self=this;
    function chips(rot,ops,val,fn){c.appendChild(mk("div","ao-sec",rot));var w=mk("div","ao-chips");
      ops.forEach(function(o){var b=mk("button",null,o[1]);b.type="button";b.setAttribute("aria-pressed",val===o[0]?"true":"false");
        b.addEventListener("click",function(){fn(o[0]);self.pinta("ajustes");});w.appendChild(b);});c.appendChild(w);}
    chips(T("Tema","Theme"),[["sistema",T("Do sistema","System")],["claro",T("Claro","Light")],["escuro",T("Escuro","Dark")]],PG.temaAtual(),function(v){
      if(v==="sistema")delete p.tema;else p.tema=v;grava();PG.aplicaTema();});
    chips(T("Tamanho do texto","Text size"),[[0,"A"],[1,"A+"],[2,"A++"]],p.fonte||0,function(v){if(v)p.fonte=v;else delete p.fonte;grava();aplicaAcess();});
    chips(T("Movimento","Motion"),[[false,T("Normal","Normal")],[true,T("Reduzir animações","Reduce animations")]],p.calmo===true,function(v){if(v)p.calmo=true;else delete p.calmo;grava();aplicaAcess();});
    chips(T("Idioma","Language"),[["pt","PT-BR"],["en","EN-US"]],PG.IDIOMA,function(v){PG.vaiParaIdioma(v);});
    if(telaAtual()==="infograficos"){
      var est=ESTREITO();
      var vf=(p.fotos!==undefined)?!!p.fotos:!est, vm=(p.marcos!==undefined)?!!p.marcos:!est;
      chips(T("Retratos nos gráficos","Portraits on charts"),[[true,T("Mostrar","Show")],[false,T("Ocultar","Hide")]],vf,function(v){p.fotos=v;grava();PG.repintaIG();PG.escreveVer();});
      chips(T("Marcos de acontecimentos","Event markers"),[[true,T("Mostrar","Show")],[false,T("Ocultar","Hide")]],vm,function(v){p.marcos=v;grava();PG.repintaIG();PG.escreveVer();});
    }
    c.appendChild(mk("div","ao-sec",T("Mais","More")));
    var l=mk("div","ao-lista");
    l.appendChild(this.item("⚙️",T("Todas as configurações","All settings"),T("Voz, cores, ordem, trilha sonora, versão","Voice, colours, order, soundtrack, version"),function(){AO.fecha();PG.abreConfig();}));
    l.appendChild(this.item("🔊",T("Escolher a voz da leitura","Choose the reading voice"),null,function(){AO.fecha();PG.abreConfig();depois(function(){var s=$("tts-cfg");if(s)s.scrollIntoView({block:"start"});},200);}));
    c.appendChild(l);
  },
  /* ---- tour ---- */
  passos:function(){
    var P=[
      {sel:ESTREITO()?"#nav-h":".menu",t:T("As páginas do site","The site's pages"),d:ESTREITO()?T("O ☰ abre a lista das oito páginas, com uma linha dizendo o que há em cada uma. O nome ao lado mostra onde você está.","The ☰ opens the list of the eight pages, each with a line saying what is in it. The name beside it shows where you are.")
        :T("Oito páginas: Currículo e Infográficos (quem são e o contexto), Macrotemas e Índice (o que os planos dizem), Documentos, Método e Glossário (de onde tudo veio).","Eight pages: Candidates and Charts (who they are and the context), Macro-topics and Index (what the plans say), Documents, Method and Glossary (where it all comes from).")},
      {sel:"#share-b",t:T("Compartilhar","Share"),d:T("Manda o link desta tela pelo WhatsApp, Telegram, e-mail, ou copia o link. Cada gráfico também tem o próprio botão de compartilhar como imagem.","Sends this screen's link via WhatsApp, Telegram, e-mail, or copies it. Every chart also has its own share-as-image button.")},
      {sel:"#theme",t:T("Claro ou escuro","Light or dark"),d:T("Troca o tema. Nas Configurações dá para fixar um dos dois ou seguir o aparelho.","Switches the theme. In Settings you can fix one or follow the device.")},
      {sel:"#cfg-b",t:T("Configurações","Settings"),d:T("Idioma, tema, tamanho do texto, voz da leitura, cores dos candidatos, o que mudou em cada versão. Tudo fica só neste aparelho.","Language, theme, text size, reading voice, candidate colours, what changed in each version. Everything stays on this device.")},
      {sel:".tts-ctl",t:T("Ouvir em vez de ler","Listen instead of reading"),d:T("O ▶ ao lado dos títulos lê aquela seção em voz alta. Tocar de novo pausa; ■ para.","The ▶ beside headings reads that section aloud. Tap again to pause; ■ stops.")},
      {sel:"details.dob",t:T("Os avisos recolhidos","The collapsed notices"),d:T("Os quadros \"Como ler\" e \"Ressalvas\" ficam fechados para não atrapalhar. Eles dizem como não se enganar com os números. Eu explico cada um em \"Explicar os avisos desta tela\".","The \"How to read\" and \"Caveats\" boxes stay closed to keep out of the way. They say how not to be misled by the numbers. I explain each one under \"Explain the notices on this screen\".")},
      {sel:"#ao-btn",t:T("E eu fico aqui","And I stay here"),d:T("Toque em mim em qualquer tela para saber onde está, procurar algo, ouvir a tela ou mudar ajustes. Para me desligar: ⚙ Configurações → AssistONE.","Tap me on any screen to know where you are, search for something, listen to the screen or change settings. To turn me off: ⚙ Settings → AssistONE.")}
    ];
    return P.filter(function(s){var e=document.querySelector(s.sel);return e&&(e.offsetParent!==null||s.sel==="#ao-btn");});
  },
  pTour:function(c){
    var P=this.passos(), i=this.tourI, s=P[i];
    if(!s){this.tourSai();this.pinta("inicio");return;}
    this.tourFocoTira();
    var e=document.querySelector(s.sel);if(e){e.classList.add("ao-foco");this.tourFoco=e;
      if(s.sel!=="#ao-btn"&&!/^#(nav-h|share-b|theme|cfg-b)$|^\.menu$/.test(s.sel))e.scrollIntoView({behavior:REDUZ()?"auto":"smooth",block:"center"});}
    c.appendChild(mk("p","ao-passo",T("Passo ","Step ")+(i+1)+T(" de "," of ")+P.length));
    var p=mk("p","ao-p");p.appendChild(mk("b",null,s.t));p.appendChild(mk("br"));p.appendChild(document.createTextNode(s.d));c.appendChild(p);
    var a=mk("div","ao-tour-a");
    var n=mk("button","pri",i+1<P.length?T("Próximo ›","Next ›"):T("Concluir","Finish"));n.type="button";
    n.addEventListener("click",function(){AO.tourI++;AO.box.textContent="";var cc=mk("div","ao-c");AO.pTour(cc);if(AO.modo==="tour"){AO.box.appendChild(AO.cabeca(T("Tour rápido","Quick tour")));AO.box.appendChild(cc);n=AO.box.querySelector(".pri");if(n)try{n.focus({preventScroll:true});}catch(e){}}});
    var x=mk("button",null,T("Sair","Exit"));x.type="button";x.addEventListener("click",function(){AO.tourSai();AO.pinta("inicio");});
    a.appendChild(n);a.appendChild(x);c.appendChild(a);
  },
  tourFocoTira:function(){if(this.tourFoco){this.tourFoco.classList.remove("ao-foco");this.tourFoco=null;}},
  tourSai:function(silencio){this.tourFocoTira();this.tourI=0;if(this.modo==="tour")this.modo="inicio";var p=prefs();if(!p.aoTour){p.aoTour=true;grava();}},
  /* ---- dica por tela, uma vez ---- */
  agendaDica:function(){
    clearTimeout(this._dt);this.dica.hidden=true;
    if(!this.ligado)return;
    if(window.SolverRecursos&&SolverRecursos.valor("assistone.dicas",true)===false)return; /* dicas por tela desligadas no RootifyONE */
    var self=this;
    this._dt=setTimeout(function(){
      var p=prefs(), k=telaAtual();
      if(!p.aoVisto||!self.box.hidden||EJ.ocupada())return;
      p.aoDicas=p.aoDicas||{};if(p.aoDicas[k])return;
      var D={colinha:T("Toque numa vaga para escolher: dá para buscar por nome (sem acento), número ou partido. Na cabine não pode celular: imprima ou anote.",
        "Tap a slot to choose: you can search by name (no accents needed), number or party. No phones in the booth: print it or write it down."),
        inicio:T("O quadro Panorama é clicável: as setas ao lado de cada tema reordenam as colunas.","The Overview grid is clickable: the arrows beside each topic reorder the columns."),
        historico:T("Dá para pôr até oito candidaturas lado a lado em \"Comparar candidaturas\".","You can put up to eight candidacies side by side under \"Compare candidacies\"."),
        infograficos:T("Todo gráfico tem \"Compartilhar\": vira imagem pronta para o WhatsApp, com fonte e data.","Every chart has \"Share\": it becomes an image ready for WhatsApp, with source and date."),
        macrotemas:T("Cada cartão tem \"Copiar citação\": o trecho vai com a página e o link.","Each card has \"Copy quotation\": the passage goes with the page and the link."),
        score:T("A ordem que você escolhe muda o resultado. Trocar o Top 1 troca tudo.","The order you choose changes the result. Swapping the Top 1 swaps everything."),
        documentos:T("Os oito PDFs originais estão aqui para baixar, sem alteração.","The eight original PDFs are here to download, unchanged."),
        metodo:T("A tabela de viés é o teste que o estudo aplica em si mesmo.","The bias table is the test the study applies to itself."),
        glossario:T("O botão \"i\" espalhado pelo site abre estes mesmos verbetes.","The \"i\" button around the site opens these same entries.")}[k];
      if(!D)return;
      p.aoDicas[k]=1;grava();
      self.dica.textContent="";self.dica.appendChild(mk("span","ao-dk",T("Dica · ","Tip · ")+TELAS[k].t));
      self.dica.appendChild(document.createTextNode(D));
      var a=mk("div","ao-da");
      var b1=mk("button","pri",T("Entendi","Got it"));b1.type="button";b1.addEventListener("click",function(){self.dica.hidden=true;});
      var b2=mk("button",null,T("Mais ajuda","More help"));b2.type="button";b2.addEventListener("click",function(){self.dica.hidden=true;self.abre("inicio");});
      a.appendChild(b1);a.appendChild(b2);self.dica.appendChild(a);
      self.dica.hidden=false;
      setTimeout(function(){self.dica.hidden=true;},12000);
    },4500);
  },
  /* ---- primeira visita: espera a tela ficar livre (aviso de tela pequena etc.) ---- */
  primeira:function(){
    var p=prefs();if(p.aoVisto||!this.ligado)return;
    var self=this, n=0;
    (function tenta(){
      if(!self.ligado||prefs().aoVisto)return;
      if(EJ.ocupada()){if(n++<120)setTimeout(tenta,500);return;}
      self.abre("ola");
    })();
  }
};
/* cartão do AssistONE nas Configurações → logo abaixo do Tema */
window.CfgAssist=function(host){
  var el=PG.el;
  var s=el("div","oc-sec");s.appendChild(el("span","oc-rot","AssistONE"));
  var card=el("div","ao-card");var ic=el("span");ic.innerHTML=SVG_AO;card.appendChild(ic.firstChild);
  var d=el("div");d.appendChild(el("b",null,T("Assistente do site","Site assistant")));
  d.appendChild(el("small",null,T("Explica cada tela e os avisos, lê em voz alta, procura e muda ajustes. Fica no canto de baixo à direita.",
    "Explains each screen and its notices, reads aloud, searches and changes settings. Lives in the bottom-right corner.")));
  card.appendChild(d);
  if(admAO()){
    d.appendChild(el("small",null,T("Desligado pela administração da SolverONE.","Turned off by the SolverONE administration.")));
    s.appendChild(card);host.appendChild(s);return;
  }
  var ch=el("button","ao-chave");ch.type="button";ch.setAttribute("aria-pressed",AO.ligado?"true":"false");
  ch.appendChild(el("i"));ch.appendChild(document.createTextNode(AO.ligado?T("Ativado","On"):T("Desativado","Off")));
  ch.addEventListener("click",function(){AO.liga(!AO.ligado);PG.repintaConfig();});
  card.appendChild(ch);s.appendChild(card);
  var l=el("div","oc-linha");l.style.marginTop="8px";
  var b1=el("button","chip-cat",T("Abrir o AssistONE","Open AssistONE"));b1.type="button";
  b1.addEventListener("click",function(){EJ.fecha(document.getElementById("cfg"));AO.liga(true);depois(function(){AO.abre("inicio");},150);});
  var b2=el("button","chip-cat",T("Recomeçar o tour e as dicas","Restart the tour and tips"));b2.type="button";
  b2.addEventListener("click",function(){var p=prefs();delete p.aoVisto;delete p.aoDicas;delete p.aoTour;grava();AO.liga(true);
    EJ.fecha(document.getElementById("cfg"));depois(function(){AO.abre("ola");},150);});
  l.appendChild(b1);l.appendChild(b2);s.appendChild(l);
  host.appendChild(s);
};

/* ---------------- ligar tudo ---------------- */
function inicia(){
  PG=window.PG;if(!PG)return;
  aplicaAcess();
  montaShare();
  Gav.monta();
  AO.monta();
  AO.agendaDica();
  setTimeout(function(){AO.primeira();},1500);
  if(window.SolverRecursos)SolverRecursos.aoMudar(function(){try{
    if(admAO()&&AO.box&&!AO.box.hidden)AO.fecha();
    AO.monta();AO.agendaDica();
    var dg=document.getElementById("cfg");if(dg&&dg.__ej&&PG.repintaConfig)PG.repintaConfig();
  }catch(e){}});
}
if(window.PG)inicia();else addEventListener("pg-pronto",inicia);
if(document.readyState!=="loading"&&!window.PG){/* o script principal já rodou sem a ponte: nada a fazer */}
})();
