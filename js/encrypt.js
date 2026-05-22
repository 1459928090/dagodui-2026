// ============================================================
// 大对勾托管中心2026级 — 教师加密工具逻辑
// ============================================================

(function () {
  'use strict';

  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  ready(function () {
    const keyDisplay = document.getElementById('key-display');
    const toggleKeyBtn = document.getElementById('toggle-key');
    const encryptSingleBtn = document.getElementById('encrypt-single');
    const copySingleBtn = document.getElementById('copy-single');
    const singleOutput = document.getElementById('single-output');
    const encryptBatchBtn = document.getElementById('encrypt-batch');
    const copyAllBtn = document.getElementById('copy-all');
    const downloadAllBtn = document.getElementById('download-all');
    const batchOutput = document.getElementById('batch-output');

    let lastSingleCipher= '';
    let lastBatchResults= [];

    // ---- 密钥显示 ----
    let keyHidden= true;
    if (keyDisplay) {
      keyDisplay.value = CLASS_CONFIG.encryptKey.replace(/./g, '*');
    }
    if (toggleKeyBtn) {
      toggleKeyBtn.addEventListener('click', function () {
        keyHidden = !keyHidden;
        if (keyHidden) {
          keyDisplay.value = CLASS_CONFIG.encryptKey.replace(/./g, '*');
          toggleKeyBtn.textContent = '显示';
        } else {
          keyDisplay.value = CLASS_CONFIG.encryptKey;
          toggleKeyBtn.textContent = '隐藏';
        }
      });
    }

    // ---- 核心加密函数 ----
    function encrypt(studentName, message) {
      const payload = JSON.stringify({ name: studentName, message: message });
      return CryptoJS.AES.encrypt(payload, CLASS_CONFIG.encryptKey).toString();
    }

    // ---- 单个加密 ----
    if (encryptSingleBtn) {
      encryptSingleBtn.addEventListener('click', function () {
        const name = document.getElementById('student-name').value.trim();
        const content = document.getElementById('letter-content').value.trim();

        if (!name || !content) {
          alert('请填写学生姓名和信件内容');
          return;
        }

        lastSingleCipher = encrypt(name, content);
        singleOutput.style.display = 'block';
        singleOutput.textContent = lastSingleCipher;
        copySingleBtn.disabled = false;

        // 滚动到密文区域
        singleOutput.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // ---- 复制单个密文 ----
    if (copySingleBtn) {
      copySingleBtn.addEventListener('click', function () {
        if (!lastSingleCipher) return;
        copyToClipboard(lastSingleCipher);
        const orig = copySingleBtn.textContent;
        copySingleBtn.textContent = '已复制 ✓';
        setTimeout(function () { copySingleBtn.textContent = orig; }, 2000);
      });
    }

    // ---- 批量加密 ----
    if (encryptBatchBtn) {
      encryptBatchBtn.addEventListener('click', function () {
        const batchInput = document.getElementById('batch-input');
        const lines = batchInput.value.trim().split('\n').filter(function (line) {
          return line.trim() !== '';
        });

        if (lines.length === 0) {
          alert('请输入至少一个学生的信件内容');
          return;
        }

        lastBatchResults = [];

        const html = '';
        lines.forEach(function (line, i) {
          const parts = line.split('|');
          if (parts.length < 2) {
            html += '<div class="tool-result-item" style="border-left:3px solid var(--primary)">' +
              '<div class="tool-result-name">⚠ 第 ' + (i + 1) + ' 行格式错误（缺少 | 分隔符），已跳过</div></div>';
            return;
          }

          const name = parts[0].trim();
          const message = parts.slice(1).join('|').trim();
          const cipher = encrypt(name, message);

          lastBatchResults.push({ name: name, cipher: cipher });

          html += '<div class="tool-result-item">' +
            '<div class="tool-result-name">' + name + '</div>' +
            '<div class="tool-result-cipher">' + cipher + '</div>' +
          '</div>';
        });

        // 打印卡片格式汇总
        if (lastBatchResults.length > 0) {
          html += '<div class="tool-result-item" style="background:#fff;border:2px dashed var(--gold);margin-top:1rem">' +
            '<div class="tool-result-name" style="color:var(--gold)">📇 打印卡片格式（可直接打印剪裁）</div>' +
            buildPrintCards(lastBatchResults) +
          '</div>';
        }

        batchOutput.innerHTML = html;
        copyAllBtn.disabled = lastBatchResults.length === 0;
        downloadAllBtn.disabled = lastBatchResults.length === 0;

        batchOutput.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // ---- 构建打印卡片 HTML ----
    function buildPrintCards(results) {
      const cards = results.map(function (r) {
        return '<div style="border:1px solid #ccc;padding:12px;margin:8px 0;border-radius:6px;background:#fff">' +
          '<strong>' + r.name + '</strong><br>' +
          '<span style="font-size:0.65rem;word-break:break-all;color:#666">' + r.cipher + '</span>' +
        '</div>';
      }).join('');
      return '<div style="font-size:0.85rem">' + cards +
        '<button class="tool-btn secondary" id="print-cards-btn" style="margin-top:8px">🖨 打印卡片</button></div>';
    }

    // ---- 打印卡片（事件委托） ----
    document.addEventListener('click', function (e) {
      if (e.target && e.target.id === 'print-cards-btn') {
        const printWin = window.open('', '_blank', 'width=800,height=600');
        printWin.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>时光信件卡片</title>');
        printWin.document.write('<style>');
        printWin.document.write('*{box-sizing:border-box;margin:0;padding:0}');
        printWin.document.write('body{font-family:"Microsoft YaHei",sans-serif;padding:20px}');
        printWin.document.write('h1{text-align:center;margin-bottom:20px;font-size:18px}');
        printWin.document.write('.card{border:1px solid #ccc;padding:16px;margin:12px 0;border-radius:8px;page-break-inside:avoid}');
        printWin.document.write('.card strong{font-size:16px}');
        printWin.document.write('.cipher{font-size:10px;word-break:break-all;color:#555;margin-top:6px}');
        printWin.document.write('@media print{.card{border:1px dashed #999}}');
        printWin.document.write('</style></head><body>');
        printWin.document.write('<h1>大对勾托管中心2026级 · 时光信件</h1>');

        lastBatchResults.forEach(function (r) {
          printWin.document.write(
            '<div class="card"><strong>收信人：' + r.name + '</strong>' +
            '<div class="cipher">' + r.cipher + '</div></div>'
          );
        });

        printWin.document.write('</body></html>');
        printWin.document.close();
        setTimeout(function () { printWin.print(); }, 300);
      }
    });

    // ---- 复制全部密文 ----
    if (copyAllBtn) {
      copyAllBtn.addEventListener('click', function () {
        if (lastBatchResults.length === 0) return;

        const text = lastBatchResults.map(function (r) {
          return '【' + r.name + '】\n' + r.cipher;
        }).join('\n\n---\n\n');

        copyToClipboard(text);
        const orig = copyAllBtn.textContent;
        copyAllBtn.textContent = '已复制 ' + lastBatchResults.length + ' 条 ✓';
        setTimeout(function () { copyAllBtn.textContent = orig; }, 2000);
      });
    }

    // ---- 下载密文文件 ----
    if (downloadAllBtn) {
      downloadAllBtn.addEventListener('click', function () {
        if (lastBatchResults.length === 0) return;

        const text = lastBatchResults.map(function (r) {
          return '【' + r.name + '】\n' + r.cipher;
        }).join('\n\n---\n\n');

        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '大对勾2026级_时光信件密文_' + new Date().toISOString().slice(0, 10) + '.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }

    // ---- 剪贴板工具 ----
    function copyToClipboard(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(function () {
          fallbackCopy(text);
        });
      } else {
        fallbackCopy(text);
      }
    }

    function fallbackCopy(text) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(textarea);
    }
  });
})();
