/* eleicoes/colinha.js: Colinha da eleição (bloco 9, v2.2)
   Movido como está do index.html 2.5.4 no F1-PR3 (31/10/2026): mesmo código, mesmos nomes; o que sai daqui para fora é só window.X (ver docs/modulos-contrato.md). */
/* =====================================================================
   v2.2: Colinha da eleição.
   - Dados: cola/<UF>.json e cola/BR.json (todas as candidaturas do TSE, geradas
     por congresso-sync.py). Foto: a do registro no TSE (DivulgaCandContas).
   - A cola fica só neste aparelho (planos2026:colinha) e pode ser editada depois.
   - A imagem para o WhatsApp é desenhada num <canvas>; foto só entra na imagem se
     o TSE permitir (CORS) — senão vão as iniciais, e o resto sai igual.
   - Na cabine não pode usar celular (Lei 9.504/97, art. 91-A): a página lembra disso.
   - v2.5.0: os cargos, as datas e o turno vêm do calendário (window.Calendario, no <head>). No 2º turno só aparecem os
     cargos e lugares que têm 2º turno, com os finalistas do TSE; há uma cola por turno (por["2026-1"], por["2026-2"]…) e a
     do turno anterior fica guardada como estava.
   ===================================================================== */
(function(){
"use strict";
var EN=/^en/i.test(document.documentElement.getAttribute("lang")||"")||/index-en\.html$/.test(location.pathname);
function T(pt,en){return EN?en:pt;}
function mk(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;}
function $(id){return document.getElementById(id);}
function le(k){try{return JSON.parse(localStorage.getItem(k)||"null");}catch(e){return null;}}
function grava(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function semAcento(s){return (s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();}
function matiz(s){var h=7;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))%360;return h;}
var KC="planos2026:colinha", KN="planos2026:novidade-colinha";
var UFN={AC:"Acre",AL:"Alagoas",AM:"Amazonas",AP:"Amapá",BA:"Bahia",CE:"Ceará",DF:"Distrito Federal",ES:"Espírito Santo",GO:"Goiás",
  MA:"Maranhão",MG:"Minas Gerais",MS:"Mato Grosso do Sul",MT:"Mato Grosso",PA:"Pará",PB:"Paraíba",PE:"Pernambuco",PI:"Piauí",PR:"Paraná",
  RJ:"Rio de Janeiro",RN:"Rio Grande do Norte",RO:"Rondônia",RR:"Roraima",RS:"Rio Grande do Sul",SC:"Santa Catarina",SE:"Sergipe",SP:"São Paulo",TO:"Tocantins"};
/* as vagas da cola, na ordem da urna, vêm do calendário do turno de agora. No 2º turno (e nos seguintes), cada vaga diz:
   semTurno (não há esse turno ali para o cargo), fin (os ids do TSE de quem está nele) ou incerto (o TSE não respondeu e
   não há lista manual nem cópia guardada: a vaga aparece com todos os candidatos e um aviso) */
function vagas(uf){var f=Calendario.fase();if(f==="pos")return [];
  return Calendario.vagas(f,uf).map(function(vg){
    if(f<2)return vg;
    var lugar=vg.lugar==="br"?"BR":uf;if(!lugar)return vg;   /* ainda sem estado: a vaga aparece e pede o estado */
    var o=Calendario.onde(vg.cg,f);
    if(!o.lista){vg.incerto=true;return vg;}
    if(o.lista.indexOf(lugar)<0){vg.semTurno=true;return vg;}
    vg.fin=Calendario.finalistas(vg.cg,lugar,f);if(!vg.fin)vg.incerto=true;
    return vg;});}
/* "Eleição 2026 · 2º turno · 25/Out" (imagem, impressão e texto) */
function cabeca(){var a=Calendario.ano(),c=Calendario.curto(Calendario.fase());return EN?a+" election · "+c:"Eleição "+a+" · "+c;}
/* foto oficial do TSE copiada para cola/fotos pelo congresso-sync.py (o site do TSE não deixa usá-la na imagem); c.uf = BR para presidente */
function foto(c){return "cola/fotos/"+c.uf+"/"+c[4]+".jpg";}
function fotoTSE(c){return "https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/img/20322002026/"+c[4]+"/"+c.uf;}
var SITE="https://solverone.com.br/radar-one/"+(/index-en/.test(location.pathname)?"index-en.html":"");

var CK={st:null,dados:{},pts:null,
  /* uma cola por turno: por[ano-turno][vaga] = [uf, id do TSE] (null = tirada de propósito). Até a 2.4.0 havia uma só (esc),
     a do 1º turno da eleição de fábrica: ela passa para por["<ano de fábrica>-1"] sem mudar nada */
  estado:function(){if(!this.st){var s=le(KC)||{};var cg=le("planos2026:congresso")||{};
    var por=s.por&&typeof s.por==="object"?s.por:{};if(s.esc&&!s.por)por[Calendario.padrao().ano+"-1"]=s.esc;
    this.st={uf:s.uf||cg.uf||"",por:por};}return this.st;},
  esc:function(){var p=this.estado().por,k=Calendario.chave(Calendario.fase());return p[k]||(p[k]={});},
  salva:function(){grava(KC,this.st);},
  pega:function(uf){var self=this;if(this.dados[uf])return Promise.resolve(this.dados[uf]);
    return fetch("cola/"+uf+".json").then(function(r){if(!r.ok)throw 0;return r.json();}).then(function(d){d.c.forEach(function(c){c.uf=uf;});self.dados[uf]=d;return d;});},
  partidos:function(){var self=this;if(this.pts)return Promise.resolve(this.pts);
    return fetch("cola/partidos.json").then(function(r){return r.ok?r.json():{};}).catch(function(){return {};}).then(function(p){self.pts=p;return p;});},
  /* candidato de uma vaga: o escolhido neste turno ou, sem escolha ainda, o do turno anterior (mesmo estado). Fora dos
     finalistas, vira {fora}: a tela diz "não está no 2º turno" e pede para escolher de novo; a cola anterior não muda */
  escolha:function(vg){var s=this.estado(),f=Calendario.fase(),e=this.esc()[vg.k];
    for(var n=f-1;e===undefined&&n>=1;n--){var x=(s.por[Calendario.chave(n)]||{})[vg.k];if(x)e=vg.lugar==="br"||x[0]===s.uf?x:null;}
    var c=e?this.acha(e):null;if(!c)return {c:null};
    return vg.fin&&vg.fin.indexOf(c[4])<0?{c:null,fora:c}:{c:c};},
  /* [uf, id do TSE] → o candidato na lista carregada */
  acha:function(e){var d=this.dados[e[0]];if(!d)return null;
    for(var i=0;i<d.c.length;i++)if(d.c[i][4]===e[1])return d.c[i];return null;},
  avatar:function(c,peq){var a=mk("span","ck-av"+(peq?" p":""));a.style.setProperty("--h",matiz(c[2]));
    a.appendChild(document.createTextNode(c[2].split(/\s+/).filter(Boolean).map(function(w){return w[0];}).slice(0,2).join("")));
    var im=mk("img");im.alt="";im.loading="lazy";im.referrerPolicy="no-referrer";im.src=foto(c);im.addEventListener("error",function(){if(im.dataset.t)im.remove();else{im.dataset.t=1;im.src=fotoTSE(c);}});a.appendChild(im);return a;},
  partido:function(sig){var p=mk("span","ck-pt");p.style.setProperty("--h",matiz(sig));var n=(this.pts||{})[sig];if(n)p.appendChild(mk("i",null,n));
    p.appendChild(document.createTextNode(sig));return p;},
  digitos:function(num,d){var w=mk("span","ck-num");w.setAttribute("aria-label",T("número ","number ")+num.split("").join(" "));
    for(var i=0;i<d;i++){var x=mk("span",null,num.charAt(i)||"");x.setAttribute("aria-hidden","true");w.appendChild(x);}return w;},

  /* ---------- a tela ---------- */
  pinta:function(){var v=$("v-colinha");if(!v)return;var self=this,s=this.estado();
    Promise.all([this.partidos(),s.uf?this.pega(s.uf).catch(function(){return null;}):null,this.pega("BR").catch(function(){return null;})]).then(function(){
      /* 2º turno: confere no TSE quem está nele (no máximo 1 vez por hora); a tela abre na hora, com a cópia guardada */
      var p=Calendario.consultar(s.uf);self.desenha(v);
      p.then(function(mudou){if((mudou||self.incerto)&&document.documentElement.hasAttribute("data-ck"))self.desenha(v);});});},
  desenha:function(v){var self=this,s=this.estado(),f=Calendario.fase(),vs=vagas(s.uf);v.textContent="";
    var w=mk("section","wrap ck");v.appendChild(w);
    w.appendChild(mk("div","eyebrow",(EN?Calendario.ano()+" election · ":"Eleição "+Calendario.ano()+" · ")+Calendario.rotulo(f)));
    var h=mk("header");h.appendChild(mk("h1",null,"🗳️ "+T("Colinha da eleição","Election cheat sheet")));
    h.appendChild(mk("p","lede",T("Os números que você vai digitar na urna, na ordem da urna, com foto. Fica só no seu celular e dá para mudar quando quiser.",
      "The numbers you will type at the ballot box, in ballot order, with photos. It stays only on your phone and you can change it any time.")));w.appendChild(h);
    var u=mk("div","ck-uf");var lb=mk("label",null,T("Onde você vota","Where you vote"));lb.setAttribute("for","ck-uf");var sel=mk("select");sel.id="ck-uf";
    sel.appendChild(mk("option",null,T("Escolha o estado…","Choose the state…"))).value="";
    Object.keys(UFN).sort(function(a,b){return UFN[a].localeCompare(UFN[b]);}).forEach(function(k){var o=mk("option",null,UFN[k]);o.value=k;sel.appendChild(o);});
    sel.value=s.uf;sel.addEventListener("change",function(){
      var mudou=s.uf&&s.uf!==sel.value;s.uf=sel.value;
      /* outro estado: o que vale para o país inteiro (presidente) fica; a cola dos turnos anteriores não muda */
      if(mudou){var E=self.esc(),cs=Calendario.cfg().cargos;Object.keys(E).forEach(function(k){var d=cs[k.replace(/\d+$/,"")];if(!(d&&d.lugar==="br"))delete E[k];});}
      self.salva();self.pinta();});
    u.appendChild(lb);u.appendChild(sel);w.appendChild(u);
    var al=mk("div","ck-alerta");al.appendChild(mk("b",null,T("Na cabine não pode usar celular. ","No phones in the voting booth. ")));
    al.appendChild(document.createTextNode(T("Leve a cola impressa ou anotada em papel (Lei 9.504/97, art. 91-A). Mostrar a imagem para alguém antes de entrar pode.",
      "Bring the list printed or written on paper (Law 9,504/97, art. 91-A). Showing the image to someone before going in is fine.")));w.appendChild(al);
    if(!s.uf){w.appendChild(mk("p",null,T("Escolha o estado para começar.","Choose the state to start.")));}
    /* 2º turno: onde não há, diz; sem resposta do TSE (nem lista manual nem cópia), avisa e mostra todos os candidatos */
    self.incerto=vs.some(function(vg){return vg.incerto;});
    if(self.incerto)w.appendChild(mk("p","ck-aviso",Calendario.consultando()?T("Conferindo no TSE quem está no "+f+"º turno…","Checking with the electoral court who is in round "+f+"…"):
      T("Não consegui confirmar no TSE quem está no "+f+"º turno. Confira na urna.","Could not confirm with the electoral court who is in round "+f+". Check at the ballot box.")));
    vs.forEach(function(vg){if(!vg.semTurno)return;var nm=vg.t.toLowerCase();
      w.appendChild(mk("p","ck-nota",vg.lugar==="br"?T("Não há "+f+"º turno para "+nm+".","There is no round "+f+" for "+nm+"."):
        T("Em "+UFN[s.uf]+" não há "+f+"º turno para "+nm+".","There is no round "+f+" for "+nm+" in "+UFN[s.uf]+".")));});
    var lista=mk("div","ck-lista");w.appendChild(lista);
    vs.forEach(function(vg){if(vg.semTurno)return;
      var r=self.escolha(vg),c=r.c,sl=mk("div","ck-slot"+(c?"":" vazio"));sl.dataset.vaga=vg.k;
      if(c){sl.appendChild(self.avatar(c));var m=mk("div","ck-mid");m.appendChild(mk("div","ck-cg",vg.t));m.appendChild(mk("b",null,c[2]));m.appendChild(self.partido(c[3]));sl.appendChild(m);
        sl.appendChild(self.digitos(c[1],vg.d));
        var ac=mk("div","ck-acao");var tr=mk("button",null,"✎");tr.type="button";tr.setAttribute("aria-label",T("Trocar ","Change ")+vg.t);tr.addEventListener("click",function(){self.escolhe(vg);});
        var rm=mk("button",null,"✕");rm.type="button";rm.setAttribute("aria-label",T("Tirar ","Remove ")+vg.t);rm.addEventListener("click",function(){self.esc()[vg.k]=null;self.salva();self.desenha(v);});
        ac.appendChild(tr);ac.appendChild(rm);sl.appendChild(ac);}
      else{var m2=mk("div","ck-mid");m2.appendChild(mk("div","ck-cg",vg.t+" · "+vg.d+T(" dígitos"," digits")));
        if(r.fora)m2.appendChild(mk("p","ck-fora",T(r.fora[2]+" não está no "+f+"º turno. Escolha de novo.",r.fora[2]+" is not in round "+f+". Please choose again.")));
        var ad=mk("button","ck-add","+ "+T("Escolher","Choose"));ad.type="button";m2.appendChild(ad);sl.appendChild(m2);
        sl.appendChild(self.digitos("",vg.d));
        sl.setAttribute("role","button");sl.tabIndex=0;sl.setAttribute("aria-label",T("Escolher ","Choose ")+vg.t);
        var abre=function(){if(!s.uf&&vg.lugar!=="br"){sel.focus();return;}self.escolhe(vg);};
        sl.addEventListener("click",abre);sl.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();abre();}});}
      lista.appendChild(sl);});
    /* trazer da cola do Congresso (favoritos): só no turno que tem senador ou deputado federal, que ela preenche na ordem */
    var cg=le("planos2026:congresso");var mini=mk("div","ck-mini");
    var vS=vs.filter(function(x){return x.cg==="S"&&!x.semTurno;}),vF=vs.filter(function(x){return x.cg==="F"&&!x.semTurno;});
    if(cg&&cg.cola&&((vS.length&&(cg.cola.S||[]).length)||(vF.length&&(cg.cola.F||[]).length))){var bi=mk("button",null,"⚖️ "+T("Trazer a cola do Congresso","Bring in the Congress memo"));bi.type="button";
      bi.addEventListener("click",function(){var E=self.esc(),ps=[];(cg.cola.S||[]).slice(0,vS.length).forEach(function(r,i){var p=r.split("/");E[vS[i].k]=[p[0],p[1]];ps.push(p[0]);});
        (cg.cola.F||[]).slice(0,vF.length).forEach(function(r,i){var p=r.split("/");E[vF[i].k]=[p[0],p[1]];ps.push(p[0]);});if(!s.uf&&ps[0])s.uf=ps[0];self.salva();self.pinta();});mini.appendChild(bi);}
    /* apaga só a cola deste turno (a do turno anterior fica guardada) */
    var lp=mk("button",null,"🧹 "+T("Começar de novo","Start over"));lp.type="button";lp.addEventListener("click",function(){EJ.confirma(T("Apagar a cola inteira?","Clear the whole memo?"),T("Apagar","Clear"),function(){var E=self.esc();vs.forEach(function(x){E[x.k]=null;});self.salva();self.desenha(v);});});
    mini.appendChild(lp);w.appendChild(mini);
    /* ações */
    var bar=mk("div","ck-bar");
    var b1=mk("button","pri","📤 "+T("Compartilhar","Share"));b1.type="button";b1.addEventListener("click",function(){self.compartilha(b1);});
    var b2=mk("button","ck-ic");b2.appendChild(document.createTextNode("💬"));b2.appendChild(mk("span","ck-t"," "+T("Texto","Text")));b2.type="button";b2.title=b2.ariaLabel=T("Mandar em texto","Send as text");b2.addEventListener("click",function(){self.texto();});
    var b3=mk("button","ck-ic");b3.appendChild(document.createTextNode("🖨"));b3.appendChild(mk("span","ck-t"," "+T("Imprimir","Print")));b3.type="button";b3.title=b3.ariaLabel=T("Imprimir","Print");b3.addEventListener("click",function(){self.perguntaImpressao();});
    bar.appendChild(b1);bar.appendChild(b2);bar.appendChild(b3);w.appendChild(bar);
    w.appendChild(mk("p","ck-cont",T("Fonte: candidaturas registradas no TSE (dados abertos). Confira sempre o número na urna: ela mostra a foto e o nome antes de você confirmar.",
      "Source: candidacies registered with the electoral court (open data). Always check the number at the ballot box: it shows the photo and name before you confirm.")+
      (f>=2?T(" Quem está no "+f+"º turno: resultados oficiais do TSE."," Who is in round "+f+": the electoral court's official results."):"")));
  },

  /* ---------- escolher um candidato (folha que sobe) ---------- */
  escolhe:function(vg){var self=this,s=this.estado(),uf=vg.lugar==="br"?"BR":s.uf;
    var dl=$("ck-dlg");if(!dl){dl=mk("div","ck-dlg");dl.id="ck-dlg";dl.hidden=true;document.body.appendChild(dl);}
    dl.textContent="";var inn=mk("div","in");dl.appendChild(inn);
    var hd=mk("div","hd");var tt=mk("div","tt");tt.appendChild(mk("h2",null,T("Escolher: ","Choose: ")+vg.t));
    var x=mk("button","x","×");x.type="button";x.setAttribute("aria-label",T("Fechar","Close"));x.addEventListener("click",function(){EJ.fecha(dl);});tt.appendChild(x);hd.appendChild(tt);
    var q=mk("input");q.type="search";q.placeholder=T("Nome, número ou partido","Name, number or party");q.setAttribute("aria-label",q.placeholder);q.setAttribute("enterkeyhint","search");hd.appendChild(q);
    var chips=mk("div","ck-chips");chips.setAttribute("aria-label",T("Filtrar por partido","Filter by party"));hd.appendChild(chips);
    var ct=mk("div","ck-cont");hd.appendChild(ct);inn.appendChild(hd);
    var res=mk("div","ck-res");inn.appendChild(res);
    EJ.abre(dl,{temTexto:false,focar:matchMedia("(pointer:fine)").matches?q:null});
    var filtroP="",mostra=60;
    this.pega(uf).then(function(d){
      var L=d.c.filter(function(c){return c[0]===vg.cg;}),incerto=!!vg.incerto;
      /* 2º turno: só os finalistas do TSE (se nenhum bater com a lista daqui, mostra todos, com o aviso) */
      if(vg.fin){var F=L.filter(function(c){return vg.fin.indexOf(c[4])>=0;});if(F.length)L=F;else incerto=true;}
      if(incerto)inn.insertBefore(mk("p","ck-aviso",T("Não consegui confirmar no TSE quem está no "+Calendario.fase()+"º turno: aparecem todos. Confira na urna.",
        "Could not confirm with the electoral court who is in round "+Calendario.fase()+": everyone is listed. Check at the ballot box.")),res);
      var cont={};L.forEach(function(c){cont[c[3]]=(cont[c[3]]||0)+1;});
      var todos=mk("button",null,T("Todos","All")+" ("+L.length+")");todos.type="button";todos.setAttribute("aria-pressed","true");chips.appendChild(todos);
      Object.keys(cont).sort().forEach(function(p){var b=mk("button",null,((self.pts||{})[p]?self.pts[p]+" · ":"")+p+" ("+cont[p]+")");b.type="button";b.dataset.p=p;b.setAttribute("aria-pressed","false");chips.appendChild(b);});
      chips.addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;filtroP=b.dataset.p||"";
        [].forEach.call(chips.children,function(x){x.setAttribute("aria-pressed",String(x===b));});mostra=60;lista();});
      /* quem já está na outra vaga do mesmo cargo (o outro voto de senador) não aparece de novo */
      var outras=vagas(s.uf).filter(function(x){return x.cg===vg.cg&&x.k!==vg.k;}).map(function(x){return self.escolha(x).c;}).filter(Boolean).map(function(c){return c[4];});
      function lista(){var t=semAcento(q.value.trim()),dig=/^\d+$/.test(t);
        var R=L.filter(function(c){if(outras.indexOf(c[4])>=0)return false;if(filtroP&&c[3]!==filtroP)return false;if(!t)return true;
          return dig?c[1].indexOf(t)===0:(semAcento(c[2]).indexOf(t)>=0||semAcento(c[3])===t);});
        res.textContent="";ct.textContent=R.length+" "+T("candidatura(s)","candidacy(ies)")+(uf!=="BR"?" · "+UFN[uf]:"");
        if(!R.length){res.appendChild(mk("p","ck-cont",T("Ninguém com esse nome, número ou partido. Tente só uma parte do nome.","Nobody with that name, number or party. Try just part of the name.")));return;}
        R.slice(0,mostra).forEach(function(c){var it=mk("button","ck-it");it.type="button";it.appendChild(self.avatar(c,true));
          var nm=mk("span","nm");nm.appendChild(mk("b",null,c[2]));nm.appendChild(self.partido(c[3]));it.appendChild(nm);it.appendChild(mk("span","nb",c[1]));
          it.addEventListener("click",function(){self.esc()[vg.k]=[uf,c[4]];self.salva();EJ.fecha(dl);self.desenha($("v-colinha"));});res.appendChild(it);});
        if(R.length>mostra){var mb=mk("button","ck-mais",T("Mostrar mais ","Show more ")+"("+(R.length-mostra)+")");mb.type="button";mb.addEventListener("click",function(){mostra+=80;lista();});res.appendChild(mb);}}
      q.addEventListener("input",function(){mostra=60;lista();});lista();
    },function(){res.appendChild(mk("p","ck-cont",T("Não consegui carregar a lista agora. Confira a internet e tente de novo.","Could not load the list now. Check the connection and try again.")));});
  },

  /* ---------- impressão: a mesma cola nos 4 quadrantes da folha, em preto e branco legível ---------- */
  /* pergunta 1 ou 4 cópias; com 1, a cola fica no canto da folha (1/4), do mesmo tamanho */
  perguntaImpressao:function(){var self=this,d=mk("div","ck-nov");
    var tp=mk("div","tp");var h=mk("h2",null,"🖨 "+T("Imprimir a colinha","Print the cheat sheet"));h.id="ck-imp-t";tp.appendChild(h);d.appendChild(tp);
    d.appendChild(mk("p",null,T("Cada cola ocupa 1/4 da folha, em fundo branco. Quantas quer na mesma folha? Com 4, é só recortar e dar para quem vai votar com você.",
      "Each sheet takes 1/4 of the page, on a white background. How many on the same page? With 4, just cut them out and hand them to whoever votes with you.")));
    var bt=mk("div","bt");
    [[1,T("1 cola","1 sheet"),""],[4,T("4 colas na folha","4 on the page"),"pri"]].forEach(function(o){var b=mk("button",o[2]||null,o[1]);b.type="button";
      b.addEventListener("click",function(){EJ.fecha(d);self.impressao(o[0]);self.fotosProntas().then(function(){window.print();});});bt.appendChild(b);});
    var cn=mk("button","cancela",T("Cancelar","Cancel"));cn.type="button";cn.addEventListener("click",function(){EJ.fecha(d);});bt.appendChild(cn);
    d.appendChild(bt);
    EJ.abre(d,{descarta:true});},
  impressao:function(n){n=n||this.copias||4;this.copias=n;var self=this,s=this.estado(),L=this.linhas(),box=$("ck-print");
    if(!box){box=mk("div");box.id="ck-print";box.setAttribute("aria-hidden","true");document.body.appendChild(box);}
    box.textContent="";
    for(var q=0;q<n;q++){var d=mk("div","q");
      var h=mk("div","h","🗳️ "+T("Minha colinha","My cheat sheet"));
      h.appendChild(mk("small",null,cabeca()+(s.uf?" · "+UFN[s.uf]:"")+" · "+T("na ordem da urna","in ballot order")));d.appendChild(h);
      L.forEach(function(l){var r=mk("div","r"),f=mk("span","f");
        if(l.c){var im=mk("img");im.alt="";im.src=foto(l.c);im.addEventListener("error",function(){im.remove();f.textContent=l.c[2].split(/\s+/).map(function(w){return w[0];}).slice(0,2).join("");});f.appendChild(im);}
        r.appendChild(f);var m=mk("span","m");m.appendChild(mk("span","cg",l.vg.t));
        m.appendChild(mk("span","nm",l.c?l.c[2]:"________________"));
        if(l.c)m.appendChild(mk("span","pt",((self.pts||{})[l.c[3]]?self.pts[l.c[3]]+" · ":"")+l.c[3]));r.appendChild(m);
        var n=mk("span","n");for(var k=0;k<l.vg.d;k++)n.appendChild(mk("span",null,l.c?l.c[1].charAt(k):""));r.appendChild(n);d.appendChild(r);});
      d.appendChild(mk("div","ft",T("Confira o nome e a foto na urna antes de confirmar.","Check the name and photo on the machine before confirming.")+" solverone.com.br/radar-one"));
      box.appendChild(d);}
  },

  /* espera as fotos da folha carregarem (no máximo 2,5 s) antes de abrir a impressão */
  fotosProntas:function(){var ims=[].slice.call(document.querySelectorAll("#ck-print img"));
    return Promise.race([Promise.all(ims.map(function(i){return i.complete?0:new Promise(function(ok){i.onload=i.onerror=ok;});})),new Promise(function(ok){setTimeout(ok,2500);})]);},

  /* ---------- texto e imagem ---------- */
  linhas:function(){var self=this,s=this.estado();return vagas(s.uf).filter(function(vg){return !vg.semTurno;}).map(function(vg){return {vg:vg,c:self.escolha(vg).c};});},
  texto:function(){var s=this.estado(),t="🗳️ "+T("Minha colinha","My cheat sheet")+" · "+cabeca()+(s.uf?" · "+UFN[s.uf]:"")+"\n\n";
    this.linhas().forEach(function(l){t+=l.vg.t+": "+(l.c?l.c[1]+" — "+l.c[2]+" ("+l.c[3]+")":"—")+"\n";});
    t+="\n"+T("Na cabine não pode celular: leve no papel.","No phones in the booth: bring it on paper.")+"\n\n"+T("Monte a sua também:","Build yours too:")+" "+SITE+"#colinha";
    window.open("https://wa.me/?text="+encodeURIComponent(t),"_blank","noopener");},
  /* foto para a imagem: só entra se o servidor do TSE permitir (senão o canvas não exporta) */
  img:function(url){return new Promise(function(ok){var i=new Image();i.crossOrigin="anonymous";i.referrerPolicy="no-referrer";
    var t=setTimeout(function(){ok(null);},6000);i.onload=function(){clearTimeout(t);ok(i);};i.onerror=function(){clearTimeout(t);ok(null);};i.src=url;});},
  desenhaImagem:function(){var self=this,s=this.estado(),L=this.linhas();
    return Promise.all(L.map(function(l){return l.c?self.img(foto(l.c)):Promise.resolve(null);})).then(function(fotos){
      var W=1080,LH=230,H=330+L.length*LH+210,cv=document.createElement("canvas");cv.width=W;cv.height=H;var g=cv.getContext("2d");
      var FF="'Public Sans','Helvetica Neue',Arial,sans-serif",FM="'IBM Plex Mono',ui-monospace,Menlo,monospace";
      function rr(x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
      g.fillStyle="#F3F6F5";g.fillRect(0,0,W,H);
      var gr=g.createLinearGradient(0,0,W,260);gr.addColorStop(0,"#0C5E57");gr.addColorStop(1,"#1FA855");g.fillStyle=gr;g.fillRect(0,0,W,280);
      g.fillStyle="#fff";g.font="700 64px "+FF;g.fillText("🗳️ "+T("Minha colinha","My cheat sheet"),60,120);
      g.font="500 34px "+FF;g.fillText(cabeca()+(s.uf?" · "+UFN[s.uf]:""),60,180);
      g.font="400 26px "+FF;g.globalAlpha=.9;g.fillText(T("Na ordem da urna","In ballot order"),60,228);g.globalAlpha=1;
      L.forEach(function(l,i){var y=310+i*LH;g.fillStyle="#fff";rr(40,y,W-80,LH-20,28);g.fill();g.strokeStyle="#DAE3E1";g.lineWidth=2;g.stroke();
        g.fillStyle="#647674";g.font="600 24px "+FM;g.fillText(l.vg.t.toUpperCase(),80,y+46);
        var cx=150,cy=y+130,R=58;
        if(l.c){g.save();g.beginPath();g.arc(cx,cy,R,0,Math.PI*2);g.closePath();g.fillStyle="hsl("+matiz(l.c[2])+",35%,40%)";g.fill();g.clip();
          if(fotos[i]){var im=fotos[i],sc=Math.max(2*R/im.width,2*R/im.height);g.drawImage(im,cx-im.width*sc/2,cy-im.height*sc/2,im.width*sc,im.height*sc);}
          else{g.fillStyle="#fff";g.font="700 40px "+FF;g.textAlign="center";g.fillText(l.c[2].split(/\s+/).map(function(w){return w[0];}).slice(0,2).join(""),cx,cy+14);g.textAlign="left";}
          g.restore();
          g.fillStyle="#111D1B";g.font="700 38px "+FF;var nome=l.c[2];while(g.measureText(nome).width>470&&nome.length>4)nome=nome.slice(0,-2);
          if(nome!==l.c[2])nome=nome.replace(/\s*\S?$/,"")+"…";g.fillText(nome,240,cy-6);
          var pt=((self.pts||{})[l.c[3]]?self.pts[l.c[3]]+" · ":"")+l.c[3];g.font="700 26px "+FF;var pw=g.measureText(pt).width+36;
          g.fillStyle="hsl("+matiz(l.c[3])+",45%,36%)";rr(240,cy+18,pw,44,22);g.fill();g.fillStyle="#fff";g.fillText(pt,258,cy+49);}
        else{g.fillStyle="#C0CECB";g.font="500 32px "+FF;g.fillText(T("não escolhido","not chosen"),240,cy+10);}
        var bw=62,gap=10,tot=l.vg.d*bw+(l.vg.d-1)*gap,bx=W-80-tot;
        for(var k=0;k<l.vg.d;k++){var x=bx+k*(bw+gap);g.fillStyle="#fff";rr(x,cy-44,bw,88,12);g.fill();g.strokeStyle="#111D1B";g.lineWidth=4;g.stroke();
          var d=l.c?l.c[1].charAt(k):"";if(d){g.fillStyle="#111D1B";g.font="700 54px "+FM;g.textAlign="center";g.fillText(d,x+bw/2,cy+19);g.textAlign="left";}}});
      var fy=310+L.length*LH+20;g.fillStyle="#7A4A12";g.font="600 28px "+FF;
      g.fillText(T("Na cabine não pode celular: leve no papel.","No phones in the booth: bring it on paper."),60,fy+30);
      g.fillStyle="#647674";g.font="400 24px "+FF;g.fillText(T("Confira o nome e a foto na urna antes de confirmar.","Check the name and photo on the machine before confirming."),60,fy+76);
      g.fillText("solverone.com.br/radar-one · "+T("dados e fotos do TSE","electoral court data and photos"),60,fy+122);
      return new Promise(function(ok){cv.toBlob(function(b){ok(b);},"image/png");});});},
  compartilha:function(bt){var self=this,txt=bt.textContent;bt.disabled=true;bt.textContent=T("Montando a imagem…","Building the image…");
    this.desenhaImagem().then(function(blob){bt.disabled=false;bt.textContent=txt;if(!blob)return;
      var nome="colinha-eleicao-"+Calendario.ano()+".png",arq=new File([blob],nome,{type:"image/png"});
      /* celular: abre a janela de compartilhar do aparelho (WhatsApp aparece ali); senão, baixa a imagem */
      if(navigator.canShare&&navigator.canShare({files:[arq]})){
        navigator.share({files:[arq],title:T("Minha colinha","My cheat sheet"),text:T("Minha colinha da eleição "+Calendario.ano()+". Monte a sua também:","My "+Calendario.ano()+" election cheat sheet. Build yours too:")+" "+SITE+"#colinha"}).catch(function(){});}
      else{var a=mk("a");a.href=URL.createObjectURL(blob);a.download=nome;document.body.appendChild(a);a.click();
        setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},4000);
        EJ.aviso(T("A imagem foi baixada. No WhatsApp, anexe a imagem \""+nome+"\".","The image was downloaded. In WhatsApp, attach \""+nome+"\"."));}
    },function(){bt.disabled=false;bt.textContent=txt;});}
};

