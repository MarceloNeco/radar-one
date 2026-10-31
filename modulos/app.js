/* app.js: a ordem em que o site carrega (F1-PR3). Um módulo de cada vez, cada um esperando o anterior,
   na mesma ordem dos <script> de hoje; no F1-PR2 o dados.js passa a esperar um fetch e nada aqui muda.
   Nenhum módulo exporta nada: o que cruza entre eles é só window.X (docs/modulos-contrato.md). */
await import('./calendario.js');          // 1 calendário eleitoral + 2 colinhaOff
await import('./rotas.js');               // 2b shell: quatro destinos e histórico por camada (F1-PR5); antes do principal.js para a capa não piscar antes de Hoje (F1-PR6)
await import('./migracao.js');            // 2c migração dos dados locais planos2026:* → radar-one:* (F1-PR9, ADR 0008); antes de quem lê
await import('./janelas.js');             // 3 EJ
await import('./dados.js');               // 4 blocos JSON
await import('./principal.js');           // 5 PG e os infográficos
await import('./voz.js');                 // 6 VozLeitor, VozPainel
await import('./apoio.js');               // 7 CfgAcess, CfgAssist, PGShare
await import('./saiba.js');               // 7c o ⓘ que abre a explicação (F1-PR5c)
await import('./offline.js');             // 7d usar sem internet e atalho na tela inicial (F1-PR8): sw.js, selo, Configurações
/* F1-PR6: o módulo Eleições (8 CongressoV2 e 9 Colinha) só carrega quando o interruptor "eleicoes" do RootifyONE está
   ligado (padrão) ou quando um link direto pede uma tela da eleição; Rotas.eleicoes() carrega uma vez só, sob demanda.
   Os ouvintes ficam aqui, depois da base, porque o módulo depende de PG e EJ */
addEventListener('hashchange', () => { if (Rotas.rotaEleitoral()) Rotas.eleicoes(); });
if (window.SolverRecursos) SolverRecursos.aoMudar(() => { if (Rotas.eleicoesLigado() && Rotas.rotaEleitoral()) Rotas.eleicoes(); });
if (window.Calendario) Calendario.aoMudar(() => { if (Rotas.eleicoesLigado() && Rotas.rotaEleitoral()) Rotas.eleicoes(); });   // F1-PR7: a fase mudou com a página aberta
if (Rotas.eleicoesLigado() || Rotas.rotaEleitoral()) await Rotas.eleicoes();
