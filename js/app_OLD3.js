/**
 * app.js - 禪意念佛計數器主控腳本
 */

const CONFIG = {
  count: 0,                   // 初始累計次數
  target: 1080,               // 預設目標次數 (0 代表無限)
  dedicationText: "",         // 預設迴向文內容

  // 🌸 預設 3 組持誦組合包
  presets: [
    { title: "南無阿彌陀佛", target: 1080, count: 0 },
    { title: "南無觀世音菩薩", target: 1080, count: 0 },
    { title: "大悲咒", target: 21, count: 0 }
  ],
  activePresetIndex: 0,       // 當前啟用的組合包索引 (0, 1, 2)

  soundEnabled: true,         // 是否啟用木魚聲
  chimeEnabled: true,         // 是否啟用圓滿提示聲
  vibrateEnabled: true,       // 是否啟用觸覺震動
  confirmReset: true,         // 清空時彈出確認方塊
  streakThreshold: 21,        // 連續持誦天數門檻 (預設 21 次)

  // 📊 全域歷史紀錄
  history: {
    todayCount: 0,
    monthCount: 0,
    lastMonthCount: 0,        // 上月總次數
    streakDays: 0,
    lastActiveDate: "",       // YYYY-MM-DD
    lastMonth: "",            // YYYY-MM
    lastValidDate: "",        // 上次達標持誦日期 YYYY-MM-DD
    lastValidCount: 0         // 上次達標持誦次數
  },

  woodblockFreq: 220,         
  woodblockDuration: 0.12,    
  goalChimeFreq: 880,         

  // 觸覺震動設定 (單位: 毫秒)
  // vibeTapPattern: [80] 保持厚實有份量的重震手感
  vibeTapPattern: [80],
  
  // vibeGoalPattern: 圓滿重震自然遞減 [強撞擊 250ms -> 停 80ms -> 中共鳴 140ms -> 停 100ms -> 輕尾震 60ms]
  vibeGoalPattern: [250, 80, 140, 100, 60] 
};

// ---------------------------------------------------------------------------
// 📜 離線經典佛偈庫與農曆佛誕計算模組
// ---------------------------------------------------------------------------
const BUDDHIST_QUOTES = [
  "身如菩提樹，心如明鏡臺，時時勤拂拭，勿使惹塵埃。",
  "菩提本無樹，明鏡亦非臺，本來無一物，何處惹塵埃。",
  "一切有為法，如夢幻泡影，如露亦如電，應作如是觀。",
  "由愛故生憂，由愛故生怖，若離於愛者，無憂亦無怖。",
  "凡所有相，皆是虛妄。若見諸相非相，則見如來。",
  "若以色見我，以音聲求我，是人行邪道，不能見如來。",
  "過去心不可得，現在心不可得，未來心不可得。",
  "應無所住而生其心。",
  "狂心頓歇，歇即菩提。",
  "念佛一聲，罪滅河沙；禮佛一拜，福增無量。",
  "觀自在菩薩，行深般若波羅蜜多時，照見五蘊皆空，度一切苦厄。",
  "色不異空，空不異色，色即是空，空即是色。",
  "大慈大悲愍眾生，大喜大捨濟含識。",
  "心如工畫師，能畫諸世間，五蘊悉從生，無法而不造。"
];

// 核心農曆對照與佛教節日資料庫 (農曆月日 -> 節日名稱)
const BUDDHIST_FESTIVALS = {
  "1-1": "彌勒菩薩聖誕",
  "1-15": "上元天官聖誕 · 朔望齋日",
  "2-8": "釋迦牟尼佛出家紀念日",
  "2-15": "釋迦牟尼佛涅槃紀念日",
  "2-19": "觀世音菩薩聖誕",
  "2-21": "普賢菩薩聖誕",
  "3-16": "準提菩薩聖誕",
  "4-4": "文殊菩薩聖誕",
  "4-8": "釋迦牟尼佛誕辰（浴佛節）",
  "4-28": "藥王菩薩聖誕",
  "5-13": "伽藍菩薩聖誕",
  "6-3": "韋驮菩薩聖誕",
  "6-19": "觀世音菩薩成道紀念日",
  "7-13": "大勢至菩薩聖誕",
  "7-15": "佛歡喜日 · 盂蘭盆節",
  "7-30": "地藏王菩薩聖誕",
  "8-15": "月光菩薩聖誕 · 朔望齋日",
  "9-19": "觀世音菩薩出家紀念日",
  "9-30": "藥師琉璃光如來聖誕",
  "10-5": "達摩祖師聖誕",
  "11-17": "阿彌陀佛聖誕",
  "12-8": "釋迦牟尼佛成道日（臘八節）",
  "12-29": "華嚴菩薩聖誕"
};

/**
 * 輕量級純前端農曆計算器 (適用於離線計算)
 */
