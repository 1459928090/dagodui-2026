// ============================================================
// 班级浮世绘 — 数据存储层 (CloudBase 云开发 + localStorage 降级)
// 部署于 CloudBase 静态托管，同源无安全域名限制
// ============================================================

const DB = (function() {
  const cfg = UKIYOE_CONFIG.tcb;
  const useTCB = cfg.envId && cfg.envId.trim() !== "";

  // ========== LocalStorage 实现 ==========
  const LS = {
    _getTable: function(name) {
      try { return JSON.parse(localStorage.getItem("ukiyoe_" + name) || "[]"); }
      catch(e) { return []; }
    },
    _setTable: function(name, data) {
      try { localStorage.setItem("ukiyoe_" + name, JSON.stringify(data)); }
      catch(e) { console.error("localStorage 写入失败:", e); }
    },
    save: function(table, obj) {
      var data = this._getTable(table);
      obj.objectId = "ls_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
      obj.createdAt = new Date().toISOString();
      data.push(obj);
      this._setTable(table, data);
      return Promise.resolve(obj);
    },
    query: function(table, filterFn) {
      var data = this._getTable(table);
      if (filterFn) data = data.filter(filterFn);
      return Promise.resolve(data);
    },
    update: function(table, objectId, updates) {
      var data = this._getTable(table);
      var idx = data.findIndex(function(d) { return d.objectId === objectId; });
      if (idx >= 0) { Object.assign(data[idx], updates); this._setTable(table, data); }
      return Promise.resolve(data[idx] || null);
    },
    delete_: function(table, objectId) {
      var data = this._getTable(table);
      this._setTable(table, data.filter(function(d) { return d.objectId !== objectId; }));
      return Promise.resolve(true);
    },
    count: function(table, filterFn) {
      var data = this._getTable(table);
      if (filterFn) data = data.filter(filterFn);
      return Promise.resolve(data.length);
    }
  };

  // ========== CloudBase SDK 实现 ==========
  const TCB = {
    _ready: false,
    _db: null,
    _initPromise: null,

    init: function() {
      if (this._ready) return;
      if (this._initPromise) return this._initPromise;
      if (typeof tcb === "undefined") {
        console.warn("CloudBase SDK 未加载，使用本地存储模式");
        return;
      }

      var self = this;
      this._initPromise = (async function() {
        try {
          var app = tcb.init({ env: cfg.envId });
          self._db = app.database();
          var auth = app.auth({ persistence: "local" });
          var loginState = await auth.getLoginState();
          if (!loginState) {
            await auth.signInAnonymously();
          }
          self._ready = true;
          console.log("CloudBase 已连接");
        } catch(e) {
          console.error("CloudBase 初始化失败:", e);
          throw e;
        }
      })();
      return this._initPromise;
    },

    save: async function(table, obj) {
      var copy = {};
      Object.keys(obj).forEach(function(k) { copy[k] = obj[k]; });
      copy.createdAt = copy.createdAt || new Date().toISOString();
      var res = await this._db.collection(table).add(copy);
      copy.objectId = res.id;
      copy._id = res.id;
      return copy;
    },

    query: async function(table, filterFn) {
      var res = await this._db.collection(table).limit(1000).get();
      return (res.data || []).map(function(r) {
        r.objectId = r._id;
        return r;
      }).filter(filterFn || function() { return true; });
    },

    update: async function(table, objectId, updates) {
      await this._db.collection(table).doc(objectId).update(updates);
      return updates;
    },

    delete_: async function(table, objectId) {
      await this._db.collection(table).doc(objectId).remove();
      return true;
    },

    count: async function(table) {
      var res = await this._db.collection(table).count();
      return res.total;
    }
  };

  // ========== 统一接口（自动降级） ==========
  var _useLS = false;

  function auto(fnName) {
    return function() {
      if (_useLS || !useTCB || typeof tcb === "undefined") {
        return LS[fnName].apply(LS, arguments);
      }
      var args = arguments;
      return TCB.init().then(function() {
        return TCB[fnName].apply(TCB, args);
      }).catch(function(e) {
        console.warn("CloudBase 操作失败，降级到本地存储:", e.message);
        _useLS = true;
        return LS[fnName].apply(LS, args);
      });
    };
  }

  return {
    init: function() {
      try {
        var testKey = "ukiyoe__diag";
        localStorage.setItem(testKey, "1");
        localStorage.removeItem(testKey);
      } catch(e) {
        console.error("localStorage 不可用! 请用 http:// 访问而非 file://", e);
      }

      if (!useTCB || typeof tcb === "undefined") {
        console.log("存储层就绪: 本地存储（未配置 CloudBase）");
        return;
      }
      var self = this;
      TCB.init().then(function() {
        console.log("存储层就绪: CloudBase 云开发");
      }).catch(function(e) {
        _useLS = true;
        console.log("存储层就绪: 本地存储（CloudBase 连接失败:", e.message, "）");
      });
    },

    save:    auto("save"),
    query:   auto("query"),
    update:  auto("update"),
    delete_: auto("delete_"),
    count:   auto("count"),

    hasTodayRecord: async function(table, author) {
      if (_useLS || !useTCB || typeof tcb === "undefined") {
        var today = new Date().toISOString().slice(0, 10);
        var records = await LS.query(table, function(r) {
          return r.author === author && r.createdAt && r.createdAt.slice(0, 10) === today;
        });
        return records.length > 0;
      }
      try {
        await TCB.init();
        var res = await TCB._db.collection(table).where({ author: author }).limit(1000).get();
        var today = new Date().toISOString().slice(0, 10);
        var count = (res.data || []).filter(function(r) {
          return r.createdAt && r.createdAt.slice(0, 10) === today;
        }).length;
        return count > 0;
      } catch(e) {
        _useLS = true;
        var today2 = new Date().toISOString().slice(0, 10);
        var records2 = await LS.query(table, function(r) {
          return r.author === author && r.createdAt && r.createdAt.slice(0, 10) === today2;
        });
        return records2.length > 0;
      }
    }
  };
})();
