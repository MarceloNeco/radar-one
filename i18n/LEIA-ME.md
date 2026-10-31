# i18n/ — o dicionário PT → EN

A partir do **F1-PR4** o bloco `traden` do `index.html` vira `i18n/en.json`; `traduzDOM` lê dele e o idioma vem da
preferência comum da SolverONE (`dgo:global:idioma`) ou de `?lang=en`. O `index-en.html` passa a ser só um redirecionamento
interno (`./?lang=en`, mantendo o `#`) e o `sincroniza-en.py` deixa de existir.

Regras:

- Todo texto novo nasce nas duas línguas; o teste "en.json cobre 100% das chaves" é o gate do PR4.
- Datas: PT `17/Set/2026` · EN `Sep/17/2026` (formato comum da plataforma).

Até o PR4 esta pasta fica vazia (só este arquivo).
