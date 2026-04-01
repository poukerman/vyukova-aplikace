// ═══════════════════════════════════════════════════════
// main.js  —  Firebase, sdílený stav, pomocné funkce
// ═══════════════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ── Firebase konfigurace ──────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAE_kjebwQrSzeEz9-3c_Y66TUBAvRIjB4",
  authDomain: "malanasobilka.firebaseapp.com",
  databaseURL: "https://malanasobilka-default-rtdb.firebaseio.com",
  projectId: "malanasobilka",
  storageBucket: "malanasobilka.firebasestorage.app",
  messagingSenderId: "712520835692",
  appId: "1:712520835692:web:6746f62321750e264a6e49"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export { ref, get, set };

// ── Sdílený stav ──────────────────────────────────────
export const stav = {
  jmeno: '',
  trida: '',              // třída žáka, např. "3A"
  aktualniHra: '',        // 'nasobilka' | 'vyjmenovana'
  osobniMaxNas: 0,
  globalMaxNas: 0,
  osobniMaxVyjm: 0,
  globalMaxVyjm: 0,
};

// ── Přepnutí obrazovky ────────────────────────────────
export function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── Firebase: najdi ve které třídě žák je ────────────
// Prochází všechny třídy a hledá jméno žáka.
// Vrátí { trida, data } nebo null.
export async function najdiHrace(username) {
  const snap = await get(ref(db, 'tridy'));
  if (!snap.exists()) return null;
  for (const [trida, zaci] of Object.entries(snap.val())) {
    if (zaci && zaci[username]) {
      return { trida, data: zaci[username] };
    }
  }
  return null;
}

// ── Firebase: načtení dat žáka ────────────────────────
export async function nactiHrace(username) {
  const vysledek = await najdiHrace(username);
  return vysledek ? vysledek.data : null;
}

// ── Firebase: uložení skóre (jen pokud je lepší) ──────
export async function ulozSkore(username, trida, hra, skore) {
  const snap     = await get(ref(db, `tridy/${trida}/${username}/${hra}`));
  const staryMax = snap.exists() ? (snap.val() || 0) : 0;
  if (skore > staryMax) {
    await set(ref(db, `tridy/${trida}/${username}/${hra}`), skore);
    return true;
  }
  return false;
}

// ── Firebase: globální žebříček (všechny třídy) ───────
export async function nactiZebricek(hra) {
  const snap = await get(ref(db, 'tridy'));
  if (!snap.exists()) return [];
  const vysledky = [];
  for (const [trida, zaci] of Object.entries(snap.val())) {
    if (!zaci) continue;
    for (const [name, val] of Object.entries(zaci)) {
      const max = (val && val[hra]) ? val[hra] : 0;
      if (max > 0) vysledky.push({ name, trida, max });
    }
  }
  return vysledky.sort((a, b) => b.max - a.max).slice(0, 20);
}

// ── Firebase: žebříček jen jedné třídy ───────────────
export async function nactiZebricekTridy(hra, trida) {
  const snap = await get(ref(db, `tridy/${trida}`));
  if (!snap.exists()) return [];
  return Object.entries(snap.val())
    .map(([name, val]) => ({ name, trida, max: (val && val[hra]) ? val[hra] : 0 }))
    .filter(h => h.max > 0)
    .sort((a, b) => b.max - a.max)
    .slice(0, 20);
}

// ── Hint: blížíš se k rekordu ─────────────────────────
export function updateHint(id, b, osobni, glob) {
  const hint = document.getElementById(id);
  if (osobni > 0 && b === osobni)    { hint.textContent = '🔥 Vyrovnáváš svůj rekord!';                hint.className = 'record-hint beating'; }
  else if (osobni > 0 && b > osobni) { hint.textContent = `🚀 Překonáváš rekord! (${b} > ${osobni})`; hint.className = 'record-hint beating'; }
  else if (glob > 0 && b >= glob)    { hint.textContent = '👑 Míříš na rekord školy!';                 hint.className = 'record-hint beating'; }
  else { hint.textContent = osobni > 0 ? `Do rekordu zbývá ${osobni - b} bodů` : ''; hint.className = 'record-hint'; }
}

// ── Hvězdičky na pozadí ───────────────────────────────
export function initHvezdicky() {
  const el = document.getElementById('stars');
  for (let i = 0; i < 60; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    s.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;--d:${2+Math.random()*4}s;--delay:${Math.random()*5}s`;
    el.appendChild(s);
  }
}
