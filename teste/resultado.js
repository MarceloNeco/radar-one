/* Teste da tela Resultado e apuração (F1-PR6b), nas DUAS páginas, com o TSE simulado:
     - #resultado abre no último turno, Presidente, Brasil: tabela ordenada por votos, números formatados, % e "Eleito(a)"
     - cabeçalho com data e hora da apuração; link para a fonte (resultados.tse.jus.br)
     - trocar o cargo para Governador mostra o seletor de estado e pede o arquivo da UF; o endereço vira #resultado/2/3/RN
     - link direto #resultado/2/3/RN abre direto na UF
     - 2ª visita sem rede: mostra a cópia guardada e avisa; cargo sem arquivo (404): "Esta fonte não informa o dado neste recorte."
   Uso: node teste/resultado.js */
const { chromium, servir, novoContexto, semear, PAGINAS, relatorio } = require('./comum');
const PORTA = process.env.PORTA || 8101, BASE = 'http://localhost:' + PORTA;
const { falhas, conferir } = relatorio();
const PREFS = { 'planos2026:prefs': { aoVisto: true, telaCiente: true }, 'planos2026:novidade-colinha': 1 };
const ELE_C = { dg: '26/10/2026', hg: '10:00:00', pl: [{ c: 'ele2026', dt: '04/10/2026', e: [
  { cd: '6257', t: '1', nm: 'Eleição Ordinária Federal - 2026 1º Turno', abr: [{ cd: 'br', cp: [{ cd: '1' }] }] },
  { cd: '6259', t: '1', nm: 'Eleição Ordinária Estadual - 2026 1º Turno', abr: [{ cd: 'br', cp: [{ cd: '3' }, { cd: '5' }, { cd: '6' }, { cd: '7' }] }] } ] },
  { c: 'ele2026', dt: '25/10/2026', e: [
  { cd: '6258', t: '2', nm: 'Eleição Ordinária Federal - 2026 2º Turno', abr: [{ cd: 'br', cp: [{ cd: '1' }] }] },
  { cd: '6260', t: '2', nm: 'Eleição Ordinária Estadual - 2026 2º Turno', abr: [{ cd: 'rn', cp: [{ cd: '3' }] }, { cd: 'am', cp: [{ cd: '3' }] }] } ] }] };
const cand = (n, nm, nmu, vap, pvap, eleito) => ({ n, nm, nmu, vap, pvap, st: eleito ? 'Eleito' : 'Não eleito', e: eleito ? 's' : 'n' });
const U_BR = { dg: '25/10/2026', hg: '23:27:02', t: '2', pst: '100,00', carg: [{ cd: '1', agr: [{ par: [{ sg: 'PL', cand: [cand('22', 'FLAVIO NANTES BOLSONARO', 'FLAVIO BOLSONARO', '59826041', '48,21', false)] }, { sg: 'PT', cand: [cand('13', 'LUIZ INACIO LULA DA SILVA', 'LULA', '64266532', '51,79', true)] }] }] }] };
const U_RN = { dg: '25/10/2026', hg: '20:10:00', t: '2', carg: [{ cd: '3', agr: [{ par: [{ sg: 'PSDB', cand: [cand('45', 'ALLYSON LEANDRO BEZERRA SILVA', 'ALLYSON', '1000000', '45,50', false)] }, { sg: 'PT', cand: [cand('13', 'CARLOS EDUARDO NUNES ALVES', 'CADU DE LULA', '1200000', '54,50', true)] }] }] }] };
const ARQ = { 'comum/config/ele-c.json': ELE_C, 'ele2026/6258/dados/br/br-c0001-e006258-u.json': U_BR, 'ele2026/6260/dados/rn/rn-c0003-e006260-u.json': U_RN };

