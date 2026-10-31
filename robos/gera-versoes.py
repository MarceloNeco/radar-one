#!/usr/bin/env python3
"""Gera versoes.json (diretriz "Versionamento visível"): todas as versões, com data e hora, e o que cada uma trouxe em PT e EN.
As notas vêm de dados/dados.json e dados/en/dados.json ("versoes"); a data e a hora de cada versão vêm do versoes.json
anterior (se já estava lá) ou do commit que subiu a versão ("· X.Y.Z" na mensagem). Rodar da raiz a cada entrega:
python3 robos/gera-versoes.py"""
import json, os, subprocess
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MES = {'Jan': 'Jan', 'Feb': 'Fev', 'Mar': 'Mar', 'Apr': 'Abr', 'May': 'Mai', 'Jun': 'Jun', 'Jul': 'Jul', 'Aug': 'Ago', 'Sep': 'Set', 'Oct': 'Out', 'Nov': 'Nov', 'Dec': 'Dez'}
pt = json.load(open(os.path.join(R, 'dados/dados.json'), encoding='utf-8'))['versoes']
en = json.load(open(os.path.join(R, 'dados/en/dados.json'), encoding='utf-8'))['versoes']
enPor = {v['v']: v.get('itens', []) for v in en}
antes = {}
try:
    for v in json.load(open(os.path.join(R, 'versoes.json'), encoding='utf-8'))['versoes']: antes[v['versao']] = v
except Exception: pass
def doGit(v):
    try:
        env = dict(os.environ, TZ='America/Sao_Paulo')   # horário de Brasília, como a diretriz pede
        s = subprocess.run(['git', 'log', '-1', '--format=%cd', '--date=format-local:%d/%b/%Y %H:%M:%S', '--grep=· ' + v], cwd=R, capture_output=True, text=True, env=env).stdout.strip()
        if not s: return '', ''
        d, h = s.split(' '); dd, m, a = d.split('/'); return dd + '/' + MES.get(m, m) + '/' + a, h
    except Exception: return '', ''
saida = []
for v in pt:
    k = v['v']; a = antes.get(k)
    data, hora = (a['data'], a['hora']) if a and a.get('data') else doGit(k)
    if not data and v is pt[0]:   # a versão desta entrega ainda não tem commit: agora, em Brasília
        from datetime import datetime, timezone, timedelta
        ag = datetime.now(timezone(timedelta(hours=-3))); data, hora = ag.strftime('%d/') + MES[ag.strftime('%b')] + ag.strftime('/%Y'), ag.strftime('%H:%M:%S')
    saida.append({'versao': k, 'data': data, 'hora': hora, 'itens': {'pt': v.get('itens', []), 'en': enPor.get(k, [])}})
open(os.path.join(R, 'versoes.json'), 'w', encoding='utf-8').write(json.dumps({'app': 'radar-one', 'versoes': saida}, ensure_ascii=False, indent=2) + '\n')
print('versoes.json:', len(saida), 'versões; a atual', saida[0]['versao'], saida[0]['data'], saida[0]['hora'] or '(sem hora)')
