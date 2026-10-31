/* calendario.js: calendário eleitoral (bloco 1) e colinhaOff (bloco 2)
   Movido como está do index.html 2.5.4 no F1-PR3 (31/10/2026): mesmo código, mesmos nomes; o que sai daqui para fora é só window.X (ver docs/modulos-contrato.md). */
/* Calendário eleitoral (v2.5.0): UM só para o site inteiro. A Colinha, a tela de Início e a aba Mandato da Presidência leem
   daqui as datas, os turnos e os cargos. PADRAO é o valor de fábrica (eleição de 2026). O RootifyONE muda tudo sem mexer no
   código, pelo comportamento "eleicao.calendario" (Controle dos apps → Eleições 2026 → Comportamentos, tipo JSON): cada campo
   que vier de lá vence o de fábrica.
     ano           ano da eleição (textos e nome da imagem da cola)
     fase          "auto" = pela data, no horário de Brasília; "1", "2"… força aquele turno; "pos" força o pós-eleição
     tse           só a chave do ano no TSE ("ele2026"); as eleições de cada turno e cargo o app descobre no ele-c.json do TSE
     turnos        em ordem de data: o dia (AAAA-MM-DD) e os cargos na ordem da urna; cargo repetido = mais de um voto
                   (2 senadores em 2026)
     segundoTurno  lista manual de onde há 2º turno, POR CARGO e POR LUGAR; quando um cargo está aqui, ela vence a do TSE
                   para ele. Lugar: "BR" (presidente), sigla do estado ("RN") ou, numa eleição municipal (2028, prefeito
                   em cidade grande), o código do município no TSE. Ex.: {"G":["AC","AM","DF","ES","RN","TO"]}.
                   Vazio {} = vale a do TSE.
     posse         dia em que começa o mandato de quem foi eleito para o Executivo (a aba Mandato conta a partir dele)
     cargos        por letra: nome PT/EN, dígitos na urna, código do cargo no TSE, "lugar":"br" quando o cargo vale para o
                   país inteiro e, quando o nome muda num lugar, o nome de lá (ex.: "DF" para deputado distrital)
   Fases: até o dia do 1º turno = 1; do dia seguinte até o dia do 2º = 2; depois do último turno = "pos" (a Colinha some);
   da posse em diante, "acompanhamento" (a eleição some da navegação, como se o recurso "eleicoes" estivesse desligado, sem
   desligá-lo; o link direto continua abrindo).
   F1-PR7 (ADR 0010): o modo e a fase são comportamentos próprios do RootifyONE, fora do calendário:
     eleicao.modo   "automatico" (padrão) = a fase vem da data de Brasília; "manual" = o administrador escolhe em eleicao.fase
     eleicao.fase   "auto" | "pre-campanha" | "1" | "2"… | "pos" | "acompanhamento"; vale só no modo manual
   Precedência: manual → eleicao.fase (se "auto", a "fase" de dentro do calendário, e só então a data); automático → a "fase" de
   dentro do calendário quando explícita (compatibilidade com quem já configurou) e, se "auto", a data. "pre-campanha" = eleição
   ligada sem Colinha. 2028 é dado: cargos "P2" (prefeito, 2 dígitos, TSE 11) e "V" (vereador, 5 dígitos, TSE 13) com
   "lugar":"municipio" entram pelo calendário; a Colinha por município é trabalho de depois (F3). */
