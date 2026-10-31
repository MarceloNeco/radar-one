# Contrato dos módulos (escrito no F1-PR1 para o F1-PR3)

Escrito em 31/10/2026, pelo Fable, a partir do `index.html` 2.5.4 (47.578 linhas). **Estado: implementado no F1-PR3 (31/10/2026)**; o `index.html` ficou com 36.856 linhas (os blocos JSON saem no PR2). Quem faz o PR3 segue isto à risca; dúvida
vira pergunta no PR, nunca decisão silenciosa. Depois do PR3 este arquivo vira a lista "o que cada módulo faz, o que não se toca"
do `ARQUITETURA.md`.

## 1. Regras do PR3

1. **Um módulo por `<script>` de hoje, com o mesmo código.** Nada de dividir, renomear, reordenar funções ou "melhorar". Dividir
   o bloco principal em `infograficos.js` e `comparadores.js` é tarefa do PR5 (quando o shell nasce), não do PR3.
2. **Nada cruza entre blocos a não ser `window.X`.** Todos os blocos já são IIFE (`(function(){ "use strict"; … })();`) ou
   `window.X = (function(){ … })()`. Virar módulo ES não muda o escopo de nada: a lista da seção 3 é o contrato inteiro.
   Cada `window.X =` continua exatamente como está; nenhum `export`/`import` entre os módulos (só o `app.js` importa, para dar a ordem).
3. **Ordem de execução preservada.** `modulos/app.js` importa os módulos na ordem da tabela, um de cada vez (regra 7). Os mestres (`janela.js`, `cofre.js`, `recursos.js`) continuam `<script>` clássicos no `<head>`, antes de tudo.
4. **Módulo roda depois do HTML inteiro ser lido** (como um script no fim do `<body>`). Hoje os blocos 1 a 3 rodam no `<head>`,
   mas nada no HTML usa `Calendario`, `EJ` ou `colinhaOff` durante a leitura da página: conferido em 31/10 (0 atributos `on…=`
   chamando esses globais; o único `<script>` do `<body>` fora dos blocos é o dos dados). Conferir de novo no PR3 com
   `grep -c 'onclick=' index.html` antes e depois.
5. **`IDIOMA` vem da página, não do arquivo.** Hoje `var IDIOMA="pt";` fica dentro do bloco principal (linha 36436) e o
   `sincroniza-en.py` troca para `"en"` ao gerar o `index-en.html`. Com o código num arquivo só para as duas páginas, cada HTML
   declara **uma linha** antes do `app.js`: `<script>window.IDIOMA="pt";</script>` (`"en"` no `index-en.html`), e o módulo
   principal passa a ter `var IDIOMA=window.IDIOMA||"pt";`. O `sincroniza-en.py` troca essa linha em vez da antiga. (Feito; o PR4 eliminou o script: o `index.html` decide `window.IDIOMA` por `?lang=` ou pela preferência comum.)
6. **`"use strict"` já vale** em módulos; o bloco principal já é estrito. Procurar `this` solto e `arguments.callee` nos outros
   blocos antes de mover (não há, mas conferir).
7. **O PR3 vem ANTES do PR2** (ordem trocada em 31/10/2026; o plano permite). Motivo: hoje os dados são lidos de forma síncrona
   (linha 36310) antes do bloco principal rodar; um `fetch` é assíncrono, e `<script>` clássico não sabe esperar. Com tudo em
   módulos, o `app.js` consegue esperar. Então: no PR3, `modulos/dados.js` é a linha 36310 como está (lê os blocos JSON que ainda
   ficam dentro do HTML); no PR2 ela vira `fetch` com `await` no topo do módulo, e nada mais muda.
   Formato do `app.js` já pensado para isso (importes dinâmicos em sequência, cada um esperando o anterior):

   ```js
   await import('./calendario.js');   // 1 e 2
   await import('./janelas.js');      // 3
   await import('./dados.js');        // 4 (no PR2 passa a esperar o fetch)
   await import('./principal.js');    // 5
   await import('./voz.js');          // 6
   await import('./apoio.js');        // 7
   await import('./eleicoes/congresso.js'); // 8
   await import('./eleicoes/colinha.js');   // 9
   ```
8. **Meta de tamanho**: `index.html` com menos de 2.000 linhas. Se não couber (o CSS tem 2.041 linhas em 6 `<style>`), os seis
   `<style>` viram `estilo.css` na raiz, na mesma ordem, sem mudar uma regra; isso conta como parte do PR3.
9. **Lint sem build**: `for f in modulos/*.js modulos/eleicoes/*.js; do node --check "$f"; done` (Node 22 reconhece módulo ES pela
   sintaxe). `eslint` só se rodar sem arquivo de configuração no repositório.

## 2. Tabela: de onde sai, para onde vai

