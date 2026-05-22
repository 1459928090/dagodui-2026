// ============================================================
// 班级浮世绘 — 人物群像逻辑
// ============================================================

(function() {
  const cfg = UKIYOE_CONFIG;

  // ========== 当前浏览的学生 ==========
  let currentStudent = null;

  // ========== Tab 切换 ==========
  function setupTabs() {
    document.getElementById("main-tabs").addEventListener("click", function(e) {
      const btn = e.target.closest(".tab-btn");
      if (!btn) return;

      // Activate tab button
      this.querySelectorAll(".tab-btn").forEach(function(b) { b.classList.remove("active"); });
      btn.classList.add("active");

      // Show panel
      const tabId = "tab-" + btn.dataset.tab;
      document.querySelectorAll(".tab-panel").forEach(function(p) { p.classList.remove("active"); });
      const panel = document.getElementById(tabId);
      if (panel) panel.classList.add("active");

      // Trigger lazy load
      if (btn.dataset.tab === "awards") renderAwards();
      if (btn.dataset.tab === "desks") renderAllDeskTimeline();
    });
  }

  // ========== 学生列表 ==========
  function renderStudentGrid() {
    const grid = document.getElementById("student-grid");
    if (!grid) return;
    grid.innerHTML = cfg.students.map(function(name, idx) {
      const initials = name.charAt(name.length - 1);
      return '<div class="student-card" data-student="' + U.hesc(name) + '" role="button" tabindex="0">' +
        '<div class="student-avatar">' + U.hesc(initials) + '</div>' +
        '<div class="student-name">' + U.hesc(name) + '</div>' +
      '</div>';
    }).join("");

    grid.addEventListener("click", function(e) {
      const card = e.target.closest(".student-card");
      if (!card) return;
      showStudentDetail(card.dataset.student);
    });

    // Check hash for direct student link
    const hashStudent = getParam("student");
    if (hashStudent) showStudentDetail(hashStudent);
  }

  // ========== 学生详情视图 ==========
  async function showStudentDetail(name) {
    currentStudent = name;
    document.getElementById("student-list-view").style.display = "none";
    document.getElementById("student-detail-view").style.display = "block";
    document.getElementById("detail-avatar").textContent = name.charAt(name.length - 1);
    document.getElementById("detail-name").textContent = name;

    // Update URL
    if (history.pushState) {
      history.pushState(null, "", "?student=" + encodeURIComponent(name));
    }

    await Promise.all([loadImpressions(name), loadDeskTimelineForStudent(name)]);
  }

  function showStudentList() {
    currentStudent = null;
    document.getElementById("student-list-view").style.display = "block";
    document.getElementById("student-detail-view").style.display = "none";
    if (history.pushState) history.pushState(null, "", "characters.html");
  }

  document.addEventListener("DOMContentLoaded", function() {
    const backBtn = document.getElementById("back-to-list");
    if (backBtn) backBtn.addEventListener("click", showStudentList);

    // Handle browser back
    window.addEventListener("popstate", function() {
      const s = getParam("student");
      if (s) showStudentDetail(s);
      else showStudentList();
    });
  });

  // ========== 印象碎片 ==========
  async function loadImpressions(studentName) {
    const list = document.getElementById("impression-list");
    const countEl = document.getElementById("detail-count");
    if (!list) return;

    const impressions = await DB.query("Impressions", function(imp) {
      return imp.targetStudent === studentName;
    });
    // Shuffle for warmth
    impressions.sort(function() { return Math.random() - 0.5; });

    countEl.textContent = impressions.length;

    if (impressions.length === 0) {
      list.innerHTML = '<div class="empty-state"><span class="empty-icon">💬</span><p>还没有关于TA的印象碎片<br>成为第一个写下的人吧</p></div>';
    } else {
      list.innerHTML = impressions.map(function(imp) {
        const authorName = imp.author || "匿名同学";
        return '<div class="impression-bubble">' +
          '<div class="impression-content">' + U.hesc(imp.content) + '</div>' +
          '<div class="impression-meta">' +
            '<span>' + U.hesc(authorName) + '</span>' +
            '<span>' + U.timeAgo(imp.createdAt) + '</span>' +
            '<button class="like-btn" data-id="' + imp.objectId + '" data-likes="' + (imp.likes || 0) + '">' +
              '❤ ' + (imp.likes || 0) +
            '</button>' +
          '</div>' +
        '</div>';
      }).join("");

      // Like buttons
      list.querySelectorAll(".like-btn").forEach(function(btn) {
        btn.addEventListener("click", async function() {
          const id = this.dataset.id;
          const likes = parseInt(this.dataset.likes) + 1;
          this.dataset.likes = likes;
          this.textContent = "❤ " + likes;
          this.classList.add("liked");
          this.disabled = true;
          await DB.update("Impressions", id, { likes: likes });
        });
      });
    }
  }

  // Submit impression
  document.addEventListener("DOMContentLoaded", function() {
    const submitBtn = document.getElementById("impression-submit");
    if (!submitBtn) return;

    submitBtn.addEventListener("click", async function() {
      const input = document.getElementById("impression-input");
      const authorInput = document.getElementById("impression-author");
      const content = input.value.trim();

      if (!currentStudent) { showToast("请先选择一个同学"); return; }
      if (content.length < 10) { showToast("至少写10个字吧，多说点细节～"); return; }
      if (content.length > 100) { showToast("太长了，控制在100字以内吧"); return; }

      const badPatterns = ["乐于助人", "学习认真", "团结同学", "尊敬师长"];
      const hasBad = badPatterns.some(function(p) { return content.includes(p); });
      if (hasBad && content.length < 30) {
        showToast("写得再具体一点吧～想想那件让你记住TA的小事");
        return;
      }

      const author = authorInput.value.trim() || "匿名同学";
      // Save nickname for mood
      if (author !== "匿名同学") localStorage.setItem("ukiyoe_nickname", author);

      await DB.save("Impressions", {
        targetStudent: currentStudent,
        content: content,
        author: author,
        likes: 0,
        createdAt: new Date().toISOString()
      });

      input.value = "";
      showToast("印象碎片已投递给 " + currentStudent + " ✨");
      await loadImpressions(currentStudent);
    });
  });

  // ========== 趣味之最 ==========
  let awardsRendered = false;
  async function renderAwards() {
    if (awardsRendered) return;
    awardsRendered = true;

    const grid = document.getElementById("award-grid");
    if (!grid) return;

    // Load custom awards from DB and merge with presets
    const customAwards = await DB.query("CustomAwards");
    const allAwards = cfg.funAwards.concat(customAwards.map(function(a) {
      return { id: a.objectId, title: a.title, icon: a.icon || "✨" };
    }));

    // Fetch nominations from DB
    const nominations = await DB.query("FunAwards");

    grid.innerHTML = allAwards.map(function(award) {
      // Find nominations for this award
      const noms = nominations.filter(function(n) { return n.title === award.title; });

      let evidenceHtml = "";
      if (noms.length > 0) {
        // Count votes per nominee
        const tally = {};
        noms.forEach(function(n) { tally[n.nominee] = (tally[n.nominee] || 0) + 1; });
        const sorted = Object.entries(tally).sort(function(a, b) { return b[1] - a[1]; });
        const winner = sorted[0][0];
        const bestEvidence = noms.find(function(n) { return n.nominee === winner && n.evidence; });
        evidenceHtml = '<div class="award-winner">' + U.hesc(winner) + '</div>' +
          (bestEvidence ? '<div class="award-evidence">"' + U.hesc(bestEvidence.evidence) + '"</div>' : '');
      } else {
        evidenceHtml = '<div style="color:var(--text-muted);font-size:0.85rem;margin-top:0.5rem">还没有提名，快来第一个吧</div>';
      }

      var descHtml = award.desc
        ? '<div class="award-evidence" style="font-style:normal;color:var(--text-light);margin-top:0.3rem">' + U.hesc(award.desc) + '</div>'
        : '';

      return '<div class="award-card">' +
        '<div style="font-size:2rem;margin-bottom:0.5rem">' + award.icon + '</div>' +
        '<div class="award-title">' + U.hesc(award.title) + '</div>' +
        descHtml +
        evidenceHtml +
        '<button class="btn btn-ghost btn-sm" style="margin-top:0.5rem" data-award="' + U.hesc(award.title) + '" data-action="nominate">提名TA →</button>' +
      '</div>';
    }).join("");

    // Setup nomination buttons
    setupNomination(nominations);
  }

  // ========== 提名弹窗 ==========
  function setupNomination(nominations) {
    const modal = document.getElementById("nominate-modal");
    const titleText = document.getElementById("nominate-title-text");
    const studentSelect = document.getElementById("nominate-student");
    const evidenceInput = document.getElementById("nominate-evidence");
    let currentAwardTitle = "";

    // Fill student options
    studentSelect.innerHTML = '<option value="">选择同学……</option>' +
      cfg.students.map(function(s) { return '<option value="' + U.hesc(s) + '">' + U.hesc(s) + '</option>'; }).join("");

    // Open modal
    document.getElementById("award-grid").addEventListener("click", function(e) {
      const btn = e.target.closest("[data-action='nominate']");
      if (!btn) return;
      currentAwardTitle = btn.dataset.award;
      titleText.textContent = currentAwardTitle;
      modal.style.display = "flex";
    });

    // Close
    document.getElementById("nominate-close").addEventListener("click", function() {
      modal.style.display = "none";
    });
    modal.addEventListener("click", function(e) {
      if (e.target === modal) modal.style.display = "none";
    });

    // Submit
    document.getElementById("nominate-submit").addEventListener("click", async function() {
      const student = studentSelect.value;
      const evidence = evidenceInput.value.trim();
      if (!student) { showToast("请选择一位同学"); return; }
      if (!evidence) { showToast("写上证据会更有说服力哦～"); return; }

      await DB.save("FunAwards", {
        title: currentAwardTitle,
        nominee: student,
        evidence: evidence,
        voter: localStorage.getItem("ukiyoe_nickname") || "匿名",
        createdAt: new Date().toISOString()
      });

      modal.style.display = "none";
      studentSelect.value = "";
      evidenceInput.value = "";
      showToast("提名已提交！");

      // Refresh awards
      awardsRendered = false;
      await renderAwards();
    });
  }

  // Custom award
  document.addEventListener("DOMContentLoaded", function() {
    const newAwardBtn = document.getElementById("new-award-submit");
    if (!newAwardBtn) return;
    newAwardBtn.addEventListener("click", async function() {
      const input = document.getElementById("new-award-title");
      const title = input.value.trim();
      if (!title) { showToast("请输入称号名称"); return; }

      // Save to DB so it persists across refreshes
      await DB.save("CustomAwards", {
        title: title,
        icon: "✨",
        createdAt: new Date().toISOString()
      });
      input.value = "";
      showToast("新称号已添加！");

      // Re-render
      awardsRendered = false;
      await renderAwards();
    });
  });

  // ========== 同桌编年史 ==========
  async function loadDeskTimelineForStudent(studentName) {
    const tl = document.getElementById("detail-desk-timeline");
    if (!tl) return;

    const records = await DB.query("DeskTimeline", function(r) { return r.student === studentName; });
    records.sort(function(a, b) { return new Date(a.createdAt) - new Date(b.createdAt); });

    if (records.length === 0) {
      tl.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;text-align:center;padding:1rem">还没人记录过TA的同桌史，在下方提交第一条吧</p>';
      return;
    }

    tl.innerHTML = records.map(function(r) {
      return '<div class="tl-node">' +
        '<div class="tl-period">' + U.hesc(r.period || "某段时间") + '</div>' +
        '<div class="tl-name">同桌：' + U.hesc(r.deskmate) + '</div>' +
        (r.memory ? '<div class="tl-memory">"' + U.hesc(r.memory) + '"</div>' : '') +
      '</div>';
    }).join("");
  }

  let desksRendered = false;
  async function renderAllDeskTimeline() {
    if (desksRendered) return;
    desksRendered = true;

    const tl = document.getElementById("all-desk-timeline");
    if (!tl) return;

    const records = await DB.query("DeskTimeline");
    records.sort(function(a, b) { return new Date(a.createdAt) - new Date(b.createdAt); });

    if (records.length === 0) {
      tl.innerHTML = '<p class="empty-state"><span class="empty-icon">📝</span>还没有同桌记录，来写第一条吧</p>';
      return;
    }

    tl.innerHTML = records.map(function(r) {
      return '<div class="tl-node">' +
        '<div><strong>' + U.hesc(r.student) + '</strong> ↔ <strong>' + U.hesc(r.deskmate) + '</strong></div>' +
        '<div class="tl-period">' + U.hesc(r.period || "某段时间") + '</div>' +
        (r.memory ? '<div class="tl-memory">"' + U.hesc(r.memory) + '"</div>' : '') +
      '</div>';
    }).join("");
  }

  // Submit desk record
  document.addEventListener("DOMContentLoaded", function() {
    const deskSubmit = document.getElementById("desk-submit");
    if (!deskSubmit) return;

    deskSubmit.addEventListener("click", async function() {
      const selfEl = document.getElementById("desk-self");
      const mateEl = document.getElementById("desk-mate");
      const periodEl = document.getElementById("desk-period");
      const memoryEl = document.getElementById("desk-memory");

      const student = selfEl.value.trim();
      const deskmate = mateEl.value.trim();
      const period = periodEl.value.trim();
      const memory = memoryEl.value.trim();

      if (!student || !deskmate) { showToast("请填写你的名字和同桌的名字"); return; }

      await DB.save("DeskTimeline", {
        student: student,
        deskmate: deskmate,
        period: period || "未知时间",
        memory: memory,
        createdAt: new Date().toISOString()
      });

      selfEl.value = ""; mateEl.value = ""; periodEl.value = ""; memoryEl.value = "";
      showToast("同桌记忆已记录 📝");
      desksRendered = false;
      await renderAllDeskTimeline();
    });
  });

  // ========== Init ==========
  document.addEventListener("DOMContentLoaded", function() {
    setupTabs();
    renderStudentGrid();

    // Student search filter
    const searchInput = document.getElementById("student-search");
    if (searchInput) {
      searchInput.addEventListener("input", function() {
        const q = this.value.trim().toLowerCase();
        const cards = document.querySelectorAll("#student-grid .student-card");
        let visible = 0;
        cards.forEach(function(card) {
          const name = (card.dataset.student || "").toLowerCase();
          if (!q || name.includes(q)) {
            card.style.display = "";
            visible++;
          } else {
            card.style.display = "none";
          }
        });
        // Show empty hint
        let hint = document.getElementById("search-hint");
        if (visible === 0 && q) {
          if (!hint) {
            hint = document.createElement("p");
            hint.id = "search-hint";
            hint.style.cssText = "text-align:center;color:var(--text-muted);padding:2rem;font-size:0.95rem";
            hint.textContent = "没找到匹配的同学～";
            document.getElementById("student-grid").after(hint);
          }
          hint.style.display = "";
        } else if (hint) {
          hint.style.display = "none";
        }
      });
    }
  });

})();
