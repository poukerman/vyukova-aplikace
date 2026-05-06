// mocniny.js — Hra: Mocniny a odmocniny

import { stav, showScreen, updateHint } from './main.js';
import { zobrazVysledkyMocniny } from './vysledky.js';

const DOBA_HRY = 120;

const CTVERECE     = [1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144];
const CTVERECE_NEG = [-1, -4, -9, -16, -25, -36, -49, -64, -81, -100];
const KOSTKY       = [1, 8, 27, 64, 125, 216];
const FRAC_PAIRS   = [[1,2],[1,3],[1,4],[1,5],[1,6],[2,3],[2,5],[3,4],[3,5],[4,5]];

function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function formatCas(sek) {
  return `${Math.floor(sek / 60)}:${String(sek % 60).padStart(2, '0')}`;
}

function parseVstup(s) {
  s = s.trim().replace(',', '.');
  if (/^-?\d+$/.test(s))      return { k: 'n', v: parseInt(s, 10) };
  if (/^-?\d+\.\d+$/.test(s)) return { k: 'n', v: parseFloat(s) };
  const m = s.match(/^(-?\d+)\/(\d+)$/);
  if (m) {
    const n = parseInt(m[1], 10), d = parseInt(m[2], 10);
    if (d === 0) return null;
    return { k: 'f', n, d };
  }
  return null;
}

function srovnej(vstup, spravna) {
  if (typeof spravna === 'number') {
    if (vstup.k === 'n') return Math.abs(vstup.v - spravna) < 1e-9;
    if (vstup.k === 'f') return Math.abs(vstup.n / vstup.d - spravna) < 1e-9;
  }
  if (spravna !== null && typeof spravna === 'object' && 'n' in spravna) {
    if (vstup.k === 'n') return Math.abs(vstup.v - spravna.n / spravna.d) < 1e-9;
    if (vstup.k === 'f') return vstup.n * spravna.d === vstup.d * spravna.n;
  }
  return false;
}

let vybraneTypy      = [];
let aktualniTypy     = [];
let body             = 0;
let celkemOtazek     = 0;
let historiePrikladu = [];
let aktualniPriklad  = null;
let zbyvajiciCas     = 0;
let casovacId        = null;
let hraProbiha       = false;
let prvniPokus       = true;

export function initMocniny() {
  vybraneTypy = [];

  ['2pow', '2root', '3pow', '3root', 'neg', 'dec', 'frac'].forEach(typ => {
    const el = document.getElementById(`btn-mocniny-${typ}`);
    el.classList.remove('selected');
    el.onclick = () => prepniTyp(typ);
  });

  document.getElementById('mocniny-error').textContent    = '';
  document.getElementById('btn-start-mocniny').onclick    = spravnoSpustit;
  document.getElementById('btn-zpet-mocniny').onclick     = () => showScreen('screen-vyber');
  document.getElementById('btn-ukoncit-mocniny').onclick  = ukoncitHru;
  document.getElementById('btn-potvrdit-mocniny').onclick = potvrdit;
  document.getElementById('btn-neexistuje-mocniny').onclick = potvrditNeexistuje;

  document.getElementById('inp-odpoved-mocniny').onkeydown = e => {
    if (e.key === 'Enter') potvrdit();
  };

  if (window.matchMedia('(pointer: coarse)').matches) {
    const inp = document.getElementById('inp-odpoved-mocniny');
    inp.readOnly = true;
    inp.setAttribute('inputmode', 'none');
    document.getElementById('keypad-mocniny').querySelectorAll('.kkey').forEach(btn => {
      btn.onclick = e => {
        e.preventDefault();
        if (inp.disabled) return;
        const k = btn.dataset.k;
        if (k === 'back')    inp.value = inp.value.slice(0, -1);
        else if (k === 'ok') potvrdit();
        else                 inp.value += k;
      };
    });
  }
}

