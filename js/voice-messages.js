// ============================================================
// 大对勾2026级 — 教师语音寄语模块
// ============================================================
(function() {
  'use strict';

  let currentAudio= null;
  let currentCard= null;
  let voiceData= [];
  let playAllMode= false;
  let playAllIndex= 0;

  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  // ---- 加载数据 ----
  function loadVoiceData() {
    return DB.query('VoiceMessages', function() { return true; }).then(function(list) {
      if (list && list.length > 0) {
        voiceData = list.sort(function(a, b) { return (a.sortOrder || 99) - (b.sortOrder || 99); });
      } else {
        voiceData = VOICE_PRESETS || [];
      }
    }).catch(function() {
      voiceData = VOICE_PRESETS || [];
    });
  }

  // ---- 渲染卡片 ----
  function renderCards() {
    const section = document.getElementById('voice-section');
    if (!section) return;

    const grid = section.querySelector('.voice-grid');
    if (!grid) return;

    if (voiceData.length === 0) {
      grid.innerHTML =
        '<div class="voice-empty">' +
          '<p>🎙️ 老师们的语音寄语即将上线</p>' +
          '<p style="font-size:0.85rem;color:var(--text-muted);margin-top:0.5rem">请刘老师用手机录音后上传到图床，再录入系统</p>' +
        '</div>';
      return;
    }

    const html = '';
    voiceData.forEach(function(teacher, i) {
      html +=
        '<div class="voice-card" data-index="' + i + '" id="voice-card-' + i + '">' +
          '<div class="voice-avatar">' +
            (teacher.avatar ? '<img src="' + teacher.avatar + '" alt="' + teacher.teacherName + '">' : '<span class="voice-avatar-placeholder">' + (teacher.teacherName || '?')[0] + '</span>') +
          '</div>' +
          '<div class="voice-info">' +
            '<div class="voice-teacher">' + teacher.teacherName + '</div>' +
            '<div class="voice-title">' + teacher.title + '</div>' +
            '<div class="voice-duration">⏱ ' + (teacher.duration || '--') + '</div>' +
          '</div>' +
          '<div class="voice-wave-bar" id="wave-' + i + '">' +
            '<span></span><span></span><span></span><span></span><span></span>' +
          '</div>' +
        '</div>';
    });
    grid.innerHTML = html;

    // 绑定点击事件
    grid.querySelectorAll('.voice-card').forEach(function(card) {
      card.addEventListener('click', function() {
        const idx = parseInt(this.dataset.index);
        togglePlay(idx, this);
      });
    });
  }

  // ---- 播放控制 ----
  function togglePlay(index, card) {
    // 点击正在播放的卡 -> 暂停
    if (currentCard === card && currentAudio && !currentAudio.paused) {
      currentAudio.pause();
      stopWave(card);
      return;
    }

    // 点击另一卡 -> 停止旧的，播新的
    stopCurrent();
    play(index, card);
  }

  function play(index, card) {
    const teacher = voiceData[index];
    if (!teacher || !teacher.audioSrc) {
      showToast('该寄语音频暂未上传');
      return;
    }

    currentAudio = new Audio(teacher.audioSrc);
    currentCard = card;
    playAllMode = false;

    currentAudio.addEventListener('play', function() {
      startWave(card);
    });
    currentAudio.addEventListener('ended', function() {
      stopWave(card);
      currentAudio = null;
      currentCard = null;
      if (playAllMode) playNextInAll();
    });
    currentAudio.addEventListener('error', function() {
      stopWave(card);
      showToast('音频加载失败，请稍后再试');
      currentAudio = null;
      currentCard = null;
    });

    currentAudio.play().catch(function() {
      stopWave(card);
      showToast('播放失败，请检查音频链接');
    });
  }

  function stopCurrent() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    if (currentCard) {
      stopWave(currentCard);
      currentCard = null;
    }
  }

  // ---- 声波动画 ----
  function startWave(card) {
    if (!card) return;
    card.classList.add('playing');
    const wave = card.querySelector('.voice-wave-bar');
    if (wave) wave.classList.add('active');
  }

  function stopWave(card) {
    if (!card) return;
    card.classList.remove('playing');
    const wave = card.querySelector('.voice-wave-bar');
    if (wave) wave.classList.remove('active');
  }

  // ---- 全部播放 ----
  function playAll() {
    playAllMode = true;
    playAllIndex = 0;
    stopCurrent();

    // 找到第一个有音频的老师
    function findNext(startIdx) {
      for (let i= startIdx; i < voiceData.length; i++) {
        if (voiceData[i].audioSrc) return i;
      }
      return -1;
    }

    const firstIdx = findNext(0);
    if (firstIdx < 0) {
      showToast('暂无可播放的语音寄语');
      playAllMode = false;
      return;
    }

    playAllIndex = firstIdx;
    const card = document.getElementById('voice-card-' + firstIdx);
    if (card) play(firstIdx, card);
  }

  function playNextInAll() {
    if (!playAllMode) return;

    function findNext(startIdx) {
      for (let i= startIdx; i < voiceData.length; i++) {
        if (voiceData[i].audioSrc) return i;
      }
      return -1;
    }

    const nextIdx = findNext(playAllIndex + 1);
    if (nextIdx < 0) {
      playAllMode = false;
      showToast('全部寄语播放完毕 🎉');
      return;
    }

    playAllIndex = nextIdx;
    const card = document.getElementById('voice-card-' + nextIdx);
    if (card) play(nextIdx, card);
  }

  // ---- Toast ----
  function showToast(msg) {
    const exist = document.querySelector('.toast');
    if (exist) exist.remove();
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function() { el.remove(); }, 2000);
  }

  // ---- Init ----
  ready(function() {
    loadVoiceData().then(function() {
      renderCards();
    });

    const playAllBtn = document.getElementById('voice-play-all');
    if (playAllBtn) {
      playAllBtn.addEventListener('click', function() {
        if (voiceData.length === 0) {
          showToast('暂无语音寄语数据');
          return;
        }
        playAll();
      });
    }
  });

})();
