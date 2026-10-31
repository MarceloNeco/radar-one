/* principal.js: infográficos, comparadores, índice, planos, glossário, configurações (bloco 5)
   Movido como está do index.html 2.5.4 no F1-PR3 (31/10/2026): mesmo código, mesmos nomes; o que sai daqui para fora é só window.X (ver docs/modulos-contrato.md). */
(function(){
"use strict";
var D=JSON.parse(document.getElementById("dados").textContent);
var RAMP=["var(--c1)","var(--c2)","var(--c3)","var(--c4)","var(--c5)","var(--c6)","var(--c7)","var(--c8)"];
var SEQ=["var(--s0)","var(--s100)","var(--s200)","var(--s300)","var(--s400)","var(--s500)","var(--s600)","var(--s700)"];
var CAND={},MACRO={},ORD={};

/* ---------- preferências locais (ordem e cor) ----------
   Ficam só no navegador de quem abre a página: não mudam o site publicado
   nem o que outra pessoa vê. */
var PREFS_K="planos2026:prefs";
function lePrefs(){
  try{var t=localStorage.getItem(PREFS_K);return t?(JSON.parse(t)||{}):{};}catch(e){return {};}
}
function gravaPrefs(){
  try{localStorage.setItem(PREFS_K,JSON.stringify(PREFS));return true;}catch(e){return false;}
}
var PREFS=lePrefs();
/* mostrar fotos? mesma regra usada nos infográficos, disponível em todo o
   arquivo para que a ficha do Currículo respeite a mesma preferência */
function verFotos(){
  var estr=(window.matchMedia&&window.matchMedia("(max-width: 780px)").matches);
  return (PREFS.fotos!==undefined)?!!PREFS.fotos:!estr;
}
if(!PREFS.cores)PREFS.cores={};

var SVG_SOL='<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="4" fill="none" '+
  'stroke="currentColor" stroke-width="1.6"/><path d="M10 1.6v2.2M10 16.2v2.2M1.6 10h2.2M16.2 10h2.2'+
  'M4.1 4.1l1.6 1.6M14.3 14.3l1.6 1.6M15.9 4.1l-1.6 1.6M5.7 14.3l-1.6 1.6" stroke="currentColor" '+
  'stroke-width="1.6" stroke-linecap="round"/></svg>';
var SVG_LUA='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M16.5 12.4A7 7 0 0 1 7.6 3.5'+
  'a7 7 0 1 0 8.9 8.9z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
var SVG_ENG='<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="2.6" fill="none" '+
  'stroke="currentColor" stroke-width="1.6"/><path d="M10 1.8l1 2.1 2.3-.5.6 2.3 2.3.6-.5 2.3 2.1 1'+
  '-2.1 1 .5 2.3-2.3.6-.6 2.3-2.3-.5-1 2.1-1-2.1-2.3.5-.6-2.3-2.3-.6.5-2.3-2.1-1 2.1-1-.5-2.3 2.3-.6'+
  '.6-2.3 2.3.5z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>';


var SVG_SOM_ON='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 8h3l4-3.2v10.4L7 12H4z" '+
  'fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>'+
  '<path d="M13.4 7.2a4 4 0 0 1 0 5.6M15.4 5.2a6.8 6.8 0 0 1 0 9.6" fill="none" '+
  'stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
var SVG_SOM_OFF='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 8h3l4-3.2v10.4L7 12H4z" '+
  'fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>'+
  '<path d="M13.6 8.2l3.6 3.6M17.2 8.2l-3.6 3.6" fill="none" stroke="currentColor" '+
  'stroke-width="1.4" stroke-linecap="round"/></svg>';

/* ---------- trilha sonora ----------
   Arquivo separado, não embutido: um mp3 dentro do HTML o deixaria vários MB
   maior e todo mundo pagaria o download, inclusive quem nunca liga o som.
   preload="none" garante que nada é baixado antes de o visitante pedir.
   Se o arquivo não existir no servidor, o botão simplesmente não aparece. */
var TRILHA_ARQ="trilha.mp3";
(function(){
  var btn=document.getElementById("som");
  if(!btn)return;
  var au=null, tocando=false, armado=false;
  function cria(){
    if(au)return au;
    au=new Audio();
    au.src=TRILHA_ARQ; au.loop=true; au.preload="none"; au.volume=0.35;
    au.addEventListener("error",function(){
      /* sem arquivo publicado, o botão some em vez de ficar quebrado */
      btn.hidden=true; tocando=false; });
    return au;
  }
  function pinta(){
    btn.innerHTML=tocando?SVG_SOM_ON:SVG_SOM_OFF;
    btn.setAttribute("aria-pressed",tocando?"true":"false");
    btn.title=tocando?"Desligar a trilha sonora":"Ligar a trilha sonora";
  }
  function toca(){
    var a=cria();
    var pr=a.play();
    if(pr&&pr.then){
      pr.then(function(){tocando=true;pinta();})
        .catch(function(){ tocando=false; pinta(); });
    } else { tocando=true; pinta(); }
  }
  function para(){ if(au){au.pause();} tocando=false; pinta(); }
  /* o botão do topo também vale como preferência: quem desliga não ouve de novo na próxima visita */
  btn.addEventListener("click",function(){ if(tocando){para();PREFS.som=false;}else{toca();PREFS.som=true;} gravaPrefs(); if(window.escreveVer)escreveVer(); });
  /* o navegador bloqueia som que começa sozinho: se a preferência é iniciar
     ligada, a trilha espera o primeiro toque ou clique do visitante */
  function arma(){
    if(armado)return; armado=true;
    function umaVez(e){
      if(e&&e.target&&btn.contains(e.target))return;   /* o toque no próprio botão é tratado pelo clique dele */
      document.removeEventListener("pointerdown",umaVez,true);
      document.removeEventListener("keydown",umaVez,true);
      if(!tocando&&PREFS.som!==false)toca();
    }
    document.addEventListener("pointerdown",umaVez,true);
    document.addEventListener("keydown",umaVez,true);
  }
  /* o botão só aparece se o arquivo existir de fato */
  (function(){
    var t=new Audio();
    t.preload="metadata";
    t.addEventListener("loadedmetadata",function(){
      btn.hidden=false; pinta();
      if(PREFS.som!==false){ var a=cria();   /* trilha ligada por padrão; só fica muda para quem desligou */ var pr=a.play();
        if(pr&&pr.then)pr.then(function(){tocando=true;pinta();}).catch(arma);
        else {tocando=true;pinta();} }
    });
    t.addEventListener("error",function(){ btn.hidden=true; });
    t.src=TRILHA_ARQ;
  })();
  window.somPref=function(v){
    PREFS.som=!!v; gravaPrefs();
    if(window.escreveVer)escreveVer();
    if(v&&!tocando&&!btn.hidden)toca();
    if(!v&&tocando)para();
  };
  window.somLigado=function(){return tocando;};
  /* a leitura em voz alta abaixa a trilha enquanto fala; null volta ao normal */
  window.somVolume=function(v){if(au)au.volume=(v==null)?0.35:v;};
})();

/* ---------- idioma ----------
   A interface é traduzida. O CONTEÚDO de origem — citações dos planos, nomes de
   documentos, marcos, processos e verbetes — permanece em português, porque cada
   citação foi conferida caractere a caractere contra o PDF registrado: traduzida,
   deixaria de ser a citação e o site perderia aquilo que ele promete. */
var IDIOMA=window.IDIOMA||"pt";  /* decidido no index.html antes do app.js: ?lang= no endereço, senão a preferência comum dgo:global:idioma (F1-PR4) */
/* separador decimal e abreviações de escala seguem o idioma do arquivo:
   pt-BR usa vírgula e "mil/mi"; en-US usa ponto e "k/M". */
var ENUS=(IDIOMA==="en");
function dec(x){return ENUS?String(x):String(x).replace(".",",");}
var SUF_MIL=ENUS?"k":" mil", SUF_MI=ENUS?"M":" mi";
/* passo redondo para o eixo: dividir a amplitude em partes iguais produz marcas
   como 448 e 1.228, que ninguém lê. Um passo de 1, 2, 2,5 ou 5 vezes potência de
   dez devolve 500, 1.000, 1.500 — número que o leitor reconhece de imediato. */
function passoRedondo(bruto){
  if(!(bruto>0)) return 1;
  var exp=Math.pow(10,Math.floor(Math.log(bruto)/Math.LN10)), f=bruto/exp;
  var m = f<=1?1 : f<=2?2 : f<=2.5?2.5 : f<=5?5 : 10;
  return m*exp;
}
/* marcas redondas cobrindo [a,b], com o zero incluído sempre que a série o cruza */
function marcasRedondas(a,b,alvo){
  if(!(b>a)) return [a];
  var passo=passoRedondo((b-a)/(alvo||5));
  var ini=Math.ceil(a/passo)*passo, out=[];
  for(var v=ini; v<=b+passo*1e-9; v+=passo){
    out.push(Math.abs(v)<passo*1e-9?0:v);
    if(out.length>40) break;
  }
  if(a<0&&b>0&&out.indexOf(0)<0){out.push(0);out.sort(function(x,y){return x-y;});}
  return out;
}
/* unidade que já traz escala — "R$ milhões", "bilhões de reais" — não pode
   receber outra abreviação em cima: "1,2 mil" numa série em milhões faz o
   leitor entender mil reais quando são 1,2 bilhão. "por 100 mil habitantes"
   não conta: ali o "mil" pertence ao denominador, não ao valor. */
var SUF_ESC=ENUS?{3:"k",6:"M",9:"B",12:"T"}:{3:" mil",6:" mi",9:" bi",12:" tri"};
/* multiplicador que a própria unidade já carrega: "R$ milhões" vale 1e6, e um
   eixo em 1.000 unidades dessas é 1 bilhão — é assim que o rótulo passa a dizer
   "1 bi" em vez de "1.000", que o leitor confundiria com mil reais. */
function escalaDaUnidade(u){
  var t=String(u||""), re=/(\S+\s+)?(mil|milh[\u00f5o]es|bilh[\u00f5o]es|trilh[\u00f5o]es)\b/gi, m;
  while((m=re.exec(t))){
    if(/^\d[\d.,]*$/.test((m[1]||"").trim())) continue;   /* "por 100 mil habitantes" */
    var w=m[2].toLowerCase();
    if(w.indexOf("tri")===0) return 1e12;
    if(w.indexOf("bilh")===0) return 1e9;
    if(w.indexOf("milh")===0) return 1e6;
    return 1e3;
  }
  return 1;
}
function unidadeJaEscalada(u){
  var re=/(\S+\s+)?(milh[\u00f5o]es|bilh[\u00f5o]es|trilh[\u00f5o]es|mil)\b/gi, m, t=String(u||"");
  while((m=re.exec(t))){
    var antes=(m[1]||"").trim();
    if(!/^\d[\d.,]*$/.test(antes)) return true;
  }
  return false;
}
var STR={};
var CHAVES={
 "cm-info-escala":"Como a nota vai de 0 a 3:",
 "cm-x-nada":"não mexe em nenhuma das seis dimensões.",
 "cm-x-mais":"mexe mais em",
 "cm-x-todos":"Todos mudam a regra (2 ou mais) em",
 "cm-x-nenhum":"Nenhum deles toca em",
 "cm-x-dif":"A maior diferença está em",
 "cm-x-oposto-1":"Em",
 "cm-x-oposto-2":"os sentidos se opõem:",
 "cm-x-ressalva":"Leitura montada automaticamente a partir das notas da tabela. Mede o tamanho da mudança que cada texto fez, nunca se ela foi boa ou ruim — e marcos de épocas diferentes mexeram em regras que já eram diferentes.",
 "cm-por-intro":"Cada sugestão junta marcos de governos diferentes que mexem na mesma engrenagem. O critério é o assunto do ato e a nota que ele recebeu na dimensão principal — não o resultado que teve.",
 "cm-por-fiscal":"Atos cuja maior nota está em Contas públicas: regras de gasto e dívida, e quem ganha o empate no julgamento de tributos federais.",
 "cm-por-infra":"Marcos que redesenham setores de infraestrutura (Investimento e capacidade com nota 3): concessões, parcerias e abertura de mercado.",
 "cm-por-negocios":"Regras gerais para empresas e contratos: estatais, relações de trabalho, liberdade econômica e garantias de crédito.",
 "cm-por-liberdades":"Atos com nota 2 ou 3 em Liberdade de expressão: quem pode restringir conteúdo e dados pessoais, com que procedimento e com que proteção. Juntá-los não quer dizer que ampliem ou restrinjam — o sentido de cada um está na tabela.",
 "cm-gov-alt":"Radar de seis eixos com a média de alcance dos marcos de cada governo escolhido, de 0 a 3.",
 "cm-gov-nota":"Média simples das notas de todos os marcos do governo nesta coleção. Com poucos marcos por mandato, um ato só muda muito a média; e a coleção foi escolhida por relevância, não para ser amostra equilibrada. Serve para ver onde a coleção de cada governo se concentra — não para dizer qual governo regulou mais ou melhor.",
 "tw-tela":"Melhor em tela grande ou com o celular deitado.",
 "tela-dlg-t":"Este site fica melhor em tela grande",
 "tela-dlg-1":"Tem tabelas com muitas colunas, séries de quase quarenta anos e gráficos com oito planos lado a lado. No computador ou com o celular deitado, tudo cabe de uma vez.",
 "tela-dlg-2":"Em pé também dá para ler tudo; só que gráficos e tabelas rolam para o lado, e comparar fica mais difícil.",
 "cm-intro":"Até seis marcos no mesmo radar, cada um com o governo que o sancionou — ou escolha uma dimensão e veja todos os marcos nela. O radar mede ALCANCE, o tamanho da mudança que o texto do ato faz em cada dimensão, de 0 a 3; ele não diz se a mudança foi boa. Os critérios da nota estão no gráfico “Alcance dos marcos”, mais abaixo na página.",
 "cm-radar-alt":"Radar de seis eixos com até seis marcos escolhidos, cada um com nota de 0 a 3 em cada dimensão.",
 "cm-nota-radar":"Marcadores que coincidem num eixo são deslocados um pouco para o lado, para todos aparecerem. Cada marco se distingue também pelo traço e pela forma do marcador, não só pela cor.",
 "cm-i-toca-1":"Neste recorte,",
 "cm-i-toca-2":"marcos mudam alguma coisa nesta dimensão.",
 "cm-i-red":"Redesenham o arranjo (3):",
 "cm-i-sem-red":"Nenhum marco deste recorte redesenha o arranjo (3) nesta dimensão.",
 "cm-i-sin":"Sentido entre os que tocam:",
 "cm-i-ressalva":"As contagens descrevem os marcos desta coleção, não a produção legislativa de cada governo: a coleção é mais completa nos anos recentes e foi escolhida por relevância pública, não para ser amostra equilibrada. Alcance médio alto quer dizer mudanças de regra maiores, não melhores.",
 "cm-nota-gov":"Só contagens e a média simples das notas de 0 a 3 — sem peso, sem ranking. Com poucos marcos por governo, um ato só muda muito a média.",
 "ig-comp-p":"Duas ferramentas para montar a própria comparação: pôr indicadores oficiais na mesma linha do tempo, ou pôr lado a lado marcos regulatórios de governos diferentes. As duas começam com sugestões prontas e deixam mudar tudo.",
 "mr-dd":"Marcos (até dois)",
 "mr-nenhum-v":"nenhum escolhido",
 "mr-nenhum":"Escolha um marco acima para ver o alcance dimensão por dimensão. Dois de cada vez, para comparar.",
 "mr-cont":"marcos classificados até agora",
 "mr-c1":"Dimensão",
 "mr-enf":"Ênfase pelos seus pesos",
 "mr-enf-exp":"A ênfase soma o alcance de cada dimensão pelo peso que você deu a ela, no infográfico 'Pesos das dimensões'. Ela diz quanto o marco mexe naquilo que você prioriza — não diz se o marco é bom, e dois marcos com o mesmo número podem ir em direções opostas.",
 "mr-porque":"por que cada nota, dispositivo por dispositivo",
 "mr-disp":"Dispositivo",
 "mr-crit":"Critérios de classificação",
 "mr-escala":"A escala de alcance",
 "mr-sinais":"Os sentidos",
 "mr-regras":"Regras que valem para os 37",
 "mr-cobre":"O que cada dimensão cobre",
 "mr-nao":"Não conta aqui:",
 "mr-alt":"Radar de seis eixos com o alcance de cada marco escolhido, de 0 a 3, em cada dimensão.",
 "aj-pesos":"pesos das dimensões personalizados",
 "pz-bt":"Personalizar pesos",
 "pz-est-padrao":"perfil padrão",
 "pz-est-seu":"perfil personalizado",
 "pz-leg-padrao":"Padrão: um sexto para cada dimensão",
 "pz-leg-seu":"Seu perfil",
 "pz-alt":"Radar de seis eixos com o peso que você deu a cada dimensão, comparado ao padrão de um sexto para cada.",
 "pz-c1":"Dimensão",
 "pz-c2":"Padrão",
 "pz-c3":"Seu perfil",
 "pz-umsexto":"1/6",
 "pz-total":"Total",
 "pz-padrao-nota":"Nenhuma prioridade declarada: o padrão é um sexto para cada dimensão, ou 16,67%. Os dois traçados coincidem.",
 "pz-seu":"Perfil personalizado por você, gravado neste navegador. O tracejado mostra onde estaria o padrão.",
 "pz-ajuda":"Escreva a importância de cada dimensão em porcentagem. A soma precisa dar 100% para aplicar — o site não reajusta os outros valores sozinho enquanto você edita, para o número que você escreveu continuar sendo o que você escreveu.",
 "pz-soma":"Soma: ",
 "pz-aplicar":"Aplicar a todos os marcos",
 "pz-igualar":"Igualar",
 "pz-restaurar":"Restaurar padrão",
 "pz-fechar":"Fechar",
 "pz-erro":"A soma precisa dar exatamente 100% para aplicar.",
 "pz-res":"O que cada dimensão cobre, e o que ela não mede:",
 "br-ir":"Abrir a lista de ",
 "serie-rot":"A sequência completa: ",
 "serie-nota":"Estes atos mexem na mesma regra, em governos diferentes. Clique para ir a cada um.",
 "serie-aqui":"você está aqui",
 "ver-v":"Versão ",
 "ver-criado":" · criado em ",
 "ver-atual":" · atualizado em ",
 "aj-pref":" · ajustes feitos neste navegador: ",
 "aj-sobrenome":"ordem por sobrenome",
 "aj-cor1":"1 cor trocada",
 "aj-corN":" cores trocadas",
 "aj-claro":"tema claro fixo",
 "aj-escuro":"tema escuro fixo",
 "aj-marcos":"marcos ocultos",
 "aj-fotos":"retratos ocultos",
 "aj-som":"trilha sonora desligada ao abrir",
 "glos-oq":"O que significa ",
 "plano-de":"Plano de governo de ",
 "plano-reg":", como registrado",
 "nd-anos":" anos · ",
 "pat-decl":" — declaração de ",
 "cit-1":" citação",
 "cit-n":" citações",
 "cit-de":" de ",
 "sel-n":" selecionados",
 "sob-de":" de ","sob-de6":" de 6","sob-nada":"nenhum escolhido","sob-cta":"escolha de 2 a 6 indicadores",
 "sob-tirar":"Tirar da sobreposição","sob-tit":"Sobreposição de indicadores",
 "sob-col":"ano","sob-uni":"índice (100 = ",
 "sob-m-valor":"valores originais","sob-m-indice":"índice (base 100)",
 "sob-m-faixa":"faixa 0–100","sob-uni-faixa":"posição na faixa da própria série (0 = menor valor, 100 = maior)",
 "sob-m-faixa-no":"Indisponível: alguma série não varia no período, e sem variação não há faixa para recolocar.",
 "sob-nt-faixa":"Cada série foi recolocada entre o menor e o maior valor que ela própria teve: 0 é o piso dela, 100 é o topo dela. Isso compara o desenho das curvas — quando cada uma sobe e desce — e nada mais. Nível, unidade e tamanho ficam de fora.",
 "sob-m-valor-no":"Indisponível: os indicadores escolhidos não têm a mesma unidade, ou as ordens de grandeza estão distantes demais para um eixo só.",
 "sob-m-indice-no":"Indisponível: alguma série não tem valor positivo no primeiro ano em comum, e índice de base 100 exige uma base maior que zero.",
 "sob-nt-idx-1":"As séries estão em índice: cada uma vale 100 em ","sob-nt-idx-2":", o primeiro ano em que todas têm dado. O gráfico mostra a variação de cada uma desde ali, não o nível — índice compara ritmo, não tamanho.",
 "sob-nt-uni":"Atenção: os indicadores escolhidos têm unidades diferentes e estão no mesmo eixo. A altura de uma linha não pode ser comparada com a da outra; compare a forma e o sentido, ou troque para índice.",
 "sob-nt-esc-1":"Atenção: mesma unidade, mas o maior valor é cerca de ","sob-nt-esc-2":" vezes o menor. No eixo único a série menor fica quase colada no zero; o índice de base 100 mostra melhor a variação das duas.",
 "sob-nt-ok":"Mesma unidade e ordens de grandeza próximas: as alturas podem ser comparadas diretamente.",
 "escala-grandeza-1":"Atenção: cada painel tem escala própria. A unidade é a mesma, mas as ordens de grandeza não são — o maior valor é cerca de ",
 "escala-grandeza-2":" vezes o menor. Num eixo único, o painel menor viraria uma linha reta colada no zero e a variação dele deixaria de aparecer, que é o que interessa. A comparação deve ser feita olhando os números, não a altura.",
 "Ressalva":"Ressalva","Não localizado:":"Não localizado:",
 "cmp-anos":" anos","cmp-desde":"desde ","cmp-comecando":", começando no ",
 "cmp-em":"em ","cmp-comocand":", como candidato a ",
 "cmp-de":" de ","cmp-noquadro":" candidaturas no quadro. Clique nos nomes acima para tirar ou pôr.",
 "cmp-semcargo":"nenhum cargo público registrado","cmp-semproc":"nenhum localizado nos limites da coleta",
 "cmp-semdecl":"sem declaração localizada","cmp-semform":"nenhuma registrada",
 "cmp-naoreg":"não registrado","cmp-semvice":"sem vice registrado",
 "pan-total":"total de citações","pan-maior":"colunas da maior para a menor contagem em ",
 "pan-menor":"colunas da menor para a maior contagem em ","pan-zerar":"Voltar à ordem padrão","ordenar por":"Ordenar por",
 "ver-rot":"Ver","ver-item":"doença por doença","ver-grupo":"agrupadas por família",
 "mnd-emp":"empresas","mnd-emp1":"empresa","mnd-v1":"barras por mandato","mnd-v2":"linha do tempo",
 "foto-alt":"Foto oficial de","foto-tip":"foto do registro de candidatura no TSE, 2026",
 "sb-t1":"O que mudou em cada versão","sb-t2":"Aviso de uso e privacidade","sb-atual":"atual",
 "sb-ult":"Última atualização em",
 "gr-1":" grupo","gr-n":" grupos","gr-per":" períodos",
 "share-bt":"Compartilhar","share-tip":"Gera uma imagem grande deste gráfico e abre o compartilhamento do aparelho",
 "f-copiar":"Copiar citação","f-copiar-tip":"Copia o trecho com o nome, a página e o link desta tela",
 "f-copiado":"Citação copiada, com a página e o link.",
 "idx-todas":"todas","idx-sel":" selecionadas","idx-todas-bt":"Limpar seleção",
 "idx-ir":"Ir direto a um gráfico",
 "share-fonte":"Fonte e método no site:",
 "share-sem":"Este bloco não tem gráfico para compartilhar como imagem.",
 "share-caiu":"Imagem baixada e texto copiado — é só colar no WhatsApp junto com a imagem.",
 "share-caiu-sem":"Imagem baixada. Copie o título e o link da página para enviar junto.",
 "pt-cand":"candidatura a","pt-auto":"valor informado pelo próprio candidato à Justiça Eleitoral",
 "pt-zero":"Nenhum bem declarado","pt-decl0":"na declaração de ","pt-decl":"declarado em ",
 "gr-clique":" · clique no título para abrir e fechar",
 "pt-nc":"não registrou candidatura","pt-se":"ano sem eleição",
 "pt-nf":"não encontrado em fonte confiável",
 "ov-rot":"Sobreposição —","tm-rot":"Termos pesquisados:",
 "prog-1":"Os ","prog-2":" macrotemas da grade estão extraídos, com ",
 "prog-3":" citações. Toda citação foi conferida caractere a caractere contra o texto do PDF na página indicada: ",
 "prog-4":" de ","prog-5":" bateram. Nenhuma citação entra nesta página sem passar por essa conferência.",
 "dl-tse":"página no TSE","dl-tse-sub":"registro da candidatura e documentos","dl-tse-cap":"Página no TSE",
 "dl-ser":" endereços, um por série. Cada um abre no órgão que publica o número, não numa cópia.",
 "ig-idx-n":" séries oficiais. Clique no nome para ir direto ao gráfico.",
 "bal-1":"recebeu com ","bal-2":"% do PIB (dez/","bal-3a":"e entregou","bal-3b":"e está em",
 "uni-1":"Atenção: cada painel tem escala própria, porque as unidades são diferentes (",
 "uni-2":"). Igualar os eixos aqui não ajudaria a comparar — colocaria grandezas incomparáveis na mesma régua e produziria exatamente o erro de leitura que este site tenta evitar. Compare olhando os números e a unidade de cada painel, não a altura.",
 "sb-n1":"Versão publicada:","sb-n2":"atualizada em","sb-n3":"O histórico lista o que mudou em cada publicação.",
 "mnd-nota":"Cada linha é um mandato, e a barra soma os anos daquele mandato. Ano inteiro conta para quem estava no cargo em 31 de dezembro — por isso 1992 aparece em Itamar, não em Collor, e 2016 aparece em Temer, não em Dilma. O número à direita é o saldo: quantas empresas a mais ou a menos o cadastro tinha no fim em relação ao começo. A lista ano a ano, com os nomes, está no chevron abaixo.",
 "ef-aum":"cria ou aumenta tributo","ef-red":"reduz ou extingue tributo",
 "ef-neu":"troca o regime, sem elevar nem reduzir","ef-out":"não é tributo",
 "pan-dica":"Ordena as colunas por esta linha: primeiro clique da maior para a menor contagem, segundo da menor para a maior, terceiro volta ao normal.",
 "pan-ajuda":"As setas ao lado de cada macrotema reordenam as colunas por aquela linha.","cmp-umadecl":"uma só declaração — sem taxa",
 "cmp-vezesano":"× ao ano","cmp-nominalde":"nominal, de ","cmp-ate":" a ",
 "cmp-anosp":" anos","cmp-descinfl":". Descontada a inflação: "};
/* 05/09/2026 em ingles seria lido como 9 de maio: onde a data aparece por
   extenso nao ha ambiguidade em nenhum dos dois idiomas. Global porque varios
   blocos independentes escrevem datas. */
var MES_EN=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function dataLonga(iso){
  var q=String(iso||"").split("-");
  if(q.length!==3) return iso;
  if(!ENUS) return q[2]+"/"+q[1]+"/"+q[0];
  return (+q[2])+" "+(MES_EN[(+q[1])-1]||q[1])+" "+q[0];
}
function TR(k){
  var pt=CHAVES[k]!==undefined?CHAVES[k]:k;
  if(IDIOMA!=="en")return pt;
  return (TRAD&&TRAD[k])||pt;
}
var TRAD={};
try{TRAD=JSON.parse(document.getElementById("traden").textContent)||{};}catch(e){}
/* Troca só quando o texto do nó é IGUAL a uma entrada do dicionário de interface.
   Conteúdo de origem — citação, verbete, marco, processo — nunca está no dicionário,
   então passa intacto. */
function traduzDOM(raiz){
  if(IDIOMA!=="en"||!raiz)return;
  var cam=document.createTreeWalker(raiz,NodeFilter.SHOW_TEXT,{
    acceptNode:function(n){
      var p=n.parentNode;
      if(!p)return NodeFilter.FILTER_REJECT;
      var tg=p.nodeName;
      if(tg==="SCRIPT"||tg==="STYLE"||tg==="TEXTAREA")return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;}},false);
  var alvo=[],n;
  while((n=cam.nextNode())){
    var bruto=n.nodeValue;
    if(!bruto)continue;
    var chave=bruto.replace(/\s+/g," ").trim();
    if(chave.length<2)continue;
    if(!TRAD[chave])continue;
    alvo.push([n,bruto,TRAD[chave]]);
  }
  alvo.forEach(function(a){
    var bruto=a[1], antes=bruto.match(/^\s*/)[0], depois=bruto.match(/\s*$/)[0];
    a[0].nodeValue=antes+a[2]+depois;});
  [].forEach.call(raiz.querySelectorAll?raiz.querySelectorAll("[placeholder],[title],[aria-label]"):[],
    function(e){
      ["placeholder","title","aria-label"].forEach(function(at){
        var v=e.getAttribute(at);
        if(v&&TRAD[v.trim()])e.setAttribute(at,TRAD[v.trim()]);});});
}
function aplicaIdioma(){
  try{document.documentElement.setAttribute("lang",IDIOMA==="en"?"en-US":"pt-BR");}catch(e){}
  [].forEach.call(document.querySelectorAll("[data-i18n]"),function(n){
    var k=n.getAttribute("data-i18n"), e=STR[k];
    if(!e)return;
    n.textContent=(IDIOMA==="en"&&e.en)?e.en:e.pt;});
  [].forEach.call(document.querySelectorAll("[data-i18n-ph]"),function(n){
    var k=n.getAttribute("data-i18n-ph"), e=STR[k];
    if(e)n.setAttribute("placeholder",(IDIOMA==="en"&&e.en)?e.en:e.pt);});
}
/* Trocar de idioma é navegar: o idioma viaja no endereço (?lang=en), o que mantém o link
   compartilhável, e fica gravado na preferência comum da SolverONE (dgo:global:idioma), que
   vale para todos os apps da mesma origem (F1-PR4: um HTML só para os dois idiomas). */
function vaiParaIdioma(lg){
  if(IDIOMA===lg)return;
  try{localStorage.setItem("dgo:global:idioma",JSON.stringify(lg));}catch(e){}
  var base=location.pathname.replace(/index-en\.html$|index\.html$/,"");   /* a pasta do site, terminando em "/" */
  if(!base)base="./";   /* sem pasta, "#…" sozinho só trocaria o # e não recarregaria */
  location.href=base+(lg==="en"?"?lang=en":"")+location.hash;
}
function montaIdioma(){
  var host=document.getElementById("idi"); if(!host)return;
  var bt=document.getElementById("idi-b"), pop=document.getElementById("idi-pop");
  bt.textContent=(IDIOMA==="en")?"EN-US":"PT-BR";
  pop.textContent="";
  [["pt","PT-BR","Português (Brasil)"],["en","EN-US","English (United States)"]].forEach(function(o){
    var b=document.createElement("button");b.type="button";
    b.setAttribute("role","option");
    b.setAttribute("aria-selected",IDIOMA===o[0]?"true":"false");
    b.appendChild(document.createTextNode(o[1]));
    var n=document.createElement("span");n.className="idi-n";n.textContent=o[2];
    b.appendChild(n);
    b.addEventListener("click",function(){
      EJ.fecha(pop);
      EJ.quando(function(){vaiParaIdioma(o[0]);});});
    pop.appendChild(b);});
  var av=document.createElement("span");av.className="idi-n";
  av.textContent=(IDIOMA==="en")
    ? "Quotes and source documents stay in Portuguese."
    : "Citações e documentos de origem seguem em português.";
  pop.appendChild(av);
  bt.addEventListener("click",function(){EJ.pop(bt,pop,{lado:"direita",rotulo:(IDIOMA==="en"?"Language":"Idioma")});});
}

/* A cor base foi atribuída na ordem de sobrenome, que era a ordem publicada
   antes, e NÃO muda quando a ordem de exibição muda: cada candidatura mantém a
   sua, em qualquer ordenação. */
D.candidatos.forEach(function(c,i){c.rampa=i;c.corBase=RAMP[i];});
var ORDEM_SOBRENOME=D.candidatos.slice();
function primeiroNome(c){return String(c.nome||"").trim().split(/\s+/)[0]||"";}
function aplicaOrdem(){
  /* padrão publicado: alfabética de primeiro nome */
  if(PREFS.ordem==="sobrenome"){
    D.candidatos.sort(function(a,b){return ORDEM_SOBRENOME.indexOf(a)-ORDEM_SOBRENOME.indexOf(b);});
  } else {
    D.candidatos.sort(function(a,b){
      var r=primeiroNome(a).localeCompare(primeiroNome(b),"pt");
      return r||String(a.nome).localeCompare(String(b.nome),"pt");});
  }
  D.candidatos.forEach(function(c,i){ORD[c.pre]=i;});
}
D.candidatos.forEach(function(c){
  c.varCor="--cand-"+c.pre;
  c.cor="var("+c.varCor+")";
  CAND[c.pre]=c;});
aplicaOrdem();
function hexRampa(i){
  try{var v=getComputedStyle(document.documentElement)
    .getPropertyValue("--c"+(i+1)).trim();return v||"#248179";}catch(e){return "#248179";}
}
function aplicaCores(){
  var r=document.documentElement;
  D.candidatos.forEach(function(c){
    var p=PREFS.cores[c.pre];
    r.style.setProperty(c.varCor, p||c.corBase);});
}
aplicaCores();
try{addEventListener("pgtema",aplicaCores);}catch(e){}
try{montaIdioma();aplicaIdioma();
  var avi=document.getElementById("avi-en");if(avi)avi.hidden=(IDIOMA!=="en");}catch(e){}
try{traduzDOM(document.body);}catch(e){}
addEventListener("hashchange",function(){setTimeout(function(){try{traduzDOM(document.body);}catch(e){}},150);});
/* traduz assim que o DOM muda: sem isso o texto recém-desenhado aparece em
   português até o próximo ciclo, e a página pisca de um idioma para o outro */
(function(){
  if(IDIOMA!=="en"||!window.MutationObserver)return;
  var pend=null, dentro=false;
  var mo=new MutationObserver(function(){
    if(dentro)return;
    if(pend)clearTimeout(pend);
    pend=setTimeout(function(){
      pend=null;dentro=true;
      try{traduzDOM(document.body);}catch(e){}
      setTimeout(function(){dentro=false;},0);
    },30);
  });
  mo.observe(document.body,{childList:true,subtree:true,characterData:true});
})();
D.macrotemas.forEach(function(m){MACRO[m.cod]=m;});
D.macrotemas.sort(function(a,b){return a.nome.localeCompare(b.nome,"pt");});
var TIPO={proposta:"Proposta",diretriz:"Diretriz",ausencia_declarada:"Ausência declarada"};
var DIMN={clareza:"Clareza",detalhamento:"Detalhamento",mensurabilidade:"Mensurabilidade",custo:"Custo",
  fonte_de_financiamento:"Fonte de financiamento",prazo:"Prazo",responsaveis:"Responsáveis",
  indicadores:"Indicadores",evidencias:"Evidências",complexidade:"Complexidade",dependencias:"Dependências"};
var COBRAVEIS=["mensurabilidade","custo","fonte_de_financiamento","prazo","indicadores"];
var DOCS={bol:{doc:"Diretrizes do Plano de Governo 2027-2030",pag:76},
  cai:{doc:"Plano de Governo 2027 a 2030 · Caiado e Kassab",pag:100},
  cur:{doc:"Plano de Governo — Cultura da Paz",pag:200},
  lul:{doc:"Programa de Governo",pag:84},
  mar:{doc:"Marçal Presidente — Plano de Governo",pag:28},
  ren:{doc:"Livro Amarelo — Missão 2026",pag:51},
  rui:{doc:"Programa de Luta — Eleições 2026",pag:7},
  zem:{doc:"Plano Implacável",pag:81}};
D.fichas.sort(function(a,b){
  var ma=MACRO[a.macro].nome,mb=MACRO[b.macro].nome;
  if(ma!==mb)return ma.localeCompare(mb,"pt");
  if(ORD[a.cand]!==ORD[b.cand])return ORD[a.cand]-ORD[b.cand];
  return a.id.localeCompare(b.id,"pt",{numeric:true});});
/* blocos que rodam antes do módulo de exportação existir ficam nesta fila */
var PEND=[];
function rodaPendentes(){
  if(!window.DL||!PEND.length)return;
  var f=PEND.slice();PEND.length=0;
  f.forEach(function(fn){try{fn();}catch(e){}});
}
function nomeMT(m,alvo){
  var n=m.nome, i=n.indexOf(": ");
  if(i<0){alvo.appendChild(document.createTextNode(n));return alvo;}
  alvo.appendChild(el("span","fam",n.slice(0,i)));
  alvo.appendChild(document.createTextNode(n.slice(i+2)));
  return alvo;
}
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;}
/* o escurecimento automático do Android reescreve background-color, mas não toca
   em imagem de fundo — por isso toda amostra de cor é pintada como gradiente sólido */
function pintaFundo(e,cor){
  if(!e)return e;
  e.style.backgroundColor=cor;
  e.style.backgroundImage="linear-gradient("+cor+","+cor+")";
  return e;
}
function fichasDe(mc,cd){return D.fichas.filter(function(f){return(!mc||f.macro===mc)&&(!cd||f.cand===cd);});}
/* citação é ficha com trecho citado. A ausência declarada é um registro de que o
   documento não trata do tema — entra na contagem de ausências, nunca na de citações,
   senão o total geral deixa de bater com o total conferido por script. */
function ehCitacao(f){return f.tipo!=="ausencia_declarada";}
function citDe(mc,cd){return fichasDe(mc,cd).filter(ehCitacao);}
function med(a){return a.length?a.reduce(function(x,y){return x+y;},0)/a.length:0;}
function cobravel(f){var v=COBRAVEIS.map(function(k){return f.dims&&f.dims[k];}).filter(Boolean);return v.length?med(v):null;}


/* ---------- links úteis ---------- */
(function(){
  var host=document.getElementById("links-uteis"); if(!host) return;
  var IGd=window.__IG__||{}, DL=(window.__DLINKS__||{docs:{}}).docs||{}, PT=window.__PATR__||{};
  function grupo(titulo,nota,itens){
    if(!itens.length)return;
    var g=el("div","lk-g");
    g.appendChild(el("h3",null,titulo));
    if(nota)g.appendChild(el("p","lk-n",nota));
    var ul=el("ul");
    itens.forEach(function(it){
      var li=el("li");
      var a=el("a",null,it.rot);a.href=it.url;a.target="_blank";a.rel="noopener noreferrer";
      li.appendChild(a);
      if(it.sub)li.appendChild(el("span","lk-s",it.sub));
      ul.appendChild(li);});
    g.appendChild(ul);host.appendChild(g);
  }
  // 1 · planos de governo
  var planos=[];
  D.candidatos.forEach(function(c){
    var d=DL[c.pre]||{};
    if(d.pagina_tse)planos.push({rot:c.nome+" — "+TR("dl-tse"),url:d.pagina_tse,sub:TR("dl-tse-sub")});
    if(d.site_partido)planos.push({rot:c.nome+" — "+c.partido,url:d.site_partido,sub:d.titulo_pagina||"site do partido"});
  });
  grupo("Os planos de governo, na origem",
    "O plano registrado fica no sistema do Tribunal Superior Eleitoral. O site do partido nem sempre publica o documento — quando não publica, o link vai para a página institucional.",planos);
  // 2 · séries oficiais
  var vis={},ser=[];
  (IGd.graficos||[]).forEach(function(g){
    (g.ids||[g.id]).forEach(function(id){
      var S=(IGd.series||{})[id]; if(!S||!S.fonte||!S.fonte.url||vis[S.fonte.url])return;
      vis[S.fonte.url]=1;
      ser.push({rot:S.titulo,url:S.fonte.url,sub:(S.orgao||"")+(S.serie_codigo?" · "+S.serie_codigo:"")});});});
  ser.sort(function(a,b){return (a.sub||"").localeCompare(b.sub||"","pt")||a.rot.localeCompare(b.rot,"pt");});
  grupo("As séries dos Infográficos",
    ser.length+TR("dl-ser"),ser);
  // 3 · atos normativos citados
  var atos=[];
  ((IGd.marcos_tributarios||{}).marcos||[]).slice()
    .sort(function(a,b){return b.ano-a.ano;}).forEach(function(m){
      if(!m.fonte)return;
      atos.push({rot:(m.ato||m.titulo||"")+"",url:m.fonte,sub:m.ano+" · "+(m.titulo||"")});});
  grupo("Leis, emendas e decretos citados",
    "Texto integral no Planalto ou no órgão que o publicou.",atos);
  // 4 · patrimônio
  var pat=[],vp={};
  Object.keys(PT.pessoas||{}).forEach(function(k){
    (PT.pessoas[k].anos||[]).forEach(function(y){
      if(!y.fonte||vp[y.fonte])return;vp[y.fonte]=1;
      pat.push({rot:PT.pessoas[k].nome+TR("pat-decl")+y.ano,url:y.fonte,sub:"patrimônio declarado à Justiça Eleitoral"});});});
  grupo("Declarações de patrimônio",
    "Onde cada valor foi publicado. O dado original é do Tribunal Superior Eleitoral.",pat);
})();

/* ---------- glossário ---------- */
var GLOS={
 citacao:{t:"Citação",k:"A unidade do estudo",c:[
  "<p>A unidade básica deste relatório. Uma <b>citação</b> é um trecho de um plano de governo, copiado literalmente do PDF, com a página em que está, mais a classificação desse trecho.</p>",
  "<p>Cada citação carrega: o <b>trecho</b>, a <b>localização</b> (página e capítulo), a <b>classificação</b> em proposta ou diretriz, o <b>grau de especificidade</b> de 1 a 5 com justificativa, e <b>onze dimensões</b> de forma do texto, cada uma com nota de 1 a 5.</p>",
  "<p>Uma citação não é um parágrafo do documento: é uma unidade de política. Um capítulo longo pode render várias, e uma frase densa pode render uma só.</p>",
  "<p><b>Como foi conferida.</b> O texto dos oito PDFs foi extraído página a página. Um script compara o trecho, caractere a caractere, com o texto da página declarada. Se não bate, a citação é descartada e não chega a esta página.</p>"]},
 macrotema:{t:"Macrotema",k:"A grade de leitura",c:[
  "<p>Uma das 20 áreas de política pública usadas como grade comum para ler os oito documentos — saúde, segurança, energia, e assim por diante.</p>",
  "<p>A grade foi definida <b>antes</b> da extração, para que todos os planos fossem lidos com o mesmo recorte. Sem grade comum, cada documento seria comparado apenas consigo mesmo.</p>",
  "<p><b>Como uma proposta vai para um macrotema.</b> Primeiro, busca por palavra-chave nas páginas inteiras — a busca localiza, ela não classifica. Depois, leitura do enquadramento: em que capítulo o documento colocou aquilo e qual objeto ele declara. É isso que decide.</p>",
  "<p>Esta é a etapa <b>menos auditável</b> do estudo. A citação e a página são conferíveis por máquina; a escolha do macrotema é julgamento de quem extraiu.</p>"]},
 proposta:{t:"Proposta e diretriz",k:"A classificação",c:[
  "<p>O teste é um só, aplicado igualmente aos oito documentos: <b>lendo apenas o que está escrito, dá para dizer sim ou não sobre o cumprimento ao fim do mandato?</b></p>",
  "<p>Se dá, é <b>proposta</b>. Exemplo: “alterar os arts. 155 e 157 do Código Penal” — os artigos estão identificados; ou foram alterados, ou não foram.</p>",
  "<p>Se não dá, é <b>diretriz</b>. Exemplo: “o programa será mantido e ampliado” — “ampliado” não fixa unidades, valor nem prazo; qualquer aumento cumpriria a frase.</p>",
  "<p><b>Nenhuma das duas é melhor que a outra.</b> Um plano de governo tem legitimamente as duas coisas: direções que orientam um mandato e compromissos que se pode cobrar. A distinção existe para o leitor saber o que poderá cobrar depois — não para pontuar candidaturas.</p>"]},
 especificidade:{t:"Grau de especificidade",k:"Escala de 1 a 5",c:[
  "<p>Responde a uma pergunta só: <b>quanta informação a frase carrega sobre o que exatamente será feito?</b></p>",
  "<ul><li><b>1 · Diretriz genérica</b> — enuncia intenção, sem ação identificável.</li>"+
  "<li><b>2 · Conceitual</b> — nomeia o objeto e a direção, sem delimitar o alcance.</li>"+
  "<li><b>3 · Estruturada</b> — declara o instrumento e como ele opera, sem parâmetro numérico.</li>"+
  "<li><b>4 · Detalhada</b> — traz parâmetro verificável: valor, percentual, público delimitado ou gatilho.</li>"+
  "<li><b>5 · Operacionalmente especificada</b> — instrumento, parâmetro e prazo ou norma identificada.</li></ul>",
  "<p>A diferença entre um nível e o seguinte é sempre a mesma pergunta: o que a frase acrescenta que a anterior não tinha? Do 1 para o 2 aparece o objeto; do 2 para o 3, o instrumento; do 3 para o 4, um número; do 4 para o 5, prazo ou norma.</p>",
  "<p><b>Mede o texto, não o mérito.</b> Uma proposta nível 5 pode ser ruim para o país; uma nível 1 pode ser excelente. A especificidade diz o quanto será possível acompanhar o cumprimento — não o quanto vale a pena.</p>"]},
 nivelmedio:{t:"Nível médio de especificidade",k:"Como ler a média",c:[
  "<p>A média aritmética do grau de especificidade (1 a 5) das citações daquele documento, ou daquele macrotema.</p>",
  "<p><b>O que ela diz:</b> o quanto, em média, as frases daquele texto detalham o que será feito. Um documento que enumera medidas com números tem média mais alta que um que enuncia direções.</p>",
  "<p><b>O que ela não diz:</b> nada sobre a qualidade, a viabilidade ou o acerto das políticas. E nada sobre governar melhor.</p>",
  "<p>Cuidado com a comparação direta: os documentos têm de 7 a 200 páginas e formatos muito diferentes — um é programa partidário de teses gerais, outro passa de duzentas páginas. Por isso este relatório não transforma essa média em ranking nem em nota geral.</p>"]},
 dimensoes:{t:"As onze dimensões",k:"Notas de forma do texto",c:[
  "<p>Cada citação recebe onze notas de 1 a 5, todas sobre <b>a forma do texto</b>, nunca sobre o mérito da política.</p>",
  "<ul><li><b>Clareza</b> — a ação é inequívoca?</li><li><b>Detalhamento</b> — quanto o texto descreve?</li>"+
  "<li><b>Mensurabilidade</b> — dá para medir o cumprimento?</li><li><b>Custo</b> — declara quanto custa?</li>"+
  "<li><b>Fonte de financiamento</b> — diz de onde sai o dinheiro?</li><li><b>Prazo</b> — diz quando?</li>"+
  "<li><b>Responsáveis</b> — diz quem executa?</li><li><b>Indicadores</b> — nomeia a métrica de acompanhamento?</li>"+
  "<li><b>Evidências</b> — traz dado ou fonte?</li><li><b>Complexidade</b> — quão difícil de executar (nota alta = mais difícil)</li>"+
  "<li><b>Dependências</b> — depende de terceiros (nota alta = mais dependente)</li></ul>",
  "<p><b>As onze nunca são somadas.</b> Uma citação com meta numérica clara e nenhuma fonte de financiamento tiraria média razoável — e a média esconderia exatamente o que o leitor precisa ver. Quando o documento não traz a informação, a nota é 1.</p>"]},
 custo:{t:"Custo declarado",k:"Uma das onze dimensões",c:[
  "<p>Mede se <b>o próprio documento diz quanto custa</b> — valor total, unitário ou faixa. Nota 5 quando o texto traz o número; nota 1 quando não traz nada.</p>",
  "<p>É o campo mais vazio de todo o estudo. Na base inteira, a média em custo declarado é <b>1,04 de 5</b>: os oito planos quase nunca dizem o preço do que propõem.</p>",
  "<p><b>Nota baixa não é crítica à candidatura.</b> É descrição do texto. Planos de governo, como gênero, raramente trazem orçamento — o que esta dimensão mostra é justamente isso, e vale para os oito.</p>"]},
 prazo:{t:"Prazo declarado",k:"Uma das onze dimensões",c:[
  "<p>Mede se <b>o documento diz quando</b> — data, ano, período do mandato ou periodicidade. Prazo vago (“nos primeiros meses”) recebe nota baixa, não zero.</p>",
  "<p>Na base inteira a média é <b>1,26 de 5</b>. Junto com custo (1,04) e fonte de financiamento (1,11), forma o buraco comum aos oito documentos: dizem o que pretendem fazer, e quase nunca quando fica pronto nem de onde sai o dinheiro.</p>"]},
 cobravel:{t:"O que é “cobrável”",k:"Índice derivado",c:[
  "<p>Não é uma dimensão do estudo: é uma combinação de cinco delas, usada para responder a uma pergunta prática — <b>se esta proposta virar governo, dá para cobrar o cumprimento?</b></p>",
  "<p class='form'>cobrável = média de ( mensurabilidade + custo + fonte de financiamento + prazo + indicadores ) ÷ 5</p>",
  "<p>Vai de 1 a 5, como as dimensões que o compõem. Valor alto quer dizer que o texto declara alvo, preço, origem do dinheiro, data e métrica — os cinco elementos que permitem conferir depois se a promessa foi cumprida.</p>",
  "<p><b>Não mede se a política é boa.</b> Uma proposta detalhadíssima pode ser péssima, e uma frase de uma linha pode conter a melhor ideia do documento.</p>",
  "<p>Os valores ficam baixos em todos os oito planos porque custo, prazo e fonte de financiamento são quase sempre nota 1 — o problema é comum, não de um candidato.</p>"]},
 ausencia:{t:"Ausência declarada",k:"Quando o tema não aparece",c:[
  "<p>Registro usado quando o documento <b>realmente não trata</b> de um macrotema. Não é estimativa: é resultado de busca por palavra-chave no documento inteiro, e a citação lista os termos que foram pesquisados.</p>",
  "<p><b>Ausência de informação não é informação negativa.</b> Quando um tema não aparece, isso descreve a cobertura daquele texto — não a posição da candidatura, que pode perfeitamente existir fora do documento.</p>",
  "<p>Um tema também pode estar tratado <b>dentro de outro capítulo</b> e ter sido registrado no macrotema onde o documento o coloca. Nesse caso não há ausência declarada, apenas contagem baixa naquele macrotema.</p>"]},
 conferida:{t:"Conferida por script",k:"A garantia central",c:[
  "<p>O texto dos oito PDFs registrados foi extraído <b>página a página</b> e guardado. Cada citação declara um trecho e uma página.</p>",
  "<p>Um script compara o trecho com o texto daquela página, caractere a caractere, normalizando apenas espaços. <b>Se não bate, a citação é descartada</b> e não entra nesta página.</p>",
  "<p>É isso que autoriza a frase “confira na fonte”: se a citação não existisse no documento, ela não estaria aqui.</p>",
  "<p><b>O que a conferência não garante:</b> que o trecho escolhido seja o mais importante da seção, e que o macrotema onde ele foi colocado seja o certo. As duas coisas são julgamento de quem extrai, e estão declaradas na aba Método.</p>"]},
 panorama:{t:"Panorama",k:"Como ler a contagem",c:[
  "<p>Quantas citações cada documento rendeu em cada macrotema. A intensidade da cor acompanha a contagem, e o número está escrito em todas as células — a cor não carrega informação que o número já não dê.</p>",
  "<p><b>Mais citações não significa plano melhor.</b> A contagem mede como aquele documento foi escrito e organizado: um texto que enumera medidas rende mais citações que um que enuncia direções, com o mesmo conteúdo de política.</p>",
  "<p><b>Menos citações não significa descaso com o tema.</b> Um assunto pode estar tratado dentro de outro capítulo e ter sido registrado no macrotema onde o documento o coloca.</p>",
  "<p>Os documentos têm de 7 a 200 páginas. Comparar contagens brutas entre eles compara o tamanho dos textos, não o conteúdo das políticas.</p>"]},
 recorte:{t:"O índice do recorte escolhido",k:"Ferramenta do leitor",c:[
  "<p>Escolhem-se até cinco macrotemas, colocados em ordem de importância. Os pesos são 5, 4, 3, 2 e 1, do primeiro ao quinto.</p>",
  "<p class='form'>índice = Σ ( peso do macrotema × cobrável do documento naquele macrotema ) ÷ Σ ( pesos dos macrotemas em que o documento tem citações )</p>",
  "<p><b>O que ele mede:</b> nos temas escolhidos, o quanto aquele documento declara meta, custo, fonte de financiamento, prazo e indicador — isto é, o quanto dá para cobrar depois.</p>",
  "<p><b>O que ele não mede:</b> se a política é boa, viável ou desejável. Um plano pode detalhar muito uma política ruim.</p>",
  "<p><b>Ausência não vira nota baixa.</b> Se um documento não tem citação num macrotema escolhido, aquele tema sai da conta dele — não entra como zero. A cobertura aparece ao lado, separada, porque somar as duas coisas num número só esconderia o que é preciso ver.</p>",
  "<p><b>Este estudo não produz ranking.</b> Quem ordena aqui é quem lê; trocar o primeiro lugar troca o resultado.</p>"]},
 vies:{t:"Controle de viés",k:"O teste que o estudo aplica em si mesmo",c:[
  "<p>Se o mesmo critério foi aplicado aos oito documentos, as notas médias de forma devem ficar <b>próximas</b> entre eles — porque medem como o texto foi escrito, e os oito são documentos do mesmo gênero.</p>",
  "<p>A <b>amplitude</b> é a diferença entre o maior e o menor valor de cada coluna. Amplitude pequena indica que a régua não mudou de candidato para candidato.</p>",
  "<p>O tamanho médio da citação está na tabela pelo mesmo motivo: citar um candidato com trechos sistematicamente mais curtos seria uma forma silenciosa de enfraquecê-lo.</p>",
  "<p><b>O que o teste não pega:</b> se a escolha de <i>qual</i> trecho citar foi enviesada, as médias continuam simétricas. Ele detecta régua torta, não seleção torta.</p>",
  "<p>Amplitude pequena não diz que os planos são parecidos, nem que são bons. Diz que foram lidos do mesmo jeito.</p>"]}
};
var dlg=document.getElementById("gloss");
function abreGloss(k){
  var g=GLOS[k];if(!g)return;
  dlg.textContent="";
  var h=el("div","gh");h.appendChild(el("div","gk",g.k));h.appendChild(el("h3",null,g.t));
  var b=el("div","gb");b.innerHTML=g.c.join("");
  var f=el("div","gf");var ok=el("button",null,"Entendi");ok.type="button";
  ok.addEventListener("click",function(){EJ.fecha(dlg);});f.appendChild(ok);
  dlg.appendChild(h);dlg.appendChild(b);dlg.appendChild(f);
  EJ.abre(dlg,{focar:ok});
}
function info(k){
  var b=el("button","i","i");b.type="button";
  b.setAttribute("aria-label",TR("glos-oq")+(GLOS[k]?GLOS[k].t:k));
  b.title=TR("glos-oq")+(GLOS[k]?GLOS[k].t:k);
  b.addEventListener("click",function(e){e.stopPropagation();e.preventDefault();abreGloss(k);});
  return b;
}
function infoEm(sel,k){var n=document.querySelector(sel);if(n)n.appendChild(info(k));}

/* ---------- glossário ---------- */

/* ---------- tooltip ---------- */
var tip=document.getElementById("tip");
function tipOn(e,t){tip.textContent=t;tip.classList.add("on");tipMove(e);}
function tipMove(e){
  var r=tip.getBoundingClientRect(), lg=r.width||240, al=r.height||80;
  var x=e.clientX+14, y=e.clientY+16;
  if(x+lg+8>innerWidth) x=Math.max(8,e.clientX-lg-14);
  if(y+al+8>innerHeight) y=Math.max(8,e.clientY-al-12);
  tip.style.left=x+"px";tip.style.top=y+"px";}
function tipOff(){tip.classList.remove("on");}
function comTip(node,txt){
  /* nunca deixar o balão nativo do navegador competir com este:
     em HTML é o atributo title, em SVG é um filho <title> */
  if(node.removeAttribute)node.removeAttribute("title");
  var t0=node.querySelector&&node.querySelector(":scope > title");
  if(t0)node.removeChild(t0);
  node.addEventListener("mouseenter",function(e){tipOn(e,txt);});
  node.addEventListener("mousemove",tipMove);
  node.addEventListener("mouseleave",tipOff);
  node.tabIndex=0;
  node.addEventListener("focus",function(){var r=node.getBoundingClientRect();tipOn({clientX:r.left,clientY:r.bottom},txt);});
  node.addEventListener("blur",tipOff);
}

/* ---------- tabelas ordenáveis ---------- */
function num(s){
  var t=String(s).replace(/\s/g,"").replace("%","").replace(/^(\d+)de\d+$/,"$1").replace(",",".");
  var v=parseFloat(t); return isNaN(v)?null:v;
}
function ordenavel(tabela){
  var ths=[].slice.call(tabela.querySelectorAll("thead th"));
  ths.forEach(function(th,i){
    th.classList.add("s");
    var ch=el("span","ch","↕");th.appendChild(ch);
    th.setAttribute("role","button");th.tabIndex=0;
    function go(){
      var dir=th.getAttribute("data-dir")==="asc"?"desc":"asc";
      ths.forEach(function(o){o.removeAttribute("data-dir");o.querySelector(".ch").textContent="↕";});
      th.setAttribute("data-dir",dir);ch.textContent=dir==="asc"?"↑":"↓";
      var tb=tabela.querySelector("tbody");
      var rows=[].slice.call(tb.rows);
      rows.sort(function(a,b){
        var ta=a.cells[i]?a.cells[i].textContent.trim():"",tb2=b.cells[i]?b.cells[i].textContent.trim():"";
        var na=num(ta),nb=num(tb2),r;
        if(na!==null&&nb!==null)r=na-nb; else r=ta.localeCompare(tb2,"pt");
        return dir==="asc"?r:-r;
      });
      rows.forEach(function(r){tb.appendChild(r);});
    }
    th.addEventListener("click",go);
    th.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();go();}});
  });
}

/* ---------- multiselect ---------- */
function multi(hostId,opts,rotulo,onChange){
  var host=document.getElementById(hostId);
  var sel={}; var bt=el("button");bt.type="button";
  var lab=el("span"),cv=el("span","cv");
  bt.appendChild(lab);bt.appendChild(cv);
  var pop=el("div","ms-pop");pop.hidden=true;
  var all=el("div","all");
  var bAll=el("button",null,"Todos");bAll.type="button";
  var bNone=el("button",null,"Nenhum");bNone.type="button";
  all.appendChild(bAll);all.appendChild(bNone);pop.appendChild(all);
  opts.forEach(function(o){
    var l=el("label");
    var cb=el("input");cb.type="checkbox";cb.value=o.v;
    l.appendChild(cb);
    if(o.cor){var sw=el("span","sw");pintaFundo(sw,o.cor);l.appendChild(sw);}
    l.appendChild(document.createTextNode(o.r));
    if(o.n!=null)l.appendChild(el("small",null,String(o.n)));
    cb.addEventListener("change",function(){ if(cb.checked)sel[o.v]=1; else delete sel[o.v]; pinta(); onChange(); });
    pop.appendChild(l);
  });
  host.appendChild(bt);host.appendChild(pop);
  function pinta(){
    var ks=Object.keys(sel);
    lab.textContent = ks.length===0 ? (TR("Todos")+" · "+rotulo)
      : ks.length===1 ? (opts.filter(function(o){return o.v===ks[0];})[0]||{}).r
      : ks.length+TR("sel-n");
    cv.textContent = ks.length? ks.length : "todos";
    cv.className = "cv"+(ks.length?" sel":"");
  }
  bAll.addEventListener("click",function(){sel={};[].forEach.call(pop.querySelectorAll("input"),function(c){c.checked=false;});pinta();onChange();});
  bNone.addEventListener("click",function(){sel={};[].forEach.call(pop.querySelectorAll("input"),function(c){c.checked=false;});pinta();onChange();});
  bt.addEventListener("click",function(){EJ.pop(bt,pop);});
  pinta();
  return {vals:function(){return Object.keys(sel);},
          limpar:function(){sel={};[].forEach.call(pop.querySelectorAll("input"),function(c){c.checked=false;});pinta();}};
}

/* ---------- navegação ---------- */
/* ordem do menu: primeiro quem disputa (Currículo) e o contexto de dados
   (Infográficos), depois o que os documentos dizem (Macrotemas, Índice) e por
   fim a procedência (Documentos, Método, Glossário) */
var VIEWS=[["inicio","Início"],["historico","Currículo"],["infograficos","Infográficos"],
           ["macrotemas","Macrotemas"],["score","Índice sob medida"],["mandato","Mandato"],
           ["documentos","Documentos"],["metodo","Método"],["glossario","Glossário"]];
/* telas fora do menu de cima (v2.0): a escolha inicial e o Congresso, montadas no bloco "v2.0" */
var MODOS_V=["hub","congresso","colinha"];
var menu=document.getElementById("menu");
VIEWS.forEach(function(v){
  var b=el("button",null,v[1]);b.type="button";b.dataset.v=v[0];
  b.addEventListener("click",function(){location.hash="#"+v[0];});
  menu.appendChild(b);});
/* botões de download nas tabelas estáticas (Documentos, Método) */
function dlTabelasEstaticas(){
  if(!window.DL)return;
  var alvos=[["v-documentos","documentos"],["v-metodo","metodo"],["v-inicio","inicio"],
             ["v-historico","curriculo"]];
  alvos.forEach(function(a){
    var v=document.getElementById(a[0]); if(!v)return;
    [].forEach.call(v.querySelectorAll("table"),function(tbl,i){
      if(tbl.dataset.dl)return; tbl.dataset.dl="1";
      var env=tbl.closest(".tw")||tbl;
      var cab=null,n=env.previousElementSibling;
      while(n&&!cab){var h=n.querySelector?n.querySelector("h2,h3"):null;
        if(/^H[23]$/.test(n.tagName))cab=n;else if(h)cab=h;n=n.previousElementSibling;}
      var tit=cab?cab.textContent.replace(/\s+/g," ").replace(/ⓘ|↕/g,"").trim():
        (a[1]==="documentos"?"Documentos":"Método");
      var host=document.createElement("div");
      env.parentNode.insertBefore(host,env.nextSibling);
      window.DL.botoesDL(host,{
        nome:a[1]+"-"+(i+1)+"-"+tit.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
          .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40),
        titulo:tit,sub:"",textoCortado:true,
        fonte:"Tabela da aba "+(a[1]==="documentos"?"Documentos":"Método")+" deste site",
        linhas:function(){return window.DL.linhasDeTabela(tbl);}});
    });
  });
}
function rota(){
  var h=(location.hash||"#inicio").slice(1),partes=h.split("/"),base=partes[0];
  /* link direto para um gráfico (#g-...) abre a aba dos infográficos e ancora nele */
  var alvoIG=null;
  if(!VIEWS.some(function(v){return v[0]===base;})&&/^g-/.test(base)){
    alvoIG=base;base="infograficos";
  }
  if(!VIEWS.some(function(v){return v[0]===base;})&&MODOS_V.indexOf(base)<0&&!(window.Rotas&&Rotas.cuida(base)))base="inicio";   /* F1-PR5: #hoje, #explorar e #salvos são do shell (modulos/rotas.js) */
  if(base==="colinha"&&window.colinhaOff&&colinhaOff())base="hub";   /* Colinha desligada no RootifyONE */
  if(base==="macrotemas"&&partes[1]&&MACRO[partes[1]]&&partes[1]!==mtAtual){mtAtual=partes[1];marca();render();}
  VIEWS.forEach(function(v){
    document.getElementById("v-"+v[0]).classList.toggle("on",v[0]===base);
    var b=menu.querySelector('[data-v="'+v[0]+'"]');
    if(v[0]===base)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current");});
  MODOS_V.forEach(function(m){document.getElementById("v-"+m).classList.toggle("on",m===base);});
  if(alvoIG){
    var ir=function(n){
      var e=document.getElementById(alvoIG);
      if(e&&window.ancoraEm){window.ancoraEm(e);return;}
      if(n<40)setTimeout(function(){ir(n+1);},60);
    };
    ir(0);
    return;
  }
  scrollTo(0,0);
}
addEventListener("hashchange",rota);

/* ---------- aviso de tela e dica nas tabelas ---------- */
/* ---------- aviso de tela pequena, em janela ----------
   Aparece uma vez ao entrar pelo celular ou tablet (em pé ou deitado). Quem toca
   em "Estou ciente" não vê de novo neste navegador; o aviso em texto da capa
   continua lá para quem quiser reler. */
function avisoTelaPopup(estreito){
  var toque=window.matchMedia&&window.matchMedia("(pointer: coarse) and (max-width: 1024px)").matches;
  if(!(estreito||toque)||PREFS.telaCiente)return;
  var dlg=document.createElement("div");dlg.className="cfg tela-dlg";dlg.id="tela-dlg";
  var h=el("div","cfg-h");var t=el("h3",null,TR("tela-dlg-t"));t.id="tela-dlg-t";h.appendChild(t);dlg.appendChild(h);
  var c=el("div","cfg-b");
  c.appendChild(el("p","sb-p",TR("tela-dlg-1")));
  c.appendChild(el("p","sb-p",TR("tela-dlg-2")));
  dlg.appendChild(c);
  var r=el("div","tela-dlg-r");
  var b=el("button","chip-cat on tela-ok",TR("Estou ciente"));b.type="button";
  b.addEventListener("click",function(){PREFS.telaCiente=true;gravaPrefs();EJ.fecha(dlg);});
  r.appendChild(b);dlg.appendChild(r);
  /* fechar pelo Esc, pelo Voltar ou tocando fora não conta como ciente: volta na próxima visita */
  /* v2.2: a escolha inicial, a colinha e o Congresso foram feitos para o celular; o aviso
     só vale para a Presidência. Se a pessoa chegou por elas, ele espera ela entrar lá. */
  var fora=function(){return /^#(hub|colinha|congresso)(\/|$)/.test(location.hash||"");};
  var mostra=function(){if(PREFS.telaCiente||dlg.__ej||fora())return false;
    EJ.abre(dlg,{descarta:true,focar:b});return true;};
  setTimeout(function(){if(!mostra()){var ouve=function(){if(mostra()||PREFS.telaCiente)removeEventListener("hashchange",ouve);};addEventListener("hashchange",ouve);}},400);
}
(function(){
  var host=document.getElementById("tela-avi");
  if(host){
    var estreito=window.matchMedia&&window.matchMedia("(max-width: 780px)").matches;
    /* no computador o quadro não diz nada útil: só aparece em tela estreita */
    if(!estreito)host.hidden=true;
    var d=el("div","tela-box"+(estreito?" forte":""));
    var ic=el("span","tela-ic");
    ic.innerHTML='<svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true">'+
      '<rect x="1.5" y="4" width="17" height="11" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.5"/>'+
      '<path d="M7 17.5h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
    d.appendChild(ic);
    var t=el("div","tela-t");
    t.appendChild(el("b",null,estreito
      ? "Esta tela é estreita. "
      : "Esta página foi feita para tela larga. "));
    t.appendChild(document.createTextNode(
      "O site tem tabelas largas e gráficos com oito planos lado a lado. Dá para ler tudo aqui, mas comparar "+
      "fica mais fácil com o celular deitado ou no computador."));
    d.appendChild(t);
    host.appendChild(d);
    avisoTelaPopup(estreito);
  }
  // dica logo abaixo de cada tabela larga, sem repetir onde já existe
  function dicaTabelas(){
    [].forEach.call(document.querySelectorAll(".tw"),function(w){
      if(w.dataset.dica)return;
      w.dataset.dica="1";
      var p=el("p","aviso-tela");
      p.style.margin="6px 0 0";
      /* a dica acompanha a tabela: onde ela some no celular — o índice tem
         lista própria lá — a dica sumiria sozinha, senão ficaria mandando
         rolar uma tabela que não está na tela */
      if(w.classList.contains("idx-tw"))p.className="aviso-tela idx-tw";
      p.textContent="Tabela larga: role para o lado ou deite o celular.";
      if(w.parentNode)w.parentNode.insertBefore(p,w.nextSibling);});
  }
  function mediNav(){
    var n=document.querySelector(".nav"); if(!n)return;
    var h=Math.round(n.getBoundingClientRect().height);
    if(h>0)document.documentElement.style.setProperty("--navh",h+"px");
  }
  mediNav();
  addEventListener("resize",mediNav);
  addEventListener("orientationchange",function(){setTimeout(mediNav,200);});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(mediNav);
  /* ---------- recolher orientações e ressalvas ----------
     Nada é removido: cada bloco vira um chevron com rótulo que diz o que há dentro,
     porque ressalva escondida atrás de "mais" é ressalva sonegada. */
  function rotuloDe(ch){
    var R={"aviso":"Como ler","ressalva":"Ressalvas","nota":"Nota de leitura",
           "analise":"Análise e ressalvas","fonte":"Fontes","tela":"Sobre a largura da tela",
           "metodo":"Como isto foi feito"};
    return R[ch]||"Leia antes";
  }
  function dobra(alvos,classe,rotulo,conta){
    if(!alvos.length)return;
    var pai=alvos[0].parentNode; if(!pai)return;
    var d=document.createElement("details");
    d.className="dob"+(classe?" "+classe:"");
    var sm=document.createElement("summary");
    sm.appendChild(document.createTextNode(rotulo));
    if(conta){var n=document.createElement("span");n.className="dob-n";
      n.textContent=conta;sm.appendChild(n);}
    var cx=document.createElement("div");cx.className="dob-c";
    pai.insertBefore(d,alvos[0]);
    d.appendChild(sm);d.appendChild(cx);
    alvos.forEach(function(a){a.dataset.dob="1";cx.appendChild(a);});
    if(pai.tagName==="SECTION")pai.classList.add("sec-dob");
  }
  /* quadros lado a lado são um controle só: em duas colunas, um aberto ao lado de
     um fechado deixa a linha torta, com um retângulo vazio do tamanho do vizinho.
     Abrir um abre o par; fechar um fecha o par. Em coluna única o efeito é
     inofensivo — os dois simplesmente abrem juntos, empilhados. */
  function sincronizaLado(){
    [].forEach.call(document.querySelectorAll(".grid2"),function(pa){
      var ds=[].filter.call(pa.children,function(x){
        return x.tagName==="DETAILS"&&x.classList.contains("dob");});
      if(ds.length<2)return;
      if(ds.some(function(d){return d.dataset.sinc;}))return;
      var algum=ds.some(function(d){return d.open;});
      ds.forEach(function(d){
        d.dataset.sinc="1";
        d.open=algum;
        var sm=d.querySelector("summary");
        if(sm)sm.setAttribute("aria-controls",ds.filter(function(o){return o!==d;})
          .map(function(o,i){ if(!o.id)o.id="dob-par-"+(Date.now()%1e6)+"-"+i; return o.id;}).join(" "));
        d.addEventListener("toggle",function(){
          if(pa.dataset.sincBusy)return;
          pa.dataset.sincBusy="1";
          ds.forEach(function(o){ if(o!==d&&o.open!==d.open) o.open=d.open; });
          delete pa.dataset.sincBusy;
        });
      });
    });
  }
  function dobraveis(){
    /* blocos únicos */
    [[".ig-aviso","av","aviso"],[".uf-alerta","rs","ressalva"],
     [".bal","av","analise"],[".ig-idx-nota","av","nota"]].forEach(function(r){
      [].forEach.call(document.querySelectorAll(r[0]),function(e){
        if(e.dataset.dob||e.closest("details.dob"))return;
        dobra([e],r[1],TR(rotuloDe(r[2])));});});
    /* cartões de orientação: o próprio título vira o rótulo do chevron */
    [].forEach.call(document.querySelectorAll(".card.pad.note,.card.pad.note.flag"),function(c){
      if(c.dataset.dob||c.closest("details.dob"))return;
      if(c.querySelector(".hcount"))return;  /* traz contagem, não é orientação */
      var h=c.querySelector("h2,h3,h4"); if(!h)return;
      var rot=h.textContent.replace(/\s*ⓘ\s*$/,"").replace(/i$/,"").trim();
      if(!rot)return;
      var d=document.createElement("details");
      d.className="dob "+(c.classList.contains("flag")?"rs":"av");
      var sm=document.createElement("summary");
      sm.appendChild(document.createTextNode(rot));
      var cx=document.createElement("div");cx.className="dob-c";
      c.parentNode.insertBefore(d,c);
      d.appendChild(sm);d.appendChild(cx);
      c.dataset.dob="1";h.style.display="none";
      cx.appendChild(c);
      c.classList.add("dob-nu");
      if(d.parentNode&&d.parentNode.tagName==="SECTION")d.parentNode.classList.add("sec-dob");
    });
    /* Currículo: blocos de orientação que já trazem o próprio rótulo em .rot —
       o rótulo vira o texto do chevron e a contagem vira o número à direita */
    [[".proc-av","rs"],[".patr-res","av"]].forEach(function(r){
      [].forEach.call(document.querySelectorAll(r[0]),function(e){
        if(e.dataset.dob||e.closest("details.dob"))return;
        var rt=e.querySelector(".rot");
        var rot=rt?rt.textContent.replace(/\s+/g," ").trim():TR("Leia antes");
        var n=e.querySelectorAll("li").length;
        if(rt)rt.style.display="none";
        dobra([e],r[1],rot,n>1?String(n):"");});});
    /* cartão de grupo político: a contagem fica à vista e só a explicação recolhe */
    [].forEach.call(document.querySelectorAll(".card.pad.note"),function(c){
      if(!c.querySelector(".hcount"))return;
      var ps=[].filter.call(c.children,function(e){
        return e.tagName==="P"&&!e.dataset.dob&&(e.textContent||"").length>120;});
      if(!ps.length)return;
      dobra(ps,"av",TR("Por que estas pessoas estão no mesmo bloco"));});

    /* ressalvas em série: agrupa as vizinhas num chevron só */
    [].forEach.call(document.querySelectorAll(".ig-foot,.ig,.view"),function(bloco){
      var res=[].filter.call(bloco.querySelectorAll(":scope > .ig-res, :scope > * > .ig-res"),
        function(e){return !e.dataset.dob&&!e.closest("details.dob");});
      if(res.length<1)return;
      var grupos=[],atual=[];
      res.forEach(function(e){
        if(atual.length&&atual[atual.length-1].nextElementSibling!==e){grupos.push(atual);atual=[];}
        atual.push(e);});
      if(atual.length)grupos.push(atual);
      grupos.forEach(function(g){
        dobra(g,"rs",TR("Ressalvas"),g.length>1?String(g.length):"");});});
  }
  /* quadro mais largo que a tela, em tela pequena: uma linha curta ACIMA dele
     (e acima do "role para o lado", quando existe), dizendo onde ele fica
     melhor. Some sozinha quando o quadro passa a caber. */
  function avisoLargo(){
    var peq=window.matchMedia&&(window.matchMedia("(max-width: 780px)").matches||
      window.matchMedia("(pointer: coarse) and (max-width: 1024px)").matches);
    [].forEach.call(document.querySelectorAll(".tw"),function(w){
      if(!w.offsetParent&&!w.__avl)return;
      var env=w.closest(".cmp-env"), ref=env||w;
      if(env&&env.previousElementSibling&&env.previousElementSibling.classList.contains("cmp-mais"))ref=env.previousElementSibling;
      var n=w.__avl;
      if(!n||!n.parentNode){n=el("p","tw-tela",TR("tw-tela"));w.__avl=n;
        if(ref.parentNode)ref.parentNode.insertBefore(n,ref);}
      n.hidden=!(peq&&(w.scrollWidth-w.clientWidth>8));});
  }
  function ciclo(){mediNav();dicaTabelas();try{avisoLargo();}catch(e){}try{rodaPendentes();}catch(e){}
    try{dlTabelasEstaticas();}catch(e){}try{dobraveis();}catch(e){}try{sincronizaLado();}catch(e){}
    try{traduzDOM(document.body);}catch(e){}}
  ciclo();
  addEventListener("hashchange",function(){setTimeout(ciclo,120);});
  setInterval(ciclo,1500);
  addEventListener("load",function(){setTimeout(function(){
    ciclo();
    try{if(window.DL&&typeof pintaTudo==="function"&&!document.querySelector("#sc-tab .ig-acoes"))
      pintaTudo();}catch(e){}
  },300);});
})();

/* ---------- banner ---------- */
(function(){
  var B=D.banner, host=document.getElementById("banner");
  if(!host||!B||!B.img) return;
  var fig=el("figure","banner");
  var img=el("img");img.src=B.img;img.alt=B.alt||"";img.loading="eager";
  if(B.link){
    var a=el("a");a.href=B.link;a.target="_blank";a.rel="noopener noreferrer";
    a.appendChild(img);fig.appendChild(a);
  } else fig.appendChild(img);
  if(B.legenda||B.credito){
    var cap=el("figcaption");
    if(B.legenda)cap.appendChild(document.createTextNode(B.legenda));
    if(B.credito){var c=el("span","cred",(B.legenda?" · ":"")+B.credito);cap.appendChild(c);}
    fig.appendChild(cap);
  }
  host.appendChild(fig);
})();

/* ---------- faixa de números ---------- */
var cit=D.fichas.filter(ehCitacao).length;
var verb=D.fichas.filter(function(f){return f.verbatim;}).length;
var aus=D.fichas.filter(function(f){return f.tipo==="ausencia_declarada";}).length;
[[String(D.macrotemas.length),"Macrotemas"],
 [String(D.candidatos.length),"Planos comparados"],
 [String(cit),"Citações"],
 [verb+"/"+verb,"Citações conferidas por script"],
 [String(aus),"Ausências declaradas"],
 ["0","Rankings produzidos pelo estudo"]].forEach(function(p){
  var d=el("div","fig");d.appendChild(el("b",null,p[0]));d.appendChild(el("span",null,p[1]));
  document.getElementById("figs").appendChild(d);});
document.getElementById("prog").textContent=TR("prog-1")+D.macrotemas.length+
  TR("prog-2")+cit+TR("prog-3")+verb+TR("prog-4")+verb+TR("prog-5");
(function(){
  function br(iso){var p=String(iso||"").split("-");return p.length===3?p[2]+"/"+p[1]+"/"+p[0]:iso;}
  function ajustesTxt(){
    var p=[];
    if(PREFS.ordem==="sobrenome")p.push(TR("aj-sobrenome"));
    var n=Object.keys(PREFS.cores||{}).length;
    if(n)p.push(n===1?TR("aj-cor1"):(n+TR("aj-corN")));
    if(PREFS.tema==="claro")p.push(TR("aj-claro"));
    if(PREFS.tema==="escuro")p.push(TR("aj-escuro"));
    if(PREFS.marcos===false)p.push(TR("aj-marcos"));
    if(PREFS.fotos===false)p.push(TR("aj-fotos"));
    if(PREFS.som===false)p.push(TR("aj-som"));
    if(PREFS.pesos)p.push(TR("aj-pesos"));
    return p.length?(TR("aj-pref")+p.join(", ")):"";
  }
  function escreveVer(){
    document.getElementById("ver").textContent=
      TR("ver-v")+D.versao+TR("ver-criado")+dataLonga(D.criado_em)+TR("ver-atual")+dataLonga(D.atualizado_em)+ajustesTxt();
  }
  escreveVer();
  window.escreveVer=escreveVer;
})();

/* ---------- panorama ---------- */
(function(){
  var max=0,cel={};
  D.macrotemas.forEach(function(m){D.candidatos.forEach(function(c){
    var n=citDe(m.cod,c.pre).length;cel[m.cod+c.pre]=n;if(n>max)max=n;});});
  function passo(n){return n?Math.max(1,Math.min(7,Math.ceil(n/max*7))):0;}
  function totalCand(c){return citDe(null,c.pre).length;}

  /* ordenação HORIZONTAL: uma linha de macrotema passa a mandar na ordem das
     colunas. Sai do ar assim que se ordena por candidato, porque as duas ordens
     disputam o mesmo eixo e manter as duas daria uma tabela que ninguém lê. */
  var ordCol=null;   /* {cod, dir} — cod "__total" usa a coluna Total */
  var host=document.getElementById("heat");

  function colunas(){
    var L=D.candidatos.slice();
    if(!ordCol)return L;
    var val=function(c){return ordCol.cod==="__total"?totalCand(c):cel[ordCol.cod+c.pre];};
    L.sort(function(a,b){
      var d=val(b)-val(a);
      if(ordCol.dir==="asc")d=-d;
      return d||String(a.nome).localeCompare(String(b.nome),"pt");});
    return L;
  }
  function rotuloOrdem(){
    if(!ordCol)return "";
    var m=D.macrotemas.filter(function(x){return x.cod===ordCol.cod;})[0];
    var nome=ordCol.cod==="__total"?TR("pan-total"):(m?m.nome:"");
    return (ordCol.dir==="desc"?TR("pan-maior"):TR("pan-menor"))+nome;
  }
  function botaoOrdem(cod){
    var b=el("button","pan-ord");b.type="button";
    var at=ordCol&&ordCol.cod===cod;
    b.className="pan-ord"+(at?" on":"");
    b.textContent=at?(ordCol.dir==="desc"?"↓":"↑"):"⇅";
    comTip(b,TR("pan-dica"));
    b.setAttribute("aria-label",TR("pan-dica"));
    b.addEventListener("click",function(e){
      e.preventDefault();e.stopPropagation();
      if(!ordCol||ordCol.cod!==cod)ordCol={cod:cod,dir:"desc"};
      else if(ordCol.dir==="desc")ordCol={cod:cod,dir:"asc"};
      else ordCol=null;
      pinta();});
    return b;
  }

  function pinta(){
    host.textContent="";
    var cols=colunas();
    var barra=el("div","pan-bar");
    if(ordCol){
      barra.appendChild(el("span","pan-b1",rotuloOrdem()));
      var z=el("button","zap",TR("pan-zerar"));z.type="button";
      z.addEventListener("click",function(){ordCol=null;pinta();});
      barra.appendChild(z);
    } else {
      barra.appendChild(el("span","pan-b0",TR("pan-ajuda")));
    }
    host.appendChild(barra);

    var t=el("table"),th=el("thead"),hr=el("tr");
    hr.appendChild(el("th","row","Macrotema"));
    cols.forEach(function(c){
      var th3=el("th");
      var dc=el("span","dot5");pintaFundo(dc,c.cor);th3.appendChild(dc);
      th3.appendChild(document.createTextNode(c.curto));
      hr.appendChild(th3);});
    hr.appendChild(el("th",null,"Total"));th.appendChild(hr);t.appendChild(th);

    var tb=el("tbody");
    D.macrotemas.forEach(function(m){
      var tr=el("tr"),soma=0;
      var th2=el("th","row");
      var a=el("a");nomeMT(m,a);a.href="#macrotemas/"+m.cod;a.style.color="inherit";a.style.textDecoration="none";
      a.addEventListener("mouseenter",function(){a.style.textDecoration="underline";});
      a.addEventListener("mouseleave",function(){a.style.textDecoration="none";});
      th2.appendChild(a);
      th2.appendChild(botaoOrdem(m.cod));
      tr.appendChild(th2);
      cols.forEach(function(c){
        var n=cel[m.cod+c.pre],pp=passo(n);soma+=n;
        var td=el("td",null,n?String(n):"");
        td.style.background=SEQ[pp];
        td.style.color=pp>=5?"#fff":(pp===0?"var(--muted)":"var(--ink)");
        comTip(td,c.nome+" · "+m.nome+" — "+(n?n+(n===1?" citação":" citações"):"nenhuma citação extraída"));
        tr.appendChild(td);});
      var tt=el("td",null,String(soma));tt.style.color="var(--muted)";tr.appendChild(tt);
      tb.appendChild(tr);});
    t.appendChild(tb);

    var tf=el("tfoot"),fr=el("tr");
    var fth=el("th","row","Total");fth.style.fontWeight="600";
    fth.appendChild(botaoOrdem("__total"));fr.appendChild(fth);
    var geral=0;
    cols.forEach(function(c){
      var n=totalCand(c);geral+=n;
      var td=el("td",null,String(n));
      td.style.fontWeight="600";td.style.background="var(--surface-2)";
      comTip(td,c.nome+" — "+n+" citações no total, somando os "+D.macrotemas.length+" macrotemas");
      fr.appendChild(td);});
    var tg=el("td",null,String(geral));tg.style.fontWeight="600";tg.style.background="var(--surface-2)";
    fr.appendChild(tg);tf.appendChild(fr);t.appendChild(tf);
    t.classList.add("t");
    t.dataset.dl="1";
    host.appendChild(t);
    /* ordenar por candidato (vertical) desfaz a ordem horizontal: as duas
       mexem na mesma tabela e só uma pode mandar de cada vez */
    ordenavel(t);
    window.__panCols=cols;
    try{traduzDOM(host);}catch(e){}
  }
  pinta();
  PEND.push(function(){
    window.DL.botoesDL(document.getElementById("heat"),{
      nome:"panorama-citacoes-por-macrotema",
      titulo:"Panorama — citações por macrotema e candidatura",
      sub:D.fichas.length+" citações conferidas, distribuídas em "+D.macrotemas.length+
        " macrotemas e "+D.candidatos.length+" documentos",
      fonte:"Contagem de citações extraídas de cada plano; quantidade mede como o documento foi escrito, não o que ele vale",
      linhas:function(){
        var R=[["macrotema"].concat(D.candidatos.map(function(c){return c.nome+" ("+c.partido+")";})).concat(["total"])];
        D.macrotemas.forEach(function(m){
          var lin=[m.nome],soma=0;
          D.candidatos.forEach(function(c){var n=cel[m.cod+c.pre];soma+=n;lin.push(n);});
          lin.push(soma);R.push(lin);});
        var fim=["TOTAL"],g=0;
        D.candidatos.forEach(function(c){var n=citDe(null,c.pre).length;g+=n;fim.push(n);});
        fim.push(g);R.push(fim);
        return R;}});
  });
  var lg=document.getElementById("hleg");
  [1,2,3,4,5,6,7].forEach(function(p){var i=el("i");i.style.background=SEQ[p];lg.appendChild(i);});
})();

/* ---------- especificidade ---------- */
(function(){
  var box=document.getElementById("stack"),NIV=[1,2,3,4,5],COR=[SEQ[2],SEQ[3],SEQ[4],SEQ[5],SEQ[7]],maxTot=0;
  D.candidatos.forEach(function(c){var n=fichasDe(null,c.pre).filter(function(f){return f.nivel;}).length;if(n>maxTot)maxTot=n;});
  D.candidatos.forEach(function(c){
    var fs=fichasDe(null,c.pre).filter(function(f){return f.nivel;});
    var row=el("div","srow");
    var nm=el("div","nm");
    var pd=el("span","dot5");pintaFundo(pd,c.cor);nm.appendChild(pd);
    nm.appendChild(document.createTextNode(c.nome+" "));
    nm.appendChild(el("span","pt-sig","("+c.partido+")"));row.appendChild(nm);
    var bar=el("div","sbar");
    NIV.forEach(function(nv,i){
      var n=fs.filter(function(f){return f.nivel===nv;}).length;if(!n)return;
      var s=el("span");s.style.flex=n;s.style.background=COR[i];
      comTip(s,c.nome+" — "+n+(n===1?" citação":" citações")+" no nível "+nv+" de 5");
      bar.appendChild(s);});
    bar.style.width=Math.max(28,fs.length/maxTot*100)+"%";
    var hold=el("div");hold.style.display="flex";hold.style.alignItems="center";hold.style.gap="10px";
    hold.appendChild(bar);
    var tot=el("span","mono",String(fs.length));tot.style.fontSize="12px";tot.style.color="var(--muted)";
    hold.appendChild(tot);row.appendChild(hold);box.appendChild(row);});
  var lg=document.getElementById("lvleg");
  ["1 diretriz genérica","2 conceitual","3 estruturada","4 detalhada","5 operacional"].forEach(function(t,i){
    var s=el("span"),b=el("b");b.style.background=COR[i];s.appendChild(b);
    s.appendChild(document.createTextNode(t));lg.appendChild(s);});
  PEND.push(function(){
    window.DL.botoesDL(box.parentNode||box,{
      nome:"grau-de-especificidade",
      titulo:"Grau de especificidade das citações",
      sub:"Quantas citações de cada documento ficam em cada nível de 1 a 5",
      fonte:"Nível atribuído citação a citação segundo os critérios descritos na aba Método",
      linhas:function(){
        var R=[["candidatura","partido","nivel 1 diretriz generica","nivel 2 conceitual",
                "nivel 3 estruturada","nivel 4 detalhada","nivel 5 operacional","total pontuadas"]];
        D.candidatos.forEach(function(c){
          var fs=fichasDe(null,c.pre).filter(function(f){return f.nivel;});
          var lin=[c.nome,c.partido];
          NIV.forEach(function(nv){lin.push(fs.filter(function(f){return f.nivel===nv;}).length);});
          lin.push(fs.length);R.push(lin);});
        return R;}});
  });
})();

/* ---------- dimensões ---------- */
(function(){
  var box=document.getElementById("dimc"),n=0;
  var L=Object.keys(DIMN).map(function(k){
    var v=D.fichas.map(function(f){return f.dims&&f.dims[k];}).filter(Boolean);
    n=Math.max(n,v.length);return{k:k,m:med(v),q:v.length};}).sort(function(a,b){return b.m-a.m;});
  document.getElementById("ndim").textContent=n;
  L.forEach(function(l){
    var r=el("div","drow");r.appendChild(el("div",null,DIMN[l.k]));
    var tr=el("div","dtrack"),f=el("i");f.style.width=(l.m/5*100)+"%";tr.appendChild(f);
    comTip(tr,DIMN[l.k]+" — média "+l.m.toFixed(2)+" de 5, em "+l.q+" citações pontuadas");
    r.appendChild(tr);r.appendChild(el("em",null,l.m.toFixed(2)));box.appendChild(r);});
  PEND.push(function(){
    window.DL.botoesDL(box.parentNode||box,{
      nome:"o-que-os-documentos-declaram",
      titulo:"O que os documentos costumam declarar",
      sub:"Média de cada dimensão, de 1 a 5, somando as citações pontuadas dos oito documentos",
      fonte:"Média simples das notas por dimensão; não é nota de governo nem ranking de candidatura",
      linhas:function(){
        var R=[["dimensao","media_1_a_5","citacoes_pontuadas"]];
        L.forEach(function(l){R.push([DIMN[l.k],l.m.toFixed(2),l.q]);});
        return R;}});
  });
})();

/* ---------- painel de ordem e cor ---------- */
/* paleta partidária já escolhida separada entre si: com os oito partidos de hoje
   nenhuma precisa ser deslocada, e todas ficam legíveis no tema claro e no escuro */
var PARTCOR={PL:"#1152B8",PT:"#E10600",PSD:"#12907A",NOVO:"#F07405",PRTB:"#46B04A",
  "Missão":"#E0B400",MISSAO:"#E0B400",PCO:"#7A2233",Avante:"#7B5CB8"};
var MIN_DIST=62;
function hex2rgb(h){h=String(h).replace("#","");
  if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
function rgb2hex(r){return "#"+r.map(function(v){
  var x=Math.max(0,Math.min(255,Math.round(v))).toString(16);return x.length<2?"0"+x:x;}).join("");}
function rgb2hsl(c){
  var r=c[0]/255,g=c[1]/255,b=c[2]/255;
  var mx=Math.max(r,g,b),mn=Math.min(r,g,b),h=0,s=0,l=(mx+mn)/2,d=mx-mn;
  if(d){s=l>0.5?d/(2-mx-mn):d/(mx+mn);
    h=mx===r?((g-b)/d+(g<b?6:0)):mx===g?((b-r)/d+2):((r-g)/d+4);h*=60;}
  return [h,s,l];}
function hsl2rgb(h){
  var H=((h[0]%360)+360)%360/360,S=h[1],L=h[2];
  if(!S)return [L*255,L*255,L*255];
  var q=L<0.5?L*(1+S):L+S-L*S,p=2*L-q;
  function f(t){t=t<0?t+1:(t>1?t-1:t);
    if(t<1/6)return p+(q-p)*6*t; if(t<1/2)return q;
    if(t<2/3)return p+(q-p)*(2/3-t)*6; return p;}
  return [f(H+1/3)*255,f(H)*255,f(H-1/3)*255];}
function dist(a,b){var x=hex2rgb(a),y=hex2rgb(b);
  return Math.sqrt(Math.pow(x[0]-y[0],2)+Math.pow(x[1]-y[1],2)+Math.pow(x[2]-y[2],2));}
/* sugere por partido e garante que não sobre cor repetida nem quase repetida */
function sugereCores(){
  var usadas=[],out={};
  D.candidatos.forEach(function(c){
    var base=PARTCOR[c.partido]||PARTCOR[String(c.partido).toUpperCase()]||hexRampa(c.rampa);
    var cor=base,t=0;
    /* se duas legendas tiverem cores parecidas, mexe primeiro na luminosidade —
       o tom é o que identifica o partido, e só gira como último recurso */
    while(t<40&&usadas.some(function(u){return dist(u,cor)<MIN_DIST;})){
      var h=rgb2hsl(hex2rgb(base));
      if(t<8){
        var d2=((t%2)?1:-1)*0.09*Math.ceil((t+1)/2);
        h[2]=Math.max(0.2,Math.min(0.72,h[2]+d2));
        h[1]=Math.min(1,h[1]*(t<4?1.05:0.9));
      } else {
        h[0]+=((t%2)?1:-1)*22*Math.ceil((t-7)/2);
        h[2]=Math.max(0.24,Math.min(0.68,h[2]+((t%2)?0.05:-0.05)));
      }
      cor=rgb2hex(hsl2rgb(h));t++;
    }
    usadas.push(cor);out[c.pre]=cor;});
  return out;
}
var SUP_COR=(function(){
  try{var i=document.createElement("input");i.setAttribute("type","color");
    return i.type==="color";}catch(e){return false;}
})();
function pintaPainelOC(){
  var host=document.getElementById("cfg-corpo");
  if(!host)return;
  host.textContent="";

  var si=el("div","oc-sec");
  si.appendChild(el("span","oc-rot","Idioma"));
  var li=el("div","oc-linha");
  [["pt","Português (Brasil)"],["en","English (United States)"]].forEach(function(o){
    var on=(IDIOMA===o[0]);
    var b=el("button","chip-cat"+(on?" on":""),o[1]);b.type="button";
    b.setAttribute("aria-pressed",on?"true":"false");
    b.addEventListener("click",function(){vaiParaIdioma(o[0]);});
    li.appendChild(b);});
  si.appendChild(li);
  si.appendChild(el("p","oc-nota",
    "Cada idioma é uma página com endereço próprio, então o link continua compartilhável. "+
    "As citações e os nomes dos documentos ficam em português nas duas: traduzidas, deixariam de ser a citação."));
  host.appendChild(si);

  var s0=el("div","oc-sec");
  s0.appendChild(el("span","oc-rot","Tema"));
  var l0=el("div","oc-linha");
  [["sistema","Do sistema"],["claro","Claro"],["escuro","Escuro"]].forEach(function(o){
    var at=temaAtual();
    var b=el("button","chip-cat"+(at===o[0]?" on":""),o[1]);b.type="button";
    b.setAttribute("aria-pressed",at===o[0]?"true":"false");
    b.addEventListener("click",function(){
      if(o[0]==="sistema")delete PREFS.tema; else PREFS.tema=o[0];
      gravaPrefs();aplicaTema();pintaPainelOC();});
    l0.appendChild(b);});
  s0.appendChild(l0);
  s0.appendChild(el("p","oc-nota",
    "Do sistema segue a preferência do aparelho e muda sozinho quando ele muda."));
  host.appendChild(s0);

  /* cartões dos blocos de apoio (AssistONE e Acessibilidade), quando carregados */
  if(window.CfgAssist)try{window.CfgAssist(host);}catch(e){}
  if(window.CfgAcess)try{window.CfgAcess(host);}catch(e){}

  /* só aparece quando existe trilha publicada: sem arquivo, a opção mentiria */
  if(!(document.getElementById("som")||{}).hidden){
    var sS=el("div","oc-sec");
    sS.appendChild(el("span","oc-rot","Trilha sonora"));
    var lS=el("div","oc-linha");
    [[false,"começar desligada"],[true,"começar ligada"]].forEach(function(o){
      var at=(PREFS.som!==false);
      var b=el("button","chip-cat"+(at===o[0]?" on":""),o[1]);b.type="button";
      b.setAttribute("aria-pressed",at===o[0]?"true":"false");
      b.addEventListener("click",function(){
        if(window.somPref)window.somPref(o[0]);
        pintaPainelOC();});
      lS.appendChild(b);});
    sS.appendChild(lS);
    sS.appendChild(el("p","oc-nota",
      "O alto-falante do cabeçalho liga e desliga a qualquer hora. Navegador não deixa site tocar som sozinho: "+
      "mesmo \u201ccomeçar ligada\u201d, a trilha só entra no primeiro toque na página."));
    host.appendChild(sS);
  }

  if(window.VozPainel)window.VozPainel(host);

  var s1=el("div","oc-sec");
  s1.appendChild(el("span","oc-rot","Ordem dos candidatos"));
  var l1=el("div","oc-linha");
  [["primeiro","alfabética de primeiro nome"],["sobrenome","alfabética de sobrenome"]]
    .forEach(function(o){
      var atual=(PREFS.ordem==="sobrenome")?"sobrenome":"primeiro";
      var b=el("button","chip-cat"+(atual===o[0]?" on":""),o[1]);b.type="button";
      b.setAttribute("aria-pressed",atual===o[0]?"true":"false");
      b.addEventListener("click",function(){
        if(((PREFS.ordem==="sobrenome")?"sobrenome":"primeiro")===o[0])return;
        PREFS.ordem=o[0];gravaPrefs();location.reload();});
      l1.appendChild(b);});
  if(PREFS.ordem==="sobrenome"){
    var r1=el("button","zap","Restaurar ordem publicada");r1.type="button";
    r1.addEventListener("click",function(){delete PREFS.ordem;gravaPrefs();location.reload();});
    l1.appendChild(r1);}
  s1.appendChild(l1);
  s1.appendChild(el("p","oc-nota",
    "O padrão é a ordem alfabética de primeiro nome. Cada candidatura mantém a própria cor "+
    "em qualquer ordem. Trocar a ordem recarrega a página."));
  host.appendChild(s1);

  var s2=el("div","oc-sec");
  s2.appendChild(el("span","oc-rot","Cor de cada candidatura"));
  var l2=el("div","oc-linha");
  var bs=el("button","chip-cat","Sugerir cores por partido");bs.type="button";
  bs.addEventListener("click",function(){
    PREFS.cores=sugereCores();
    if(!gravaPrefs())avisoOC(host,"não foi possível gravar no navegador");
    aplicaCores();pintaPainelOC();if(window.escreveVer)escreveVer();});
  l2.appendChild(bs);
  var temCor=Object.keys(PREFS.cores||{}).length>0;
  if(temCor){
    var br=el("button","zap","Restaurar cores originais");br.type="button";
    br.addEventListener("click",function(){
      PREFS.cores={};gravaPrefs();aplicaCores();pintaPainelOC();
      if(window.escreveVer)escreveVer();});
    l2.appendChild(br);}
  s2.appendChild(l2);

  var lst=el("div","oc-lista");
  D.candidatos.forEach(function(c){
    var it=el("div","oc-it");
    var val=(PREFS.cores[c.pre]||hexRampa(c.rampa));
    var cx=el("label","oc-cor");
    var sw2=el("span","oc-sw");pintaFundo(sw2,val);cx.appendChild(sw2);
    if(SUP_COR){
      var inp=document.createElement("input");inp.type="color";
      inp.value=val;
      inp.setAttribute("aria-label","Cor de "+c.nome);
      inp.addEventListener("input",function(){
        PREFS.cores[c.pre]=inp.value;
        pintaFundo(sw2,inp.value);
        if(!gravaPrefs())avisoOC(host,"não foi possível gravar no navegador");
        aplicaCores();
        var z=it.querySelector(".zerar");if(z)z.hidden=false;});
      cx.appendChild(inp);
    }
    it.appendChild(cx);
    it.appendChild(el("span","nm",c.nome));
    it.appendChild(el("span","pt",c.partido));
    var z=el("button","zerar","original");z.type="button";
    z.hidden=!PREFS.cores[c.pre];
    z.title="Volta esta candidatura para a cor da rampa publicada";
    z.addEventListener("click",function(){
      delete PREFS.cores[c.pre];gravaPrefs();aplicaCores();pintaPainelOC();});
    it.appendChild(z);
    lst.appendChild(it);});
  s2.appendChild(lst);
  if(!SUP_COR)s2.appendChild(el("p","oc-semcor",
    "Este navegador não abre seletor de cor, então a escolha uma a uma fica indisponível aqui. "+
    "A sugestão por partido e o botão de restaurar continuam funcionando."));
  s2.appendChild(el("p","oc-nota",
    "A sugestão usa a cor mais ligada a cada partido e afasta as que ficariam parecidas "+
    "(PT e PCO não saem no mesmo vermelho). Partido sem cor firmada, ou com a cor já tomada, "+
    "recebe um tom qualquer, que não representa a legenda. Cor de partido carrega significado, "+
    "por isso não é o padrão do site. Uma cor escolhida a mão fica igual nos temas claro e escuro."));
  host.appendChild(s2);

  /* aba Infográficos: as mesmas duas marcações que aparecem no cartão de índice,
     repetidas aqui porque é aqui que as preferências ficam reunidas */
  var s3=el("div","oc-sec");
  s3.appendChild(el("span","oc-rot","Gráficos"));
  var l3=el("div","oc-linha");
  var estreitoCfg=(window.matchMedia&&window.matchMedia("(max-width: 780px)").matches);
  [["marcos","Marcos de acontecimentos"],["fotos","Retratos dos presidentes"]].forEach(function(o){
    var on=(PREFS[o[0]]!==undefined)?!!PREFS[o[0]]:!estreitoCfg;
    var b=el("button","chip-cat"+(on?" on":""),o[1]);b.type="button";
    b.setAttribute("aria-pressed",on?"true":"false");
    b.addEventListener("click",function(){
      PREFS[o[0]]=!on;gravaPrefs();
      pintaPainelOC();
      if(window.repintaIG)window.repintaIG();
      if(window.escreveVer)escreveVer();});
    l3.appendChild(b);});
  s3.appendChild(l3);
  s3.appendChild(el("p","oc-nota",
    "Valem para todos os gráficos. Marcos são as linhas verticais de acontecimentos importantes; "+
    "retratos mostram quem era o presidente em cada faixa. No celular os dois começam desligados, "+
    "para não roubar espaço do gráfico."));
  host.appendChild(s3);

  /* Sobre: versão, o que mudou e aviso de uso — leitura, não ajuste, mas é aqui
     que a pessoa procura quando quer saber o que este site é */
  if(window.Offline)try{host.appendChild(Offline.secao());}catch(e){}   /* F1-PR8: Usar sem internet e atalho na tela inicial (modulos/offline.js) */
  var s4=el("div","oc-sec");
  s4.appendChild(el("span","oc-rot","Sobre este site"));
  var l4=el("div","sb-l");
  var bN=el("button","chip-cat","O que mudou");bN.type="button";
  bN.addEventListener("click",function(){EJ.aPartirDe(document.getElementById("cfg"),function(v){abreDoc("novidades",v);},abreConfig);});
  var bA=el("button","chip-cat","Aviso de uso e privacidade");bA.type="button";
  bA.addEventListener("click",function(){EJ.aPartirDe(document.getElementById("cfg"),function(v){abreDoc("aviso",v);},abreConfig);});
  l4.appendChild(bN);l4.appendChild(bA);
  s4.appendChild(l4);
  s4.appendChild(el("p","oc-nota",
    TR("sb-n1")+" "+(D.versao||"—")+", "+TR("sb-n2")+" "+dataBR(D.atualizado_em)+". "+TR("sb-n3")));
  host.appendChild(s4);
}
function dataBR(iso){
  var p=String(iso||"").split("-");
  return p.length===3?p[2]+"/"+p[1]+"/"+p[0]:String(iso||"");
}
/* painel de leitura: histórico de versões e aviso de uso */
function abreDoc(qual,voltar){
  var dlg=document.getElementById("doc"),tit=document.getElementById("doc-t"),
      cx=document.getElementById("doc-corpo");
  if(!dlg||!cx)return;
  cx.textContent="";
  if(qual==="novidades"){
    tit.textContent=TR("sb-t1");
    /* uma data só, a da última atualização: o histórico conta a sequência de
       publicações, não pretende datar cada uma */
    var topo=el("p","sb-d");topo.style.margin="0 0 16px";
    topo.appendChild(document.createTextNode(TR("sb-ult")+" "+dataBR(D.atualizado_em)));
    cx.appendChild(topo);
    (D.versoes||[]).forEach(function(v){
      var bl=el("div","sb-v"),h=el("div","sb-h");
      if(v.v)h.appendChild(el("span","sb-n",v.v));
      if(v.atual)h.appendChild(el("span","sb-a",TR("sb-atual")));
      bl.appendChild(h);
      var ul=el("ul");
      (v.itens||[]).forEach(function(i){ul.appendChild(el("li",null,i));});
      bl.appendChild(ul);cx.appendChild(bl);});
    if(D.versoes_nota)cx.appendChild(el("p","sb-f",D.versoes_nota));
  } else {
    tit.textContent=TR("sb-t2");
    (D.aviso_uso||[]).forEach(function(o){
      var pp=el("p","sb-p");
      pp.appendChild(el("b",null,o.t+". "));
      pp.appendChild(document.createTextNode(o.p));
      cx.appendChild(pp);});
    if(D.aviso_uso_rodape)cx.appendChild(el("p","sb-f",D.aviso_uso_rodape));
  }
  traduzDOM(cx);traduzDOM(tit);
  cx.scrollTop=0;
  EJ.abre(dlg,{aoFechar:function(){if(voltar)EJ.quando(voltar);}});
}
(function(){
  var dlg=document.getElementById("doc"),x=document.getElementById("doc-x");
  if(!dlg)return;
  if(x)x.addEventListener("click",function(){EJ.fecha(dlg);});
})();
function avisoOC(host,msg){
  var p=host.querySelector(".oc-erro");
  if(!p){p=el("p","oc-nota oc-erro");p.style.color="var(--warn)";host.appendChild(p);}
  p.textContent="A escolha vale nesta visita, mas "+msg+" — em janela anônima ou com dados de site "+
    "bloqueados, ela se perde ao recarregar.";
}
(function(){
  var a=document.getElementById("oc-atalho");
  if(!a)return;
  a.innerHTML=SVG_ENG;
  a.appendChild(document.createTextNode("Abrir configurações de ordem, cor e tema"));
  a.addEventListener("click",abreConfig);
})();

/* ---------- legenda de candidatos ---------- */
(function(){
  var lg=document.getElementById("candleg");
  D.candidatos.forEach(function(c){
    var s=el("span"),b=el("b");pintaFundo(b,c.cor);s.appendChild(b);
    s.appendChild(document.createTextNode(c.nome+" ("+c.partido+")"));lg.appendChild(s);});
})();

/* ---------- documentos ---------- */
(function(){
  var t=document.getElementById("docs"),th=el("thead"),hr=el("tr");
  ["Candidatura","Documento","Data do documento","Páginas","Citações","Onde ver o original","PDF"]
    .forEach(function(h,i){hr.appendChild(el("th",(i===3||i===4)?"n":null,h));});
  th.appendChild(hr);t.appendChild(th);
  var tb=el("tbody");
  D.candidatos.forEach(function(c){
    var tr=el("tr"),td=el("td","nm"),d=el("span","dot5");pintaFundo(d,c.cor);
    td.appendChild(d);td.appendChild(document.createTextNode(c.nome));td.appendChild(el("span","sub",c.partido));
    tr.appendChild(td);tr.appendChild(el("td",null,(DOCS[c.pre]||{}).doc||"—"));
    var DL=(window.__DLINKS__||{docs:{}}).docs[c.pre]||{};
    var tdd=el("td");
    if(DL.data_documento){
      var pd=String(DL.data_documento).split("-");
      tdd.appendChild(document.createTextNode(pd.length===3?pd[2]+"/"+pd[1]+"/"+pd[0]:DL.data_documento));
      var rot={registro_tse:"registro no TSE",publicacao_partido:"publicação do partido"}[DL.tipo_data];
      if(rot)tdd.appendChild(el("span","sub",rot));
    } else {
      var sn=el("span",null,"não informada");sn.style.color="var(--muted)";tdd.appendChild(sn);
    }
    tr.appendChild(tdd);
    tr.appendChild(el("td","n",String((DOCS[c.pre]||{}).pag||"—")));
    tr.appendChild(el("td","n",String(citDe(null,c.pre).length)));
    var tdo=el("td");
    if(DL.pagina_tse){
      var a1=el("a","dl",TR("dl-tse-cap"));a1.href=DL.pagina_tse;a1.target="_blank";a1.rel="noopener noreferrer";
      tdo.appendChild(a1);}
    if(DL.site_partido){
      var a2=el("a","dl","Site do partido");a2.href=DL.site_partido;a2.target="_blank";a2.rel="noopener noreferrer";
      a2.style.display="block";a2.style.marginTop="4px";tdo.appendChild(a2);}
    if(!DL.pagina_tse&&!DL.site_partido)tdo.appendChild(document.createTextNode("—"));
    tr.appendChild(tdo);
    var tdp=el("td");
    if(D.pdfs&&D.pdfs[c.pre]){
      var a=el("a","dl","↓ Baixar PDF");
      a.href=encodeURI(D.pdfs[c.pre]);a.setAttribute("download","");
      a.title=TR("plano-de")+c.nome+TR("plano-reg");
      tdp.appendChild(a);
    } else tdp.appendChild(el("span",null,"—"));
    tr.appendChild(tdp);
    tb.appendChild(tr);});
  t.appendChild(tb);ordenavel(t);

  var p=document.getElementById("perfil"),th2=el("thead"),hr2=el("tr");
  ["Documento","Citações","Propostas","Diretrizes","Nível médio","Macrotemas"].forEach(function(h,i){
    hr2.appendChild(el("th",i?"n":null,h));});
  th2.appendChild(hr2);p.appendChild(th2);
  var tb2=el("tbody");
  D.candidatos.forEach(function(c){
    var fs=citDe(null,c.pre),tr=el("tr"),td=el("td","nm"),d=el("span","dot5");pintaFundo(d,c.cor);
    td.appendChild(d);td.appendChild(document.createTextNode(c.nome));
    td.appendChild(el("span","sub",(DOCS[c.pre]||{}).doc||""));tr.appendChild(td);
    var niv=fs.map(function(f){return f.nivel;}).filter(Boolean);
    [String(fs.length),
     String(fs.filter(function(f){return f.tipo==="proposta";}).length),
     String(fs.filter(function(f){return f.tipo==="diretriz";}).length),
     med(niv).toFixed(2)].forEach(function(v){tr.appendChild(el("td","n",v));});
    var mc={};fs.forEach(function(f){mc[f.macro]=1;});
    tr.appendChild(el("td","n",Object.keys(mc).length+" de "+D.macrotemas.length));
    tb2.appendChild(tr);});
  p.appendChild(tb2);ordenavel(p);
})();

/* ---------- limites ---------- */
(function(){
  var L=[
   ["A escolha do macrotema é julgamento","A citação e a página são conferíveis caractere a caractere. Em qual macrotema uma proposta entra, não: é decisão de quem extraiu. É a etapa menos auditável do estudo.","Se houver discordância quanto a uma alocação, a citação traz a página e o trecho para refazê-la."],
   ["A seleção do trecho não é conferível","O script prova que o trecho citado existe na página. Não prova que seja a passagem mais importante daquela seção — isso é escolha de quem extrai.","As páginas estão declaradas. Abra o documento e leia a seção inteira se a escolha lhe parecer estreita."],
   ["A contagem de citações depende de um corte","Quantas citações uma seção rende depende de onde se decide que termina uma unidade de política e começa outra. Entre 4 e 12 por candidato por macrotema.","Por isso nenhum total por candidatura é apresentado como resultado, e as tabelas são sempre por macrotema."],
   ["Nenhuma revisão por terceiro independente","Quem extraiu, classificou e pontuou foi a mesma parte. Não houve segunda leitura cega nem auditoria externa.","As justificativas estão escritas item a item, para que a discordância seja possível item a item."],
   ["Os documentos não são comparáveis em extensão","Têm de 7 a 200 páginas: um é um programa partidário de sete páginas e outro passa de duzentas. Um documento que enumera medidas rende mais citações que um que enuncia direções, com o mesmo conteúdo de política.","As tabelas são sempre por macrotema, e a contagem vem sempre com a nota de leitura ao lado."],
   ["O índice do recorte escolhido não mede governo","A aba “Índice sob medida” calcula o quanto o texto declara meta, custo, prazo e indicador nos temas que forem escolhidos. Não mede se a política é boa, viável ou desejável.","Os pesos são definidos por quem usa a página, o cálculo é aberto e o resultado muda conforme a ordem escolhida."]];
  var t=document.getElementById("limites"),th=el("thead"),hr=el("tr");
  ["Limite","O que significa","O contrapeso"].forEach(function(h){hr.appendChild(el("th",null,h));});
  th.appendChild(hr);t.appendChild(th);
  var tb=el("tbody");
  L.forEach(function(r){
    var tr=el("tr");tr.appendChild(el("td","nm",r[0]));tr.appendChild(el("td",null,r[1]));
    var c=el("td",null,r[2]);c.style.color="var(--muted)";tr.appendChild(c);tb.appendChild(tr);});
  t.appendChild(tb);
})();

/* ---------- controle de viés ---------- */
(function(){
  var t=document.getElementById("vies");if(!t)return;
  var F=D.fichas.filter(function(f){return f.tipo!=="ausencia_declarada";});
  var COLS=[["Nível médio","nivel"],["% propostas","prop"],["Clareza","clareza"],["Custo","custo"],
            ["Prazo","prazo"],["Indicadores","indicadores"],["Citação (caracteres)","ql"]];
  var dados=D.candidatos.map(function(c){
    var fs=F.filter(function(f){return f.cand===c.pre;});
    function dim(k){return med(fs.map(function(f){return f.dims&&f.dims[k];}).filter(Boolean));}
    return{nome:c.nome,cor:c.cor,n:fs.length,
      nivel:med(fs.map(function(f){return f.nivel;}).filter(Boolean)),
      prop:fs.filter(function(f){return f.tipo==="proposta";}).length/fs.length*100,
      clareza:dim("clareza"),custo:dim("custo"),prazo:dim("prazo"),indicadores:dim("indicadores"),
      ql:med(fs.map(function(f){return f.quote?f.quote.length:0;}).filter(Boolean))};});
  var th=el("thead"),hr=el("tr");hr.appendChild(el("th",null,"Documento"));
  COLS.forEach(function(c){hr.appendChild(el("th","n",c[0]));});
  hr.appendChild(el("th","n","Citações"));th.appendChild(hr);t.appendChild(th);
  var tb=el("tbody");
  dados.forEach(function(r){
    var tr=el("tr"),td=el("td","nm"),dd=el("span","dot5");pintaFundo(dd,r.cor);
    td.appendChild(dd);td.appendChild(document.createTextNode(r.nome));tr.appendChild(td);
    COLS.forEach(function(c){var v=r[c[1]];
      tr.appendChild(el("td","n",c[1]==="prop"?Math.round(v)+"%":(c[1]==="ql"?String(Math.round(v)):v.toFixed(2))));});
    tr.appendChild(el("td","n",String(r.n)));tb.appendChild(tr);});
  t.appendChild(tb);
  var tf=el("tfoot"),fr=el("tr");fr.appendChild(el("td",null,"Amplitude (maior − menor)"));
  COLS.forEach(function(c){var v=dados.map(function(r){return r[c[1]];});
    var a=Math.max.apply(null,v)-Math.min.apply(null,v);
    fr.appendChild(el("td","n",c[1]==="prop"?Math.round(a)+" p.p.":(c[1]==="ql"?String(Math.round(a)):a.toFixed(2))));});
  fr.appendChild(el("td","n",""));tf.appendChild(fr);t.appendChild(tf);
  ordenavel(t);
})();

/* ---------- macrotemas: seletor ---------- */
var mtAtual="";
(function(){
  var p=document.getElementById("mtpick");
  function add(cod,rot,n,m){
    var b=el("button");b.type="button";b.dataset.m=cod;
    if(m)nomeMT(m,b);else b.appendChild(document.createTextNode(rot));
    b.appendChild(el("span",null,String(n)));
    b.addEventListener("click",function(){
      mtAtual=cod;marca();render();
      history.replaceState(null,"","#macrotemas"+(cod?"/"+cod:""));});
    p.appendChild(b);}
  add("","Todos",D.fichas.length);
  D.macrotemas.forEach(function(m){add(m.cod,m.nome,citDe(m.cod,null).length,m);});
})();
function marca(){
  document.querySelectorAll("#mtpick button").forEach(function(b){
    b.setAttribute("aria-pressed",b.dataset.m===mtAtual?"true":"false");});
}

/* ---------- filtros multiselect ---------- */
var FAMS=(function(){
  var o={},L=[];
  D.macrotemas.forEach(function(m){
    var f=m.familia||m.nome.split(":")[0];
    if(!o[f]){o[f]={f:f,n:0,cods:[]};L.push(o[f]);}
    o[f].n+=citDe(m.cod,null).length; o[f].cods.push(m.cod);});
  L.sort(function(a,b){return a.f.localeCompare(b.f,"pt");});
  return L;})();
var msFam=multi("ms-fam",FAMS.map(function(x){return{v:x.f,r:x.f,n:x.n};}),"categorias",function(){
  // escolher categoria limpa o macrotema aberto, para não haver filtro contraditório
  if(msFam.vals().length && mtAtual){mtAtual="";marca();history.replaceState(null,"","#macrotemas");}
  render();});
var msCand=multi("ms-cand",D.candidatos.map(function(c){
  return{v:c.pre,r:c.nome+" ("+c.partido+")",cor:c.cor,n:citDe(null,c.pre).length};}),"candidatos",function(){render();});
var msTipo=multi("ms-tipo",Object.keys(TIPO).map(function(k){
  return{v:k,r:TIPO[k],n:D.fichas.filter(function(f){return f.tipo===k;}).length};}),"tipos",function(){render();});
var msNivel=multi("ms-nivel",[1,2,3,4,5].map(function(n){
  return{v:String(n),r:"Nível "+n,n:D.fichas.filter(function(f){return f.nivel===n;}).length};}),"níveis",function(){render();});

/* ---------- cartão de citação ---------- */
function cartao(f){
  var c=CAND[f.cand],m=MACRO[f.macro];
  var a=el("article","f");a.style.setProperty("--cc",c.cor);
  var h=el("div","f-h");
  h.appendChild(el("span","who",c.nome));
  h.appendChild(el("span","pt",c.partido));
  var chp=el("span","chip "+f.tipo,TIPO[f.tipo]||f.tipo);h.appendChild(chp);
  h.appendChild(el("span","id",f.id));a.appendChild(h);
  if(f.quote&&f.verbatim)a.appendChild(el("blockquote",null,"“"+f.quote+"”"));
  else if(f.quote){var pw=el("div","para");
    pw.appendChild(el("div","para-k","Paráfrase da extração — não é transcrição"));
    pw.appendChild(el("p","para-t",f.quote));a.appendChild(pw);}
  else a.appendChild(el("p","noq",f.tipo==="ausencia_declarada"
      ?"Ausência declarada: o documento não trata do ponto."
      :"A citação literal não pôde ser extraída do documento."));
  var lo=el("div","loc");
  lo.appendChild(el("span","k",(mtAtual?"":m.nome+" · ")+TR("Localização")+" "));
  lo.appendChild(document.createTextNode(f.page||"não declarada"));
  if(f.quote){
    /* copiar/compartilhar: o trecho, quem disse, a página e o link desta tela */
    var cp=el("button","f-share",TR("f-copiar"));cp.type="button";
    cp.title=TR("f-copiar-tip");
    cp.addEventListener("click",function(e){e.preventDefault();
      var txt=(f.verbatim?"“"+f.quote+"”":f.quote)+"\n— "+c.nome+" ("+c.partido+"), "+
        ((DOCS[c.pre]||{}).doc||TR("plano-de")+c.nome)+(f.page?", "+f.page:"")+"\n"+
        TR("share-fonte")+" "+location.href.split("#")[0]+"#macrotemas/"+f.macro;
      if(window.PGShare)window.PGShare.texto(txt,cp,TR("f-copiado"));});
    lo.appendChild(cp);}
  a.appendChild(lo);
  if(f.nivel){
    var sp=el("div","spec"),dt=el("div","dots");
    for(var i=1;i<=5;i++)dt.appendChild(el("i",i<=f.nivel?"on":null));
    sp.appendChild(dt);sp.appendChild(el("small",null,"Especificidade "+f.nivel+" de 5"));sp.appendChild(info("especificidade"));a.appendChild(sp);}
  var tem=f.dims&&Object.keys(f.dims).some(function(k){return f.dims[k]!=null;});
  if(f.nivel_just||tem||f.overlap||f.termos){
    var d=el("details"),s=el("summary",null,"Dimensões e observações");d.appendChild(s);
    var b=el("div","din");
    if(f.nivel_just)b.appendChild(el("p","just",f.nivel_just));
    if(tem){var g=el("div","dd");
      Object.keys(DIMN).forEach(function(k){var v=f.dims[k];if(v==null)return;
        var w=el("div");w.appendChild(el("span",null,DIMN[k]));w.appendChild(el("b",null,String(v)));g.appendChild(w);});
      b.appendChild(g);}
    if(f.overlap)b.appendChild(el("p","ov",TR("ov-rot")+" "+f.overlap));
    if(f.termos&&f.termos.length)b.appendChild(el("p","tm",TR("tm-rot")+" "+f.termos.join(" · ")));
    d.appendChild(b);a.appendChild(d);}
  return a;
}

/* ---------- nota de leitura ---------- */
function montaNota(cod){
  var m=MACRO[cod],fs=citDe(cod,null),todas=fichasDe(cod,null);
  var box=el("div","card pad");
  box.appendChild(el("h4",null,"Nota de leitura — "+m.nome));
  var det=D.candidatos.map(function(c){return c.curto+" "+citDe(cod,c.pre).length;}).join(" · ");
  box.appendChild(el("p",null,"São "+fs.length+" citações neste macrotema: "+det+
    ". A contagem mede como cada documento foi escrito e organizado — não a importância que a candidatura dá ao tema, "+
    "nem a qualidade da política que resultaria de um eventual governo."));
  var ausenc=todas.filter(function(f){return f.tipo==="ausencia_declarada";});
  /* quem declarou ausência já é tratado no parágrafo próprio: não repetir aqui */
  var semCitação=D.candidatos.filter(function(c){return !citDe(cod,c.pre).length &&
    !ausenc.some(function(f){return f.cand===c.pre;});});
  if(ausenc.length){
    box.appendChild(el("p",null,"Ausência declarada: "+ausenc.map(function(f){return CAND[f.cand].nome;}).join(", ")+
      ". Isso significa que a busca por palavra-chave no documento inteiro não encontrou o tema — é informação sobre a "+
      "cobertura daquele texto, não sobre a posição da candidatura. Os termos pesquisados estão na própria citação."));}
  if(semCitação.length){
    box.appendChild(el("p",null,"Sem citações neste macrotema: "+semCitação.map(function(c){return c.nome;}).join(", ")+
      ". O tema pode estar tratado dentro de outro capítulo do documento e ter sido registrado no macrotema onde o texto o coloca."));}
  var prop=fs.filter(function(f){return f.tipo==="proposta";}).length;
  var dir=fs.filter(function(f){return f.tipo==="diretriz";}).length;
  var niv=fs.map(function(f){return f.nivel;}).filter(Boolean);
  var cob=fs.map(cobravel).filter(function(x){return x!==null;});
  box.appendChild(el("p",null,"Neste macrotema, "+prop+(prop===1?" citação é proposta":" citações são propostas")+
    " e "+dir+(dir===1?" é diretriz":" são diretrizes")+". Nenhuma das duas formas é melhor que a outra: a diferença "+
    "está no que será possível cobrar ao fim do mandato."));
  var mini=el("div","mini");
  [[med(niv).toFixed(2),"nível médio de especificidade","nivelmedio"],
   [med(fs.map(function(f){return f.dims&&f.dims.custo;}).filter(Boolean)).toFixed(2),"média em custo declarado","custo"],
   [med(fs.map(function(f){return f.dims&&f.dims.prazo;}).filter(Boolean)).toFixed(2),"média em prazo declarado","prazo"],
   [med(cob).toFixed(2),"média do que é cobrável","cobravel"]].forEach(function(p){
    var d=el("div");d.appendChild(el("b",null,p[0]));
    d.appendChild(document.createTextNode(p[1]));d.appendChild(info(p[2]));mini.appendChild(d);});
  box.appendChild(mini);
  return box;
}

/* ---------- render ---------- */
var box=document.getElementById("cards"),cnt=document.getElementById("cnt"),
    acts=document.getElementById("mtacts"),nota=document.getElementById("mtnota");
function render(){
  var fc=msCand.vals(),ft=msTipo.vals(),fn=msNivel.vals(),
      q=document.getElementById("f-busca").value.trim().toLowerCase();
  var ff=msFam.vals();
  var L=D.fichas.filter(function(f){
    if(mtAtual&&f.macro!==mtAtual)return false;
    if(ff.length){var m=MACRO[f.macro];var fam=m.familia||m.nome.split(":")[0];
      if(ff.indexOf(fam)<0)return false;}
    if(fc.length&&fc.indexOf(f.cand)<0)return false;
    if(ft.length&&ft.indexOf(f.tipo)<0)return false;
    if(fn.length&&fn.indexOf(String(f.nivel))<0)return false;
    if(q){var h=((f.quote||"")+" "+(f.page||"")+" "+(f.nivel_just||"")+" "+f.id).toLowerCase();
      if(h.indexOf(q)<0)return false;}
    return true;});
  cnt.textContent=L.length+(L.length===1?TR("cit-1"):TR("cit-n"))+TR("cit-de")+D.fichas.length;
  (function(){
    if(!window.DL)return;
    var hospeda=document.getElementById("mt-dl");
    if(!hospeda){hospeda=el("div");hospeda.id="mt-dl";
      var ref=document.getElementById("mtnota");
      if(ref&&ref.parentNode)ref.parentNode.insertBefore(hospeda,ref);else return;}
    hospeda.textContent="";
    var titulo=mtAtual?("Citações — "+MACRO[mtAtual].nome):"Citações — todos os macrotemas";
    var nome="citacoes-"+(mtAtual?MACRO[mtAtual].nome.toLowerCase().normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""):"todos");
    window.DL.botoesDL(hospeda,{
      nome:nome,titulo:titulo,
      sub:L.length+" citação(ões) no recorte atual de filtros, de "+D.fichas.length+" no total",
      fonte:"Citações conferidas contra o PDF registrado de cada candidatura; a coluna Página indica onde conferir",
      textoCortado:true,
      linhas:function(){
        var R=[["macrotema","candidatura","partido","tipo","nivel_de_especificidade",
                "trecho_citado","onde_no_documento","por_que_esse_nivel","id_da_ficha"]];
        L.forEach(function(f){
          var c=CAND[f.cand]||{};
          R.push([(MACRO[f.macro]||{}).nome||f.macro,c.nome||f.cand,c.partido||"",f.tipo||"",
                  f.nivel==null?"":f.nivel,f.quote||"",f.page||"",f.nivel_just||"",f.id]);});
        return R;}
    });
  })();

  acts.textContent="";nota.hidden=true;nota.textContent="";
  if(mtAtual){
    var barra=el("div","mt-acts");
    var bN=el("button","act","Nota de leitura");bN.type="button";
    bN.addEventListener("click",function(){
      if(nota.hidden){nota.textContent="";nota.appendChild(montaNota(mtAtual));nota.hidden=false;
        bN.textContent="Fechar nota de leitura";bN.classList.add("pri");}
      else{nota.hidden=true;bN.textContent="Nota de leitura";bN.classList.remove("pri");}});
    barra.appendChild(bN);
    var prox=D.macrotemas[(D.macrotemas.map(function(m){return m.cod;}).indexOf(mtAtual)+1)%D.macrotemas.length];
    var bP=el("button","act","Próximo macrotema: "+prox.nome+" →");bP.type="button";
    bP.addEventListener("click",function(){mtAtual=prox.cod;marca();render();
      history.replaceState(null,"","#macrotemas/"+prox.cod);scrollTo(0,0);});
    barra.appendChild(bP);
    var bT=el("button","act","Ver todos os macrotemas");bT.type="button";
    bT.addEventListener("click",function(){mtAtual="";marca();render();
      history.replaceState(null,"","#macrotemas");scrollTo(0,0);});
    barra.appendChild(bT);
    acts.appendChild(barra);
  } else {
    var b2=el("div","mt-acts");
    D.macrotemas.slice(0,0).forEach(function(){});
    var hint=el("p","sec-n","Escolha um macrotema acima para ver a nota de leitura dele.");
    hint.style.margin="16px 0 0";b2.appendChild(hint);acts.appendChild(b2);
  }
  box.textContent="";
  if(!L.length){box.appendChild(el("p","empty","Nenhuma citação com esses filtros."));return;}
  var fr=document.createDocumentFragment();
  L.forEach(function(f){fr.appendChild(cartao(f));});
  box.appendChild(fr);
}
document.getElementById("f-busca").addEventListener("input",render);
document.getElementById("reset").addEventListener("click",function(){
  msFam.limpar();msCand.limpar();msTipo.limpar();msNivel.limpar();
  document.getElementById("f-busca").value="";mtAtual="";marca();
  history.replaceState(null,"","#macrotemas");render();});

/* ---------- tema ---------- */
/* ---------- tema e configurações ---------- */
function temaAtual(){
  return (PREFS.tema==="claro"||PREFS.tema==="escuro")?PREFS.tema:"sistema";
}
function escuroAgora(){
  var t=temaAtual();
  if(t==="escuro")return true;
  if(t==="claro")return false;
  try{return matchMedia("(prefers-color-scheme: dark)").matches;}catch(e){return false;}
}
function aplicaTema(){
  var r=document.documentElement, t=temaAtual();
  if(t==="sistema")r.removeAttribute("data-theme");
  else r.setAttribute("data-theme",t==="escuro"?"dark":"light");
  var b=document.getElementById("theme");
  if(b)b.innerHTML=escuroAgora()?SVG_SOL:SVG_LUA;
  try{dispatchEvent(new Event("pgtema"));}catch(e){}
}
aplicaTema();
document.getElementById("theme").addEventListener("click",function(){
  PREFS.tema=escuroAgora()?"claro":"escuro";
  gravaPrefs();aplicaTema();
  try{pintaPainelOC();}catch(e){}
});
(function(){
  var g=document.getElementById("cfg-b");
  if(g)g.innerHTML=SVG_ENG;
})();
function abreConfig(){
  var d=document.getElementById("cfg");
  if(!d)return;
  try{pintaPainelOC();}catch(e){}
  /* a chave colada e ainda não guardada é o único texto que se perderia: pergunta "Descartar?" */
  EJ.abre(d,{temTexto:function(){return [].some.call(d.querySelectorAll("input[data-sj-texto]"),function(i){return i.value.trim()!=="";});}});
}
(function(){
  var b=document.getElementById("cfg-b"), d=document.getElementById("cfg"),
      x=document.getElementById("cfg-x");
  if(b)b.addEventListener("click",abreConfig);
  if(x)x.addEventListener("click",function(){EJ.fecha(d);});
})();

/* ================= SEU RECORTE (score) ================= */
var top5=[], PESOS=[5,4,3,2,1], modoIgual=false;
function idxCM(cod,pre){
  var fs=fichasDe(cod,pre).filter(function(f){return f.tipo!=="ausencia_declarada";});
  var v=fs.map(cobravel).filter(function(x){return x!==null;});
  return v.length?{idx:med(v),n:fs.length}:null;
}
var poolBusca="", poolFam=[];
function pintaPool(){
  var pool=document.getElementById("pool");pool.textContent="";
  var fams=[];
  D.macrotemas.forEach(function(m){if(fams.indexOf(m.familia)<0)fams.push(m.familia);});
  fams.sort(function(a,b){return a.localeCompare(b,"pt");});

  var ctl=el("div","pool-ctl");
  var l1=el("div","uf-linha");
  l1.appendChild(el("span","uf-rot","Categoria"));
  var bt=el("button","chip-cat"+(poolFam.length?"":" on"),"Todas");bt.type="button";
  bt.addEventListener("click",function(){poolFam=[];pintaPool();});
  l1.appendChild(bt);
  fams.forEach(function(f){
    var on=poolFam.indexOf(f)>=0;
    var b2=el("button","chip-cat"+(on?" on":""),f);b2.type="button";
    b2.setAttribute("aria-pressed",on?"true":"false");
    b2.addEventListener("click",function(){
      var i=poolFam.indexOf(f);
      if(i>=0)poolFam.splice(i,1);else poolFam.push(f);
      pintaPool();});
    l1.appendChild(b2);});
  ctl.appendChild(l1);
  var l2=el("div","uf-linha");
  l2.appendChild(el("span","uf-rot","Buscar"));
  var inp=el("input");inp.type="search";inp.className="idx-b pool-b";
  inp.placeholder="palavra do macrotema";inp.value=poolBusca;
  inp.addEventListener("input",function(){poolBusca=inp.value;pintaPool();
    var e=document.querySelector(".pool-b");if(e)e.focus();});
  l2.appendChild(inp);
  ctl.appendChild(l2);
  pool.appendChild(ctl);

  function normx(t){return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");}
  var q=normx(poolBusca.trim());
  var nDentro=0;
  function dentro(m){
    if(poolFam.length&&poolFam.indexOf(m.familia)<0)return false;
    if(q&&normx(m.nome).indexOf(q)<0)return false;
    return true;
  }
  D.macrotemas.forEach(function(m){if(dentro(m))nDentro++;});
  fams.forEach(function(f){
    var lista=D.macrotemas.filter(function(m){return m.familia===f;});
    if(!lista.length)return;
    var g=el("div","pool-g"+(lista.some(dentro)?"":" fora"));
    g.appendChild(el("div","pool-gk",f));
    var box=el("div","pool-b2");
    lista.forEach(function(m){
      var no=dentro(m);
      var b3=el("button",no?null:"fora",m.titulo||m.nome);b3.type="button";
      b3.disabled=modoIgual||top5.indexOf(m.cod)>=0||top5.length>=5;
      if(!no&&!b3.disabled)b3.title="fora do filtro atual — clique para escolher assim mesmo";
      b3.addEventListener("click",function(){
        if(top5.length<5&&top5.indexOf(m.cod)<0){top5.push(m.cod);pintaTudo();}});
      box.appendChild(b3);});
    g.appendChild(box);
    pool.appendChild(g);});
  var cnt=el("p","pool-cnt",nDentro+" de "+D.macrotemas.length+
    " macrotemas no filtro. Os demais continuam clicáveis, apenas esmaecidos.");
  pool.insertBefore(cnt,pool.children[1]||null);
}

function pintaRecortes(){
  var host=document.getElementById("recortes"); if(!host||!D.recortes) return;
  host.textContent="";
  var h=el("div","sec-h");h.appendChild(el("h2","","Começar por um exemplo"));
  h.firstChild.style.fontSize="19px";host.appendChild(h);
  host.appendChild(el("p","sec-n",
    "Oito combinações prontas, cada uma partindo de uma prioridade diferente. Elas existem para mostrar como a "+
    "ordem muda o resultado — e foram escolhidas de propósito em direções opostas. Clicar em uma não é concordar "+
    "com ela, e este site não recomenda nenhuma: depois de carregar, mexa na ordem à vontade."));
  var g=el("div","rec-g");
  D.recortes.forEach(function(r){
    var ativo=top5.length===5&&r.top5.every(function(c,i){return top5[i]===c;});
    var c=el("button","rec-c"+(ativo?" on":""));c.type="button";
    c.appendChild(el("b",null,r.nome));
    c.appendChild(el("span","rec-d",r.desc));
    var ul=el("span","rec-l");
    r.top5.forEach(function(cod,i){
      var m=MACRO[cod]; if(!m)return;
      var t=el("span","rec-t");
      t.appendChild(el("i",null,String(i+1)));
      t.appendChild(document.createTextNode(m.titulo||m.nome));
      ul.appendChild(t);});
    c.appendChild(ul);
    c.addEventListener("click",function(){
      top5=r.top5.slice();modoIgual=false;pintaTudo();
      var alvo=document.getElementById("sc-box");
      if(alvo)alvo.scrollIntoView({behavior:"smooth",block:"center"});});
    g.appendChild(c);});
  host.appendChild(g);
}
function pintaRanked(){
  var r=document.getElementById("ranked");r.textContent="";
  for(var i=0;i<5;i++){
    var s=el("div","slot"+(top5[i]?"":" vaz"));
    s.appendChild(el("div","pos","TOP "+(i+1)));
    var nm=el("div","nm");
    if(top5[i]){nm.appendChild(document.createTextNode(MACRO[top5[i]].nome));
      nm.appendChild(el("span","pw","peso "+PESOS[i]));}
    else nm.appendChild(document.createTextNode("— vazio —"));
    s.appendChild(nm);
    var ctl=el("div","ctl");
    (function(i){
      var up=el("button",null,"↑");up.type="button";up.disabled=!top5[i]||i===0;
      up.addEventListener("click",function(){var t=top5[i-1];top5[i-1]=top5[i];top5[i]=t;pintaTudo();});
      var dn=el("button",null,"↓");dn.type="button";dn.disabled=!top5[i]||i>=top5.length-1;
      dn.addEventListener("click",function(){var t=top5[i+1];top5[i+1]=top5[i];top5[i]=t;pintaTudo();});
      var rm=el("button",null,"×");rm.type="button";rm.disabled=!top5[i];
      rm.addEventListener("click",function(){top5.splice(i,1);pintaTudo();});
      ctl.appendChild(up);ctl.appendChild(dn);ctl.appendChild(rm);
    })(i);
    s.appendChild(ctl);r.appendChild(s);}
}
function pintaScore(){
  var sub=document.getElementById("sc-sub"),bx=document.getElementById("sc-box"),tabz=document.getElementById("sc-tab");
  bx.textContent="";tabz.textContent="";
  var lista = modoIgual ? D.macrotemas.map(function(m){return m.cod;}) : top5;
  var peso = function(cod){ return modoIgual ? 1 : PESOS[top5.indexOf(cod)]; };
  if(!lista.length){
    sub.textContent="Nenhum macrotema foi escolhido ainda.";
    var p=el("p","sec-n","Sem escolha, não há índice — e o estudo não escolhe no lugar de quem usa a página. "+
      "Selecione ao menos um macrotema ao lado, ou use o botão de peso igual, que trata os "+
      D.macrotemas.length+" macrotemas como igualmente importantes. "+
      "Não existe aqui uma ordem “neutra” por quantidade de citações: mais citações mede como o documento "+
      "foi escrito, não o que ele vale, e usar isso como ranking seria exatamente o erro que esta página evita.");
    p.style.margin="0";p.style.maxWidth="76ch";bx.appendChild(p);return;}

  sub.textContent = modoIgual
    ? ("Com peso igual nos "+D.macrotemas.length+" macrotemas, o índice abaixo mede o quanto cada documento declara meta, custo, fonte de financiamento, prazo e indicador — em toda a grade, sem privilegiar tema nenhum.")
    : ("Com a ordem escolhida — "+top5.map(function(c,i){return (i+1)+"º "+MACRO[c].nome;}).join(" · ")+" — o índice abaixo mede, nesses temas, o quanto cada documento declara meta, custo, fonte de financiamento, prazo e indicador.");

  var linhas=D.candidatos.map(function(c){
    var somaP=0,soma=0,cob=0,nf=0;
    lista.forEach(function(cod){
      var r=idxCM(cod,c.pre),w=peso(cod);
      if(r){soma+=r.idx*w;somaP+=w;cob++;nf+=r.n;}});
    return{c:c,idx:somaP?soma/somaP:null,cob:cob,nf:nf};});
  var max=Math.max.apply(null,linhas.map(function(l){return l.idx||0;}));
  linhas.slice().sort(function(a,b){return (b.idx||0)-(a.idx||0);}).forEach(function(l){
    var row=el("div","score-row");
    var w=el("div","who");
    var dw=el("span","dot5");pintaFundo(dw,l.c.cor);w.appendChild(dw);
    w.appendChild(document.createTextNode(l.c.nome));
    w.appendChild(el("small",null,l.nf+" citações · cobre "+l.cob+" de "+lista.length+(modoIgual?" macrotemas":" temas escolhidos")));
    row.appendChild(w);
    var tr=el("div","strack"),f=el("i");
    f.style.width=(l.idx?(l.idx/5*100):0)+"%";pintaFundo(f,l.c.cor);tr.appendChild(f);
    comTip(tr,l.c.nome+" — índice "+(l.idx?l.idx.toFixed(2):"sem citações")+" de 5, nos temas escolhidos");
    row.appendChild(tr);
    row.appendChild(el("em",null,l.idx?l.idx.toFixed(2):"—"));
    bx.appendChild(row);});

  var esc=el("div");esc.style.cssText="display:grid;grid-template-columns:190px 1fr 62px;gap:14px;margin-top:4px";
  esc.appendChild(el("div"));
  var ticks=el("div");ticks.style.cssText="display:flex;justify-content:space-between;font-family:var(--f-m);font-size:10px;color:var(--muted)";
  [1,2,3,4,5].forEach(function(n){ticks.appendChild(el("span",null,String(n)));});
  esc.appendChild(ticks);esc.appendChild(el("div"));bx.appendChild(esc);

  var av=el("p","sec-n","O índice vai de 1 a 5 e não é nota de governo: é o quanto o texto, nesses temas, "+
    "pode ser cobrado depois. A cobertura aparece separada de propósito — um documento que trata de "+
    "3 dos 5 temas escolhidos não é penalizado com zero nos outros dois, e é preciso ver isso para "+
    "interpretar o número.");
  av.style.margin="18px 0 0";bx.appendChild(av);
  var av2=el("p","sec-n","Todos os valores ficam perto do piso da escala, e isso não é defeito do cálculo: "+
    "nas 612 citações, a média em custo declarado é 1,04, em fonte de financiamento 1,11 e em prazo 1,26. "+
    "Os oito documentos dizem o que pretendem fazer e quase nunca dizem quanto custa, de onde sai o "+
    "dinheiro e quando fica pronto. A diferença entre os planos, aqui, é pequena porque o problema é comum aos oito.");
  av2.style.margin="10px 0 0";bx.appendChild(av2);

  var t=el("table","t"),th=el("thead"),hr=el("tr");
  hr.appendChild(el("th",null,modoIgual?"Macrotema":"Macrotema escolhido"));hr.appendChild(el("th","n","Peso"));
  D.candidatos.forEach(function(c){
    var th4=el("th","n");
    var d4=el("span","dot5");pintaFundo(d4,c.cor);d4.style.marginRight="5px";
    th4.appendChild(d4);th4.appendChild(document.createTextNode(c.curto));
    hr.appendChild(th4);});
  th.appendChild(hr);t.appendChild(th);
  var tb=el("tbody");
  lista.forEach(function(cod,i){
    var tr=el("tr");tr.appendChild(el("td","nm",(modoIgual?"":(i+1)+"º ")+MACRO[cod].nome));
    tr.appendChild(el("td","n",String(peso(cod))));
    D.candidatos.forEach(function(c){var r=idxCM(cod,c.pre);
      var td=el("td","n",r?r.idx.toFixed(2):"sem citação");
      if(!r)td.style.color="var(--muted)";tr.appendChild(td);});
    tb.appendChild(tr);});
  t.appendChild(tb);
  var wrap=el("div","tw");wrap.appendChild(t);
  var h=el("div","sec-h");h.appendChild(el("h2","","Abertura por macrotema"));
  h.firstChild.style.fontSize="19px";
  tabz.appendChild(h);tabz.appendChild(wrap);ordenavel(t);
  if(window.DL){
    var ordenadas=linhas.slice().sort(function(a,b){return (b.idx||0)-(a.idx||0);});
    window.DL.botoesDL(tabz,{
      nome:"recorte-escolhido",
      titulo:"Índice sob medida — índice de cobrabilidade nos temas escolhidos",
      sub:(modoIgual?("Peso igual nos "+D.macrotemas.length+" macrotemas")
        :("Ordem escolhida: "+top5.map(function(c,i){return (i+1)+"º "+MACRO[c].nome;}).join(" · "))),
      fonte:"Índice de 1 a 5 calculado sobre as citações conferidas; não é nota de governo, e a cobertura aparece à parte",
      linhas:function(){
        var R=[["bloco","candidatura","partido","indice_1_a_5","citacoes","temas_cobertos","temas_no_recorte"]];
        ordenadas.forEach(function(l){
          R.push(["ranking",l.c.nome,l.c.partido||"",l.idx==null?"sem citações":l.idx.toFixed(2),
                  l.nf,l.cob,lista.length]);});
        R.push([]);
        var cab=["abertura por macrotema","peso"];
        D.candidatos.forEach(function(c){cab.push(c.nome);});
        R.push(cab);
        lista.forEach(function(cod,i){
          var lin=[(modoIgual?"":(i+1)+"º ")+MACRO[cod].nome,String(peso(cod))];
          D.candidatos.forEach(function(c){var r=idxCM(cod,c.pre);
            lin.push(r?r.idx.toFixed(2):"sem citação");});
          R.push(lin);});
        return R;}
    });
  }
}
function pintaTudo(){
  pintaPool();pintaRecortes();pintaRanked();pintaScore();
  var bi=document.getElementById("sc-igual");
  bi.textContent = modoIgual ? "Voltar para a ordem escolhida" : ("Usar peso igual nos "+D.macrotemas.length+" macrotemas");
  bi.classList.toggle("pri",modoIgual);
  document.getElementById("pool").style.opacity = modoIgual?.45:1;
  document.getElementById("ranked").style.opacity = modoIgual?.45:1;
}
(function(){
  var b=document.getElementById("subir");
  if(b) b.addEventListener("click",function(){window.scrollTo({top:0,behavior:"smooth"});});
})();
document.getElementById("sc-limpar").addEventListener("click",function(){top5=[];modoIgual=false;pintaTudo();});
document.getElementById("sc-igual").addEventListener("click",function(){modoIgual=!modoIgual;pintaTudo();});




/* ---------- infográficos ---------- */
(function(){
  var IG=window.__IG__; if(!IG) return;
  var lista=document.getElementById("ig-lista");
  var estreito=(window.matchMedia&&window.matchMedia("(max-width: 780px)").matches);
  /* as duas marcações ficam nas preferências locais; sem preferência gravada,
     o padrão depende da largura da tela (em celular estreito nascem desligadas) */
  function verM(){return (PREFS.marcos!==undefined)?!!PREFS.marcos:!estreito;}
  function verF(){return verFotos();}
  var W=980,H=330,ML=52,MR=18,MT=78,MB=34;

  function esc(t){var d=document.createElement("div");d.textContent=t;return d.innerHTML;}
  function svgEl(t,at){var e=document.createElementNS("http://www.w3.org/2000/svg",t);
    for(var k in at) e.setAttribute(k,at[k]); return e;}

  // casa o rótulo de um período de governo com a foto do presidente
  function chavePres(rot){
    var t=String(rot||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
    if(t.indexOf("collor")>=0) return "collor";
    if(t.indexOf("fhc")>=0||t.indexOf("fernando henrique")>=0) return "fhc";
    if(t.indexOf("dilma")>=0||t.indexOf("rousseff")>=0) return "dilma";
    if(t.indexOf("temer")>=0||t.indexOf("michel")>=0) return "temer";
    if(t.indexOf("bolsonaro")>=0||t.indexOf("jair")>=0) return "bolsonaro";
    if(t.indexOf("lula")>=0||t.indexOf("luiz inacio")>=0) return "lula";
    if(t.indexOf("itamar")>=0||t.indexOf("franco")>=0) return "itamar";
    return null;
  }
  function fotoPres(rot,tam){
    var k=chavePres(rot); if(!k||!IG.fotos||!IG.fotos[k]) return null;
    var img=el("img","pres-ft");
    img.src=IG.fotos[k];img.alt="";img.width=tam||30;img.height=tam||30;img.loading="lazy";
    return img;
  }

  var PAL=["var(--s700)","var(--warn)","var(--s400)","var(--prop)","var(--dir)","var(--muted)"];

  function norm(cfg){
    // devolve lista de {titulo,unidade,cor,pontos:[{x,v,tipo,obs}]} e os metadados de fonte
    /* cfg.direta: séries já montadas fora do catálogo. A sobreposição monta as
       suas, porque combina indicadores de gráficos diferentes e às vezes os
       converte em índice — algo que ids+cats não conseguem descrever. */
    if(cfg.direta){
      cfg.direta.forEach(function(o,i){ if(!o.cor) o.cor=PAL[i%PAL.length]; });
      return {ss:cfg.direta.slice(), metas:cfg.metas_direta||[]};
    }
    var out=[], metas=[];
    (cfg.ids||[cfg.id]).forEach(function(sid){
      var S=IG.series[sid]; if(!S) return; metas.push(S);
      if(S.categorias && S.categorias.length){
        S.categorias.forEach(function(cat,ci){
          var P=[];
          S.pontos.forEach(function(p){
            var v=(p.valores||{})[cat];
            if(v===null||v===undefined) return;
            P.push({x:(p.quando!=null?p.quando:p.ano),anual:(p.quando==null),v:v,tipo:p.tipo||"apurado",obs:p.obs,ano:p.ano});
          });
          if(P.length) out.push({titulo:cat,unidade:(S.unidades&&S.unidades[cat])||S.unidade,serie:S,pontos:P.sort(function(a,b){return a.x-b.x;})});
        });
      } else {
        var P=S.pontos.map(function(p){
          return {x:(p.quando!=null?p.quando:p.ano),anual:(p.quando==null),v:p.valor,tipo:p.tipo||"apurado",obs:p.obs,ano:p.ano};
        }).sort(function(a,b){return a.x-b.x;});
        out.push({titulo:S.titulo,unidade:S.unidade,serie:S,pontos:P});
      }
    });
    if(cfg.cats&&cfg.cats.length) out=out.filter(function(o){return cfg.cats.indexOf(o.titulo)>=0;});
    /* modo agregado: soma categorias em famílias declaradas em cfg.agregados.
       Soma só o que existe no ano — categorias que começam depois (covid) ou
       faltam num ano (dengue em 2025) entram quando têm valor, e a ressalva
       do gráfico explica isso. */
    if(cfg.agregados && cfg.agregados.length && cfg.__agr){
      var deQual={};
      cfg.agregados.forEach(function(g){(g.de||[]).forEach(function(c){deQual[c]=g.rot;});});
      var acc={}, ordemG=[];
      out.forEach(function(o){
        var k=deQual[o.titulo]; if(!k) return;
        if(!acc[k]){acc[k]={titulo:k,unidade:o.unidade,serie:o.serie,px:{}};ordemG.push(k);}
        o.pontos.forEach(function(pt){
          var a=acc[k].px[pt.x];
          if(!a){a=acc[k].px[pt.x]={x:pt.x,anual:pt.anual,v:0,tipo:"apurado",ano:pt.ano};}
          a.v+=pt.v;
          if(pt.tipo!=="apurado")a.tipo=pt.tipo;
        });
      });
      out=ordemG.map(function(k){
        var g=acc[k];
        return {titulo:g.titulo,unidade:g.unidade,serie:g.serie,
                pontos:Object.keys(g.px).map(function(x){return g.px[x];})
                         .sort(function(a,b){return a.x-b.x;})};
      });
    }
    out.forEach(function(o,i){o.cor=PAL[i%PAL.length];});
    return {ss:out, metas:metas};
  }

  function desenha(cfg, filtro){
    /* MT reserva a faixa de governo, o rótulo e o retrato (2R=42px). Com 78 o
       topo do círculo caía 2px fora do SVG e a cabeça saía cortada; H sobe
       junto para a área do gráfico não encolher. Em modo compacto não há
       retrato nem rótulo, então as medidas antigas seguem valendo. */
    var cmp=!!cfg.compacto, H=cmp?206:334, MT=cmp?26:82;
    var N=norm(cfg);
    var ss=N.ss.filter(function(o){return !filtro||filtro.indexOf(o.titulo)>=0;});
    if(!ss.length) ss=N.ss;
    var todos=[]; ss.forEach(function(o){todos=todos.concat(o.pontos);});
    if(!todos.length) return {svg:document.createElement("div"), ss:[], metas:N.metas, cats:N.ss.map(function(o){return o.titulo;})};
    var xs=todos.map(function(p){return p.x;});
    var x0=Math.min.apply(null,xs), x1=Math.max.apply(null,xs)+1;
    if(x1-x0<3)x1=x0+3;
    /* dominio_x fixa a linha do tempo: gráficos vizinhos que começam em anos
       diferentes passam a ter a MESMA régua horizontal, e a falta de dado
       antigo aparece como espaço vazio em vez de virar um eixo mais curto —
       que enganaria a leitura comparando trechos de larguras diferentes.
       Só alarga: se a série sair do intervalo pedido, o dado manda. */
    if(cfg.dominio_x){
      x0=Math.min(x0,cfg.dominio_x[0]);
      x1=Math.max(x1,cfg.dominio_x[1]);
    }
    var empilha=(cfg.forma==="area-empilhada");
    var vs;
    if(empilha){
      var soma={}; ss.forEach(function(o){o.pontos.forEach(function(p){soma[p.x]=(soma[p.x]||0)+p.v;});});
      vs=Object.keys(soma).map(function(k){return soma[k];});
    } else vs=todos.map(function(p){return p.v;});
    var v0=Math.min.apply(null,vs), v1=Math.max.apply(null,vs);
    if(cfg.zero||empilha||cfg.forma.indexOf("barra")>=0) v0=Math.min(0,v0);
    var neg=vs.some(function(v){return v<0;});
    var pad=(v1-v0)*0.16||1; v1=v1+pad;
    if(!(cfg.zero||empilha||cfg.forma.indexOf("barra")>=0)) v0=neg?v0-pad:Math.max(0,v0-pad);
    if(cfg.dominio){v0=cfg.dominio[0];v1=cfg.dominio[1];}
    var X=function(a){return ML+(a-x0)/(x1-x0)*(W-ML-MR);};
    /* um valor anual descreve o ano inteiro: fica no centro da célula do ano,
       nunca em cima do 1º de janeiro — assim a barra cai dentro do mandato certo */
    var XC=function(a){return X(a+0.5);};
    /* ponto com data exata (série mensal) fica na data; ponto anual, no centro do ano */
    var XP=function(p){return p.anual?X(p.x+0.5):X(p.x);};
    var CEL=(W-ML-MR)/(x1-x0);
    var Y=function(v){return MT+(1-(v-v0)/(v1-v0))*(H-MT-MB);};
    var svg=svgEl("svg",{viewBox:"0 0 "+W+" "+H,role:"img"});
    /* nome acessível por aria-label, não por <title>: <title> dentro de SVG vira
       balão branco nativo do navegador e se sobrepõe ao balão de dados */
    svg.setAttribute("aria-label",cfg.titulo);

    IG.governos.forEach(function(g,i){
      var a=Math.max(g.ini,x0), b=Math.min(g.fim,x1);
      if(b<=a) return;
      var topo=cmp?MT-6:MT-34;
      if((g.tom!==undefined?g.tom:i%2)===0) svg.appendChild(svgEl("rect",{x:X(a),y:topo,width:X(b)-X(a),height:(H-MB)-topo,
        fill:"var(--surface-2)","class":"gv-band",opacity:.85}));
      if(!cmp)svg.appendChild(svgEl("rect",{x:X(a),y:MT-34,width:X(b)-X(a),height:20,fill:"var(--surface-2)"}));
      if(i>0){var mesmo=IG.governos[i-1]&&IG.governos[i-1].pessoa===g.pessoa;svg.appendChild(svgEl("line",{x1:X(a),x2:X(a),y1:topo-(cmp?0:4),y2:H-MB,stroke:"var(--line-2)","stroke-width":1,"stroke-dasharray":mesmo?"3 3":"",opacity:mesmo?.6:1}));}
      var cx=(X(a)+X(b))/2;
      if(!cmp && X(b)-X(a)>40){
        var t=svgEl("text",{x:cx,y:MT-25,"text-anchor":"middle","class":"gv-lab"});t.textContent=g.rot;svg.appendChild(t);
        var t2=svgEl("text",{x:cx,y:MT-16,"text-anchor":"middle","class":"gv-sub"});t2.textContent=g.sub;svg.appendChild(t2);
      }
      if(!cmp && verF() && X(b)-X(a)>52){
        var R=21, img=svgEl("image",{x:cx-R,y:MT-38-R*2,width:R*2,height:R*2,href:IG.fotos[g.foto],
          preserveAspectRatio:"xMidYMid slice"});
        img.setAttribute("clip-path","circle("+R+"px at "+R+"px "+R+"px)");
        img.setAttribute("aria-label",g.pessoa);
        comTip(img,g.pessoa+" — "+g.rot+(g.sub?" ("+g.sub+")":""));
        svg.appendChild(img);
      }
    });

    /* faixa abaixo de zero: entra depois das faixas de governo e antes dos dados,
       para marcar o terreno negativo sem cobrir linha nem barra */
    if(v0<0&&v1>0){
      svg.appendChild(svgEl("rect",{x:ML,y:Y(0),width:W-ML-MR,height:Math.max(0,Y(v0)-Y(0)),
        "class":"zona-neg"}));
    }

    /* se qualquer série visível já vem numa unidade com escala, o eixo mostra o
       número inteiro — abreviar de novo produziria uma escala sobre a outra */
    var uniEscalada=ss.some(function(o){return unidadeJaEscalada(o.unidade);});
    /* contagem de coisas inteiras e de porte pequeno não admite casa decimal no
       eixo: "33,6 homologações" e "9,0 ministérios" não existem. Acima de mil o
       eixo volta a abreviar, senão "1.832.649 óbitos" ocuparia a margem toda. */
    var contInt=(Math.max(Math.abs(v0),Math.abs(v1))<1000) && ss.every(function(o){
      return (o.pontos||[]).every(function(p){return p.v===Math.round(p.v);});});
    function fmt(v){
      /* o zero do eixo é "0", nunca "0,0": é a fronteira entre positivo e
         negativo e tem de ser lida de relance */
      if(v===0) return "0";
      /* contagem de coisas não tem casa decimal: "30,2 empresas" não existe */
      if(cfg.inteiros||contInt) return dec(String(Math.round(v)));
      /* "3,2 mil" numa série cuja unidade já é bilhões faz o leitor multiplicar
         de cabeça; com semAbrev o eixo mostra o número inteiro */
      if(cfg.semAbrev||uniEscalada) return Math.abs(v)>=1000
        ? Math.round(v).toLocaleString(ENUS?"en-US":"pt-BR")
        : dec(v.toFixed(Math.abs(v)>=100?0:1));
      /* entre 1 e 10 milhões, uma casa decimal faz anos vizinhos virarem o
         mesmo rótulo e os textos se empilharem; duas casas separam */
      if(Math.abs(v)>=1e6) return dec((v/1e6).toFixed(Math.abs(v)<1e7?2:1))+SUF_MI;
      if(Math.abs(v)>=1000) return dec((v/1000).toFixed(v>=1e5?0:1))+SUF_MIL;
      /* série de amplitude pequena precisa de mais casas: com uma só, um eixo
         que vai de -0,14 a 0,06 imprime "-0,1" duas vezes seguidas */
      var faixa=Math.abs(v1-v0);
      if(faixa<0.2) return dec(v.toFixed(3));
      if(faixa<2) return dec(v.toFixed(2));
      return (Math.abs(v)>=100?v.toFixed(0):dec(v.toFixed(1)));
    }
    /* marcas do eixo: as seis de sempre, mais o zero quando a série cruza a linha.
       Uma marca que caia colada no zero é descartada, senão os dois rótulos se
       sobrepõem e nenhum dos dois fica legível. */
    var marcas=marcasRedondas(v0,v1,5);
    /* o eixo tem passo redondo, então o rótulo segue o passo: casa decimal só
       quando o passo pede. Sem isso o eixo imprime "10,0" e "2,00 mi". A escala
       (mil/mi) é escolhida uma vez, pela maior marca, e vale para todas —
       um eixo com "800 mil" em cima e "900" embaixo seria ilegível. */
    var passoEixo=(marcas.length>1?Math.abs(marcas[1]-marcas[0]):Math.abs(v1-v0)||1);
    var maxMarca=Math.max.apply(null,marcas.map(Math.abs));
    /* sufixo do rótulo. Quando a unidade já traz escala — "R$ milhões" — o eixo
       repete a escala dela: a marca 1.000 vira "1.000 mi", que casa com a
       legenda. Promover para "1 bi" ali deixaria legenda e eixo em escalas
       diferentes, e o leitor multiplicaria uma pela outra. Quando a unidade é
       crua — "número de pessoas" —, o sufixo sai da própria grandeza. */
    var escUni=escalaDaUnidade(ss.length?ss[0].unidade:""), divEixo=1, sufEixo="";
    if(!(cfg.inteiros||contInt)){
      if(escUni>1){
        sufEixo=SUF_ESC[Math.round(Math.log(escUni)/Math.LN10)]||"";
      } else {
        var exp=0;
        if(maxMarca>=1e12)exp=12; else if(maxMarca>=1e9)exp=9;
        else if(maxMarca>=1e6)exp=6; else if(maxMarca>=1e3)exp=3;
        if(exp){ divEixo=Math.pow(10,exp); sufEixo=SUF_ESC[exp]; }
      }
    }
    var casasEixo=(function(){
      var ps=passoEixo/divEixo;
      if(ps>=1) return 0;
      return Math.min(3,Math.max(0,Math.ceil(-Math.log(ps)/Math.LN10)));
    })();
    function fmtEixo(v){
      if(v===0) return "0";
      var x=v/divEixo;
      return (casasEixo?dec(x.toFixed(casasEixo))
                      :Math.round(x).toLocaleString(ENUS?"en-US":"pt-BR"))+sufEixo;
    }
    /* duas marcas que imprimem o mesmo rótulo viram uma só: o eixo repetido
       ("-0,1" duas vezes, ou "0" e "0,0") não informa e só confunde */
    var jaVisto={};
    marcas.forEach(function(v){
      var rot=fmtEixo(v);
      if(jaVisto[rot])return;
      jaVisto[rot]=1;
      var y=Y(v);
      svg.appendChild(svgEl("line",{x1:ML,x2:W-MR,y1:y,y2:y,"class":"grid"}));
      var t=svgEl("text",{x:ML-7,y:y+3,"text-anchor":"end","class":"ax"+(v<0?" neg":"")});
      t.textContent=rot;svg.appendChild(t);
    });
    if(v0<0)svg.appendChild(svgEl("line",{x1:ML,x2:W-MR,y1:Y(0),y2:Y(0),"class":"linha-zero"}));

    /* faixa invisível por ano, atrás de tudo: passar o mouse em qualquer ponto da
       coluna mostra os valores daquele ano, mesmo no vão entre as barras */
    (function(){
      var porAno={};
      ss.forEach(function(o){o.pontos.forEach(function(p){
        if(!p.anual)return;
        (porAno[p.ano]||(porAno[p.ano]=[])).push({t:o.titulo,v:p.v,u:o.unidade,tipo:p.tipo,obs:p.obs});});});
      Object.keys(porAno).forEach(function(ano){
        var itens=porAno[ano], xa=X(+ano), larg=CEL;
        if(xa+larg<ML||xa>W-MR)return;
        var txt=ano+" — "+itens.map(function(it){
          return it.t+": "+fmt(it.v)+" "+it.u+(it.tipo!=="apurado"?" ("+(it.obs||"parcial")+")":"");
        }).join(" · ");
        var hit=svgEl("rect",{x:xa,y:MT,width:larg,height:H-MB-MT,fill:"transparent"});
        comTip(hit,txt);
        hit.setAttribute("tabindex","-1");
        svg.appendChild(hit);
      });
    })();
    /* todos os anos: pular de dois em dois deixava barra sem rótulo embaixo */
    for(var a=Math.ceil(x0);a<x1;a+=1){
      var t=svgEl("text",{x:XC(a),y:H-MB+16,"text-anchor":"middle","class":"ax"});
      if(CEL<26)t.setAttribute("font-size","8.5");
      t.textContent=a;svg.appendChild(t);
    }

    if(verM()){
      IG.marcos.forEach(function(m){
        if(m.quando<x0||m.quando>x1)return;
        var x=X(m.quando), ym=cmp?MT-2:MT-14;
        var elei=(m.cat==="Eleição");
        svg.appendChild(svgEl("line",{x1:x,x2:x,y1:ym,y2:H-MB,"class":elei?"mk mk-el":"mk"}));
        var g2=svgEl("g",{});
        g2.appendChild(svgEl("circle",{cx:x,cy:ym,r:3.2,"class":elei?"mk-dot mk-el-dot":"mk-dot"}));
        /* a área sensível do marco fica só no topo, junto do ponto: o resto da
           coluna pertence ao dado, que é o que a pessoa veio ler */
        g2.appendChild(svgEl("rect",{x:x-7,y:ym-8,width:14,height:26,fill:"transparent"}));
        comTip(g2,m.rotulo+" — "+m.fato+" · "+m.cat);
        svg.appendChild(g2);
      });
    }

    if(empilha){
      var acum={};
      ss.forEach(function(o){
        var d="", back="";
        o.pontos.forEach(function(p,i){
          var base=acum[p.x]||0, topo=base+p.v;
          d+= (i?"L":"M")+XP(p)+" "+Y(topo);
          acum[p.x]=topo;
        });
        for(var i=o.pontos.length-1;i>=0;i--){
          var p=o.pontos[i];
          back+="L"+XP(p)+" "+Y(acum[p.x]-p.v);
        }
        svg.appendChild(svgEl("path",{d:d+back+"Z",fill:o.cor,opacity:.72,stroke:"var(--surface)","stroke-width":1}));
        o.pontos.forEach(function(p){
          var hit=svgEl("circle",{cx:XP(p),cy:Y(acum[p.x]-p.v/2),r:7,fill:"transparent"});
          comTip(hit,p.ano+" — "+o.titulo+": "+fmt(p.v)+" "+o.unidade);
          svg.appendChild(hit);
        });
      });
    } else if(cfg.forma.indexOf("barra")>=0){
      var soBar=(cfg.forma==="barra-linha")?ss.slice(0,1):ss;
      var linhas=(cfg.forma==="barra-linha")?ss.slice(1):[];
      var nS=soBar.length, larg=Math.max(3,CEL*0.74/nS);
      soBar.forEach(function(o,si){
        o.pontos.forEach(function(p){
          var y=Y(Math.max(0,p.v)), h=Math.abs(Y(p.v)-Y(0));
          var r=svgEl("rect",{x:XP(p)-(larg*nS)/2+si*larg,y:y,width:larg,height:Math.max(1.5,h),rx:1.5,
            fill:p.tipo==="apurado"?o.cor:"none",stroke:o.cor,"stroke-width":p.tipo==="apurado"?0:1.4,
            "stroke-dasharray":p.tipo==="apurado"?"":"3 2"});
          comTip(r,p.ano+" — "+o.titulo+": "+fmt(p.v)+" "+o.unidade+(p.tipo!=="apurado"?" · "+(p.obs||"dado parcial"):""));
          svg.appendChild(r);});
      });
      linhas.forEach(function(o){
        var P=o.pontos;
        if(P.length>1) svg.appendChild(svgEl("path",{d:P.map(function(p,i){return (i?"L":"M")+XP(p)+" "+Y(p.v);}).join(" "),
          fill:"none",stroke:"var(--ink-2)","stroke-width":1.8,"stroke-dasharray":"5 3",
          "stroke-linejoin":"round","stroke-linecap":"round"}));
        P.forEach(function(p){
          var c=svgEl("circle",{cx:XP(p),cy:Y(p.v),r:3,fill:"var(--ink-2)"});
          comTip(c,p.ano+" — "+o.titulo+": "+fmt(p.v)+" "+o.unidade);
          svg.appendChild(c);});
      });
    } else {
      ss.forEach(function(o){
        var firmes=o.pontos.filter(function(p){return p.tipo==="apurado";});
        function linha(arr,dash){
          if(arr.length<2)return;
          svg.appendChild(svgEl("path",{d:arr.map(function(p,i){return (i?"L":"M")+XP(p)+" "+Y(p.v);}).join(" "),
            fill:"none",stroke:o.cor,"stroke-width":2,"stroke-linejoin":"round","stroke-linecap":"round",
            "stroke-dasharray":dash||""}));
        }
        if(cfg.forma!=="pontos"){
          linha(firmes);
          var ult=firmes[firmes.length-1], parc=o.pontos.filter(function(p){return p.tipo!=="apurado";});
          if(ult&&parc.length) linha([ult].concat(parc),"5 4");
        }
        o.pontos.forEach(function(p){
          var c=svgEl("circle",{cx:XP(p),cy:Y(p.v),r:cfg.forma==="pontos"?4.2:3.4,
            fill:p.tipo==="apurado"?o.cor:"var(--surface)",stroke:o.cor,"stroke-width":1.6});
          comTip(c,p.ano+" — "+o.titulo+": "+fmt(p.v)+" "+o.unidade+(p.obs?" · "+p.obs:""));
          svg.appendChild(c);});
        if(!cmp&&ss.length<=2&&cfg.forma!=="pontos"){
          IG.governos.forEach(function(g){
            var dentro=o.pontos.filter(function(p){return p.x>=g.ini&&p.x<=g.fim;});
            if(!dentro.length)return;
            var marca=dentro.length>1?[dentro[0],dentro[dentro.length-1]]:[dentro[0]];
            marca.forEach(function(p){
              var t=svgEl("text",{x:XP(p),y:Y(p.v)-10,"text-anchor":"middle","class":"vl",
                stroke:"var(--surface)","stroke-width":3.2,"paint-order":"stroke","stroke-linejoin":"round"});
              t.textContent=fmt(p.v);svg.appendChild(t);});
          });
        }
      });
    }
    return {svg:svg, ss:ss, metas:N.metas, cats:N.ss.map(function(o){return o.titulo;})};
  }

  var UFNOME={AC:"Acre",AL:"Alagoas",AP:"Amapá",AM:"Amazonas",BA:"Bahia",CE:"Ceará",DF:"Distrito Federal",
    ES:"Espírito Santo",GO:"Goiás",MA:"Maranhão",MT:"Mato Grosso",MS:"Mato Grosso do Sul",MG:"Minas Gerais",
    PA:"Pará",PB:"Paraíba",PR:"Paraná",PE:"Pernambuco",PI:"Piauí",RJ:"Rio de Janeiro",RN:"Rio Grande do Norte",
    RS:"Rio Grande do Sul",RO:"Rondônia",RR:"Roraima",SC:"Santa Catarina",SP:"São Paulo",SE:"Sergipe",TO:"Tocantins"};

  // quem governava aquela UF no ano pedido, segundo series/governadores.json
  function govDe(uf,ano){
    var GV=IG.governadores; if(!GV||!GV.ufs||!GV.ufs[uf]) return null;
    var lista=GV.ufs[uf], achado=null;
    lista.forEach(function(m){
      var p=String(m.mandato||"").split("-");
      if(p.length===2 && ano>=+p[0] && ano<=+p[1]) achado=m;
    });
    return achado;
  }

  var UFREG={AC:"Norte",AP:"Norte",AM:"Norte",PA:"Norte",RO:"Norte",RR:"Norte",TO:"Norte",
    AL:"Nordeste",BA:"Nordeste",CE:"Nordeste",MA:"Nordeste",PB:"Nordeste",PE:"Nordeste",PI:"Nordeste",
    RN:"Nordeste",SE:"Nordeste",
    DF:"Centro-Oeste",GO:"Centro-Oeste",MT:"Centro-Oeste",MS:"Centro-Oeste",
    ES:"Sudeste",MG:"Sudeste",RJ:"Sudeste",SP:"Sudeste",
    PR:"Sul",RS:"Sul",SC:"Sul"};
  var REGORD=["Norte","Nordeste","Centro-Oeste","Sudeste","Sul"];

  // linha do tempo de marcos, por governo, com autoria declarada em cada item
  /* duas barras por mandato: o detalhe ano a ano já está no chevron da lista,
     então aqui o que interessa é o saldo de cada governo */
  function blocoMandatos(cfg,box,foot){
    var N=norm(cfg); if(!N.ss.length) return;
    var sai=N.ss[0], ent=N.ss[1]||{pontos:[]};
    var modoMnd="mandato";
    var ctlM=el("div","ig-ver");box.appendChild(ctlM);
    var alvoM=el("div");box.appendChild(alvoM);
    /* ano inteiro vai para quem estava no cargo em 31 de dezembro — mesma regra
       do gráfico de ministérios. Sem isso, 2016 seria contado duas vezes, para
       Dilma e para Temer, e a soma dos mandatos não fecharia com o total. */
    function dono(a){
      var g=null;
      IG.governos.forEach(function(x){ if(x.ini<=a+0.99 && a+0.99<=x.fim) g=x; });
      return g;
    }
    function soma(o,g){
      var t=0;
      (o.pontos||[]).forEach(function(p){
        var a=p.ano!=null?p.ano:p.x, dn=dono(a);
        if(dn&&dn.id===g.id) t+=p.v;});
      return t;
    }
    var linhas=IG.governos.map(function(g){
      return {g:g,s:soma(sai,g),e:soma(ent,g)};});
    var mx=0;linhas.forEach(function(l){mx=Math.max(mx,l.s,l.e);});
    if(!mx)mx=1;
    function legenda(){
      var lg=el("div","leg-ig");lg.style.padding="0 0 10px";
      [[sai.titulo,"mnd-sai"],[ent.titulo,"mnd-ent"]].forEach(function(o){
        var sp=el("span");var ic=el("i");
        ic.className="sw-ef "+o[1];sp.appendChild(ic);
        sp.appendChild(document.createTextNode(o[0]));lg.appendChild(sp);});
      return lg;
    }
    /* linha do tempo: as mesmas duas barras, mas cada mandato ocupando os anos
       que ele de fato durou — dois anos de Itamar não podem ocupar a mesma
       largura que oito de FHC */
    function tempo(){
      /* a régua acompanha a série: quando ela começa em 1990, o mandato do
         Collor tem de caber na linha do tempo */
      var anos=[];
      [sai,ent].forEach(function(o){(o.pontos||[]).forEach(function(p){
        anos.push(p.ano!=null?p.ano:p.x);});});
      var x0=anos.length?Math.min.apply(null,anos):1994;
      var x1=(anos.length?Math.max.apply(null,anos):2026)+1;
      var gA=dono(x0), gB=dono(x1-1);
      if(gA) x0=Math.min(x0,Math.floor(gA.ini));
      if(gB) x1=Math.max(x1,Math.ceil(gB.fim));
      var W0=980,H0=330,ML0=46,MR0=16,MT0=74,MB0=46;
      var svg=svgEl("svg",{viewBox:"0 0 "+W0+" "+H0,role:"img"});
      svg.setAttribute("aria-label",cfg.titulo);
      var X=function(a){return ML0+(a-x0)/(x1-x0)*(W0-ML0-MR0);};
      var ALT=H0-MT0-MB0, base=H0-MB0;
      IG.governos.forEach(function(g,i){
        var a=Math.max(g.ini,x0), b=Math.min(g.fim+0.01,x1);
        if(b<=a)return;
        if((g.tom!==undefined?g.tom:i%2)===0)
          svg.appendChild(svgEl("rect",{x:X(a),y:MT0-30,width:X(b)-X(a),height:(H0-MB0)-(MT0-30),
            fill:"var(--surface-2)",opacity:.85}));
        svg.appendChild(svgEl("rect",{x:X(a),y:MT0-30,width:X(b)-X(a),height:18,fill:"var(--surface-2)"}));
        if(i>0){var mesmo=IG.governos[i-1]&&IG.governos[i-1].pessoa===g.pessoa;
          svg.appendChild(svgEl("line",{x1:X(a),x2:X(a),y1:MT0-34,y2:base,stroke:"var(--line-2)",
            "stroke-width":1,"stroke-dasharray":mesmo?"3 3":"",opacity:mesmo?.6:1}));}
        var cx=(X(a)+X(b))/2;
        if(X(b)-X(a)>34){
          var t1=svgEl("text",{x:cx,y:MT0-23,"text-anchor":"middle","class":"gv-lab"});
          t1.textContent=g.rot;svg.appendChild(t1);
          var t2=svgEl("text",{x:cx,y:MT0-14,"text-anchor":"middle","class":"gv-sub"});
          t2.textContent=g.sub;svg.appendChild(t2);}
        if(verF()&&X(b)-X(a)>44&&IG.fotos[g.foto]){
          var R=18,img=svgEl("image",{x:cx-R,y:MT0-34-R*2,width:R*2,height:R*2,href:IG.fotos[g.foto],
            preserveAspectRatio:"xMidYMid slice"});
          img.setAttribute("clip-path","circle("+R+"px at "+R+"px "+R+"px)");
          img.setAttribute("aria-label",g.pessoa);
          comTip(img,g.pessoa+" — "+g.rot+(g.sub?" ("+g.sub+")":""));
          svg.appendChild(img);}
        /* período embaixo, que é o que o usuário procura: 2003-2006 */
        var per=Math.floor(g.ini)+"-"+Math.floor(g.fim);
        if(X(b)-X(a)>52){
          var tp=svgEl("text",{x:cx,y:base+16,"text-anchor":"middle","class":"ax"});
          tp.textContent=per;svg.appendChild(tp);}
      });
      var passo=Math.max(1,Math.ceil(mx/4));
      for(var k=0;k*passo<=mx+passo;k++){
        var v=k*passo, y=base-(v/mx)*ALT;
        if(v>mx+passo)break;
        svg.appendChild(svgEl("line",{x1:ML0,x2:W0-MR0,y1:y,y2:y,"class":"grid"}));
        var tx=svgEl("text",{x:ML0-7,y:y+3,"text-anchor":"end","class":"ax"});
        tx.textContent=String(v);svg.appendChild(tx);}
      linhas.forEach(function(l){
        var a=Math.max(l.g.ini,x0), b=Math.min(l.g.fim+0.01,x1);
        if(b<=a)return;
        var cx=(X(a)+X(b))/2, lar=Math.min(24,Math.max(5,(X(b)-X(a))*0.26));
        [[l.s,"var(--s600)",sai.titulo],[l.e,"var(--warn)",ent.titulo]].forEach(function(o,j){
          var h=(o[0]/mx)*ALT, x=cx-lar-1+j*(lar+2);
          if(o[0]>0){
            var r=svgEl("rect",{x:x,y:base-h,width:lar,height:Math.max(2,h),rx:2,fill:o[1]});
            comTip(r,o[0]+" "+(o[0]===1?TR("mnd-emp1"):TR("mnd-emp"))+" — "+o[2].toLowerCase()+" · "+
              l.g.rot+(l.g.sub?" ("+l.g.sub+")":""));
            svg.appendChild(r);}
          var tv=svgEl("text",{x:x+lar/2,y:base-Math.max(2,h)-4,"text-anchor":"middle","class":"vl",
            stroke:"var(--surface)","stroke-width":3,"paint-order":"stroke","stroke-linejoin":"round"});
          if(!o[0])tv.setAttribute("opacity",".5");
          tv.textContent=String(o[0]);svg.appendChild(tv);});
      });
      var env=el("div","ig-plot");env.style.padding="0";env.appendChild(svg);
      return env;
    }
    function pintaMnd(){
      ctlM.textContent="";alvoM.textContent="";
      ctlM.appendChild(el("span","uf-rot",TR("ver-rot")));
      [["mandato",TR("mnd-v1")],["tempo",TR("mnd-v2")]].forEach(function(o){
        var on=(modoMnd===o[0]);
        var b2=el("button","chip-cat"+(on?" on":""),o[1]);b2.type="button";
        b2.setAttribute("aria-pressed",on?"true":"false");
        b2.addEventListener("click",function(){if(modoMnd===o[0])return;modoMnd=o[0];pintaMnd();});
        ctlM.appendChild(b2);});
      alvoM.appendChild(legenda());
      if(modoMnd==="tempo"){alvoM.appendChild(tempo());}
      else{alvoM.appendChild(gr);}
      var np=el("p","ig-res");np.style.margin="12px 0 0";
      np.textContent=TR("mnd-nota");
      alvoM.appendChild(np);
    }
    var gr=el("div","stf-bars");
    linhas.forEach(function(l,li){
      var r=el("div","stf-br");
      var nb=el("div","stf-brn");
      var f0=fotoPres(l.g.rot,26); if(f0)nb.appendChild(f0);
      /* rótulo e subtítulo em nós de texto separados: assim o dicionário de
         tradução casa "1º mandato" sem precisar de uma chave por presidente */
      nb.appendChild(document.createTextNode(l.g.rot+(l.g.sub?" · ":"")));
      if(l.g.sub)nb.appendChild(document.createTextNode(l.g.sub));
      r.appendChild(nb);
      var cx=el("div","mnd-2");
      [[l.s,"mnd-sai",sai.titulo],[l.e,"mnd-ent",ent.titulo]].forEach(function(o){
        var lin=el("div","mnd-br");
        /* sem rótulo de série aqui: a legenda logo acima do gráfico já diz
           qual cor é qual, e repetir o texto custava uma coluna inteira */
        var tr=el("div","stf-brt");
        var i2=el("i",o[0]?o[1]:(o[1]+" mnd-zero"));
        i2.style.width=o[0]?Math.max(o[0]/mx*100,3)+"%":"auto";
        i2.appendChild(el("span",null,String(o[0])));
        comTip(i2,o[0]+" "+(o[0]===1?TR("mnd-emp1"):TR("mnd-emp"))+" — "+o[2].toLowerCase()+" · "+
          l.g.rot+(l.g.sub?" ("+l.g.sub+")":""));
        tr.appendChild(i2);lin.appendChild(tr);
        cx.appendChild(lin);});
      r.appendChild(cx);
      var saldo=l.e-l.s;
      var bc=el("div","stf-brc");
      bc.appendChild(el("span","dlt"+(saldo>0?" sobe":(saldo<0?" cai":"")),
        (saldo>0?"+":(saldo<0?"\u2212":"\u00b1"))+Math.abs(saldo)));
      r.appendChild(bc);
      gr.appendChild(r);});
    pintaMnd();
  }

  function blocoMarcos(cfg,box,foot){
    var D=IG[cfg.dados]; if(!D||!D.marcos) return;
    var itens=D.marcos.map(function(m){
      return {data:m.data||m.data_sancao||"",gov:m.governo||"",nome:m.nome||"",
        o_que:m.o_que||m.o_que_mudou||"",ato:m.ato||m.numero_ato||"",
        autoria:m.autoria||"",area:m.area||"",fonte:m.fonte||"",tipo:m.tipo||"",
        serie:m.serie||"",serie_passo:m.serie_passo||0,serie_item:m.serie_item||""};});
    /* efeito do ato sobre o tributo, para colorir barras e etiquetas */
    var EF_MAPA={aumento:"aum",criacao:"aum",reducao:"red",extincao:"red",substituicao:"neu"};
    var EF_ORD=["aum","red","neu","out"];
    var EF_ROT={aum:TR("ef-aum"),red:TR("ef-red"),neu:TR("ef-neu"),out:TR("ef-out")};
    function efDe(i){return EF_MAPA[i.tipo]||"out";}
    var porEfeito=!!cfg.cores_efeito;
    function contaEf(lst){
      var c={};lst.forEach(function(i){var k=efDe(i);c[k]=(c[k]||0)+1;});
      return EF_ORD.filter(function(k){return c[k];}).map(function(k){return {k:k,n:c[k]};});
    }
    var areas=[];itens.forEach(function(i){if(i.area&&areas.indexOf(i.area)<0)areas.push(i.area);});
    var govs=[];itens.forEach(function(i){if(i.gov&&govs.indexOf(i.gov)<0)govs.push(i.gov);});
    var selA=[],selG=[],busca="",abertos={},tudoAberto=false,modoV="governo";
    /* navegação interna: clicar numa barra ou num item da série marca o
       destino, repinta e só então rola até lá — o repinte recria os nós, então
       guardar o elemento antes não funcionaria. */
    var irPara=null, irAto=null;
    /* um só caminho para "ir até aquele governo": barra horizontal, barra da
       linha do tempo e faixa de governo usam este helper, para o
       comportamento ser o mesmo nas três. */
    function vaiGov(gs){
      gs=[].concat(gs).filter(Boolean);
      if(!gs.length)return;
      gs.forEach(function(g){abertos[g]=1;});
      irPara=gs[0];pinta();}
    function slugMl(t){return "ml-"+String(t||"").toLowerCase().normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,48);}
    /* três caixas fixas: filtros, gráfico, lista. A barra de download entra
       entre o gráfico e a lista e sobrevive aos redesenhos dos filtros. */
    var ctl=el("div","uf-ctl"),graf=el("div"),anc=el("div","dl-anchor"),lista=el("div","mk-lista");
    box.appendChild(ctl);box.appendChild(graf);box.appendChild(anc);box.appendChild(lista);
    function normx(t){return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");}

    /* linha do tempo: mesma régua dos demais gráficos — o ano ocupa a célula
       inteira e a barra fica no centro dela, dentro do mandato certo */
    /* o governo de um ano sai dos próprios atos daquele ano: é o rótulo que a
       lista de baixo usa como título de grupo, e não o da faixa do gráfico,
       que tem outra granularidade (mandato x período). */
    function govsDoAno(a){
      var r=[];
      (D.marcos||[]).forEach(function(m){
        var y=parseInt(String(m.data||m.data_sancao||"").slice(0,4),10);
        if(y===a&&m.governo&&r.indexOf(m.governo)<0)r.push(m.governo);});
      return r;}
    function nomeGov(a){var g=govsDoAno(a);return g.length?g[0]:null;}
    function linhaDoTempo(todos,vis){
      var dentro=[];vis.forEach(function(i){dentro.push(i);});
      function ok(i){return dentro.indexOf(i)>=0;}
      var porAno={};
      todos.forEach(function(i){
        var a=parseInt(String(i.data).slice(0,4),10);
        if(!a)return;(porAno[a]||(porAno[a]=[])).push(i);});
      var anos=Object.keys(porAno).map(Number);
      if(!anos.length)return el("p","gl-vazio","Sem datas para montar a linha do tempo.");
      var x0=Math.min.apply(null,anos.concat([1998]));
      var x1=Math.max.apply(null,anos.concat([2026]))+1;
      var W0=980,H0=308,ML0=40,MR0=16,MT0=70,MB0=30;
      var mx=0;anos.forEach(function(a){if(porAno[a].length>mx)mx=porAno[a].length;});
      if(!mx)mx=1;
      var svg=svgEl("svg",{viewBox:"0 0 "+W0+" "+H0,role:"img"});
      svg.setAttribute("aria-label",cfg.titulo+" — linha do tempo");
      var X=function(a){return ML0+(a-x0)/(x1-x0)*(W0-ML0-MR0);};
      var XC=function(a){return X(a+0.5);};
      var CEL=(W0-ML0-MR0)/(x1-x0);
      var ALT=H0-MT0-MB0;
      IG.governos.forEach(function(g,i){
        var a=Math.max(g.ini,x0), b=Math.min(g.fim+1,x1);
        if(b<=a)return;
        if((g.tom!==undefined?g.tom:i%2)===0)svg.appendChild(svgEl("rect",{x:X(a),y:MT0-28,width:X(b)-X(a),
          height:(H0-MB0)-(MT0-28),fill:"var(--surface-2)",opacity:.85}));
        svg.appendChild(svgEl("rect",{x:X(a),y:MT0-28,width:X(b)-X(a),height:17,fill:"var(--surface-2)"}));
        if(i>0)svg.appendChild(svgEl("line",{x1:X(a),x2:X(a),y1:MT0-32,y2:H0-MB0,
          stroke:"var(--line-2)","stroke-width":1}));
        var cx=(X(a)+X(b))/2;
        /* a faixa inteira do governo leva à lista daquele período */
        var gvK=nomeGov(Math.floor((g.ini+Math.min(g.fim,x1-1))/2));
        if(gvK){
          var hit=svgEl("rect",{x:X(a),y:MT0-32,width:X(b)-X(a),height:20,fill:"transparent",
            "class":"tl-hit"});
          hit.addEventListener("click",function(){vaiGov(gvK);});
          comTip(hit,TR("br-ir")+gvK);
          svg.appendChild(hit);}
        if(X(b)-X(a)>40){
          var t1=svgEl("text",{x:cx,y:MT0-21,"text-anchor":"middle","class":"gv-lab"});
          t1.textContent=g.rot;svg.appendChild(t1);}
        if(verF()&&X(b)-X(a)>50&&IG.fotos[g.foto]){
          var R=18,img=svgEl("image",{x:cx-R,y:MT0-32-R*2,width:R*2,height:R*2,href:IG.fotos[g.foto],
            preserveAspectRatio:"xMidYMid slice"});
          img.setAttribute("clip-path","circle("+R+"px at "+R+"px "+R+"px)");
          img.setAttribute("aria-label",g.pessoa);
          comTip(img,g.pessoa+" — "+g.rot);
          svg.appendChild(img);}
      });
      var passos=Math.max(1,Math.ceil(mx/4));
      for(var k=0;k<=Math.ceil(mx/passos);k++){
        var v=k*passos, y=H0-MB0-(v/mx)*ALT;
        svg.appendChild(svgEl("line",{x1:ML0,x2:W0-MR0,y1:y,y2:y,"class":"grid"}));
        var tx=svgEl("text",{x:ML0-7,y:y+3,"text-anchor":"end","class":"ax"});
        tx.textContent=String(v);svg.appendChild(tx);}
      for(var a2=Math.ceil(x0);a2<x1;a2+=1){
        var t2=svgEl("text",{x:XC(a2),y:H0-MB0+15,"text-anchor":"middle","class":"ax"});
        if(CEL<26)t2.setAttribute("font-size","8.5");
        t2.textContent=a2;svg.appendChild(t2);}
      if(verM()){
        IG.marcos.forEach(function(m){
          if(m.quando<x0||m.quando>x1)return;
          var xm=X(m.quando), ym=MT0-10;
          var elei=(m.cat==="Eleição");
          svg.appendChild(svgEl("line",{x1:xm,x2:xm,y1:ym,y2:H0-MB0,
            "class":elei?"mk mk-el":"mk"}));
          var g2=svgEl("g",{});
          g2.appendChild(svgEl("circle",{cx:xm,cy:ym,r:3,"class":elei?"mk-dot mk-el-dot":"mk-dot"}));
          g2.appendChild(svgEl("rect",{x:xm-7,y:ym-8,width:14,height:24,fill:"transparent"}));
          comTip(g2,m.rotulo+" — "+m.fato+" · "+m.cat);
          g2.setAttribute("tabindex","-1");
          svg.appendChild(g2);});
      }
      var larg=Math.max(4,CEL*0.74);
      var filtrando=(dentro.length!==todos.length);
      anos.sort(function(a,b){return a-b;}).forEach(function(a){
        var lst0=porAno[a], n=lst0.length;
        var nIn=lst0.filter(ok).length, nOut=n-nIn;
        var base=H0-MB0, hIn=(nIn/mx)*ALT, hOut=(nOut/mx)*ALT;
        /* o que está fora do filtro continua na barra, apagado: a altura do ano
           não muda quando se filtra, só a parte acesa */
        if(nOut>0){
          var rO=svgEl("rect",{x:XC(a)-larg/2,y:base-hIn-hOut,width:larg,
            height:Math.max(2,hOut),rx:2,fill:"var(--line-2)",opacity:.8});
          comTip(rO,a+" — "+nOut+(nOut===1?" ato fora":" atos fora")+" do filtro atual: "+
            lst0.filter(function(i){return !ok(i);}).map(function(i){return i.nome;}).join(" · "));
          svg.appendChild(rO);}
        if(nIn>0){
          if(porEfeito){
            /* a parte acesa da barra sai repartida pelo efeito do ato, na mesma
               ordem da legenda, de baixo para cima */
            var acum=0;
            contaEf(lst0.filter(ok)).forEach(function(c){
              var hSeg=(c.n/mx)*ALT;
              var rS=svgEl("rect",{x:XC(a)-larg/2,y:base-acum-hSeg,width:larg,
                height:Math.max(2,hSeg),rx:2,fill:"var(--"+({aum:"neg",red:"accent",neu:"prop",out:"muted"}[c.k])+")"});
              comTip(rS,a+" — "+c.n+(c.n===1?" ato que ":" atos que ")+EF_ROT[c.k]+": "+
                lst0.filter(ok).filter(function(i){return efDe(i)===c.k;})
                    .map(function(i){return i.nome;}).join(" · "));
              svg.appendChild(rS);
              acum+=hSeg;});
          } else {
            var rI=svgEl("rect",{x:XC(a)-larg/2,y:base-hIn,width:larg,height:Math.max(2,hIn),rx:2,
              fill:"var(--s600)"});
            comTip(rI,a+" — "+nIn+(nIn===1?" ato":" atos")+
              (filtrando?" no filtro atual":"")+": "+
              lst0.filter(ok).map(function(i){return i.nome;}).join(" · "));
            svg.appendChild(rI);}
        }
        var hTot=hIn+hOut;
        /* alvo de clique cobrindo a coluna inteira do ano, inclusive a parte
           apagada pelo filtro e o espaço vazio acima: mirar só no retângulo
           aceso deixaria a barra de 1 ato quase impossvel de acertar no dedo */
        (function(){
          var gs=lst0.map(function(i){return i.gov;}).filter(function(v,ix,arr){
            return v&&arr.indexOf(v)===ix;});
          if(!gs.length)return;
          var alvo=svgEl("rect",{x:XC(a)-larg/2-2,y:MT0-4,width:larg+4,height:(H0-MB0)-(MT0-4),
            fill:"transparent","class":"tl-hit"});
          alvo.addEventListener("click",function(){vaiGov(gs);});
          comTip(alvo,TR("br-ir")+gs.join(" / "));
          svg.appendChild(alvo);})();
        if(hTot>15){
          var rot=filtrando?(nIn+"/"+n):String(n);
          var tv2=svgEl("text",{x:XC(a),y:base-hTot-5,"text-anchor":"middle","class":"vl",
            stroke:"var(--surface)","stroke-width":3,"paint-order":"stroke","stroke-linejoin":"round"});
          if(!nIn)tv2.setAttribute("opacity",".55");
          tv2.textContent=rot;svg.appendChild(tv2);}
      });
      var env=el("div","ig-plot");env.style.padding="0";env.appendChild(svg);
      return env;
    }

    function legendaEf(){
      var lg=el("div","leg-ig");lg.style.padding="0 0 10px";
      EF_ORD.forEach(function(k){
        var sp=el("span");
        var sw=el("i","sw-ef ef-"+k);sp.appendChild(sw);
        sp.appendChild(document.createTextNode(EF_ROT[k]));
        lg.appendChild(sp);});
      return lg;
    }
    function pinta(){
      ctl.textContent="";graf.textContent="";lista.textContent="";
      function chips(rot,vals,sel){
        if(vals.length<2)return;
        var l=el("div","uf-linha");
        l.appendChild(el("span","uf-rot",rot));
        var bt=el("button","chip-cat"+(sel.length?"":" on"),"Todos");bt.type="button";
        bt.addEventListener("click",function(){sel.length=0;pinta();});
        l.appendChild(bt);
        vals.forEach(function(v){
          var on=sel.indexOf(v)>=0;
          var b=el("button","chip-cat"+(on?" on":""),v);b.type="button";
          b.setAttribute("aria-pressed",on?"true":"false");
          b.addEventListener("click",function(){
            var i=sel.indexOf(v);if(i>=0)sel.splice(i,1);else sel.push(v);pinta();});
          l.appendChild(b);});
        ctl.appendChild(l);
      }
      chips("Área",areas,selA);
      chips("Governo",govs,selG);
      var lb=el("div","uf-linha");
      lb.appendChild(el("span","uf-rot","Buscar"));
      var inp=el("input");inp.type="search";inp.className="idx-b mk-b";
      inp.placeholder="lei, serviço ou palavra do texto";inp.value=busca;
      inp.addEventListener("input",function(){busca=inp.value;pinta();
        var e=lista.parentNode.querySelector(".mk-b");if(e)e.focus();});
      lb.appendChild(inp);
      var cnt=el("span","idx-cnt");lb.appendChild(cnt);
      ctl.appendChild(lb);

      var q=normx(busca.trim());
      var vis=itens.filter(function(i){
        if(selA.length&&selA.indexOf(i.area)<0)return false;
        if(selG.length&&selG.indexOf(i.gov)<0)return false;
        if(q&&normx(i.nome+" "+i.o_que+" "+i.ato+" "+i.autoria).indexOf(q)<0)return false;
        return true;});
      cnt.textContent=vis.length+" de "+itens.length;
      var tv=el("div","uf-linha");tv.style.marginBottom="10px";
      tv.appendChild(el("span","uf-rot","Ver"));
      [["governo","por governo"],["tempo","linha do tempo"]].forEach(function(o){
        var b=el("button","chip-cat"+(modoV===o[0]?" on":""),o[1]);b.type="button";
        b.setAttribute("aria-pressed",modoV===o[0]?"true":"false");
        b.addEventListener("click",function(){modoV=o[0];pinta();});
        tv.appendChild(b);});
      graf.appendChild(tv);

      if(!vis.length&&modoV!=="tempo"){graf.appendChild(el("p","gl-vazio","Nada neste recorte."));return;}

      var por={},ordem=[];
      vis.forEach(function(i){
        var k=i.gov||"sem governo declarado";
        if(!por[k]){por[k]=[];ordem.push(k);}
        por[k].push(i);});

      // ordem cronológica pelo item mais antigo de cada governo
      ordem.sort(function(a,b){
        var ma=por[a].reduce(function(s,x){return (s&&s<x.data)?s:x.data;},null);
        var mb=por[b].reduce(function(s,x){return (s&&s<x.data)?s:x.data;},null);
        return String(ma).localeCompare(String(mb));});
      // seletor de visão, acima do gráfico e abaixo dos filtros
      if(modoV==="tempo"){
        if(porEfeito)graf.appendChild(legendaEf());
        graf.appendChild(linhaDoTempo(itens,vis));
        var avgT=el("p","ig-res");
        avgT.textContent=(vis.length!==itens.length)
          ? ("Nesta visão o filtro não apaga a linha do tempo: a barra de cada ano continua com a altura "+
             "cheia e a parte fora do recorte aparece em cinza, para o filtro não dar a impressão de que "+
             "nada aconteceu naquele ano. O rótulo mostra quantos estão no filtro sobre o total do ano. "+
             "Quem some são os grupos abaixo. A contagem é por data do ato, não por autoria.")
          : ("Cada barra conta os atos daquele ano, pela data do ato — não pela autoria. Anos sem barra "+
             "não tiveram ato nenhum; as faixas de fundo são os períodos de governo. Ao filtrar, as barras "+
             "fora do recorte ficam em cinza em vez de sumir. Clique numa barra ou na faixa de um governo "+
             "para abrir a lista daquele período.");
        graf.appendChild(avgT);
      }

      // gráfico quantitativo por governo
      var maxN=0;ordem.forEach(function(g){if(por[g].length>maxN)maxN=por[g].length;});
      var gr=el("div","stf-bars");gr.style.marginBottom="18px";
      ordem.forEach(function(g){
        var r=el("div","stf-br");
        var nb=el("div","stf-brn");
        var f0=fotoPres(g,22); if(f0)nb.appendChild(f0);
        nb.appendChild(document.createTextNode(g));
        r.appendChild(nb);
        var tr=el("div","stf-brt");
        if(porEfeito){
          contaEf(por[g]).forEach(function(c){
            var sg=el("i","ef-"+c.k);sg.style.width=(c.n/maxN*100)+"%";
            sg.appendChild(el("span",null,String(c.n)));
            comTip(sg,c.n+(c.n===1?" ato que ":" atos que ")+EF_ROT[c.k]+" — "+g);
            tr.appendChild(sg);});
        } else {
          var i2=el("i","fav");i2.style.width=(por[g].length/maxN*100)+"%";
          i2.appendChild(el("span",null,String(por[g].length)));
          comTip(i2,por[g].length+(por[g].length===1?" item":" itens")+" neste recorte — a contagem é por data do ato, não por autoria");
          tr.appendChild(i2);
        }
        r.appendChild(tr);
        r.appendChild(el("div","stf-brc",por[g].length+(por[g].length===1?" item":" itens")));
        /* a barra vira atalho para a lista: sem isso o leitor vê o tamanho e
           tem de procurar o grupo correspondente rolando a página */
        r.className="stf-br stf-br-l";
        r.setAttribute("role","button");r.tabIndex=0;
        r.title=TR("br-ir")+g;
        r.addEventListener("click",function(){vaiGov(g);});
        r.addEventListener("keydown",function(e){
          if(e.key==="Enter"||e.key===" "){e.preventDefault();vaiGov(g);}});
        gr.appendChild(r);});
      if(modoV==="governo"){
        var avg=el("p","ig-res");
        avg.textContent="A contagem acima é por data do ato, não por autoria: várias destas normas nasceram no "+
          "Congresso e foram apenas sancionadas pelo presidente da data. Quem propôs está escrito em cada item. "+
          "Clique numa barra para abrir a lista daquele governo.";
        graf.appendChild(gr);graf.appendChild(avg);
        if(porEfeito)graf.insertBefore(legendaEf(),gr);
        /* quando a própria cobertura da coleta é desigual, o aviso não pode
           ficar dentro de um chevron fechado: a barra maior é lida antes */
        if(cfg.aviso_visivel){
          var ap=el("p","mk-alerta");ap.textContent=cfg.aviso_visivel;
          graf.insertBefore(ap,graf.firstChild);
        }
      }
      var tg=el("div","uf-togg");
      var bt1=el("button","chip-cat",tudoAberto?"recolher todos":"expandir todos");bt1.type="button";
      bt1.addEventListener("click",function(){
        tudoAberto=!tudoAberto;abertos={};
        if(tudoAberto)ordem.forEach(function(g){abertos[g]=1;});
        pinta();});
      tg.appendChild(bt1);
      tg.appendChild(el("span","uf-togg-n",ordem.length+(ordem.length===1?TR("gr-1"):TR("gr-n"))+
        TR("gr-clique")));
      lista.appendChild(tg);

      ordem.forEach(function(g){
        var aberto=!!abertos[g];
        var h=el("button","uf-gh"+(aberto?" on":""));h.type="button";
        h.setAttribute("aria-expanded",aberto?"true":"false");
        var ch=svgEl("svg",{viewBox:"0 0 16 16",width:13,height:13,"class":"uf-ch"});
        ch.appendChild(svgEl("path",{d:"M5 3.5 10 8l-5 4.5",fill:"none",stroke:"currentColor",
          "stroke-width":1.8,"stroke-linecap":"round","stroke-linejoin":"round"}));
        h.appendChild(ch);
        var ftm=fotoPres(g,34); if(ftm)h.appendChild(ftm);
        var t2=el("span","uf-gt");
        t2.appendChild(el("b",null,g));
        t2.appendChild(el("span","uf-reg-n",por[g].length+(por[g].length===1?" item":" itens")));
        h.appendChild(t2);
        var bar=el("span","uf-gbar"+(porEfeito?" ef":""));
        if(porEfeito){
          contaEf(por[g]).forEach(function(c){
            var sg=el("i","ef-"+c.k);sg.style.width=(c.n/maxN*100)+"%";
            sg.title=c.n+(c.n===1?" ato que ":" atos que ")+EF_ROT[c.k];
            bar.appendChild(sg);});
        } else {
          var bi=el("i");bi.style.width=(por[g].length/maxN*100)+"%";bar.appendChild(bi);
        }
        h.appendChild(bar);
        var vv=el("span","uf-gv");
        vv.appendChild(el("b",null,String(por[g].length)));
        vv.appendChild(el("span","uf-gl","itens"));
        h.appendChild(vv);
        h.addEventListener("click",function(){
          if(abertos[g])delete abertos[g];else abertos[g]=1;pinta();});
        lista.appendChild(h);
        if(irPara===g){irPara=null;
          (function(alvo){setTimeout(function(){
            try{alvo.scrollIntoView({behavior:"smooth",block:"center"});}catch(e){alvo.scrollIntoView();}
            try{alvo.focus({preventScroll:true});}catch(e){}
          },40);})(h);}
        if(!aberto)return;
        var cxg=el("div","uf-gin");
        lista.appendChild(cxg);
        por[g].slice().sort(function(a,b){return String(b.data).localeCompare(String(a.data));})
          .forEach(function(i){
            var it=el("div","stf-it");
            if(i.ato)it.id=slugMl(i.ato);
            var dt=el("div","stf-dt");
            var p=String(i.data).split("-");
            dt.appendChild(el("b",null,p.length===3?dataLonga(i.data):(p.length===2?(ENUS?(MES_EN[(+p[1])-1]||p[1])+" "+p[0]:p[1]+"/"+p[0]):i.data)));
            if(i.area)dt.appendChild(el("span",porEfeito?("ef-t t-"+efDe(i)):"stf-oj",i.area));
            it.appendChild(dt);
            var c=el("div","stf-c");
            c.appendChild(el("div","mk-nome",i.nome));
            if(i.ato)c.appendChild(el("div","stf-p",i.ato));
            c.appendChild(el("p",null,i.o_que));
            if(i.autoria){
              var au=el("div","mk-au");
              au.appendChild(el("span","rot","Autoria"));
              au.appendChild(document.createTextNode(i.autoria));
              c.appendChild(au);}
            if(i.fonte){var a2=el("a",null,"ato na íntegra");a2.href=i.fonte;a2.target="_blank";
              a2.rel="noopener noreferrer";a2.style.color="var(--accent)";a2.style.fontSize="11.5px";
              c.appendChild(a2);}
            /* atos que fazem parte de uma mesma disputa — a mesma regra criada,
               revertida e restabelecida — carregam o rótulo da série. O leitor
               cai num deles pela data e não tem como saber que há outros três:
               este chevron, fechado, mostra a sequência e leva a cada um. */
            if(i.serie){
              var irm=itens.filter(function(x){return x.serie===i.serie;})
                .sort(function(a,b){return (a.serie_passo||0)-(b.serie_passo||0);});
              if(irm.length>1){
                var ds=document.createElement("details");ds.className="dob av mk-serie";
                var ss=document.createElement("summary");
                ss.appendChild(document.createTextNode(TR("serie-rot")+TR(i.serie)));
                ss.appendChild(el("span","dob-n",String(irm.length)));
                ds.appendChild(ss);
                var cs=el("div","dob-c");ds.appendChild(cs);
                cs.appendChild(el("p","ig-res",TR("serie-nota")));
                var ol=el("ol","mk-sl");
                irm.forEach(function(x){
                  var li=el("li"+(x===i?"":""));
                  if(x===i)li.className="ag";
                  var pp=String(x.data).split("-");
                  var quando=pp.length===3?dataLonga(x.data)
                    :(pp[1]?(ENUS?(MES_EN[(+pp[1])-1]||pp[1])+" "+pp[0]:pp[1]+"/"+pp[0]):x.data);
                  var rot=quando+" — "+(x.serie_item||x.nome);
                  if(x===i){
                    li.appendChild(el("b",null,rot));
                    li.appendChild(el("span","mk-aq",TR("serie-aqui")));
                  } else {
                    var bl=el("button","mk-sb",rot);bl.type="button";
                    bl.addEventListener("click",function(){
                      abertos[x.gov]=1;irPara=null;irAto=x.ato;pinta();});
                    li.appendChild(bl);
                    li.appendChild(el("span","mk-sg",x.gov));
                  }
                  ol.appendChild(li);});
                cs.appendChild(ol);
                c.appendChild(ds);
              }
            }
            it.appendChild(c);
            cxg.appendChild(it);
            if(irAto&&i.ato===irAto){irAto=null;
              (function(alvo){setTimeout(function(){
                try{alvo.scrollIntoView({behavior:"smooth",block:"center"});}catch(e){alvo.scrollIntoView();}
                alvo.classList.add("mk-piscou");
                setTimeout(function(){alvo.classList.remove("mk-piscou");},1600);
              },60);})(it);}
          });});
    }
    pinta();

    // séries relacionadas, quando existirem
    (cfg.ids||[]).forEach(function(id){
      var S=IG.series[id]; if(!S) return;
      /* mesma régua da linha do tempo acima e retratos ligados: em modo
         compacto cada série ganhava um eixo próprio, começando no seu
         primeiro ano, e duas séries vizinhas ficavam com escalas de tempo
         diferentes — o que faz dois períodos desiguais parecerem iguais. */
      var r=desenha({forma:"linha",ids:[id],compacto:false,dominio_x:[1998,2027]},null);
      var cab=el("div","pan-h");
      cab.appendChild(el("b",null,S.titulo));
      cab.appendChild(el("span","pan-u",S.unidade));
      box.appendChild(cab);box.appendChild(r.svg);
      var sr=el("div","ig-src");
      sr.appendChild(el("span","rot","Fonte"));
      sr.appendChild(document.createTextNode(S.orgao+(S.serie_codigo?" · "+S.serie_codigo:"")));
      if(S.fonte&&S.fonte.url){var a3=el("a",null,"conferir na origem");a3.href=S.fonte.url;
        a3.target="_blank";a3.rel="noopener noreferrer";a3.style.color="var(--accent)";sr.appendChild(a3);}
      box.appendChild(sr);});

    (D.notas||[]).forEach(function(n){foot.appendChild(el("p","ig-res",n));});
    (D.series_nao_encontradas||[]).forEach(function(x){
      foot.appendChild(el("p","ig-res",TR("Não localizado:")+" "+(x.o_que||"")+" — "+(x.por_que||"")));});
    (D.nao_confirmados||[]).forEach(function(x){
      foot.appendChild(el("p","ig-res","Não confirmado: "+(x.item||"")+" — "+(x.por_que||"")));});
  }

  /* ---------- alcance dos marcos, dimensão por dimensão ----------
     O radar aqui NÃO é nota de qualidade. Cada eixo mede o tamanho da mudança
     que o texto do ato faz naquela dimensão, de 0 a 3, e o sentido (amplia,
     restringe, redistribui, disputado) fica ao lado, em texto, porque um
     polígono não sabe dizer direção. A régua está escrita nos critérios e vale
     igual nos 37 marcos; marco ainda não classificado não recebe nota
     provisória — some do comparador até ser conferido. */
  var MRSEL=[], MRABRE={a:false}, MRFILT={gov:"",ano:""};
  /* quem desenha usando os pesos se inscreve aqui; blocos que saíram da página
     são descartados na hora do aviso, para não repintar órfãos */
  var OUVE_PESOS=[];
  function ouvePesos(caixa,fn){ OUVE_PESOS.push({el:caixa,fn:fn}); }
  function avisaPesos(){
    OUVE_PESOS=OUVE_PESOS.filter(function(o){return document.contains(o.el);});
    OUVE_PESOS.forEach(function(o){try{o.fn();}catch(e){}});
  }
  function critMl(){ return (IG.marcos_legais||{}).criterios||null; }
  function marcosComDim(){
    var L=((IG.marcos_legais||{}).marcos)||[], D=dimensoes();
    return L.filter(function(m){
      return m.dim&&D.some(function(d){return m.dim[d.id];});});
  }
  function anoMl(m){ return String(m.data_sancao||"").slice(0,4); }
  function rotMl(m){ return anoMl(m)+" · "+m.nome; }
  function nivelRot(n){
    var C=critMl(); if(!C) return String(n);
    var e=(C.escala||[]).filter(function(x){return x.n===n;})[0];
    return e?e.rot:String(n);
  }
  function sinalRot(s){
    var C=critMl(); if(!C) return s;
    var x=(C.sinais||[]).filter(function(y){return y.id===s;})[0];
    return x?x.rot:s;
  }
  /* soma do alcance de cada dimensão pelo peso que o leitor deu a ela, em 0-1.
     Responde "quanto este marco mexe no que importa para mim", nunca "é bom" */
  function enfaseMl(m){
    var P=pesosAtuais(), s=0;
    dimensoes().forEach(function(d){
      var o=m.dim&&m.dim[d.id];
      s+=P[d.id]*((o&&typeof o.n==="number"?o.n:0)/3);});
    return s;
  }
  var MR_COR=["var(--s500)","var(--warn)"];

  function blocoMarcosRadar(cfg,box,foot){
    var D=dimensoes(), TODOS=((IG.marcos_legais||{}).marcos)||[], M=marcosComDim();
    if(!D.length||!M.length) return;
    if(!MRSEL.length) MRSEL=[0];

    var ctl=el("div"),grade=el("div","pz-grade"),alvo=el("div"),tab=el("div");
    grade.appendChild(alvo);grade.appendChild(tab);
    box.appendChild(ctl);box.appendChild(grade);
    var det=el("div","mr-det");box.appendChild(det);

    function sel(){ return MRSEL.map(function(i){return M[i];}).filter(Boolean); }

    /* ---- radar: escala fixa de 0 a 3, igual para todos os marcos ---- */
    function radar(){
      var W=760,H=470,R=162,FOLGA=32,CORTE=17,RENDA=true;
      if(estreito){ W=392;H=318;R=86;FOLGA=17;CORTE=13;RENDA=false; }
      var CX=W/2,CY=H/2,TOPO=3;
      var svg=svgEl("svg",{viewBox:"0 0 "+W+" "+H,role:"img"});
      svg.setAttribute("aria-label",TR("mr-alt"));
      var ang=function(i){return -Math.PI/2+i*2*Math.PI/D.length;};
      var px=function(i,v){return CX+Math.cos(ang(i))*R*(v/TOPO);};
      var py=function(i,v){return CY+Math.sin(ang(i))*R*(v/TOPO);};
      [1,2,3].forEach(function(v){
        var pts=[];for(var i=0;i<D.length;i++)pts.push(px(i,v)+","+py(i,v));
        svg.appendChild(svgEl("polygon",{points:pts.join(" "),fill:"none",
          stroke:"var(--line)","stroke-width":1}));
        if(RENDA){var t=svgEl("text",{x:CX+4,y:py(0,v)+4,"class":"ax"});
          t.textContent=String(v);svg.appendChild(t);}});
      for(var i=0;i<D.length;i++)
        svg.appendChild(svgEl("line",{x1:CX,y1:CY,x2:px(i,TOPO),y2:py(i,TOPO),
          stroke:"var(--line)","stroke-width":1}));

      /* dois marcos se distinguem por FORMA além da cor: o primeiro vem cheio
         com marcador redondo, o segundo tracejado com marcador quadrado */
      sel().forEach(function(m,k){
        var cor=MR_COR[k%MR_COR.length], vals=D.map(function(d){
          var o=m.dim&&m.dim[d.id]; return (o&&typeof o.n==="number")?o.n:0;});
        var pts=[];for(var i=0;i<D.length;i++)pts.push(px(i,vals[i])+","+py(i,vals[i]));
        svg.appendChild(svgEl("polygon",{points:pts.join(" "),fill:cor,
          "fill-opacity":k?".07":".12",stroke:cor,"stroke-width":k?2:2.5,
          "stroke-dasharray":k?"7 5":"","stroke-linejoin":"round"}));
        D.forEach(function(d,i){
          var cx2=px(i,vals[i]),cy2=py(i,vals[i]);
          if(k) svg.appendChild(svgEl("rect",{x:cx2-4.5,y:cy2-4.5,width:9,height:9,
            fill:cor,stroke:"var(--surface)","stroke-width":2}));
          else svg.appendChild(svgEl("circle",{cx:cx2,cy:cy2,r:5,fill:cor,
            stroke:"var(--surface)","stroke-width":2}));});});

      D.forEach(function(x,i){
        var a=ang(i), rx=CX+Math.cos(a)*(R+FOLGA), ry=CY+Math.sin(a)*(R+FOLGA*0.78);
        var anc=Math.cos(a)>0.25?"start":(Math.cos(a)<-0.25?"end":"middle");
        var pal=String(x.rot).split(" "), l1=[], l2=[];
        pal.forEach(function(w){ (l1.join(" ").length+w.length<=CORTE?l1:l2).push(w); });
        var g=svgEl("g",{});
        var t1=svgEl("text",{x:rx,y:ry+(l2.length?-4:4),"text-anchor":anc,"class":"pz-eixo"});
        t1.textContent=l1.join(" ");g.appendChild(t1);
        if(l2.length){var t2=svgEl("text",{x:rx,y:ry+12,"text-anchor":anc,"class":"pz-eixo"});
          t2.textContent=l2.join(" ");g.appendChild(t2);}
        comTip(g,x.rot+" — "+x.des);
        svg.appendChild(g);});
      var env=el("div","ig-plot pz-plot");env.style.padding="0";env.appendChild(svg);
      return env;
    }

    /* ---- tabela de comparação: a mesma informação em texto ---- */
    function tabela(){
      var S=sel(), cx2=el("div"), w=el("div","tw");
      cx2.appendChild(w);
      var t=document.createElement("table");t.className="pz-t mr-t";
      var th=document.createElement("thead"),hr=document.createElement("tr");
      var h0=el("th",null,TR("mr-c1"));h0.style.textAlign="left";h0.className="pz-est";hr.appendChild(h0);
      S.forEach(function(m,k){
        var h=el("th");h.style.textAlign="right";h.className="pz-est";
        var sw=el("i",k?"mr-sw-b":"mr-sw-a");h.appendChild(sw);
        h.appendChild(document.createTextNode(" "+rotMl(m)));
        hr.appendChild(h);});
      th.appendChild(hr);t.appendChild(th);
      var tb=document.createElement("tbody");
      D.forEach(function(d){
        var tr=document.createElement("tr");
        var td0=el("td",null,d.rot+" ");td0.appendChild(dimInfo(d));tr.appendChild(td0);
        S.forEach(function(m){
          var o=m.dim&&m.dim[d.id], n=(o&&typeof o.n==="number")?o.n:0;
          var td=el("td");td.style.textAlign="right";td.className="pz-num"+(n?" on":"");
          td.appendChild(el("b",null,String(n)));
          td.appendChild(el("span","mr-nv"," "+nivelRot(n)));
          if(o&&o.s&&n) td.appendChild(el("span","mr-sn sn"+(o.s==="+"?"p":(o.s==="-"?"n":(o.s==="="?"e":"d"))),
            o.s+" "+sinalRot(o.s)));
          tr.appendChild(td);});
        tb.appendChild(tr);});
      var rt=document.createElement("tr");rt.className="pz-tot";
      rt.appendChild(el("td",null,TR("mr-enf")));
      S.forEach(function(m){
        var b=el("td",null,pct(enfaseMl(m)));b.style.textAlign="right";b.className="pz-num on";
        rt.appendChild(b);});
      tb.appendChild(rt);
      t.appendChild(tb);w.appendChild(t);
      cx2.appendChild(el("p","pz-nota",TR("mr-enf-exp")));
      return cx2;
    }

    /* ---- detalhamento: por que cada nota, com o dispositivo que a justifica ---- */
    function detalhes(){
      det.textContent="";
      sel().forEach(function(m,k){
        var dd=document.createElement("details");dd.className="dob av mr-dob";
        var sm=document.createElement("summary");
        sm.appendChild(el("i",k?"mr-sw-b":"mr-sw-a"));
        sm.appendChild(document.createTextNode(" "+rotMl(m)+" — "+TR("mr-porque")));
        dd.appendChild(sm);
        var c=el("div","mr-c");
        c.appendChild(el("p","ig-res",(m.numero_ato||"")+" · "+(m.governo||"")));
        D.forEach(function(d){
          var o=m.dim&&m.dim[d.id]; if(!o) return;
          var p=el("div","mr-li");
          var cab=el("p","mr-li-c");
          cab.appendChild(el("b",null,d.rot));
          cab.appendChild(el("span","mr-nv"," — "+o.n+" · "+nivelRot(o.n)));
          if(o.s) cab.appendChild(el("span","mr-sn sn"+(o.s==="+"?"p":(o.s==="-"?"n":(o.s==="="?"e":"d"))),
            o.s+" "+sinalRot(o.s)));
          p.appendChild(cab);
          if(o.disp&&o.disp!=="—") p.appendChild(el("p","mr-disp",TR("mr-disp")+": "+o.disp));
          p.appendChild(el("p","ig-res",o.por||""));
          c.appendChild(p);});
        dd.appendChild(c);det.appendChild(dd);});
    }

    function dropdown(){
      var d=document.createElement("details");d.className="idx-dd mr-dd";
      d.open=!!MRABRE.a;
      d.addEventListener("toggle",function(){MRABRE.a=d.open;});
      var sm=document.createElement("summary");
      sm.appendChild(el("span","idx-dd-r",TR("mr-dd")));
      sm.appendChild(el("span","idx-dd-v",sel().map(rotMl).join(" · ")||TR("mr-nenhum-v")));
      d.appendChild(sm);
      var c=el("div","idx-dd-c");
      /* filtros por governo e por ano, e a lista do mais recente para o mais antigo */
      var fl=el("div","mr-flt"),govs=[],anos=[];
      M.forEach(function(m){var g=m.governo||"—";if(govs.indexOf(g)<0)govs.push(g);
        var a=anoMl(m);if(anos.indexOf(a)<0)anos.push(a);});
      function ano1(g){var x=String(g).match(/\d{4}/);return x?+x[0]:0;}
      govs.sort(function(a,b){return ano1(b)-ano1(a);});anos.sort().reverse();
      function caixa(rot,lista,val,fn){
        var w=el("label","mr-fl");w.appendChild(el("span","uf-rot",rot));
        var sl=document.createElement("select");
        [["",TR("Todos")]].concat(lista.map(function(x){return [x,x];})).forEach(function(o){
          var op=el("option",null,o[1]);op.value=o[0];sl.appendChild(op);});
        sl.value=val;sl.addEventListener("change",function(){fn(sl.value);});
        w.appendChild(sl);return w;}
      fl.appendChild(caixa(TR("Governo"),govs,MRFILT.gov,function(v){MRFILT.gov=v;pinta();}));
      fl.appendChild(caixa(TR("Ano"),anos,MRFILT.ano,function(v){MRFILT.ano=v;pinta();}));
      var lp=el("button","zap",TR("Limpar"));lp.type="button";
      lp.addEventListener("click",function(){MRSEL.length=0;MRFILT.gov="";MRFILT.ano="";pinta();});
      fl.appendChild(lp);c.appendChild(fl);
      var ordem=M.map(function(m,i){return i;}).sort(function(a,b){
        return String(M[b].data_sancao).localeCompare(String(M[a].data_sancao));}).filter(function(i){
        var m=M[i];if(MRSEL.indexOf(i)>=0)return true;
        return (!MRFILT.gov||(m.governo||"—")===MRFILT.gov)&&(!MRFILT.ano||anoMl(m)===MRFILT.ano);});
      if(!ordem.length)c.appendChild(el("p","gl-vazio",TR("Nenhum marco neste recorte.")));
      ordem.forEach(function(i){var m=M[i];
        var lab=el("label","idx-dd-i");
        var ip=document.createElement("input");ip.type="checkbox";
        ip.checked=MRSEL.indexOf(i)>=0;
        ip.addEventListener("change",function(){
          var k=MRSEL.indexOf(i);
          if(k>=0) MRSEL.splice(k,1);
          else { if(MRSEL.length>=2) MRSEL.shift(); MRSEL.push(i); }
          pinta();});
        lab.appendChild(ip);
        lab.appendChild(document.createTextNode(" "+rotMl(m)+" — "+(m.governo||"")));
        c.appendChild(lab);});
      d.appendChild(c);
      return d;
    }

    function pinta(){
      ctl.textContent="";alvo.textContent="";tab.textContent="";
      var lin=el("div","uf-linha");
      lin.appendChild(dropdown());
      var cnt=el("span","pz-est",M.length+"/"+TODOS.length+" "+TR("mr-cont"));
      lin.appendChild(cnt);
      ctl.appendChild(lin);
      if(!sel().length){
        alvo.appendChild(el("p","gl-vazio",TR("mr-nenhum")));
        det.textContent="";return;}
      var lg=el("div","leg-ig");lg.style.padding="0 0 6px";
      sel().forEach(function(m,k){
        var s=el("span");s.appendChild(el("i",k?"mr-sw-b":"mr-sw-a"));
        s.appendChild(document.createTextNode(rotMl(m)));lg.appendChild(s);});
      alvo.appendChild(lg);
      alvo.appendChild(radar());
      tab.appendChild(tabela());
      tab.appendChild(cmExplica(sel(),D));
      var C0=critMl();
      if(C0&&C0.estado){var pe=el("p","pz-nota mr-est",C0.estado);tab.appendChild(pe);}
      detalhes();
    }
    pinta();
    box.__repintaMR=pinta;
    ouvePesos(box,pinta);

    /* ---- os critérios, abertos para conferência ---- */
    var C=critMl(); if(!C) return;
    var cx1=document.createElement("details");cx1.className="dob av";
    var s1=document.createElement("summary");s1.textContent=TR("mr-crit");cx1.appendChild(s1);
    var cc=el("div","mr-c");
    cc.appendChild(el("p","ig-res",C.o_que_mede));
    cc.appendChild(el("p","mr-h",TR("mr-escala")));
    (C.escala||[]).forEach(function(e){
      var p=el("p","ig-res");
      p.appendChild(el("b",null,e.n+" · "+e.rot+" — "));
      p.appendChild(document.createTextNode(e.des));cc.appendChild(p);});
    cc.appendChild(el("p","mr-h",TR("mr-sinais")));
    (C.sinais||[]).forEach(function(e){
      var p=el("p","ig-res");
      p.appendChild(el("b",null,e.id+" · "+e.rot+" — "));
      p.appendChild(document.createTextNode(e.des));cc.appendChild(p);});
    cc.appendChild(el("p","mr-h",TR("mr-regras")));
    (C.regras||[]).forEach(function(r){cc.appendChild(el("p","ig-res","· "+r));});
    cc.appendChild(el("p","mr-h",TR("mr-cobre")));
    (C.cobre||[]).forEach(function(o){
      var d2=D.filter(function(x){return x.id===o.id;})[0]; if(!d2) return;
      var p=el("p","ig-res");
      p.appendChild(el("b",null,d2.rot+" — "));
      p.appendChild(document.createTextNode(o.conta));
      cc.appendChild(p);
      cc.appendChild(el("p","mr-nao",TR("mr-nao")+" "+o.nao_conta));});
    cc.appendChild(el("p","mr-h",TR("mr-enf")));
    cc.appendChild(el("p","ig-res",C.indice));
    cx1.appendChild(cc);foot.appendChild(cx1);
  }

  /* ---------- pesos das dimensões: o perfil de prioridades do leitor ----------
     Este bloco não avalia norma nenhuma. Ele só mostra, e deixa editar, a
     importância que o leitor dá a cada dimensão — e essa importância é GLOBAL:
     vale igual em todos os marcos, sem exceção por governo, setor ou norma.
     Por isso o perfil mora nas preferências do site, ao lado de tema e ordem,
     e não dentro de nenhum gráfico. */
  function dimensoes(){ return (IG.dimensoes||[]); }

  /* 1/6 exato, não seis valores arredondados que somariam 100,02% */
  function pesoPadrao(){
    var D=dimensoes(), o={};
    D.forEach(function(x){o[x.id]=1/D.length;});
    return o;
  }
  function pesosAtuais(){
    var D=dimensoes(), p=PREFS.pesos;
    if(!p) return pesoPadrao();
    var o={}, soma=0, ok=true;
    D.forEach(function(x){
      var v=p[x.id];
      if(typeof v!=="number"||!(v>=0)){ok=false;return;}
      o[x.id]=v;soma+=v;});
    if(!ok||!(soma>0)) return pesoPadrao();
    /* normaliza uma vez, no perfil global — nunca por marco */
    D.forEach(function(x){o[x.id]=o[x.id]/soma;});
    return o;
  }
  function pesosPersonalizados(){ return !!PREFS.pesos; }
  window.pesosAtuais=pesosAtuais;

  function pct(v,casas){
    var n=v*100, t=(casas?n.toFixed(casas):String(Math.round(n)));
    return (ENUS?t:t.replace(".",","))+"%";
  }

  function blocoPesos(cfg,box,foot){
    var D=dimensoes(); if(D.length<3) return;
    var ctl=el("div"), alvo=el("div"), tab=el("div");
    var painel=el("div","pz-painel");painel.hidden=true;
    box.appendChild(ctl);box.appendChild(painel);
    var grade=el("div","pz-grade");grade.appendChild(alvo);grade.appendChild(tab);
    box.appendChild(grade);

    /* ---- o radar ---- */
    function radar(){
      /* a caixa é bem mais larga que o polígono de propósito: os nomes dos
         eixos saem para fora do raio e, com a largura justa, "Segurança
         jurídica" e "Investimento e capacidade" ficavam cortados nas bordas */
      var W=860,H=520,R=172,FOLGA=34,CORTE=17,RENDA=true;
      if(estreito){
        /* em tela estreita o radar não rola na horizontal como os gráficos de
           série temporal: um radar cortado ao meio não se lê. Ele encolhe, os
           nomes quebram mais cedo e os números saem do desenho — a tabela logo
           abaixo continua trazendo todos eles */
        W=392;H=318;R=86;FOLGA=17;CORTE=13;RENDA=false;
      }
      var CX=W/2,CY=H/2;
      var svg=svgEl("svg",{viewBox:"0 0 "+W+" "+H,role:"img"});
      svg.setAttribute("aria-label",TR("pz-alt"));
      var P=pesosAtuais(), pad=pesoPadrao();
      var maxV=0;D.forEach(function(x){if(P[x.id]>maxV)maxV=P[x.id];});
      /* a escala é fixa em 30%: se ela se ajustasse ao maior valor, a mesma
         distância do centro significaria coisas diferentes a cada edição */
      var TOPO=Math.max(0.30,Math.ceil(maxV*20)/20);
      var ang=function(i){return -Math.PI/2+i*2*Math.PI/D.length;};
      var px=function(i,v){return CX+Math.cos(ang(i))*R*(v/TOPO);};
      var py=function(i,v){return CY+Math.sin(ang(i))*R*(v/TOPO);};

      /* anéis e rótulos de escala */
      var aneis=[];for(var k=1;k*0.05<=TOPO+1e-9;k++)aneis.push(k*0.05);
      aneis.forEach(function(v,ix){
        var pts=[];for(var i=0;i<D.length;i++)pts.push(px(i,v)+","+py(i,v));
        svg.appendChild(svgEl("polygon",{points:pts.join(" "),fill:"none",
          stroke:"var(--line)","stroke-width":1}));
        if(RENDA&&(ix%2===1||v===TOPO)){
          var t=svgEl("text",{x:CX+4,y:py(0,v)+4,"class":"ax"});
          t.textContent=pct(v);svg.appendChild(t);}
      });
      for(var i=0;i<D.length;i++)
        svg.appendChild(svgEl("line",{x1:CX,y1:CY,x2:px(i,TOPO),y2:py(i,TOPO),
          stroke:"var(--line)","stroke-width":1}));

      /* padrão: tracejado, sem marcador e sem rótulo — é referência, não dado */
      var ptsP=[];for(var i=0;i<D.length;i++)ptsP.push(px(i,pad[D[i].id])+","+py(i,pad[D[i].id]));
      svg.appendChild(svgEl("polygon",{points:ptsP.join(" "),fill:"none",
        stroke:"var(--muted)","stroke-width":2,"stroke-dasharray":"7 5",
        "stroke-linejoin":"round"}));

      /* perfil do leitor: linha cheia, marcadores e rótulo em cada vértice */
      var ptsS=[];for(var i=0;i<D.length;i++)ptsS.push(px(i,P[D[i].id])+","+py(i,P[D[i].id]));
      svg.appendChild(svgEl("polygon",{points:ptsS.join(" "),fill:"var(--accent)",
        "fill-opacity":".10",stroke:"var(--accent)","stroke-width":2.5,
        "stroke-linejoin":"round"}));
      D.forEach(function(x,i){
        var cx2=px(i,P[x.id]), cy2=py(i,P[x.id]);
        svg.appendChild(svgEl("circle",{cx:cx2,cy:cy2,r:5,fill:"var(--accent)",
          stroke:"var(--surface)","stroke-width":2}));
        if(!RENDA) return;
        var lab=svgEl("text",{x:cx2+(Math.cos(ang(i))>0.2?11:(Math.cos(ang(i))<-0.2?-11:0)),
          y:cy2+(Math.sin(ang(i))>0.2?16:(Math.sin(ang(i))<-0.2?-9:4)),
          "text-anchor":(Math.cos(ang(i))>0.2?"start":(Math.cos(ang(i))<-0.2?"end":"middle")),
          "class":"vl",stroke:"var(--surface)","stroke-width":3,"paint-order":"stroke",
          "stroke-linejoin":"round"});
        lab.textContent=pct(P[x.id]);svg.appendChild(lab);});

      /* nomes dos eixos, quebrados em duas linhas quando longos */
      D.forEach(function(x,i){
        var a=ang(i), rx=CX+Math.cos(a)*(R+FOLGA), ry=CY+Math.sin(a)*(R+FOLGA*0.78);
        var anc=Math.cos(a)>0.25?"start":(Math.cos(a)<-0.25?"end":"middle");
        var pal=String(x.rot).split(" "), l1=[], l2=[];
        pal.forEach(function(w){ (l1.join(" ").length+w.length<=CORTE?l1:l2).push(w); });
        var g=svgEl("g",{});
        var t1=svgEl("text",{x:rx,y:ry+(l2.length?-4:4),"text-anchor":anc,"class":"pz-eixo"});
        t1.textContent=l1.join(" ");g.appendChild(t1);
        if(l2.length){
          var t2=svgEl("text",{x:rx,y:ry+12,"text-anchor":anc,"class":"pz-eixo"});
          t2.textContent=l2.join(" ");g.appendChild(t2);}
        comTip(g,x.rot+" — "+pct(P[x.id],2)+". "+x.des);
        svg.appendChild(g);});

      var env=el("div","ig-plot pz-plot");env.style.padding="0";env.appendChild(svg);
      return env;
    }

    /* ---- tabela: a mesma informação em texto, para quem não lê o gráfico ---- */
    function tabela(){
      var P=pesosAtuais(), pad=pesoPadrao(), personalizado=pesosPersonalizados();
      var w=el("div","tw");
      var t=el("table","idx-t pz-t");
      var th=el("thead"),tr=el("tr");
      [TR("pz-c1"),TR("pz-c2"),TR("pz-c3")].forEach(function(h,i){
        var c=el("th",null,h);if(i)c.style.textAlign="right";tr.appendChild(c);});
      th.appendChild(tr);t.appendChild(th);
      var tb=el("tbody");
      D.forEach(function(x){
        var r=el("tr");
        r.appendChild(el("td",null,x.rot));
        var c2=el("td",null,TR("pz-umsexto"));c2.style.textAlign="right";
        c2.className="pz-num";r.appendChild(c2);
        var c3=el("td",null,pct(P[x.id],2));c3.style.textAlign="right";
        c3.className="pz-num"+(personalizado?" on":"");r.appendChild(c3);
        tb.appendChild(r);});
      var rt=el("tr","pz-tot");
      rt.appendChild(el("td",null,TR("pz-total")));
      var a=el("td",null,"100%");a.style.textAlign="right";a.className="pz-num";rt.appendChild(a);
      var b=el("td",null,"100%");b.style.textAlign="right";b.className="pz-num";rt.appendChild(b);
      tb.appendChild(rt);
      t.appendChild(tb);w.appendChild(t);
      var nota=el("p","pz-nota");
      nota.textContent=personalizado?TR("pz-seu"):TR("pz-padrao-nota");
      w.appendChild(nota);
      return w;
    }

    /* ---- painel de edição ---- */
    /* 100 dividido em partes de um decimal que somam exatamente 100: seis vezes
       16,7 daria 100,2 e o painel abriria já fora da conta, com o leitor sem ter
       tocado em nada. O resto em décimos vai para as primeiras dimensões. */
    function emPartes(n){
      var base=Math.floor(1000/n), resto=1000-base*n, v=[];
      for(var i=0;i<n;i++) v.push((base+(i<resto?1:0))/10);
      return v;
    }
    var rascunho=null;
    function abrePainel(){
      var P=pesosAtuais();
      rascunho={};
      if(!pesosPersonalizados()){
        var eq=emPartes(D.length);
        D.forEach(function(x,i){rascunho[x.id]=eq[i];});
      } else {
        D.forEach(function(x){rascunho[x.id]=Math.round(P[x.id]*1000)/10;});
      }
      pintaPainel();painel.hidden=false;
      var f=painel.querySelector("input");if(f)f.focus();
    }
    function pintaPainel(){
      painel.textContent="";
      painel.appendChild(el("p","pz-ajuda",TR("pz-ajuda")));
      var lista=el("div","pz-lista");
      D.forEach(function(x){
        var lin=el("label","pz-lin");
        lin.appendChild(el("span","pz-rot",x.rot));
        var inp=document.createElement("input");
        inp.type="number";inp.min="0";inp.max="100";inp.step="0.5";
        inp.value=String(rascunho[x.id]);
        inp.className="pz-inp";
        inp.setAttribute("aria-label",x.rot);
        inp.addEventListener("input",function(){
          var v=parseFloat(inp.value.replace(",","."));
          rascunho[x.id]=(isNaN(v)||v<0)?0:v;
          soma();});
        lin.appendChild(inp);
        lin.appendChild(el("span","pz-pc","%"));
        lista.appendChild(lin);});
      painel.appendChild(lista);
      var rod=el("div","pz-rod");
      var tot=el("span","pz-somat");rod.appendChild(tot);
      var bAp=el("button","btn-csv btn-share",TR("pz-aplicar"));bAp.type="button";
      bAp.addEventListener("click",function(){
        var s=0;D.forEach(function(x){s+=rascunho[x.id];});
        if(Math.abs(s-100)>0.51){alerta(TR("pz-erro"));return;}
        var novo={};D.forEach(function(x){novo[x.id]=rascunho[x.id];});
        PREFS.pesos=novo;gravaPrefs();painel.hidden=true;pinta();avisaPesos();
        if(window.escreveVer)escreveVer();});
      rod.appendChild(bAp);
      var bIg=el("button","chip-cat",TR("pz-igualar"));bIg.type="button";
      bIg.addEventListener("click",function(){
        var eq=emPartes(D.length);
        D.forEach(function(x,i){rascunho[x.id]=eq[i];});
        pintaPainel();});
      rod.appendChild(bIg);
      var bRe=el("button","zap",TR("pz-restaurar"));bRe.type="button";
      bRe.addEventListener("click",function(){
        delete PREFS.pesos;gravaPrefs();painel.hidden=true;pinta();avisaPesos();
        if(window.escreveVer)escreveVer();});
      rod.appendChild(bRe);
      var bFe=el("button","zap",TR("pz-fechar"));bFe.type="button";
      bFe.addEventListener("click",function(){painel.hidden=true;});
      rod.appendChild(bFe);
      painel.appendChild(rod);
      function soma(){
        var s=0;D.forEach(function(x){s+=rascunho[x.id];});
        s=Math.round(s*10)/10;
        tot.textContent=TR("pz-soma")+(ENUS?String(s):String(s).replace(".",","))+"%";
        tot.className="pz-somat"+(Math.abs(s-100)>0.51?" ruim":" bom");
        bAp.disabled=Math.abs(s-100)>0.51;
      }
      soma();
    }

    function pinta(){
      ctl.textContent="";alvo.textContent="";tab.textContent="";
      var lin=el("div","uf-linha");
      var b=el("button","btn-csv");b.type="button";
      b.innerHTML='<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">'+
        '<circle cx="8" cy="8" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6"/>'+
        '<path d="M8 1.6v2M8 12.4v2M1.6 8h2M12.4 8h2M3.5 3.5l1.4 1.4M11.1 11.1l1.4 1.4'+
        'M12.5 3.5l-1.4 1.4M4.9 11.1l-1.4 1.4" stroke="currentColor" stroke-width="1.5" '+
        'stroke-linecap="round"/></svg>';
      b.appendChild(document.createTextNode(TR("pz-bt")));
      b.addEventListener("click",function(){ if(painel.hidden)abrePainel(); else painel.hidden=true; });
      lin.appendChild(b);
      var est=el("span","pz-est",pesosPersonalizados()?TR("pz-est-seu"):TR("pz-est-padrao"));
      lin.appendChild(est);
      ctl.appendChild(lin);

      /* legenda: duas séries, sempre com legenda, e a identidade não é só cor */
      var lg=el("div","leg-ig");lg.style.padding="0 0 6px";
      var s1=el("span");var i1=el("i","pz-sw-pad");s1.appendChild(i1);
      s1.appendChild(document.createTextNode(TR("pz-leg-padrao")));lg.appendChild(s1);
      var s2=el("span");var i2=el("i","pz-sw-seu");s2.appendChild(i2);
      s2.appendChild(document.createTextNode(TR("pz-leg-seu")));lg.appendChild(s2);
      alvo.appendChild(lg);
      alvo.appendChild(radar());
      tab.appendChild(tabela());
    }
    pinta();
    box.__repintaPesos=pinta;

    var res=el("p","ig-res");res.style.margin="14px 0 0";
    res.textContent=TR("pz-res");
    foot.appendChild(res);
    dimensoes().forEach(function(x){
      var p2=el("p","ig-res");
      p2.appendChild(el("b",null,x.rot+" — "));
      p2.appendChild(document.createTextNode(x.des));
      foot.appendChild(p2);});
  }

  function blocoSTF(cfg,box,foot){
    var S=IG.stf; if(!S) return;

    // 1 · o que existe de estatística, e o que não existe
    var est=el("div","stf-est");
    (S.estatisticas||[]).forEach(function(e){
      var p=(e.pontos||[])[0]; if(!p) return;
      var c=el("div","stf-num");
      c.appendChild(el("b",null,String(p.valor)));
      c.appendChild(el("span","stf-t",e.titulo));
      c.appendChild(el("span","stf-a",(p.ano!=null?p.ano+" · ":"")+(e.orgao||"")));
      if(p.obs)c.appendChild(el("span","stf-o",p.obs));
      if(e.fonte&&e.fonte.url){var a1=el("a",null,"fonte");a1.href=e.fonte.url;a1.target="_blank";
        a1.rel="noopener noreferrer";a1.style.color="var(--accent)";a1.style.fontSize="11.5px";c.appendChild(a1);}
      est.appendChild(c);});
    box.appendChild(est);
    var falta=el("div","ig-aviso");
    falta.appendChild(el("span","rot","A lacuna"));
    falta.appendChild(document.createTextNode(
      "Não existe, publicada com metodologia aberta, uma série anual de quanto o governo federal ganha ou perde no "+
      "STF. Procurei nos relatórios da AGU, nas estatísticas do próprio tribunal e nos estudos de jurimetria da FGV "+
      "e da Associação Brasileira de Jurimetria; o que há são números soltos, como os dois acima, e nenhum deles "+
      "cobre todos os governos. Sem série comparável, este bloco não tenta um gráfico de linha — mostra as decisões "+
      "e diz de onde cada uma veio."));
    box.appendChild(falta);

    // 1b · contagem por governo — mede a seleção, e isso vem escrito em cima
    var porG={},ordemG=[];
    (S.decisoes||[]).forEach(function(d){
      if(!porG[d.governo]){porG[d.governo]={favoravel:0,contraria:0,indeterminado:0,n:0};ordemG.push(d.governo);}
      porG[d.governo][d.efeito||"indeterminado"]++;porG[d.governo].n++;});
    var cnt=el("div","stf-cnt");
    var alerta=el("div","uf-alerta");
    alerta.appendChild(el("b",null,"Este gráfico não mede o Supremo. Mede esta seleção. "));
    alerta.appendChild(document.createTextNode(
      "As 21 decisões abaixo foram escolhidas por serem de grande alcance — não são todas as decisões do tribunal "+
      "envolvendo o governo federal, nem uma amostra aleatória delas. Por isso o número de barras de um governo diz "+
      "quantos casos dele entraram nesta lista, e nada além disso. O caso mais claro está à vista: para 1998-2002 só "+
      "foi possível confirmar duas decisões, porque os domínios do STF bloqueiam leitura automatizada e as fontes do "+
      "período são mais difíceis de alcançar — e isso apareceria como 'pouco atrito', o que seria falso."));
    cnt.appendChild(alerta);
    var crit=el("div","ig-aviso");
    crit.appendChild(el("span","rot","Critério"));
    crit.appendChild(document.createTextNode(S.criterio_efeito||""));
    cnt.appendChild(crit);
    var maxN=0;ordemG.forEach(function(g){if(porG[g].n>maxN)maxN=porG[g].n;});
    var gr=el("div","stf-bars");
    ordemG.forEach(function(g){
      var r=el("div","stf-br");
      var nb=el("div","stf-brn");
      var f1=fotoPres(g,22); if(f1)nb.appendChild(f1);
      nb.appendChild(document.createTextNode(g));
      r.appendChild(nb);
      var tr=el("div","stf-brt");
      [["favoravel","fav"],["contraria","con"],["indeterminado","ind"]].forEach(function(p){
        var v=porG[g][p[0]]; if(!v)return;
        var i=el("i",p[1]);i.style.width=(v/maxN*100)+"%";
        comTip(i,v+(v===1?" decisão":" decisões")+" — "+
          ({favoravel:"a tese ou o ato do governo prevaleceu",
            contraria:"a tese ou o ato do governo não prevaleceu",
            indeterminado:"não havia ato do Executivo em disputa, ou a decisão atendeu os dois lados"}[p[0]]));
        i.appendChild(el("span",null,String(v)));
        tr.appendChild(i);});
      r.appendChild(tr);
      r.appendChild(el("div","stf-brc",porG[g].n+" nesta lista"));
      r.className="stf-br stf-br-l";
      r.setAttribute("role","button");r.tabIndex=0;
      r.title=TR("br-ir")+g;
      r.addEventListener("click",function(){vaiGovS(g);});
      r.addEventListener("keydown",function(e){
        if(e.key==="Enter"||e.key===" "){e.preventDefault();vaiGovS(g);}});
      gr.appendChild(r);});
    cnt.appendChild(gr);
    var lg2=el("div","leg-ig");lg2.style.padding="10px 0 0";
    [["fav","a tese ou o ato do governo prevaleceu"],["con","não prevaleceu"],
     ["ind","indeterminado — sem ato do Executivo em disputa, ou decisão dividida"]].forEach(function(p){
      var sp=el("span");var ic=el("i","sw-"+p[0]);sp.appendChild(ic);
      sp.appendChild(document.createTextNode(p[1]));lg2.appendChild(sp);});
    cnt.appendChild(lg2);
    box.appendChild(cnt);

    // 2 · as decisões, por governo, recolhíveis
    var por={},ordem=[];
    (S.decisoes||[]).forEach(function(d){
      if(!por[d.governo]){por[d.governo]=[];ordem.push(d.governo);}
      por[d.governo].push(d);});
    var lin=el("div","stf-lin");
    var abertos={}, tudoAberto=false, irParaS=null;
    function vaiGovS(g){if(!g)return;abertos[g]=1;irParaS=g;pintaDec();}

    function pintaDec(){
      lin.textContent="";
      var tg=el("div","uf-togg");
      var bt1=el("button","chip-cat",tudoAberto?"recolher todos":"expandir todos");bt1.type="button";
      bt1.addEventListener("click",function(){
        tudoAberto=!tudoAberto;abertos={};
        if(tudoAberto)ordem.forEach(function(g){abertos[g]=1;});
        pintaDec();});
      tg.appendChild(bt1);
      tg.appendChild(el("span","uf-togg-n",ordem.length+TR("gr-per")+TR("gr-clique")));
      lin.appendChild(tg);

      var maxN=0;ordem.forEach(function(g){if(por[g].length>maxN)maxN=por[g].length;});
      ordem.forEach(function(G){
        var arr=por[G], aberto=!!abertos[G];
        var f={favoravel:0,contraria:0,indeterminado:0};
        arr.forEach(function(d){f[d.efeito||"indeterminado"]++;});
        var h=el("button","uf-gh"+(aberto?" on":""));h.type="button";
        h.setAttribute("aria-expanded",aberto?"true":"false");
        var ch=svgEl("svg",{viewBox:"0 0 16 16",width:13,height:13,"class":"uf-ch"});
        ch.appendChild(svgEl("path",{d:"M5 3.5 10 8l-5 4.5",fill:"none",stroke:"currentColor",
          "stroke-width":1.8,"stroke-linecap":"round","stroke-linejoin":"round"}));
        h.appendChild(ch);
        var fts=fotoPres(G,34); if(fts)h.appendChild(fts);
        var t2=el("span","uf-gt");
        t2.appendChild(el("b",null,G));
        t2.appendChild(el("span","uf-reg-n",arr.length+(arr.length===1?" decisão listada":" decisões listadas")));
        h.appendChild(t2);
        var bar=el("span","uf-gbar stf-gbar");
        [["favoravel","fav"],["contraria","con"],["indeterminado","ind"]].forEach(function(p){
          if(!f[p[0]])return;
          var i=el("i",p[1]);i.style.width=(f[p[0]]/maxN*100)+"%";
          i.appendChild(el("span",null,String(f[p[0]])));
          comTip(i,f[p[0]]+(f[p[0]]===1?" decisão ":" decisões ")+
            ({favoravel:"a favor do governo da época",contraria:"contra o governo da época",
              indeterminado:"indeterminadas"}[p[0]]));
          bar.appendChild(i);});
        h.appendChild(bar);
        var vv=el("span","uf-gv");
        vv.appendChild(el("b",null,String(arr.length)));
        vv.appendChild(el("span","uf-gl","nesta lista"));
        h.appendChild(vv);
        h.addEventListener("click",function(){
          if(abertos[G])delete abertos[G];else abertos[G]=1;pintaDec();});
        lin.appendChild(h);
        if(irParaS===G){irParaS=null;
          (function(alvo){setTimeout(function(){
            try{alvo.scrollIntoView({behavior:"smooth",block:"center"});}catch(e){alvo.scrollIntoView();}
            try{alvo.focus({preventScroll:true});}catch(e){}
          },40);})(h);}
        if(!aberto)return;
        var cxg=el("div","uf-gin");
        arr.slice().sort(function(a,b){return String(b.data).localeCompare(String(a.data));}).forEach(function(d){
          var it=el("div","stf-it");
          var dt=el("div","stf-dt");
          dt.appendChild(el("b",null,d.data||""));
          if(d.orgao_julgador)dt.appendChild(el("span","stf-oj",d.orgao_julgador));
          it.appendChild(dt);
          var cp=el("div","stf-c");
          cp.appendChild(el("div","stf-p",d.processo||""));
          if(d.efeito){
            var kl={favoravel:["ok","A favor do governo da época"],
                    contraria:["neg","Contra o governo da época"],
                    indeterminado:["mut","Indeterminado"]}[d.efeito]||["mut",d.efeito];
            var cb=el("div","proc-c "+kl[0]);
            cb.appendChild(el("span","proc-cl",kl[1]));
            if(d.efeito_porque)cb.appendChild(el("span","proc-cd",d.efeito_porque));
            cp.appendChild(cb);
          }
          cp.appendChild(el("p",null,d.o_que_decidiu||""));
          if(d.fonte){var a2=el("a",null,"fonte");a2.href=d.fonte;a2.target="_blank";a2.rel="noopener noreferrer";
            a2.style.color="var(--accent)";a2.style.fontSize="11.5px";cp.appendChild(a2);}
          it.appendChild(cp);
          cxg.appendChild(it);});
        lin.appendChild(cxg);});
    }
    pintaDec();
    box.appendChild(lin);

    /* 2b · o que ainda não foi julgado.
       Um processo pendente não é decisão e não pode entrar na contagem — mas
       ficar de fora por completo também engana, porque a demora mantém a regra
       vigente e isso tem efeito. Fica numa lista própria, fora de toda conta. */
    if((S.pendentes||[]).length){
      /* recolhido como os outros blocos longos desta página, mas com rótulo
         próprio: o chevron genérico de "análise" não diria o que tem dentro. */
      var pdD=document.createElement("details");pdD.className="dob av";
      var pdS=document.createElement("summary");
      pdS.appendChild(document.createTextNode("O que ainda não foi julgado"));
      pdS.appendChild(el("span","dob-n",String(S.pendentes.length)));
      pdD.appendChild(pdS);
      var pdC=el("div","dob-c");pdD.appendChild(pdC);
      var pd=el("div","stf-pend");pdC.appendChild(pd);
      if(S.pendentes_intro) pd.appendChild(el("p","ig-res",S.pendentes_intro));
      S.pendentes.forEach(function(q){
        var it=el("div","stf-it");
        var dt=el("div","stf-dt");
        dt.appendChild(el("b",null,q.tema||""));
        dt.appendChild(el("span","stf-oj","sem decisão"));
        it.appendChild(dt);
        var cp=el("div","stf-c");
        cp.appendChild(el("div","stf-p",q.processos||""));
        var cb=el("div","proc-c mut");
        cb.appendChild(el("span","proc-cl","Pendente de julgamento"));
        if(q.situacao)cb.appendChild(el("span","proc-cd",q.situacao));
        cp.appendChild(cb);
        [["Quem propôs",q.autores],["Relator",q.relator],
         ["Por que está aqui",q.por_que_esta_aqui],
         ["Ressalva de fonte",q.ressalva_fonte]].forEach(function(par){
          if(!par[1])return;
          var l=el("p","stf-pl");
          l.appendChild(el("span","rot",par[0]));
          l.appendChild(document.createTextNode(par[1]));
          cp.appendChild(l);});
        if(q.fonte){var af=el("a",null,"andamento no STF");af.href=q.fonte;af.target="_blank";
          af.rel="noopener noreferrer";af.style.color="var(--accent)";af.style.fontSize="11.5px";
          cp.appendChild(af);}
        it.appendChild(cp);
        pd.appendChild(it);});
      box.appendChild(pdD);
    }

    // 3 · o levantamento das 123
    var C=S.caso_123||{};
    var cx=el("div","bal stf-123");
    cx.appendChild(el("h4",null,"O levantamento das 123 manifestações (2019-2021)"));
    var q=el("div","ig-aviso");
    q.appendChild(el("span","rot","O que este número é"));
    q.appendChild(document.createTextNode(
      "Não é estatística do STF. É uma lista de 123 decisões e manifestações do tribunal sobre o governo federal, "+
      "montada a partir de reportagens de jornal desde 2019 e avaliada no Palácio do Planalto em agosto de 2021 por "+
      "militares e integrantes do governo. Ou seja: uma contagem feita por um dos lados sobre o que o outro fez com "+
      "ele. Não há levantamento equivalente publicado para nenhum outro governo do período — procurei, e não existe. "+
      "Por isso o número não compara governos, e não deve ser lido como se comparasse."));
    cx.appendChild(q);
    cx.appendChild(el("p","bal-n",
      "A lista mistura tipos muito diferentes de ato: liminares que suspenderam decretos e medidas provisórias, "+
      "despachos dando prazo para o governo prestar explicações, e aberturas e prorrogações de inquérito. Um prazo "+
      "de cinco dias para explicar uma declaração e a suspensão de uma medida provisória contam igual nessa soma."));
    if((C.temas||[]).length){
      cx.appendChild(el("div","eyebrow","Do que trata"));
      var ut=el("ul");
      (C.temas||[]).forEach(function(t){
        var li=el("li");
        li.appendChild(el("b",null,t.tema+" — "));
        li.appendChild(document.createTextNode(t.o_que));
        if(t.peso)li.appendChild(el("span","quem"," ("+t.peso+")"));
        ut.appendChild(li);});
      cx.appendChild(ut);
    }
    if((C.exemplos||[]).length){
      cx.appendChild(el("div","eyebrow","Onze itens da lista, com data"));
      var ue=el("ul");
      C.exemplos.forEach(function(x){
        var li=el("li");
        li.appendChild(el("b",null,x.data+" — "));
        li.appendChild(document.createTextNode(x.o_que));
        ue.appendChild(li);});
      cx.appendChild(ue);
      cx.appendChild(el("p","bal-n",
        "Estes onze foram reescritos a partir da lista publicada; os 123 itens completos estão nas reportagens "+
        "abaixo, e não são reproduzidos aqui na íntegra por serem texto de terceiros."));
    }
    var sr=el("div","ig-src");
    sr.appendChild(el("span","rot","Onde a lista foi publicada"));
    (C.fontes||[]).forEach(function(f){
      var a3=el("a",null,f.nome);a3.href=f.url;a3.target="_blank";a3.rel="noopener noreferrer";
      a3.style.color="var(--accent)";sr.appendChild(a3);
      if(f.orientacao)sr.appendChild(el("span","proc",f.orientacao));});
    cx.appendChild(sr);
    foot.appendChild(cx);

    (S.notas||[]).forEach(function(n){foot.appendChild(el("p","ig-res",n));});
  }

  function blocoUF(cfg,box,foot){
    var S=IG.series[cfg.ids[0]]; if(!S) return;
    var anos=S.pontos.map(function(p){return p.ano;}).sort(function(a,b){return b-a;});
    var ano=anos[0], ordem="desc", agrupar="regiao", regs=null, abertos={}, tudoAberto=false;
    var CAMPORD=["Extrema-esquerda","Esquerda","Centro-esquerda","Centro","Centro-direita","Direita","Extrema-direita","sem classificação"];
    var barra=el("div","ig-cats"), ctl=el("div","uf-ctl"), lista=el("div","uf-lista");
    box.appendChild(barra); box.appendChild(ctl); box.appendChild(lista);

    var ORDENS=[["desc","maior → menor"],["asc","menor → maior"],["az","estado A → Z"],["za","estado Z → A"]];
    function ordenar(arr){
      return arr.slice().sort(function(a,b){
        if(ordem==="desc")return b.v-a.v;
        if(ordem==="asc")return a.v-b.v;
        if(ordem==="az")return a.uf.localeCompare(b.uf,"pt");
        return b.uf.localeCompare(a.uf,"pt");});
    }
    function linha(l,mx){
      var r=el("div","uf-row");
      var n=el("div","uf-n");
      n.appendChild(el("b",null,l.uf));
      n.appendChild(el("span","uf-full",UFNOME[l.uf]||l.uf));
      if(agrupar!=="regiao")n.appendChild(el("span","uf-reg",UFREG[l.uf]||""));
      if(agrupar==="regiao"&&l.campo)n.appendChild(el("span","uf-reg",l.campo));
      r.appendChild(n);
      var tr=el("div","uf-track");
      var i=el("i");i.style.width=Math.max(1,(l.v/mx)*100)+"%";tr.appendChild(i);
      r.appendChild(tr);
      r.appendChild(el("em","uf-v",dec((Math.round(l.v*10)/10).toFixed(1))));
      var p=el("div","uf-p");
      if(agrupar==="partido"){
        if(l.g&&l.g.nome){var gn=el("span","uf-gov",l.g.nome);
          if(l.g.houve_troca)comTip(gn,"houve troca de titular no mandato");p.appendChild(gn);}
      } else if(l.g&&l.g.partido_eleicao){
        p.appendChild(el("span","uf-part",l.g.partido_eleicao));
        var q=(l.g.nome||"")+(l.g.houve_troca?" · houve troca de titular no mandato":"");
        if(q.trim())comTip(p,q+" — partido pelo qual foi eleito");
      } else p.appendChild(el("span","uf-part sem","sem registro"));
      r.appendChild(p);
      return r;
    }

    function pinta(){
      barra.textContent=""; ctl.textContent=""; lista.textContent="";
      var lab=el("span","uf-rot","Ano");lab.style.marginRight="4px";barra.appendChild(lab);
      anos.slice().sort(function(a,b){return a-b;}).forEach(function(y){
        var b=el("button","chip-cat"+(y===ano?" on":""),String(y));
        b.type="button";b.setAttribute("aria-pressed",y===ano?"true":"false");
        b.addEventListener("click",function(){ano=y;pinta();});
        barra.appendChild(b);});

      var l1=el("div","uf-linha");
      l1.appendChild(el("span","uf-rot","Ordenar"));
      ORDENS.forEach(function(o){
        var b=el("button","chip-cat"+(ordem===o[0]?" on":""),o[1]);
        b.type="button";b.setAttribute("aria-pressed",ordem===o[0]?"true":"false");
        b.addEventListener("click",function(){ordem=o[0];pinta();});
        l1.appendChild(b);});
      ctl.appendChild(l1);

      var l0=el("div","uf-linha");
      l0.appendChild(el("span","uf-rot","Agrupar"));
      [["","sem agrupar"],["regiao","por região"],["partido","por partido do governador"],
       ["campo","por campo ideológico"]].forEach(function(o){
        var b=el("button","chip-cat"+(agrupar===o[0]?" on":""),o[1]);
        b.type="button";b.setAttribute("aria-pressed",agrupar===o[0]?"true":"false");
        b.addEventListener("click",function(){agrupar=o[0];pinta();});
        l0.appendChild(b);});
      ctl.appendChild(l0);

      var l2=el("div","uf-linha");
      l2.appendChild(el("span","uf-rot","Região"));
      var bt=el("button","chip-cat"+(!regs?" on":""),"Todas");bt.type="button";
      bt.addEventListener("click",function(){regs=null;pinta();});
      l2.appendChild(bt);
      REGORD.forEach(function(R){
        var on=!!regs&&regs.indexOf(R)>=0;
        var b=el("button","chip-cat"+(on?" on":""),R);b.type="button";
        b.setAttribute("aria-pressed",on?"true":"false");
        b.addEventListener("click",function(){
          if(!regs)regs=[R];
          else if(on){regs=regs.filter(function(x){return x!==R;});if(!regs.length)regs=null;}
          else regs=regs.concat([R]);
          pinta();});
        l2.appendChild(b);});
      ctl.appendChild(l2);

      var pt=null; S.pontos.forEach(function(p){if(p.ano===ano)pt=p;});
      if(!pt) return;
      var linhas=[];
      Object.keys(pt.valores||{}).forEach(function(uf){
        var v=pt.valores[uf];
        if(v===null||v===undefined) return;
        if(regs && regs.indexOf(UFREG[uf])<0) return;
        var gv=govDe(uf,ano), pa=(gv&&gv.partido_eleicao)||null;
        var cl=pa?((((IG.partidos||{}).partidos)||{})[pa]||null):null;
        linhas.push({uf:uf,v:v,reg:UFREG[uf]||"—",g:gv,partido:pa||"sem registro",
          campo:(cl&&cl.campo)||"sem classificação",score:cl?cl.score:null});
      });
      if(!linhas.length){lista.appendChild(el("p","uf-obs","Nenhum estado neste recorte."));return;}
      var mx=0; linhas.forEach(function(l){if(l.v>mx)mx=l.v;});
      if(pt.obs) lista.appendChild(el("p","uf-obs",pt.obs));

      if(!agrupar){
        ordenar(linhas).forEach(function(l){lista.appendChild(linha(l,mx));});
        return;
      }
      var chave={regiao:"reg",partido:"partido",campo:"campo"}[agrupar];
      var por={}; linhas.forEach(function(l){(por[l[chave]]=por[l[chave]]||[]).push(l);});
      var chaves=Object.keys(por);
      if(agrupar==="regiao") chaves=REGORD.filter(function(R){return por[R];});
      else if(agrupar==="campo") chaves=CAMPORD.filter(function(C){return por[C];});
      else chaves.sort(function(a,b){return por[b].length-por[a].length||a.localeCompare(b,"pt");});
      if(ordem==="desc"||ordem==="asc"){
        chaves=chaves.slice().sort(function(a,b){
          var ma=por[a].reduce(function(s,x){return s+x.v;},0)/por[a].length;
          var mb=por[b].reduce(function(s,x){return s+x.v;},0)/por[b].length;
          return ordem==="desc"?mb-ma:ma-mb;});
      } else if(ordem==="za"){ chaves=chaves.slice().reverse(); }

      if(agrupar==="campo"||agrupar==="partido"){
        var al=el("p","uf-alerta");
        al.appendChild(el("b",null,agrupar==="campo"
          ? "Isto não é um placar entre campos políticos. "
          : "Isto não é um placar entre partidos. "));
        al.appendChild(document.createTextNode(agrupar==="campo"
          ? ("Os grupos abaixo reúnem estados pelo campo ideológico do partido que elegeu o governador, segundo a "+
             "classificação de Bolognesi, Ribeiro e Codato (2023) — uma pesquisa com 519 cientistas políticos feita "+
             "em 2018, citada embaixo. Estados não têm a mesma economia, a mesma população nem a mesma estrutura "+
             "produtiva, e o eleitorado que elege um governador é o mesmo que vive a economia local: a relação, se "+
             "existe, corre nos dois sentidos. A média de um grupo muda de lugar quando um único estado grande "+
             "troca de lado.")
          : ("Vários partidos governam um ou dois estados apenas — nesses casos, a 'média' do partido é a taxa "+
             "daquele estado, e não diz nada sobre o partido. Estados não têm a mesma economia nem a mesma "+
             "população, e o partido do governador não determina a estrutura econômica local.")));
        lista.appendChild(al);
      }

      var medias=chaves.map(function(K){
        return por[K].reduce(function(s,x){return s+x.v;},0)/por[K].length;});
      var medMax=Math.max.apply(null,medias)||1;

      var tg=el("div","uf-togg");
      var bt1=el("button","chip-cat",tudoAberto?"recolher todos":"expandir todos");
      bt1.type="button";
      bt1.addEventListener("click",function(){
        tudoAberto=!tudoAberto; abertos={};
        if(tudoAberto)chaves.forEach(function(K){abertos[K]=1;});
        pinta();});
      tg.appendChild(bt1);
      tg.appendChild(el("span","uf-togg-n",chaves.length+(chaves.length===1?TR("gr-1"):TR("gr-n"))+
        TR("gr-clique")));
      lista.appendChild(tg);

      chaves.forEach(function(K,ki){
        var arr=por[K], med=medias[ki], aberto=!!abertos[K];
        var h=el("button","uf-gh"+(aberto?" on":""));
        h.type="button";h.setAttribute("aria-expanded",aberto?"true":"false");
        var ch=svgEl("svg",{viewBox:"0 0 16 16",width:13,height:13,"class":"uf-ch"});
        ch.appendChild(svgEl("path",{d:"M5 3.5 10 8l-5 4.5",fill:"none",stroke:"currentColor",
          "stroke-width":1.8,"stroke-linecap":"round","stroke-linejoin":"round"}));
        h.appendChild(ch);
        var PPm=((IG.partidos||{}).partidos)||{};
        var t=el("span","uf-gt");
        if(agrupar==="partido"){
          var bnome=el("b","part-nome");
          var nm=(PPm[K]||{}).nome;
          bnome.appendChild(document.createTextNode(nm&&nm!==K?nm:K));
          if(nm&&nm!==K)bnome.appendChild(el("span","part-sig"," ("+K+")"));
          t.appendChild(bnome);
        } else t.appendChild(el("b",null,K));
        t.appendChild(el("span","uf-reg-n",arr.length+(arr.length===1?" estado":" estados")));
        if(agrupar==="campo"){
          var sig={}; arr.forEach(function(l){sig[l.partido]=1;});
          var lst=Object.keys(sig).sort().map(function(x){
            var n=(PPm[x]||{}).nome; return (n&&n!==x)?(n+" ("+x+")"):x;}).join(" · ");
          if(lst){var lp=el("span","uf-reg-p");lp.appendChild(el("span","rot","partidos "));
            lp.appendChild(document.createTextNode(lst));t.appendChild(lp);}
        }
        h.appendChild(t);
        var bar=el("span","uf-gbar");
        var bi=el("i");bi.style.width=Math.max(2,(med/medMax)*100)+"%";bar.appendChild(bi);
        h.appendChild(bar);
        var vv=el("span","uf-gv");
        vv.appendChild(el("b",null,dec((Math.round(med*10)/10).toFixed(1))));
        vv.appendChild(el("span","uf-gl",arr.length===1?"valor único":"média simples"));
        h.appendChild(vv);
        comTip(h, arr.length===1
          ? "Um só estado neste grupo: o número é a taxa desse estado, não uma média de nada."
          : ("Média aritmética das "+arr.length+" unidades do grupo. NÃO é a taxa do grupo: para isso cada estado "+
             "teria de pesar conforme a respectiva população, e este site não tem população por estado ano a ano."));
        h.addEventListener("click",function(){
          if(abertos[K])delete abertos[K]; else abertos[K]=1;
          pinta();});
        lista.appendChild(h);
        if(aberto){
          var cx=el("div","uf-gin");
          ordenar(arr).forEach(function(l){cx.appendChild(linha(l,mx));});
          lista.appendChild(cx);
        }
      });
    }
    pinta();
  }

  function slugG(t){return "g-"+t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,44);}

  // ---- dados em CSV ----
  function csvEsc(v){
    var t=(v===null||v===undefined)?"":String(v);
    return /[";\n]/.test(t) ? '"'+t.replace(/"/g,'""')+'"' : t;
  }
  function linhasCSV(cfg){
    var L=[];
    var ids=cfg.ids||[cfg.id];
    var temSerie=ids.some(function(i){return (IG.series||{})[i];});
    if(temSerie){
      L.push(["serie","categoria","ano","valor","unidade","tipo","observacao","orgao","fonte"]);
      ids.forEach(function(id){
        var S=(IG.series||{})[id]; if(!S)return;
        var url=(S.fonte&&S.fonte.url)||"";
        S.pontos.forEach(function(p){
          if(S.categorias&&S.categorias.length){
            S.categorias.forEach(function(c){
              var v=(p.valores||{})[c];
              if(v===null||v===undefined)return;
              L.push([S.titulo,c,p.ano,v,(S.unidades&&S.unidades[c])||S.unidade,p.tipo||"apurado",p.obs||"",S.orgao||"",url]);});
          } else {
            if(p.valor===null||p.valor===undefined)return;
            L.push([S.titulo,"",p.ano,p.valor,S.unidade,p.tipo||"apurado",p.obs||"",S.orgao||"",url]);}
        });});
      return L;
    }
    if(cfg.forma==="dossie-stf"&&IG.stf){
      L.push(["governo","data","processo","orgao_julgador","efeito","por_que","o_que_decidiu","fonte"]);
      (IG.stf.decisoes||[]).forEach(function(d){
        L.push([d.governo,d.data,d.processo,d.orgao_julgador||"",d.efeito||"",d.efeito_porque||"",
                d.o_que_decidiu,d.fonte||""]);});
      return L;
    }
    if(cfg.forma==="marcos-lista"&&IG[cfg.dados]){
      L.push(["governo","data","nome","area","ato","o_que_mudou","autoria","fonte"]);
      (IG[cfg.dados].marcos||[]).forEach(function(m){
        L.push([m.governo||"",m.data||m.data_sancao||"",m.nome||"",m.area||"",m.ato||m.numero_ato||"",
                m.o_que||m.o_que_mudou||"",m.autoria||"",m.fonte||""]);});
      return L;
    }
    if(cfg.titulacao&&IG.titulacao){
      L.push(["periodo","ano_inicio","ano_fim","anos_com_dado","familias_assentadas_no_periodo",
              "media_familias_assentadas_por_ano","documentos_titulacao_no_periodo",
              "media_documentos_titulacao_por_ano","obs_media","fonte"]);
      (IG.titulacao.por_governo_barras||[]).forEach(function(p){
        var n=p.anos_com_dado||0;
        L.push([p.periodo,p.ini,p.fim,n,p.assentadas,
                n?Math.round(p.assentadas/n):"",
                p.titulos===null?"":p.titulos,
                (p.titulos!==null&&n)?Math.round(p.titulos/n):"",
                "medias calculadas por divisao igual do total do periodo pelos anos com dado; a fonte nao publica titulacao ano a ano",
                p.fonte||""]);});
      L.push([]);
      L.push(["serie","","ano","valor","unidade","tipo","observacao","orgao","fonte"]);
      var S2=IG.series["reforma_agraria"];
      if(S2)S2.pontos.forEach(function(p){
        var v=(p.valores||{})["Famílias assentadas"];
        if(v==null)return;
        L.push([S2.titulo,"",p.ano,v,S2.unidade,p.tipo||"apurado",p.obs||"",S2.orgao||"",(S2.fonte||{}).url||""]);});
      return L;
    }
    return null;
  }
  /* ---------------- exportação em imagem (PNG) ---------------- */
  var PNG_PROPS=["fill","fill-opacity","fill-rule","stroke","stroke-opacity","stroke-width",
    "stroke-dasharray","stroke-linecap","stroke-linejoin","opacity","font-family","font-size",
    "font-weight","font-style","text-anchor","letter-spacing","paint-order","dominant-baseline",
    "clip-path","transform","visibility","display"];
  function corDe(nome,alt){
    try{var v=getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
      return v||alt;}catch(e){return alt;}
  }
  function baixaBlob(nome,blob){
    var url=URL.createObjectURL(blob);
    var a=document.createElement("a");
    a.href=url;a.download=nome;document.body.appendChild(a);a.click();
    setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url);},400);
  }
  function carimbo(){
    var d=new Date(),z=function(n){return n<10?"0"+n:""+n;};
    return z(d.getDate())+"/"+z(d.getMonth()+1)+"/"+d.getFullYear();
  }
  function envolve(ctx,txt,larg,max){
    var pal=String(txt==null?"":txt).split(/\s+/),ls=[],cur="";
    for(var i=0;i<pal.length;i++){
      var t=cur?cur+" "+pal[i]:pal[i];
      if(ctx.measureText(t).width>larg&&cur){ls.push(cur);cur=pal[i];}else cur=t;
      if(ls.length>=max)break;
    }
    if(ls.length<max&&cur)ls.push(cur);
    if(ls.length===max){
      var resto=pal.slice(ls.join(" ").split(/\s+/).length).join(" ");
      if(resto){var u=ls[max-1];
        while(ctx.measureText(u+"…").width>larg&&u.length>1)u=u.slice(0,-1);
        ls[max-1]=u+"…";}
    }
    return ls.length?ls:[""];
  }
  /* moldura comum: título, corpo desenhado por fn, rodapé com fonte e data */
  function moldura(op,fnCorpo){
    var E=op.escala||2, pad=26, W=op.larg;
    var bg=corDe("--surface","#ffffff"), ink=corDe("--ink","#111111"),
        ink2=corDe("--ink-2","#555555"), line=corDe("--line","#dddddd");
    var med=document.createElement("canvas").getContext("2d");
    med.font="600 17px system-ui,-apple-system,Segoe UI,Roboto,sans-serif";
    var tl=envolve(med,op.titulo,W-pad*2,2);
    med.font="13px system-ui,-apple-system,Segoe UI,Roboto,sans-serif";
    var sl=op.sub?envolve(med,op.sub,W-pad*2,2):[];
    med.font="11.5px system-ui,-apple-system,Segoe UI,Roboto,sans-serif";
    var fl=envolve(med,op.rodape||"",W-pad*2,3);
    med.font="12px system-ui,-apple-system,Segoe UI,Roboto,sans-serif";
    var LEG=op.legenda||[], legL=[], lgY=0;
    if(LEG.length){
      var disp=W-pad*2, cur=[], usado=0;
      LEG.forEach(function(g){
        var lw=med.measureText(g[1]).width+26;
        if(usado+lw>disp&&cur.length){legL.push(cur);cur=[];usado=0;}
        cur.push([g[0],g[1],lw]);usado+=lw;});
      if(cur.length)legL.push(cur);
      lgY=legL.length*19+8;
    }
    var hCab=pad+tl.length*23+(sl.length?sl.length*18+4:0)+lgY+14;
    var hFim=14+fl.length*16+pad;
    var hCorpo=op.altCorpo;
    var H=hCab+hCorpo+hFim;
    var cv=document.createElement("canvas");
    cv.width=W*E;cv.height=H*E;
    var c=cv.getContext("2d");c.scale(E,E);
    c.fillStyle=bg;c.fillRect(0,0,W,H);
    var y=pad+4;
    c.fillStyle=ink;c.font="600 17px system-ui,-apple-system,Segoe UI,Roboto,sans-serif";
    c.textBaseline="top";
    tl.forEach(function(t){c.fillText(t,pad,y);y+=23;});
    if(sl.length){c.fillStyle=ink2;c.font="13px system-ui,-apple-system,Segoe UI,Roboto,sans-serif";
      sl.forEach(function(t){c.fillText(t,pad,y);y+=18;});y+=4;}
    if(legL.length){
      y+=4;c.font="12px system-ui,-apple-system,Segoe UI,Roboto,sans-serif";
      legL.forEach(function(fila){
        var x=pad;
        fila.forEach(function(g){
          if(g[0].hach){c.fillStyle=g[0].cor;c.globalAlpha=.22;c.fillRect(x,y+2,11,11);c.globalAlpha=1;
            c.strokeStyle=g[0].cor;c.lineWidth=1.2;c.strokeRect(x+.5,y+2.5,10,10);
            c.beginPath();c.moveTo(x,y+13);c.lineTo(x+11,y+2);c.stroke();}
          else {c.fillStyle=g[0].cor;c.fillRect(x,y+2,11,11);}
          c.fillStyle=ink2;c.fillText(g[1],x+16,y+1);
          x+=g[2];});
        y+=19;});
      y+=4;
    }
    y+=10;
    c.strokeStyle=line;c.lineWidth=1;
    c.beginPath();c.moveTo(pad,y-6);c.lineTo(W-pad,y-6);c.stroke();
    fnCorpo(c,pad,y,W-pad*2);
    var yf=hCab+hCorpo+14;
    c.strokeStyle=line;c.beginPath();c.moveTo(pad,yf-8);c.lineTo(W-pad,yf-8);c.stroke();
    c.fillStyle=ink2;c.font="11.5px system-ui,-apple-system,Segoe UI,Roboto,sans-serif";
    fl.forEach(function(t){c.fillText(t,pad,yf);yf+=16;});
    return cv;
  }
  function rodapePadrao(extra){
    var base="Eleições 2026 — planos, currículo e dados · imagem gerada em "+carimbo()+
      " a partir da versão publicada em solverone.com.br/radar-one · "+
      "conteúdo pode ser corrigido ou atualizado sem aviso prévio";
    return extra?extra+" · "+base:base;
  }
  function salvaCanvas(cv,nome){
    if(cv.toBlob)cv.toBlob(function(b){if(b)baixaBlob(nome,b);},"image/png");
    else baixaBlob(nome,new Blob([atob(cv.toDataURL("image/png").split(",")[1])],{type:"image/png"}));
  }
  /* ---- PNG de um SVG já desenhado na página ---- */
  function pngDeSVG(src,op){
    var cl=src.cloneNode(true);
    var A=src.querySelectorAll("*"), B=cl.querySelectorAll("*");
    for(var i=0;i<A.length&&i<B.length;i++){
      var cs=getComputedStyle(A[i]),d="";
      for(var j=0;j<PNG_PROPS.length;j++){
        var v=cs.getPropertyValue(PNG_PROPS[j]);
        if(v!==""&&v!=null)d+=PNG_PROPS[j]+":"+v+";";
      }
      B[i].setAttribute("style",d);
      B[i].removeAttribute("class");
    }
    var vb=src.viewBox&&src.viewBox.baseVal?src.viewBox.baseVal:null;
    var W=(vb&&vb.width)||src.getBoundingClientRect().width||900;
    var H=(vb&&vb.height)||src.getBoundingClientRect().height||340;
    cl.setAttribute("xmlns","http://www.w3.org/2000/svg");
    cl.setAttribute("xmlns:xlink","http://www.w3.org/1999/xlink");
    cl.setAttribute("width",W);cl.setAttribute("height",H);
    [].forEach.call(cl.querySelectorAll("image"),function(im){
      var h=im.getAttribute("href")||im.getAttribute("xlink:href");
      if(h)im.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",h);});
    var txt=new XMLSerializer().serializeToString(cl);
    var img=new Image();
    img.onload=function(){
      var LG=op.largura||Math.min(1200,Math.max(760,W+52));
      var esc=(LG-52)/W, hC=Math.round(H*esc)+10;
      var cv=moldura({larg:LG,altCorpo:hC,escala:op.escala,titulo:op.titulo,sub:op.sub,
        rodape:op.rodape,legenda:op.legenda},
        function(c,x,y,w){ c.drawImage(img,x,y,w,Math.round(H*esc)); });
      if(op.entrega)op.entrega(cv); else salvaCanvas(cv,op.nome);
    };
    img.onerror=function(){ alerta("Não foi possível gerar a imagem neste navegador. O CSV continua disponível."); };
    img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(txt);
  }
  /* ---- PNG de uma tabela (mesmas linhas do CSV) ---- */
  function pngDeLinhas(L,op){
    if(!L||!L.length)return;
    var lim=op.maxLinhas||400, corte=L.length-1>lim;
    var linhas=corte?[L[0]].concat(L.slice(1,lim+1)):L;
    var med=document.createElement("canvas").getContext("2d");
    med.font="12px system-ui,-apple-system,Segoe UI,Roboto,sans-serif";
    var nc=0;linhas.forEach(function(r){if(r.length>nc)nc=r.length;});
    var larguras=[],i,j;
    for(j=0;j<nc;j++){
      var w=0;
      for(i=0;i<linhas.length;i++){
        var t=String(linhas[i][j]==null?"":linhas[i][j]);
        if(i===0)t=t.replace(/_/g," ");
        var m=med.measureText(t).width+18;
        if(m>w)w=m;
      }
      larguras.push(Math.max(52,Math.min(300,w)));
    }
    var wTab=larguras.reduce(function(a,b){return a+b;},0);
    var LG=Math.max(760,Math.min(1500,wTab+52));
    if(wTab>LG-52){var f=(LG-52)/wTab;for(j=0;j<nc;j++)larguras[j]=larguras[j]*f;}
    var alturas=[],lin=[];
    for(i=0;i<linhas.length;i++){
      var cel=[],mx=1;
      for(j=0;j<nc;j++){
        med.font=(i===0?"600 12px":"12px")+" system-ui,-apple-system,Segoe UI,Roboto,sans-serif";
        var cel0=linhas[i][j];
        if(i===0)cel0=String(cel0==null?"":cel0).replace(/_/g," ").replace(/^./,function(x){return x.toUpperCase();});
        var ls=envolve(med,cel0,larguras[j]-14,i===0?2:(op.textoCortado?2:3));
        cel.push(ls);if(ls.length>mx)mx=ls.length;
      }
      lin.push(cel);alturas.push(mx*16+12);
    }
    var ALTMAX=op.altMax||2200, acum=0, kMax=alturas.length;
    for(i=0;i<alturas.length;i++){acum+=alturas[i];if(acum>ALTMAX){kMax=i;break;}}
    if(kMax<alturas.length&&kMax>1){
      lin=lin.slice(0,kMax);alturas=alturas.slice(0,kMax);corte=true;
      lim=kMax-1;
    }
    var hC=alturas.reduce(function(a,b){return a+b;},0)+8;
    var ink=corDe("--ink","#111"),ink2=corDe("--ink-2","#555"),
        line=corDe("--line-2","#e5e5e5"),zeb=corDe("--surface-2","#f7f7f7");
    var cv=moldura({larg:LG,altCorpo:hC,titulo:op.titulo,sub:op.sub,escala:1.5,
      rodape:(corte?"Imagem limitada às "+lim+" primeiras linhas de "+(L.length-1)+"; a tabela completa está no CSV. ":"")+
        (op.textoCortado?"Textos longos aparecem abreviados nesta imagem; o texto completo está no CSV. ":"")+
        rodapePadrao(op.rodape)},
      function(c,x0,y0,w){
        var y=y0+4;
        for(var i=0;i<lin.length;i++){
          var x=x0;
          if(i===0){c.fillStyle=zeb;c.fillRect(x0,y-3,w,alturas[i]);}
          else if(i%2===0){c.fillStyle=zeb;c.globalAlpha=.5;c.fillRect(x0,y-3,w,alturas[i]);c.globalAlpha=1;}
          for(var j=0;j<nc;j++){
            c.fillStyle=i===0?ink:ink2;
            c.font=(i===0?"600 12px":"12px")+" system-ui,-apple-system,Segoe UI,Roboto,sans-serif";
            var yy=y+3;
            lin[i][j].forEach(function(t){c.fillText(t,x+7,yy);yy+=16;});
            x+=larguras[j];
          }
          c.strokeStyle=line;c.lineWidth=1;
          c.beginPath();c.moveTo(x0,y+alturas[i]-3.5);c.lineTo(x0+w,y+alturas[i]-3.5);c.stroke();
          y+=alturas[i];
        }
      });
    salvaCanvas(cv,op.nome);
  }
  /* dois desenhos: seta para baixo em cima de uma linha, que quer dizer baixar,
     e os tres nos ligados, que e o simbolo de compartilhar que todo mundo
     reconhece do celular. Usar a seta no botao de compartilhar dizia "baixar"
     para quem so olha o icone. */
  var ICO_BAIXAR='<path d="M8 2v8M8 10 4.5 6.5M8 10l3.5-3.5M2.5 13h11" fill="none" '+
    'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>';
  var ICO_COMPARTILHAR='<path d="M5.55 6.95 10.5 4.2M5.55 9.05 10.5 11.8" fill="none" '+
    'stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>'+
    '<circle cx="3.9" cy="8" r="2.35" fill="currentColor"/>'+
    '<circle cx="12.1" cy="3.4" r="2.35" fill="currentColor"/>'+
    '<circle cx="12.1" cy="12.6" r="2.35" fill="currentColor"/>';
  function btnBase(rot,dica,fn,cls,ico){
    var b=el("button",cls||"btn-csv");b.type="button";
    b.innerHTML='<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">'+
      (ico||ICO_BAIXAR)+'</svg>';
    b.appendChild(document.createTextNode(rot));
    b.title=dica;b.addEventListener("click",fn);
    return b;
  }
  /* lê as legendas de cor visíveis dentro de um bloco */
  function legendaDe(box){
    var out=[],vistos={};
    [].forEach.call(box.querySelectorAll(".leg-ig span"),function(sp){
      var i=sp.querySelector("i"); if(!i)return;
      var txt=sp.textContent.replace(/\s+/g," ").trim(); if(!txt||vistos[txt])return;
      var cs=getComputedStyle(i), cor=cs.backgroundColor, hach=false;
      if(!cor||cor==="rgba(0, 0, 0, 0)"||cor==="transparent"){
        cor=cs.borderTopColor||cs.color;hach=true;}
      if(cs.backgroundImage&&cs.backgroundImage!=="none"){
        var m=cs.backgroundImage.match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}/i);
        if(m){cor=m[0];hach=true;}}
      vistos[txt]=1;out.push([{cor:cor||"#888",hach:hach},txt]);});
    return out;
  }
  /* lê uma <table> renderizada e devolve as linhas visíveis */
  function linhasDeTabela(tbl){
    if(!tbl)return null;
    var L=[],ths=[].map.call(tbl.querySelectorAll("thead th"),function(t){
      return t.textContent.replace(/[↕ⓘi]+\s*$/,"").replace(/\s+/g," ").trim();});
    if(ths.length)L.push(ths);
    [].forEach.call(tbl.querySelectorAll("tbody tr"),function(tr){
      if(tr.hidden||tr.offsetParent===null&&tr.style.display==="none")return;
      var r=[].map.call(tr.children,function(td){
        var t=td.textContent.replace(/\s+/g," ").trim();
        var a=td.querySelector("a[href^='http']");
        if(a)return t?t+" ("+a.href+")":a.href;
        return t;});
      if(r.join("").trim())L.push(r);});
    return L.length>1?L:null;
  }
  /* par de botões CSV + PNG para qualquer bloco */
  /* compartilhar: imagem grande e nítida mais um texto curto. Onde o aparelho
     tem a folha de compartilhamento do sistema (celular, e alguns navegadores de
     mesa), a imagem vai junto e o WhatsApp aparece na lista. Onde não tem, a
     imagem é baixada e o texto vai para a área de transferência — o resultado
     final é o mesmo, só exige colar. */
  function podeCompartilharArquivo(f){
    try{ return !!(navigator.share && navigator.canShare && navigator.canShare({files:[f]})); }
    catch(e){ return false; }
  }
  function textoShare(op){
    var partes=[op.titulo];
    if(op.sub)partes.push(op.sub);
    partes.push(TR("share-fonte"));
    partes.push(op.link||location.href.split("#")[0]);
    return partes.join("\n");
  }
  function entregaShare(cv,op){
    var nome=(op.nome||"grafico").replace(/\.png$/,"")+".png";
    var txt=textoShare(op);
    function baixaECopia(){
      salvaCanvas(cv,nome);
      var ok=false;
      try{ if(navigator.clipboard&&navigator.clipboard.writeText){
        navigator.clipboard.writeText(txt); ok=true; } }catch(e){}
      alerta(ok?TR("share-caiu"):TR("share-caiu-sem"));
    }
    if(!cv.toBlob){ baixaECopia(); return; }
    cv.toBlob(function(b){
      if(!b){ baixaECopia(); return; }
      var f;
      try{ f=new File([b],nome,{type:"image/png"}); }catch(e){ baixaECopia(); return; }
      if(!podeCompartilharArquivo(f)){ baixaECopia(); return; }
      navigator.share({files:[f],text:txt,title:op.titulo})
        .catch(function(err){ if(err&&err.name==="AbortError")return; baixaECopia(); });
    },"image/png");
  }
  /* 1400px de largura e escala 3 dão uma imagem de ~4200px: nítida em tela de
     celular moderno e ainda legível quando o WhatsApp recomprime */
  function compartilhaSVG(src,op){
    pngDeSVG(src,{nome:op.nome,titulo:op.titulo,sub:op.sub,rodape:op.rodape,legenda:op.legenda,
      largura:1400,escala:3,entrega:function(cv){ entregaShare(cv,op); }});
  }
  function btnCompartilhar(fn){
    return btnBase(TR("share-bt"),TR("share-tip"),fn,"btn-csv btn-share",ICO_COMPARTILHAR);
  }
  function botoesDL(host,op){
    if(!host)return;
    var bar=el("div","ig-acoes");bar.style.margin="10px 0 6px";
    bar.appendChild(btnBase("Dados em CSV","Baixa esta tabela em CSV (abre no Excel)",function(){
      var L=op.linhas();if(!L||L.length<2){alerta("Nada para baixar aqui.");return;}
      baixaCSV(op.nome+".csv",L);}));
    bar.appendChild(btnBase("Imagem PNG","Baixa esta seção como imagem, com título, fonte e data",function(){
      if(op.svg){var s=op.svg();if(s){pngDeSVG(s,{nome:op.nome+".png",titulo:op.titulo,sub:op.sub,
        rodape:rodapePadrao(op.fonte),legenda:op.legenda?op.legenda():null});return;}}
      var L=op.linhas();if(!L||L.length<2){alerta("Nada para baixar aqui.");return;}
      pngDeLinhas(L,{nome:op.nome+".png",titulo:op.titulo,sub:op.sub,rodape:op.fonte,
        textoCortado:op.textoCortado});}));
    if(op.svg)bar.insertBefore(btnCompartilhar(function(){
      var sv=op.svg(); if(!sv){alerta(TR("share-sem"));return;}
      compartilhaSVG(sv,{nome:op.nome,titulo:op.titulo,sub:op.sub,
        rodape:rodapePadrao(op.fonte),legenda:op.legenda?op.legenda():null,link:op.link});}),
      bar.firstChild);
    if(!op.semAviso)bar.appendChild(avisoTela());
    host.appendChild(bar);
    return bar;
  }
  window.DL={botoesDL:botoesDL,linhasDeTabela:linhasDeTabela,pngDeLinhas:pngDeLinhas,
    compartilhaSVG:compartilhaSVG,btnCompartilhar:btnCompartilhar,
    pngDeSVG:pngDeSVG,baixaCSV:baixaCSV,rodapePadrao:rodapePadrao,legendaDe:legendaDe,
    btnBase:btnBase,avisoTela:avisoTela,alerta:function(m){alerta(m);}};
  /* leva até um gráfico e SEGURA a posição: enquanto os blocos vizinhos
     terminam de desenhar, a altura da página muda e o alvo escorrega */
  function ancoraEm(alvo){
    if(!alvo)return;
    if(alvo.renderAgora)alvo.renderAgora();
    var t0=Date.now(), estaveis=0, ultimo=null;
    (function passo(){
      var nv=document.querySelector(".nav");
      var folga=(nv?nv.getBoundingClientRect().height:47)+14;
      var y=Math.max(0,Math.round(alvo.getBoundingClientRect().top+window.pageYOffset-folga));
      if(y===ultimo)estaveis++;else{estaveis=0;ultimo=y;}
      window.scrollTo(0,y);
      if(estaveis<6&&Date.now()-t0<1600)requestAnimationFrame(passo);
    })();
  }
  window.ancoraEm=ancoraEm;
  function alerta(m){try{var t=document.getElementById("tip");if(t){t.textContent=m;t.classList.add("on");
    setTimeout(function(){t.classList.remove("on");},3200);}else console.warn(m);}catch(e){}}
  function baixaCSV(nome,linhas){
    var txt="﻿"+linhas.map(function(l){return l.map(csvEsc).join(";");}).join("\r\n");
    var blob=new Blob([txt],{type:"text/csv;charset=utf-8"});
    var url=URL.createObjectURL(blob);
    var a=document.createElement("a");
    a.href=url;a.download=nome;document.body.appendChild(a);a.click();
    setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url);},400);
  }
  function botaoCSV(cfg){
    var L=linhasCSV(cfg); if(!L||L.length<2) return null;
    var b=el("button","btn-csv");b.type="button";
    b.innerHTML='<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">'+
      '<path d="M8 2v8M8 10 4.5 6.5M8 10l3.5-3.5M2.5 13h11" fill="none" stroke="currentColor" '+
      'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    b.appendChild(document.createTextNode("Dados em CSV"));
    b.title="Baixa os números deste gráfico, com unidade, tipo de apuração, órgão e link da fonte";
    b.addEventListener("click",function(){
      baixaCSV(slugG(cfg.titulo).replace(/^g-/,"")+".csv",L);});
    return b;
  }
  function avisoTela(){
    var p=el("p","aviso-tela");
    p.appendChild(document.createTextNode(
      "Gráfico largo: role para o lado ou deite o celular."));
    return p;
  }

  function bloco(cfg){
    var box=el("div","ig");box.style.marginBottom="22px";
    box.id=slugG(cfg.titulo);
    box.style.scrollMarginTop="64px";
    var volta=el("button","ao-indice");volta.type="button";
    volta.innerHTML='<svg viewBox="0 0 16 16" aria-hidden="true" width="12" height="12">'+
      '<path d="M8 13V3M8 3 3.5 7.5M8 3l4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.7" '+
      'stroke-linecap="round" stroke-linejoin="round"/></svg>';
    volta.appendChild(document.createTextNode("Voltar ao índice"));
    volta.addEventListener("click",function(){
      var idx=document.querySelector(".ig-idx");
      if(idx)idx.scrollIntoView({behavior:"smooth",block:"start"});});
    box.appendChild(volta);
    var sel=(cfg.sel_inicial&&cfg.sel_inicial.length)?cfg.sel_inicial.slice():null;
    var h=el("div","ig-h");
    h.appendChild(el("div","ig-k",cfg.macro));
    var t=el("h3");t.appendChild(document.createTextNode(cfg.titulo));h.appendChild(t);
    if(cfg.sub)h.appendChild(el("p","ig-sub",cfg.sub));
    box.appendChild(h);
    /* aviso que precisa ser lido antes do gráfico, não dentro de um chevron.
       Montado aqui, uma vez: dentro do redesenho ele se repetia a cada filtro. */
    if(cfg.aviso_visivel && cfg.forma!=="marcos-lista"){
      var apv=el("p","mk-alerta");apv.style.margin="0 0 12px";
      apv.textContent=cfg.aviso_visivel;
      box.appendChild(apv);
    }
    var barra=el("div","ig-cats");box.appendChild(barra);
    var lg=el("div","leg-ig");box.appendChild(lg);
    var pl=el("div","ig-plot");box.appendChild(pl);
    var foot=el("div","ig-foot");box.appendChild(foot);

    function pintaUm(){
      var r=desenha(cfg,sel);
      barra.textContent="";lg.textContent="";pl.textContent="";foot.textContent="";

      if(cfg.agregados && cfg.agregados.length && cfg.forma!=="barra-linha"){
        /* o seletor de 14 doenças é longo; agrupar por família responde
           "quanto mata o câncer" sem obrigar a marcar quatro linhas */
        var lv=el("div","ig-ver");
        lv.appendChild(el("span","uf-rot",TR("ver-rot")));
        [[false,TR("ver-item")],[true,TR("ver-grupo")]].forEach(function(o){
          var on=(!!cfg.__agr)===o[0];
          var b=el("button","chip-cat"+(on?" on":""),o[1]);b.type="button";
          b.setAttribute("aria-pressed",on?"true":"false");
          b.addEventListener("click",function(){
            if((!!cfg.__agr)===o[0])return;
            cfg.__agr=o[0];
            sel=(!o[0]&&cfg.sel_inicial&&cfg.sel_inicial.length)?cfg.sel_inicial.slice():null;
            pintaUm();});
          lv.appendChild(b);});
        barra.appendChild(lv);
      }
      if(r.cats.length>1 && cfg.forma!=="barra-linha"){
        var mk=function(rot,ativo,fn){
          var b=el("button","chip-cat"+(ativo?" on":""),rot);
          b.type="button";b.setAttribute("aria-pressed",ativo?"true":"false");
          b.addEventListener("click",fn);barra.appendChild(b);};
        mk("Todos",!sel,function(){sel=null;pintaUm();});
        r.cats.forEach(function(c){
          var on=!!sel&&sel.indexOf(c)>=0;
          mk(c,on,function(){
            if(!sel)sel=[c];
            else if(on){sel=sel.filter(function(x){return x!==c;});if(!sel.length)sel=null;}
            else sel=sel.concat([c]);
            pintaUm();});
        });
      }

      var uns={};r.ss.forEach(function(s){uns[s.unidade]=1;});
      var umaUni=Object.keys(uns).length===1;
      if(umaUni) lg.appendChild(el("span","uni-so",Object.keys(uns)[0]));
      if(r.ss.length>1){
        r.ss.forEach(function(s,i){
          var sp=el("span");var ic=el("i");
          if(cfg.forma==="barra-linha"&&i>0){ic.className="tracejado";ic.style.background="";}
          else ic.style.background=s.cor;
          sp.appendChild(ic);
          sp.appendChild(document.createTextNode(umaUni?s.titulo:(s.titulo+" ("+s.unidade+")")));
          lg.appendChild(sp);});
      }

      if(cfg.forma==="titulacao-so"){
        barra.textContent="";lg.textContent="";pl.textContent="";
      } else if(cfg.forma==="mandato-barras"){
        barra.textContent="";lg.textContent="";pl.textContent="";
        blocoMandatos(cfg,pl,foot);
      } else if(cfg.forma==="marcos-lista"){
        barra.textContent="";lg.textContent="";pl.textContent="";
        blocoMarcos(cfg,pl,foot);
      } else if(cfg.forma==="dossie-stf"){
        barra.textContent="";lg.textContent="";pl.textContent="";
        blocoSTF(cfg,pl,foot);
      } else if(cfg.forma==="pesos-radar"){
        barra.textContent="";lg.textContent="";pl.textContent="";
        blocoPesos(cfg,pl,foot);
      } else if(cfg.forma==="marcos-radar"){
        barra.textContent="";lg.textContent="";pl.textContent="";
        blocoMarcosRadar(cfg,pl,foot);
      } else if(cfg.forma==="uf-barras"){
        barra.textContent="";lg.textContent="";pl.textContent="";
        blocoUF(cfg,pl,foot);
      } else if(cfg.forma==="paineis"){
        pl.textContent="";lg.textContent="";
        var N2=norm(cfg);
        var lst=N2.ss.filter(function(o){return !sel||sel.indexOf(o.titulo)>=0;});
        if(!lst.length)lst=N2.ss;
        /* escala comum só faz sentido com a MESMA unidade; com unidades
           diferentes, um eixo compartilhado compararia coisas incomparáveis */
        var unis={};lst.forEach(function(o){unis[o.unidade||""]=1;});
        /* dividir o eixo exige duas coisas: mesma unidade E ordens de grandeza
           próximas. Mesma unidade não basta — R$ 189 bilhões e R$ 33 milhões são
           ambos reais, e num eixo só o segundo vira uma linha reta no zero. */
        var picos=lst.map(function(o){
          var m=0;o.pontos.forEach(function(p){var a=Math.abs(p.v);if(a>m)m=a;});return m||1;});
        var razao=Math.max.apply(null,picos)/Math.min.apply(null,picos);
        var mesmaUni=(Object.keys(unis).length===1)&&(razao<=10);
        var dom=null;
        if(mesmaUni&&lst.length>1){
          var vv=[];lst.forEach(function(o){o.pontos.forEach(function(p){vv.push(p.v);});});
          if(vv.length){
            var lo=Math.min.apply(null,vv), hi=Math.max.apply(null,vv);
            var folga=(hi-lo)*0.16||1;
            dom=[(cfg.zero||lo>=0)?Math.min(0,lo):lo-folga, hi+folga];
          }
        }
        lst.forEach(function(o,i){
          /* o painel de baixo vinha compacto, sem faixa de governo nem retrato.
             Economizava altura e custava a referência: quem olha o segundo
             painel perdia o único elemento que diz em que governo cada trecho
             foi medido, que é o ponto do recorte deste site. */
          var sub={forma:(cfg.painel_forma||"linha"),ids:[o.serie.id],compacto:false,titulo:o.titulo,
                   zero:cfg.zero,dominio:dom,dominio_x:cfg.dominio_x};
          var rr=desenha(sub,[o.titulo]);
          var cab=el("div","pan-h");
          cab.appendChild(el("b",null,o.titulo));
          cab.appendChild(el("span","pan-u",o.unidade));
          pl.appendChild(cab);
          pl.appendChild(rr.svg);
        });
        var np=el("p","ig-res");np.style.margin="10px 12px 0";
        np.textContent=mesmaUni&&lst.length>1
          ? "Os painéis acima estão na mesma escala vertical, porque medem na mesma unidade e em ordens de grandeza próximas — a altura de um pode ser comparada com a do outro a olho."
          : (Object.keys(unis).length>1
             ? (TR("uni-1")+Object.keys(unis).join(" / ")+TR("uni-2"))
             : (TR("escala-grandeza-1")+Math.round(razao)+TR("escala-grandeza-2")));
        pl.appendChild(np);
      } else pl.appendChild(r.svg);

      if(cfg.titulacao && IG.titulacao){
        // gráfico unificado: assentar e titular na mesma linha do tempo
        (function(){
          var T0=IG.titulacao, lst=(T0.por_governo_barras||[]);
          if(!lst.length) return;
          var modo="media";
          var ctl=el("div","uf-linha");ctl.style.padding="4px 12px 0";
          var capt=el("p","pan-u");capt.style.cssText="margin:4px 12px 0;font-size:12px";
          var hostSVG=el("div");
          ctl.appendChild(el("span","uf-rot","Ver"));
          [["media","média por ano"],["governo","total do período"],["ano","ano a ano"]].forEach(function(o){
            var b=el("button","chip-cat"+(modo===o[0]?" on":""),o[1]);b.type="button";
            b.dataset.m=o[0];
            b.addEventListener("click",function(){
              modo=o[0];
              [].forEach.call(ctl.querySelectorAll(".chip-cat"),function(x){
                x.classList.toggle("on",x.dataset.m===modo);
                x.setAttribute("aria-pressed",x.dataset.m===modo?"true":"false");});
              pintaRA();});
            ctl.appendChild(b);});
          pl.appendChild(ctl);
          pl.appendChild(capt);
          pl.appendChild(hostSVG);

          var lg=el("div","leg-ig");lg.style.padding="8px 12px 0";
          pl.appendChild(lg);
          var reg=el("div","ra-med");pl.appendChild(reg);

          var ANOS={};
          lst.forEach(function(p){for(var a=p.ini;a<=p.fim;a++)ANOS[a]=p;});
          function medA(p){return p.anos_com_dado?(p.assentadas||0)/p.anos_com_dado:0;}
          function medT(p){return (p.titulos!=null&&p.anos_com_dado)?p.titulos/p.anos_com_dado:null;}

          function pintaRA(){
            hostSVG.textContent="";lg.textContent="";
            var legs=[["var(--s600)",null,"Famílias assentadas — entrada em projeto de assentamento"],
                      ["var(--warn)",null,"Documentos de titulação — entrega do documento a quem já estava assentado"]];
            if(modo==="ano")legs[1]=["transparent","var(--warn)",
              "Titulação — média do mandato distribuída igualmente pelos anos (hachurada: não é dado anual)"];
            legs.forEach(function(p){
              var sp=el("span");var ic=el("i");ic.style.background=p[0];
              if(p[1]){ic.style.border="1px dashed "+p[1];ic.style.background=
                "repeating-linear-gradient(45deg,transparent 0 2px,"+p[1]+" 2px 4px)";ic.style.opacity=".85";}
              sp.appendChild(ic);sp.appendChild(document.createTextNode(p[2]));lg.appendChild(sp);});
            capt.textContent = modo==="media"
              ? "Altura da barra = média por ano · número acima da barra = total do período · largura = duração do governo"
              : (modo==="governo"
                ? "Altura da barra = total somado no período · número dentro de cada faixa = média por ano"
                : "Barras anuais de assentamento (dado real) + faixa hachurada de titulação (média do mandato)");

            var W0=980,H0=350,ML0=62,MR0=18,MT0=74,MB0=34;
            var x0=1998,x1=2027;
            var svg=svgEl("svg",{viewBox:"0 0 "+W0+" "+H0,role:"img"});
            var defs=svgEl("defs");
            var pat=svgEl("pattern",{id:"hatchRA",width:6,height:6,
              patternUnits:"userSpaceOnUse",patternTransform:"rotate(45)"});
            var pb=svgEl("rect",{x:0,y:0,width:6,height:6,fill:"var(--warn)"});
            pb.setAttribute("fill-opacity",".16");pat.appendChild(pb);
            pat.appendChild(svgEl("line",{x1:0,y1:0,x2:0,y2:6,stroke:"var(--warn)","stroke-width":2.4}));
            defs.appendChild(pat);svg.appendChild(defs);
            var X=function(a){return ML0+(a-x0)/(x1-x0)*(W0-ML0-MR0);};
            var XC=function(a){return X(a+0.5);};
            var CEL=(W0-ML0-MR0)/(x1-x0);
            var S1=IG.series["reforma_agraria"];
            var mx=0;
            if(modo==="governo"){
              lst.forEach(function(p){var t=(p.assentadas||0)+(p.titulos||0);if(t>mx)mx=t;});
            } else if(modo==="media"){
              lst.forEach(function(p){var t=medA(p)+(medT(p)||0);if(t>mx)mx=t;});
            } else {
              S1.pontos.forEach(function(p){
                if(p.ano<x0)return;
                var v=(p.valores||{})["Famílias assentadas"];
                if(v==null)return;
                var g=ANOS[p.ano],t=g?(medT(g)||0):0;
                if(v+t>mx)mx=v+t;});
            }
            if(!mx)mx=1;
            var Y=function(v){return H0-MB0-(v/mx)*(H0-MT0-MB0);};
            var ALT=H0-MT0-MB0;

            IG.governos.forEach(function(g,i){
              var a=Math.max(g.ini,x0), b=Math.min(g.fim,x1);
              if(b<=a)return;
              if((g.tom!==undefined?g.tom:i%2)===0)svg.appendChild(svgEl("rect",{x:X(a),y:MT0-30,width:X(b)-X(a),
                height:(H0-MB0)-(MT0-30),fill:"var(--surface-2)",opacity:.85}));
              svg.appendChild(svgEl("rect",{x:X(a),y:MT0-30,width:X(b)-X(a),height:18,fill:"var(--surface-2)"}));
              if(i>0)svg.appendChild(svgEl("line",{x1:X(a),x2:X(a),y1:MT0-34,y2:H0-MB0,
                stroke:"var(--line-2)","stroke-width":1}));
              var cx=(X(a)+X(b))/2;
              if(X(b)-X(a)>40){
                var t1=svgEl("text",{x:cx,y:MT0-22,"text-anchor":"middle","class":"gv-lab"});
                t1.textContent=g.rot;svg.appendChild(t1);}
              if(verF()&&X(b)-X(a)>50&&IG.fotos[g.foto]){
                var R=19,img=svgEl("image",{x:cx-R,y:MT0-34-R*2,width:R*2,height:R*2,href:IG.fotos[g.foto],
                  preserveAspectRatio:"xMidYMid slice"});
                img.setAttribute("clip-path","circle("+R+"px at "+R+"px "+R+"px)");
                svg.appendChild(img);}
            });
            function fmt(v){return v>=1000?(dec((v/1000).toFixed(v>=100000?0:1))+SUF_MIL):String(Math.round(v));}
            function nb(v){return Math.round(v).toLocaleString(ENUS?"en-US":"pt-BR");}
            /* mesmas marcas redondas do eixo dos outros gráficos */
            var mcR=marcasRedondas(0,mx,4);
            mcR.forEach(function(v){
              var y=Y(v);
              svg.appendChild(svgEl("line",{x1:ML0,x2:W0-MR0,y1:y,y2:y,"class":"grid"}));
              var tx=svgEl("text",{x:ML0-7,y:y+3,"text-anchor":"end","class":"ax"});
              tx.textContent=v>=1000?dec(String(Math.round(v/1000)))+SUF_MIL:String(Math.round(v));
              svg.appendChild(tx);});
            for(var a2=Math.ceil(x0);a2<x1;a2+=1){
              var t2=svgEl("text",{x:XC(a2),y:H0-MB0+16,"text-anchor":"middle","class":"ax"});
              if(CEL<26)t2.setAttribute("font-size","8.5");
              t2.textContent=a2;svg.appendChild(t2);}

            function dentro(x,y,h,larg,txt){
              if(h<12||larg<44)return;
              var t=svgEl("text",{x:x+larg/2,y:y+h/2+3.5,"text-anchor":"middle","font-size":"10.5",
                "font-weight":"600",fill:"#fff",stroke:"rgba(0,0,0,.45)","stroke-width":2.4,
                "paint-order":"stroke","stroke-linejoin":"round"});
              t.textContent=txt;svg.appendChild(t);}

            if(modo!=="ano"){
              lst.forEach(function(p){
                var xa=X(p.ini),xb=X(p.fim+1),larg=Math.max(8,xb-xa-6);
                var base=H0-MB0, med=modo==="media";
                var vA=med?medA(p):(p.assentadas||0);
                var vT=p.titulos==null?null:(med?medT(p):p.titulos);
                var hA=(vA/mx)*ALT;
                if(hA>0){
                  var rA=svgEl("rect",{x:xa+3,y:base-hA,width:larg,height:hA,fill:"var(--s600)",rx:2});
                  comTip(rA,p.periodo+" — "+nb(p.assentadas)+" famílias assentadas somadas em "+
                    p.anos_com_dado+" anos, média de "+nb(medA(p))+" por ano");
                  svg.appendChild(rA);
                  dentro(xa+3,base-hA,hA,larg,nb(medA(p))+"/ano");}
                if(vT!=null){
                  var hT=(vT/mx)*ALT;
                  var rT=svgEl("rect",{x:xa+3,y:base-hA-hT,width:larg,height:hT,fill:"var(--warn)",rx:2});
                  comTip(rT,p.periodo+" — "+nb(p.titulos)+" documentos de titulação no período inteiro, média de "+
                    nb(medT(p))+" por ano; a fonte não publica ano a ano");
                  svg.appendChild(rT);
                  dentro(xa+3,base-hA-hT,hT,larg,nb(medT(p))+"/ano");
                  var tv=svgEl("text",{x:xa+3+larg/2,y:base-hA-hT-6,"text-anchor":"middle","class":"vl",
                    stroke:"var(--surface)","stroke-width":3.2,"paint-order":"stroke","stroke-linejoin":"round"});
                  tv.textContent=fmt((p.assentadas||0)+p.titulos);svg.appendChild(tv);
                } else {
                  var rN=svgEl("rect",{x:xa+3,y:MT0,width:larg,height:base-MT0-hA,fill:"none",
                    stroke:"var(--line-2)","stroke-width":1,"stroke-dasharray":"4 3"});
                  comTip(rN,p.periodo+" — número de titulação não localizado em fonte publicada no mesmo formato");
                  svg.appendChild(rN);
                  var tn=svgEl("text",{x:xa+3+larg/2,y:MT0+26,"text-anchor":"middle","class":"ax"});
                  tn.textContent="titulação não";svg.appendChild(tn);
                  var tn2=svgEl("text",{x:xa+3+larg/2,y:MT0+38,"text-anchor":"middle","class":"ax"});
                  tn2.textContent="localizada";svg.appendChild(tn2);}
              });
            } else {
              var larg2=Math.max(4,CEL*0.74);
              S1.pontos.forEach(function(p){
                if(p.ano<x0)return;
                var v=(p.valores||{})["Famílias assentadas"];
                if(v==null)return;
                var g=ANOS[p.ano], mt=g?medT(g):null;
                var h=(v/mx)*ALT, xr=XC(p.ano)-larg2/2;
                var r=svgEl("rect",{x:xr,y:H0-MB0-h,width:larg2,height:Math.max(1.5,h),
                  rx:1.5,fill:"var(--s600)"});
                comTip(r,p.ano+" — "+nb(v)+" famílias assentadas (dado anual do INCRA)");
                svg.appendChild(r);
                if(mt!=null){
                  var ht=(mt/mx)*ALT;
                  var rt=svgEl("rect",{x:xr,y:H0-MB0-h-ht,width:larg2,height:Math.max(1.5,ht),rx:1.5,
                    fill:"url(#hatchRA)",stroke:"var(--warn)","stroke-width":1,"stroke-dasharray":"3 2"});
                  comTip(rt,p.ano+" — "+nb(mt)+" documentos de titulação, média por ano. NÃO é o número de "+
                    p.ano+": o INCRA publica só o total do período "+g.periodo+" ("+nb(g.titulos)+
                    "), dividido aqui igualmente pelos "+g.anos_com_dado+" anos.");
                  svg.appendChild(rt);}
              });
            }
            hostSVG.appendChild(svg);

            reg.textContent="";
            lst.forEach(function(p){
              var c=el("div","c"),gh=el("div","g");
              var gv=null;
              IG.governos.forEach(function(g){if(g.ini<=p.ini&&g.fim>=p.ini&&!gv)gv=g;});
              if(verF()&&gv&&IG.fotos[gv.foto]){
                var im=document.createElement("img");im.src=IG.fotos[gv.foto];im.alt="";gh.appendChild(im);}
              gh.appendChild(el("b",null,p.periodo.replace(/^[\d-]+\s*\(/,"").replace(/\)$/,"")));
              c.appendChild(gh);
              function lin(cor,val,rot){
                var d=el("div","n");var i=el("i");i.style.background=cor;d.appendChild(i);
                var sv=el("s",null,val);d.appendChild(sv);
                d.appendChild(document.createTextNode(rot));c.appendChild(d);}
              lin("var(--s600)",nb(medA(p))+"/ano","assentadas");
              if(medT(p)!=null)lin("var(--warn)",nb(medT(p))+"/ano","titulações");
              else c.appendChild(el("div","nd","titulação não localizada"));
              c.appendChild(el("div","nd",p.anos_com_dado+TR("nd-anos")+p.ini+"-"+p.fim));
              reg.appendChild(c);});

            var nota=el("p","uf-alerta");nota.style.margin="10px 12px 4px";
            if(modo==="media"){
              nota.appendChild(el("b",null,"A altura aqui é média por ano, não total. "));
              nota.appendChild(document.createTextNode(
                "Os governos duraram tempos diferentes — Temer teve dois anos, Lula 1 e 2 somam oito — e comparar "+
                "totais brutos premia quem ficou mais tempo no cargo. Nesta visão a altura é o total do período "+
                "dividido pelos anos com dado, que é a distribuição equânime possível: como a largura da barra é a "+
                "duração do governo, a área de cada barra continua proporcional ao total. O número acima da barra "+
                "continua sendo o total do período, para nada sumir. Ressalva: a fonte agrega Lula 1 e Lula 2 num "+
                "único número de oito anos, então não dá para separar os dois mandatos — a média anual é a mesma "+
                "para os dois."));
            } else if(modo==="governo"){
              nota.appendChild(el("b",null,"As duas cores são coisas diferentes, empilhadas de propósito. "));
              nota.appendChild(document.createTextNode(
                "Verde é entrada em assentamento, laranja é entrega do documento — quase sempre a quem já estava "+
                "assentado, às vezes anos antes. A soma das duas NÃO é 'total de famílias atendidas': a mesma "+
                "família pode aparecer nas duas cores, em governos diferentes. Nesta visão a altura é o total "+
                "somado no período, então governos mais longos aparecem maiores por terem durado mais — o número "+
                "dentro de cada faixa é a média por ano, que é o que permite comparar. O período de FHC aqui cobre "+
                "só 2000-2002, que é o recorte do dado de titulação disponível."));
            } else {
              nota.appendChild(el("b",null,"Verde é dado anual real; laranja hachurado é média, não medição. "));
              nota.appendChild(document.createTextNode(
                "O INCRA publica famílias assentadas ano a ano, mas titulação só por mandato. Para a titulação não "+
                "sumir desta visão, ela aparece aqui como o total do mandato dividido igualmente pelos anos — por "+
                "isso a faixa laranja é hachurada, tracejada e constante dentro de cada governo. Não leia aquele "+
                "valor como 'títulos emitidos naquele ano': a fonte não diz isso, e a entrega real foi concentrada "+
                "em alguns anos (2017 e 2022, por exemplo, tiveram picos documentados). Para os números que a fonte "+
                "de fato publica, use 'total do período'."));
            }
            hostSVG.appendChild(nota);
          }
          pintaRA();
        })();
        var T=IG.titulacao, cxT=el("div","bal");
        cxT.appendChild(el("h4",null,"Assentar e titular são coisas diferentes"));
        var E=T.explicacao||{};
        var ue=el("ul");
        (E.etapas||[]).forEach(function(et){
          var li=el("li");
          li.appendChild(el("b",null,et.sigla+" — "+et.nome+": "));
          li.appendChild(document.createTextNode(et.o_que_e));
          if(et.provisorio)li.appendChild(el("span","dlt sobe","provisório"));
          if(et.fonte){var a1=el("a",null," fonte");a1.href=et.fonte;a1.target="_blank";
            a1.rel="noopener noreferrer";a1.style.color="var(--accent)";li.appendChild(a1);}
          ue.appendChild(li);});
        cxT.appendChild(ue);
        if(E.ordem_do_processo)cxT.appendChild(el("p","bal-n",E.ordem_do_processo));

        // por que não há linha anual
        cxT.appendChild(el("h4",null,"Por que não há uma linha de títulos ano a ano"));
        cxT.appendChild(el("p","bal-n",(T.serie_anual||{}).explicacao||""));
        var tw=el("div","tw");tw.style.margin="10px 0 4px";
        var tb=el("table","t");
        var th=el("thead"),hr=el("tr");
        ["Período","Documentos de titulação","O que a fonte diz"].forEach(function(h,i){
          hr.appendChild(el("th",i===1?"n":null,h));});
        th.appendChild(hr);tb.appendChild(th);
        var bd=el("tbody");
        (T.por_governo||[]).forEach(function(p){
          var tr=el("tr");
          tr.appendChild(el("td","nm",p.periodo));
          var tdn=el("td","n");
          tdn.appendChild(document.createTextNode(p.titulos==null?"não localizado"
            :String(p.titulos).replace(/\B(?=(\d{3})+(?!\d))/g,".")));
          tr.appendChild(tdn);
          var tdo=el("td");
          tdo.appendChild(document.createTextNode(p.o_que_a_fonte_diz||""));
          if(p.fonte){var a2=el("a",null," conferir");a2.href=p.fonte;a2.target="_blank";
            a2.rel="noopener noreferrer";a2.style.color="var(--accent)";tdo.appendChild(a2);}
          tr.appendChild(tdo);
          bd.appendChild(tr);});
        tb.appendChild(bd);tw.appendChild(tb);cxT.appendChild(tw);
        cxT.appendChild(el("p","bal-n",
          "Estes totais somam instrumentos diferentes — CCU provisórios e títulos definitivos entram juntos sob o "+
          "rótulo 'documentos de titulação' na maior parte das divulgações. Onde a fonte separa, a separação está "+
          "escrita na coluna ao lado. Comparar os números entre períodos sem essa ressalva compara coisas distintas."));

        // o que se diz a favor e contra
        cxT.appendChild(el("h4",null,"O que se diz a favor e contra titular"));
        [["a_favor","A favor"],["criticas","Críticas"]].forEach(function(par){
          var lst=E[par[0]]||[]; if(!lst.length)return;
          cxT.appendChild(el("div","eyebrow",par[1]));
          var ul=el("ul");
          lst.forEach(function(x){
            var li=el("li");
            li.appendChild(document.createTextNode(x.argumento));
            li.appendChild(el("span","quem"," — "+x.de_quem));
            if(x.fonte){var a3=el("a",null," fonte");a3.href=x.fonte;a3.target="_blank";
              a3.rel="noopener noreferrer";a3.style.color="var(--accent)";li.appendChild(a3);}
            ul.appendChild(li);});
          cxT.appendChild(ul);});

        // revogações
        cxT.appendChild(el("h4",null,"Houve revogação de títulos?"));
        var R=T.revogacoes||{};
        cxT.appendChild(el("p","bal-n", R.houve
          ? "Sim — os itens abaixo foram confirmados em fonte."
          : "Não foi localizado nenhum ato oficial — portaria, instrução normativa ou decisão — que tenha revisado, "+
            "suspendido ou cancelado em bloco os títulos emitidos em qualquer período. O que existe são declarações "+
            "públicas em sentidos opostos, registradas abaixo com quem as fez."));
        var ur=el("ul");
        (R.itens||[]).forEach(function(it){
          var li=el("li");
          li.appendChild(el("b",null,(it.data||"")+" — "));
          li.appendChild(document.createTextNode(it.o_que||""));
          if(it.fonte){var a4=el("a",null," fonte");a4.href=it.fonte;a4.target="_blank";
            a4.rel="noopener noreferrer";a4.style.color="var(--accent)";li.appendChild(a4);}
          ur.appendChild(li);});
        (R.normas||[]).forEach(function(n){
          var li=el("li");
          li.appendChild(el("b",null,(n.ato||"")+" — "));
          li.appendChild(document.createTextNode(n.o_que_mudou||""));
          if(n.fonte){var a5=el("a",null," fonte");a5.href=n.fonte;a5.target="_blank";
            a5.rel="noopener noreferrer";a5.style.color="var(--accent)";li.appendChild(a5);}
          ur.appendChild(li);});
        if(ur.children.length)cxT.appendChild(ur);
        (T.notas||[]).forEach(function(n){cxT.appendChild(el("p","bal-n",n));});
        foot.appendChild(cxT);
      }
      if(cfg.forma==="uf-barras" && (IG.partidos||{}).fonte){
        var PP=IG.partidos, cx0=el("div","bal");
        cx0.appendChild(el("h4",null,"De onde vem a classificação por campo ideológico"));
        var p0=el("p","bal-n",PP.metodo||"");
        cx0.appendChild(p0);
        var ul0=el("ul");
        (PP.faixas||[]).forEach(function(f){
          ul0.appendChild(el("li",null,f.nome+" — de "+dec(String(f.de))+" a "+dec(String(f.ate))));});
        cx0.appendChild(ul0);
        var semc=[];
        Object.keys(PP.partidos||{}).forEach(function(k){if(PP.partidos[k].score===null)semc.push(k);});
        cx0.appendChild(el("p","bal-n",
          "A pesquisa é de 2018 e partidos mudam de nome, se fundem e se dividem: onde a legenda de hoje tem outro "+
          "nome na pesquisa, o site usa a posição da mesma legenda sob o nome antigo."+
          (semc.length?(" Sem posição nessa escala, por não existirem em 2018: "+semc.join(", ")+"."):"")+
          " A classificação é de terceiros e é uma medida de percepção de especialistas, não um fato sobre o partido."));
        var sr0=el("div","ig-src");
        sr0.appendChild(el("span","rot","Fonte"));
        sr0.appendChild(document.createTextNode(PP.fonte.nome));
        if(PP.fonte.url){var a0=el("a",null,"ler o artigo");a0.href=PP.fonte.url;a0.target="_blank";
          a0.rel="noopener noreferrer";a0.style.color="var(--accent)";sr0.appendChild(a0);}
        cx0.appendChild(sr0);
        foot.appendChild(cx0);
      }
      if(cfg.balanco){
        var B=cfg.balanco, SB=IG.series[B.serie];
        if(SB){
          var mapa={}; SB.pontos.forEach(function(p){mapa[p.ano]=p;});
          var cx=el("div","bal");
          cx.appendChild(el("h4",null,B.titulo||"Como cada governo recebeu e como entregou"));
          var ul=el("ul");
          B.pares.forEach(function(par){
            var g=null; IG.governos.forEach(function(x){if(x.id===par.gov)g=x;});
            if(!g) return;
            var A=mapa[par.de], Z=mapa[par.ate];
            var li=el("li");
            li.appendChild(el("b",null,g.rot+" ("+g.sub+") — "));
            if(!A||!Z){
              li.appendChild(el("span","sem",!A&&!Z?"a série ainda não existia neste período"
                :(!A?"não há dado de entrada: a série começa depois da posse"
                    :"não há dado de saída publicado")));
              if(Z&&!A) li.appendChild(document.createTextNode(" · saída: "+dec(Z.valor.toFixed(1))+"% do PIB em dez/"+par.ate));
            } else {
              var d=Z.valor-A.valor;
              li.appendChild(document.createTextNode(
                TR("bal-1")+dec(A.valor.toFixed(1))+TR("bal-2")+par.de+") "+
                (Z.tipo==="apurado"?TR("bal-3a"):TR("bal-3b"))+" "+dec(Z.valor.toFixed(1))+"% ("+
                (Z.tipo==="apurado"?"dez/":"")+par.ate+")"));
              var sp=el("span","dlt"+(d>0?" sobe":" cai"),
                (d>0?"+":"−")+dec(Math.abs(d).toFixed(1))+" p.p.");
              li.appendChild(sp);
            }
            ul.appendChild(li);
          });
          cx.appendChild(ul);
          if(B.nota) cx.appendChild(el("p","bal-n",B.nota));
          foot.appendChild(cx);
        }
      }
      if(cfg.marcos_extra==="tributarios" && IG.marcos_tributarios){
        var MT=IG.marcos_tributarios, cx2=el("div","bal");
        cx2.appendChild(el("h4",null,"Mudanças tributárias do período, com o ato que as instituiu"));
        var porG={};
        (MT.marcos||[]).forEach(function(m){
          var g=null; IG.governos.forEach(function(x){if(m.ano>=Math.floor(x.ini)&&m.ano<=Math.floor(x.fim))g=x;});
          var k=g?g.rot+" ("+g.sub+")":"antes de 1998";
          (porG[k]=porG[k]||[]).push(m);});
        Object.keys(porG).forEach(function(k){
          var h=el("div","eyebrow",k);h.style.margin="14px 0 6px";cx2.appendChild(h);
          var ul2=el("ul");
          porG[k].sort(function(a,b){return a.ano-b.ano;}).forEach(function(m){
            var li=el("li");
            li.appendChild(el("span","tag-"+(m.tipo||"outro"),({criacao:"criou",extincao:"extinguiu",
              aumento:"aumentou",reducao:"reduziu",substituicao:"substituiu",regra_fiscal:"regra fiscal"}[m.tipo]||m.tipo||"—")));
            li.appendChild(el("b",null," "+m.ano+" · "+(m.titulo||"")+" — "));
            li.appendChild(document.createTextNode(m.o_que||""));
            if(m.ato){var e=el("span","ato"," "+m.ato);li.appendChild(e);}
            if(m.fonte){var A2=el("a",null," ato");A2.href=m.fonte;A2.target="_blank";A2.rel="noopener noreferrer";
              A2.style.color="var(--accent)";li.appendChild(A2);}
            ul2.appendChild(li);});
          cx2.appendChild(ul2);});
        (MT.notas||[]).forEach(function(n){cx2.appendChild(el("p","bal-n",n));});
        foot.appendChild(cx2);
      }
      var barraFoot=el("div","ig-acoes");
      var bcsv=botaoCSV(cfg); if(bcsv)barraFoot.appendChild(bcsv);
      barraFoot.appendChild(btnBase("Imagem PNG",
        "Baixa este gráfico como imagem, com título, fonte e data",function(){
        var cand=[].slice.call(pl.querySelectorAll("svg")).filter(function(sv){
          var vb=sv.viewBox&&sv.viewBox.baseVal;
          return vb&&vb.width>=300&&vb.height>=120;});
        var alvo=null,area=0;
        cand.forEach(function(sv){var vb=sv.viewBox.baseVal,a=vb.width*vb.height;
          if(a>area){area=a;alvo=sv;}});
        var fnt=(r.metas&&r.metas[0])?((r.metas[0].orgao||"")+((r.metas[0].fonte||{}).url?" — "+r.metas[0].fonte.url:"")):"";
        if(alvo){pngDeSVG(alvo,{nome:slugG(cfg.titulo).replace(/^g-/,"")+".png",
          titulo:cfg.titulo,sub:cfg.sub||"",rodape:rodapePadrao(fnt),legenda:legendaDe(box)});return;}
        var L=linhasCSV(cfg);
        if(L&&L.length>1){pngDeLinhas(L,{nome:slugG(cfg.titulo).replace(/^g-/,"")+".png",
          titulo:cfg.titulo,sub:cfg.sub||"",rodape:fnt,textoCortado:true});return;}
        alerta("Este bloco não tem gráfico nem tabela para exportar como imagem.");
      }));
      /* compartilhar na frente dos dois downloads: é a ação que leva o
         gráfico para fora do site, que é o objetivo da página */
      barraFoot.insertBefore(window.DL.btnCompartilhar(function(){
        var cand=[].slice.call(pl.querySelectorAll("svg")).filter(function(sv){
          var vb=sv.viewBox&&sv.viewBox.baseVal;
          return vb&&vb.width>=300&&vb.height>=120;});
        var alvo=null,area=0;
        cand.forEach(function(sv){var vb=sv.viewBox.baseVal,a=vb.width*vb.height;
          if(a>area){area=a;alvo=sv;}});
        if(!alvo){alerta(TR("share-sem"));return;}
        var fnt=(r.metas&&r.metas[0])?((r.metas[0].orgao||"")+((r.metas[0].fonte||{}).url?" — "+r.metas[0].fonte.url:"")):"";
        window.DL.compartilhaSVG(alvo,{nome:slugG(cfg.titulo).replace(/^g-/,""),
          titulo:cfg.titulo,sub:cfg.sub||"",rodape:rodapePadrao(fnt),legenda:legendaDe(box),
          link:location.href.split("#")[0]+"#"+slugG(cfg.titulo)});
      }),barraFoot.firstChild);
      if(cfg.forma!=="pesos-radar"&&cfg.forma!=="marcos-radar")barraFoot.appendChild(avisoTela());
      /* logo abaixo do gráfico: em blocos com muita análise embaixo,
         no fim do rodapé ninguém acha. Blocos especiais marcam o ponto
         exato com um .dl-anchor logo após o próprio gráfico. */
      var anc=pl.querySelector(".dl-anchor");
      if(anc&&anc.parentNode)anc.parentNode.replaceChild(barraFoot,anc);
      else foot.insertBefore(barraFoot,foot.firstChild);
      if(cfg.aviso){
        var av=el("div","ig-aviso");
        av.appendChild(el("span","rot","Como ler"));
        av.appendChild(document.createTextNode(cfg.aviso));
        foot.appendChild(av);
      }
      var vistas={}, notasVistas={};
      r.metas.forEach(function(S){
        if(vistas[S.id])return;vistas[S.id]=1;
        var p=el("p");
        p.appendChild(el("b",null,S.titulo+" — "));
        p.appendChild(document.createTextNode(S.criterio||""));
        foot.appendChild(p);
        (S.notas||[]).forEach(function(n){
          if(notasVistas[n.nota])return; notasVistas[n.nota]=1;
          var q=el("p","ig-res");
          q.appendChild(document.createTextNode(TR("Ressalva")+(n.ano?" ("+n.ano+")":"")+": "+n.nota));
          foot.appendChild(q);});
        var sr=el("div","ig-src");
        sr.appendChild(el("span","rot","Fonte"));
        sr.appendChild(document.createTextNode(S.orgao+(S.serie_codigo?" · "+S.serie_codigo:"")));
        if(S.fonte&&S.fonte.url){
          var a=el("a",null,"conferir na origem");
          a.href=S.fonte.url;a.target="_blank";a.rel="noopener noreferrer";
          a.style.color="var(--accent)";sr.appendChild(a);}
        foot.appendChild(sr);
      });
      var pp=r.ss.some(function(o){return o.pontos.some(function(p){return p.tipo!=="apurado";});});
      if(pp)foot.appendChild(el("p","ig-leg-n","Pontos vazados / linha tracejada: dado parcial ou projeção, ainda não fechado pelo órgão."));

      /* anexo: lista longa que acompanha o gráfico, recolhida num chevron próprio.
         O rótulo diz o que há dentro, como em todo chevron deste site. */
      if(cfg.anexo && IG[cfg.anexo]){
        var A=IG[cfg.anexo];
        var dt=document.createElement("details");dt.className="dob av";
        var sm2=document.createElement("summary");
        sm2.appendChild(document.createTextNode(A.titulo||"Ver lista"));
        if(A.conta){var cn=el("span","dob-n",String(A.conta));sm2.appendChild(cn);}
        var cxA=el("div","dob-c");
        dt.appendChild(sm2);dt.appendChild(cxA);
        (A.grupos||[]).forEach(function(gr){
          if(gr.rotulo){var hh=el("p","anx-h");hh.appendChild(el("b",null,gr.rotulo));cxA.appendChild(hh);}
          var ul=el("ul","anx-l");
          (gr.itens||[]).forEach(function(it){ul.appendChild(el("li",null,it));});
          cxA.appendChild(ul);
        });
        if(A.nota)cxA.appendChild(el("p","ig-res",A.nota));
        foot.appendChild(dt);
      }
    }
    var feito=false, io=null;
    box.renderAgora=function(){
      if(feito)return; feito=true;
      if(io)io.disconnect();
      pintaUm();};
    if("IntersectionObserver" in window){
      var esboco=el("div","ig-esboco");
      esboco.appendChild(el("span",null,"carregando…"));
      pl.appendChild(esboco);
      io=new IntersectionObserver(function(ents){
        ents.forEach(function(e){ if(e.isIntersecting) box.renderAgora(); });
      },{rootMargin:"700px 0px"});
      io.observe(box);
    } else box.renderAgora();
    return box;
  }

  function indice(){
    var cx=el("div","ig-idx");
    /* título e marcações na mesma linha: as duas opções valem para todos os
       gráficos da página, então moram no cartão que apresenta a página */
    var topo=el("div","idx-topo");
    var tit=el("div","idx-tit");
    tit.appendChild(el("h3",null,"O que tem nesta página"));
    topo.appendChild(tit);
    var ctl=el("div","idx-ctl");
    [["ig-marcos","marcos","mostrar marcos de acontecimentos"],
     ["ig-fotos","fotos","mostrar retratos"]].forEach(function(o){
      var lab=el("label","mk-toggle");
      var inp=document.createElement("input");
      inp.type="checkbox";inp.id=o[0];
      inp.checked=(o[1]==="marcos")?verM():verF();
      inp.addEventListener("change",function(e){
        PREFS[o[1]]=e.target.checked;gravaPrefs();
        pinta();
        var n=document.getElementById(o[0]);if(n)n.focus();
        if(window.escreveVer)escreveVer();});
      lab.appendChild(inp);
      lab.appendChild(document.createTextNode(" "+o[2]));
      ctl.appendChild(lab);});
    topo.appendChild(ctl);
    cx.appendChild(topo);
    tit.appendChild(el("p",null,
      IG.graficos.length+TR("ig-idx-n")));

    // decompõe macro em categoria e tipo
    var linhas=IG.graficos.map(function(g){
      var p=String(g.macro||"").split("·");
      var a0=null,a1=null;
      (g.ids||[g.id]).forEach(function(id){
        var S=(IG.series||{})[id]; if(!S)return;
        S.pontos.forEach(function(pt){
          if(pt.ano==null)return;
          if(a0===null||pt.ano<a0)a0=pt.ano;
          if(a1===null||pt.ano>a1)a1=pt.ano;});});
      return {g:g,cat:(p[0]||"").trim(),tip:(p[1]||"").trim()||"—",
              per:(a0!==null&&a1!==null)?(a0+"–"+a1):"—"};});

    /* em ordem alfabética: a ordem de inserção seguia a ordem dos gráficos,
       que não diz nada a quem procura um assunto */
    function alfa(a,b){return String(a).localeCompare(String(b),ENUS?"en":"pt");}
    var cats=[];
    linhas.forEach(function(l){ if(cats.indexOf(l.cat)<0)cats.push(l.cat); });
    cats.sort(alfa);
    /* os tipos disponíveis dependem das categorias marcadas: mostrar os 18 tipos
       quando só 2 deles podem dar resultado é um filtro que promete o que não cumpre */
    function tiposDe(sel){
      var r=[];
      linhas.forEach(function(l){
        if(sel.length&&sel.indexOf(l.cat)<0)return;
        if(r.indexOf(l.tip)<0)r.push(l.tip);});
      return r.sort(alfa);}
    var selC=[],selT=[],busca="";
    /* a tabela tinha a ordem dos gráficos na página, que não é ordem nenhuma
       para quem lê a tabela: ordena por categoria, tipo e nome, e deixa
       reordenar clicando no cabeçalho */
    var ordT={col:0,dir:1};
    var COLS=[{r:"Categoria",v:function(l){return l.cat+"\u0000"+l.tip+"\u0000"+l.g.titulo;}},
              {r:"Tipo",v:function(l){return l.tip+"\u0000"+l.cat+"\u0000"+l.g.titulo;}},
              {r:"Indicador",v:function(l){return l.g.titulo;}},
              {r:"Período",v:null}];

    var flt=el("div","idx-f");
    var lC=el("div","uf-linha"), lT=el("div","uf-linha"), lB=el("div","uf-linha");
    flt.appendChild(lC);flt.appendChild(lT);
    cx.appendChild(flt);
    /* celular: as 26 fichas de categoria e tipo empurravam o primeiro gráfico
       para três telas abaixo. Viram duas listas fechadas com caixa de seleção;
       a busca fica logo em seguida, e no computador nada muda. */
    var fltM=el("div","idx-f-mob");
    var mC=el("div"), mT=el("div");
    fltM.appendChild(mC);fltM.appendChild(mT);
    cx.appendChild(fltM);
    cx.appendChild(lB);
    var abre={cat:false,tip:false};

    var corpo=el("div");
    cx.appendChild(corpo);

    function normx(t){return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");}

    function chips(host,rot,lista,sel,onTodos){
      host.textContent="";
      host.appendChild(el("span","uf-rot",rot));
      var bt=el("button","chip-cat"+(sel.length?"":" on"),"Todas");bt.type="button";
      bt.addEventListener("click",function(){sel.length=0;render();});
      host.appendChild(bt);
      lista.forEach(function(v){
        var on=sel.indexOf(v)>=0;
        var b=el("button","chip-cat"+(on?" on":""),v);b.type="button";
        b.setAttribute("aria-pressed",on?"true":"false");
        b.addEventListener("click",function(){
          var i=sel.indexOf(v);
          if(i>=0)sel.splice(i,1); else sel.push(v);
          render();});
        host.appendChild(b);});
    }

    function selMulti(host,chave,rot,lista,sel){
      host.textContent="";
      var d=document.createElement("details");d.className="idx-dd";
      d.open=!!abre[chave];
      d.addEventListener("toggle",function(){abre[chave]=d.open;});
      var sm=document.createElement("summary");
      sm.appendChild(el("span","idx-dd-r",rot));
      sm.appendChild(el("span","idx-dd-v",sel.length?(sel.length+TR("idx-sel")):TR("idx-todas")));
      d.appendChild(sm);
      var cc=el("div","idx-dd-c");
      var bt=el("button","zap",TR("idx-todas-bt"));bt.type="button";
      bt.addEventListener("click",function(){sel.length=0;render();});
      cc.appendChild(bt);
      lista.forEach(function(v){
        var lab=el("label","idx-dd-i");
        var inp=document.createElement("input");inp.type="checkbox";
        inp.checked=sel.indexOf(v)>=0;
        inp.addEventListener("change",function(){
          var i=sel.indexOf(v);if(i>=0)sel.splice(i,1);else sel.push(v);
          render();});
        lab.appendChild(inp);lab.appendChild(document.createTextNode(" "+v));
        cc.appendChild(lab);});
      d.appendChild(cc);host.appendChild(d);
    }

    function render(){
      chips(lC,"Categoria",cats,selC);
      selMulti(mC,"cat","Categoria",cats,selC);
      var tips=tiposDe(selC);
      /* tira da seleção o que deixou de existir no recorte atual */
      for(var i=selT.length-1;i>=0;i--) if(tips.indexOf(selT[i])<0) selT.splice(i,1);
      /* com um tipo só, escolher tipo não filtra nada: a linha some */
      if(tips.length>1){ lT.style.display=""; chips(lT,"Tipo",tips,selT);
        mT.style.display=""; selMulti(mT,"tip","Tipo",tips,selT); }
      else { lT.style.display="none"; lT.textContent="";
        mT.style.display="none"; mT.textContent=""; }
      lB.textContent="";
      lB.appendChild(el("span","uf-rot","Buscar"));
      var inp=el("input");inp.type="search";inp.placeholder="nome do indicador ou unidade";
      inp.value=busca;inp.className="idx-b";
      inp.addEventListener("input",function(){busca=inp.value;render();
        var e=lB.querySelector(".idx-b");if(e){e.focus();try{var n=e.value.length;e.setSelectionRange(n,n);}catch(x){}}});
      lB.appendChild(inp);
      var cnt=el("span","idx-cnt");lB.appendChild(cnt);

      var q=normx(busca.trim());
      var vis=linhas.filter(function(l){
        if(selC.length&&selC.indexOf(l.cat)<0)return false;
        if(selT.length&&selT.indexOf(l.tip)<0)return false;
        /* 'busca' guarda palavras que o leitor digita e que não estão no título:
           quem procura "privatização" não acha "estatais que saíram da lista" */
        if(q&&normx(l.g.titulo+" "+(l.g.sub||"")+" "+l.cat+" "+l.tip+" "+(l.g.busca||"")).indexOf(q)<0)return false;
        return true;});
      cnt.textContent=vis.length+" de "+linhas.length;
      if(busca||selC.length||selT.length){
        var lim=el("button","zap","Limpar");lim.type="button";lim.style.marginLeft="10px";
        lim.addEventListener("click",function(){selC.length=0;selT.length=0;busca="";render();});
        lB.appendChild(lim);
      }

      corpo.textContent="";
      if(!vis.length){
        corpo.appendChild(el("p","gl-vazio","Nenhum gráfico neste recorte."));
        return;}
      var ord=vis.slice();
      if(COLS[ordT.col].v){
        var fv=COLS[ordT.col].v;
        ord.sort(function(a,b){return ordT.dir*fv(a).localeCompare(fv(b),ENUS?"en":"pt");});
      } else {
        /* período ordena pelo ano final, e depois pelo inicial */
        function an(l,k){var m=String(l.per).split("\u2013");return parseInt(m[k]||m[0],10)||0;}
        ord.sort(function(a,b){return ordT.dir*((an(a,1)-an(b,1))||(an(a,0)-an(b,0)));});
      }
      vis=ord;
      var t=el("table","idx-t"), th=el("thead"), hr=el("tr");
      COLS.forEach(function(c,i){
        var h=el("th");
        var b=el("button","idx-ord"+(ordT.col===i?" on":""),c.r);b.type="button";
        b.appendChild(el("span","idx-seta",ordT.col===i?(ordT.dir>0?"\u2191":"\u2193"):"\u21c5"));
        b.setAttribute("aria-label",TR("ordenar por")+" "+c.r);
        b.addEventListener("click",function(){
          if(ordT.col===i)ordT.dir=-ordT.dir; else {ordT.col=i;ordT.dir=1;}
          render();
          var n=document.querySelectorAll(".idx-ord")[i];if(n)n.focus();});
        h.appendChild(b);hr.appendChild(h);});
      th.appendChild(hr);t.appendChild(th);
      var tb=el("tbody");
      vis.forEach(function(l){
        var tr=el("tr");
        tr.appendChild(el("td","idx-c",l.cat));
        tr.appendChild(el("td","idx-tp",l.tip));
        var tdn=el("td");
        var a=el("a",null,l.g.titulo);
        a.href="#"+slugG(l.g.titulo);
        a.addEventListener("click",function(e){
          e.preventDefault();
          var alvo=document.getElementById(slugG(l.g.titulo));
          if(!alvo)return;
          history.replaceState(null,"","#"+slugG(l.g.titulo));
          ancoraEm(alvo);});
        tdn.appendChild(a);
        if(l.g.sub)tdn.appendChild(el("span","idx-s",l.g.sub));
        tr.appendChild(tdn);
        tr.appendChild(el("td","idx-p",l.per));
        tb.appendChild(tr);});
      t.appendChild(tb);
      var w=el("div","tw idx-tw");w.style.marginTop="4px";w.appendChild(t);
      corpo.appendChild(w);

      /* celular: a tabela de quatro colunas virava uma coluna de rolagem sem
         fim. Aqui a mesma lista entra num expand destacado, que anuncia que
         dali se vai direto ao gráfico. */
      var dm=document.createElement("details");dm.className="idx-mob";
      dm.open=!!abre.lista;
      dm.addEventListener("toggle",function(){abre.lista=dm.open;});
      var sm2=document.createElement("summary");
      sm2.appendChild(document.createTextNode(TR("idx-ir")));
      sm2.appendChild(el("span","dob-n",String(vis.length)));
      dm.appendChild(sm2);
      var ul=el("ul","idx-ml");
      vis.forEach(function(l){
        var li=el("li");
        var a2=el("a",null,l.g.titulo);
        a2.href="#"+slugG(l.g.titulo);
        a2.addEventListener("click",function(e){
          e.preventDefault();
          var alvo=document.getElementById(slugG(l.g.titulo));
          if(!alvo)return;
          history.replaceState(null,"","#"+slugG(l.g.titulo));
          ancoraEm(alvo);});
        li.appendChild(a2);
        li.appendChild(el("span","idx-mm",l.cat+" · "+l.tip+" · "+l.per));
        ul.appendChild(li);});
      dm.appendChild(ul);
      corpo.appendChild(dm);
    }
    render();
    return cx;
  }

  /* ---------- sobrepor séries ----------
     Comparar dois indicadores exigia rolar de um gráfico ao outro e comparar
     de memória. Aqui o leitor monta o próprio gráfico: escolhe as séries, o
     site põe todas na mesma linha do tempo e, quando as unidades não admitem
     um eixo comum, converte em índice de base 100 — e diz que converteu, em
     vez de desenhar uma comparação que não existe. Sai em CSV, PNG e
     compartilhamento como qualquer outro gráfico da página. */
  var SOBSEL=[], SOBMODO="auto", SOBCAT=[], SOBTIP=[], SOBABRE={};
  function sobx(t){return String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");}

  function catalogoSeries(){
    var L=[],visto={},FORA=["marcos-lista","dossie-stf","uf-barras","titulacao-so"];
    IG.graficos.forEach(function(g){
      if(FORA.indexOf(g.forma)>=0)return;
      var N;try{N=norm({ids:g.ids||[g.id],cats:g.cats});}catch(e){return;}
      N.ss.forEach(function(o){
        if(!o.pontos||o.pontos.length<3)return;
        var x0=o.pontos[0].x;
        if(!(x0>1900&&x0<2100))return;          /* só linha do tempo */
        var S=o.serie||{};
        var k=(S.id||g.titulo)+"§"+o.titulo;
        if(visto[k])return;visto[k]=1;
        var rot=(o.titulo===S.titulo)?o.titulo:((S.titulo||g.titulo)+" — "+o.titulo);
        /* na legenda o nome longo ocupa duas linhas e empurra o gráfico: ali vai
           o nome curto, e o longo fica na lista de escolha e na busca. */
        var cur=o.titulo;
        if(cur.length>62) cur=cur.slice(0,60).replace(/[\s—,-]+$/,"")+"…";
        /* mesma decomposição do índice da página: o macro é "CATEGORIA · TEMA" */
        var pm=String(g.macro||"").split("·");
        L.push({k:k,rot:rot,cur:cur,uni:o.unidade||"",pts:o.pontos.slice(),org:S.orgao||"",
                cat:(pm[0]||"").trim()||"—", tip:(pm[1]||"").trim()||"—",
                busca:sobx(rot+" "+(o.unidade||"")+" "+(g.macro||"")+" "+g.titulo)});
      });
    });
    L.sort(function(a,b){return a.rot.localeCompare(b.rot,ENUS?"en":"pt");});
    return L;
  }

  function sobrepor(){
    var CAT=catalogoSeries(), MAPA={};
    CAT.forEach(function(c){MAPA[c.k]=c;});
    for(var q0=SOBSEL.length-1;q0>=0;q0--) if(!MAPA[SOBSEL[q0]]) SOBSEL.splice(q0,1);

    var box=el("div","ig sob");box.id="g-sobrepor";box.style.scrollMarginTop="64px";
    box.style.marginBottom="22px";
    var det=document.createElement("details");det.className="sob-d";
    if((location.hash||"").slice(1)==="g-sobrepor")det.open=true;
    var sm=document.createElement("summary");
    sm.appendChild(el("span","sob-r","Comparar"));
    sm.appendChild(el("b","sob-t","Sobrepor indicadores no mesmo gráfico"));
    var cnt=el("span","sob-v");sm.appendChild(cnt);
    det.appendChild(sm);box.appendChild(det);

    var cx=el("div","sob-c");det.appendChild(cx);
    cx.appendChild(el("p","sob-p","Escolha de dois a seis indicadores desta página e veja todos num gráfico só, na mesma linha do tempo. Quando as unidades não admitem um eixo comum, o site converte as séries em índice de base 100 e avisa embaixo do gráfico."));

    /* filtrar antes de procurar: com 87 indicadores, a lista aberta é longa
       demais para varrer com o olho. Categoria estreita o campo, o tema
       estreita de novo, e só depois a busca livre — e os temas oferecidos são
       só os que sobrevivem à categoria escolhida, para o filtro não prometer
       recorte que não existe. */
    function tiposDe(sel){
      var r=[];
      CAT.forEach(function(c){
        if(sel.length&&sel.indexOf(c.cat)<0)return;
        if(r.indexOf(c.tip)<0)r.push(c.tip);});
      return r.sort(function(a,b){return String(a).localeCompare(String(b),ENUS?"en":"pt");});}
    var cats=[];
    CAT.forEach(function(c){if(cats.indexOf(c.cat)<0)cats.push(c.cat);});
    cats.sort(function(a,b){return String(a).localeCompare(String(b),ENUS?"en":"pt");});
    var hSug=el("div","uf-linha sob-sug"),hCat=el("div"),hTip=el("div");
    cx.appendChild(hSug);cx.appendChild(hCat);cx.appendChild(hTip);

    function ddMulti(host,chave,rot,lista,sel){
      host.textContent="";
      var d=document.createElement("details");d.className="idx-dd";
      d.open=!!SOBABRE[chave];
      d.addEventListener("toggle",function(){SOBABRE[chave]=d.open;});
      var sm2=document.createElement("summary");
      sm2.appendChild(el("span","idx-dd-r",rot));
      sm2.appendChild(el("span","idx-dd-v",sel.length?(sel.length+TR("idx-sel")):TR("idx-todas")));
      d.appendChild(sm2);
      var cc=el("div","idx-dd-c");
      var bt=el("button","zap",TR("idx-todas-bt"));bt.type="button";
      bt.addEventListener("click",function(){sel.length=0;render();});
      cc.appendChild(bt);
      lista.forEach(function(v){
        var lab=el("label","idx-dd-i");
        var ip2=document.createElement("input");ip2.type="checkbox";
        ip2.checked=sel.indexOf(v)>=0;
        ip2.addEventListener("change",function(){
          var i=sel.indexOf(v);if(i>=0)sel.splice(i,1);else sel.push(v);
          render();});
        lab.appendChild(ip2);lab.appendChild(document.createTextNode(" "+v));
        cc.appendChild(lab);});
      d.appendChild(cc);host.appendChild(d);
    }

    var lb=el("div","uf-linha");cx.appendChild(lb);
    lb.appendChild(el("span","uf-rot","Buscar"));
    var inp=el("input");inp.type="search";inp.className="idx-b";
    inp.placeholder="nome do indicador ou unidade";
    lb.appendChild(inp);
    var cn2=el("span","idx-cnt");lb.appendChild(cn2);
    var lim=el("button","zap","Limpar");lim.type="button";lim.style.marginLeft="10px";
    lim.addEventListener("click",function(){
      SOBSEL.length=0;SOBCAT.length=0;SOBTIP.length=0;inp.value="";render();});
    lb.appendChild(lim);

    var dd=document.createElement("details");dd.className="idx-dd sob-dd";
    var dsm=document.createElement("summary");
    dsm.appendChild(el("span","idx-dd-r","Indicadores"));
    var dv=el("span","idx-dd-v");dsm.appendChild(dv);
    dd.appendChild(dsm);
    var lc=el("div","idx-dd-c");dd.appendChild(lc);
    cx.appendChild(dd);
    inp.addEventListener("input",function(){dd.open=true;render();});

    var chips=el("div","sob-chips");cx.appendChild(chips);
    var modos=el("div","uf-linha");cx.appendChild(modos);
    var lg=el("div","leg-ig");cx.appendChild(lg);
    var pl=el("div","ig-plot");cx.appendChild(pl);
    var nota=el("p","sob-n");cx.appendChild(nota);
    var acoes=el("div","ig-acoes");cx.appendChild(acoes);

    /* ---------- sugestões prontas ----------
       Bolhas que montam uma comparação de uma vez: marcam os indicadores e
       ajustam Categoria e Tema para o recorte deles. A bolha só fica acesa
       enquanto a escolha for exatamente a da sugestão — tirou ou pôs um
       indicador, ou mexeu em categoria ou tema, ela apaga sozinha, porque o
       gráfico deixou de ser aquela comparação.
       PARA INCLUIR UMA SUGESTÃO: acrescente uma linha em SOB_SUG com o rótulo
       em PT e EN e a chave de cada indicador (a chave é "id da série§título",
       uma para a página em português e outra para a página em inglês). */
    var SOB_SUG=[
      {pt:"Salário mínimo × inflação",en:"Minimum wage × inflation",k:[
        ["salario_minimo_reajuste§Reajuste anual do salário mínimo","salario_minimo_reajuste§Annual minimum wage increase"],
        ["inpc§INPC — inflação das famílias de 1 a 5 salários mínimos","inpc§INPC — inflation for families earning 1 to 5 minimum wages"]]},
      {pt:"Inflação e juros",en:"Inflation and interest rates",k:[
        ["ipca§IPCA","ipca§IPCA"],
        ["ipca_alimentos§IPCA — grupo Alimentação e bebidas","ipca_alimentos§IPCA — food and beverages group"],
        ["selic§Taxa Selic Meta","selic§Selic target rate"]]},
      {pt:"Câmbio × inflação",en:"Exchange rate × inflation",k:[
        ["cambio§Taxa de Câmbio R$/US$","cambio§Exchange Rate R$/US$"],
        ["ipca§IPCA","ipca§IPCA"]]},
      {pt:"PIB: Brasil × mundo",en:"GDP: Brazil × world",k:[
        ["pib§Produto Interno Bruto","pib§Gross Domestic Product"],
        ["pib_mundo§Crescimento do PIB mundial","pib_mundo§World GDP growth"]]},
      {pt:"Desemprego e subutilização",en:"Unemployment and underutilisation",k:[
        ["desemprego_pme§Taxa de desemprego — PME (Pesquisa Mensal de Emprego)","desemprego_pme§Unemployment rate — PME (Pesquisa Mensal de Emprego)"],
        ["desemprego_pnad§Taxa de desocupação — PNAD Contínua","desemprego_pnad§Unemployment rate — PNAD Contínua"],
        ["subutilizacao§Taxa composta de subutilização da força de trabalho","subutilizacao§Composite rate of labor underutilisation"],
        ["desalento§Pessoas desalentadas","desalento§Discouraged workers"]]},
      {pt:"Dívida pública",en:"Public debt",k:[
        ["divida_antiga§Dívida bruta — metodologia anterior a 2008","divida_antiga§Gross debt — methodology prior to 2008"],
        ["divida§Dívida Bruta do Governo Geral","divida§General Government Gross Debt"],
        ["divida_liquida§Dívida líquida do setor público","divida_liquida§Net public sector debt"]]},
      {pt:"Arrecadação e carga tributária",en:"Revenue and tax burden",k:[
        ["arrecadacao_real§Arrecadação federal, a preços de dezembro de 2025","arrecadacao_real§Federal revenue, in December 2025 prices"],
        ["carga_tributaria§Carga tributária bruta","carga_tributaria§Gross tax burden"]]},
      {pt:"Transferência de renda",en:"Income transfers",k:[
        ["bolsa_familia§Famílias beneficiárias","bolsa_familia§Beneficiary families"],
        ["bpc§Benefício de Prestação Continuada (BPC/LOAS) — beneficiários","bpc§Benefício de Prestação Continuada (BPC/LOAS) — beneficiaries"]]},
      {pt:"Desmatamento por bioma",en:"Deforestation by biome",k:[
        ["desmatamento§Amazônia","desmatamento§Amazônia"],["desmatamento§Cerrado","desmatamento§Cerrado"],
        ["desmatamento§Mata Atlântica","desmatamento§Mata Atlântica"],["desmatamento§Pantanal","desmatamento§Pantanal"]]},
      {pt:"Ideb por etapa",en:"Ideb by stage",k:[
        ["ideb§Anos iniciais do fundamental","ideb§Early years of elementary school"],
        ["ideb§Anos finais do fundamental","ideb§Final years of elementary school"],
        ["ideb§Ensino médio","ideb§High school"]]},
      {pt:"Homicídios: taxa × total",en:"Homicides: rate × total",k:[
        ["homicidios§Taxa de homicídios — Brasil","homicidios§Homicide rate — Brazil"],
        ["mortes_causa§Agressões (homicídios)","mortes_causa§Assaults (homicides)"]]},
      {pt:"Doenças crônicas que mais matam",en:"Leading chronic causes of death",k:[
        ["mortes_causa§Doenças isquêmicas do coração (inclui infarto)","mortes_causa§Ischaemic heart disease (includes heart attack)"],
        ["mortes_causa§Doenças cerebrovasculares (AVC)","mortes_causa§Cerebrovascular disease (stroke)"],
        ["mortes_causa§Diabetes mellitus","mortes_causa§Diabetes mellitus"],
        ["mortes_causa§Câncer de traqueia, brônquios e pulmões","mortes_causa§Cancer of the trachea, bronchi and lungs"]]}
    ];
    function sugChaves(s){
      return s.k.map(function(p){return ENUS?p[1]:p[0];}).filter(function(k){return !!MAPA[k];});}
    /* só oferece a sugestão se ao menos dois indicadores dela existem nesta
       página — uma série renomeada não pode deixar uma bolha que não faz nada */
    var SUG_OK=SOB_SUG.filter(function(s){return sugChaves(s).length>=2;});
    function mesmoConjunto(a,b){
      if(a.length!==b.length)return false;
      for(var i=0;i<a.length;i++) if(b.indexOf(a[i])<0)return false;
      return true;}
    function sugRecorte(s){
      var ks=sugChaves(s),cs=[],ts=[];
      ks.forEach(function(k){var c=MAPA[k];
        if(cs.indexOf(c.cat)<0)cs.push(c.cat);
        if(ts.indexOf(c.tip)<0)ts.push(c.tip);});
      return {ks:ks,cs:cs,ts:ts};}
    function sugAtiva(s){
      var r=sugRecorte(s);
      return mesmoConjunto(SOBSEL,r.ks)&&mesmoConjunto(SOBCAT,r.cs)&&mesmoConjunto(SOBTIP,r.ts);}
    function pintaSug(){
      hSug.textContent="";
      if(!SUG_OK.length)return;
      hSug.appendChild(el("span","uf-rot",TR("Sugestões prontas")));
      SUG_OK.forEach(function(s){
        var on=sugAtiva(s);
        var b=el("button","chip-cat sob-sg"+(on?" on":""),ENUS?s.en:s.pt);b.type="button";
        b.setAttribute("aria-pressed",on?"true":"false");
        b.title=sugChaves(s).map(function(k){return MAPA[k].rot;}).join(" · ");
        b.addEventListener("click",function(){
          SOBSEL.length=0;SOBCAT.length=0;SOBTIP.length=0;inp.value="";
          if(!on){
            var r=sugRecorte(s);
            r.ks.forEach(function(k){SOBSEL.push(k);});
            r.cs.forEach(function(c){SOBCAT.push(c);});
            r.ts.forEach(function(t){SOBTIP.push(t);});
            SOBMODO="auto";}
          render();
          /* o gráfico vem logo abaixo dos filtros: leva a pessoa até ele */
          if(!on&&pl.scrollIntoView){try{pl.scrollIntoView({behavior:"smooth",block:"nearest"});}catch(e){}}
        });
        hSug.appendChild(b);});
    }

    function render(){
      ddMulti(hCat,"cat","Categoria",cats,SOBCAT);
      var tips=tiposDe(SOBCAT);
      for(var z=SOBTIP.length-1;z>=0;z--) if(tips.indexOf(SOBTIP[z])<0) SOBTIP.splice(z,1);
      if(tips.length>1){hTip.style.display="";ddMulti(hTip,"tip","Tema",tips,SOBTIP);}
      else {hTip.style.display="none";hTip.textContent="";}
      pintaSug();

      var q=sobx(inp.value.trim());
      var vis=CAT.filter(function(c){
        if(SOBCAT.length&&SOBCAT.indexOf(c.cat)<0)return false;
        if(SOBTIP.length&&SOBTIP.indexOf(c.tip)<0)return false;
        return !q||c.busca.indexOf(q)>=0;});
      lc.textContent="";
      if(!vis.length) lc.appendChild(el("p","gl-vazio","Nenhum indicador neste recorte."));
      vis.forEach(function(c){
        var on=SOBSEL.indexOf(c.k)>=0;
        var lab=el("label","idx-dd-i");
        var ip=document.createElement("input");ip.type="checkbox";ip.checked=on;
        if(!on&&SOBSEL.length>=6)ip.disabled=true;
        ip.addEventListener("change",function(){
          var j=SOBSEL.indexOf(c.k);
          if(j>=0)SOBSEL.splice(j,1);
          else if(SOBSEL.length<6)SOBSEL.push(c.k);
          render();});
        lab.appendChild(ip);
        /* nome em cima, categoria e tema embaixo: sem isso "Amazônia" ou
           "Total" não dizem de que assunto são */
        var txt=el("span","sob-it");
        txt.appendChild(el("span","sob-nm",c.rot));
        txt.appendChild(el("span","sob-mt",c.cat+" · "+c.tip));
        lab.appendChild(txt);
        lab.appendChild(el("span","sob-u",c.uni));
        lc.appendChild(lab);});
      cn2.textContent=vis.length+TR("sob-de")+CAT.length;
      dv.textContent=SOBSEL.length?(SOBSEL.length+TR("sob-de6")):TR("sob-nada");
      cnt.textContent=SOBSEL.length?(SOBSEL.length+TR("sob-de6")):TR("sob-cta");

      var sel=SOBSEL.map(function(k){return MAPA[k];}).filter(Boolean);
      /* dois indicadores podem ter o mesmo nome curto (“Amazônia” em dois
         levantamentos): aí o nome longo volta, só para esses. */
      var conta={};sel.forEach(function(c){conta[c.cur]=(conta[c.cur]||0)+1;});
      sel.forEach(function(c){c.nome=(conta[c.cur]>1)?c.rot:c.cur;});
      chips.textContent="";modos.textContent="";lg.textContent="";
      pl.textContent="";nota.textContent="";acoes.textContent="";
      sel.forEach(function(c,i){
        var b=el("button","chip-cat on");b.type="button";
        var sw=el("i","sob-sw");sw.style.background=PAL[i%PAL.length];
        b.appendChild(sw);
        b.appendChild(document.createTextNode(c.nome+"  ×"));
        b.title=TR("sob-tirar");
        b.addEventListener("click",function(){
          var j=SOBSEL.indexOf(c.k);if(j>=0)SOBSEL.splice(j,1);render();});
        chips.appendChild(b);});

      if(sel.length<2){
        pl.appendChild(el("p","gl-vazio","Escolha pelo menos dois indicadores para ver a sobreposição."));
        return;}

      var unis={};sel.forEach(function(c){unis[c.uni]=1;});
      var nUni=Object.keys(unis).length;
      var picos=sel.map(function(c){var m=0;c.pts.forEach(function(p){var a=Math.abs(p.v);if(a>m)m=a;});return m||1;});
      var razao=Math.max.apply(null,picos)/Math.min.apply(null,picos);
      /* eixo comum só vale com a MESMA unidade e ordens de grandeza próximas:
         fora disso a série menor vira uma reta colada no zero */
      /* unidades escritas de formas diferentes podem ser a mesma régua: "%
         da força de trabalho" e "% ao ano" medem coisas distintas, mas ambas
         em pontos percentuais, e um eixo em % as comporta sem distorcer. O que
         o eixo não resolve — que uma é desemprego e a outra inflação — fica
         dito na legenda e na ressalva abaixo do gráfico. */
      var todasPct=sel.every(function(c){var u=c.uni||"";return u.indexOf("%")>=0&&u.length<=60;});
      var podeValor=(nUni===1||todasPct)&&(razao<=25);
      var bx=-Infinity;sel.forEach(function(c){if(c.pts[0].x>bx)bx=c.pts[0].x;});
      var bases=sel.map(function(c){
        for(var i=0;i<c.pts.length;i++) if(c.pts[i].x>=bx-1e-9) return c.pts[i].v;
        return null;});
      var podeIndice=bases.every(function(b){return b!==null&&b>0;});
      /* índice de base 100 exige base positiva, e algumas séries são negativas
         justamente no ano de base (lucro de estatais, resultado primário). Sem
         uma terceira régua, essa combinação ficaria só com o eixo único que o
         próprio site desaconselha. A faixa 0–100 recoloca cada série entre o
         menor e o maior valor que ela própria teve: compara o desenho, nunca o
         nível, e funciona com valor negativo. */
      var faixas=sel.map(function(c){
        var lo=Infinity,hi=-Infinity;
        c.pts.forEach(function(p){if(p.v<lo)lo=p.v;if(p.v>hi)hi=p.v;});
        return [lo,hi];});
      var podeFaixa=faixas.every(function(f){return f[1]>f[0];});
      var modo=SOBMODO;
      if(modo==="valor"&&!podeValor)modo="auto";
      if(modo==="indice"&&!podeIndice)modo="auto";
      if(modo==="faixa"&&!podeFaixa)modo="auto";
      if(modo==="auto")modo=podeValor?"valor":(podeIndice?"indice":(podeFaixa?"faixa":"valor"));

      modos.appendChild(el("span","uf-rot","Escala"));
      [["valor",TR("sob-m-valor"),podeValor,TR("sob-m-valor-no")],
       ["indice",TR("sob-m-indice"),podeIndice,TR("sob-m-indice-no")],
       ["faixa",TR("sob-m-faixa"),podeFaixa,TR("sob-m-faixa-no")]].forEach(function(o){
        var b=el("button","chip-cat"+(modo===o[0]?" on":""),o[1]);b.type="button";
        b.setAttribute("aria-pressed",modo===o[0]?"true":"false");
        if(!o[2]){b.disabled=true;b.title=o[3];}
        else b.addEventListener("click",function(){SOBMODO=o[0];render();});
        modos.appendChild(b);});

      var anoB=Math.floor(bx), uniIdx=TR("sob-uni")+anoB+")";
      var ser;
      if(modo==="faixa"){
        ser=sel.map(function(c,i){
          var lo=faixas[i][0], amp=faixas[i][1]-faixas[i][0];
          return {titulo:c.nome,unidade:TR("sob-uni-faixa"),cor:PAL[i%PAL.length],
                  pontos:c.pts.map(function(p){
                    return {x:p.x,anual:p.anual,v:(p.v-lo)/amp*100,tipo:p.tipo,ano:p.ano};})};});
      } else if(modo==="indice"){
        ser=sel.map(function(c,i){
          return {titulo:c.nome,unidade:uniIdx,cor:PAL[i%PAL.length],
                  pontos:c.pts.filter(function(p){return p.x>=bx-1e-9;}).map(function(p){
                    return {x:p.x,anual:p.anual,v:p.v/bases[i]*100,tipo:p.tipo,ano:p.ano};})};});
      } else {
        ser=sel.map(function(c,i){
          return {titulo:c.nome,unidade:c.uni,cor:PAL[i%PAL.length],pontos:c.pts.slice()};});
      }

      /* algumas séries trazem a unidade escrita como frase inteira (“% … ou
         anos …”): no topo da legenda ela vira um parágrafo. Nesse caso a unidade
         volta para o nome de cada série, onde é lida em contexto. */
      var uniUnica=Object.keys(unis)[0]||"";
      function uniCurta(u){u=String(u||"");
        return u.length>46?(u.slice(0,44).replace(/[\s—,(-]+$/,"")+"…"):u;}
      var umaU=(modo==="indice")||(modo==="faixa")||(nUni===1&&uniUnica.length<=60);
      if(umaU) lg.appendChild(el("span","uni-so",modo==="indice"?uniIdx:(modo==="faixa"?TR("sob-uni-faixa"):uniUnica)));
      ser.forEach(function(s){
        var sp=el("span");var ic=el("i");ic.style.background=s.cor;
        sp.appendChild(ic);
        sp.appendChild(document.createTextNode(umaU?s.titulo:(s.titulo+" ("+uniCurta(s.unidade)+")")));
        lg.appendChild(sp);});

      var r=desenha({forma:"linha",titulo:TR("sob-tit"),direta:ser,zero:false});
      pl.appendChild(r.svg);

      if(modo==="faixa") nota.textContent=TR("sob-nt-faixa");
      else if(modo==="indice") nota.textContent=TR("sob-nt-idx-1")+anoB+TR("sob-nt-idx-2");
      else if(nUni>1) nota.textContent=TR("sob-nt-uni");
      else if(razao>25) nota.textContent=TR("sob-nt-esc-1")+Math.round(razao)+TR("sob-nt-esc-2");
      else nota.textContent=TR("sob-nt-ok");

      var nomes=sel.map(function(c){return c.nome;}).join("  ·  ");
      var fontes=[];sel.forEach(function(c){if(c.org&&fontes.indexOf(c.org)<0)fontes.push(c.org);});
      /* a imagem circula sozinha no WhatsApp: a ressalva de escala tem de ir
         junto, ou a sobreposição viaja sem o aviso que a torna legível */
      var rod=rodapePadrao((nota.textContent?nota.textContent+" · ":"")+fontes.join(" · "));

      acoes.appendChild(btnBase("Dados em CSV","Baixa as séries sobrepostas em CSV (abre no Excel)",function(){
        var xs={};sel.forEach(function(c){c.pts.forEach(function(p){xs[p.x]=1;});});
        var ord=Object.keys(xs).map(Number).sort(function(a,b){return a-b;});
        var L=[[TR("sob-col")].concat(sel.map(function(c){return c.rot+(c.uni?" ("+c.uni+")":"");}))];
        ord.forEach(function(x){
          var lin=[String(x)];
          sel.forEach(function(c){var v="";
            for(var i=0;i<c.pts.length;i++) if(c.pts[i].x===x){v=String(c.pts[i].v);break;}
            lin.push(v);});
          L.push(lin);});
        baixaCSV("sobreposicao.csv",L);}));
      acoes.appendChild(btnBase("Imagem PNG","Baixa a sobreposição como imagem, com título, fonte e data",function(){
        pngDeSVG(r.svg,{nome:"sobreposicao.png",titulo:TR("sob-tit"),sub:nomes,
          rodape:rod,legenda:legendaDe(box)});}));
      acoes.insertBefore(window.DL.btnCompartilhar(function(){
        window.DL.compartilhaSVG(r.svg,{nome:"sobreposicao",titulo:TR("sob-tit"),sub:nomes,
          rodape:rod,legenda:legendaDe(box),
          link:location.href.split("#")[0]+"#g-sobrepor"});}),acoes.firstChild);
      acoes.appendChild(avisoTela());
    }
    render();
    return box;
  }

  /* ---------- comparar marcos: vários radares e leitura por dimensão ----------
     O infográfico "Alcance dos marcos" põe dois marcos lado a lado. Aqui o
     leitor põe até seis no mesmo radar, vê de que governo veio cada um e pode
     virar a pergunta: escolher UMA dimensão e ver todos os marcos — e os
     governos — nela. Continua medindo ALCANCE (o tamanho da mudança que o texto
     do ato faz), nunca se a mudança foi boa. Nada aqui soma, pondera ou
     ranqueia governos: a tabela por governo só conta o que está na coleção. */
  var CMSEL=null, CMMODO="radar", CMGOV=[], CMDIM=null, CMCOR="marco", CMZERO=false, CMABRE={};
  var CM_MAX=6;
  var CM_TRACO=["","7 5","2 4","10 4 2 4","4 3","12 5"];
  var CM_GOVCOR=["var(--s700)","var(--warn)","var(--prop)","var(--muted)","var(--s400)","var(--neg)","var(--muted)","var(--c5)"];
  function cmSinalCls(s){return "mr-sn sn"+(s==="+"?"p":(s==="-"?"n":(s==="="?"e":"d")));}
  function cmN(m,id){var o=m.dim&&m.dim[id];return (o&&typeof o.n==="number")?o.n:0;}

  /* ---------- "i" das dimensões: um toque abre a explicação ---------- */
  function abreInfo(titulo,partes){
    var d=document.getElementById("cm-info");
    if(!d){d=document.createElement("div");d.className="cfg";d.id="cm-info";d.hidden=true;
      var h=el("div","cfg-h");h.appendChild(el("h3"));var x=el("button","cfg-x","×");x.type="button";
      x.setAttribute("aria-label",TR("Fechar"));h.appendChild(x);d.appendChild(h);d.appendChild(el("div","cfg-b"));
      document.body.appendChild(d);
      x.addEventListener("click",function(){EJ.fecha(d);});}
    d.querySelector("h3").textContent=titulo;
    var c=d.querySelector(".cfg-b");c.textContent="";
    partes.forEach(function(p){
      if(typeof p==="string")c.appendChild(el("p","sb-p",p));
      else{var q=el("p","sb-p");q.appendChild(el("b",null,p[0]+" "));q.appendChild(document.createTextNode(p[1]));c.appendChild(q);}});
    EJ.abre(d);
  }
  function dimInfo(d){
    var b=el("button","i","i");b.type="button";
    b.setAttribute("aria-label",TR("O que mede")+": "+d.rot);b.title=b.getAttribute("aria-label");
    b.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();
      var C=critMl()||{}, P=[d.des];
      P.push(TR("cm-info-escala"));
      (C.escala||[]).forEach(function(x){P.push([x.n+" · "+x.rot+" —",x.des]);});
      var cb=(C.cobre||[]).filter(function(o){return o.id===d.id;})[0];
      if(cb){P.push([TR("Conta:"),cb.conta]);P.push([TR("Não conta:"),cb.nao_conta]);}
      abreInfo(d.rot,P);});
    return b;
  }
  /* ---------- leitura automática da comparação ----------
     Frases montadas só com o que está na tabela: onde cada marco mexe mais,
     onde todos coincidem, onde diferem mais e onde o sentido se opõe. Não diz
     qual é melhor — o radar mede alcance, não qualidade. */
  function cmExplica(S,D){
    var box=el("div","card pad cm-ins cm-exp");
    box.appendChild(el("h4",null,TR("Leitura automática desta comparação")));
    var ul=el("ul");
    function n(m,d){return cmN(m,d.id);}
    function nome(m){return rotMl(m)+(m.governo?" ("+m.governo+")":"");}
    function lista(a){return a.length<2?a.join(""):a.slice(0,-1).join(", ")+" "+TR("e")+" "+a[a.length-1];}
    S.forEach(function(m){
      var mx=Math.max.apply(null,D.map(function(d){return n(m,d);}));
      if(mx<1){ul.appendChild(el("li",null,nome(m)+": "+TR("cm-x-nada")));return;}
      var top=D.filter(function(d){return n(m,d)===mx;}).map(function(d){return d.rot;});
      ul.appendChild(el("li",null,nome(m)+" "+TR("cm-x-mais")+" "+lista(top)+" ("+mx+" · "+nivelRot(mx)+")."));});
    if(S.length>1){
      var todos=D.filter(function(d){return S.every(function(m){return n(m,d)>=2;});}).map(function(d){return d.rot;});
      if(todos.length)ul.appendChild(el("li",null,TR("cm-x-todos")+" "+lista(todos)+"."));
      var nenhum=D.filter(function(d){return S.every(function(m){return n(m,d)===0;});}).map(function(d){return d.rot;});
      if(nenhum.length)ul.appendChild(el("li",null,TR("cm-x-nenhum")+" "+lista(nenhum)+"."));
      var dif=D.map(function(d){var v=S.map(function(m){return n(m,d);});return {d:d,a:Math.max.apply(null,v)-Math.min.apply(null,v),v:v};})
        .sort(function(a,b){return b.a-a.a;})[0];
      if(dif&&dif.a>=2){
        var hi=S.filter(function(m){return n(m,dif.d)===Math.max.apply(null,dif.v);}).map(rotMl);
        var lo=S.filter(function(m){return n(m,dif.d)===Math.min.apply(null,dif.v);}).map(rotMl);
        ul.appendChild(el("li",null,TR("cm-x-dif")+" "+dif.d.rot+": "+Math.max.apply(null,dif.v)+" ("+lista(hi)+") "+TR("contra")+" "+Math.min.apply(null,dif.v)+" ("+lista(lo)+")."));}
      D.forEach(function(d){
        var amp=S.filter(function(m){var o=m.dim&&m.dim[d.id];return o&&o.n>0&&o.s==="+";}),
            res=S.filter(function(m){var o=m.dim&&m.dim[d.id];return o&&o.n>0&&o.s==="-";});
        if(amp.length&&res.length)ul.appendChild(el("li",null,TR("cm-x-oposto-1")+" "+d.rot+", "+TR("cm-x-oposto-2")+" "+
          lista(amp.map(rotMl))+" "+TR("ampliam")+"; "+lista(res.map(rotMl))+" "+TR("restringem")+"."));});
    }
    box.appendChild(ul);
    box.appendChild(el("p","pz-nota",TR("cm-x-ressalva")));
    return box;
  }
  /* radar genérico: itens {k, cor, vals[0..3], tip(i,v)} — serve aos marcos e aos governos */
  function radarSVG(itens,rotulo){
    var D=dimensoes();
    var W=760,H=470,R=162,FOLGA=32,CORTE=17,RENDA=true;
    if(estreito){W=392;H=318;R=86;FOLGA=17;CORTE=13;RENDA=false;}
    var CX=W/2,CY=H/2,TOPO=3;
    var svg=svgEl("svg",{viewBox:"0 0 "+W+" "+H,role:"img"});
    svg.setAttribute("aria-label",rotulo||"");
    var ang=function(i){return -Math.PI/2+i*2*Math.PI/D.length;};
    var px=function(i,v){return CX+Math.cos(ang(i))*R*(v/TOPO);};
    var py=function(i,v){return CY+Math.sin(ang(i))*R*(v/TOPO);};
    [1,2,3].forEach(function(v){
      var pts=[];for(var i=0;i<D.length;i++)pts.push(px(i,v)+","+py(i,v));
      svg.appendChild(svgEl("polygon",{points:pts.join(" "),fill:"none",stroke:"var(--line)","stroke-width":1}));
      if(RENDA){var t=svgEl("text",{x:CX+4,y:py(0,v)+4,"class":"ax"});t.textContent=String(v);svg.appendChild(t);}});
    for(var i0=0;i0<D.length;i0++)
      svg.appendChild(svgEl("line",{x1:CX,y1:CY,x2:px(i0,TOPO),y2:py(i0,TOPO),stroke:"var(--line)","stroke-width":1}));
    itens.forEach(function(it,q){
      var k=it.k, cor=it.cor, vals=it.vals;
      var pts=[];for(var i=0;i<D.length;i++)pts.push(px(i,vals[i])+","+py(i,vals[i]));
      svg.appendChild(svgEl("polygon",{points:pts.join(" "),fill:cor,"fill-opacity":itens.length>2?".05":".09",
        stroke:cor,"stroke-width":2.2,"stroke-dasharray":CM_TRACO[k%CM_TRACO.length],"stroke-linejoin":"round"}));
      /* marcadores que coincidem num eixo ganham um pequeno deslocamento lateral */
      vals.forEach(function(v,i){
        var desl=(q-(itens.length-1)/2)*(estreito?3:4), a=ang(i)+Math.PI/2;
        var x=px(i,v)+Math.cos(a)*desl, y=py(i,v)+Math.sin(a)*desl;
        var g=svgEl("g",{});g.appendChild(cmForma(k,x,y,cor,estreito?3.6:4.6));
        comTip(g,it.tip(i,v));svg.appendChild(g);});});
    D.forEach(function(x,i){
      var a=ang(i), rx=CX+Math.cos(a)*(R+FOLGA), ry=CY+Math.sin(a)*(R+FOLGA*0.78);
      var anc=Math.cos(a)>0.25?"start":(Math.cos(a)<-0.25?"end":"middle");
      var pal=String(x.rot).split(" "), l1=[], l2=[];
      pal.forEach(function(w){(l1.join(" ").length+w.length<=CORTE?l1:l2).push(w);});
      var g=svgEl("g",{});
      var t1=svgEl("text",{x:rx,y:ry+(l2.length?-4:4),"text-anchor":anc,"class":"pz-eixo"});
      t1.textContent=l1.join(" ");g.appendChild(t1);
      if(l2.length){var t2=svgEl("text",{x:rx,y:ry+12,"text-anchor":anc,"class":"pz-eixo"});
        t2.textContent=l2.join(" ");g.appendChild(t2);}
      comTip(g,x.rot+" — "+x.des);svg.appendChild(g);});
    var env=el("div","ig-plot pz-plot");env.style.padding="0";env.appendChild(svg);
    return env;
  }
  function cmForma(k,x,y,cor,r){
    var f=k%4;
    if(f===0) return svgEl("circle",{cx:x,cy:y,r:r,fill:cor,stroke:"var(--surface)","stroke-width":1.5});
    if(f===1) return svgEl("rect",{x:x-r,y:y-r,width:2*r,height:2*r,fill:cor,stroke:"var(--surface)","stroke-width":1.5});
    if(f===2) return svgEl("polygon",{points:x+","+(y-r-1)+" "+(x+r+1)+","+(y+r)+" "+(x-r-1)+","+(y+r),
      fill:cor,stroke:"var(--surface)","stroke-width":1.5});
    return svgEl("polygon",{points:x+","+(y-r-1)+" "+(x+r+1)+","+y+" "+x+","+(y+r+1)+" "+(x-r-1)+","+y,
      fill:cor,stroke:"var(--surface)","stroke-width":1.5});
  }

  function comparaMarcos(){
    var D=dimensoes(), M=marcosComDim();
    var box=el("div","ig sob cm");box.id="g-marcos-comp";box.style.scrollMarginTop="64px";
    box.style.marginBottom="22px";
    if(!D.length||!M.length) return box;
    /* ordem do tempo: é a ordem em que os governos se sucederam */
    M=M.slice().sort(function(a,b){return String(a.data_sancao).localeCompare(String(b.data_sancao));});
    var GOVS=[];M.forEach(function(m){var g=m.governo||"—";if(GOVS.indexOf(g)<0)GOVS.push(g);});
    function corGov(g){var i=GOVS.indexOf(g);return CM_GOVCOR[(i<0?0:i)%CM_GOVCOR.length];}
    if(CMSEL===null) CMSEL=[M[M.length-1],M[0]].filter(Boolean).map(function(m){return M.indexOf(m);})
      .filter(function(v,i,a){return a.indexOf(v)===i;});
    if(!CMDIM) CMDIM=D[0].id;

    var det=document.createElement("details");det.className="sob-d";
    if((location.hash||"").slice(1)==="g-marcos-comp")det.open=true;
    var sm=document.createElement("summary");
    sm.appendChild(el("span","sob-r",TR("Comparar")));
    sm.appendChild(el("b","sob-t",TR("Impacto estimado de marcos regulatórios")));
    var cnt=el("span","sob-v");sm.appendChild(cnt);
    det.appendChild(sm);box.appendChild(det);
    var cx=el("div","sob-c");det.appendChild(cx);
    cx.appendChild(el("p","sob-p",TR("cm-intro")));

    var hSug=el("div","uf-linha sob-sug"),hModo=el("div","uf-linha"),hGov=el("div","uf-linha cm-govs"),corpo=el("div");
    cx.appendChild(hSug);cx.appendChild(hModo);cx.appendChild(hGov);cx.appendChild(corpo);

    /* ---- sugestões prontas ----
       Cada uma junta marcos de governos diferentes que mexem na mesma engrenagem
       da economia. Os marcos são achados pela data de sanção, que não muda com o
       idioma. A bolha fica acesa só enquanto a seleção for exatamente a dela.
       PARA INCLUIR UMA SUGESTÃO: acrescente uma linha em CM_SUG com o rótulo em
       PT e EN e as datas de sanção (aaaa-mm-dd) dos marcos. */
    var CM_SUG=[
      {pt:"Contas públicas e arrecadação",en:"Public finances and revenue",
       d:["2000-05-04","2020-04-14","2023-09-20","2023-12-29"]},
      {pt:"Investimento em infraestrutura",en:"Infrastructure investment",
       d:["2004-12-30","2020-07-15","2021-04-08","2025-11-24"]},
      {pt:"Ambiente de negócios",en:"Business environment",
       d:["2016-06-30","2017-07-13","2019-09-20","2023-10-30"]},
      {pt:"Liberdades individuais",en:"Individual liberties",
       d:["2011-09-12","2014-04-23","2018-08-14","2026-05-20"]}
    ];
    /* por que cada sugestão junta esses marcos: aparece no "i" e embaixo das bolhas */
    var CM_POR={
      "Contas públicas e arrecadação":["cm-por-fiscal"],
      "Investimento em infraestrutura":["cm-por-infra"],
      "Ambiente de negócios":["cm-por-negocios"],
      "Liberdades individuais":["cm-por-liberdades"]};
    function sugIdx(s){
      var r=[];s.d.forEach(function(dt){
        M.forEach(function(m,i){if(m.data_sancao===dt&&r.indexOf(i)<0)r.push(i);});});
      return r.slice(0,CM_MAX);}
    function sugOn(s){
      var r=sugIdx(s);
      if(CMMODO!=="radar"||CMGOV.length||r.length!==CMSEL.length)return false;
      return r.every(function(i){return CMSEL.indexOf(i)>=0;});}
    function pintaSug(){
      hSug.textContent="";
      var ok=CM_SUG.filter(function(s){return sugIdx(s).length>=2;});
      if(!ok.length)return;
      hSug.appendChild(el("span","uf-rot",TR("Sugestões prontas")));
      var bi=el("button","i","i");bi.type="button";bi.setAttribute("aria-label",TR("Como as sugestões foram montadas"));
      bi.title=bi.getAttribute("aria-label");
      bi.addEventListener("click",function(){
        abreInfo(TR("Como as sugestões foram montadas"),[TR("cm-por-intro")].concat(ok.map(function(s){
          return [(ENUS?s.en:s.pt)+" —",TR(CM_POR[s.pt][0])+" "+sugIdx(s).map(function(i){return rotMl(M[i])+" ("+(M[i].governo||"—")+")";}).join("; ")+"."];})));});
      hSug.appendChild(bi);
      var ativa=null;
      ok.forEach(function(s){
        var on=sugOn(s);if(on)ativa=s;
        var b=el("button","chip-cat sob-sg"+(on?" on":""),ENUS?s.en:s.pt);b.type="button";
        b.setAttribute("aria-pressed",on?"true":"false");
        b.title=sugIdx(s).map(function(i){return rotMl(M[i])+" ("+(M[i].governo||"—")+")";}).join(" · ");
        b.addEventListener("click",function(){
          CMSEL.length=0;
          if(!on){CMMODO="radar";CMGOV.length=0;sugIdx(s).forEach(function(i){CMSEL.push(i);});}
          pinta();
          if(!on){var a=corpo.querySelector(".pz-grade");
            if(a&&a.scrollIntoView){try{a.scrollIntoView({behavior:"smooth",block:"nearest"});}catch(e){}}}
        });
        hSug.appendChild(b);});
      if(ativa)hSug.appendChild(el("p","cm-sug-por",TR(CM_POR[ativa.pt][0])));
    }

    function visiveis(){return M.filter(function(m){return !CMGOV.length||CMGOV.indexOf(m.governo||"—")>=0;});}
    function selecionados(){return CMSEL.map(function(i){return M[i];}).filter(Boolean);}
    function selo(g){var b=el("span","cm-gov",g);b.style.setProperty("--gc",corGov(g));return b;}

    /* marcador da legenda: mesmo traço e mesma cor do radar, desenhados em
       miniatura, para a legenda funcionar também em impressão sem cor */
    function amostra(k,cor){
      var s=svgEl("svg",{viewBox:"0 0 28 12",width:28,height:12,"class":"cm-am","aria-hidden":"true"});
      s.appendChild(svgEl("line",{x1:1,y1:6,x2:27,y2:6,stroke:cor,"stroke-width":2.4,
        "stroke-dasharray":CM_TRACO[k%CM_TRACO.length]}));
      s.appendChild(forma(k,14,6,cor,4));
      return s;
    }
    function forma(k,x,y,cor,r){return cmForma(k,x,y,cor,r);
      var f=k%4;
      if(f===0) return svgEl("circle",{cx:x,cy:y,r:r,fill:cor,stroke:"var(--surface)","stroke-width":1.5});
      if(f===1) return svgEl("rect",{x:x-r,y:y-r,width:2*r,height:2*r,fill:cor,stroke:"var(--surface)","stroke-width":1.5});
      if(f===2) return svgEl("polygon",{points:x+","+(y-r-1)+" "+(x+r+1)+","+(y+r)+" "+(x-r-1)+","+(y+r),
        fill:cor,stroke:"var(--surface)","stroke-width":1.5});
      return svgEl("polygon",{points:x+","+(y-r-1)+" "+(x+r+1)+","+y+" "+x+","+(y+r+1)+" "+(x-r-1)+","+y,
        fill:cor,stroke:"var(--surface)","stroke-width":1.5});
    }
    function corDe(m,k){return CMCOR==="governo"?corGov(m.governo||"—"):PAL[k%PAL.length];}

    function pintaModo(){
      hModo.textContent="";
      hModo.appendChild(el("span","uf-rot",TR("Ver")));
      [["radar",TR("Radar de vários marcos")],["dim",TR("Por dimensão")],["gov",TR("Agregado por governo")]].forEach(function(o){
        var b=el("button","chip-cat"+(CMMODO===o[0]?" on":""),o[1]);b.type="button";
        b.setAttribute("aria-pressed",CMMODO===o[0]?"true":"false");
        b.addEventListener("click",function(){CMMODO=o[0];pinta();});
        hModo.appendChild(b);});
    }
    function pintaGov(){
      hGov.textContent="";
      hGov.appendChild(el("span","uf-rot",TR("Governo")));
      var bt=el("button","chip-cat"+(CMGOV.length?"":" on"),TR("Todos"));bt.type="button";
      bt.setAttribute("aria-pressed",CMGOV.length?"false":"true");
      bt.addEventListener("click",function(){CMGOV.length=0;pinta();});
      hGov.appendChild(bt);
      GOVS.forEach(function(g){
        var on=CMGOV.indexOf(g)>=0, n=M.filter(function(m){return (m.governo||"—")===g;}).length;
        var b=el("button","chip-cat cm-gchip"+(on?" on":""));b.type="button";
        b.style.setProperty("--gc",corGov(g));
        b.appendChild(el("i","cm-gdot"));
        b.appendChild(document.createTextNode(g+" · "+n));
        b.setAttribute("aria-pressed",on?"true":"false");
        b.addEventListener("click",function(){
          var i=CMGOV.indexOf(g);if(i>=0)CMGOV.splice(i,1);else CMGOV.push(g);pinta();});
        hGov.appendChild(b);});
    }

    /* ================= modo 1: radar com até seis marcos ================= */
    function modoRadar(){
      var ctl=el("div");corpo.appendChild(ctl);
      /* escolha dos marcos: lista agrupada por governo, respeitando o filtro */
      var dd=document.createElement("details");dd.className="idx-dd sob-dd";
      dd.open=!!CMABRE.m;dd.addEventListener("toggle",function(){CMABRE.m=dd.open;});
      var dsm=document.createElement("summary");
      dsm.appendChild(el("span","idx-dd-r",TR("Marcos")));
      dsm.appendChild(el("span","idx-dd-v",CMSEL.length+" "+TR("de")+" "+CM_MAX));
      dd.appendChild(dsm);
      var lc=el("div","idx-dd-c");dd.appendChild(lc);
      var vis=visiveis();
      GOVS.slice().reverse().forEach(function(g){
        var doG=vis.filter(function(m){return (m.governo||"—")===g;}).reverse();
        if(!doG.length)return;
        var cab=el("div","cm-grp");cab.appendChild(selo(g));lc.appendChild(cab);
        doG.forEach(function(m){
          var i=M.indexOf(m), on=CMSEL.indexOf(i)>=0;
          var lab=el("label","idx-dd-i");
          var ip=document.createElement("input");ip.type="checkbox";ip.checked=on;
          if(!on&&CMSEL.length>=CM_MAX)ip.disabled=true;
          ip.addEventListener("change",function(){
            var j=CMSEL.indexOf(i);
            if(j>=0)CMSEL.splice(j,1);else if(CMSEL.length<CM_MAX)CMSEL.push(i);
            pinta();});
          lab.appendChild(ip);
          var tx=el("span","sob-it");
          tx.appendChild(el("span","sob-nm",rotMl(m)));
          tx.appendChild(el("span","sob-mt",(m.area||"")+(m.numero_ato?" · "+m.numero_ato:"")));
          lab.appendChild(tx);lc.appendChild(lab);});});
      if(!vis.length) lc.appendChild(el("p","gl-vazio",TR("Nenhum marco neste recorte.")));
      ctl.appendChild(dd);

      var lin=el("div","uf-linha");lin.style.marginTop="10px";
      lin.appendChild(el("span","uf-rot",TR("Cor por")));
      [["marco",TR("marco")],["governo",TR("governo")]].forEach(function(o){
        var b=el("button","chip-cat"+(CMCOR===o[0]?" on":""),o[1]);b.type="button";
        b.setAttribute("aria-pressed",CMCOR===o[0]?"true":"false");
        b.addEventListener("click",function(){CMCOR=o[0];pinta();});
        lin.appendChild(b);});
      var lim=el("button","zap",TR("Limpar"));lim.type="button";lim.style.marginLeft="10px";
      lim.addEventListener("click",function(){CMSEL.length=0;pinta();});
      lin.appendChild(lim);
      ctl.appendChild(lin);

      var S=selecionados();
      cnt.textContent=S.length+" "+TR("marcos no radar");
      /* legenda: cada marco com o selo do governo que o sancionou */
      var chips=el("div","sob-chips");
      S.forEach(function(m,k){
        var b=el("button","chip-cat on cm-chip");b.type="button";
        b.appendChild(amostra(k,corDe(m,k)));
        b.appendChild(document.createTextNode(" "+rotMl(m)+" "));
        b.appendChild(selo(m.governo||"—"));
        b.appendChild(document.createTextNode("  ×"));
        b.title=TR("Tirar do radar");
        b.addEventListener("click",function(){
          var j=CMSEL.indexOf(M.indexOf(m));if(j>=0)CMSEL.splice(j,1);pinta();});
        chips.appendChild(b);});
      corpo.appendChild(chips);

      if(!S.length){corpo.appendChild(el("p","gl-vazio",TR("Escolha um ou mais marcos na lista acima.")));return;}

      var grade=el("div","pz-grade"+(S.length>3?" cm-empilha":"")),alvo=el("div"),tab=el("div");
      grade.appendChild(alvo);grade.appendChild(tab);corpo.appendChild(grade);

      /* ---- radar, escala fixa de 0 a 3 ---- */
      alvo.appendChild(radarSVG(S.map(function(m,k){
        return {k:k,cor:corDe(m,k),vals:D.map(function(d){return cmN(m,d.id);}),
          tip:function(i,v){var d=D[i],o=m.dim&&m.dim[d.id];
            return rotMl(m)+" ("+(m.governo||"—")+") — "+d.rot+": "+v+" · "+nivelRot(v)+(o&&o.s&&v?" · "+sinalRot(o.s):"");}};}),
        TR("cm-radar-alt")));

      /* ---- a mesma informação em tabela ---- */
      var w=el("div","tw"),t=document.createElement("table");t.className="pz-t mr-t cm-t";
      var th=document.createElement("thead"),hr=document.createElement("tr");
      var h0=el("th",null,TR("Dimensão"));h0.style.textAlign="left";h0.className="pz-est";hr.appendChild(h0);
      S.forEach(function(m,k){
        var h=el("th","cm-thc");h.style.textAlign="right";
        h.appendChild(amostra(k,corDe(m,k)));
        var nm=String(m.nome||""), cur=nm.length>46?nm.slice(0,44).replace(/[\s—,(:-]+$/,"")+"…":nm;
        var sp=el("span","cm-th",anoMl(m)+" · "+cur);sp.title=nm;h.appendChild(sp);
        h.appendChild(selo(m.governo||"—"));
        hr.appendChild(h);});
      th.appendChild(hr);t.appendChild(th);
      var tb=document.createElement("tbody");
      D.forEach(function(d){
        var tr=document.createElement("tr");var td0=el("td",null,d.rot+" ");td0.appendChild(dimInfo(d));tr.appendChild(td0);
        S.forEach(function(m){
          var o=m.dim&&m.dim[d.id], n=cmN(m,d.id);
          var td=el("td");td.style.textAlign="right";td.className="pz-num"+(n?" on":"");
          td.appendChild(el("b",null,String(n)));
          td.appendChild(el("span","mr-nv"," "+nivelRot(n)));
          if(o&&o.s&&n) td.appendChild(el("span",cmSinalCls(o.s),o.s+" "+sinalRot(o.s)));
          tr.appendChild(td);});
        tb.appendChild(tr);});
      t.appendChild(tb);w.appendChild(t);tab.appendChild(w);
      tab.appendChild(el("p","pz-nota",TR("cm-nota-radar")));
      corpo.appendChild(cmExplica(S,D));
    }

    /* ================= modo 3: agregado por governo =================
       Para cada governo, a média do alcance de todos os marcos dele na coleção,
       dimensão por dimensão, num radar só. É um resumo da COLEÇÃO, não do
       governo: com 2 a 12 marcos por mandato, um ato muda muito a média. */
    function modoGov(){
      var escolhidos=CMGOV.length?GOVS.filter(function(g){return CMGOV.indexOf(g)>=0;}):GOVS;
      cnt.textContent=escolhidos.length+" "+TR("governos no radar");
      var dados=escolhidos.map(function(g,k){
        var doG=M.filter(function(m){return (m.governo||"—")===g;});
        var med=D.map(function(d){return doG.reduce(function(a,m){return a+cmN(m,d.id);},0)/(doG.length||1);});
        return {g:g,n:doG.length,med:med,k:k};});
      var lg=el("div","sob-chips");
      dados.forEach(function(x){var b=el("span","chip-cat on cm-chip");b.appendChild(amostra(x.k,corGov(x.g)));
        b.appendChild(document.createTextNode(" "+x.g+" · "+x.n+" "+TR("marcos")));lg.appendChild(b);});
      corpo.appendChild(lg);
      var grade=el("div","pz-grade"+(dados.length>3?" cm-empilha":"")),alvo=el("div"),tab=el("div");grade.appendChild(alvo);grade.appendChild(tab);corpo.appendChild(grade);
      alvo.appendChild(radarSVG(dados.map(function(x){return {k:x.k,cor:corGov(x.g),vals:x.med,
        tip:function(i,v){return x.g+" — "+D[i].rot+": "+dec(v.toFixed(2))+" ("+TR("média de")+" "+x.n+" "+TR("marcos")+")";}};}),
        TR("cm-gov-alt")));
      var w=el("div","tw"),t=document.createElement("table");t.className="pz-t cm-t";
      var th=document.createElement("thead"),hr=document.createElement("tr");
      var h0=el("th",null,TR("Dimensão"));h0.style.textAlign="left";h0.className="pz-est";hr.appendChild(h0);
      dados.forEach(function(x){var h=el("th","cm-thc");h.style.textAlign="right";h.appendChild(amostra(x.k,corGov(x.g)));
        h.appendChild(el("span","cm-th",x.g));h.appendChild(el("span","cm-th mr-nv",x.n+" "+TR("marcos")));hr.appendChild(h);});
      th.appendChild(hr);t.appendChild(th);
      var tb=document.createElement("tbody");
      D.forEach(function(d,i){var tr=document.createElement("tr");var td0=el("td",null,d.rot+" ");td0.appendChild(dimInfo(d));tr.appendChild(td0);
        dados.forEach(function(x){var td=el("td","pz-num"+(x.med[i]?" on":""),dec(x.med[i].toFixed(2)));td.style.textAlign="right";tr.appendChild(td);});
        tb.appendChild(tr);});
      t.appendChild(tb);w.appendChild(t);tab.appendChild(w);
      tab.appendChild(el("p","pz-nota",TR("cm-gov-nota")));
    }

    /* ================= modo 2: uma dimensão, todos os marcos ================= */
    function modoDim(){
      var d=D.filter(function(x){return x.id===CMDIM;})[0]||D[0];
      var lin=el("div","uf-linha");
      lin.appendChild(el("span","uf-rot",TR("Dimensão")));
      D.forEach(function(x){
        var b=el("button","chip-cat"+(x.id===d.id?" on":""),x.rot);b.type="button";
        b.setAttribute("aria-pressed",x.id===d.id?"true":"false");
        comTip(b,x.des);
        b.addEventListener("click",function(){CMDIM=x.id;pinta();});
        lin.appendChild(b);});
      corpo.appendChild(lin);
      var pd=el("p","cm-des",d.des+" ");pd.appendChild(dimInfo(d));corpo.appendChild(pd);

      var vis=visiveis();
      var tocam=vis.filter(function(m){return cmN(m,d.id)>0;});
      var lz=el("div","uf-linha");
      var bz=el("button","chip-cat"+(CMZERO?" on":""),TR("Mostrar também os que não tocam (0)"));bz.type="button";
      bz.setAttribute("aria-pressed",CMZERO?"true":"false");
      bz.addEventListener("click",function(){CMZERO=!CMZERO;pinta();});
      lz.appendChild(bz);corpo.appendChild(lz);
      cnt.textContent=tocam.length+" "+TR("de")+" "+vis.length+" "+TR("marcos tocam")+" "+d.rot;

      /* ---- o que dá para dizer sem opinar: contagens, com a ressalva junto ---- */
      var ins=el("div","card pad cm-ins");
      ins.appendChild(el("h4",null,TR("Leitura desta dimensão")));
      var ul=el("ul");
      var red=vis.filter(function(m){return cmN(m,d.id)===3;});
      ul.appendChild(el("li",null,TR("cm-i-toca-1")+" "+tocam.length+" "+TR("de")+" "+vis.length+" "+TR("cm-i-toca-2")));
      if(red.length) ul.appendChild(el("li",null,TR("cm-i-red")+" "+red.map(function(m){
        return rotMl(m)+" ("+(m.governo||"—")+")";}).join("; ")+"."));
      else ul.appendChild(el("li",null,TR("cm-i-sem-red")));
      var sin={};tocam.forEach(function(m){var s=(m.dim[d.id]||{}).s||"—";sin[s]=(sin[s]||0)+1;});
      var ss=Object.keys(sin).filter(function(s){return s!=="—";});
      if(ss.length) ul.appendChild(el("li",null,TR("cm-i-sin")+" "+ss.map(function(s){
        return sin[s]+" "+sinalRot(s);}).join(" · ")+"."));
      ins.appendChild(ul);
      ins.appendChild(el("p","pz-nota",TR("cm-i-ressalva")));
      corpo.appendChild(ins);

      /* ---- barras: um marco por linha, cor do governo ---- */
      var L=(CMZERO?vis:tocam).slice().sort(function(a,b){
        return cmN(b,d.id)-cmN(a,d.id)||String(a.data_sancao).localeCompare(String(b.data_sancao));});
      var lista=el("div","cm-barras");
      lista.setAttribute("role","list");
      if(!L.length) lista.appendChild(el("p","gl-vazio",TR("Nenhum marco deste recorte toca esta dimensão.")));
      L.forEach(function(m){
        var o=m.dim&&m.dim[d.id], n=cmN(m,d.id), g=m.governo||"—";
        var row=el("div","cm-row");row.setAttribute("role","listitem");
        row.style.setProperty("--gc",corGov(g));
        var nm=el("div","cm-nm");
        nm.appendChild(el("span","cm-mn",rotMl(m)));nm.appendChild(selo(g));
        row.appendChild(nm);
        var tr=el("div","cm-trilho");var br=el("span","cm-barra");br.style.width=(n/3*100)+"%";
        tr.appendChild(br);row.appendChild(tr);
        var vl=el("div","cm-val");
        vl.appendChild(el("b",null,String(n)));vl.appendChild(el("span","mr-nv"," "+nivelRot(n)));
        if(o&&o.s&&n) vl.appendChild(el("span",cmSinalCls(o.s),o.s+" "+sinalRot(o.s)));
        row.appendChild(vl);
        var no=CMSEL.indexOf(M.indexOf(m))>=0;
        var ad=el("button","zap cm-add",no?TR("no radar ✓"):TR("+ radar"));ad.type="button";
        ad.title=TR("Pôr ou tirar este marco do radar de vários marcos");
        if(!no&&CMSEL.length>=CM_MAX)ad.disabled=true;
        ad.addEventListener("click",function(){
          var i=M.indexOf(m),j=CMSEL.indexOf(i);
          if(j>=0)CMSEL.splice(j,1);else if(CMSEL.length<CM_MAX)CMSEL.push(i);pinta();});
        row.appendChild(ad);
        if(o&&(o.por||o.disp)){
          var dd=document.createElement("details");dd.className="cm-por";
          var s2=document.createElement("summary");s2.textContent=TR("Por que esta nota");dd.appendChild(s2);
          if(o.disp&&o.disp!=="—")dd.appendChild(el("p","mr-disp",TR("mr-disp")+": "+o.disp));
          if(o.por)dd.appendChild(el("p","ig-res",o.por));
          row.appendChild(dd);}
        lista.appendChild(row);});
      corpo.appendChild(lista);

      /* ---- por governo: só contagens do que está na coleção ---- */
      var w=el("div","tw"),t=document.createElement("table");t.className="pz-t cm-t";
      var th=document.createElement("thead"),hr=document.createElement("tr");
      [TR("Governo"),TR("Marcos na coleção"),TR("Tocam a dimensão"),TR("Alcance médio"),
       sinalRot("+"),sinalRot("-"),sinalRot("="),sinalRot("?")].forEach(function(x,i){
        var h=el("th",null,x);h.className="pz-est";h.style.textAlign=i?"right":"left";hr.appendChild(h);});
      th.appendChild(hr);t.appendChild(th);
      var tb=document.createElement("tbody");
      GOVS.forEach(function(g){
        var doG=vis.filter(function(m){return (m.governo||"—")===g;});
        if(!doG.length)return;
        var tq=doG.filter(function(m){return cmN(m,d.id)>0;});
        var md=doG.reduce(function(a,m){return a+cmN(m,d.id);},0)/doG.length;
        var tr=document.createElement("tr");
        var c0=el("td");c0.appendChild(selo(g));tr.appendChild(c0);
        [String(doG.length),String(tq.length),dec(md.toFixed(2))].concat(["+","-","=","?"].map(function(s){
          return String(tq.filter(function(m){return (m.dim[d.id]||{}).s===s;}).length);}))
          .forEach(function(v){var td=el("td","pz-num on",v);td.style.textAlign="right";tr.appendChild(td);});
        tb.appendChild(tr);});
      t.appendChild(tb);w.appendChild(t);
      corpo.appendChild(el("h4","cm-h4",TR("Por governo, nesta dimensão")));
      corpo.appendChild(w);
      corpo.appendChild(el("p","pz-nota",TR("cm-nota-gov")));
    }

    function pinta(){
      corpo.textContent="";
      pintaSug();pintaModo();pintaGov();
      if(CMMODO==="dim")modoDim();else if(CMMODO==="gov")modoGov();else modoRadar();
    }
    pinta();
    return box;
  }

  /* ---------- índice do topo da aba ----------
     A tabela "O que tem nesta página" é boa para procurar, mas fica depois da
     nota de leitura. Este índice curto abre a aba: os comparadores primeiro e,
     embaixo, cada gráfico agrupado pela categoria, na ordem em que aparecem.
     Um toque leva até o gráfico (e abre o comparador, se for um deles). */
  function sumario(){
    var main=document.querySelector("#v-infograficos main");
    if(!main)return;
    var velho=document.getElementById("ig-sumario");
    if(velho&&velho.parentNode)velho.parentNode.removeChild(velho);
    var sec=el("section","ig-sum-s");sec.id="ig-sumario";
    var nav=el("nav","card pad ig-sum");
    nav.setAttribute("aria-label",TR("Índice dos infográficos"));
    var cab=el("div","sec-h");cab.appendChild(el("h2",null,TR("Índice")));nav.appendChild(cab);

    function vai(id,abrir){
      var a=el("a");a.href="#"+id;
      a.addEventListener("click",function(e){
        e.preventDefault();
        var alvo=document.getElementById(id);if(!alvo)return;
        if(abrir){var d=alvo.querySelector("details.sob-d");if(d)d.open=true;}
        if(/^g-/.test(id))history.replaceState(null,"","#"+id);
        ancoraEm(alvo);});
      return a;}

    var gC=el("div","ig-sum-g ig-sum-comp");
    gC.appendChild(el("h3",null,TR("Comparadores")));
    var ulC=el("ul");
    [["g-sobrepor",TR("Sobrepor indicadores no mesmo gráfico")],
     ["g-marcos-comp",TR("Impacto estimado de marcos regulatórios")],
     ["ig-indice",TR("Buscar e filtrar todos os gráficos")]].forEach(function(o){
      var li=el("li"),a=vai(o[0],o[0]!=="ig-indice");a.textContent=o[1];li.appendChild(a);ulC.appendChild(li);});
    gC.appendChild(ulC);nav.appendChild(gC);

    var grade=el("div","ig-sum-grade");
    var ordem=[],porCat={};
    IG.graficos.forEach(function(g){
      var cat=String(g.macro||"").split("·")[0].trim()||"—";
      if(!porCat[cat]){porCat[cat]=[];ordem.push(cat);}
      porCat[cat].push(g);});
    ordem.forEach(function(cat){
      /* cada categoria é uma gaveta fechada: abre só a que interessa */
      var gr=document.createElement("details");gr.className="ig-sum-g ig-sum-cat";
      var sc=document.createElement("summary");
      sc.appendChild(el("span","ig-sum-cn",TR(cat)));
      sc.appendChild(el("span","ig-sum-n",String(porCat[cat].length)));
      gr.appendChild(sc);
      var ul=el("ul");
      porCat[cat].forEach(function(g){
        var li=el("li"),a=vai(slugG(g.titulo),false);a.textContent=g.titulo;li.appendChild(a);ul.appendChild(li);});
      gr.appendChild(ul);grade.appendChild(gr);});
    /* a lista inteira nasce fechada, para não empurrar os comparadores */
    var dt=document.createElement("details");dt.className="ig-sum-d";dt.open=false;
    var st=document.createElement("summary");st.textContent=TR("Ver todos os gráficos, por categoria")+" ("+IG.graficos.length+")";
    dt.appendChild(st);dt.appendChild(grade);nav.appendChild(dt);
    sec.appendChild(nav);
    main.insertBefore(sec,main.firstChild);
  }
  /* os comparadores são o que há de mais útil na aba: ficam logo depois do
     índice, antes da nota de leitura, e não perdidos entre os gráficos */
  function comparadores(){
    var main=document.querySelector("#v-infograficos main");
    if(!main)return null;
    var velho=document.getElementById("ig-comp");
    if(velho&&velho.parentNode)velho.parentNode.removeChild(velho);
    var sec=el("section","ig-comp-s");sec.id="ig-comp";
    var cab=el("div","sec-h");cab.appendChild(el("h2",null,TR("Comparadores")));sec.appendChild(cab);
    sec.appendChild(el("p","ig-comp-p",TR("ig-comp-p")));
    sec.appendChild(sobrepor());
    sec.appendChild(comparaMarcos());
    var ref=document.getElementById("ig-sumario");
    main.insertBefore(sec,ref?ref.nextSibling:main.firstChild);
    return sec;
  }

  function pinta(){
    lista.textContent="";
    lista.appendChild(indice());
    lista.firstChild.id="ig-indice";
    IG.graficos.forEach(function(c){ lista.appendChild(bloco(c)); });
    sumario();
    comparadores();
  }
  window.repintaIG=pinta;   /* o painel de Configurações repinta por aqui */
  pinta();
})();

/* ---------- histórico ---------- */
(function(){
  var H=D.historico||{};
  var tot=0,ofi=0;
  Object.keys(H).forEach(function(k){
    ["cargos","experiencia_privada","indicadores","marcos"].forEach(function(sec){
      (H[k][sec]||[]).forEach(function(it){tot++;if(it.fonte&&it.fonte.orientacao==="oficial")ofi++;});});});
  var et=document.getElementById("h-tot"),eo=document.getElementById("h-ofi");
  if(et)et.textContent=tot; if(eo)eo.textContent=ofi;

  function fonteEl(fo){
    var w=el("span","fonte");
    if(!fo)return w;
    var a=el("a",null,fo.nome||"fonte");
    if(fo.url){a.href=fo.url;a.target="_blank";a.rel="noopener noreferrer";}
    w.appendChild(a);
    var o=(fo.orientacao||"").replace("imprensa-","imprensa · ");
    w.appendChild(el("span","proc"+(fo.orientacao==="oficial"?" oficial":""),o||"—"));
    return w;
  }
  function periodo(i,f){
    function fmt(x){if(!x)return"";var p=String(x).split("-");
      return p.length>1?(p[1]+"/"+p[0]):p[0];}
    if(!i&&!f)return"";
    return fmt(i)+" — "+(f?fmt(f):"atual");
  }

  var gsel=document.getElementById("gsel"),hbox=document.getElementById("hbox"),gAtual=null;
  D.candidatos.forEach(function(c){
    var b=el("button");b.type="button";b.dataset.g=c.pre;
    var sw=el("span","sw");pintaFundo(sw,c.cor);b.appendChild(sw);
    b.appendChild(document.createTextNode(c.nome));
    b.addEventListener("click",function(){gAtual=c.pre;pintaG();});
    gsel.appendChild(b);
  });
  var MESES=["janeiro","fevereiro","março","abril","maio","junho","julho",
             "agosto","setembro","outubro","novembro","dezembro"];
  function idadeEm(iso,hoje){
    var p=String(iso||"").split("-"); if(p.length!==3) return null;
    var a=+p[0],m=+p[1],d=+p[2];
    var i=hoje.getFullYear()-a;
    var mh=hoje.getMonth()+1, dh=hoje.getDate();
    if(mh<m||(mh===m&&dh<d)) i--;
    return (i>=0&&i<130)?i:null;
  }
  // acrescenta "(N anos)" logo depois da data de nascimento escrita no texto.
  // a idade é calculada quando a página carrega, então muda sozinha no aniversário.
  function comIdade(txt,iso){
    var p=String(iso||"").split("-"); if(p.length!==3) return txt;
    var n=idadeEm(iso,new Date()); if(n===null) return txt;
    var alvo=(+p[2])+" de "+MESES[(+p[1])-1]+" de "+p[0];
    if(txt.indexOf(alvo)<0) return txt;
    return txt.replace(alvo, alvo+" ("+n+" anos)");
  }

  function pintaBio(cod){
    var B=(window.__BIO__||{})[cod]; if(!B) return null;
    var c=CAND[cod];
    var box=el("div","bio");
    var FT=(D.fotos_tse||{})[cod];
    var topo=el("div","bio-top"),cab=el("div","bio-cab");
    if(FT&&FT.p&&verFotos()){
      var ip=el("img","bio-ft");ip.src=FT.p;ip.width=84;ip.height=117;ip.loading="lazy";
      ip.alt=TR("foto-alt")+" "+c.nome;
      comTip(ip,c.nome+" — "+TR("foto-tip"));
      topo.appendChild(ip);}
    var h=el("h3",null,c.nome+" ("+c.partido+")");cab.appendChild(h);
    if(B.nome_completo) cab.appendChild(el("div","nomec",B.nome_completo));
    topo.appendChild(cab);box.appendChild(topo);
    if(B.resumo) box.appendChild(el("p","res",comIdade(B.resumo,(B.nascimento||{}).data)));
    var eqI=pintaEquipe(cod);
    if(eqI){eqI.classList.add("eqp-in");box.appendChild(eqI);}
    var g=el("div","bio-grid");
    function bloco(titulo,itens,render){
      if(!itens||!itens.length)return;
      var d=el("div","bio-b");d.appendChild(el("h4",null,titulo));
      var ul=el("ul");
      itens.forEach(function(it){var li=el("li");render(li,it);
        if(it.fonte){var f=el("span","qd");f.appendChild(fonteEl(it.fonte));li.appendChild(f);}
        ul.appendChild(li);});
      d.appendChild(ul);g.appendChild(d);
    }
    if(B.nascimento&&B.nascimento.data){
      var d0=el("div","bio-b");d0.appendChild(el("h4",null,"Nascimento"));
      var ul0=el("ul"),li0=el("li");
      var p=String(B.nascimento.data).split("-");
      li0.appendChild(el("b",null,p.length===3?p[2]+"/"+p[1]+"/"+p[0]:B.nascimento.data));
      if(B.nascimento.local)li0.appendChild(document.createTextNode(" · "+B.nascimento.local));
      if(B.nascimento.fonte){var f0=el("span","qd");f0.appendChild(fonteEl(B.nascimento.fonte));li0.appendChild(f0);}
      ul0.appendChild(li0);d0.appendChild(ul0);g.appendChild(d0);
    }
    bloco("Formação",B.formacao,function(li,it){
      li.appendChild(el("b",null,it.curso||""));
      var t=[it.instituicao,it.conclusao].filter(Boolean).join(" · ");
      if(t)li.appendChild(document.createTextNode(" — "+t));});
    bloco("Família",B.familia,function(li,it){
      li.appendChild(el("b",null,it.nome||""));
      var t=[it.relacao,it.obs].filter(Boolean).join(" · ");
      if(t)li.appendChild(document.createTextNode(" — "+t));});
    bloco("Trajetória profissional",B.profissional,function(li,it){
      li.appendChild(el("b",null,it.atividade||""));
      if(it.periodo)li.appendChild(document.createTextNode(" — "+it.periodo));});
    if(B.filiacoes&&B.filiacoes.length){
      var d2=el("div","bio-b");d2.appendChild(el("h4",null,"Filiações partidárias"));
      var fl=el("div","fil");
      B.filiacoes.slice().sort(function(a,b){return String(b.de).localeCompare(String(a.de));}).forEach(function(x){
        var sp=el("span");sp.appendChild(document.createTextNode(x.partido||""));
        var per=[x.de,x.ate||"atual"].filter(Boolean).join("–");
        if(per)sp.appendChild(el("em",null,per));
        fl.appendChild(sp);});
      d2.appendChild(fl);g.appendChild(d2);
    }
    box.appendChild(g);
    box.appendChild(pintaPatr(cod));
    box.appendChild(pintaProc(cod));
    return box;
  }

  function itemProc(x){
    var it=el("div","proc-it");
    var h=el("div","proc-h");
    h.appendChild(el("b",null,x.titulo||""));
    h.appendChild(el("span","proc-st "+({ "condenação transitada em julgado":"neg",
      "condenado em segunda instância":"neg","condenado em primeira instância":"neg",
      "denúncia recebida, réu":"warn","denúncia oferecida":"warn","em investigação":"warn",
      "empresa condenada em 2ª instância":"warn","estado não confirmado":"mut",
      "absolvido":"ok","arquivado":"ok","anulado":"ok",
      "prescrito":"warn","punibilidade extinta por prescrição":"warn",
      "suspenso":"mut","estado não confirmado":"mut"}[x.status]||"mut"),x.status||"—"));
    it.appendChild(h);
    if(x.conclusao){
      var cc=CONC[x.conclusao]||{c:"mut",r:x.conclusao};
      var cb=el("div","proc-c "+cc.c);
      cb.appendChild(el("span","proc-cl",cc.r));
      if(x.desfecho)cb.appendChild(el("span","proc-cd",x.desfecho));
      it.appendChild(cb);
    }
    var meta=[];
    if(x.tribunal)meta.push(x.tribunal);
    if(x.numero&&x.numero.indexOf("não localizado")<0)meta.push("nº "+x.numero);
    if(x.inicio&&String(x.inicio).indexOf("não localizado")<0)meta.push("início "+x.inicio);
    if(x.data_status)meta.push("situação em "+x.data_status);
    it.appendChild(el("div","proc-m",meta.join(" · ")));
    if(x.objeto)it.appendChild(el("p","proc-o",x.objeto));
    if(x.resumo)it.appendChild(el("p","proc-r",x.resumo));
    var fo=el("div","proc-f");
    if(x.fonte)fo.appendChild(fonteEl(x.fonte));
    if(x.fonte_2){fo.appendChild(document.createTextNode(" · "));fo.appendChild(fonteEl(x.fonte_2));}
    if(x.obs)fo.appendChild(el("span","proc-obs",x.obs));
    it.appendChild(fo);
    return it;
  }

  var CONC={"condenado em definitivo":{c:"neg",r:"Condenado em definitivo"},
    "condenado, cabe recurso":{c:"neg",r:"Condenado — cabe recurso"},
    "absolvido":{c:"ok",r:"Absolvido"},
    "sem decisão de mérito":{c:"mut",r:"Sem decisão de mérito"},
    "sem acusação formal":{c:"mut",r:"Sem acusação formal"},
    "condenado, punibilidade extinta por prescrição":
      {c:"warn",r:"Condenado em 1ª instância — punibilidade extinta por prescrição"},
    "réu, ainda sem julgamento":{c:"warn",r:"Réu — acusação aceita, ainda sem julgamento"},
    "empresa condenada, não a pessoa":
      {c:"warn",r:"Empresa condenada — não a pessoa do candidato"},
    "condenado em ação trabalhista":
      {c:"warn",r:"Condenado solidariamente na Justiça do Trabalho — em execução"},
    "não é processo contra o partido nem contra o candidato":
      {c:"mut",r:"Não é processo contra o partido nem contra o candidato"}};

  // processos do partido — separado dos da pessoa, de propósito
  function pintaProcPartido(cod){
    var PR=window.__PROC__; if(!PR||!PR.partidos) return document.createDocumentFragment();
    var c=CAND[cod]; if(!c) return document.createDocumentFragment();
    var sig=c.partido, P=PR.partidos[sig];
    if(!P){
      var alt=Object.keys(PR.partidos).filter(function(k){
        return k.toLowerCase()===String(sig).toLowerCase();})[0];
      if(alt)P=PR.partidos[alt];
    }
    if(!P) return document.createDocumentFragment();
    var w=el("div","proc-part");
    w.appendChild(el("h4",null,"Processos do partido — "+(P.nome||sig)));
    w.appendChild(el("p","patr-n",
      "Estes processos são do partido, não da pessoa. Quem responde por eles é a legenda, e constam aqui "+
      "porque o candidato se apresenta por ela — não como fato da trajetória individual."));
    if(!P.processos||!P.processos.length){
      w.appendChild(el("p","proc-zero","Nenhum processo do partido localizado nos limites descritos abaixo."));
      return w;
    }
    var lst=el("div","proc-lin");
    P.processos.forEach(function(x){lst.appendChild(itemProc(x));});
    w.appendChild(lst);
    return w;
  }

  // processos judiciais — presunção de inocência é o enquadramento, não um adendo
  function pintaProc(cod){
    var PR=window.__PROC__; if(!PR||!PR.pessoas||!PR.pessoas[cod]) return document.createDocumentFragment();
    var P=PR.pessoas[cod], wrap=el("div","patr proc-box");
    wrap.appendChild(el("h4",null,"Processos judiciais"));
    var av=el("div","proc-av");
    av.appendChild(el("span","rot","Ninguém aqui é culpado de nada — como ler esta lista"));
    var ul0=el("ul");
    [ "Ninguém aqui é culpado de nada. No Brasil, a pessoa é considerada inocente até que uma condenação não caiba "+
      "mais recurso — o que se chama trânsito em julgado. Onde isso não aconteceu, o que existe é uma acusação sendo "+
      "apurada, e é assim que cada item está escrito.",
      "O tamanho desta lista não mede conduta. Mede tempo de vida pública, cargo ocupado e foro: quem exerce mandato "+
      "há décadas aparece em mais registros que quem nunca ocupou cargo, e quem tem foro em tribunal superior tem "+
      "processo publicado enquanto o de outra pessoa corre numa vara comum, fora do alcance desta pesquisa.",
      "A lista é incompleta por construção. Ela cobre o que foi possível confirmar em fonte pública lida — sobretudo "+
      "tribunais superiores e imprensa que cita documento. Processos em primeira instância, sob segredo de justiça "+
      "ou não noticiados não estão aqui, para ninguém."
    ].forEach(function(t){ul0.appendChild(el("li",null,t));});
    av.appendChild(ul0);
    wrap.appendChild(av);

    var COR={ "condenação transitada em julgado":"neg","condenado em segunda instância":"neg",
      "condenado em primeira instância":"neg","denúncia recebida, réu":"warn","denúncia oferecida":"warn",
      "em investigação":"warn","absolvido":"ok","arquivado":"ok","anulado":"ok",
      "prescrito":"warn","punibilidade extinta por prescrição":"warn",
      "suspenso":"mut","estado não confirmado":"mut"};

    if(!P.processos||!P.processos.length){
      var vz=el("p","proc-zero","Nenhum processo localizado nos limites descritos acima. Isso não significa que não "+
        "exista nenhum — significa que nenhum foi encontrado nas fontes consultadas.");
      wrap.appendChild(vz);
      wrap.appendChild(pintaProcPartido(cod));
      var lim0=el("div","patr-res");
      lim0.appendChild(el("span","rot","O que esta lista não alcança"));
      var u0=el("ul");
      (PR.limites||[]).forEach(function(t){u0.appendChild(el("li",null,t));});
      lim0.appendChild(u0);wrap.appendChild(lim0);
      return wrap;
    }
    var lst=el("div","proc-lin");
    P.processos.slice().sort(function(a,b){
      return String(b.data_status||b.inicio||"").localeCompare(String(a.data_status||a.inicio||""));
    }).forEach(function(x){ lst.appendChild(itemProc(x)); });
    wrap.appendChild(lst);
    wrap.appendChild(pintaProcPartido(cod));
    var lim=el("div","patr-res");
    lim.appendChild(el("span","rot","O que esta lista não alcança"));
    var ul=el("ul");
    (PR.limites||[]).forEach(function(t){ul.appendChild(el("li",null,t));});
    lim.appendChild(ul);
    wrap.appendChild(lim);
    return wrap;
  }

  // patrimônio declarado à Justiça Eleitoral, ano a ano — a ausência também é informação
  function pintaPatr(cod){
    var PT=window.__PATR__; if(!PT||!PT.pessoas||!PT.pessoas[cod]) return document.createDocumentFragment();
    var P=PT.pessoas[cod], wrap=el("div","patr");
    wrap.appendChild(el("h4",null,"Patrimônio declarado à Justiça Eleitoral"));
    wrap.appendChild(el("p","patr-n",
      "Só existe declaração em ano em que a pessoa registrou candidatura. Os anos sem declaração estão listados "+
      "assim mesmo, com o motivo — a falta de informação também é informação."));
    var MOT={declarado:"",nao_concorreu:TR("pt-nc"),sem_eleicao:TR("pt-se"),
             nao_encontrado:TR("pt-nf")};
    function brl(v){
      if(v===0) return "R$ 0,00";
      var s=(Math.round(v*100)/100).toFixed(2).split(".");
      return "R$ "+s[0].replace(/\B(?=(\d{3})+(?!\d))/g,".")+","+s[1];
    }
    // último ano com declaração localizada — o destaque que abre o bloco
    var ult=null;
    (P.anos||[]).forEach(function(y){
      if(y.situacao==="declarado"&&y.valor!==null&&y.valor!==undefined&&(!ult||y.ano>ult.ano))ult=y;});
    var dst=el("div","patr-dst");
    dst.appendChild(el("span","rot","Patrimônio conhecido mais recente"));
    if(ult){
      var v=el("div","patr-dst-v");
      v.appendChild(el("b",null,ult.valor===0?TR("pt-zero"):brl(ult.valor)));
      v.appendChild(el("span","patr-dst-a",(ult.valor===0?TR("pt-decl0"):TR("pt-decl"))+ult.ano));
      dst.appendChild(v);
      var det=[];
      if(ult.cargo)det.push(TR("pt-cand")+" "+ult.cargo+(ult.uf&&ult.uf!=="BR"?" · "+ult.uf:""));
      det.push(TR("pt-auto"));
      dst.appendChild(el("p","patr-dst-n",det.join(" · ")));
    } else {
      var v2=el("div","patr-dst-v");
      v2.appendChild(el("b","semv","Nenhuma declaração localizada"));
      dst.appendChild(v2);
      dst.appendChild(el("p","patr-dst-n",
        "Não há, entre 2016 e 2026, nenhum ano em que o valor declarado por esta pessoa tenha sido encontrado em "+
        "fonte que o publicasse. O motivo de cada ano está na lista abaixo."));
    }
    wrap.appendChild(dst);

    var lin=el("div","patr-lin");
    (P.anos||[]).slice().sort(function(a,b){return b.ano-a.ano;}).forEach(function(y){
      var r=el("div","patr-row"+(y.situacao==="declarado"?" tem":""));
      r.appendChild(el("div","patr-a",String(y.ano)));
      var v=el("div","patr-v");
      if(y.situacao==="declarado"&&y.valor!==null&&y.valor!==undefined){
        v.appendChild(el("b",null,brl(y.valor)));
        var det=[y.cargo,y.uf].filter(Boolean).join(" · ");
        if(det)v.appendChild(el("span","patr-c"," "+det));
      } else {
        v.appendChild(el("span","patr-sem",MOT[y.situacao]||y.situacao||"informação não disponível"));
      }
      if(y.obs)v.appendChild(el("span","patr-o",y.obs));
      r.appendChild(v);
      var f=el("div","patr-f");
      if(y.fonte){var a2=el("a",null,"fonte");a2.href=y.fonte;a2.target="_blank";a2.rel="noopener noreferrer";
        a2.style.color="var(--accent)";f.appendChild(a2);}
      r.appendChild(f);
      lin.appendChild(r);});
    wrap.appendChild(lin);
    var res=el("div","patr-res");
    res.appendChild(el("span","rot","Como ler"));
    var ul=el("ul");
    (PT.notas||[]).forEach(function(n){ul.appendChild(el("li",null,n));});
    res.appendChild(ul);
    wrap.appendChild(res);
    return wrap;
  }

  // índice das seções do candidato — montado a partir do que existe de fato na página
  function montaIndiceCand(){
    var alvo=document.getElementById("cv-idx"); if(!alvo) return;
    alvo.textContent="";
    var cabs=hbox.querySelectorAll("h2, h3, .bio-b h4, .patr > h4, .proc-part > h4, .bio-h h3");
    var itens=[];
    var CURTO=[[/^Patrim/i,"Patrimônio"],[/^Processos do partido/i,"Processos do partido"],
      [/^Processos judiciais/i,"Processos judiciais"],[/^Cargos/i,"Cargos"],
      [/^Atividade privada/i,"Atividade privada"],[/^Marcos/i,"Marcos datados"],
      [/^Séries oficiais/i,"Séries oficiais"],[/^Grupo político/i,"Grupo político"]];
    var bioH=hbox.querySelector(".bio-card, .bio-h, .bio");
    if(bioH){bioH.id="cv-bio";bioH.style.scrollMarginTop="112px";itens.push({id:"cv-bio",rot:"Biografia"});}
    [].forEach.call(hbox.querySelectorAll("h2, .patr > h4, .proc-part > h4"),function(h,i){
      var txt=(h.textContent||"").trim(); if(!txt) return;
      var curto=txt;
      for(var k=0;k<CURTO.length;k++){if(CURTO[k][0].test(txt)){curto=CURTO[k][1];break;}}
      var id="cv-s"+i; h.id=id; h.style.scrollMarginTop="112px";
      itens.push({id:id,rot:curto});});
    if(itens.length<2) return;
    var lab=el("span","uf-rot","Nesta página");alvo.appendChild(lab);
    itens.forEach(function(it){
      var b=el("button","chip-cat",it.rot);b.type="button";
      b.addEventListener("click",function(){
        var e=document.getElementById(it.id);
        if(e)e.scrollIntoView({behavior:"smooth",block:"start"});});
      alvo.appendChild(b);});
    var t=el("button","alfa-topo","↑ escolher candidato");t.type="button";
    t.addEventListener("click",function(){
      var nav=document.querySelector(".nav");
      var alto=nav?nav.offsetHeight:48;
      var y=gsel.getBoundingClientRect().top+window.scrollY-alto-10;
      window.scrollTo({top:Math.max(0,y),behavior:"smooth"});});
    alvo.appendChild(t);
  }

  /* quem está NA CANDIDATURA: chapa registrada, direção do partido e funções de
     campanha anunciadas. É bloco próprio, separado do grupo político — que trata
     de períodos de governo passados — e existe para as oito candidaturas. */
  var TIERS=[["chapa","Na chapa","registro oficial no TSE"],
             ["partido","À frente do partido","registro oficial no TSE"],
             ["campanha","Na campanha","função anunciada publicamente"]];
  function pintaEquipe(cod){
    var E=(D.equipes||{})[cod]; if(!E||!E.length) return null;
    var c=CAND[cod];
    var box=el("div","eqp");
    box.appendChild(el("h4",null,"Quem está nesta candidatura"));
    TIERS.forEach(function(t){
      var lst=E.filter(function(x){return x.tier===t[0];});
      if(!lst.length)return;
      var h=el("div","eqp-t");
      h.appendChild(el("b",null,t[1]));
      h.appendChild(el("span","eqp-o",t[2]));
      box.appendChild(h);
      var ul=el("ul","eqp-l");
      lst.forEach(function(x){
        var li=el("li");
        /* só a chapa tem foto: o TSE publica imagem de quem é candidato
           registrado, e não de presidente de partido ou de campanha */
        var FT=(D.fotos_tse||{})[cod], ft=null;
        if(FT&&verFotos()){
          if(x.nome===c.nome&&FT.p)ft=FT.p;
          else if(x.nome===FT.vn&&FT.v)ft=FT.v;}
        var cx=li;
        if(ft){
          li.className="tem-ft";
          var iv=el("img","eqp-ft");iv.src=ft;iv.width=32;iv.height=45;iv.loading="lazy";
          iv.alt=TR("foto-alt")+" "+(x.nome||"");
          comTip(iv,(x.nome||"")+" — "+TR("foto-tip"));
          li.appendChild(iv);
          cx=el("div","eqp-cx");li.appendChild(cx);}
        var l1=el("div","eqp-n");
        if(x.nome===c.nome){var dd=el("span","dot5");pintaFundo(dd,c.cor);l1.appendChild(dd);}
        l1.appendChild(el("b",null,x.nome||""));
        l1.appendChild(el("span","eqp-p",x.papel||""));
        cx.appendChild(l1);
        if(x.obs)cx.appendChild(el("div","eqp-obs",x.obs));
        if(x.fonte){var f=el("span","qd");f.appendChild(fonteEl(x.fonte));cx.appendChild(f);}
        ul.appendChild(li);});
      box.appendChild(ul);});
    if(D.fotos_tse&&D.fotos_tse[cod]&&D.fotos_tse_credito&&verFotos())
      box.appendChild(el("p","bio-cr",D.fotos_tse_credito));
    if(D.equipes_nota){
      var rs=el("div","patr-res");
      rs.appendChild(el("span","rot","Como esta lista foi montada — e quem não entra nela"));
      var u=el("ul");u.appendChild(el("li",null,D.equipes_nota));
      rs.appendChild(u);box.appendChild(rs);
    }
    return box;
  }

  function pintaG(){
    [].forEach.call(gsel.children,function(b){b.setAttribute("aria-pressed",b.dataset.g===gAtual?"true":"false");});
    hbox.textContent="";
    var bio=pintaBio(gAtual); if(bio) hbox.appendChild(bio);
    var g=H[gAtual];
    if(!g){
      var av=el("div","card pad note");
      av.appendChild(el("h3",null,"Sem bloco de grupo político"));
      av.appendChild(el("p",null,"Não há, para esta candidatura, período de governo com séries oficiais atribuíveis. O que existe de trajetória está acima."));
      hbox.appendChild(av);montaIndiceCand();return;}
    var c=CAND[gAtual];

    var top=el("div","card pad note grupo-h");
    top.appendChild(el("h3",null,g.rotulo||("Grupo político de "+c.nome)));
    /* quem está no bloco fica à vista mesmo com a explicação recolhida:
       sem os nomes, o cartão parecia uma caixa vazia com números soltos */
    if((g.pessoas||[]).length){
      var qp=el("div","grupo-q");
      g.pessoas.forEach(function(x){
        var it=el("span","grupo-p");
        if((x.papel||"")==="candidato"){var dd=el("span","dot5");pintaFundo(dd,c.cor);it.appendChild(dd);}
        it.appendChild(el("b",null,x.nome||""));
        if(x.papel)it.appendChild(el("span","pa",x.papel));
        qp.appendChild(it);});
      top.appendChild(qp);
    }
    top.appendChild(el("p",null,g.atribuicao||""));
    var hc=el("div","hcount");
    var contas=[[String((g.cargos||[]).length),"cargos registrados"],
     [String((g.experiencia_privada||[]).length),"registros de atividade privada"],
     [String((g.indicadores||[]).length),"séries oficiais no período"],
     [String((g.marcos||[]).length),"marcos datados"]];
    /* sem grupo político, contar cargos e séries em zero só encheria a tela de zeros */
    if(!g.grupo)contas=contas.filter(function(p){return p[0]!=="0";});
    contas.forEach(function(p){
      var d=el("div");d.appendChild(el("b",null,p[0]));d.appendChild(document.createTextNode(p[1]));hc.appendChild(d);});
    if(hc.children.length)top.appendChild(hc);
    var gw=el("div","grupo");
    gw.appendChild(top);
    gw.appendChild(el("p","grupo-cue",
      "Cargos, séries oficiais e marcos abaixo são deste bloco — e cada linha diz de qual pessoa."));
    hbox.appendChild(gw);

    function secao(titulo,nota){
      var h=el("div","sec-h");h.style.marginTop="34px";
      var t=el("h2",null,titulo);t.style.fontSize="20px";h.appendChild(t);gw.appendChild(h);
      if(nota){var p=el("p","sec-n",nota);gw.appendChild(p);}
    }
    if((g.cargos||[]).length){
      secao("Cargos exercidos","Períodos declarados conforme a fonte, do mais recente para o mais antigo.");
      var tl=el("div","tl");
      g.cargos.slice().sort(function(a,b){return String(b.inicio).localeCompare(String(a.inicio));}).forEach(function(x){
        var ev=el("div","ev");
        ev.appendChild(el("div","dt",periodo(x.inicio,x.fim)));
        var ti=el("div","ti");
        var b=el("b",null,x.cargo||"");ti.appendChild(b);
        ti.appendChild(document.createTextNode(" · "+(x.jurisdicao||"")+" — "+(x.pessoa||"")));
        ev.appendChild(ti);
        if(x.obs)ev.appendChild(el("div","su",x.obs));
        var su=el("div","su");su.appendChild(fonteEl(x.fonte));ev.appendChild(su);
        tl.appendChild(ev);});
      gw.appendChild(tl);
    }
    if((g.experiencia_privada||[]).length){
      secao("Atividade privada e organizacional","O que a organização faz, segundo a fonte citada. Sem avaliação de desempenho.");
      var tl2=el("div","tl");
      g.experiencia_privada.slice().sort(function(a,b){return String(b.inicio).localeCompare(String(a.inicio));}).forEach(function(x){
        var ev=el("div","ev");
        ev.appendChild(el("div","dt",periodo(x.inicio,x.fim)));
        var ti=el("div","ti");ti.appendChild(el("b",null,x.organizacao||""));
        ti.appendChild(document.createTextNode(" · "+(x.papel||"")+" — "+(x.pessoa||"")));
        ev.appendChild(ti);
        if(x.descricao)ev.appendChild(el("div","su",x.descricao));
        var su=el("div","su");su.appendChild(fonteEl(x.fonte));ev.appendChild(su);
        tl2.appendChild(ev);});
      gw.appendChild(tl2);
      /* o critério da lista fica junto da lista, não no rodapé: quem lê aqui
         precisa saber o que entra, o que não entra e o que a ausência significa */
      if(D.experiencia_privada_nota){
        var rsP=el("div","patr-res");
        rsP.appendChild(el("span","rot","O que entra nesta lista — e o que a ausência significa"));
        var uP=el("ul");uP.appendChild(el("li",null,D.experiencia_privada_nota));
        rsP.appendChild(uP);gw.appendChild(rsP);
      }
    }
    if((g.marcos||[]).length){
      secao("Marcos datados","Fatos com data e fonte, do mais recente para o mais antigo. Sem adjetivo e sem interpretação.");
      var tl3=el("div","tl");
      g.marcos.slice().sort(function(a,b){return String(b.data).localeCompare(String(a.data));}).forEach(function(x){
        var ev=el("div","ev");
        ev.appendChild(el("div","dt",periodo(x.data,null).replace(" — atual","")));
        ev.appendChild(el("div","ti",x.fato||""));
        if(x.obs)ev.appendChild(el("div","ctx",x.obs));
        var su=el("div","su");
        if(x.pessoa)su.appendChild(document.createTextNode(x.pessoa+" · "));
        su.appendChild(fonteEl(x.fonte));
        if(x.fonte_2){su.appendChild(document.createTextNode(" · "));su.appendChild(fonteEl(x.fonte_2));}
        ev.appendChild(su);
        tl3.appendChild(ev);});
      gw.appendChild(tl3);
      if((g.indicadores||[]).length){
      secao("Séries oficiais nos períodos de governo",
        "Cada cartão traz o período exato, a unidade e o órgão que publica a série. O número descreve o período — não é apresentado como resultado da ação de ninguém.");
      var por={};
      g.indicadores.forEach(function(x){(por[x.periodo]=por[x.periodo]||[]).push(x);});
      Object.keys(por).sort().forEach(function(pe){
        var hh=el("div","eyebrow",pe);hh.style.margin="20px 0 10px";gw.appendChild(hh);
        var grid=el("div","ind");
        por[pe].forEach(function(x){
          var cc=el("div","c");
          cc.appendChild(el("div","nm",x.indicador||""));
          cc.appendChild(el("div","pe",(x.jurisdicao||"")+" · "+(x.orgao||"")));
          var vl=el("div","vl");vl.appendChild(document.createTextNode(String(x.valor)));
          if(x.unidade)vl.appendChild(el("span","un",x.unidade));
          cc.appendChild(vl);
          if(x.nota)cc.appendChild(el("div","nt",x.nota));
          var fo=el("div","fo");fo.appendChild(fonteEl(x.fonte));cc.appendChild(fo);
          grid.appendChild(cc);});
        gw.appendChild(grid);});
    } else {
      secao("Séries oficiais nos períodos de governo",
        g.grupo===null
          ? ("Não há séries aqui porque não houve cargo público: nada do que o país mediu entre 1998 e 2026 "+
             "pode ser atribuído a esta candidatura. Isso não é qualidade nem defeito — é a diferença entre "+
             "quem já governou e quem não governou, e é exatamente o que esta aba existe para tornar visível.")
          : "Não há séries nesta seção: não houve período de governo para o qual existam séries oficiais atribuíveis. Isso descreve a trajetória registrada, e não é qualidade nem defeito.");
    }
    if(window.DL){
      var cnd=CAND[gAtual]||{};
      window.DL.botoesDL(hbox,{
        nome:"curriculo-"+String(gAtual||"cand"),
        titulo:"Currículo — "+(cnd.nome||gAtual),
        sub:"Trajetória pública, patrimônio declarado, processos e séries oficiais do período de governo",
        fonte:"Cada linha traz a fonte de onde saiu; itens marcados como oficiais vêm de órgão público",
        textoCortado:true,
        linhas:function(){return linhasCurriculo(gAtual);}
      });
    }
    montaIndiceCand();
  }
  /* linhas do currículo a partir do que está na tela (mantém o recorte visível) */
  function linhasCurriculo(cod){
    var R=[["secao","item","detalhe","data_ou_periodo","situacao","fonte"]];
    var sec="";
    [].forEach.call(hbox.querySelectorAll("h2, h3, h4, .ev, .patr-row, .proc-box, .c"),function(e){
      if(/^H[234]$/.test(e.tagName)){sec=e.textContent.replace(/\s+/g," ").trim();return;}
      function tx(sel){var n=e.querySelector(sel);return n?n.textContent.replace(/\s+/g," ").trim():"";}
      function link(){var a=e.querySelector("a[href^='http']");return a?a.href:"";}
      if(e.classList.contains("ev"))
        R.push([sec,tx(".ti")||e.textContent.replace(/\s+/g," ").trim().slice(0,120),
                tx(".su"),tx(".dt"),"",link()]);
      else if(e.classList.contains("patr-row"))
        R.push([sec,tx(".patr-a"),tx(".patr-v"),tx(".patr-a"),tx(".patr-sem"),link()]);
      else if(e.classList.contains("proc-box"))
        R.push([sec,tx("h5")||tx("b"),e.textContent.replace(/\s+/g," ").trim().slice(0,600),
                tx(".dt"),tx(".conc")||tx(".sit"),link()]);
      else if(e.classList.contains("c"))
        R.push([sec,tx(".nm"),tx(".vl")+" "+tx(".un"),tx(".pe"),tx(".nt"),link()]);
    });
    return R;
  }
  }

  /* ================= COMPARADOR =================
     Só entram aqui campos que existem para as oito candidaturas com o MESMO
     significado. Onde o dado não existe, a célula diz que não existe — ausência
     é informação, e preencher com zero seria inventar equivalência. */
  var cmpSel=D.candidatos.map(function(c){return c.pre;});
  var BIOS=window.__BIO__||{}, PATR=window.__PATR__||{}, PROC=window.__PROC__||{};

  function declaracoes(pre){
    var P=(PATR.pessoas||{})[pre]||{};
    return (P.anos||[]).filter(function(a){return a.situacao==="declarado"&&a.valor;});
  }
  function moeda(v){
    if(v==null)return null;
    /* a moeda continua sendo o real; o que segue o idioma é a abreviação de escala */
    if(v>=1e9)return "R$ "+dec((v/1e9).toFixed(2))+(ENUS?"B":" bi");
    if(v>=1e6)return "R$ "+dec((v/1e6).toFixed(2))+(ENUS?"M":" mi");
    if(v>=1e3)return "R$ "+dec((v/1e3).toFixed(1))+(ENUS?"k":" mil");
    return "R$ "+dec(String(Math.round(v)));
  }
  /* fator acumulado do IPCA entre dois anos, a partir da série já publicada
     na aba Infográficos — serve para separar o que é ganho real do que é
     apenas a moeda valendo menos */
  function fatorIPCA(de,ate){
    var S=((window.__IG__||{}).series||{}).ipca;
    if(!S||de>=ate)return null;
    var m={};(S.pontos||[]).forEach(function(p){m[p.ano]=p.valor;});
    var f=1,achou=0;
    for(var y=de+1;y<=ate;y++){ if(m[y]==null)return null; f*=(1+m[y]/100);achou++; }
    return achou?f:null;
  }
  function taxaAnual(pre){
    var d0=declaracoes(pre);
    if(d0.length<2)return {n:d0.length};
    var a0=d0[0],a1=d0[d0.length-1];
    var anos=a1.ano-a0.ano;
    if(anos<=0||!a0.valor)return {n:d0.length,anos:0};
    var vezes=a1.valor/a0.valor;
    var nom=Math.pow(vezes,1/anos);
    var fi=fatorIPCA(a0.ano,a1.ano);
    var real=fi?Math.pow(vezes/fi,1/anos):null;
    return {n:d0.length,anos:anos,de:a0,ate:a1,vezes:vezes,nominal:nom,real:real,ipca:fi};
  }
  function daEquipe(pre,tier,excluiCandidato){
    var E=(D.equipes||{})[pre]||[];
    var c=CAND[pre]||{};
    return E.filter(function(x){
      if(x.tier!==tier)return false;
      if(excluiCandidato&&x.nome===c.nome)return false;
      return true;});
  }
  function cargosProprios(pre){
    var g=H[pre]; if(!g)return [];
    var nome=(CAND[pre]||{}).nome||"";
    return (g.cargos||[]).filter(function(x){
      /* o bloco pode reunir candidato e antecessor: aqui só conta o próprio */
      return !x.pessoa||x.pessoa===nome;});
  }
  function celVazia(t){var sp=el("span","vazio",t||TR("cmp-naoreg"));return sp;}

  var LINHAS=[
   {rot:"Idade hoje",
    dica:"Calculada a partir da data de nascimento, na data em que a página é aberta.",
    faz:function(pre){
      var B=BIOS[pre]||{}, nas=(B.nascimento||{}).data;
      var n=nas?idadeEm(nas,new Date()):null;
      if(n===null)return celVazia();
      var w=document.createDocumentFragment();
      w.appendChild(el("span","num",n+TR("cmp-anos")));
      w.appendChild(el("span","sub",(B.nascimento||{}).data?fmtData(B.nascimento.data):""));
      return w;}},
   {rot:"Onde nasceu",
    faz:function(pre){
      var l=((BIOS[pre]||{}).nascimento||{}).local;
      return l?document.createTextNode(l):celVazia();}},
   {rot:"Partido em 2026",
    faz:function(pre){return document.createTextNode((CAND[pre]||{}).partido||"—");}},
   {rot:"Vice na chapa",
    dica:"Candidato a vice-presidente registrado com a candidatura no TSE. É registro oficial, não anúncio de campanha: a chapa é o que foi efetivamente levado a registro.",
    faz:function(pre){
      var v=daEquipe(pre,"chapa",true);
      if(!v.length)return celVazia(TR("cmp-semvice"));
      var w=document.createDocumentFragment();
      v.forEach(function(x){
        w.appendChild(el("span","num",x.nome));
        if(x.obs)w.appendChild(el("span","sub",x.obs));});
      return w;}},
   {rot:"Presidente do partido",
    dica:"Quem preside nacionalmente a legenda pela qual a candidatura concorre, conforme o registro do partido no TSE. Em quatro casos a mesma pessoa acumula duas funções — inclusive dois candidatos que presidem o próprio partido.",
    faz:function(pre){
      var v=daEquipe(pre,"partido",false);
      if(!v.length){
        /* quando quem preside é o próprio candidato ou o vice, a linha está na camada da chapa */
        var naChapa=((D.equipes||{})[pre]||[]).filter(function(x){return /presidente nacional|national president/i.test(x.papel||"");});
        if(naChapa.length){
          var w2=document.createDocumentFragment();
          naChapa.forEach(function(x){
            w2.appendChild(el("span","num",x.nome));
            w2.appendChild(el("span","sub",x.papel||""));});
          return w2;}
        return celVazia();}
      var w=document.createDocumentFragment();
      v.forEach(function(x){
        w.appendChild(el("span","num",x.nome));
        w.appendChild(el("span","sub",x.papel||""));});
      return w;}},
   {rot:"Filiações partidárias registradas",
    dica:"Quantas legendas diferentes aparecem na trajetória, com a primeira delas. Trocar de partido não é irregularidade; a contagem mede trajetória, não conduta.",
    faz:function(pre){
      var f=(BIOS[pre]||{}).filiacoes||[];
      if(!f.length)return celVazia();
      var ord=f.slice().sort(function(a,b){return String(a.de).localeCompare(String(b.de));});
      var w=document.createDocumentFragment();
      w.appendChild(el("span","num",String(f.length)));
      var p0=ord[0];
      w.appendChild(el("span","sub",TR("cmp-desde")+(String(p0.de||"").split("-")[0]||"?")+TR("cmp-comecando")+(p0.partido||"?")));
      return w;}},
   {rot:"Formação registrada",
    dica:"Cursos que as fontes consultadas registram. Ausência aqui significa que nenhuma fonte pública lida trouxe formação, não que a pessoa não tenha estudado.",
    faz:function(pre){
      var f=(BIOS[pre]||{}).formacao||[];
      if(!f.length)return celVazia(TR("cmp-semform"));
      var ul=el("ul","lista");
      f.forEach(function(x){ul.appendChild(el("li",null,(x.curso||"")+(x.instituicao?" — "+x.instituicao:"")));});
      return ul;}},
   {rot:"Cargos públicos exercidos",
    dica:"Só os cargos da própria pessoa: quando o bloco reúne candidato e antecessor do mesmo grupo, os do antecessor não entram aqui. Zero significa nunca ter ocupado cargo público eletivo ou executivo, pelas fontes lidas.",
    faz:function(pre){
      var c=cargosProprios(pre);
      var w=document.createDocumentFragment();
      w.appendChild(el("span","num",String(c.length)));
      if(!c.length){w.appendChild(el("span","sub",TR("cmp-semcargo")));return w;}
      var ul=el("ul","lista");
      c.slice().sort(function(a,b){return String(a.inicio).localeCompare(String(b.inicio));})
       .forEach(function(x){ul.appendChild(el("li",null,(x.cargo||"")+" ("+periodo(x.inicio,x.fim)+")"));});
      w.appendChild(ul);
      return w;}},
   {rot:"Registros de atividade privada",
    dica:"Trabalhos fora do setor público que as fontes registram. A contagem depende do quanto a trajetória de cada pessoa foi documentada.",
    faz:function(pre){
      var pf=(BIOS[pre]||{}).profissional||[];
      var w=document.createDocumentFragment();
      w.appendChild(el("span","num",String(pf.length)));
      if(pf.length)w.appendChild(el("span","sub",(pf[pf.length-1].atividade||"").slice(0,90)));
      return w;}},
   {rot:"Último patrimônio declarado",
    dica:"Valor que a própria pessoa declarou à Justiça Eleitoral ao registrar candidatura. É autodeclaração, não apuração fiscal, e o ano varia entre as candidaturas — comparar valores de anos diferentes compara moedas diferentes.",
    faz:function(pre){
      var d0=declaracoes(pre);
      if(!d0.length)return celVazia(TR("cmp-semdecl"));
      var u=d0[d0.length-1];
      var w=document.createDocumentFragment();
      w.appendChild(el("span","num",moeda(u.valor)));
      w.appendChild(el("span","sub",TR("cmp-em")+u.ano+(u.cargo?TR("cmp-comocand")+u.cargo:"")));
      return w;}},
   {rot:"Primeira declaração registrada",
    dica:"A declaração mais antiga que esta coleta localizou. Não é necessariamente a primeira da vida da pessoa: depende de quando ela concorreu pela primeira vez e do que está publicado.",
    faz:function(pre){
      var d0=declaracoes(pre);
      if(!d0.length)return celVazia(TR("cmp-semdecl"));
      var u=d0[0];
      var w=document.createDocumentFragment();
      w.appendChild(el("span","num",moeda(u.valor)));
      w.appendChild(el("span","sub",TR("cmp-em")+u.ano));
      return w;}},
   {rot:"Quanto o patrimônio se multiplicou por ano",
    dica:"Média geométrica entre a primeira e a última declaração: quantas vezes o valor se multiplicou a cada ano, em média. Não é média simples — 2× num ano e 1× no seguinte dá 1,41× ao ano, não 1,5×. O número nominal usa os valores como declarados; o número real desconta a inflação do período pelo IPCA acumulado, e é ele que diz se houve ganho de fato. Este site calcula os dois a partir das declarações e do IPCA publicados; nenhum órgão os publica prontos. Quem tem uma única declaração não tem taxa — não há dois pontos para comparar, e isso não é omissão.",
    faz:function(pre){
      var t=taxaAnual(pre);
      if(!t.n)return celVazia(TR("cmp-semdecl"));
      if(t.n<2||!t.anos)return celVazia(TR("cmp-umadecl"));
      var w=document.createDocumentFragment();
      w.appendChild(el("span","num",dec(t.nominal.toFixed(2))+TR("cmp-vezesano")));
      var sub=TR("cmp-nominalde")+t.de.ano+TR("cmp-ate")+t.ate.ano+" ("+t.anos+TR("cmp-anosp")+")";
      if(t.real)sub+=TR("cmp-descinfl")+dec(t.real.toFixed(2))+TR("cmp-vezesano");
      w.appendChild(el("span","sub",sub));
      return w;}},
   {rot:"Processos judiciais listados",
    dica:"O tamanho da lista NÃO mede conduta: mede tempo de vida pública, cargo e foro. Quem tem foro em tribunal superior aparece; quem responde numa vara comum, não. Ninguém é culpado enquanto não houver trânsito em julgado.",
    faz:function(pre){
      var P=(PROC.pessoas||{})[pre]||{};
      var L=P.processos||[];
      var w=document.createDocumentFragment();
      w.appendChild(el("span","num",String(L.length)));
      if(!L.length){w.appendChild(el("span","sub",TR("cmp-semproc")));return w;}
      var st={};L.forEach(function(x){var k=x.status||"sem status";st[k]=(st[k]||0)+1;});
      var ul=el("ul","lista");
      Object.keys(st).sort().forEach(function(k){ul.appendChild(el("li",null,st[k]+" · "+k));});
      w.appendChild(ul);
      return w;}}
  ];

  function fmtData(iso){
    var p=String(iso||"").split("-");
    if(p.length!==3)return iso;
    /* dd/mm/aaaa em português, mm/dd/aaaa em inglês */
    return ENUS?(p[1]+"/"+p[2]+"/"+p[0]):(p[2]+"/"+p[1]+"/"+p[0]);
  }

  function pintaComp(){
    var host=document.getElementById("cv-comp"); if(!host)return;
    host.textContent="";

    var av=el("div","card pad note flag");
    av.appendChild(el("h3",null,"O que este quadro compara — e o que ele não compara"));
    av.appendChild(el("p",null,"Só entram aqui campos que existem para as oito candidaturas com o mesmo significado. "+
      "Onde o dado não existe, a célula diz isso: ausência é informação, e preencher com zero fingiria uma equivalência que não há."));
    av.appendChild(el("p",null,"Nenhuma linha é nota, e nenhuma coluna vence. Não há soma, média nem ranking — "+
      "os campos medem coisas diferentes, em unidades diferentes, e somá-los produziria um número sem significado. "+
      "Cada linha traz, no próprio rótulo, o que ela mede e o que ela não permite concluir."));
    av.appendChild(el("p",null,"Duas linhas pedem cuidado redobrado. O patrimônio é AUTODECLARAÇÃO à Justiça Eleitoral, "+
      "não apuração fiscal, e o ano da última declaração muda de candidatura para candidatura — comparar dois valores brutos de anos "+
      "diferentes é comparar moedas diferentes. É por isso que o quadro não traz a variação percentual crua que "+
      "costuma circular, e traz no lugar a multiplicação média por ano, com e sem a inflação do período descontada: "+
      "normalizada pelo tempo e pelo IPCA, ela é a única forma comparável entre candidaturas que declararam em "+
      "anos diferentes. O cálculo é deste site, a partir de dados publicados, e está explicado na própria linha. "+
      "E a quantidade de processos mede exposição pública e foro, não conduta: quem tem foro em tribunal superior tem "+
      "processo publicado, quem responde numa vara comum não aparece aqui."));
    host.appendChild(av);

    var ctl=el("div","uf-linha");ctl.style.margin="4px 0 2px";
    ctl.appendChild(el("span","uf-rot","Quem entra"));
    var bt=el("button","chip-cat"+(cmpSel.length===D.candidatos.length?" on":""),"Todos");bt.type="button";
    bt.addEventListener("click",function(){cmpSel=D.candidatos.map(function(c){return c.pre;});pintaComp();});
    ctl.appendChild(bt);
    D.candidatos.forEach(function(c){
      var on=cmpSel.indexOf(c.pre)>=0;
      var b=el("button","chip-cat"+(on?" on":""));b.type="button";
      b.setAttribute("aria-pressed",on?"true":"false");
      var sw=el("span","dot5");pintaFundo(sw,c.cor);b.appendChild(sw);
      b.appendChild(document.createTextNode(c.nome));
      b.addEventListener("click",function(){
        var i=cmpSel.indexOf(c.pre);
        if(i>=0){if(cmpSel.length>1)cmpSel.splice(i,1);}
        else cmpSel.push(c.pre);
        pintaComp();});
      ctl.appendChild(b);});
    host.appendChild(ctl);

    var sh=el("div","sec-h");sh.style.marginTop="18px";
    var h2=el("h2",null,"Comparação lado a lado");h2.style.fontSize="20px";sh.appendChild(h2);
    host.appendChild(sh);
    host.appendChild(el("p","sec-n",cmpSel.length+TR("cmp-de")+D.candidatos.length+TR("cmp-noquadro")));

    var ordem=D.candidatos.filter(function(c){return cmpSel.indexOf(c.pre)>=0;});
    var t=el("table","cmp-t");
    var th=el("thead"),hr=el("tr");
    hr.appendChild(el("th",null,""));
    ordem.forEach(function(c){
      var h=el("th");
      var sw=el("span","sw");pintaFundo(sw,c.cor);h.appendChild(sw);
      h.appendChild(document.createTextNode(c.nome));
      h.appendChild(el("span","cmp-rot"," · "+c.partido));
      h.scope="col";
      hr.appendChild(h);});
    th.appendChild(hr);t.appendChild(th);
    var tb=el("tbody");
    LINHAS.forEach(function(L){
      var tr=el("tr");
      var rh=el("th");
      rh.appendChild(document.createTextNode(L.rot));
      if(L.dica){var i=el("span","ii");i.textContent="ⓘ";comTip(i,TR(L.dica));rh.appendChild(i);}
      tr.appendChild(rh);
      ordem.forEach(function(c){
        var td=el("td");
        var v=L.faz(c.pre);
        if(v)td.appendChild(v);
        tr.appendChild(td);});
      tb.appendChild(tr);});
    t.appendChild(tb);
    /* com poucas candidaturas o quadro ocupa a largura toda; com muitas,
       cada coluna guarda o seu espaço e o container rola */
    t.style.minWidth=(190+ordem.length*200)+"px";
    var tw=el("div","tw cmp-box");tw.appendChild(t);tw.dataset.dica="1";
    var env=el("div","cmp-env");env.appendChild(tw);
    /* o aviso só aparece quando o quadro REALMENTE não cabe, e aparece ANTES
       dele: depois da tabela, ninguém lê a tempo de saber que dá para rolar */
    var mais=el("div","cmp-mais");mais.hidden=true;
    mais.innerHTML='<svg viewBox="0 0 22 12" width="22" height="12" aria-hidden="true">'+
      '<path d="M1 6h20M16 1.5 20.5 6 16 10.5M6 1.5 1.5 6 6 10.5" fill="none" stroke="currentColor" '+
      'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    mais.appendChild(document.createTextNode(
      "O quadro é mais largo que a tela: role para o lado para ver as outras candidaturas."));
    host.appendChild(mais);
    host.appendChild(env);
    function mede(){
      var sobra=tw.scrollWidth-tw.clientWidth;
      mais.hidden=(sobra<8);
      env.classList.toggle("temmais",sobra>8&&tw.scrollLeft<sobra-8);
    }
    tw.addEventListener("scroll",mede);
    addEventListener("resize",mede);
    setTimeout(mede,60);setTimeout(mede,400);

    /* botões de CSV/PNG na hora, e marca a tabela para o varredor não duplicar */
    t.dataset.dl="1";
    if(window.DL){
      var hb=el("div");host.appendChild(hb);
      window.DL.botoesDL(hb,{semAviso:true,nome:"curriculo-comparacao",titulo:"Comparação lado a lado",
        sub:ordem.map(function(c){return c.nome;}).join(" · "),textoCortado:true,
        fonte:"Aba Currículo deste site · cada dado tem fonte própria na ficha de cada candidatura",
        linhas:function(){return window.DL.linhasDeTabela(t);}});
    }
    host.appendChild(el("p","sec-n","Cada número aqui tem fonte declarada na ficha individual da candidatura. "+
      "Para ver de onde veio, volte ao modo Ficha individual e abra a candidatura."));
  }

  (function(){
    var mb=document.getElementById("cv-modo");if(!mb)return;
    var fic=document.getElementById("cv-ficha"), cmp=document.getElementById("cv-comp");
    var modo="ficha";
    [["ficha","Ficha individual"],["comparar","Comparar candidaturas"]].forEach(function(o){
      var b=document.createElement("button");b.type="button";b.setAttribute("role","tab");
      b.dataset.m=o[0];b.textContent=o[1];
      b.setAttribute("aria-selected",modo===o[0]?"true":"false");
      b.addEventListener("click",function(){
        modo=o[0];
        [].forEach.call(mb.children,function(x){x.setAttribute("aria-selected",x.dataset.m===modo?"true":"false");});
        fic.hidden=(modo!=="ficha");cmp.hidden=(modo!=="comparar");
        if(modo==="comparar")pintaComp();
        try{traduzDOM(document.body);}catch(e){}
      });
      mb.appendChild(b);});
  })();

  if(gsel.children.length){gAtual=gsel.children[0].dataset.g;pintaG();}
})();

/* ---------- ancoragem dos ícones de informação ---------- */
(function(){
  // títulos de seção
  [["#inicio h2","panorama"]].forEach(function(){});
  var pares=[
    ["Panorama","panorama"],["Grau de especificidade","especificidade"],
    ["O que os documentos costumam declarar","dimensoes"],
    ["Citações por macrotema","panorama"],
    ["As citações, macrotema por macrotema","citacao"],
    ["Perfil de cada documento","nivelmedio"],
    ["O que é uma citação","citacao"],
    ["Controle de viés — o teste que este estudo aplica em si mesmo","vies"],
    ["Montar o recorte","recorte"],
    ["2 · Resultado","recorte"],
    ["Toda citação desta página foi conferida contra o PDF","conferida"],
    ["O que esta versão garante","conferida"]
  ];
  var alvos=[].slice.call(document.querySelectorAll("h1,h2,h3,h4"));
  pares.forEach(function(p){
    for(var i=0;i<alvos.length;i++){
      if(alvos[i].textContent.trim()===p[0] && !alvos[i].querySelector(".i")){
        alvos[i].appendChild(info(p[1]));break;}}
  });
  // rótulos da faixa de números
  var figMap={"Citações":"citacao","Citações conferidas por script":"conferida",
              "Ausências declaradas":"ausencia","Macrotemas":"macrotema"};
  [].forEach.call(document.querySelectorAll("#figs .fig"),function(f){
    var k=figMap[f.querySelector("span").textContent];
    if(k) f.querySelector("span").appendChild(info(k));
  });
  // cabeçalhos de tabela
  function thInfo(tabela,texto,k){
    var t=document.getElementById(tabela);if(!t)return;
    [].forEach.call(t.querySelectorAll("thead th"),function(th){
      if(th.childNodes[0] && th.childNodes[0].nodeValue && th.childNodes[0].nodeValue.trim()===texto && !th.querySelector(".i"))
        th.insertBefore(info(k), th.querySelector(".ch"));
    });
  }
  thInfo("perfil","Nível médio","nivelmedio");
  thInfo("perfil","Propostas","proposta");
  thInfo("perfil","Diretrizes","proposta");
  thInfo("perfil","Citações","citacao");
  thInfo("vies","Nível médio","nivelmedio");
  thInfo("vies","Custo","custo");
  thInfo("vies","Prazo","prazo");
  thInfo("vies","% propostas","proposta");
  thInfo("docs","Citações","citacao");
  // legenda de níveis
  var lv=document.getElementById("lvleg");
  if(lv) lv.appendChild(info("especificidade"));
  // rótulos da barra de filtros
  [["lb-fam","macrotema"],["lb-tipo","proposta"],["lb-nivel","especificidade"]].forEach(function(p){
    var n=document.getElementById(p[0]); if(n&&!n.querySelector(".i")) n.appendChild(info(p[1]));});
})();

/* ---------- glossário ---------- */
(function(){
  var GL=window.__GLOS__; if(!GL||!GL.length) return;
  var lista=document.getElementById("gl-lista"),
      busca=document.getElementById("gl-busca"),
      cnt=document.getElementById("gl-cnt");
  var tipos={}; GL.forEach(function(o){tipos[o.tipo]=(tipos[o.tipo]||0)+1;});
  var msT=multi("ms-gl",
    Object.keys(tipos).sort().map(function(t){return {v:t,r:t,n:tipos[t]};}),"tipos",function(){pinta();});
  function norm(t){return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");}
  function pinta(){
    var q=norm(busca.value.trim()), tv=msT.vals();
    var achou=GL.filter(function(o){
      if(tv.length && tv.indexOf(o.tipo)<0) return false;
      if(!q) return true;
      return norm(o.t).indexOf(q)>=0 || norm(o.d).indexOf(q)>=0 || norm(o.ex||"").indexOf(q)>=0;
    });
    cnt.textContent=achou.length+(achou.length===1?" verbete de ":" verbetes de ")+GL.length;
    lista.textContent="";
    if(!achou.length){
      pintaAlfa([]);
      lista.appendChild(el("p","gl-vazio","Nenhum verbete com esse texto. Tente parte da palavra."));
      return;}
    var porL={},ordem=[];
    achou.forEach(function(o){
      var L=norm(o.t).charAt(0).toUpperCase();
      if(!/[A-Z]/.test(L))L="#";
      if(!porL[L]){porL[L]=[];ordem.push(L);}
      porL[L].push(o);});
    ordem.sort();
    pintaAlfa(ordem);
    ordem.forEach(function(L){
      var g=el("div","gl-grupo");
      g.id="gl-"+L;g.style.scrollMarginTop="112px";
      g.appendChild(el("div","gl-letra",L));
      porL[L].forEach(function(o){
        var it=el("div","gl-item");
        var t=el("div","gl-t");
        t.appendChild(document.createTextNode(o.t));
        t.appendChild(el("span","gl-tipo",o.tipo));
        it.appendChild(t);
        var d=el("div","gl-d");
        d.appendChild(document.createTextNode(o.d));
        if(o.ex)d.appendChild(el("span","gl-ex",o.ex));
        it.appendChild(d);
        g.appendChild(it);});
      lista.appendChild(g);});
  }
  var alfa=document.getElementById("gl-alfa");
  function pintaAlfa(presentes){
    alfa.textContent="";
    var LETRAS="ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    LETRAS.forEach(function(L){
      var tem=presentes.indexOf(L)>=0;
      var b=el("button","alfa-l"+(tem?"":" off"),L);
      b.type="button";
      if(!tem){b.disabled=true;b.title="nenhum verbete com esta letra no recorte atual";}
      else b.addEventListener("click",function(){
        var alvo=document.getElementById("gl-"+L);
        if(alvo)alvo.scrollIntoView({behavior:"smooth",block:"start"});});
      alfa.appendChild(b);});
    var t=el("button","alfa-topo","↑ topo");t.type="button";
    t.addEventListener("click",function(){window.scrollTo({top:0,behavior:"smooth"});});
    alfa.appendChild(t);
  }
  function dlGloss(){
    if(!window.DL)return;
    var host=document.getElementById("gl-dl");
    if(!host){host=el("div");host.id="gl-dl";
      lista.parentNode.insertBefore(host,lista);}
    host.textContent="";
    var itens=[].slice.call(lista.querySelectorAll(".gl-item"));
    window.DL.botoesDL(host,{
      nome:"glossario",titulo:"Glossário",
      sub:itens.length+" verbete(s) no recorte atual",
      fonte:"Definições redigidas para este site; siglas e termos conferidos nas fontes citadas em cada aba",
      textoCortado:true,
      linhas:function(){
        var R=[["termo","tipo","definicao"]];
        [].forEach.call(lista.querySelectorAll(".gl-item"),function(it){
          var t=it.querySelector(".gl-t"),tp=it.querySelector(".gl-tipo"),d=it.querySelector(".gl-d");
          var termo=t?t.textContent.replace(/\s+/g," ").trim():"";
          var tipo=tp?tp.textContent.replace(/\s+/g," ").trim():"";
          if(tipo&&termo.slice(-tipo.length)===tipo)termo=termo.slice(0,-tipo.length).trim();
          R.push([termo,tipo,d?d.textContent.replace(/\s+/g," ").trim():""]);});
        return R;}
    });
  }
  var pintaOrig=pinta;
  pinta=function(){pintaOrig();dlGloss();};
  busca.addEventListener("input",pinta);
  document.getElementById("gl-limpar").addEventListener("click",function(){
    busca.value="";msT.limpar();pinta();});
  pinta();
})();

/* ---------- ponte para os blocos de apoio (AssistONE, menu ☰, compartilhar) ----------
   Só o que eles precisam; o resto continua privado. */
window.PG={
  VIEWS:VIEWS, D:D, MACRO:MACRO, CAND:CAND, TR:TR, el:el, IDIOMA:IDIOMA,
  prefs:function(){return PREFS;}, grava:gravaPrefs,
  abreConfig:abreConfig, repintaConfig:pintaPainelOC,
  temaAtual:temaAtual, escuroAgora:escuroAgora, aplicaTema:aplicaTema,
  vaiParaIdioma:vaiParaIdioma, mtAtual:function(){return mtAtual;},
  abreGloss:abreGloss, abreDoc:abreDoc, traduz:traduzDOM,
  escreveVer:function(){if(window.escreveVer)window.escreveVer();},
  repintaIG:function(){if(window.repintaIG)window.repintaIG();}
};
try{dispatchEvent(new Event("pg-pronto"));}catch(e){}
marca();render();pintaTudo();rota();
})();
