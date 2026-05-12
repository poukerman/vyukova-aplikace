// vysledky.js — Obrazovka výsledků

import { stav, showScreen, ulozSkore, nactiZebricek } from './main.js';
import { initZebricek } from './zebricek.js';
import { initVyjmenovana } from './vyjmenovana.js';
import { initMocniny } from './mocniny.js';
import { initPredpony } from './predpony.js';
import { initPravopisE } from './pravopis_e.js';
import { initKlavesnice } from './klavesnice.js';
import { initPrepis }    from './prepis.js';
import { initNsdNsn }      from './nsd_nsn.js';
import { initDelitelnost } from './delitelnost.js';

export function initVysledky() {
  document.getElementById('btn-znovu').addEventListener('click', znovu);
  document.getElementById('btn-jina-hra').addEventListener('click', () => showScreen('screen-predmety'));
  document.getElementById('btn-zebricek-result').addEventListener('click', () => initZebricek('screen-result', stav.aktualniHra));
}

function znovu() {
  if (stav.aktualniHra === 'nasobilka') {
    showScreen('screen-welcome-nasobilka');
  } else if (stav.aktualniHra === 'mocniny') {
    initMocniny();
    showScreen('screen-welcome-mocniny');
  } else if (stav.aktualniHra === 'predpony') {
    initPredpony();
    showScreen('screen-welcome-predpony');
  } else if (stav.aktualniHra === 'pravopis_e') {
    initPravopisE();
    showScreen('screen-welcome-pe');
  } else if (stav.aktualniHra === 'klavesnice') {
    initKlavesnice();
    showScreen('screen-welcome-klav');
  } else if (stav.aktualniHra === 'prepis') {
    initPrepis();
    showScreen('screen-welcome-prepis');
  } else if (stav.aktualniHra === 'nsd_nsn') {
    initNsdNsn();
    showScreen('screen-welcome-nsd-nsn');
  } else if (stav.aktualniHra === 'delitelnost') {
    initDelitelnost();
    showScreen('screen-welcome-del');
  } else {
    initVyjmenovana();
    showScreen('screen-welcome-vyjmenovana');
  }
}

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
  } catch (_e) {
    document.getElementById('result-title').textContent = 'Konec hry!';
  }
}

export async function zobrazVysledkyMocniny(body, historie) {
  showScreen('screen-result');

  const spatne = historie.filter(h => !h.spravne);
  const emoji  = body === 0 ? '😅' : body < 5 ? '🙂' : body < 10 ? '😊' : body < 15 ? '🔥' : '👑';
  const titul  = body >= 20 ? 'Fantastické! 👑' : body >= 15 ? 'Skvělý výkon! 🔥' : body >= 10 ? 'Dobrá práce! 😊' : body >= 5 ? 'Slušný výsledek! 🙂' : 'Příště lépe! 💪';

  document.getElementById('result-emoji').textContent     = emoji;
  document.getElementById('result-score').textContent     = body;
  document.getElementById('result-sub').textContent       = 'správně za 2 minuty';
  document.getElementById('result-uspesnost').textContent = `Špatně (s opravou): ${spatne.length}`;

  document.getElementById('result-prehled').innerHTML = spatne.length === 0 ? '' :
    '<div class="prehled-nadpis">Špatně zodpovězené příklady:</div>' +
    spatne.map(h => `
      <div class="prehled-item chyba">
        <span class="prehled-icon">✗</span>
        <span class="prehled-text"><span class="prehled-veta">${h.popis}</span></span>
      </div>`).join('');

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
  } catch (_e) {
    document.getElementById('result-title').textContent = 'Konec hry!';
  }
}

export async function zobrazVysledkyVyjmenovana(body, pocet, historie) {
  showScreen('screen-result');

  const uspesnost = Math.round((body / pocet) * 100);
  const emoji     = uspesnost < 40 ? '😅' : uspesnost < 60 ? '🙂' : uspesnost < 80 ? '😊' : uspesnost < 100 ? '🔥' : '👑';
  const titul     = uspesnost === 100 ? 'Perfektní! 👑' : uspesnost >= 80 ? 'Skvělý výkon! 🔥' : uspesnost >= 50 ? 'Dobrá práce! 😊' : 'Příště lépe! 💪';

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
      document.getElementById('result-new-record').style.display = 'none';
      document.getElementById('result-title').textContent = titul;
    } else {
      const jeNovy = await ulozSkore(stav.jmeno, stav.trida, 'vyjmenovana', uspesnost);
      if (jeNovy) {
        stav.osobniMaxVyjm = uspesnost;
        document.getElementById('result-new-record').style.display = 'block';
        document.getElementById('result-title').textContent        = 'Nový rekord! 🎉';
      } else {
        document.getElementById('result-new-record').style.display = 'none';
        document.getElementById('result-title').textContent = titul;
      }
      const zb = await nactiZebricek('vyjmenovana');
      stav.globalMaxVyjm = zb.length > 0 ? zb[0].max : 0;
    }
  } catch (_e) {
    document.getElementById('result-title').textContent = 'Konec hry!';
  }
}