function prepniTyp(typ) {
  const el = document.getElementById(`btn-mocniny-${typ}`);
  el.classList.toggle('selected');
  if (el.classList.contains('selected')) {
    vybraneTypy.push(typ);
  } else {
    vybraneTypy = vybraneTypy.filter(t => t !== typ);
  }
  document.getElementById('mocniny-error').textContent = '';
}

function spravnoSpustit() {
  if (vybraneTypy.length === 0) {
    document.getElementById('mocniny-error').textContent = 'Vyber alespoň jeden typ příkladu!';
    return;
  }
  startHra([...vybraneTypy]);
}

function ukoncitHru() {
  if (casovacId) { clearInterval(casovacId); casovacId = null; }
  hraProbiha      = false;
  aktualniPriklad = null;
  initMocniny();
  showScreen('screen-welcome-mocniny');
}

function startHra(typy) {
  aktualniTypy     = typy;
  body             = 0;
  celkemOtazek     = 0;
  historiePrikladu = [];
  prvniPokus       = true;
  zbyvajiciCas     = DOBA_HRY;
  hraProbiha       = true;

  if (casovacId) clearInterval(casovacId);

  const lblCas = document.getElementById('lbl-priklad-mocniny');
  lblCas.previousElementSibling.textContent = 'Čas';
  lblCas.textContent                         = formatCas(DOBA_HRY);

  document.getElementById('lbl-body-mocniny').textContent     = 0;
  document.getElementById('lbl-rekord-mocniny').textContent   = stav.jeHost ? '—' : stav.osobniMaxMocniny;
  document.getElementById('progress-mocniny').style.width     = '0%';
  document.getElementById('lbl-komentar-mocniny').textContent = '';
  document.getElementById('lbl-komentar-mocniny').className   = 'komentar';
  document.getElementById('record-hint-mocniny').textContent  = '';

  const inp = document.getElementById('inp-odpoved-mocniny');
  inp.value    = '';
  inp.disabled = false;
  document.getElementById('btn-potvrdit-mocniny').disabled   = false;
  document.getElementById('btn-neexistuje-mocniny').disabled = false;

  showScreen('screen-game-mocniny');
  novyPriklad();
  casovacId = setInterval(tikTimer, 1000);
}

function tikTimer() {
  zbyvajiciCas--;
  document.getElementById('lbl-priklad-mocniny').textContent = formatCas(zbyvajiciCas);
  document.getElementById('progress-mocniny').style.width    = ((DOBA_HRY - zbyvajiciCas) / DOBA_HRY * 100) + '%';
  if (zbyvajiciCas <= 0) konecHry();
}

function konecHry() {
  clearInterval(casovacId);
  casovacId  = null;
  hraProbiha = false;
  aktualniPriklad = null;

  const inp = document.getElementById('inp-odpoved-mocniny');
  inp.disabled = true;
  document.getElementById('btn-potvrdit-mocniny').disabled   = true;
  document.getElementById('btn-neexistuje-mocniny').disabled = true;

  setTimeout(() => zobrazVysledkyMocniny(body, historiePrikladu), 600);
}

