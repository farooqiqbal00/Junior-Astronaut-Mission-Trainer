/* Outpost Zero - upgrade part 2 (load AFTER upgrade.js). */
(function (w) {
    'use strict';
    const OZ = w.OZ, A = OZ.App, $ = id => document.getElementById(id);
    const rnd = (a, b) => a + Math.random() * (b - a);
    const many = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');
    OZ.State.audioEnabled = true;
    try { localStorage.setItem('ozSound', 1); } catch (e) { /* ignore */ }

    /* ---------- Coach messages (challenge style: trade-offs + real NASA data) ---------- */
    Object.assign(OZ.STRINGS.en, {
        tutMsg1: n => `Welcome aboard, ${n}! I am ROBO-7, your mission coach. You will run a real outpost. Every power cell you give to one system is taken from another. That is called a trade-off.`,
        tutMsg2: 'This is Sun Watch. It uses real solar flare records from NASA DONKI. Strong flares send dangerous radiation, so check it before you plan.',
        tutMsg3: 'These are your crew vitals: air, food and health. If any one of them reaches zero, the mission ends.',
        tutMsg4: 'This is the Reactor Power Board. You have six power cells. Share them between Life Support, Greenhouse and Radiation Shield. No choice is free!',
        tutMsg5: 'When your plan is ready, press the orange Launch button. You can also tap the astronauts and machines in your outpost. Good luck, Commander!',
        noPower: n => `All six power cells are in use, ${n}. Take a cell from another system first. That is the trade-off!`,
        tipX: (n, c) => `Alert, ${n}! A ${c} flare is the strongest type. Move power to the shield, but your air and food will get less. That is the trade-off.`,
        tipM: c => `Caution! A medium ${c} flare is active. Give the shield two or three cells, and watch your food.`,
        tipC: c => `Good news! A small ${c} flare means low radiation. One shield cell is enough, so use extra power for air or food.`,
        tipData: 'Fun fact: Sun Watch uses real solar flare records from NASA DONKI, the space weather database.',
        tipPlan: 'Tip: check tomorrow\u2019s forecast before you plan. Real mission teams plan ahead too.',
        nextDayX: (d, c) => `Alert! Day ${d} brings a strong ${c} flare. Raise the shield, but keep an eye on your air.`,
        nextDayM: (d, c) => `Caution! Day ${d} has a medium ${c} flare. Balance your shield with food and air.`,
        nextDayC: (d, c) => `Day ${d} is calm. Good chance to boost your air or food.`
    });
    const KIND = [[/alert|danger|caution|rejected|leak|warning/i, 'alert', '⚠️ ALERT'], [/new today/i, 'learn', '🎓 LEARN'], [/tip|fun fact|trade-off|plan ahead/i, 'tip', '💡 TIP']];
    const spk = A.speak;
    A.speak = function (msg, cb) {
        spk.call(this, msg, cb);
        const k = KIND.find(x => x[0].test(msg)) || [0, 'info', 'COACH'];
        $('bubble').dataset.kind = k[1];
        const s = document.querySelector('.bot-name small'); if (s) s.textContent = 'MISSION COACH · ' + k[2];
    };

    /* ---------- Outpost scene (SVG) ---------- */
    const astro = (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})"><g class="ast ${c}" data-hit="ast">
        <rect x="-12" y="-5" width="10" height="7" rx="3" fill="#8aa2c0"/><rect x="2" y="-5" width="10" height="7" rx="3" fill="#8aa2c0"/>
        <rect x="-20" y="-34" width="9" height="24" rx="4" fill="#9fb7d3"/>
        <rect x="-14" y="-36" width="28" height="33" rx="11" fill="#f4f8ff" stroke="#b9cde6" stroke-width="1.5"/>
        <rect x="-14" y="-21" width="28" height="5" fill="#ff9a3c"/>
        <g class="aa"><rect x="11" y="-33" width="8" height="22" rx="4" fill="#f4f8ff" stroke="#b9cde6" stroke-width="1.5"/></g>
        <circle cx="0" cy="-47" r="15" fill="#f4f8ff" stroke="#b9cde6" stroke-width="1.5"/>
        <ellipse cx="0" cy="-47" rx="10.5" ry="9" fill="#1d3a63"/><ellipse cx="-3.5" cy="-50" rx="3.5" ry="2.4" fill="#7fd6ff"/></g></g>`;
    function outpost(k) {
        const plants = [80, 100, 120, 140, 160].map(x => `<g transform="translate(${x} 250)"><path d="M0 0V-20" stroke="#4fd88f" stroke-width="3" stroke-linecap="round"/><ellipse cx="-6" cy="-14" rx="7" ry="3.5" fill="#69e7c4"/><ellipse cx="6" cy="-20" rx="7" ry="3.5" fill="#69e7c4"/><circle class="fruit" cx="0" cy="-25" r="4.5" fill="#ff6b57"/></g>`).join('');
        const emit = x => `<g data-hit="shield"><rect x="${x - 4}" y="206" width="8" height="46" rx="3" fill="#8fb4dc"/><circle class="op-emit" cx="${x}" cy="200" r="9" fill="#5ed6ff"/></g>`;
        return `<svg class="op" viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Your outpost"><defs>
            <linearGradient id="sk${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1f45"/><stop offset="1" stop-color="#2a4f86"/></linearGradient>
            <radialGradient id="dm${k}" cx=".35" cy=".25"><stop offset="0" stop-color="#e8f6ff" stop-opacity=".95"/><stop offset="1" stop-color="#6aa8dc" stop-opacity=".75"/></radialGradient>
            <radialGradient id="sh${k}" cx=".5" cy="1" r=".95"><stop offset=".6" stop-color="#5ed6ff" stop-opacity="0"/><stop offset="1" stop-color="#5ed6ff" stop-opacity=".5"/></radialGradient></defs>
            <rect width="600" height="300" rx="18" fill="url(#sk${k})"/>
            <g fill="#fff" opacity=".8"><circle cx="120" cy="30" r="1.5"/><circle cx="210" cy="60" r="1.2"/><circle cx="300" cy="24" r="1.8"/><circle cx="390" cy="52" r="1.3"/><circle cx="470" cy="22" r="1.6"/><circle cx="150" cy="100" r="1.1"/><circle cx="430" cy="100" r="1.2"/><circle cx="570" cy="110" r="1.4"/><circle cx="30" cy="120" r="1.3"/></g>
            <circle class="op-sun" cx="540" cy="48" r="24" fill="#ffd27a"/><circle class="op-planet" cx="62" cy="52" r="20"/>
            <path class="gnd-b" d="M0 238 Q120 205 240 232 T480 224 T600 236 V300 H0Z"/><path class="gnd" d="M0 252 Q150 232 300 248 T600 246 V300 H0Z"/>
            <ellipse class="crat" cx="110" cy="280" rx="26" ry="5"/><ellipse class="crat" cx="500" cy="284" rx="34" ry="6"/>
            <g data-hit="solar"><rect x="548" y="228" width="4" height="24" fill="#8fb4dc"/><path class="op-solar" d="M520 228 L586 228 L578 206 L528 206Z" fill="#2c5fb0" stroke="#9cc9ff" stroke-width="2"/><path d="M542 206V228M564 206V228M524 217H582" stroke="#9cc9ff" stroke-width="1.2"/></g>
            <g data-hit="life"><rect x="452" y="206" width="40" height="46" rx="12" fill="#d6e9ff" stroke="#8fb4dc" stroke-width="3"/><rect x="465" y="196" width="14" height="12" rx="3" fill="#8fb4dc"/><text x="472" y="236" text-anchor="middle" font-size="15" font-weight="800" fill="#1d3a63">O₂</text>
                <g class="op-air"><circle cx="466" cy="186" r="4"/><circle cx="478" cy="176" r="3"/><circle cx="470" cy="164" r="2.5"/></g></g>
            <g data-hit="farm"><path d="M58 252V218L119 190L182 218V252Z" fill="rgba(105,231,196,.16)" stroke="#69e7c4" stroke-width="3" stroke-linejoin="round"/><g class="op-plants">${plants}</g></g>
            ${emit(190)}${emit(410)}
            <g data-hit="dome"><path d="M205 252 A95 95 0 0 1 395 252Z" fill="url(#dm${k})" stroke="#bfe6ff" stroke-width="3"/><rect x="285" y="218" width="30" height="34" rx="6" fill="#2b3a55"/>
                <ellipse class="op-win" cx="246" cy="214" rx="12" ry="15" fill="#ffd166"/><ellipse class="op-win" cx="354" cy="214" rx="12" ry="15" fill="#ffd166"/>
                <line x1="300" y1="157" x2="300" y2="132" stroke="#cfe6ff" stroke-width="3"/><circle class="op-beacon" cx="300" cy="129" r="5" fill="#ff5f7a"/></g>
            ${astro(236, 268, 1, 'a1')}${astro(300, 276, 1.18, 'a2')}${astro(364, 268, 1, 'a3')}
            <path class="op-shield" d="M42 252 A258 178 0 0 1 558 252" fill="url(#sh${k})" stroke="#7fe9ff" stroke-width="2.5" stroke-dasharray="10 8" pointer-events="none"/></svg>`;
    }
    /* The outpost card is its own grid item (under Sun Watch), not part of the power board. */
    document.querySelector('.hud').insertAdjacentHTML('beforeend', `<section class="outpost-card" id="outpostCard">
        <div class="oc-head"><h3>🏠 Your Outpost</h3><span>Tap the crew and machines!</span></div>
        <div class="oc-scene" id="ocScene">${outpost('l')}</div>
        <div class="oc-chips"><button type="button" data-hit="shield">🛡️ Shield <b id="chS">0</b></button><button type="button" data-hit="farm">🌱 Greenhouse <b id="chF">0</b></button><button type="button" data-hit="life">💨 Life Support <b id="chL">0</b></button></div></section>`);
    const kick = (el, cls, ms) => { if (!el) return; el.classList.remove(cls); void el.getBoundingClientRect(); el.classList.add(cls); setTimeout(() => el.classList.remove(cls), ms); };
    const SAY = ['Hi Commander!', 'Power looks good!', 'I love space!', 'Ready for the mission!', 'Stay safe out there!', 'Yum, space salad!'];
    function say(e, txt) {
        const sc = $('ocScene'), r = sc.getBoundingClientRect(), d = document.createElement('div');
        d.className = 'op-say'; d.textContent = txt;
        d.style.left = Math.max(10, Math.min(r.width - 150, (e.clientX ? e.clientX - r.left : r.width / 2) - 60)) + 'px';
        d.style.top = Math.max(6, (e.clientY ? e.clientY - r.top : 40) - 60) + 'px';
        sc.appendChild(d); setTimeout(() => d.remove(), 1500);
    }
    $('outpostCard').addEventListener('click', e => {
        const t = e.target.closest('[data-hit]'); if (!t) return;
        const k = t.dataset.hit, sc = $('ocScene'), F = OZ.CinematicSFX || {};
        const q = s => sc.querySelector(s), f = n => F[n] && F[n]();
        if (k === 'ast') { kick(t, 'jump', 900); f('pop'); say(e, SAY[Math.floor(Math.random() * SAY.length)]); }
        else if (k === 'farm') { kick(q('.op-plants'), 'pop', 900); f('grow'); say(e, '🍅 Fresh food!'); }
        else if (k === 'life') { kick(q('.op-air'), 'puff', 900); f('hiss'); say(e, '💨 Fresh air!'); }
        else if (k === 'shield') { kick(q('.op-shield'), 'ripple', 1000); f('zap'); say(e, '🛡️ Shield is on!'); }
        else if (k === 'dome') { sc.querySelectorAll('.op-win').forEach(x => kick(x, 'flick', 900)); f('clang'); say(e, '💡 Lights on!'); }
        else if (k === 'solar') { kick(q('.op-solar'), 'glint', 900); f('pop'); say(e, '☀️ Solar power!'); }
    });

    /* ---------- Top bar: Settings button ---------- */
    document.querySelector('.tools').insertAdjacentHTML('beforeend', '<button class="tool-btn" id="setBtn" type="button">⚙️ <span>Settings</span></button>');
    $('setBtn').onclick = () => { OZ.Audio.play('click'); $('setFab').click(); };

    /* ---------- Cells display + launch button ---------- */
    document.querySelector('.power-count').innerHTML = '<div class="pc-top"><strong id="powerLeft">6</strong><em>/ 6</em></div><span id="pcLbl">CELLS FREE</span><div class="cellrow" id="cellRow"><i></i><i></i><i></i><i></i><i></i><i></i></div>';
    const r0 = A.render;
    A.render = function () {
        r0.call(this);
        const s = OZ.State, p = s.power, used = p.life + p.shield + p.farm, left = 6 - used;
        document.querySelectorAll('#cellRow i').forEach((c, i) => c.classList.toggle('free', i < left));
        $('pcLbl').textContent = left === 0 ? 'ALL 6 IN USE ✓' : `${left} FREE · ${used} USED`;
        $('powerLeft').parentElement.parentElement.classList.toggle('full', left === 0);
        const plan = OZ.Game.dailyPowerPlan();
        $('startDayBtn').textContent = `🚀 LAUNCH DAY ${s.day} OF 7`;
        const lp = document.querySelector('.launch-pad small'); if (lp) lp.textContent = '🛫 LAUNCH CONTROL · ' + plan.condition.toUpperCase();
        const sc = $('ocScene');
        ['shield', 'farm', 'life'].forEach(k => sc.style.setProperty('--' + k, p[k] / 6));
        sc.classList.toggle('sad', s.health < 40);
        sc.classList.toggle('warn', Math.min(s.oxygen, s.food, s.health) < 30);
        $('chS').textContent = p.shield; $('chF').textContent = p.farm; $('chL').textContent = p.life;
    };
})(window);