export async function zobrazVysledkyPredpony(body, pocet, historie) {
  showScreen('screen-result');

  const uspesnost = Math.round((body / pocet) * 100);
  const emoji     = uspesnost < 40 ? '😅' : uspesnost < 60 ? '🙂' : uspesnost < 80 ? '😊' : uspesnost < 100 ? '🔥' : '👑';
  const titul     = uspesnost === 100 ? 'Perfektní! 👑' : uspesnost >= 80 ? 'Skvělý výkon! 🔥' : uspesnost >= 50 ? 'Dobrá práce! 😊' : 'Příště lépe! 💪';

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
      document.getElementById('result-new-record').style.display = 'none';
      document.getElementById('result-title').textContent = titul;
    } else {
      const jeNovy = await ulozSkore(stav.jmeno, stav.trida, 'predpony', uspesnost);
      if (jeNovy) {
        stav.osobniMaxPredpony = uspesnost;
        document.getElementById('result-new-record').style.display = 'block';
        document.getElementById('result-title').textContent        = 'Nový rekord! 🎉';
      } else {
        document.getElementById('result-new-record').style.display = 'none';
        document.getElementById('result-title').textContent = titul;
      }
      const zb = await nactiZebricek('predpony');
      stav.globalMaxPredpony = zb.length > 0 ? zb[0].max : 0;
    }
  } catch (_e) {
    document.getElementById('result-title').textContent = 'Konec hry!';
  }
}

export async function zobrazVysledkyPravopisE(body, pocet, historie) {
  showScreen('screen-result');

  const uspesnost = Math.round((body / pocet) * 100);
  const emoji     = uspesnost < 40 ? '😅' : uspesnost < 60 ? '🙂' : uspesnost < 80 ? '😊' : uspesnost < 100 ? '🔥' : '👑';
  const titul     = uspesnost === 100 ? 'Perfektní! 👑' : uspesnost >= 80 ? 'Skvělý výkon! 🔥' : uspesnost >= 50 ? 'Dobrá práce! 😊' : 'Příště lépe! 💪';

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
      document.getElementById('result-new-record').style.display = 'none';
      document.getElementById('result-title').textContent = titul;
    } else {
      const jeNovy = await ulozSkore(stav.jmeno, stav.trida, 'pravopis_e', uspesnost);
      if (jeNovy) {
        stav.osobniMaxPravopisE = uspesnost;
        document.getElementById('result-new-record').style.display = 'block';
        document.getElementById('result-title').textContent        = 'Nový rekord! 🎉';
      } else {
        document.getElementById('result-new-record').style.display = 'none';
        document.getElementById('result-title').textContent = titul;
      }
      const zb = await nactiZebricek('pravopis_e');
      stav.globalMaxPravopisE = zb.length > 0 ? zb[0].max : 0;
    }
  } catch (_e) {
    document.getElementById('result-title').textContent = 'Konec hry!';
  }
}

export async function zobrazVysledkyPrepis(cpm, chyby, _cas) {
  showScreen('screen-result');

  const emoji = cpm < 100 ? '😅' : cpm < 150 ? '🙂' : cpm < 220 ? '😊' : cpm < 320 ? '🔥' : '👑';
  const titul = cpm < 100 ? 'Příště lépe! 💪' : cpm < 220 ? 'Dobrá práce! 😊' : cpm < 320 ? 'Skvělý výkon! 🔥' : 'Fantastické! 👑';

  document.getElementById('result-emoji').textContent     = emoji;
  document.getElementById('result-score').textContent     = cpm;
  document.getElementById('result-sub').textContent       = `znaků za minutu · chyby: ${chyby}`;
  document.getElementById('result-uspesnost').textContent = '';
  document.getElementById('result-prehled').innerHTML     = '';

  try {
    if (stav.jeHost) {
      document.getElementById('result-new-record').style.display = 'none';
      document.getElementById('result-title').textContent = titul;
    } else {
      const jeNovy = await ulozSkore(stav.jmeno, stav.trida, 'prepis', cpm);
      if (jeNovy) {
        stav.osobniMaxPrepis = cpm;
        document.getElementById('result-new-record').style.display = 'block';
        document.getElementById('result-title').textContent        = 'Nový rekord! 🎉';
      } else {
        document.getElementById('result-new-record').style.display = 'none';
        document.getElementById('result-title').textContent = titul;
      }
      const zb = await nactiZebricek('prepis');
      stav.globalMaxPrepis = zb.length > 0 ? zb[0].max : 0;
    }
  } catch (_e) {
    document.getElementById('result-title').textContent = 'Konec hry!';
  }
}

