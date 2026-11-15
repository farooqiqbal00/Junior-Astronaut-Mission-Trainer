/**
 * Outpost Zero — Game Logic
 * Day resolution, radiation math, events, achievements.
 */
(function (global) {
    'use strict';
    const OZ = global.OZ;
    const C = OZ.CONFIG;
    const { clamp } = OZ.utils;

    OZ.Game = {
        init(site, name) {
            OZ.resetState(site, name);
            OZ.State.busy = false;
            if (OZ.Extras) OZ.Extras.reset();
            OZ.State.dayStars = 3; OZ.State.wrongTries = 0;
            OZ.Storage.save();
        },

        async loadSpaceWeather(onComplete) {
            const { source, flares } = await OZ.NASA.fetchFlares();
            OZ.State.flares = flares.slice();
            OZ.State.dataSource = source;
            let i = 0;
            while (OZ.State.flares.length < C.TOTAL_DAYS) {
                OZ.State.flares.push({ ...C.FALLBACK_FLARES[i % C.FALLBACK_FLARES.length] });
                i++;
            }
            OZ.State.flares.sort((a, b) => new Date(b.peakTime) - new Date(a.peakTime));
            OZ.Storage.save();
            if (onComplete) onComplete(source, OZ.State.flares.length);
        },

        dailyPowerPlan() {
            // Exact allocation order: Life Support, Greenhouse, Radiation Shield.
            // Each day has a different operational emergency and only one correct plan.
            const plans = [
                { life: 3, farm: 2, shield: 1, condition: 'Day 1 — Stable solar weather', detail: 'Maintain oxygen reserves, keep crops growing and use a basic shield.' },
                { life: 1, farm: 1, shield: 4, condition: 'Day 2 — Extreme X-class solar storm', detail: 'The radiation storm is severe. Most reactor power must go to shielding.' },
                { life: 2, farm: 3, shield: 1, condition: 'Day 3 — Greenhouse dust emergency', detail: 'The greenhouse needs extra power to recover the food supply.' },
                { life: 4, farm: 1, shield: 1, condition: 'Day 4 — Oxygen leak', detail: 'A damaged air recycler makes Life Support the top priority.' },
                { life: 2, farm: 2, shield: 2, condition: 'Day 5 — Moderate flare and crop stress', detail: 'Balance all three systems against a mixed emergency.' },
                { life: 1, farm: 3, shield: 2, condition: 'Day 6 — Radiation surge with low food', detail: 'Protect the crew while restoring greenhouse production.' },
                { life: 2, farm: 1, shield: 3, condition: 'Day 7 — Final storm', detail: 'The final mission requires a strong shield and careful life-support planning.' }
            ];
            const i = Math.max(0, Math.min(plans.length - 1, OZ.State.day - 1));
            const plan = plans[i];
            if (OZ.isUrdu && OZ.isUrdu() && OZ.UR) return { ...plan, ...OZ.UR.plans[i] };
            return plan;
        },

        currentFlare() {
            const s = OZ.State;
            if (!s.flares.length) return { classType: 'C1.0', peakTime: new Date().toISOString() };
            return s.flares[(s.day - 1) % s.flares.length];
        },

        nextFlare() {
            const s = OZ.State;
            if (!s.flares.length) return null;
            if (s.day >= C.TOTAL_DAYS) return null;
            return s.flares[s.day % s.flares.length];
        },

        radiationForFlare(flare, shieldCells) {
            const prefix = (flare.classType || 'C')[0].toUpperCase();
            let base = C.RADIATION_BASE_C;
            if (prefix === 'M') base = C.RADIATION_BASE_M;
            if (prefix === 'X') base = C.RADIATION_BASE_X;
            const protection = shieldCells * C.RADIATION_PER_SHIELD;
            const raw = Math.max(0, base - protection);
            const factor = C.SITES[OZ.State.site].radiationFactor;
            return Math.round(raw * factor);
        },

        resolveDay() {
            const s = OZ.State;
            if (s.busy) return null;
            s.busy = true;
            const flare = this.currentFlare();
            const prefix = (flare.classType || 'C')[0].toUpperCase();

            const o2Before = s.oxygen;
            s.oxygen = clamp(s.oxygen + s.power.life * C.OXYGEN_PER_CELL - C.OXYGEN_DRAIN);

            const foodBefore = s.food;
            s.food = clamp(s.food + s.power.farm * C.FOOD_PER_CELL - C.FOOD_DRAIN);

            const healthBefore = s.health;
            const radDamage = this.radiationForFlare(flare, s.power.shield);
            s.health = clamp(s.health - radDamage);

            let dayScore = 100 + Math.round(s.health);
            if (prefix === 'X' && radDamage < 15) dayScore += 50;
            else if (prefix === 'M' && radDamage < 10) dayScore += 30;
            if (s.oxygen > 70 && s.food > 70 && s.health > 70) dayScore += 50;
            s.score += dayScore;

            const snap = {
                day: s.day, flareClass: flare.classType,
                oxygen: { before: Math.round(o2Before), after: Math.round(s.oxygen) },
                food: { before: Math.round(foodBefore), after: Math.round(s.food) },
                health: { before: Math.round(healthBefore), after: Math.round(s.health) },
                radiation: radDamage, score: dayScore,
                power: { ...s.power },
                survived: s.oxygen > 0 && s.food > 0 && s.health > 0
            };
            s.dayStats.push(snap);
            if (s.day === 1) this.unlockAchievement('first_light');
            s.busy = false;
            if (!snap.survived) return { dead: true, snap };
            const event = this.pickEvent();
            return { snap, event };
        },

        pickEvent() {
            const s = OZ.State;
            for (const ev of OZ.EVENTS) {
                if (s.eventsSeen.indexOf(ev.id) !== -1) continue;
                if (ev.trigger(s)) {
                    s.eventsSeen.push(ev.id);
                    return ev;
                }
            }
            return null;
        },

        applyChoice(choice) {
            const s = OZ.State;
            const e = choice.effect || {};
            s.oxygen = clamp(s.oxygen + (e.oxygen || 0));
            s.food = clamp(s.food + (e.food || 0));
            s.health = clamp(s.health + (e.health || 0));
            if (e.score) s.score += e.score;
        },

        advanceDay() {
            const s = OZ.State;
            s.day++;
            // Every new day starts with an empty power board: the commander must plan again.
            s.power = { life: 0, shield: 0, farm: 0 };
            s.dayStars = 3; s.wrongTries = 0;
            if (s.day > C.TOTAL_DAYS) {
                s.day = C.TOTAL_DAYS;
                this.endMission(true);
                return true;
            }
            OZ.Storage.save();
            return false;
        },

        unlockAchievement(id) {
            const s = OZ.State;
            if (s.achievements.indexOf(id) !== -1) return;
            s.achievements.push(id);
            const a = OZ.achText ? OZ.achText(id) : C.ACHIEVEMENTS[id];
            if (a && OZ.App && OZ.App.toast) OZ.App.toast(a.icon, a.title, a.desc);
            OZ.Audio.play('success');
            OZ.Storage.save();
        },

        checkFinalAchievements() {
            const s = OZ.State;
            if (s.health > 70) this.unlockAchievement('shield_master');
            if (s.food > 70) this.unlockAchievement('green_thumb');
            if (s.oxygen > 70) this.unlockAchievement('deep_breath');
            this.unlockAchievement('survivor');
            if (OZ.Extras) { OZ.Extras.ensure(); if (s.stars.length === C.TOTAL_DAYS && s.stars.every(x => x === 3)) this.unlockAchievement('all_stars'); }
            if (s.health > 70 && s.food > 70 && s.oxygen > 70) this.unlockAchievement('perfect');
        },

        endMission(success) {
            const s = OZ.State;
            s.won = success;
            OZ.Storage.save();
            if (success) this.checkFinalAchievements();
            if (OZ.App && OZ.App.showEndScreen) OZ.App.showEndScreen(success);
        },

        lessonFor(snap) {
            const p = snap.power;
            const rad = snap.radiation;
            if (OZ.isUrdu && OZ.isUrdu()) {
                const U = OZ.UR.lessons;
                if (p.shield >= 4 && rad < 10) return U.shieldHeavy;
                if (p.shield === 0 && rad > 15) return U.noShield;
                if (p.life === 0) return U.noLife;
                if (p.farm === 0) return U.noFarm;
                if (p.shield === 1 && snap.flareClass.startsWith('X')) return U.xRisk;
                if (p.shield >= 2 && p.farm >= 2 && p.life >= 2) return U.balanced;
                return U.general;
            }
            if (p.shield >= 4 && rad < 10) return 'You invested heavily in shielding — exactly how NASA plans spacewalks around solar forecasts.';
            if (p.shield === 0 && rad > 15) return 'No shield power meant radiation hit your crew. NASA uses water and polyethylene shielding on the ISS to absorb radiation.';
            if (p.life === 0) return 'Life support needs power. On the ISS, oxygen is recycled from water — but only if the power is on!';
            if (p.farm === 0) return 'No greenhouse power meant food dropped. NASA studies plant growth on the ISS for future Mars missions.';
            if (p.shield === 1 && snap.flareClass.startsWith('X')) return 'An X-class flare is huge. 1 shield cell is a big risk — NASA would shelter the crew.';
            if (p.shield >= 2 && p.farm >= 2 && p.life >= 2) return 'Balanced power — a smart strategy. Mission planners face this exact trade-off every day.';
            return 'Every power cell you gave up was a real trade-off — just like real mission planning.';
        }
    };
})(window);