/**
 * Outpost Zero — End-of-Day Cinematics (v2)
 * Countdown -> optional tap-to-repair mini-game -> animated result scene
 * with crew, ROBO-7, sound effects, Moon/Mars look and a 1–3 star rating.
 */
(function (global) {
    'use strict';
    const OZ = global.OZ;

    const rnd = (a, b) => a + Math.random() * (b - a);
    const many = (n, fn) => Array.from({ length: n }, (_, i) => fn(i)).join('');
    const plants = (n, mode) => `<div class="cz-plants ${mode}">${many(n, i => `<span style="animation-delay:${i * .25 + (mode === 'revive' ? .8 : 0)}s">🌱</span>`)}</div>`;

    /* ---------- Sound effects (small WebAudio synth, honours the sound setting) ---------- */
    let actx = null;
    function ac() {
        if (!OZ.State || !OZ.State.audioEnabled) return null;
        if (!actx) {
            const AC = global.AudioContext || global.webkitAudioContext;
            if (!AC) return null;
            try { actx = new AC(); } catch (e) { return null; }
        }
        if (actx.state === 'suspended') actx.resume();
        return actx;
    }
    function tone(freqs, type, vol, dur, delay) {
        const c = ac(); if (!c) return;
        const t = c.currentTime + (delay || 0);
        const o = c.createOscillator(), g = c.createGain();
        o.type = type; o.connect(g); g.connect(c.destination);
        freqs.forEach(([f, off]) => o.frequency.linearRampToValueAtTime(f, t + off));
        o.frequency.setValueAtTime(freqs[0][0], t);
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.start(t); o.stop(t + dur + 0.02);
    }
    function noise(vol, dur, delay, lowpass) {
        const c = ac(); if (!c) return;
        const len = Math.floor(c.sampleRate * dur);
        const buf = c.createBuffer(1, len, c.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
        const src = c.createBufferSource(); src.buffer = buf;
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lowpass || 1500;
        const g = c.createGain(); g.gain.value = vol;
        src.connect(f); f.connect(g); g.connect(c.destination);
        src.start(c.currentTime + (delay || 0));
    }
    const SFX = {
        tick()   { tone([[880, 0], [880, .1]], 'square', .05, .12); },
        go()     { tone([[660, 0], [1320, .15]], 'triangle', .09, .3); },
        siren()  { for (let i = 0; i < 3; i++) tone([[500, 0], [900, .3]], 'sawtooth', .045, .32, i * .6), tone([[900, 0], [500, .3]], 'sawtooth', .045, .32, i * .6 + .3); },
        boom()   { noise(.35, .7, 0, 500); tone([[120, 0], [40, .5]], 'sine', .25, .6); },
        zap()    { tone([[1400, 0], [200, .25]], 'sawtooth', .05, .3); },
        hiss()   { noise(.12, 1.1, 0, 4000); },
        clang()  { tone([[900, 0], [700, .2]], 'square', .06, .25); tone([[1350, 0], [1000, .2]], 'triangle', .05, .3); },
        pop()    { tone([[500, 0], [900, .08]], 'sine', .09, .12); },
        grow()   { tone([[400, 0], [800, .3]], 'sine', .06, .4); tone([[600, 0], [1000, .3]], 'sine', .05, .4, .15); },
        ding(i)  { tone([[880 * Math.pow(1.26, i), 0]], 'triangle', .1, .5); },
        fanfare(){ [523, 659, 784, 1047].forEach((f, i) => tone([[f, 0]], 'triangle', .09, .35, i * .14)); },
        sad()    { tone([[300, 0], [220, .4]], 'sine', .07, .5); }
    };
    OZ.CinematicSFX = SFX;

    /* ---------- Per-day scenes (match OZ.Game.dailyPowerPlan) ---------- */
    const SCENES = {
        1: {
            theme: 'calm', icon: '☀️', title: 'Calm Skies, Commander!',
            line: 'Stable solar weather. Air steady, crops growing.',
            cd: { label: '🔍 SYSTEMS CHECK', sub: 'Scanning the outpost…', storm: false },
            sfx: 'grow',
            layers: () => `
                <div class="cz-sun calm"></div>
                ${many(14, () => `<i class="cz-sparkle" style="left:${rnd(5, 95)}%;top:${rnd(10, 60)}%;animation-delay:${rnd(0, 2)}s"></i>`)}
                <div class="cz-base"><div class="cz-dome ok"></div>${plants(3, 'grow')}</div>`
        },
        2: {
            theme: 'xstorm', icon: '🌋', title: 'X-Class Storm Survived!',
            line: 'Extreme radiation blasted the outpost. Shields held!',
            cd: { label: '☢️ X-CLASS STORM INCOMING', sub: 'Raise the shields!', storm: true },
            sfx: 'boom',
            layers: () => `
                <div class="cz-sun xflare"></div>
                ${many(12, i => `<i class="cz-ray" style="--a:${i * 30}deg;animation-delay:${(i % 4) * .12}s"></i>`)}
                ${many(26, () => `<i class="cz-particle" style="left:${rnd(0, 100)}%;animation-delay:${rnd(0, 1.8)}s;animation-duration:${rnd(.5, 1)}s"></i>`)}
                <div class="cz-base"><div class="cz-shield hit"></div><div class="cz-dome ok"></div></div>
                <div class="cz-flash"></div>`
        },
        3: {
            theme: 'dust', icon: '🌪️', title: 'Greenhouse Recovered!',
            line: 'Dust cleared. The crops are bouncing back.',
            cd: { label: '🌪️ DUST EMERGENCY', sub: 'The greenhouse is covered!', storm: false },
            sfx: 'grow',
            mini: { text: '🧹 Wipe the dust! Tap every cloud', count: 4, emoji: '🌫️', cls: 'dust', sfx: 'pop', win: 'Greenhouse cleaned!' },
            layers: () => `
                ${many(9, i => `<i class="cz-dust" style="top:${8 + i * 8}%;animation-delay:${i * .25}s;animation-duration:${rnd(2.2, 3.4)}s"></i>`)}
                <div class="cz-base"><div class="cz-dome ok"></div>${plants(3, 'revive')}</div>
                ${many(8, () => `<i class="cz-leaf" style="left:${rnd(25, 75)}%;animation-delay:${rnd(1.2, 2.6)}s">🍃</i>`)}`
        },
        4: {
            theme: 'leak', icon: '💨', title: 'Leak Sealed!',
            line: 'Life Support patched the recycler. Oxygen restored.',
            cd: { label: '🚨 OXYGEN LEAK', sub: 'Air is escaping the dome!', storm: true },
            sfx: 'hiss',
            mini: { text: '🔧 Seal the leaks! Tap every leak', count: 3, emoji: '💨', cls: 'leak', sfx: 'clang', win: 'Leaks sealed!' },
            layers: () => `
                <div class="cz-base"><div class="cz-dome leak"></div>
                    ${many(10, () => `<i class="cz-bubble" style="left:${rnd(38, 62)}%;animation-delay:${rnd(0, 1.6)}s;animation-duration:${rnd(1, 1.8)}s"></i>`)}
                    <div class="cz-patch">🔧</div>
                </div>
                <div class="cz-o2"><span>O₂</span><div><b></b></div></div>`
        },
        5: {
            theme: 'mixed', icon: '⚖️', title: 'Balanced Response!',
            line: 'Flare deflected and crops saved. Smart balancing.',
            cd: { label: '☄️ FLARE + CROP STRESS', sub: 'Balance everything!', storm: true },
            sfx: 'zap',
            layers: () => `
                <div class="cz-sun mflare"></div>
                ${many(14, () => `<i class="cz-particle soft" style="left:${rnd(0, 100)}%;animation-delay:${rnd(0, 2)}s;animation-duration:${rnd(.8, 1.4)}s"></i>`)}
                <div class="cz-base"><div class="cz-shield hit soft"></div><div class="cz-dome ok"></div>${plants(3, 'revive')}</div>`
        },
        6: {
            theme: 'surge', icon: '☢️', title: 'Crew Protected!',
            line: 'Radiation surge blocked while the greenhouse recovers.',
            cd: { label: '☢️ RADIATION SURGE', sub: 'Protect the crew!', storm: true },
            sfx: 'zap',
            layers: () => `
                ${many(4, i => `<i class="cz-ring" style="animation-delay:${i * .55}s"></i>`)}
                <div class="cz-base"><div class="cz-shield hit"></div><div class="cz-dome ok"></div>${plants(3, 'grow')}</div>
                <div class="cz-food"><span>🥗</span><div><b></b></div></div>`
        },
        7: {
            theme: 'final', icon: '🏆', title: 'Final Storm Weathered!',
            line: 'The last storm is over. Sunrise on your outpost, Commander!',
            cd: { label: '🌋 FINAL STORM', sub: 'Everything you learned… now!', storm: true },
            sfx: 'boom',
            layers: () => `
                <div class="cz-sun xflare big"></div>
                ${many(28, () => `<i class="cz-particle" style="left:${rnd(0, 100)}%;animation-delay:${rnd(0, 1.4)}s;animation-duration:${rnd(.4, .9)}s"></i>`)}
                <div class="cz-base"><div class="cz-shield hit"></div><div class="cz-dome ok"></div></div>
                <div class="cz-flash"></div>
                <div class="cz-dawn"></div>
                ${many(26, () => `<i class="cz-confetti" style="left:${rnd(0, 100)}%;background:hsl(${rnd(0, 360)},85%,62%);animation-delay:${rnd(2, 3.4)}s"></i>`)}`
        }
    };

    /* ---------- Star rating: how healthy is the crew after the day? (0 = every star was lost) ---------- */
    function starsFor(snap, repaired) {
        const low = Math.min(snap.oxygen.after, snap.food.after, snap.health.after);
        let st = low >= 70 ? 3 : (low >= 40 ? 2 : 1);
        const cap = snap.maxStars === undefined ? 3 : snap.maxStars;
        return Math.max(0, Math.min(st, cap));
    }

    let timer = null;

    /**
     * The original end-of-day animation: one full-screen scene that matches the
     * day's condition, a caption with the final vitals, and "Tap to continue".
     * done({stars, repaired}) is called when it ends or is skipped.
     */
    OZ.Cinematic = {
        _el: null,

        play(snap, done) {
            this.stop();
            const day = Math.min(7, Math.max(1, snap.day));
            const base = SCENES[day];
            const U = OZ.isUrdu && OZ.isUrdu() ? OZ.UR.scenes[day] : null;
            const scene = U ? { ...base, title: U.title, line: U.line } : base;
            const hurt = snap.radiation > 0 && snap.health.after < snap.health.before;
            const reduced = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;

            const el = document.createElement('div');
            el.className = `cz th-${scene.theme}${reduced ? ' cz-reduced' : ''}`;
            el.setAttribute('role', 'dialog');
            el.setAttribute('aria-label', `Day ${day} animation`);
            el.innerHTML = `
                <div class="cz-starfield"></div>
                <div class="cz-stage">${scene.layers()}</div>
                <div class="cz-ground"></div>
                <div class="cz-caption">
                    <div class="cz-day">DAY ${day} · ${day === 7 ? 'FINAL' : 'COMPLETE'}</div>
                    <div class="cz-title"><span>${scene.icon}</span> ${scene.title}</div>
                    <div class="cz-line">${scene.line}</div>
                    <div class="cz-stats">
                        <b>💨 ${snap.oxygen.after}%</b><b>🥗 ${snap.food.after}%</b>
                        <b>❤️ ${snap.health.after}%${hurt ? ` <em>(−${snap.radiation}%)</em>` : ''}</b>
                    </div>
                    <div class="cz-skip">Tap to continue ▸</div>
                </div>`;
            document.body.appendChild(el);
            requestAnimationFrame(() => el.classList.add('cz-in'));
            this._el = el;

            let finished = false;
            const finish = () => {
                if (finished) return;
                finished = true;
                clearTimeout(timer);
                el.classList.remove('cz-in');
                el.classList.add('cz-out');
                setTimeout(() => { el.remove(); if (OZ.Cinematic._el === el) OZ.Cinematic._el = null; }, 350);
                if (done) done({ stars: starsFor(snap, false), repaired: false });
            };
            el.addEventListener('click', finish);
            el.tabIndex = 0;
            el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') finish(); });
            try { el.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
            if (scene.sfx && SFX[scene.sfx]) setTimeout(() => SFX[scene.sfx](), 500);
            timer = setTimeout(finish, reduced ? 1800 : (day === 7 ? 5200 : 4200));
        },

        stop() {
            clearTimeout(timer);
            if (this._el) { this._el.remove(); this._el = null; }
        }
    };
})(window);
