# dados/ — os dados do site, fora do HTML

A partir do **F1-PR2** os 8 blocos JSON que hoje moram dentro do `index.html` (`traden`, `dados`, `ig`, `bio`, `glos`,
`patr`, `dlinks`, `proc`) passam para cá: `dados/<bloco>.json` em português e `dados/en/<bloco>.json` para o que muda em
inglês. O site carrega com `fetch` (rede primeiro, 4 s, cópia guardada como reserva), igual ao `recursos.js`.

Regras:

- O `dados/ig.json` tem de ter o **mesmo sha256** do bloco antigo: é assim que o harness de paridade prova que nada mudou.
- Depois da F2, os robôs do repositório `radar-one-dados` publicam os snapshots e o site passa a ler de lá; o que não tem
  API (acervo manual e editorial) continua aqui. **Nunca editar à mão** o que um robô gera.
- Nenhum dado de pessoa, nenhuma chave, nenhum segredo: tudo aqui é público.

Feito no F1-PR2 (31/10/2026). O que há aqui:

| Arquivo | O que é | Inglês |
|---|---|---|
| `dados.json` | versão do app, candidaturas, fichas, planos, macrotemas, novidades | `en/dados.json` |
| `ig.json` | as 49 séries, os 43 gráficos, marcos, governos e dimensões dos infográficos | `en/ig.json` |
| `bio.json`, `glos.json`, `patr.json`, `dlinks.json`, `proc.json` | biografias, glossário, patrimônio, links dos documentos, processos | `en/<bloco>.json` |

Quem lê é `modulos/dados.js`: busca os sete arquivos (mais o dicionário `i18n/en.json`) (rede primeiro, com `cache: "no-cache"` para furar o cache do Pages),
guarda uma cópia no Cache Storage do aparelho (`dgo-radar-one-dados-v1`) e, se a rede falhar ou demorar mais de 4 s havendo
cópia, usa a cópia. Sem cópia e sem rede, a página avisa em PT ou EN e para. Os textos entram no DOM como
`<script id="…" type="application/json">`, do mesmo jeito que estavam no HTML, e o código antigo não muda.
Teste: `node teste/dados-offline.js`.
