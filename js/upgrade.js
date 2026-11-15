/* Outpost Zero - upgrade layer v2 (load AFTER app.js). */
(function (w) {
    'use strict';
    const OZ = w.OZ, A = OZ.App, S = w.speechSynthesis;
    const $ = id => document.getElementById(id);
    const store = {
        get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : +v; } catch (e) { return d; } },
        set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
    };
    OZ.Settings = { voice: store.get('ozVoiceVol', 0.7), music: store.get('ozMusicVol', 0.7) };
    OZ.State.audioEnabled = store.get('ozSound', 1) === 1;

    /* English only */
    const origLang = A.applyLanguage;
    A.applyLanguage = function () { origLang.call(this, 'en'); };

    /* Voice: kid-like pitch, local voices first, whole text queued at once (no gaps) */
    const PREF = {
        male: /daniel|guy|david|mark|alex|james|george|male/i,
        female: /aria|jenny|samantha|zira|susan|karen|google us english|female/i
    };
    function pick() {
        if (!S) return null;
        const all = S.getVoices().filter(v => /^en/i.test(v.lang));
        if (!all.length) return null;
        const t = OZ.State.voiceType === 'female' ? 'female' : 'male';
        let c = all.filter(v => PREF[t].test(v.name) && !(t === 'male' && /female/i.test(v.name)));
        if (!c.length) c = all;
        return c.find(v => v.localService) || c[0];
    }
    let token = 0;
    OZ.Audio.loadVoice = function () {};
    OZ.Audio.setVoice = function (t) { OZ.State.voiceType = t === 'female' ? 'female' : 'male'; };
    OZ.Audio.speak = function (text, o) {
        o = o || {};
        const done = () => { if (o.onEnd) o.onEnd(); };
        if (!OZ.State.audioEnabled || !S) { done(); return; }
        const clean = String(text).replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
            .replace(/[−–—]/g, ', ').replace(/\s+/g, ' ').trim();
        if (!clean) { done(); return; }
        const id = ++token;
        S.cancel();
        const parts = [];
        (clean.match(/[^.!?]+[.!?]*/g) || [clean]).forEach(p => {
            p = p.trim(); if (!p) return;
            const l = parts[parts.length - 1];
            if (l && l.length + p.length < 170) parts[parts.length - 1] = l + ' ' + p; else parts.push(p);
        });
        const v = pick(), fem = OZ.State.voiceType === 'female';
        const us = parts.map((p, i) => {
            const u = new SpeechSynthesisUtterance(p);
            if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-US';
            u.rate = 1.0; u.pitch = fem ? 1.55 : 1.3; u.volume = OZ.Settings.voice;
            if (i === 0) u.onstart = () => { if (id === token && o.onStart) o.onStart(); };
            if (i === parts.length - 1) { u.onend = u.onerror = () => { if (id === token) done(); }; }
            return u;
        });
        w._ozUs = us; // stops garbage collection
        setTimeout(() => { if (id !== token) return; if (S.paused) S.resume(); us.forEach(u => S.speak(u)); }, 120);
    };

    /* Settings (⚙️) - the old speaker button is removed from index.html */
    document.body.insertAdjacentHTML('beforeend', `
        <button type="button" class="sound-fab" id="setFab" aria-label="Settings">⚙️</button>
        <dialog id="settingsDialog" class="glass dialog">
            <div class="dialog-head"><h2>⚙️ Settings</h2><button class="tool-btn" type="button" data-close>✕</button></div>
            <label class="set-chk"><input type="checkbox" id="soundOn"> 🔊 Sound ON</label>
            <label class="set-row"><span>🎵 Music <b id="musicLbl"></b></span><input type="range" id="musicVol" min="0" max="100" step="5"></label>
            <label class="set-row"><span>🗣️ ROBO-7 voice <b id="voiceLbl"></b></span><input type="range" id="voiceVol" min="0" max="100" step="5"></label>
        </dialog>`);
    const musicApply = () => OZ.Music.setVolume(OZ.Settings.music * OZ.Settings.music);
    const syncSet = () => {
        $('soundOn').checked = OZ.State.audioEnabled;
        $('musicVol').value = Math.round(OZ.Settings.music * 100); $('musicLbl').textContent = $('musicVol').value + '%';
        $('voiceVol').value = Math.round(OZ.Settings.voice * 100); $('voiceLbl').textContent = $('voiceVol').value + '%';
    };
    $('musicVol').oninput = e => { OZ.Settings.music = e.target.value / 100; store.set('ozMusicVol', OZ.Settings.music); musicApply(); syncSet(); OZ.Music.unlock(); };
    $('voiceVol').oninput = e => { OZ.Settings.voice = e.target.value / 100; store.set('ozVoiceVol', OZ.Settings.voice); syncSet(); };
    $('voiceVol').onchange = () => A.speak('Hi! This is how loud I am.');
    $('soundOn').onchange = e => {
        OZ.State.audioEnabled = e.target.checked; store.set('ozSound', e.target.checked ? 1 : 0);
        if (!e.target.checked && S) S.cancel();
        OZ.Music.refresh();
    };
    $('setFab').onclick = () => { syncSet(); $('settingsDialog').showModal(); };
    musicApply(); syncSet();

    /* Home button */
    let prev = null;
    document.querySelector('.tools').insertAdjacentHTML('afterbegin', '<button class="tool-btn" id="homeBtn" type="button">🏠 <span>Home</span></button>');
    $('homeBtn').onclick = () => {
        OZ.Audio.play('click');
        if (S) S.cancel(); token++;
        document.querySelectorAll('dialog[open]').forEach(d => d.close());
        document.querySelectorAll('.spotlight').forEach(e => e.classList.remove('spotlight'));
        if (OZ.Cinematic) OZ.Cinematic.stop();
        $('endScreen').hidden = true;
        document.body.classList.add('is-start');
        $('cadetName').value = OZ.State.cadetName === 'Cadet' ? '' : OZ.State.cadetName;
        A.startScreen.hidden = false;
        prev = null; A.syncMusic();
    };
    const origLaunch = A.onLaunch;
    A.onLaunch = function () { prev = null; origLaunch.call(this); };

    /* Learning card for every level */
    const LEARN = [
        ['What is a solar flare?', 'A solar flare is a sudden flash of light and energy from the Sun. NASA DONKI records them. Flares are ranked C for small, M for medium and X for strong.'],
        ['Why are X-class flares scary?', 'X-class flares are the strongest. On Earth, the air and magnetic field protect us. On the Moon and Mars there is much less protection, so a radiation shield matters.'],
        ['Growing food in space', 'Plants need light, water and power. Astronauts on the space station grew lettuce in a garden called Veggie. Fresh food will be important on long trips.'],
        ['Where does oxygen come from?', 'On the space station, electricity splits water into hydrogen and oxygen, and astronauts breathe the oxygen. A leak lets air escape, so crews must fix it fast.'],
        ['What is a trade-off?', 'A trade-off means you give up one thing to get another. Power used for the shield cannot be used for the greenhouse. Real mission planners make these choices every day.'],
        ['What is a radiation dose?', 'A radiation dose tells us how much radiation the body takes in. Astronauts wear small instruments to measure it. Water and plastic walls help block radiation.'],
        ['Signals take time!', 'Radio signals reach the Moon in about 1.3 seconds. They take 3 to 22 minutes to reach Mars. So crews must make many decisions on their own.']
    ];
    document.querySelector('.welcome').insertAdjacentHTML('beforeend', `
        <div class="learn-card" id="learnCard"><p class="kicker">🎓 NEW TO LEARN · DAY <span id="lcDay">1</span></p>
        <h3 id="lcTitle"></h3><p id="lcBody"></p><small>Source: NASA science facts</small>
        <button type="button" class="tool-btn" id="lcHear">🔊 Hear it</button></div>`);
    const info = () => LEARN[Math.max(0, Math.min(6, OZ.State.day - 1))];
    $('lcHear').onclick = () => A.speak(info()[0] + '. ' + info()[1]);
    const showLearn = () => { const d = info(); $('lcDay').textContent = OZ.State.day; $('lcTitle').textContent = d[0]; $('lcBody').textContent = d[1]; };
    const origCont = A.onDebriefContinue;
    A.onDebriefContinue = function () { this._addInfo = true; origCont.call(this); this._addInfo = false; };
    const origSpeak = A.speak;
    A.speak = function (msg, cb) {
        if (this._addInfo) { this._addInfo = false; const d = info(); msg += ' New today: ' + d[0] + '.'; }
        origSpeak.call(this, msg, cb);
    };

    /* Robot: boy (blue) or girl (pink). Arms pivot at the shoulder. */
    function robot(f) {
        const C = f ? '#ff8fc4' : '#54c7f8', B = f ? '#fff0f7' : '#f7fbff', E = f ? '#ffc2e0' : '#a9d6f2';
        return `
        <ellipse cx="75" cy="163" rx="40" ry="6" fill="#06152a" opacity=".3"/>
        ${f ? `<circle cx="30" cy="36" r="14" fill="${C}"/><circle cx="120" cy="36" r="14" fill="${C}"/><circle cx="30" cy="36" r="5" fill="#fff"/><circle cx="120" cy="36" r="5" fill="#fff"/>` : ''}
        <g class="r-ant"><line x1="75" y1="30" x2="75" y2="14" stroke="#c7e8ff" stroke-width="5" stroke-linecap="round"/><circle cx="75" cy="11" r="8" fill="${f ? '#ff5fa8' : '#ffd166'}"/></g>
        <circle cx="22" cy="72" r="10" fill="${C}"/><circle cx="128" cy="72" r="10" fill="${C}"/>
        <rect x="24" y="28" width="102" height="84" rx="38" fill="${B}" stroke="${E}" stroke-width="4"/>
        <rect x="35" y="40" width="80" height="58" rx="26" fill="#17304f"/>
        <g class="eyes"><ellipse cx="57" cy="62" rx="9" ry="11" fill="#73f3dc"/><ellipse cx="93" cy="62" rx="9" ry="11" fill="#73f3dc"/>
        <circle cx="60" cy="58" r="3.5" fill="#fff"/><circle cx="96" cy="58" r="3.5" fill="#fff"/></g>
        ${f ? '<path d="M47 51 l-6 -4 M52 48 l-3 -7 M103 51 l6 -4 M98 48 l3 -7" stroke="#73f3dc" stroke-width="3" stroke-linecap="round"/>' : ''}
        <circle cx="43" cy="80" r="6" fill="#ff9ecb" opacity=".75"/><circle cx="107" cy="80" r="6" fill="#ff9ecb" opacity=".75"/>
        <path class="smile" d="M64 78 Q75 90 86 78" fill="none" stroke="#73f3dc" stroke-width="4" stroke-linecap="round"/>
        <g class="mopen"><ellipse cx="75" cy="82" rx="10" ry="8" fill="#0b1a2e" stroke="#73f3dc" stroke-width="3"/><ellipse cx="75" cy="86" rx="5" ry="3" fill="#ff7a9a"/></g>
        <rect x="44" y="114" width="62" height="40" rx="18" fill="${f ? '#ffe0f0' : '#e9f5ff'}" stroke="${E}" stroke-width="4"/>
        <path d="M75 142 l-9 -9 a5 5 0 0 1 9 -6 a5 5 0 0 1 9 6z" fill="#ff5f8f"/>
        <g class="ra ra-l"><path d="M44 122 Q22 118 18 100" fill="none" stroke="${E}" stroke-width="11" stroke-linecap="round"/><circle cx="18" cy="98" r="8" fill="${C}"/></g>
        <g class="ra ra-r"><path d="M106 122 Q128 118 132 100" fill="none" stroke="${E}" stroke-width="11" stroke-linecap="round"/><circle cx="132" cy="98" r="8" fill="${C}"/></g>
        <rect x="48" y="151" width="20" height="9" rx="4" fill="${C}"/><rect x="82" y="151" width="20" height="9" rx="4" fill="${C}"/>`;
    }
    const svg = () => $('roboAvatar').querySelector('svg');
    const paint = () => { svg().innerHTML = robot(OZ.State.voiceType === 'female'); };
    paint();
    const origUV = A.updateVoiceButtons;
    A.updateVoiceButtons = function () { origUV.call(this); paint(); };

    const MOVES = ['walk', 'wave', 'spin', 'dance', 'hop', 'tilt'];
    let moving = false;
    function move(name, ms) {
        const el = svg(); if (!el) return;
        MOVES.concat('sad').forEach(m => el.classList.remove(m));
        void el.getBoundingClientRect(); el.classList.add(name); moving = true;
        setTimeout(() => { el.classList.remove(name); moving = false; }, ms);
    }
    (function loop() {
        setTimeout(() => {
            if (!moving && !$('roboAvatar').classList.contains('talking') && !document.hidden)
                move(MOVES[Math.floor(Math.random() * MOVES.length)], 2600);
            loop();
        }, 2500 + Math.random() * 2500);
    })();
    function react(kind) {
        move(kind === 'good' ? 'hop' : 'sad', 1700);
        const f = document.createElement('div');
        f.className = 'fx-flash ' + kind; document.body.appendChild(f);
        setTimeout(() => f.remove(), 900);
    }

    /* Gain / loss effects on vitals */
    const ICON = { oxygen: '💨', food: '🥗', health: '❤️' };
    function fx(k, d) {
        const m = document.querySelector(`[data-meter="${k}"]`); if (!m) return;
        m.classList.remove('gain', 'loss'); void m.offsetWidth; m.classList.add(d > 0 ? 'gain' : 'loss');
        const t = document.createElement('span');
        t.className = 'fx-float ' + (d > 0 ? 'up' : 'down'); t.textContent = `${d > 0 ? '+' : ''}${d}% ${ICON[k]}`;
        m.appendChild(t);
        setTimeout(() => { t.remove(); m.classList.remove('gain', 'loss'); }, 1500);
    }
    const origRender = A.render;
    A.render = function () {
        origRender.call(this);
        const s = OZ.State, cur = { oxygen: s.oxygen, food: s.food, health: s.health };
        if (prev && !document.body.classList.contains('is-start')) {
            let g = 0, b = 0;
            Object.keys(cur).forEach(k => {
                const d = Math.round(cur[k] - prev[k]);
                if (Math.abs(d) >= 3) { fx(k, d); if (d > 0) g++; else b++; }
            });
            if (b) { react('bad'); OZ.Audio.play('fail'); } else if (g) react('good');
        }
        prev = cur; showLearn();
    };
    const origDrop = A.dropStar;
    A.dropStar = function (i) { origDrop.call(this, i); react('bad'); };

    /* Stars: the LAST star can now be lost too */
    const origStart = A.onStartDay;
    A.onStartDay = function () {
        const s = OZ.State, p = OZ.Game.dailyPowerPlan(), pw = s.power;
        const wrong = pw.life !== p.life || pw.farm !== p.farm || pw.shield !== p.shield || pw.life + pw.farm + pw.shield !== 6;
        const before = s.dayStars === undefined ? 3 : s.dayStars;
        if (wrong && before <= 1) {
            s.dayStars = 0; s.wrongTries = (s.wrongTries || 0) + 1;
            this.log(`⚠️ Launch blocked: wrong plan.${before === 1 ? ' −1 ⭐ (0 stars left)' : ''}`);
            OZ.Audio.play('fail'); OZ.Music.sting('wrong');
            this.updateMissionObjective();
            if (before === 1) this.dropStar(0);
            this.speak(`Plan rejected. ${p.condition} needs exactly ${p.life} Life Support, ${p.farm} Greenhouse and ${p.shield} Shield cells. Your stars are gone, but you can still finish the day!`);
            return;
        }
        origStart.call(this);
    };
    if (OZ.Extras) {
        const oDay = OZ.Extras.onDayAnimation;
        OZ.Extras.onDayAnimation = function (snap, res) { if (snap.maxStars === 0) res.stars = 0; oDay.call(this, snap, res); };
    }

    /* Background: nebula, satellite, rocket, sparkles */
    const sc = document.querySelector('.scene');
    let sp = '';
    for (let i = 0; i < 36; i++) sp += `<i class="spk" style="left:${Math.random() * 100}%;top:${Math.random() * 70}%;--s:${2 + Math.random() * 4}px;animation-delay:${Math.random() * 5}s;animation-duration:${2 + Math.random() * 4}s"></i>`;
    sc.insertAdjacentHTML('beforeend', `<div class="bgx neb"></div><div class="bgx neb b"></div>${sp}<div class="bgx sat">🛰️</div><div class="bgx rkt"><svg class="oz-logo" viewBox="8 0 48 70"><use href="#ozRocket"/></svg></div><div class="bgx cmt">☄️</div>`);

    /* Fix: Next Step button fired two handlers */
    const origInit = A.init;
    A.init = function () {
        origInit.call(this);
        const b = this.tipBtn, c = b.cloneNode(true);
        b.replaceWith(c); this.tipBtn = c; c.onclick = () => this.giveTip();
        syncSet(); paint();
    };
})(window);