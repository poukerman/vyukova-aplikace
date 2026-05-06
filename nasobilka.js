// ═══════════════════════════════════════════════════════
// nasobilka.js  —  Hra: Malá násobilka (násobení + dělení)
// ═══════════════════════════════════════════════════════

import { stav, showScreen, updateHint } from './main.js';
import { zobrazVysledkyNasobilka } from './vysledky.js';
import { initZebricek } from './zebricek.js';

// ── Konfigurace ───────────────────────────────────────
const CAS = 120; // sekundy

// ── Lokální stav ──────────────────────────────────────
let body = 0;
let casZbyva = CAS;
let timerInterval = null;
let nasA, nasB, soucin;
let typPrikladu; // 'nasobeni' | 'deleni'

// ── Inicializace ──────────────────────────────────────
export function initNasobilka() {
  document.getElementById('btn-start-nasobilka').onclick      = startHra;
  document.getElementById('btn-zpet-nasobilka').onclick       = () => showScreen('screen-vyber');
  document.getElementById('btn-potvrdit-nas').onclick         = zkontrolovat;
  document.getElementById('btn-zebricek-welcome-nas').onclick = () => initZebricek('screen-welcome-nasobilka', 'nasobilka');
  document.getElementById('inp-odpoved-nas').onkeydown        = e => { if (e.key === 'Enter') zkontrolovat(); };

  if (window.matchMedia('(pointer: coarse)').matches) {
    const inp = document.getElementById('inp-odpoved-nas');
    inp.readOnly = true;
    inp.setAttribute('inputmode', 'none');
    document.getElementById('keypad-nas').querySelectorAll('.kkey').forEach(btn => {
      btn.onclick = e => {
        e.preventDefault();
        const k = btn.dataset.k;
        if (k === 'back')     inp.value = inp.value.slice(0, -1);
        else if (k === 'ok')  zkontrolovat();
        else                  inp.value += k;
      };
    });
  }
}

// ── Spuštění hry ──────────────────────────────────────
function startHra() {
  body = 0;
  document.getElementById('lbl-body-nas').textContent     = 0;
  document.getElementById('lbl-rekord-nas').textContent   = stav.osobniMaxNas;
  document.getElementById('lbl-komentar-nas').textContent = '';
  document.getElementById('lbl-komentar-nas').className   = 'komentar';
  document.getElementById('record-hint-nas').textContent  = '';
  showScreen('screen-game-nasobilka');
  novyPriklad();
  document.getElementById('inp-odpoved-nas').focus();
  startTimer();
}

// ── Nový příklad ──────────────────────────────────────
function novyPriklad() {
  typPrikladu = Math.random() < 0.5 ? 'nasobeni' : 'deleni';

  nasA   = Math.floor(Math.random() * 9) + 1;
  nasB   = Math.floor(Math.random() * 9) + 1;
  soucin = nasA * nasB;

  const lbl = document.getElementById('lbl-priklad');
  lbl.style.animation = 'none';

  if (typPrikladu === 'nasobeni') {
    lbl.textContent = `${nasA} • ${nasB}`;
  } else {
    lbl.textContent = `${soucin} : ${nasA}`;
  }

  requestAnimationFrame(() => {
    lbl.style.animation = 'popIn .3s cubic-bezier(.34,1.56,.64,1)';
  });
  document.getElementById('inp-odpoved-nas').value = '';
}

// ── Zkontrolování odpovědi ────────────────────────────
function zkontrolovat() {
  const inp = document.getElementById('inp-odpoved-nas');
  const val = parseInt(inp.value);
  const kom = document.getElementById('lbl-komentar-nas');
  if (isNaN(val)) { kom.textContent = 'Napiš číslo!'; kom.className = 'komentar wrong'; return; }

  const spravna = (typPrikladu === 'nasobeni') ? soucin : nasB;

  if (val === spravna) {
    body++;
    document.getElementById('lbl-body-nas').textContent = body;
    kom.textContent = '✓ Správně!'; kom.className = 'komentar correct';
    updateHint('record-hint-nas', body, stav.osobniMaxNas, stav.globalMaxNas);
    novyPriklad();
    document.getElementById('inp-odpoved-nas').focus();
  } else {
    inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake');
    kom.textContent = `✗ Správně bylo ${spravna}`; kom.className = 'komentar wrong';
    inp.value = '';
  }
}

// ── Časovač ───────────────────────────────────────────
function startTimer() {
  casZbyva = CAS;
  document.getElementById('lbl-cas-nas').textContent    = CAS;
  document.getElementById('progress-nas').style.width   = '100%';
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    casZbyva--;
    document.getElementById('lbl-cas-nas').textContent  = casZbyva;
    document.getElementById('progress-nas').style.width = (casZbyva / CAS * 100) + '%';
    if (casZbyva <= 0) { clearInterval(timerInterval); zobrazVysledkyNasobilka(body); }
  }, 1000);
}
