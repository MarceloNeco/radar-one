/* voz.js: leitura em voz alta, VozLeitor e VozPainel (bloco 6, v1.7)
   Movido como está do index.html 2.5.4 no F1-PR3 (31/10/2026): mesmo código, mesmos nomes; o que sai daqui para fora é só window.X (ver docs/modulos-contrato.md). */
/* =====================================================================
   LEITURA EM VOZ ALTA (TTS)
   ---------------------------------------------------------------------
   Um botão ▶ ao lado de cada título lê aquela seção. Tocar de novo pausa;
   tocar outra vez continua de onde parou; ■ para de vez.
   Motores (escolhidos em Configurações → Leitura em voz alta), os mesmos do
   Contador de Histórias:
     1. voz do aparelho (Web Speech API) — grátis, instantânea, sem internet;
     2. Gemini, OpenAI ou ElevenLabs — voz natural pela internet, com a chave
        de quem usa. O áudio de cada trecho fica guardado neste navegador
        (IndexedDB): ouvir de novo não gasta cota e funciona sem internet.
   Regras que valem para todos os apps (diretrizes gerais):
     - só existem as vozes que o navegador devolve em getVoices();
     - "Padrão do aparelho" = nenhuma voz escolhida, só o idioma: no Android
       é isso que faz o navegador usar o mecanismo das Configurações;
     - falar só depois de um toque; cancel() + 60 ms antes de falar; uma frase
       por vez; vigia de tempo; resume() a cada 9 s (Chrome do Android).
   Na página em inglês, a interface é lida em inglês e as citações dos planos
   (que ficam em português) são lidas com a voz em português.
   Tudo aqui é independente do resto do site: se este bloco for apagado, o
   site continua funcionando igual, só sem os botões de leitura.
   ===================================================================== */