function getLunarDateInfo(date) {
  const t = new Date(date);
  const year = t.getFullYear();
  const month = t.getMonth() + 1;
  const day = t.getDate();

  // 天干地支
  const tianGan = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const diZhi = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const shengXiao = ["鼠", "牛", "虎", "兔", "龍", "蛇", "馬", "羊", "猴", "雞", "狗", "豬"];
  const lunarMonths = ["正", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "臘"];
  const lunarDays = [
    "初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十",
    "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
    "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十"
  ];

  try {
    const formatter = new Intl.DateTimeFormat('en-US-u-ca-chinese', {
      day: 'numeric',
      month: 'numeric'
    });
    const parts = formatter.formatToParts(t);
    let lMonth = 1, lDay = 1;
    for (const part of parts) {
      if (part.type === 'month') lMonth = parseInt(part.value, 10) || 1;
      if (part.type === 'day') lDay = parseInt(part.value, 10) || 1;
    }

    const ganZhiYear = tianGan[(year - 4) % 10] + diZhi[(year - 4) % 12];
    const shengXiaoName = shengXiao[(year - 4) % 12];
    const monthName = lunarMonths[(lMonth - 1) % 12] || "正";
    const dayName = lunarDays[(lDay - 1) % 30] || "初一";

    // 🌸 判斷是否為「地藏十齋日」（兼顧大月 30 天與小月 29 天順延規則）
    let isTenFastDay = false;

    // 1. 無論大月或小月，這 9 天均為固定齋日
    if ([1, 8, 14, 15, 18, 23, 24, 28, 29].includes(lDay)) {
      isTenFastDay = true;
    } else if (lDay === 30) {
      // 2. 若當月有三十（大月），三十為齋日
      isTenFastDay = true;
    } else if (lDay === 27) {
      // 3. 若為廿七，檢查 3 天後是否已跨入下一農曆月（即判定當月是否為 29 天的小月）
      const testDate = new Date(t);
      testDate.setDate(testDate.getDate() + 3);
      const futureParts = formatter.formatToParts(testDate);
      let fMonth = lMonth;
      for (const part of futureParts) {
        if (part.type === 'month') fMonth = parseInt(part.value, 10) || 1;
      }
      if (fMonth !== lMonth) {
        isTenFastDay = true; // 確定為小月，廿七自動向前遞補為齋日
      }
    }

    const key = `${lMonth}-${lDay}`;
    let eventName = BUDDHIST_FESTIVALS[key] || "";

    if (!eventName) {
      if (isTenFastDay) {
        eventName = "十齋日 · 宜戒殺持齋 · 靜心念佛";
      } else {
        eventName = "今日無特殊佛誕 · 靜心持誦";
      }
    } else {
      if (isTenFastDay && !eventName.includes("齋日")) {
        eventName += " · 十齋日";
      }
    }

    return {
      solarStr: `${year}年${month}月${day}日`,
      lunarStr: `${ganZhiYear}年 (${shengXiaoName}年) ${monthName}月${dayName}`,
      eventStr: eventName
    };
  } catch (e) {
    return {
      solarStr: `${year}年${month}月${day}日`,
      lunarStr: `農曆節日`,
      eventStr: "靜心持誦 · 勤修戒定慧"
    };
  }
}

/**
 * 🌸 計算「上次持誦」相對時間顯示字串 (限制 7 天內，超過顯示「無近期紀錄」)
 */
function formatLastValidDisplay(lastValidDateStr, lastValidCount) {
  if (!lastValidDateStr || !lastValidCount) {
    return "無近期紀錄";
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const parts = lastValidDateStr.split('-');
  if (parts.length !== 3) return "無近期紀錄";
  
  const validDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));

  const diffMs = today.getTime() - validDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return "無近期紀錄";
  } else if (diffDays === 1) {
    return `昨天 (${lastValidCount}次)`;
  } else if (diffDays <= 7) {
    return `${diffDays} 天前 (${lastValidCount}次)`;
  } else {
    return "無近期紀錄";
  }
}

