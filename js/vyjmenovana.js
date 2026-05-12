// vyjmenovana.js — Hra: Vyjmenovaná slova (kategorie z Firebase)

import { stav, showScreen, updateHint } from './main.js';
import { zobrazVysledkyVyjmenovana } from './vysledky.js';
import { initZebricek } from './zebricek.js';

import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getDatabase, ref, get }           from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';

const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyAE_kjebwQrSzeEz9-3c_Y66TUBAvRIjB4',
  authDomain:        'malanasobilka.firebaseapp.com',
  databaseURL:       'https://malanasobilka-default-rtdb.firebaseio.com',
  projectId:         'malanasobilka',
  storageBucket:     'malanasobilka.firebasestorage.app',
  messagingSenderId: '712520835692',
  appId:             '1:712520835692:web:6746f62321750e264a6e49',
};

const APP_NAME = 'eduhry';
const fbApp    = getApps().find(a => a.name === APP_NAME) ?? initializeApp(FIREBASE_CONFIG, APP_NAME);
const db       = getDatabase(fbApp);

const KATEGORIE = ['b', 'l', 'm', 'p', 's', 'v', 'z'];
const POCET_MAX = 20;

// ── Lokální stav ──────────────────────────────────────
let vybraneKat       = new Set();
let body             = 0;
let celkemOtazek     = 0;
let pocetPrikladu    = POCET_MAX;
let historiePrikladu = [];
let aktualniSlova    = [];
let aktualniSlovo    = null;
let pouzitaIndexy    = new Set();

// ── Inicializace ──────────────────────────────────────
export function initVyjmenovana() {
  vybraneKat = new Set();

  KATEGORIE.forEach(kat => {
    const el = document.getElementById(`btn-kat-${kat}`);
    if (!el) return;
    el.classList.remove('selected');
    el.onclick = () => prepniKat(kat);
  });

  document.getElementById('vyjm-kat-error').textContent = '';

  document.getElementById('btn-vyjm-vse').onclick = () => {
    KATEGORIE.forEach(k => {
      vybraneKat.add(k);
      document.getElementById(`btn-kat-${k}`)?.classList.add('selected');
    });
    document.getElementById('vyjm-kat-error').textContent = '';
  };

  document.getElementById('btn-vyjm-nic').onclick = () => {
    vybraneKat.clear();
    KATEGORIE.forEach(k => document.getElementById(`btn-kat-${k}`)?.classList.remove('selected'));
  };

  document.getElementById('btn-start-vyjmenovana').onclick    = spravnoSpustit;
  document.getElementById('btn-zpet-vyjmenovana').onclick     = () => showScreen('screen-vyber');
  document.getElementById('btn-zebricek-welcome-vyjm').onclick = () => initZebricek('screen-welcome-vyjmenovana', 'vyjmenovana');
  document.getElementById('btn-ukoncit-vyjm').onclick         = ukoncitHru;

  document.querySelectorAll('.vyjm-btn').forEach(btn => {
    btn.onclick = () => odpovez(btn.dataset.val);
  });
}

// ── Přepnutí výběru kategorie ─────────────────────────
function prepniKat(kat) {
  const el = document.getElementById(`btn-kat-${kat}`);
  if (vybraneKat.has(kat)) {
    vybraneKat.delete(kat);
    el.classList.remove('selected');
  } else {
    vybraneKat.add(kat);
    el.classList.add('selected');
  }
  document.getElementById('vyjm-kat-error').textContent = '';
}

// ── Spuštění s validací ───────────────────────────────
async function spravnoSpustit() {
  const errEl   = document.getElementById('vyjm-kat-error');
  const btnStart = document.getElementById('btn-start-vyjmenovana');

  if (vybraneKat.size === 0) {
    errEl.textContent = 'Vyber alespoň jedno písmeno!';
    return;
  }

  errEl.textContent         = '';
  btnStart.disabled         = true;
  btnStart.textContent      = '⏳ Načítám...';

  try {
    const slova = await nactiSlova([...vybraneKat]);

    btnStart.disabled    = false;
    btnStart.textContent = '▶ Začít hru';

    if (slova.length === 0) {
      errEl.textContent = 'Pro vybraná písmena nejsou žádná slovní spojení v databázi.';
      return;
    }

    startHra(slova);
  } catch (e) {
    btnStart.disabled    = false;
    btnStart.textContent = '▶ Začít hru';
    errEl.textContent    = 'Chyba načítání: ' + e.message;
  }
}

