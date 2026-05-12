// delitelnost.js — Hra: Sestřel dělitelná čísla

import { stav, showScreen } from './main.js';
import { zobrazVysledkyDelitelnost } from './vysledky.js';

const OBTIZNOSTI = {
  lehka:   { rychlost: 0.9,  spawn: 2200, maxCisel: 7,  zivoty: 5, cislaMax: 30  },
  stredni: { rychlost: 1.6,  spawn: 1600, maxCisel: 9,  zivoty: 3, cislaMax: 50  },
  tezka:   { rychlost: 2.6,  spawn: 1000, maxCisel: 11, zivoty: 3, cislaMax: 100 },
};

const VYZVY = {
  lehka: [
    { del: [2],  op: 'nebo' },
    { del: [3],  op: 'nebo' },
    { del: [5],  op: 'nebo' },
    { del: [4],  op: 'nebo' },
    { del: [6],  op: 'nebo' },
    { del: [9],  op: 'nebo' },
    { del: [7],  op: 'nebo' },
    { del: [10], op: 'nebo' },
    { del: [8],  op: 'nebo' },
    { del: [2],  op: 'nebo' },
  ],
  stredni: [
    { del: [2],    op: 'nebo' },
    { del: [3, 5], op: 'nebo' },
    { del: [4],    op: 'nebo' },
    { del: [2, 7], op: 'nebo' },
    { del: [6],    op: 'nebo' },
    { del: [3, 7], op: 'nebo' },
    { del: [5],    op: 'nebo' },
    { del: [2, 9], op: 'nebo' },
    { del: [8],    op: 'nebo' },
    { del: [4, 5], op: 'nebo' },
  ],
  tezka: [
    { del: [2, 3],    op: 'nebo' },
    { del: [2, 3],    op: 'a'    },
    { del: [3, 5],    op: 'nebo' },
    { del: [2, 5],    op: 'a'    },
    { del: [2, 7],    op: 'nebo' },
    { del: [2, 3, 5], op: 'nebo' },
    { del: [3, 7],    op: 'a'    },
    { del: [2, 3, 7], op: 'nebo' },
    { del: [5, 7],    op: 'nebo' },
    { del: [4, 9],    op: 'nebo' },
  ],
};

const NA_UROVEN  = 10;
const CISLO_SIZE = 54;

let obtiznost        = null;
let cislaList        = [];
let skore            = 0;
let zivoty           = 0;
let uroven           = 0;
let spravneNaUroven  = 0;
let aktualniVyzva    = null;
let aktualniRychlost = 0;
let hraProbiha       = false;
let animId           = null;
let spawnId          = null;
let hintId           = null;
let lastTs           = 0;
let nextId           = 0;
let plochEl          = null;
let plochHeight      = 0;
let plochWidth       = 0;

export function initDelitelnost() {
  obtiznost = null;
  ['lehka', 'stredni', 'tezka'].forEach(d => {
    const el = document.getElementById(`btn-del-${d}`);
    el.classList.remove('selected');
    el.onclick = () => vybratObtiznost(d);
  });
  document.getElementById('del-error').textContent   = '';
  document.getElementById('btn-start-del').onclick   = spravnoSpustit;
  document.getElementById('btn-zpet-del').onclick    = () => showScreen('screen-vyber');
  document.getElementById('btn-ukoncit-del').onclick = ukoncitHru;
}

function vybratObtiznost(d) {
  obtiznost = d;
  ['lehka', 'stredni', 'tezka'].forEach(t => {
    document.getElementById(`btn-del-${t}`).classList.toggle('selected', t === d);
  });
  document.getElementById('del-error').textContent = '';
}

function spravnoSpustit() {
  if (!obtiznost) {
    document.getElementById('del-error').textContent = 'Vyber obtížnost!';
    return;
  }
  startHra();
}

function startHra() {
  stav.aktualniHra = 'delitelnost';
  const conf = OBTIZNOSTI[obtiznost];

  skore            = 0;
  zivoty           = conf.zivoty;
  uroven           = 0;
  spravneNaUroven  = 0;
  aktualniVyzva    = VYZVY[obtiznost][0];
  aktualniRychlost = conf.rychlost;
  cislaList        = [];
  lastTs           = 0;
  nextId           = 0;
  hraProbiha       = true;

  cancelAnimationFrame(animId);
  clearInterval(spawnId);
  clearTimeout(hintId);

  showScreen('screen-game-del');

  plochEl           = document.getElementById('del-plocha');
  plochEl.innerHTML = '';
  plochHeight       = plochEl.clientHeight;
  plochWidth        = plochEl.clientWidth;

  renderHeader();
  setHint('', '');

  animId  = requestAnimationFrame(gameLoop);
  spawnId = setInterval(spawnCislo, conf.spawn);
  spawnCislo();
}

function formatVyzva(v) {
  if (v.del.length === 1) return `Dělitelné číslem ${v.del[0]}`;
  const sep = v.op === 'nebo' ? ' nebo ' : ' a ';
  return `Dělitelné: ${v.del.join(sep)}`;
}

function jeTarget(hodnota, vyzva) {
  if (vyzva.op === 'nebo') return vyzva.del.some(d => hodnota % d === 0);
  return vyzva.del.every(d => hodnota % d === 0);
}

