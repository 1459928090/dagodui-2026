// ============================================================
// 班级浮世绘 — 数据存储层 (CloudBase 云开发 + localStorage 降级)
// 通过 Vercel Serverless API 代理访问 CloudBase 数据库
// ============================================================

const DB = (function() {
  // ========== LocalStorage 实现（离线/未配置时降级） ==========
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

  // ========== CloudBase API 实现 ==========
  var _apiFailed = false;

  const API = {
    _base: "/api/db",

    _request: async function(method, table, body, extra) {
      var url = this._base + "?table=" + encodeURIComponent(table);
      if (extra) {
        Object.keys(extra).forEach(function(k) {
          url += "&" + k + "=" + encodeURIComponent(extra[k]);
        });
      }
      var opts = { method: method, headers: { "Content-Type": "application/json" } };
      if (body) opts.body = JSON.stringify(body);

      var resp = await fetch(url, opts);
      if (!resp.ok) throw new Error("API " + resp.status);
      return resp.json();
    },

    save: function(table, obj) {
      return this._request("POST", table, obj);
    },

    query: function(table, filterFn) {
      return this._request("GET", table, null, null).then(function(result) {
        var list = (result.data || []).map(function(r) {
          r.objectId = r._id; return r;
        });
        if (filterFn) list = list.filter(filterFn);
        return list;
      });
    },

    update: function(table, objectId, updates) {
      return this._request("PUT", table, updates, { id: objectId }).then(function() {
        return updates;
      });
    },

    delete_: function(table, objectId) {
      return this._request("DELETE", table, null, { id: objectId });
    },

    count: function(table) {
      return this._request("GET", table, null, { count: "true" }).then(function(r) {
        return r.total;
      });
    },

    hasTodayRecord: function(table, author) {
      return this._request("GET", table, null, { author: author, today: "true" }).then(function(r) {
        return r.count > 0;
      });
    }
  };

  // ========== 统一接口（自动降级） ==========
  function auto(fnName) {
    return function() {
      var args = arguments;
      if (_apiFailed) {
        return LS[fnName].apply(LS, args);
      }
      return API[fnName].apply(API, args).catch(function(e) {
        console.warn("CloudBase API 不可用，降级到本地存储:", e.message);
        _apiFailed = true;
        return LS[fnName].apply(LS, args);
      });
    };
  }

  return {
    init: function() {
      fetch("/api/db?table=_ping&count=true").then(function(r) {
        if (r.ok) console.log("存储层就绪: CloudBase 云开发");
        else throw new Error("API not ready");
      }).catch(function() {
        _apiFailed = true;
        console.log("存储层就绪: 本地存储（API 未配置或不可达）");
      });
      // 诊断 localStorage
      try {
        var testKey = "ukiyoe__diag";
        localStorage.setItem(testKey, "1");
        localStorage.removeItem(testKey);
      } catch(e) {
        console.error("localStorage 不可用! 请用 http:// 访问而非 file://", e);
      }
    },

    save:    auto("save"),
    query:   auto("query"),
    update:  auto("update"),
    delete_: auto("delete_"),
    count:   auto("count"),

    hasTodayRecord: function(table, author) {
      if (_apiFailed) {
        var today = new Date().toISOString().slice(0, 10);
        return LS.query(table, function(r) {
          return r.author === author && r.createdAt && r.createdAt.slice(0, 10) === today;
        }).then(function(records) { return records.length > 0; });
      }
      return API.hasTodayRecord(table, author).catch(function() {
        _apiFailed = true;
        var today = new Date().toISOString().slice(0, 10);
        return LS.query(table, function(r) {
          return r.author === author && r.createdAt && r.createdAt.slice(0, 10) === today;
        }).then(function(records) { return records.length > 0; });
      });
    }
  };
})();
