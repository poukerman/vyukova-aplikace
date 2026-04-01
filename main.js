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
  jeHost: false,          // true = hraje bez přihlášení, rekordy se neukládají
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

// ── Firebase: najdi žáka — podporuje starou i novou strukturu ────
// Nová: tridy/{trida}/{jmeno}
// Stará: hrace/{jmeno} (trida uložena jako pole trida uvnitř objektu)
// Vrátí { trida, data } nebo null.
export async function najdiHrace(username) {
  // 1) Zkus novou strukturu tridy/
  const snapTridy = await get(ref(db, 'tridy'));
  if (snapTridy.exists()) {
    for (const [trida, zaci] of Object.entries(snapTridy.val())) {
      if (zaci && zaci[username]) {
        return { trida, data: zaci[username] };
      }
    }
  }

  // 2) Fallback na starou strukturu hrace/
  const snapHrace = await get(ref(db, `hrace/${username}`));
  if (snapHrace.exists()) {
    const data = snapHrace.val();
    const trida = String(data.trida || '');
    return { trida, data: { nasobilka: data.nasobilka || 0, vyjmenovana: data.vyjmenovana || 0 } };
  }

  return null;
}

// ── Firebase: načtení dat žáka ────────────────────────
export async function nactiHrace(username) {
  const vysledek = await najdiHrace(username);
  return vysledek ? vysledek.data : null;
}

// ── Firebase: uložení skóre (jen pokud je lepší) ──────
// Podporuje obě struktury — zapíše vždy do té, kde žák existuje.
export async function ulozSkore(username, trida, hra, skore) {
  // Zjisti, kde žák skutečně je
  const snapNova = await get(ref(db, `tridy/${trida}/${username}`));
  const cesta = snapNova.exists()
    ? `tridy/${trida}/${username}/${hra}`
    : `hrace/${username}/${hra}`;

  const snap     = await get(ref(db, cesta));
  const staryMax = snap.exists() ? (snap.val() || 0) : 0;
  if (skore > staryMax) {
    await set(ref(db, cesta), skore);
    return true;
  }
  return false;
}

// ── Firebase: globální žebříček (všechny třídy) ───────
// Čte z nové i staré struktury a sloučí výsledky.
export async function nactiZebricek(hra) {
  const vysledky = [];

  // Nová struktura
  const snapTridy = await get(ref(db, 'tridy'));
  if (snapTridy.exists()) {
    for (const [trida, zaci] of Object.entries(snapTridy.val())) {
      if (!zaci) continue;
      for (const [name, val] of Object.entries(zaci)) {
        const max = (val && val[hra]) ? val[hra] : 0;
        if (max > 0) vysledky.push({ name, trida, max });
      }
    }
  }

  // Stará struktura (pouze žáci, kteří nejsou v nové)
  const jizPridani = new Set(vysledky.map(v => v.name));
  const snapHrace = await get(ref(db, 'hrace'));
  if (snapHrace.exists()) {
    for (const [name, val] of Object.entries(snapHrace.val())) {
      if (jizPridani.has(name)) continue;
      const max = (val && val[hra]) ? val[hra] : 0;
      if (max > 0) vysledky.push({ name, trida: String(val.trida || ''), max });
    }
  }

  return vysledky.sort((a, b) => b.max - a.max).slice(0, 20);
}

// ── Firebase: žebříček jen jedné třídy ───────────────
// Čte z nové i staré struktury.
export async function nactiZebricekTridy(hra, trida) {
  const vysledky = [];

  // Nová struktura
  const snapTridy = await get(ref(db, `tridy/${trida}`));
  if (snapTridy.exists()) {
    for (const [name, val] of Object.entries(snapTridy.val())) {
      const max = (val && val[hra]) ? val[hra] : 0;
      if (max > 0) vysledky.push({ name, trida, max });
    }
  }

  // Stará struktura — žáci dané třídy, kteří nejsou v nové
  const jizPridani = new Set(vysledky.map(v => v.name));
  const snapHrace = await get(ref(db, 'hrace'));
  if (snapHrace.exists()) {
    for (const [name, val] of Object.entries(snapHrace.val())) {
      if (jizPridani.has(name)) continue;
      if (String(val.trida || '') !== String(trida)) continue;
      const max = (val && val[hra]) ? val[hra] : 0;
      if (max > 0) vysledky.push({ name, trida, max });
    }
  }

  return vysledky.sort((a, b) => b.max - a.max).slice(0, 20);
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
