# dados/ — os dados do site, fora do HTML

A partir do **F1-PR2** os 8 blocos JSON que hoje moram dentro do `index.html` (`traden`, `dados`, `ig`, `bio`, `glos`,
`patr`, `dlinks`, `proc`) passam para cá: `dados/<bloco>.json` em português e `dados/en/<bloco>.json` para o que muda em
inglês. O site carrega com `fetch` (rede primeiro, 4 s, cópia guardada como reserva), igual ao `recursos.js`.

Regras:

- O `dados/ig.json` tem de ter o **mesmo sha256** do bloco antigo: é assim que o harness de paridade prova que nada mudou.
- Depois da F2, os robôs do repositório `radar-one-dados` publicam os snapshots e o site passa a ler de lá; o que não tem
  API (acervo manual e editorial) continua aqui. **Nunca editar à mão** o que um robô gera.
- Nenhum dado de pessoa, nenhuma chave, nenhum segredo: tudo aqui é público.

Até o PR2 esta pasta fica vazia (só este arquivo).