function generuj(typy) {
  const typ = typy[Math.floor(Math.random() * typy.length)];

  if (typ === '2pow') {
    const b = Math.floor(Math.random() * 12) + 1;
    return { latex: `${b}^{2}`, odpoved: b * b, popis: `${b}² = ${b * b}` };
  }

  if (typ === '2root') {
    if (Math.random() < 0.4) {
      const neg = CTVERECE_NEG[Math.floor(Math.random() * CTVERECE_NEG.length)];
      return { latex: `\\sqrt{${neg}}`, odpoved: 'neexistuje', popis: `√(${neg}) = neexistuje` };
    }
    const sq = CTVERECE[Math.floor(Math.random() * CTVERECE.length)];
    const r  = Math.round(Math.sqrt(sq));
    return { latex: `\\sqrt{${sq}}`, odpoved: r, popis: `√${sq} = ${r}` };
  }

  if (typ === '3pow') {
    const b = Math.floor(Math.random() * 6) + 1;
    return { latex: `${b}^{3}`, odpoved: b * b * b, popis: `${b}³ = ${b * b * b}` };
  }

  if (typ === '3root') {
    const cb = KOSTKY[Math.floor(Math.random() * KOSTKY.length)];
    const r  = Math.round(Math.cbrt(cb));
    return { latex: `\\sqrt[3]{${cb}}`, odpoved: r, popis: `∛${cb} = ${r}` };
  }

  if (typ === 'neg') {
    if (Math.random() < 0.5) {
      const b = Math.floor(Math.random() * 12) + 1;
      return { latex: `(-${b})^{2}`, odpoved: b * b, popis: `(-${b})² = ${b * b}` };
    }
    const b = Math.floor(Math.random() * 6) + 1;
    return { latex: `(-${b})^{3}`, odpoved: -(b * b * b), popis: `(-${b})³ = ${-(b * b * b)}` };
  }

  if (typ === 'dec') {
    const round = (x, p) => Math.round(x * 10 ** p) / 10 ** p;
    const dl = x => String(x).replace('.', '{,}');
    const ds = x => String(x).replace('.', ',');
    const sub = ['2pow', '2root', '3pow', '3root'][Math.floor(Math.random() * 4)];
    const neg = (sub === '2pow' || sub === '3pow') && Math.random() < 0.3;
    const sign = neg ? '-' : '';

    if (sub === '2pow') {
      const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 15, 25];
      const b    = pool[Math.floor(Math.random() * pool.length)];
      const base = round(b / 10, 2);
      const ans  = round(base * base, 4);
      return { latex: `(${sign}${dl(base)})^{2}`, odpoved: ans, popis: `(${sign}${ds(base)})² = ${ds(ans)}` };
    }
    if (sub === '2root') {
      const ctv   = CTVERECE.filter(x => x !== 100);
      const sq    = ctv[Math.floor(Math.random() * ctv.length)];
      const inner = round(sq / 100, 4);
      const ans   = round(Math.sqrt(sq) / 10, 2);
      return { latex: `\\sqrt{${dl(inner)}}`, odpoved: ans, popis: `√${ds(inner)} = ${ds(ans)}` };
    }
    if (sub === '3pow') {
      const b    = Math.floor(Math.random() * 6) + 1;
      const base = round(b / 10, 1);
      const ans  = round(base * base * base, 4);
      const res  = neg ? round(-ans, 4) : ans;
      return { latex: `(${sign}${dl(base)})^{3}`, odpoved: res, popis: `(${sign}${ds(base)})³ = ${ds(res)}` };
    }
    const cb    = KOSTKY[Math.floor(Math.random() * KOSTKY.length)];
    const inner = round(cb / 1000, 4);
    const ans   = round(Math.cbrt(cb) / 10, 2);
    return { latex: `\\sqrt[3]{${dl(inner)}}`, odpoved: ans, popis: `∛${ds(inner)} = ${ds(ans)}` };
  }

  // 'frac'
  {
    const sub  = ['2pow', '2root', '3pow', '3root'][Math.floor(Math.random() * 4)];
    const neg  = (sub === '2pow' || sub === '3pow') && Math.random() < 0.3;
    const [fn, fd] = FRAC_PAIRS[Math.floor(Math.random() * FRAC_PAIRS.length)];
    const ps   = neg ? '-' : '';

    if (sub === '2pow') {
      const latex = neg
        ? `\\left(-\\frac{${fn}}{${fd}}\\right)^{2}`
        : `\\left(\\frac{${fn}}{${fd}}\\right)^{2}`;
      return { latex, odpoved: { n: fn * fn, d: fd * fd }, popis: `(${ps}${fn}/${fd})² = ${fn * fn}/${fd * fd}` };
    }
    if (sub === '2root') {
      return {
        latex:   `\\sqrt{\\frac{${fn * fn}}{${fd * fd}}}`,
        odpoved: { n: fn, d: fd },
        popis:   `√(${fn * fn}/${fd * fd}) = ${fn}/${fd}`,
      };
    }
    if (sub === '3pow') {
      const latex = neg
        ? `\\left(-\\frac{${fn}}{${fd}}\\right)^{3}`
        : `\\left(\\frac{${fn}}{${fd}}\\right)^{3}`;
      const ansN = neg ? -(fn * fn * fn) : fn * fn * fn;
      return { latex, odpoved: { n: ansN, d: fd * fd * fd }, popis: `(${ps}${fn}/${fd})³ = ${ansN}/${fd * fd * fd}` };
    }
    return {
      latex:   `\\sqrt[3]{\\frac{${fn * fn * fn}}{${fd * fd * fd}}}`,
      odpoved: { n: fn, d: fd },
      popis:   `∛(${fn * fn * fn}/${fd * fd * fd}) = ${fn}/${fd}`,
    };
  }
}

