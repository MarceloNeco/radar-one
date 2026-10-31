/* janelas.js: as janelas do site sobre a janela comum, EJ (bloco 3)
   Movido como está do index.html 2.5.4 no F1-PR3 (31/10/2026): mesmo código, mesmos nomes; o que sai daqui para fora é só window.X (ver docs/modulos-contrato.md). */
/* janelas do site sobre a janela comum (janela.js): a caixa de cada janela continua sendo a que já existia;
   aqui ela só vira o conteúdo de uma SolverJanela (rolagem de trás travada, ✕/Esc/Voltar/toque fora, "Descartar?", uma por vez) */
window.EJ=(function(){
  var SJ=window.SolverJanela;
  function en(){return (document.documentElement.getAttribute("lang")||"").toLowerCase().indexOf("en")===0;}
  function T(p,e){return en()?e:p;}
  function no(tag,cls,txt){var n=document.createElement(tag);if(cls)n.className=cls;if(txt!=null)n.textContent=txt;return n;}
  /* caixa = o elemento que já existe; volta para onde morava (escondida) quando a janela fecha.
     o: classe, rotulo, focar, temTexto, porCima, papel, descarta (a caixa some ao fechar), aoFechar(motivo, como) */
  function abre(caixa,o){
    o=o||{};
    if(caixa.__ej)return caixa.__ej;
    var casa=caixa.parentNode,prox=caixa.nextSibling;
    caixa.hidden=false;caixa.classList.add("ej-caixa");
    var J=SJ.abrir({conteudo:caixa,classe:"ej-fundo"+(o.classe?" "+o.classe:""),rotulo:o.rotulo,focar:o.focar,temTexto:o.temTexto,porCima:o.porCima,papel:o.papel,
      aoFechar:function(motivo,como){
        caixa.__ej=null;
        if(o.descarta){if(caixa.parentNode)caixa.parentNode.removeChild(caixa);}
        else{caixa.hidden=true;if(casa&&casa.isConnected)casa.insertBefore(caixa,prox&&prox.parentNode===casa?prox:null);}
        if(o.aoFechar)o.aoFechar(motivo,como);
      }});
    caixa.__ej=J;
    return J;
  }
  function fecha(caixa){if(caixa&&caixa.__ej)caixa.__ej.fechar("fechar");}
  /* menu preso a um botão (idioma, seleção múltipla, compartilhar, Presidência/Congresso): mesma janela, sem escurecer a tela */
  function pop(botao,menu,o){
    o=o||{};
    if(menu.__ej)return menu.__ej;
    var r=botao.getBoundingClientRect(),L=document.documentElement.clientWidth,A=window.innerHeight,css=menu.getAttribute("style");
    var abaixo=A-r.bottom-8,acima=r.top-8,emCima=abaixo<200&&acima>abaixo,e=[];
    e.push("position:absolute","max-height:"+Math.max(120,Math.min(emCima?acima:abaixo,o.altura||320))+"px","overflow:auto");
    e.push(emCima?"bottom:"+(A-r.top+5)+"px":"top:"+(r.bottom+5)+"px");
    if(o.lado==="direita")e.push("right:"+Math.max(8,L-r.right)+"px","left:auto");
    else e.push("left:"+Math.max(8,Math.min(r.left,L-260))+"px","right:auto");
    menu.style.cssText=(css?css+";":"")+e.join(";");
    botao.setAttribute("aria-expanded","true");
    /* menus presos a um botão nunca perguntam "Descartar?": a busca de dentro deles (seleção múltipla) não é texto a perder */
    return abre(menu,{classe:"ej-livre",temTexto:false,rotulo:o.rotulo||botao.getAttribute("aria-label")||botao.textContent,focar:o.focar,
      aoFechar:function(m,c){
        if(css===null)menu.removeAttribute("style");else menu.setAttribute("style",css);
        botao.setAttribute("aria-expanded","false");
        if(o.aoFechar)o.aoFechar(m,c);}});
  }
  /* no lugar do confirm()/alert(): confirmação curta por cima de qualquer janela aberta (fecha junto com ela) */
  function curta(txt,botoes,fim){
    var caixa=no("div","ej-caixa ej-conf"),foco=null,J=null;
    caixa.appendChild(no("p",null,txt));
    var bs=no("div","ej-conf-b");caixa.appendChild(bs);
    botoes.forEach(function(b){var x=no("button","ej-b"+(b.sim?"":" ej-b2"),b.t);x.type="button";
      x.addEventListener("click",function(){J.fechar(b.sim?"sim":"nao");});bs.appendChild(x);
      if(!foco||!b.sim)foco=x;});
    J=SJ.abrir({conteudo:caixa,classe:"ej-fundo",papel:"alertdialog",porCima:true,temTexto:false,rotulo:txt,focar:foco,
      aoFechar:function(m){caixa.remove();if(fim)fim(m==="sim");}});
    return J;
  }
  function confirma(txt,sim,aoConfirmar,aoCancelar){
    return curta(txt,[{t:T("Cancelar","Cancel")},{t:sim||T("Sim","Yes"),sim:true}],function(ok){if(ok){if(aoConfirmar)aoConfirmar();}else if(aoCancelar)aoCancelar();});
  }
  function aviso(txt){return curta(txt,[{t:"OK",sim:true}]);}
  /* abrir uma janela a partir de outra (ex.: a ajuda dentro das Configurações): nada empilha, então a de baixo fecha,
     a nova abre e, quando a nova fecha, a primeira volta (voltar = função que reabre a primeira) */
  function aPartirDe(caixa,abrirOutra,voltar){
    if(!(caixa&&caixa.__ej)){abrirOutra(null);return;}
    fecha(caixa);
    quando(function(){abrirOutra(voltar);});
  }
  /* roda depois que o histórico acompanhou o fechar (trocar de tela logo depois de fechar uma janela) */
  function quando(fn){if(SJ&&SJ.quandoQuieto)SJ.quandoQuieto(fn);else fn();}
  function ocupada(){return !!(SJ&&(SJ.aberta()||SJ.esperando()));}
  return {abre:abre,fecha:fecha,pop:pop,confirma:confirma,aviso:aviso,aPartirDe:aPartirDe,quando:quando,ocupada:ocupada};
})();
