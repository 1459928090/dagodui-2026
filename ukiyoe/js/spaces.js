// ============================================================
// 班级浮世绘 — 空间志逻辑
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
      if (btn.dataset.tab === "hideouts") renderHideouts();
    });
  }

  // ========== 座位热力图 ==========
  function renderSeatMap() {
    var grid = document.getElementById("seat-grid");
    if (!grid) return;

    var layout = cfg.seatLayout;
    grid.style.gridTemplateColumns = "repeat(" + layout.cols + ", 56px)";

    // Build lookup: "row-col" -> student name
    var seatLookup = {};
    Object.entries(cfg.seatAssignments).forEach(function(entry) {
      var name = entry[0];
      var pos = entry[1];
      seatLookup[pos.row + "-" + pos.col] = name;
    });

    // Find unassigned students
    var assigned = {};
    Object.values(cfg.seatAssignments).forEach(function(pos) {
      assigned[pos.row + "-" + pos.col] = true;
    });

    var html = "";
    for (var r = 1; r <= layout.rows; r++) {
      for (var c = 1; c <= layout.cols; c++) {
        var key = r + "-" + c;
        var student = seatLookup[key];
        var cls = student ? "seat-cell occupied" : "seat-cell";
        var displayName = student ? student.charAt(student.length - 1) : "";
        html += '<div class="' + cls + '" data-row="' + r + '" data-col="' + c + '" data-student="' + U.hesc(student || "") + '">' +
          '<span class="seat-num">' + r + "-" + c + '</span>' +
          U.hesc(displayName) +
        '</div>';
      }
    }

    grid.innerHTML = html;

    // Click handler
    grid.addEventListener("click", function(e) {
      var cell = e.target.closest(".seat-cell");
      if (!cell) return;
      openSeatModal(cell.dataset.row, cell.dataset.col, cell.dataset.student);
    });
  }

  // ========== 座位弹窗 ==========
  var currentSeatKey = "";
  async function openSeatModal(row, col, student) {
    currentSeatKey = row + "-" + col;
    var modal = document.getElementById("seat-modal");
    document.getElementById("seat-modal-title").textContent = student ?
      student + " 的座位" : "座位 " + currentSeatKey;
    document.getElementById("seat-modal-location").textContent = "第" + row + "排 · 第" + col + "列" +
      (student ? "" : " (空位)");

    // Load memories
    var memories = await DB.query("SeatMemories", function(m) { return m.seatId === currentSeatKey; });
    var list = document.getElementById("seat-memories-list");
    if (memories.length === 0) {
      list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:1rem">这个座位还没有记忆碎片，来添加第一条吧</p>';
    } else {
      list.innerHTML = memories.map(function(m) {
        return '<div class="impression-bubble" style="margin-bottom:0.5rem">' +
          (m.nickname ? '<div style="font-weight:700;margin-bottom:0.3rem">📍 ' + U.hesc(m.nickname) + '</div>' : '') +
          '<div>' + U.hesc(m.memory) + '</div>' +
          '<div class="impression-meta"><span>' + U.hesc(m.author || "匿名") + '</span><span>' + U.timeAgo(m.createdAt) + '</span></div>' +
        '</div>';
      }).join("");
    }

    modal.style.display = "flex";
  }

  // Close modal
  document.addEventListener("DOMContentLoaded", function() {
    var modal = document.getElementById("seat-modal");
    if (!modal) return;
    document.getElementById("seat-modal-close").addEventListener("click", function() { modal.style.display = "none"; });
    modal.addEventListener("click", function(e) { if (e.target === modal) modal.style.display = "none"; });

    // Submit seat memory
    document.getElementById("seat-memory-submit").addEventListener("click", async function() {
      var nickname = document.getElementById("seat-memory-nickname").value.trim();
      var memory = document.getElementById("seat-memory-content").value.trim();
      var author = document.getElementById("seat-memory-author").value.trim() || "匿名同学";

      if (!memory) { showToast("写点记忆内容吧～"); return; }

      await DB.save("SeatMemories", {
        seatId: currentSeatKey,
        location: document.getElementById("seat-modal-location").textContent,
        nickname: nickname,
        memory: memory,
        author: author,
        createdAt: new Date().toISOString()
      });

      document.getElementById("seat-memory-nickname").value = "";
      document.getElementById("seat-memory-content").value = "";
      document.getElementById("seat-memory-author").value = "";
      showToast("座位记忆已添加 🪑");

      // Reopen modal to refresh
      var parts = currentSeatKey.split("-");
      var studentName = "";
      var lookup = cfg.seatAssignments;
      Object.keys(lookup).forEach(function(name) {
        if (lookup[name].row == parts[0] && lookup[name].col == parts[1]) studentName = name;
      });
      await openSeatModal(parseInt(parts[0]), parseInt(parts[1]), studentName);
    });
  });

  // ========== 秘密据点 ==========
  var hideoutsRendered = false;
  async function renderHideouts() {
    if (hideoutsRendered) return;
    hideoutsRendered = true;

    var grid = document.getElementById("hideout-grid");
    if (!grid) return;

    // Get DB submissions
    var dbHideouts = await DB.query("Hideouts");

    var allHideouts = cfg.hideouts.concat(dbHideouts.map(function(h) {
      return { id: h.objectId, name: h.name, location: h.location, story: h.story, image: h.imageUrl || "", fromDB: true };
    }));

    grid.innerHTML = allHideouts.map(function(h) {
      return '<div class="card hideout-card">' +
        (h.image ? '<img class="hideout-image" src="' + U.hesc(h.image) + '" alt="' + U.hesc(h.name) + '" onerror="this.style.display=\'none\'">' : '') +
        '<div class="hideout-body">' +
          '<div class="hideout-name">📍 ' + U.hesc(h.name) + '</div>' +
          '<div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:0.6rem">' + U.hesc(h.location) + '</div>' +
          '<div class="hideout-story">' + U.hesc(h.story) + '</div>' +
          (h.fromDB ? '<div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.5rem">— 同学投稿</div>' : '') +
        '</div>' +
      '</div>';
    }).join("");
  }

  // Submit hideout
  document.addEventListener("DOMContentLoaded", function() {
    var submitBtn = document.getElementById("new-hideout-submit");
    if (!submitBtn) return;
    submitBtn.addEventListener("click", async function() {
      var name = document.getElementById("new-hideout-name").value.trim();
      var location = document.getElementById("new-hideout-location").value.trim();
      var story = document.getElementById("new-hideout-story").value.trim();
      var imageUrl = document.getElementById("new-hideout-image").value.trim();

      if (!name || !story) { showToast("至少填上名字和故事吧～"); return; }

      await DB.save("Hideouts", {
        name: name,
        location: location || "未指定位置",
        story: story,
        imageUrl: imageUrl,
        contributor: localStorage.getItem("ukiyoe_nickname") || "匿名同学",
        createdAt: new Date().toISOString()
      });

      document.getElementById("new-hideout-name").value = "";
      document.getElementById("new-hideout-location").value = "";
      document.getElementById("new-hideout-story").value = "";
      document.getElementById("new-hideout-image").value = "";
      showToast("新据点已标记 🗺");

      hideoutsRendered = false;
      await renderHideouts();
    });
  });

  // ========== Init ==========
  document.addEventListener("DOMContentLoaded", function() {
    setupTabs();
    renderSeatMap();
  });

})();
