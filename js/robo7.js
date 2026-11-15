/* Outpost Zero - ROBO-7 upgrade (load LAST, after polish.js).
   1. Short, fun lines: ROBO-7 now says one quick thing instead of a speech.
   2. ⏭ Skip button: cuts his voice at any time.
   3. Any action you take (tap a button, change power, start the day...) stops his voice
      so he never talks over you. */
(function (w) {
    'use strict';
    const OZ = w.OZ, A = OZ.App, S = w.speechSynthesis, $ = id => document.getElementById(id);
    if (!OZ || !A) return;

    /* ---------- 1. Short + fun English lines ---------- */
    Object.assign(OZ.STRINGS.en, {
        tutMsg1: n => `Hi ${n}! I'm ROBO-7, your space buddy. Let's explore your outpost. Tap Next!`,
        tutMsg2: 'This is Sun Watch. Real NASA flare data! Big flare, big radiation. Check it first!',
        tutMsg3: 'Crew vitals: air, food, health. If one hits zero, the mission is over!',
        tutMsg4: 'Six power cells. Share them wisely. Every cell you give here is one you lose there!',
        tutMsg5: 'Ready? Hit the orange Launch button. Good luck, Commander!',
        noPower: n => `All six cells are busy, ${n}! Free one up first.`,
        welcomeCommander: n => `Welcome, Commander ${n}! Quick tour, or straight to launch?`,
        missionStarted: (site, n) => `Liftoff on ${site}, ${n}! Six cells. Choose wisely!`,
        stillUnused: (n, left) => `Wait, ${n}! ${left} cell${left > 1 ? 's are' : ' is'} still unused. Use all six!`,
        tipX: (n, c) => `Storm alert, ${n}! A ${c} flare is coming. Shield up, but air and food will pay!`,
        tipM: c => `Medium ${c} flare. Give the shield two or three cells!`,
        tipC: c => `Calm ${c} flare. One shield cell is enough. Boost air or food!`,
        tipBalance: 'Only six cells! Air, shield, greenhouse. Every choice costs something.',
        tipData: 'Fun fact: this flare data is real, straight from NASA!',
        tipPlan: 'Peek at tomorrow first. Real mission teams always plan ahead!',
        nextDayX: (d, c) => `Day ${d}: giant ${c} flare! Raise the shield!`,
        nextDayM: (d, c) => `Day ${d}: medium ${c} flare. Balance shield and food!`,
        nextDayC: (d, c) => `Day ${d} looks calm. Boost air or food!`,
        endWinSpeak: n => `You did it, ${n}! A true space commander!`,
        endLoseSpeak: n => `Good try, ${n}! Watch Sun Watch and go again!`
    });

    // The long "plan rejected" speeches become one short line (English only).
    function shorten(msg) {
        if (typeof msg !== 'string') return msg;
        let m = msg.match(/^Mission plan rejected\. (.+?) requires exactly (\d+) Life Support, (\d+) Greenhouse and (\d+) Radiation Shield cells\./);
        if (m) {
            const star = /You lost a star! Stars left: (\d)\/3/.exec(msg);
            const tail = star ? ` Lost a star! ${star[1]} left.` : (/Only one star/.test(msg) ? ' Last star, careful!' : '');
            return `Plan rejected! ${m[1]} needs ${m[2]} Life, ${m[3]} Greenhouse, ${m[4]} Shield.${tail}`;
        }
        m = msg.match(/^Plan rejected\. (.+?) needs exactly (\d+) Life Support, (\d+) Greenhouse and (\d+) Shield cells\./);
        if (m) return `Plan rejected! ${m[1]} needs ${m[2]} Life, ${m[3]} Greenhouse, ${m[4]} Shield. No stars left, but finish the day!`;
        return msg;
    }
    const baseAppSpeak = A.speak;
    A.speak = function (msg, cb) { return baseAppSpeak.call(this, shorten(msg), cb); };

    /* ---------- 2 + 3. Skip button and stop-on-action ---------- */
    const skipBtn = $('skipVoiceBtn');
    let cur = null; // the speech that is currently playing (or about to play)

    const baseSpeak = OZ.Audio.speak;
    OZ.Audio.speak = function (text, o) {
        o = o || {};
        const mine = {
            orig: o,
            onStart() { if (cur === mine) setSkip(true); if (o.onStart) o.onStart(); },
            onEnd() { if (cur !== mine) return; cur = null; setSkip(false); if (o.onEnd) o.onEnd(); }
        };
        cur = mine;
        if (OZ.State.audioEnabled) setSkip(true);
        baseSpeak.call(OZ.Audio, text, mine);
    };

    function setSkip(on) {
        if (!skipBtn) return;
        skipBtn.hidden = !on;
        if (on) skipBtn.textContent = OZ.L ? OZ.L('⏭ Skip', '⏭ چھوڑیں') : '⏭ Skip';
    }

    /* Stop ROBO-7's voice right now and run his normal "finished talking" clean-up. */
    function stopVoice() {
        const c = cur;
        if (!c) return;
        cur = null;
        setSkip(false);
        try { if (S) S.cancel(); } catch (e) { /* ignore */ }
        if (A.roboAvatar) A.roboAvatar.classList.remove('talking');
        try { OZ.Music.duck(false); } catch (e) { /* ignore */ }
        if (c.orig.onEnd) c.orig.onEnd();
    }
    OZ.Audio.stopVoice = stopVoice;

    if (skipBtn) skipBtn.addEventListener('click', e => { e.stopPropagation(); OZ.Audio.play && OZ.Audio.play('click'); stopVoice(); });

    // Any action you take stops the voice first (capture phase, so it runs before the action itself).
    // If the action makes ROBO-7 say something new, that new line then plays normally.
    const ACTION = 'button, .step, [data-sys], [data-hit], .site-card, label, select, input, summary';
    document.addEventListener('click', e => {
        if (!cur) return;
        const t = e.target.closest && e.target.closest(ACTION);
        if (!t || t.closest('#robo')) return; // ROBO-7's own buttons handle themselves
        stopVoice();
    }, true);
    document.addEventListener('keydown', e => {
        if (cur && (e.key === 'Escape' || ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest(ACTION) && !e.target.closest('#robo')))) stopVoice();
    }, true);

    /* ---------- 4. Default sound levels: music 70, ROBO-7 voice 70, speed 100 ---------- */
    (function defaults() {
        let done = false;
        try { done = localStorage.getItem('ozDefaultsV5') === '1'; localStorage.setItem('ozDefaultsV5', '1'); } catch (e) { /* ignore */ }
        if (!done) { // one-time reset so everyone starts at the new defaults
            OZ.Settings.voice = 0.7; OZ.Settings.music = 0.7; OZ.Settings.rate = 1;
            try { localStorage.setItem('ozVoiceVol', 0.7); localStorage.setItem('ozMusicVol', 0.7); localStorage.setItem('ozVoiceRate', 1); } catch (e) { /* ignore */ }
        }
        try { OZ.Music.setVolume(OZ.Settings.music * OZ.Settings.music); } catch (e) { /* ignore */ }
        const put = (id, val, lbl) => { const el = $(id); if (el) el.value = val; const l = $(lbl); if (l) l.textContent = val + '%'; };
        put('musicVol', Math.round(OZ.Settings.music * 100), 'musicLbl');
        put('voiceVol', Math.round(OZ.Settings.voice * 100), 'voiceLbl');
        put('voiceRate', Math.round(OZ.Settings.rate * 100), 'rateLbl');
    })();

    /* ---------- 5. Motivation after every day + a little ROBO-7 info ---------- */
    const WELL = [
        'Flawless! Your crew is lucky to have you.',
        'Wow! You get stronger every day.',
        'Great plan! Space needs thinkers like you.',
        'Brilliant! Real astronauts would be proud.',
        'Smooth flying! Keep that streak going.',
        'Almost there! The finish line is close.',
        'Legend! One more push, Commander!'
    ];
    const RETRY = [
        'Oops happens! Astronauts learn by trying.',
        'Shake it off! Tomorrow is a fresh start.',
        'Mistakes are practice. You are improving!',
        'Never quit! Every expert started as a beginner.',
        'Tough day, tougher you. Keep going!',
        'So close! One smart plan wins this.',
        'You have come far. Finish strong!'
    ];
    const FACTS = [
        'Flare classes C, M and X: each step is ten times stronger.',
        'A day on Mars lasts about 24 hours and 37 minutes.',
        'The Moon is about three days away by rocket.',
        'Astronauts on the space station see 16 sunrises a day!',
        'Astronauts have grown lettuce and chili peppers in space.',
        'A night on the Moon lasts about two Earth weeks.',
        'The Moon and Mars have no global magnetic shield, so radiation reaches the ground.'
    ];
    let factIdx = Math.floor(Math.random() * FACTS.length);
    const nextFact = () => FACTS[factIdx++ % FACTS.length];
    const pick = (arr, day) => arr[Math.max(0, Math.min(arr.length - 1, (day || 1) - 1))];

    function setBoost(txt) { const b = $('boostText'); if (b) b.textContent = txt; }

    const baseDebrief = A.showDebrief;
    A.showDebrief = function (snap, lesson) {
        baseDebrief.call(this, snap, lesson);
        try {
            const name = OZ.State.cadetName || 'Commander';
            const good = !snap.wrongTries && snap.health && snap.health.after >= 40;
            const line = pick(good ? WELL : RETRY, snap.day);
            const fact = nextFact();
            const dlg = $('debriefDialog');
            let box = $('motivateBox');
            if (!box) {
                box = document.createElement('div');
                box.id = 'motivateBox'; box.className = 'motivate-box';
                const anchor = $('debriefBody');
                if (anchor) anchor.before(box); else dlg.appendChild(box);
            }
            box.innerHTML = `<span>💪</span><div><strong>ROBO-7 SAYS</strong><p></p><small></small></div>`;
            box.querySelector('p').textContent = `${name}! ${line}`;
            box.querySelector('small').textContent = `🤖 Did you know? ${fact}`;
            setBoost(`${line} Next stop: Day ${Math.min((snap.day || 1) + 1, 7)}.`);
            this.speak(`${line} Did you know? ${fact}`);
        } catch (e) { /* never block the game */ }
    };

    // Smart Tip: now and then ROBO-7 shares a space fact instead of a game tip.
    const baseTip = A.giveTip;
    A.giveTip = function () {
        if (Math.random() < 0.35) {
            OZ.Audio.play && OZ.Audio.play('click');
            document.querySelectorAll('.spotlight').forEach(el => el.classList.remove('spotlight'));
            if (this.roboAvatar) this.roboAvatar.classList.remove('pointing');
            return this.speak('Did you know? ' + nextFact());
        }
        return baseTip.apply(this, arguments);
    };

    // End screen: a motivation line under the result.
    const baseEnd = A.showEndScreen;
    A.showEndScreen = function (success) {
        baseEnd.call(this, success);
        const m = $('endMotive');
        if (m) m.textContent = success
            ? '💪 Champions never stop exploring. Dream big, Commander!'
            : '💪 Every astronaut tries again. Your next mission will be better!';
    };
})(window);
