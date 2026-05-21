// ============================================================
// 大对勾托管中心2026级 — 班级主页交互逻辑
// ============================================================

(function () {
  'use strict';

  // ---- DOM Ready ----
  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  ready(function () {
    initNav();
    initCarousel();
    initCountdown();
    initNotices();
    initStudentWall();
    initAlbum();
    initTimeline();
    initSecretEntry();
    initBackToTop();
    initSmoothScroll();
  });

  // ---- Navigation ----
  function initNav() {
    var toggle = document.querySelector('.nav-toggle');
    var links = document.querySelector('.nav-links');
    if (!toggle || !links) return;

    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
    });

    // Close nav when clicking a link (mobile)
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('open');
      });
    });

    // Highlight active nav link on scroll
    var sections = document.querySelectorAll('section[id]');
    var navLinks = document.querySelectorAll('.nav-links a');
    window.addEventListener('scroll', function () {
      var scrollY = window.pageYOffset;
      sections.forEach(function (sec) {
        var top = sec.offsetTop - 100;
        var bottom = top + sec.offsetHeight;
        if (scrollY >= top && scrollY < bottom) {
          navLinks.forEach(function (a) {
            a.classList.remove('active');
            if (a.getAttribute('href') === '#' + sec.id) a.classList.add('active');
          });
        }
      });
    });
  }

  // ---- Carousel ----
  function initCarousel() {
    var track = document.querySelector('.carousel-track');
    var prevBtn = document.querySelector('.carousel-btn.prev');
    var nextBtn = document.querySelector('.carousel-btn.next');
    var dotsContainer = document.querySelector('.carousel-dots');
    if (!track || !prevBtn || !nextBtn) return;

    var photos = CLASS_CONFIG.heroPhotos;
    if (!photos.length) return;

    var current = 0;
    var autoplayTimer;

    // Build slides
    photos.forEach(function (photo, i) {
      var img = document.createElement('img');
      img.src = photo.url;
      img.alt = photo.alt;
      img.loading = i === 0 ? 'eager' : 'lazy';
      track.appendChild(img);

      if (dotsContainer) {
        var dot = document.createElement('button');
        dot.addEventListener('click', function () { goTo(i); });
        dotsContainer.appendChild(dot);
      }
    });

    var dots = dotsContainer ? dotsContainer.querySelectorAll('button') : [];

    function updateDots() {
      dots.forEach(function (d, i) { d.classList.toggle('active', i === current); });
    }

    function goTo(index) {
      current = index;
      track.style.transform = 'translateX(-' + (current * 100) + '%)';
      updateDots();
      resetAutoplay();
    }

    function goNext() { goTo((current + 1) % photos.length); }
    function goPrev() { goTo((current - 1 + photos.length) % photos.length); }

    function resetAutoplay() {
      clearInterval(autoplayTimer);
      autoplayTimer = setInterval(goNext, 4000);
    }

    prevBtn.addEventListener('click', goPrev);
    nextBtn.addEventListener('click', goNext);
    updateDots();
    resetAutoplay();

    // Swipe support
    var touchStartX = 0;
    track.addEventListener('touchstart', function (e) { touchStartX = e.touches[0].clientX; });
    track.addEventListener('touchend', function (e) {
      var diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) { diff > 0 ? goNext() : goPrev(); }
    });
  }

  // ---- Countdown ----
  function initCountdown() {
    var container = document.getElementById('countdown-grid');
    if (!container) return;

    var target = new Date(CLASS_CONFIG.countdownTarget).getTime();

    function update() {
      var now = Date.now();
      var diff = target - now;

      if (diff <= 0) {
        container.innerHTML = '<div class="countdown-item"><div class="countdown-num">🎉</div><div class="countdown-label">中考加油！</div></div>';
        return;
      }

      var days = Math.floor(diff / (1000 * 60 * 60 * 24));
      var hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      var seconds = Math.floor((diff % (1000 * 60)) / 1000);

      var items = [
        { num: days, label: '天' },
        { num: hours, label: '时' },
        { num: minutes, label: '分' },
        { num: seconds, label: '秒' }
      ];

      container.innerHTML = items.map(function (item) {
        return '<div class="countdown-item"><div class="countdown-num">' + item.num + '</div><div class="countdown-label">' + item.label + '</div></div>';
      }).join('');
    }

    update();
    setInterval(update, 1000);
  }

  // ---- Notices ----
  function initNotices() {
    var list = document.getElementById('notice-list');
    if (!list) return;

    list.innerHTML = CLASS_CONFIG.notices.map(function (n) {
      return '<div class="notice-item">' +
        '<div class="notice-icon">📢</div>' +
        '<div class="notice-content">' +
          '<div class="notice-text">' + n.text + '</div>' +
          '<div class="notice-date">' + n.date + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  // ---- Student Wall ----
  function initStudentWall() {
    var wall = document.getElementById('student-wall');
    if (!wall) return;

    wall.innerHTML = CLASS_CONFIG.students.map(function (name) {
      return '<div class="student-card">' + name + '</div>';
    }).join('');
  }

  // ---- Album with Lightbox ----
  function initAlbum() {
    var grid = document.getElementById('album-grid');
    if (!grid) return;

    var photos = CLASS_CONFIG.album;
    var currentIndex = 0;

    photos.forEach(function (photo, i) {
      var item = document.createElement('div');
      item.className = 'album-item';
      item.innerHTML = '<img src="' + photo.thumb + '" alt="' + photo.caption + '" loading="lazy"><div class="album-caption">' + photo.caption + '</div>';
      item.addEventListener('click', function () { openLightbox(i); });
      grid.appendChild(item);
    });

    function openLightbox(index) {
      currentIndex = index;
      renderLightbox();
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      var lb = document.querySelector('.lightbox');
      if (lb) lb.remove();
      document.body.style.overflow = '';
    }

    function renderLightbox() {
      var existing = document.querySelector('.lightbox');
      if (existing) existing.remove();

      var photo = photos[currentIndex];
      var lb = document.createElement('div');
      lb.className = 'lightbox';
      lb.innerHTML =
        '<button class="lightbox-close">&times;</button>' +
        '<button class="lightbox-btn prev">&lsaquo;</button>' +
        '<button class="lightbox-btn next">&rsaquo;</button>' +
        '<img src="' + photo.full + '" alt="' + photo.caption + '">' +
        '<div class="lightbox-caption">' + photo.caption + ' (' + (currentIndex + 1) + '/' + photos.length + ')</div>';

      lb.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
      lb.querySelector('.prev').addEventListener('click', function () {
        currentIndex = (currentIndex - 1 + photos.length) % photos.length;
        renderLightbox();
      });
      lb.querySelector('.next').addEventListener('click', function () {
        currentIndex = (currentIndex + 1) % photos.length;
        renderLightbox();
      });
      lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });

      document.body.appendChild(lb);

      // Keyboard navigation
      function onKey(e) {
        if (e.key === 'Escape') { closeLightbox(); document.removeEventListener('keydown', onKey); }
        if (e.key === 'ArrowLeft') { currentIndex = (currentIndex - 1 + photos.length) % photos.length; renderLightbox(); }
        if (e.key === 'ArrowRight') { currentIndex = (currentIndex + 1) % photos.length; renderLightbox(); }
      }
      document.addEventListener('keydown', onKey);
    }
  }

  // ---- Timeline ----
  function initTimeline() {
    var container = document.getElementById('timeline');
    if (!container) return;

    container.innerHTML = CLASS_CONFIG.timeline.map(function (item) {
      var imgHtml = item.img ? '<img src="' + item.img + '" alt="' + item.title + '" loading="lazy">' : '';
      return '<div class="timeline-item">' +
        '<div class="timeline-card">' +
          imgHtml +
          '<div>' +
            '<span class="timeline-date">' + item.date + '</span>' +
            '<div class="timeline-title">' + item.title + '</div>' +
            '<div class="timeline-desc">' + item.desc + '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  // ---- Secret Entry Modal ----
  function initSecretEntry() {
    var btn = document.getElementById('secret-entry-btn');
    if (!btn) return;

    btn.setAttribute('data-tip', CLASS_CONFIG.secretHint);
    btn.addEventListener('click', function () {
      showPasswordModal();
    });
  }

  window.showPasswordModal = function () {
    var existing = document.querySelector('.modal-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML =
      '<div class="modal">' +
        '<div class="modal-icon">' + CLASS_CONFIG.secretIconText + '</div>' +
        '<h3>我们的小秘密</h3>' +
        '<p>输入班级专属密码，解锁时光信件</p>' +
        '<input type="password" class="modal-input" id="secret-password-input" placeholder="请输入密码" autofocus>' +
        '<div class="modal-error" id="modal-error"></div>' +
        '<button class="modal-btn" id="modal-submit">打开秘密</button>' +
      '</div>';

    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });

    document.body.appendChild(overlay);

    var input = document.getElementById('secret-password-input');
    var error = document.getElementById('modal-error');
    var submit = document.getElementById('modal-submit');

    function check() {
      if (input.value === CLASS_CONFIG.secretPassword) {
        sessionStorage.setItem('dagodui_auth', 'true');
        window.location.href = 'secret.html';
      } else {
        error.textContent = '这个秘密只属于2026级～';
        input.value = '';
        input.focus();
      }
    }

    submit.addEventListener('click', check);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') check(); });
    input.focus();
  };

  // ---- Back to Top ----
  function initBackToTop() {
    var btn = document.getElementById('back-top');
    if (!btn) return;

    window.addEventListener('scroll', function () {
      btn.classList.toggle('visible', window.pageYOffset > 500);
    });

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ---- Smooth Scroll ----
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }
})();
