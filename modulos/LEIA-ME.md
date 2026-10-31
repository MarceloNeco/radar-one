# modulos/ — o código do site, em módulos ES

A partir do **F1-PR3** o código que hoje mora nos `<script>` do `index.html` passa para cá, um arquivo por bloco de hoje,
com o **mesmo código e os mesmos nomes de função** (contrato em `docs/modulos-contrato.md`). O `index.html` carrega só
`modulos/app.js` com `type="module"`.

Regras:

- Sem framework e sem passo de build: é JavaScript puro, que o navegador lê direto (Chrome 105+, Safari 16+).
- Os arquivos mestres da SolverONE (`janela.js`, `cofre.js`, `recursos.js`) **não** entram aqui: ficam na raiz, como
  `<script>` clássicos no `<head>`, e nunca são editados à mão.
- Tudo que outro módulo ou os testes usam de um módulo fica exposto em `window.X` (lista no contrato); nada mais sai do módulo.
- Comentário explica **por quê**, em português simples. Texto para a pessoa sempre em PT e EN (`T("pt", "en")`).

Feito no F1-PR3 (31/10/2026). O que há aqui, na ordem em que o `app.js` carrega:

| Arquivo | Era (no `index.html` 2.5.4) | Expõe em `window` |
|---|---|---|
| `app.js` | novo: só a ordem de carga (um `await import` por módulo); desde o F1-PR6 o `rotas.js` entra logo depois do `calendario.js` (a capa não pisca antes de Hoje) e o módulo Eleições (8 e 9) só entra quando o interruptor `eleicoes` está ligado ou um link direto pede (`Rotas.eleicoes()`) | — |
| `calendario.js` | bloco 1 (calendário eleitoral) + bloco 2 (`colinhaOff`) | `Calendario`, `colinhaOff` |
| `janelas.js` | bloco 3 (janelas do site sobre a janela comum) | `EJ` |
| `dados.js` | bloco 4 (lê os blocos JSON que ainda ficam no HTML; vira `fetch` no PR2) | `__IG__`, `__BIO__`, `__GLOS__`, `__PATR__`, `__DLINKS__`, `__PROC__` |
| `principal.js` | bloco 5 (infográficos, comparadores, índice, planos, glossário, configurações) | `PG`, `DL`, `repintaIG`, `ancoraEm`, `escreveVer`, `pesosAtuais`, `somLigado`, `somPref`, `somVolume`, `__panCols` |
| `voz.js` | bloco 6 (leitura em voz alta, v1.7) | `VozLeitor`, `VozPainel` |
| `apoio.js` | bloco 7 (☰, compartilhar, acessibilidade, AssistONE, v1.8) | `CfgAcess`, `CfgAssist`, `PGShare` |
| `saiba.js` | novo no F1-PR5c: o ⓘ que abre a explicação completa pela janela comum (`EJ.pop`); "Entendi", Esc e Voltar fecham | — |
| `rotas.js` | novo no F1-PR5: o shell com os quatro destinos (Hoje · Explorar · Indicadores · Salvos), a barra, o histórico por camada e o aviso do Voltar | `Rotas` |
| `eleicoes/congresso.js` | bloco 8 (hub, Congresso e Presidência, v2.0) | `CongressoV2` |
| `eleicoes/colinha.js` | bloco 9 (Colinha da eleição, v2.2) | `Colinha` |
| `eleicoes/resultado.js` | novo no F1-PR6b: a tela Resultado e apuração (votos e % por candidatura, por cargo e lugar, dos arquivos `…-u.json` do TSE, com cópia por 1 h) | `Resultado` |

Cada página declara `window.IDIOMA` numa linha antes do `app.js` (`"pt"` no `index.html`, `"en"` no `index-en.html`, trocada
pelo `sincroniza-en.py`); é a única mudança de código em relação aos blocos de antes.
