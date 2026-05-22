// ============================================================
// 班级浮世绘 — 共享工具函数 & 全局UI
// ============================================================

(function() {

  // ---- Toast ----
  window.showToast = function(msg, duration) {
    duration = duration || 2000;
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function() { el.remove(); }, duration);
  };

  // ---- Back to top ----
  function setupBackTop() {
    const btn = document.getElementById("back-top");
    if (!btn) return;
    window.addEventListener("scroll", function() {
      if (window.scrollY > 400) btn.classList.add("visible");
      else btn.classList.remove("visible");
    });
    btn.addEventListener("click", function() { window.scrollTo({ top: 0, behavior: "smooth" }); });
  }

  // ---- Nav toggle (mobile) ----
  function setupNav() {
    const toggle = document.querySelector(".nav-toggle");
    const links = document.querySelector(".nav-links");
    if (!toggle || !links) return;
    toggle.addEventListener("click", function() {
      links.classList.toggle("open");
    });
  }

  // ---- 那年今日 Ticker ----
  window.setupTicker = async function() {
    const wrap = document.getElementById("ticker-wrap");
    if (!wrap) return;
    const track = wrap.querySelector(".ticker-track");
    if (!track) return;

    const today = new Date();
    const mmdd = String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");

    // Get preset events matching today's MM-DD
    const presets = UKIYOE_CONFIG.presetTimeline.filter(function(e) { return e.date === mmdd; });

    // Get user-submitted events from DB
    let userEvents = [];
    try {
      userEvents = await DB.query("Timeline", function(e) { return e.date === mmdd; });
    } catch(e) {}

    const allEvents = presets.concat(userEvents);

    if (allEvents.length === 0) {
      track.innerHTML = "<span>📜 那年今日 · 暂无记录 · 等待你来书写第一个回忆</span>";
      return;
    }

    // Duplicate for seamless loop
    let html = "";
    for (let d = 0; d < 2; d++) {
      for (let i = 0; i < allEvents.length; i++) {
        const ev = allEvents[i];
        html += "<span><span class='ticker-date'>" + ev.year + "年今天</span> " + U.hesc(ev.content) + "</span>";
        if (i < allEvents.length - 1 || d === 0) html += " <span style='margin:0 0.5rem'>·</span> ";
      }
    }
    track.innerHTML = html;
  };

  // ---- Get URL param ----
  window.getParam = function(name) {
    const m = location.search.match(new RegExp("[?&]" + name + "=([^&]*)"));
    return m ? decodeURIComponent(m[1]) : null;
  };

  // ---- Escape HTML ----
  const U = window.U = {
    hesc: function(s) {
      const d = document.createElement("div");
      d.textContent = s;
      return d.innerHTML;
    },
    timeAgo: function(dateStr) {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "刚刚";
      if (mins < 60) return mins + "分钟前";
      const hours = Math.floor(mins / 60);
      if (hours < 24) return hours + "小时前";
      const days = Math.floor(hours / 24);
      if (days < 30) return days + "天前";
      return new Date(dateStr).toLocaleDateString("zh-CN");
    },
    fmtDate: function(dateStr) {
      const d = new Date(dateStr);
      return d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日";
    }
  };

  // ---- Scroll Reveal ----
  function setupScrollReveal() {
    if (!("IntersectionObserver" in window)) return;

    const revealEls = document.querySelectorAll(
      ".dim-card, .section-inner, .card, .artifact-card, .hideout-card, .award-card, .slang-card, .student-card, .stats-dash, .random-picker, .page-hero"
    );

    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal");
          // Small delay stagger for grid children
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

    revealEls.forEach(function(el, i) {
      el.classList.add("reveal");
      // Stagger by index modulo
      const mod = i % 5;
      if (mod > 0) el.classList.add("reveal-delay-" + mod);
      observer.observe(el);
    });
  }

  // ---- Init ----
  document.addEventListener("DOMContentLoaded", function() {
    DB.init();
    setupNav();
    setupBackTop();
    setupScrollReveal();
  });

})();
