/**
 * Outpost Zero — Core Engine (Updated for Boy Voice & Speech Sync)
 */
(function (global) {
    'use strict';
    const OZ = global.OZ = global.OZ || {};

    function defaults() {
        return {
            cadetName: 'Cadet', site: 'moon', lang: 'en',
            day: 1, oxygen: 100, food: 100, health: 100, score: 0,
            power: { life: 0, shield: 0, farm: 0 },
            flares: [], dataSource: 'archive', dayStats: [],
            eventsSeen: [], achievements: [], won: false,
            busy: false, audioEnabled: true, voice: null, voiceType: 'male', voices: { male: null, female: null }
        };
    }

    OZ.State = defaults();

    OZ.resetState = function (site, name) {
        const fresh = defaults();
        fresh.site = site || 'moon';
        fresh.cadetName = name || 'Cadet';
        fresh.lang = OZ.State ? OZ.State.lang : 'en';
        fresh.voiceType = OZ.State ? OZ.State.voiceType : 'male';
        fresh.audioEnabled = OZ.State ? OZ.State.audioEnabled : true;
        Object.assign(OZ.State, fresh);
    };

    OZ.utils = {
        clamp: (v, min = 0, max = 100) => Math.max(min, Math.min(max, v)),
        $: id => document.getElementById(id)
    };

    OZ.Storage = {
        save() {
            try {
                const s = OZ.State;
                localStorage.setItem(OZ.CONFIG.SAVE_KEY, JSON.stringify({
                    cadetName: s.cadetName, site: s.site, lang: s.lang, voiceType: s.voiceType,
                    day: s.day, oxygen: s.oxygen, food: s.food, health: s.health,
                    score: s.score, power: s.power, achievements: s.achievements,
                    eventsSeen: s.eventsSeen, dayStats: s.dayStats, won: s.won
                }));
            } catch (e) { /* ignore */ }
        },
        load() {
            try {
                const raw = localStorage.getItem(OZ.CONFIG.SAVE_KEY);
                return raw ? JSON.parse(raw) : null;
            } catch (e) { return null; }
        },
        clear() {
            try { localStorage.removeItem(OZ.CONFIG.SAVE_KEY); } catch (e) { /* ignore */ }
        }
    };

    let _ctx = null;
    function ensureAudio() {
        if (_ctx) return;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) _ctx = new AC();
    }

    OZ.Audio = {
        play(type) {
            if (!OZ.State.audioEnabled) return;
            ensureAudio();
            if (!_ctx) return;
            if (_ctx.state === 'suspended') _ctx.resume();

            const osc = _ctx.createOscillator();
            const gain = _ctx.createGain();
            osc.connect(gain);
            gain.connect(_ctx.destination);
            const t = _ctx.currentTime;

            const presets = {
                click:   { type: 'sine',     freq: [[520, 0], [320, 0.05]], vol: 0.08, dur: 0.05 },
                power:   { type: 'triangle', freq: [[380, 0], [750, 0.08]], vol: 0.10, dur: 0.08 },
                success: { type: 'sine',     freq: [[523.25, 0], [659.25, 0.07], [783.99, 0.14]], vol: 0.10, dur: 0.25 },
                fail:    { type: 'sawtooth', freq: [[220, 0], [110, 0.3]],   vol: 0.09, dur: 0.3 }
            };
            const p = presets[type] || presets.click;

            osc.type = p.type;
            p.freq.forEach(([f, t0]) => osc.frequency.setValueAtTime(f, t + t0));
            gain.gain.setValueAtTime(p.vol, t);
            gain.gain.linearRampToValueAtTime(0.01, t + p.dur);
            osc.start(t);
            osc.stop(t + p.dur);
        },

        loadVoice() {
            if (!('speechSynthesis' in window)) return;
            const voices = window.speechSynthesis.getVoices();
            if (!voices.length) return;
            const english = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('en'));
            const all = english.length ? english : voices;
            const femaleHints = /female|woman|samantha|victoria|karen|moira|tessa|zira|susan|google us english/i;
            const maleHints = /male|man|daniel|alex|david|mark|james|george|fred|guy|aaron/i;
            const female = all.find(v => femaleHints.test(v.name)) || all.find(v => /en-gb|en-us/i.test(v.lang)) || all[0];
            const male = all.find(v => maleHints.test(v.name) && !/female/i.test(v.name)) || all.find(v => v !== female) || all[0];
            OZ.State.voices = { male, female };
            OZ.State.voice = OZ.State.voices[OZ.State.voiceType] || male || female || null;
        },

        setVoice(type) {
            OZ.State.voiceType = type === 'female' ? 'female' : 'male';
            this.loadVoice();
            OZ.State.voice = OZ.State.voices[OZ.State.voiceType] || OZ.State.voice;
        },

        speak(text, options = {}) {
            if (!OZ.State.audioEnabled) {
                if (options.onEnd) options.onEnd();
                return;
            }
            if (!('speechSynthesis' in window)) {
                if (options.onEnd) options.onEnd();
                return;
            }
            window.speechSynthesis.cancel();
            const clean = String(text)
                .replace(/\*\*/g, '')
                .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}]/gu, '')
                .trim();
            if (!clean) {
                if (options.onEnd) options.onEnd();
                return;
            }
            
            const utter = new SpeechSynthesisUtterance(clean);
            if (OZ.State.lang === 'ur') {
                // Prefer an installed Urdu voice; otherwise let the browser choose one for ur-PK.
                const ur = window.speechSynthesis.getVoices().find(v => /^ur/i.test(v.lang));
                if (ur) utter.voice = ur;
            } else if (OZ.State.voice) utter.voice = OZ.State.voice;
            // Use a real installed voice where available, with pitch as a fallback distinction.
            utter.pitch = OZ.State.voiceType === 'female' ? 1.18 : 0.92;
            utter.rate = 1.0;
            utter.volume = 1.0;
            utter.lang = OZ.State.lang === 'ur' ? 'ur-PK' : 'en-US';

            utter.onstart = () => {
                if (options.onStart) options.onStart();
            };
            utter.onend = () => {
                if (options.onEnd) options.onEnd();
            };
            utter.onerror = () => {
                if (options.onEnd) options.onEnd();
            };

            window.speechSynthesis.speak(utter);
        }
    };

    OZ.NASA = {
        async fetchFlares() {
            const end = new Date().toISOString().split('T')[0];
            const startObj = new Date();
            startObj.setDate(startObj.getDate() - OZ.CONFIG.LOOKBACK_DAYS);
            const start = startObj.toISOString().split('T')[0];
            const url = `https://api.nasa.gov/DONKI/FLR?startDate=${start}&endDate=${end}&api_key=${OZ.CONFIG.NASA_API_KEY}`;
            try {
                const res = await fetch(url);
                if (!res.ok) throw new Error('offline');
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    return {
                        source: 'live',
                        flares: data.map(f => ({
                            classType: f.classType || 'C1.0',
                            peakTime: f.beginTime || f.peakTime || new Date().toISOString()
                        })).sort((a, b) => new Date(b.peakTime) - new Date(a.peakTime))
                    };
                }
                throw new Error('empty');
            } catch (e) {
                return {
                    source: 'archive',
                    flares: OZ.CONFIG.FALLBACK_FLARES.map(f => ({ ...f }))
                };
            }
        }
    };
})(window);