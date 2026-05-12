// main.js — sdílený stav, pomocné funkce

import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getDatabase, ref, get, set } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';

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

// ── Sdílený stav ──────────────────────────────────────
export const stav = {
  jmeno: '',
  trida: '',
  jeHost: false,
  aktualniHra: '',
  aktualniPredmet: '',
  osobniMaxNas: 0,        globalMaxNas: 0,
  osobniMaxVyjm: 0,       globalMaxVyjm: 0,
  osobniMaxMocniny: 0,    globalMaxMocniny: 0,
  osobniMaxPredpony: 0,   globalMaxPredpony: 0,
  osobniMaxPravopisE: 0,  globalMaxPravopisE: 0,
  osobniMaxKlavesnice: 0, globalMaxKlavesnice: 0,
  osobniMaxPrepis: 0,     globalMaxPrepis: 0,
  osobniMaxNsdNsn: 0,          globalMaxNsdNsn: 0,
  osobniMaxDelitelnost: 0,     globalMaxDelitelnost: 0,
};

// ── Přepnutí obrazovky ────────────────────────────────
export function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── Firebase: najdi žáka ──────────────────────────────
export async function najdiHrace(username) {
  const snap = await get(ref(db, `hrace/${username}`));
  if (!snap.exists()) return null;
  const d = snap.val();
  return {
    trida: d.trida || '',
    data: {
      nasobilka:   d.nasobilka   || 0,
      vyjmenovana: d.vyjmenovana || 0,
      mocniny:     d.mocniny     || 0,
      predpony:    d.predpony    || 0,
      pravopis_e:  d.pravopis_e  || 0,
      klavesnice:  d.klavesnice  || 0,
      prepis:      d.prepis      || 0,
      nsd_nsn:      d.nsd_nsn      || 0,
      delitelnost:  d.delitelnost  || 0,
    },
  };
}

// ── Firebase: uložení skóre ───────────────────────────
export async function ulozSkore(username, _trida, hra, skore) {
  const snap    = await get(ref(db, `hrace/${username}/${hra}`));
  const current = snap.val() || 0;
  if (skore > current) {
    await set(ref(db, `hrace/${username}/${hra}`), skore);
    return true;
  }
  return false;
}

// ── Firebase: globální žebříček ───────────────────────
export async function nactiZebricek(hra) {
  const snap = await get(ref(db, 'hrace'));
  if (!snap.exists()) return [];
  return Object.entries(snap.val())
    .map(([name, d]) => ({ name, trida: d.trida, max: d[hra] || 0 }))
    .filter(e => e.max > 0)
    .sort((a, b) => b.max - a.max);
}

// ── Firebase: žebříček jedné třídy ───────────────────
export async function nactiZebricekTridy(hra, trida) {
  const zb = await nactiZebricek(hra);
  return zb.filter(e => String(e.trida) === String(trida));
}

// ── Hint: blížíš se k rekordu ─────────────────────────
export function updateHint(id, b, osobni, glob) {
  const hint = document.getElementById(id);
  if (!hint) return;
  if (osobni > 0 && b === osobni) {
    hint.textContent = '🔥 Vyrovnáváš svůj rekord!';
    hint.className = 'record-hint beating';
  } else if (osobni > 0 && b > osobni) {
    hint.textContent = `🚀 Překonáváš rekord! (${b} > ${osobni})`;
    hint.className = 'record-hint beating';
  } else if (glob > 0 && b >= glob) {
    hint.textContent = '👑 Míříš na rekord školy!';
    hint.className = 'record-hint beating';
  } else {
    hint.textContent = osobni > 0 ? `Do rekordu zbývá ${osobni - b} bodů` : '';
    hint.className = 'record-hint';
  }
}

// ── Hvězdičky na pozadí ───────────────────────────────
export function initHvezdicky() {
  const el = document.getElementById('stars');
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < 60; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    s.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;--d:${2 + Math.random() * 4}s;--delay:${Math.random() * 5}s`;
    fragment.appendChild(s);
  }
  el.appendChild(fragment);
}
