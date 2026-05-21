// ============================================================
// 班级浮世绘 — 时间线逻辑
// ============================================================

(function() {
  var cfg = UKIYOE_CONFIG;

  // ========== Tab 切换 ==========
  function setupTabs() {
    document.getElementById("main-tabs").addEventListener("click", function(e) {
      var btn = e.target.closest(".tab-btn");
      if (!btn) return;
      this.querySelectorAll(".tab-btn").forEach(function(b) { b.classList.remove("active"); });
      btn.classList.add("active");
      var tabId = "tab-" + btn.dataset.tab;
      document.querySelectorAll(".tab-panel").forEach(function(p) { p.classList.remove("active"); });
      var panel = document.getElementById(tabId);
      if (panel) panel.classList.add("active");
      if (btn.dataset.tab === "mood") renderMoodStation();
    });
  }

  // ========== 那年今日 ==========
  function renderOnThisDay() {
    var today = new Date();
    var mmdd = String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
    var weekdays = ["日", "一", "二", "三", "四", "五", "六"];
    var todayStr = today.getFullYear() + "年" + (today.getMonth() + 1) + "月" + today.getDate() + "日 星期" + weekdays[today.getDay()];

    var label = document.getElementById("today-label");
    if (label) label.textContent = "📅 " + todayStr;

    var tl = document.getElementById("on-this-day-timeline");
    if (!tl) return;

    var presets = cfg.presetTimeline.filter(function(e) { return e.date === mmdd; });

    // Also fetch from DB
    DB.query("Timeline", function(e) { return e.date === mmdd; }).then(function(dbEvents) {
      var all = presets.concat(dbEvents);
      if (all.length === 0) {
        tl.innerHTML = '<div class="empty-state"><span class="empty-icon">📜</span><p>今天还没有历史记忆<br>提交一条，让明年的今天有人看到！</p></div>';
        return;
      }
      all.sort(function(a, b) { return b.year - a.year; });
      tl.innerHTML = all.map(function(ev) {
        return '<div class="timeline-item">' +
          '<div class="timeline-date">' + ev.year + '年</div>' +
          '<div class="timeline-title">' + (ev.type === "personal" ? "📌 个人记忆" : "📅 班级事件") + '</div>' +
          '<div class="timeline-desc">' + U.hesc(ev.content) + '</div>' +
          (ev.author && ev.author !== "系统" ? '<div style="font-size:0.75rem;color:var(--text-muted)">— ' + U.hesc(ev.author) + '</div>' : '') +
        '</div>';
      }).join("");
    });
  }

  // Submit event
  document.addEventListener("DOMContentLoaded", function() {
    var submitBtn = document.getElementById("event-submit");
    if (!submitBtn) return;
    submitBtn.addEventListener("click", async function() {
      var dateVal = document.getElementById("event-date").value;
      var typeVal = document.getElementById("event-type").value;
      var content = document.getElementById("event-content").value.trim();
      var author = document.getElementById("event-author").value.trim() || "匿名同学";

      if (!dateVal) { showToast("请选择一个日期"); return; }
      if (!content) { showToast("写点什么吧～"); return; }

      var parts = dateVal.split("-");
      var mmdd = parts[1] + "-" + parts[2];
      var year = parseInt(parts[0]);

      await DB.save("Timeline", {
        date: mmdd,
        year: year,
        content: content,
        type: typeVal,
        author: author,
        createdAt: new Date().toISOString()
      });

      document.getElementById("event-date").value = "";
      document.getElementById("event-content").value = "";
      document.getElementById("event-author").value = "";
      showToast("时间线条目已记录 📜");

      // Refresh
      renderOnThisDay();
    });
  });

  // ========== 心情气象站 ==========
  var moodRendered = false;
  var selectedMood = null;

  async function renderMoodStation() {
    if (moodRendered) return;
    moodRendered = true;

    var voterName = localStorage.getItem("ukiyoe_nickname") || "anonymous";

    // Check if already voted today
    var alreadyVoted = await DB.hasTodayRecord("MoodVotes", voterName);

    // Render mood buttons
    var btnContainer = document.getElementById("mood-buttons");
    if (btnContainer) {
      btnContainer.innerHTML = cfg.moodOptions.map(function(m) {
        return '<button class="mood-btn' + (alreadyVoted ? ' selected' : '') + '" data-mood="' + m.value + '" style="cursor:' + (alreadyVoted ? 'default' : 'pointer') + '" title="' + m.label + '">' +
          m.emoji + '<span class="mood-label">' + m.label + '</span>' +
        '</button>';
      }).join("");

      if (alreadyVoted) {
        btnContainer.style.opacity = "0.7";
      }

      // Click handler
      if (!alreadyVoted) {
        btnContainer.querySelectorAll(".mood-btn").forEach(function(btn) {
          btn.addEventListener("click", function() {
            selectedMood = this.dataset.mood;
            btnContainer.querySelectorAll(".mood-btn").forEach(function(b) { b.classList.remove("selected"); });
            this.classList.add("selected");
            document.getElementById("mood-message-area").style.display = "block";
          });
        });
      }
    }

    // Submit mood + message
    var msgSubmit = document.getElementById("mood-message-submit");
    if (msgSubmit) {
      msgSubmit.addEventListener("click", async function() {
        if (!selectedMood) { showToast("请先选择心情"); return; }
        var msg = document.getElementById("mood-message").value.trim();

        await DB.save("MoodVotes", {
          date: new Date().toISOString().slice(0, 10),
          mood: selectedMood,
          message: msg,
          author: voterName,
          createdAt: new Date().toISOString()
        });

        document.getElementById("mood-message-area").style.display = "none";
        document.getElementById("mood-message").value = "";
        showToast("心情已记录 🌈");

        // Refresh
        moodRendered = false;
        await renderMoodStation();
      });
    }

    // Today's stats
    var today = new Date().toISOString().slice(0, 10);
    var todayVotes = await DB.query("MoodVotes", function(v) { return v.date === today; });
    renderTodayStats(todayVotes);

    // Week trend
    await renderWeekChart();

    // Recent messages
    renderMessages(todayVotes);
  }

  function renderTodayStats(todayVotes) {
    var container = document.getElementById("today-stats");
    if (!container) return;

    if (todayVotes.length === 0) {
      container.innerHTML = '<span style="font-size:0.9rem;color:var(--text-muted)">今天还没有人投票</span>';
      return;
    }

    var tally = {};
    todayVotes.forEach(function(v) { tally[v.mood] = (tally[v.mood] || 0) + 1; });

    container.innerHTML = cfg.moodOptions.map(function(m) {
      var count = tally[m.value] || 0;
      if (count === 0) return "";
      return '<span style="padding:0.4rem 0.8rem;background:var(--bg-card);border:1px solid var(--border);border-radius:20px;font-size:0.85rem">' +
        m.emoji + ' x' + count + '</span>';
    }).join("");
  }

  async function renderWeekChart() {
    var chart = document.getElementById("mood-chart");
    if (!chart) return;

    // Get last 7 days
    var days = [];
    for (var i = 6; i >= 0; i--) {
      var d = new Date(Date.now() - i * 86400000);
      days.push(d.toISOString().slice(0, 10));
    }

    // Get all votes in range
    var votes = await DB.query("MoodVotes", function(v) { return days.indexOf(v.date) >= 0; });

    // Tally by day and mood
    var byDay = {};
    days.forEach(function(d) { byDay[d] = {}; });
    votes.forEach(function(v) {
      byDay[v.date] = byDay[v.date] || {};
      byDay[v.date][v.mood] = (byDay[v.date][v.mood] || 0) + 1;
    });

    var maxCount = 1;
    days.forEach(function(d) {
      var sum = Object.values(byDay[d]).reduce(function(a, b) { return a + b; }, 0);
      if (sum > maxCount) maxCount = sum;
    });

    var colors = { sunny: "#e8a87c", cloudy: "#b0b8c0", rainy: "#8b9dc3", stormy: "#6d7b8d", rainbow: "#a0c5a0" };

    chart.innerHTML = days.map(function(d, idx) {
      var dayData = byDay[d];
      var sum = Object.values(dayData).reduce(function(a, b) { return a + b; }, 0);
      var h = sum > 0 ? Math.max(15, (sum / maxCount) * 160) : 4;
      var color = sum > 0 ? "#c75b39" : "#e0d5c8";
      var label = d.slice(5); // MM-DD
      return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">' +
        '<div class="bar" style="height:' + h + 'px;background:' + color + '" title="' + d + ': ' + sum + '票"></div>' +
        '<span style="font-size:0.6rem;color:var(--text-muted);writing-mode:vertical-lr">' + label + '</span>' +
      '</div>';
    }).join("");
  }

  function renderMessages(todayVotes) {
    var list = document.getElementById("mood-messages-list");
    if (!list) return;

    var withMsg = todayVotes.filter(function(v) { return v.message; });
    if (withMsg.length === 0) {
      list.innerHTML = '<p style="text-align:center;color:var(--text-muted);font-size:0.9rem">今日暂无留言</p>';
      return;
    }

    list.innerHTML = withMsg.map(function(v) {
      var moodInfo = cfg.moodOptions.find(function(m) { return m.value === v.mood; }) || {};
      return '<div class="card" style="margin-bottom:0.5rem;display:flex;align-items:center;gap:0.8rem">' +
        '<span style="font-size:1.5rem">' + (moodInfo.emoji || "🌤") + '</span>' +
        '<div style="flex:1">' +
          '<div style="font-size:0.9rem">' + U.hesc(v.message) + '</div>' +
          '<div style="font-size:0.75rem;color:var(--text-muted)">— ' + U.hesc(v.author || "匿名") + '</div>' +
        '</div>' +
      '</div>';
    }).join("");
  }

  // ========== Init ==========
  document.addEventListener("DOMContentLoaded", function() {
    setupTabs();
    renderOnThisDay();
  });

})();
