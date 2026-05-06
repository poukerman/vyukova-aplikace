// ═══════════════════════════════════════════════════════
// vysledky.js  —  Obrazovka výsledků
// ═══════════════════════════════════════════════════════

import { stav, showScreen, ulozSkore, nactiZebricek } from './main.js';
import { initZebricek } from './zebricek.js';
import { initVyjmenovana } from './vyjmenovana.js';
import { initMocniny } from './mocniny.js';

// ── Inicializace tlačítek na obrazovce výsledků ───────
export function initVysledky() {
  document.getElementById('btn-znovu').onclick           = znovu;
  document.getElementById('btn-jina-hra').onclick        = () => showScreen('screen-predmety');
  document.getElementById('btn-zebricek-result').onclick = () => initZebricek('screen-result', stav.aktualniHra);
}

function znovu() {
  if (stav.aktualniHra === 'nasobilka') {
    showScreen('screen-welcome-nasobilka');
  } else if (stav.aktualniHra === 'mocniny') {
    initMocniny();
    showScreen('screen-welcome-mocniny');
  } else {
    initVyjmenovana();
    showScreen('screen-welcome-vyjmenovana');
  }
}

// ── Výsledky násobilky ────────────────────────────────
export async function zobrazVysledkyNasobilka(body) {
  showScreen('screen-result');
  document.getElementById('result-sub').textContent       = 'bodů za 120 sekund';
  document.getElementById('result-uspesnost').textContent = '';
  document.getElementById('result-prehled').innerHTML     = '';

  const emoji = body === 0 ? '😅' : body < 5 ? '🙂' : body < 10 ? '😊' : body < 15 ? '🔥' : '👑';
  document.getElementById('result-emoji').textContent = emoji;
  document.getElementById('result-score').textContent = body;

  try {
    if (stav.jeHost) {
      // Host — neukládáme, jen zobrazíme výsledek
      document.getElementById('result-new-record').style.display = 'none';
      document.getElementById('result-title').textContent = body >= 10 ? 'Skvělý výkon!' : 'Konec hry!';
    } else {
      const jeNovy = await ulozSkore(stav.jmeno, stav.trida, 'nasobilka', body);
      if (jeNovy) {
        stav.osobniMaxNas = body;
        document.getElementById('result-new-record').style.display = 'block';
        document.getElementById('result-title').textContent        = 'Nový rekord! 🎉';
      } else {
        document.getElementById('result-new-record').style.display = 'none';
        document.getElementById('result-title').textContent        = body >= 10 ? 'Skvělý výkon!' : 'Konec hry!';
      }
      const zb = await nactiZebricek('nasobilka');
      stav.globalMaxNas = zb.length > 0 ? zb[0].max : 0;
    }
  } catch(e) { document.getElementById('result-title').textContent = 'Konec hry!'; }
}

