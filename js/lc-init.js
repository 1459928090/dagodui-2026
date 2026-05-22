// ============================================================
// 大对勾2026级 — 数据存储层 (CloudBase 云开发 + localStorage 降级)
// ============================================================

const DB = (function() {
  const cfg = TCB_CONFIG;
  const useTCB = cfg.envId && cfg.envId.trim() !== "";

  function getSDK() {
    if (typeof cloudbase !== "undefined") return cloudbase;
    if (typeof tcb !== "undefined") return tcb;
    return null;
  }

  // ========== LocalStorage 实现 ==========
  const LS = {
    _getTable: function(name) {
      try { return JSON.parse(localStorage.getItem("dagodui_" + name) || "[]"); }
      catch(e) { return []; }
    },
    _setTable: function(name, data) {
      localStorage.setItem("dagodui_" + name, JSON.stringify(data));
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

  // ========== CloudBase 实现 ==========
  var _db = null;
  var _ready = false;
  var _initPromise = null;

  function initTCB() {
    if (_ready) return Promise.resolve();
    if (_initPromise) return _initPromise;
    var sdk = getSDK();
    if (!sdk) return;

    _initPromise = (async function() {
      try {
        var app = sdk.init({ env: cfg.envId });
        if (app && typeof app.then === "function") app = await app;

        var auth = app.auth({ persistence: "local" });
        var loginState = await auth.getLoginState();
        if (!loginState) {
          await auth.signInAnonymously();
        }

        _db = app.database();
        if (_db && typeof _db.then === "function") _db = await _db;

        _ready = true;
        console.log("CloudBase 已连接 ✓");
      } catch(e) {
        console.error("CloudBase 初始化失败:", e);
        throw e;
      }
    })();
    return _initPromise;
  }

  // ========== 统一接口 ==========
  var _useLS = false;

  function auto(fnName) {
    return function() {
      if (_useLS || !useTCB || !getSDK()) {
        return LS[fnName].apply(LS, arguments);
      }
      var args = arguments;
      return initTCB().then(function() {
        if (!_db) throw new Error("数据库未就绪");
        switch(fnName) {
          case "save": {
            var copy = {};
            Object.keys(args[1]).forEach(function(k) { copy[k] = args[1][k]; });
            copy.createdAt = copy.createdAt || new Date().toISOString();
            return _db.collection(args[0]).add(copy).then(function(res) {
              copy.objectId = res.id;
              copy._id = res.id;
              return copy;
            });
          }
          case "query":
            return _db.collection(args[0]).limit(1000).get().then(function(res) {
              return (res.data || []).map(function(r) {
                r.objectId = r._id; return r;
              }).filter(args[1] || function() { return true; });
            });
          case "update":
            return _db.collection(args[0]).doc(args[1]).update(args[2]).then(function() { return args[2]; });
          case "delete_":
            return _db.collection(args[0]).doc(args[1]).remove().then(function() { return true; });
          case "count":
            return _db.collection(args[0]).count().then(function(res) { return res.total; });
          default: throw new Error("未知: " + fnName);
        }
      }).catch(function(e) {
        console.warn("CloudBase 操作失败，降级到本地存储:", e.message);
        _useLS = true;
        return LS[fnName].apply(LS, args);
      });
    };
  }

  return {
    init: function() {
      if (!useTCB || !getSDK()) {
        console.log("存储层就绪: 本地存储");
        return;
      }
      initTCB().then(function() {
        console.log("存储层就绪: CloudBase 云开发");
      }).catch(function(e) {
        _useLS = true;
        console.log("存储层就绪: 本地存储（CloudBase 失败:", e.message, "）");
      });
    },

    save:    auto("save"),
    query:   auto("query"),
    update:  auto("update"),
    delete_: auto("delete_"),
    count:   auto("count"),

    hasTodayRecord: async function(table, author) {
      if (_useLS || !useTCB || !getSDK()) {
        var today = new Date().toISOString().slice(0, 10);
        var records = await LS.query(table, function(r) {
          return r.author === author && r.createdAt && r.createdAt.slice(0, 10) === today;
        });
        return records.length > 0;
      }
      try {
        await initTCB();
        if (!_db) throw new Error("db not ready");
        var res = await _db.collection(table).where({ author: author }).limit(1000).get();
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
