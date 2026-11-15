/**
 * Outpost Zero — Extras: NASA facts, daily quiz, ranks, mission patch, personal best.
 */
(function (global) {
    'use strict';
    const OZ = global.OZ;
    const $ = id => document.getElementById(id);

    const FACTS = [
        'The Sun is about 150 million km (93 million miles) away — its light takes roughly 8 minutes to reach us.',
        'Solar flares are ranked C, M and X. Each letter is about 10 times stronger than the one before it.',
        'NASA’s Veggie garden on the International Space Station has grown lettuce, radishes and even flowers.',
        'On the ISS, a machine splits water into hydrogen and oxygen so astronauts can breathe.',
        'NASA’s DONKI database tracks solar flares and space weather around the clock. You used it in this game!',
        'NASA tests water and polyethylene plastic as radiation shielding for crew quarters.',
        'With today’s rockets, a trip to Mars takes about 6 to 9 months each way.'
    ];

    // First answer is always the correct one; options are shuffled when shown.
    const QUIZ = [
        { q: 'What do solar flares release?', a: ['Bursts of radiation and energy', 'Moon dust', 'Fresh water'], why: 'Flares blast out radiation — that is why astronauts need shielding.' },
        { q: 'Which solar flare class is the strongest?', a: ['X-class', 'C-class', 'M-class'], why: 'X is the strongest. C is weakest, M is in the middle.' },
        { q: 'Why does NASA grow plants in space?', a: ['To learn how to feed crews on long missions', 'To make it rain inside the station', 'To build rockets from leaves'], why: 'Fresh food will be essential for long trips to the Moon and Mars.' },
        { q: 'How does the ISS make oxygen?', a: ['By splitting water with electricity', 'By burning rocks', 'By bringing air from the Moon'], why: 'Electrolysis splits water (H₂O) into hydrogen and oxygen.' },
        { q: 'Why does NASA watch the Sun’s weather?', a: ['To keep astronauts safe from radiation', 'To choose the astronauts’ snacks', 'To name new stars'], why: 'Forecasts help plan spacewalks and shelter crews before storms.' },
        { q: 'Which materials help block space radiation?', a: ['Water and polyethylene plastic', 'Thin paper', 'Cotton wool'], why: 'Hydrogen-rich materials like water and polyethylene absorb radiation well.' },
        { q: 'About how long does a trip to Mars take with today’s rockets?', a: ['About 7 months', 'About 7 minutes', 'About 7 years'], why: 'Roughly 6–9 months each way, depending on the planets’ positions.' }
    ];

    const RANKS = [
        { min: 2000, name: 'Mission Commander', color: '#ffd166' },
        { min: 1700, name: 'Mission Specialist', color: '#69e7c4' },
        { min: 1400, name: 'Flight Engineer', color: '#5ed6ff' },
        { min: 1100, name: 'Space Pilot', color: '#b79bff' },
        { min: 0,    name: 'Space Cadet', color: '#c8d4e6' }
    ];

    const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    OZ.Extras = {
        ensure() {
            const s = OZ.State;
            if (!Array.isArray(s.stars)) s.stars = [];
            if (!s.quizDone) s.quizDone = {};
            if (!s.quizRight) s.quizRight = 0;
        },
        reset() { OZ.State.stars = []; OZ.State.quizDone = {}; OZ.State.quizRight = 0; },

        rankFor(score) { return RANKS.find(r => score >= r.min) || RANKS[RANKS.length - 1]; },
        totalStars() { this.ensure(); return OZ.State.stars.reduce((a, b) => a + (b || 0), 0); },

        /** Called once per day after the animation. */
        onDayAnimation(snap, res) {
            this.ensure();
            const s = OZ.State, G = OZ.Game;
            s.stars[snap.day - 1] = res.stars;
            if (res.repaired) { s.score += 25; G.unlockAchievement('fixit'); }
            if (snap.day === 2) G.unlockAchievement('storm_survivor');
            if (s.stars.filter(x => x === 3).length >= 3) G.unlockAchievement('star_collector');
            OZ.Storage.save();
        },

        /** HTML for the NASA fact + quiz, shown in the end-of-day debrief. */
        debriefExtras(day) {
            this.ensure();
            const i = Math.max(0, Math.min(6, day - 1));
            const ur = OZ.isUrdu();
            const U = OZ.UR.ui;
            const quiz = ur ? OZ.UR.quiz[i] : QUIZ[i];
            const fact = ur ? OZ.UR.facts[i] : FACTS[i];
            const opts = shuffle(quiz.a.map((t, k) => ({ t, ok: k === 0 })));
            const stars = OZ.State.stars[day - 1] || 0;
            return `
                <div class="oz-stars-row">${OZ.L('Day rating', U.dayRating)}: ${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
                <div class="oz-fact">🛰️ <b>${OZ.L('NASA fact', U.nasaFact)}:</b> ${esc(fact)}</div>
                <div class="oz-quiz" data-day="${day}">
                    <p class="oz-q">🧠 ${OZ.L('Bonus quiz', U.bonusQuiz)} <span>${OZ.L('(+25 points)', U.pts)}</span><br><b>${esc(quiz.q)}</b></p>
                    <div class="oz-opts">${opts.map(o => `<button type="button" class="oz-opt" data-ok="${o.ok ? 1 : 0}">${esc(o.t)}</button>`).join('')}</div>
                    <p class="oz-exp" hidden>${esc(quiz.why)}</p>
                </div>`;
        },

        bindQuiz(container) {
            container.onclick = e => {
                const btn = e.target.closest('.oz-opt');
                if (!btn) return;
                const box = btn.closest('.oz-quiz');
                const day = +box.dataset.day;
                this.ensure();
                if (OZ.State.quizDone[day]) return;
                OZ.State.quizDone[day] = true;
                const ok = btn.dataset.ok === '1';
                box.querySelectorAll('.oz-opt').forEach(b => {
                    b.disabled = true;
                    if (b.dataset.ok === '1') b.classList.add('right');
                });
                if (!ok) btn.classList.add('wrong');
                const exp = box.querySelector('.oz-exp');
                exp.hidden = false;
                exp.textContent = (ok ? OZ.L('✅ Correct! +25 points. ', OZ.UR.ui.right) : OZ.L('❌ Not quite. ', OZ.UR.ui.wrong)) + exp.textContent;
                if (ok) {
                    OZ.State.score += 25;
                    OZ.State.quizRight++;
                    OZ.Audio.play('success');
                    if (OZ.State.quizRight >= 4) OZ.Game.unlockAchievement('quiz_whiz');
                    if (OZ.App && OZ.App.render) OZ.App.render();
                } else OZ.Audio.play('fail');
                OZ.Storage.save();
            };
        },

        bestScore(score) {
            const key = 'outpostZeroBest';
            let best = 0;
            try { best = +localStorage.getItem(key) || 0; } catch (e) { /* ignore */ }
            const isNew = score > best;
            if (isNew) { try { localStorage.setItem(key, String(score)); } catch (e) { /* ignore */ } }
            return { best: Math.max(best, score), isNew };
        },

        /** Fills the rank line and draws a shareable mission patch. */
        showPatch(success) {
            const s = OZ.State;
            const rank = this.rankFor(s.score);
            const { best, isNew } = this.bestScore(s.score);
            const wrap = $('patchWrap'); if (!wrap) return;
            wrap.hidden = false;
            const U = OZ.UR.ui;
            $('rankText').innerHTML = `<b style="color:${rank.color}">${OZ.L(rank.name, OZ.UR.ranks[rank.name])}</b> · ⭐ ${this.totalStars()}/21 ${OZ.L('stars', U.stars)} · ${isNew ? OZ.L('🎉 New personal best!', U.newBest) : OZ.L('Personal best: ', U.best + ': ') + best}`;
            $('patchBtn').textContent = OZ.L('⬇️ Save Mission Patch', U.savePatch);
            this.drawPatch($('patchCanvas'), rank, success);
            $('patchBtn').onclick = () => {
                $('patchCanvas').toBlob(blob => {
                    if (!blob) return;
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = `outpost-zero-patch-${(s.cadetName || 'cadet').replace(/\W+/g, '-')}.png`;
                    document.body.appendChild(a); a.click(); a.remove();
                    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
                });
            };
        },

        drawPatch(cv, rank, success) {
            const s = OZ.State, ctx = cv.getContext('2d'), W = cv.width, cx = W / 2, cy = W / 2, R = W / 2 - 8;
            const mars = s.site === 'mars';
            ctx.clearRect(0, 0, W, W);
            // body
            let g = ctx.createRadialGradient(cx, cy * .8, 20, cx, cy, R);
            g.addColorStop(0, mars ? '#4a1f1c' : '#14305e'); g.addColorStop(1, '#050c1c');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
            // stars
            ctx.fillStyle = 'rgba(255,255,255,.8)';
            for (let i = 0; i < 40; i++) { const a = Math.random() * 7, d = Math.random() * (R - 30); ctx.fillRect(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 1.6, 1.6); }
            // planet surface
            ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R - 6, 0, 7); ctx.clip();
            g = ctx.createLinearGradient(0, cy + 40, 0, W);
            g.addColorStop(0, mars ? '#b4532a' : '#8b93a8'); g.addColorStop(1, mars ? '#5c2a18' : '#3a4157');
            ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy + R * .95, R * 1.1, R * .62, 0, 0, 7); ctx.fill(); ctx.restore();
            // dome
            ctx.fillStyle = 'rgba(160,220,255,.4)'; ctx.strokeStyle = 'rgba(200,235,255,.9)'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(cx, cy + 58, 50, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#2b3248'; ctx.fillRect(cx - 9, cy + 36, 18, 22);
            // sun
            g = ctx.createRadialGradient(cx, cy - 40, 4, cx, cy - 40, 34);
            g.addColorStop(0, '#fff6b0'); g.addColorStop(1, '#ff9a3c');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy - 40, 30, 0, 7); ctx.fill();
            // ring
            ctx.lineWidth = 12; ctx.strokeStyle = rank.color; ctx.beginPath(); ctx.arc(cx, cy, R - 6, 0, 7); ctx.stroke();
            ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(cx, cy, R - 16, 0, 7); ctx.stroke();
            // arc text
            const arcText = (txt, radius, mid, bottom, font, color) => {
                ctx.font = font; ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                const chars = [...txt], step = (bottom ? -1 : 1) * (ctx.measureText('M').width * 1.05 + 3) / radius;
                let a = mid - (step * (chars.length - 1)) / 2;
                chars.forEach(ch => {
                    ctx.save(); ctx.translate(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
                    ctx.rotate(a + (bottom ? -Math.PI / 2 : Math.PI / 2)); ctx.fillText(ch, 0, 0); ctx.restore(); a += step;
                });
            };
            arcText('OUTPOST ZERO', R - 36, -Math.PI / 2, false, '800 24px Nunito, Arial', '#ffffff');
            const name = (s.cadetName || 'CADET').slice(0, 14);
            // Non-Latin names (e.g. Urdu) join letters, so they are drawn flat instead of along the arc.
            const flat = /[^\x00-\x7F]/.test(name);
            let y1 = cy + 84, y2 = cy + 102;
            if (flat) {
                arcText('COMMANDER', R - 34, Math.PI / 2, true, '800 18px Nunito, Arial', rank.color);
                ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.direction = 'rtl'; ctx.font = '700 17px "Noto Naskh Arabic", "Noto Nastaliq Urdu", Tahoma, Arial';
                ctx.fillText(name, cx, cy + 66); ctx.direction = 'ltr';
                y1 = cy + 84; y2 = cy + 100;
            } else {
                arcText(`CMDR ${name.toUpperCase()}`, R - 36, Math.PI / 2, true, '800 20px Nunito, Arial', rank.color);
            }
            ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = '800 15px Nunito, Arial';
            ctx.fillText(`${rank.name.toUpperCase()}`, cx, y1);
            ctx.font = '700 13px Nunito, Arial'; ctx.fillStyle = rank.color;
            ctx.fillText(`${mars ? 'MARS' : 'MOON'} · ${s.score} PTS · ⭐${this.totalStars()}`, cx, y2);
        }
    };
})(window);