export async function zobrazVysledkyDelitelnost(skore, uroven) {
  showScreen('screen-result');

  const emoji = skore < 5 ? '😅' : skore < 15 ? '🙂' : skore < 30 ? '😊' : skore < 50 ? '🔥' : '👑';
  const titul = skore < 5 ? 'Příště lépe! 💪' : skore < 15 ? 'Dobrá práce! 😊' : skore < 30 ? 'Skvělý výkon! 🔥' : 'Fantastické! 👑';

  document.getElementById('result-emoji').textContent     = emoji;
  document.getElementById('result-score').textContent     = skore;
  document.getElementById('result-sub').textContent       = `správných zásahů · výzva ${uroven + 1}`;
  document.getElementById('result-uspesnost').textContent = '';
  document.getElementById('result-prehled').innerHTML     = '';

  try {
    if (stav.jeHost) {
      document.getElementById('result-new-record').style.display = 'none';
      document.getElementById('result-title').textContent = titul;
    } else {
      const jeNovy = await ulozSkore(stav.jmeno, stav.trida, 'delitelnost', skore);
      if (jeNovy) {
        stav.osobniMaxDelitelnost = skore;
        document.getElementById('result-new-record').style.display = 'block';
        document.getElementById('result-title').textContent        = 'Nový rekord! 🎉';
      } else {
        document.getElementById('result-new-record').style.display = 'none';
        document.getElementById('result-title').textContent = titul;
      }
      const zb = await nactiZebricek('delitelnost');
      stav.globalMaxDelitelnost = zb.length > 0 ? zb[0].max : 0;
    }
  } catch (_e) {
    document.getElementById('result-title').textContent = 'Konec hry!';
  }
}

export async function zobrazVysledkyNsdNsn(body, pocet, historie) {
  showScreen('screen-result');

  const uspesnost = Math.round((body / pocet) * 100);
  const emoji     = uspesnost < 40 ? '😅' : uspesnost < 60 ? '🙂' : uspesnost < 80 ? '😊' : uspesnost < 100 ? '🔥' : '👑';
  const titul     = uspesnost === 100 ? 'Perfektní! 👑' : uspesnost >= 80 ? 'Skvělý výkon! 🔥' : uspesnost >= 50 ? 'Dobrá práce! 😊' : 'Příště lépe! 💪';

  document.getElementById('result-emoji').textContent     = emoji;
  document.getElementById('result-score').textContent     = `${body}/${pocet}`;
  document.getElementById('result-sub').textContent       = 'správných odpovědí';
  document.getElementById('result-uspesnost').textContent = `Úspěšnost: ${uspesnost} %`;

  document.getElementById('result-prehled').innerHTML = historie.map(h => `
    <div class="prehled-item ${h.spravne ? 'ok' : 'chyba'}">
      <span class="prehled-icon">${h.spravne ? '✓' : '✗'}</span>
      <span class="prehled-text">
        <span class="prehled-veta">${h.oper}(${h.a}, ${h.b}) = <strong>${h.spravna}</strong></span>
        ${!h.spravne ? `<span class="prehled-chyba-txt">Tvá odpověď: ${h.odpoved}</span>` : ''}
      </span>
    </div>`).join('');

  try {
    if (stav.jeHost) {
      document.getElementById('result-new-record').style.display = 'none';
      document.getElementById('result-title').textContent = titul;
    } else {
      const jeNovy = await ulozSkore(stav.jmeno, stav.trida, 'nsd_nsn', body);
      if (jeNovy) {
        stav.osobniMaxNsdNsn = body;
        document.getElementById('result-new-record').style.display = 'block';
        document.getElementById('result-title').textContent        = 'Nový rekord! 🎉';
      } else {
        document.getElementById('result-new-record').style.display = 'none';
        document.getElementById('result-title').textContent = titul;
      }
      const zb = await nactiZebricek('nsd_nsn');
      stav.globalMaxNsdNsn = zb.length > 0 ? zb[0].max : 0;
    }
  } catch (_e) {
    document.getElementById('result-title').textContent = 'Konec hry!';
  }
}

export async function zobrazVysledkyKlavesnice(body) {
  showScreen('screen-result');
  document.getElementById('result-sub').textContent       = 'správných znaků za 2 minuty';
  document.getElementById('result-uspesnost').textContent = '';
  document.getElementById('result-prehled').innerHTML     = '';

  const emoji = body < 20 ? '😅' : body < 40 ? '🙂' : body < 60 ? '😊' : body < 90 ? '🔥' : '👑';
  const titul = body < 20 ? 'Příště lépe! 💪' : body < 60 ? 'Dobrá práce! 😊' : body < 90 ? 'Skvělý výkon! 🔥' : 'Fantastické! 👑';

  document.getElementById('result-emoji').textContent = emoji;
  document.getElementById('result-score').textContent = body;

  try {
    if (stav.jeHost) {
      document.getElementById('result-new-record').style.display = 'none';
      document.getElementById('result-title').textContent = titul;
    } else {
      const jeNovy = await ulozSkore(stav.jmeno, stav.trida, 'klavesnice', body);
      if (jeNovy) {
        stav.osobniMaxKlavesnice = body;
        document.getElementById('result-new-record').style.display = 'block';
        document.getElementById('result-title').textContent        = 'Nový rekord! 🎉';
      } else {
        document.getElementById('result-new-record').style.display = 'none';
        document.getElementById('result-title').textContent = titul;
      }
      const zb = await nactiZebricek('klavesnice');
      stav.globalMaxKlavesnice = zb.length > 0 ? zb[0].max : 0;
    }
  } catch (_e) {
    document.getElementById('result-title').textContent = 'Konec hry!';
  }
}
