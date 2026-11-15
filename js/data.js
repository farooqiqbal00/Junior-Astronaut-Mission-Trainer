/**
 * Outpost Zero — Data Layer
 * Config, translations, events, tutorial. Loads first.
 */
(function (global) {
    'use strict';
    const OZ = global.OZ = global.OZ || {};

    OZ.CONFIG = Object.freeze({
        TOTAL_DAYS: 7,
        MAX_POWER: 6,
        START_STAT: 100,
        NASA_API_KEY: 'DEMO_KEY',
        LOOKBACK_DAYS: 60,
        SAVE_KEY: 'outpost-zero-v3',
        OXYGEN_DRAIN: 10, OXYGEN_PER_CELL: 5,
        FOOD_DRAIN: 8, FOOD_PER_CELL: 4,
        RADIATION_BASE_C: 1.5, RADIATION_BASE_M: 8, RADIATION_BASE_X: 20,
        RADIATION_PER_SHIELD: 8,
        FALLBACK_FLARES: [
            { classType: 'C3.2', peakTime: '2025-03-12T04:15Z' },
            { classType: 'M1.8', peakTime: '2025-03-14T11:40Z' },
            { classType: 'C8.5', peakTime: '2025-03-16T19:05Z' },
            { classType: 'X1.4', peakTime: '2025-03-18T08:22Z' },
            { classType: 'M4.1', peakTime: '2025-03-20T15:50Z' },
            { classType: 'C2.1', peakTime: '2025-03-22T02:10Z' },
            { classType: 'X2.1', peakTime: '2025-03-24T21:30Z' }
        ],
        SITES: Object.freeze({
            moon: { label: 'The Moon Outpost', short: 'the Moon', radiationFactor: 1.0 },
            mars: { label: 'Mars Outpost', short: 'Mars', radiationFactor: 0.85 }
        }),
        ACHIEVEMENTS: Object.freeze({
            first_light:   { icon: '🌅', title: 'First Light',        desc: 'Complete your first mission day' },
            shield_master: { icon: '🛡️', title: 'Shield Master',     desc: 'Finish with Crew Health above 70%' },
            green_thumb:   { icon: '🌱', title: 'Green Thumb',       desc: 'Finish with Food above 70%' },
            deep_breath:   { icon: '💨', title: 'Deep Breath',       desc: 'Finish with Air above 70%' },
            survivor:      { icon: '🏆', title: '7-Day Survivor',    desc: 'Complete all 7 days' },
            perfect:       { icon: '⭐', title: 'Perfect Commander', desc: 'Survive with all vitals above 70%' },
            storm_survivor:{ icon: '🌩️', title: 'Storm Survivor',   desc: 'Get through the Day 2 solar storm' },
            fixit:         { icon: '🔧', title: 'Fix-It Cadet',      desc: 'Win a repair mini-game' },
            star_collector:{ icon: '🌟', title: 'Star Collector',    desc: 'Earn 3 stars on three different days' },
            quiz_whiz:     { icon: '🧠', title: 'Quiz Whiz',         desc: 'Answer 4 space quiz questions correctly' },
            all_stars:     { icon: '🚀', title: 'Flawless Mission',  desc: 'Earn 3 stars on every single day' }
        })
    });

    OZ.STRINGS = Object.freeze({
        en: {
            subtitle: 'Junior Astronaut Mission Trainer',
            introTitle: 'Your space adventure starts here!',
            introBody: 'Your crew needs a safe home in space. Manage oxygen, grow food, protect astronauts from radiation and survive seven exciting days.',
            introBody2: "Don't worry! ROBO-7 will be your friendly space buddy and help you learn everything.",
            nameLabel: '🧑‍🚀 What should ROBO-7 call you?',
            namePlaceholder: 'Enter your astronaut name',
            siteLegend: '🌍 Choose your space destination',
            moonName: 'The Moon', moonNote: 'A nearby space adventure!',
            marsName: 'Mars', marsNote: 'A challenging journey!',
            launchBtn: '🚀 Prepare My Mission',
            footnote: 'No space experience needed. Your training adventure begins with ROBO-7!',
            tutWelcome: 'Welcome to Mission Training!',
            tutBody: 'Hi Commander! Before your mission begins, you can learn how the outpost works.',
            tutBody2: 'ROBO-7 will explain the controls, space radiation, oxygen, food, power cells and your daily mission.',
            tutStart: '🎓 Start Interactive Tutorial',
            tutSkip: '🚀 Skip Tutorial & Start Mission',
            tutNote: 'You can always open the handbook during the game.',
            progressLabel: 'MISSION PROGRESS', soundOn: 'Sound: ON',
            handbook: 'Handbook', nasaData: 'NASA Data',
            todayKicker: 'YOUR MISSION TODAY',
            todayBody: 'Check the Sun Watch, manage your power and prepare your outpost for the day.',
            stampText: 'DAYS TO SURVIVE',
            crewKicker: 'CREW STATUS', crewTitle: '👩‍🚀 Crew Life Support',
            crewDesc: 'Your astronauts need air, food and good health. Keep all three above zero!',
            scoreLabel: 'Score', airLabel: 'Breathable Air', foodLabel: 'Greenhouse Food', healthLabel: 'Crew Health',
            airDesc: 'Oxygen is the gas astronauts breathe. Without enough, people cannot survive.',
            foodDesc: 'The greenhouse grows food for your astronauts. Plants need power to grow.',
            healthDesc: 'Health shows how safe your astronauts are from dangerous space radiation.',
            rememberLabel: 'Remember:', rememberText: 'If any vital reaches 0%, your mission ends.',
            spaceWeatherKicker: 'SPACE WEATHER', sunWatchTitle: '☀️ Sun Watch',
            sunDesc: 'The Sun can release powerful bursts of energy. Watch out for solar flares!',
            scanning: 'Scanning the Sun...', tomorrowLabel: "🔭 TOMORROW'S FORECAST",
            radTitle: '🔬 What is Radiation?',
            radBody: 'Radiation is energy that travels through space. Some radiation from the Sun can be harmful to astronauts.',
            radBody2: 'A radiation shield helps protect your crew by reducing the amount of radiation that reaches them.',
            small: 'SMALL', medium: 'MEDIUM', strong: 'STRONG',
            powerKicker: 'POWER MANAGEMENT', powerTitle: '⚡ Reactor Power Board',
            powerDesc: 'Your reactor gives you 6 power cells. Share them between the three systems.',
            cellsLeft: 'CELLS LEFT',
            instPlus: 'Press + to give a system one more power cell.',
            instMinus: 'Press − to take one power cell away.',
            lifeTitle: 'Life Support', lifeDesc: 'Makes breathable oxygen',
            shieldTitle: 'Radiation Shield', shieldDesc: 'Protects astronauts from radiation',
            farmTitle: 'Greenhouse', farmDesc: 'Grows food for the crew',
            carefulLabel: 'Think carefully!', carefulText: 'More power for one system means less for others.',
            startDayBtn: '🚀 Start Day',
            logKicker: 'MISSION RECORD', logTitle: "📋 Captain's Log",
            logDesc: 'Important mission updates and events appear here.',
            logStart: 'Mission systems are warming up. Welcome aboard, Commander!',
            tipBtn: '💡 Smart Tip',
            eventBadge: 'OUTPOST CHALLENGE',
            learnedLabel: 'What you learned:',
            continueBtn: 'Continue to Next Day →',
            dataBody: "Sun Watch uses NASA's DONKI solar-flare information when the live service is available.",
            statScore: 'Final Score', statHealth: 'Crew Health', statDays: 'Days Survived',
            learnedTitle: '🎓 What You Learned',
            shareBtn: '📋 Copy Score', restartBtn: '🔄 Play Again',
            tutMsg1: (n) => `Hi ${n}! I am ROBO-7. Let me show you around our space outpost. Click Next Step below!`,
            tutMsg2: `Look here! This is Sun Watch — it shows real solar flares from NASA. Big storms send dangerous radiation!`,
            tutMsg3: `These are Crew Vitals: Air, Food, and Health. Keep them green so your astronauts stay safe!`,
            tutMsg4: `Your Reactor Power Board! Use + and − to share 6 power cells between Air, Shields, and Food!`,
            tutMsg5: `When ready, share your power and click Start Day. Let's begin!`,
            noPower: (n) => `All 6 power cells are in use, ${n}! Tap minus (−) on another system first.`,
            welcomeCommander: (n) => `Welcome Commander ${n}! Do you want our quick training tour, or jump right into the mission?`,
            missionStarted: (site, n) => `Mission started on ${site}! Watch Sun Watch and balance your 6 power cells, ${n}!`,
            stillUnused: (n, left) => `Hold on ${n}! You still have ${left} unassigned power cell${left > 1 ? 's' : ''}! Assign all 6 before starting.`,
            tipX: (n, c) => `🚨 Look out ${n}! An intense ${c} storm is hitting today. Put at least 3 power cells into Shield!`,
            tipM: (c) => `⚠️ Heads up: A medium ${c} flare is active. Protect your crew with 2–3 Shield cells!`,
            tipC: (c) => `☀️ Today's ${c} flare is calm. 1 Shield cell is enough — use the rest for Air or Food!`,
            tipBalance: `⚡ Remember: 6 power cells total. Balance Air, Shield, and Greenhouse carefully!`,
            tipData: `🛰️ Fun Fact: Today's solar data is from NASA DONKI — real satellite observations!`,
            tipPlan: `🔭 Tip: Check tomorrow's forecast before choosing power. Plan ahead!`,
            nextDayX: (d, c) => `Day ${d} has a giant ${c} X-flare! Crank up those Radiation Shields!`,
            nextDayM: (d, c) => `For Day ${d}, an ${c} M-flare is coming. Balance Shield and Vitals!`,
            nextDayC: (d, c) => `Day ${d} is calm — great opportunity to boost Air or Food!`,
            endWinTitle: (n) => `Mission Accomplished, Commander ${n}!`,
            endWinBody: (s) => `ROBO-7 salutes you! You successfully managed ${s} for all 7 days!`,
            endWinSpeak: (n) => `Amazing job, ${n}! You balanced power and radiation like a true NASA commander!`,
            endLoseTitle: (n) => `Outpost Needs a Reset, ${n}!`,
            endLoseBody: (d) => `A critical system hit 0% on Day ${d}. Space survival is tough — let's try again!`,
            endLoseSpeak: (n) => `Good try, ${n}! Space is tricky. Watch Sun Watch closely and try a new strategy.`,
            liveLabel: 'NASA LIVE', archiveLabel: 'NASA ARCHIVE',
            creditsLive: (n) => `🛰️ LIVE — ${n} real flares loaded`,
            creditsArchive: '🛰️ ARCHIVE — curated real NASA events',
            creditsLoading: '🛰️ Connecting to NASA DONKI…'
        },
        ur: {
            subtitle: 'جونیئر خلاباز مشن ٹرینر',
            introTitle: 'آپ کی خلائی مہم یہاں سے شروع ہوتی ہے!',
            introBody: 'آپ کے عملے کو خلا میں محفوظ گھر چاہیے۔ آکسیجن سنبھالیں، خوراک اگائیں، تابکاری سے بچائیں اور سات دن زندہ رہیں۔',
            introBody2: 'گھبرائیں نہیں! ROBO-7 آپ کا دوست ہے اور سب کچھ سکھائے گا۔',
            nameLabel: '🧑‍🚀 ROBO-7 آپ کو کیا کہے؟',
            namePlaceholder: 'اپنا نام لکھیں',
            siteLegend: '🌍 اپنی منزل چنیں',
            moonName: 'چاند', moonNote: 'قریب کی خلائی مہم!',
            marsName: 'مریخ', marsNote: 'مشکل سفر!',
            launchBtn: '🚀 مشن تیار کریں',
            footnote: 'تجربے کی ضرورت نہیں۔ تربیت ROBO-7 کے ساتھ!',
            tutWelcome: 'مشن ٹریننگ میں خوش آمدید!',
            tutBody: 'ہیلو کمانڈر! مشن سے پہلے آپ سیکھ سکتے ہیں۔',
            tutBody2: 'ROBO-7 کنٹرولز، تابکاری، آکسیجن، خوراک اور روزانہ مشن سمجھائے گا۔',
            tutStart: '🎓 ٹیوٹوریل شروع کریں',
            tutSkip: '🚀 ٹیوٹوریل چھوڑیں',
            tutNote: 'آپ بعد میں ہینڈ بک کھول سکتے ہیں۔',
            progressLabel: 'مشن کی پیشرفت', soundOn: 'آواز: آن',
            handbook: 'ہینڈ بک', nasaData: 'NASA ڈیٹا',
            todayKicker: 'آج کا مشن',
            todayBody: 'سن واچ دیکھیں، پاور سنبھالیں اور تیار ہوں۔',
            stampText: 'زندہ رہنے کے دن',
            crewKicker: 'عملے کی حالت', crewTitle: '👩‍🚀 عملے کی زندگی',
            crewDesc: 'ہوا، خوراک، صحت — تینوں کو صفر سے اوپر رکھیں!',
            scoreLabel: 'سکور', airLabel: 'قابل تنفس ہوا', foodLabel: 'خوراک', healthLabel: 'صحت',
            airDesc: 'آکسیجن سانس لینے کے لیے ضروری ہے۔',
            foodDesc: 'گرین ہاؤس خوراک اگاتا ہے — پاور چاہیے۔',
            healthDesc: 'صحت تابکاری سے حفاظت دکھاتی ہے۔',
            rememberLabel: 'یاد رکھیں:', rememberText: 'کوئی بھی صفر ہوا تو مشن ختم!',
            spaceWeatherKicker: 'خلا کا موسم', sunWatchTitle: '☀️ سن واچ',
            sunDesc: 'سورج خطرناک توانائی چھوڑ سکتا ہے۔ خبردار رہیں!',
            scanning: 'سورج کو دیکھ رہے ہیں...', tomorrowLabel: '🔭 کل کی پیشن گوئی',
            radTitle: '🔬 تابکاری کیا ہے؟',
            radBody: 'تابکاری خلا میں سفر کرتی ہے۔ سورج کی تابکاری نقصان دہ ہو سکتی ہے۔',
            radBody2: 'شیلڈ تابکاری کو کم کرتی ہے۔',
            small: 'چھوٹا', medium: 'درمیانہ', strong: 'طاقتور',
            powerKicker: 'پاور کنٹرول', powerTitle: '⚡ پاور بورڈ',
            powerDesc: 'آپ کے پاس 6 پاور سیل ہیں۔ تین نظاموں میں بانٹیں۔',
            cellsLeft: 'سیل باقی',
            instPlus: '+ سے ایک سیل دیں۔',
            instMinus: '− سے ایک سیل لیں۔',
            lifeTitle: 'لائف سپورٹ', lifeDesc: 'آکسیجن بناتا ہے',
            shieldTitle: 'ریڈی ایشن شیلڈ', shieldDesc: 'عملے کو بچاتی ہے',
            farmTitle: 'گرین ہاؤس', farmDesc: 'خوراک اگاتا ہے',
            carefulLabel: 'سوچ سمجھ کر!', carefulText: 'ایک کو زیادہ تو دوسرے کو کم۔',
            startDayBtn: '🚀 دن شروع کریں',
            logKicker: 'مشن ریکارڈ', logTitle: '📋 کپتان کی ڈائری',
            logDesc: 'اہم پیغامات یہاں دکھیں گے۔',
            logStart: 'سسٹمز تیار ہو رہے ہیں۔ خوش آمدید!',
            tipBtn: '💡 ٹپ',
            eventBadge: 'چیلنج',
            learnedLabel: 'آپ نے کیا سیکھا:',
            continueBtn: 'اگلے دن جائیں →',
            dataBody: 'سن واچ NASA DONKI سے ڈیٹا لیتا ہے۔',
            statScore: 'سکور', statHealth: 'صحت', statDays: 'دن',
            learnedTitle: '🎓 آپ نے کیا سیکھا',
            shareBtn: '📋 سکور کاپی کریں', restartBtn: '🔄 دوبارہ',
            tutMsg1: (n) => `${n}! میں ROBO-7 ہوں۔ آؤ گھر دیکھیں۔ نیچے Next Step دبائیں!`,
            tutMsg2: `یہ سن واچ ہے — NASA کے اصلی شمسی طوفان دکھاتا ہے!`,
            tutMsg3: `یہ آپ کے وائٹل ہیں: ہوا، خوراک، صحت۔ سب کو سبز رکھیں!`,
            tutMsg4: `یہ پاور بورڈ ہے! + اور − سے 6 سیل بانٹیں!`,
            tutMsg5: `جب تیار ہوں، پاور بانٹیں اور Start Day دبائیں!`,
            noPower: (n) => `${n}! سب 6 سیل استعمال ہو گئے! دوسرے سسٹم سے − دبائیں۔`,
            welcomeCommander: (n) => `خوش آمدید کمانڈر ${n}! ٹیوٹوریل یا سیدھا مشن؟`,
            missionStarted: (s, n) => `${s} پر مشن شروع! سن واچ دیکھیں، ${n}!`,
            stillUnused: (n, left) => `${n}! ابھی ${left} سیل باقی ہیں! سب بانٹیں۔`,
            tipX: (n, c) => `${n}! خطرناک ${c} طوفان! کم از کم 3 شیلڈ سیل دیں!`,
            tipM: (c) => `⚠️ درمیانہ ${c} طوفان! 2–3 شیلڈ سیل دیں!`,
            tipC: (c) => `☀️ ${c} طوفان ہلکا ہے۔ 1 شیلڈ کافی ہے!`,
            tipBalance: `⚡ 6 پاور سیل — احتیاط سے بانٹیں!`,
            tipData: `🛰️ یہ ڈیٹا NASA DONKI سے ہے!`,
            tipPlan: `🔭 کل کی پیشن گوئی دیکھیں!`,
            nextDayX: (d, c) => `دن ${d}: بہت بڑا ${c} طوفان! شیلڈ بڑھائیں!`,
            nextDayM: (d, c) => `دن ${d}: ${c} طوفان۔ توازن رکھیں!`,
            nextDayC: (d, c) => `دن ${d}: پرسکون — ہوا یا خوراک بڑھائیں!`,
            endWinTitle: (n) => `مشن مکمل، کمانڈر ${n}!`,
            endWinBody: (s) => `ROBO-7 سلام کرتا ہے! آپ نے ${s} پر 7 دن کامیابی سے گزارے!`,
            endWinSpeak: (n) => `شاندار ${n}! آپ نے پاور اور تابکاری کو سنبھالا!`,
            endLoseTitle: (n) => `${n} — دوبارہ کوشش!`,
            endLoseBody: (d) => `دن ${d} پر نظام ناکام ہو گیا۔ خلا مشکل ہے — دوبارہ کوشش!`,
            endLoseSpeak: (n) => `اچھی کوشش ${n}! سن واچ دیکھیں اور نئی حکمت عملی آزمائیں۔`,
            liveLabel: 'NASA لائیو', archiveLabel: 'NASA آرکائیو',
            creditsLive: (n) => `🛰️ لائیو — ${n} اصلی شمسی طوفان`,
            creditsArchive: '🛰️ آرکائیو — NASA کے اصل ڈیٹا سے',
            creditsLoading: '🛰️ NASA سے رابطہ…'
        }
    });

    OZ.EVENTS = Object.freeze([
        {
            id: 'dust_storm',
            trigger: s => s.site === 'mars' && s.day >= 2 && Math.random() < 0.55,
            title: '🌪️ Martian Dust Storm!',
            text: 'Fast dust is covering our solar panels! What should we do?',
            hint: 'Sealing the airlock protects air, while open vents help crops!',
            choices: [
                { label: '🚪 Seal Airlock (+8% Air, −10% Food)', effect: { oxygen: 8, food: -10 },
                  lesson: 'You protected air at the cost of food — real Mars missions face this exact choice.' },
                { label: '🌿 Keep Vents Open (−10% Air, +8% Food)', effect: { oxygen: -10, food: 8 },
                  lesson: 'You kept food growing but lost air — trade-offs are everywhere in space.' }
            ]
        },
        {
            id: 'recycler',
            trigger: s => s.day >= 3 && Math.random() < 0.6,
            title: '🔧 Water Recycler Overheating!',
            text: 'Our main air-water machine is getting very hot during a solar storm!',
            hint: 'Diverting coolant keeps oxygen flowing smoothly.',
            choices: [
                { label: '❄️ Use Coolant (+10% Air, −8% Health)', effect: { oxygen: 10, health: -8 },
                  lesson: 'Coolant helped air but cost health — NASA recycles water on the ISS exactly like this.' },
                { label: '🐢 Half-Speed Pump (−10% Air, +6% Health)', effect: { oxygen: -10, health: 6 },
                  lesson: 'Slower pump protected health but cost air — smart restraint.' }
            ]
        },
        {
            id: 'science',
            trigger: s => s.day >= 4 && Math.random() < 0.55,
            title: '🔬 Science Opportunity!',
            text: 'NASA wants us to run a special experiment — but it uses resources!',
            hint: 'Science gives score — but costs power. Your call!',
            choices: [
                { label: '🧪 Run Experiment (−8% Food, +200 Score)', effect: { food: -8, score: 200 },
                  lesson: 'NASA constantly trades resources for science — you just did the same.' },
                { label: '🌱 Skip — Focus on Food (+5% Food)', effect: { food: 5 },
                  lesson: 'Restraint is also a valid mission choice — survival comes first.' }
            ]
        },
        {
            id: 'blackout',
            trigger: s => s.day >= 5 && Math.random() < 0.5,
            title: '📡 Communications Blackout!',
            text: 'We lost contact with Earth! We must fix the antenna — but it needs power.',
            hint: 'Repairs use power but keep the mission connected.',
            choices: [
                { label: '🔧 Repair Now (−6% Air, +5% Health)', effect: { oxygen: -6, health: 5 },
                  lesson: 'Signals restored — connection with mission control matters.' },
                { label: '⏸️ Postpone (+3% Air, −5% Health)', effect: { oxygen: 3, health: -5 },
                  lesson: 'You saved air but risked the crew — postponement has its own cost.' }
            ]
        },
        {
            id: 'meteor',
            trigger: s => s.day >= 5 && Math.random() < 0.45,
            title: '☄️ Micrometeorite Hit!',
            text: 'A tiny space rock just hit the hull! It made a small leak.',
            hint: 'Patching takes effort but protects the crew.',
            choices: [
                { label: '🔨 Patch the Hull (+5% Air, −5% Health)', effect: { oxygen: 5, health: -5 },
                  lesson: 'Patching costs a little health — but prevents bigger leaks later.' },
                { label: '🛡️ Rely on Shield (+3% Health, −5% Air)', effect: { health: 3, oxygen: -5 },
                  lesson: 'The shield held, but air leaked — shields alone are not enough.' }
            ]
        },
        {
            id: 'rover',
            trigger: s => s.day >= 2 && Math.random() < 0.4,
            title: '🚙 Rover Stuck!',
            text: 'The exploration rover is stuck in soft dust with a sample on board!',
            hint: 'Rescuing it takes time and energy — but the sample is valuable.',
            choices: [
                { label: '🛟 Send Rescue Drone (−6% Air, +120 Score)', effect: { oxygen: -6, score: 120 },
                  lesson: 'Real rovers like Perseverance rely on careful route planning to avoid getting stuck.' },
                { label: '📡 Wait for Tomorrow (+4% Health)', effect: { health: 4 },
                  lesson: 'Patience is safe — mission teams often wait for the best moment to act.' }
            ]
        },
        {
            id: 'visitor',
            trigger: s => s.day >= 3 && Math.random() < 0.4,
            title: '🛰️ Supply Ship Arriving!',
            text: 'A cargo ship is passing by and can drop supplies — but only one kind!',
            hint: 'Food helps the greenhouse crew, medicine helps the astronauts.',
            choices: [
                { label: '🥫 Take Food Pods (+10% Food)', effect: { food: 10 },
                  lesson: 'Resupply missions carry food, water and tools to keep crews healthy.' },
                { label: '🩹 Take Medical Kit (+8% Health)', effect: { health: 8 },
                  lesson: 'A medical kit keeps astronauts safe — doctors on Earth guide them by radio.' }
            ]
        }
    ]);

    OZ.TUTORIAL = Object.freeze([
        { target: null,                   msgKey: 'tutMsg1' },
        { target: '[data-tut="flare"]',   msgKey: 'tutMsg2' },
        { target: '[data-tut="vitals"]',  msgKey: 'tutMsg3' },
        { target: '[data-tut="console"]', msgKey: 'tutMsg4' },
        { target: '[data-tut="nextbtn"]', msgKey: 'tutMsg5' }
    ]);

    OZ.t = function (key) {
        const lang = (OZ.State && OZ.State.lang) || 'en';
        const dict = OZ.STRINGS[lang] || OZ.STRINGS.en;
        return dict[key] !== undefined ? dict[key] : (OZ.STRINGS.en[key] !== undefined ? OZ.STRINGS.en[key] : key);
    };
})(window);