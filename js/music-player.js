// ============================================================
// 大对勾2026级 — 背景音乐播放模块
// ============================================================
(function() {
  'use strict';

  let audio = null;
  let isPlaying = false;
  let volume = MUSIC_CONFIG.defaultVolume || 0.4;

  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  function createUI() {
    const player = document.createElement('div');
    player.className = 'music-player';
    player.innerHTML =
      '<button class="music-btn" id="music-btn" title="播放音乐">🔊</button>' +
      '<div class="music-volume" id="music-volume">' +
        '<input type="range" class="music-slider" id="music-slider" min="0" max="100" value="' + (volume * 100) + '">' +
      '</div>';
    document.body.appendChild(player);

    const btn = document.getElementById('music-btn');
    const slider = document.getElementById('music-slider');

    btn.addEventListener('click', togglePlay);
    slider.addEventListener('input', function() {
      volume = this.value / 100;
      if (audio) audio.volume = volume;
      sessionStorage.setItem('dagodui_music_volume', volume);
    });
  }

  function initAudio() {
    if (!MUSIC_CONFIG.src) return;
    audio = new Audio(MUSIC_CONFIG.src);
    audio.volume = volume;
    audio.loop = true;

    audio.addEventListener('play', function() {
      isPlaying = true;
      updateBtn();
    });
    audio.addEventListener('pause', function() {
      isPlaying = false;
      updateBtn();
    });
  }

  function updateBtn() {
    const btn = document.getElementById('music-btn');
    if (!btn) return;
    if (isPlaying) {
      btn.textContent = '🔊';
      btn.classList.add('playing');
      btn.title = '暂停音乐';
    } else {
      btn.textContent = '🔇';
      btn.classList.remove('playing');
      btn.title = '播放音乐';
    }
  }

  function togglePlay() {
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(function() {});
    }
  }

  function tryAutoplay() {
    if (!audio || isPlaying) return;
    audio.play().then(function() {
      sessionStorage.setItem('dagodui_music_playing', 'true');
    }).catch(function() {
      // 浏览器拦截时，等用户交互后再试
      document.addEventListener('click', tryAutoplay, { once: true });
      document.addEventListener('touchstart', tryAutoplay, { once: true });
    });
  }

  ready(function() {
    createUI();
    initAudio();

    // 恢复上次音量
    const savedVol = sessionStorage.getItem('dagodui_music_volume');
    if (savedVol !== null) {
      volume = parseFloat(savedVol);
      if (audio) audio.volume = volume;
      const slider = document.getElementById('music-slider');
      if (slider) slider.value = volume * 100;
    }

    // 尝试自动播放
    tryAutoplay();
  });

})();