(function(){
"use strict";
var EN=/^en/i.test(document.documentElement.getAttribute("lang")||"")||/index-en\.html$/.test(location.pathname);
function T(pt,en){return EN?en:pt;}
var $=function(s,r){return (r||document).querySelector(s);};
function mk(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;}

/* ---------------- preferências (só neste navegador) ---------------- */
var CHAVE="planos2026:voz";   /* prefixo próprio: o domínio é dividido com os outros apps */
var PADRAO={
  icones:true, motor:"nativo", vozPT:"", vozEN:"", vel:1, tom:1, abaixarTrilha:true,
  geminiVoz:"Charon", geminiModelo:"gemini-3.1-flash-tts-preview", geminiInstr:"",
  openaiVoz:"alloy", openaiModelo:"gpt-4o-mini-tts",
  elevenVoz:"", elevenModelo:"eleven_multilingual_v2"
};
/* as chaves (Gemini, OpenAI, ElevenLabs) não ficam aqui: moram no cofre (cofre.js), igual nos outros apps */
var CAMPOS_CHAVE=["geminiKey","openaiKey","elevenKey"];
function lePref(){
  try{var t=localStorage.getItem(CHAVE);var o=Object.assign({},PADRAO,t?(JSON.parse(t)||{}):{});
    CAMPOS_CHAVE.forEach(function(k){delete o[k];});return o;}
  catch(e){return Object.assign({},PADRAO);}
}
var P=lePref();
/* grava por cima do que já está guardado: uma chave antiga ainda em texto aberto (cofre sem PIN ainda) não se perde */
function grava(){try{var v=JSON.parse(localStorage.getItem(CHAVE)||"null")||{};localStorage.setItem(CHAVE,JSON.stringify(Object.assign(v,P)));}catch(e){}}

/* ---------------- chaves no cofre (SolverCofre) ---------------- */
var NOME_COFRE={gemini:"ia:gemini",openai:"ia:openai",elevenlabs:"ia:elevenlabs"};
var MAPA_CHAVES={geminiKey:"ia:gemini",openaiKey:"ia:openai",elevenKey:"ia:elevenlabs"};
/* onde as chaves estavam antes: planos2026:voz (as do próprio app) e ch_config (cópia que o Contador de Histórias
   deixava aqui para este app; agora a do cofre vale para os dois). Saem do lugar antigo assim que o cofre abre. */
if(window.SolverCofre)SolverCofre.registrarFontes([{chave:CHAVE,caminho:"",mapa:MAPA_CHAVES},{chave:"ch_config",caminho:"",mapa:MAPA_CHAVES}]);
/* regras do PIN (cofre 1.4.0): com chave guardada, pede o PIN ao abrir e ao recarregar; tranca ao sair do app, ao ficar escondido
   por mais de 1 minuto e com 5 minutos sem uso. A voz tocando só adia o trancar por falta de uso e o de sair da página.
   2.5.1: só com o comportamento "cofre.proteger" ligado no RootifyONE (padrão: desligado). O cofre é um só por endereço e
   pode ter chaves de outros apps; este site é público e a chave só serve para a voz: o PIN aparece só no ▶ com voz da
   internet (chaveCofre). Vale a cópia do arquivo que o aparelho já guardou (a mudança no RootifyONE vale da próxima abertura). */
function lendo(){return !!(window.VozLeitor&&(VozLeitor.estado==="tocando"||VozLeitor.estado==="carregando"));}
if(window.SolverCofre&&window.SolverRecursos&&SolverRecursos.valor("cofre.proteger",false)===true)SolverCofre.proteger({motivo:{pt:"Para abrir o Eleições 2026 com as suas chaves de voz guardadas, digite o PIN do cofre.",en:"To open Elections 2026 with your saved voice keys, type the vault PIN."},
  ocupado:lendo,tocando:lendo});
function temChave(prov){return !!window.SolverCofre&&SolverCofre.tem(NOME_COFRE[prov]);}
/* a chave de um provedor; cofre trancado → janela do PIN e segue. Sem chave: "" */
function chaveCofre(prov,rotulo){
  if(!window.SolverCofre)return Promise.resolve("");
  return SolverCofre.ler(NOME_COFRE[prov],{motivo:{pt:"Para ler em voz alta com "+rotulo+", digite o PIN do cofre.",en:"To read aloud with "+rotulo+", type the vault PIN."}})
    .catch(function(e){
      if(e&&e.message==="cofre-trancado"){var x=new Error(T("O cofre continua trancado, então a voz de "+rotulo+" não foi usada. Digite o PIN, ou volte para a voz do aparelho.",
        "The vault is still locked, so the "+rotulo+" voice was not used. Type the PIN, or switch back to the device voice."));x.semChave=true;x.trancado=true;throw x;}
      throw e;});
}
function instrucao(){
  if(P.geminiInstr)return P.geminiInstr;
  return EN
    ? "Read in a neutral, informative tone, like a public-radio newsreader: clear pace, no drama, no opinion. Passages in Portuguese must be read in Brazilian Portuguese. Do not comment on anything, just read the text."
    : "Leia em português do Brasil, em tom neutro e informativo, como um locutor de rádio pública: ritmo claro, sem dramatizar e sem opinar. Não comente nada, apenas leia o texto.";
}

/* ---------------- voz do aparelho ---------------- */
var vozes=[], PADRAO_APARELHO="__padrao__";
function langNorm(l){return String(l||"").replace("_","-").toLowerCase();}
function ehPT(v){var l=langNorm(v.lang);return l.indexOf("pt")===0||l.indexOf("por")===0;}
function ehPTBR(v){var l=langNorm(v.lang);return l==="pt-br"||l==="por-bra"||l==="pt-br-x-multi";}
function ehEN(v){var l=langNorm(v.lang);return l.indexOf("en")===0||l.indexOf("eng")===0;}
function ehENUS(v){var l=langNorm(v.lang);return l==="en-us"||l==="eng-usa";}
function natural(v){return /natural|online|neural|enhanced|premium|wavenet|piper|sherpa|coqui|vits|acapela|kokoro|woheller|ttsengine|-(low|medium|high)\b/i.test(v.name+" "+v.voiceURI);}
function motorDe(v){
  var s=(v.name+" "+v.voiceURI).toLowerCase();
  if(/sherpa|piper|coqui|vits|woheller|ttsengine|-(low|medium|high)\b/.test(s))return "SherpaTTS";
  if(/acapela/.test(s))return "Acapela";
  if(/samsung|smt/.test(s))return "Samsung";
  if(/google|gsm|com\.google/.test(s))return "Google";
  if(/microsoft/.test(s))return "Microsoft";
  if(/apple|com\.apple/.test(s))return "Apple";
  return "";
}
var ouvintesVozes=[];
function carregaVozes(){
  if(!("speechSynthesis" in window))return;
  try{vozes=speechSynthesis.getVoices()||[];}catch(e){vozes=[];}
  ouvintesVozes.forEach(function(f){try{f();}catch(e){}});
}
if("speechSynthesis" in window){
  try{speechSynthesis.addEventListener("voiceschanged",carregaVozes);}catch(e){speechSynthesis.onvoiceschanged=carregaVozes;}
  [100,900,3000].forEach(function(ms){setTimeout(carregaVozes,ms);});
  document.addEventListener("visibilitychange",function(){if(!document.hidden)setTimeout(carregaVozes,400);});
}
function vozEscolhida(lg){
  var id=lg==="en"?P.vozEN:P.vozPT;
  if(!id||id===PADRAO_APARELHO)return null;
  return vozes.filter(function(v){return v.voiceURI===id;})[0]||null;
}
function falaNativa(texto,lg){
  return new Promise(function(resolve){
    if(!("speechSynthesis" in window)){resolve("sem-voz");return;}
    var u=new SpeechSynthesisUtterance(texto);
    var v=vozEscolhida(lg);
    if(v)u.voice=v;
    /* idioma sempre explícito: com "Padrão do aparelho" é ele que escolhe o mecanismo */
    u.lang=lg==="en"?"en-US":"pt-BR";
    u.rate=+P.vel||1;u.pitch=+P.tom||1;u.volume=1;
    var feito=false,vigia=null,acorda=null;
    function fim(r){if(feito)return;feito=true;clearTimeout(vigia);clearInterval(acorda);resolve(r||"ok");}
    u.onend=function(){fim("ok");};u.onerror=function(){fim("erro");};
    var pal=texto.split(/\s+/).filter(Boolean).length;
    vigia=setTimeout(function(){fim("ok");},Math.max(6000,(pal/(2.4*Math.max(.5,+P.vel||1)))*1000+6000));
    acorda=setInterval(function(){try{if(speechSynthesis.speaking)speechSynthesis.resume();}catch(e){}},9000);
    Leitor._paraNativo=function(){fim("parado");};
    function fala(){try{speechSynthesis.speak(u);}catch(e){fim("erro");}}
    if(speechSynthesis.speaking||speechSynthesis.pending){speechSynthesis.cancel();setTimeout(fala,60);}
    else fala();
  });
}

/* ---------------- áudio guardado (IndexedDB) ---------------- */
var Guarda=(function(){
  var db=null,falhou=false;
  function abre(){
    if(db)return Promise.resolve(db);
    if(falhou||!window.indexedDB)return Promise.resolve(null);
    return new Promise(function(res){
      var p;try{p=indexedDB.open("planos2026_audio",1);}catch(e){falhou=true;return res(null);}
      p.onupgradeneeded=function(){try{p.result.createObjectStore("audio");}catch(e){}};
      p.onsuccess=function(){db=p.result;res(db);};
      p.onerror=function(){falhou=true;res(null);};
    });
  }
  function op(modo,fn){
    return abre().then(function(d){if(!d)return null;
      return new Promise(function(res){
        var t;try{t=d.transaction("audio",modo);}catch(e){return res(null);}
        var r=fn(t.objectStore("audio"));
        if(r){r.onsuccess=function(){res(r.result);};r.onerror=function(){res(null);};}
        else{t.oncomplete=function(){res(true);};t.onerror=function(){res(null);};}
      });});
  }
  return {
    marca:function(){
      if(P.motor==="gemini")return "gemini|"+P.geminiVoz+"|"+P.geminiModelo+"|"+hash(instrucao());
      if(P.motor==="openai")return "openai|"+P.openaiVoz+"|"+P.openaiModelo;
      if(P.motor==="elevenlabs")return "eleven|"+P.elevenVoz+"|"+P.elevenModelo;
      return "nativo";
    },
    chave:function(txt){return "planos|"+this.marca()+"|"+hash(txt)+"|"+txt.length;},
    pega:function(k){return op("readonly",function(s){return s.get(k);});},
    existe:function(k){return op("readonly",function(s){return s.getKey(k);}).then(function(r){return !!r;});},
    guarda:function(k,b){return op("readwrite",function(s){return s.put(b,k);});},
    quanto:function(){
      return abre().then(function(d){if(!d)return {n:0,bytes:0};
        return new Promise(function(res){var n=0,by=0;
          var c;try{c=d.transaction("audio","readonly").objectStore("audio").openCursor();}catch(e){return res({n:0,bytes:0});}
          c.onsuccess=function(e){var k=e.target.result;if(k){n++;by+=(k.value&&k.value.size)||0;k.continue();}else res({n:n,bytes:by});};
          c.onerror=function(){res({n:0,bytes:0});};});});
    },
    limpa:function(){return op("readwrite",function(s){s.clear();return null;});}
  };
})();
function hash(t){var h=0;for(var i=0;i<t.length;i++){h=((h<<5)-h+t.charCodeAt(i))|0;}return (h>>>0).toString(36);}

/* ---------------- motores de internet (devolvem um Blob de áudio) ---------------- */
var VOZES_GEMINI=[
 ["Charon",T("narradora","narrator")],["Rasalgethi",T("narradora","narrator")],["Schedar",T("equilibrada","even")],
 ["Kore",T("firme","firm")],["Orus",T("firme","firm")],["Alnilam",T("firme","firm")],["Sadaltager",T("sábia","knowledgeable")],
 ["Iapetus",T("clara","clear")],["Erinome",T("clara","clear")],["Achernar",T("suave","soft")],["Sulafat",T("calorosa","warm")],
 ["Vindemiatrix",T("gentil","gentle")],["Callirrhoe",T("tranquila","easy-going")],["Umbriel",T("tranquila","easy-going")],
 ["Aoede",T("leve","breezy")],["Algieba",T("macia","smooth")],["Despina",T("macia","smooth")],["Achird",T("amigável","friendly")],
 ["Zubenelgenubi",T("descontraída","casual")],["Autonoe",T("brilhante","bright")],["Zephyr",T("brilhante","bright")],
 ["Leda",T("jovem","youthful")],["Laomedeia",T("animada","upbeat")],["Puck",T("animada","upbeat")],["Sadachbia",T("vivaz","lively")],
 ["Fenrir",T("empolgada","excitable")],["Gacrux",T("madura","mature")],["Algenib",T("rouca","gravelly")],
 ["Enceladus",T("sussurrada","breathy")],["Pulcherrima",T("marcante","forward")]
];
var VOZES_OPENAI=["alloy","ash","ballad","coral","echo","fable","nova","onyx","sage","shimmer","verse"];
function pcmParaWav(b64,taxa){
  var bin=atob(b64),n=bin.length,buf=new ArrayBuffer(44+n),v=new DataView(buf);
  function tx(p,t){for(var i=0;i<t.length;i++)v.setUint8(p+i,t.charCodeAt(i));}
  tx(0,"RIFF");v.setUint32(4,36+n,true);tx(8,"WAVE");tx(12,"fmt ");
  v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);
  v.setUint32(24,taxa,true);v.setUint32(28,taxa*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);
  tx(36,"data");v.setUint32(40,n,true);
  var u=new Uint8Array(buf);for(var i=0;i<n;i++)u[44+i]=bin.charCodeAt(i);
  return new Blob([buf],{type:"audio/wav"});
}
function achaAudio(o,prof){
  prof=prof||0;if(!o||typeof o!=="object"||prof>7)return null;
  if(o.inlineData&&typeof o.inlineData.data==="string")return o.inlineData.data;
  if(o.inline_data&&typeof o.inline_data.data==="string")return o.inline_data.data;
  if(typeof o.data==="string"&&o.data.length>500)return o.data;
  for(var k in o){var r=achaAudio(o[k],prof+1);if(r)return r;}
  return null;
}
function erroHttp(servico,st,corpo){
  var m=servico+": "+st+" — "+corpo;
  if(st===401||st===403)m=T("O serviço não aceitou a chave. Confira se ela foi copiada inteira, em Configurações → Leitura em voz alta.",
                           "The service did not accept the key. Check that it was copied in full, in Settings → Read aloud.");
  if(st===429)m=T("A cota grátis chegou ao limite por agora. Espere alguns minutos ou use a voz do aparelho.",
                  "The free quota has run out for now. Wait a few minutes or use the device voice.");
  var e=new Error(m);e.status=st;return e;
}
function erroRede(e){
  if(e&&/failed to fetch|networkerror|load failed/i.test(e.message||""))
    return new Error(T("O navegador não conseguiu chegar ao servidor. Sem internet, ou alguma extensão (bloqueador, antivírus, VPN) está barrando a conexão. Teste numa janela anônima.",
                       "The browser could not reach the server. There is no connection, or an extension (blocker, antivirus, VPN) is blocking it. Try a private window."));
  return e;
}
var caminhoGemini=null;
async function geminiNovo(t,chave){
  var r=await fetch("https://generativelanguage.googleapis.com/v1beta/interactions",{method:"POST",
    headers:{"Content-Type":"application/json","x-goog-api-key":chave},
    body:JSON.stringify({model:P.geminiModelo,input:instrucao()+"\n\n"+t,response_format:{type:"audio"},
      generation_config:{speech_config:[{voice:P.geminiVoz||"Charon"}]}})});
  if(!r.ok)throw erroHttp("Gemini",r.status,(await r.text()).slice(0,200));
  var b=achaAudio(await r.json());if(!b)throw new Error(T("O Gemini não devolveu áudio.","Gemini returned no audio."));
  return pcmParaWav(b,24000);
}
async function geminiClassico(t,chave){
  var mod=/^gemini-3/.test(P.geminiModelo||"")?"gemini-2.5-flash-preview-tts":(P.geminiModelo||"gemini-2.5-flash-preview-tts");
  var r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(mod)+":generateContent",{method:"POST",
    headers:{"Content-Type":"application/json","x-goog-api-key":chave},
    body:JSON.stringify({contents:[{parts:[{text:instrucao()+"\n\n"+t}]}],
      generationConfig:{responseModalities:["AUDIO"],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:P.geminiVoz||"Charon"}}}}})});
  if(!r.ok)throw erroHttp("Gemini",r.status,(await r.text()).slice(0,200));
  var b=achaAudio(await r.json());if(!b)throw new Error(T("O Gemini não devolveu áudio.","Gemini returned no audio."));
  return pcmParaWav(b,24000);
}
async function audioGemini(t){
  var chave=await chaveCofre("gemini","Gemini");
  if(!chave)throw semChave("Gemini");
  var ordem=caminhoGemini==="classico"?[["classico",geminiClassico],["novo",geminiNovo]]:[["novo",geminiNovo],["classico",geminiClassico]];
  var ult=null;
  for(var i=0;i<ordem.length;i++){
    try{var b=await ordem[i][1](t,chave);caminhoGemini=ordem[i][0];return b;}
    catch(e){ult=e;if(e.status===401||e.status===403||e.status===429)throw e;}
  }
  throw erroRede(ult)||new Error("Gemini");
}
async function audioOpenai(t){
  var chave=await chaveCofre("openai","OpenAI");
  if(!chave)throw semChave("OpenAI");
  var corpo={model:P.openaiModelo,voice:P.openaiVoz,input:t,response_format:"mp3"};
  if(P.openaiModelo==="gpt-4o-mini-tts")corpo.instructions=instrucao();
  var r;try{r=await fetch("https://api.openai.com/v1/audio/speech",{method:"POST",
    headers:{"Authorization":"Bearer "+chave,"Content-Type":"application/json"},body:JSON.stringify(corpo)});}
  catch(e){throw erroRede(e);}
  if(!r.ok)throw erroHttp("OpenAI",r.status,(await r.text()).slice(0,200));
  return await r.blob();
}
async function audioEleven(t){
  var chave=await chaveCofre("elevenlabs","ElevenLabs");
  if(!chave)throw semChave("ElevenLabs");
  if(!P.elevenVoz)throw new Error(T("Escolha uma voz da ElevenLabs em Configurações → Leitura em voz alta.","Choose an ElevenLabs voice in Settings → Read aloud."));
  var r;try{r=await fetch("https://api.elevenlabs.io/v1/text-to-speech/"+encodeURIComponent(P.elevenVoz),{method:"POST",
    headers:{"xi-api-key":chave,"Content-Type":"application/json","Accept":"audio/mpeg"},
    body:JSON.stringify({text:t,model_id:P.elevenModelo,voice_settings:{stability:.6,similarity_boost:.8}})});}
  catch(e){throw erroRede(e);}
  if(!r.ok)throw erroHttp("ElevenLabs",r.status,(await r.text()).slice(0,200));
  return await r.blob();
}
function semChave(n){var e=new Error(T("Falta a chave do "+n+". Cole em Configurações → Leitura em voz alta, ou volte para a voz do aparelho.",
  "The "+n+" key is missing. Paste it in Settings → Read aloud, or switch back to the device voice."));e.semChave=true;return e;}
