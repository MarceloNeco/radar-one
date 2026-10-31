/* migracao.js: migração versionada e reversível dos dados locais da pessoa (F1-PR9, 31/10/2026; ADR 0008).
   O app guardava tudo em planos2026:*. O produto novo guarda em radar-one:<chave>, com o registro radar-one:esquema
   {versao, migradoDe, em}. Na primeira abertura, cada chave antiga é convertida (migracoes[versao], campo a campo) e gravada na
   chave nova; as antigas NÃO são apagadas. Duplo gravar durante a F1: o módulo Eleições preservado continua escrevendo em
   planos2026:*, e este módulo copia para as novas ao trocar de tela e ao sair. "Voltar para a versão anterior" (Configurações →
   Opções deste aparelho) apaga só as chaves novas e marca esquema.versao = 0 para não migrar de novo sozinho.
   O que sai daqui: window.Migracao = { migra, copia, voltar, esquema, secao, CHAVES }. Nada sai para a internet. */
const EN = (window.IDIOMA || 'pt') === 'en';
function T(p, e) { return EN ? e : p; }
const ANTIGO = 'planos2026:', NOVO = 'radar-one:', ESQ = 'radar-one:esquema', VERSAO = 1;
const CHAVES = ['prefs', 'voz', 'congresso', 'colinha', 'tse', 'modo', 'novidade-colinha', 'resultado', 'offline', 'samsung-ciente', 'instalado'];
/* cada versão de esquema diz como a chave antiga vira a nova; na 1 a forma é a mesma (só o prefixo muda), MENOS segredos:
   chave de API, token ou senha nunca passa para a cópia nova (o cofre é o único lugar deles; o voz.js tira da chave antiga ao abrir,
   e a cópia poderia ser feita antes disso) */
const SEGREDO = /(key|token|senha|secret|chave)$/i;
function semSegredos(valor) {
  try { const o = JSON.parse(valor); if (!o || typeof o !== 'object' || Array.isArray(o)) return valor;
    let mudou = false; Object.keys(o).forEach(function (k) { if (SEGREDO.test(k)) { delete o[k]; mudou = true; } });
    return mudou ? JSON.stringify(o) : valor; } catch (e) { return valor; }
}
const migracoes = { 1: function (chave, valor) { return semSegredos(valor); } };
function le(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function grava(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
function esquema() { try { const e = JSON.parse(le(ESQ) || 'null'); return e && typeof e === 'object' ? e : null; } catch (e) { return null; } }
/* planos2026:* → radar-one:* (só o que mudou); devolve quantas chaves gravou */
function copia() {
  const e = esquema(); if (e && e.versao === 0) return 0;   /* a pessoa voltou para a versão anterior: não copia mais */
  let n = 0;
  CHAVES.forEach(function (k) {
    const v = le(ANTIGO + k); if (v == null) return;
    const nv = migracoes[VERSAO](k, v);
    if (le(NOVO + k) !== nv) { grava(NOVO + k, nv); n++; }
  });
  return n;
}
/* primeira abertura: converte e registra o esquema; nas seguintes, só sincroniza (não reconverte nem muda o registro) */
function migra() {
  const e = esquema();
  if (e && e.versao >= VERSAO) { copia(); return false; }
  if (e && e.versao === 0) return false;
  copia();
  grava(ESQ, JSON.stringify({ versao: VERSAO, migradoDe: 'planos2026', em: new Date().toISOString() }));
  return true;
}
function voltar() {
  CHAVES.forEach(function (k) { grava(NOVO + k, null); });
  grava(ESQ, JSON.stringify({ versao: 0, voltou: new Date().toISOString() }));
}
const MES = { pt: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'], en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] };
function dataBR(iso) { const d = new Date(iso); if (isNaN(d)) return '?'; const dd = String(d.getDate()).padStart(2, '0'), m = (EN ? MES.en : MES.pt)[d.getMonth()]; return EN ? m + '/' + dd + '/' + d.getFullYear() : dd + '/' + m + '/' + d.getFullYear(); }
function mk(t, c, x) { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
/* Configurações → Opções deste aparelho */
function secao() {
  const s = mk('div', 'oc-sec'); s.id = 'mig-sec';
  s.appendChild(mk('span', 'oc-rot', T('Opções deste aparelho', 'This device')));
  const e = esquema(), p = mk('p', 'oc-nota'); p.id = 'mig-sit';
  p.textContent = e && e.versao >= 1 ? T('Seus dados neste aparelho foram copiados para o formato do RadarONE em ', 'Your data on this device was copied to the RadarONE format on ') + dataBR(e.em) + T(' (esquema ' + e.versao + '). A cópia antiga continua guardada.', ' (schema ' + e.versao + '). The old copy is still kept.')
    : e && e.versao === 0 ? T('Você voltou para a versão anterior em ', 'You went back to the previous version on ') + dataBR(e.voltou) + T('. Os dados ficam só no formato antigo.', '. The data stays only in the old format.')
    : T('Sem dados migrados neste aparelho.', 'No migrated data on this device.');
  s.appendChild(p);
  if (e && e.versao >= 1) {
    const b = mk('button', 'chip-cat', T('Voltar para a versão anterior', 'Go back to the previous version')); b.type = 'button'; b.id = 'mig-voltar';
    b.addEventListener('click', function () {
      const faz = function () { voltar(); p.textContent = T('Pronto: só o formato antigo ficou. Recarregue a página.', 'Done: only the old format remains. Reload the page.'); b.remove(); };
      if (window.EJ && EJ.confirma) EJ.confirma(T('Apagar a cópia nova dos seus dados neste aparelho? A antiga continua.', 'Delete the new copy of your data on this device? The old one stays.'), T('Voltar', 'Go back'), faz); else faz();
    });
    s.appendChild(b);
  }
  return s;
}
migra();
addEventListener('hashchange', copia);
addEventListener('pagehide', copia);
document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') copia(); });
window.Migracao = { migra: migra, copia: copia, voltar: voltar, esquema: esquema, secao: secao, CHAVES: CHAVES };