(async () => {
  const srv = await servir(PORTA);
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const erros = [];
  for (const [arq, lg] of PAGINAS) {
    const L = arq + ': ', en = lg === 'en';
    const ctx = await novoContexto(browser, 1100, []); await semear(ctx, PREFS);
    const pedidos = [];
    const tse = async r => { const rel = r.request().url().replace('https://resultados.tse.jus.br/oficial/', ''); pedidos.push(rel); const j = ARQ[rel];
      return j ? r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(j) }) : r.fulfill({ status: 404, body: 'NoSuchKey' }); };
    await ctx.route(/^https:\/\/resultados\.tse\.jus\.br\//, tse);
    const p = await ctx.newPage(); p.on('pageerror', e => erros.push(arq + ': ' + e.message));
    await p.goto(BASE + '/' + arq + '#resultado'); await p.waitForSelector('#res-out .res-tab', { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(400);
    const t = await p.evaluate(() => ({ on: [...document.querySelectorAll('.view.on')].map(e => e.id), cab: (document.querySelector('.res-cab') || {}).textContent || '',
      linhas: [...document.querySelectorAll('.res-tab tbody tr')].map(tr => [...tr.children].map(td => td.textContent.trim())), eleito: !!document.querySelector('.res-tab tr.eleito .res-eleito'),
      fonte: (document.querySelector('.res-fonte a') || {}).href || '', selects: document.querySelectorAll('.res-sel select').length }));
    conferir(t.on.length === 1 && t.on[0] === 'v-resultado' && t.linhas.length === 2, L + '#resultado abre a tela com a tabela do 2º turno, Presidente, Brasil (' + t.linhas.length + ' candidaturas)');
    conferir(t.linhas[0] && /LULA/.test(t.linhas[0][1]) && t.linhas[0][3] === (en ? '64,266,532' : '64.266.532') && t.linhas[0][4] === '51,79%', L + 'ordem por votos, número formatado e %: ' + (t.linhas[0] || []).slice(1, 5).join(' | '));
    conferir(t.eleito && /Eleito|Elected/.test(t.linhas[0][5]), L + 'a candidatura eleita vem marcada "' + (t.linhas[0] || [])[5] + '"');
    conferir(/25\/10\/2026 23:27:02/.test(t.cab) && /100,00%/.test(t.cab), L + 'cabeçalho com data e hora da apuração e % das seções: "' + t.cab.slice(0, 70) + '…"');
    conferir(/resultados\.tse\.jus\.br/.test(t.fonte) && t.selects === 2, L + 'link da fonte (TSE) e dois seletores (turno e cargo) para presidente');
    /* cargo = governador: aparece o estado; pede o arquivo da UF; endereço com o recorte */
    await p.selectOption('.res-sel:nth-of-type(2) select', 'G'); await p.waitForTimeout(300);
    await p.selectOption('.res-sel:nth-of-type(3) select', 'RN'); await p.waitForSelector('.res-tab tbody tr', { timeout: 10000 }).catch(() => {}); await p.waitForTimeout(400);
    const g = await p.evaluate(() => ({ hash: location.hash, linhas: [...document.querySelectorAll('.res-tab tbody tr')].map(tr => tr.children[1].textContent.trim()), cab: (document.querySelector('.res-cab') || {}).textContent || '' }));
    conferir(g.hash === '#resultado/2/3/RN' && pedidos.some(x => /rn-c0003-e006260-u\.json$/.test(x)) && /CADU DE LULA/.test(g.linhas[0] || ''), L + 'Governador + RN pede o arquivo da UF e o endereço vira ' + g.hash);
    /* link direto com o recorte */
    const p2 = await ctx.newPage(); await p2.goto(BASE + '/' + arq + '#resultado/2/3/RN'); await p2.waitForSelector('.res-tab tbody tr', { timeout: 15000 }).catch(() => {}); await p2.waitForTimeout(300);
    conferir(/CADU DE LULA/.test(await p2.evaluate(() => (document.querySelector('.res-tab tbody tr td:nth-child(2)') || {}).textContent || '')), L + 'link direto #resultado/2/3/RN abre direto na UF');
    /* cargo sem arquivo no TSE (404): aviso claro */
    await p2.selectOption('.res-sel:nth-of-type(1) select', '1'); await p2.waitForTimeout(400);   /* 1º turno: tem Senador(a) */
    await p2.selectOption('.res-sel:nth-of-type(2) select', 'S'); await p2.waitForTimeout(900);
    conferir(/não informa o dado|does not report data/.test(await p2.evaluate(() => (document.querySelector('.res-aviso') || {}).textContent || '')), L + 'cargo sem arquivo no TSE: "Esta fonte não informa o dado neste recorte."');
    /* sem rede: a cópia guardada responde, com aviso */
    await ctx.unroute(/^https:\/\/resultados\.tse\.jus\.br\//); await ctx.route(/^https:\/\/resultados\.tse\.jus\.br\//, r => r.abort());
    await p2.evaluate(() => { const g = JSON.parse(localStorage.getItem('planos2026:resultado')); for (const k in g) g[k].em = new Date(Date.now() - 2 * 3600e3).toISOString(); localStorage.setItem('planos2026:resultado', JSON.stringify(g)); });
    await p2.goto(BASE + '/' + arq + '#resultado/2/1/BR'); await p2.waitForSelector('.res-tab tbody tr', { timeout: 15000 }).catch(() => {}); await p2.waitForTimeout(300);
    const off = await p2.evaluate(() => ({ n: document.querySelectorAll('.res-tab tbody tr').length, cab: (document.querySelector('.res-cab') || {}).textContent || '' }));
    conferir(off.n === 2 && /última versão guardada|last version saved/.test(off.cab), L + 'sem rede, a cópia guardada (vencida) responde e avisa: "' + off.cab.slice(-60) + '"');
    await ctx.close();
  }
  await browser.close(); srv.close();
  if (erros.length) { erros.forEach(e => console.log('  ✗ erro de página: ' + e)); falhas.push('erros de página'); }
  console.log(falhas.length ? '\n✗ ' + falhas.length + ' falha(s)' : '\n✓ tudo certo');
  process.exit(falhas.length ? 1 : 0);
})();
