/* ============================================
   OBSESSED — script.js
   ============================================ */

(function () {
  'use strict';

  /* ── CONFIG FETCH ── */
  fetch('/api/config')
    .then(function (r) { return r.json(); })
    .then(function (cfg) {
      var ca = cfg.ca || 'COMING_SOON';
      var twitter = cfg.twitter || '#';
      var buy = cfg.buy || '#';

      document.getElementById('nav-ca').textContent = ca;
      document.getElementById('footer-ca').textContent = ca;

      document.getElementById('nav-twitter').href = twitter;
      document.getElementById('nav-buy').href = buy;
      document.getElementById('hero-buy-btn').href = buy;

      // Store CA for copy
      document.body.dataset.ca = ca;
    })
    .catch(function () {});

  /* ── CA COPY ── */
  function copyCA() {
    var ca = document.body.dataset.ca || 'COMING_SOON';
    navigator.clipboard.writeText(ca).then(function () {
      var toast = document.getElementById('toast');
      toast.classList.add('show');
      setTimeout(function () { toast.classList.remove('show'); }, 2000);
    }).catch(function () {});
  }

  document.getElementById('nav-ca').addEventListener('click', copyCA);
  document.getElementById('footer-ca').addEventListener('click', copyCA);

  /* ── CURSOR GLOW ── */
  var glow = document.querySelector('.cursor-glow');
  if (window.matchMedia('(hover: hover)').matches) {
    document.addEventListener('mousemove', function (e) {
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
    });
  }

  /* ── HERO VIDEO SOUND ── */
  var heroVideo = document.getElementById('hero-video');
  var soundBtn = document.getElementById('sound-btn');
  var soundIcon = soundBtn.querySelector('.sound-icon');
  var soundText = soundBtn.querySelector('.sound-text');
  var heroMuted = true;

  soundBtn.addEventListener('click', function () {
    if (heroMuted) {
      heroVideo.muted = false;
      heroVideo.volume = 0;
      var ramp = setInterval(function () {
        if (heroVideo.volume < 0.34) {
          heroVideo.volume = Math.min(heroVideo.volume + 0.02, 0.35);
        } else {
          clearInterval(ramp);
        }
      }, 80);
      soundIcon.textContent = '\u{1F50A}';
      soundText.textContent = 'mute';
      heroMuted = false;
    } else {
      heroVideo.muted = true;
      heroVideo.volume = 0;
      soundIcon.textContent = '\u{1F507}';
      soundText.textContent = 'sound';
      heroMuted = true;
    }
  });

  /* ── SCRAMBLE TYPEWRITER ── */
  var phrases = [
    'motivation fades. discipline breaks. obsession delivers.',
    'the greats were never balanced. they were consumed.',
    "you don't choose obsession. it chooses you.",
    'the gap between good and great is 3am.'
  ];
  var scrambleEl = document.getElementById('hero-scramble');
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
  var phraseIndex = 0;

  function scrambleTo(target, callback) {
    var length = target.length;
    var iterations = 0;
    var maxIterations = length + 12;
    var revealed = 0;
    var interval = setInterval(function () {
      var display = '';
      for (var i = 0; i < length; i++) {
        if (i < revealed) {
          display += target[i];
        } else {
          display += chars[Math.floor(Math.random() * chars.length)];
        }
      }
      scrambleEl.textContent = display;
      iterations++;
      if (iterations % 2 === 0) revealed++;
      if (revealed >= length) {
        clearInterval(interval);
        scrambleEl.textContent = target;
        if (callback) callback();
      }
    }, 30);
  }

  function cyclePhrase() {
    scrambleTo(phrases[phraseIndex], function () {
      setTimeout(function () {
        phraseIndex = (phraseIndex + 1) % phrases.length;
        cyclePhrase();
      }, 3000);
    });
  }
  cyclePhrase();

  /* ── SCROLL HINT ── */
  var scrollHint = document.querySelector('.scroll-hint');
  window.addEventListener('scroll', function () {
    if (window.scrollY > 100) {
      scrollHint.classList.add('hidden');
    } else {
      scrollHint.classList.remove('hidden');
    }
  }, { passive: true });

  /* ── INTERSECTION OBSERVER UTILITY ── */
  function onVisible(selector, callback, options) {
    var els = document.querySelectorAll(selector);
    if (!els.length) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          callback(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, options || { threshold: 0.15 });
    els.forEach(function (el) { obs.observe(el); });
  }

  /* ── THE SIGNS — staggered fade-in ── */
  onVisible('.sign-row', function (el) {
    var rows = document.querySelectorAll('.sign-row');
    var index = Array.prototype.indexOf.call(rows, el);
    setTimeout(function () {
      el.classList.add('visible');
    }, index * 80);
  }, { threshold: 0.1 });

  /* ── THE LADDER — progress bars ── */
  onVisible('.progress-bar', function (el) {
    var fill = el.getAttribute('data-fill');
    var bar = el.querySelector('.progress-fill');
    setTimeout(function () {
      bar.style.width = fill + '%';
    }, 200);

    // Flash effect on obsession level (100%)
    if (fill === '100') {
      setTimeout(function () {
        var flash = document.getElementById('ladder-flash');
        flash.classList.add('active');
        setTimeout(function () {
          flash.classList.remove('active');
        }, 200);
      }, 1700);
    }
  }, { threshold: 0.3 });

  /* ── BIG QUOTE — word-by-word reveal ── */
  var bqObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var words = entry.target.querySelectorAll('.bq-word');
        words.forEach(function (word, i) {
          setTimeout(function () {
            word.classList.add('visible');
          }, i * 100);
        });
        bqObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  var bqText = document.getElementById('bigquote-text');
  if (bqText) bqObserver.observe(bqText);

  /* ── SCROLL WORDS — bidirectional reveal ── */
  onVisible('.scroll-word', function (el) {
    el.classList.add('visible');
  }, { threshold: 0.3 });

  /* ── VIDEO GALLERY — individual sound toggle ── */
  document.querySelectorAll('.video-sound-btn').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var slot = btn.closest('.video-slot');
      var video = slot.querySelector('video');

      // Mute all other videos first
      document.querySelectorAll('.video-slot video').forEach(function (v) {
        if (v !== video) {
          v.muted = true;
          var otherBtn = v.closest('.video-slot').querySelector('.video-sound-btn');
          otherBtn.textContent = '\u{1F507}';
        }
      });

      if (video.muted) {
        video.muted = false;
        video.volume = 0.5;
        btn.textContent = '\u{1F50A}';
      } else {
        video.muted = true;
        btn.textContent = '\u{1F507}';
      }
    });
  });

})();