function renderHeader() {
  document.getElementById('lbl-skore-del').textContent  = skore;
  document.getElementById('lbl-vyzva-del').textContent  = formatVyzva(aktualniVyzva);
  document.getElementById('progress-del').style.width   = (spravneNaUroven / NA_UROVEN * 100) + '%';
  document.getElementById('lbl-uroven-del').textContent = `${spravneNaUroven}/${NA_UROVEN}`;

  const maxZ = OBTIZNOSTI[obtiznost].zivoty;
  document.getElementById('lbl-zivoty-del').textContent =
    '❤️'.repeat(Math.max(0, zivoty)) + '🖤'.repeat(Math.max(0, maxZ - zivoty));
}

function setHint(text, cls) {
  clearTimeout(hintId);
  const el = document.getElementById('del-hint');
  el.textContent = text;
  el.className   = `del-hint text-center${cls ? ' ' + cls : ''}`;
  if (text) hintId = setTimeout(() => { el.textContent = ''; el.className = 'del-hint text-center'; }, 1800);
}

function spawnCislo() {
  if (!hraProbiha) return;
  const conf   = OBTIZNOSTI[obtiznost];
  const aktivni = cislaList.filter(c => !c.odstranen).length;
  if (aktivni >= conf.maxCisel) return;

  const hodnota = Math.floor(Math.random() * conf.cislaMax) + 1;
  const maxX    = Math.max(10, plochWidth - CISLO_SIZE - 4);
  const x       = Math.random() * maxX + 2;

  const el = document.createElement('div');
  el.className   = 'del-cislo';
  el.textContent = hodnota;
  el.style.left  = x + 'px';
  el.style.top   = (-CISLO_SIZE) + 'px';
  plochEl.appendChild(el);

  const cislo = { id: nextId++, hodnota, x, y: -CISLO_SIZE, el, odstranen: false };

  el.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (!hraProbiha || cislo.odstranen) return;
    sestrelCislo(cislo);
  });

  cislaList.push(cislo);
}

function sestrelCislo(cislo) {
  if (cislo.odstranen) return;
  cislo.odstranen = true;
  cislo.el.style.pointerEvents = 'none';

  if (jeTarget(cislo.hodnota, aktualniVyzva)) {
    skore++;
    spravneNaUroven++;
    cislo.el.classList.add('del-correct');
    setHint('✓ Správně!', 'del-ok');
    renderHeader();
    if (spravneNaUroven >= NA_UROVEN) dalsiUroven();
    setTimeout(() => odstranEl(cislo), 350);
  } else {
    zivoty = Math.max(0, zivoty - 1);
    cislo.el.classList.add('del-wrong');
    setHint(`✗ ${cislo.hodnota} sem nepatří!`, 'del-nok');
    renderHeader();
    setTimeout(() => odstranEl(cislo), 350);
    if (zivoty <= 0) {
      hraProbiha = false;
      setTimeout(gameOver, 450);
    }
  }
}

function odstranEl(cislo) {
  if (cislo.el && cislo.el.parentNode) cislo.el.parentNode.removeChild(cislo.el);
}

function dalsiUroven() {
  spravneNaUroven  = 0;
  uroven++;
  const vyzvy      = VYZVY[obtiznost];
  aktualniVyzva    = vyzvy[uroven % vyzvy.length];
  aktualniRychlost = OBTIZNOSTI[obtiznost].rychlost + uroven * 0.15;
  setHint('🎯 Nová výzva!', 'del-levelup');
  renderHeader();
}

function gameLoop(ts) {
  if (!hraProbiha) return;

  const delta = lastTs > 0 ? Math.min(ts - lastTs, 50) : 16;
  lastTs = ts;

  let gameEnded = false;

  for (let i = cislaList.length - 1; i >= 0; i--) {
    const c = cislaList[i];
    if (c.odstranen) { cislaList.splice(i, 1); continue; }

    c.y += aktualniRychlost * delta / 16;
    c.el.style.top = c.y + 'px';

    if (c.y > plochHeight) {
      c.odstranen = true;
      if (jeTarget(c.hodnota, aktualniVyzva)) {
        zivoty = Math.max(0, zivoty - 1);
        setHint(`💥 Uniklo ${c.hodnota}!`, 'del-nok');
        renderHeader();
        if (zivoty <= 0) {
          gameEnded = true;
          odstranEl(c);
          cislaList.splice(i, 1);
          break;
        }
      }
      odstranEl(c);
      cislaList.splice(i, 1);
    }
  }

  if (gameEnded) {
    hraProbiha = false;
    setTimeout(gameOver, 400);
  } else {
    animId = requestAnimationFrame(gameLoop);
  }
}

function ukoncitHru() {
  stopHra();
  initDelitelnost();
  showScreen('screen-welcome-del');
}

function stopHra() {
  hraProbiha = false;
  cancelAnimationFrame(animId);
  clearInterval(spawnId);
  clearTimeout(hintId);
  cislaList.forEach(c => odstranEl(c));
  cislaList = [];
  if (plochEl) plochEl.innerHTML = '';
}

function gameOver() {
  stopHra();
  zobrazVysledkyDelitelnost(skore, uroven);
}
