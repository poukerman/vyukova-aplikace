// main.js — sdílený stav, pomocné funkce

// ── Sdílený stav ──────────────────────────────────────
export const stav = {
  jmeno: '',
  trida: '',
  jeHost: false,
  aktualniHra: '',
  aktualniPredmet: '',
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

// ── Firebase: najdi žáka ──────────────────────────────
export async function najdiHrace(_username) {
  return null;
}

// ── Firebase: načtení dat žáka ────────────────────────
export async function nactiHrace(_username) {
  return { nasobilka: 0, vyjmenovana: 0 };
}

// ── Firebase: uložení skóre ───────────────────────────
export async function ulozSkore(_username, _trida, _hra, _skore) {
  return false;
}

// ── Firebase: globální žebříček ───────────────────────
export async function nactiZebricek(_hra) {
  return [];
}

// ── Firebase: žebříček jedné třídy ───────────────────
export async function nactiZebricekTridy(_hra, _trida) {
  return [];
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
