#!/usr/bin/env python3
"""Gera offline.json: a lista de arquivos (com o tamanho em bytes) que "Salvar no aparelho" baixa para o site abrir sem
internet (F1-PR8). Rodar da raiz do repositório a cada entrega, depois de mudar a versão:  python3 robos/gera-offline.py
A versão sai de dados/dados.json. O teste teste/offline.js confere que a lista bate com os arquivos de verdade."""
import json, os, glob, sys
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PADROES = ['index.html', 'manifest.json', 'icone-192.png', 'icone-512.png', 'ajuda-botao.png', 'ajuda-icone.png', 'assistone-hd.png',
           'recursos.js', 'cofre.js', 'janela.js', 'recursos-do-app.json', 'modulos/*.js', 'modulos/eleicoes/*.js',
           'dados/*.json', 'dados/en/*.json', 'i18n/en.json', 'fontes/*.woff2', 'presidencia/*.json', 'cola/*.json']
arqs = []
for p in PADROES:
    for f in sorted(glob.glob(os.path.join(R, p))):
        if os.path.isfile(f): arqs.append({'a': os.path.relpath(f, R).replace(os.sep, '/'), 'b': os.path.getsize(f)})
versao = json.load(open(os.path.join(R, 'dados/dados.json'), encoding='utf-8'))['versao']
out = {'versao': versao, 'arquivos': arqs}
open(os.path.join(R, 'offline.json'), 'w', encoding='utf-8').write(json.dumps(out, ensure_ascii=False, separators=(',', ':')) + '\n')
print('offline.json: versão', versao, '·', len(arqs), 'arquivos ·', round(sum(a['b'] for a in arqs) / 1048576, 1), 'MB')