function novyPriklad() {
  document.getElementById('lbl-komentar-mocniny').textContent = '';
  document.getElementById('lbl-komentar-mocniny').className   = 'komentar';

  const inp    = document.getElementById('inp-odpoved-mocniny');
  inp.value    = '';
  inp.disabled = false;
  document.getElementById('btn-potvrdit-mocniny').disabled   = false;
  document.getElementById('btn-neexistuje-mocniny').disabled = false;

  aktualniPriklad = generuj(aktualniTypy);

  katex.render(aktualniPriklad.latex + ' = ?', document.getElementById('lbl-priklad-latex'), {
    throwOnError: false,
    displayMode: true,
  });

  inp.focus();
}

function zpracujOdpoved(_uzivatelOdpoved, spravne) {
  const kom = document.getElementById('lbl-komentar-mocniny');

  if (!spravne) {
    prvniPokus = false;
    kom.textContent = `✗ Správně: ${aktualniPriklad.popis}`;
    kom.className   = 'komentar wrong';
    setTimeout(() => {
      if (!hraProbiha) return;
      const inp = document.getElementById('inp-odpoved-mocniny');
      inp.value    = '';
      inp.disabled = false;
      document.getElementById('btn-potvrdit-mocniny').disabled   = false;
      document.getElementById('btn-neexistuje-mocniny').disabled = false;
      inp.focus();
    }, 400);
    return;
  }

  const byloPrve = prvniPokus;
  prvniPokus = true;
  celkemOtazek++;
  historiePrikladu.push({ popis: aktualniPriklad.popis, spravne: byloPrve });

  if (byloPrve) {
    body++;
    document.getElementById('lbl-body-mocniny').textContent = body;
    updateHint('record-hint-mocniny', body, stav.osobniMaxMocniny, stav.globalMaxMocniny);
  }

  kom.textContent = `✓ ${aktualniPriklad.popis}`;
  kom.className   = 'komentar correct';

  aktualniPriklad = null;
  setTimeout(novyPriklad, 600);
}

function potvrdit() {
  if (!aktualniPriklad) return;

  const inp   = document.getElementById('inp-odpoved-mocniny');
  const vstup = parseVstup(inp.value);

  if (!vstup) {
    inp.classList.add('shake');
    setTimeout(() => inp.classList.remove('shake'), 300);
    return;
  }

  inp.disabled = true;
  document.getElementById('btn-potvrdit-mocniny').disabled   = true;
  document.getElementById('btn-neexistuje-mocniny').disabled = true;

  const spravne = aktualniPriklad.odpoved !== 'neexistuje' && srovnej(vstup, aktualniPriklad.odpoved);
  zpracujOdpoved(inp.value.trim(), spravne);
}

function potvrditNeexistuje() {
  if (!aktualniPriklad) return;

  const inp = document.getElementById('inp-odpoved-mocniny');
  inp.disabled = true;
  document.getElementById('btn-potvrdit-mocniny').disabled   = true;
  document.getElementById('btn-neexistuje-mocniny').disabled = true;

  zpracujOdpoved('neexistuje', aktualniPriklad.odpoved === 'neexistuje');
}
