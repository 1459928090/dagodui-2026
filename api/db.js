// ============================================================
// Vercel Serverless — CloudBase 数据库代理
// 绕过免费套餐的安全域名限制
// ============================================================

const cloudbase = require("@cloudbase/node-sdk");

const ENV_ID = process.env.TCB_ENV || "dagodui-d9gnhl56p7e817b74";

function getApp() {
  return cloudbase.init({
    env: ENV_ID,
    secretId: process.env.TENCENTCLOUD_SECRET_ID,
    secretKey: process.env.TENCENTCLOUD_SECRET_KEY,
  });
}

module.exports = async function handler(req, res) {
  // CORS — 允许浏览器直接调用
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { method, query, body } = req;
  const table = query.table;

  if (!table) {
    return res.status(400).json({ error: "缺少 table 参数" });
  }

  // 检查环境变量是否配置
  if (!process.env.TENCENTCLOUD_SECRET_ID || !process.env.TENCENTCLOUD_SECRET_KEY) {
    return res.status(500).json({ error: "未配置 TENCENTCLOUD_SECRET_ID / KEY 环境变量" });
  }

  const app = getApp();
  const db = app.database();

  try {
    switch (method) {
      // ---- 查询 ----
      case "GET": {
        if (query.count === "true") {
          const result = await db.collection(table).count();
          return res.json({ total: result.total });
        }
        if (query.author && query.today === "true") {
          const today = new Date().toISOString().slice(0, 10);
          const result = await db.collection(table)
            .where({ author: query.author })
            .limit(1000).get();
          const count = (result.data || []).filter(
            (r) => r.createdAt && r.createdAt.slice(0, 10) === today
          ).length;
          return res.json({ count });
        }
        const result = await db.collection(table).limit(1000).get();
        return res.json({ data: result.data || [] });
      }

      // ---- 新增 ----
      case "POST": {
        const obj = Object.assign({}, body, { createdAt: new Date().toISOString() });
        const result = await db.collection(table).add(obj);
        obj._id = result.id;
        obj.objectId = result.id;
        return res.json(obj);
      }

      // ---- 更新 ----
      case "PUT": {
        const id = query.id;
        if (!id) return res.status(400).json({ error: "缺少 id 参数" });
        await db.collection(table).doc(id).update(body);
        return res.json({ success: true });
      }

      // ---- 删除 ----
      case "DELETE": {
        const id = query.id;
        if (!id) return res.status(400).json({ error: "缺少 id 参数" });
        await db.collection(table).doc(id).remove();
        return res.json({ success: true });
      }

      default:
        return res.status(405).json({ error: "不支持的方法" });
    }
  } catch (err) {
    console.error("DB 操作失败:", err);
    return res.status(500).json({ error: err.message || "数据库操作失败" });
  }
};
