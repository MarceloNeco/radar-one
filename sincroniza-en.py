#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Regenera o index-en.html a partir do index.html.

Os dois arquivos têm o MESMO conteúdo (HTML e CSS; o código está em modulos/ e
os dados em dados/ e dados/en/); o que muda é só a linha window.IDIOMA, o
atributo lang, o link hreflang e o link da marca. Então: edite sempre o
index.html e rode

    python3 sincroniza-en.py

Nada de editar o index-en.html à mão. (Até o F1-PR2 este script também
encaixava os blocos de dados em inglês; hoje eles moram em dados/en/.)
"""
import sys, io

PT = 'index.html'
EN = 'index-en.html'

def main():
    novo = io.open(PT, encoding='utf-8').read()
    trocas = [
        ('<html lang="pt-BR">', '<html lang="en-US">'),
        ('<link rel="alternate" hreflang="pt-BR" href="index.html">', '<link rel="alternate" hreflang="en-US" href="index.html">'),
        ('<a class="brand" href="./"', '<a class="brand" href="./index-en.html"'),
        ('<script>window.IDIOMA="pt";</script>', '<script>window.IDIOMA="en";</script>'),
    ]
    for de, para in trocas:
        if novo.count(de) != 1:
            sys.exit('esperava exatamente 1 ocorrência de %r, achei %d' % (de, novo.count(de)))
        novo = novo.replace(de, para)
    io.open(EN, 'w', encoding='utf-8').write(novo)
    print('index-en.html regenerado: %d linhas' % novo.count('\n'))

if __name__ == '__main__':
    main()