function geraAudio(t){
  if(P.motor==="gemini")return audioGemini(t);
  if(P.motor==="openai")return audioOpenai(t);
  return audioEleven(t);
}
function internet(){return P.motor==="gemini"||P.motor==="openai"||P.motor==="elevenlabs";}

/* ---------------- do HTML para o texto falado ---------------- */
var PULA="script,style,svg,canvas,table,button,select,input,textarea,summary,.tts-ctl,.tts-bar,[aria-hidden='true'],[hidden],.tip,.i,noscript,audio,video,.ig-acoes,article.f .id,.dots";
var BLOCO=/^(P|LI|H1|H2|H3|H4|H5|H6|BLOCKQUOTE|DIV|SECTION|HEADER|ARTICLE|DT|DD|FIGCAPTION|UL|OL|DETAILS|TR|BR)$/;
/* o que é conteúdo de origem, em português, mesmo na página em inglês */
var ORIGEM_PT="blockquote,.para-t,[lang^='pt']";
function segmentos(raiz){
  var out=[];
  function poe(t,lg){
    t=t.replace(/\s+/g," ");
    if(!t.trim()){var u0=out[out.length-1];if(u0&&!/\s$/.test(u0.t))u0.t+=" ";return;}
    var u=out[out.length-1];
    if(u&&u.lg===lg)u.t+=t; else out.push({t:t,lg:lg});
  }
  function quebra(){var u=out[out.length-1];if(u&&!/[.!?…:;]\s*$/.test(u.t.trim()))u.t=u.t.replace(/\s*$/,". ");else if(u)u.t+=" ";}
  function anda(n,lg){
    if(n.nodeType===3){poe(n.nodeValue,lg);return;}
    if(n.nodeType!==1)return;
    if(n.matches&&n.matches(PULA))return;
    if(n.tagName==="DETAILS"&&!n.open&&n!==raiz)return;
    /* dentro de caixa fechada o navegador não calcula estilo: aí vale só o [hidden] */
    if(!dentroFechado(n)){try{var cs=getComputedStyle(n);if(cs.display==="none"||cs.visibility==="hidden")return;}catch(e){}}
    var l2=lg;
    if(EN&&n.matches&&n.matches(ORIGEM_PT))l2="pt";
    var bl=BLOCO.test(n.tagName);
    if(bl)quebra(); else poe(" ",l2);   /* etiquetas lado a lado não grudam: "Augusto Cury Avante" */
    for(var c=n.firstChild;c;c=c.nextSibling)anda(c,l2);
    if(bl)quebra(); else poe(" ",l2);
  }
  function dentroFechado(n){var d=n.closest&&n.closest("details");return !!(d&&!d.open&&n!==d);}
  anda(raiz,EN?"en":"pt");
  return out.map(function(s){return {t:limpa(s.t),lg:s.lg};}).filter(function(s){return /[\wÀ-ÿ]/.test(s.t);});
}
/* símbolos que a voz leria mal ou soletraria */
function limpa(t){
  return t.replace(/[“”«»"]/g,"").replace(/\s·\s/g,", ").replace(/[→➔]/g," ").replace(/[×]/g,EN?" by ":" por ")
    .replace(/\s+([.,;:!?])/g,"$1").replace(/(\.\s*){2,}/g,". ").replace(/^[\s.,;:]+/,"").replace(/\s+/g," ").trim();
}
/* corta em frases só onde a pontuação é seguida de espaço e de maiúscula,
   aspas ou número — e não depois de abreviação ("p. 47", "art. 19", "nº.") */
var ABREV=/(^|\s)(p|pp|art|arts|inc|n|nº|sr|sra|dr|dra|prof|etc|ex|cap|fl|fls|vol|ed|min|máx|mín|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|vs|e\.g|i\.e|no|nos|approx)\.$/i;
function frases(t){
  var r=[],ini=0,re=/[.!?…]+["')\]]*\s+/g,m;
  while((m=re.exec(t))){
    var fim=m.index+m[0].length, antes=t.slice(ini,m.index+1), prox=t.charAt(fim);
    if(!/[A-ZÀ-Ý0-9"“(]/.test(prox)||ABREV.test(antes.trim()))continue;
    r.push(t.slice(ini,fim).trim());ini=fim;
  }
  if(ini<t.length)r.push(t.slice(ini).trim());
  return r.filter(Boolean);
}
/* frases → pedaços. Voz do aparelho: uma frase por vez (o Android trava em
   textos longos). Voz de internet: pedaços pequenos no começo, para a voz sair
   logo, e maiores depois, para gastar menos pedidos. nativo = cortar para a voz do aparelho mesmo com voz de internet
   escolhida (o "Agora não" do PIN, 2.5.1). */
function pedacos(segs,nativo){
  var r=[];
  segs.forEach(function(s){
    var fr=frases(s.t);
    if(nativo||!internet()){fr.forEach(function(x){
      /* frase enorme (lista sem ponto): corta em vírgulas para não travar */
      while(x.length>320){var c=x.lastIndexOf(",",300);if(c<80)c=300;r.push({t:x.slice(0,c+1).trim(),lg:s.lg});x=x.slice(c+1).trim();}
      if(x)r.push({t:x,lg:s.lg});});return;}
    var cur="";
    fr.forEach(function(x){
      var teto=[180,400,800,1400][r.length]||1900;
      if(cur&&(cur+" "+x).length>teto){r.push({t:cur,lg:s.lg});cur=x;}
      else cur=cur?cur+" "+x:x;});
    if(cur)r.push({t:cur,lg:s.lg});
  });
  return r;
}

/* ---------------- onde ficam os botões ---------------- */
/* [seletor do título, como achar a seção que ele abre, onde pôr o botão] */
var ALVOS=[
  [".view.dest h1.dest-t", function(h){return h.closest(".wrap");}, "dentro"],   /* F1-PR5: as telas do shell (Hoje, Explorar, Salvos) também se leem em voz alta */
  [".view > header h1.h-lead", function(h){return h.closest("header");}, "dentro"],
  [".sec-h > h2", function(h){return h.closest("section")||h.parentNode.parentNode;}, "dentro"],
  [".card h3, .card h4, .note h3", function(h){return h.closest(".card")||h.parentNode;}, "dentro"],
  ["article.f", function(a){return a;}, "cabeca"],
  [".ig .ig-h h3", function(h){return h.closest(".ig");}, "dentro"],
  ["#doc-t", function(h){return document.getElementById("doc-corpo");}, "dentro"],
  /* caixas que abrem e fecham (instruções, ressalvas, "como ler"): o ▶ vai no
     próprio título da caixa e lê o que está dentro, mesmo com ela fechada */
  ["details > summary", function(s){return s.parentNode;}, "dentro"],
  /* v2.0: escolha inicial e módulo Congresso (montados pelo bloco "v2.0") */
  ["#v-hub .hub h1", function(h){return h.closest("section");}, "dentro"],
  ["#v-congresso .cg-h h1.h-lead", function(h){return h.closest("header");}, "dentro"],
  ["#v-congresso .cg-fh h1", function(h){return h.closest("main");}, "dentro"],
  ["#v-congresso .cg-s > h2", function(h){return h.closest("section");}, "dentro"],
  ["#v-congresso .cg-box > h2", function(h){return h.closest(".cg-box");}, "dentro"],
  ["#v-congresso .cg-card > h3", function(h){return h.closest(".cg-card");}, "dentro"],
  ["#v-mandato .cg-s > h2", function(h){return h.closest("section");}, "dentro"]
];
var FORA="nav,.tts-bar,#cfg,#tts-dlg,thead,.cg-c,.ig-sum,.idx-dd,.sob-dd,.mr-dd,.cm-por,.ig-sum-d,.ig-sum-cat,.sob-d>summary,.idi,.tts-cfg,article.f details";
function marcaTitulos(){
  if(!P.icones)return;
  ALVOS.forEach(function(a){
    document.querySelectorAll(a[0]).forEach(function(h){
      if(h.getAttribute("data-tts")==="1"&&h.querySelector(".tts-ctl"))return;
      if(h.closest(FORA))return;
      var ctl=controle(function(){return a[1](h);},function(){
        if(h.tagName==="ARTICLE"){var w=h.querySelector(".who");return w?w.textContent:"";}
        if(h.tagName==="SUMMARY"){var c0=h.cloneNode(true);[].forEach.call(c0.querySelectorAll("button,.tts-ctl,svg,.dob-n"),function(x){x.remove();});
          return c0.textContent.charAt(0)+c0.textContent.slice(1).toLowerCase();}
        var c=h.cloneNode(true);[].forEach.call(c.querySelectorAll("button,.tts-ctl,svg"),function(x){x.remove();});
        return c.textContent;});
      if(a[2]==="cabeca"){var cab=h.querySelector(".f-h");if(!cab)return;cab.appendChild(ctl);}
      else h.appendChild(ctl);
      h.setAttribute("data-tts","1");
    });
  });
}
function tiraTitulos(){
  document.querySelectorAll(".tts-ctl").forEach(function(c){c.parentNode&&c.parentNode.removeChild(c);});
  document.querySelectorAll("[data-tts]").forEach(function(h){h.removeAttribute("data-tts");});
}
var SVG_SOM='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3.5 8h3l4-3.2v10.4l-4-3.2h-3z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M13.3 7.3a3.9 3.9 0 0 1 0 5.4M15.3 5.3a6.7 6.7 0 0 1 0 9.4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
var SVG_PLAY='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6.5 4.5v11l9-5.5z" fill="currentColor"/></svg>';
var SVG_PAUSA='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4.5h2.8v11H6zM11.2 4.5H14v11h-2.8z" fill="currentColor"/></svg>';
var SVG_PARA='<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="5" y="5" width="10" height="10" rx="1.2" fill="currentColor"/></svg>';
var SVG_CARREGA='<svg viewBox="0 0 20 20" aria-hidden="true" class="tts-gira"><circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="28 14" stroke-linecap="round"/></svg>';

function controle(escopoFn,tituloFn){
  var c=mk("span","tts-ctl");
  var som=mk("span","tts-som");som.innerHTML=SVG_SOM;c.appendChild(som);
  var b=mk("button","tts-b");b.type="button";
  b.innerHTML=SVG_PLAY;
  b.setAttribute("aria-label",T("Ouvir esta seção","Listen to this section"));
  b.title=T("Ouvir esta seção em voz alta","Listen to this section read aloud");
  b.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();Leitor.alterna(c,escopoFn,tituloFn);});
  c.appendChild(b);
  var s=mk("button","tts-s");s.type="button";s.innerHTML=SVG_PARA;s.hidden=true;
  s.setAttribute("aria-label",T("Parar a leitura","Stop reading"));s.title=s.getAttribute("aria-label");
  s.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();Leitor.para();});
  c.appendChild(s);
  return c;
}

/* ---------------- o leitor (um só para a página toda) ---------------- */
var Leitor={
  ctl:null, escopo:null, titulo:"", fila:[], i:0, estado:"parado", exec:0, audio:null, url:null, erro:"", memo:{},
  alterna:function(ctl,escopoFn,tituloFn){
    if(this.ctl===ctl){
      if(this.estado==="tocando"||this.estado==="carregando"){this.pausa();return;}
      if(this.estado==="pausado"){this.continua();return;}
    }
    this.para();
    var esc=escopoFn();if(!esc)return;
    var segs=segmentos(esc);
    /* numa caixa que abre e fecha, o título fica no <summary>, que a leitura
       pula: ele entra aqui, na frente */
    if(esc.tagName==="DETAILS"){var tt=(tituloFn()||"").replace(/\s+/g," ").trim();
      var ja=segs[0]&&segs[0].t.toLowerCase().indexOf(tt.toLowerCase().replace(/[.:]+$/,""))===0;
      if(tt&&!ja)segs.unshift({t:tt+".",lg:EN?"en":"pt"});}
    if(!segs.length){this.aviso(T("Esta seção não tem texto para ler.","This section has no text to read."));return;}
    this.ctl=ctl;this.escopo=esc;this.titulo=(tituloFn()||"").replace(/\s+/g," ").trim();
    this.fila=pedacos(segs);this.i=0;this.erro="";this.memo={};
    esc.classList.add("tts-lendo");
    this.continua();
  },
  continua:function(){
    this.estado="tocando";this.exec++;
    trilha(true);
    this.pinta();
    if(internet())this.rodaInternet(this.exec);else this.rodaNativo(this.exec);
  },
  pausa:function(){
    this.estado="pausado";this.exec++;
    if(this.audio){try{this.audio.pause();}catch(e){}}
    if("speechSynthesis" in window){try{speechSynthesis.cancel();}catch(e){}}
    if(this._paraNativo)this._paraNativo();
    trilha(false);this.pinta();
  },
  para:function(){
    this.exec++;
    if(this.audio){try{this.audio.pause();}catch(e){}this.audio=null;}
    if(this.url){try{URL.revokeObjectURL(this.url);}catch(e){}this.url=null;}
    if("speechSynthesis" in window){try{speechSynthesis.cancel();}catch(e){}}
    if(this._paraNativo)this._paraNativo();
    if(this.escopo)this.escopo.classList.remove("tts-lendo");
    var velho=this.ctl;
    this.ctl=null;this.escopo=null;this.estado="parado";this.fila=[];this.i=0;
    trilha(false);
    if(velho)pintaCtl(velho,"parado");
    this.pinta();
  },
  fim:function(){this.para();},
  rodaNativo:async function(ex){
    while(this.exec===ex&&this.i<this.fila.length){
      var p=this.fila[this.i];
      this.pinta();
      var r=await falaNativa(p.t,p.lg);
      if(this.exec!==ex)return;
      if(r==="sem-voz"){this.erro=T("Este navegador não tem voz embutida. Escolha uma voz de internet em Configurações.","This browser has no built-in voice. Choose an online voice in Settings.");this.pausa();return;}
      this.i++;
    }
    if(this.exec===ex)this.fim();
  },
  pegaAudio:function(i){
    var self=this;
    if(self.memo[i])return self.memo[i];
    var t=self.fila[i].t, k=Guarda.chave(t);
    self.memo[i]=Guarda.pega(k).then(function(b){
      if(b)return b;
      return geraAudio(t).then(function(bl){Guarda.guarda(k,bl);return bl;});
    });
    self.memo[i].catch(function(){delete self.memo[i];});
    return self.memo[i];
  },
  rodaInternet:async function(ex){
    var self=this;
    while(self.exec===ex&&self.i<self.fila.length){
      /* se o áudio deste trecho já estava tocando e só foi pausado, continua dele */
      if(self.audio&&self.audio.__i===self.i&&self.audio.paused&&self.audio.currentTime>0){
        await tocaAudio(self.audio,ex);if(self.exec!==ex)return;self.i++;continue;}
      self.estado="carregando";self.pinta();
      var blob;
      try{blob=await self.pegaAudio(self.i);}
      catch(e){if(self.exec!==ex)return;
        /* "Agora não" no PIN do cofre (2.5.1): o resto desta leitura segue com a voz do aparelho, sem a chave */
        if(e&&e.trancado){self.erro=T("O cofre continua trancado: a leitura segue com a voz do aparelho.","The vault is still locked: reading continues with the device voice.");
          self.fila=pedacos(self.fila.slice(self.i),true);self.i=0;self.memo={};self.estado="tocando";self.pinta();return self.rodaNativo(ex);}
        self.erro=e.message||String(e);self.estado="pausado";trilha(false);self.pinta();return;}
      if(self.exec!==ex)return;
      /* baixa os dois próximos enquanto este toca */
      for(var j=1;j<=2;j++)if(self.i+j<self.fila.length)self.pegaAudio(self.i+j).catch(function(){});
      if(self.url){try{URL.revokeObjectURL(self.url);}catch(e){}}
      self.url=URL.createObjectURL(blob);
      var a=new Audio(self.url);a.__i=self.i;a.playbackRate=Math.max(.5,Math.min(2,+P.vel||1));
      self.audio=a;self.estado="tocando";self.pinta();
      await tocaAudio(a,ex);
      if(self.exec!==ex)return;
      self.i++;self.pinta();
    }
    if(self.exec===ex)self.fim();
  },
  baixaTudo:async function(){
    var self=this,ex=self.exec;
    for(var i=0;i<self.fila.length;i++){
      if(self.exec!==ex&&self.estado==="parado")return;
      try{await self.pegaAudio(i);}catch(e){self.erro=e.message||String(e);self.pinta();return;}
      self.pinta();
    }
  },
  aviso:function(msg){this.erro=msg;this.pinta(true);},
  pinta:function(soAviso){barra(this,soAviso);if(this.ctl)pintaCtl(this.ctl,this.estado);}
};
function tocaAudio(a,ex){
  return new Promise(function(res){
    var ok=false;function fim(){if(ok)return;ok=true;res();}
    a.onended=fim;a.onerror=fim;
    var vig=setInterval(function(){if(Leitor.exec!==ex){clearInterval(vig);fim();}},250);
    var p=a.play();if(p&&p.catch)p.catch(function(){clearInterval(vig);Leitor.erro=T("O navegador bloqueou o som. Toque em ▶ de novo.","The browser blocked the sound. Tap ▶ again.");Leitor.pausa();fim();});
    a.addEventListener("ended",function(){clearInterval(vig);});
  });
}
function pintaCtl(ctl,estado){
  var b=ctl.querySelector(".tts-b"),s=ctl.querySelector(".tts-s");
  var on=estado!=="parado";
  ctl.classList.toggle("on",on);
  if(s)s.hidden=!on;
  if(!b)return;
  if(estado==="tocando"){b.innerHTML=SVG_PAUSA;b.setAttribute("aria-label",T("Pausar a leitura","Pause reading"));b.setAttribute("aria-pressed","true");}
  else if(estado==="carregando"){b.innerHTML=SVG_CARREGA;b.setAttribute("aria-label",T("Preparando a voz — tocar para pausar","Preparing the voice — tap to pause"));b.setAttribute("aria-pressed","true");}
  else if(estado==="pausado"){b.innerHTML=SVG_PLAY;b.setAttribute("aria-label",T("Continuar a leitura","Resume reading"));b.setAttribute("aria-pressed","false");}
  else{b.innerHTML=SVG_PLAY;b.setAttribute("aria-label",T("Ouvir esta seção","Listen to this section"));b.removeAttribute("aria-pressed");}
  b.title=b.getAttribute("aria-label");
}
/* a trilha sonora baixa de volume enquanto a voz fala, e volta depois */
function trilha(falando){
  if(!P.abaixarTrilha||!window.somVolume)return;
  try{window.somVolume(falando?0.06:null);}catch(e){}
}

/* ---------------- barra flutuante ---------------- */
var BAR=null;
function barra(L,soAviso){
  if(!BAR){
    BAR=mk("div","tts-bar");BAR.setAttribute("role","region");
    BAR.setAttribute("aria-label",T("Leitura em voz alta","Read aloud"));
    BAR.innerHTML='<div class="tts-l1"><button type="button" class="tts-bb tts-pp"></button>'+
      '<button type="button" class="tts-tit"></button><span class="tts-pos"></span>'+
      '<button type="button" class="tts-bb tts-x"></button></div>'+
      '<div class="tts-l2"><span class="tts-st" aria-live="polite"></span></div>';
    document.body.appendChild(BAR);
    BAR.querySelector(".tts-pp").addEventListener("click",function(){
      if(Leitor.estado==="pausado")Leitor.continua();else if(Leitor.estado!=="parado")Leitor.pausa();});
    BAR.querySelector(".tts-x").addEventListener("click",function(){Leitor.erro="";Leitor.para();BAR.classList.remove("on");});
    BAR.querySelector(".tts-x").innerHTML=SVG_PARA;
    BAR.querySelector(".tts-x").setAttribute("aria-label",T("Parar e fechar","Stop and close"));
    BAR.querySelector(".tts-tit").addEventListener("click",function(){
      if(Leitor.escopo&&Leitor.escopo.scrollIntoView)Leitor.escopo.scrollIntoView({behavior:"smooth",block:"start"});});
  }
  var ativo=L.estado!=="parado";
  BAR.classList.toggle("on",ativo||!!L.erro);
  var pp=BAR.querySelector(".tts-pp");
  pp.hidden=!ativo;
  pp.innerHTML=L.estado==="pausado"?SVG_PLAY:(L.estado==="carregando"?SVG_CARREGA:SVG_PAUSA);
  pp.setAttribute("aria-label",L.estado==="pausado"?T("Continuar","Resume"):T("Pausar","Pause"));
  BAR.querySelector(".tts-tit").textContent=ativo?(L.titulo||T("Leitura","Reading")):T("Leitura em voz alta","Read aloud");
  BAR.querySelector(".tts-pos").textContent=ativo&&L.fila.length?((Math.min(L.i+1,L.fila.length))+"/"+L.fila.length):"";
  var st=BAR.querySelector(".tts-st");st.textContent="";
  if(L.erro){
    st.appendChild(mk("span","tts-err",L.erro));
    var ac=mk("span","tts-acoes");
    var bc=mk("button","tts-lk",T("Abrir Configurações","Open Settings"));bc.type="button";
    bc.addEventListener("click",function(){var b=document.getElementById("cfg-b");if(b)b.click();
      setTimeout(function(){var s=document.getElementById("tts-cfg");if(s&&s.scrollIntoView)s.scrollIntoView({block:"start"});},120);});
    ac.appendChild(bc);
    if(internet()&&ativo){
      var bn=mk("button","tts-lk",T("Ouvir com a voz do aparelho","Use the device voice"));bn.type="button";
      bn.addEventListener("click",function(){P.motor="nativo";grava();Leitor.erro="";Leitor.fila=pedacos(segmentos(Leitor.escopo));Leitor.i=0;Leitor.memo={};Leitor.continua();});
      ac.appendChild(bn);}
    st.appendChild(ac);
    return;
  }
  if(!ativo)return;
  if(internet()){
    /* 🔴🟡🟢: quanto do áudio desta seção já está guardado no aparelho */
    var fila=L.fila;
    Promise.all(fila.map(function(p){return Guarda.existe(Guarda.chave(p.t));})).then(function(r){
      if(Leitor.fila!==fila)return;
      var n=r.filter(Boolean).length,tot=fila.length;
      st.textContent="";
      var cor=n>=tot?"🟢":(n?"🟡":"🔴");
      st.appendChild(mk("span",null,cor+" "+(n>=tot?T("áudio todo guardado — toca sem internet","all audio saved — plays offline")
        :(n+" "+T("de","of")+" "+tot+" "+T("trechos guardados neste aparelho","parts saved on this device")))));
      if(n<tot){var bd=mk("button","tts-lk",T("Baixar a seção toda","Download the whole section"));bd.type="button";
        bd.addEventListener("click",function(){bd.disabled=true;Leitor.baixaTudo();});st.appendChild(bd);}
    });
  } else {
    st.textContent=T("Voz do aparelho","Device voice")+(EN?" · "+T("citações em português","quotes in Portuguese"):"");
  }
}

/* ---------------- Configurações → Leitura em voz alta ---------------- */
function chip(txt,on,fn){var b=mk("button","chip-cat"+(on?" on":""),txt);b.type="button";
  b.setAttribute("aria-pressed",on?"true":"false");b.addEventListener("click",fn);return b;}
function campo(rot,el){var w=mk("label","tts-f");w.appendChild(mk("span","tts-fr",rot));w.appendChild(el);return w;}
function entrada(tipo,valor,ph,fn){var i=mk("input","tts-in");i.type=tipo;i.value=valor||"";if(ph)i.placeholder=ph;
  i.autocomplete="off";i.spellcheck=false;i.addEventListener("input",function(){fn(i.value.trim());});return i;}
function selecao(opcoes,valor,fn){var s=mk("select","tts-in");
  opcoes.forEach(function(o){var op=mk("option",null,o[1]);op.value=o[0];s.appendChild(op);});
  s.value=valor;s.addEventListener("change",function(){fn(s.value);});return s;}
function botao(txt,fn,cls){var b=mk("button",cls||"zap",txt);b.type="button";b.addEventListener("click",fn);return b;}
function nota(txt){return mk("p","oc-nota",txt);}

function painel(host){
  var velho=document.getElementById("tts-cfg");
  var s=mk("div","oc-sec tts-cfg");s.id="tts-cfg";
  s.appendChild(mk("span","oc-rot",T("Leitura em voz alta","Read aloud")));
  function repinta(){var n=painel(null);if(s.parentNode){s.parentNode.replaceChild(n,s);ligaDigital(n);}}
  /* o cofre.js só desenha o painel da digital num elemento que já está na página: chamado depois de encaixar a seção */
  function ligaDigital(sec){var e=sec.__digital;if(e&&e.isConnected&&window.SolverCofre)SolverCofre.painelDigital(e);}

  var l0=mk("div","oc-linha");
  l0.appendChild(chip(T("mostrar botões ▶ nos títulos","show ▶ buttons on headings"),P.icones,function(){
    P.icones=!P.icones;grava();if(P.icones)marcaTitulos();else{Leitor.para();tiraTitulos();}repinta();}));
  s.appendChild(l0);

  s.appendChild(mk("p","tts-sub",T("Voz","Voice")));
  var l1=mk("div","oc-linha");
  [["nativo",T("Voz do aparelho · grátis","Device voice · free")],
   ["gemini",T("Gemini · natural, grátis na cota","Gemini · natural, free quota")],
   ["openai",T("OpenAI · pago","OpenAI · paid")],
   ["elevenlabs",T("ElevenLabs · pago","ElevenLabs · paid")]].forEach(function(o){
    l1.appendChild(chip(o[1],P.motor===o[0],function(){Leitor.para();P.motor=o[0];grava();repinta();}));});
  s.appendChild(l1);

  var box=mk("div","tts-box");s.appendChild(box);
  /* campo da chave: ela mora no cofre; aqui só se cola uma nova (grava só no cofre) */
  function campoChave(prov,rotulo,ph,rotuloCampo){
    var guardada=temChave(prov);
    if(guardada)box.appendChild(nota(T("🔐 Guardado no cofre","🔐 Saved in the vault")));
    var i=entrada("password","",guardada?T("Colar outra chave para trocar","Paste another key to replace it"):ph,function(){});
    i.setAttribute("data-sj-texto","");   /* a chave colada e ainda não guardada conta como texto digitado: a janela pergunta "Descartar?" */
    box.appendChild(campo(rotuloCampo,i));
    var aviso=nota("");box.appendChild(aviso);
    box.appendChild(botao(T("🔐 Guardar no cofre","🔐 Save in the vault"),function(){
      var v=i.value.trim();if(!v){aviso.textContent=T("Cole a chave primeiro","Paste the key first");return;}
      if(!window.SolverCofre){aviso.textContent=T("O cofre não carregou. Recarregue a página.","The vault did not load. Reload the page.");return;}
      SolverCofre.gravar(NOME_COFRE[prov],v,{motivo:{pt:"Para guardar a chave do "+rotulo+", digite o PIN do cofre (ou crie um).",en:"To save the "+rotulo+" key, type the vault PIN (or create one)."}})
        .then(function(){i.value="";repinta();})
        .catch(function(){aviso.textContent=T("A chave não foi guardada: o cofre continua trancado.","The key was not saved: the vault is still locked.");});}));
  }
  if(P.motor==="nativo"){
    var diag=mk("p","oc-nota tts-diag");
    function opcoesVoz(lg){
      var nota=function(v){return (lg==="en"?(ehENUS(v)?3:(ehEN(v)?2:0)):(ehPTBR(v)?3:(ehPT(v)?2:0)))+(natural(v)?1:0);};
      var L=vozes.slice().sort(function(a,b){return nota(b)-nota(a)||a.name.localeCompare(b.name);});
      return [[PADRAO_APARELHO,T("🔧 Padrão do aparelho (o mecanismo escolhido nas Configurações do sistema)","🔧 Device default (the engine chosen in system settings)")]]
        .concat(L.map(function(v){var certo=lg==="en"?ehEN(v):ehPT(v);
          return [v.voiceURI,(natural(v)?"⭐ ":"")+v.name+" — "+v.lang+(certo?" ✅":"")];}));
    }
    var sPT=null,sEN=null;
    function monta(){
      box.textContent="";
      sPT=selecao(opcoesVoz("pt"),P.vozPT||PADRAO_APARELHO,function(v){P.vozPT=v;grava();});
      box.appendChild(campo(EN?T("Voz em português (citações dos planos)","Portuguese voice (quotes from the plans)"):T("Voz","Voice"),sPT));
      if(EN){sEN=selecao(opcoesVoz("en"),P.vozEN||PADRAO_APARELHO,function(v){P.vozEN=v;grava();});
        box.appendChild(campo(T("Voz em inglês","English voice"),sEN));}
      var pt=vozes.filter(ehPT).length,en=vozes.filter(ehEN).length;
      var mot=[];vozes.forEach(function(v){var m=motorDe(v);if(m&&mot.indexOf(m)<0)mot.push(m);});
      diag.textContent=vozes.length
        ? T("O navegador enxerga "+vozes.length+" voz(es), "+pt+" em português","The browser sees "+vozes.length+" voice(s), "+pt+" in Portuguese")+
          (EN?T(" e "+en+" em inglês"," and "+en+" in English"):"")+(mot.length?" · "+T("mecanismos","engines")+": "+mot.join(", "):"")+"."
        : T("O navegador ainda não devolveu nenhuma voz. Toque em Recarregar vozes; se continuar vazio, feche o navegador de vez e abra de novo.",
            "The browser has not returned any voice yet. Tap Reload voices; if it stays empty, close the browser completely and open it again.");
      box.appendChild(diag);
      var lb=mk("div","oc-linha");
      lb.appendChild(botao(T("🔄 Recarregar vozes","🔄 Reload voices"),function(){carregaVozes();setTimeout(carregaVozes,700);}));
      lb.appendChild(botao(T("❓ Instalei uma voz e ela não aparece","❓ I installed a voice and it does not show"),function(){EJ.aPartirDe(document.getElementById("cfg"),ajudaVozes,PG.abreConfig);}));
      box.appendChild(lb);
      box.appendChild(nota(T("⭐ = voz que parece natural. ✅ = no idioma certo. No computador, o Microsoft Edge traz vozes naturais em português; no Android, o caminho é instalar um mecanismo melhor (SherpaTTS, grátis) e deixar aqui em Padrão do aparelho.",
        "⭐ = natural-sounding voice. ✅ = right language. On a computer, Microsoft Edge offers natural voices; on Android, install a better engine (SherpaTTS, free) and leave this on Device default.")));
      var rv=mk("input");rv.type="range";rv.min="0.6";rv.max="1.6";rv.step="0.05";rv.value=P.vel;
      var lv=mk("span","tts-val",(+P.vel).toFixed(2)+"×");
      rv.addEventListener("input",function(){P.vel=+rv.value;lv.textContent=(+P.vel).toFixed(2)+"×";grava();});
      var fv=campo(T("Velocidade","Speed"),rv);fv.appendChild(lv);box.appendChild(fv);
      var rt=mk("input");rt.type="range";rt.min="0.6";rt.max="1.5";rt.step="0.05";rt.value=P.tom;
      var lt=mk("span","tts-val",(+P.tom).toFixed(2));
      rt.addEventListener("input",function(){P.tom=+rt.value;lt.textContent=(+P.tom).toFixed(2);grava();});
      var ft=campo(T("Tom","Pitch"),rt);ft.appendChild(lt);box.appendChild(ft);
    }
    monta();
    var ouve=function(){if(!document.body.contains(box)){ouvintesVozes.splice(ouvintesVozes.indexOf(ouve),1);return;}
      var a=document.activeElement;if(a&&box.contains(a)&&a.tagName!=="BUTTON")return;monta();};
    ouvintesVozes.push(ouve);
    carregaVozes();
  } else if(P.motor==="gemini"){
    box.appendChild(nota(T("Voz natural, de graça dentro da cota do Google. A chave se cria em aistudio.google.com/apikey — é a mesma que o Contador de Histórias usa.",
      "Natural voice, free within Google's quota. Create the key at aistudio.google.com/apikey — the same one the Story Teller uses.")));
    campoChave("gemini","Gemini","AIza… / AQ.…",T("Chave do Gemini","Gemini key"));
    box.appendChild(campo(T("Voz","Voice"),selecao(VOZES_GEMINI.map(function(v){return [v[0],v[0]+" — "+v[1]];}),P.geminiVoz,function(v){P.geminiVoz=v;grava();})));
    var mods=[["gemini-3.1-flash-tts-preview","3.1 Flash TTS"],["gemini-2.5-flash-preview-tts","2.5 Flash TTS"],["gemini-2.5-pro-preview-tts","2.5 Pro TTS"]];
    if(!mods.some(function(m){return m[0]===P.geminiModelo;}))mods.unshift([P.geminiModelo,P.geminiModelo]);
    var sm=selecao(mods,P.geminiModelo,function(v){P.geminiModelo=v;grava();});
    box.appendChild(campo(T("Modelo","Model"),sm));
    /* modelos mudam de nome: a lista vem da própria chave */
    box.appendChild(botao(T("🔄 Ver os modelos de voz que a minha chave aceita","🔄 List the voice models my key accepts"),async function(){
      var b=this;var k="";try{k=await chaveCofre("gemini","Gemini");}catch(e){}
      if(!k){b.textContent=T("Guarde a chave primeiro","Save the key first");return;}
      b.disabled=true;
      try{var r=await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200",{headers:{"x-goog-api-key":k}});
        if(!r.ok)throw erroHttp("Gemini",r.status,"");
        var j=await r.json();
        var L=(j.models||[]).map(function(m){return String(m.name||"").replace(/^models\//,"");}).filter(function(n){return /tts/i.test(n);});
        if(!L.length)throw new Error(T("A chave não devolveu nenhum modelo de voz.","The key returned no voice model."));
        sm.textContent="";L.forEach(function(n){var o=mk("option",null,n);o.value=n;sm.appendChild(o);});
        if(L.indexOf(P.geminiModelo)<0){P.geminiModelo=L[0];grava();}
        sm.value=P.geminiModelo;b.textContent="✓ "+L.length+" "+T("modelos","models");
      }catch(e){b.textContent=(e.message||String(e)).slice(0,120);}
      b.disabled=false;}));
    var ii=entrada("text",P.geminiInstr,instrucao(),function(v){P.geminiInstr=v;grava();});
    box.appendChild(campo(T("Como ela deve ler (opcional)","How it should read (optional)"),ii));
  } else if(P.motor==="openai"){
    box.appendChild(nota(T("Pago por uso. Crie a chave em platform.openai.com → API keys.","Pay per use. Create the key at platform.openai.com → API keys.")));
    campoChave("openai","OpenAI","sk-…",T("Chave da OpenAI","OpenAI key"));
    box.appendChild(campo(T("Voz","Voice"),selecao(VOZES_OPENAI.map(function(v){return [v,v];}),P.openaiVoz,function(v){P.openaiVoz=v;grava();})));
    box.appendChild(campo(T("Modelo","Model"),selecao([["gpt-4o-mini-tts","gpt-4o-mini-tts"],["tts-1","tts-1"],["tts-1-hd","tts-1-hd"]],P.openaiModelo,function(v){P.openaiModelo=v;grava();})));
  } else {
    box.appendChild(nota(T("Pago, a voz mais natural. Crie a chave em elevenlabs.io → Profile → API Key.","Paid, the most natural voice. Create the key at elevenlabs.io → Profile → API Key.")));
    campoChave("elevenlabs","ElevenLabs","sk_…",T("Chave da ElevenLabs","ElevenLabs key"));
    var sv=selecao(P.elevenVoz?[[P.elevenVoz,P.elevenVoz]]:[["",T("— carregue as vozes —","— load the voices —")]],P.elevenVoz,function(v){P.elevenVoz=v;grava();});
    box.appendChild(campo(T("Voz","Voice"),sv));
    box.appendChild(botao(T("🔄 Carregar minhas vozes","🔄 Load my voices"),async function(){
      var b=this;var k="";try{k=await chaveCofre("elevenlabs","ElevenLabs");}catch(e){}
      if(!k){b.textContent=T("Guarde a chave primeiro","Save the key first");return;}
      b.disabled=true;
      try{var r=await fetch("https://api.elevenlabs.io/v1/voices",{headers:{"xi-api-key":k}});
        if(!r.ok)throw erroHttp("ElevenLabs",r.status,"");
        var j=await r.json();sv.textContent="";
        (j.voices||[]).forEach(function(v){var o=mk("option",null,v.name);o.value=v.voice_id;sv.appendChild(o);});
        if(!P.elevenVoz&&j.voices&&j.voices[0]){P.elevenVoz=j.voices[0].voice_id;grava();}
        sv.value=P.elevenVoz;b.textContent="✓";
      }catch(e){b.textContent=(e.message||String(e)).slice(0,120);}
      b.disabled=false;}));
    box.appendChild(campo(T("Modelo","Model"),selecao([["eleven_multilingual_v2","Multilingual v2"],["eleven_turbo_v2_5","Turbo v2.5"],["eleven_flash_v2_5","Flash v2.5"]],P.elevenModelo,function(v){P.elevenModelo=v;grava();})));
  }

  if(P.motor!=="nativo"&&window.SolverCofre&&SolverCofre.aberto()){
    var lc=mk("div","oc-linha");
    lc.appendChild(botao(T("🔒 Trancar o cofre agora","🔒 Lock the vault now"),function(){SolverCofre.trancar().then(repinta);}));
    s.appendChild(lc);
  }
  /* painel da digital do cofre: o desenho é do próprio cofre.js, aqui só se reserva o lugar */
  if(window.SolverCofre&&SolverCofre.existe()){
    s.appendChild(mk("p","tts-sub",T("Cofre de chaves","Key vault")));
    var dgt=mk("div","tts-cofre-digital");dgt.id="tts-cofre-digital";s.appendChild(dgt);s.__digital=dgt;
  }

  var lt2=mk("div","oc-linha");
  var bt=botao(T("▶ Testar a voz","▶ Test the voice"),async function(){
    var frase=T("Este é um teste de leitura em voz alta dos planos de governo.","This is a read-aloud test for the government plans. E esta frase é lida em português.");
    Leitor.para();bt.disabled=true;
    try{
      if(!internet()){
        if(EN){await falaNativa("This is a read-aloud test for the government plans.","en");await falaNativa("E esta frase é lida em português.","pt");}
        else await falaNativa(frase,"pt");
      } else {
        var blob=await geraAudio(frase);var u=URL.createObjectURL(blob);var a=new Audio(u);
        a.onended=function(){URL.revokeObjectURL(u);};await a.play();
      }
    }catch(e){Leitor.aviso(e.message||String(e));}
    bt.disabled=false;},"chip-cat");
  lt2.appendChild(bt);
  s.appendChild(lt2);

  if(internet()){
    var g=nota("…");s.appendChild(g);
    Guarda.quanto().then(function(q){var mb=q.bytes/1048576;
      g.textContent=q.n?T(q.n+" trechos de voz guardados neste navegador ("+(mb<1?Math.round(q.bytes/1024)+" KB":mb.toFixed(1)+" MB")+"). Eles tocam na hora, sem gastar cota.",
                          q.n+" voice parts saved in this browser ("+(mb<1?Math.round(q.bytes/1024)+" KB":mb.toFixed(1)+" MB")+"). They play instantly, without using quota.")
        :T("Nenhum áudio guardado ainda. Cada trecho ouvido fica guardado para a próxima vez.","No audio saved yet. Each part you listen to is saved for next time.");
      if(q.n){var bl=botao(T("Apagar áudios guardados","Delete saved audio"),function(){Guarda.limpa().then(repinta);});s.insertBefore(bl,g.nextSibling);}
    });
  }

  if(window.somVolume){
    var l3=mk("div","oc-linha");
    l3.appendChild(chip(T("abaixar a trilha sonora enquanto lê","lower the soundtrack while reading"),P.abaixarTrilha,function(){
      P.abaixarTrilha=!P.abaixarTrilha;grava();repinta();}));
    s.appendChild(l3);
  }

  s.appendChild(nota(T("O ▶ ao lado de cada título lê aquela seção; tocar de novo pausa e o ■ para. Tabelas e gráficos não são lidos — só o texto. "+
    "Com Gemini, OpenAI ou ElevenLabs, o texto da seção (que já é público) vai para o serviço escolhido, usando a chave de quem ouve; a chave fica trancada no cofre, só neste navegador, e não é enviada a mais ninguém.",
    "The ▶ next to each heading reads that section; tap again to pause, and ■ stops. Tables and charts are not read — only text. "+
    "With Gemini, OpenAI or ElevenLabs, the section's text (already public) is sent to the chosen service using the listener's own key; the key stays locked in the vault, in this browser only, and is sent nowhere else.")));

  if(host){if(velho&&velho.parentNode)velho.parentNode.removeChild(velho);host.appendChild(s);ligaDigital(s);}
  return s;
}

/* ---------------- ajuda: voz instalada que o site não vê ---------------- */
function ajudaVozes(voltar){
  var d=document.getElementById("tts-dlg");
  if(!d){d=mk("div","cfg");d.id="tts-dlg";d.hidden=true;
    d.innerHTML='<div class="cfg-h"><h3></h3><button class="cfg-x" type="button">×</button></div><div class="cfg-b"></div>';
    document.body.appendChild(d);
    d.querySelector(".cfg-x").setAttribute("aria-label",T("Fechar","Close"));
    d.querySelector(".cfg-x").addEventListener("click",function(){EJ.fecha(d);});}
  d.querySelector("h3").textContent=T("Instalei uma voz e o site não vê","I installed a voice and the site does not see it");
  var c=d.querySelector(".cfg-b");c.textContent="";
  (EN?[
    "The site can only use the voices the browser hands over. On Android, the browser only sees the default engine chosen in system Settings — and keeps that list until it is fully closed.",
    "1. Settings → search for “text-to-speech” (on Samsung it may show as Samsung text-to-speech settings; it is not TalkBack).",
    "2. Under Preferred engine, choose the new engine (SherpaTTS, Google, Samsung or Acapela). Tap Play and check that the sample uses the new voice.",
    "3. Close the browser completely: Settings → Apps → Chrome (or Edge) → Force stop. Reloading the page is not enough.",
    "4. Open the site again → Settings → Read aloud → 🔄 Reload voices.",
    "5. If the new voice shows in the list, pick it. If it does not, leave it on 🔧 Device default: the site asks for the language without choosing a voice, and Android answers with the default engine — now the new one.",
    "6. Tap ▶ Test the voice. If the old voice still plays, restart the phone once.",
    "Edge's “Natural” desktop voices do not exist on Android — Microsoft does not offer them to websites on phones. On Android the path is the system engine."
  ]:[
    "O site só consegue usar as vozes que o navegador entrega. No Android, o navegador só enxerga o mecanismo padrão escolhido nas Configurações do sistema — e guarda essa lista até ser fechado de vez.",
    "1. Configurações → procure “conversão de texto em voz” (na Samsung pode aparecer como Configurações de Leitura de texto Samsung; não é o TalkBack).",
    "2. Em Mecanismo preferido, escolha o motor novo (SherpaTTS, Google, Samsung ou Acapela). Toque em Reproduzir e confira que a amostra sai com a voz nova.",
    "3. Feche o navegador de vez: Configurações → Aplicativos → Chrome (ou Edge) → Forçar parada. Só recarregar a página não basta.",
    "4. Abra o site de novo → Configurações → Leitura em voz alta → 🔄 Recarregar vozes.",
    "5. Se a voz nova aparecer na lista, escolha-a. Se não aparecer, deixe em 🔧 Padrão do aparelho: o site pede o idioma sem escolher voz, e o Android responde com o mecanismo padrão — que agora é o novo.",
    "6. Toque em ▶ Testar a voz. Se ainda sair a voz antiga, reinicie o celular uma vez.",
    "As vozes “Naturais” do Edge de computador não existem no Android — a Microsoft não as libera para sites no celular. No Android, o caminho é o mecanismo do sistema."
  ]).forEach(function(p){c.appendChild(mk("p","sb-p",p));});
  EJ.abre(d,{aoFechar:function(){if(voltar)EJ.quando(voltar);}});
}

/* ---------------- ligar tudo ---------------- */
window.VozPainel=painel;
window.VozLeitor=Leitor;
var agendado=null;
function agenda(){if(agendado)return;agendado=setTimeout(function(){agendado=null;marcaTitulos();},250);}
function inicia(){
  marcaTitulos();
  /* o site redesenha cartões e gráficos ao filtrar e trocar de aba: os
     botões voltam sozinhos nos títulos novos */
  try{new MutationObserver(function(ms){
    for(var i=0;i<ms.length;i++){var t=ms[i].target;
      if(t&&t.closest&&t.closest(".tts-bar,.tts-ctl,#tts-cfg"))continue;agenda();return;}
  }).observe(document.body,{childList:true,subtree:true});}catch(e){}
  /* trocar de aba (hash) ou fechar a página para a leitura */
  addEventListener("hashchange",function(){if(Leitor.escopo&&!document.body.contains(Leitor.escopo))Leitor.para();});
  addEventListener("pagehide",function(){try{speechSynthesis.cancel();}catch(e){}});
  document.addEventListener("keydown",function(e){if(e.key==="Escape"&&Leitor.estado!=="parado"&&!document.querySelector("dialog[open]"))Leitor.pausa();});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",inicia);else inicia();
})();
