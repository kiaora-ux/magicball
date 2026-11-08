(function () {
  const ball = document.getElementById('ball');
  const answerEl = document.getElementById('answer');
  const hint = document.getElementById('hint');
  const live = document.getElementById('live');
  const wake = document.getElementById('wake');
  const wakeBtn = document.getElementById('wakeBtn');
  const wakeSkip = document.getElementById('wakeSkip');

  const pool = Object.values(window.ANSWERS).flat();
  let last = -1;
  let busy = false;

  function pickAnswer() {
    let i;
    do { i = Math.floor(Math.random() * pool.length); } while (pool.length > 1 && i === last);
    last = i;
    return pool[i];
  }

  function shake() {
    if (busy) return;
    busy = true;
    ball.classList.remove('is-revealed');
    hint.style.opacity = '0';
    live.textContent = '';

    // Restart the animation even if it ran a moment ago.
    ball.classList.remove('is-shaking');
    void ball.offsetWidth;
    ball.classList.add('is-shaking');
  }

  ball.addEventListener('animationend', function () {
    ball.classList.remove('is-shaking');
    const text = pickAnswer();
    answerEl.textContent = text;
    ball.classList.add('is-revealed');
    live.textContent = text;
    if (navigator.vibrate) navigator.vibrate(30);
    hint.textContent = 'Shake again if you didn’t like that.';
    hint.style.opacity = '1';
    setTimeout(function () { busy = false; }, 700);
  });

  ball.addEventListener('click', shake);
  document.addEventListener('keydown', function (e) {
    if (e.code === 'Space' && e.target === document.body) { e.preventDefault(); shake(); }
  });

  // Shake detection
  const THRESHOLD = 15; // change in m/s² that counts as a shake
  let prev = null;
  let lastShake = 0;

  function onMotion(e) {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x === null) return;
    if (prev) {
      const delta = Math.abs(a.x - prev.x) + Math.abs(a.y - prev.y) + Math.abs(a.z - prev.z);
      const now = Date.now();
      if (delta > THRESHOLD && now - lastShake > 1200) {
        lastShake = now;
        shake();
      }
    }
    prev = { x: a.x, y: a.y, z: a.z };
  }

  function listen() {
    window.addEventListener('devicemotion', onMotion);
  }

  const needsPermission =
    typeof DeviceMotionEvent !== 'undefined' &&
    typeof DeviceMotionEvent.requestPermission === 'function';

  if (needsPermission) {
    // iPhone and iPad: motion only works after a tap grants permission.
    wake.hidden = false;
    wakeBtn.addEventListener('click', function () {
      DeviceMotionEvent.requestPermission()
        .then(function (state) {
          if (state === 'granted') listen();
          else hint.textContent = 'No motion allowed, so tap the ball instead.';
        })
        .catch(function () {
          hint.textContent = 'Shaking isn’t available here, so tap the ball instead.';
        })
        .finally(function () { wake.hidden = true; });
    });
    wakeSkip.addEventListener('click', function () {
      wake.hidden = true;
      hint.textContent = 'Think of a question, then tap the ball.';
    });
  } else if ('DeviceMotionEvent' in window) {
    listen();
  }
})();
