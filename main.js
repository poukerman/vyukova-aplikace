// ═══════════════════════════════════════════════════════
// main.js  —  Firebase, sdílený stav, pomocné funkce
// ═══════════════════════════════════════════════════════

// import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
// import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ── Firebase konfigurace ──────────────────────────────
// const firebaseConfig = {
//   apiKey: "AIzaSyAE_kjebwQrSzeEz9-3c_Y66TUBAvRIjB4",
//   authDomain: "malanasobilka.firebaseapp.com",
//   databaseURL: "https://malanasobilka-default-rtdb.firebaseio.com",
//   projectId: "malanasobilka",
//   storageBucket: "malanasobilka.firebasestorage.app",
//   messagingSenderId: "712520835692",
//   appId: "1:712520835692:web:6746f62321750e264a6e49"
// };

// const app = initializeApp(firebaseConfig);
// export const db = getDatabase(app);
// export { ref, get, set };

// ── Sdílený stav ──────────────────────────────────────
export const stav = {
  jmeno: '',
  trida: '',              // třída žáka, např. "3A"
  jeHost: false,          // true = hraje bez přihlášení, rekordy se neukládají
  aktualniHra: '',        // 'nasobilka' | 'vyjmenovana'
  aktualniPredmet: '',    // 'matematika' | 'cestina'
  osobniMaxNas: 0,
  globalMaxNas: 0,
  osobniMaxVyjm: 0,
  globalMaxVyjm: 0,
  osobniMaxMocniny: 0,
  globalMaxMocniny: 0,
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
  // Zakomentováno pro test
  return null;
}

// ── Firebase: načtení dat žáka ────────────────────────
export async function nactiHrace(username) {
  return { nasobilka: 0, vyjmenovana: 0 };
}

// ── Firebase: uložení skóre (jen pokud je lepší) ──────
// Podporuje obě struktury — zapíše vždy do té, kde žák existuje.
export async function ulozSkore(username, trida, hra, skore) {
  return false;
}

// ── Firebase: globální žebříček (všechny třídy) ───────
// Čte z nové i staré struktury a sloučí výsledky.
export async function nactiZebricek(hra) {
  return [];
}

// ── Firebase: žebříček jen jedné třídy ───────────────
// Čte z nové i staré struktury.
export async function nactiZebricekTridy(hra, trida) {
  return [];
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
  console.log('initHvezdicky called');
  const el = document.getElementById('stars');
  for (let i = 0; i < 60; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    s.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;--d:${2+Math.random()*4}s;--delay:${Math.random()*5}s`;
    el.appendChild(s);
  }
}
