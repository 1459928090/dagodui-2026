// ============================================================
// 班级浮世绘 — 空间志逻辑
// ============================================================

(function() {
  const cfg = UKIYOE_CONFIG;

  // ========== Tab 切换 ==========
  function setupTabs() {
    document.getElementById("main-tabs").addEventListener("click", function(e) {
      const btn = e.target.closest(".tab-btn");
      if (!btn) return;
      this.querySelectorAll(".tab-btn").forEach(function(b) { b.classList.remove("active"); });
      btn.classList.add("active");
      const tabId = "tab-" + btn.dataset.tab;
      document.querySelectorAll(".tab-panel").forEach(function(p) { p.classList.remove("active"); });
      const panel = document.getElementById(tabId);
      if (panel) panel.classList.add("active");
      if (btn.dataset.tab === "hideouts") renderHideouts();
    });
  }

  // ========== 座位热力图 ==========
  // 视觉分组：左3列 | 过道 | 中3列 | 过道 | 右2列
  async function renderSeatMap() {
    const grid = document.getElementById("seat-grid");
    if (!grid) return;

    const layout = cfg.seatLayout; // { rows: 6, cols: 8 }
    const cellW = 52;
    const aisleW = 22;
    grid.style.gridTemplateColumns = [
      "repeat(3, " + cellW + "px)",
      aisleW + "px",
      "repeat(3, " + cellW + "px)",
      aisleW + "px",
      "repeat(2, " + cellW + "px)"
    ].join(" ");
    grid.style.gap = "4px";

    // col -> grid-column: 1→1, 2→2, 3→3, 4→5, 5→6, 6→7, 7→9, 8→10
    const colToGrid = { 1:1, 2:2, 3:3, 4:5, 5:6, 6:7, 7:9, 8:10 };

    // Build student lookup
    const seatLookup = {};
    Object.entries(cfg.seatAssignments).forEach(function(entry) {
      const name = entry[0];
      const pos = entry[1];
      seatLookup[pos.row + "-" + pos.col] = name;
    });

    // Load memory heat data
    const allMemories = await DB.query("SeatMemories");
    const heatMap = {};
    let maxCount = 1;
    allMemories.forEach(function(m) {
      heatMap[m.seatId] = (heatMap[m.seatId] || 0) + 1;
      if (heatMap[m.seatId] > maxCount) maxCount = heatMap[m.seatId];
    });

    // Build group label bar (outside grid)
    const labelBar = document.getElementById("seat-group-labels");
    if (labelBar) {
      labelBar.innerHTML =
        '<span style="width:' + (cellW * 3 + 12) + 'px;text-align:center">左组</span>' +
        '<span style="width:' + aisleW + 'px"></span>' +
        '<span style="width:' + (cellW * 3 + 12) + 'px;text-align:center">中组</span>' +
        '<span style="width:' + aisleW + 'px"></span>' +
        '<span style="width:' + (cellW * 2 + 8) + 'px;text-align:center">右组</span>';
    }

    // Build grid cells only (no labels inside)
    let html = "";
    for (let r = 1; r <= layout.rows; r++) {
      for (let c = 1; c <= layout.cols; c++) {
        const key = r + "-" + c;
        const student = seatLookup[key];
        const count = heatMap[key] || 0;
        const cls = student ? "seat-cell occupied" : "seat-cell";

        let bgColor = "var(--gold-light)";
        let textColor = "var(--text-muted)";
        if (student && count > 0) {
          const intensity = count / maxCount;
          const r_val = Math.round(232 - intensity * 72);
          const g_val = Math.round(168 - intensity * 118);
          const b_val = Math.round(124 - intensity * 112);
          bgColor = "rgb(" + r_val + "," + g_val + "," + b_val + ")";
          textColor = intensity > 0.45 ? "#fff" : "var(--text)";
        }

        const gridCol = colToGrid[c];
        const title = student
          ? U.hesc(student) + (count > 0 ? ' · ' + count + '条记忆' : ' · 暂无记忆')
          : '空位';

        html += '<div class="' + cls + '"' +
          ' data-row="' + r + '" data-col="' + c + '" data-student="' + U.hesc(student || "") + '"' +
          ' style="background:' + bgColor + ';color:' + textColor + ';grid-column:' + gridCol + ';grid-row:' + r + '"' +
          ' title="' + title + '">' +
          '<span class="seat-num">' + key + '</span>' +
          (count > 0 ? '<span class="seat-count">' + count + '</span>' : '') +
        '</div>';
      }
    }

    grid.innerHTML = html;

    // Legend max
    const legendMax = document.getElementById("heat-legend-max");
    if (legendMax) legendMax.textContent = maxCount + "条记忆";

    // Click → modal
    grid.addEventListener("click", function(e) {
      const cell = e.target.closest(".seat-cell");
      if (!cell) return;
      openSeatModal(cell.dataset.row, cell.dataset.col, cell.dataset.student);
    });
  }

  // ========== 座位弹窗 ==========
  let currentSeatKey = "";
  async function openSeatModal(row, col, student) {
    currentSeatKey = row + "-" + col;
    const modal = document.getElementById("seat-modal");
    document.getElementById("seat-modal-title").textContent = "座位 " + row + "-" + col;
    document.getElementById("seat-modal-location").textContent = "第" + row + "排 · 第" + col + "列" +
      (student ? "  |  此座有人" : "  |  空位");

    // Load memories
    const memories = await DB.query("SeatMemories", function(m) { return m.seatId === currentSeatKey; });
    const list = document.getElementById("seat-memories-list");
    if (memories.length === 0) {
      list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:1rem">这个座位还没有记忆碎片，来添加第一条吧</p>';
    } else {
      list.innerHTML = memories.map(function(m) {
        var studentBadge = m.studentName
          ? '<span style="display:inline-block;background:var(--primary);color:#fff;padding:2px 10px;border-radius:12px;font-size:0.82rem;font-weight:600;margin-bottom:0.3rem">' + U.hesc(m.studentName) + ' 坐过这里</span>'
          : '';
        return '<div class="impression-bubble" style="margin-bottom:0.5rem">' +
          studentBadge +
          '<div style="margin-top:0.3rem">' + U.hesc(m.memory) + '</div>' +
          '<div class="impression-meta"><span>' + U.hesc(m.author || "匿名") + '</span><span>' + U.timeAgo(m.createdAt) + '</span></div>' +
        '</div>';
      }).join("");
    }

    modal.style.display = "flex";
  }

  // Close modal
  document.addEventListener("DOMContentLoaded", function() {
    const modal = document.getElementById("seat-modal");
    if (!modal) return;
    document.getElementById("seat-modal-close").addEventListener("click", function() { modal.style.display = "none"; });
    modal.addEventListener("click", function(e) { if (e.target === modal) modal.style.display = "none"; });

    // Submit seat memory
    document.getElementById("seat-memory-submit").addEventListener("click", async function() {
      const studentName = document.getElementById("seat-memory-student").value.trim();
      const memory = document.getElementById("seat-memory-content").value.trim();
      const author = document.getElementById("seat-memory-author").value.trim() || "匿名同学";

      if (!memory) { showToast("写点记忆内容吧～"); return; }

      await DB.save("SeatMemories", {
        seatId: currentSeatKey,
        location: document.getElementById("seat-modal-location").textContent,
        studentName: studentName,
        memory: memory,
        author: author,
        createdAt: new Date().toISOString()
      });

      document.getElementById("seat-memory-student").value = "";
      document.getElementById("seat-memory-content").value = "";
      document.getElementById("seat-memory-author").value = "";
      showToast("座位记忆已添加 🪑");

      // Reopen modal to refresh
      const parts = currentSeatKey.split("-");
      let occupant = "";
      const lookup = cfg.seatAssignments;
      Object.keys(lookup).forEach(function(name) {
        if (lookup[name].row == parts[0] && lookup[name].col == parts[1]) occupant = name;
      });
      await openSeatModal(parseInt(parts[0]), parseInt(parts[1]), occupant);
    });
  });

  // ========== 秘密据点 ==========
  let hideoutsRendered = false;
  async function renderHideouts() {
    if (hideoutsRendered) return;
    hideoutsRendered = true;

    const grid = document.getElementById("hideout-grid");
    if (!grid) return;

    // Get DB submissions
    const dbHideouts = await DB.query("Hideouts");

    const allHideouts = cfg.hideouts.concat(dbHideouts.map(function(h) {
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
    const submitBtn = document.getElementById("new-hideout-submit");
    if (!submitBtn) return;
    submitBtn.addEventListener("click", async function() {
      const name = document.getElementById("new-hideout-name").value.trim();
      const location = document.getElementById("new-hideout-location").value.trim();
      const story = document.getElementById("new-hideout-story").value.trim();
      const imageUrl = document.getElementById("new-hideout-image").value.trim();

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
