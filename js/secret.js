// ============================================================
// 大对勾托管中心2026级 — 时光信件解密逻辑
// ============================================================

(function () {
  'use strict';

  // ---- 访问控制：未验证则跳回主页 ----
  if (!sessionStorage.getItem('dagodui_auth')) {
    window.location.replace('index.html');
    return;
  }

  // ---- DOM Ready ----
  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  ready(function () {
    const decryptBtn = document.getElementById('decrypt-btn');
    const cipherInput = document.getElementById('cipher-input');
    const resultArea = document.getElementById('result-area');

    if (!decryptBtn || !cipherInput) return;

    function doDecrypt() {
      const cipherText = cipherInput.value.trim();
      resultArea.innerHTML = '';

      if (!cipherText) {
        resultArea.innerHTML = '<div class="letter-error">请先粘贴密文再点我哦～</div>';
        return;
      }

      try {
        const bytes = CryptoJS.AES.decrypt(cipherText, CLASS_CONFIG.encryptKey);
        const plainText = bytes.toString(CryptoJS.enc.Utf8);

        if (!plainText) {
          resultArea.innerHTML = '<div class="letter-error">咦？这好像不是你的信，再检查一下哦～<br>密文可能已损坏，或者密钥不匹配。</div>';
          return;
        }

        // 解析 JSON 格式 { name: "学生名", message: "信件内容" }
        let letter;
        try {
          letter = JSON.parse(plainText);
        } catch (e) {
          // 如果解析失败，直接显示原文
          letter = { name: '亲爱的同学', message: plainText };
        }

        const greeting = letter.name ? '亲爱的 ' + letter.name + '：' : '亲爱的同学：';
        const body = letter.message || plainText;
        const closing = '\n\n—— 永远爱你们的刘老师\n大对勾托管中心2026级';

        resultArea.innerHTML =
          '<div class="letter-result">' +
            '<div style="font-size:1.1rem;font-weight:600;margin-bottom:0.8rem;color:var(--primary-dark)">' + greeting + '</div>' +
            '<div>' + body.replace(/\n/g, '<br>') + '</div>' +
            '<div style="margin-top:2rem;text-align:right;color:var(--text-muted)">' + closing.replace(/\n/g, '<br>') + '</div>' +
          '</div>';

      } catch (err) {
        resultArea.innerHTML = '<div class="letter-error">解密失败……请检查密文是否完整粘贴，不要有遗漏或多余字符～</div>';
      }
    }

    decryptBtn.addEventListener('click', doDecrypt);
    cipherInput.addEventListener('keydown', function (e) {
      // Ctrl+Enter 快捷解密
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        doDecrypt();
      }
    });
  });
})();