// ── Výsledky mocnin ───────────────────────────────────
// body    = počet příkladů správně na první pokus
// historie = [{popis, spravne}] — spravne=true jen pokud byl první pokus správný
export async function zobrazVysledkyMocniny(body, historie) {
  showScreen('screen-result');

  const spatne = historie.filter(h => !h.spravne);
  const emoji  = body === 0 ? '😅' : body < 5 ? '🙂' : body < 10 ? '😊' : body < 15 ? '🔥' : '👑';
  const titul  = body >= 20 ? 'Fantastické! 👑' : body >= 15 ? 'Skvělý výkon! 🔥' : body >= 10 ? 'Dobrá práce! 😊' : body >= 5 ? 'Slušný výsledek! 🙂' : 'Příště lépe! 💪';

  document.getElementById('result-emoji').textContent     = emoji;
  document.getElementById('result-score').textContent     = body;
  document.getElementById('result-sub').textContent       = 'správně za 2 minuty';
  document.getElementById('result-uspesnost').textContent = `Špatně (s opravou): ${spatne.length}`;

  if (spatne.length === 0) {
    document.getElementById('result-prehled').innerHTML = '';
  } else {
    document.getElementById('result-prehled').innerHTML =
      '<div class="prehled-nadpis">Špatně zodpovězené příklady:</div>' +
      spatne.map(h => `
        <div class="prehled-item chyba">
          <span class="prehled-icon">✗</span>
          <span class="prehled-text"><span class="prehled-veta">${h.popis}</span></span>
        </div>`).join('');
  }

  try {
    if (stav.jeHost) {
      document.getElementById('result-new-record').style.display = 'none';
      document.getElementById('result-title').textContent = titul;
    } else {
      const jeNovy = await ulozSkore(stav.jmeno, stav.trida, 'mocniny', body);
      if (jeNovy) {
        stav.osobniMaxMocniny = body;
        document.getElementById('result-new-record').style.display = 'block';
        document.getElementById('result-title').textContent        = 'Nový rekord! 🎉';
      } else {
        document.getElementById('result-new-record').style.display = 'none';
        document.getElementById('result-title').textContent = titul;
      }
    }
  } catch(e) { document.getElementById('result-title').textContent = 'Konec hry!'; }
}

// ── Výsledky vyjmenovaných slov ───────────────────────
export async function zobrazVysledkyVyjmenovana(body, pocet, historie) {
  showScreen('screen-result');

  const uspesnost = Math.round((body / pocet) * 100);
  const emoji     = uspesnost < 40 ? '😅' : uspesnost < 60 ? '🙂' : uspesnost < 80 ? '😊' : uspesnost < 100 ? '🔥' : '👑';

  document.getElementById('result-emoji').textContent     = emoji;
  document.getElementById('result-score').textContent     = `${body}/${pocet}`;
  document.getElementById('result-sub').textContent       = 'správných odpovědí';
  document.getElementById('result-uspesnost').textContent = `Úspěšnost: ${uspesnost} %`;

  document.getElementById('result-prehled').innerHTML = historie.map(h => `
    <div class="prehled-item ${h.spravne ? 'ok' : 'chyba'}">
      <span class="prehled-icon">${h.spravne ? '✓' : '✗'}</span>
      <span class="prehled-text">
        <span class="prehled-veta">${h.vetaHotova}</span>
        ${!h.spravne ? `<span class="prehled-chyba-txt">Tvá odpověď: ${h.uzivatelovaOdpoved}</span>` : ''}
      </span>
    </div>`).join('');

  try {
    if (stav.jeHost) {
      // Host — neukládáme, jen zobrazíme výsledek
      document.getElementById('result-new-record').style.display = 'none';
      document.getElementById('result-title').textContent =
        uspesnost === 100 ? 'Perfektní! 👑' : uspesnost >= 80 ? 'Skvělý výkon! 🔥' : uspesnost >= 50 ? 'Dobrá práce! 😊' : 'Příště lépe! 💪';
    } else {
      // Ukládáme procentuální úspěšnost do Firebase
      const jeNovy = await ulozSkore(stav.jmeno, stav.trida, 'vyjmenovana', uspesnost);
      if (jeNovy) {
        stav.osobniMaxVyjm = uspesnost;
        document.getElementById('result-new-record').style.display = 'block';
        document.getElementById('result-title').textContent        = 'Nový rekord! 🎉';
      } else {
        document.getElementById('result-new-record').style.display = 'none';
        document.getElementById('result-title').textContent        =
          uspesnost === 100 ? 'Perfektní! 👑' : uspesnost >= 80 ? 'Skvělý výkon! 🔥' : uspesnost >= 50 ? 'Dobrá práce! 😊' : 'Příště lépe! 💪';
      }
      const zb = await nactiZebricek('vyjmenovana');
      stav.globalMaxVyjm = zb.length > 0 ? zb[0].max : 0;
    }
  } catch(e) { document.getElementById('result-title').textContent = 'Konec hry!'; }
}