document.addEventListener('DOMContentLoaded', () => {
  let appState = StorageModule.loadData(CONFIG);

  // 🛡️ 舊資料向下相容升級處理 (轉化為 presets 結構，補全 count 屬性)
  if (!Array.isArray(appState.presets) || appState.presets.length < 3) {
    appState.presets = [
      { title: "南無阿彌陀佛", target: 1080, count: appState.count || 0 },
      { title: "南無觀世音菩薩", target: 1080, count: 0 },
      { title: "大悲咒", target: 21, count: 0 }
    ];
  } else {
    appState.presets.forEach(p => {
      if (typeof p.count !== 'number') p.count = 0;
    });
  }

  if (typeof appState.activePresetIndex !== 'number' || appState.activePresetIndex < 0 || appState.activePresetIndex > 2) {
    appState.activePresetIndex = 0;
  }

  // 🛡️ 歷史紀錄資料補全 (向下相容新增的欄位)
  if (!appState.history) {
    appState.history = { todayCount: 0, monthCount: 0, lastMonthCount: 0, streakDays: 0, lastActiveDate: "", lastMonth: "", lastValidDate: "", lastValidCount: 0 };
  }
  if (typeof appState.history.lastMonthCount !== 'number') appState.history.lastMonthCount = 0;
  if (typeof appState.history.lastValidDate !== 'string') appState.history.lastValidDate = "";
  if (typeof appState.history.lastValidCount !== 'number') appState.history.lastValidCount = 0;

  if (typeof appState.confirmReset !== 'boolean') appState.confirmReset = true;
  if (typeof appState.streakThreshold !== 'number') appState.streakThreshold = 21;
  if (typeof appState.dedicationText !== 'string') appState.dedicationText = "";

  // 獲取 DOM 元素
  const touchZone = document.getElementById('touch-zone');
  const counterValue = document.getElementById('counter-value');
  const targetDisplay = document.getElementById('target-display');
  const btnTarget = document.getElementById('btn-target');

  // 🌸 持誦聖號 DOM 元素
  const mantraTitleDisplay = document.getElementById('mantra-title-display');
  
  const btnRecords = document.getElementById('btn-records');
  const btnSettings = document.getElementById('btn-settings');
  const btnToggleEye = document.getElementById('btn-toggle-eye');
  
  // 🌸 蓮花迴向文與底部心燈 DOM 元素
  const btnDedication = document.getElementById('btn-dedication');
  const dedicationDialog = document.getElementById('dedication-dialog');
  const dedicationText = document.getElementById('dedication-text');
  const btnSaveDedication = document.getElementById('btn-save-dedication');
  const btnCloseDedication = document.getElementById('btn-close-dedication');
  const btnLamp = document.getElementById('btn-lamp');

  let initialDedicationText = ""; // 🌸 快照：紀錄迴向文開啟時的原文字

  // 🌸 兩層式目標管理 Modal 元素
  const targetDialog = document.getElementById('target-dialog');
  const targetLayer1 = document.getElementById('target-layer-1');
  const targetLayer2 = document.getElementById('target-layer-2');
  const btnCloseTargetDialog = document.getElementById('btn-close-target-dialog');
  const btnBackToLayer1 = document.getElementById('btn-back-to-layer1');
  
  const btnSetActivePreset = document.getElementById('btn-set-active-preset');
  const settingTitleSingle = document.getElementById('setting-title-single');
  const settingTargetSingle = document.getElementById('setting-target-single');
  const settingCountSingle = document.getElementById('setting-count-single');
  const btnResetSinglePreset = document.getElementById('btn-reset-single-preset');
  const btnSaveSinglePreset = document.getElementById('btn-save-single-preset');

  let currentEditingIndex = 0; // 當前正在第二層編輯的項目索引 (0, 1, 2)
  let pendingActiveIndex = 0;  // 🌸 暫存準備套用的功課索引 (按儲存後才生效)
  let layer2CloseWatcher = null; // 🌸 第 2 層專屬 CloseWatcher 配額持有人

  // 🌸 未儲存變更二次確認 DOM 元素
  const unsavedDialog = document.getElementById('unsaved-dialog');
  const btnConfirmUnsaved = document.getElementById('btn-confirm-unsaved');
  const btnCancelUnsaved = document.getElementById('btn-cancel-unsaved');

  // 🌸 歷史紀錄 DOM 元素
  const recordsDialog = document.getElementById('records-dialog');
  const recordStreak = document.getElementById('record-streak');
  const recordToday = document.getElementById('record-today');
  const recordLast = document.getElementById('record-last');            // 上次持誦
  const recordMonth = document.getElementById('record-month');          // 今月總次數
  const recordLastMonth = document.getElementById('record-last-month'); // 上月總次數
  const recordThresholdHint = document.getElementById('record-threshold-hint');
  const btnResetHistory = document.getElementById('btn-reset-history');
  const btnCloseRecords = document.getElementById('btn-close-records');

  const settingsDialog = document.getElementById('settings-dialog');
  const settingSound = document.getElementById('setting-sound');
  const settingSoundChime = document.getElementById('setting-sound-chime');
  const settingVibrate = document.getElementById('setting-vibrate');
  const settingConfirmReset = document.getElementById('setting-confirm-reset');
  const settingStreakThreshold = document.getElementById('setting-streak-threshold');
  const btnSaveSettings = document.getElementById('btn-save-settings');

  let initialSettingsSnap = {}; // 🌸 快照：紀錄系統設定開啟時的原始選項

  // 🛡️ 防誤觸門檻 2 位數長度監聽與自動截斷 (留 2 位數緩衝與容錯體驗)
  settingStreakThreshold.addEventListener('input', () => {
    if (settingStreakThreshold.value.length > 2) {
      settingStreakThreshold.value = settingStreakThreshold.value.slice(0, 2);
    }
  });

  const resetDialog = document.getElementById('reset-dialog');
  const resetModalTitle = document.getElementById('reset-modal-title');
  const resetModalMsg = document.getElementById('reset-modal-msg');
  const btnConfirmReset = document.getElementById('btn-confirm-reset');
  const btnCancelReset = document.getElementById('btn-cancel-reset');
  let resetActionType = "card"; // 'card', 'history'
  let pendingResetIndex = -1;
  
  const goalDialog = document.getElementById('goal-dialog');
  const goalMessage = document.getElementById('goal-message');
  const btnCompleteDone = document.getElementById('btn-complete-done');
  const btnBackToChant = document.getElementById('btn-back-to-chant');

  // 🌸 歡迎畫面與退出卡片 DOM 元素
  const welcomeOverlay = document.getElementById('welcome-overlay');
  const welcomeSolarDate = document.getElementById('welcome-solar-date');
  const welcomeLunarDate = document.getElementById('welcome-lunar-date');
  const welcomeBuddhistEvent = document.getElementById('welcome-buddhist-event');
  const welcomeQuote = document.getElementById('welcome-quote');

  const exitCard = document.getElementById('exit-card');
  const btnContinueApp = document.getElementById('btn-continue-app');
  const btnLeaveApp = document.getElementById('btn-leave-app');

  // 切換減光 / 正常光度
  function setDimmedMode(enableDim) {
    if (enableDim) {
      document.body.classList.add('is-dimmed');
      btnToggleEye.textContent = '🙈';
    } else {
      document.body.classList.remove('is-dimmed');
      btnToggleEye.textContent = '👁';
    }
  }

  function updateUI() {
    // 取得當前生效的組合包
    const currentPreset = appState.presets[appState.activePresetIndex] || CONFIG.presets[0];
    appState.target = currentPreset.target; // 同步目前生效目標數字
    appState.count = currentPreset.count || 0; // 同步目前生效已完成次數

    counterValue.textContent = appState.count;

    if (appState.target === 0) {
      targetDisplay.textContent = '∞';
    } else {
      targetDisplay.textContent = appState.target;
    }

    // 🌸 更新持誦名稱與動態字間距 (11 字以上自動收緊)
    const currentTitle = currentPreset.title || '南無阿彌陀佛';
    mantraTitleDisplay.textContent = currentTitle;
    mantraTitleDisplay.classList.toggle('is-long-title', currentTitle.length >= 11);

    // 🌸 更新歷史紀錄彈窗資料 (數據數字發光，單位「次」回歸沉靜正文灰)
    if (recordStreak) recordStreak.textContent = `${appState.history.streakDays} 天`;
    if (recordToday) recordToday.textContent = appState.history.todayCount;
    if (recordLast) recordLast.textContent = formatLastValidDisplay(appState.history.lastValidDate, appState.history.lastValidCount);
    if (recordMonth) recordMonth.textContent = appState.history.monthCount;
    if (recordLastMonth) recordLastMonth.textContent = appState.history.lastMonthCount || 0;
    if (recordThresholdHint) recordThresholdHint.textContent = `(每日門檻：滿 ${appState.streakThreshold} 次)`;
  }

  // 日期自動升級與跨日/跨月結算判定
  function checkDateRollover() {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let isUpdated = false;

    // 🌸 1. 跨月結算：檢查 lastMonth 是否為「緊鄰的上個月」
    if (appState.history.lastMonth !== monthStr) {
      if (appState.history.lastMonth !== "") {
        // 動態推算標準的上個月字串 (YYYY-MM)
        const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

        // 若中間有中斷（隔超過一個月沒開），上月總次數清零；若為連續月份則正常移交
        const isConsecutiveMonth = (appState.history.lastMonth === prevMonthStr);
        appState.history.lastMonthCount = isConsecutiveMonth ? appState.history.monthCount : 0;
      }
      
      appState.history.monthCount = 0;
      appState.history.lastMonth = monthStr;
      isUpdated = true;
    }

    // 🌸 2. 跨日結算：處理「上次持誦」寫入與「連續天數」斷更歸零
    if (appState.history.lastActiveDate !== todayStr) {
      
      if (appState.history.lastActiveDate !== "") {
        // 檢查昨日紀錄：若達到門檻，寫入為「上次持誦」
        if (appState.history.todayCount >= appState.streakThreshold) {
          appState.history.lastValidDate = appState.history.lastActiveDate;
          appState.history.lastValidCount = appState.history.todayCount;
        } else {
          // 若昨日未達門檻，連續天數斷開歸零
          appState.history.streakDays = 0;
        }

        // 檢查是否超過 1 天未開啟（例如中斷了 2 天以上）
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        if (appState.history.lastActiveDate !== yesterdayStr) {
          appState.history.streakDays = 0;
        }
      }

      // 重置所有持誦組合包的當日已完成次數，並清空今日總次數
      if (Array.isArray(appState.presets)) {
        appState.presets.forEach(p => p.count = 0);
      }

      appState.history.todayCount = 0;
      appState.history.lastActiveDate = todayStr;
      isUpdated = true;
    }

    if (isUpdated) {
      StorageModule.saveData(appState);
      if (typeof updateUI === 'function') {
        updateUI(); // 確保若用家正看著螢幕跨日，畫面數字能即時更新歸零
      }
    }
  }

  // 午夜精確倒數定時器 (Midnight Timer)
  let midnightTimer = null;
  function scheduleMidnightReset() {
    if (midnightTimer) clearTimeout(midnightTimer);

    const now = new Date();
    // 計算下一個 00:00:01 的時間點（多預留 1 秒確保跨日時間完全成立）
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0, 0, 1
    );
    const msToMidnight = nextMidnight.getTime() - now.getTime();

    midnightTimer = setTimeout(() => {
      checkDateRollover();
      scheduleMidnightReset(); // 自動排程下一天的午夜倒數
    }, msToMidnight);
  }

  // 監聽前景喚醒事件 (Foreground Wakeup Check)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkDateRollover();
      scheduleMidnightReset(); // 解鎖畫面時重新校正午夜定時器
    }
  });

  checkDateRollover();
  scheduleMidnightReset();

  // 初始化歡迎畫面日期與每日佛偈
  const today = new Date();
  const dateInfo = getLunarDateInfo(today);
  welcomeSolarDate.textContent = dateInfo.solarStr;
  welcomeLunarDate.textContent = dateInfo.lunarStr;
  welcomeBuddhistEvent.textContent = dateInfo.eventStr;

  // 根據一年中的天數輪播經典佛偈
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const diff = today - startOfYear;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const selectedQuote = BUDDHIST_QUOTES[dayOfYear % BUDDHIST_QUOTES.length];
  welcomeQuote.textContent = `「${selectedQuote}」`;

  // --------------------------------------------------------------------------
  // 📱 PWA 返回鍵與歷史堆疊（History Stack）0、1、2 狀態模型
  // --------------------------------------------------------------------------
  
  // 追蹤當前狀態：剛打開 App 時為 State 1（未有任何點擊，history.length = 1）
  let currentState = 1;

  function showExitPromptUI() {
    exitCard.classList.remove('is-hidden');
  }

  function hideExitPromptUI() {
    exitCard.classList.add('is-hidden');
  }

  // State 1 -> State 2 提升狀態的核心邏輯
  function elevateToState2() {
    if (currentState === 1) {
      welcomeOverlay.classList.add('is-hidden');
      history.pushState({ state: 2 }, '');
      currentState = 2;
      hideExitPromptUI();
    }
  }

  // 點擊歡迎頁畫面任意處（含提示框）均升至 State 2
  welcomeOverlay.addEventListener('click', elevateToState2);

  // 分支 A：點擊「繼續持誦」按鈕，升到 State 2 並隱藏提示
  btnContinueApp.addEventListener('click', (e) => {
    e.stopPropagation();
    history.pushState({ state: 2 }, '');
    currentState = 2;
    hideExitPromptUI();
  });

  // 分支 B：點擊「再按一次返回鍵退出」選項，退回 State 0 離開 App
  btnLeaveApp.addEventListener('click', (e) => {
    e.stopPropagation();
    history.back(); // 觸發退至 State 0，瀏覽器原生關閉 / 退出 App
  });

  window.addEventListener('popstate', () => {
    // 若當前有開啟的 Modal，優先處理/關閉 Modal 且補回 State 2 緩衝鎖
    const openDialog = document.querySelector('dialog[open]');
    if (openDialog) {
      openDialog.close();     // 正常關閉 Modal
      history.pushState({ state: 2 }, '');
      currentState = 2;
      return;
    }

    // 按第 1 下返回鍵 (-1)：從 State 2 退回 State 1
    // 自動恢復正常光度以清晰顯示選項，並彈出上下堆疊卡片
    currentState = 1;
    setDimmedMode(false);
    showExitPromptUI();

    if (appState.vibrateEnabled) {
      SoundSynthesizer.vibrate([30]); // 微輕觸覺反饋
    }

    // 若再按第 2 下返回鍵，底層歷史紀錄再次 -1 退到 State 0。
    // 此處不再執行 pushState()，系統判定退無可退，將直接順暢關閉 / 退出 App。
  });

  // 全螢幕盲點擊 (+1 邏輯)
  // 💡 改用 pointerdown：手指剛觸碰螢幕（0ms）即刻發聲與震動，徹底消除抬手延遲
  touchZone.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.top-bar') || e.target.closest('dialog') || e.target.closest('#exit-card') || e.target.closest('.bottom-motif')) {
      return;
    }

    // 🌸 關鍵修正：若處於 State 1（顯示退出提示或歡迎頁），點擊螢幕僅負責「恢復持誦狀態」，不進行 +1 計數
    if (currentState === 1) {
      elevateToState2();
      return;
    }

    // 點擊 +1 自動進入減光模式
    setDimmedMode(true);

    checkDateRollover();

    // 當前輪與全域紀錄累加
    appState.count++;
    appState.presets[appState.activePresetIndex].count = appState.count;
    appState.history.todayCount++;
    appState.history.monthCount++;

    // 🌟 當今日累計首度達到設定門檻（例如 21 次）時，連續天數正式 +1
    if (appState.history.todayCount === appState.streakThreshold) {
      appState.history.streakDays++;
    }

    updateUI();
    StorageModule.saveData(appState);

    counterValue.classList.add('tap-active');
    setTimeout(() => counterValue.classList.remove('tap-active'), 50);

    const isGoal = (appState.target > 0) && (appState.count % appState.target === 0);

    if (isGoal) {
      // 達標：自動恢復正常光度
      setDimmedMode(false);

      if (appState.chimeEnabled) SoundSynthesizer.playChime(appState.goalChimeFreq, 3.5);
      if (appState.vibrateEnabled) {
        SoundSynthesizer.vibrate(CONFIG.vibeGoalPattern);
      }

      goalMessage.textContent = `恭喜圓滿完成 ${appState.count} 次持誦！`;
      
      // 延遲 150ms 開啟彈窗，避免 Modal 獲得焦點時被系統中斷震動
      setTimeout(() => {
        goalDialog.showModal();
      }, 150);

    } else {
      // 平時點擊，播放一般木魚聲與沉重震動 (80ms)
      SoundSynthesizer.playWoodblock(appState);
      if (appState.vibrateEnabled) {
        SoundSynthesizer.vibrate(CONFIG.vibeTapPattern);
      }
    }
  });

  // 眼睛按鈕切換
  btnToggleEye.addEventListener('click', (e) => {
    e.stopPropagation();
    const isCurrentlyDimmed = document.body.classList.contains('is-dimmed');
    setDimmedMode(!isCurrentlyDimmed);
  });

  // 🌸 蓮花按鈕點擊：彈出迴向文視窗 (可編輯模式)
  btnDedication.addEventListener('click', (e) => {
    e.stopPropagation();
    setDimmedMode(false);
    
    initialDedicationText = appState.dedicationText || '';
    dedicationText.value = initialDedicationText;
    
    // 恢復可編輯狀態與預設停用儲存按鈕（暗淡綠）
    dedicationText.readOnly = false;
    btnSaveDedication.disabled = true;

    dedicationDialog.showModal();
  });

  // 🌸 監聽迴向文內容輸入變更，動態切換儲存按鈕狀態
  dedicationText.addEventListener('input', () => {
    if (!dedicationText.readOnly) {
      btnSaveDedication.disabled = (dedicationText.value === initialDedicationText);
    }
  });

  // 🌸 迴向文輸入框防焦點機制：在唯讀模式下點擊不跳出鍵盤與閃爍光標
  dedicationText.addEventListener('focus', () => {
    if (dedicationText.readOnly) {
      dedicationText.blur();
    }
  });

  // 儲存迴向文
  btnSaveDedication.addEventListener('click', () => {
    appState.dedicationText = dedicationText.value;
    StorageModule.saveData(appState);
    dedicationDialog.close();
  });

  // 關閉迴向文彈窗
  btnCloseDedication.addEventListener('click', () => {
    if (dedicationText.value !== initialDedicationText) {
      unsavedDialog.showModal();
    } else {
      dedicationDialog.close();
    }
  });

  // 🌸 迴向文彈窗 cancel 事件 (手機返回鍵/ESC 防護)
  dedicationDialog.addEventListener('cancel', (e) => {
    if (dedicationText.value !== initialDedicationText) {
      e.preventDefault();
      unsavedDialog.showModal();
    }
  });

  // 🪔 底部心燈按鈕點擊：觸發圓滿音效與震動
  btnLamp.addEventListener('click', (e) => {
    e.stopPropagation();
    if (appState.chimeEnabled) {
      SoundSynthesizer.playChime(appState.goalChimeFreq, 3.5);
    }
    if (appState.vibrateEnabled) {
      SoundSynthesizer.vibrate(CONFIG.vibeGoalPattern);
    }
  });

  // --------------------------------------------------------------------------
  // 🎯 兩層式持誦與目標管理 Modal (Layer 1 總覽選取 & Layer 2 單卡編輯)
  // --------------------------------------------------------------------------
  
  // 渲染第一層功課總覽列表 (以暖金光環 `is-active-card` 圈圍選中的功課)
  function renderTargetLayer1Data() {
    for (let i = 0; i < 3; i++) {
      const preset = appState.presets[i] || CONFIG.presets[i];
      document.getElementById(`card-title-display-${i}`).textContent = preset.title;
      document.getElementById(`card-target-display-${i}`).textContent = preset.target === 0 ? '∞' : preset.target;
      document.getElementById(`card-count-display-${i}`).textContent = preset.count || 0;

      const card = document.getElementById(`preset-card-${i}`);
      const isCurrentActive = (i === appState.activePresetIndex);
      
      // 🌟 以暖金光環與深暖暗色將選中的功課圈起來
      card.classList.toggle('is-active-card', isCurrentActive);
      
      const badge = document.getElementById(`active-badge-${i}`);
      if (badge) {
        badge.style.display = isCurrentActive ? 'inline-block' : 'none';
      }
    }
  }

  // 🌸 更新第二層「設為當前持誦功課」按鈕狀態 UI
  function updateLayer2SetActiveBtnUI() {
    const isPendingActive = (currentEditingIndex === pendingActiveIndex);
    if (isPendingActive) {
      if (currentEditingIndex === appState.activePresetIndex) {
        btnSetActivePreset.textContent = '✓ 當前持誦中';
      } else {
        btnSetActivePreset.textContent = '✓ 準備套用中 (儲存後生效)';
      }
      btnSetActivePreset.classList.add('is-already-active');
      btnSetActivePreset.disabled = true;
    } else {
      btnSetActivePreset.textContent = '🪷 設為當前持誦功課';
      btnSetActivePreset.classList.remove('is-already-active');
      btnSetActivePreset.disabled = false;
    }
  }

  // 🌸 動態更新第 2 層儲存按鈕狀態
  function updateLayer2SaveBtnState() {
    btnSaveSinglePreset.disabled = !hasUnsavedLayer2Changes();
  }

  // 開啟第二層單卡詳情編輯
  function openTargetLayer2(idx) {
    currentEditingIndex = idx;
    pendingActiveIndex = appState.activePresetIndex; // 初始化暫存套用索引為當前生效項目
    const preset = appState.presets[idx] || CONFIG.presets[idx];

    settingTitleSingle.value = preset.title;
    settingTargetSingle.value = preset.target;
    settingCountSingle.textContent = preset.count || 0;

    updateLayer2SetActiveBtnUI();
    updateLayer2SaveBtnState(); // 預設無變更，設為停用（暗淡綠）

    targetLayer1.classList.add('is-hidden');
    targetLayer2.classList.remove('is-hidden');

    // 🌸 進入第 2 層：多登記 1 個 CloseWatcher 配額壓入堆疊頂層
    if ('CloseWatcher' in window) {
      if (layer2CloseWatcher) {
        layer2CloseWatcher.destroy();
      }
      layer2CloseWatcher = new CloseWatcher();
      layer2CloseWatcher.onclose = () => {
        handleLayer2BackAction(); // 手機按返回鍵時檢查是否有未儲存變更
      };
    }
  }

  // 🌸 重置第二層輸入框與暫存狀態（還原為原本資料）
  function resetLayer2Fields() {
    const preset = appState.presets[currentEditingIndex] || CONFIG.presets[currentEditingIndex];
    settingTitleSingle.value = preset.title || '';
    settingTargetSingle.value = preset.target || 0;
    pendingActiveIndex = appState.activePresetIndex;
    updateLayer2SetActiveBtnUI();
    updateLayer2SaveBtnState();
  }

  // 🌸 檢查第二層是否有未儲存的變更
  function hasUnsavedLayer2Changes() {
    const preset = appState.presets[currentEditingIndex] || CONFIG.presets[currentEditingIndex];

    let currentTarget = parseInt(settingTargetSingle.value, 10);
    if (isNaN(currentTarget) || currentTarget < 0) currentTarget = 0;

    const titleChanged = (settingTitleSingle.value.trim() !== (preset.title || ''));
    const targetChanged = (currentTarget !== (preset.target || 0));
    const activeChanged = (pendingActiveIndex !== appState.activePresetIndex);

    return titleChanged || targetChanged || activeChanged;
  }

  // 🌸 處理第二層返回第一層動作
  function handleLayer2BackAction() {
    if (hasUnsavedLayer2Changes()) {
      unsavedDialog.showModal();
    } else {
      returnToTargetLayer1();
    }
  }

  // 返回第一層總覽列表
  function returnToTargetLayer1() {
    // 🌸 若使用者點擊畫面的「＜ 返回」或「儲存並返回」按鈕，主動銷毀 Watcher #2 釋放配額
    if (layer2CloseWatcher) {
      layer2CloseWatcher.destroy();
      layer2CloseWatcher = null;
    }

    targetLayer2.classList.add('is-hidden');
    targetLayer1.classList.remove('is-hidden');
    renderTargetLayer1Data();
  }

  // 開啟目標管理 Modal
  btnTarget.addEventListener('click', (e) => {
    e.stopPropagation();
    setDimmedMode(false);
    returnToTargetLayer1();
    targetDialog.showModal();
  });

  // 關閉目標管理 Modal
  btnCloseTargetDialog.addEventListener('click', () => {
    targetDialog.close();
  });

  // 🌸 第 1 層 cancel 事件：交由瀏覽器原生 CloseWatcher 處理關閉即可
  targetDialog.addEventListener('cancel', () => {
    // 當在第 1 層按下返回鍵時，原生 dialog 會自動關閉，不需手動 PreventDefault
  });

  // 第一層卡片點擊事件（點擊任何卡片均滑入第二層編輯詳情）
  document.querySelectorAll('.preset-card-item').forEach(card => {
    card.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.dataset.index, 10);
      if (!isNaN(idx)) {
        openTargetLayer2(idx);
      }
    });
  });

  // 第二層：返回第一層按鈕
  btnBackToLayer1.addEventListener('click', () => {
    handleLayer2BackAction();
  });

  // 🌸 軟鍵盤 Enter / 下一步處理：強制失焦以確保輸入法數據完整寫入 DOM
  settingTitleSingle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      settingTitleSingle.blur();
    }
  });

  settingTargetSingle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      settingTargetSingle.blur();
    }
  });

  // 🌸 第二層輸入與變更監聽：即時比對資料並更新儲存按鈕狀態
  settingTitleSingle.addEventListener('input', updateLayer2SaveBtnState);
  settingTargetSingle.addEventListener('input', updateLayer2SaveBtnState);

  // 第二層：「設為當前持誦功課」主按鈕
  btnSetActivePreset.addEventListener('click', () => {
    if (pendingActiveIndex !== currentEditingIndex) {
      pendingActiveIndex = currentEditingIndex;
      updateLayer2SetActiveBtnUI();
      updateLayer2SaveBtnState();
    }
  });

  // 第二層：↺ 歸零此功課次數 (單項歸零)
  btnResetSinglePreset.addEventListener('click', () => {
    const targetTitle = appState.presets[currentEditingIndex].title || `組合${currentEditingIndex + 1}`;

    if (appState.confirmReset) {
      resetActionType = "card";
      pendingResetIndex = currentEditingIndex;
      resetModalTitle.textContent = `確認歸零「${targetTitle}」？`;
      resetModalMsg.textContent = "此操作將重置該功課的已完成次數，無法復原。";
      resetDialog.showModal();
    } else {
      appState.presets[currentEditingIndex].count = 0;
      settingCountSingle.textContent = 0;
      updateUI();
      StorageModule.saveData(appState);
    }
  });

  // 第二層：儲存單項修訂並返回第一層
  btnSaveSinglePreset.addEventListener('click', () => {
    // 🌸 強制失焦收起軟鍵盤，確保輸入法緩衝資料完整寫入 DOM
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }

    let tVal = settingTitleSingle.value.trim();
    if (!tVal) tVal = CONFIG.presets[currentEditingIndex].title;

    let numVal = parseInt(settingTargetSingle.value, 10);
    if (isNaN(numVal) || numVal < 0) numVal = 0;

    appState.presets[currentEditingIndex].title = tVal;
    appState.presets[currentEditingIndex].target = numVal;

    // 🌸 按下儲存時才正式將選擇套用為當前持誦功課
    appState.activePresetIndex = pendingActiveIndex;

    updateUI();
    StorageModule.saveData(appState);

    returnToTargetLayer1();
  });

  // 🌸 未儲存變更彈窗：確認放棄變更並返回 (分流處理：迴向文 vs 第 2 層)
  btnConfirmUnsaved.addEventListener('click', () => {
    if (dedicationDialog.open) {
      dedicationText.value = initialDedicationText;
      unsavedDialog.close();
      dedicationDialog.close();
    } else {
      resetLayer2Fields();
      unsavedDialog.close();
      returnToTargetLayer1();
    }
  });

  // 🌸 未儲存變更彈窗：取消並繼續編輯 (分流處理：迴向文 vs 第 2 層)
  btnCancelUnsaved.addEventListener('click', () => {
    if (dedicationDialog.open) {
      unsavedDialog.close();
      dedicationText.focus();
    } else {
      unsavedDialog.close();

      if ('CloseWatcher' in window) {
        if (layer2CloseWatcher) {
          layer2CloseWatcher.destroy();
        }
        layer2CloseWatcher = new CloseWatcher();
        layer2CloseWatcher.onclose = () => {
          handleLayer2BackAction();
        };
      }
    }
  });

  // 🌸 未儲存變更彈窗：當用家在 Warning Modal 上直接按手機返回鍵時 (分流處理：迴向文 vs 第 2 層)
  unsavedDialog.addEventListener('cancel', (e) => {
    if (dedicationDialog.open) {
      e.preventDefault();
      dedicationText.value = initialDedicationText;
      unsavedDialog.close();
      dedicationDialog.close();
    } else {
      resetLayer2Fields();
      returnToTargetLayer1();
    }
  });

  // --------------------------------------------------------------------------
  // 📊 歷史紀錄 Modal
  // --------------------------------------------------------------------------
  btnRecords.addEventListener('click', (e) => {
    e.stopPropagation();
    setDimmedMode(false);
    updateUI();
    recordsDialog.showModal();
  });

  btnCloseRecords.addEventListener('click', () => recordsDialog.close());

  // 重置歷史紀錄 (包含清空上次持誦與月度紀錄)
  btnResetHistory.addEventListener('click', () => {
    resetActionType = "history";
    resetModalTitle.textContent = "確認重置歷史紀錄？";
    resetModalMsg.textContent = "此操作將清空今日、上次持誦、月度累計與連續持誦天數，無法復原。";
    resetDialog.showModal();
  });

  // --------------------------------------------------------------------------
  // ⚙ 按下「設定」按鈕：專屬開啟設定 Modal
  // --------------------------------------------------------------------------
  
  // 🌸 動態更新系統設定儲存按鈕狀態
  function updateSettingsSaveBtnState() {
    let th = parseInt(settingStreakThreshold.value, 10);
    if (isNaN(th) || th < 1) th = 21;
    if (th > 99) th = 99;

    const hasChanged = (
      settingSound.checked !== initialSettingsSnap.sound ||
      settingSoundChime.checked !== initialSettingsSnap.chime ||
      settingVibrate.checked !== initialSettingsSnap.vibrate ||
      settingConfirmReset.checked !== initialSettingsSnap.confirmReset ||
      th !== initialSettingsSnap.streak
    );

    btnSaveSettings.disabled = !hasChanged;
  }

  btnSettings.addEventListener('click', (e) => {
    e.stopPropagation();
    setDimmedMode(false);

    // 🌸 儲存開啟時的初始狀態快照
    initialSettingsSnap = {
      sound: appState.soundEnabled,
      chime: appState.chimeEnabled,
      vibrate: appState.vibrateEnabled,
      confirmReset: appState.confirmReset,
      streak: appState.streakThreshold
    };

    settingSound.checked = appState.soundEnabled;
    settingSoundChime.checked = appState.chimeEnabled;
    settingVibrate.checked = appState.vibrateEnabled;
    settingConfirmReset.checked = appState.confirmReset;
    settingStreakThreshold.value = appState.streakThreshold;

    btnSaveSettings.disabled = true; // 預設無變更，設為停用（暗淡綠）
    settingsDialog.showModal();
  });

  // 🌸 監聽設定頁面所有選項與數值變更
  [settingSound, settingSoundChime, settingVibrate, settingConfirmReset].forEach(el => {
    el.addEventListener('change', updateSettingsSaveBtnState);
  });
  settingStreakThreshold.addEventListener('input', updateSettingsSaveBtnState);

  // 保存設定
  btnSaveSettings.addEventListener('click', () => {
    appState.soundEnabled = settingSound.checked;
    appState.chimeEnabled = settingSoundChime.checked;
    appState.vibrateEnabled = settingVibrate.checked;
    appState.confirmReset = settingConfirmReset.checked;

    let th = parseInt(settingStreakThreshold.value, 10);
    if (isNaN(th) || th < 1) th = 21;
    if (th > 99) th = 99;
    appState.streakThreshold = th;

    updateUI();
    StorageModule.saveData(appState);
    settingsDialog.close();
  });

  // 確認重置二次彈窗處理
  btnConfirmReset.addEventListener('click', () => {
    if (resetActionType === "card" && pendingResetIndex >= 0) {
      appState.presets[pendingResetIndex].count = 0;
      settingCountSingle.textContent = 0;
      renderTargetLayer1Data();
    } else if (resetActionType === "history") {
      appState.history.todayCount = 0;
      appState.history.monthCount = 0;
      appState.history.lastMonthCount = 0;
      appState.history.streakDays = 0;
      appState.history.lastValidDate = "";
      appState.history.lastValidCount = 0;

      // 🌸 補全：清空歷史紀錄時同步將全域已完成次數與所有持誦功課已完成次數歸零
      appState.count = 0;
      if (Array.isArray(appState.presets)) {
        appState.presets.forEach(p => p.count = 0);
      }
    }
    updateUI();
    StorageModule.saveData(appState);
    resetDialog.close();
  });

  btnCancelReset.addEventListener('click', () => {
    resetDialog.close();
  });

  // 🌟 目標圓滿彈窗的新按鈕處理（點擊開啟迴向文彈窗 - 隻讀模式）
  btnCompleteDone.addEventListener('click', () => {
    goalDialog.close();
    dedicationText.value = appState.dedicationText || '';

    // 設定為隻讀、隱藏/停用儲存按鈕並主動取消焦點（無光標、無鍵盤）
    dedicationText.readOnly = true;
    btnSaveDedication.disabled = true;

    dedicationDialog.showModal();
    dedicationText.blur(); // 確保無閃爍游標
  });

  btnBackToChant.addEventListener('click', () => {
    goalDialog.close();
  });

  updateUI();
});