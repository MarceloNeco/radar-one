/* Teste da MIGRAÇÃO LOCAL (F1-PR9, ADR 0008), nas DUAS páginas, só com valores de mentira:
     - semeia planos2026:* → abre → radar-one:* iguais e radar-one:esquema {versao 1, migradoDe, em}
     - o módulo Eleições escreve na chave antiga → ao trocar de tela a nova acompanha (duplo gravar)
     - abrir de novo não reconverte (esquema.em igual) nem duplica
     - Configurações → Opções deste aparelho → "Voltar para a versão anterior": só as antigas ficam; abrir de novo não migra sozinho
   Uso: node teste/migracao.js */
const { chromium, servir, novoContexto, semear, PAGINAS, relatorio } = require('./comum');
const PORTA = process.env.PORTA || 8106, BASE = 'http://localhost:' + PORTA;
const { falhas, conferir } = relatorio();
const ANTIGAS = { 'planos2026:prefs': { aoVisto: true, telaCiente: true, tema: 'claro', x: 1 }, 'planos2026:voz': { motor: 'gemini', geminiVoz: 'Kore', vel: 1.2 }, 'planos2026:congresso': { fav: ['a1', 'b2'], eixos: { e1: 2 } }, 'planos2026:colinha': { uf: 'RN', por: {} }, 'planos2026:modo': 'congresso', 'planos2026:novidade-colinha': 1 };
const todas = p => p.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; });

(async () => {
  const srv = await servir(PORTA);
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const erros = [];
  for (const [arq] of PAGINAS) {
    const L = arq + ': ';
    const ctx = await novoContexto(browser, 390, []); await semear(ctx, ANTIGAS);
    const p = await ctx.newPage(); p.on('pageerror', e => erros.push(arq + ': ' + e.message));
    await p.goto(BASE + '/' + arq + '#hoje'); await p.waitForFunction(() => window.PG && window.Migracao, null, { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(500);
    let t = await todas(p);
    /* o app pode regravar planos2026:prefs logo ao abrir (campos a mais); a nova vale a cópia da abertura ou a semeada */
    const iguais = Object.keys(ANTIGAS).every(k => { const n = t[k.replace('planos2026:', 'radar-one:')]; return n != null && (n === t[k] || n === JSON.stringify(ANTIGAS[k])); });
    let esq = JSON.parse(t['radar-one:esquema'] || 'null');
    conferir(iguais && esq && esq.versao === 1 && esq.migradoDe === 'planos2026' && /^\d{4}-\d\d-\d\dT/.test(esq.em || ''), L + 'primeira abertura: as ' + Object.keys(ANTIGAS).length + ' chaves antigas viraram radar-one:* iguais, com radar-one:esquema {versao 1, migradoDe planos2026}');
    /* duplo gravar: a antiga muda (como o módulo Eleições faz) e a nova acompanha ao trocar de tela */
    await p.evaluate(() => localStorage.setItem('planos2026:congresso', JSON.stringify({ fav: ['c3'], eixos: {} })));
    await p.evaluate(() => { location.hash = '#explorar'; }); await p.waitForTimeout(400);
    t = await todas(p);
    conferir(t['radar-one:congresso'] === t['planos2026:congresso'] && /c3/.test(t['radar-one:congresso']), L + 'duplo gravar: a chave antiga mudou e, ao trocar de tela, a nova acompanhou');
    /* abrir de novo: não reconverte */
    const em = esq.em; await p.reload(); await p.waitForFunction(() => window.PG && window.Migracao, null, { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(400);
    t = await todas(p); esq = JSON.parse(t['radar-one:esquema'] || 'null');
    conferir(esq && esq.em === em && Object.keys(t).filter(k => /^radar-one:/.test(k)).length === Object.keys(ANTIGAS).length + 1, L + 'abrir de novo não reconverte (esquema.em igual) nem duplica (' + Object.keys(t).filter(k => /^radar-one:/.test(k)).length + ' chaves novas)');
    /* voltar para a versão anterior */
    await p.click('#cfg-b'); await p.waitForSelector('#mig-voltar', { timeout: 8000 }); await p.click('#mig-voltar'); await p.waitForTimeout(400);
    const btn = p.locator('dialog.sj[open] .ej-conf button').last(); if (await btn.count()) { await btn.click(); await p.waitForTimeout(400); }
    t = await todas(p); esq = JSON.parse(t['radar-one:esquema'] || 'null');
    const soAntigas = Object.keys(ANTIGAS).every(k => t[k] != null && t[k.replace('planos2026:', 'radar-one:')] == null);
    conferir(soAntigas && esq && esq.versao === 0 && /^\d{4}/.test(esq.voltou || ''), L + '"Voltar para a versão anterior": só as antigas ficam; esquema {versao 0, voltou}');
    await p.keyboard.press('Escape'); await p.reload(); await p.waitForFunction(() => window.PG && window.Migracao, null, { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(400);
    t = await todas(p);
    conferir(Object.keys(t).filter(k => /^radar-one:/.test(k) && k !== 'radar-one:esquema').length === 0 && t['planos2026:prefs'] != null, L + 'depois de voltar, abrir de novo não migra sozinho e as antigas continuam');
    await ctx.close();
  }
  await browser.close(); srv.close();
  if (erros.length) { erros.forEach(e => console.log('  ✗ erro de página: ' + e)); falhas.push('erros de página'); }
  console.log(falhas.length ? '\n✗ ' + falhas.length + ' falha(s)' : '\n✓ tudo certo');
  process.exit(falhas.length ? 1 : 0);
})();
