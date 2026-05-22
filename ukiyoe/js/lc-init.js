// ============================================================
// 班级浮世绘 — 数据存储层 (Leancloud + localStorage 降级)
// ============================================================

const DB = (function() {
  const cfg = UKIYOE_CONFIG.leancloud;
  const useLC = cfg.appId && cfg.appKey;

  // ========== LocalStorage 实现 ==========
  const LS = {
    _getTable(name) {
      try {
        return JSON.parse(localStorage.getItem("ukiyoe_" + name) || "[]");
      } catch(e) { return []; }
    },
    _setTable(name, data) {
      try {
        localStorage.setItem("ukiyoe_" + name, JSON.stringify(data));
      } catch(e) {
        console.error("localStorage 写入失败:", e);
        showToast && showToast("保存失败，请检查浏览器存储空间");
      }
    },
    save(table, obj) {
      const data = this._getTable(table);
      obj.objectId = "ls_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
      obj.createdAt = new Date().toISOString();
      data.push(obj);
      this._setTable(table, data);
      return Promise.resolve(obj);
    },
    query(table, filterFn) {
      let data = this._getTable(table);
      if (filterFn) data = data.filter(filterFn);
      return Promise.resolve(data);
    },
    update(table, objectId, updates) {
      const data = this._getTable(table);
      const idx = data.findIndex(d => d.objectId === objectId);
      if (idx >= 0) {
        Object.assign(data[idx], updates);
        this._setTable(table, data);
      }
      return Promise.resolve(data[idx] || null);
    },
    delete_(table, objectId) {
      const data = this._getTable(table);
      const filtered = data.filter(d => d.objectId !== objectId);
      this._setTable(table, filtered);
      return Promise.resolve(true);
    },
    count(table, filterFn) {
      let data = this._getTable(table);
      if (filterFn) data = data.filter(filterFn);
      return Promise.resolve(data.length);
    }
  };

  // ========== Leancloud 实现 (需要 SDK) ==========
  // Leancloud SDK 通过 CDN 在 HTML 中加载
  const LC = {
    _ready: false,
    _classMap: {},

    init() {
      if (this._ready) return;
      if (typeof AV === "undefined") {
        console.warn("Leancloud SDK 未加载，使用本地存储模式");
        return;
      }
      AV.init({ appId: cfg.appId, appKey: cfg.appKey, serverURL: cfg.serverURL });
      this._ready = true;
      console.log("Leancloud 已连接");
    },

    _getClass(table) {
      if (!this._classMap[table]) {
        this._classMap[table] = AV.Object.extend(table);
      }
      return this._classMap[table];
    },

    save(table, obj) {
      const Cls = this._getClass(table);
      const avObj = new Cls();
      Object.keys(obj).forEach(k => { avObj.set(k, obj[k]); });
      return avObj.save().then(o => ({ ...obj, objectId: o.id, createdAt: o.createdAt }));
    },

    query(table, filterFn) {
      // LC queries are complex; for simplicity, fetch all and filter client-side
      const Cls = this._getClass(table);
      const q = new AV.Query(Cls);
      q.limit(1000);
      return q.find().then(results =>
        results.map(r => {
          const obj = r.toJSON();
          obj.objectId = r.id;
          return obj;
        }).filter(filterFn || (() => true))
      );
    },

    update(table, objectId, updates) {
      const Cls = this._getClass(table);
      const q = new AV.Query(Cls);
      return q.get(objectId).then(avObj => {
        Object.keys(updates).forEach(k => { avObj.set(k, updates[k]); });
        return avObj.save();
      }).then(o => ({ ...updates, objectId: o.id }));
    },

    delete_(table, objectId) {
      const Cls = this._getClass(table);
      const q = new AV.Query(Cls);
      return q.get(objectId).then(avObj => avObj.destroy());
    },

    count(table) {
      const Cls = this._getClass(table);
      const q = new AV.Query(Cls);
      return q.count();
    }
  };

  // ========== 统一接口 ==========
  let backend = LS;

  function getBackend() {
    if (useLC && typeof AV !== "undefined") {
      LC.init();
      return LC;
    }
    return LS;
  }

  return {
    init() {
      backend = getBackend();
      if (useLC) LC.init();
      // 诊断: 验证 localStorage 是否可用
      try {
        const testKey = "ukiyoe__diag";
        localStorage.setItem(testKey, "1");
        localStorage.removeItem(testKey);
        console.log("存储层就绪: 本地存储 (正常)");
      } catch(e) {
        console.error("存储层就绪: 本地存储 (不可用! 请用 http:// 访问而非 file://)", e);
      }
    },

    save(table, obj) { return backend.save(table, obj); },
    query(table, filterFn) { return backend.query(table, filterFn); },
    update(table, objectId, updates) { return backend.update(table, objectId, updates); },
    delete_(table, objectId) { return backend.delete_(table, objectId); },
    count(table, filterFn) { return backend.count(table, filterFn); },

    // 检查今天是否已操作（用于心情投票等每日限制）
    async hasTodayRecord(table, author) {
      const today = new Date().toISOString().slice(0, 10);
      const records = await backend.query(table, r => r.author === author && r.createdAt && r.createdAt.slice(0, 10) === today);
      return records.length > 0;
    }
  };
})();
