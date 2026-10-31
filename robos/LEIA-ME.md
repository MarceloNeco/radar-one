# robos/ — scripts Python que rodam no GitHub Actions (nunca no navegador)

| Arquivo | O que faz |
|---|---|
| `prototipo-ibge-bcb.py` | protótipo da onda 1 de fontes (IBGE e BCB), conferido contra o acervo em 22/10/2026 (0 diferenças); vira `robos/indicadores.py` na F2 |
| `gera-legacy-catalog.py` | gera `docs/legacy_catalog.json` e `.md` a partir do `index.html` (as 43 entradas de infográficos) |
| `gera-registro-fontes.py` | gera `docs/fontes/registro-de-fontes.json` e `.md` (173 datasets, ondas e cadência) |
| `saida/` | o que os protótipos produziram (para conferência) |

O robô do Congresso (`congresso-sync.py`, na raiz, workflow `.github/workflows/congresso-sync.yml`) continua onde está até a
F2, quando cada família de dados ganha um job próprio no repositório `radar-one-dados` (ADR 0003).

Regras: rodar sempre com `python3 -I`; nenhuma chave no código (chaves de API só nos *secrets* do repositório de dados);
cada robô é idempotente (rodar duas vezes dá o mesmo resultado).