/* ---------------- aviso de NOVIDADE (uma vez por aparelho) ---------------- */
function novidade(){
  if(le(KN)||(location.hash||"")==="#colinha"||colinhaOff())return;
  var tentativas=0;
  (function tenta(){
    /* não abre por cima de outro aviso (ex.: o de tela pequena) */
    if(EJ.ocupada()){if(++tentativas<30)setTimeout(tenta,1500);return;}
    if(colinhaOff())return;
    var d=mk("div","ck-nov");
    var tp=mk("div","tp");tp.appendChild(mk("small",null,T("NOVIDADE!","NEW!")));var h=mk("h2",null,"🗳️ "+T("Colinha da eleição","Election cheat sheet"));h.id="ck-nov-t";tp.appendChild(h);d.appendChild(tp);
    d.appendChild(mk("p",null,T("Monte em um minuto a sua cola com os números de cada cargo, na ordem da urna e com a foto de cada candidato. Depois é só mandar no WhatsApp ou imprimir. Fica só no seu celular.",
      "Build your list in a minute with the number for each office, in ballot order and with each candidate's photo. Then just send it on WhatsApp or print it. It stays only on your phone.")));
    var bt=mk("div","bt");var no=mk("button",null,T("Agora não","Not now"));no.type="button";var yes=mk("button","pri",T("Montar minha colinha","Build my cheat sheet"));yes.type="button";
    no.addEventListener("click",function(){EJ.fecha(d);});yes.addEventListener("click",function(){EJ.fecha(d);EJ.quando(function(){location.hash="#colinha";});});
    bt.appendChild(no);bt.appendChild(yes);d.appendChild(bt);
    EJ.abre(d,{descarta:true,aoFechar:function(){grava(KN,1);}});
  })();
}

function aplica(){var ck=(location.hash||"").split("/")[0]==="#colinha";if(ck&&colinhaOff()){location.replace("#hub");return;}document.documentElement.toggleAttribute("data-ck",ck);if(ck)CK.pinta();}
function inicia(){aplica();addEventListener("hashchange",aplica);addEventListener("beforeprint",function(){if(document.documentElement.hasAttribute("data-ck"))CK.impressao();});setTimeout(novidade,1800);
  /* chegou arquivo do RootifyONE (interruptor ou calendário) ou a fase mudou pela data: volta ao início ou redesenha */
  Calendario.aoMudar(aplica);}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",inicia);else inicia();
window.Colinha=CK;
})();
