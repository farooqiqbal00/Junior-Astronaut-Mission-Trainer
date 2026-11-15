/* Outpost Zero - better ROBO-7 voice (load AFTER upgrade2.js).
   - picks the most natural English voice installed on the device (neural / online / premium first)
   - friendly, natural pitch and pace instead of a squeaky one
   - reads numbers, symbols and space words the way a person would say them
   - Settings: choose any installed voice, adjust speed, hear a sample */
(function (w) {
    'use strict';
    const OZ = w.OZ, A = OZ.App, S = w.speechSynthesis, $ = id => document.getElementById(id);
    if (!S) return;

    const store = {
        get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } },
        set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
    };
    OZ.Settings = OZ.Settings || { voice: 0.7, music: 0.7 };
    OZ.Settings.rate = Math.min(1.25, Math.max(0.75, parseFloat(store.get('ozVoiceRate', '1')) || 1));

    /* ---------- choosing a voice ---------- */
    const NOVELTY = /albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|organ|trinoids|whisper|zarvox|wobble|jester|superstar|grandma|grandpa|eddy|flo\b|reed|rocko|sandy|shelley|fred|ralph|junior|kathy|princess|agnes|bruce/i;
    const FEM = /female|aria|jenny|samantha|zira|susan|karen|moira|tessa|serena|fiona|allison|ava\b|nicky|salli|joanna|kimberly|hazel|libby|sonia|natasha|clara|emma|michelle|victoria|ivy|kendra|amy|jane|sara|heather|catherine|google us english|google uk english female/i;
    const MAL = /guy|daniel|david|mark|alex\b|aaron|arthur|james|george|ryan|thomas|oliver|rishi|lee\b|brian|eric|davis|tony|christopher|matthew|roger|steffan|google uk english male|\bmale\b/i;
    const isFem = n => /female/i.test(n) || (FEM.test(n) && !/\bmale\b/i.test(n) && !MAL.test(n));
    const isMal = n => !/female/i.test(n) && MAL.test(n);

    function score(v) {
        let s = 0; const n = v.name || '';
        if (NOVELTY.test(n)) return -999;
        if (/natural|neural|online/i.test(n)) s += 60;
        if (/premium|enhanced|siri/i.test(n)) s += 45;
        if (/google/i.test(n)) s += 30;
        if (/microsoft/i.test(n)) s += 10;
        if (v.localService) s += 6;
        const nav = (navigator.language || 'en-US').toLowerCase();
        if (v.lang && v.lang.toLowerCase().replace('_', '-') === nav) s += 8;
        else if (/^en-(us|gb)/i.test(v.lang || '')) s += 5;
        return s;
    }
    const english = () => S.getVoices().filter(v => /^en/i.test(v.lang || ''));
    function pickVoice() {
        const all = english();
        if (!all.length) return null;
        const saved = store.get('ozVoiceName', '');
        if (saved) { const v = all.find(x => x.name === saved); if (v) return v; }
        const fem = OZ.State.voiceType === 'female';
        const pool = all.filter(v => (fem ? isFem(v.name) : isMal(v.name)));
        const list = (pool.length ? pool : all).slice().sort((a, b) => score(b) - score(a));
        return list[0];
    }

    /* ---------- say it like a person ---------- */
    function prep(t) {
        return String(t)
            .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '')
            .replace(/\bROBO-7\b/g, 'Robo 7')
            .replace(/\bDONKI\b/g, 'Donkey')
            .replace(/\bISS\b/g, 'I S S').replace(/\bUTC\b/g, 'U T C').replace(/\bOSDR\b/g, 'O S D R')
            .replace(/\b([CMX])(\d)\.(\d)\b/g, '$1 class $2 point $3')
            .replace(/\b([CMX])-class\b/gi, '$1 class')
            .replace(/O₂/g, 'oxygen').replace(/H₂O/g, 'water')
            .replace(/(\d)\s*%/g, '$1 percent')
            .replace(/[−–]\s*(\d)/g, 'minus $1').replace(/\+\s*(\d)/g, 'plus $1')
            .replace(/(\d)\/(\d)/g, '$1 of $2')
            .replace(/\s[—–]\s/g, ', ').replace(/[—–]/g, ', ')
            .replace(/·/g, ',').replace(/→|▸/g, '')
            .replace(/\s+/g, ' ').trim();
    }
    // simple, safe splitter for very long sentences
    function splitLong(p) {
        const r = []; let cur = '';
        p.split(/\s+/).forEach(wd => { if ((cur + ' ' + wd).length > 190 && cur) { r.push(cur); cur = wd; } else cur = cur ? cur + ' ' + wd : wd; });
        if (cur) r.push(cur);
        return r;
    }
    function parts(text) {
        const out = [];
        (text.match(/[^.!?]+[.!?]*/g) || [text]).forEach(p => { p = p.trim(); if (p) (p.length <= 200 ? out.push(p) : splitLong(p).forEach(x => out.push(x))); });
        return out;
    }

    /* ---------- speaking ---------- */
    let token = 0, ready = null;
    const origCancel = S.cancel.bind(S);
    S.cancel = function () { token++; origCancel(); };
    function whenVoices() {
        if (S.getVoices().length) return Promise.resolve();
        if (!ready) ready = new Promise(res => { const f = () => res(); S.addEventListener('voiceschanged', f, { once: true }); setTimeout(f, 700); });
        return ready;
    }
    OZ.Audio.speak = function (text, o) {
        o = o || {};
        const finish = () => { if (o.onEnd) o.onEnd(); };
        if (!OZ.State.audioEnabled) { finish(); return; }
        const clean = prep(text);
        if (!clean) { finish(); return; }
        const id = ++token;
        origCancel();
        whenVoices().then(() => {
            if (id !== token) return;
            const v = pickVoice(), fem = OZ.State.voiceType === 'female', ps = parts(clean);
            const us = ps.map((p, i) => {
                const u = new SpeechSynthesisUtterance(p);
                try { if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-US'; } catch (e) { u.lang = 'en-US'; }
                u.rate = OZ.Settings.rate;
                u.pitch = fem ? 1.1 : 0.96;
                u.volume = OZ.Settings.voice;
                if (i === 0) u.onstart = () => { if (id === token && o.onStart) o.onStart(); };
                if (i === ps.length - 1) u.onend = u.onerror = () => { if (id === token) finish(); };
                return u;
            });
            w._ozUs = us; // keep references so the browser does not drop them mid-speech
            setTimeout(() => { if (id !== token) return; if (S.paused) S.resume(); us.forEach(u => S.speak(u)); }, 90);
        });
    };

    /* ---------- Settings: voice picker + speed ---------- */
    const dlg = $('settingsDialog');
    if (dlg) {
        const row = document.createElement('div');
        row.innerHTML = `
            <label class="set-row"><span>🎙️ Voice</span><select id="voiceSel" class="set-select"></select></label>
            <label class="set-row"><span>⏱️ Speed <b id="rateLbl"></b></span><input type="range" id="voiceRate" min="75" max="125" step="5"></label>
            <button type="button" class="tool-btn set-test" id="voiceTest">▶ Hear ROBO-7</button>`;
        const anchor = $('voiceVol') && $('voiceVol').closest('.set-row');
        if (anchor) anchor.after(...row.children); else dlg.appendChild(row);

        const sel = $('voiceSel');
        const fill = () => {
            const all = english().filter(v => score(v) > -999).sort((a, b) => score(b) - score(a));
            const saved = store.get('ozVoiceName', '');
            sel.innerHTML = '<option value="">✨ Auto — best voice on this device</option>' +
                all.map(v => `<option value="${v.name.replace(/"/g, '&quot;')}">${v.name}${/natural|neural|online/i.test(v.name) ? ' ★' : ''}</option>`).join('');
            sel.value = all.some(v => v.name === saved) ? saved : '';
        };
        fill(); S.addEventListener('voiceschanged', fill);
        const sample = () => A.speak('Hi Commander! I am Robo 7. This is my voice. Ready for the mission?');
        sel.onchange = () => { store.set('ozVoiceName', sel.value); sample(); };
        const rate = $('voiceRate'), lbl = $('rateLbl');
        const sync = () => { rate.value = Math.round(OZ.Settings.rate * 100); lbl.textContent = rate.value + '%'; };
        rate.oninput = () => { OZ.Settings.rate = rate.value / 100; store.set('ozVoiceRate', OZ.Settings.rate); sync(); };
        rate.onchange = sample;
        $('voiceTest').onclick = sample;
        sync();
        $('setBtn') && $('setBtn').addEventListener('click', () => { fill(); sync(); });
    }
    // Boy / girl button changes the automatic pick instantly
    document.querySelectorAll('.voice-choice').forEach(b => b.addEventListener('click', () => { if (!store.get('ozVoiceName', '')) token++; }));
})(window);
