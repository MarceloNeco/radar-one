/* app.js: a ordem em que o site carrega (F1-PR3). Um módulo de cada vez, cada um esperando o anterior,
   na mesma ordem dos <script> de hoje; no F1-PR2 o dados.js passa a esperar um fetch e nada aqui muda.
   Nenhum módulo exporta nada: o que cruza entre eles é só window.X (docs/modulos-contrato.md). */
await import('./calendario.js');          // 1 calendário eleitoral + 2 colinhaOff
await import('./janelas.js');             // 3 EJ
await import('./dados.js');               // 4 blocos JSON
await import('./principal.js');           // 5 PG e os infográficos
await import('./voz.js');                 // 6 VozLeitor, VozPainel
await import('./apoio.js');               // 7 CfgAcess, CfgAssist, PGShare
await import('./rotas.js');               // 7b shell: quatro destinos e histórico por camada (F1-PR5)
await import('./saiba.js');               // 7c o ⓘ que abre a explicação (F1-PR5c)
await import('./eleicoes/congresso.js');  // 8 CongressoV2
await import('./eleicoes/colinha.js');    // 9 Colinha
