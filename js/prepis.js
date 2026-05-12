// prepis.js — Hra: Přepis textu

import { stav, showScreen } from './main.js';
import { zobrazVysledkyPrepis } from './vysledky.js';
import { initZebricek } from './zebricek.js';

import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getDatabase, ref, get }   from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';

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

const CAS_HRY   = 60;
const MIN_ZNAKU = 800;

// ── Lokální stav ──────────────────────────────────────
let celkovyText   = '';
let charSpans     = [];
let pozice        = 0;
let chybaPozice   = false;
let celkemChyb    = 0;
let casZbyvajici  = CAS_HRY;
let timerInterval = null;
let keyHandler    = null;

// ── Inicializace ──────────────────────────────────────
export function initPrepis() {
  document.getElementById('lbl-osobni-prepis').textContent = stav.jeHost ? '—' : stav.osobniMaxPrepis;
  document.getElementById('lbl-global-prepis').textContent = stav.jeHost ? '—' : stav.globalMaxPrepis;
  document.getElementById('prepis-error').textContent      = '';

  document.getElementById('btn-start-prepis').onclick            = spravnoSpustit;
  document.getElementById('btn-zpet-prepis').onclick             = () => showScreen('screen-vyber');
  document.getElementById('btn-zebricek-welcome-prepis').onclick = () => initZebricek('screen-welcome-prepis', 'prepis');
  document.getElementById('btn-ukoncit-prepis').onclick          = ukoncitHru;
}

// ── Načtení a spuštění ────────────────────────────────
async function spravnoSpustit() {
  const errEl    = document.getElementById('prepis-error');
  const btnStart = document.getElementById('btn-start-prepis');

  errEl.textContent    = '';
  btnStart.disabled    = true;
  btnStart.textContent = '⏳ Načítám...';

  try {
    const snap = await get(ref(db, 'prepis/vety'));

    btnStart.disabled    = false;
    btnStart.textContent = '▶ Začít hru';

    if (!snap.exists()) { errEl.textContent = 'Žádný text v databázi.'; return; }

    const vsechny = Object.values(snap.val()).map(v => v.veta).filter(Boolean);
    if (vsechny.length === 0) { errEl.textContent = 'Žádný text v databázi.'; return; }

    celkovyText = generujText(vsechny);
    startHra();
  } catch (e) {
    btnStart.disabled    = false;
    btnStart.textContent = '▶ Začít hru';
    errEl.textContent    = 'Chyba načítání: ' + e.message;
  }
}

// ── Generování textu (zajistí dost znaků pro celou minutu) ─
function generujText(vety) {
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  let text = shuffle(vety).join(' ');
  while (text.length < MIN_ZNAKU) {
    text += ' ' + shuffle(vety).join(' ');
  }
  return text;
}

// ── Spuštění hry ──────────────────────────────────────
function startHra() {
  pozice       = 0;
  chybaPozice  = false;
  celkemChyb   = 0;
  casZbyvajici = CAS_HRY;
  charSpans    = [];

  const box = document.getElementById('prepis-text');
  box.innerHTML = '';

  for (const ch of celkovyText) {
    const span = document.createElement('span');
    span.className   = 'prepis-char';
    span.textContent = ch;
    box.appendChild(span);
    charSpans.push(span);
  }

  box.scrollTop = 0;

  document.getElementById('lbl-cas-prepis').textContent   = CAS_HRY;
  document.getElementById('lbl-wpm-prepis').textContent   = '0';
  document.getElementById('lbl-chyby-prepis').textContent = '0';
  document.getElementById('progress-prepis').style.width  = '100%';

  aktualizujKurzor();

  keyHandler = e => onKey(e);
  document.addEventListener('keydown', keyHandler);

  showScreen('screen-game-prepis');
  startTimer();
}

// ── Časovač ───────────────────────────────────────────
function startTimer() {
  timerInterval = setInterval(() => {
    casZbyvajici--;
    document.getElementById('lbl-cas-prepis').textContent  = casZbyvajici;
    document.getElementById('progress-prepis').style.width = (casZbyvajici / CAS_HRY * 100) + '%';

    const elapsed = CAS_HRY - casZbyvajici;
    const cpm = elapsed > 0 ? Math.round(pozice / (elapsed / 60)) : 0;
    document.getElementById('lbl-wpm-prepis').textContent = cpm;

    if (casZbyvajici <= 0) {
      clearInterval(timerInterval);
      document.removeEventListener('keydown', keyHandler);
      // pozice = přesný počet znaků za 60 sekund = CPM
      zobrazVysledkyPrepis(pozice, celkemChyb, CAS_HRY);
    }
  }, 1000);
}

// ── Zvýraznění znaků ──────────────────────────────────
function aktualizujKurzor() {
  charSpans.forEach((s, i) => {
    if (i < pozice)        s.className = 'prepis-char typed';
    else if (i === pozice) s.className = chybaPozice ? 'prepis-char error' : 'prepis-char current';
    else                   s.className = 'prepis-char';
  });
  posunRadek();
}

// ── Posun o řádek při vstupu na 3. viditelný řádek ───
function posunRadek() {
  const span = charSpans[pozice];
  if (!span) return;
  const box     = document.getElementById('prepis-text');
  const lineH   = parseFloat(getComputedStyle(box).lineHeight);
  const boxRect  = box.getBoundingClientRect();
  const spanRect = span.getBoundingClientRect();
  if (spanRect.top - boxRect.top >= 2 * lineH - 1) {
    box.scrollTop += lineH;
  }
}

// ── Předčasné ukončení ────────────────────────────────
function ukoncitHru() {
  clearInterval(timerInterval);
  if (keyHandler) document.removeEventListener('keydown', keyHandler);
  showScreen('screen-welcome-prepis');
}

// ── Zpracování klávesy ────────────────────────────────
function onKey(e) {
  if (pozice >= celkovyText.length) return;
  if (e.key === ' ') e.preventDefault();
  if (e.key.length !== 1) return;

  if (e.key === celkovyText[pozice]) {
    chybaPozice = false;
    pozice++;
    aktualizujKurzor();
  } else {
    if (!chybaPozice) {
      chybaPozice = true;
      celkemChyb++;
      document.getElementById('lbl-chyby-prepis').textContent = celkemChyb;
    }
    aktualizujKurzor();
  }
}