window.Calendario=(function(){
  "use strict";
  var PADRAO={ano:2026,fase:"auto",tse:"ele2026",
    turnos:[{data:"2026-10-04",cargos:["F","E","S","S","G","P"]},{data:"2026-10-25",cargos:["G","P"]}],
    segundoTurno:{},posse:"2027-01-05",
    cargos:{P:{pt:"Presidente",en:"President",digitos:2,tse:1,lugar:"br"},
      G:{pt:"Governador(a)",en:"Governor",digitos:2,tse:3},
      S:{pt:"Senador(a)",en:"Senator",digitos:3,tse:5},
      F:{pt:"Deputado(a) federal",en:"Federal deputy",digitos:4,tse:6},
      E:{pt:"Deputado(a) estadual",en:"State deputy",digitos:5,tse:7,DF:{pt:"Deputado(a) distrital",en:"District deputy",tse:8}}}};
  var TSE="https://resultados.tse.jus.br/oficial/", HORA=36e5, KT="planos2026:tse";
  var MES={pt:["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"],
    en:["January","February","March","April","May","June","July","August","September","October","November","December"]};
  var MC={pt:["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"],en:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]};
  function en(){return /^en/i.test(document.documentElement.getAttribute("lang")||"");}
  function obj(x){return !!x&&typeof x==="object"&&!Array.isArray(x);}
  /* o de fábrica com o que veio do RootifyONE por cima; turnos inválidos (sem data AAAA-MM-DD) ficam com os de fábrica */
  function cfg(){
    var v=window.SolverRecursos?SolverRecursos.valor("eleicao.calendario",null):null;if(!obj(v))v={};
    var o=Object.assign({},PADRAO,v);
    o.cargos=Object.assign({},PADRAO.cargos,obj(v.cargos)?v.cargos:{});
    if(!(Array.isArray(o.turnos)&&o.turnos.length&&o.turnos.every(function(t){return obj(t)&&/^\d{4}-\d\d-\d\d$/.test(t.data||"")&&Array.isArray(t.cargos);})))o.turnos=PADRAO.turnos;
    if(!obj(o.segundoTurno))o.segundoTurno={};
    return o;
  }
  /* o dia em Brasília (America/Sao_Paulo), qualquer que seja o fuso do aparelho; sem Intl com fuso, UTC−3 (sem horário de verão) */
  function hoje(agora){
    var d=agora||new Date();
    try{var s=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(d);if(/^\d{4}-\d\d-\d\d$/.test(s))return s;}catch(e){}
    return new Date(d.getTime()-3*HORA).toISOString().slice(0,10);
  }
  function modo(){var m=window.SolverRecursos?SolverRecursos.valor("eleicao.modo","automatico"):"automatico";return m==="manual"?"manual":"automatico";}
  var FASES=["pre-campanha","pos","acompanhamento"];
  /* uma fase escrita pelo RootifyONE: nome conhecido ou número de um turno que existe; null = "auto" ou valor inválido */
  function faseValida(f,c){f=String(f==null?"auto":f).toLowerCase();if(FASES.indexOf(f)>-1)return f;if(/^\d+$/.test(f)&&c.turnos[+f-1])return +f;return null;}
  function porData(c,agora){var h=hoje(agora);for(var i=0;i<c.turnos.length;i++)if(h<=c.turnos[i].data)return i+1;return c.posse&&h>=c.posse?"acompanhamento":"pos";}
  function fase(agora){
    var c=cfg(),f;
    if(modo()==="manual"){f=faseValida(window.SolverRecursos?SolverRecursos.valor("eleicao.fase","auto"):"auto",c);if(f!=null)return f;}
    f=faseValida(c.fase,c);if(f!=null)return f;   /* a "fase" de dentro do calendário continua valendo quando explícita */
    return porData(c,agora);
  }
  function ordinal(n){var u=n%10,d=n%100;return n+(u===1&&d!==11?"st":u===2&&d!==12?"nd":u===3&&d!==13?"rd":"th");}
  /* as vagas de um turno, na ordem da urna: chave (F, E, S1, S2, G, P: as mesmas da cola guardada), cargo, nome, dígitos e lugar */
  function vagas(n,uf){
    var c=cfg(),t=c.turnos[n-1];if(!t)return [];
    var conta={},vez={};t.cargos.forEach(function(k){conta[k]=(conta[k]||0)+1;});
    return t.cargos.filter(function(k){return obj(c.cargos[k]);}).map(function(k){
      var d=c.cargos[k],x=uf&&obj(d[uf])?Object.assign({},d,d[uf]):d,i=vez[k]=(vez[k]||0)+1,nome=en()?x.en:x.pt;
      if(conta[k]>1)nome+=en()?" · "+ordinal(i)+" vote":" · "+i+"º voto";
      return {k:conta[k]>1?k+i:k,cg:k,t:nome,d:x.digitos,lugar:d.lugar==="br"?"br":d.lugar==="municipio"?"municipio":"uf",tse:x.tse};
    });
  }
  function dia(n){var t=cfg().turnos[n-1],p=t?t.data.split("-"):null;return p?{d:+p[2],m:+p[1]-1}:null;}
  /* "2º turno em 25 de outubro" · "second round on 25 October" */
  function rotulo(n){var p=dia(n);if(!p)return "";
    return en()?(["first","second","third"][n-1]||ordinal(n))+" round on "+p.d+" "+MES.en[p.m]:n+"º turno em "+p.d+" de "+MES.pt[p.m];}
  /* "2º turno · 25/Out" · "2nd round · Oct 25" */
  function curto(n){var p=dia(n);if(!p)return "";return en()?ordinal(n)+" round · "+MC.en[p.m]+" "+p.d:n+"º turno · "+p.d+"/"+MC.pt[p.m];}
  /* tela de Início: "Eleição 2026 · 2º turno em 25 de outubro"; depois do último turno, "Eleição 2026 · encerrada" */
  function cabecalho(){var a=cfg().ano,f=fase(),x=typeof f==="number"?rotulo(f):f==="pre-campanha"?(en()?"pre-campaign":"pré-campanha"):(en()?"concluded":"encerrada");
    return en()?a+" election · "+x:"Eleição "+a+" · "+x;}
  /* os cargos de um turno (sem n: o de agora; no pós-eleição, o último), em texto: "presidente e governador(a)" */
  function nomes(n){var c=cfg();n=n||fase();if(typeof n!=="number")n=n==="pre-campanha"?1:c.turnos.length;var t=c.turnos[n-1],L=[];if(!t)return "";
    t.cargos.forEach(function(k){var d=c.cargos[k];if(!obj(d))return;var x=(en()?d.en:d.pt).toLowerCase();if(L.indexOf(x)<0)L.push(x);});
    return L.length>1?L.slice(0,-1).join(", ")+(en()?" and ":" e ")+L[L.length-1]:L.join("");}

  /* ---- quem está no 2º turno: o app só vai ao TSE quando a fase precisa (2º turno), no máximo 1 vez por hora por arquivo
     e por aparelho, sem travar a tela; a cópia guardada no aparelho (planos2026:tse) vale enquanto a nova não chega ---- */
  /* navegador que não deixa guardar (modo privado bloqueado, sem espaço): a cópia fica na memória da página, e o limite
     de 1 ida por hora continua valendo enquanto ela estiver aberta */
  var memo=null;
  function guardado(){if(memo)return JSON.parse(JSON.stringify(memo));try{var g=JSON.parse(localStorage.getItem(KT)||"null");return obj(g)?g:{};}catch(e){return {};}}
  function guarda(g){try{localStorage.setItem(KT,JSON.stringify(g));memo=null;}catch(e){memo=g;}}
  function pede(url){
    var ctrl=window.AbortController?new AbortController():null,prazo=setTimeout(function(){if(ctrl)ctrl.abort();},8000);
    return fetch(url,{cache:"no-cache",signal:ctrl?ctrl.signal:undefined}).then(function(r){clearTimeout(prazo);if(!r.ok)throw new Error("http-"+r.status);return r.json();},
      function(e){clearTimeout(prazo);throw e;});
  }
  /* pode ir ao TSE buscar este arquivo agora? A tentativa é anotada antes de ir: se falhar, só tenta de novo 1 hora depois */
  function podeIr(g,nome){g.tent=obj(g.tent)?g.tent:{};var d=Date.now()-(g.tent[nome]||0);if(d>=0&&d<HORA)return false;g.tent[nome]=Date.now();guarda(g);return true;}
  /* ele-c.json, a configuração das eleições do TSE: no ano (c.tse) e no turno n, as eleições ordinárias e, por cargo, os
     lugares (abrangência) e o código da eleição. null = o TSE ainda não publicou esse turno */
  function lerConfig(j,c,n){
    var cod={},onde={},ele={},achou=false;
    Object.keys(c.cargos).forEach(function(k){if(obj(c.cargos[k])&&c.cargos[k].tse!=null)cod[String(c.cargos[k].tse)]=k;});
    ((j&&j.pl)||[]).forEach(function(p){if(p.c!==c.tse)return;
      (p.e||[]).forEach(function(e){if(String(e.t)!==String(n)||!/ordin/i.test(e.nm||""))return;achou=true;
        (e.abr||[]).forEach(function(a){(a.cp||[]).forEach(function(x){var k=cod[String(x.cd)];if(!k)return;
          (onde[k]=onde[k]||[]).push(String(a.cd).toUpperCase());ele[k]=String(e.cd);});});});});
    return achou?{onde:onde,ele:ele}:null;
  }
  /* arquivo unificado do resultado de um cargo num lugar (ex.: …/ele2026/<eleição>/dados/rn/rn-c0003-e00XXXX-u.json):
     no 2º turno, antes da votação, ele traz só os candidatos que estão nele */
  function urlFinal(c,ele,cargo,lugar){var l=lugar.toLowerCase();return TSE+c.tse+"/"+ele+"/dados/"+l+"/"+l+"-c"+("000"+cargo).slice(-4)+"-e"+("00000"+ele).slice(-6)+"-u.json";}
  function lerFinal(j){var ids=[];((j&&j.carg)||[]).forEach(function(g){(g.agr||[]).forEach(function(a){(a.par||[]).forEach(function(p){
    (p.cand||[]).forEach(function(x){if(x.sqcand)ids.push(String(x.sqcand));});});});});return ids;}
  /* onde há aquele turno para o cargo k: a lista manual do RootifyONE vence; senão, a do TSE (a última que chegou) */
  function onde(k,n){var c=cfg();n=n||fase();var m=c.segundoTurno[k];
    if(Array.isArray(m))return {lista:m.map(function(x){return String(x).toUpperCase();}),fonte:"manual"};
    var b=guardado()[c.tse+"/"+n];
    return b?{lista:(b.onde&&b.onde[k])||[],fonte:"tse",em:b.em}:{lista:null,fonte:null};}
  /* os ids do TSE dos candidatos daquele turno, para o cargo k no lugar; null = ainda não se sabe */
  function finalistas(k,lugar,n){var c=cfg();n=n||fase();var g=guardado(),f=obj(g.fin)?g.fin[c.tse+"/"+n+"/"+k+"/"+lugar]:null;return f&&Array.isArray(f.ids)?f.ids:null;}
  var indo=null,indoUf="";
  /* busca no TSE o que a tela do estado uf precisa; devolve true se algo mudou (a tela redesenha) */
  function consultar(uf){
    if(indo)return uf===indoUf?indo:indo.then(function(m){return consultar(uf).then(function(m2){return m||m2;});});
    var c=cfg(),n=fase();if(typeof n!=="number"||n<2||!c.tse)return Promise.resolve(false);
    indoUf=uf;
    var chave=c.tse+"/"+n,g0=guardado(),antes=JSON.stringify([g0[chave],g0.fin]);
    var config=podeIr(g0,chave)?pede(TSE+"comum/config/ele-c.json").then(function(j){var r=lerConfig(j,c,n);
      if(r){r.em=new Date().toISOString();var g=guardado();g[chave]=r;guarda(g);}}).catch(function(){}):Promise.resolve();
    indo=config.then(function(){
      var g=guardado(),base=g[chave],L=[];if(!base)return;
      vagas(n,uf).forEach(function(v){
        var lugar=v.lugar==="br"?"BR":uf,o=onde(v.cg,n),nome=chave+"/"+v.cg+"/"+lugar;
        if(!lugar||!o.lista||o.lista.indexOf(lugar)<0||!base.ele[v.cg]||!podeIr(g,nome))return;
        L.push(pede(urlFinal(c,base.ele[v.cg],v.tse,lugar)).then(function(j){var ids=lerFinal(j);if(!ids.length)return;
          var g2=guardado();g2.fin=obj(g2.fin)?g2.fin:{};g2.fin[nome]={ids:ids,em:new Date().toISOString()};guarda(g2);}).catch(function(){}));
      });
      return Promise.all(L);
    }).catch(function(){}).then(function(){indo=null;var g=guardado();return JSON.stringify([g[chave],g.fin])!==antes;});
    return indo;
  }

  /* pós-eleição: a Colinha some do site inteiro (tudo o que tem data-recurso="colinha", como faz o interruptor);
     quem quer saber da troca (a Colinha, o Início) ouve aoMudar: chegou arquivo do RootifyONE ou a fase mudou pela data */
  var ouvintes=[],ultima="";
  function aplicar(){var f=fase(),h=document.documentElement;ultima=JSON.stringify([f,modo(),cfg()]);
    h.toggleAttribute("data-colinha-pos",typeof f!=="number");   /* pré-campanha, pós-eleição e acompanhamento: sem Colinha */
    h.setAttribute("data-fase",String(f));h.setAttribute("data-ciclo",modo());   /* o CSS esconde o que é da eleição no acompanhamento; "data-modo" já é da Presidência/Congresso */
  }
  function avisa(){aplicar();ouvintes.slice().forEach(function(fn){try{fn();}catch(e){}});}
  aplicar();
  if(window.SolverRecursos)SolverRecursos.aoMudar(avisa);
  document.addEventListener("visibilitychange",function(){if(document.visibilityState==="visible"&&JSON.stringify([fase(),modo(),cfg()])!==ultima)avisa();});
  return {padrao:function(){return JSON.parse(JSON.stringify(PADRAO));},cfg:cfg,hoje:hoje,fase:fase,modo:modo,vagas:vagas,
    ano:function(){return cfg().ano;},data:function(n){var t=cfg().turnos[n-1];return t?t.data:"";},
    posse:function(){return cfg().posse||PADRAO.posse;},chave:function(n){return cfg().ano+"-"+n;},
    rotulo:rotulo,curto:curto,cabecalho:cabecalho,nomes:nomes,onde:onde,finalistas:finalistas,consultar:consultar,
    consultando:function(){return !!indo;},aoMudar:function(fn){if(typeof fn==="function")ouvintes.push(fn);}};
})();

/* Colinha fora do ar: interruptor "colinha" do RootifyONE (Controle dos apps) desligado OU pós-eleição pelo calendário.
   O interruptor vale por cima nos dois sentidos: desligado esconde em qualquer fase; religado, ela volta no 1º e no 2º turno */
window.colinhaOff=function(){return !!((window.SolverRecursos&&!SolverRecursos.ligado("colinha",true))||(window.Calendario&&typeof Calendario.fase()!=="number"));};
