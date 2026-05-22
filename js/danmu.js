// ============================================================
// 大对勾2026级 — 留言弹幕模块 (Leancloud + localStorage 降级)
// ============================================================
(function() {
  'use strict';

  let lastSubmitTime= 0;
  let danmuVisible= true;
  let filterKeywords= []; // 1.2 扩展：敏感词列表

  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  // ---- 弹幕引擎 ----
  function createDanmuContainer() {
    const container = document.createElement('div');
    container.className = 'danmu-container';
    container.id = 'danmu-container';
    document.body.appendChild(container);
  }

  const trackUsed = []; // 记录每条轨道最后一个弹幕的右边界

  function getTrack() {
    const tracks = DANMU_CONFIG.tracks || 3;
    // 选最空的轨道
    let minIdx= 0;
    let minVal= Infinity;
    for (let i= 0; i < tracks; i++) {
      let val= trackUsed[i] || 0;
      if (val < minVal) { minVal = val; minIdx = i; }
    }
    return minIdx;
  }

  function spawnDanmu(item) {
    const container = document.getElementById('danmu-container');
    if (!container || !danmuVisible) return;

    const el = document.createElement('div');
    el.className = 'danmu-item';

    const nickname = item.nickname || '匿名同学';
    const colors = ['#e74c3c','#d4a574','#e67e22','#8b5e3c','#c0392b','#a0522d','#6d4c41','#b87333'];
    const bgColor = colors[Math.floor(Math.random() * colors.length)];

    el.style.background = bgColor + 'dd';
    el.style.color = '#fff';
    el.textContent = nickname + '：' + item.content;

    const trackIdx = getTrack();
    const trackHeight = 32;
    const topPx = 80 + trackIdx * (trackHeight + 8);
    el.style.top = topPx + 'px';
    el.style.setProperty('--track', trackIdx);

    container.appendChild(el);

    // 动画结束后移除
    const duration = 6 + Math.random() * 4; // 6-10s
    el.style.animationDuration = duration + 's';
    el.addEventListener('animationend', function() {
      el.remove();
    });
  }

  function batchDanmu(list) {
    let shown= JSON.parse(sessionStorage.getItem('dagodui_danmu_shown') || '[]');
    list.forEach(function(item) {
      const id = item.objectId || item.createdAt;
      if (shown.indexOf(id) >= 0) return;
      shown.push(id);
      spawnDanmu(item);
    });
    // 只保留最近 200 条记录
    if (shown.length > 200) shown = shown.slice(-200);
    sessionStorage.setItem('dagodui_danmu_shown', JSON.stringify(shown));
  }

  // ---- 云端拉取 ----
  function fetchMessages() {
    DB.query('Messages').then(function(list) {
      if (list.length > 40) list = list.slice(-40);
      batchDanmu(list);
    }).catch(function() {});
  }

  // ---- 发送留言 ----
  function submitMessage(nickname, content) {
    const now = Date.now();
    if (now - lastSubmitTime < DANMU_CONFIG.cooldown) {
      showToast('太快啦，等' + Math.ceil((DANMU_CONFIG.cooldown - (now - lastSubmitTime)) / 1000) + '秒再发吧～');
      return;
    }

    if (!content || content.trim().length === 0) {
      showToast('写点什么再发送吧～');
      return;
    }

    if (content.length > DANMU_CONFIG.maxLength) {
      showToast('最多' + DANMU_CONFIG.maxLength + '个字哦～');
      return;
    }

    lastSubmitTime = now;

    const msg = {
      nickname: nickname || '匿名同学',
      content: content.trim(),
      createdAt: new Date().toISOString()
    };

    DB.save('Messages', msg).then(function(saved) {
      spawnDanmu(saved);
    }).catch(function() {
      showToast('发送失败，请稍后再试');
    });

    updateCooldownUI();
  }

  // ---- 输入区 UI ----
  function createInputArea() {
    const area = document.createElement('div');
    area.className = 'danmu-input-area';
    area.id = 'danmu-input-area';
    area.innerHTML =
      '<div class="danmu-input-header" id="danmu-input-header">' +
        '💬 发条弹幕留言吧 <span class="danmu-input-arrow">▲</span>' +
      '</div>' +
      '<div class="danmu-input-body" id="danmu-input-body" style="display:none">' +
        '<div class="danmu-input-row">' +
          '<input class="danmu-nickname" id="danmu-nickname" placeholder="你的昵称（选填）" maxlength="10">' +
          '<input class="danmu-content" id="danmu-content" placeholder="想说的话……（≤' + DANMU_CONFIG.maxLength + '字）" maxlength="' + DANMU_CONFIG.maxLength + '">' +
          '<button class="danmu-submit" id="danmu-submit">发送</button>' +
        '</div>' +
        '<div class="danmu-cooldown" id="danmu-cooldown"></div>' +
      '</div>';
    document.body.appendChild(area);

    const header = document.getElementById('danmu-input-header');
    const body = document.getElementById('danmu-input-body');
    const submit = document.getElementById('danmu-submit');
    const contentEl = document.getElementById('danmu-content');
    const nicknameEl = document.getElementById('danmu-nickname');

    header.addEventListener('click', function() {
      const open = body.style.display !== 'none';
      body.style.display = open ? 'none' : 'block';
      header.querySelector('.danmu-input-arrow').textContent = open ? '▲' : '▼';
      if (!open) contentEl.focus();
    });

    submit.addEventListener('click', function() {
      submitMessage(nicknameEl.value.trim(), contentEl.value);
      contentEl.value = '';
    });

    contentEl.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        submitMessage(nicknameEl.value.trim(), contentEl.value);
        contentEl.value = '';
      }
    });

    updateCooldownUI();
  }

  function updateCooldownUI() {
    const cooldownEl = document.getElementById('danmu-cooldown');
    const submitBtn = document.getElementById('danmu-submit');
    if (!cooldownEl || !submitBtn) return;

    const now = Date.now();
    const elapsed = now - lastSubmitTime;
    const remaining = Math.max(0, DANMU_CONFIG.cooldown - elapsed);

    if (remaining > 0) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.5';
      cooldownEl.textContent = '冷却中……' + Math.ceil(remaining / 1000) + '秒后可再发';
      setTimeout(updateCooldownUI, 200);
    } else {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
      cooldownEl.textContent = '';
    }
  }

  // ---- 弹幕开关 ----
  function createToggleBtn() {
    const btn = document.createElement('button');
    btn.className = 'danmu-toggle';
    btn.id = 'danmu-toggle';
    btn.title = '隐藏弹幕';
    btn.textContent = '💬';
    document.body.appendChild(btn);

    const savedVisible = localStorage.getItem('dagodui_danmu_visible');
    if (savedVisible === 'false') {
      danmuVisible = false;
      btn.textContent = '💬';
      btn.classList.add('off');
      const c = document.getElementById('danmu-container');
      if (c) c.style.display = 'none';
    }

    btn.addEventListener('click', function() {
      danmuVisible = !danmuVisible;
      localStorage.setItem('dagodui_danmu_visible', danmuVisible);
      const c = document.getElementById('danmu-container');
      if (c) c.style.display = danmuVisible ? 'block' : 'none';
      btn.textContent = danmuVisible ? '💬' : '💬';
      btn.classList.toggle('off', !danmuVisible);
    });
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
    DB.init();
    createDanmuContainer();
    createInputArea();
    createToggleBtn();
    fetchMessages();
    setInterval(fetchMessages, DANMU_CONFIG.pollInterval);
  });

})();
