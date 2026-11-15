/* Outpost Zero - polish layer (load LAST).
   Small quality-of-life fixes: ROBO-7's speech bubble tidies itself away so it never
   covers the panels, the page scrolls to the right place, and the layout stays clean. */
(function (w) {
    'use strict';
    const OZ = w.OZ, A = OZ.App, $ = id => document.getElementById(id);
    const robo = $('robo');
    if (!robo || !A) return;

    /* ROBO-7's bubble fades out a few seconds after he finishes talking.
       Tap ROBO-7 (or press Smart Tip) to bring it back. During the tutorial it stays. */
    let hideT = null;
    const inTutorial = () => !!document.querySelector('.spotlight') || /next/i.test((A.tipBtn && A.tipBtn.textContent) || '');
    const arm = ms => {
        clearTimeout(hideT);
        hideT = setTimeout(() => { if (inTutorial()) return arm(4000); robo.classList.add('quiet'); }, ms);
    };
    const speak = A.speak;
    A.speak = function (msg, cb) {
        robo.classList.remove('quiet');
        clearTimeout(hideT);
        const len = String(msg || '').length;
        const r = speak.call(this, msg, () => { arm(Math.max(4500, len * 45)); if (cb) cb(); });
        arm(Math.max(12000, len * 110)); // safety net if speech is off or never ends
        return r;
    };

    /* Keep the outpost scene sized to its card. */
    const fit = () => document.documentElement.style.setProperty('--vh', (w.innerHeight * 0.01) + 'px');
    fit(); w.addEventListener('resize', fit);

    /* After a day ends, bring the player back to the power board (the next decision). */
    const cont = A.onDebriefContinue;
    A.onDebriefContinue = function () {
        const r = cont.apply(this, arguments);
        const pb = document.querySelector('.power-board');
        if (pb && w.innerWidth < 1150) setTimeout(() => pb.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250);
        return r;
    };
})(window);
