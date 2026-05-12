// nsd_nsn.js — Hra: NSN a NSD

import { stav, showScreen, updateHint } from './main.js';
import { zobrazVysledkyNsdNsn } from './vysledky.js';

const POCET_OTAZEK = 20;
const CISLA = [2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 25, 30, 36];

function gcd(a, b) {
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function lcm(a, b) {
  return (a / gcd(a, b)) * b;
}

let rezim = null;
let body, otazka, historie;
let aktA, aktB, aktOper, aktSpravna;

export function initNsdNsn() {
  rezim = null;
  ['nsn', 'nsd', 'obe'].forEach(t => {
    const el = document.getElementById(`btn-nsd-nsn-${t}`);
    el.classList.remove('selected');
    el.onclick = () => vybratRezim(t);
  });
  document.getElementById('nsd-nsn-error').textContent     = '';
  document.getElementById('btn-start-nsd-nsn').onclick     = spravnoSpustit;
  document.getElementById('btn-zpet-nsd-nsn').onclick      = () => showScreen('screen-vyber');
  document.getElementById('btn-potvrdit-nsd-nsn').onclick  = potvrdit;
  document.getElementById('btn-ukoncit-nsd-nsn').onclick   = () => showScreen('screen-welcome-nsd-nsn');
  document.getElementById('inp-odpoved-nsd-nsn').onkeydown = e => { if (e.key === 'Enter') potvrdit(); };

  if (window.matchMedia('(pointer: coarse)').matches) {
    const inp = document.getElementById('inp-odpoved-nsd-nsn');
    inp.readOnly = true;
    inp.setAttribute('inputmode', 'none');
    document.getElementById('keypad-nsd-nsn').querySelectorAll('.kkey').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const k = btn.dataset.k;
        if (k === 'back')    inp.value = inp.value.slice(0, -1);
        else if (k === 'ok') potvrdit();
        else                 inp.value += k;
      });
    });
  }
}

function vybratRezim(r) {
  rezim = r;
  ['nsn', 'nsd', 'obe'].forEach(t => {
    document.getElementById(`btn-nsd-nsn-${t}`).classList.toggle('selected', t === r);
  });
  document.getElementById('nsd-nsn-error').textContent = '';
}

function spravnoSpustit() {
  if (!rezim) {
    document.getElementById('nsd-nsn-error').textContent = 'Vyber typ výpočtu!';
    return;
  }
  startHra();
}

function startHra() {
  stav.aktualniHra = 'nsd_nsn';
  body     = 0;
  otazka   = 0;
  historie = [];
  document.getElementById('lbl-body-nsd-nsn').textContent    = 0;
  document.getElementById('lbl-rekord-nsd-nsn').textContent  = stav.osobniMaxNsdNsn;
  document.getElementById('record-hint-nsd-nsn').textContent = '';
  document.getElementById('lbl-komentar-nsd-nsn').textContent = '';
  document.getElementById('lbl-komentar-nsd-nsn').className   = 'komentar';
  showScreen('screen-game-nsd-nsn');
  novyPriklad();
  document.getElementById('inp-odpoved-nsd-nsn').focus();
}

function novyPriklad() {
  let a, b;
  do {
    a = CISLA[Math.floor(Math.random() * CISLA.length)];
    b = CISLA[Math.floor(Math.random() * CISLA.length)];
  } while (a === b || lcm(a, b) > 720);

  aktA = a;
  aktB = b;

  if (rezim === 'nsn')      aktOper = 'NSN';
  else if (rezim === 'nsd') aktOper = 'NSD';
  else                      aktOper = Math.random() < 0.5 ? 'NSN' : 'NSD';

  aktSpravna = aktOper === 'NSN' ? lcm(aktA, aktB) : gcd(aktA, aktB);

  otazka++;
  document.getElementById('lbl-priklad-nsd-nsn').textContent = `${otazka}/${POCET_OTAZEK}`;
  document.getElementById('progress-nsd-nsn').style.width    = ((otazka - 1) / POCET_OTAZEK * 100) + '%';
  document.getElementById('lbl-cisla-nsd-nsn').textContent   = `${aktA} a ${aktB}`;
  document.getElementById('lbl-oper-nsd-nsn').textContent    = aktOper;
  document.getElementById('lbl-komentar-nsd-nsn').textContent = '';
  document.getElementById('lbl-komentar-nsd-nsn').className   = 'komentar';
  document.getElementById('inp-odpoved-nsd-nsn').value        = '';
}

function potvrdit() {
  const val = parseInt(document.getElementById('inp-odpoved-nsd-nsn').value, 10);
  if (isNaN(val)) {
    document.getElementById('lbl-komentar-nsd-nsn').textContent = 'Napiš číslo!';
    document.getElementById('lbl-komentar-nsd-nsn').className   = 'komentar wrong';
    return;
  }

  const spravne = val === aktSpravna;
  historie.push({ oper: aktOper, a: aktA, b: aktB, spravna: aktSpravna, odpoved: val, spravne });

  if (spravne) {
    body++;
    document.getElementById('lbl-body-nsd-nsn').textContent     = body;
    document.getElementById('lbl-komentar-nsd-nsn').textContent = '✓ Správně!';
    document.getElementById('lbl-komentar-nsd-nsn').className   = 'komentar correct';
    updateHint('record-hint-nsd-nsn', body, stav.osobniMaxNsdNsn, stav.globalMaxNsdNsn);
  } else {
    const inp = document.getElementById('inp-odpoved-nsd-nsn');
    inp.classList.remove('shake');
    void inp.offsetWidth;
    inp.classList.add('shake');
    document.getElementById('lbl-komentar-nsd-nsn').textContent = `✗ Správně bylo ${aktSpravna}`;
    document.getElementById('lbl-komentar-nsd-nsn').className   = 'komentar wrong';
  }

  if (otazka >= POCET_OTAZEK) {
    setTimeout(() => zobrazVysledkyNsdNsn(body, POCET_OTAZEK, historie), 800);
  } else {
    setTimeout(() => {
      novyPriklad();
      document.getElementById('inp-odpoved-nsd-nsn').focus();
    }, 600);
  }
}
