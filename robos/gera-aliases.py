#!/usr/bin/env python3
"""Gera dados/aliases.json (ADR 0009, F1-PR10): a tabela { "âncora antiga": { "rota": "...", "ancora": "..." } } de todos os # do app de
2026, a partir de docs/legacy_catalog.json (os 43 gráficos) e da lista fixa de telas, comparadores, âncoras internas e letras do
glossário. Enquanto a rota nova é igual à antiga (a F1 preserva os ids), o alias é identidade; a tabela existe para o dia em que
mudar (alias_novo no catálogo). Rodar da raiz:  python3 robos/gera-aliases.py"""
import json, os, datetime
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cat = json.load(open(os.path.join(R, 'docs/legacy_catalog.json'), encoding='utf-8'))
A = {}
for e in cat['entradas']:
    A[e['slug']] = {'rota': e.get('alias_novo') or e['slug']}
# os gráficos na página em inglês têm o slug do título em inglês (o index-en.html antigo): identidade também
import re, unicodedata
def slug_g(t):
    s = unicodedata.normalize('NFD', t.lower()); s = ''.join(c for c in s if not unicodedata.combining(c))
    return 'g-' + re.sub(r'[^a-z0-9]+', '-', s).strip('-')[:44]
for g in json.load(open(os.path.join(R, 'dados/en/ig.json'), encoding='utf-8'))['graficos']:
    A.setdefault(slug_g(g['titulo']), {'rota': slug_g(g['titulo']), 'idioma': 'en'})
for s in ['g-sobrepor', 'g-marcos-comp']: A[s] = {'rota': s}
for s in ['ig-indice', 'ig-sumario', 'ig-comp']: A[s] = {'rota': 'infograficos', 'ancora': s}
for t in ['inicio', 'historico', 'infograficos', 'macrotemas', 'score', 'mandato', 'documentos', 'metodo', 'glossario', 'hub', 'colinha', 'congresso', 'resultado']: A[t] = {'rota': t}
for L in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ': A['gl-' + L] = {'rota': 'glossario', 'ancora': 'gl-' + L}   # os grupos do glossário têm id gl-A… (maiúscula)
out = {'formato': 1, 'gerado_em': datetime.date.today().isoformat(), 'fonte': 'docs/legacy_catalog.json + robos/gera-aliases.py',
       'nota': {'pt': 'Âncora antiga → rota nova (e âncora dentro da tela, quando há). O roteador (modulos/rotas.js) troca por replaceState e abre o bloco certo. Rotas com partes (#macrotemas/<tema>, #congresso/ficha/<UF>/<id>) mantêm o resto do caminho.',
                'en': 'Old anchor → new route (and in-screen anchor, when any). The router (modulos/rotas.js) swaps it with replaceState and opens the right block. Routes with parts (#macrotemas/<theme>, #congresso/ficha/<UF>/<id>) keep the rest of the path.'},
       'aliases': A}
open(os.path.join(R, 'dados/aliases.json'), 'w', encoding='utf-8').write(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
print('dados/aliases.json:', len(A), 'âncoras')