// ── Načtení slov z Firebase ───────────────────────────
async function nactiSlova(kategorie) {
  const slova = [];

  for (const kat of kategorie) {
    const snap = await get(ref(db, `vyjmenovana/${kat}`));
    if (!snap.exists()) continue;
    Object.values(snap.val()).forEach(s => {
      if (s.veta && s.odpoved) {
        slova.push({ veta: s.veta, odpoved: s.odpoved });
      }
    });
  }

  // Fisher-Yates shuffle
  for (let i = slova.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [slova[i], slova[j]] = [slova[j], slova[i]];
  }

  return slova;
}

// ── Předčasné ukončení ────────────────────────────────
function ukoncitHru() {
  aktualniSlovo = null;
  showScreen('screen-welcome-vyjmenovana');
}

// ── Spuštění hry ──────────────────────────────────────
function startHra(slova) {
  aktualniSlova    = slova;
  pocetPrikladu    = Math.min(POCET_MAX, slova.length);
  body             = 0;
  celkemOtazek     = 0;
  historiePrikladu = [];
  pouzitaIndexy    = new Set();

  document.getElementById('lbl-body-vyjm').textContent     = 0;
  document.getElementById('lbl-rekord-vyjm').textContent   = stav.osobniMaxVyjm;
  document.getElementById('lbl-priklad-vyjm').textContent  = `0/${pocetPrikladu}`;
  document.getElementById('progress-vyjm').style.width     = '0%';
  document.getElementById('lbl-komentar-vyjm').textContent = '';
  document.getElementById('lbl-komentar-vyjm').className   = 'komentar';
  document.getElementById('record-hint-vyjm').textContent  = '';
  document.getElementById('lbl-veta').textContent          = '';

  document.querySelectorAll('.vyjm-btn').forEach(b => { b.disabled = false; });
  showScreen('screen-game-vyjmenovana');
  novaOtazka();
}

// ── Nová otázka ───────────────────────────────────────
function novaOtazka() {
  document.getElementById('lbl-priklad-vyjm').textContent = `${celkemOtazek}/${pocetPrikladu}`;
  document.getElementById('progress-vyjm').style.width   = (celkemOtazek / pocetPrikladu * 100) + '%';

  if (pouzitaIndexy.size >= aktualniSlova.length) {
    pouzitaIndexy = new Set();
  }

  const dostupne = aktualniSlova
    .map((_, i) => i)
    .filter(i => !pouzitaIndexy.has(i));

  const idx = dostupne[Math.floor(Math.random() * dostupne.length)];
  pouzitaIndexy.add(idx);
  aktualniSlovo = aktualniSlova[idx];

  document.getElementById('lbl-veta').innerHTML            = aktualniSlovo.veta.replace('_', '<span class="blank">_</span>');
  document.getElementById('lbl-komentar-vyjm').textContent = '';
  document.getElementById('lbl-komentar-vyjm').className   = 'komentar';
}

// ── Zpracování odpovědi ───────────────────────────────
function odpovez(val) {
  if (!aktualniSlovo) return;
  document.querySelectorAll('.vyjm-btn').forEach(b => { b.disabled = true; });

  const kom        = document.getElementById('lbl-komentar-vyjm');
  const tlacitka   = document.querySelectorAll('.vyjm-btn');
  const spravne    = val === aktualniSlovo.odpoved;
  const vetaHotova = aktualniSlovo.veta.replace('_', aktualniSlovo.odpoved);

  historiePrikladu.push({
    veta:               aktualniSlovo.veta,
    spravnaOdpoved:     aktualniSlovo.odpoved,
    uzivatelovaOdpoved: val,
    spravne,
    vetaHotova,
  });

  celkemOtazek++;

  if (spravne) {
    body++;
    document.getElementById('lbl-body-vyjm').textContent = body;
    kom.textContent = `✓ ${vetaHotova}`;
    kom.className   = 'komentar correct';
    updateHint('record-hint-vyjm', body, stav.osobniMaxVyjm, stav.globalMaxVyjm);
    tlacitka.forEach(t => {
      if (t.dataset.val === val) {
        t.classList.add('correct-flash');
        setTimeout(() => t.classList.remove('correct-flash'), 400);
      }
    });
  } else {
    kom.textContent = `✗ Správně: ${vetaHotova}`;
    kom.className   = 'komentar wrong';
    tlacitka.forEach(t => {
      if (t.dataset.val === val) {
        t.classList.add('wrong-flash');
        setTimeout(() => t.classList.remove('wrong-flash'), 400);
      }
    });
  }

  aktualniSlovo = null;
  const prodleva = spravne ? 600 : 1000;

  if (celkemOtazek >= pocetPrikladu) {
    setTimeout(() => zobrazVysledkyVyjmenovana(body, pocetPrikladu, historiePrikladu), prodleva);
  } else {
    setTimeout(() => {
      document.querySelectorAll('.vyjm-btn').forEach(b => { b.disabled = false; });
      novaOtazka();
    }, prodleva);
  }
}
