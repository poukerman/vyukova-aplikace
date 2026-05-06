// nasobilka.js — Hra: Malá násobilka (násobení + dělení)

import { stav, showScreen, updateHint } from './main.js';
import { zobrazVysledkyNasobilka } from './vysledky.js';
import { initZebricek } from './zebricek.js';

const CAS = 120;

let elPriklad, elTelo, elBody, elRekord, elKomentar, elCas, elProgress, elHint, elInput;

let body       = 0;
let casZbyva   = CAS;
let timerId    = null;
let nasA, nasB, soucin;
let typPrikladu;

export function initNasobilka() {
  elPriklad  = document.getElementById('lbl-priklad');
  elTelo     = document.getElementById('lbl-cas-nas');
  elBody     = document.getElementById('lbl-body-nas');
  elRekord   = document.getElementById('lbl-rekord-nas');
  elKomentar = document.getElementById('lbl-komentar-nas');
  elProgress = document.getElementById('progress-nas');
  elHint     = document.getElementById('record-hint-nas');
  elInput    = document.getElementById('inp-odpoved-nas');

  document.getElementById('btn-start-nasobilka').addEventListener('click', startHra);
  document.getElementById('btn-zpet-nasobilka').addEventListener('click', () => showScreen('screen-vyber'));
  document.getElementById('btn-potvrdit-nas').addEventListener('click', zkontrolovat);
  document.getElementById('btn-zebricek-welcome-nas').addEventListener('click', () => initZebricek('screen-welcome-nasobilka', 'nasobilka'));
  elInput.addEventListener('keydown', e => { if (e.key === 'Enter') zkontrolovat(); });

  if (window.matchMedia('(pointer: coarse)').matches) {
    elInput.readOnly = true;
    elInput.setAttribute('inputmode', 'none');
    document.getElementById('keypad-nas').querySelectorAll('.kkey').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const k = btn.dataset.k;
        if (k === 'back')    elInput.value = elInput.value.slice(0, -1);
        else if (k === 'ok') zkontrolovat();
        else                 elInput.value += k;
      });
    });
  }
}

function startHra() {
  body = 0;
  elBody.textContent     = 0;
  elRekord.textContent   = stav.osobniMaxNas;
  elKomentar.textContent = '';
  elKomentar.className   = 'komentar';
  elHint.textContent     = '';
  showScreen('screen-game-nasobilka');
  novyPriklad();
  elInput.focus();
  startTimer();
}

function novyPriklad() {
  typPrikladu = Math.random() < 0.5 ? 'nasobeni' : 'deleni';
  nasA        = Math.floor(Math.random() * 9) + 1;
  nasB        = Math.floor(Math.random() * 9) + 1;
  soucin      = nasA * nasB;

  elPriklad.style.animation = 'none';
  elPriklad.textContent = typPrikladu === 'nasobeni'
    ? `${nasA} • ${nasB}`
    : `${soucin} : ${nasA}`;

  requestAnimationFrame(() => {
    elPriklad.style.animation = 'popIn .3s cubic-bezier(.34,1.56,.64,1)';
  });
  elInput.value = '';
}

function zkontrolovat() {
  const val     = parseInt(elInput.value, 10);
  const spravna = typPrikladu === 'nasobeni' ? soucin : nasB;

  if (isNaN(val)) {
    elKomentar.textContent = 'Napiš číslo!';
    elKomentar.className   = 'komentar wrong';
    return;
  }

  if (val === spravna) {
    body++;
    elBody.textContent     = body;
    elKomentar.textContent = '✓ Správně!';
    elKomentar.className   = 'komentar correct';
    updateHint('record-hint-nas', body, stav.osobniMaxNas, stav.globalMaxNas);
    novyPriklad();
    elInput.focus();
  } else {
    elInput.classList.remove('shake');
    void elInput.offsetWidth;
    elInput.classList.add('shake');
    elKomentar.textContent = `✗ Správně bylo ${spravna}`;
    elKomentar.className   = 'komentar wrong';
    elInput.value = '';
  }
}

function startTimer() {
  casZbyva = CAS;
  elTelo.textContent     = CAS;
  elProgress.style.width = '100%';
  clearInterval(timerId);
  timerId = setInterval(() => {
    casZbyva--;
    elTelo.textContent     = casZbyva;
    elProgress.style.width = (casZbyva / CAS * 100) + '%';
    if (casZbyva <= 0) {
      clearInterval(timerId);
      zobrazVysledkyNasobilka(body);
    }
  }, 1000);
}