| # | Bloco de hoje (`index.html` 2.5.4) | Linhas | Vira | Expõe em `window` | Usa de outros (só por `window`) |
|---|---|---|---|---|---|
| 2c | Migração dos dados locais (F1-PR9, ADR 0008) | — | `modulos/migracao.js` | `Migracao` | `localStorage`, `EJ` (confirmação) |
| 7d | Usar sem internet (F1-PR8): `sw.js`, selo, seção das Configurações, atalho, Samsung | — | `modulos/offline.js` | `Offline` | `caches`, `navigator.serviceWorker` |
| 1 | Calendário eleitoral (v2.5.0; F1-PR7: `modo()`, fases `pre-campanha`/`acompanhamento`, `data-fase` no `<html>`), no `<head>` | 8–160 (153) | `modulos/calendario.js` | `Calendario` | `SolverRecursos` (mestre) |
| 2 | Colinha fora do ar (`colinhaOff`) | 161–163 (3) | fim de `modulos/calendario.js` (mesma razão de ser) | `colinhaOff` | `SolverRecursos`, `Calendario` |
| 3 | Janelas do site sobre a janela comum | 164–235 (72) | `modulos/janelas.js` | `EJ` | `SolverJanela` (mestre `janela.js`) |
| 4 | Leitura dos blocos JSON | 36310 (1) | `modulos/dados.js` (feito no PR2) | `__IG__`, `__BIO__`, `__GLOS__`, `__PATR__`, `__DLINKS__`, `__PROC__` | — |
| 5 | Principal (infográficos, comparadores, índice, planos, glossário, configurações) | 36311–43967 (7.657) | `modulos/principal.js` | `PG`, `DL`, `repintaIG`, `ancoraEm`, `escreveVer`, `pesosAtuais`, `somLigado`, `somPref`, `somVolume`, `__panCols`; dispara o evento `pg-pronto` | `__IG__`…`__PROC__`, `EJ`, `colinhaOff`, `VozPainel`, `CfgAcess`, `CfgAssist`, `PGShare`, `Colinha`, `SolverRecursos` |
| 6 | Leitura em voz alta (v1.7) | 44173–45047 (875) | `modulos/voz.js` | `VozLeitor`, `VozPainel` | `PG`, `EJ`, `somVolume` |
| 7 | Apoio (v1.8): ☰, compartilhar, acessibilidade, AssistONE | 45236–45911 (676) | `modulos/apoio.js` | `CfgAcess`, `CfgAssist`, `PGShare` | `PG`, `EJ`, `Calendario`, `colinhaOff`, `VozLeitor`, `ancoraEm`, `escreveVer`, `repintaIG`, `somLigado`, `Colinha` |
| 8 | Hub + Congresso + Presidência (v2.0) | 46165–47170 (1.006) | `modulos/eleicoes/congresso.js` (a Presidência, `PM`, fica dentro; separar é tarefa de depois) | `CongressoV2` | `EJ`, `Calendario`, `Colinha` |
| 9 | Colinha da eleição (v2.2) | 47286–47576 (291) | `modulos/eleicoes/colinha.js` | `Colinha` | `EJ`, `Calendario`, `colinhaOff` |

`modulos/app.js` (novo, ~12 linhas): só os `await import(...)` na ordem 1 → 9 (regra 7) e nada mais. O `index.html` troca os nove `<script>` por
`<script type="module" src="modulos/app.js"></script>` no mesmo lugar do último bloco de hoje.

Quem usa quem foi levantado por busca de nome (31/10/2026); os blocos 5 a 9 referenciam globais de blocos posteriores só dentro de
funções chamadas depois (clique, `pg-pronto`), por isso a ordem de hoje já funciona e continua valendo.

## 3. O que os testes (as 913 verificações) dependem

- Globais: `PG.abreConfig`, `PG.abreGloss`, `PG.abreDoc`; `EJ.fecha`, `EJ.confirma`, `EJ.aviso`; `Calendario.fase`,
  `Calendario.posse`, `Calendario.padrao`; `SolverRecursos.atualizar`, `SolverRecursos.valor` (mestre).
- Evento `pg-pronto` em `window`; ids `#v-hub`, `#v-colinha`, `#v-mandato` e os demais `#v-…`; chaves `planos2026:*` e
  `dgo:eleicoes-2026:central:*` no `localStorage`.
- Os testes injetam `window.__sim`, `window.__fala` e `window.__dl` por `addInitScript` (antes de qualquer script): continua
  funcionando com módulos.
- `teste/rodar.js` confere que o `index-en.html` é exatamente o que o `sincroniza-en.py` gera: o script tem de continuar
  funcionando depois do PR3 (regra 5).

## 4. Prova do PR3

913 verificações (`node teste/rodar.js`); paridade 0 (`node teste/paridade.js capturar antes --raiz <cópia da main>` e
`capturar depois` na branch, `comparar antes depois`); `node --check` em todos os módulos; `wc -l index.html` < 2.000, com o
número no texto do PR.
