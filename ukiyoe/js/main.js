// ============================================================
// 班级浮世绘 — 共享工具函数 & 全局UI
// ============================================================

(function() {

  // ---- Toast ----
  window.showToast = function(msg, duration) {
    duration = duration || 2000;
    var el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function() { el.remove(); }, duration);
  };

  // ---- Back to top ----
  function setupBackTop() {
    var btn = document.getElementById("back-top");
    if (!btn) return;
    window.addEventListener("scroll", function() {
      if (window.scrollY > 400) btn.classList.add("visible");
      else btn.classList.remove("visible");
    });
    btn.addEventListener("click", function() { window.scrollTo({ top: 0, behavior: "smooth" }); });
  }

  // ---- Nav toggle (mobile) ----
  function setupNav() {
    var toggle = document.querySelector(".nav-toggle");
    var links = document.querySelector(".nav-links");
    if (!toggle || !links) return;
    toggle.addEventListener("click", function() {
      links.classList.toggle("open");
    });
  }

  // ---- 那年今日 Ticker ----
  window.setupTicker = async function() {
    var wrap = document.getElementById("ticker-wrap");
    if (!wrap) return;
    var track = wrap.querySelector(".ticker-track");
    if (!track) return;

    var today = new Date();
    var mmdd = String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");

    // Get preset events matching today's MM-DD
    var presets = UKIYOE_CONFIG.presetTimeline.filter(function(e) { return e.date === mmdd; });

    // Get user-submitted events from DB
    var userEvents = [];
    try {
      userEvents = await DB.query("Timeline", function(e) { return e.date === mmdd; });
    } catch(e) {}

    var allEvents = presets.concat(userEvents);

    if (allEvents.length === 0) {
      track.innerHTML = "<span>📜 那年今日 · 暂无记录 · 等待你来书写第一个回忆</span>";
      return;
    }

    // Duplicate for seamless loop
    var html = "";
    for (var d = 0; d < 2; d++) {
      for (var i = 0; i < allEvents.length; i++) {
        var ev = allEvents[i];
        html += "<span><span class='ticker-date'>" + ev.year + "年今天</span> " + U.hesc(ev.content) + "</span>";
        if (i < allEvents.length - 1 || d === 0) html += " <span style='margin:0 0.5rem'>·</span> ";
      }
    }
    track.innerHTML = html;
  };

  // ---- Get URL param ----
  window.getParam = function(name) {
    var m = location.search.match(new RegExp("[?&]" + name + "=([^&]*)"));
    return m ? decodeURIComponent(m[1]) : null;
  };

  // ---- Escape HTML ----
  var U = window.U = {
    hesc: function(s) {
      var d = document.createElement("div");
      d.textContent = s;
      return d.innerHTML;
    },
    timeAgo: function(dateStr) {
      var diff = Date.now() - new Date(dateStr).getTime();
      var mins = Math.floor(diff / 60000);
      if (mins < 1) return "刚刚";
      if (mins < 60) return mins + "分钟前";
      var hours = Math.floor(mins / 60);
      if (hours < 24) return hours + "小时前";
      var days = Math.floor(hours / 24);
      if (days < 30) return days + "天前";
      return new Date(dateStr).toLocaleDateString("zh-CN");
    },
    fmtDate: function(dateStr) {
      var d = new Date(dateStr);
      return d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日";
    }
  };

  // ---- Init ----
  document.addEventListener("DOMContentLoaded", function() {
    DB.init();
    setupNav();
    setupBackTop();
  });

})();
