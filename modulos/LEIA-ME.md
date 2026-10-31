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

Até o PR3 esta pasta fica vazia (só este arquivo).
