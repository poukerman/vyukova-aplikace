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

// ── Sdílený stav ─────────────────────────────────────
export const stav = {
  jmeno: '',
  trida: '',              // třída přihlášeného žáka, např. "3A"
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

// ── Firebase: načtení hráče ───────────────────────────
export async function nactiHrace(username) {
  const snap = await get(ref(db, `hrace/${username}`));
  return snap.exists() ? snap.val() : null;
}

// ── Firebase: uložení skóre (jen pokud je lepší) ──────
export async function ulozSkore(username, hra, skore) {
  const hrac = await nactiHrace(username);
  const staryMax = hrac ? (hrac[hra] || 0) : 0;
  if (skore > staryMax) {
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
    .map(([name, val]) => ({ name, trida: val.trida || '', max: (val && val[hra]) ? val[hra] : 0 }))
    .filter(h => h.max > 0)
    .sort((a, b) => b.max - a.max)
    .slice(0, 20);
}

// ── Firebase: žebříček jen pro jednu třídu ────────────
export async function nactiZebricekTridy(hra, trida) {
  const snap = await get(ref(db, 'hrace'));
  if (!snap.exists()) return [];
  return Object.entries(snap.val())
    .filter(([, val]) => (val.trida || '') === trida)
    .map(([name, val]) => ({ name, trida: val.trida || '', max: (val && val[hra]) ? val[hra] : 0 }))
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
