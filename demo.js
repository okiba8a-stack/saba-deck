/* デモ用の作り物データ（?demo=1 のときだけ読む）。裏方につながずに画面を確かめるためのもの。
   例文はすべてこのデモ用に作ったもので、実際の配信のセリフではない。 */
(function () {
  function makeDemoWavB64() {
    // 0.6 秒の短い音（本物の切り抜き音声のかわり）
    var rate = 8000, n = Math.floor(rate * 0.6), size = 44 + n * 2;
    var buf = new DataView(new ArrayBuffer(size));
    function str(o, t) { for (var i = 0; i < t.length; i++) buf.setUint8(o + i, t.charCodeAt(i)); }
    str(0, 'RIFF'); buf.setUint32(4, 36 + n * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
    buf.setUint32(16, 16, true); buf.setUint16(20, 1, true); buf.setUint16(22, 1, true);
    buf.setUint32(24, rate, true); buf.setUint32(28, rate * 2, true); buf.setUint16(32, 2, true); buf.setUint16(34, 16, true);
    str(36, 'data'); buf.setUint32(40, n * 2, true);
    for (var i = 0; i < n; i++) {
      var env = Math.min(1, i / 200, (n - i) / 400);
      buf.setInt16(44 + i * 2, Math.round(Math.sin(2 * Math.PI * 523.25 * i / rate) * 4000 * env), true);
    }
    var bin = '', u8 = new Uint8Array(buf.buffer);
    for (var j = 0; j < u8.length; j++) bin += String.fromCharCode(u8[j]);
    return btoa(bin);
  }
  var nowIso = new Date().toISOString();
  var demoAudioB64 = makeDemoWavB64();

  var dbVocab = [
    {
      id: 'v_demo_1',
      videoId: 'M7lc1UVf-VE',
      streamTitle: '[DEMO] saba Late Night Chat & Cozy Gaming',
      streamDate: '2026-11-18',
      channelName: 'saba',
      audioFile: 'v_M7lc1UVf-VE_120.mp3',
      expression: "I'm cooked",
      readingHint: 'アイム・クックト（最後のtは弱く止める感じ）',
      category: 'Slang',
      level: 'Slang',
      register: 'Internet-Only',
      paraphraseBasicEn: "I'm in big trouble / I'm done for",
      meaningJa: 'もう終わりだ、詰んだ、やらかした',
      nuanceJa: 'ゲームで負け確のときやテスト前に絶望したときなど、配信や若者言葉で超頻出のスラング。',
      quoteEn: "Wait chat, I missed the jump—oh no, I'm cooked!",
      quoteJa: '待ってみんな、ジャンプ失敗した——うわ、もう詰んだ！',
      extraExampleEn: "I forgot to save my report, I'm totally cooked.",
      extraExampleJa: 'レポート保存し忘れた、完全に終わった。',
      startSec: 12,
      endSec: 17.5,
      favorite: true,
      status: 'learning',
      ease: 1.9,
      intervalDays: 1,
      reps: 1,
      lapses: 2,
      nextReviewAt: new Date(Date.now() - 3600000).toISOString(),
      lastReviewedAt: new Date(Date.now() - 86400000).toISOString(),
      createdAt: nowIso,
      source: 'prebuilt_seed',
      seenCount: 14
    },
    {
      id: 'v_demo_2',
      videoId: 'M7lc1UVf-VE',
      streamTitle: '[DEMO] saba Late Night Chat & Cozy Gaming',
      streamDate: '2026-11-18',
      channelName: 'saba',
      audioFile: 'v_M7lc1UVf-VE_320.mp3',
      expression: 'hold on',
      readingHint: 'ホールド・オン（dとoがつながって「ホールドン」）',
      category: 'Phrasal Verb',
      level: 'Basic',
      register: 'Everyday',
      paraphraseBasicEn: 'wait a second / pause',
      meaningJa: 'ちょっと待って、そのまま待って',
      nuanceJa: '会話や配信で一番よく使う「ちょっと待って」。複数配信の重複は1つに統合されます。',
      quoteEn: "Hold on, give me a second to figure out what this button does.",
      quoteJa: 'ちょっと待って、このボタンが何するのか理解する時間ちょうだい。',
      extraExampleEn: "Hold on, let me check my notes.",
      extraExampleJa: 'ちょっと待って、メモを確認させて。',
      startSec: 32,
      endSec: 37.5,
      favorite: false,
      status: 'new',
      ease: 2.5,
      intervalDays: 0,
      reps: 0,
      lapses: 0,
      nextReviewAt: nowIso,
      lastReviewedAt: '',
      createdAt: nowIso,
      source: 'prebuilt_seed',
      seenCount: 42
    },
    {
      id: 'v_demo_3',
      videoId: 'M7lc1UVf-VE',
      streamTitle: '[DEMO] saba Late Night Chat & Cozy Gaming',
      streamDate: '2026-11-18',
      channelName: 'saba',
      audioFile: 'v_M7lc1UVf-VE_550.mp3',
      expression: 'no way',
      readingHint: 'ノー・ウェイ（驚きのときは「ノー↑ウェイ↓」）',
      category: 'Reaction',
      level: 'Basic',
      register: 'Casual',
      paraphraseBasicEn: 'really? / I cannot believe it!',
      meaningJa: 'うそでしょ！まさか！ありえない！',
      nuanceJa: '嬉しい驚き・ショック・信じられない出来事のすべてに使える万能リアクション。',
      quoteEn: "No way! Did that actually just happen on stream?!",
      quoteJa: 'うそでしょ！今ほんとに配信中にそれ起きたの！？',
      extraExampleEn: "No way, you finished the whole thing in one day?",
      extraExampleJa: 'マジで？それ全部1日で終わらせたの？',
      startSec: 55,
      endSec: 60.5,
      favorite: true,
      status: 'mastered',
      ease: 2.65,
      intervalDays: 24,
      reps: 4,
      lapses: 0,
      nextReviewAt: new Date(Date.now() + 86400000 * 10).toISOString(),
      lastReviewedAt: nowIso,
      createdAt: nowIso,
      source: 'prebuilt_seed',
      seenCount: 31
    },
    {
      id: 'v_demo_4',
      videoId: 'M7lc1UVf-VE',
      streamTitle: '[DEMO] saba Cozy Archive',
      streamDate: '2026-11-15',
      channelName: 'saba',
      audioFile: 'v_M7lc1UVf-VE_750.mp3',
      expression: 'lock in',
      readingHint: 'ロック・イン（kとiがつながって「ロッキン」）',
      category: 'Phrasal Verb',
      level: 'Natural',
      register: 'Casual',
      paraphraseBasicEn: 'focus seriously / get in the zone',
      meaningJa: '本気モードに入る、ゾーンに入る、集中する',
      nuanceJa: 'ボス戦や大事な作業の前に「よし集中するぞ！」と気合いを入れるときの定番表現。',
      quoteEn: "Alright chat, stop distracting me, I gotta lock in for this boss.",
      quoteJa: 'よしみんな、気を散らさないで、このボス戦は本気で集中しなきゃ。',
      extraExampleEn: "Exam is tomorrow, time to lock in.",
      extraExampleJa: '明日テストだ、本気モード入るぞ。',
      startSec: 75,
      endSec: 81.0,
      favorite: false,
      status: 'new',
      ease: 2.5,
      intervalDays: 0,
      reps: 0,
      lapses: 0,
      nextReviewAt: nowIso,
      lastReviewedAt: '',
      createdAt: nowIso,
      source: 'prebuilt_seed',
      seenCount: 9
    },
    {
      id: 'v_demo_5',
      videoId: 'dQw4w9WgXcQ',
      streamTitle: '[DEMO] Guest Creator Talk',
      streamDate: '2026-11-12',
      channelName: 'guest',
      audioFile: 'v_dQw4w9WgXcQ_200.mp3',
      expression: 'figure out',
      readingHint: 'フィギャー・アウト（フィギャラウト）',
      category: 'Phrasal Verb',
      level: 'Basic',
      register: 'Everyday',
      paraphraseBasicEn: 'understand / find the answer',
      meaningJa: '理解する、解決策を見つける',
      nuanceJa: 'パズルや日常の疑問を「考えてわかる」ときにネイティブが毎日使う定番句動詞。',
      quoteEn: "Let's figure out how this mechanism works.",
      quoteJa: 'この仕組みがどう動いているか突き止めよう。',
      extraExampleEn: "Don't worry, we'll figure it out together.",
      extraExampleJa: '大丈夫、一緒に何とかしよう。',
      startSec: 20,
      endSec: 25.0,
      favorite: false,
      status: 'new',
      ease: 2.5,
      intervalDays: 0,
      reps: 0,
      lapses: 0,
      nextReviewAt: nowIso,
      lastReviewedAt: '',
      createdAt: nowIso,
      source: 'prebuilt_seed',
      seenCount: 18
    }
  ];


  // ユニットが複数できるよう、デモ用の表現を足す（意味と例文はこのデモのために作ったもの）
  var EXTRA = [
    ['no cap', '嘘じゃなく、マジで', 'Slang', 'Slang', 'No cap, that was the best boss fight ever.', 'マジで、今までで最高のボス戦だった。', 9],
    ['let me cook', '任せて、いいとこ見せるから', 'Slang', 'Slang', 'Okay chat, let me cook this time.', 'よしみんな、今回は任せて。', 8],
    ['my bad', 'ごめん、私のミス', 'Reaction', 'Basic', 'Oh, my bad, I clicked the wrong door.', 'あ、ごめん、違うドア押しちゃった。', 12],
    ['hang on', 'ちょっと待って', 'Phrasal Verb', 'Basic', 'Hang on, where did the key go?', 'ちょっと待って、鍵どこいった？', 11],
    ['give up', 'あきらめる', 'Phrasal Verb', 'Basic', "I'm not gonna give up on this level.", 'このステージはあきらめないから。', 10],
    ['for real', 'ほんとに？／マジで', 'Reaction', 'Natural', 'Wait, for real? It dropped already?', 'え、ほんとに？もうドロップしたの？', 9],
    ['kind of', 'ちょっと、なんとなく', 'Phrase', 'Basic', "It's kind of spooky in here.", 'ここ、ちょっと不気味だね。', 15],
    ['pull it off', 'うまくやってのける', 'Idiom', 'Natural', 'I really thought we could pull it off.', '本当にうまくいくと思ったのに。', 4],
    ['out of nowhere', 'どこからともなく、突然', 'Idiom', 'Natural', 'That enemy came out of nowhere!', 'あの敵、急に出てきた！', 5],
    ['vibe check', '雰囲気チェック', 'Slang', 'Slang', 'Quick vibe check, how is everyone doing?', 'ちょっと雰囲気チェック、みんな元気？', 3],
    ['figure it out', 'なんとか考える、解決する', 'Phrasal Verb', 'Basic', "Don't worry, we'll figure it out.", '大丈夫、なんとかするから。', 7],
    ['that tracks', 'なるほど、つじつまが合う', 'Phrase', 'Natural', 'Oh, that tracks. That explains the noise.', 'ああ、なるほど。それで音がしてたのか。', 2],
    ['low-key', 'ひそかに、ちょっとだけ', 'Slang', 'Slang', "I'm low-key scared of this part.", 'ここ、ひそかに怖いんだよね。', 6],
    ['run out of', '〜を切らす、なくなる', 'Phrasal Verb', 'Basic', "We're about to run out of potions.", 'もうすぐポーションが切れそう。', 5],
    ['on purpose', 'わざと', 'Phrase', 'Basic', "I didn't do that on purpose, I swear!", 'わざとじゃないってば！', 6],
    ['big brain', '頭いい、天才的', 'Slang', 'Slang', 'Big brain move, chat. Watch this.', '天才的な一手だよ、見てて。', 4],
    ['as if', 'まさか、ありえない', 'Reaction', 'Natural', 'As if I would fall for that trap.', 'あんな罠に引っかかるわけないでしょ。', 3],
    ['get the hang of', 'こつをつかむ', 'Idiom', 'Natural', "I'm finally getting the hang of this.", 'やっとこつがつかめてきた。', 3],
    ['in a sec', 'すぐに', 'Phrase', 'Basic', "I'll read the chat in a sec.", 'すぐコメント読むね。', 8],
    ['go ahead', 'どうぞ、先にやって', 'Phrasal Verb', 'Basic', 'Go ahead, open it.', 'どうぞ、開けて。', 7],
    ['what the heck', 'なんなの、いったい', 'Reaction', 'Natural', 'What the heck was that sound?', '今の音いったい何？', 9],
    ['catch up', '追いつく', 'Phrasal Verb', 'Basic', 'Let me catch up on the chat first.', '先にコメントに追いつかせて。', 5],
    ['so close', 'あとちょっとだった', 'Reaction', 'Basic', 'So close! One more try.', 'あとちょっと！もう1回。', 10],
    ['bet', 'いいよ、了解', 'Slang', 'Slang', 'Bet, I will try it your way.', 'いいよ、君のやり方でやってみる。', 4],
    ['fair enough', 'まあ、そうだね', 'Phrase', 'Natural', 'Fair enough, I did miss that one.', 'まあ確かに、あれは外したね。', 5],
    ['take a break', 'ひと休みする', 'Phrase', 'Basic', "Let's take a break after this round.", 'このラウンドが終わったら休憩しよう。', 6]
  ];
  EXTRA.forEach(function (e, i) {
    var start = 100 + i * 37;
    var due = i % 3 === 0;
    dbVocab.push({
      id: 'v_demo_x' + i,
      videoId: i % 4 === 0 ? 'dQw4w9WgXcQ' : 'M7lc1UVf-VE',
      streamTitle: i % 4 === 0 ? '[DEMO] Guest Creator Talk' : '[DEMO] saba Late Night Chat & Cozy Gaming',
      streamDate: i % 4 === 0 ? '2026-11-12' : '2026-11-18',
      channelName: i % 4 === 0 ? 'guest' : 'saba',
      audioFile: 'v_demo_x' + i + '_' + (start * 10) + '_' + (start * 10 + 45) + '.mp3',
      expression: e[0], meaningJa: e[1], category: e[2], level: e[3],
      register: e[3] === 'Slang' ? 'Internet-Only' : 'Casual',
      readingHint: '', paraphraseBasicEn: '', nuanceJa: '',
      quoteEn: e[4], quoteJa: e[5], extraExampleEn: '', extraExampleJa: '',
      startSec: start, endSec: start + 4.5,
      favorite: i % 7 === 0,
      status: i < 6 ? 'learning' : (i % 5 === 0 ? 'mastered' : 'new'),
      ease: i % 6 === 0 ? 1.9 : 2.5, intervalDays: i < 6 ? 2 : 0, reps: i < 6 ? 2 : 0, lapses: i % 6 === 0 ? 2 : 0,
      nextReviewAt: due ? new Date(Date.now() - 7200000).toISOString() : new Date(Date.now() + 86400000 * (1 + i % 4)).toISOString(),
      lastReviewedAt: '', createdAt: nowIso, source: 'demo', seenCount: e[6]
    });
  });

  var dbPassages = [
    {
      id: 'p_demo_1',
      videoId: 'M7lc1UVf-VE',
      streamTitle: '[DEMO] saba Late Night Chat & Cozy Gaming',
      streamDate: '2026-11-18',
      channelName: 'saba',
      audioFile: 'p_M7lc1UVf-VE_120.mp3',
      titleJa: 'ボス戦直前に早口で作戦を立てる場面',
      startSec: 12,
      endSec: 34,
      scriptEn: "Wait chat, hold on—I think we are totally cooked if I mess up this jump. Give me a second to figure out the pattern, alright? Stop distracting me, I gotta lock in right now!",
      chunkedScript: "Wait chat, / hold_on— / I think we_are totally cooked / if_I mess_up this jump. / Give_me a second / to figure_out the pattern, / alright? / Stop distracting me, / I gotta_lock_in / right_now!",
      scriptJa: '待ってみんな、ちょっと止まって——このジャンプ失敗したらマジで詰む。パターン理解する時間ちょっとちょうだい、いい？気を散らさないで、今すぐ本気モードに入らなきゃ！',
      speakingTipsJa: '「hold_on」「figure_out」「gotta_lock_in」は一気に繋げて発音するとsabaっぽいテンポになります。',
      keyWords: "I'm cooked, hold on, lock in",
      practiceCount: 3,
      bestSpeed: 0.85,
      favorite: true,
      createdAt: nowIso
    },
    {
      id: 'p_demo_2',
      videoId: 'M7lc1UVf-VE',
      streamTitle: '[DEMO] saba Cozy Archive',
      streamDate: '2026-11-15',
      channelName: 'saba',
      audioFile: 'p_M7lc1UVf-VE_500.mp3',
      titleJa: '配信中のハプニングに大爆笑してツッコむ場面',
      startSec: 50,
      endSec: 72,
      scriptEn: "No way! Did that actually just happen on stream? I cannot believe my eyes right now—chat, clip that immediately before I pretend it never happened!",
      chunkedScript: "No way! / Did_that actually just happen / on_stream? / I cannot believe / my eyes right_now— / chat, / clip_that immediately / before_I pretend / it never happened!",
      scriptJa: 'うそでしょ！今ほんとに配信中にそれ起きたの！？自分の目が信じられないんだけど——みんな、なかったことにする前に今すぐ切り抜いて！',
      speakingTipsJa: '冒頭の「No way!」は高めに上げて一気に驚きのテンションを乗せると自然なリズムで繋がります。',
      keyWords: 'no way, actually, pretend',
      practiceCount: 5,
      bestSpeed: 1.0,
      favorite: false,
      createdAt: nowIso
    }
  ];

  var dbStreams = [
    {
      videoId: 'M7lc1UVf-VE',
      title: '[DEMO] saba Late Night Chat & Cozy Gaming',
      publishedAt: '2026-11-18',
      url: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
      durationSec: 5400,
      status: 'done',
      extractMode: 'prebuilt_seed',
      chunksTotal: 3,
      chunksDone: 3,
      itemsAdded: 4,
      lastError: '',
      updatedAt: nowIso,
      channelName: 'saba'
    },
    {
      videoId: 'dQw4w9WgXcQ',
      title: '[DEMO] Guest Creator Talk',
      publishedAt: '2026-11-12',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      durationSec: 3200,
      status: 'done',
      extractMode: 'prebuilt_seed',
      chunksTotal: 2,
      chunksDone: 2,
      itemsAdded: 1,
      lastError: '',
      updatedAt: nowIso,
      channelName: 'guest'
    }
  ];

  var dbSettings = {
    channelHandle: '@SamekoSaba',
    channelId: 'UC_DEMO_PREVIEW_ID_000001',
    defaultCreatorName: 'saba',
    audioFolderName: 'SabaAudioClips',
    geminiModel: 'gemini-3.5-flash-lite',
    difficultyProfile: 'saba_dictionary_full',
    maxItemsPerChunk: '25',
    maxPassagesPerChunk: '2',
    chunkMinutes: '6',
    clipPadBeforeSec: '1.0',
    clipPadAfterSec: '1.5',
    autoSyncEnabled: 'TRUE',
    dailyReviewGoal: '25'
  };

  var todayReviewed = 7;
  var triggerEnabled = true;

  function computeStats() {
    var due = 0, mastered = 0, learning = 0, nw = 0, weak = 0;
    var byLevel = { Basic: 0, Natural: 0, Slang: 0 };
    dbVocab.forEach(function (c) {
      if (c.status === 'mastered') mastered++;
      else if (c.status === 'learning') learning++;
      else nw++;
      if (!c.nextReviewAt || new Date(c.nextReviewAt).getTime() <= Date.now()) due++;
      if ((c.lapses || 0) >= 2 || (c.ease || 2.5) <= 2.0) weak++;
      if (byLevel[c.level] !== undefined) byLevel[c.level]++;
    });
    var goal = Number(dbSettings.dailyReviewGoal) || 20;
    return {
      counts: { total: dbVocab.length, dueCount: due, masteredCount: mastered, learningCount: learning, newCount: nw, weakCount: weak },
      byLevel: byLevel,
      streakDays: 5,
      todayReviewed: todayReviewed,
      dailyGoal: goal,
      goalProgressPct: Math.min(100, Math.round((todayReviewed / goal) * 100)),
      recent7Days: [
        { date: '2026-11-15', label: '11/15', count: 14 },
        { date: '2026-11-16', label: '11/16', count: 22 },
        { date: '2026-11-17', label: '11/17', count: 18 },
        { date: '2026-11-18', label: '11/18', count: 25 },
        { date: '2026-11-19', label: '11/19', count: 11 },
        { date: '2026-11-20', label: '11/20', count: 20 },
        { date: '2026-11-21', label: '11/21', count: todayReviewed }
      ]
    };
  }

  window.__LOCAL_MOCK_GAS__ = {
    apiGetBootstrapData: function () {
      return {
        ok: true,
        data: {
          vocab: dbVocab.slice(),
          passages: dbPassages.slice(),
          streams: dbStreams.slice(),
          stats: computeStats(),
          settings: Object.assign({}, dbSettings),
          apiKeyStatus: { configured: true, masked: 'AQ.A••••••••Demo' },
          triggerStatus: { enabled: triggerEnabled },
          audioFolderStatus: {
            ready: true,
            folderName: 'SabaAudioClips',
            folderId: 'mock_folder_id',
            message: '音声フォルダ連携済み（デモ音声モード）'
          },
          seedSummary: {
            available: true,
            streamCount: 2,
            vocabCount: dbVocab.length,
            passageCount: dbPassages.length
          }
        }
      };
    },
    apiGetAudioClipsBatch: function (audioFiles) {
      var list = Array.isArray(audioFiles) ? audioFiles : [audioFiles];
      var clips = {};
      list.forEach(function (name) {
        if (name) clips[name] = demoAudioB64;
      });
      return {
        ok: true,
        data: {
          folderReady: true,
          clips: clips
        }
      };
    },
    apiListAudioInventory: function () {
      var fileMap = {};
      dbVocab.forEach(function (v) { if (v.audioFile) fileMap[v.audioFile] = 'mock_id_' + v.id; });
      dbPassages.forEach(function (p) { if (p.audioFile) fileMap[p.audioFile] = 'mock_id_' + p.id; });
      return {
        ok: true,
        data: {
          folderReady: true,
          folderName: 'SabaAudioClips',
          totalFiles: Object.keys(fileMap).length,
          fileMap: fileMap,
          packs: []
        }
      };
    },
    apiGetAudioClipsByIds: function (items) {
      var clips = {};
      var list = Array.isArray(items) ? items : [];
      list.forEach(function (it) { if (it && it.name) clips[it.name] = demoAudioB64; });
      return {
        ok: true,
        data: {
          folderReady: true,
          clips: clips,
          fetchedCount: Object.keys(clips).length,
          deferred: []
        }
      };
    },
    apiDeduplicateVocab: function () {
      return {
        ok: true,
        data: {
          dedup: { beforeCount: dbVocab.length, afterCount: dbVocab.length, removedCount: 0 },
          vocab: dbVocab.slice(),
          stats: computeStats()
        }
      };
    },
    apiImportPrebuiltSeed: function () {
      return {
        ok: true,
        data: {
          importResult: { streamsProcessed: 2, vocabAdded: 0, vocabUpdated: 2, dedupRemoved: 0, passagesAdded: 0 },
          vocab: dbVocab.slice(),
          passages: dbPassages.slice(),
          streams: dbStreams.slice(),
          stats: computeStats(),
          audioFolderStatus: { found: true, folderName: 'SabaAudioClips', message: '接続OK' }
        }
      };
    },
    apiRecordPassagePractice: function (id, spd) {
      var p = dbPassages.find(function (x) { return x.id === id; });
      if (!p) return { ok: false, error: 'not found' };
      p.practiceCount = (p.practiceCount || 0) + 1;
      p.bestSpeed = Math.max(p.bestSpeed || 0, Number(spd) || 1.0);
      return { ok: true, data: { passage: Object.assign({}, p) } };
    },
    apiUpdatePassageClip: function (id, startSec, endSec) {
      var p = dbPassages.find(function (x) { return x.id === id; });
      if (!p) return { ok: false, error: 'not found' };
      p.startSec = Number(startSec);
      p.endSec = Number(endSec);
      return { ok: true, data: { passage: Object.assign({}, p) } };
    },
    apiTogglePassageFavorite: function (id, fav) {
      var p = dbPassages.find(function (x) { return x.id === id; });
      if (!p) return { ok: false, error: 'not found' };
      p.favorite = Boolean(fav);
      return { ok: true, data: { passage: Object.assign({}, p) } };
    },
    apiAddManualPassage: function (input) {
      var p = {
        id: 'p_man_' + Date.now(),
        videoId: 'M7lc1UVf-VE',
        streamTitle: 'Manual Passage',
        streamDate: '2026-11-21',
        channelName: dbSettings.defaultCreatorName || 'saba',
        audioFile: '',
        titleJa: input.titleJa || '手動長文区間',
        startSec: Number(input.startSec) || 10,
        endSec: Number(input.endSec) || 30,
        scriptEn: input.scriptEn,
        chunkedScript: input.scriptEn,
        scriptJa: input.scriptJa || '',
        speakingTipsJa: '',
        keyWords: '',
        practiceCount: 0,
        bestSpeed: 0,
        favorite: false,
        createdAt: new Date().toISOString()
      };
      dbPassages.unshift(p);
      return { ok: true, data: { passage: p } };
    },
    apiDeletePassage: function (id) {
      dbPassages = dbPassages.filter(function (x) { return x.id !== id; });
      return { ok: true, data: { deletedId: id } };
    },
    apiReviewCard: function (id, rating) {
      var c = dbVocab.find(function (x) { return x.id === id; });
      if (!c) return { ok: false, error: 'not found' };
      todayReviewed++;
      if (rating === 'again') c.lapses = (c.lapses || 0) + 1;
      c.reps = rating === 'again' ? 0 : (c.reps + 1);
      c.intervalDays = rating === 'again' ? 0 : (rating === 'easy' ? 7 : 4);
      c.status = c.intervalDays >= 21 ? 'mastered' : 'learning';
      c.lastReviewedAt = new Date().toISOString();
      c.nextReviewAt = new Date(Date.now() + (rating === 'again' ? 600000 : c.intervalDays * 86400000)).toISOString();
      return { ok: true, data: { card: Object.assign({}, c), stats: computeStats() } };
    },
    apiToggleFavorite: function (id, fav) {
      var c = dbVocab.find(function (x) { return x.id === id; });
      if (!c) return { ok: false, error: 'not found' };
      c.favorite = Boolean(fav);
      return { ok: true, data: { card: Object.assign({}, c) } };
    },
    apiUpdateCardClip: function (id, startSec, endSec) {
      var c = dbVocab.find(function (x) { return x.id === id; });
      if (!c) return { ok: false, error: 'not found' };
      c.startSec = Number(startSec);
      c.endSec = Number(endSec);
      return { ok: true, data: { card: Object.assign({}, c) } };
    },
    apiUpdateCardFields: function (id, patch) {
      var c = dbVocab.find(function (x) { return x.id === id; });
      if (!c) return { ok: false, error: 'not found' };
      Object.assign(c, patch);
      return { ok: true, data: { card: Object.assign({}, c) } };
    },
    apiDeleteCard: function (id) {
      dbVocab = dbVocab.filter(function (x) { return x.id !== id; });
      return { ok: true, data: { deletedId: id, stats: computeStats() } };
    },
    apiAddManualCard: function (input) {
      var card = {
        id: 'v_man_' + Date.now(),
        videoId: 'M7lc1UVf-VE',
        streamTitle: 'Manual Clip',
        streamDate: '2026-11-21',
        channelName: input.channelName || dbSettings.defaultCreatorName || 'saba',
        audioFile: '',
        expression: input.expression,
        readingHint: '',
        category: input.category || 'Phrase',
        level: input.level || 'Natural',
        register: 'Casual',
        paraphraseBasicEn: '',
        meaningJa: input.meaningJa,
        nuanceJa: input.nuanceJa || '',
        quoteEn: input.quoteEn || '',
        quoteJa: '',
        extraExampleEn: '',
        extraExampleJa: '',
        startSec: Number(input.startSec) || 10,
        endSec: Number(input.endSec) || 15,
        favorite: false,
        status: 'new',
        ease: 2.5,
        intervalDays: 0,
        reps: 0,
        lapses: 0,
        nextReviewAt: new Date().toISOString(),
        lastReviewedAt: '',
        createdAt: new Date().toISOString(),
        source: 'manual',
        seenCount: 1
      };
      dbVocab.unshift(card);
      return { ok: true, data: { card: card, stats: computeStats() } };
    },
    apiExtractStream: function (url) {
      var card = {
        id: 'v_ex_' + Date.now(),
        videoId: 'M7lc1UVf-VE',
        streamTitle: '[DEMO] Extracted Stream',
        streamDate: '2026-11-21',
        channelName: 'saba',
        audioFile: 'v_M7lc1UVf-VE_120.mp3',
        expression: 'by the way',
        readingHint: 'バイ・ザ・ウェイ',
        category: 'Phrase',
        level: 'Basic',
        register: 'Everyday',
        paraphraseBasicEn: 'incidentally / changing the topic',
        meaningJa: 'ところで、そういえば',
        nuanceJa: '話題を自然に切り替えるときの定番表現。',
        quoteEn: 'Oh, by the way, did you guys see the new update?',
        quoteJa: 'あ、そういえば、みんな新しいアプデ見た？',
        extraExampleEn: 'By the way, what time does it start?',
        extraExampleJa: 'ところで、何時から始まるの？',
        startSec: 40,
        endSec: 45,
        favorite: false,
        status: 'new',
        ease: 2.5,
        intervalDays: 0,
        reps: 0,
        lapses: 0,
        nextReviewAt: new Date().toISOString(),
        lastReviewedAt: '',
        createdAt: new Date().toISOString(),
        source: 'auto_caption',
        seenCount: 5
      };
      dbVocab.unshift(card);
      return {
        ok: true,
        data: {
          extraction: { addedCount: 1, chunksDone: 1, chunksTotal: 1, hasMoreChunks: false },
          vocab: dbVocab.slice(),
          streams: dbStreams.slice(),
          stats: computeStats()
        }
      };
    },
    apiIngestCaptionFile: function () {
      return window.__LOCAL_MOCK_GAS__.apiExtractStream('M7lc1UVf-VE');
    },
    apiCheckChannelRss: function () {
      return {
        ok: true,
        data: {
          sync: { newlyQueuedCount: 1, extractionResult: null },
          vocab: dbVocab.slice(),
          streams: dbStreams.slice(),
          stats: computeStats(),
          settings: Object.assign({}, dbSettings)
        }
      };
    },
    apiSaveSettings: function (patch) {
      Object.assign(dbSettings, patch || {});
      return {
        ok: true,
        data: {
          settings: Object.assign({}, dbSettings),
          apiKeyStatus: { configured: true, masked: 'AQ.A••••••••Demo' },
          stats: computeStats()
        }
      };
    },
    apiToggleDailyTrigger: function (enabled) {
      triggerEnabled = Boolean(enabled);
      return { ok: true, data: { triggerStatus: { enabled: triggerEnabled } } };
    }
  };
})();
