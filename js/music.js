/**
 * Outpost Zero — Procedural background music.
 * No audio files: every mood is synthesised live with WebAudio and loops forever.
 * Each daily situation has its own mood (calm, storm, dust, alarm, ...).
 */
(function (global) {
    'use strict';
    const OZ = global.OZ;

    const MAJ = [0, 2, 4, 5, 7, 9, 11], LYD = [0, 2, 4, 6, 7, 9, 11], MIN = [0, 2, 3, 5, 7, 8, 10],
          DOR = [0, 2, 3, 5, 7, 9, 10], PHR = [0, 1, 3, 5, 7, 8, 10], LOC = [0, 1, 3, 5, 6, 8, 10];

    const _ = null;
    // arp: chord-tone index per 16th step (0..5, spans two octaves of the triad); other patterns: 1 = hit
    const MOODS = {
        menu:   { bpm: 70,  root: 57, scale: MIN, prog: [0, 5, 3, 4], level: .9,
                  pad: { wave: 'triangle', vol: .10, lpf: 1400 },
                  arp: { p: [0,_,2,_,4,_,2,_,0,_,2,_,5,_,3,_], wave: 'sine', vol: .06, oct: 12 },
                  bass: { p: [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0], wave: 'sine', vol: .12 } },
        calm:   { bpm: 86,  root: 48, scale: LYD, prog: [0, 4, 5, 1], level: .9,
                  pad: { wave: 'triangle', vol: .09, lpf: 2200 },
                  arp: { p: [0,2,4,2,5,4,2,4,0,2,4,2,5,4,3,2], wave: 'triangle', vol: .05, oct: 24 },
                  bass: { p: [1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,0], wave: 'sine', vol: .13 },
                  kick: { p: [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0], vol: .25 },
                  hat:  { p: [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0], vol: .03 } },
        storm:  { bpm: 120, root: 40, scale: PHR, prog: [0, 0, 1, 0], level: 1,
                  pad: { wave: 'sawtooth', vol: .06, lpf: 900 },
                  arp: { p: [0,_,_,2,_,_,4,_,0,_,_,2,_,_,5,_], wave: 'square', vol: .035, oct: 24 },
                  bass: { p: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0], wave: 'sawtooth', vol: .15, lpf: 520 },
                  kick: { p: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], vol: .5 },
                  hat:  { p: [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,1], vol: .05 } },
        dust:   { bpm: 78,  root: 50, scale: DOR, prog: [0, 3, 0, 4], level: .95,
                  pad: { wave: 'triangle', vol: .09, lpf: 1100 },
                  arp: { p: [0,_,_,_,2,_,_,3,_,_,4,_,_,_,2,_], wave: 'triangle', vol: .08, oct: 12 },
                  bass: { p: [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0], wave: 'sine', vol: .12 },
                  wind: .03 },
        leak:   { bpm: 132, root: 45, scale: MIN, prog: [0, 0, 5, 4], level: 1, alarm: true,
                  pad: { wave: 'sawtooth', vol: .045, lpf: 800 },
                  arp: { p: [0,2,4,2,0,2,4,5,0,2,4,2,0,2,5,4], wave: 'square', vol: .028, oct: 24 },
                  bass: { p: [1,1,0,1,1,0,1,0,1,1,0,1,1,0,1,0], wave: 'sawtooth', vol: .13, lpf: 600 },
                  kick: { p: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], vol: .45 },
                  hat:  { p: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0], vol: .04 } },
        mixed:  { bpm: 104, root: 43, scale: MIN, prog: [0, 5, 2, 6], level: 1,
                  pad: { wave: 'sawtooth', vol: .075, lpf: 1000 },
                  arp: { p: [0,_,2,_,4,_,2,_,0,_,2,_,5,_,4,_], wave: 'sawtooth', vol: .045, oct: 24, lpf: 2400 },
                  bass: { p: [1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,0], wave: 'sawtooth', vol: .17, lpf: 540 },
                  kick: { p: [1,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0], vol: .42 },
                  hat:  { p: [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0], vol: .04 } },
        surge:  { bpm: 112, root: 41, scale: LOC, prog: [0, 1, 0, 6], level: 1,
                  pad: { wave: 'sine', vol: .17, lpf: 2000, detune: 18 },
                  arp: { p: [0,_,_,_,3,_,_,_,5,_,_,_,3,_,_,_], wave: 'sine', vol: .10, oct: 24 },
                  bass: { p: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0], wave: 'sawtooth', vol: .17, lpf: 420 },
                  hat:  { p: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], vol: .018 },
                  kick: { p: [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0], vol: .4 } },
        final:  { bpm: 126, root: 38, scale: MIN, prog: [0, 5, 2, 6], level: 1,
                  pad: { wave: 'sawtooth', vol: .075, lpf: 1300 },
                  arp: { p: [0,2,4,2,5,4,2,4,0,2,4,2,5,4,6,4], wave: 'sawtooth', vol: .03, oct: 24, lpf: 3000 },
                  bass: { p: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0], wave: 'sawtooth', vol: .15, lpf: 560 },
                  kick: { p: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], vol: .55 },
                  clap: { p: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], vol: .08 },
                  hat:  { p: [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0], vol: .05 } },
        victory:{ bpm: 100, root: 60, scale: MAJ, prog: [0, 3, 4, 0], level: .9,
                  pad: { wave: 'triangle', vol: .09, lpf: 3000 },
                  arp: { p: [0,2,4,5,4,2,4,5,0,2,4,5,4,2,5,4], wave: 'triangle', vol: .06, oct: 12 },
                  bass: { p: [1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,0], wave: 'sine', vol: .14 },
                  kick: { p: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], vol: .3 },
                  hat:  { p: [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0], vol: .035 } },
        defeat: { bpm: 60,  root: 52, scale: MIN, prog: [0, 5, 3, 4], level: .85,
                  pad: { wave: 'sine', vol: .11, lpf: 900 },
                  arp: { p: [0,_,_,_,_,_,_,_,2,_,_,_,_,_,_,_], wave: 'triangle', vol: .06, oct: 12 },
                  bass: { p: [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], wave: 'sine', vol: .12 } }
    };
    const DAY_MOODS = { 1: 'calm', 2: 'storm', 3: 'dust', 4: 'leak', 5: 'mixed', 6: 'surge', 7: 'final' };

    const midi = n => 440 * Math.pow(2, (n - 69) / 12);
    const degNote = (m, deg) => m.root + m.scale[((deg % 7) + 7) % 7] + 12 * Math.floor(deg / 7);
    const chordNotes = (m, deg) => [degNote(m, deg), degNote(m, deg + 2), degNote(m, deg + 4), degNote(m, deg + 7), degNote(m, deg + 9), degNote(m, deg + 11)];

    let ctx = null, master = null, bus = null, noiseBuf = null, windNode = null;
    let timer = null, running = false;
    let mood = null, wanted = null, step = 0, nextTime = 0, duckAmt = 1;
    let BASE = 0.55; const TEMPO = 0.8;

    function ensure() {
        if (ctx) return true;
        const AC = global.AudioContext || global.webkitAudioContext;
        if (!AC) return false;
        try { ctx = new AC(); } catch (e) { return false; }
        master = ctx.createGain();
        master.gain.value = 0;
        const comp = ctx.createDynamicsCompressor();
        master.connect(comp); comp.connect(ctx.destination);
        const len = ctx.sampleRate * 2;
        noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        return true;
    }

    const enabled = () => !!(OZ.State && OZ.State.audioEnabled);
    const targetGain = () => (enabled() ? BASE * duckAmt : 0);

    function env(g, t, a, dur, vol) {
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(vol, t + a);
        g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, a + .02));
    }
    function voice(freq, t, dur, wave, vol, opts) {
        opts = opts || {};
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = wave; o.frequency.value = freq;
        if (opts.detune) o.detune.value = opts.detune;
        let tail = g;
        if (opts.lpf) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = opts.lpf; o.connect(f); f.connect(g); } else o.connect(g);
        tail.connect(bus);
        env(g, t, opts.attack || .008, dur, vol);
        o.start(t); o.stop(t + dur + .05);
    }
    function noiseHit(t, dur, vol, type, freq) {
        const s = ctx.createBufferSource(); s.buffer = noiseBuf;
        const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq;
        const g = ctx.createGain();
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        s.connect(f); f.connect(g); g.connect(bus);
        s.start(t, Math.random()); s.stop(t + dur + .02);
    }
    function kick(t, vol) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + .13);
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + .22);
        o.connect(g); g.connect(bus); o.start(t); o.stop(t + .25);
    }

    function playStep(s, t) {
        const m = MOODS[mood];
        if (!m) return;
        const spb = 60 / (m.bpm * TEMPO), sixteenth = spb / 4, bar = Math.floor(s / 16), k = s % 16;
        const deg = m.prog[bar % m.prog.length];
        const chord = chordNotes(m, deg);
        if (k === 0) { // sustained pad, one chord per bar
            const dur = sixteenth * 16 * 1.02;
            chord.slice(0, 3).forEach((n, i) => {
                voice(midi(n + 12), t, dur, m.pad.wave, m.pad.vol / 2, { lpf: m.pad.lpf, attack: .5, detune: (m.pad.detune || 6) * (i - 1) });
                voice(midi(n + 12), t, dur, m.pad.wave, m.pad.vol / 2, { lpf: m.pad.lpf, attack: .5, detune: -(m.pad.detune || 6) * (i - 1) });
            });
        }
        if (m.arp && m.arp.p[k] != null) {
            const n = chord[m.arp.p[k] % chord.length] + (m.arp.oct || 12) - 12;
            voice(midi(n + 12), t, sixteenth * 2.4, m.arp.wave, m.arp.vol, { lpf: m.arp.lpf || 4000 });
        }
        if (m.bass && m.bass.p[k]) voice(midi(chord[0] - 12), t, sixteenth * 3, m.bass.wave, m.bass.vol, { lpf: m.bass.lpf || 400 });
        if (m.kick && m.kick.p[k]) kick(t, m.kick.vol);
        if (m.hat && m.hat.p[k]) noiseHit(t, .04, m.hat.vol, 'highpass', 7000);
        if (m.clap && m.clap.p[k]) noiseHit(t, .12, m.clap.vol, 'bandpass', 1800);
        if (m.alarm && k % 4 === 0) voice((k % 8 === 0) ? 880 : 659, t, spb * .35, 'square', .03, { lpf: 3000 });
    }

    function tick() {
        if (!running || !ctx) return;
        const m = MOODS[mood];
        while (nextTime < ctx.currentTime + .35) {
            playStep(step, nextTime);
            nextTime += 60 / (m.bpm * TEMPO) / 4;
            step++;
        }
    }

    function startWind(m) {
        stopWind();
        if (!m.wind) return;
        const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
        const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 600; f.Q.value = .8;
        const lfo = ctx.createOscillator(), lg = ctx.createGain();
        lfo.frequency.value = .15; lg.gain.value = 350; lfo.connect(lg); lg.connect(f.frequency);
        const g = ctx.createGain(); g.gain.value = m.wind;
        s.connect(f); f.connect(g); g.connect(bus);
        s.start(); lfo.start();
        windNode = { s, lfo };
    }
    function stopWind() { if (windNode) { try { windNode.s.stop(); windNode.lfo.stop(); } catch (e) { /* ignore */ } windNode = null; } }

    function launch() {
        if (!ensure() || !wanted) return;
        if (ctx.state === 'suspended') ctx.resume();
        const old = bus;
        if (old) { old.gain.setTargetAtTime(0, ctx.currentTime, .12); setTimeout(() => { try { old.disconnect(); } catch (e) { /* ignore */ } }, 1200); stopWind(); }
        mood = wanted;
        const m = MOODS[mood];
        bus = ctx.createGain();
        bus.gain.setValueAtTime(0, ctx.currentTime);
        bus.gain.linearRampToValueAtTime(m.level, ctx.currentTime + .8);
        bus.connect(master);
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setTargetAtTime(targetGain(), ctx.currentTime, .2);
        step = 0; nextTime = ctx.currentTime + .12;
        startWind(m);
        if (!running) { running = true; timer = setInterval(tick, 60); }
    }

    OZ.Music = {
        setVolume(v) { BASE = 0.8 * v; if (ctx && master) master.gain.setTargetAtTime(targetGain(), ctx.currentTime, .1); },
        moodForDay: d => DAY_MOODS[Math.max(1, Math.min(7, d))] || 'calm',

        /** Choose the mood. Safe to call any time; sound begins after the first user tap. */
        setMood(name) {
            if (!MOODS[name]) return;
            wanted = name;
            if (!enabled()) return;
            if (name === mood && running) return;
            if (!ctx) return;      // waits for unlock()
            launch();
        },

        /** Must be called from a user gesture (tap / click) to unlock audio. */
        unlock() {
            if (!ensure()) return;
            if (ctx.state === 'suspended') ctx.resume();
            if (enabled() && wanted && (!running || mood !== wanted)) launch();
        },

        /** Called when the sound button is toggled. */
        refresh() {
            if (!ctx) { if (enabled()) this.unlock(); return; }
            if (!enabled()) { master.gain.setTargetAtTime(0, ctx.currentTime, .1); return; }
            if (ctx.state === 'suspended') ctx.resume();
            if (wanted && (!running || mood !== wanted)) launch();
            else master.gain.setTargetAtTime(targetGain(), ctx.currentTime, .2);
        },

        /** Lower the music while ROBO-7 is speaking. */
        duck(on) {
            duckAmt = on ? .3 : 1;
            if (ctx && master) master.gain.setTargetAtTime(targetGain(), ctx.currentTime, .12);
        },

        /** Short one-shot stings that sit on top of the music. */
        sting(name) {
            if (!enabled() || !ensure()) return;
            if (ctx.state === 'suspended') ctx.resume();
            const t = ctx.currentTime + .02;
            const b = bus || master;
            const prev = bus; if (!bus) bus = master;
            if (name === 'wrong') {
                [[392, 0], [330, .14], [262, .28]].forEach(([f, d]) => voice(f, t + d, .22, 'square', .09, { lpf: 1800 }));
                kick(t, .6);
            }
            bus = prev;
            void b;
        },
        mood: () => mood
    };

    document.addEventListener('visibilitychange', () => {
        if (!ctx) return;
        if (document.hidden) ctx.suspend(); else if (enabled()) ctx.resume();
    });
    // First tap anywhere unlocks audio (browsers block autoplay).
    const unlockOnce = () => { OZ.Music.unlock(); };
    ['pointerdown', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, unlockOnce, { passive: true }));
})(window);
