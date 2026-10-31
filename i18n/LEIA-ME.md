# i18n/ — o dicionário PT → EN

A partir do **F1-PR4** o bloco `traden` do `index.html` vira `i18n/en.json`; `traduzDOM` lê dele e o idioma vem da
preferência comum da SolverONE (`dgo:global:idioma`) ou de `?lang=en`. O `index-en.html` passa a ser só um redirecionamento
interno (`./?lang=en`, mantendo o `#`) e o `sincroniza-en.py` deixa de existir.

Regras:

- Todo texto novo nasce nas duas línguas; o teste "en.json cobre 100% das chaves" é o gate do PR4.
- Datas: PT `17/Set/2026` · EN `Sep/17/2026` (formato comum da plataforma).

Feito no F1-PR4 (31/10/2026). `en.json` é o antigo bloco `traden` (dicionário PT → EN, uma entrada por texto fixo da
interface), carregado por `modulos/dados.js` e aplicado por `traduzDOM` em `modulos/principal.js`. Como o idioma é decidido:

1. `?lang=en` ou `?lang=pt` no endereço vence (link compartilhável);
2. senão, a preferência comum da SolverONE `dgo:global:idioma` (gravada pelo seletor PT|EN; vale em todos os apps da origem);
3. senão, português.

O `index-en.html` virou só um redirecionamento para `./?lang=en` que mantém o `#`. Teste: `node teste/idioma.js` (o dicionário
cobre 100% dos textos fixos do `index.html`, fora o aviso que só existe em inglês).
