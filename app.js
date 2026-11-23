/* Saba Deck — ホーム画面アプリ（GitHub Pages）。
   裏方は Google Apps Script（gas/）。データの読み書きは fetch で doPost の action を呼ぶ。
   ?demo=1 のときは demo.js の作り物データで動く。 */
(function () {
  'use strict';

  var VERSION = "2026-11-23 21:30";

  /* ============================================================
   * 接続の設定（?c= か、この端末に保存したもの）
   * ============================================================ */
  var params = new URLSearchParams(location.search);
  var DEMO = params.get('demo') === '1';
  var CFG_KEY = 'saba_cfg';
  var IS_IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var IS_STANDALONE = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;

  function decodeCfg(s) {
    try {
      var j = JSON.parse(decodeURIComponent(escape(atob(String(s).replace(/-/g, '+').replace(/_/g, '/')))));
      return j && j.api && j.key && isValidApiUrl(j.api) ? { api: String(j.api).trim(), key: String(j.key).trim() } : null;
    } catch (e) { return null; }
  }
  function encodeCfg(c) {
    return btoa(unescape(encodeURIComponent(JSON.stringify({ api: c.api, key: c.key })))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function readSavedCfg() {
    try { var v = JSON.parse(localStorage.getItem(CFG_KEY) || 'null'); return v && v.api && v.key ? v : null; } catch (e) { return null; }
  }
  function saveCfg(c) { try { localStorage.setItem(CFG_KEY, JSON.stringify(c)); } catch (e) {} }
  // アドレスの ?c= は「アイコンを入れた日の設定」。
  // ・前に読んだのと同じリンクなら、そのあと端末で直した設定（保存済み）を使う（古いアイコンで新しい合言葉を消さない）
  // ・保存済みと別の接続先（api）を指すリンクなら、確かめてから切り替える（知らないリンクで書き換わらないように）
  var rawC = params.get('c') || '';
  var savedCfg = readSavedCfg();
  var urlCfg = rawC ? decodeCfg(rawC) : null;
  if (urlCfg && savedCfg && savedCfg.srcC === rawC) urlCfg = null;
  if (urlCfg && savedCfg && urlCfg.api !== savedCfg.api && !DEMO) {
    var switchOk = false;
    try { switchOk = window.confirm('このリンクは、いまとは別のデータにつなぎます。切り替えますか？'); } catch (e) {}
    if (!switchOk) urlCfg = null;
  }
  var cfg = urlCfg ? { api: urlCfg.api, key: urlCfg.key, srcC: rawC } : savedCfg;
  if (urlCfg && !DEMO) saveCfg(cfg);
  function installLink(c) { return location.origin + location.pathname + '?c=' + encodeCfg(c); }
  function isValidApiUrl(u) { return /^https:\/\/script\.google(usercontent)?\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(String(u || '').trim()); }

  /* ============================================================
   * アイコン（線の SVG。絵文字は使わない）
   * ============================================================ */
  var ICONS = {
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
    'chev-left': '<path d="m15 18-6-6 6-6"/>',
    'chev-right': '<path d="m9 18 6-6-6-6"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.25 4.1 1 5.8L12 16.9l-5.25 2.7 1-5.8L3.5 9.7l5.9-.9z"/>',
    headphones: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
    download: '<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>',
    sparkle: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    radio: '<circle cx="12" cy="12" r="2"/><path d="M16.2 7.8a6 6 0 0 1 0 8.4"/><path d="M7.8 16.2a6 6 0 0 1 0-8.4"/><path d="M19.1 4.9a10 10 0 0 1 0 14.2"/><path d="M4.9 19.1a10 10 0 0 1 0-14.2"/>',
    tv: '<rect x="3" y="5" width="18" height="13" rx="2.5"/><path d="M8 21h8"/><path d="m10.5 9.5 4 2-4 2z"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    phone: '<rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M11 18.5h2"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    back3: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
    external: '<path d="M14 4h6v6"/><path d="M10 14 20 4"/><path d="M19 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4"/>',
    cards: '<rect x="3" y="7" width="14" height="13" rx="2.5"/><path d="M7 4h11.5A2.5 2.5 0 0 1 21 6.5V16"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/>',
    book: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
    chart: '<path d="M3 20h18"/><rect x="5" y="11" width="3" height="6" rx="1"/><rect x="10.5" y="5" width="3" height="12" rx="1"/><rect x="16" y="13" width="3" height="4" rx="1"/>',
    play: '<path d="M7.5 4.8v14.4a1 1 0 0 0 1.52.85l11.5-7.2a1 1 0 0 0 0-1.7L9.02 3.95A1 1 0 0 0 7.5 4.8z" fill="currentColor" stroke="none"/>',
    pause: '<rect x="6" y="4.5" width="4" height="15" rx="1.2" fill="currentColor" stroke="none"/><rect x="14" y="4.5" width="4" height="15" rx="1.2" fill="currentColor" stroke="none"/>',
    loader: '<path d="M12 3a9 9 0 1 0 9 9"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>',
    volume: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/>',
    bulb: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>',
    speech: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    waves: '<path d="M3 12h1"/><path d="M7 8v8"/><path d="M11 5v14"/><path d="M15 8v8"/><path d="M19 10v4"/>',
    calendar: '<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10z"/><path d="M2 21c0-3 1.9-5.4 5.2-6"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    shuffle: '<path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/>',
    translate: '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
    'eye-off': '<path d="M2 2l20 20"/><path d="M6.7 6.7C4.3 8.2 2.7 10.4 2 12c1.5 3.5 5.5 7 10 7 1.9 0 3.6-.6 5.1-1.5"/><path d="M10.6 5.1C11 5 11.5 5 12 5c4.5 0 8.5 3.5 10 7-.5 1.1-1.2 2.2-2.1 3.2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'
  };
  function ic(name) {
    return '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }
  function fillStaticIcons(root) {
    var list = (root || document).querySelectorAll('i[data-ic]');
    for (var i = 0; i < list.length; i++) list[i].innerHTML = ic(list[i].getAttribute('data-ic'));
  }
  // ボタンの中身を「アイコン＋文字」にする（textContent の代わり）
  function setBtnContent(btn, iconName, text, sub) {
    if (!btn) return;
    btn.innerHTML = (iconName ? ic(iconName) : '') + '<span>' + escapeHtml(text) + '</span>' + (sub ? '<span class="sub">' + escapeHtml(sub) + '</span>' : '');
  }

  /* ============================================================
   * State
   * ============================================================ */
  var state = {
    vocab: [],
    passages: [],
    streams: [],
    stats: null,
    settings: {},
    apiKeyStatus: { configured: false, masked: '' },
    triggerStatus: { enabled: false },
    audioFolderStatus: { ready: false, folderName: 'SabaAudioClips', message: '' },
    seedSummary: { available: false, streamCount: 0, vocabCount: 0, passageCount: 0 },

    activeTab: 'study',
    studyView: 'groups',        // 'groups' | 'session'
    studyGroupTab: 'units',     // 'units' | 'smart'
    activeStudyGroupId: '',
    activeStudyGroupTitle: '',
    studyMode: 'normal',        // 'normal' | 'quiz' | 'listening'
    studyFilter: 'due',
    studyCreator: 'all',
    studyStreamVideoId: 'all',
    studyQueueIds: [],
    studyIndex: 0,
    studyHistory: [],
    pendingReview: null,
    pendingReviewTimerId: null,
    cardRevealed: false,
    reviewSendChain: Promise.resolve(),
    goalCelebratedToday: false,

    // 4択辞書クイズ状態
    quizOptions: [],
    quizAnsweredIdx: -1,
    quizStreak: 0,

    // 長文の状態（練習の画面と一覧）
    shadowView: 'practice',     // 'practice' | 'list'
    shadowCreator: 'all',
    selectedPassageId: null,
    shadowStreamId: 'all',
    passageViewMode: 'guide',   // 'guide' | 'plain' | 'blind'
    passageShowJa: false,
    passageShowTips: false,

    // 辞書ライブラリ状態
    librarySearch: '',
    libraryChip: 'all',
    libraryFavOnly: false,
    libraryCreator: 'all',
    libraryStreamId: 'all',
    librarySort: 'freq',        // 'freq' | 'az' | 'newest' | 'timestamp' | 'due'

    // HTML5 Audio Clip Engine State (広告ゼロ・IndexedDB永続キャッシュ・一括DL対応)
    audioEl: null,
    audioBlobUrls: {},          // { audioFile: objectUrl } (RAMキャッシュ)
    audioBlobUrlOrder: [],      // FIFO管理（iPhoneメモリ節約）
    audioLoadingMap: {},        // { audioFile: Promise<string|null> }
    cachedAudioSet: {},         // { audioFile: true } (IndexedDB保存済みキー)
    audioDbPromise: null,
    bulkDownloadRunning: false,
    bulkDownloadCancel: false,
    bulkDownloadTotal: 0,
    bulkDownloadDone: 0,
    detailModalCardId: null,
    activeCardId: null,
    activeClipType: 'vocab',    // 'vocab' | 'passage'
    activeAudioFile: '',
    activeTrimBounds: { start: 0, end: 0 },
    clipTrimTimerId: null,
    playerStatus: 'idle',       // 'idle' | 'loading' | 'playing' | 'paused'
    loopMode: false,
    playbackRate: 1.0,

    // 聴き流し（シャドーイング連続自動再生）
    autoplayActive: false,
    autoplayQueueIds: [],
    autoplayIdx: 0,
    autoplayPauseTimerId: null,
    wakeLockSentinel: null,

    isExtracting: false
  };

  var SPEED_STEPS = [0.75, 0.85, 1.0, 1.25];
  var ALLOWED_LEVELS = { Basic: true, Natural: true, Slang: true };
  var ALLOWED_STATUSES = { done: true, processing: true, waiting_captions: true, queued: true, error: true, skipped: true };
  var ALLOWED_REGISTERS = { Everyday: true, Casual: true, 'Internet-Only': true };
  var toastTimer = null;

  /* ============================================================
   * Helpers & Security
   * ============================================================ */
  function escapeHtml(str) {
    return String(str === null || str === undefined ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeRegExp(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function safeYoutubeUrl(rawUrl, videoId, startSec) {
    var vid = /^[A-Za-z0-9_-]{11}$/.test(String(videoId || '')) ? String(videoId) : '';
    if (startSec !== undefined && vid) {
      return 'https://youtu.be/' + vid + '?t=' + Math.max(0, Math.floor(Number(startSec) || 0));
    }
    var url = String(rawUrl || '').trim();
    if (/^https:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//i.test(url)) return url;
    return vid ? ('https://www.youtube.com/watch?v=' + vid) : 'https://www.youtube.com/';
  }

  function buildExpressionRegex(expression) {
    var expr = String(expression || '').trim();
    if (!expr || expr.length < 2) return null;
    var pattern = escapeRegExp(expr).replace(/['’]/g, "['’]");
    try { return new RegExp(pattern, 'ig'); } catch (e) { return null; }
  }

  function highlightExpressionInQuote(quoteEn, expression) {
    var raw = String(quoteEn || '');
    var re = buildExpressionRegex(expression);
    if (!re) return escapeHtml(raw);
    var out = '';
    var lastIdx = 0;
    var m;
    while ((m = re.exec(raw)) !== null) {
      if (m.index > lastIdx) out += escapeHtml(raw.slice(lastIdx, m.index));
      out += '<span class="quote-highlight">' + escapeHtml(m[0]) + '</span>';
      lastIdx = m.index + m[0].length;
      if (m[0].length === 0) break;
    }
    if (lastIdx < raw.length) out += escapeHtml(raw.slice(lastIdx));
    return out;
  }

  function buildClozeQuoteHtml(quoteEn, expression) {
    var raw = String(quoteEn || '');
    var re = buildExpressionRegex(expression);
    if (!raw || !re) return '';
    var found = false;
    var out = '';
    var lastIdx = 0;
    var m;
    while ((m = re.exec(raw)) !== null) {
      found = true;
      if (m.index > lastIdx) out += escapeHtml(raw.slice(lastIdx, m.index));
      var wc = m[0].trim().split(/\s+/).length;
      out += '<span class="cloze-blank">' + (wc > 1 ? ('_____ (' + wc + '語)') : '_____') + '</span>';
      lastIdx = m.index + m[0].length;
      if (m[0].length === 0) break;
    }
    if (!found) return '';
    if (lastIdx < raw.length) out += escapeHtml(raw.slice(lastIdx));
    return '“' + out + '”';
  }

  function formatChunkedScriptHtml(chunkedText) {
    var safe = escapeHtml(chunkedText || '');
    var parts = safe.split(/\s*\/\s*/);
    return parts.map(function (seg) {
      return seg.replace(/([A-Za-z0-9&#;']+_[A-Za-z0-9&#;'_]+)/g, function (match) {
        return '<span class="script-link">' + match.replace(/_/g, '‿') + '</span>';
      });
    }).join(' <span class="script-slash">/</span> ');
  }

  function formatSec(sec) {
    var total = Math.max(0, Math.floor(Number(sec) || 0));
    var h = Math.floor(total / 3600);
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    return h > 0 ? (h + ':' + pad(m) + ':' + pad(s)) : (pad(m) + ':' + pad(s));
  }

  function safeClassToken(val, wl, fb) { return wl[val] ? val : fb; }
  function safeStorageGet(k, fb) { try { var v = localStorage.getItem(k); return v !== null ? v : fb; } catch (e) { return fb; } }
  function safeStorageSet(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} }

  function showToast(message, isError) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.className = 'toast show' + (isError ? ' error' : '');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, isError ? 4200 : 2600);
  }

  function setModalOpen(modalEl, open) {
    if (!modalEl) return;
    modalEl.classList.toggle('open', open);
    document.body.style.overflow = document.querySelector('.modal-backdrop.open') ? 'hidden' : '';
  }

  function callGas(methodName) {
    var args = Array.prototype.slice.call(arguments, 1);
    if (window.__LOCAL_MOCK_GAS__ && typeof window.__LOCAL_MOCK_GAS__[methodName] === 'function') {
      return Promise.resolve().then(function () {
        return window.__LOCAL_MOCK_GAS__[methodName].apply(null, args);
      }).then(function (res) {
        if (!res || !res.ok) throw new Error((res && res.error) || 'モックAPIエラー');
        return res.data;
      });
    }
    if (DEMO) return Promise.reject(new Error('デモでは使えません'));
    if (!cfg || !cfg.api || !cfg.key) return Promise.reject(new Error('まだデータにつないでいません'));
    return postApi(cfg, methodName, args);
  }

  // 裏方（Apps Script の doPost）を呼ぶ。ヘッダーを付けない POST なので、事前確認（preflight）なしで届く
  function postApi(conn, action, args) {
    return fetch(conn.api, {
      method: 'POST',
      body: JSON.stringify({ key: conn.key, action: action, args: args || [] }),
      redirect: 'follow',
      cache: 'no-store'
    }).then(function (r) {
      if (!r.ok) throw new Error('通信に失敗しました（' + r.status + '）');
      return r.text();
    }, function () {
      throw new Error(navigator.onLine === false
        ? 'ネットにつながっていません'
        : 'つながりませんでした（電波か、Apps Script の公開設定を確かめてください）');
    }).then(function (txt) {
      var res;
      try { res = JSON.parse(txt); } catch (e) { throw new Error('裏方の返事が読めません（Apps Script のデプロイを確かめてください）'); }
      if (!res || !res.ok) {
        var apiErr = new Error(apiErrorText((res && res.error) || 'サーバーの処理に失敗しました'));
        apiErr.code = res && res.error;
        throw apiErr;
      }
      return res.data;
    });
  }

  function apiErrorText(code) {
    if (code === 'bad_key') return '合言葉が違います。設定リンクを開き直してください';
    if (code === 'unknown_action') return '裏方（Apps Script）の更新が必要です';
    return String(code);
  }

  /* ============================================================
   * 前回のデータを端末に残す（開いた瞬間に表示し、裏で新しくする）
   * ============================================================ */
  var dataDbPromise = null;
  function dataDbOpen() {
    if (dataDbPromise) return dataDbPromise;
    dataDbPromise = new Promise(function (resolve) {
      try {
        if (typeof indexedDB === 'undefined') { resolve(null); return; }
        var req = indexedDB.open('SabaDataCache', 1);
        req.onupgradeneeded = function () { req.result.createObjectStore('kv'); };
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { resolve(null); };
        req.onblocked = function () { resolve(null); };
      } catch (e) { resolve(null); }
    });
    return dataDbPromise;
  }
  function dataCacheGet(key) {
    return dataDbOpen().then(function (db) {
      if (!db) return null;
      return new Promise(function (resolve) {
        try {
          var req = db.transaction('kv', 'readonly').objectStore('kv').get(key);
          req.onsuccess = function () { resolve(req.result || null); };
          req.onerror = function () { resolve(null); };
        } catch (e) { resolve(null); }
      });
    });
  }
  function dataCacheSet(key, value) {
    return dataDbOpen().then(function (db) {
      if (!db) return false;
      return new Promise(function (resolve) {
        try {
          var tx = db.transaction('kv', 'readwrite');
          tx.objectStore('kv').put(value, key);
          tx.oncomplete = function () { resolve(true); };
          tx.onerror = function () { resolve(false); };
        } catch (e) { resolve(false); }
      });
    });
  }
  function bootCacheKey() { return 'boot:' + (cfg ? cfg.api.slice(-24) : 'none'); }

  function findCardById(id) {
    if (!id) return null;
    for (var i = 0; i < state.vocab.length; i++) if (state.vocab[i].id === id) return state.vocab[i];
    return null;
  }

  function findPassageById(id) {
    if (!id) return null;
    for (var i = 0; i < state.passages.length; i++) if (state.passages[i].id === id) return state.passages[i];
    return null;
  }

  function replaceCardInState(updated) {
    if (!updated || !updated.id) return;
    for (var i = 0; i < state.vocab.length; i++) {
      if (state.vocab[i].id === updated.id) { state.vocab[i] = updated; return; }
    }
    state.vocab.unshift(updated);
  }

  function replacePassageInState(updated) {
    if (!updated || !updated.id) return;
    for (var i = 0; i < state.passages.length; i++) {
      if (state.passages[i].id === updated.id) { state.passages[i] = updated; return; }
    }
    state.passages.unshift(updated);
  }

  function getActiveClipObject() {
    return state.activeClipType === 'passage' ? findPassageById(state.activeCardId) : findCardById(state.activeCardId);
  }

  function isDueClient(card) {
    if (!card.nextReviewAt) return true;
    var ts = new Date(card.nextReviewAt).getTime();
    return isNaN(ts) || ts <= Date.now();
  }

  function isWeakCard(card) {
    return (Number(card.lapses) || 0) >= 2 || (Number(card.ease) || 2.5) <= 2.0;
  }

  function previewNextIntervalLabel(card, rating) {
    var ease = Number(card.ease) || 2.5;
    var interval = Number(card.intervalDays) || 0;
    var reps = Number(card.reps) || 0;
    if (rating === 'again') return '10分';
    if (rating === 'hard') return (interval <= 0 ? 1 : Math.max(1, Math.round(interval * 1.2))) + '日';
    if (rating === 'easy') return (reps === 0 ? 4 : (reps === 1 ? 7 : Math.max(7, Math.round(interval * Math.min(3.2, ease + 0.15) * 1.3)))) + '日';
    return (reps === 0 ? 1 : (reps === 1 ? 4 : Math.max(4, Math.round(interval * ease)))) + '日';
  }

  function getCreatorList() {
    var set = {};
    state.vocab.forEach(function (v) { if (v.channelName) set[v.channelName] = true; });
    state.passages.forEach(function (p) { if (p.channelName) set[p.channelName] = true; });
    state.streams.forEach(function (s) { if (s.channelName) set[s.channelName] = true; });
    return Object.keys(set).sort();
  }

  /* ============================================================
   * Zero-Ad Ultra-Fast HTML5 Audio Engine (IndexedDB永続キャッシュ + 一括DL)
   * ============================================================ */
  var MAX_RAM_BLOB_URLS = 320;

  function decodeBase64ToRecord(fname, base64Str) {
    var bin = atob(base64Str);
    var len = bin.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    var mime = (len >= 4 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46)
      ? 'audio/wav'
      : 'audio/mpeg';
    return { name: fname, buffer: bytes.buffer, mime: mime, savedAt: Date.now() };
  }

  function putRamBlobUrl(fname, buffer, mime) {
    if (!fname || !buffer) return null;
    if (state.audioBlobUrls[fname]) return state.audioBlobUrls[fname];
    var blob = new Blob([buffer], { type: mime || 'audio/mpeg' });
    var url = URL.createObjectURL(blob);
    state.audioBlobUrls[fname] = url;
    state.audioBlobUrlOrder.push(fname);
    while (state.audioBlobUrlOrder.length > MAX_RAM_BLOB_URLS) {
      var oldest = state.audioBlobUrlOrder.shift();
      if (!oldest || oldest === state.activeAudioFile) {
        if (oldest) state.audioBlobUrlOrder.push(oldest);
        break;
      }
      if (state.audioBlobUrls[oldest]) {
        try { URL.revokeObjectURL(state.audioBlobUrls[oldest]); } catch (eRev) {}
        delete state.audioBlobUrls[oldest];
      }
    }
    return url;
  }

  function audioDbOpen() {
    if (state.audioDbPromise) return state.audioDbPromise;
    if (typeof indexedDB === 'undefined') {
      state.audioDbPromise = Promise.resolve(null);
      return state.audioDbPromise;
    }
    state.audioDbPromise = new Promise(function (resolve) {
      try {
        var req = indexedDB.open('SabaAudioCacheDB', 1);
        req.onupgradeneeded = function (ev) {
          var db = ev.target.result;
          if (!db.objectStoreNames.contains('clips')) {
            db.createObjectStore('clips', { keyPath: 'name' });
          }
        };
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { resolve(null); };
      } catch (e) {
        resolve(null);
      }
    });
    return state.audioDbPromise;
  }

  function audioDbGetAllKeys() {
    return audioDbOpen().then(function (db) {
      if (!db) return [];
      return new Promise(function (resolve) {
        try {
          var tx = db.transaction('clips', 'readonly');
          var req = tx.objectStore('clips').getAllKeys();
          req.onsuccess = function () { resolve(req.result || []); };
          req.onerror = function () { resolve([]); };
        } catch (e) {
          resolve([]);
        }
      });
    });
  }

  function audioDbGet(fname) {
    return audioDbOpen().then(function (db) {
      if (!db) return null;
      return new Promise(function (resolve) {
        try {
          var tx = db.transaction('clips', 'readonly');
          var req = tx.objectStore('clips').get(fname);
          req.onsuccess = function () { resolve(req.result || null); };
          req.onerror = function () { resolve(null); };
        } catch (e) {
          resolve(null);
        }
      });
    });
  }

  function audioDbPutMany(records) {
    if (!records || records.length === 0) return Promise.resolve({ ok: true, count: 0 });
    return audioDbOpen().then(function (db) {
      if (!db) return { ok: false, count: 0, error: 'IndexedDB unavailable' };
      return new Promise(function (resolve) {
        try {
          var tx = db.transaction('clips', 'readwrite');
          var store = tx.objectStore('clips');
          for (var i = 0; i < records.length; i++) {
            store.put(records[i]);
          }
          tx.oncomplete = function () { resolve({ ok: true, count: records.length }); };
          tx.onerror = function () {
            var errMsg = (tx.error && (tx.error.name || tx.error.message)) || 'IndexedDB write error';
            resolve({ ok: false, count: 0, error: errMsg });
          };
          tx.onabort = function () {
            var errMsg = (tx.error && (tx.error.name || tx.error.message)) || 'IndexedDB aborted (容量不足の可能性)';
            resolve({ ok: false, count: 0, error: errMsg });
          };
        } catch (e) {
          resolve({ ok: false, count: 0, error: e.message || String(e) });
        }
      });
    });
  }

  function audioDbClear() {
    return audioDbOpen().then(function (db) {
      if (!db) return;
      return new Promise(function (resolve) {
        try {
          var tx = db.transaction('clips', 'readwrite');
          tx.objectStore('clips').clear();
          tx.oncomplete = function () { resolve(); };
          tx.onerror = function () { resolve(); };
        } catch (e) {
          resolve();
        }
      });
    });
  }

  function getAllAppAudioFilesOrdered() {
    var seen = {};
    var out = [];
    function pushFile(f) {
      var name = String(f || '').trim();
      if (name && !seen[name]) { seen[name] = true; out.push(name); }
    }
    // 優先順位1: 今の練習キュー
    for (var i = 0; i < state.studyQueueIds.length; i++) {
      var qc = findCardById(state.studyQueueIds[i]);
      if (qc && qc.audioFile) pushFile(qc.audioFile);
    }
    // 優先順位2: 頻出語彙順
    var byFreq = state.vocab.slice().sort(function (a, b) {
      return (Number(b.seenCount) || 1) - (Number(a.seenCount) || 1);
    });
    for (var j = 0; j < byFreq.length; j++) pushFile(byFreq[j].audioFile);
    // 優先順位3: 長文オーバーラッピング
    for (var k = 0; k < state.passages.length; k++) pushFile(state.passages[k].audioFile);
    return out;
  }

  function renderAudioCacheStatusUi() {
    var allFiles = getAllAppAudioFilesOrdered();
    var total = allFiles.length;
    var cached = 0;
    for (var i = 0; i < allFiles.length; i++) {
      if (state.cachedAudioSet[allFiles[i]]) cached++;
    }

    var badge = document.getElementById('settingsAudioCacheBadge');
    if (badge) badge.textContent = cached + ' / ' + total;

    var settingsBtn = document.getElementById('settingsBulkDownloadBtn');
    if (settingsBtn) {
      if (state.bulkDownloadRunning) {
        settingsBtn.textContent = '止める';
      } else if (total > 0 && cached >= total) {
        settingsBtn.textContent = 'すべて保存ずみ';
      } else {
        settingsBtn.textContent = cached > 0 ? '続きを保存' : '保存する';
      }
    }

    var bar = document.getElementById('audioCacheBar');
    if (!bar) return;
    var folderReady = Boolean(state.audioFolderStatus && state.audioFolderStatus.ready);
    if (!folderReady || total === 0 || (!state.bulkDownloadRunning && cached >= total)) {
      bar.style.display = 'none';
      return;
    }

    bar.style.display = 'block';
    var pct = total > 0 ? Math.min(100, Math.round((cached / total) * 100)) : 0;
    var titleEl = document.getElementById('audioCacheTitle');
    var subEl = document.getElementById('audioCacheSub');
    var btnEl = document.getElementById('bulkDownloadAudioBtn');
    var pWrap = document.getElementById('audioCacheProgressWrap');
    var pFill = document.getElementById('audioCacheProgressFill');

    if (state.bulkDownloadRunning) {
      titleEl.textContent = '音声を保存しています… ' + pct + '%';
      subEl.textContent = cached + ' / ' + total + '（保存中もそのまま使えます）';
      btnEl.textContent = '止める';
      pWrap.style.display = 'block';
      pFill.style.width = pct + '%';
    } else {
      titleEl.textContent = cached > 0 ? ('音声を ' + pct + '% 保存ずみ') : '音声をこの端末に保存';
      subEl.textContent = cached > 0 ? ('残り ' + (total - cached) + ' 件。保存すると待たずに再生できます') : (total + ' 件。保存すると、待たずに・通信なしで再生できます');
      btnEl.textContent = cached > 0 ? '続きを保存' : '保存する';
      pWrap.style.display = cached > 0 ? 'block' : 'none';
      pFill.style.width = pct + '%';
    }
  }

  function hydrateFromLocalCache(audioFiles) {
    if (!audioFiles || audioFiles.length === 0) return;
    var targets = [];
    for (var i = 0; i < audioFiles.length; i++) {
      var f = String(audioFiles[i] || '').trim();
      if (!f || state.audioBlobUrls[f] || !state.cachedAudioSet[f]) continue;
      if (targets.indexOf(f) === -1) targets.push(f);
      if (targets.length >= 24) break;
    }
    if (targets.length === 0) return;

    audioDbOpen().then(function (db) {
      if (!db) return;
      try {
        var tx = db.transaction('clips', 'readonly');
        var store = tx.objectStore('clips');
        targets.forEach(function (fname) {
          var req = store.get(fname);
          req.onsuccess = function () {
            var rec = req.result;
            if (rec && rec.buffer && !state.audioBlobUrls[fname]) {
              putRamBlobUrl(fname, rec.buffer, rec.mime);
            }
          };
        });
      } catch (e) {}
    });
  }

  function saveClipsMapToCache(clipsMap, hydrateToRam) {
    var names = Object.keys(clipsMap || {});
    if (names.length === 0) return Promise.resolve(0);
    var records = [];
    for (var i = 0; i < names.length; i++) {
      var fname = names[i];
      var b64 = clipsMap[fname];
      if (!b64) continue;
      try {
        var rec = decodeBase64ToRecord(fname, b64);
        records.push(rec);
        if (hydrateToRam) {
          putRamBlobUrl(fname, rec.buffer, rec.mime);
        }
      } catch (eDec) {}
    }
    if (records.length === 0) return Promise.resolve(0);
    return audioDbPutMany(records).then(function (res) {
      if (res && res.ok) {
        for (var j = 0; j < records.length; j++) {
          state.cachedAudioSet[records[j].name] = true;
        }
        return records.length;
      }
      if (res && res.error) {
        throw new Error('端末保存エラー：端末に保存できませんでした。空き容量を確かめてください（' + res.error + '）');
      }
      return 0;
    });
  }

  function prefetchAudioFiles(audioFiles) {
    if (!audioFiles || audioFiles.length === 0) return;
    hydrateFromLocalCache(audioFiles);
    if (!state.audioFolderStatus || !state.audioFolderStatus.ready) return;

    var needed = [];
    for (var i = 0; i < audioFiles.length; i++) {
      var f = String(audioFiles[i] || '').trim();
      if (!f || state.audioBlobUrls[f] || state.cachedAudioSet[f] || state.audioLoadingMap[f]) continue;
      if (needed.indexOf(f) === -1) needed.push(f);
      if (needed.length >= 8) break;
    }
    if (needed.length === 0) return;

    var batchPromise = callGas('apiGetAudioClipsBatch', needed)
      .then(function (data) {
        var clips = (data && data.clips) || {};
        return saveClipsMapToCache(clips, true).then(function () {
          needed.forEach(function (fname) { delete state.audioLoadingMap[fname]; });
          renderAudioCacheStatusUi();
          return clips;
        });
      })
      .catch(function () {
        needed.forEach(function (fname) { delete state.audioLoadingMap[fname]; });
        return {};
      });

    needed.forEach(function (fname) {
      state.audioLoadingMap[fname] = batchPromise.then(function () {
        return state.audioBlobUrls[fname] || null;
      });
    });
  }

  function ensureAudioBlobUrl(audioFile) {
    var fname = String(audioFile || '').trim();
    if (!fname) return Promise.resolve(null);
    if (state.audioBlobUrls[fname]) return Promise.resolve(state.audioBlobUrls[fname]);
    if (state.audioLoadingMap[fname]) return state.audioLoadingMap[fname];

    // 1. IndexedDB に保存済みならサーバー通信ゼロ・約2msで即ロード
    if (state.cachedAudioSet[fname]) {
      return audioDbGet(fname).then(function (rec) {
        if (rec && rec.buffer) {
          return putRamBlobUrl(fname, rec.buffer, rec.mime);
        }
        delete state.cachedAudioSet[fname];
        return ensureAudioBlobUrl(fname);
      });
    }

    // 2. 未保存ならサーバーから取得し、そのまま IndexedDB にも永続保存
    var p = callGas('apiGetAudioClipsBatch', [fname])
      .then(function (data) {
        if (data && data.folderReady === false) {
          state.audioFolderStatus.ready = false;
          renderHeaderAndStats();
        }
        var clips = (data && data.clips) || {};
        if (!clips[fname]) {
          delete state.audioLoadingMap[fname];
          return null;
        }
        return saveClipsMapToCache(clips, true).then(function () {
          delete state.audioLoadingMap[fname];
          renderAudioCacheStatusUi();
          return state.audioBlobUrls[fname] || null;
        });
      })
      .catch(function (err) {
        delete state.audioLoadingMap[fname];
        throw err;
      });
    state.audioLoadingMap[fname] = p;
    return p;
  }

  function startBulkAudioDownload() {
    if (state.bulkDownloadRunning) {
      state.bulkDownloadCancel = true;
      showToast('保存を止めています…');
      return;
    }
    if (!state.audioFolderStatus || !state.audioFolderStatus.ready) {
      showToast('先に Google ドライブに SabaAudioClips フォルダを置いてください', true);
      return;
    }

    state.bulkDownloadRunning = true;
    state.bulkDownloadCancel = false;
    renderAudioCacheStatusUi();

    var titleEl = document.getElementById('audioCacheTitle');
    if (titleEl) titleEl.textContent = '音声の一覧を確かめています…';

    callGas('apiListAudioInventory')
      .then(function (inv) {
        if (!inv || !inv.folderReady) {
          throw new Error('音声フォルダが見つかりません');
        }
        var fileMap = inv.fileMap || {};
        var packs = inv.packs || [];

        // バンドルパック (saba_audio_pack_*.json) がある場合は未取得パックだけを超高速取得
        var donePacks = {};
        try { donePacks = JSON.parse(safeStorageGet('saba_done_pack_ids') || '{}') || {}; } catch (eDp) { donePacks = {}; }
        var packChain = Promise.resolve();
        if (packs.length > 0) {
          packs.forEach(function (pk) {
            if (donePacks[pk.id]) return;
            packChain = packChain.then(function () {
              if (state.bulkDownloadCancel) return;
              return callGas('apiGetAudioPackById', pk.id)
                .then(function (res) {
                  return saveClipsMapToCache((res && res.clips) || {}, false).then(function () {
                    donePacks[pk.id] = Date.now();
                    try { safeStorageSet('saba_done_pack_ids', JSON.stringify(donePacks)); } catch (eSp) {}
                    renderAudioCacheStatusUi();
                  });
                })
                .catch(function () {});
            });
          });
        }

        return packChain.then(function () {
          var ordered = getAllAppAudioFilesOrdered();
          var missingItems = [];
          var notOnDriveSaba = 0;
          var notOnDriveGura = 0;
          var notOnDriveOther = 0;
          for (var i = 0; i < ordered.length; i++) {
            var fname = ordered[i];
            if (state.cachedAudioSet[fname]) continue;
            if (fileMap[fname]) {
              missingItems.push({ name: fname, id: fileMap[fname] });
            } else if (fname.indexOf('gura_') === 0) {
              notOnDriveGura++;
            } else if (fname.indexOf('saba_') === 0) {
              notOnDriveSaba++;
            } else {
              notOnDriveOther++;
            }
          }

          var notOnDriveTotal = notOnDriveSaba + notOnDriveGura + notOnDriveOther;
          if (missingItems.length === 0) {
            return {
              completedAll: notOnDriveTotal === 0,
              downloadedNow: 0,
              notOnDriveTotal: notOnDriveTotal,
              notOnDriveSaba: notOnDriveSaba,
              notOnDriveGura: notOnDriveGura,
              driveTotalFiles: inv.totalFiles || 0
            };
          }

          // 20件ずつチャンク化して3並列ワーカーで超高速ダウンロード
          var chunks = [];
          var CHUNK_SIZE = 20;
          for (var c = 0; c < missingItems.length; c += CHUNK_SIZE) {
            chunks.push(missingItems.slice(c, c + CHUNK_SIZE));
          }

          var downloadedNow = 0;
          var storageError = '';
          var CONCURRENCY = 3;

          function runWorker() {
            if (state.bulkDownloadCancel || storageError || chunks.length === 0) return Promise.resolve();
            var batch = chunks.shift();
            if (!batch || batch.length === 0) return Promise.resolve();

            return callGas('apiGetAudioClipsByIds', batch)
              .then(function (res) {
                var clips = (res && res.clips) || {};
                var deferred = (res && res.deferred) || [];
                if (deferred.length > 0 && !state.bulkDownloadCancel) {
                  chunks.push(deferred);
                }
                return saveClipsMapToCache(clips, false).then(function (savedCount) {
                  downloadedNow += savedCount;
                  renderAudioCacheStatusUi();
                  if (downloadedNow <= 60) {
                    hydrateUpcomingStudyAndLibrary();
                  }
                });
              })
              .catch(function (err) {
                var msg = (err && err.message) || '';
                if (msg.indexOf('端末保存エラー') === 0) {
                  storageError = msg;
                  return;
                }
                // 一時ネットワーク/GASエラーは最大2回まで再試行
                batch._retryCount = (batch._retryCount || 0) + 1;
                if (batch._retryCount <= 2 && !state.bulkDownloadCancel) {
                  chunks.push(batch);
                }
              })
              .then(runWorker);
          }

          var workers = [];
          for (var w = 0; w < Math.min(CONCURRENCY, chunks.length); w++) {
            workers.push(runWorker());
          }
          return Promise.all(workers).then(function () {
            return {
              completedAll: !state.bulkDownloadCancel && !storageError && chunks.length === 0 && notOnDriveTotal === 0,
              downloadedNow: downloadedNow,
              notOnDriveTotal: notOnDriveTotal,
              notOnDriveSaba: notOnDriveSaba,
              notOnDriveGura: notOnDriveGura,
              storageError: storageError,
              driveTotalFiles: inv.totalFiles || 0
            };
          });
        });
      })
      .then(function (summary) {
        state.bulkDownloadRunning = false;
        hydrateUpcomingStudyAndLibrary();
        renderAudioCacheStatusUi();
        if (summary && summary.storageError) {
          showToast(summary.storageError, true);
        } else if (state.bulkDownloadCancel) {
          showToast('保存を止めました（次は続きから保存します）');
        } else if (summary && summary.completedAll) {
          showToast('すべての音声を保存しました。これからは待たずに再生できます');
        } else if (summary && summary.notOnDriveTotal > 0) {
          var detail = [];
          if (summary.notOnDriveSaba > 0) detail.push('saba新規 ' + summary.notOnDriveSaba + '件');
          if (summary.notOnDriveGura > 0) detail.push('Gura ' + summary.notOnDriveGura + '件');
          var prefix = summary.downloadedNow > 0 ? (summary.downloadedNow + ' 件保存。') : '';
          showToast(prefix + 'ドライブに見つからない音声が ' + summary.notOnDriveTotal + ' 件あります（' + detail.join(' / ') + '）', true);
        }
      })
      .catch(function (err) {
        state.bulkDownloadRunning = false;
        renderAudioCacheStatusUi();
        showToast('音声を保存できませんでした：' + err.message, true);
      });
  }

  function hydrateUpcomingStudyAndLibrary() {
    var toWarm = [];
    for (var i = 0; i < Math.min(20, state.studyQueueIds.length - state.studyIndex); i++) {
      var c = findCardById(state.studyQueueIds[state.studyIndex + i]);
      if (c && c.audioFile) toWarm.push(c.audioFile);
    }
    var visibleLib = getFilteredLibraryCards().slice(0, 20);
    for (var j = 0; j < visibleLib.length; j++) {
      if (visibleLib[j].audioFile) toWarm.push(visibleLib[j].audioFile);
    }
    for (var k = 0; k < Math.min(8, state.passages.length); k++) {
      if (state.passages[k].audioFile) toWarm.push(state.passages[k].audioFile);
    }
    hydrateFromLocalCache(toWarm);
  }

  function initLocalAudioCacheAfterBootstrap() {
    audioDbGetAllKeys().then(function (keys) {
      var map = {};
      for (var i = 0; i < keys.length; i++) map[keys[i]] = true;
      state.cachedAudioSet = map;
      renderAudioCacheStatusUi();
      hydrateUpcomingStudyAndLibrary();
      // 初回表示直後に練習キュー先頭6件だけ裏で先読みしておく
      prefetchUpcomingStudyAudio();
    });
  }

  function parseAudioFileRange(audioFile) {
    var m = /_(\d+)_(\d+)\.mp3$/i.exec(String(audioFile || ''));
    if (!m) return null;
    return { fileStart: parseInt(m[1], 10) / 10, fileEnd: parseInt(m[2], 10) / 10 };
  }

  function computeClipTrimBounds(obj, mediaDur) {
    var hasDur = Boolean(mediaDur && isFinite(mediaDur) && mediaDur > 0);
    var fr = parseAudioFileRange(obj && obj.audioFile);
    if (!fr || !obj) {
      var fallbackEnd = hasDur ? mediaDur : Math.max(1, ((Number(obj && obj.endSec) || 5) - (Number(obj && obj.startSec) || 0)));
      return { start: 0, end: fallbackEnd };
    }
    var relS = Math.max(0, (Number(obj.startSec) || fr.fileStart) - fr.fileStart);
    var relE = (Number(obj.endSec) || fr.fileEnd) - fr.fileStart;
    if (hasDur) {
      relS = Math.min(Math.max(0, mediaDur - 0.5), relS);
      relE = Math.min(mediaDur, Math.max(relS + 0.6, relE));
    } else {
      relE = Math.max(relS + 0.6, relE);
    }
    return { start: relS, end: relE };
  }

  function stopClipTrimWatcher() {
    if (state.clipTrimTimerId) {
      clearInterval(state.clipTrimTimerId);
      state.clipTrimTimerId = null;
    }
  }

  function updateTrimProgressUi(curSec, bounds) {
    var span = Math.max(0.4, (bounds.end || 1) - (bounds.start || 0));
    var rel = Math.max(0, Math.min(span, curSec - (bounds.start || 0)));
    document.getElementById('clipCurTime').textContent = formatSec(rel);
    document.getElementById('clipEndTime').textContent = formatSec(span);
    var pct = Math.max(0, Math.min(100, (rel / span) * 100));
    document.getElementById('clipProgressFill').style.width = pct.toFixed(1) + '%';
  }

  function startClipTrimWatcher() {
    stopClipTrimWatcher();
    state.clipTrimTimerId = setInterval(function () {
      var audio = state.audioEl;
      if (!audio || audio.paused) return;
      if (audio.src && audio.src.indexOf('data:audio/wav;base64,UklGRig') === 0) return;
      var b = state.activeTrimBounds;
      if (!b || !b.end || b.end <= b.start) return;

      var cur = audio.currentTime || 0;
      if (cur < b.start - 0.08 && audio.readyState >= 1) {
        try { audio.currentTime = b.start; } catch (eS) {}
        return;
      }

      updateTrimProgressUi(cur, b);

      // 終了直前 90ms を滑らかにフェードアウト（PC/Android等で自然な余韻、iOSは無音谷で綺麗に終了）
      var remain = b.end - cur;
      if (remain <= 0.09 && remain > 0) {
        try { audio.volume = Math.max(0.05, remain / 0.09); } catch (eV1) {}
      } else if (audio.volume !== 1) {
        try { audio.volume = 1.0; } catch (eV2) {}
      }

      // 例文の終わりでピタッと停止またはループ！
      if (cur >= b.end - 0.015) {
        try { audio.volume = 1.0; } catch (eV3) {}
        if (state.loopMode) {
          try { audio.currentTime = b.start; } catch (eL) {}
          updateTrimProgressUi(b.start, b);
        } else {
          stopClipTrimWatcher();
          try { audio.pause(); } catch (eP) {}
          try { audio.currentTime = b.start; } catch (eR) {}
          state.playerStatus = 'paused';
          document.getElementById('clipCurTime').textContent = formatSec(Math.max(0.4, b.end - b.start));
          document.getElementById('clipProgressFill').style.width = '100%';
          updatePlayerButtonsUi();
          if (state.autoplayActive) {
            handleAutoplayClipFinished();
          }
        }
      }
    }, 25);
  }

  function initAudioElement() {
    var audio = document.getElementById('sabaAudioEl');
    state.audioEl = audio;
    if (!audio) return;

    function isUnlockDummySrc() {
      return Boolean(audio.src && audio.src.indexOf('data:audio/wav;base64,UklGRig') === 0);
    }

    audio.addEventListener('loadedmetadata', function () {
      if (isUnlockDummySrc()) return;
      var obj = getActiveClipObject();
      var b = computeClipTrimBounds(obj, audio.duration);
      state.activeTrimBounds = b;
      document.getElementById('clipEndTime').textContent = formatSec(Math.max(0.4, b.end - b.start));
      if (b.start > 0.03 && audio.currentTime < b.start - 0.03) {
        try { audio.currentTime = b.start; } catch (eMeta) {}
      }
    });
    audio.addEventListener('play', function () {
      if (isUnlockDummySrc()) return;
      try { audio.volume = 1.0; } catch (eV) {}
      state.playerStatus = 'playing';
      setPlayerHint('');
      updatePlayerButtonsUi();
      startClipTrimWatcher();
    });
    audio.addEventListener('pause', function () {
      if (isUnlockDummySrc()) return;
      stopClipTrimWatcher();
      try { audio.volume = 1.0; } catch (eV) {}
      if (!audio.ended) {
        state.playerStatus = 'paused';
        updatePlayerButtonsUi();
      }
    });
    audio.addEventListener('timeupdate', function () {
      if (isUnlockDummySrc()) return;
      var b = state.activeTrimBounds;
      if (b && b.end > b.start) {
        updateTrimProgressUi(audio.currentTime || 0, b);
      } else {
        var cur = audio.currentTime || 0;
        var dur = audio.duration || 0;
        document.getElementById('clipCurTime').textContent = formatSec(cur);
        if (dur > 0 && isFinite(dur)) {
          document.getElementById('clipEndTime').textContent = formatSec(dur);
          var pct = Math.max(0, Math.min(100, (cur / dur) * 100));
          document.getElementById('clipProgressFill').style.width = pct.toFixed(1) + '%';
        }
      }
    });
    audio.addEventListener('ended', function () {
      if (isUnlockDummySrc()) return;
      stopClipTrimWatcher();
      try { audio.volume = 1.0; } catch (eV) {}
      var b = state.activeTrimBounds || { start: 0, end: 0 };
      if (state.loopMode) {
        try { audio.currentTime = b.start || 0; } catch (eL) {}
        audio.play().catch(function () {});
        return;
      }
      state.playerStatus = 'paused';
      document.getElementById('clipProgressFill').style.width = '100%';
      updatePlayerButtonsUi();
      if (state.autoplayActive) {
        handleAutoplayClipFinished();
      }
    });
    audio.addEventListener('error', function () {
      if (isUnlockDummySrc()) return;
      stopClipTrimWatcher();
      state.playerStatus = 'idle';
      updatePlayerButtonsUi();
      setPlayerHint('音声を再生できませんでした。右端のボタンで YouTube の該当場面を開けます。');
    });
  }

  function playClipObject(obj, clipType, forceLoop, inlineOnly) {
    if (!obj) return;
    state.activeCardId = obj.id;
    state.activeClipType = clipType;
    state.activeAudioFile = obj.audioFile || '';
    if (forceLoop) state.loopMode = true;

    var dock = document.getElementById('playerDock');
    if (inlineOnly) {
      dock.classList.add('hidden');
    } else {
      dock.classList.remove('hidden');
    }

    var label = clipType === 'passage'
      ? (obj.titleJa || '長文')
      : (obj.expression + ' ・ ' + (obj.channelName || 'saba'));
    document.getElementById('playerNowTitle').innerHTML = ic(clipType === 'passage' ? 'mic' : 'volume') + '<span>' + escapeHtml(label) + '</span>';
    document.getElementById('openYoutubeAppLink').href = safeYoutubeUrl(null, obj.videoId, obj.startSec || 0);
    document.getElementById('clipCurTime').textContent = '00:00';
    document.getElementById('clipEndTime').textContent = formatSec(Math.max(1, (obj.endSec || 5) - (obj.startSec || 0)));
    document.getElementById('clipProgressFill').style.width = '0%';
    updateLibraryPlayingHighlight();

    var audio = state.audioEl;
    if (!audio) return;

    if (!obj.audioFile) {
      audio.pause();
      state.playerStatus = 'idle';
      updatePlayerButtonsUi();
      setPlayerHint('この表現には音声がありません。右端のボタンで YouTube の該当場面を開けます。');
      return;
    }

    // キャッシュ済みならタップ同期フロー内で 0.00秒 即再生（iOS Safari で最高レスポンス！）
    var cachedUrl = state.audioBlobUrls[obj.audioFile];
    if (cachedUrl) {
      startAudioFromUrl(cachedUrl);
      return;
    }

    // iOS Safari 向け: 非同期取得前にユーザージェスチャ内で audio 要素を一度アンロック
    try {
      if (!audio.src || audio.paused) {
        audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        var unlockP = audio.play();
        if (unlockP && typeof unlockP.catch === 'function') unlockP.catch(function () {});
        audio.pause();
      }
    } catch (eUnlock) {}

    // IndexedDBに保存済みなら約2msで即ロードするため「読み込み中」表示を出さずシームレス再生
    var isInLocalDb = Boolean(state.cachedAudioSet[obj.audioFile]);
    if (!isInLocalDb) {
      state.playerStatus = 'loading';
      updatePlayerButtonsUi();
      setPlayerHint('音声を取り寄せています…（記録タブで音声を端末に保存すると、待たずに再生できます）');
    } else {
      setPlayerHint('');
    }

    ensureAudioBlobUrl(obj.audioFile)
      .then(function (blobUrl) {
        if (state.activeCardId !== obj.id) return;
        if (!blobUrl) {
          state.playerStatus = 'idle';
          updatePlayerButtonsUi();
          setPlayerHint('Google ドライブの「' + (state.audioFolderStatus.folderName || 'SabaAudioClips') + '」フォルダに、この音声が見つかりません。右端のボタンで YouTube を開けます。');
          return;
        }
        startAudioFromUrl(blobUrl);
      })
      .catch(function (err) {
        state.playerStatus = 'idle';
        updatePlayerButtonsUi();
        setPlayerHint('音声を取り寄せられませんでした：' + err.message);
      });
  }

  function startAudioFromUrl(blobUrl) {
    var audio = state.audioEl;
    if (!audio) return;
    try {
      stopClipTrimWatcher();
      audio.pause();
      var obj = getActiveClipObject();
      var sameSrc = (audio.src === blobUrl);
      if (!sameSrc) {
        audio.src = blobUrl;
      }
      var b = computeClipTrimBounds(obj, sameSrc ? audio.duration : 0);
      state.activeTrimBounds = b;
      document.getElementById('clipCurTime').textContent = '00:00';
      document.getElementById('clipEndTime').textContent = formatSec(Math.max(0.4, b.end - b.start));
      document.getElementById('clipProgressFill').style.width = '0%';
      try { audio.volume = 1.0; } catch (eV) {}
      if (sameSrc && audio.readyState >= 1) {
        audio.currentTime = b.start;
      } else {
        try { audio.currentTime = b.start; } catch (eSeek) {}
      }
      audio.playbackRate = state.playbackRate;
      // 精密トリミング終了位置 (b.end) を25msウォッチャーで制御するため native loop はOFF
      audio.loop = false;
      var playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {
          state.playerStatus = 'paused';
          updatePlayerButtonsUi();
          setPlayerHint('はじめの1回だけ、もう一度再生ボタンを押してください（iPhone の決まりです）。');
        });
      }
    } catch (e) {
      state.playerStatus = 'paused';
      updatePlayerButtonsUi();
    }
  }

  function pausePlayerQuietly() {
    stopClipTrimWatcher();
    if (state.audioEl) {
      try { state.audioEl.pause(); } catch (e) {}
      try { state.audioEl.volume = 1.0; } catch (eV) {}
    }
    state.playerStatus = 'paused';
    updatePlayerButtonsUi();
  }

  function closePlayerDock() {
    stopAutoplayMode();
    pausePlayerQuietly();
    state.activeCardId = null;
    document.getElementById('playerDock').classList.add('hidden');
    updateLibraryPlayingHighlight();
  }

  function setPlayerHint(msg) {
    var el = document.getElementById('playerHint');
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('visible', Boolean(msg));
  }

  // 再生ボタンの見た目を、いまの状態（止まっている・読み込み中・再生中）に合わせる
  function paintPlayButton(btn, isActive, idleLabel, idleSub) {
    if (!btn) return;
    var playing = isActive && state.playerStatus === 'playing';
    var loading = isActive && state.playerStatus === 'loading';
    btn.classList.toggle('is-playing', playing);
    btn.classList.toggle('is-loading', loading);
    if (playing) setBtnContent(btn, 'pause', '止める');
    else if (loading) setBtnContent(btn, 'loader', '読み込み中');
    else setBtnContent(btn, 'play', idleLabel, idleSub);
  }

  function updatePlayerButtonsUi() {
    var dockActive = Boolean(state.activeCardId);
    paintPlayButton(document.getElementById('playPauseClipBtn'), dockActive, '再生');

    var loopBtn = document.getElementById('loopToggleBtn');
    loopBtn.classList.toggle('active', state.loopMode);
    loopBtn.setAttribute('aria-pressed', String(state.loopMode));
    if (state.audioEl) state.audioEl.loop = false;

    document.getElementById('speedCycleBtn').textContent = state.playbackRate + 'x';

    // 詳しい説明の画面が開いているときは、その中のボタンも合わせる
    var modalPlayBtn = document.getElementById('modalPlayBtn');
    if (modalPlayBtn && state.detailModalCardId) {
      var isThisCardActive = state.activeClipType === 'vocab' && state.activeCardId === state.detailModalCardId;
      paintPlayButton(modalPlayBtn, isThisCardActive, '音声を聴く');
    }
    var modalLoopBtn = document.getElementById('modalLoopBtn');
    if (modalLoopBtn) {
      modalLoopBtn.classList.toggle('active', state.loopMode);
      modalLoopBtn.setAttribute('aria-pressed', String(state.loopMode));
    }
    var modalSpeedBtn = document.getElementById('modalSpeedBtn');
    if (modalSpeedBtn) modalSpeedBtn.textContent = state.playbackRate + 'x';

    // 単語カードの中のボタン
    var studyPlayBtn = document.getElementById('studyPlayClipBtn');
    if (studyPlayBtn) {
      var curStudyId = state.studyQueueIds[state.studyIndex];
      var isStudyCardActive = state.activeClipType === 'vocab' && curStudyId && state.activeCardId === curStudyId;
      paintPlayButton(studyPlayBtn, isStudyCardActive, studyPlayBtn.getAttribute('data-idle-label') || '聴く', studyPlayBtn.getAttribute('data-idle-sub') || '');
    }
    var studyLoopBtn = document.getElementById('studyLoopBtn');
    if (studyLoopBtn) {
      studyLoopBtn.classList.toggle('active', state.loopMode);
      studyLoopBtn.setAttribute('aria-pressed', String(state.loopMode));
    }
    var studySpeedBtn = document.getElementById('studySpeedBtn');
    if (studySpeedBtn) studySpeedBtn.textContent = state.playbackRate + 'x';

    // 長文の中のボタン
    var passagePlayBtn = document.getElementById('playPassageHeroBtn');
    if (passagePlayBtn) {
      var isPassageActive = state.activeClipType === 'passage' && state.selectedPassageId && state.activeCardId === state.selectedPassageId;
      paintPlayButton(passagePlayBtn, isPassageActive, passagePlayBtn.getAttribute('data-idle-label') || '再生', passagePlayBtn.getAttribute('data-idle-sub') || '');
    }
    var pLoopBtn = document.getElementById('passageLoopBtn');
    if (pLoopBtn) {
      pLoopBtn.classList.toggle('active', state.loopMode);
      pLoopBtn.setAttribute('aria-pressed', String(state.loopMode));
    }
    var pSpeedBtn = document.getElementById('passageSpeedBtn');
    if (pSpeedBtn) pSpeedBtn.textContent = state.playbackRate + 'x';
  }

  function updateLibraryPlayingHighlight() {
    var items = document.querySelectorAll('.vocab-list-item');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('playing', items[i].getAttribute('data-card-id') === state.activeCardId && state.activeClipType === 'vocab');
    }
  }

  /* ============================================================
   * Autoplay (聴き流しシャドーイング: 広告ゼロ MP3 連続再生!)
   * ============================================================ */
  function startAutoplayFromLibrary(cards) {
    var playable = (cards || []).filter(function (c) { return Boolean(c.audioFile); });
    if (playable.length === 0) {
      showToast('音声のある表現がありません', true);
      return;
    }
    stopAutoplayMode();
    state.autoplayActive = true;
    state.autoplayQueueIds = playable.map(function (c) { return c.id; });
    state.autoplayIdx = 0;
    state.loopMode = false;
    updatePlayerButtonsUi();
    requestWakeLock();
    playCurrentAutoplayItem();
  }

  function playCurrentAutoplayItem() {
    if (!state.autoplayActive) return;
    if (state.autoplayIdx >= state.autoplayQueueIds.length) {
      showToast('聴き流しを1周しました');
      stopAutoplayMode();
      return;
    }
    var card = findCardById(state.autoplayQueueIds[state.autoplayIdx]);
    if (!card) { state.autoplayIdx++; playCurrentAutoplayItem(); return; }

    // 次の2件を先読みキャッシュ
    var upcoming = [];
    for (var k = 1; k <= 2; k++) {
      var nc = findCardById(state.autoplayQueueIds[state.autoplayIdx + k]);
      if (nc && nc.audioFile) upcoming.push(nc.audioFile);
    }
    prefetchAudioFiles(upcoming);

    var banner = document.getElementById('autoplayBanner');
    banner.classList.add('visible');
    document.getElementById('autoplayStatusText').textContent =
      '聴き流し ' + (state.autoplayIdx + 1) + '/' + state.autoplayQueueIds.length + '：' + card.expression;
    playClipObject(card, 'vocab', false);
  }

  function handleAutoplayClipFinished() {
    var card = findCardById(state.autoplayQueueIds[state.autoplayIdx]);
    document.getElementById('autoplayStatusText').textContent =
      'まねして言ってみよう：' + (card ? (card.expression + '（' + card.meaningJa + '）') : '');
    state.autoplayPauseTimerId = setTimeout(function () {
      state.autoplayIdx++;
      playCurrentAutoplayItem();
    }, 2200);
  }

  function stopAutoplayMode() {
    state.autoplayActive = false;
    if (state.autoplayPauseTimerId) {
      clearTimeout(state.autoplayPauseTimerId);
      state.autoplayPauseTimerId = null;
    }
    var banner = document.getElementById('autoplayBanner');
    if (banner) banner.classList.remove('visible');
    releaseWakeLock();
  }

  function requestWakeLock() {
    try {
      if (navigator.wakeLock && navigator.wakeLock.request) {
        navigator.wakeLock.request('screen').then(function (s) { state.wakeLockSentinel = s; }).catch(function () {});
      }
    } catch (e) {}
  }

  function releaseWakeLock() {
    try { if (state.wakeLockSentinel) { state.wakeLockSentinel.release(); state.wakeLockSentinel = null; } } catch (e) {}
  }

  /* ============================================================
   * Rendering: Header, Creator Filters & Banners
   * ============================================================ */
  function renderCreatorSelects() {
    var creators = getCreatorList();
    var multiCreator = creators.length > 1;
    var ids = [
      { id: 'studyCreatorSelect', val: state.studyCreator, autoHide: true },
      { id: 'shadowCreatorSelect', val: state.shadowCreator, autoHide: true },
      { id: 'libraryCreatorSelect', val: state.libraryCreator, autoHide: false }
    ];
    ids.forEach(function (cfg) {
      var el = document.getElementById(cfg.id);
      if (!el) return;
      if (cfg.autoHide) {
        el.style.display = multiCreator ? '' : 'none';
      }
      var opts = ['<option value="all">全配信者 (' + creators.length + ')</option>'];
      creators.forEach(function (c) {
        opts.push('<option value="' + escapeHtml(c) + '">' + escapeHtml(c) + '</option>');
      });
      el.innerHTML = opts.join('');
      el.value = creators.indexOf(cfg.val) !== -1 ? cfg.val : 'all';
    });
  }

  function renderHeaderAndStats() {
    var st = state.stats || {
      counts: { total: 0, dueCount: 0, masteredCount: 0, learningCount: 0, newCount: 0, weakCount: 0 },
      byLevel: { Basic: 0, Natural: 0, Slang: 0 },
      streakDays: 0, todayReviewed: 0, dailyGoal: 25, goalProgressPct: 0, recent7Days: []
    };

    var audioReadyCount = state.vocab.filter(function (v) { return Boolean(v.audioFile); }).length;
    document.getElementById('topSubStatus').textContent =
      (DEMO ? 'デモ ・ ' : '') + st.counts.total + ' 語 ・ 長文 ' + state.passages.length + ' 本';
    document.getElementById('streakBadge').innerHTML = ic('flame') + '<span class="num">' + Number(st.streakDays || 0) + '</span>';
    document.getElementById('streakBadge').setAttribute('aria-label', '連続 ' + st.streakDays + ' 日');
    var goal = Math.max(1, Number(st.dailyGoal) || 25);
    var goalRatio = Math.min(1, (Number(st.todayReviewed) || 0) / goal);
    document.getElementById('todayGoalText').textContent = st.todayReviewed + '/' + goal;
    document.getElementById('goalRingBar').setAttribute('stroke-dashoffset', String(56.55 * (1 - goalRatio)));
    document.getElementById('todayGoalBadge').classList.toggle('is-done', goalRatio >= 1);
    document.getElementById('todayGoalBadge').setAttribute('aria-label', '今日 ' + st.todayReviewed + ' / ' + goal + ' 枚');

    var dueBadge = document.getElementById('navDueBadge');
    if (st.counts.dueCount > 0) {
      dueBadge.textContent = st.counts.dueCount > 99 ? '99+' : String(st.counts.dueCount);
      dueBadge.classList.remove('hidden');
    } else {
      dueBadge.classList.add('hidden');
    }

    document.getElementById('apiKeyBanner').style.display =
      state.apiKeyStatus && !state.apiKeyStatus.configured ? 'block' : 'none';

    var afBanner = document.getElementById('audioFolderBanner');
    if (afBanner) {
      var showAf = Boolean(state.audioFolderStatus && !state.audioFolderStatus.ready && state.vocab.length > 0);
      afBanner.style.display = showAf ? 'block' : 'none';
      if (showAf && state.audioFolderStatus.message) {
        document.getElementById('audioFolderMsg').textContent =
          state.audioFolderStatus.message + '。Google ドライブに「' + (state.audioFolderStatus.folderName || 'SabaAudioClips') + '」フォルダを置くと、音声が聴けるようになります。';
      }
    }

    var seedBanner = document.getElementById('seedImportBanner');
    var ss = state.seedSummary || {};
    if (seedBanner) {
      var needImport = Boolean(ss.available && ss.vocabCount > 0 && (audioReadyCount < Math.floor((ss.audioVocabCount || ss.vocabCount) * 0.5) || state.vocab.length < Math.floor(ss.vocabCount * 0.6)));
      seedBanner.style.display = needImport ? 'block' : 'none';
      if (needImport) {
        document.getElementById('seedImportTitle').textContent =
          '抽出済みの辞書があります（' + ss.streamCount + ' 配信・' + ss.vocabCount + ' 語・長文 ' + ss.passageCount + ' 本）';
      }
    }

    renderAudioCacheStatusUi();

    document.getElementById('goalProgressText').textContent = '今日 ' + st.todayReviewed + ' / ' + goal + ' 枚';
    document.getElementById('goalProgressSub').textContent = goalRatio >= 1
      ? '今日の目標を達成しました'
      : ('あと ' + Math.max(0, goal - st.todayReviewed) + ' 枚で今日の目標');
    document.getElementById('goalProgressPct').textContent = Math.round(goalRatio * 100) + '%';
    document.getElementById('statsRingBar').setAttribute('stroke-dashoffset', String(263.9 * (1 - goalRatio)));
    document.getElementById('goalBarFill').style.width = Math.round(goalRatio * 100) + '%';
    document.getElementById('statStreak').textContent = st.streakDays + '日';
    document.getElementById('statDue').textContent = String(st.counts.dueCount);
    document.getElementById('statTotal').textContent = String(st.counts.total);
    document.getElementById('statMastered').textContent = String(st.counts.masteredCount);

    var days = st.recent7Days || [];
    var maxCount = 1;
    for (var i = 0; i < days.length; i++) if (days[i].count > maxCount) maxCount = days[i].count;
    document.getElementById('chart7Days').innerHTML = days.map(function (d) {
      var hPct = d.count === 0 ? 6 : Math.max(12, Math.round((d.count / maxCount) * 100));
      return '<div class="chart-col"><span class="chart-count">' + Number(d.count) + '</span><div class="chart-bar" style="height:calc((100% - 38px) * ' + (hPct / 100) + ');"></div><span class="chart-label">' + escapeHtml(d.label) + '</span></div>';
    }).join('');

    var lb = st.byLevel || { Basic: 0, Natural: 0, Slang: 0 };
    document.getElementById('levelBreakdownBadges').innerHTML =
      '<span class="badge badge-level-Basic">Basic ' + (lb.Basic || 0) + '</span>' +
      '<span class="badge badge-level-Natural">Natural ' + (lb.Natural || 0) + '</span>' +
      '<span class="badge badge-level-Slang">Slang ' + (lb.Slang || 0) + '</span>' +
      '<span class="badge badge-weak">苦手 ' + (st.counts.weakCount || 0) + '</span>';
    renderTodayHero();
  }

  /* ============================================================
   * 単語：カード・4択・穴埋め
   * ============================================================ */
  function buildQuizOptionsForCard(card) {
    var pool = state.vocab.filter(function (v) {
      return v.id !== card.id && v.meaningJa && v.meaningJa !== card.meaningJa;
    });
    // シャッフルして3件のダミー意味を取得
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    var distractors = pool.slice(0, 3).map(function (d) {
      return { meaningJa: d.meaningJa, isCorrect: false };
    });
    var opts = distractors.concat([{ meaningJa: card.meaningJa, isCorrect: true }]);
    for (var k = opts.length - 1; k > 0; k--) {
      var r = Math.floor(Math.random() * (k + 1));
      var t = opts[k]; opts[k] = opts[r]; opts[r] = t;
    }
    return opts;
  }

  function prefetchUpcomingStudyAudio() {
    var localWarm = [];
    var netPrefetch = [];
    for (var offset = 0; offset <= 15; offset++) {
      var c = findCardById(state.studyQueueIds[state.studyIndex + offset]);
      if (c && c.audioFile) {
        localWarm.push(c.audioFile);
        if (offset <= 5) netPrefetch.push(c.audioFile);
      }
    }
    hydrateFromLocalCache(localWarm);
    prefetchAudioFiles(netPrefetch);
  }

  /* ============================================================
   * Study Groups (20語ユニット別 + テーマ別グループ)
   * ============================================================ */
  var UNIT_SIZE = 20;

  function getCreatorVocabSortedByFreq() {
    var creator = state.studyCreator;
    var list = state.vocab.filter(function (c) {
      return creator === 'all' || (c.channelName || 'saba') === creator;
    });
    list.sort(function (a, b) {
      var diff = (Number(b.seenCount) || 1) - (Number(a.seenCount) || 1);
      return diff !== 0 ? diff : String(a.expression || '').localeCompare(String(b.expression || ''));
    });
    return list;
  }

  function buildStudyGroups() {
    var allSorted = getCreatorVocabSortedByFreq();
    var units = [];
    for (var i = 0; i < allSorted.length; i += UNIT_SIZE) {
      var slice = allSorted.slice(i, i + UNIT_SIZE);
      var num = Math.floor(i / UNIT_SIZE) + 1;
      var learned = slice.filter(function (c) { return c.status === 'mastered' || (Number(c.reps) || 0) >= 1; }).length;
      var preview = slice.slice(0, 3).map(function (c) { return c.expression; }).join(' / ');
      units.push({
        id: 'unit_' + num,
        title: 'Unit ' + num,
        sub: '頻出 ' + (i + 1) + '〜' + (i + slice.length) + '位 · ' + preview,
        cards: slice,
        learned: learned,
        total: slice.length,
        featured: num === 1
      });
    }

    function takePriority(arr, limit) {
      var copy = arr.slice();
      copy.sort(function (a, b) {
        var am = a.status === 'mastered' ? 1 : 0;
        var bm = b.status === 'mastered' ? 1 : 0;
        if (am !== bm) return am - bm;
        return (Number(b.seenCount) || 1) - (Number(a.seenCount) || 1);
      });
      return limit ? copy.slice(0, limit) : copy;
    }

    var dueCards = allSorted.filter(isDueClient);
    var top50 = allSorted.slice(0, 50);
    var basicCards = allSorted.filter(function (c) { return c.level === 'Basic'; });
    var phrasalCards = allSorted.filter(function (c) { return c.category === 'Phrasal Verb' || c.category === 'Idiom'; });
    var slangCards = allSorted.filter(function (c) { return c.level === 'Slang' || c.category === 'Slang' || c.category === 'Reaction'; });
    var weakCards = allSorted.filter(isWeakCard);
    var favCards = allSorted.filter(function (c) { return Boolean(c.favorite); });

    var randPool = allSorted.slice();
    for (var r = randPool.length - 1; r > 0; r--) {
      var j = Math.floor(Math.random() * (r + 1));
      var t = randPool[r]; randPool[r] = randPool[j]; randPool[j] = t;
    }

    function makeSmart(id, title, sub, cards, featured) {
      var learned = cards.filter(function (c) { return c.status === 'mastered' || (Number(c.reps) || 0) >= 1; }).length;
      return { id: id, title: title, sub: sub, cards: cards, learned: learned, total: cards.length, featured: Boolean(featured) };
    }

    var smart = [
      makeSmart('smart_due', '今日の復習（20語）', '復習タイミングが来ている単語', takePriority(dueCards, 20), true),
      makeSmart('smart_top50', '超頻出 TOP 50', '配信で最もよく聞く 50 語', top50, true),
      makeSmart('smart_basic', '日常の基本 (Basic)', 'まずはここから・基本 30 語', takePriority(basicCards, 30), false),
      makeSmart('smart_phrasal', '句動詞・熟語', 'ネイティブらしい定番 30 語', takePriority(phrasalCards, 30), false),
      makeSmart('smart_slang', '配信スラング＆リアクション', '配信のノリが分かる 30 語', takePriority(slangCards, 30), false),
      makeSmart('smart_weak', '苦手克服', '間違えた単語だけ集中練習', weakCards.slice(0, 30), false),
      makeSmart('smart_fav', 'お気に入り ★', 'スターを付けた単語', favCards, false),
      makeSmart('smart_random20', 'ランダム 20問テスト', '全辞書から毎回ランダム出題', randPool.slice(0, 20), false)
    ];

    return { units: units, smart: smart };
  }

  function renderStudyViewVisibility() {
    var gView = document.getElementById('studyGroupView');
    var sView = document.getElementById('studySessionView');
    if (!gView || !sView) return;
    var inSession = state.studyView === 'session';
    gView.style.display = inSession ? 'none' : 'block';
    sView.style.display = inSession ? 'block' : 'none';
  }

  function showStudyGroupPicker() {
    flushPendingReview();
    pausePlayerQuietly();
    state.studyView = 'groups';
    state.studyStreamVideoId = 'all';
    renderStudyViewVisibility();
    renderStudyGroups();
  }

  function renderStudyGroups() {
    var container = document.getElementById('studyGroupListContainer');
    if (!container) return;

    var tabUnits = document.getElementById('groupTabUnitsBtn');
    var tabSmart = document.getElementById('groupTabSmartBtn');
    if (tabUnits && tabSmart) {
      tabUnits.classList.toggle('active', state.studyGroupTab === 'units');
      tabUnits.setAttribute('aria-selected', String(state.studyGroupTab === 'units'));
      tabSmart.classList.toggle('active', state.studyGroupTab === 'smart');
      tabSmart.setAttribute('aria-selected', String(state.studyGroupTab === 'smart'));
    }

    renderTodayHero();

    if (state.vocab.length === 0) {
      if (state.freshLoaded || DEMO) {
        container.innerHTML = '<div class="card empty-state"><img class="empty-mascot" src="icon-180.png" alt=""><h3>まだ辞書がありません</h3>' +
          '<p>上の「まとめて取り込む」か、記録タブの「配信から取り込む」で表現を入れてください。</p></div>';
      } else if (state.bootFailed) {
        container.innerHTML = '<div class="card empty-state"><img class="empty-mascot" src="icon-180.png" alt=""><h3>読み込めませんでした</h3>' +
          '<p>電波のよいところで、もう一度ためしてください。</p><button class="btn-primary" type="button" id="retryBootBtn">' + ic('refresh') + 'もう一度</button></div>';
        document.getElementById('retryBootBtn').addEventListener('click', function () { loadBootstrap(true); });
      } else {
        container.innerHTML = '<div class="card empty-state"><img class="empty-mascot" src="icon-180.png" alt=""><h3>読み込んでいます…</h3><p>はじめての読み込みは少し時間がかかります。</p></div>';
      }
      return;
    }

    var built = buildStudyGroups();
    var list = state.studyGroupTab === 'smart' ? built.smart : built.units;
    var SMART_ICONS = {
      smart_due: 'calendar', smart_top50: 'flame', smart_basic: 'leaf', smart_phrasal: 'link',
      smart_slang: 'speech', smart_weak: 'target', smart_fav: 'star', smart_random20: 'shuffle'
    };

    container.innerHTML = list.map(function (g) {
      var pct = g.total > 0 ? Math.min(100, Math.round((g.learned / g.total) * 100)) : 0;
      var complete = g.total > 0 && g.learned >= g.total;
      var unitMatch = /^unit_(\d+)$/.exec(g.id);
      var iconHtml = unitMatch ? escapeHtml(unitMatch[1]) : ic(SMART_ICONS[g.id] || 'cards');
      var cls = 'study-group-card' + (g.featured && !complete ? ' featured' : '') + (complete ? ' is-complete' : '');
      return '<button class="' + cls + '" type="button" data-study-group="' + escapeHtml(g.id) + '"' + (g.total === 0 ? ' disabled' : '') + '>' +
        '<span class="group-icon">' + (complete && unitMatch ? ic('check') : iconHtml) + '</span>' +
        '<div class="study-group-main">' +
          '<div class="study-group-title-row">' +
            '<span class="study-group-title">' + escapeHtml(g.title) + '</span>' +
            '<span class="study-group-count">' + g.learned + ' / ' + g.total + '</span>' +
          '</div>' +
          '<div class="study-group-sub">' + escapeHtml(g.sub) + '</div>' +
          '<div class="study-group-bar"><div class="study-group-bar-fill" style="width:' + pct + '%;"></div></div>' +
        '</div>' +
        '<span class="study-group-chevron" aria-hidden="true">' + ic('chev-right') + '</span>' +
      '</button>';
    }).join('');
  }

  // いちばん上の「今日の復習」
  function renderTodayHero() {
    var el = document.getElementById('studyTodayHero');
    if (!el) return;
    if (state.vocab.length === 0) { el.innerHTML = ''; return; }
    var st = state.stats || { todayReviewed: 0, dailyGoal: 25 };
    var dueCount = getCreatorVocabSortedByFreq().filter(isDueClient).length;
    var goal = Math.max(1, Number(st.dailyGoal) || 25);
    var done = Number(st.todayReviewed) || 0;
    var clear = dueCount === 0;
    el.innerHTML =
      '<div class="today-hero' + (clear ? ' is-clear' : '') + '">' +
        '<div class="today-hero-top">' +
          '<div>' +
            '<div class="today-label">' + (clear ? '今日の復習はおわり' : '今日の復習') + '</div>' +
            '<div class="today-count"><span class="num">' + (clear ? done : dueCount) + '</span><span class="unit">' + (clear ? '枚 できた' : '語') + '</span></div>' +
            '<div class="today-sub">' + (clear
              ? 'おつかれさま。次は新しいユニットへ'
              : ('今日 ' + done + ' / ' + goal + ' 枚 ・ 1回 20 語ずつ')) + '</div>' +
          '</div>' +
          '<img class="today-mascot" src="icon-180.png" alt="">' +
        '</div>' +
        '<button class="today-start" type="button" id="todayStartBtn">' + ic(clear ? 'cards' : 'play') + (clear ? '新しいユニットへ' : '復習をはじめる') + '</button>' +
      '</div>';
    document.getElementById('todayStartBtn').addEventListener('click', function () {
      if (!clear) { openStudyGroup('smart_due'); return; }
      var built = buildStudyGroups();
      var next = built.units.find(function (u) { return u.learned < u.total; }) || built.units[0];
      if (next) openStudyGroup(next.id);
    });
  }

  function openStudyGroup(groupId, customStreamVid) {
    var cards = [];
    var title = '';
    if (customStreamVid) {
      state.studyStreamVideoId = customStreamVid;
      cards = state.vocab.filter(function (c) { return c.videoId === customStreamVid; });
      var stObj = state.streams.find(function (s) { return s.videoId === customStreamVid; });
      title = stObj ? String(stObj.title || '配信').slice(0, 14) : '配信復習';
      state.activeStudyGroupId = 'stream_' + customStreamVid;
    } else {
      state.studyStreamVideoId = 'all';
      var built = buildStudyGroups();
      var allGroups = built.units.concat(built.smart);
      var found = allGroups.find(function (g) { return g.id === groupId; });
      if (!found || found.cards.length === 0) {
        showToast('このグループには対象単語がありません', true);
        return;
      }
      cards = found.cards;
      title = found.title;
      state.activeStudyGroupId = found.id;
    }

    state.activeStudyGroupTitle = title;
    state.studyQueueIds = cards.map(function (c) { return c.id; });
    state.studyIndex = 0;
    state.studyHistory = [];
    state.cardRevealed = false;
    state.quizAnsweredIdx = -1;
    state.quizOptions = [];
    state.studyView = 'session';
    renderStudyViewVisibility();
    updateStudyUndoButton();
    renderStudyCard();
  }

  function rebuildStudyQueue(preserveCurrentId) {
    // 練習の途中は並びを作り直さない（カードが飛んだり、取り消しの位置がずれたりしないように）。
    // 新しいデータは、表示する次のカードから使われる
    if (state.studyView === 'session' && state.activeStudyGroupId) {
      updateStudyUndoButton();
      return;
    }
    state.studyView = 'groups';
    renderStudyViewVisibility();
    renderStudyGroups();
  }

  function updateStudyUndoButton() {
    var undoBtn = document.getElementById('studyUndoBtn');
    if (undoBtn) undoBtn.disabled = state.studyHistory.length === 0;
  }

  function renderStudyCard() {
    renderStudyViewVisibility();
    if (state.studyView !== 'session') {
      renderStudyGroups();
      return;
    }

    var container = document.getElementById('studyCardContainer');
    var infoEl = document.getElementById('studyQueueInfo');
    var grpLabel = document.getElementById('studyActiveGroupLabel');
    var streakBadge = document.getElementById('quizStreakBadge');
    var progFill = document.getElementById('studySessionProgressFill');

    if (grpLabel) grpLabel.textContent = state.activeStudyGroupTitle || 'Unit 1';
    if (progFill) {
      var qLen = state.studyQueueIds.length;
      var pct = qLen > 0 ? Math.min(100, Math.round((Math.min(state.studyIndex + 1, qLen) / qLen) * 100)) : 0;
      if (state.studyIndex >= qLen && qLen > 0) pct = 100;
      progFill.style.width = pct + '%';
    }

    streakBadge.style.display = state.studyMode === 'quiz' && state.quizStreak > 0 ? 'inline-flex' : 'none';
    streakBadge.innerHTML = ic('flame') + '<span>' + state.quizStreak + '</span>';

    while (state.studyIndex < state.studyQueueIds.length && !findCardById(state.studyQueueIds[state.studyIndex])) {
      state.studyIndex++;
    }

    if (state.studyQueueIds.length === 0 || state.studyIndex >= state.studyQueueIds.length) {
      infoEl.textContent = '完了';
      var nextUnitMatch = /^unit_(\d+)$/.exec(state.activeStudyGroupId || '');
      var nextUnitId = nextUnitMatch ? ('unit_' + (parseInt(nextUnitMatch[1], 10) + 1)) : '';
      var hasNextUnit = false;
      if (nextUnitId) {
        var bCheck = buildStudyGroups();
        hasNextUnit = bCheck.units.some(function (u) { return u.id === nextUnitId; });
      }
      container.innerHTML =
        '<div class="card empty-state">' +
          '<img class="empty-mascot" src="icon-180.png" alt="">' +
          '<h3>' + escapeHtml(state.activeStudyGroupTitle || 'このグループ') + ' おわり</h3>' +
          '<p>おつかれさまでした。次に進むか、一覧から別のグループを選べます。</p>' +
          (hasNextUnit
            ? '<button class="btn-primary" type="button" id="studyNextUnitBtn">' + escapeHtml(nextUnitId.replace('unit_', 'Unit ')) + ' に進む' + ic('chev-right') + '</button>'
            : '<button class="btn-primary" type="button" id="studyReplayGroupBtn">' + ic('repeat') + 'もう1回このグループ</button>') +
          '<button class="btn-secondary" type="button" id="studyDoneBackBtn">一覧に戻る</button>' +
        '</div>';
      var nu = document.getElementById('studyNextUnitBtn');
      if (nu) nu.addEventListener('click', function () { openStudyGroup(nextUnitId); });
      var rp = document.getElementById('studyReplayGroupBtn');
      if (rp) rp.addEventListener('click', function () { openStudyGroup(state.activeStudyGroupId); });
      var bk = document.getElementById('studyDoneBackBtn');
      if (bk) bk.addEventListener('click', showStudyGroupPicker);
      return;
    }

    var card = findCardById(state.studyQueueIds[state.studyIndex]);
    prefetchUpcomingStudyAudio();

    infoEl.textContent = (state.studyIndex + 1) + ' / ' + state.studyQueueIds.length;

    var clipDur = Math.max(0.9, (Number(card.endSec) || 5) - (Number(card.startSec) || 0)).toFixed(1);
    var idlePlayLabel = card.audioFile ? '聴く' : '音声なし';
    var idlePlaySub = card.audioFile ? (clipDur + 's') : '';
    var metaParts = [card.level || 'Natural', card.category || 'Phrase'];
    if ((card.seenCount || 1) >= 2) metaParts.push(card.seenCount + '回');
    if (card.channelName && card.channelName !== 'saba') metaParts.push(card.channelName);

    // 同じカードを描き直すとき（答えを見た・4択に答えた）は、出てくる動きを付けない
    var renderKey = card.id + '|' + state.studyMode + '|' + state.studyIndex;
    var sameCard = state.lastStudyRenderKey === renderKey;
    state.lastStudyRenderKey = renderKey;

    var inlineAudioRowHtml =
      '<div class="study-audio-row">' +
        '<button class="play-hero-btn" type="button" id="studyPlayClipBtn" data-idle-label="' + escapeHtml(idlePlayLabel) + '" data-idle-sub="' + escapeHtml(idlePlaySub) + '"' + (card.audioFile ? '' : ' disabled') + '>' +
          ic('play') + '<span>' + escapeHtml(idlePlayLabel) + '</span>' + (idlePlaySub ? '<span class="sub">' + escapeHtml(idlePlaySub) + '</span>' : '') +
        '</button>' +
        '<button class="study-audio-mini' + (state.loopMode ? ' active' : '') + '" type="button" id="studyLoopBtn" aria-pressed="' + String(state.loopMode) + '" title="くり返し" aria-label="くり返し">' + ic('repeat') + '</button>' +
        '<button class="study-audio-mini" type="button" id="studySpeedBtn" title="速さ" aria-label="再生の速さ">' + escapeHtml(state.playbackRate + 'x') + '</button>' +
      '</div>';

    var cardHeadHtml =
      '<div class="study-card-head">' +
        '<span class="study-card-meta">' + escapeHtml(metaParts.join(' · ')) + '</span>' +
        '<button class="fav-btn ' + (card.favorite ? 'is-fav' : '') + '" type="button" id="studyFavBtn" data-action="fav" data-id="' + escapeHtml(card.id) + '" aria-label="お気に入り">' + (card.favorite ? '★' : '☆') + '</button>' +
      '</div>';

    function wireInlineStudyAudio() {
      document.getElementById('studyPlayClipBtn').addEventListener('click', function () {
        var isThisPlaying = state.activeClipType === 'vocab' && state.activeCardId === card.id && state.playerStatus === 'playing';
        stopAutoplayMode();
        if (isThisPlaying) {
          pausePlayerQuietly();
        } else {
          playClipObject(card, 'vocab', false, true);
        }
      });
      document.getElementById('studyLoopBtn').addEventListener('click', function () {
        state.loopMode = !state.loopMode;
        updatePlayerButtonsUi();
        showToast(state.loopMode ? 'くり返し：オン' : 'くり返し：オフ');
      });
      document.getElementById('studySpeedBtn').addEventListener('click', function () {
        var idx = SPEED_STEPS.indexOf(state.playbackRate);
        state.playbackRate = SPEED_STEPS[(idx + 1) % SPEED_STEPS.length];
        safeStorageSet('saba_speed', state.playbackRate);
        if (state.audioEl) state.audioEl.playbackRate = state.playbackRate;
        updatePlayerButtonsUi();
      });
      document.getElementById('studyFavBtn').addEventListener('click', function () { toggleCardFavorite(card); });
      updatePlayerButtonsUi();
    }

    // === 4択辞書クイズモード（1画面ゼロスクロール完結） ===
    if (state.studyMode === 'quiz') {
      if (state.quizOptions.length === 0) {
        state.quizOptions = buildQuizOptionsForCard(card);
      }
      var answered = state.quizAnsweredIdx !== -1;
      var keys = ['A', 'B', 'C', 'D'];

      var optsHtml = '<div class="quiz-options">' + state.quizOptions.map(function (opt, idx) {
        var cls = 'quiz-opt-btn';
        if (answered) {
          if (opt.isCorrect) cls += ' correct';
          else if (idx === state.quizAnsweredIdx) cls += ' wrong';
          else cls += ' dimmed';
        }
        return '<button class="' + cls + '" type="button" data-quiz-idx="' + idx + '"' + (answered ? ' disabled' : '') + '>' +
          '<span class="quiz-opt-key">' + keys[idx] + '</span>' +
          '<span class="quiz-opt-text">' + escapeHtml(opt.meaningJa) + '</span>' +
        '</button>';
      }).join('') + '</div>';

      var quizResultHtml = '';
      if (answered) {
        quizResultHtml =
          '<div class="quiz-result-compact">' +
            (card.quoteEn
              ? '<div class="quiz-quote-mini">“' + highlightExpressionInQuote(card.quoteEn, card.expression) + '”' +
                (card.quoteJa ? '<span class="qja">' + escapeHtml(card.quoteJa) + '</span>' : '') + '</div>'
              : '') +
            '<div class="quiz-next-row">' +
              '<button class="btn-secondary" type="button" id="quizDetailBtn">くわしく</button>' +
              '<button class="btn-primary" type="button" id="quizNextBtn">次へ' + ic('chev-right') + '</button>' +
            '</div>' +
          '</div>';
      }

      container.innerHTML =
        '<article class="flashcard is-quiz' + (sameCard ? ' no-anim' : '') + '">' +
          cardHeadHtml +
          '<div class="card-stage">' +
            '<div class="card-expression">' + escapeHtml(card.expression) + '</div>' +
            inlineAudioRowHtml +
          '</div>' +
          optsHtml +
          quizResultHtml +
        '</article>';

      wireInlineStudyAudio();

      var qBtns = container.querySelectorAll('[data-quiz-idx]');
      for (var q = 0; q < qBtns.length; q++) {
        qBtns[q].addEventListener('click', function () {
          var idx = parseInt(this.getAttribute('data-quiz-idx'), 10);
          state.quizAnsweredIdx = idx;
          var ok = state.quizOptions[idx] && state.quizOptions[idx].isCorrect;
          state.quizStreak = ok ? (state.quizStreak + 1) : 0;
          renderStudyCard();
          recordQuizOutcome(card, ok ? 'good' : 'again');
        });
      }
      var nextBtn = document.getElementById('quizNextBtn');
      if (nextBtn) {
        nextBtn.addEventListener('click', function () {
          pausePlayerQuietly();
          state.studyIndex++;
          state.quizAnsweredIdx = -1;
          state.quizOptions = [];
          renderStudyCard();
        });
      }
      var detailBtn = document.getElementById('quizDetailBtn');
      if (detailBtn) {
        detailBtn.addEventListener('click', function () { openDetailModal(card, false); });
      }
      return;
    }

    // === 通常カード / リスニング穴埋めモード（1画面スッキリ完結） ===
    var isListen = state.studyMode === 'listening';
    var frontHtml;
    if (isListen && !state.cardRevealed) {
      var clozeHtml = buildClozeQuoteHtml(card.quoteEn, card.expression);
      frontHtml =
        '<div class="listening-mask">' +
          '<div class="listening-label">' + ic('headphones') + '聴いて、空いているところを当てよう</div>' +
          (clozeHtml ? '<div class="cloze-prompt">' + clozeHtml + '</div>' : '<div class="cloze-empty">下のボタンで音声を聴いてください</div>') +
        '</div>';
    } else {
      frontHtml = '<div class="card-expression">' + escapeHtml(card.expression) + '</div>';
    }

    var answerHtml = state.cardRevealed
      ? '<div class="answer-area">' +
          (isListen ? '<div class="card-expression is-small">' + escapeHtml(card.expression) + '</div>' : '') +
          '<p class="meaning-ja">' + escapeHtml(card.meaningJa) + '</p>' +
          (card.quoteEn
            ? '<div class="quiz-quote-mini">“' + highlightExpressionInQuote(card.quoteEn, card.expression) + '”' +
              (card.quoteJa ? '<span class="qja">' + escapeHtml(card.quoteJa) + '</span>' : '') + '</div>'
            : '') +
          '<div class="rating-grid">' +
            '<button class="rate-btn rate-again" type="button" data-rate="again">もう1回<small>' + previewNextIntervalLabel(card, 'again') + '</small></button>' +
            '<button class="rate-btn rate-hard" type="button" data-rate="hard">あいまい<small>' + previewNextIntervalLabel(card, 'hard') + '</small></button>' +
            '<button class="rate-btn rate-good" type="button" data-rate="good">覚えた<small>' + previewNextIntervalLabel(card, 'good') + '</small></button>' +
            '<button class="rate-btn rate-easy" type="button" data-rate="easy">完璧<small>' + previewNextIntervalLabel(card, 'easy') + '</small></button>' +
          '</div>' +
          '<button class="card-detail-link" type="button" id="studyCardDetailBtn">発音のコツ・くわしい説明' + ic('chev-right') + '</button>' +
        '</div>'
      : '<button class="reveal-btn" type="button" id="revealAnswerBtn">答えを見る</button>';

    container.innerHTML =
      '<article class="flashcard' + (state.cardRevealed ? ' is-revealed' : '') + (sameCard ? ' no-anim' : '') + '">' +
        cardHeadHtml +
        '<div class="card-stage">' +
          frontHtml +
          inlineAudioRowHtml +
        '</div>' +
        answerHtml +
      '</article>';

    wireInlineStudyAudio();

    var revealBtn = document.getElementById('revealAnswerBtn');
    if (revealBtn) revealBtn.addEventListener('click', function () { state.cardRevealed = true; renderStudyCard(); });

    var cardDetailBtn = document.getElementById('studyCardDetailBtn');
    if (cardDetailBtn) cardDetailBtn.addEventListener('click', function () { openDetailModal(card, false); });

    var rateBtns = container.querySelectorAll('[data-rate]');
    for (var i = 0; i < rateBtns.length; i++) {
      rateBtns[i].addEventListener('click', function () { submitStudyRating(card, this.getAttribute('data-rate')); });
    }
  }

  // 評価を送っている数（0 でないあいだは読み直さない）と、届いた評価の記録（読み込みの返事より新しいもの）
  function noteReviewSaved(data) {
    state.recentReviews = (state.recentReviews || []).filter(function (r) { return Date.now() - r.at < 5 * 60 * 1000; });
    state.recentReviews.push({ at: Date.now(), card: data.card, stats: data.stats });
  }
  function sendReview(cardId, rating) {
    state.reviewInFlight = (state.reviewInFlight || 0) + 1;
    return callGas('apiReviewCard', cardId, rating).then(function (data) {
      state.reviewInFlight--;
      noteReviewSaved(data);
      return data;
    }, function (err) {
      state.reviewInFlight--;
      throw err;
    });
  }

  function recordQuizOutcome(card, rating) {
    state.reviewSendChain = state.reviewSendChain.then(function () {
      return sendReview(card.id, rating).then(function (data) {
        replaceCardInState(data.card);
        state.stats = data.stats;
        renderHeaderAndStats();
      }).catch(function (err) {
        showToast('4択の結果を記録できませんでした：' + err.message, true);
      });
    });
  }

  function flushPendingReview() {
    if (state.pendingReviewTimerId) { clearTimeout(state.pendingReviewTimerId); state.pendingReviewTimerId = null; }
    var item = state.pendingReview;
    if (!item) return;
    state.pendingReview = null;

    state.reviewSendChain = state.reviewSendChain.then(function () {
      return sendReview(item.cardId, item.rating)
        .then(function (data) {
          replaceCardInState(data.card);
          var prevToday = state.stats ? state.stats.todayReviewed : 0;
          state.stats = data.stats;
          renderHeaderAndStats();
          renderLibraryList();
          if (!state.goalCelebratedToday && data.stats && prevToday < data.stats.dailyGoal && data.stats.todayReviewed >= data.stats.dailyGoal) {
            state.goalCelebratedToday = true;
            showToast('今日の目標 ' + data.stats.dailyGoal + ' 枚、達成です。おつかれさま');
          }
        })
        .catch(function (err) {
          if (item.appendedAgain && state.studyQueueIds[state.studyQueueIds.length - 1] === item.cardId) state.studyQueueIds.pop();
          state.studyIndex = Math.min(item.prevIndex, state.studyIndex);
          renderStudyCard();
          showToast('記録できませんでした：' + err.message, true);
        });
    });
  }

  function submitStudyRating(card, rating) {
    stopAutoplayMode();
    pausePlayerQuietly();
    flushPendingReview();

    var prevIndex = state.studyIndex;
    var appendedAgain = false;
    if (rating === 'again') { state.studyQueueIds.push(card.id); appendedAgain = true; }
    var entry = { prevIndex: prevIndex, cardId: card.id, rating: rating, appendedAgain: appendedAgain };
    state.studyHistory.push(entry);
    state.pendingReview = entry;
    state.pendingReviewTimerId = setTimeout(flushPendingReview, 3500);

    state.studyIndex++;
    state.cardRevealed = false;
    updateStudyUndoButton();
    renderStudyCard();
  }

  function toggleCardFavorite(card) {
    var nextFav = !card.favorite;
    card.favorite = nextFav;
    var allFavBtns = document.querySelectorAll('[data-action="fav"]');
    for (var i = 0; i < allFavBtns.length; i++) {
      if (allFavBtns[i].getAttribute('data-id') === card.id) {
        allFavBtns[i].classList.toggle('is-fav', nextFav);
        allFavBtns[i].textContent = nextFav ? '★' : '☆';
      }
    }
    callGas('apiToggleFavorite', card.id, nextFav)
      .then(function (data) { replaceCardInState(data.card); showToast(nextFav ? 'お気に入りに入れました' : 'お気に入りから外しました'); })
      .catch(function (err) { card.favorite = !nextFav; renderStudyCard(); renderLibraryList(); showToast('変えられませんでした：' + err.message, true); });
  }

  /* ============================================================
   * Rendering: Tab 2 (長文オーバーラッピング — 極限シンプル1画面設計)
   * ============================================================ */
  function renderShadowTab() {
    var countEl = document.getElementById('passageCountLabel');
    var stageEl = document.getElementById('passageStageContainer');
    var listEl = document.getElementById('passageListContainer');
    var practiceView = document.getElementById('shadowPracticeView');
    var listView = document.getElementById('shadowListView');
    if (!stageEl || !listEl) return;

    var creatorPassages = state.passages.filter(function (p) {
      return state.shadowCreator === 'all' || (p.channelName || 'saba') === state.shadowCreator;
    });

    // 一覧ビュー用の配信フィルタを更新（練習画面はシンプルに保つ）
    var streamSel = document.getElementById('shadowStreamSelect');
    if (streamSel) {
      var sMap = {};
      var sOrder = [];
      creatorPassages.forEach(function (p) {
        var vid = p.videoId || 'unknown';
        if (!sMap[vid]) {
          sMap[vid] = { title: p.streamTitle || vid, count: 0 };
          sOrder.push(vid);
        }
        sMap[vid].count++;
      });
      var sOpts = ['<option value="all">すべての配信（' + creatorPassages.length + '本）</option>'];
      sOrder.forEach(function (vid) {
        sOpts.push('<option value="' + escapeHtml(vid) + '">' + escapeHtml(sMap[vid].title) + '（' + sMap[vid].count + '本）</option>');
      });
      streamSel.innerHTML = sOpts.join('');
      streamSel.value = sMap[state.shadowStreamId] ? state.shadowStreamId : 'all';
      state.shadowStreamId = streamSel.value;
    }

    var filteredPassages = creatorPassages.filter(function (p) {
      return state.shadowStreamId === 'all' || (p.videoId || 'unknown') === state.shadowStreamId;
    });
    if (countEl) countEl.textContent = '長文 ' + filteredPassages.length + ' 本';

    if (practiceView && listView) {
      var inList = state.shadowView === 'list';
      practiceView.style.display = inList ? 'none' : 'block';
      listView.style.display = inList ? 'block' : 'none';
    }

    if (filteredPassages.length === 0) {
      stageEl.innerHTML =
        '<div class="card empty-state"><div class="empty-ic">' + ic('mic') + '</div><h3>長文がまだありません</h3>' +
        '<p>配信を取り込むか、一覧の「追加」から入れられます。</p>' +
        '<button class="btn-secondary" type="button" id="openShadowListEmptyBtn">一覧を開く</button></div>';
      var emptyListBtn = document.getElementById('openShadowListEmptyBtn');
      if (emptyListBtn) emptyListBtn.addEventListener('click', function () { state.shadowView = 'list'; renderShadowTab(); });
      listEl.innerHTML = '';
      return;
    }

    var selIdx = -1;
    for (var si = 0; si < filteredPassages.length; si++) {
      if (filteredPassages[si].id === state.selectedPassageId) { selIdx = si; break; }
    }
    if (selIdx === -1) selIdx = 0;
    var selected = filteredPassages[selIdx];
    state.selectedPassageId = selected.id;

    // 選択中＋次の長文MP3を先読み
    var preloadP = [];
    if (selected.audioFile) preloadP.push(selected.audioFile);
    if (filteredPassages[selIdx + 1] && filteredPassages[selIdx + 1].audioFile) preloadP.push(filteredPassages[selIdx + 1].audioFile);
    if (preloadP.length > 0) prefetchAudioFiles(preloadP);

    var dur = Math.max(1, Math.round((selected.endSec - selected.startSec) * 10) / 10);
    var pIdleLabel = '再生';
    var pIdleSub = dur + 's';
    var pSame = state.lastPassageRenderKey === selected.id;
    state.lastPassageRenderKey = selected.id;

    var scriptBodyHtml = state.passageViewMode === 'blind'
      ? '<div class="shadow-script-clean is-blind">' + ic('headphones') +
          '<strong>英文をかくしています</strong><span>音だけを聴いて、すぐあとを追って言ってみよう（シャドーイング）</span>' +
        '</div>'
      : (state.passageViewMode === 'plain'
          ? '<div class="shadow-script-clean">' + escapeHtml(selected.scriptEn) + '</div>'
          : '<div class="shadow-script-clean">' + formatChunkedScriptHtml(selected.chunkedScript || selected.scriptEn) + '</div>');

    var kwList = String(selected.keyWords || '').split(/[,、]/).map(function (s) { return s.trim(); }).filter(Boolean);
    var tipsDrawerHtml = '';
    if (state.passageShowJa && selected.scriptJa) {
      tipsDrawerHtml += '<div class="shadow-drawer-box">' + escapeHtml(selected.scriptJa) + '</div>';
    }
    if (state.passageShowTips) {
      tipsDrawerHtml +=
        '<div class="shadow-drawer-box">' +
          (selected.speakingTipsJa ? '<div class="drawer-tips">' + escapeHtml(selected.speakingTipsJa) + '</div>' : '') +
          (kwList.length > 0 ? '<div class="badge-row" style="margin-bottom:10px;">' + kwList.map(function (kw) { return '<button class="keyword-chip" type="button" data-kw-jump="' + escapeHtml(kw) + '">' + escapeHtml(kw) + '</button>'; }).join('') + '</div>' : '') +
          '<div class="drawer-foot">' +
            '<span>練習 ' + (Number(selected.practiceCount) || 0) + ' 回' + (Number(selected.bestSpeed) ? (' ・ 最高 ' + Number(selected.bestSpeed) + 'x') : '') + '</span>' +
            '<button type="button" class="text-danger-btn" id="deletePassageBtn">この長文を消す</button>' +
          '</div>' +
        '</div>';
    }

    stageEl.innerHTML =
      '<div class="shadow-top-bar">' +
        '<button class="study-back-btn" type="button" id="openShadowListBtn">' + ic('chev-left') + '一覧</button>' +
        '<div class="seg-3 compact" role="tablist">' +
          '<button class="seg-btn ' + (state.passageViewMode === 'guide' ? 'active' : '') + '" type="button" data-p-mode="guide">ガイド</button>' +
          '<button class="seg-btn ' + (state.passageViewMode === 'plain' ? 'active' : '') + '" type="button" data-p-mode="plain">英文</button>' +
          '<button class="seg-btn ' + (state.passageViewMode === 'blind' ? 'active' : '') + '" type="button" data-p-mode="blind">隠す</button>' +
        '</div>' +
        '<span class="study-progress-text">' + (selIdx + 1) + ' / ' + filteredPassages.length + '</span>' +
      '</div>' +
      '<article class="shadow-zen-card' + (pSame ? ' no-anim' : '') + '">' +
        '<div class="shadow-zen-head">' +
          '<h3 class="shadow-zen-title">' + escapeHtml(selected.titleJa) + '</h3>' +
          '<button class="fav-btn ' + (selected.favorite ? 'is-fav' : '') + '" type="button" id="passageFavBtn" aria-label="お気に入り">' + (selected.favorite ? '★' : '☆') + '</button>' +
        '</div>' +
        '<div class="study-audio-row">' +
          '<button class="play-hero-btn" type="button" id="playPassageHeroBtn" data-idle-label="' + escapeHtml(pIdleLabel) + '" data-idle-sub="' + escapeHtml(pIdleSub) + '">' + ic('play') + '<span>' + pIdleLabel + '</span><span class="sub">' + escapeHtml(pIdleSub) + '</span></button>' +
          '<button class="study-audio-mini" type="button" id="passageRewindBtn" title="3秒戻す" aria-label="3秒戻す">' + ic('back3') + '</button>' +
          '<button class="study-audio-mini' + (state.loopMode ? ' active' : '') + '" type="button" id="passageLoopBtn" aria-pressed="' + String(state.loopMode) + '" title="くり返し" aria-label="くり返し">' + ic('repeat') + '</button>' +
          '<button class="study-audio-mini" type="button" id="passageSpeedBtn" title="速さ" aria-label="再生の速さ">' + escapeHtml(state.playbackRate + 'x') + '</button>' +
        '</div>' +
        scriptBodyHtml +
        '<div class="shadow-bottom-bar">' +
          '<button class="shadow-sub-btn' + (state.passageShowJa ? ' active' : '') + '" type="button" id="togglePassageJaBtn">' + ic('translate') + '日本語訳</button>' +
          '<button class="shadow-sub-btn' + (state.passageShowTips ? ' active' : '') + '" type="button" id="togglePassageTipsBtn">' + ic('bulb') + 'コツ</button>' +
          '<button class="shadow-sub-btn done-btn" type="button" id="recordPassagePracticeBtn">' + ic('check') + 'できた</button>' +
        '</div>' +
        tipsDrawerHtml +
      '</article>' +
      '<div class="shadow-nav-row">' +
        '<button class="study-back-btn" type="button" id="shadowPrevBtn"' + (selIdx <= 0 ? ' disabled' : '') + '>' + ic('chev-left') + '前の長文</button>' +
        '<button class="study-back-btn" type="button" id="shadowNextBtn"' + (selIdx >= filteredPassages.length - 1 ? ' disabled' : '') + '>次の長文' + ic('chev-right') + '</button>' +
      '</div>';

    document.getElementById('openShadowListBtn').addEventListener('click', function () {
      state.shadowView = 'list';
      renderShadowTab();
    });
    document.getElementById('playPassageHeroBtn').addEventListener('click', function () {
      var isThisPlaying = state.activeClipType === 'passage' && state.activeCardId === selected.id && state.playerStatus === 'playing';
      stopAutoplayMode();
      if (isThisPlaying) {
        pausePlayerQuietly();
      } else {
        playClipObject(selected, 'passage', true, true);
      }
    });
    document.getElementById('passageRewindBtn').addEventListener('click', function () {
      var a = state.audioEl;
      if (!a || !a.src) return;
      var bStart = (state.activeTrimBounds && state.activeTrimBounds.start) || 0;
      a.currentTime = Math.max(bStart, (a.currentTime || 0) - 3.0);
      a.play().catch(function () {});
    });
    document.getElementById('passageLoopBtn').addEventListener('click', function () {
      state.loopMode = !state.loopMode;
      updatePlayerButtonsUi();
      showToast(state.loopMode ? 'くり返し：オン' : 'くり返し：オフ');
    });
    document.getElementById('passageSpeedBtn').addEventListener('click', function () {
      var pSteps = [0.75, 0.85, 1.0];
      var idx = pSteps.indexOf(state.playbackRate);
      state.playbackRate = pSteps[(idx + 1) % pSteps.length];
      safeStorageSet('saba_speed', state.playbackRate);
      if (state.audioEl) state.audioEl.playbackRate = state.playbackRate;
      updatePlayerButtonsUi();
    });
    document.getElementById('passageFavBtn').addEventListener('click', function () {
      var nf = !selected.favorite;
      selected.favorite = nf;
      renderShadowTab();
      callGas('apiTogglePassageFavorite', selected.id, nf).then(function (d) { replacePassageInState(d.passage); }).catch(function () {});
    });
    stageEl.querySelectorAll('[data-p-mode]').forEach(function (b) {
      b.addEventListener('click', function () { state.passageViewMode = this.getAttribute('data-p-mode'); renderShadowTab(); });
    });
    document.getElementById('togglePassageJaBtn').addEventListener('click', function () {
      state.passageShowJa = !state.passageShowJa;
      renderShadowTab();
    });
    document.getElementById('togglePassageTipsBtn').addEventListener('click', function () {
      state.passageShowTips = !state.passageShowTips;
      renderShadowTab();
    });
    stageEl.querySelectorAll('[data-kw-jump]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.librarySearch = this.getAttribute('data-kw-jump');
        document.getElementById('librarySearchInput').value = state.librarySearch;
        renderLibraryList();
        switchTab('library');
      });
    });
    document.getElementById('recordPassagePracticeBtn').addEventListener('click', function () {
      var btn = this; btn.disabled = true;
      callGas('apiRecordPassagePractice', selected.id, state.playbackRate)
        .then(function (d) { replacePassageInState(d.passage); renderShadowTab(); showToast(state.playbackRate >= 1.0 ? 'ふつうの速さでできました' : '練習を記録しました'); })
        .catch(function (e) { showToast('記録できませんでした：' + e.message, true); })
        .finally(function () { btn.disabled = false; });
    });
    var delBtn = document.getElementById('deletePassageBtn');
    if (delBtn) {
      delBtn.addEventListener('click', function () {
        if (!window.confirm('この長文を削除しますか？')) return;
        callGas('apiDeletePassage', selected.id).then(function () {
          if (state.activeCardId === selected.id && state.activeClipType === 'passage') closePlayerDock();
          state.passages = state.passages.filter(function (p) { return p.id !== selected.id; });
          state.selectedPassageId = null;
          renderShadowTab();
          showToast('削除しました');
        }).catch(function (e) { showToast('消せませんでした：' + e.message, true); });
      });
    }
    var prevBtn = document.getElementById('shadowPrevBtn');
    if (prevBtn && selIdx > 0) {
      prevBtn.addEventListener('click', function () {
        pausePlayerQuietly();
        state.selectedPassageId = filteredPassages[selIdx - 1].id;
        state.passageShowJa = false;
        state.passageShowTips = false;
        renderShadowTab();
      });
    }
    var nextBtn = document.getElementById('shadowNextBtn');
    if (nextBtn && selIdx < filteredPassages.length - 1) {
      nextBtn.addEventListener('click', function () {
        pausePlayerQuietly();
        state.selectedPassageId = filteredPassages[selIdx + 1].id;
        state.passageShowJa = false;
        state.passageShowTips = false;
        renderShadowTab();
      });
    }
    updatePlayerButtonsUi();

    listEl.innerHTML = filteredPassages.map(function (p) {
      var isSel = p.id === selected.id;
      var pDur = Math.max(1, Math.round(p.endSec - p.startSec));
      var streamLabel = p.streamTitle ? '<div class="passage-list-stream">' + escapeHtml(p.streamTitle) + '</div>' : '';
      return '<button class="passage-list-card ' + (isSel ? 'selected' : '') + '" type="button" data-select-passage="' + escapeHtml(p.id) + '">' +
        '<div class="passage-list-main">' +
          '<div class="passage-list-title">' + (p.favorite ? '<span class="star">★</span>' : '') + escapeHtml(p.titleJa) + '</div>' +
          streamLabel +
          '<div class="badge-row"><span class="badge num">' + pDur + '秒</span><span class="badge">練習 ' + (Number(p.practiceCount) || 0) + '回</span>' + (p.bestSpeed >= 1.0 ? '<span class="badge badge-level-Basic">ふつうの速さ OK</span>' : '') + '</div>' +
        '</div><span class="passage-list-go">' + ic('play') + '</span></button>';
    }).join('');
  }

  /* ============================================================
   * Rendering: Tab 3 (完全重複なし辞書ライブラリ)
   * ============================================================ */
  function renderLibraryStreamFilterOptions() {
    var sel = document.getElementById('libraryStreamSelect');
    var cur = state.libraryStreamId;
    var map = {};
    state.vocab.forEach(function (v) {
      if (state.libraryCreator !== 'all' && (v.channelName || 'saba') !== state.libraryCreator) return;
      if (!map[v.videoId]) map[v.videoId] = { title: v.streamTitle || v.videoId, count: 0 };
      map[v.videoId].count++;
    });
    var opts = ['<option value="all">すべての配信（' + state.vocab.length + '語）</option>'];
    Object.keys(map).forEach(function (vid) {
      opts.push('<option value="' + escapeHtml(vid) + '">' + escapeHtml(map[vid].title) + '（' + map[vid].count + '）</option>');
    });
    sel.innerHTML = opts.join('');
    sel.value = map[cur] ? cur : 'all';
    state.libraryStreamId = sel.value;
  }

  function getFilteredLibraryCards() {
    var q = state.librarySearch.trim().toLowerCase();
    var chip = state.libraryChip;
    var sid = state.libraryStreamId;
    var cr = state.libraryCreator;

    var filtered = state.vocab.filter(function (c) {
      if (cr !== 'all' && (c.channelName || 'saba') !== cr) return false;
      if (sid !== 'all' && c.videoId !== sid) return false;
      if (state.libraryFavOnly && !c.favorite) return false;
      if (chip.indexOf('level:') === 0 && c.level !== chip.slice(6)) return false;
      if (chip.indexOf('cat:') === 0 && c.category !== chip.slice(4)) return false;
      if (chip === 'status:due' && !isDueClient(c)) return false;
      if (chip === 'status:new' && c.status !== 'new') return false;
      if (chip === 'status:mastered' && c.status !== 'mastered') return false;
      if (q) {
        var hay = [c.expression, c.meaningJa, c.quoteEn, c.quoteJa, c.nuanceJa, c.readingHint, c.paraphraseBasicEn, c.extraExampleEn, c.streamTitle, c.channelName].filter(Boolean).join(' ').toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });

    if (state.librarySort === 'freq') {
      filtered.sort(function (a, b) {
        var diff = (Number(b.seenCount) || 1) - (Number(a.seenCount) || 1);
        return diff !== 0 ? diff : String(a.expression || '').localeCompare(String(b.expression || ''));
      });
    } else if (state.librarySort === 'az') {
      filtered.sort(function (a, b) { return String(a.expression || '').localeCompare(String(b.expression || '')); });
    } else if (state.librarySort === 'timestamp') {
      filtered.sort(function (a, b) {
        var dc = String(b.streamDate || '').localeCompare(String(a.streamDate || ''));
        return dc !== 0 ? dc : (Number(a.startSec) || 0) - (Number(b.startSec) || 0);
      });
    } else if (state.librarySort === 'due') {
      filtered.sort(function (a, b) { return new Date(a.nextReviewAt || 0).getTime() - new Date(b.nextReviewAt || 0).getTime(); });
    } else {
      filtered.sort(function (a, b) { return String(b.createdAt || '').localeCompare(String(a.createdAt || '')); });
    }
    return filtered;
  }

  function renderLibraryList() {
    var filtered = getFilteredLibraryCards();
    document.getElementById('libraryCountLabel').textContent = filtered.length + ' 語';
    var container = document.getElementById('libraryListContainer');

    if (filtered.length === 0) {
      container.innerHTML = '<div class="card empty-state"><div class="empty-ic">' + ic('search') + '</div><h3>見つかりませんでした</h3><p>ことばを変えるか、しぼりこみを外してみてください。</p></div>';
      return;
    }

    // パフォーマンスのため画面描画は最大200件に絞りつつ検索で全件即ヒット
    var visible = filtered.slice(0, 200);
    hydrateFromLocalCache(visible.slice(0, 20).map(function (c) { return c.audioFile; }));
    container.innerHTML = visible.map(function (c) {
      var isPlayingCls = c.id === state.activeCardId && state.activeClipType === 'vocab' ? ' playing' : '';
      var metaParts = [c.level || 'Natural', c.category || 'Phrase', c.channelName || 'saba'];
      return '<div class="vocab-list-item' + isPlayingCls + '" data-card-id="' + escapeHtml(c.id) + '">' +
        '<button class="mini-play-btn" type="button" data-action="play" data-id="' + escapeHtml(c.id) + '" aria-label="音声を聴く">' + ic('play') + '</button>' +
        '<button class="vocab-list-body" type="button" data-action="detail" data-id="' + escapeHtml(c.id) + '">' +
          '<div class="vocab-list-head">' +
            '<span class="vocab-list-expr">' + escapeHtml(c.expression) + '</span>' +
            ((c.seenCount || 1) >= 2 ? '<span class="vocab-freq-pill">' + Number(c.seenCount) + '回</span>' : '') +
          '</div>' +
          '<div class="vocab-list-meaning">' + escapeHtml(c.meaningJa) + '</div>' +
          '<div class="vocab-list-meta">' + escapeHtml(metaParts.join(' · ')) + '</div>' +
        '</button>' +
        '<button class="fav-btn ' + (c.favorite ? 'is-fav' : '') + '" type="button" data-action="fav" data-id="' + escapeHtml(c.id) + '" aria-label="お気に入り">' + (c.favorite ? '★' : '☆') + '</button>' +
      '</div>';
    }).join('') + (filtered.length > 200 ? '<p class="list-more-note">はじめの 200 語を表示しています（検索すると全 ' + filtered.length + ' 語から探せます）</p>' : '');
  }

  /* ============================================================
   * Detail & Edit Modal
   * ============================================================ */
  function openDetailModal(card, editMode) {
    var modal = document.getElementById('detailModal');
    state.detailModalCardId = card.id;
    // 詳細を開いた瞬間にこの語の音声を裏でRAMへ展開（タップ時に0秒再生！）
    if (!editMode && card.audioFile) {
      prefetchAudioFiles([card.audioFile]);
    }
    document.getElementById('detailModalTitle').textContent = editMode ? ('編集：' + card.expression) : card.expression;
    var ytUrl = safeYoutubeUrl(null, card.videoId, card.startSec);
    var body = document.getElementById('detailModalBody');

    if (editMode) {
      body.innerHTML =
        '<div class="field-group"><label class="field-label" for="edExpr">単語・熟語 *</label><input class="text-input" id="edExpr" type="text" value="' + escapeHtml(card.expression) + '"></div>' +
        '<div class="field-group"><label class="field-label" for="edMeaning">日本語の意味 *</label><input class="text-input" id="edMeaning" type="text" value="' + escapeHtml(card.meaningJa) + '"></div>' +
        '<div class="row-2col">' +
          '<div class="field-group"><label class="field-label" for="edCategory">カテゴリ</label><select class="select-field" id="edCategory" style="margin:0;">' + ['Phrase', 'Phrasal Verb', 'Idiom', 'Slang', 'Reaction', 'Vocab'].map(function (o) { return '<option value="' + o + '"' + (card.category === o ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select></div>' +
          '<div class="field-group"><label class="field-label" for="edLevel">レベル</label><select class="select-field" id="edLevel" style="margin:0;">' + ['Basic', 'Natural', 'Slang'].map(function (o) { return '<option value="' + o + '"' + (card.level === o ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select></div>' +
        '</div>' +
        '<div class="field-group"><label class="field-label" for="edPara">平易な英語での言い換え</label><input class="text-input" id="edPara" type="text" value="' + escapeHtml(card.paraphraseBasicEn || '') + '"></div>' +
        '<div class="field-group"><label class="field-label" for="edReading">発音・リンキングのコツ</label><input class="text-input" id="edReading" type="text" value="' + escapeHtml(card.readingHint || '') + '"></div>' +
        '<div class="field-group"><label class="field-label" for="edNuance">ニュアンス・解説</label><textarea class="textarea-input" id="edNuance" rows="2">' + escapeHtml(card.nuanceJa || '') + '</textarea></div>' +
        '<div class="field-group"><label class="field-label" for="edQuoteEn">実際のセリフ（英語）</label><textarea class="textarea-input" id="edQuoteEn" rows="2">' + escapeHtml(card.quoteEn || '') + '</textarea></div>' +
        '<div class="field-group"><label class="field-label" for="edQuoteJa">セリフの日本語訳</label><input class="text-input" id="edQuoteJa" type="text" value="' + escapeHtml(card.quoteJa || '') + '"></div>' +
        '<div class="row-2col" style="margin-top:10px;"><button class="btn-secondary" type="button" id="cancelEditBtn">やめる</button><button class="btn-primary" type="button" id="saveEditBtn">' + ic('check') + '保存</button></div>';

      document.getElementById('cancelEditBtn').addEventListener('click', function () { openDetailModal(card, false); });
      document.getElementById('saveEditBtn').addEventListener('click', function () {
        var btn = this;
        var patch = {
          expression: document.getElementById('edExpr').value.trim(),
          meaningJa: document.getElementById('edMeaning').value.trim(),
          category: document.getElementById('edCategory').value,
          level: document.getElementById('edLevel').value,
          paraphraseBasicEn: document.getElementById('edPara').value.trim(),
          readingHint: document.getElementById('edReading').value.trim(),
          nuanceJa: document.getElementById('edNuance').value.trim(),
          quoteEn: document.getElementById('edQuoteEn').value.trim(),
          quoteJa: document.getElementById('edQuoteJa').value.trim()
        };
        if (!patch.expression || !patch.meaningJa) { showToast('表現と意味は必須です', true); return; }
        btn.disabled = true;
        callGas('apiUpdateCardFields', card.id, patch)
          .then(function (data) {
            replaceCardInState(data.card);
            renderStudyCard();
            renderLibraryList();
            openDetailModal(data.card, false);
            showToast('保存しました');
          })
          .catch(function (e) { showToast('保存できませんでした：' + e.message, true); })
          .finally(function () { btn.disabled = false; });
      });
      setModalOpen(modal, true);
      return;
    }

    var safeLevel = safeClassToken(card.level, ALLOWED_LEVELS, 'Natural');
    var safeReg = safeClassToken(card.register || 'Casual', ALLOWED_REGISTERS, 'Casual');
    var regJa = { Everyday: '日常OK', Casual: 'カジュアル', 'Internet-Only': 'ネット向け' };
    var stJa = { new: '未学習', learning: '学習中', mastered: '習得済' };

    body.innerHTML =
      '<div class="badge-row" style="margin-bottom:10px;">' +
        '<span class="badge badge-level-' + safeLevel + '">' + escapeHtml(safeLevel) + '</span>' +
        '<span class="badge badge-cat">' + escapeHtml(card.category) + '</span>' +
        '<span class="badge badge-reg-' + safeReg + '">' + escapeHtml(regJa[safeReg] || safeReg) + '</span>' +
        '<span class="badge badge-cat">' + escapeHtml(stJa[card.status] || card.status) + '</span>' +
        ((card.seenCount || 1) >= 2 ? '<span class="badge badge-reg-Internet-Only">' + Number(card.seenCount) + ' 回登場</span>' : '') +
      '</div>' +
      '<p class="meaning-ja detail-meaning">' + escapeHtml(card.meaningJa) + '</p>' +
      (card.paraphraseBasicEn ? '<div class="paraphrase-pill">≒ ' + escapeHtml(card.paraphraseBasicEn) + '</div>' : '') +
      '<div class="modal-audio-row">' +
        '<button class="play-hero-btn" type="button" id="modalPlayBtn"' + (card.audioFile ? '' : ' disabled') + '>' + ic('play') + '<span>音声を聴く</span></button>' +
        '<button class="modal-audio-mini' + (state.loopMode ? ' active' : '') + '" type="button" id="modalLoopBtn" aria-pressed="' + String(state.loopMode) + '" title="くり返し" aria-label="くり返し">' + ic('repeat') + '</button>' +
        '<button class="modal-audio-mini" type="button" id="modalSpeedBtn" title="速さ" aria-label="再生の速さ">' + escapeHtml(state.playbackRate + 'x') + '</button>' +
      '</div>' +
      (card.readingHint ? '<div class="info-box"><div class="info-box-label">' + ic('waves') + '発音・つながり</div>' + escapeHtml(card.readingHint) + '</div>' : '') +
      (card.nuanceJa ? '<div class="info-box"><div class="info-box-label">' + ic('bulb') + 'ニュアンス</div>' + escapeHtml(card.nuanceJa) + '</div>' : '') +
      (card.quoteEn ? '<div class="info-box"><div class="info-box-label">' + ic('speech') + '実際のセリフ</div><div class="quote-en">“' + highlightExpressionInQuote(card.quoteEn, card.expression) + '”</div>' + (card.quoteJa ? '<div class="quote-ja">' + escapeHtml(card.quoteJa) + '</div>' : '') + '</div>' : '') +
      (card.extraExampleEn ? '<div class="info-box"><div class="info-box-label">' + ic('book') + 'ほかの例文</div><div class="quote-en" style="font-size:15px;">' + escapeHtml(card.extraExampleEn) + '</div>' + (card.extraExampleJa ? '<div class="quote-ja">' + escapeHtml(card.extraExampleJa) + '</div>' : '') + '</div>' : '') +
      '<div class="info-box source-line">' + ic('tv') + '<span>' + escapeHtml(card.channelName || 'saba') + ' ・ ' + escapeHtml(card.streamTitle || '') + (card.streamDate ? '（' + escapeHtml(card.streamDate) + '）' : '') + '</span></div>' +
      '<div class="row-2col" style="margin-top:12px;">' +
        '<button class="btn-secondary" type="button" id="modalEditBtn">' + ic('edit') + '直す</button>' +
        '<a class="btn-secondary" href="' + escapeHtml(ytUrl) + '" target="_blank" rel="noopener noreferrer">' + ic('external') + 'YouTube</a>' +
      '</div>' +
      '<button class="btn-danger" type="button" id="modalDeleteBtn" style="margin-top:8px;">' + ic('trash') + 'この表現を消す</button>';

    document.getElementById('modalPlayBtn').addEventListener('click', function () {
      // 詳細モーダルは閉じずにそのまま音声を再生／一時停止する
      var isThisCardPlaying = state.activeClipType === 'vocab' && state.activeCardId === card.id && state.playerStatus === 'playing';
      if (isThisCardPlaying) {
        stopAutoplayMode();
        pausePlayerQuietly();
      } else {
        stopAutoplayMode();
        playClipObject(card, 'vocab', false, true);
      }
    });
    document.getElementById('modalLoopBtn').addEventListener('click', function () {
      state.loopMode = !state.loopMode;
      updatePlayerButtonsUi();
      showToast(state.loopMode ? 'くり返し：オン' : 'くり返し：オフ');
    });
    document.getElementById('modalSpeedBtn').addEventListener('click', function () {
      var idx = SPEED_STEPS.indexOf(state.playbackRate);
      state.playbackRate = SPEED_STEPS[(idx + 1) % SPEED_STEPS.length];
      safeStorageSet('saba_speed', state.playbackRate);
      if (state.audioEl) state.audioEl.playbackRate = state.playbackRate;
      updatePlayerButtonsUi();
    });
    updatePlayerButtonsUi();
    document.getElementById('modalEditBtn').addEventListener('click', function () { openDetailModal(card, true); });
    document.getElementById('modalDeleteBtn').addEventListener('click', function () {
      if (!window.confirm('「' + card.expression + '」を削除しますか？')) return;
      var delBtn = this; delBtn.disabled = true;
      callGas('apiDeleteCard', card.id).then(function (data) {
        if (state.activeCardId === card.id) closePlayerDock();
        state.vocab = state.vocab.filter(function (v) { return v.id !== card.id; });
        state.studyQueueIds = state.studyQueueIds.filter(function (id) { return id !== card.id; });
        if (data.stats) state.stats = data.stats;
        setModalOpen(modal, false);
        renderHeaderAndStats();
        renderLibraryStreamFilterOptions();
        renderLibraryList();
        renderStudyCard();
        showToast('削除しました');
      }).catch(function (e) { delBtn.disabled = false; showToast('消せませんでした：' + e.message, true); });
    });
    setModalOpen(modal, true);
  }

  /* ============================================================
   * Rendering: Tab 4 (Streams) & Tab 5 (Settings)
   * ============================================================ */
  function renderStreamsList() {
    document.getElementById('streamCountBadge').textContent = state.streams.length + '本';
    document.getElementById('channelHandleBadge').textContent = state.settings.channelHandle || '@SamekoSaba';
    var container = document.getElementById('streamsListContainer');
    if (state.streams.length === 0) {
      container.innerHTML = '<p class="helper-note">まだ取り込んだ配信がありません。</p>';
      return;
    }
    var statusLabel = { done: '完了', processing: '途中完了', waiting_captions: '字幕待ち', queued: '未抽出', error: 'エラー', skipped: 'スキップ' };
    var countByVid = {};
    state.vocab.forEach(function (v) { countByVid[v.videoId] = (countByVid[v.videoId] || 0) + 1; });

    container.innerHTML = state.streams.map(function (s) {
      var stKey = safeClassToken(s.status || 'queued', ALLOWED_STATUSES, 'queued');
      var cardCount = Number(countByVid[s.videoId] || s.itemsAdded) || 0;
      var safeUrl = safeYoutubeUrl(s.url, s.videoId);
      return '<div class="stream-item">' +
        '<div class="stream-item-title">' + escapeHtml(s.title) + '</div>' +
        '<div class="stream-item-meta">' +
          '<span class="badge badge-status-' + stKey + '">' + escapeHtml(statusLabel[stKey] || stKey) + '</span>' +
          '<span class="badge">' + ic('user') + escapeHtml(s.channelName || 'saba') + '</span>' +
          '<span class="num">' + escapeHtml(String(s.publishedAt || '').slice(0, 10)) + '</span>' +
          (cardCount ? '<span>' + cardCount + ' 語</span>' : '') +
        '</div>' +
        (s.lastError ? '<div class="stream-item-error">' + escapeHtml(s.lastError) + '</div>' : '') +
        '<div class="stream-actions">' +
          (cardCount > 0 ? '<button class="ctrl-btn is-accent" type="button" data-stream-study="' + escapeHtml(s.videoId) + '">' + ic('cards') + '練習</button><button class="ctrl-btn" type="button" data-stream-lib="' + escapeHtml(s.videoId) + '">' + ic('book') + '辞書 ' + cardCount + '</button>' : '') +
          '<button class="ctrl-btn" type="button" data-stream-extract="' + escapeHtml(s.videoId) + '"' + (state.isExtracting ? ' disabled' : '') + '>' + ic('sparkle') + (stKey === 'done' ? '抽出しなおす' : '抽出') + '</button>' +
          '<a class="ctrl-link" href="' + escapeHtml(safeUrl) + '" target="_blank" rel="noopener noreferrer" aria-label="YouTube で開く">' + ic('external') + '</a>' +
        '</div></div>';
    }).join('');
  }

  function renderSettingsForm() {
    var s = state.settings || {};
    // 打っている途中の欄は書き戻さない（裏でデータを新しくしたときに消えないように）
    function setVal(id, v) { var el = document.getElementById(id); if (el && document.activeElement !== el) el.value = v; }
    document.getElementById('dailyTriggerToggle').checked = Boolean(state.triggerStatus && state.triggerStatus.enabled);
    document.getElementById('apiKeyStatusText').textContent = state.apiKeyStatus && state.apiKeyStatus.configured ? ('設定済み: ' + state.apiKeyStatus.masked) : '未設定';
    setVal('settingGeminiModel', s.geminiModel || 'gemini-3.5-flash-lite');
    setVal('settingDifficulty', s.difficultyProfile || 'saba_dictionary_full');
    setVal('settingMaxItems', s.maxItemsPerChunk || '25');
    setVal('settingChunkMinutes', s.chunkMinutes || '6');
    setVal('settingChannelHandle', s.channelHandle || '@SamekoSaba');
    setVal('settingDailyGoal', s.dailyReviewGoal || '25');
    setVal('settingPadBefore', s.clipPadBeforeSec || '1.0');
    setVal('settingPadAfter', s.clipPadAfterSec || '1.5');
  }

  /* ============================================================
   * Navigation & Data Load
   * ============================================================ */
  function switchTab(tabName) {
    flushPendingReview();
    state.activeTab = tabName;
    document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.toggle('active', p.id === 'tab-' + tabName); });
    document.querySelectorAll('.nav-btn').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-tab') === tabName); });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function applyBootstrapData(data) {
    state.vocab = data.vocab || [];
    state.passages = data.passages || [];
    state.streams = data.streams || [];
    state.stats = data.stats || null;
    state.settings = data.settings || {};
    state.apiKeyStatus = data.apiKeyStatus || { configured: false, masked: '' };
    state.triggerStatus = data.triggerStatus || { enabled: false };
    state.audioFolderStatus = data.audioFolderStatus || { ready: false, folderName: 'SabaAudioClips' };
    state.seedSummary = data.seedSummary || { available: false };

    renderCreatorSelects();
    renderHeaderAndStats();
    renderShadowTab();
    renderLibraryStreamFilterOptions();
    renderLibraryList();
    renderStreamsList();
    renderSettingsForm();
    // 練習の途中なら、並びはそのままにして（表示中のカードを入れ替えない）、次のカードから新しいデータを使う
    if (state.studyView === 'session') {
      updateStudyUndoButton();
    } else {
      renderStudyGroups();
    }
  }

  var BOOT_CACHE_VERSION = 1;
  var bootLoading = false;
  var bootGen = 0;
  // force：接続を切り替えたときなど、読み込み中でもやり直す（古い返事は捨てる）
  function loadBootstrap(showDoneToast, quiet, force) {
    if (bootLoading && !force) return Promise.resolve();
    bootLoading = true;
    var myGen = ++bootGen;
    var startedAt = Date.now();
    state.lastSyncAttemptAt = startedAt;
    var refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) { refreshBtn.disabled = true; refreshBtn.classList.add('is-spinning'); }
    var subEl = document.getElementById('topSubStatus');
    if (!quiet) subEl.textContent = '読み込んでいます…';

    // 送っている途中の評価を先に送りきってから取りに行く（古いデータで上書きしないため）
    flushPendingReview();
    return state.reviewSendChain
      .then(function () {
        startedAt = Date.now();
        return callGas('apiGetBootstrapData');
      })
      .then(function (data) {
        if (myGen !== bootGen) return;   // 接続を切り替えたあとに届いた古い返事は使わない
        // 取りに行っている間に届いた評価は、この返事より新しいので、そちらを残す
        (state.recentReviews || []).forEach(function (r) {
          if (r.at < startedAt || !r.card || !data.vocab) return;
          for (var i = 0; i < data.vocab.length; i++) {
            if (data.vocab[i].id === r.card.id) { data.vocab[i] = r.card; break; }
          }
          if (r.stats) data.stats = r.stats;
        });
        state.freshLoaded = true;
        state.bootFailed = false;
        state.lastSyncAt = Date.now();
        applyBootstrapData(data);
        initLocalAudioCacheAfterBootstrap();
        if (!DEMO) dataCacheSet(bootCacheKey(), { v: BOOT_CACHE_VERSION, savedAt: Date.now(), data: data });
        if (showDoneToast) showToast('最新のデータにしました');
      })
      .catch(function (err) {
        if (myGen !== bootGen) return;
        state.bootFailed = true;
        subEl.textContent = state.vocab.length ? '前回のデータを表示中（つながっていません）' : '読み込めませんでした';
        if (err && err.code === 'bad_key' && !DEMO) {
          showSetup(true);
          var m = document.getElementById('cfgMsg');
          m.className = 'setup-msg err';
          m.textContent = '合言葉が違います。Apps Script で showAppSetupLink を実行し、新しい設定リンクを入れてください。';
        } else {
          showToast('読み込めませんでした：' + err.message, true);
        }
        if (!state.vocab.length) renderStudyGroups();
      })
      .then(function () {
        if (myGen !== bootGen) return;
        bootLoading = false;
        if (refreshBtn) { refreshBtn.disabled = false; refreshBtn.classList.remove('is-spinning'); }
        renderAppInfo();
      });
  }

  function setExtractionBusy(busy, message) {
    state.isExtracting = busy;
    var loadBox = document.getElementById('extractLoadingBox');
    if (message) document.getElementById('extractLoadingText').textContent = message;
    loadBox.classList.toggle('visible', busy);
    ['runExtractBtn', 'rssCheckOnlyBtn', 'rssCheckAndExtractBtn', 'runUploadCaptionBtn'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.disabled = busy;
    });
    renderStreamsList();
  }

  function runStreamExtraction(urlOrId, customOptions) {
    if (state.isExtracting) return;
    setExtractionBusy(true, '字幕取得とGemini抽出を実行中...');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    callGas('apiExtractStream', urlOrId, customOptions || {})
      .then(function (data) {
        state.vocab = data.vocab || state.vocab;
        state.passages = data.passages || state.passages;
        state.streams = data.streams || state.streams;
        state.stats = data.stats || state.stats;
        renderCreatorSelects();
        renderHeaderAndStats();
        renderShadowTab();
        renderLibraryStreamFilterOptions();
        renderLibraryList();
        rebuildStudyQueue();
        var ex = data.extraction;
        showToast(ex.addedCount + ' 語を追加しました（' + ex.chunksDone + '/' + ex.chunksTotal + ' 区切り）');
      })
      .catch(function (e) { showToast('抽出できませんでした：' + e.message, true); })
      .finally(function () { setExtractionBusy(false); });
  }

  function runRssSync(autoExtractLatest) {
    if (state.isExtracting) return;
    document.getElementById('rssLoadingBox').classList.add('visible');
    setExtractionBusy(true, 'チャンネルRSSを確認中...');
    callGas('apiCheckChannelRss', autoExtractLatest)
      .then(function (data) {
        state.vocab = data.vocab || state.vocab;
        state.passages = data.passages || state.passages;
        state.streams = data.streams || state.streams;
        state.stats = data.stats || state.stats;
        state.settings = data.settings || state.settings;
        renderCreatorSelects();
        renderHeaderAndStats();
        renderShadowTab();
        renderLibraryStreamFilterOptions();
        renderLibraryList();
        rebuildStudyQueue();
        showToast('新着を確かめました（新しく ' + data.sync.newlyQueuedCount + ' 本）');
      })
      .catch(function (e) { showToast('新着を確かめられませんでした：' + e.message, true); })
      .finally(function () {
        document.getElementById('rssLoadingBox').classList.remove('visible');
        setExtractionBusy(false);
      });
  }

  function runCaptionFileUpload() {
    if (state.isExtracting) return;
    var fileInput = document.getElementById('uploadCaptionFile');
    var urlInput = document.getElementById('uploadCaptionUrl');
    var file = fileInput.files && fileInput.files[0];
    if (!file) { showToast('字幕ファイルを選択してください', true); return; }
    if (file.size > 2 * 1024 * 1024) { showToast('ファイル上限は2MBです', true); return; }
    setExtractionBusy(true, '字幕ファイルから抽出中...');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    var reader = new FileReader();
    reader.onload = function () {
      callGas('apiIngestCaptionFile', urlInput.value.trim(), file.name, String(reader.result || ''), {})
        .then(function (data) {
          state.vocab = data.vocab || state.vocab;
          state.passages = data.passages || state.passages;
          state.streams = data.streams || state.streams;
          state.stats = data.stats || state.stats;
          renderCreatorSelects();
          renderHeaderAndStats();
          renderShadowTab();
          renderLibraryStreamFilterOptions();
          renderLibraryList();
          rebuildStudyQueue();
          fileInput.value = '';
          showToast(data.extraction.addedCount + ' 語を追加しました');
        })
        .catch(function (e) { showToast('取り込めませんでした：' + e.message, true); })
        .finally(function () { setExtractionBusy(false); });
    };
    reader.onerror = function () { setExtractionBusy(false); showToast('ファイルを読めませんでした', true); };
    reader.readAsText(file);
  }

  /* ============================================================
   * Event Wiring
   * ============================================================ */
  function bindEvents() {
    document.querySelectorAll('.nav-btn').forEach(function (b) {
      b.addEventListener('click', function () { switchTab(this.getAttribute('data-tab')); });
    });
    document.getElementById('refreshBtn').addEventListener('click', function () { loadBootstrap(true); });

    var seedBtn = document.getElementById('runSeedImportBtn');
    if (seedBtn) {
      seedBtn.addEventListener('click', function () {
        var btn = this; btn.disabled = true;
        btn.textContent = '取り込んでいます…（10〜20秒）';
        callGas('apiImportPrebuiltSeed')
          .then(function (data) {
            state.vocab = data.vocab || state.vocab;
            state.passages = data.passages || state.passages;
            state.streams = data.streams || state.streams;
            state.stats = data.stats || state.stats;
            if (data.audioFolderStatus) state.audioFolderStatus = data.audioFolderStatus;
            renderCreatorSelects();
            renderHeaderAndStats();
            renderShadowTab();
            renderLibraryStreamFilterOptions();
            renderLibraryList();
            renderStreamsList();
            rebuildStudyQueue();
            var r = data.importResult;
            showToast('取り込みました：新しく ' + r.vocabAdded + ' 語・更新 ' + (r.vocabUpdated || 0) + ' 語・重複 ' + (r.dedupRemoved || 0) + ' 件をまとめました');
          })
          .catch(function (err) {
            btn.disabled = false;
            btn.textContent = 'まとめて取り込む';
            showToast('取り込めませんでした：' + err.message, true);
          });
      });
    }

    var bulkBtn = document.getElementById('bulkDownloadAudioBtn');
    if (bulkBtn) bulkBtn.addEventListener('click', startBulkAudioDownload);
    var settingsBulkBtn = document.getElementById('settingsBulkDownloadBtn');
    if (settingsBulkBtn) settingsBulkBtn.addEventListener('click', startBulkAudioDownload);
    var clearCacheBtn = document.getElementById('settingsClearAudioCacheBtn');
    if (clearCacheBtn) {
      clearCacheBtn.addEventListener('click', function () {
        if (state.bulkDownloadRunning) {
          showToast('ダウンロード中は消去できません。先に一時停止してください', true);
          return;
        }
        if (!window.confirm('端末に保存された音声キャッシュを消去しますか？（Googleドライブの音声ファイルは消えません）')) return;
        audioDbClear().then(function () {
          state.cachedAudioSet = {};
          try { safeStorageSet('saba_done_pack_ids', '{}'); } catch (eClr) {}
          Object.keys(state.audioBlobUrls).forEach(function (k) {
            if (k !== state.activeAudioFile) {
              try { URL.revokeObjectURL(state.audioBlobUrls[k]); } catch (e) {}
              delete state.audioBlobUrls[k];
            }
          });
          state.audioBlobUrlOrder = state.activeAudioFile && state.audioBlobUrls[state.activeAudioFile] ? [state.activeAudioFile] : [];
          renderAudioCacheStatusUi();
          showToast('端末に保存した音声を消しました');
        });
      });
    }

    // Audio Player Controls
    document.getElementById('playerCloseBtn').addEventListener('click', closePlayerDock);
    document.getElementById('stopAutoplayBtn').addEventListener('click', function () {
      stopAutoplayMode(); pausePlayerQuietly(); showToast('聴き流しを停止しました');
    });
    document.getElementById('clipProgressTrack').addEventListener('click', function (ev) {
      var a = state.audioEl;
      if (!a || !a.duration || !isFinite(a.duration)) return;
      var b = state.activeTrimBounds && state.activeTrimBounds.end > state.activeTrimBounds.start
        ? state.activeTrimBounds
        : { start: 0, end: a.duration };
      var rect = this.getBoundingClientRect();
      var ratio = Math.max(0, Math.min(1, (ev.clientX - rect.left) / Math.max(1, rect.width)));
      a.currentTime = b.start + (b.end - b.start) * ratio;
      if (a.paused) a.play().catch(function () {});
    });
    document.getElementById('playPauseClipBtn').addEventListener('click', function () {
      var a = state.audioEl;
      if (!a) return;
      var b = state.activeTrimBounds && state.activeTrimBounds.end > state.activeTrimBounds.start
        ? state.activeTrimBounds
        : { start: 0, end: a.duration || 0 };
      if (state.playerStatus === 'playing') {
        stopAutoplayMode();
        pausePlayerQuietly();
      } else if (a.src && state.activeAudioFile && state.audioBlobUrls[state.activeAudioFile]) {
        if (a.ended || a.currentTime < b.start || (b.end > 0 && a.currentTime >= b.end - 0.08)) {
          a.currentTime = b.start;
        }
        a.playbackRate = state.playbackRate;
        a.play().catch(function () {});
      } else {
        var obj = getActiveClipObject();
        if (obj) playClipObject(obj, state.activeClipType, false);
      }
    });
    document.getElementById('rewind3sBtn').addEventListener('click', function () {
      var a = state.audioEl;
      if (!a || !a.src) return;
      var bStart = (state.activeTrimBounds && state.activeTrimBounds.start) || 0;
      a.currentTime = Math.max(bStart, (a.currentTime || 0) - 3.0);
      a.play().catch(function () {});
    });
    document.getElementById('loopToggleBtn').addEventListener('click', function () {
      state.loopMode = !state.loopMode;
      updatePlayerButtonsUi();
        showToast(state.loopMode ? 'くり返し：オン' : 'くり返し：オフ');
    });
    document.getElementById('speedCycleBtn').addEventListener('click', function () {
      var idx = SPEED_STEPS.indexOf(state.playbackRate);
      state.playbackRate = SPEED_STEPS[(idx + 1) % SPEED_STEPS.length];
      safeStorageSet('saba_speed', state.playbackRate);
      if (state.audioEl) state.audioEl.playbackRate = state.playbackRate;
      updatePlayerButtonsUi();
      renderShadowTab();
    });

    // 練習のしかた（カード・4択・穴埋め）
    function setStudyMode(mode) {
      state.studyMode = mode;
      state.cardRevealed = false;
      state.quizAnsweredIdx = -1;
      state.quizOptions = [];
      ['modeNormalBtn', 'modeQuizBtn', 'modeListenBtn'].forEach(function (id) {
        var active = (id === 'modeNormalBtn' && mode === 'normal') || (id === 'modeQuizBtn' && mode === 'quiz') || (id === 'modeListenBtn' && mode === 'listening');
        var el = document.getElementById(id);
        el.classList.toggle('active', active);
        el.setAttribute('aria-selected', String(active));
      });
      renderStudyCard();
    }
    document.getElementById('modeNormalBtn').addEventListener('click', function () { setStudyMode('normal'); });
    document.getElementById('modeQuizBtn').addEventListener('click', function () { setStudyMode('quiz'); });
    document.getElementById('modeListenBtn').addEventListener('click', function () { setStudyMode('listening'); });

    // Study Group Picker & Back Button
    document.getElementById('groupTabUnitsBtn').addEventListener('click', function () {
      state.studyGroupTab = 'units';
      renderStudyGroups();
    });
    document.getElementById('groupTabSmartBtn').addEventListener('click', function () {
      state.studyGroupTab = 'smart';
      renderStudyGroups();
    });
    document.getElementById('studyGroupListContainer').addEventListener('click', function (ev) {
      var btn = ev.target.closest('[data-study-group]');
      if (!btn || btn.disabled) return;
      openStudyGroup(btn.getAttribute('data-study-group'));
    });
    document.getElementById('studyBackToGroupsBtn').addEventListener('click', showStudyGroupPicker);
    document.getElementById('studyCreatorSelect').addEventListener('change', function () {
      state.studyCreator = this.value;
      renderStudyGroups();
    });
    document.getElementById('shadowCreatorSelect').addEventListener('change', function () { state.shadowCreator = this.value; state.shadowStreamId = 'all'; renderShadowTab(); });
    document.getElementById('shadowStreamSelect').addEventListener('change', function () { state.shadowStreamId = this.value; renderShadowTab(); });
    document.getElementById('shadowBackToPracticeBtn').addEventListener('click', function () {
      state.shadowView = 'practice';
      renderShadowTab();
    });

    document.getElementById('studyUndoBtn').addEventListener('click', function () {
      if (state.studyHistory.length === 0) return;
      var prev = state.studyHistory.pop();
      var canceled = false;
      if (state.pendingReview && state.pendingReview === prev) {
        if (state.pendingReviewTimerId) { clearTimeout(state.pendingReviewTimerId); state.pendingReviewTimerId = null; }
        state.pendingReview = null;
        canceled = true;
      }
      if (prev.appendedAgain && state.studyQueueIds[state.studyQueueIds.length - 1] === prev.cardId) state.studyQueueIds.pop();
      state.studyIndex = prev.prevIndex;
      state.cardRevealed = false;
      updateStudyUndoButton();
      renderStudyCard();
      showToast(canceled ? '答えを取り消しました' : '前のカードに戻りました');
    });

    // Passage list & modal
    document.getElementById('passageListContainer').addEventListener('click', function (ev) {
      var btn = ev.target.closest('[data-select-passage]');
      if (!btn) return;
      pausePlayerQuietly();
      state.selectedPassageId = btn.getAttribute('data-select-passage');
      state.shadowView = 'practice';
      state.passageShowJa = false;
      state.passageShowTips = false;
      renderShadowTab();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    var manualPassageModal = document.getElementById('manualPassageModal');
    document.getElementById('openManualPassageBtn').addEventListener('click', function () { setModalOpen(manualPassageModal, true); });
    document.getElementById('manualPassageClose').addEventListener('click', function () { setModalOpen(manualPassageModal, false); });
    manualPassageModal.addEventListener('click', function (ev) { if (ev.target === this) setModalOpen(manualPassageModal, false); });
    document.getElementById('submitManualPassageBtn').addEventListener('click', function () {
      var btn = this;
      var payload = {
        videoUrl: document.getElementById('mpUrl').value.trim(),
        titleJa: document.getElementById('mpTitle').value.trim(),
        startSec: document.getElementById('mpStart').value.trim(),
        endSec: document.getElementById('mpEnd').value.trim(),
        scriptEn: document.getElementById('mpScriptEn').value.trim(),
        scriptJa: document.getElementById('mpScriptJa').value.trim()
      };
      if (!payload.videoUrl || !payload.scriptEn) { showToast('URLと英語スクリプトは必須です', true); return; }
      btn.disabled = true;
      callGas('apiAddManualPassage', payload)
        .then(function (d) {
          state.passages.unshift(d.passage);
          state.selectedPassageId = d.passage.id;
          setModalOpen(manualPassageModal, false);
          renderShadowTab();
          showToast('長文を追加しました');
        })
        .catch(function (e) { showToast('追加できませんでした：' + e.message, true); })
        .finally(function () { btn.disabled = false; });
    });

    // Library
    document.getElementById('librarySearchInput').addEventListener('input', function () { state.librarySearch = this.value; renderLibraryList(); });
    document.getElementById('libraryFilterChips').addEventListener('click', function (ev) {
      var btn = ev.target.closest('.filter-chip');
      if (!btn) return;
      state.libraryChip = btn.getAttribute('data-filter');
      this.querySelectorAll('.filter-chip').forEach(function (c) { c.classList.remove('active'); });
      btn.classList.add('active');
      renderLibraryList();
    });
    document.getElementById('libraryCreatorSelect').addEventListener('change', function () {
      state.libraryCreator = this.value;
      renderLibraryStreamFilterOptions();
      renderLibraryList();
    });
    document.getElementById('libraryStreamSelect').addEventListener('change', function () { state.libraryStreamId = this.value; renderLibraryList(); });
    document.getElementById('librarySortSelect').addEventListener('change', function () { state.librarySort = this.value; renderLibraryList(); });
    document.getElementById('libraryFavOnlyBtn').addEventListener('click', function () {
      state.libraryFavOnly = !state.libraryFavOnly;
      this.classList.toggle('is-fav-on', state.libraryFavOnly);
      this.setAttribute('aria-pressed', String(state.libraryFavOnly));
      renderLibraryList();
    });
    document.getElementById('startAutoplayListBtn').addEventListener('click', function () { startAutoplayFromLibrary(getFilteredLibraryCards()); });
    document.getElementById('libraryListContainer').addEventListener('click', function (ev) {
      var target = ev.target.closest('[data-action]');
      if (!target) return;
      var card = findCardById(target.getAttribute('data-id'));
      if (!card) return;
      var act = target.getAttribute('data-action');
      if (act === 'play') { stopAutoplayMode(); playClipObject(card, 'vocab', false); }
      else if (act === 'fav') toggleCardFavorite(card);
      else if (act === 'detail') openDetailModal(card, false);
    });

    // Streams & Upload
    document.getElementById('runExtractBtn').addEventListener('click', function () {
      var url = document.getElementById('extractUrlInput').value.trim();
      if (!url) { showToast('YouTube URL を入力してください', true); return; }
      var sMin = document.getElementById('extractStartMin').value;
      var eMin = document.getElementById('extractEndMin').value;
      runStreamExtraction(url, { startMin: sMin !== '' ? Number(sMin) : '', endMin: eMin !== '' ? Number(eMin) : '', preferVideoDirect: document.getElementById('preferVideoDirectCheck').checked });
    });
    document.getElementById('rssCheckOnlyBtn').addEventListener('click', function () { runRssSync(false); });
    document.getElementById('rssCheckAndExtractBtn').addEventListener('click', function () { runRssSync(true); });
    document.getElementById('runUploadCaptionBtn').addEventListener('click', runCaptionFileUpload);
    document.getElementById('streamsListContainer').addEventListener('click', function (ev) {
      var exBtn = ev.target.closest('[data-stream-extract]');
      if (exBtn) { runStreamExtraction(exBtn.getAttribute('data-stream-extract'), {}); return; }
      var libBtn = ev.target.closest('[data-stream-lib]');
      if (libBtn) {
        state.libraryStreamId = libBtn.getAttribute('data-stream-lib');
        document.getElementById('libraryStreamSelect').value = state.libraryStreamId;
        renderLibraryList();
        switchTab('library');
        return;
      }
      var stBtn = ev.target.closest('[data-stream-study]');
      if (stBtn) {
        openStudyGroup('', stBtn.getAttribute('data-stream-study'));
        switchTab('study');
      }
    });

    // Modals
    var detailModal = document.getElementById('detailModal');
    var manualModal = document.getElementById('manualAddModal');
    function closeDetailModal() {
      state.detailModalCardId = null;
      setModalOpen(detailModal, false);
    }
    document.getElementById('detailModalClose').addEventListener('click', closeDetailModal);
    detailModal.addEventListener('click', function (ev) { if (ev.target === this) closeDetailModal(); });
    document.getElementById('openManualAddBtn').addEventListener('click', function () { setModalOpen(manualModal, true); });
    document.getElementById('manualModalClose').addEventListener('click', function () { setModalOpen(manualModal, false); });
    manualModal.addEventListener('click', function (ev) { if (ev.target === this) setModalOpen(manualModal, false); });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') {
        closeDetailModal();
        setModalOpen(manualModal, false);
        setModalOpen(manualPassageModal, false);
      }
    });

    document.getElementById('submitManualAddBtn').addEventListener('click', function () {
      var btn = this;
      var payload = {
        videoUrl: document.getElementById('manUrl').value.trim(),
        expression: document.getElementById('manExpr').value.trim(),
        meaningJa: document.getElementById('manMeaning').value.trim(),
        startSec: document.getElementById('manStart').value.trim(),
        endSec: document.getElementById('manEnd').value.trim(),
        category: document.getElementById('manCategory').value,
        level: document.getElementById('manLevel').value,
        quoteEn: document.getElementById('manQuote').value.trim(),
        nuanceJa: document.getElementById('manNuance').value.trim()
      };
      if (!payload.videoUrl || !payload.expression || !payload.meaningJa) { showToast('URL・表現・意味は必須です', true); return; }
      btn.disabled = true;
      callGas('apiAddManualCard', payload)
        .then(function (d) {
          state.vocab.unshift(d.card);
          if (d.stats) state.stats = d.stats;
          setModalOpen(manualModal, false);
          ['manExpr', 'manMeaning', 'manStart', 'manEnd', 'manQuote', 'manNuance'].forEach(function (id) { document.getElementById(id).value = ''; });
          renderHeaderAndStats(); renderLibraryStreamFilterOptions(); renderLibraryList(); rebuildStudyQueue();
          showToast('追加しました');
        })
        .catch(function (e) { showToast('追加できませんでした：' + e.message, true); })
        .finally(function () { btn.disabled = false; });
    });

    // Settings & Dedup
    document.getElementById('dailyTriggerToggle').addEventListener('change', function () {
      var checked = this.checked; var el = this;
      callGas('apiToggleDailyTrigger', checked).then(function (d) {
        state.triggerStatus = d.triggerStatus;
        showToast(d.triggerStatus.enabled ? '毎朝の自動抽出：オン' : '毎朝の自動抽出：オフ');
      }).catch(function (e) { el.checked = !checked; showToast('変えられませんでした：' + e.message, true); });
    });

    document.getElementById('saveSettingsBtn').addEventListener('click', function () {
      var btn = this; btn.disabled = true;
      var patch = {
        geminiModel: document.getElementById('settingGeminiModel').value.trim(),
        difficultyProfile: document.getElementById('settingDifficulty').value,
        maxItemsPerChunk: document.getElementById('settingMaxItems').value.trim(),
        chunkMinutes: document.getElementById('settingChunkMinutes').value.trim(),
        channelHandle: document.getElementById('settingChannelHandle').value.trim(),
        dailyReviewGoal: document.getElementById('settingDailyGoal').value.trim(),
        clipPadBeforeSec: document.getElementById('settingPadBefore').value.trim(),
        clipPadAfterSec: document.getElementById('settingPadAfter').value.trim()
      };
      callGas('apiSaveSettings', patch, document.getElementById('settingApiKey').value.trim())
        .then(function (d) {
          state.settings = d.settings; state.apiKeyStatus = d.apiKeyStatus;
          if (d.stats) state.stats = d.stats;
          document.getElementById('settingApiKey').value = '';
          renderHeaderAndStats(); renderStreamsList(); renderSettingsForm();
          showToast('設定を保存しました');
        })
        .catch(function (e) { showToast('保存できませんでした：' + e.message, true); })
        .finally(function () { btn.disabled = false; });
    });

    document.getElementById('runDedupBtn').addEventListener('click', function () {
      var btn = this; btn.disabled = true;
      callGas('apiDeduplicateVocab')
        .then(function (d) {
          state.vocab = d.vocab || state.vocab;
          if (d.stats) state.stats = d.stats;
          renderHeaderAndStats(); renderLibraryStreamFilterOptions(); renderLibraryList(); rebuildStudyQueue();
          showToast('重複をまとめました：' + d.dedup.beforeCount + ' 語 → ' + d.dedup.afterCount + ' 語');
        })
        .catch(function (e) { showToast('まとめられませんでした：' + e.message, true); })
        .finally(function () { btn.disabled = false; });
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        flushPendingReview();
        if (state.autoplayPauseTimerId) { clearTimeout(state.autoplayPauseTimerId); state.autoplayPauseTimerId = null; }
      } else {
        if (state.autoplayActive) requestWakeLock();
        onAppResume();
      }
    });
    window.addEventListener('pagehide', flushPendingReview);
    window.addEventListener('scroll', function () {
      document.body.classList.toggle('is-scrolled', window.scrollY > 4);
    }, { passive: true });
    bindAppSettingsEvents();
  }

  /* ============================================================
   * このアプリ（表示テーマ・接続・版・iPhone に入れる）
   * ============================================================ */
  function getThemePref() { var t = safeStorageGet('saba_theme', 'auto'); return t === 'light' || t === 'dark' ? t : 'auto'; }
  function applyTheme(pref) {
    var root = document.documentElement;
    if (pref === 'light' || pref === 'dark') root.setAttribute('data-theme', pref);
    else root.removeAttribute('data-theme');
    var dark = pref === 'dark' || (pref === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    // 上端の色（時刻表示の帯）も合わせる
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) {
      if (pref === 'auto') metas[i].setAttribute('content', metas[i].media.indexOf('dark') !== -1 ? '#101d2c' : '#e8edf9');
      else metas[i].setAttribute('content', dark ? '#101d2c' : '#e8edf9');
    }
    var segBtns = document.querySelectorAll('[data-theme-set]');
    for (var j = 0; j < segBtns.length; j++) segBtns[j].classList.toggle('active', segBtns[j].getAttribute('data-theme-set') === pref);
  }

  function renderAppInfo() {
    var conn = document.getElementById('connStatus');
    if (conn) {
      if (DEMO) { conn.textContent = 'デモ（作り物のデータ）'; conn.className = 'v'; }
      else if (state.freshLoaded && !state.bootFailed) { conn.textContent = 'つながっています'; conn.className = 'v ok'; }
      else if (state.bootFailed) { conn.textContent = 'つながっていません'; conn.className = 'v'; }
      else { conn.textContent = cfg ? 'つないでいます…' : '未接続'; conn.className = 'v'; }
    }
    var ver = document.getElementById('verNote');
    if (ver) ver.textContent = VERSION;
    // PC などで開いているときは、iPhone に入れるための QR コードを出す
    var card = document.getElementById('installCard');
    if (card) {
      var show = !DEMO && cfg && !IS_IOS;
      card.hidden = !show;
      if (show) drawInstallQr();
    }
  }

  var qrLibPromise = null;
  function loadQrLib() {
    if (window.qrcode) return Promise.resolve(window.qrcode);
    if (qrLibPromise) return qrLibPromise;
    qrLibPromise = new Promise(function (resolve, reject) {
      var sc = document.createElement('script');
      sc.src = 'vendor/qrcode.min.js';   // qrcode-generator 1.4.4（MIT）。外の配信は使わない
      sc.onload = function () { window.qrcode ? resolve(window.qrcode) : reject(new Error('QR')); };
      sc.onerror = function () { qrLibPromise = null; reject(new Error('QR')); };
      document.head.appendChild(sc);
    });
    return qrLibPromise;
  }
  function drawInstallQr() {
    var box = document.getElementById('installQr');
    if (!box || !cfg || box.getAttribute('data-for') === cfg.key) return;
    loadQrLib().then(function (qrcode) {
      var qr = qrcode(0, 'M');
      qr.addData(installLink(cfg));
      qr.make();
      box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
      box.setAttribute('data-for', cfg.key);
    }).catch(function () {
      box.innerHTML = '<p class="helper-note" style="margin:0;">QR コードを出せませんでした。下の「リンクをコピー」を使ってください。</p>';
    });
  }

  function bindAppSettingsEvents() {
    var segBtns = document.querySelectorAll('[data-theme-set]');
    for (var i = 0; i < segBtns.length; i++) {
      segBtns[i].addEventListener('click', function () {
        var pref = this.getAttribute('data-theme-set');
        safeStorageSet('saba_theme', pref);
        applyTheme(pref);
      });
    }
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function () { applyTheme(getThemePref()); };
      if (mq.addEventListener) mq.addEventListener('change', onChange); else if (mq.addListener) mq.addListener(onChange);
    }
    document.getElementById('copyInstallLinkBtn').addEventListener('click', function () {
      var msg = document.getElementById('copyInstallMsg');
      if (DEMO || !cfg) { msg.textContent = 'まだ接続していません。'; return; }
      var link = installLink(cfg);
      var done = function () { msg.textContent = 'コピーしました。Safari に貼り付けて開き、共有 →「ホーム画面に追加」で入れられます。他人には見せないでください。'; };
      try {
        navigator.clipboard.writeText(link).then(done, function () { msg.textContent = link; msg.style.wordBreak = 'break-all'; });
      } catch (e) { msg.textContent = link; msg.style.wordBreak = 'break-all'; }
    });
    document.getElementById('openSetupBtn').addEventListener('click', function () { showSetup(true); });
    document.getElementById('applyUpdateBtn').addEventListener('click', function () { location.reload(); });
    // 電波が戻ったら、読めていなかったデータを取りに行く
    window.addEventListener('online', function () { if (state.bootFailed && cfg && !DEMO) loadBootstrap(false, true); });
  }

  /* ---------- 版の確認（公開したら、開いているアプリも新しくなる） ---------- */
  var updateReady = '';
  function checkVersion() {
    if (DEMO || VERSION === 'dev' || location.protocol === 'file:') return;
    fetch('version.json?' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j || !j.version || j.version === VERSION) return;
      updateReady = j.version;
      var strip = document.getElementById('updateStrip');
      if (strip) strip.hidden = false;
      // 練習や再生の途中でなければ、そのまま読み直す
      if (isSafeToReload()) reloadForUpdate();
    }).catch(function () {});
  }
  function reloadForUpdate() {
    // 電波が弱くて古い画面が出たときに、読み直しをくり返さない（同じ版では1回まで）
    var already = '';
    try { already = sessionStorage.getItem('saba_reloaded_for') || ''; } catch (e) {}
    if (already === updateReady) return;
    try { sessionStorage.setItem('saba_reloaded_for', updateReady); } catch (e) {}
    location.reload();
  }
  function isSafeToReload() {
    var ae = document.activeElement;
    var typing = ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName);
    return state.studyView !== 'session' && state.playerStatus !== 'playing' && !state.autoplayActive &&
      !state.bulkDownloadRunning && !state.isExtracting && !document.querySelector('.modal-backdrop.open') &&
      !state.pendingReview && !(state.reviewInFlight > 0) && !typing &&
      document.getElementById('setupScreen').hidden;
  }

  function onAppResume() {
    if (updateReady && isSafeToReload()) { reloadForUpdate(); }
    checkVersion();
    if (DEMO || !cfg) return;
    // 10分以上たっていたら裏でデータを新しくする。まだ一度も読めていなければ、30秒おいて再挑戦
    var now = Date.now();
    if (state.lastSyncAt ? (now - state.lastSyncAt > 10 * 60 * 1000) : (now - (state.lastSyncAttemptAt || 0) > 30 * 1000)) {
      loadBootstrap(false, true);
    }
  }

  /* ============================================================
   * 接続の設定画面
   * ============================================================ */
  function showSetup(canCancel) {
    document.getElementById('appShell').hidden = true;
    document.getElementById('setupScreen').hidden = false;
    var link = document.getElementById('cfgLink');
    if (cfg) {
      document.getElementById('cfgApi').value = cfg.api || '';
      document.getElementById('cfgKey').value = cfg.key || '';
    }
    var demoLink = document.querySelector('.setup-demo');
    if (demoLink) {
      demoLink.textContent = canCancel ? 'もどる' : 'データなしで見てみる（デモ）';
      demoLink.onclick = canCancel ? function (ev) { ev.preventDefault(); hideSetup(); } : null;
    }
    if (link) setTimeout(function () { try { link.focus({ preventScroll: true }); } catch (e) {} }, 50);
  }
  function hideSetup() {
    document.getElementById('setupScreen').hidden = true;
    document.getElementById('appShell').hidden = false;
  }

  function bindSetupEvents() {
    document.getElementById('cfgSave').addEventListener('click', function () {
      var btn = this;
      var msg = document.getElementById('cfgMsg');
      msg.className = 'setup-msg';
      var linkVal = document.getElementById('cfgLink').value.trim();
      var next = null;
      if (linkVal) {
        var m = /[?&]c=([A-Za-z0-9_-]+)/.exec(linkVal);
        next = m ? decodeCfg(m[1]) : null;
        if (!next) { msg.textContent = '設定リンクが読めません。もう一度コピーしてください。'; msg.classList.add('err'); return; }
      } else {
        var api = document.getElementById('cfgApi').value.trim();
        var key = document.getElementById('cfgKey').value.trim();
        if (!isValidApiUrl(api) || !key) { msg.textContent = '設定リンクか、URL（…/exec で終わるもの）と合言葉を入れてください。'; msg.classList.add('err'); return; }
        next = { api: api, key: key };
      }
      btn.disabled = true;
      msg.textContent = 'つないでいます…';
      postApi(next, 'ping', []).then(function () {
        // srcC：起動したときのアドレスの ?c=。同じアイコンから次に開いたとき、この設定を優先する
        cfg = { api: next.api, key: next.key, srcC: rawC };
        saveCfg(cfg);
        // この URL のままホーム画面に追加すると、アプリ側にも設定が入る
        history.replaceState(null, '', location.pathname + '?c=' + encodeCfg(cfg));
        msg.textContent = IS_IOS && !IS_STANDALONE
          ? 'つながりました。このまま共有ボタン →「ホーム画面に追加」をすると、アイコンから開けます。'
          : 'つながりました。';
        msg.classList.add('ok');
        setTimeout(function () {
          hideSetup();
          if (appStarted) { state.freshLoaded = false; loadBootstrap(true, false, true); renderAppInfo(); } else startApp();
        }, 900);
      }).catch(function (err) {
        msg.textContent = 'つなげませんでした：' + err.message;
        msg.classList.add('err');
      }).then(function () { btn.disabled = false; });
    });
  }

  /* ============================================================
   * 起動
   * ============================================================ */
  var appStarted = false;
  function startApp() {
    if (appStarted) return;
    appStarted = true;
    hideSetup();
    var savedSpeed = parseFloat(safeStorageGet('saba_speed', '1.0'));
    if (SPEED_STEPS.indexOf(savedSpeed) !== -1) state.playbackRate = savedSpeed;
    initAudioElement();
    updatePlayerButtonsUi();
    bindEvents();
    renderStudyGroups();
    renderAppInfo();

    if (DEMO) {
      loadBootstrap(false).then(renderAppInfo);
    } else {
      // 前回のデータがあれば、まずそれを出す（開いた瞬間に使える）。そのあと裏で新しくする
      dataCacheGet(bootCacheKey()).then(function (cached) {
        if (cached && cached.v !== BOOT_CACHE_VERSION) cached = null;
        if (cached && cached.data && !state.freshLoaded) {
          applyBootstrapData(cached.data);
          initLocalAudioCacheAfterBootstrap();
          document.getElementById('topSubStatus').textContent = '前回のデータを表示中・新しくしています…';
        }
        return loadBootstrap(false, Boolean(cached));
      }).then(renderAppInfo);
      // 端末の保存領域を消されにくくする（音声をためるため）
      try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
      if ('serviceWorker' in navigator && location.protocol === 'https:') {
        navigator.serviceWorker.register('sw.js').catch(function () {});
      }
      checkVersion();
      setInterval(function () { if (!document.hidden) checkVersion(); }, 5 * 60 * 1000);
    }
  }

  function init() {
    fillStaticIcons();
    applyTheme(getThemePref());
    bindSetupEvents();
    if (DEMO || cfg) startApp();
    else showSetup(false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
