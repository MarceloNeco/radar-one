/* Teste do ⓘ que abre a explicação (F1-PR5c), nas DUAS páginas:
     - a capa, os Indicadores e o rodapé têm os botões ⓘ; a tela principal fica com a linha curta
     - tocar no ⓘ abre a explicação completa pela janela comum; "Entendi", Esc e o Voltar do celular fecham
     - a explicação guarda o que não pode sumir: a ressalva da conferência, as cinco regras dos gráficos, os créditos das fotos (CC BY-SA 2.0)
     - em inglês o rótulo do ⓘ e a linha curta aparecem traduzidos
   Uso: node teste/saiba.js */
const { chromium, servir, novoContexto, semear, PAGINAS, relatorio } = require('./comum');
const PORTA = process.env.PORTA || 8102, BASE = 'http://localhost:' + PORTA;
const { falhas, conferir } = relatorio();
const PREFS = { 'planos2026:prefs': { aoVisto: true, telaCiente: true }, 'planos2026:novidade-colinha': 1 };

(async () => {
  const srv = await servir(PORTA);
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const erros = [];
  const aberto = p => p.evaluate(id => { const e = document.getElementById(id); return !!e && !e.hidden && e.getBoundingClientRect().height > 0; }, 'i-conf');
  for (const [arq, lg] of PAGINAS) {
    const L = arq + ': ', en = lg === 'en';
    const ctx = await novoContexto(browser, 390, []); await semear(ctx, PREFS);
    const p = await ctx.newPage(); p.on('pageerror', e => erros.push(arq + ': ' + e.message));
    await p.goto(BASE + '/' + arq + '#inicio'); await p.waitForSelector('#menu button', { state: 'attached' }); await p.waitForFunction(() => window.Colinha).catch(() => {}); await p.waitForTimeout(500);
    const n = await p.evaluate(() => ({ capa: document.querySelectorAll('#v-inicio .ibtn-i').length, ig: document.querySelectorAll('#v-infograficos .ibtn-i').length, foot: document.querySelectorAll('.foot .ibtn-i').length, pops: document.querySelectorAll('.i-pop[hidden]').length,
      rotulo: (document.querySelector('[data-i="i-conf"]') || {}).getAttribute ? document.querySelector('[data-i="i-conf"]').getAttribute('aria-label') : '', curta: (document.querySelector('#v-inicio .sec-n.curta') || {}).textContent || '' }));
    conferir(n.capa >= 6 && n.ig === 1 && n.foot === 1 && n.pops >= 8, L + 'os ⓘ estão na capa (' + n.capa + '), nos Indicadores (' + n.ig + ') e no rodapé (' + n.foot + '); as explicações começam escondidas (' + n.pops + ')');
    conferir(en ? /How the check works/.test(n.rotulo) && /A program checks/.test(n.curta) : /Como a conferência funciona/.test(n.rotulo) && /Um programa confere/.test(n.curta), L + 'rótulo do ⓘ e linha curta no idioma da página ("' + n.rotulo + '")');
    /* a capa recolhe o quadro da conferência num chevron (details.dob): quem lê abre o chevron e só então vê a linha curta com o ⓘ */
    const dob = await p.evaluate(() => { const d = document.querySelector('[data-i="i-conf"]').closest('details.dob'); if (!d) return 'sem chevron'; d.open = true; return d.querySelector('summary').textContent.trim(); });
    await p.waitForTimeout(300);
    conferir(await p.locator('[data-i="i-conf"]').isVisible(), L + 'o ⓘ da conferência fica visível ao abrir o chevron "' + dob + '"');
    await p.click('[data-i="i-conf"]'); await p.waitForTimeout(500);
    const t = await p.evaluate(() => ({ dlg: document.querySelectorAll('dialog.sj[open]').length, txt: (document.getElementById('i-conf') || {}).textContent || '', exp: (document.querySelector('[data-i="i-conf"]') || {}).getAttribute('aria-expanded') , caixa: (() => { const r = document.getElementById('i-conf').getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right), innerWidth]; })()}));
    conferir(await aberto(p) && t.dlg === 1 && /descarta a citação se não bater|drops the quote|discards the quote|does not match/.test(t.txt) && t.exp === 'true' && t.caixa[0] >= 0 && t.caixa[1] <= t.caixa[2], L + 'o ⓘ abre a explicação completa pela janela comum (aria-expanded ' + t.exp + ') e a caixa cabe na tela (' + t.caixa.join('/') + ')');
    await p.click('#i-conf .i-ok'); await p.waitForTimeout(400);
    conferir(!(await aberto(p)) && await p.evaluate(() => document.querySelectorAll('dialog.sj[open]').length === 0), L + '"Entendi" fecha a explicação');
    await p.click('[data-i="i-conf"]'); await p.waitForTimeout(400); await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    conferir(!(await aberto(p)), L + 'Esc fecha a explicação');
    await p.click('[data-i="i-conf"]'); await p.waitForTimeout(400); await p.evaluate(() => history.back()); await p.waitForTimeout(500);
    conferir(!(await aberto(p)) && await p.evaluate(() => location.hash) === '#inicio', L + 'o Voltar do celular fecha a explicação e continua na mesma tela');
    /* todo ⓘ é alcançável: nenhum fica dentro de um título que o app esconde ao dobrar o cartão num chevron */
    const escondidos = () => p.evaluate(() => { document.querySelectorAll('details.dob').forEach(d => { d.open = true; }); return [...document.querySelectorAll('.view.on .ibtn-i, .foot .ibtn-i')].filter(b => !b.getClientRects().length).map(b => b.dataset.i); });
    const fora = await escondidos();
    conferir(fora.length === 0, L + 'na capa, todo ⓘ fica visível com os chevrons abertos' + (fora.length ? ' (escondidos: ' + fora.join(', ') + ')' : ''));
    /* o que não pode sumir */
    const guardado = await p.evaluate(() => ({ cred: (document.getElementById('i-sobre') || {}).textContent || '', regras: document.querySelectorAll('#i-regras p').length, avisos: document.querySelectorAll('#i-avisos p').length, lista: document.querySelectorAll('#v-infograficos .lista-avisos li').length }));
    conferir(/CC BY-SA 2\.0/.test(guardado.cred) && /Arquivo Nacional/.test(guardado.cred) && /Finalidade|Purpose/.test(guardado.cred), L + 'os créditos das fotos e a finalidade continuam no rodapé, atrás do ⓘ');
    conferir(guardado.regras === 5 && guardado.lista === 5 && guardado.avisos === 4, L + 'as cinco regras dos gráficos e os quatro avisos da capa estão inteiros atrás do ⓘ (lista curta com ' + guardado.lista + ' itens)');
    /* 320 px: a linha com o ⓘ não provoca rolagem lateral */
    await p.setViewportSize({ width: 320, height: 700 }); await p.waitForTimeout(300);
    conferir(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), L + '320 px: as linhas com ⓘ não provocam rolagem lateral');
    /* Indicadores: o ⓘ das cinco regras também é alcançável */
    await p.goto(BASE + '/' + arq + '#infograficos'); await p.waitForTimeout(800);
    const foraIg = await escondidos();
    conferir(foraIg.length === 0 && await p.evaluate(() => !!document.querySelector('#v-infograficos [data-i="i-regras"]')), L + 'nos Indicadores, o ⓘ das regras fica visível com o chevron aberto' + (foraIg.length ? ' (escondidos: ' + foraIg.join(', ') + ')' : ''));
    await ctx.close();
  }
  await browser.close(); srv.close();
  if (erros.length) { erros.forEach(e => console.log('  ✗ erro de página: ' + e)); falhas.push('erros de página'); }
  console.log(falhas.length ? '\n✗ ' + falhas.length + ' falha(s)' : '\n✓ tudo certo');
  process.exit(falhas.length ? 1 : 0);
})();
