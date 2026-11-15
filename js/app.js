/**
 * Outpost Zero — UI Controller (Updated: Tutorial Glow Fix & Lip Sync)
 */
(function (global) {
    'use strict';
    const OZ = global.OZ;
    const C = OZ.CONFIG;
    const $ = id => document.getElementById(id);

    OZ.App = {
        tutorialStep: 0,

        init() {
            this.cacheDom();
            this.bindEvents();
            this.applyLanguage(OZ.State.lang);
            this.autoFillName();
            OZ.Audio.loadVoice();
            this.updateVoiceButtons();
            this.bindSound();
            OZ.Music.setMood('menu');
            if ('speechSynthesis' in window) {
                window.speechSynthesis.onvoiceschanged = () => OZ.Audio.loadVoice();
            }
        },

        bindSound() {
            const fab = $('soundFab');
            if (!fab) return;
            const paint = () => {
                const on = OZ.State.audioEnabled;
                fab.textContent = on ? '🔊' : '🔇';
                fab.setAttribute('aria-pressed', on ? 'true' : 'false');
                fab.classList.toggle('is-off', !on);
            };
            fab.addEventListener('click', () => {
                OZ.State.audioEnabled = !OZ.State.audioEnabled;
                if (!OZ.State.audioEnabled && 'speechSynthesis' in window) window.speechSynthesis.cancel();
                paint();
                OZ.Music.refresh();
                if (OZ.State.audioEnabled) OZ.Audio.play('click');
            });
            paint();
        },

        syncMusic() {
            const inStart = document.body.classList.contains('is-start');
            OZ.Music.setMood(inStart ? 'menu' : OZ.Music.moodForDay(OZ.State.day));
        },

        cacheDom() {
            this.startScreen = $('startScreen');
            this.tutorialChoice = $('tutorialChoice');
            this.gameShell = $('gameShell');
            this.endScreen = $('endScreen');
            this.eventDialog = $('eventDialog');
            this.debriefDialog = $('debriefDialog');
            this.dataDialog = $('dataDialog');
            this.helpDialog = $('helpDialog');
            this.bubble = $('bubble');
            this.bubbleText = $('bubbleText');
            this.roboAvatar = $('roboAvatar');
            this.tipBtn = $('tipBtn');
            this.toasts = $('toasts');
            this.debriefBtn = $('debriefBtn');
            this.startDayBtn = $('startDayBtn');
        },

        bindEvents() {
            document.querySelectorAll('.lang-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    OZ.Audio.play('click');
                    this.applyLanguage(e.currentTarget.dataset.lang);
                });
            });

            $('launchBtn').addEventListener('click', () => this.onLaunch());
            $('startTutBtn').addEventListener('click', () => this.onStartTutorial());
            $('skipTutBtn').addEventListener('click', () => this.onSkipTutorial());

            document.querySelectorAll('.step').forEach(btn => {
                btn.addEventListener('click', (e) => this.onStepClick(e));
            });

            this.startDayBtn.addEventListener('click', () => this.onStartDay());
            this.debriefBtn.addEventListener('click', () => this.onDebriefContinue());

            document.querySelectorAll('.voice-choice').forEach(btn => {
                btn.addEventListener('click', () => this.selectVoice(btn.dataset.voice));
            });
            $('previewVoiceBtn').addEventListener('click', () => {
                OZ.Audio.play('click');
                const f = OZ.State.voiceType === 'female';
                this.speak(OZ.L(f
                    ? 'Hello Commander! I am ROBO-7. I am ready to guide your space mission.'
                    : 'Hello Commander! I am ROBO-7. Your space mission is ready.',
                    f ? OZ.UR.ui.previewF : OZ.UR.ui.previewM));
            });
            $('helpBtn').addEventListener('click', () => { OZ.Audio.play('click'); this.helpDialog.showModal(); });
            $('dataBtn').addEventListener('click', () => { OZ.Audio.play('click'); this.dataDialog.showModal(); });

            document.querySelectorAll('[data-close]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    OZ.Audio.play('click');
                    const dlg = e.target.closest('dialog');
                    if (dlg) dlg.close();
                });
            });

            this.tipBtn.addEventListener('click', () => this.giveTip());
            this.roboAvatar.addEventListener('click', () => this.giveTip());

            $('restartBtn').addEventListener('click', () => {
                OZ.Audio.play('click');
                OZ.Storage.clear();
                location.reload();
            });
            $('shareBtn').addEventListener('click', () => this.onShare());
        },

        selectVoice(type) {
            OZ.State.voiceType = type === 'female' ? 'female' : 'male';
            OZ.Audio.setVoice(OZ.State.voiceType);
            this.updateVoiceButtons();
            OZ.Storage.save();
            this.speak(OZ.L(OZ.State.voiceType === 'female' ? 'Female voice selected.' : 'Male voice selected.',
                OZ.State.voiceType === 'female' ? OZ.UR.ui.femaleSel : OZ.UR.ui.maleSel));
        },

        updateVoiceButtons() {
            document.querySelectorAll('.voice-choice').forEach(btn => {
                const active = btn.dataset.voice === OZ.State.voiceType;
                btn.classList.toggle('is-active', active);
                btn.setAttribute('aria-pressed', active ? 'true' : 'false');
            });
        },

        applyLanguage(lang) {
            OZ.State.lang = lang;
            document.documentElement.lang = lang;
            document.documentElement.setAttribute('data-lang', lang);
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                const val = OZ.t(key);
                if (typeof val === 'string') el.textContent = val;
            });
            document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                el.placeholder = OZ.t(el.getAttribute('data-i18n-placeholder'));
            });
            document.querySelectorAll('.lang-btn').forEach(btn => {
                btn.classList.toggle('is-active', btn.dataset.lang === lang);
            });
            if (!document.body.classList.contains('is-start')) {
                $('crewTitle').textContent = C.SITES[OZ.State.site].label;
                $('commanderLabel').textContent = OZ.L('Commander: ', OZ.UR.ui.commander) + OZ.State.cadetName;
            }
            if (this.bubbleText && !this._spoke) this.bubbleText.textContent = OZ.L("Hi Commander! I'm ROBO-7. I will help you understand space and complete your mission!", OZ.UR.roboIntro);
            OZ.Storage.save();
        },

        autoFillName() {
            const save = OZ.Storage.load();
            if (save && save.cadetName) $('cadetName').value = save.cadetName;
            if (save && save.lang) this.applyLanguage(save.lang);
            if (save && save.voiceType) { OZ.State.voiceType = save.voiceType; OZ.Audio.setVoice(save.voiceType); this.updateVoiceButtons(); }
        },

        onLaunch() {
            OZ.Audio.play('click');
            const name = $('cadetName').value.trim() || 'Cadet';
            const site = document.querySelector('input[name="site"]:checked').value;
            OZ.Game.init(site, name);
            OZ.Audio.loadVoice();
            this.startScreen.hidden = true;
            this.tutorialChoice.showModal();
            this.speak(OZ.t('welcomeCommander')(name));
        },

        onStartTutorial() {
            OZ.Audio.play('click');
            this.tutorialChoice.close();
            this.beginGame();
            this.tutorialStep = 0;
            this.showTutorialStep();
        },

        onSkipTutorial() {
            OZ.Audio.play('click');
            this.tutorialChoice.close();
            this.beginGame();
            this.speak(OZ.t('missionStarted')(C.SITES[OZ.State.site].short, OZ.State.cadetName));
        },

        beginGame() {
            const s = OZ.State;
            document.body.classList.remove('is-start');
            document.documentElement.setAttribute('data-site', s.site);
            $('crewTitle').textContent = C.SITES[s.site].label;
            $('commanderLabel').textContent = OZ.L('Commander: ', OZ.UR.ui.commander) + s.cadetName;
            $('welcomeName').textContent = s.cadetName;
            $('log').innerHTML = `<li>${OZ.t('logStart')}</li>`;
            this.render();

            OZ.Game.loadSpaceWeather((source, count) => {
                this.updateSunWatch();
                this.updateForecast();
                const status = $('creditStatus');
                if (status) status.textContent = source === 'live' ? OZ.t('creditsLive')(count) : OZ.t('creditsArchive');
                const badge = $('dataSource');
                badge.textContent = source === 'live' ? OZ.t('liveLabel') : OZ.t('archiveLabel');
                badge.className = 'badge' + (source === 'archive' ? ' archive' : '');
                this.log(source === 'live'
                    ? OZ.L(`Connected to NASA DONKI! Loaded ${count} real flares.`, OZ.UR.ui.connected(count))
                    : OZ.L('Loaded archived real solar flares from NASA.', OZ.UR.ui.archived));
                this.render();
            });
            this.syncMusic();
        },

        showTutorialStep() {
            // Remove any previous spotlight
            document.querySelectorAll('.spotlight').forEach(el => el.classList.remove('spotlight'));
            this.roboAvatar.classList.remove('pointing');
            
            const step = OZ.TUTORIAL[this.tutorialStep];
            if (!step) return;
            
            let msg = OZ.t(step.msgKey);
            if (typeof msg === 'function') msg = msg(OZ.State.cadetName);
            
            // Apply spotlight if target exists
            if (step.target) {
                const el = document.querySelector(step.target);
                if (el) {
                    el.classList.add('spotlight');
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    this.roboAvatar.classList.add('pointing');
                }
            }
            
            this.tutorialStep++;
            
            // Configure tip button
            if (this.tutorialStep >= OZ.TUTORIAL.length) {
                this.tipBtn.textContent = OZ.t('tipBtn');
                this.tipBtn.onclick = () => this.giveTip();
                // DO NOT remove spotlight here. It will be removed when speech ends.
            } else {
                this.tipBtn.textContent = OZ.L('➡️ Next Step', OZ.UR.ui.nextStep);
                this.tipBtn.onclick = () => this.advanceTutorial();
            }
            
            // Speak and handle speech end
            const isLastStep = (this.tutorialStep >= OZ.TUTORIAL.length);
            this.speak(msg, () => {
                if (isLastStep) {
                    // Remove spotlight and pointing after last step speech ends
                    document.querySelectorAll('.spotlight').forEach(el => el.classList.remove('spotlight'));
                    this.roboAvatar.classList.remove('pointing');
                }
            });
        },

        advanceTutorial() {
            OZ.Audio.play('click');
            if (this.tutorialStep < OZ.TUTORIAL.length) {
                this.showTutorialStep();
            } else {
                document.querySelectorAll('.spotlight').forEach(el => el.classList.remove('spotlight'));
                this.roboAvatar.classList.remove('pointing');
                this.giveTip();
            }
        },

        giveTip() {
            OZ.Audio.play('click');
            document.querySelectorAll('.spotlight').forEach(el => el.classList.remove('spotlight'));
            this.roboAvatar.classList.remove('pointing');
            const flare = OZ.Game.currentFlare();
            const prefix = (flare.classType || 'C')[0].toUpperCase();
            const name = OZ.State.cadetName;
            const tips = [
                prefix === 'X' ? OZ.t('tipX')(name, flare.classType) :
                prefix === 'M' ? OZ.t('tipM')(flare.classType) :
                OZ.t('tipC')(flare.classType),
                OZ.t('tipBalance'),
                OZ.t('tipData'),
                OZ.t('tipPlan')
            ];
            this.speak(tips[Math.floor(Math.random() * tips.length)]);
        },

        onStepClick(e) {
            const btn = e.currentTarget;
            const sys = btn.dataset.sys;
            const step = parseInt(btn.dataset.step, 10);
            const s = OZ.State;
            if (s.busy) return;
            OZ.Audio.play('power');
            const cur = s.power[sys];
            const others = Object.keys(s.power)
                .filter(k => k !== sys)
                .reduce((sum, k) => sum + s.power[k], 0);
            const next = cur + step;
            if (next >= 0 && next + others <= C.MAX_POWER) {
                s.power[sys] = next;
                this.render();
                OZ.Storage.save();
            } else if (step > 0) {
                this.speak(OZ.t('noPower')(s.cadetName));
            }
        },

        onStartDay() {
            OZ.Audio.play('click');
            // Ensure spotlight is removed when user clicks Start Day
            document.querySelectorAll('.spotlight').forEach(el => el.classList.remove('spotlight'));
            this.roboAvatar.classList.remove('pointing');
            
            const s = OZ.State;
            const plan = OZ.Game.dailyPowerPlan();
            const expected = { life: plan.life, farm: plan.farm, shield: plan.shield };
            const actual = { life: s.power.life, farm: s.power.farm, shield: s.power.shield };
            const used = actual.life + actual.farm + actual.shield;
            if (used !== C.MAX_POWER ||
                actual.life !== expected.life ||
                actual.farm !== expected.farm ||
                actual.shield !== expected.shield) {
                // A wrong plan costs one mission star (never below 1).
                const before = s.dayStars === undefined ? 3 : s.dayStars;
                s.dayStars = Math.max(1, before - 1);
                s.wrongTries = (s.wrongTries || 0) + 1;
                const lost = s.dayStars < before;
                const message = OZ.L(
                    `Mission plan rejected. ${plan.condition} requires exactly ${plan.life} Life Support, ${plan.farm} Greenhouse and ${plan.shield} Radiation Shield cells. Your current plan is ${actual.life}, ${actual.farm}, ${actual.shield}. Reassign the cells exactly.${lost ? ` ⭐ You lost a star! Stars left: ${s.dayStars}/3.` : ' ⭐ Only one star is left — be careful!'}`,
                    `مشن پلان مسترد۔ ${plan.condition} کے لیے بالکل ${plan.life} لائف سپورٹ، ${plan.farm} گرین ہاؤس اور ${plan.shield} ریڈی ایشن شیلڈ سیل درکار ہیں۔ آپ کا موجودہ پلان ${actual.life}، ${actual.farm}، ${actual.shield} ہے۔ سیل دوبارہ درست بانٹیں۔${lost ? ` ⭐ ایک ستارہ کم ہو گیا! باقی ستارے: ${s.dayStars}/3۔` : ' ⭐ اب صرف ایک ستارہ باقی ہے — احتیاط کریں!'}`);
                this.log(OZ.L(`⚠️ Launch blocked: incorrect allocation for ${plan.condition}.${lost ? ' −1 ⭐' : ''}`, OZ.UR.ui.blocked(plan.condition) + (lost ? ' −1 ⭐' : '')));
                OZ.Audio.play('fail');
                OZ.Music.sting('wrong');
                this.updateMissionObjective();
                if (lost) this.dropStar(s.dayStars);
                this.speak(message);
                return;
            }
            const result = OZ.Game.resolveDay();
            if (!result) return;
            this.render();
            if (result.dead) {
                setTimeout(() => OZ.Game.endMission(false), 400);
                return;
            }
            // Play this day's condition animation, then continue to the event / debrief.
            result.snap.maxStars = s.dayStars === undefined ? 3 : s.dayStars;
            result.snap.wrongTries = s.wrongTries || 0;
            const proceed = () => {
                if (result.event) this.showEventDialog(result.event, result.snap);
                else this.showDebrief(result.snap, OZ.Game.lessonFor(result.snap));
            };
            if (OZ.Cinematic) OZ.Cinematic.play(result.snap, res => {
                if (OZ.Extras) OZ.Extras.onDayAnimation(result.snap, res);
                this.render();
                proceed();
            });
            else proceed();
        },

        showEventDialog(rawEvent, snap) {
            // Urdu mode swaps the text only; the effects stay identical.
            const ur = OZ.isUrdu() && OZ.UR.events[rawEvent.id];
            const event = ur ? {
                ...rawEvent, title: ur.title, text: ur.text, hint: ur.hint,
                choices: rawEvent.choices.map((c, i) => ({ ...c, label: ur.choices[i].label, lesson: ur.choices[i].lesson }))
            } : rawEvent;
            $('eventTitle').textContent = event.title;
            $('eventText').textContent = event.text;
            $('eventHint').textContent = event.hint;
            if (ur) this.speak(event.text);
            const a = $('choiceA');
            const b = $('choiceB');
            a.textContent = event.choices[0].label;
            b.textContent = event.choices[1].label;
            const newA = a.cloneNode(true);
            const newB = b.cloneNode(true);
            a.replaceWith(newA);
            b.replaceWith(newB);
            newA.addEventListener('click', () => {
                OZ.Audio.play('click');
                OZ.Game.applyChoice(event.choices[0]);
                this.eventDialog.close();
                this.showDebrief(snap, event.choices[0].lesson);
            });
            newB.addEventListener('click', () => {
                OZ.Audio.play('click');
                OZ.Game.applyChoice(event.choices[1]);
                this.eventDialog.close();
                this.showDebrief(snap, event.choices[1].lesson);
            });
            this.eventDialog.showModal();
        },

        showDebrief(snap, lesson) {
            const U = OZ.UR.ui;
            $('debriefTitle').textContent = OZ.L(`Day ${snap.day} Complete!`, U.dayTitle(snap.day));
            $('debriefBody').innerHTML = `
                <div class="debrief-row"><span class="label">${OZ.L('☀️ Solar flare', U.flare)}</span><span class="val">${snap.flareClass}</span></div>
                <div class="debrief-row"><span class="label">${OZ.L('💨 Air', U.air)}</span><span class="val ${snap.oxygen.after >= snap.oxygen.before ? 'up' : 'down'}">${snap.oxygen.after}%</span></div>
                <div class="debrief-row"><span class="label">${OZ.L('🥗 Food', U.food)}</span><span class="val ${snap.food.after >= snap.food.before ? 'up' : 'down'}">${snap.food.after}%</span></div>
                <div class="debrief-row"><span class="label">${OZ.L('❤️ Health', U.health)}</span><span class="val ${snap.health.after >= snap.health.before ? 'up' : 'down'}">${snap.health.after}% (${snap.radiation > 0 ? OZ.L('−' + snap.radiation + '% rad', U.rad(snap.radiation)) : OZ.L('no radiation', U.noRad)})</span></div>
                <div class="debrief-row"><span class="label">${OZ.L('⭐ Day Score', U.dayScore)}</span><span class="val up">+${snap.score}</span></div>
                ${snap.wrongTries ? `<div class="debrief-row"><span class="label">${OZ.L('❌ Wrong tries', U.wrongTries)}</span><span class="val down">${snap.wrongTries}</span></div>` : ''}
            `;
            if (OZ.Extras) {
                $('debriefBody').insertAdjacentHTML('beforeend', OZ.Extras.debriefExtras(snap.day));
                OZ.Extras.bindQuiz($('debriefBody'));
            }
            $('debriefLesson').textContent = lesson;
            this.debriefDialog.showModal();
            this.render();
        },

        onDebriefContinue() {
            OZ.Audio.play('click');
            this.debriefDialog.close();
            const s = OZ.State;
            this.log(`Day ${s.day} (${OZ.Game.currentFlare().classType}): Health ${Math.round(s.health)}%, Air ${Math.round(s.oxygen)}%, Food ${Math.round(s.food)}%.`);
            const won = OZ.Game.advanceDay();
            this.render();
            if (won) return;
            this.syncMusic();
            const next = OZ.Game.currentFlare();
            const p = (next.classType || 'C')[0].toUpperCase();
            let advice;
            if (p === 'X') advice = OZ.t('nextDayX')(s.day, next.classType);
            else if (p === 'M') advice = OZ.t('nextDayM')(s.day, next.classType);
            else advice = OZ.t('nextDayC')(s.day, next.classType);
            this.speak(advice);
        },

        render() {
            const s = OZ.State;
            $('dayNum').textContent = s.day;
            $('scoreVal').textContent = s.score;
            this.renderVital('oxygen', s.oxygen);
            this.renderVital('food', s.food);
            this.renderVital('health', s.health);
            $('powerLeft').textContent = C.MAX_POWER - (s.power.life + s.power.shield + s.power.farm);
            this.updateMissionObjective();
            
            ['life', 'shield', 'farm'].forEach(key => {
                $('val-' + key).textContent = s.power[key];
                const cells = $('cells-' + key).querySelectorAll('i');
                cells.forEach((c, i) => c.classList.toggle('on', i < s.power[key]));
            });

            const pips = $('pips').querySelectorAll('.pip');
            pips.forEach((pip, i) => {
                pip.className = 'pip';
                if (i + 1 < s.day) pip.classList.add('done');
                else if (i + 1 === s.day) pip.classList.add('now');
            });
            
            // SIMULATION ANIMATIONS
            this.updateSimulationBase(s);
            
            this.updateSunWatch();
            this.updateForecast();
        },

        updateMissionObjective() {
            const plan = OZ.Game.dailyPowerPlan();
            const target = $('objectiveText');
            const heading = $('missionObjective')?.querySelector('strong');
            if (heading) heading.textContent = `🎯 ${OZ.isUrdu() ? plan.condition : plan.condition.toUpperCase()}`;
            if (target) target.textContent = OZ.L(
                `${plan.detail} EXACT CELLS — Life Support: ${plan.life} · Greenhouse: ${plan.farm} · Shield: ${plan.shield} (6/6 cells)`,
                `${plan.detail} درست سیل — لائف سپورٹ: ${plan.life} · گرین ہاؤس: ${plan.farm} · شیلڈ: ${plan.shield} (6/6 سیل)`);
            // Mission stars: they drop when a plan is wrong.
            const box = $('missionObjective');
            if (box) {
                let row = $('objStars');
                if (!row) { row = document.createElement('div'); row.id = 'objStars'; row.className = 'obj-stars'; box.appendChild(row); }
                const n = OZ.State.dayStars === undefined ? 3 : OZ.State.dayStars;
                row.innerHTML = `<span class="obj-stars-label">${OZ.L('Mission stars', OZ.UR.ui.mission)}</span>` +
                    [0, 1, 2].map(i => `<span class="st ${i < n ? 'on' : 'lost'}" data-i="${i}">⭐</span>`).join('') +
                    `<span class="obj-stars-hint">${OZ.L('A wrong plan costs a star', 'غلط پلان پر ایک ستارہ کم ہوتا ہے')}</span>`;
            }
        },

        dropStar(index) {
            const box = $('missionObjective'), row = $('objStars');
            if (!box || !row) return;
            const st = row.querySelector(`.st[data-i="${index}"]`);
            if (st) { st.classList.add('drop'); }
            box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
            const pop = document.createElement('span');
            pop.className = 'obj-minus'; pop.textContent = '−1 ⭐';
            box.appendChild(pop);
            setTimeout(() => pop.remove(), 1300);
            setTimeout(() => box.classList.remove('shake'), 700);
            box.scrollIntoView({ behavior: 'smooth', block: 'center' });
        },

        updateSimulationBase(s) {
            const base = document.getElementById('sim-base');
            if (!base) return;
            
            // Shield status
            const shieldLevel = s.power.shield;
            base.style.setProperty('--shield-opacity', 0.1 + (shieldLevel / 6) * 0.9);
            base.style.setProperty('--shield-scale', 1 + (shieldLevel * 0.06));
            
            // Life support (Air) status
            const airParticles = document.getElementById('air-particles');
            if (airParticles) {
                airParticles.style.animationPlayState = s.power.life > 0 ? 'running' : 'paused';
                airParticles.style.opacity = 0.1 + (s.power.life / 6) * 0.9;
            }

            // Greenhouse status
            const plants = document.getElementById('sim-plants');
            if (plants) {
                plants.style.opacity = 0.2 + (s.power.farm / 6) * 0.8;
                plants.style.transform = `scaleY(${0.5 + (s.power.farm / 6) * 0.5})`;
            }
        },

        renderVital(name, val) {
            const id = name === 'oxygen' ? 'oxygen' : name;
            $(id + 'Val').textContent = Math.round(val) + '%';
            const bar = $(id + 'Bar');
            bar.style.width = Math.max(0, Math.min(100, val)) + '%';
            bar.className = 'fill ' + name + (val < 30 ? ' low' : '');
        },

        updateSunWatch() {
            const flare = OZ.Game.currentFlare();
            $('flareClass').textContent = flare.classType;
            const p = (flare.classType || 'C')[0].toUpperCase();
            let risk = OZ.L('Low Danger (Safe)', OZ.UR.ui.lowRisk), cls = 'low', gauge = 1;
            if (p === 'M') { risk = OZ.L('Medium Flare Warning', OZ.UR.ui.midRisk); cls = 'mid'; gauge = 2; }
            else if (p === 'X') { risk = OZ.L('HIGH RADIATION STORM!', OZ.UR.ui.highRisk); cls = 'high'; gauge = 3; }
            $('flareRisk').textContent = risk;
            $('flareRisk').className = 'flare-risk ' + cls;
            const d = new Date(flare.peakTime);
            if (!isNaN(d.getTime())) {
                const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                $('flareTime').textContent = OZ.L(`NASA Peak: ${time} UTC`, OZ.UR.ui.peak(time));
            }
            document.querySelectorAll('.gauge .seg').forEach((seg, i) => {
                seg.classList.toggle('on', i < gauge);
            });

            // Sun Animation Speed based on Flare
            const sunCore = document.querySelector('.sun-core');
            if (sunCore) {
                sunCore.style.animationDuration = p === 'X' ? '0.5s' : (p === 'M' ? '1.5s' : '4s');
            }
        },

        updateForecast() {
            const next = OZ.Game.nextFlare();
            if (!next) {
                $('forecastValue').textContent = OZ.L('Final Day!', OZ.UR.ui.finalDay);
                $('forecastTip').textContent = OZ.L('Give it everything!', OZ.UR.ui.giveAll);
                return;
            }
            const p = (next.classType || 'C')[0].toUpperCase();
            const U = OZ.UR.ui;
            let emoji = '☀️', tip = OZ.L('Calm — good day to grow food or refill air.', U.calmTip);
            if (p === 'M') { emoji = '⚠️'; tip = OZ.L('Medium flare tomorrow — save 2–3 cells for shield!', U.midTip); }
            else if (p === 'X') { emoji = '🚨'; tip = OZ.L('DANGER! X-class flare tomorrow — protect your crew!', U.highTip); }
            $('forecastValue').textContent = `${emoji} ${next.classType}`;
            $('forecastTip').textContent = tip;
        },

        showEndScreen(success) {
            this.endScreen.hidden = false;
            const s = OZ.State;
            if (success) {
                $('endIcon').textContent = '🏆🤖';
                $('endTitle').textContent = OZ.t('endWinTitle')(s.cadetName);
                $('endText').textContent = OZ.t('endWinBody')(C.SITES[s.site].short);
                this.speak(OZ.t('endWinSpeak')(s.cadetName));
                OZ.Audio.play('success');
                this.launchConfetti();
            } else {
                $('endIcon').textContent = '🛠️🤖';
                $('endTitle').textContent = OZ.t('endLoseTitle')(s.cadetName);
                $('endText').textContent = OZ.t('endLoseBody')(s.day);
                this.speak(OZ.t('endLoseSpeak')(s.cadetName));
                OZ.Audio.play('fail');
            }
            $('endStats').innerHTML = `
                <div><dt>${OZ.t('statScore')}</dt><dd>${s.score}</dd></div>
                <div><dt>${OZ.t('statHealth')}</dt><dd>${Math.round(s.health)}%</dd></div>
                <div><dt>${OZ.t('statDays')}</dt><dd>${Math.min(s.day, C.TOTAL_DAYS)}/${C.TOTAL_DAYS}</dd></div>
            `;
            $('badges').innerHTML = s.achievements.map(id => {
                const a = OZ.achText(id);
                return a ? `<li>${a.icon} ${a.title}</li>` : '';
            }).join('');
            const learnedList = [
                '<strong>No Free Choices:</strong> With only 6 power cells, boosting Radiation Shields means less power for Air or Food.',
                '<strong>Real NASA Space Weather:</strong> You used real NASA DONKI solar flare rankings (C, M, X) to protect your crew.',
                '<strong>Planning Matters:</strong> Tomorrow\'s forecast showed the next flare — just like NASA plans spacewalks around solar weather.'
            ];
            $('learnedList').innerHTML = (OZ.isUrdu() ? OZ.UR.ui.learn : learnedList).map(l => `<li>${l}</li>`).join('');
            OZ.Music.setMood(success ? 'victory' : 'defeat');
            this.drawChart();
            if (OZ.Extras) OZ.Extras.showPatch(success);
        },

        drawChart() {
            const canvas = $('chart');
            if (!canvas) return;
            const stats = OZ.State.dayStats;
            if (!stats.length) return;
            const dpr = window.devicePixelRatio || 1;
            const cssW = canvas.parentElement.clientWidth - 40;
            const cssH = 180;
            canvas.width = cssW * dpr;
            canvas.height = cssH * dpr;
            canvas.style.width = cssW + 'px';
            canvas.style.height = cssH + 'px';
            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);
            ctx.clearRect(0, 0, cssW, cssH);
            const pad = 30;
            const W = cssW - pad * 2;
            const H = cssH - pad * 2;
            const stepX = stats.length > 1 ? W / (stats.length - 1) : W;
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 4; i++) {
                const y = pad + (H / 4) * i;
                ctx.beginPath();
                ctx.moveTo(pad, y);
                ctx.lineTo(pad + W, y);
                ctx.stroke();
            }
            const lines = {
                oxygen: { data: stats.map(x => x.oxygen.after), color: '#5ed6ff' },
                food:   { data: stats.map(x => x.food.after),   color: '#69e7c4' },
                health: { data: stats.map(x => x.health.after), color: '#ff8797' }
            };
            Object.keys(lines).forEach(k => {
                const ln = lines[k];
                ctx.strokeStyle = ln.color;
                ctx.lineWidth = 3;
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
                ctx.beginPath();
                ln.data.forEach((v, i) => {
                    const x = pad + stepX * i;
                    const y = pad + H - (H * Math.max(0, Math.min(100, v)) / 100);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                });
                ctx.stroke();
                ln.data.forEach((v, i) => {
                    const x = pad + stepX * i;
                    const y = pad + H - (H * Math.max(0, Math.min(100, v)) / 100);
                    ctx.fillStyle = ln.color;
                    ctx.beginPath();
                    ctx.arc(x, y, 3, 0, Math.PI * 2);
                    ctx.fill();
                });
            });
        },

        launchConfetti() {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            const wrap = document.createElement('div');
            wrap.className = 'win';
            document.body.appendChild(wrap);
            const colors = ['#5ed6ff', '#ffd166', '#69e7c4', '#ff8797', '#a69bff'];
            for (let i = 0; i < 60; i++) {
                const c = document.createElement('div');
                c.className = 'confetti';
                c.style.left = Math.random() * 100 + 'vw';
                c.style.top = '-20px';
                c.style.background = colors[i % colors.length];
                c.style.animationDelay = Math.random() * 0.8 + 's';
                c.style.animationDuration = (2 + Math.random() * 1.5) + 's';
                wrap.appendChild(c);
            }
            setTimeout(() => wrap.remove(), 5000);
        },

        speak(msg, onEndCallback) {
            this._spoke = true;
            this.bubbleText.textContent = msg;
            const b = this.bubble;
            b.style.animation = 'none';
            b.offsetHeight;
            b.style.animation = 'popIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
            
            OZ.Audio.speak(msg, {
                onStart: () => {
                    this.roboAvatar.classList.add('talking');
                    OZ.Music.duck(true);
                },
                onEnd: () => {
                    this.roboAvatar.classList.remove('talking');
                    OZ.Music.duck(false);
                    if (onEndCallback) onEndCallback();
                }
            });
        },

        log(msg) {
            const li = document.createElement('li');
            li.textContent = msg;
            const log = $('log');
            log.insertBefore(li, log.firstChild);
            while (log.children.length > 15) log.removeChild(log.lastChild);
        },

        toast(icon, title, desc) {
            const el = document.createElement('div');
            el.className = 'toast';
            el.innerHTML = `<span class="toast-icon">${icon}</span><div><strong>${title}</strong><small>${desc}</small></div>`;
            this.toasts.appendChild(el);
            setTimeout(() => {
                el.classList.add('fade');
                setTimeout(() => el.remove(), 400);
            }, 4200);
        },


        onShare() {
            const s = OZ.State;
            const text = `🚀 Outpost Zero — ${s.cadetName} | ${C.SITES[s.site].short} | Score: ${s.score} | Air ${Math.round(s.oxygen)}% · Food ${Math.round(s.food)}% · Health ${Math.round(s.health)}% | ${Math.min(s.day, C.TOTAL_DAYS)}/7`;
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(() => {
                    const btn = $('shareBtn');
                    const original = btn.textContent;
                    btn.textContent = '✅ Copied!';
                    setTimeout(() => { btn.textContent = original; }, 2000);
                }).catch(() => alert(text));
            } else {
                alert(text);
            }
        }
    };

    document.addEventListener('DOMContentLoaded', () => OZ.App.init());
})(window);
