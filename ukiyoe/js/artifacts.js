// ============================================================
// 班级浮世绘 — 风物志逻辑
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
      if (btn.dataset.tab === "slang") renderSlangs();
    });
  }

  // ========== 班级博物馆 ==========
  let allArtifacts = [];
  let artifactListenerSetup = false;

  async function loadArtifactData() {
    const dbArtifacts = await DB.query("Artifacts");
    allArtifacts = cfg.artifacts.concat(dbArtifacts.map(function(a) {
      return {
        id: a.objectId,
        name: a.name,
        category: a.category || "物品",
        description: a.description,
        image: a.imageUrl || "",
        fromDB: true
      };
    }));
  }

  function renderArtifactGrid() {
    const grid = document.getElementById("artifact-grid");
    if (!grid) return;

    grid.innerHTML = allArtifacts.map(function(a, idx) {
      return '<div class="card artifact-card" data-idx="' + idx + '">' +
        (a.image ? '<img class="artifact-img" src="' + U.hesc(a.image) + '" alt="' + U.hesc(a.name) + '" loading="lazy" onerror="this.style.background=\'var(--gold-light)\'">' :
         '<div class="artifact-img" style="display:flex;align-items:center;justify-content:center;font-size:2.5rem">🏺</div>') +
        '<div class="artifact-name">' + U.hesc(a.name) + '</div>' +
        '<div style="font-size:0.78rem;color:var(--primary);margin-bottom:0.3rem">' + U.hesc(a.category) + '</div>' +
        '<div class="artifact-desc">' + U.hesc(a.description.slice(0, 60)) + (a.description.length > 60 ? '…' : '') + '</div>' +
        (a.fromDB ? '<div style="font-size:0.7rem;color:var(--text-muted);margin-top:0.3rem">同学捐赠</div>' : '') +
      '</div>';
    }).join("");

    // Click handler — only bind once
    if (!artifactListenerSetup) {
      artifactListenerSetup = true;
      grid.addEventListener("click", function(e) {
        const card = e.target.closest(".artifact-card");
        if (!card) return;
        const idx = parseInt(card.dataset.idx);
        const artifact = allArtifacts[idx];
        if (!artifact) return;
        openArtifactModal(artifact);
      });
    }
  }

  async function refreshArtifacts() {
    await loadArtifactData();
    renderArtifactGrid();
  }

  function openArtifactModal(a) {
    const modal = document.getElementById("artifact-modal");
    document.getElementById("artifact-modal-name").textContent = a.name;
    document.getElementById("artifact-modal-category").textContent = "📂 " + (a.category || "物品");
    document.getElementById("artifact-modal-desc").textContent = a.description;
    const img = document.getElementById("artifact-modal-img");
    if (a.image) { img.src = a.image; img.style.display = "block"; }
    else { img.style.display = "none"; }
    modal.style.display = "flex";
  }

  // Close modal
  document.addEventListener("DOMContentLoaded", function() {
    const modal = document.getElementById("artifact-modal");
    if (!modal) return;
    document.getElementById("artifact-modal-close").addEventListener("click", function() { modal.style.display = "none"; });
    modal.addEventListener("click", function(e) { if (e.target === modal) modal.style.display = "none"; });

    // Submit artifact
    const artSubmit = document.getElementById("new-artifact-submit");
    if (artSubmit) {
      artSubmit.addEventListener("click", async function() {
        const name = document.getElementById("new-artifact-name").value.trim();
        const category = document.getElementById("new-artifact-category").value.trim();
        const desc = document.getElementById("new-artifact-desc").value.trim();
        const image = document.getElementById("new-artifact-image").value.trim();
        const contributor = document.getElementById("new-artifact-contributor").value.trim() || "匿名同学";

        if (!name || !desc) { showToast("至少填上名字和解说吧～"); return; }

        await DB.save("Artifacts", {
          name: name,
          category: category || "物品",
          description: desc,
          imageUrl: image,
          contributor: contributor,
          createdAt: new Date().toISOString()
        });

        document.getElementById("new-artifact-name").value = "";
        document.getElementById("new-artifact-category").value = "";
        document.getElementById("new-artifact-desc").value = "";
        document.getElementById("new-artifact-image").value = "";
        document.getElementById("new-artifact-contributor").value = "";
        showToast("文物已入馆收藏 🏛");

        await refreshArtifacts();
      });
    }

    // Submit slang
    const slangSubmit = document.getElementById("new-slang-submit");
    if (slangSubmit) {
      slangSubmit.addEventListener("click", async function() {
        const term = document.getElementById("new-slang-term").value.trim();
        const def = document.getElementById("new-slang-def").value.trim();
        const example = document.getElementById("new-slang-example").value.trim();
        const contributor = document.getElementById("new-slang-contributor").value.trim() || "匿名同学";

        if (!term || !def) { showToast("至少填上词条名和释义吧～"); return; }

        await DB.save("ClassSlang", {
          term: term,
          definition: def,
          example: example,
          contributor: contributor,
          likes: 0,
          createdAt: new Date().toISOString()
        });

        document.getElementById("new-slang-term").value = "";
        document.getElementById("new-slang-def").value = "";
        document.getElementById("new-slang-example").value = "";
        document.getElementById("new-slang-contributor").value = "";
        showToast("词条已收录 📖");

        slangsRendered = false;
        await renderSlangs();
      });
    }
  });

  // ========== 暗号与梗百科 ==========
  let slangsRendered = false;
  async function renderSlangs() {
    if (slangsRendered) return;
    slangsRendered = true;

    const grid = document.getElementById("slang-grid");
    if (!grid) return;

    const dbSlangs = await DB.query("ClassSlang");
    dbSlangs.sort(function(a, b) { return (b.likes || 0) - (a.likes || 0); });

    const all = cfg.slangs.concat(dbSlangs);

    grid.innerHTML = all.map(function(s, idx) {
      return '<div class="card slang-card">' +
        '<div class="slang-term">' + U.hesc(s.term) + '</div>' +
        '<div class="slang-def">' + U.hesc(s.definition) + '</div>' +
        (s.example ? '<div class="slang-example">' + U.hesc(s.example) + '</div>' : '') +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.6rem">' +
          '<span style="font-size:0.75rem;color:var(--text-muted)">' + (s.contributor ? U.hesc(s.contributor) : "") + '</span>' +
          '<button class="like-btn" data-idx="' + idx + '" data-likes="' + (s.likes || 0) + '" style="font-size:0.8rem">❤ ' + (s.likes || 0) + '</button>' +
        '</div>' +
      '</div>';
    }).join("");

    // Like buttons
    grid.querySelectorAll(".like-btn").forEach(function(btn) {
      btn.addEventListener("click", async function() {
        const idx = parseInt(this.dataset.idx);
        const likes = parseInt(this.dataset.likes) + 1;
        this.dataset.likes = likes;
        this.textContent = "❤ " + likes;
        this.classList.add("liked");
        // Only DB slangs have objectId for update
        if (idx >= cfg.slangs.length) {
          const dbIdx = idx - cfg.slangs.length;
          const obj = (await DB.query("ClassSlang"))[dbIdx];
          if (obj) await DB.update("ClassSlang", obj.objectId, { likes: likes });
        }
      });
    });
  }

  // ========== Init ==========
  document.addEventListener("DOMContentLoaded", function() {
    setupTabs();
    refreshArtifacts();
  });

})();
